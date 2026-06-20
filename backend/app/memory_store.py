"""In-memory document store with a minimal async MongoDB-like API."""

from __future__ import annotations

import uuid
from copy import deepcopy
from dataclasses import dataclass
from typing import Any


@dataclass
class InsertOneResult:
    inserted_id: str


@dataclass
class InsertManyResult:
    inserted_ids: list[str]


@dataclass
class DeleteResult:
    deleted_count: int


@dataclass
class UpdateResult:
    matched_count: int
    modified_count: int
    upserted_id: str | None = None


def _field_matches(value: Any, condition: Any) -> bool:
    if isinstance(condition, dict):
        if "$gte" in condition and not (value is not None and value >= condition["$gte"]):
            return False
        if "$lte" in condition and not (value is not None and value <= condition["$lte"]):
            return False
        if "$lt" in condition and not (value is not None and value < condition["$lt"]):
            return False
        return True
    return value == condition


def _matches(doc: dict, query: dict) -> bool:
    for key, expected in query.items():
        if key == "_id":
            if str(doc.get("_id")) != str(expected):
                return False
        elif not _field_matches(doc.get(key), expected):
            return False
    return True


def _apply_projection(doc: dict, projection: dict | None) -> dict:
    if not projection:
        return doc
    if projection.get("_id") == 0:
        return {k: v for k, v in doc.items() if k != "_id"}
    return doc


class MemoryCursor:
    def __init__(self, docs: list[dict], projection: dict | None = None):
        self._docs = docs
        self._projection = projection
        self._sort_key: str | None = None
        self._sort_dir = 1
        self._limit: int | None = None

    def sort(self, key: str, direction: int = 1) -> MemoryCursor:
        self._sort_key = key
        self._sort_dir = direction
        return self

    def limit(self, n: int) -> MemoryCursor:
        self._limit = n
        return self

    def _materialize(self) -> list[dict]:
        docs = list(self._docs)
        if self._sort_key:
            docs.sort(
                key=lambda d: d.get(self._sort_key) or "",
                reverse=self._sort_dir < 0,
            )
        if self._limit is not None:
            docs = docs[: self._limit]
        return [_apply_projection(deepcopy(d), self._projection) for d in docs]

    def __aiter__(self):
        self._iter_docs = iter(self._materialize())
        return self

    async def __anext__(self):
        try:
            return next(self._iter_docs)
        except StopIteration:
            raise StopAsyncIteration from None


class InMemoryCollection:
    def __init__(self):
        self._docs: list[dict] = []

    def find(self, query: dict, projection: dict | None = None) -> MemoryCursor:
        matched = [d for d in self._docs if _matches(d, query)]
        return MemoryCursor(matched, projection)

    async def find_one(self, query: dict, projection: dict | None = None) -> dict | None:
        for doc in self._docs:
            if _matches(doc, query):
                return _apply_projection(deepcopy(doc), projection)
        return None

    async def insert_one(self, doc: dict) -> InsertOneResult:
        stored = deepcopy(doc)
        stored["_id"] = str(uuid.uuid4())
        self._docs.append(stored)
        return InsertOneResult(stored["_id"])

    async def insert_many(self, docs: list[dict]) -> InsertManyResult:
        ids = []
        for doc in docs:
            result = await self.insert_one(doc)
            ids.append(result.inserted_id)
        return InsertManyResult(ids)

    async def update_one(
        self, query: dict, update: dict, upsert: bool = False
    ) -> UpdateResult:
        for doc in self._docs:
            if _matches(doc, query):
                if "$set" in update:
                    doc.update(deepcopy(update["$set"]))
                return UpdateResult(matched_count=1, modified_count=1)

        if upsert:
            new_doc = deepcopy(update.get("$set", {}))
            for key, val in query.items():
                if not isinstance(val, dict):
                    new_doc.setdefault(key, val)
            new_doc["_id"] = str(uuid.uuid4())
            self._docs.append(new_doc)
            return UpdateResult(
                matched_count=0, modified_count=0, upserted_id=new_doc["_id"]
            )

        return UpdateResult(matched_count=0, modified_count=0)

    async def delete_one(self, query: dict) -> DeleteResult:
        for i, doc in enumerate(self._docs):
            if _matches(doc, query):
                del self._docs[i]
                return DeleteResult(deleted_count=1)
        return DeleteResult(deleted_count=0)

    async def delete_many(self, query: dict) -> DeleteResult:
        before = len(self._docs)
        self._docs = [d for d in self._docs if not _matches(d, query)]
        return DeleteResult(deleted_count=before - len(self._docs))


class InMemoryDB:
    def __init__(self):
        self._collections: dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self._collections:
            self._collections[name] = InMemoryCollection()
        return self._collections[name]


db = InMemoryDB()

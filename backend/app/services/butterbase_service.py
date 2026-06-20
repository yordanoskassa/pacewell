"""Butterbase REST API client — https://docs.butterbase.ai/sdks-and-tools/rest-api/"""

from __future__ import annotations

import httpx

from ..config import settings


class ButterbaseService:
    """Thin async wrapper around Butterbase's auto-generated Data API."""

    def __init__(self) -> None:
        self.app_id = settings.butterbase_app_id
        self.api_url = settings.butterbase_api_url.rstrip("/")
        self.api_key = settings.butterbase_api_key

    @property
    def configured(self) -> bool:
        return bool(self.app_id and self.api_url)

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def insert_row(self, table: str, row: dict) -> dict:
        url = f"{self.api_url}/v1/{self.app_id}/{table}"
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(url, json=row, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                return data[0]
            return data if isinstance(data, dict) else {"data": data}

    async def list_rows(
        self,
        table: str,
        *,
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        url = f"{self.api_url}/v1/{self.app_id}/{table}"
        params: dict[str, str | int] = {}
        if filters:
            params.update(filters)
        if order:
            params["order"] = order
        if limit is not None:
            params["limit"] = limit

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, params=params, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data if isinstance(data, list) else []

    async def get_schema(self) -> dict:
        url = f"{self.api_url}/v1/{self.app_id}/schema"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=self._headers())
            resp.raise_for_status()
            return resp.json()

    async def health_check(self) -> dict:
        if not self.configured:
            return {
                "configured": False,
                "connected": False,
                "message": "Set BUTTERBASE_APP_ID and BUTTERBASE_API_URL",
            }

        try:
            schema = await self.get_schema()
            tables = [
                t.get("name")
                for t in schema.get("tables", [])
                if isinstance(t, dict)
            ]
            return {
                "configured": True,
                "connected": True,
                "app_id": self.app_id,
                "tables": tables,
            }
        except httpx.HTTPStatusError as exc:
            return {
                "configured": True,
                "connected": False,
                "status_code": exc.response.status_code,
                "message": exc.response.text[:200],
            }
        except Exception as exc:
            return {
                "configured": True,
                "connected": False,
                "message": str(exc),
            }


butterbase = ButterbaseService()

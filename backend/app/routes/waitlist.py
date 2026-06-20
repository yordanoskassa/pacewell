from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from ..database import waitlist_col
from ..models.waitlist import WaitlistSignup
from ..services.butterbase_service import butterbase

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("")
async def join_waitlist(signup: WaitlistSignup):
    """
    Persist an early-access waitlist signup to **Butterbase** (`waitlist_entries` table).

    Falls back to in-memory storage when Butterbase env vars are not set (local demo).
    """
    row = {
        "email": signup.email.lower(),
        "name": signup.name,
        "conditions": signup.conditions,
        "source": signup.source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if butterbase.configured:
        try:
            saved = await butterbase.insert_row("waitlist_entries", row)
            return {
                "status": "created",
                "storage": "butterbase",
                "id": saved.get("id"),
                "email": signup.email,
            }
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Butterbase write failed: {exc}",
            ) from exc

    result = await waitlist_col().insert_one(row)
    return {
        "status": "created",
        "storage": "memory",
        "id": str(result.inserted_id),
        "email": signup.email,
    }


@router.get("")
async def list_waitlist(limit: int = Query(50, le=200)):
    """List recent waitlist signups (Butterbase or in-memory fallback)."""
    if butterbase.configured:
        try:
            rows = await butterbase.list_rows(
                "waitlist_entries",
                order="created_at.desc",
                limit=limit,
            )
            return {"storage": "butterbase", "count": len(rows), "entries": rows}
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Butterbase read failed: {exc}",
            ) from exc

    cursor = waitlist_col().find({}).sort("created_at", -1).limit(limit)
    entries = []
    async for doc in cursor:
        entries.append(
            {
                "id": str(doc["_id"]),
                "email": doc.get("email"),
                "name": doc.get("name"),
                "conditions": doc.get("conditions", []),
                "source": doc.get("source"),
                "created_at": doc.get("created_at"),
            }
        )
    return {"storage": "memory", "count": len(entries), "entries": entries}

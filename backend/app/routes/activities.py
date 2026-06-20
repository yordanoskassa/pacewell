from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from ..database import activity_logs_col
from ..models.activity import ActivityLogCreate

router = APIRouter(prefix="/activities", tags=["activities"])


@router.post("")
async def create_activity(activity: ActivityLogCreate, user_id: str = Query(...)):
    """Log a new activity."""
    doc = {
        "user_id": user_id,
        "activity_type": activity.activity_type,
        "started_at": activity.started_at,
        "ended_at": activity.ended_at,
        "intensity": activity.intensity,
        "notes": activity.notes,
        "created_at": datetime.utcnow(),
    }
    result = await activity_logs_col().insert_one(doc)
    return {"id": str(result.inserted_id), "status": "created"}


@router.get("")
async def list_activities(
    user_id: str = Query(...),
    date: str = Query(None, description="Filter by date YYYY-MM-DD"),
):
    """List activities, optionally filtered by date."""
    query = {"user_id": user_id}
    if date:
        start = datetime.strptime(date, "%Y-%m-%d")
        end = datetime.strptime(date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query["started_at"] = {"$gte": start, "$lte": end}

    cursor = activity_logs_col().find(query).sort("started_at", -1)
    activities = []
    async for doc in cursor:
        activities.append({
            "id": str(doc["_id"]),
            "activity_type": doc["activity_type"],
            "started_at": doc["started_at"].isoformat() if isinstance(doc["started_at"], datetime) else str(doc["started_at"]),
            "ended_at": doc["ended_at"].isoformat() if isinstance(doc.get("ended_at"), datetime) else doc.get("ended_at"),
            "intensity": doc.get("intensity"),
            "notes": doc.get("notes"),
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"]),
        })
    return activities


@router.delete("/{activity_id}")
async def delete_activity(activity_id: str, user_id: str = Query(...)):
    """Delete an activity log."""
    result = await activity_logs_col().delete_one({
        "_id": activity_id,
        "user_id": user_id,
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"status": "deleted"}

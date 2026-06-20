from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from ..database import heart_rate_col, hr_events_col

router = APIRouter(prefix="/heart-rate", tags=["heart-rate"])


@router.get("/today")
async def get_today_hr(user_id: str = Query(...)):
    """Get today's heart rate data."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return await _get_hr_for_date(user_id, today)


@router.get("/date/{date}")
async def get_hr_by_date(date: str, user_id: str = Query(...)):
    """Get heart rate data for a specific date."""
    return await _get_hr_for_date(user_id, date)


@router.get("/events/today")
async def get_today_events(user_id: str = Query(...)):
    """Get today's HR events (spikes, sustained spikes)."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return await _get_events_for_date(user_id, today)


@router.get("/events/date/{date}")
async def get_events_by_date(date: str, user_id: str = Query(...)):
    """Get HR events for a specific date."""
    return await _get_events_for_date(user_id, date)


async def _get_hr_for_date(user_id: str, date: str) -> dict:
    doc = await heart_rate_col().find_one(
        {"user_id": user_id, "date": date},
        {"_id": 0},
    )
    if not doc:
        return {"date": date, "points": [], "synced_at": None}
    doc["synced_at"] = doc.get("synced_at", "").isoformat() if doc.get("synced_at") else None
    return doc


async def _get_events_for_date(user_id: str, date: str) -> list[dict]:
    cursor = hr_events_col().find(
        {"user_id": user_id, "date": date},
    )
    events = []
    async for doc in cursor:
        events.append({
            "id": str(doc["_id"]),
            "event_type": doc["event_type"],
            "start_time": doc["start_time"].isoformat() if isinstance(doc["start_time"], datetime) else doc["start_time"],
            "end_time": doc["end_time"].isoformat() if isinstance(doc.get("end_time"), datetime) else doc.get("end_time"),
            "peak_bpm": doc["peak_bpm"],
            "baseline_bpm": doc["baseline_bpm"],
            "duration_minutes": doc.get("duration_minutes"),
            "matched_activity": doc.get("matched_activity"),
            "matched_symptom": doc.get("matched_symptom"),
        })
    return events

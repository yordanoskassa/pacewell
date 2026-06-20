from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from ..services.fitbit_service import fetch_heart_rate, refresh_access_token
from ..services.hr_detection import calculate_baseline, detect_spikes, detect_sustained_spikes
from ..database import (
    heart_rate_col,
    hr_events_col,
    wearable_connections_col,
)

router = APIRouter(prefix="/fitbit", tags=["fitbit"])


@router.post("/sync/today")
async def sync_today(user_id: str = Query(...)):
    """Sync today's heart rate data from Fitbit."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return await _sync_date(user_id, today)


@router.post("/sync/date/{date}")
async def sync_date(date: str, user_id: str = Query(...)):
    """Sync heart rate data from Fitbit for a specific date."""
    return await _sync_date(user_id, date)


@router.post("/refresh-token")
async def refresh_token(user_id: str = Query(...)):
    """Manually refresh Fitbit access token."""
    try:
        await refresh_access_token(user_id)
        return {"status": "refreshed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def _sync_date(user_id: str, date: str) -> dict:
    conn = await wearable_connections_col().find_one({"user_id": user_id})
    if not conn:
        raise HTTPException(status_code=400, detail="Fitbit not connected")

    try:
        points = await fetch_heart_rate(user_id, date)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Fitbit API error: {str(e)}")

    # Store HR data
    await heart_rate_col().update_one(
        {"user_id": user_id, "date": date},
        {
            "$set": {
                "user_id": user_id,
                "date": date,
                "points": points,
                "synced_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    # Run detection
    baseline = calculate_baseline(points)
    spikes = detect_spikes(points, baseline) if baseline else []
    sustained = detect_sustained_spikes(points, baseline) if baseline else []

    # Store events
    events_to_store = []
    for s in sustained:
        events_to_store.append({
            "user_id": user_id,
            "date": date,
            "event_type": "sustained_spike",
            "start_time": datetime.fromisoformat(s["start_time"]),
            "end_time": datetime.fromisoformat(s["end_time"]),
            "peak_bpm": s["peak_bpm"],
            "baseline_bpm": s["baseline_bpm"],
            "duration_minutes": s["duration_minutes"],
            "created_at": datetime.utcnow(),
        })

    # Group individual spikes into events (cluster spikes within 2 min)
    if spikes:
        spike_clusters = _cluster_spikes(spikes)
        for cluster in spike_clusters:
            events_to_store.append({
                "user_id": user_id,
                "date": date,
                "event_type": "spike",
                "start_time": datetime.fromisoformat(cluster["start"]),
                "end_time": datetime.fromisoformat(cluster["end"]) if cluster.get("end") else None,
                "peak_bpm": cluster["peak_bpm"],
                "baseline_bpm": baseline,
                "created_at": datetime.utcnow(),
            })

    # Clear old events for this date and insert new ones
    await hr_events_col().delete_many({"user_id": user_id, "date": date})
    if events_to_store:
        await hr_events_col().insert_many(events_to_store)

    # Update last_sync
    await wearable_connections_col().update_one(
        {"user_id": user_id},
        {"$set": {"last_sync": datetime.utcnow()}},
    )

    return {
        "date": date,
        "points_count": len(points),
        "baseline_bpm": baseline,
        "spike_events": len([e for e in events_to_store if e["event_type"] == "spike"]),
        "sustained_events": len([e for e in events_to_store if e["event_type"] == "sustained_spike"]),
    }


def _cluster_spikes(spikes: list[dict], gap_minutes: float = 2.0) -> list[dict]:
    """Cluster individual spike points that are close together into events."""
    if not spikes:
        return []

    sorted_spikes = sorted(spikes, key=lambda s: s["timestamp"])
    clusters = []
    current = {
        "start": sorted_spikes[0]["timestamp"],
        "end": sorted_spikes[0]["timestamp"],
        "peak_bpm": sorted_spikes[0]["bpm"],
    }

    for i in range(1, len(sorted_spikes)):
        prev_time = datetime.fromisoformat(sorted_spikes[i - 1]["timestamp"])
        curr_time = datetime.fromisoformat(sorted_spikes[i]["timestamp"])
        gap = (curr_time - prev_time).total_seconds() / 60

        if gap <= gap_minutes:
            current["end"] = sorted_spikes[i]["timestamp"]
            current["peak_bpm"] = max(current["peak_bpm"], sorted_spikes[i]["bpm"])
        else:
            clusters.append(current)
            current = {
                "start": sorted_spikes[i]["timestamp"],
                "end": sorted_spikes[i]["timestamp"],
                "peak_bpm": sorted_spikes[i]["bpm"],
            }

    clusters.append(current)
    return clusters

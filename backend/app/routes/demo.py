"""Demo/seed endpoints for testing without a real Fitbit device."""

import random
import math
from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from ..database import (
    users_col,
    wearable_connections_col,
    heart_rate_col,
    hr_events_col,
    activity_logs_col,
    symptom_logs_col,
)
from ..services.hr_detection import calculate_baseline, detect_spikes, detect_sustained_spikes

router = APIRouter(prefix="/demo", tags=["demo"])


def _generate_realistic_hr(date: str) -> list[dict]:
    """Generate a full day of realistic heart rate data with natural patterns."""
    points = []
    base_dt = datetime.strptime(date, "%Y-%m-%d")
    resting_hr = random.randint(62, 72)

    for minute in range(0, 1440):  # Full 24 hours
        hour = minute / 60
        dt = base_dt + timedelta(minutes=minute)

        # Circadian rhythm: lower at night, higher during day
        if hour < 6:
            circadian = -8
        elif hour < 8:
            circadian = (hour - 6) * 5  # Waking up
        elif hour < 22:
            circadian = 10
        else:
            circadian = 10 - (hour - 22) * 5  # Winding down

        # Simulate activities
        bpm = resting_hr + circadian

        # Morning walk (7:30-8:00)
        if 7.5 <= hour < 8.0:
            bpm += 30 + random.randint(-5, 10)

        # Stair climbing spike (10:15-10:25)
        if 10.25 <= hour < 10.42:
            elapsed = (hour - 10.25) / 0.17
            bpm += int(45 * math.sin(elapsed * math.pi))

        # Lunch walk (12:30-13:00)
        if 12.5 <= hour < 13.0:
            bpm += 25 + random.randint(-3, 8)

        # Afternoon stress/anxiety episode (15:00-15:20)
        if 15.0 <= hour < 15.33:
            bpm += 20 + random.randint(0, 15)

        # Evening exercise (18:00-18:45)
        if 18.0 <= hour < 18.75:
            elapsed = (hour - 18.0) / 0.75
            # Ramp up, sustain, cool down
            if elapsed < 0.2:
                bpm += int(50 * elapsed / 0.2)
            elif elapsed < 0.8:
                bpm += 50 + random.randint(-5, 15)
            else:
                bpm += int(50 * (1 - elapsed) / 0.2)

        # Add noise
        bpm += random.randint(-3, 3)
        bpm = max(50, min(185, bpm))

        points.append({
            "timestamp": dt.isoformat(),
            "bpm": bpm,
        })

    return points


@router.post("/seed")
async def seed_demo_data(
    user_id: str = Query(default="demo_user"),
    date: str = Query(default=None, description="Date YYYY-MM-DD, defaults to today"),
):
    """Seed realistic demo data: user, HR data, activities, symptoms, and HR events."""
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")

    base_dt = datetime.strptime(date, "%Y-%m-%d")

    # 1. Create user
    await users_col().update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "display_name": "Demo User",
            "created_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    # 2. Mark as "connected" (fake wearable connection)
    await wearable_connections_col().update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "provider": "fitbit",
            "fitbit_user_id": "DEMO",
            "access_token_encrypted": "DEMO_TOKEN",
            "refresh_token_encrypted": "DEMO_TOKEN",
            "token_type": "Bearer",
            "expires_at": datetime.utcnow() + timedelta(days=365),
            "scope": "heartrate activity profile",
            "connected_at": datetime.utcnow(),
            "last_sync": datetime.utcnow(),
        }},
        upsert=True,
    )

    # 3. Generate and store HR data
    points = _generate_realistic_hr(date)
    await heart_rate_col().update_one(
        {"user_id": user_id, "date": date},
        {"$set": {
            "user_id": user_id,
            "date": date,
            "points": points,
            "synced_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    # 4. Run spike detection
    baseline = calculate_baseline(points)
    sustained = detect_sustained_spikes(points, baseline) if baseline else []
    spikes = detect_spikes(points, baseline) if baseline else []

    # Store events
    await hr_events_col().delete_many({"user_id": user_id, "date": date})
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

    # Cluster individual spikes
    if spikes:
        from ..routes.fitbit import _cluster_spikes
        clusters = _cluster_spikes(spikes)
        for c in clusters:
            events_to_store.append({
                "user_id": user_id,
                "date": date,
                "event_type": "spike",
                "start_time": datetime.fromisoformat(c["start"]),
                "end_time": datetime.fromisoformat(c["end"]) if c.get("end") else None,
                "peak_bpm": c["peak_bpm"],
                "baseline_bpm": baseline,
                "created_at": datetime.utcnow(),
            })

    if events_to_store:
        await hr_events_col().insert_many(events_to_store)

    # 5. Seed activities matching the HR patterns
    activities = [
        {
            "user_id": user_id,
            "activity_type": "walking",
            "started_at": base_dt.replace(hour=7, minute=30),
            "ended_at": base_dt.replace(hour=8, minute=0),
            "intensity": "moderate",
            "notes": "Morning walk around the neighborhood",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "climbing stairs",
            "started_at": base_dt.replace(hour=10, minute=15),
            "ended_at": base_dt.replace(hour=10, minute=25),
            "intensity": "vigorous",
            "notes": "Office stairs, 4 floors",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "walking",
            "started_at": base_dt.replace(hour=12, minute=30),
            "ended_at": base_dt.replace(hour=13, minute=0),
            "intensity": "light",
            "notes": "Lunch break walk",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "running",
            "started_at": base_dt.replace(hour=18, minute=0),
            "ended_at": base_dt.replace(hour=18, minute=45),
            "intensity": "vigorous",
            "notes": "Evening jog",
            "created_at": datetime.utcnow(),
        },
    ]

    await activity_logs_col().delete_many({"user_id": user_id, "started_at": {"$gte": base_dt, "$lt": base_dt + timedelta(days=1)}})
    await activity_logs_col().insert_many(activities)

    # 6. Seed symptoms
    symptoms = [
        {
            "user_id": user_id,
            "symptom_type": "shortness of breath",
            "severity": 4,
            "occurred_at": base_dt.replace(hour=10, minute=20),
            "duration_minutes": 5,
            "notes": "After climbing stairs",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "symptom_type": "palpitations",
            "severity": 6,
            "occurred_at": base_dt.replace(hour=15, minute=5),
            "duration_minutes": 15,
            "notes": "During stressful meeting",
            "created_at": datetime.utcnow(),
        },
    ]

    await symptom_logs_col().delete_many({"user_id": user_id, "occurred_at": {"$gte": base_dt, "$lt": base_dt + timedelta(days=1)}})
    await symptom_logs_col().insert_many(symptoms)

    return {
        "status": "seeded",
        "user_id": user_id,
        "date": date,
        "hr_points": len(points),
        "baseline_bpm": baseline,
        "hr_events": len(events_to_store),
        "activities": len(activities),
        "symptoms": len(symptoms),
        "message": f"Demo data ready. Open the app with ?user_id={user_id}",
    }

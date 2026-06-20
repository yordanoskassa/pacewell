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

        # Standing / shower orthostatic spike (8:30-8:45)
        if 8.5 <= hour < 8.75:
            elapsed = (hour - 8.5) / 0.25
            bpm += int(35 * math.sin(elapsed * math.pi))

        # Prolonged standing (11:00-11:20) — common POTS trigger
        if 11.0 <= hour < 11.33:
            bpm += 25 + random.randint(0, 12)

        # Lunch walk (12:30-13:00)
        if 12.5 <= hour < 13.0:
            bpm += 20 + random.randint(-3, 8)

        # Post-exertional spike after light activity (14:30-15:00)
        if 14.5 <= hour < 15.0:
            bpm += 30 + random.randint(0, 15)

        # Evening shower spike (19:00-19:15)
        if 19.0 <= hour < 19.25:
            elapsed = (hour - 19.0) / 0.25
            bpm += int(40 * math.sin(elapsed * math.pi))

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

    # 5. Seed POTS-relevant activities
    activities = [
        {
            "user_id": user_id,
            "activity_type": "standing",
            "started_at": base_dt.replace(hour=8, minute=30),
            "ended_at": base_dt.replace(hour=8, minute=45),
            "intensity": "light",
            "notes": "Morning routine — standing at sink",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "showering",
            "started_at": base_dt.replace(hour=8, minute=35),
            "ended_at": base_dt.replace(hour=8, minute=50),
            "intensity": "moderate",
            "notes": "Hot shower — common orthostatic trigger",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "standing",
            "started_at": base_dt.replace(hour=11, minute=0),
            "ended_at": base_dt.replace(hour=11, minute=20),
            "intensity": "light",
            "notes": "Prolonged standing while cooking",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "walking",
            "started_at": base_dt.replace(hour=12, minute=30),
            "ended_at": base_dt.replace(hour=13, minute=0),
            "intensity": "light",
            "notes": "Short lunch walk",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "climbing stairs",
            "started_at": base_dt.replace(hour=14, minute=30),
            "ended_at": base_dt.replace(hour=14, minute=40),
            "intensity": "moderate",
            "notes": "One flight of stairs",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "activity_type": "showering",
            "started_at": base_dt.replace(hour=19, minute=0),
            "ended_at": base_dt.replace(hour=19, minute=15),
            "intensity": "moderate",
            "notes": "Evening shower",
            "created_at": datetime.utcnow(),
        },
    ]

    await activity_logs_col().delete_many({"user_id": user_id, "started_at": {"$gte": base_dt, "$lt": base_dt + timedelta(days=1)}})
    await activity_logs_col().insert_many(activities)

    # 6. Seed POTS-relevant symptoms
    symptoms = [
        {
            "user_id": user_id,
            "symptom_type": "dizziness",
            "severity": 6,
            "occurred_at": base_dt.replace(hour=8, minute=42),
            "duration_minutes": 10,
            "notes": "After standing during morning routine",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "symptom_type": "brain fog",
            "severity": 5,
            "occurred_at": base_dt.replace(hour=11, minute=15),
            "duration_minutes": 30,
            "notes": "While standing to cook",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "symptom_type": "fatigue",
            "severity": 7,
            "occurred_at": base_dt.replace(hour=14, minute=50),
            "duration_minutes": 90,
            "notes": "Post-exertional malaise after stairs",
            "created_at": datetime.utcnow(),
        },
        {
            "user_id": user_id,
            "symptom_type": "palpitations",
            "severity": 5,
            "occurred_at": base_dt.replace(hour=19, minute=10),
            "duration_minutes": 15,
            "notes": "During evening shower",
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

"""Demo/seed endpoints — realistic POTS / dysautonomia simulation."""

from __future__ import annotations

import random
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


def _ease_rise(t: float) -> float:
    """Orthostatic rise — HR climbs quickly when upright."""
    t = max(0.0, min(1.0, t))
    return t**0.55


def _ease_fall(t: float) -> float:
    """Recovery — HR drops slowly after exertion or lying down."""
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 1.6


def _bpm_at(minute: float, keyframes: list[tuple[float, float]]) -> float:
    """Interpolate BPM between clinical keyframes with asymmetric rise/fall."""
    if minute <= keyframes[0][0]:
        return keyframes[0][1]
    if minute >= keyframes[-1][0]:
        return keyframes[-1][1]

    for i in range(len(keyframes) - 1):
        m0, b0 = keyframes[i]
        m1, b1 = keyframes[i + 1]
        if m0 <= minute <= m1:
            span = m1 - m0
            if span <= 0:
                return b1
            t = (minute - m0) / span
            eased = _ease_rise(t) if b1 > b0 else _ease_fall(t)
            return b0 + (b1 - b0) * eased

    return keyframes[-1][1]


def _generate_pots_patient_day(date: str) -> list[dict]:
    """
    Simulate one full day for a dysautonomia patient with classic orthostatic
    tachycardia episodes — not random noise, but a coherent clinical narrative.

    Key episodes modelled:
    - Morning orthostatic intolerance (standing from bed → 30+ bpm jump)
    - Hot shower vasodilation + standing tachycardia
    - Prolonged standing while cooking (sustained elevation)
    - Post-exertional HR elevation after stairs
    - Evening shower repeat trigger
    """
    base_dt = datetime.strptime(date, "%Y-%m-%d")
    rng = random.Random(date)  # reproducible per date

    keyframes: list[tuple[float, float]] = [
        # Overnight sleep — bradycardic, stable
        (0, 61),
        (120, 59),
        (300, 58),
        (360, 60),
        (390, 63),
        (405, 67),
        # Episode 1: Morning orthostatic tachycardia
        (408, 70),
        (412, 78),
        (415, 96),
        (418, 118),
        (422, 126),
        (426, 121),
        (430, 112),
        # Episode 2: Hot shower (heat + orthostasis)
        (432, 108),
        (435, 115),
        (438, 129),
        (442, 134),
        (446, 124),
        (450, 112),
        (455, 98),
        (465, 84),
        (480, 78),
        # Mid-morning seated — near baseline
        (540, 76),
        (600, 74),
        (630, 77),
        (655, 79),
        # Episode 3: Prolonged standing (cooking)
        (660, 82),
        (665, 91),
        (670, 102),
        (675, 109),
        (680, 114),
        (685, 118),
        (690, 116),
        (695, 112),
        (700, 107),
        (705, 98),
        (720, 86),
        # Post-lunch walk
        (750, 80),
        (755, 88),
        (760, 102),
        (765, 108),
        (770, 100),
        (780, 88),
        (840, 76),
        (865, 74),
        # Episode 4: Stair climb + post-exertional malaise
        (870, 78),
        (872, 94),
        (874, 118),
        (876, 138),
        (878, 142),
        (880, 128),
        (885, 112),
        (900, 104),
        (915, 98),
        (930, 94),
        (960, 88),
        (1020, 82),
        (1080, 79),
        # Episode 5: Evening shower
        (1140, 81),
        (1143, 92),
        (1146, 108),
        (1149, 122),
        (1152, 128),
        (1156, 119),
        (1160, 106),
        (1168, 92),
        (1200, 80),
        # Evening wind-down
        (1260, 76),
        (1320, 73),
        (1380, 70),
        (1410, 66),
        (1439, 62),
    ]

    points: list[dict] = []
    for minute in range(1440):
        dt = base_dt + timedelta(minutes=minute)
        bpm = _bpm_at(minute, keyframes)

        bpm += rng.randint(-2, 2)
        if rng.random() < 0.02:
            bpm += rng.choice([-4, 5])

        bpm = int(round(max(52, min(155, bpm))))
        points.append({"timestamp": dt.isoformat(), "bpm": bpm})

    return points


def _demo_activities(base_dt: datetime) -> list[dict]:
    """Activities timed to precede each tachycardia episode."""
    now = datetime.utcnow()
    return [
        {
            "user_id": "",
            "activity_type": "standing",
            "started_at": base_dt.replace(hour=6, minute=51),
            "ended_at": base_dt.replace(hour=7, minute=8),
            "intensity": "light",
            "notes": "Got out of bed — stood at bathroom sink (orthostatic trigger)",
            "created_at": now,
        },
        {
            "user_id": "",
            "activity_type": "showering",
            "started_at": base_dt.replace(hour=7, minute=11),
            "ended_at": base_dt.replace(hour=7, minute=28),
            "intensity": "moderate",
            "notes": "Hot shower — heat + standing; HR peaked at 134 bpm",
            "created_at": now,
        },
        {
            "user_id": "",
            "activity_type": "sitting",
            "started_at": base_dt.replace(hour=7, minute=30),
            "ended_at": base_dt.replace(hour=8, minute=0),
            "intensity": "light",
            "notes": "Sat down to recover after morning routine",
            "created_at": now,
        },
        {
            "user_id": "",
            "activity_type": "standing",
            "started_at": base_dt.replace(hour=11, minute=0),
            "ended_at": base_dt.replace(hour=11, minute=42),
            "intensity": "light",
            "notes": "Prolonged standing while cooking — sustained tachycardia ~110–118 bpm",
            "created_at": now,
        },
        {
            "user_id": "",
            "activity_type": "walking",
            "started_at": base_dt.replace(hour=12, minute=32),
            "ended_at": base_dt.replace(hour=12, minute=48),
            "intensity": "light",
            "notes": "Slow walk around block after lunch",
            "created_at": now,
        },
        {
            "user_id": "",
            "activity_type": "climbing stairs",
            "started_at": base_dt.replace(hour=14, minute=30),
            "ended_at": base_dt.replace(hour=14, minute=38),
            "intensity": "moderate",
            "notes": "One flight of stairs — HR spiked to 142 bpm, slow recovery",
            "created_at": now,
        },
        {
            "user_id": "",
            "activity_type": "showering",
            "started_at": base_dt.replace(hour=19, minute=0),
            "ended_at": base_dt.replace(hour=19, minute=18),
            "intensity": "moderate",
            "notes": "Evening shower — second orthostatic + heat episode",
            "created_at": now,
        },
    ]


def _demo_symptoms(base_dt: datetime) -> list[dict]:
    """Symptoms timed shortly after HR peaks — typical dysautonomia presentation."""
    now = datetime.utcnow()
    return [
        {
            "user_id": "",
            "symptom_type": "dizziness",
            "severity": 7,
            "occurred_at": base_dt.replace(hour=6, minute=55),
            "duration_minutes": 12,
            "notes": "Lightheaded within 2 min of standing — classic orthostatic intolerance",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "vision changes",
            "severity": 5,
            "occurred_at": base_dt.replace(hour=6, minute=58),
            "duration_minutes": 5,
            "notes": "Vision greying at edges while standing at sink",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "nausea",
            "severity": 6,
            "occurred_at": base_dt.replace(hour=7, minute=16),
            "duration_minutes": 8,
            "notes": "Nausea during hot shower — improved when sitting down",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "heart pounding",
            "severity": 7,
            "occurred_at": base_dt.replace(hour=7, minute=19),
            "duration_minutes": 10,
            "notes": "Palpitations during shower — Fitbit alert would have fired",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "brain fog",
            "severity": 6,
            "occurred_at": base_dt.replace(hour=11, minute=14),
            "duration_minutes": 35,
            "notes": "Brain fog while standing at stove — had to lean on counter",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "fatigue",
            "severity": 8,
            "occurred_at": base_dt.replace(hour=14, minute=45),
            "duration_minutes": 120,
            "notes": "Post-exertional malaise after stairs — HR stayed elevated 30+ min",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "chest tightness",
            "severity": 4,
            "occurred_at": base_dt.replace(hour=14, minute=48),
            "duration_minutes": 15,
            "notes": "Mild chest tightness during stair recovery — not cardiac pain",
            "created_at": now,
        },
        {
            "user_id": "",
            "symptom_type": "palpitations",
            "severity": 6,
            "occurred_at": base_dt.replace(hour=19, minute=9),
            "duration_minutes": 12,
            "notes": "Evening shower — heart racing again with heat exposure",
            "created_at": now,
        },
    ]


@router.post("/seed")
async def seed_demo_data(
    user_id: str = Query(default="demo_user"),
    date: str = Query(default=None, description="Date YYYY-MM-DD, defaults to today"),
):
    """Seed a realistic dysautonomia patient day: HR episodes, matched activities, symptoms."""
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")

    base_dt = datetime.strptime(date, "%Y-%m-%d")

    await users_col().update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "display_name": "Preview — POTS profile",
                "created_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    await wearable_connections_col().update_one(
        {"user_id": user_id},
        {
            "$set": {
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
            }
        },
        upsert=True,
    )

    points = _generate_pots_patient_day(date)
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

    baseline = calculate_baseline(points)
    sustained = detect_sustained_spikes(points, baseline) if baseline else []
    spikes = detect_spikes(points, baseline) if baseline else []

    await hr_events_col().delete_many({"user_id": user_id, "date": date})
    events_to_store: list[dict] = []

    for s in sustained:
        events_to_store.append(
            {
                "user_id": user_id,
                "date": date,
                "event_type": "sustained_spike",
                "start_time": datetime.fromisoformat(s["start_time"]),
                "end_time": datetime.fromisoformat(s["end_time"]),
                "peak_bpm": s["peak_bpm"],
                "baseline_bpm": s["baseline_bpm"],
                "duration_minutes": s["duration_minutes"],
                "created_at": datetime.utcnow(),
            }
        )

    if spikes:
        from ..routes.fitbit import _cluster_spikes

        clusters = _cluster_spikes(spikes)
        for c in clusters:
            events_to_store.append(
                {
                    "user_id": user_id,
                    "date": date,
                    "event_type": "spike",
                    "start_time": datetime.fromisoformat(c["start"]),
                    "end_time": datetime.fromisoformat(c["end"]) if c.get("end") else None,
                    "peak_bpm": c["peak_bpm"],
                    "baseline_bpm": baseline,
                    "created_at": datetime.utcnow(),
                }
            )

    if events_to_store:
        await hr_events_col().insert_many(events_to_store)

    activities = _demo_activities(base_dt)
    for a in activities:
        a["user_id"] = user_id

    await activity_logs_col().delete_many(
        {"user_id": user_id, "started_at": {"$gte": base_dt, "$lt": base_dt + timedelta(days=1)}}
    )
    await activity_logs_col().insert_many(activities)

    symptoms = _demo_symptoms(base_dt)
    for s in symptoms:
        s["user_id"] = user_id

    await symptom_logs_col().delete_many(
        {"user_id": user_id, "occurred_at": {"$gte": base_dt, "$lt": base_dt + timedelta(days=1)}}
    )
    await symptom_logs_col().insert_many(symptoms)

    peak_bpm = max(p["bpm"] for p in points)
    morning_peak = max(
        p["bpm"] for p in points if 400 <= _minute_of_day(p) <= 460
    )

    return {
        "status": "seeded",
        "user_id": user_id,
        "date": date,
        "hr_points": len(points),
        "baseline_bpm": baseline,
        "peak_bpm": peak_bpm,
        "morning_orthostatic_peak_bpm": morning_peak,
        "hr_events": len(events_to_store),
        "activities": len(activities),
        "symptoms": len(symptoms),
        "profile": "Simulated dysautonomia day — orthostatic, shower, standing, and PEM episodes",
        "message": f"Preview data ready. Open the app with ?user_id={user_id}",
    }


def _minute_of_day(point: dict) -> int:
    ts = datetime.fromisoformat(point["timestamp"])
    return ts.hour * 60 + ts.minute

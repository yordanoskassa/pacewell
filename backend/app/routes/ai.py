from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from ..database import (
    heart_rate_col,
    hr_events_col,
    activity_logs_col,
    symptom_logs_col,
    ai_insights_col,
)
from ..services.gemini_service import generate_insight
from ..services.matching import match_events_to_activities, match_events_to_symptoms

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/insight")
async def get_insight(
    user_id: str = Query(...),
    date: str = Query(None, description="Date YYYY-MM-DD, defaults to today"),
):
    """Generate AI insight for a day's health data."""
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")

    # Gather data
    hr_doc = await heart_rate_col().find_one({"user_id": user_id, "date": date})
    if not hr_doc or not hr_doc.get("points"):
        raise HTTPException(status_code=404, detail="No heart rate data for this date. Sync first.")

    hr_data = hr_doc["points"]

    # Get events
    events_cursor = hr_events_col().find({"user_id": user_id, "date": date})
    hr_events = []
    async for doc in events_cursor:
        hr_events.append({
            "event_type": doc["event_type"],
            "start_time": doc["start_time"].isoformat() if isinstance(doc["start_time"], datetime) else str(doc["start_time"]),
            "end_time": doc["end_time"].isoformat() if isinstance(doc.get("end_time"), datetime) else doc.get("end_time"),
            "peak_bpm": doc["peak_bpm"],
            "baseline_bpm": doc["baseline_bpm"],
            "duration_minutes": doc.get("duration_minutes"),
            "matched_activity": doc.get("matched_activity"),
            "matched_symptom": doc.get("matched_symptom"),
        })

    # Get activities for the date
    date_start = datetime.strptime(date, "%Y-%m-%d")
    date_end = date_start.replace(hour=23, minute=59, second=59)

    act_cursor = activity_logs_col().find({
        "user_id": user_id,
        "started_at": {"$gte": date_start, "$lte": date_end},
    })
    activities = []
    async for doc in act_cursor:
        activities.append({
            "activity_type": doc["activity_type"],
            "started_at": doc["started_at"].isoformat() if isinstance(doc["started_at"], datetime) else str(doc["started_at"]),
            "ended_at": doc["ended_at"].isoformat() if isinstance(doc.get("ended_at"), datetime) else doc.get("ended_at"),
            "intensity": doc.get("intensity"),
        })

    # Get symptoms for the date
    sym_cursor = symptom_logs_col().find({
        "user_id": user_id,
        "occurred_at": {"$gte": date_start, "$lte": date_end},
    })
    symptoms = []
    async for doc in sym_cursor:
        symptoms.append({
            "symptom_type": doc["symptom_type"],
            "severity": doc["severity"],
            "occurred_at": doc["occurred_at"].isoformat() if isinstance(doc["occurred_at"], datetime) else str(doc["occurred_at"]),
        })

    # Match events to activities/symptoms
    if hr_events:
        hr_events = match_events_to_activities(hr_events, activities)
        hr_events = match_events_to_symptoms(hr_events, symptoms)

        # Update matched events in DB
        for event in hr_events:
            if event.get("matched_activity") or event.get("matched_symptom"):
                update = {}
                if event.get("matched_activity"):
                    update["matched_activity"] = event["matched_activity"]
                if event.get("matched_symptom"):
                    update["matched_symptom"] = event["matched_symptom"]
                # We don't have the _id here easily, so skip DB update for matching
                # The matching is passed to Gemini anyway

    # Generate insight
    try:
        insight_data = await generate_insight(hr_data, hr_events, activities, symptoms, date)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation error: {str(e)}")

    # Store insight
    insight_doc = {
        "user_id": user_id,
        "date": date,
        "summary": insight_data.get("summary", ""),
        "comprehensive_summary": insight_data.get("comprehensive_summary", ""),
        "patterns": insight_data.get("patterns", []),
        "trigger_analysis": insight_data.get("trigger_analysis", []),
        "pacing_guidance": insight_data.get("pacing_guidance", []),
        "recommendations": insight_data.get("recommendations", []),
        "risk_flags": insight_data.get("risk_flags", []),
        "created_at": datetime.utcnow(),
    }

    await ai_insights_col().update_one(
        {"user_id": user_id, "date": date},
        {"$set": insight_doc},
        upsert=True,
    )

    return insight_doc


@router.get("/insights")
async def list_insights(user_id: str = Query(...)):
    """List all AI insights for a user."""
    cursor = ai_insights_col().find(
        {"user_id": user_id},
        {"_id": 0},
    ).sort("date", -1).limit(30)

    insights = []
    async for doc in cursor:
        doc["created_at"] = doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at")
        insights.append(doc)
    return insights

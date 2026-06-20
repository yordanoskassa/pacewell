from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from bson import ObjectId
from ..database import (
    heart_rate_col,
    hr_events_col,
    activity_logs_col,
    symptom_logs_col,
    ai_insights_col,
    reports_col,
)
from ..services.hr_detection import calculate_baseline

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate")
async def generate_report(
    user_id: str = Query(...),
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
):
    """Generate a clinician report for a date range."""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)

    # Gather HR data across date range
    hr_cursor = heart_rate_col().find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date},
    })
    all_points = []
    hr_by_date = {}
    async for doc in hr_cursor:
        hr_by_date[doc["date"]] = doc["points"]
        all_points.extend(doc["points"])

    # HR summary
    hr_summary = {}
    if all_points:
        bpms = [p["bpm"] for p in all_points]
        baseline = calculate_baseline(all_points)
        hr_summary = {
            "total_readings": len(all_points),
            "days_with_data": len(hr_by_date),
            "overall_min": min(bpms),
            "overall_max": max(bpms),
            "overall_avg": round(sum(bpms) / len(bpms), 1),
            "baseline_bpm": baseline,
        }

    # Events
    events_cursor = hr_events_col().find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date},
    })
    events_summary = []
    async for doc in events_cursor:
        events_summary.append({
            "date": doc["date"],
            "event_type": doc["event_type"],
            "peak_bpm": doc["peak_bpm"],
            "baseline_bpm": doc["baseline_bpm"],
            "duration_minutes": doc.get("duration_minutes"),
            "matched_activity": doc.get("matched_activity"),
            "matched_symptom": doc.get("matched_symptom"),
        })

    # Activities
    act_cursor = activity_logs_col().find({
        "user_id": user_id,
        "started_at": {"$gte": start, "$lte": end},
    })
    activities = []
    async for doc in act_cursor:
        activities.append({
            "activity_type": doc["activity_type"],
            "started_at": doc["started_at"].isoformat() if isinstance(doc["started_at"], datetime) else str(doc["started_at"]),
            "intensity": doc.get("intensity"),
        })

    # Symptoms
    sym_cursor = symptom_logs_col().find({
        "user_id": user_id,
        "occurred_at": {"$gte": start, "$lte": end},
    })
    symptoms = []
    async for doc in sym_cursor:
        symptoms.append({
            "symptom_type": doc["symptom_type"],
            "severity": doc["severity"],
            "occurred_at": doc["occurred_at"].isoformat() if isinstance(doc["occurred_at"], datetime) else str(doc["occurred_at"]),
        })

    # AI insights
    insight_cursor = ai_insights_col().find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date},
    }, {"_id": 0})
    ai_insights = []
    async for doc in insight_cursor:
        doc["created_at"] = doc["created_at"].isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at")
        ai_insights.append(doc)

    report_doc = {
        "user_id": user_id,
        "date_range_start": start_date,
        "date_range_end": end_date,
        "hr_summary": hr_summary,
        "events_summary": events_summary,
        "activities": activities,
        "symptoms": symptoms,
        "ai_insights": ai_insights,
        "generated_at": datetime.utcnow(),
    }

    result = await reports_col().insert_one(report_doc)
    report_doc["id"] = str(result.inserted_id)
    del report_doc["_id"]
    report_doc["generated_at"] = report_doc["generated_at"].isoformat()
    return report_doc


@router.get("")
async def list_reports(user_id: str = Query(...)):
    """List all reports for a user."""
    cursor = reports_col().find(
        {"user_id": user_id},
    ).sort("generated_at", -1)

    reports = []
    async for doc in cursor:
        reports.append({
            "id": str(doc["_id"]),
            "date_range_start": doc["date_range_start"],
            "date_range_end": doc["date_range_end"],
            "generated_at": doc["generated_at"].isoformat() if isinstance(doc["generated_at"], datetime) else str(doc["generated_at"]),
        })
    return reports


@router.get("/{report_id}")
async def get_report(report_id: str, user_id: str = Query(...)):
    """Get a specific report."""
    doc = await reports_col().find_one({
        "_id": ObjectId(report_id),
        "user_id": user_id,
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    doc["generated_at"] = doc["generated_at"].isoformat() if isinstance(doc["generated_at"], datetime) else str(doc["generated_at"])
    return doc

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from ..database import symptom_logs_col
from ..models.symptom import SymptomLogCreate

router = APIRouter(prefix="/symptoms", tags=["symptoms"])


@router.post("")
async def create_symptom(symptom: SymptomLogCreate, user_id: str = Query(...)):
    """Log a new symptom."""
    doc = {
        "user_id": user_id,
        "symptom_type": symptom.symptom_type,
        "severity": symptom.severity,
        "occurred_at": symptom.occurred_at,
        "duration_minutes": symptom.duration_minutes,
        "notes": symptom.notes,
        "created_at": datetime.utcnow(),
    }
    result = await symptom_logs_col().insert_one(doc)
    return {"id": str(result.inserted_id), "status": "created"}


@router.get("")
async def list_symptoms(
    user_id: str = Query(...),
    date: str = Query(None, description="Filter by date YYYY-MM-DD"),
):
    """List symptoms, optionally filtered by date."""
    query = {"user_id": user_id}
    if date:
        start = datetime.strptime(date, "%Y-%m-%d")
        end = datetime.strptime(date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query["occurred_at"] = {"$gte": start, "$lte": end}

    cursor = symptom_logs_col().find(query).sort("occurred_at", -1)
    symptoms = []
    async for doc in cursor:
        symptoms.append({
            "id": str(doc["_id"]),
            "symptom_type": doc["symptom_type"],
            "severity": doc["severity"],
            "occurred_at": doc["occurred_at"].isoformat() if isinstance(doc["occurred_at"], datetime) else str(doc["occurred_at"]),
            "duration_minutes": doc.get("duration_minutes"),
            "notes": doc.get("notes"),
            "created_at": doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else str(doc["created_at"]),
        })
    return symptoms


@router.delete("/{symptom_id}")
async def delete_symptom(symptom_id: str, user_id: str = Query(...)):
    """Delete a symptom log."""
    result = await symptom_logs_col().delete_one({
        "_id": symptom_id,
        "user_id": user_id,
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return {"status": "deleted"}

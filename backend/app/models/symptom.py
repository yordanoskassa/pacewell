from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SymptomLogCreate(BaseModel):
    symptom_type: str  # e.g. "dizziness", "chest pain", "shortness of breath"
    severity: int = Field(ge=1, le=10)  # 1-10 scale
    occurred_at: datetime
    duration_minutes: Optional[float] = None
    notes: Optional[str] = None


class SymptomLog(BaseModel):
    user_id: str
    symptom_type: str
    severity: int
    occurred_at: datetime
    duration_minutes: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SymptomLogOut(BaseModel):
    id: str
    symptom_type: str
    severity: int
    occurred_at: datetime
    duration_minutes: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

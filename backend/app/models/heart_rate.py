from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class HeartRatePoint(BaseModel):
    user_id: str
    timestamp: datetime
    bpm: int
    date: str  # YYYY-MM-DD


class HeartRateData(BaseModel):
    user_id: str
    date: str
    points: List[dict]  # [{timestamp, bpm}]
    synced_at: datetime = Field(default_factory=datetime.utcnow)


class HREvent(BaseModel):
    user_id: str
    date: str
    event_type: str  # "spike" or "sustained_spike"
    start_time: datetime
    end_time: Optional[datetime] = None
    peak_bpm: int
    baseline_bpm: int
    duration_minutes: Optional[float] = None
    matched_activity: Optional[str] = None
    matched_symptom: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HREventOut(BaseModel):
    id: str
    event_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    peak_bpm: int
    baseline_bpm: int
    duration_minutes: Optional[float] = None
    matched_activity: Optional[str] = None
    matched_symptom: Optional[str] = None

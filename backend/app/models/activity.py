from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ActivityLogCreate(BaseModel):
    activity_type: str  # e.g. "walking", "running", "climbing stairs"
    started_at: datetime
    ended_at: Optional[datetime] = None
    intensity: Optional[str] = None  # "light", "moderate", "vigorous"
    notes: Optional[str] = None


class ActivityLog(BaseModel):
    user_id: str
    activity_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    intensity: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityLogOut(BaseModel):
    id: str
    activity_type: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    intensity: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

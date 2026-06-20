from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class AIInsight(BaseModel):
    user_id: str
    date: str
    summary: str
    patterns: List[str] = []
    recommendations: List[str] = []
    risk_flags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AIInsightOut(BaseModel):
    id: str
    date: str
    summary: str
    patterns: List[str]
    recommendations: List[str]
    risk_flags: List[str]
    created_at: datetime


class ClinicianReport(BaseModel):
    user_id: str
    date_range_start: str
    date_range_end: str
    hr_summary: dict
    events_summary: List[dict]
    activities: List[dict]
    symptoms: List[dict]
    ai_insights: List[dict]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ClinicianReportOut(BaseModel):
    id: str
    date_range_start: str
    date_range_end: str
    hr_summary: dict
    events_summary: List[dict]
    activities: List[dict]
    symptoms: List[dict]
    ai_insights: List[dict]
    generated_at: datetime

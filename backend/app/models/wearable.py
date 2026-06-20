from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class WearableConnection(BaseModel):
    user_id: str
    provider: str = "fitbit"
    fitbit_user_id: Optional[str] = None
    access_token_encrypted: str
    refresh_token_encrypted: str
    token_type: str = "Bearer"
    expires_at: datetime
    scope: Optional[str] = None
    connected_at: datetime = Field(default_factory=datetime.utcnow)
    last_sync: Optional[datetime] = None


class WearableStatus(BaseModel):
    connected: bool
    provider: Optional[str] = None
    last_sync: Optional[datetime] = None

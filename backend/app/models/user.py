from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class User(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserOut(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    created_at: datetime
    fitbit_connected: bool = False

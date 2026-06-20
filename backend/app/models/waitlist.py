from pydantic import BaseModel, EmailStr, Field


class WaitlistSignup(BaseModel):
    email: EmailStr
    name: str | None = None
    conditions: list[str] = Field(default_factory=list)
    source: str = "landing"

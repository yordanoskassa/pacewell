from fastapi import Query, HTTPException
from .database import users_col


async def get_current_user_id(user_id: str = Query(..., description="User ID")) -> str:
    user = await users_col().find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_id

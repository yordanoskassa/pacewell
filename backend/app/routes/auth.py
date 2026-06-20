from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from ..services.fitbit_service import get_auth_url, exchange_code
from ..encryption import encrypt_token
from ..database import users_col, wearable_connections_col
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/fitbit/start")
async def fitbit_start(user_id: str = Query(...)):
    """Redirect user to Google OAuth2 authorization page for health data."""
    url = get_auth_url(state=user_id)
    return RedirectResponse(url=url)


@router.get("/fitbit/callback")
async def fitbit_callback(
    code: str = Query(...),
    state: str = Query(""),
):
    """Handle Google OAuth2 callback, store tokens."""
    user_id = state
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id in state")

    token_data = await exchange_code(code)

    # Ensure user exists
    existing = await users_col().find_one({"user_id": user_id})
    if not existing:
        await users_col().insert_one({
            "user_id": user_id,
            "display_name": user_id,
            "created_at": datetime.utcnow(),
        })

    expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))

    connection = {
        "user_id": user_id,
        "provider": "google_health",
        "access_token_encrypted": encrypt_token(token_data["access_token"]),
        "refresh_token_encrypted": encrypt_token(token_data.get("refresh_token", "")),
        "token_type": token_data.get("token_type", "Bearer"),
        "expires_at": expires_at,
        "scope": token_data.get("scope"),
        "connected_at": datetime.utcnow(),
    }

    await wearable_connections_col().update_one(
        {"user_id": user_id},
        {"$set": connection},
        upsert=True,
    )

    # Redirect to frontend
    return RedirectResponse(url=f"{settings.frontend_url}?user_id={user_id}&fitbit=connected")

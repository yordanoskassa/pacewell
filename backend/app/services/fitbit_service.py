import httpx
from datetime import datetime, timedelta
from ..config import settings
from ..encryption import encrypt_token, decrypt_token
from ..database import wearable_connections_col

FITBIT_AUTH_URL = "https://www.fitbit.com/oauth2/authorize"
FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token"
FITBIT_API_BASE = "https://api.fitbit.com"


def get_auth_url() -> str:
    params = {
        "response_type": "code",
        "client_id": settings.fitbit_client_id,
        "redirect_uri": settings.fitbit_redirect_uri,
        "scope": "heartrate activity profile",
        "expires_in": "604800",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{FITBIT_AUTH_URL}?{query}"


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            FITBIT_TOKEN_URL,
            data={
                "client_id": settings.fitbit_client_id,
                "grant_type": "authorization_code",
                "redirect_uri": settings.fitbit_redirect_uri,
                "code": code,
            },
            auth=(settings.fitbit_client_id, settings.fitbit_client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(user_id: str) -> str:
    conn = await wearable_connections_col().find_one({"user_id": user_id})
    if not conn:
        raise ValueError("No wearable connection found")

    refresh_token = decrypt_token(conn["refresh_token_encrypted"])

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            FITBIT_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": settings.fitbit_client_id,
            },
            auth=(settings.fitbit_client_id, settings.fitbit_client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        token_data = resp.json()

    expires_at = datetime.utcnow() + timedelta(seconds=token_data["expires_in"])
    await wearable_connections_col().update_one(
        {"user_id": user_id},
        {
            "$set": {
                "access_token_encrypted": encrypt_token(token_data["access_token"]),
                "refresh_token_encrypted": encrypt_token(token_data["refresh_token"]),
                "expires_at": expires_at,
            }
        },
    )
    return token_data["access_token"]


async def get_valid_token(user_id: str) -> str:
    conn = await wearable_connections_col().find_one({"user_id": user_id})
    if not conn:
        raise ValueError("No wearable connection found")

    if datetime.utcnow() >= conn["expires_at"]:
        return await refresh_access_token(user_id)

    return decrypt_token(conn["access_token_encrypted"])


async def fetch_heart_rate(user_id: str, date: str) -> list[dict]:
    """Fetch intraday heart rate data from Fitbit for a given date (YYYY-MM-DD)."""
    token = await get_valid_token(user_id)
    url = f"{FITBIT_API_BASE}/1/user/-/activities/heart/date/{date}/1d/1min.json"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
        )

        if resp.status_code == 401:
            token = await refresh_access_token(user_id)
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
            )

        resp.raise_for_status()
        data = resp.json()

    dataset = (
        data.get("activities-heart-intraday", {}).get("dataset", [])
    )

    points = []
    for entry in dataset:
        time_str = entry["time"]
        dt = datetime.strptime(f"{date} {time_str}", "%Y-%m-%d %H:%M:%S")
        points.append({"timestamp": dt.isoformat(), "bpm": entry["value"]})

    return points

import httpx
from datetime import datetime, timedelta
from urllib.parse import urlencode
from ..config import settings
from ..encryption import encrypt_token, decrypt_token
from ..database import wearable_connections_col

# Google OAuth endpoints (Fitbit migrated to Google)
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Google Health API (replaces legacy api.fitbit.com)
HEALTH_API_BASE = "https://health.googleapis.com"

# Single unified scope for fitness/health data
GOOGLE_HEALTH_SCOPE = "https://www.googleapis.com/auth/googlehealth.activity_and_fitness"


def get_auth_url(state: str = "") -> str:
    """Build Google OAuth2 authorization URL for health data access."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_HEALTH_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    """Exchange authorization code for access/refresh tokens via Google OAuth."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(user_id: str) -> str:
    """Refresh the Google OAuth access token."""
    conn = await wearable_connections_col().find_one({"user_id": user_id})
    if not conn:
        raise ValueError("No wearable connection found")

    refresh_token = decrypt_token(conn["refresh_token_encrypted"])

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        token_data = resp.json()

    expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))

    update_fields = {
        "access_token_encrypted": encrypt_token(token_data["access_token"]),
        "expires_at": expires_at,
    }
    # Google may or may not return a new refresh token
    if "refresh_token" in token_data:
        update_fields["refresh_token_encrypted"] = encrypt_token(token_data["refresh_token"])

    await wearable_connections_col().update_one(
        {"user_id": user_id},
        {"$set": update_fields},
    )
    return token_data["access_token"]


async def get_valid_token(user_id: str) -> str:
    """Get a valid access token, refreshing if expired."""
    conn = await wearable_connections_col().find_one({"user_id": user_id})
    if not conn:
        raise ValueError("No wearable connection found")

    if datetime.utcnow() >= conn["expires_at"]:
        return await refresh_access_token(user_id)

    return decrypt_token(conn["access_token_encrypted"])


async def fetch_heart_rate(user_id: str, date: str) -> list[dict]:
    """Fetch heart rate data from Google Health API for a given date (YYYY-MM-DD)."""
    token = await get_valid_token(user_id)

    # Query heart rate data points for the date
    start_dt = datetime.strptime(date, "%Y-%m-%d")
    end_dt = start_dt + timedelta(days=1)

    # RFC3339 timestamps
    start_time = start_dt.strftime("%Y-%m-%dT00:00:00Z")
    end_time = end_dt.strftime("%Y-%m-%dT00:00:00Z")

    url = f"{HEALTH_API_BASE}/v4/users/me/dataTypes/heart_rate/dataPoints"
    params = {
        "filter.startTime": start_time,
        "filter.endTime": end_time,
        "pageSize": 2000,
    }

    all_points = []

    async with httpx.AsyncClient() as client:
        while True:
            resp = await client.get(
                url,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )

            if resp.status_code == 401:
                token = await refresh_access_token(user_id)
                resp = await client.get(
                    url,
                    params=params,
                    headers={"Authorization": f"Bearer {token}"},
                )

            resp.raise_for_status()
            data = resp.json()

            for dp in data.get("dataPoints", []):
                ts = dp.get("startTime") or dp.get("time")
                bpm = None
                # Extract BPM from typed values
                for val in dp.get("typedValues", []):
                    if "intVal" in val:
                        bpm = val["intVal"]
                    elif "fpVal" in val:
                        bpm = int(val["fpVal"])
                if ts and bpm:
                    all_points.append({
                        "timestamp": ts,
                        "bpm": bpm,
                    })

            # Handle pagination
            next_token = data.get("nextPageToken")
            if next_token:
                params["pageToken"] = next_token
            else:
                break

    # Sort by timestamp
    all_points.sort(key=lambda p: p["timestamp"])
    return all_points

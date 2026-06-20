from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.db_name]


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db


def users_col():
    return db["users"]


def wearable_connections_col():
    return db["wearable_connections"]


def heart_rate_col():
    return db["heart_rate_data"]


def hr_events_col():
    return db["hr_events"]


def activity_logs_col():
    return db["activity_logs"]


def symptom_logs_col():
    return db["symptom_logs"]


def ai_insights_col():
    return db["ai_insights"]


def reports_col():
    return db["reports"]

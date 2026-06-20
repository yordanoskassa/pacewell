from .memory_store import db


async def connect_db():
    """No-op — data lives in process memory."""
    pass


async def close_db():
    """No-op."""
    pass


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


def waitlist_col():
    return db["waitlist_entries"]

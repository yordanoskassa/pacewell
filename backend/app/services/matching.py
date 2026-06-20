from datetime import datetime, timedelta


def match_events_to_activities(
    hr_events: list[dict],
    activities: list[dict],
    window_minutes: int = 10,
) -> list[dict]:
    """Match HR events to logged activities within a time window."""
    matched = []

    for event in hr_events:
        event_time = datetime.fromisoformat(event["start_time"])
        best_match = None
        best_distance = float("inf")

        for act in activities:
            act_start = (
                act["started_at"]
                if isinstance(act["started_at"], datetime)
                else datetime.fromisoformat(act["started_at"])
            )
            act_end = None
            if act.get("ended_at"):
                act_end = (
                    act["ended_at"]
                    if isinstance(act["ended_at"], datetime)
                    else datetime.fromisoformat(act["ended_at"])
                )

            # Check if event falls within activity window (with buffer)
            window = timedelta(minutes=window_minutes)
            if act_end:
                if act_start - window <= event_time <= act_end + window:
                    distance = abs((event_time - act_start).total_seconds())
                    if distance < best_distance:
                        best_distance = distance
                        best_match = act
            else:
                distance = abs((event_time - act_start).total_seconds())
                if distance <= window.total_seconds() and distance < best_distance:
                    best_distance = distance
                    best_match = act

        event_copy = dict(event)
        if best_match:
            event_copy["matched_activity"] = best_match.get("activity_type", "")
        matched.append(event_copy)

    return matched


def match_events_to_symptoms(
    hr_events: list[dict],
    symptoms: list[dict],
    window_minutes: int = 15,
) -> list[dict]:
    """Match HR events to logged symptoms within a time window."""
    matched = []

    for event in hr_events:
        event_time = datetime.fromisoformat(event["start_time"])
        best_match = None
        best_distance = float("inf")

        for sym in symptoms:
            sym_time = (
                sym["occurred_at"]
                if isinstance(sym["occurred_at"], datetime)
                else datetime.fromisoformat(sym["occurred_at"])
            )

            distance = abs((event_time - sym_time).total_seconds())
            window = timedelta(minutes=window_minutes)
            if distance <= window.total_seconds() and distance < best_distance:
                best_distance = distance
                best_match = sym

        event_copy = dict(event)
        if best_match:
            event_copy["matched_symptom"] = best_match.get("symptom_type", "")
        matched.append(event_copy)

    return matched

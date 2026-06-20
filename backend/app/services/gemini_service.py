import google.generativeai as genai
from ..config import settings


def configure_gemini():
    genai.configure(api_key=settings.gemini_api_key)


async def generate_insight(
    hr_data: list[dict],
    hr_events: list[dict],
    activities: list[dict],
    symptoms: list[dict],
    date: str,
) -> dict:
    """Generate AI insight from health data using Gemini."""
    configure_gemini()
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""You are a health data analyst for a cardiac health monitoring app called PaceWell.
Analyze the following health data for {date} and provide insights.

Heart Rate Summary:
- Total data points: {len(hr_data)}
- BPM values: {_summarize_hr(hr_data)}

Heart Rate Events (spikes/sustained elevations):
{_format_events(hr_events)}

Logged Activities:
{_format_activities(activities)}

Logged Symptoms:
{_format_symptoms(symptoms)}

Provide your analysis in the following JSON format:
{{
    "summary": "A 2-3 sentence overview of the day's heart rate patterns",
    "patterns": ["pattern1", "pattern2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "risk_flags": ["any concerning patterns that should be discussed with a doctor"]
}}

Be specific and reference actual data points. If there are no concerning patterns, leave risk_flags empty.
Return ONLY valid JSON, no markdown formatting."""

    response = model.generate_content(prompt)
    text = response.text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # Remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    import json
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "summary": text,
            "patterns": [],
            "recommendations": [],
            "risk_flags": [],
        }


def _summarize_hr(hr_data: list[dict]) -> str:
    if not hr_data:
        return "No data available"
    bpms = [p["bpm"] for p in hr_data]
    return f"min={min(bpms)}, max={max(bpms)}, avg={sum(bpms)//len(bpms)}"


def _format_events(events: list[dict]) -> str:
    if not events:
        return "No HR events detected"
    lines = []
    for e in events:
        line = f"- {e.get('event_type', 'spike')}: peak {e.get('peak_bpm', 'N/A')} bpm"
        if e.get("start_time"):
            line += f" at {e['start_time']}"
        if e.get("duration_minutes"):
            line += f" for {e['duration_minutes']} min"
        if e.get("matched_activity"):
            line += f" (during {e['matched_activity']})"
        if e.get("matched_symptom"):
            line += f" (with symptom: {e['matched_symptom']})"
        lines.append(line)
    return "\n".join(lines)


def _format_activities(activities: list[dict]) -> str:
    if not activities:
        return "No activities logged"
    lines = []
    for a in activities:
        line = f"- {a.get('activity_type', 'unknown')}"
        if a.get("intensity"):
            line += f" ({a['intensity']})"
        if a.get("started_at"):
            line += f" at {a['started_at']}"
        lines.append(line)
    return "\n".join(lines)


def _format_symptoms(symptoms: list[dict]) -> str:
    if not symptoms:
        return "No symptoms logged"
    lines = []
    for s in symptoms:
        line = f"- {s.get('symptom_type', 'unknown')} (severity: {s.get('severity', 'N/A')}/10)"
        if s.get("occurred_at"):
            line += f" at {s['occurred_at']}"
        lines.append(line)
    return "\n".join(lines)

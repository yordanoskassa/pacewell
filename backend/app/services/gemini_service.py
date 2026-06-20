import json
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
    """Generate a comprehensive POTS/dysautonomia-focused AI analysis using Gemini."""
    if not settings.gemini_api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set on the server. Add it in Render/Easypanel env vars."
        )

    configure_gemini()
    model = genai.GenerativeModel(settings.gemini_model)

    prompt = f"""You are a compassionate health data analyst for PaceWell, an app for people living with tachycardia-related conditions like POTS, dysautonomia, Long COVID, ME/CFS, and related illnesses.

Your role is to help users understand connections between heart rate spikes, daily activities, and symptoms like dizziness, fatigue, brain fog, and post-exertional malaise — so they can pace themselves safely and identify triggers.

Analyze the following data for {date}:

Heart Rate Summary:
- Total data points: {len(hr_data)}
- BPM values: {_summarize_hr(hr_data)}

Heart Rate Events (tachycardia spikes / sustained elevations):
{_format_events(hr_events)}

Logged Activities (standing, showering, walking, etc.):
{_format_activities(activities)}

Logged Symptoms (dizziness, fatigue, brain fog, PEM, etc.):
{_format_symptoms(symptoms)}

Provide a comprehensive, empathetic analysis in this JSON format:
{{
    "summary": "2-3 sentence overview of today's heart rate and symptom patterns",
    "comprehensive_summary": "A detailed 4-6 sentence paragraph connecting heart rate trends, likely triggers, symptom timing, and what this means for pacing today. Reference specific times and activities when possible.",
    "patterns": ["specific pattern 1 with data reference", "pattern 2"],
    "trigger_analysis": ["likely trigger 1 and why", "likely trigger 2"],
    "pacing_guidance": ["actionable pacing tip 1", "actionable pacing tip 2"],
    "recommendations": ["recommendation 1", "recommendation 2"],
    "risk_flags": ["only include if something warrants clinician discussion — otherwise leave empty"]
}}

Focus on:
- Which activities preceded HR spikes or symptom flares
- Whether spikes suggest orthostatic stress, exertion intolerance, or post-exertional patterns
- Practical pacing advice (rest before escalation, activity modification)
- Energy management for dysautonomia/POTS

Be specific, reference actual data, and use supportive non-alarmist language.
This is NOT a medical diagnosis — frame insights as patterns to discuss with their care team.
Return ONLY valid JSON, no markdown."""

    response = model.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    try:
        data = json.loads(text)
        for key in (
            "summary",
            "comprehensive_summary",
            "patterns",
            "trigger_analysis",
            "pacing_guidance",
            "recommendations",
            "risk_flags",
        ):
            data.setdefault(key, "" if key in ("summary", "comprehensive_summary") else [])
        return data
    except json.JSONDecodeError:
        return {
            "summary": text[:300],
            "comprehensive_summary": text,
            "patterns": [],
            "trigger_analysis": [],
            "pacing_guidance": [],
            "recommendations": [],
            "risk_flags": [],
        }


def _summarize_hr(hr_data: list[dict]) -> str:
    if not hr_data:
        return "No data available"
    bpms = [p["bpm"] for p in hr_data]
    return f"min={min(bpms)}, max={max(bpms)}, avg={sum(bpms) // len(bpms)}"


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

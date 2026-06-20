import statistics
from datetime import datetime, timedelta
from typing import Optional


def calculate_baseline(points: list[dict]) -> Optional[int]:
    """Calculate median BPM as baseline from HR data points."""
    if not points:
        return None
    bpms = [p["bpm"] for p in points]
    return int(statistics.median(bpms))


def detect_spikes(points: list[dict], baseline: int, threshold_pct: float = 0.20) -> list[dict]:
    """Detect individual HR spikes above baseline + threshold percentage."""
    if not points or baseline is None:
        return []

    spike_threshold = baseline * (1 + threshold_pct)
    spikes = []

    for p in points:
        if p["bpm"] >= spike_threshold:
            spikes.append({
                "timestamp": p["timestamp"],
                "bpm": p["bpm"],
                "baseline_bpm": baseline,
                "elevation_pct": round((p["bpm"] - baseline) / baseline * 100, 1),
            })

    return spikes


def detect_sustained_spikes(
    points: list[dict],
    baseline: int,
    threshold_pct: float = 0.20,
    min_duration_minutes: float = 5.0,
) -> list[dict]:
    """Detect sustained periods where HR stays elevated above threshold."""
    if not points or baseline is None:
        return []

    spike_threshold = baseline * (1 + threshold_pct)
    sustained = []
    current_start = None
    current_peak = 0
    elevated_points = []

    for p in points:
        ts = datetime.fromisoformat(p["timestamp"])

        if p["bpm"] >= spike_threshold:
            if current_start is None:
                current_start = ts
                current_peak = p["bpm"]
                elevated_points = [p]
            else:
                current_peak = max(current_peak, p["bpm"])
                elevated_points.append(p)
        else:
            if current_start is not None:
                duration = (ts - current_start).total_seconds() / 60
                if duration >= min_duration_minutes:
                    sustained.append({
                        "start_time": current_start.isoformat(),
                        "end_time": ts.isoformat(),
                        "peak_bpm": current_peak,
                        "baseline_bpm": baseline,
                        "duration_minutes": round(duration, 1),
                        "avg_bpm": round(
                            sum(ep["bpm"] for ep in elevated_points) / len(elevated_points)
                        ),
                    })
                current_start = None
                current_peak = 0
                elevated_points = []

    # Handle case where spike extends to end of data
    if current_start is not None and elevated_points:
        last_ts = datetime.fromisoformat(elevated_points[-1]["timestamp"])
        duration = (last_ts - current_start).total_seconds() / 60
        if duration >= min_duration_minutes:
            sustained.append({
                "start_time": current_start.isoformat(),
                "end_time": last_ts.isoformat(),
                "peak_bpm": current_peak,
                "baseline_bpm": baseline,
                "duration_minutes": round(duration, 1),
                "avg_bpm": round(
                    sum(ep["bpm"] for ep in elevated_points) / len(elevated_points)
                ),
            })

    return sustained

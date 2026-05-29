from datetime import datetime
from typing import Optional


def days_to_event_score(event_date: datetime) -> float:
    """Trapezoid curve: ramps to 1.0 at 14 days, holds through 45, decays to 0 at 90."""
    days = (event_date - datetime.utcnow()).days
    if days <= 0:
        return 0.0
    elif days <= 14:
        return days / 14.0
    elif days <= 45:
        return 1.0
    elif days <= 90:
        return (90 - days) / 45.0
    return 0.0


def percentile_rank(value: float, all_values: list[float]) -> float:
    if not all_values:
        return 0.5
    rank = sum(1 for v in all_values if v <= value)
    return rank / len(all_values)


def compute_signals(events_data: list[dict]) -> list[dict]:
    """Normalize all signals to 0–1 via percentile rank, then attach to each event."""
    performer_scores = [e["performer_score"] for e in events_data if e.get("performer_score") is not None]
    event_scores = [e["event_score"] for e in events_data if e.get("event_score") is not None]

    results = []
    for e in events_data:
        artist_heat = (
            percentile_rank(e["performer_score"], performer_scores)
            if e.get("performer_score") is not None else None
        )
        event_buzz = (
            percentile_rank(e["event_score"], event_scores)
            if e.get("event_score") is not None else None
        )
        timing_score = (
            days_to_event_score(e["event_date"])
            if e.get("event_date") is not None else None
        )

        results.append({
            **e,
            "signals": {
                "artist_heat": artist_heat,
                "event_buzz": event_buzz,
                "timing_score": timing_score,
            },
        })
    return results

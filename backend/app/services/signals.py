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


def compute_depletion_rate(snapshots: list) -> Optional[float]:
    """Returns fraction of listings lost since earliest snapshot. None if < 6 snapshots."""
    valid = [s for s in snapshots if s.listing_count is not None]
    if len(valid) < 6:
        return None
    first_count = valid[0].listing_count
    last_count = valid[-1].listing_count
    if first_count == 0:
        return 0.0
    return max(0.0, (first_count - last_count) / first_count)


def compute_signals(events_data: list[dict]) -> list[dict]:
    """Normalize all signals to 0–1 via percentile rank, then attach to each event."""
    popularities = [e["artist_popularity"] for e in events_data if e.get("artist_popularity") is not None]
    listing_counts = [e["listing_count"] for e in events_data if e.get("listing_count") is not None]
    depletion_rates = [e["depletion_rate"] for e in events_data if e.get("depletion_rate") is not None]

    results = []
    for e in events_data:
        artist_heat = (
            percentile_rank(e["artist_popularity"], popularities)
            if e.get("artist_popularity") is not None else None
        )
        # Invert: fewer listings = higher supply pressure score
        supply_pressure = (
            1.0 - percentile_rank(e["listing_count"], listing_counts)
            if e.get("listing_count") is not None else None
        )
        depletion = (
            percentile_rank(e["depletion_rate"], depletion_rates)
            if e.get("depletion_rate") is not None else None
        )
        days_score = (
            days_to_event_score(e["event_date"])
            if e.get("event_date") is not None else None
        )

        results.append({
            **e,
            "signals": {
                "artist_heat": artist_heat,
                "supply_pressure": supply_pressure,
                "depletion_rate": depletion,
                "days_to_event": days_score,
            },
        })
    return results

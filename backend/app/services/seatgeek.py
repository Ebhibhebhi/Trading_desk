import os
import httpx
from datetime import datetime, timedelta

SEATGEEK_CLIENT_ID = os.getenv("SEATGEEK_CLIENT_ID", "")
BASE_URL = "https://api.seatgeek.com/2"


async def fetch_events(city: str = "los angeles", days_ahead: int = 90, per_page: int = 50) -> list[dict]:
    date_from = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
    date_to = (datetime.utcnow() + timedelta(days=days_ahead)).strftime("%Y-%m-%dT%H:%M:%S")

    params: dict = {
        "venue.city": city,
        "type": "concert",
        "datetime_local.gte": date_from,
        "datetime_local.lte": date_to,
        "per_page": per_page,
        "sort": "score.desc",
    }
    if SEATGEEK_CLIENT_ID:
        params["client_id"] = SEATGEEK_CLIENT_ID

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{BASE_URL}/events", params=params)
        resp.raise_for_status()
        data = resp.json()

    return data.get("events", [])


def parse_event(raw: dict) -> dict:
    performers = raw.get("performers", [])
    main = next((p for p in performers if p.get("primary")), performers[0] if performers else {})
    venue = raw.get("venue", {})
    stats = raw.get("stats", {})

    event_date_str = raw.get("datetime_local")
    try:
        event_date = datetime.fromisoformat(event_date_str) if event_date_str else None
    except (ValueError, TypeError):
        event_date = None

    return {
        "seatgeek_id": str(raw["id"]),
        "title": raw.get("title", ""),
        "artist_name": main.get("name", "Unknown"),
        "artist_seatgeek_id": str(main.get("id", "")) if main else None,
        "venue_name": venue.get("name", ""),
        "venue_city": venue.get("city", ""),
        "venue_capacity": venue.get("capacity"),
        "event_date": event_date,
        "url": raw.get("url", ""),
        "listing_count": stats.get("listing_count"),
        "price_floor": stats.get("lowest_price"),
        "price_median": stats.get("median_price"),
        "price_ceiling": stats.get("highest_price"),
    }

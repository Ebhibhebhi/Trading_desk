from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import Event
from ..services.signals import compute_signals

router = APIRouter()


@router.get("/events")
async def get_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.artist))
        .where(Event.event_date >= datetime.utcnow())
        .order_by(Event.event_date)
    )
    events = result.scalars().all()

    events_data = [
        {
            "id": ev.id,
            "seatgeek_id": ev.seatgeek_id,
            "title": ev.title,
            "artist_name": ev.artist.name if ev.artist else None,
            "venue_name": ev.venue_name,
            "venue_city": ev.venue_city,
            "venue_capacity": ev.venue_capacity,
            "event_date": ev.event_date,
            "url": ev.url,
            "last_polled_at": ev.last_polled_at,
            "performer_score": ev.performer_score,
            "event_score": ev.event_score,
        }
        for ev in events
    ]

    enriched = compute_signals(events_data)

    for e in enriched:
        if isinstance(e.get("event_date"), datetime):
            e["event_date"] = e["event_date"].isoformat()
        if isinstance(e.get("last_polled_at"), datetime):
            e["last_polled_at"] = e["last_polled_at"].isoformat()

    return enriched

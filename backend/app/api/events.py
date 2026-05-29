from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import Event, PriceSnapshot
from ..services.signals import compute_signals, compute_depletion_rate

router = APIRouter()


@router.get("/events")
async def get_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.artist), selectinload(Event.snapshots))
        .where(Event.event_date >= datetime.utcnow())
        .order_by(Event.event_date)
    )
    events = result.scalars().all()

    events_data = []
    for ev in events:
        snapshots_sorted = sorted(ev.snapshots, key=lambda s: s.polled_at)
        latest = snapshots_sorted[-1] if snapshots_sorted else None

        events_data.append({
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
            "snapshot_count": len(ev.snapshots),
            "listing_count": latest.listing_count if latest else None,
            "price_floor": latest.price_floor if latest else None,
            "price_median": latest.price_median if latest else None,
            "price_ceiling": latest.price_ceiling if latest else None,
            "depletion_rate": compute_depletion_rate(snapshots_sorted),
        })

    enriched = compute_signals(events_data)

    for e in enriched:
        if isinstance(e.get("event_date"), datetime):
            e["event_date"] = e["event_date"].isoformat()
        if isinstance(e.get("last_polled_at"), datetime):
            e["last_polled_at"] = e["last_polled_at"].isoformat()

    return enriched


@router.get("/events/{event_id}/history")
async def get_event_history(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PriceSnapshot)
        .where(PriceSnapshot.event_id == event_id)
        .order_by(PriceSnapshot.polled_at)
    )
    snapshots = result.scalars().all()

    return [
        {
            "polled_at": s.polled_at.isoformat(),
            "listing_count": s.listing_count,
            "price_floor": s.price_floor,
            "price_median": s.price_median,
            "price_ceiling": s.price_ceiling,
        }
        for s in snapshots
    ]

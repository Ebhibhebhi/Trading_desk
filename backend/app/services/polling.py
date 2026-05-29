from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import Artist, Event, PriceSnapshot
from . import seatgeek, spotify


async def poll_events(db: AsyncSession) -> None:
    from ..config import load_config
    cfg = load_config()

    raw_events = await seatgeek.fetch_events(
        city=cfg["region"],
        days_ahead=cfg["days_ahead"],
        per_page=cfg["max_events"],
    )

    for raw in raw_events:
        parsed = seatgeek.parse_event(raw)
        if not parsed.get("event_date"):
            continue

        artist = await _upsert_artist(db, parsed["artist_name"], parsed["artist_seatgeek_id"])
        event = await _upsert_event(db, parsed, artist.id if artist else None)

        snapshot = PriceSnapshot(
            event_id=event.id,
            polled_at=datetime.utcnow(),
            listing_count=parsed["listing_count"],
            price_floor=parsed["price_floor"],
            price_median=parsed["price_median"],
            price_ceiling=parsed["price_ceiling"],
        )
        db.add(snapshot)
        event.last_polled_at = datetime.utcnow()

    await db.commit()


async def _upsert_artist(db: AsyncSession, name: str, seatgeek_id: str | None) -> Artist | None:
    if not seatgeek_id:
        return None

    result = await db.execute(select(Artist).where(Artist.seatgeek_id == seatgeek_id))
    artist = result.scalar_one_or_none()

    now = datetime.utcnow()

    if not artist:
        artist = Artist(name=name, seatgeek_id=seatgeek_id)
        db.add(artist)
        await db.flush()

    needs_spotify_refresh = (
        artist.spotify_updated_at is None
        or (now - artist.spotify_updated_at) > timedelta(hours=24)
    )

    if needs_spotify_refresh:
        spotify_raw = await spotify.search_artist(name)
        if spotify_raw:
            parsed = spotify.parse_artist(spotify_raw)
            artist.spotify_id = parsed["spotify_id"]
            artist.popularity = parsed["popularity"]
            artist.followers = parsed["followers"]
            artist.genres = parsed["genres"]
            artist.spotify_updated_at = now

    return artist


async def _upsert_event(db: AsyncSession, parsed: dict, artist_id: int | None) -> Event:
    result = await db.execute(select(Event).where(Event.seatgeek_id == parsed["seatgeek_id"]))
    event = result.scalar_one_or_none()

    if not event:
        event = Event(
            seatgeek_id=parsed["seatgeek_id"],
            title=parsed["title"],
            artist_id=artist_id,
            venue_name=parsed["venue_name"],
            venue_city=parsed["venue_city"],
            venue_capacity=parsed["venue_capacity"],
            event_date=parsed["event_date"],
            url=parsed["url"],
        )
        db.add(event)
        await db.flush()
    else:
        if parsed.get("venue_capacity"):
            event.venue_capacity = parsed["venue_capacity"]

    return event

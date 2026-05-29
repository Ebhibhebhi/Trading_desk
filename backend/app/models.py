from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Artist(Base):
    __tablename__ = "artists"

    id = Column(Integer, primary_key=True)
    seatgeek_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)

    events = relationship("Event", back_populates="artist")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    seatgeek_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    artist_id = Column(Integer, ForeignKey("artists.id"), nullable=True)
    venue_name = Column(String)
    venue_city = Column(String)
    venue_capacity = Column(Integer, nullable=True)
    event_date = Column(DateTime, nullable=True)
    url = Column(String, nullable=True)
    last_polled_at = Column(DateTime, nullable=True)

    artist = relationship("Artist", back_populates="events")
    snapshots = relationship("PriceSnapshot", back_populates="event", order_by="PriceSnapshot.polled_at")


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    polled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    listing_count = Column(Integer, nullable=True)
    price_floor = Column(Float, nullable=True)
    price_median = Column(Float, nullable=True)
    price_ceiling = Column(Float, nullable=True)

    event = relationship("Event", back_populates="snapshots")

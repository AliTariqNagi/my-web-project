from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from .database import Base, engine, SessionLocal


class BusinessInquiry(Base):
    __tablename__ = "business_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    company = Column(String(200), nullable=True)
    service = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    source_page = Column(String(500), nullable=True)
    status = Column(String(40), default="new", index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ConsultationBooking(Base):
    __tablename__ = "consultation_bookings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    company = Column(String(200), nullable=True)
    service = Column(String(200), nullable=True)
    preferred_date = Column(String(80), nullable=True)
    preferred_time = Column(String(80), nullable=True)
    timezone = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(40), default="requested", index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# Keep this import style available, similar to your old project:
# from app.models import SessionLocal, engine, Base, BusinessInquiry

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base


class WorkListing(Base):
    __tablename__ = "work_listings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    location = Column(String(200), nullable=False, index=True)
    payment = Column(String(100), nullable=False)
    work_type = Column(String(50), nullable=True, default="Daily Wage")
    urgency = Column(String(50), nullable=True, default="Immediate")
    contact_name = Column(String(100), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="published", index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="work_listings")
    requests = relationship("WorkRequest", back_populates="listing", cascade="all, delete-orphan", order_by="desc(WorkRequest.created_at)")


class WorkRequest(Base):
    __tablename__ = "work_requests"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("work_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    seeker_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    seeker_name = Column(String(100), nullable=False)
    seeker_phone = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    listing = relationship("WorkListing", back_populates="requests")

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base


class WomenEnterprise(Base):
    __tablename__ = "women_enterprises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    business_name = Column(String(200), nullable=False)
    title = Column(String(250), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    shg_group_name = Column(String(150), nullable=True)  # e.g., "Gayatri DWCRA SHG - 10 Members"
    products_offered = Column(Text, nullable=False)      # e.g., "Cold-Pressed Groundnut Oil, Sesame Oil"
    price_range = Column(String(100), nullable=False)    # e.g., "₹280 - ₹350 / Litre"
    production_capacity = Column(String(100), nullable=False) # e.g., "200 Litres / Month"
    location = Column(String(200), nullable=False, index=True)
    district = Column(String(100), nullable=True)
    contact_name = Column(String(100), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    government_scheme_availed = Column(String(200), nullable=True) # e.g., "PM FME Subsidy (35%) + Stree Nidhi"
    certifications = Column(String(200), nullable=True)           # e.g., "FSSAI Registered, Local Organic"
    status = Column(String(20), nullable=False, default="active", index=True) # "active", "draft"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="women_enterprises")
    inquiries = relationship("WomenEnterpriseInquiry", back_populates="enterprise", cascade="all, delete-orphan", order_by="desc(WomenEnterpriseInquiry.created_at)")


class WomenEnterpriseInquiry(Base):
    __tablename__ = "women_enterprise_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    enterprise_id = Column(Integer, ForeignKey("women_enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    buyer_name = Column(String(100), nullable=False)
    buyer_phone = Column(String(50), nullable=False)
    inquiry_type = Column(String(50), nullable=False, default="Purchase Order") # "Purchase Order", "Bulk Supply", "Partnership"
    message = Column(Text, nullable=True)
    quantity_needed = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pending") # "pending", "contacted", "completed"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    enterprise = relationship("WomenEnterprise", back_populates="inquiries")

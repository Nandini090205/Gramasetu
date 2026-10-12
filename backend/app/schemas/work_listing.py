from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class WorkListingBase(BaseModel):
    title: str
    description: str
    category: str
    location: str
    payment: str
    work_type: Optional[str] = "Daily Wage"
    urgency: Optional[str] = "Immediate"
    contact_name: str
    contact_phone: str
    status: Optional[str] = "published"


class WorkListingCreate(WorkListingBase):
    pass


class WorkListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    payment: Optional[str] = None
    work_type: Optional[str] = None
    urgency: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None


class WorkRequestCreate(BaseModel):
    seeker_name: str
    seeker_phone: str
    message: Optional[str] = None


class WorkRequestResponse(BaseModel):
    id: int
    listing_id: int
    seeker_name: str
    seeker_phone: str
    message: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WorkListingResponse(WorkListingBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    request_count: Optional[int] = 0
    requests: Optional[List[WorkRequestResponse]] = []

    model_config = ConfigDict(from_attributes=True)

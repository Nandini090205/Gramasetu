from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database.session import get_db
from app.models.user import User
from app.models.work_listing import WorkListing, WorkRequest
from app.schemas.work_listing import (
    WorkListingCreate,
    WorkListingUpdate,
    WorkListingResponse,
    WorkRequestCreate,
    WorkRequestResponse,
)
from app.services.auth_service import get_current_user_or_create

router = APIRouter(prefix="/api/work-listings", tags=["Work Listings"])


def format_listing_response(listing: WorkListing, include_requests: bool = False) -> dict:
    """Helper to convert WorkListing model to response dictionary."""
    now_utc = datetime.now(timezone.utc)
    data = {
        "id": listing.id,
        "user_id": listing.user_id,
        "title": listing.title,
        "description": listing.description,
        "category": listing.category,
        "location": listing.location,
        "payment": listing.payment,
        "work_type": listing.work_type,
        "urgency": listing.urgency,
        "contact_name": listing.contact_name,
        "contact_phone": listing.contact_phone,
        "status": listing.status,
        "created_at": listing.created_at or now_utc,
        "updated_at": listing.updated_at or now_utc,
        "request_count": len(listing.requests) if listing.requests else 0,
        "requests": []
    }
    if include_requests and listing.requests:
        data["requests"] = [
            {
                "id": req.id,
                "listing_id": req.listing_id,
                "seeker_name": req.seeker_name,
                "seeker_phone": req.seeker_phone,
                "message": req.message,
                "status": req.status,
                "created_at": req.created_at,
            }
            for req in listing.requests
        ]
    return data


@router.get("", response_model=List[WorkListingResponse])
def get_public_work_listings(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search keyword in title, description, or location"),
    location: Optional[str] = Query(None, description="Filter by location"),
    db: Session = Depends(get_db)
):
    """
    WORK NEED INTERFACE:
    Strictly returns only active published work opportunities posted by Work Providers.
    Does NOT return drafts or completed listings.
    """
    query = db.query(WorkListing).filter(WorkListing.status == "published")

    if category and category.strip() and category.lower() != "all":
        cat_clean = category.strip()
        cat_lower = cat_clean.lower()
        if "transport" in cat_lower or "delivery" in cat_lower:
            query = query.filter(
                or_(
                    WorkListing.category == cat_clean,
                    WorkListing.category.ilike("%transport%"),
                    WorkListing.category.ilike("%delivery%")
                )
            )
        elif "carpenter" in cat_lower or "corpentor" in cat_lower:
            query = query.filter(
                or_(
                    WorkListing.category == cat_clean,
                    WorkListing.category.ilike("%carpenter%"),
                    WorkListing.category.ilike("%corpentor%")
                )
            )
        elif "tailor" in cat_lower:
            query = query.filter(
                or_(
                    WorkListing.category == cat_clean,
                    WorkListing.category.ilike("%tailor%")
                )
            )
        else:
            query = query.filter(WorkListing.category == cat_clean)

    if location and location.strip():
        query = query.filter(WorkListing.location.ilike(f"%{location.strip()}%"))

    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                WorkListing.title.ilike(pattern),
                WorkListing.description.ilike(pattern),
                WorkListing.location.ilike(pattern),
                WorkListing.category.ilike(pattern)
            )
        )

    listings = query.order_by(desc(WorkListing.created_at)).all()
    return [format_listing_response(l, include_requests=False) for l in listings]


@router.get("/my", response_model=List[WorkListingResponse])
def get_my_work_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """
    WORK PROVIDER INTERFACE:
    Strictly returns ONLY the listings created by the authenticated work provider.
    Includes applicants/requests for each listing so the provider can manage them.
    """
    listings = (
        db.query(WorkListing)
        .filter(WorkListing.user_id == current_user.id)
        .order_by(desc(WorkListing.created_at))
        .all()
    )
    return [format_listing_response(l, include_requests=True) for l in listings]


@router.get("/{listing_id}", response_model=WorkListingResponse)
def get_work_listing_detail(listing_id: int, db: Session = Depends(get_db)):
    """Fetch details of a single work listing."""
    listing = db.query(WorkListing).filter(WorkListing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work listing not found."
        )
    return format_listing_response(listing, include_requests=False)


@router.post("", response_model=WorkListingResponse, status_code=status.HTTP_201_CREATED)
def create_work_listing(
    payload: WorkListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """
    WORK PROVIDER INTERFACE:
    Creates and publishes a new work listing associated strictly with the provider.
    """
    new_listing = WorkListing(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        location=payload.location.strip(),
        payment=payload.payment.strip(),
        work_type=payload.work_type.strip() if payload.work_type else "Daily Wage",
        urgency=payload.urgency.strip() if payload.urgency else "Immediate",
        contact_name=payload.contact_name.strip(),
        contact_phone=payload.contact_phone.strip(),
        status=payload.status if payload.status in ["published", "completed"] else "published"
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return format_listing_response(new_listing, include_requests=True)


@router.put("/{listing_id}", response_model=WorkListingResponse)
def update_work_listing(
    listing_id: int,
    payload: WorkListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """
    WORK PROVIDER INTERFACE:
    Updates an existing work listing.
    Ensures provider can manage ONLY their own listings (returns 403 otherwise).
    """
    listing = db.query(WorkListing).filter(WorkListing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work listing not found."
        )

    # Strict authorization check
    if listing.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this listing."
        )

    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(listing, field, val)

    db.commit()
    db.refresh(listing)
    return format_listing_response(listing, include_requests=True)


@router.delete("/{listing_id}", status_code=status.HTTP_200_OK)
def delete_work_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """
    WORK PROVIDER INTERFACE:
    Deletes a work listing.
    Ensures provider can delete ONLY their own listings (returns 403 otherwise).
    """
    listing = db.query(WorkListing).filter(WorkListing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work listing not found."
        )

    # Strict authorization check
    if listing.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this listing."
        )

    db.delete(listing)
    db.commit()
    return {"success": True, "message": "Work listing deleted successfully."}


@router.post("/{listing_id}/request", response_model=WorkRequestResponse, status_code=status.HTTP_201_CREATED)
def request_work(
    listing_id: int,
    payload: WorkRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_create)
):
    """
    WORK NEED INTERFACE:
    Allows a work seeker to apply or submit interest to the provider.
    """
    listing = db.query(WorkListing).filter(
        WorkListing.id == listing_id,
        WorkListing.status == "published"
    ).first()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work opportunity not found or no longer active."
        )

    new_request = WorkRequest(
        listing_id=listing.id,
        seeker_user_id=current_user.id,
        seeker_name=payload.seeker_name.strip(),
        seeker_phone=payload.seeker_phone.strip(),
        message=payload.message.strip() if payload.message else None,
        status="pending"
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

"""
Blood Donor API Routes
======================

Comprehensive blood donor management including donor registration, 
blood requests, proximity-based matching, and donation tracking.
"""
from __future__ import annotations

import math
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.blood_donor import (
    BloodDonor, BloodRequest, BloodDonorMatch, DonationRecord,
    BloodGroup, DonorStatus, RequestUrgency, RequestStatus,
    MatchStatus, DonationStatus,
)
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.user import User
from app.security import get_current_user_id

router = APIRouter(prefix="/blood-donor", tags=["Blood Donor"])


# ============================================================================
# Utility: Haversine distance calculation
# ============================================================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in km
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_compatible_blood_groups(blood_group: str) -> List[str]:
    """Return blood groups that can donate to the given blood group."""
    compatibility = {
        "A+": ["A+", "A-", "O+", "O-"],
        "A-": ["A-", "O-"],
        "B+": ["B+", "B-", "O+", "O-"],
        "B-": ["B-", "O-"],
        "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        "AB-": ["A-", "B-", "AB-", "O-"],
        "O+": ["O+", "O-"],
        "O-": ["O-"],
    }
    return compatibility.get(blood_group, [blood_group])


# ============================================================================
# Donor Profile Management
# ============================================================================

@router.post("/register")
async def register_donor(
    blood_group: str = Body(...),
    latitude: Optional[float] = Body(None),
    longitude: Optional[float] = Body(None),
    city: Optional[str] = Body(None),
    state: Optional[str] = Body(None),
    address: Optional[str] = Body(None),
    max_distance_km: float = Body(25.0),
    weight_kg: Optional[float] = Body(None),
    available_days: Optional[str] = Body(None),
    preferred_time: Optional[str] = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Register the current user as a blood donor."""
    # Check if already registered
    existing = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already registered as a blood donor")

    donor = BloodDonor(
        user_id=user_id,
        blood_group=blood_group,
        donor_status=DonorStatus.ACTIVE.value,
        latitude=latitude,
        longitude=longitude,
        city=city,
        state=state,
        address=address,
        max_distance_km=max_distance_km,
        weight_kg=weight_kg,
        available_days=available_days,
        preferred_time=preferred_time,
        notification_enabled=True,
        email_alerts=True,
    )
    db.add(donor)
    await db.flush()
    return {"success": True, "donor": donor.to_dict(), "message": "Successfully registered as blood donor"}


@router.get("/profile")
async def get_donor_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get the current user's blood donor profile."""
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id, BloodDonor.is_deleted == False)
    )
    donor = result.scalar_one_or_none()
    if not donor:
        return {"registered": False, "donor": None}
    return {"registered": True, "donor": donor.to_dict()}


@router.put("/profile")
async def update_donor_profile(
    data: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Update donor profile information."""
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id, BloodDonor.is_deleted == False)
    )
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    updatable = [
        "blood_group", "latitude", "longitude", "city", "state", "address",
        "max_distance_km", "weight_kg", "notification_enabled", "sms_alerts",
        "email_alerts", "available_days", "preferred_time", "medical_conditions",
    ]
    for field in updatable:
        if field in data:
            setattr(donor, field, data[field])

    return {"success": True, "donor": donor.to_dict()}


@router.put("/toggle")
async def toggle_donor_status(
    activate: bool = Body(..., embed=True),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Activate or deactivate blood donor status."""
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id, BloodDonor.is_deleted == False)
    )
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    if activate:
        # Check cooldown period (56 days between donations)
        if donor.last_donation_date:
            cooldown_end = donor.last_donation_date + timedelta(days=56)
            if datetime.now(timezone.utc) < cooldown_end.replace(tzinfo=timezone.utc) if cooldown_end.tzinfo is None else cooldown_end:
                donor.donor_status = DonorStatus.COOLDOWN.value
                return {
                    "success": True,
                    "status": DonorStatus.COOLDOWN.value,
                    "message": f"You are in cooldown period until {cooldown_end.isoformat()}",
                    "next_eligible_date": cooldown_end.isoformat(),
                }
        donor.donor_status = DonorStatus.ACTIVE.value
    else:
        donor.donor_status = DonorStatus.INACTIVE.value

    return {
        "success": True,
        "status": donor.donor_status,
        "message": f"Donor status {'activated' if activate else 'deactivated'} successfully",
    }


@router.put("/location")
async def update_donor_location(
    latitude: float = Body(...),
    longitude: float = Body(...),
    city: Optional[str] = Body(None),
    state: Optional[str] = Body(None),
    address: Optional[str] = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Update donor's current location for proximity matching."""
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id, BloodDonor.is_deleted == False)
    )
    donor = result.scalar_one_or_none()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    donor.latitude = latitude
    donor.longitude = longitude
    if city:
        donor.city = city
    if state:
        donor.state = state
    if address:
        donor.address = address

    return {"success": True, "message": "Location updated successfully"}


# ============================================================================
# Blood Requests
# ============================================================================

@router.post("/request")
async def create_blood_request(
    blood_group: str = Body(...),
    units_needed: int = Body(1),
    urgency: str = Body(RequestUrgency.ROUTINE.value),
    latitude: Optional[float] = Body(None),
    longitude: Optional[float] = Body(None),
    hospital_name: Optional[str] = Body(None),
    hospital_address: Optional[str] = Body(None),
    patient_name: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    contact_phone: Optional[str] = Body(None),
    contact_email: Optional[str] = Body(None),
    needed_by: Optional[str] = Body(None),
    search_radius_km: float = Body(50.0),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new blood request and find matching donors nearby."""
    needed_by_dt = None
    if needed_by:
        try:
            needed_by_dt = datetime.fromisoformat(needed_by)
        except ValueError:
            pass

    # Set expiry based on urgency
    urgency_expiry = {
        RequestUrgency.CRITICAL.value: timedelta(hours=6),
        RequestUrgency.EMERGENCY.value: timedelta(hours=24),
        RequestUrgency.URGENT.value: timedelta(days=3),
        RequestUrgency.ROUTINE.value: timedelta(days=14),
    }
    expires_at = datetime.now(timezone.utc) + urgency_expiry.get(urgency, timedelta(days=14))

    request = BloodRequest(
        requester_id=user_id,
        blood_group=blood_group,
        units_needed=units_needed,
        urgency=urgency,
        status=RequestStatus.OPEN.value,
        latitude=latitude,
        longitude=longitude,
        hospital_name=hospital_name,
        hospital_address=hospital_address,
        patient_name=patient_name,
        description=description,
        contact_phone=contact_phone,
        contact_email=contact_email,
        needed_by=needed_by_dt,
        expires_at=expires_at,
        search_radius_km=search_radius_km,
    )
    db.add(request)
    await db.flush()

    # Find and notify matching donors
    matched_count = 0
    if latitude is not None and longitude is not None:
        compatible_groups = get_compatible_blood_groups(blood_group)

        donors_query = select(BloodDonor).where(
            BloodDonor.donor_status == DonorStatus.ACTIVE.value,
            BloodDonor.blood_group.in_(compatible_groups),
            BloodDonor.notification_enabled == True,
            BloodDonor.health_eligible == True,
            BloodDonor.is_deleted == False,
            BloodDonor.latitude.isnot(None),
            BloodDonor.longitude.isnot(None),
            BloodDonor.user_id != user_id,  # Don't match requester
        )
        donors_result = await db.execute(donors_query)
        all_donors = donors_result.scalars().all()

        # Filter by distance
        priority_map = {
            RequestUrgency.CRITICAL.value: NotificationPriority.EMERGENCY.value,
            RequestUrgency.EMERGENCY.value: NotificationPriority.CRITICAL.value,
            RequestUrgency.URGENT.value: NotificationPriority.HIGH.value,
            RequestUrgency.ROUTINE.value: NotificationPriority.MEDIUM.value,
        }

        for donor in all_donors:
            distance = haversine_distance(latitude, longitude, donor.latitude, donor.longitude)
            if distance <= min(search_radius_km, donor.max_distance_km):
                # Create match
                match = BloodDonorMatch(
                    request_id=request.id,
                    donor_id=donor.id,
                    donor_user_id=donor.user_id,
                    status=MatchStatus.NOTIFIED.value,
                    distance_km=round(distance, 2),
                    notified_at=datetime.now(timezone.utc),
                )
                db.add(match)

                # Create notification for donor
                notification = Notification(
                    user_id=donor.user_id,
                    notification_type="blood_donation_request",
                    priority=priority_map.get(urgency, NotificationPriority.MEDIUM.value),
                    title=f"🩸 Blood Donation Request - {urgency.upper()}",
                    message=(
                        f"A patient needs {blood_group} blood ({units_needed} unit{'s' if units_needed > 1 else ''}) "
                        f"at {hospital_name or 'a nearby hospital'}, {round(distance, 1)} km from you. "
                        f"{'URGENT: Needed immediately!' if urgency in ['critical', 'emergency'] else ''}"
                    ),
                    short_message=f"Blood {blood_group} needed {round(distance, 1)}km away",
                    action_url=f"/patient/blood-donor?request={request.id}",
                    action_label="Respond to Request",
                    data=json.dumps({
                        "request_id": request.id,
                        "match_id": match.id,
                        "blood_group": blood_group,
                        "distance_km": round(distance, 2),
                        "urgency": urgency,
                        "hospital_name": hospital_name,
                    }),
                )
                db.add(notification)
                matched_count += 1

    request.donors_notified = matched_count
    await db.flush()

    return {
        "success": True,
        "request": request.to_dict(),
        "donors_notified": matched_count,
        "message": f"Blood request created. {matched_count} nearby donors notified.",
    }


@router.get("/requests")
async def list_blood_requests(
    status: Optional[str] = None,
    blood_group: Optional[str] = None,
    urgency: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """List blood requests (optionally filtered)."""
    query = select(BloodRequest).where(
        BloodRequest.is_deleted == False,
        BloodRequest.status != RequestStatus.EXPIRED.value,
    )
    if status:
        query = query.where(BloodRequest.status == status)
    if blood_group:
        query = query.where(BloodRequest.blood_group == blood_group)
    if urgency:
        query = query.where(BloodRequest.urgency == urgency)

    query = query.order_by(BloodRequest.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    requests = result.scalars().all()

    count_result = await db.execute(
        select(func.count(BloodRequest.id)).where(
            BloodRequest.is_deleted == False,
            BloodRequest.status == RequestStatus.OPEN.value,
        )
    )
    open_count = count_result.scalar()

    return {
        "requests": [r.to_dict() for r in requests],
        "open_count": open_count,
    }


@router.get("/requests/{request_id}")
async def get_blood_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get details of a specific blood request with matches."""
    result = await db.execute(
        select(BloodRequest).where(BloodRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=404, detail="Blood request not found")

    # Get matches
    matches_result = await db.execute(
        select(BloodDonorMatch).where(BloodDonorMatch.request_id == request_id)
        .order_by(BloodDonorMatch.distance_km.asc())
    )
    matches = matches_result.scalars().all()

    # Enrich matches with donor user info
    enriched_matches = []
    for m in matches:
        match_dict = m.to_dict()
        user_result = await db.execute(select(User).where(User.id == m.donor_user_id))
        user = user_result.scalar_one_or_none()
        if user:
            match_dict["donor_name"] = f"{user.first_name} {user.last_name}"
        enriched_matches.append(match_dict)

    return {
        "request": request.to_dict(),
        "matches": enriched_matches,
        "stats": {
            "total_matched": len(matches),
            "accepted": sum(1 for m in matches if m.status == MatchStatus.ACCEPTED.value),
            "declined": sum(1 for m in matches if m.status == MatchStatus.DECLINED.value),
            "pending": sum(1 for m in matches if m.status in [MatchStatus.PENDING.value, MatchStatus.NOTIFIED.value]),
        },
    }


@router.get("/my-requests")
async def get_my_blood_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get blood requests created by the current user."""
    result = await db.execute(
        select(BloodRequest).where(
            BloodRequest.requester_id == user_id,
            BloodRequest.is_deleted == False,
        ).order_by(BloodRequest.created_at.desc())
    )
    requests = result.scalars().all()
    return {"requests": [r.to_dict() for r in requests]}


# ============================================================================
# Donor Matching & Response
# ============================================================================

@router.get("/incoming")
async def get_incoming_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get donation requests sent to the current donor."""
    # Get donor profile
    donor_result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id, BloodDonor.is_deleted == False)
    )
    donor = donor_result.scalar_one_or_none()
    if not donor:
        return {"matches": [], "message": "Not registered as a donor"}

    # Get matches for this donor
    matches_result = await db.execute(
        select(BloodDonorMatch).where(
            BloodDonorMatch.donor_id == donor.id,
            BloodDonorMatch.is_deleted == False,
        ).order_by(BloodDonorMatch.created_at.desc())
    )
    matches = matches_result.scalars().all()

    enriched = []
    for m in matches:
        match_dict = m.to_dict()
        # Get request details
        req_result = await db.execute(
            select(BloodRequest).where(BloodRequest.id == m.request_id)
        )
        req = req_result.scalar_one_or_none()
        if req:
            match_dict["request"] = req.to_dict()
        enriched.append(match_dict)

    return {"matches": enriched}


@router.put("/respond/{match_id}")
async def respond_to_match(
    match_id: str,
    accept: bool = Body(...),
    message: Optional[str] = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Accept or decline a blood donation match."""
    result = await db.execute(
        select(BloodDonorMatch).where(
            BloodDonorMatch.id == match_id,
            BloodDonorMatch.donor_user_id == user_id,
        )
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status not in [MatchStatus.PENDING.value, MatchStatus.NOTIFIED.value]:
        raise HTTPException(status_code=400, detail="Match already responded to")

    match.status = MatchStatus.ACCEPTED.value if accept else MatchStatus.DECLINED.value
    match.responded_at = datetime.now(timezone.utc)
    match.response_message = message

    # Get the donor profile
    donor_result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id)
    )
    donor = donor_result.scalar_one_or_none()

    # Get donor user info
    user_result = await db.execute(select(User).where(User.id == user_id))
    donor_user = user_result.scalar_one_or_none()
    donor_name = f"{donor_user.first_name} {donor_user.last_name}" if donor_user else "A donor"

    # Get the blood request
    req_result = await db.execute(
        select(BloodRequest).where(BloodRequest.id == match.request_id)
    )
    blood_request = req_result.scalar_one_or_none()

    if blood_request and accept:
        blood_request.units_fulfilled += 1
        if blood_request.units_fulfilled >= blood_request.units_needed:
            blood_request.status = RequestStatus.FULFILLED.value
        else:
            blood_request.status = RequestStatus.PARTIALLY_FULFILLED.value

        # Create donation record
        donation = DonationRecord(
            donor_id=donor.id if donor else match.donor_id,
            match_id=match_id,
            request_id=blood_request.id,
            donation_status=DonationStatus.SCHEDULED.value,
            blood_group=blood_request.blood_group,
            units_donated=1,
            donation_center=blood_request.hospital_name,
            donation_address=blood_request.hospital_address,
        )
        db.add(donation)

    # Notify the requester
    if blood_request:
        notif = Notification(
            user_id=blood_request.requester_id,
            notification_type="blood_donation_request",
            priority=NotificationPriority.HIGH.value,
            title=f"{'✅ Donor Accepted' if accept else '❌ Donor Declined'} - {blood_request.blood_group}",
            message=(
                f"{donor_name} has {'accepted' if accept else 'declined'} your blood donation request "
                f"for {blood_request.blood_group} blood."
                f"{(' Message: ' + message) if message else ''}"
            ),
            short_message=f"Donor {'accepted' if accept else 'declined'} your request",
            action_url=f"/patient/blood-donor?request={blood_request.id}",
            action_label="View Details",
        )
        db.add(notif)

    return {
        "success": True,
        "status": match.status,
        "message": f"You have {'accepted' if accept else 'declined'} the donation request.",
    }


# ============================================================================
# Donation History & Stats
# ============================================================================

@router.get("/history")
async def get_donation_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get the donor's donation history."""
    donor_result = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == user_id)
    )
    donor = donor_result.scalar_one_or_none()
    if not donor:
        return {"donations": [], "total": 0}

    donations_result = await db.execute(
        select(DonationRecord).where(
            DonationRecord.donor_id == donor.id,
            DonationRecord.is_deleted == False,
        ).order_by(DonationRecord.created_at.desc())
    )
    donations = donations_result.scalars().all()

    return {
        "donations": [d.to_dict() for d in donations],
        "total": len(donations),
        "total_units": sum(d.units_donated for d in donations if d.donation_status == DonationStatus.COMPLETED.value),
    }


@router.get("/stats")
async def get_donor_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get blood donor statistics and analytics."""
    # Total active donors
    active_donors = await db.execute(
        select(func.count(BloodDonor.id)).where(
            BloodDonor.donor_status == DonorStatus.ACTIVE.value,
            BloodDonor.is_deleted == False,
        )
    )
    total_active = active_donors.scalar()

    # Open requests
    open_requests = await db.execute(
        select(func.count(BloodRequest.id)).where(
            BloodRequest.status == RequestStatus.OPEN.value,
            BloodRequest.is_deleted == False,
        )
    )
    total_open = open_requests.scalar()

    # Fulfilled requests
    fulfilled = await db.execute(
        select(func.count(BloodRequest.id)).where(
            BloodRequest.status == RequestStatus.FULFILLED.value,
            BloodRequest.is_deleted == False,
        )
    )
    total_fulfilled = fulfilled.scalar()

    # Donations by blood group
    group_stats_result = await db.execute(
        select(BloodDonor.blood_group, func.count(BloodDonor.id))
        .where(BloodDonor.is_deleted == False)
        .group_by(BloodDonor.blood_group)
    )
    group_stats = {row[0]: row[1] for row in group_stats_result.all()}

    # Recent requests
    recent_result = await db.execute(
        select(BloodRequest).where(BloodRequest.is_deleted == False)
        .order_by(BloodRequest.created_at.desc()).limit(5)
    )
    recent_requests = recent_result.scalars().all()

    return {
        "total_active_donors": total_active,
        "total_open_requests": total_open,
        "total_fulfilled": total_fulfilled,
        "donors_by_blood_group": group_stats,
        "recent_requests": [r.to_dict() for r in recent_requests],
    }


@router.get("/nearby")
async def find_nearby_donors(
    latitude: float = Query(...),
    longitude: float = Query(...),
    blood_group: Optional[str] = Query(None),
    radius_km: float = Query(25.0),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Find nearby blood donors for a given location."""
    query = select(BloodDonor).where(
        BloodDonor.donor_status == DonorStatus.ACTIVE.value,
        BloodDonor.health_eligible == True,
        BloodDonor.is_deleted == False,
        BloodDonor.latitude.isnot(None),
        BloodDonor.longitude.isnot(None),
    )
    if blood_group:
        compatible = get_compatible_blood_groups(blood_group)
        query = query.where(BloodDonor.blood_group.in_(compatible))

    result = await db.execute(query)
    donors = result.scalars().all()

    nearby = []
    for d in donors:
        dist = haversine_distance(latitude, longitude, d.latitude, d.longitude)
        if dist <= radius_km:
            donor_dict = d.to_dict()
            donor_dict["distance_km"] = round(dist, 2)
            # Get user info
            user_result = await db.execute(select(User).where(User.id == d.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                donor_dict["donor_name"] = f"{user.first_name} {user.last_name}"
            nearby.append(donor_dict)

    nearby.sort(key=lambda x: x["distance_km"])
    return {"donors": nearby, "total": len(nearby)}

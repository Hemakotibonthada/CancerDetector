"""
Users API Endpoints
"""
from __future__ import annotations
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
import re

from pydantic import BaseModel, EmailStr, Field

from app.database import get_db_session
from app.models.hospital import Doctor, Hospital
from app.models.patient import Patient
from app.models.user import User, UserStatus
from app.schemas.user import UserResponse, UserUpdate, UserAdminUpdate, UserListResponse
from app.security import (
    generate_health_id,
    generate_record_number,
    get_current_user_id,
    get_current_user_token,
    hash_password,
    require_any_admin,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str = None,
    status_filter: str = None,
    search: str = None,
    token_data = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """List all users (admin only)."""
    query = select(User).where(User.is_deleted == False)
    count_query = select(func.count(User.id)).where(User.is_deleted == False)
    
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    if status_filter:
        query = query.where(User.status == status_filter)
        count_query = count_query.where(User.status == status_filter)
    if search:
        search_term = f"%{search}%"
        search_filter = or_(
            User.first_name.ilike(search_term),
            User.last_name.ilike(search_term),
            User.email.ilike(search_term),
            User.health_id.ilike(search_term),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    user_responses = [
        UserResponse(
            id=u.id, email=u.email, username=u.username,
            first_name=u.first_name, last_name=u.last_name,
            full_name=u.full_name, role=u.role, status=u.status,
            health_id=u.health_id, phone_number=u.phone_number,
            profile_photo_url=u.profile_photo_url,
            date_of_birth=u.date_of_birth, gender=u.gender,
            email_verified=u.email_verified, last_login=u.last_login,
            created_at=u.created_at,
        )
        for u in users
    ]
    
    return UserListResponse(users=user_responses, total=total, page=page, page_size=page_size)


class AdminUserCreate(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    phone_number: Optional[str] = None
    role: str = "patient"
    must_change_password: bool = False


_ROLE_MAP = {
    "patient": "patient",
    "doctor": "doctor",
    "staff": "support_staff",
    "admin": "hospital_admin",
    "support_staff": "support_staff",
    "hospital_admin": "hospital_admin",
    "nurse": "nurse",
    "pharmacist": "pharmacist",
    "lab_technician": "lab_technician",
    "receptionist": "receptionist",
    "researcher": "researcher",
    "data_analyst": "data_analyst",
    "insurance_agent": "insurance_agent",
    "system_admin": "system_admin",
    "super_admin": "super_admin",
}


def _validate_password(password: str) -> None:
    if not re.search(r"[A-Z]", password) or not re.search(r"[a-z]", password) or not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters and include upper, lower, and a digit",
        )


@router.post("/", status_code=201)
async def create_user(
    payload: AdminUserCreate,
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session),
):
    """Create a user. Only a super admin can create system or super admins."""
    role = _ROLE_MAP.get(payload.role)
    if role is None:
        raise HTTPException(status_code=400, detail="Unknown role")
    caller_role = token_data.get("role")
    if role in ("system_admin", "super_admin") and caller_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only a super admin can create this role")
    _validate_password(payload.password)

    existing = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    base = re.sub(r"[^a-z0-9]", "", payload.email.split("@")[0].lower()) or "user"
    username = base
    suffix = 1
    while (await db.execute(select(User).where(User.username == username))).scalar_one_or_none():
        username = f"{base}{suffix}"
        suffix += 1

    health_id = generate_health_id() if role == "patient" else None
    user = User(
        email=str(payload.email),
        username=username,
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        role=role,
        status=UserStatus.ACTIVE.value,
        health_id=health_id,
        must_change_password=payload.must_change_password,
        two_factor_enabled=False,
        password_changed_at=datetime.utcnow(),
    )
    db.add(user)
    await db.flush()

    if role == "patient":
        db.add(Patient(
            user_id=user.id,
            health_id=health_id,
            data_collection_consent=False,
            ai_analysis_consent=False,
        ))
    elif role == "doctor":
        hospital = (await db.execute(
            select(Hospital).where(Hospital.is_deleted == False).order_by(Hospital.created_at.asc())
        )).scalars().first()
        if hospital is None:
            raise HTTPException(status_code=400, detail="Record a hospital first")
        db.add(Doctor(
            user_id=user.id,
            hospital_id=hospital.id,
            medical_license_number=generate_record_number("LIC"),
            specialization="general",
        ))
    await db.flush()
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.full_name,
        "role": user.role,
        "status": user.status,
        "health_id": user.health_id,
        "phone_number": user.phone_number,
        "must_change_password": user.must_change_password,
        "two_factor_enabled": False,
        "welcome_email_sent": False,
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    current_result = await db.execute(select(User).where(User.id == current_user_id))
    current_user = current_result.scalar_one_or_none()
    
    if current_user_id != user_id and not current_user.is_admin and not current_user.is_medical_staff:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return UserResponse(
        id=user.id, email=user.email, username=user.username,
        first_name=user.first_name, last_name=user.last_name,
        full_name=user.full_name, role=user.role, status=user.status,
        health_id=user.health_id, phone_number=user.phone_number,
        profile_photo_url=user.profile_photo_url,
        date_of_birth=user.date_of_birth, gender=user.gender,
        blood_group=user.blood_group, city=user.city,
        state=user.state, country=user.country,
        email_verified=user.email_verified,
        two_factor_enabled=user.two_factor_enabled,
        last_login=user.last_login, created_at=user.created_at,
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Update user profile."""
    if current_user_id != user_id:
        current_result = await db.execute(select(User).where(User.id == current_user_id))
        current_user = current_result.scalar_one_or_none()
        if not current_user or not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Can only update own profile")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    
    return UserResponse(
        id=user.id, email=user.email, username=user.username,
        first_name=user.first_name, last_name=user.last_name,
        full_name=user.full_name, role=user.role, status=user.status,
        health_id=user.health_id, phone_number=user.phone_number,
        date_of_birth=user.date_of_birth, gender=user.gender,
        created_at=user.created_at,
    )


@router.put("/{user_id}/admin", response_model=UserResponse)
async def admin_update_user(
    user_id: str,
    update_data: UserAdminUpdate,
    token_data = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Admin update user (role, status, etc)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    
    return UserResponse(
        id=user.id, email=user.email, username=user.username,
        first_name=user.first_name, last_name=user.last_name,
        full_name=user.full_name, role=user.role, status=user.status,
        health_id=user.health_id,
        created_at=user.created_at,
    )


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    token_data = Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Soft delete a user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.soft_delete()
    return {"success": True, "message": "User deleted successfully"}

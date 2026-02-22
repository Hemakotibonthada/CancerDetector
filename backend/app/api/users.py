"""
Users API Endpoints
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.user import User, UserStatus
from app.schemas.user import UserResponse, UserUpdate, UserAdminUpdate, UserListResponse
from app.security import get_current_user_id, get_current_user_token, require_any_admin

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

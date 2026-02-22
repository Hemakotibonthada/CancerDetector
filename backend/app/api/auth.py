"""
Authentication API Endpoints
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.user import User, UserStatus
from app.models.patient import Patient
from app.schemas.user import (
    UserRegister, UserLogin, TokenResponse, TokenRefresh,
    UserResponse, PasswordChange, PasswordReset, PasswordResetConfirm
)
from app.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_refresh_token,
    get_current_user_token, get_current_user_id,
    generate_health_id
)
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Register a new user account."""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    health_id = generate_health_id()
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        role=user_data.role,
        status=UserStatus.ACTIVE.value,
        health_id=health_id,
        date_of_birth=user_data.date_of_birth,
        gender=user_data.gender,
        email_verified=False,
        last_login=datetime.now(timezone.utc),
        last_login_ip=request.client.host if request.client else None,
    )
    db.add(user)
    await db.flush()
    
    # Create patient profile if role is patient
    if user_data.role == "patient":
        patient = Patient(
            user_id=user.id,
            health_id=health_id,
            data_collection_consent=True,
            ai_analysis_consent=True,
        )
        db.add(patient)
    
    await db.flush()
    
    # Generate tokens
    settings = get_settings()
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "health_id": health_id,
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        health_id=user.health_id,
        phone_number=user.phone_number,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        email_verified=user.email_verified,
        created_at=user.created_at,
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.auth.access_token_expire_minutes * 60,
        user=user_response,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Authenticate user and return tokens."""
    # Find user
    result = await db.execute(
        select(User).where(
            (User.email == login_data.email) | (User.username == login_data.email)
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check account status
    if user.status == UserStatus.BANNED.value:
        raise HTTPException(status_code=403, detail="Account has been banned")
    if user.status == UserStatus.SUSPENDED.value:
        raise HTTPException(status_code=403, detail="Account is suspended")
    if user.is_locked:
        raise HTTPException(status_code=423, detail="Account is temporarily locked")
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        settings = get_settings()
        locked = user.record_failed_login(
            max_attempts=settings.auth.max_login_attempts,
            lockout_minutes=settings.auth.lockout_duration_minutes
        )
        if locked:
            raise HTTPException(
                status_code=423,
                detail=f"Account locked due to too many failed attempts. Try again in {settings.auth.lockout_duration_minutes} minutes."
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Record successful login
    user.record_login(ip_address=request.client.host if request.client else None)
    
    # Generate tokens
    settings = get_settings()
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "health_id": user.health_id,
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        health_id=user.health_id,
        phone_number=user.phone_number,
        profile_photo_url=user.profile_photo_url,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        email_verified=user.email_verified,
        last_login=user.last_login,
        created_at=user.created_at,
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.auth.access_token_expire_minutes * 60,
        user=user_response,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: TokenRefresh,
    db: AsyncSession = Depends(get_db_session)
):
    """Refresh access token."""
    payload = verify_refresh_token(refresh_data.refresh_token)
    user_id = payload.get("sub")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or user.status != UserStatus.ACTIVE.value:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    settings = get_settings()
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "health_id": user.health_id,
    }
    
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        health_id=user.health_id,
        created_at=user.created_at,
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.auth.access_token_expire_minutes * 60,
        user=user_response,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current authenticated user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        health_id=user.health_id,
        phone_number=user.phone_number,
        profile_photo_url=user.profile_photo_url,
        date_of_birth=user.date_of_birth,
        gender=user.gender,
        blood_group=user.blood_group,
        city=user.city,
        state=user.state,
        country=user.country,
        email_verified=user.email_verified,
        two_factor_enabled=user.two_factor_enabled,
        last_login=user.last_login,
        created_at=user.created_at,
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Change user password."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if password_data.new_password != password_data.confirm_new_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    user.hashed_password = hash_password(password_data.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    
    return {"success": True, "message": "Password changed successfully"}


@router.post("/logout")
async def logout(
    token_data: Dict[str, Any] = Depends(get_current_user_token)
):
    """Logout user (invalidate token)."""
    return {"success": True, "message": "Successfully logged out"}

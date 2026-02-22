"""
Security Module - Authentication, JWT, Password Hashing
========================================================
"""

from __future__ import annotations

import logging
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Union

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

logger = logging.getLogger(__name__)

# ============================================================================
# Password Hashing (using hashlib for compatibility)
# ============================================================================

import hashlib
import os


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with salt."""
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ':' + key.hex()


security_scheme = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    try:
        salt_hex, key_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        stored_key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return new_key == stored_key
    except Exception:
        return False


# ============================================================================
# JWT Token Management
# ============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    settings = get_settings()
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.auth.access_token_expire_minutes
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "jti": secrets.token_urlsafe(32),
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.auth.secret_key,
        algorithm=settings.auth.algorithm
    )
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT refresh token."""
    settings = get_settings()
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.auth.refresh_token_expire_days
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
        "jti": secrets.token_urlsafe(32),
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.auth.secret_key,
        algorithm=settings.auth.algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.auth.secret_key,
            algorithms=[settings.auth.algorithm]
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_access_token(token: str) -> Dict[str, Any]:
    """Verify an access token and return payload."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    return payload


def verify_refresh_token(token: str) -> Dict[str, Any]:
    """Verify a refresh token and return payload."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    return payload


# ============================================================================
# Health ID Generation
# ============================================================================

def generate_health_id() -> str:
    """Generate a unique Health ID."""
    settings = get_settings()
    prefix = settings.auth.health_id_prefix
    random_part = secrets.token_hex(6).upper()[:10]
    
    # Format: CG-XXXX-XXXX-XX
    formatted = f"{prefix}-{random_part[:4]}-{random_part[4:8]}-{random_part[8:]}"
    return formatted


def generate_record_number(prefix: str = "REC") -> str:
    """Generate a unique record number."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_part = secrets.token_hex(3).upper()
    return f"{prefix}-{timestamp}-{random_part}"


# ============================================================================
# Dependencies
# ============================================================================

async def get_current_user_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """FastAPI dependency to get current user from JWT token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_access_token(credentials.credentials)
    return payload


async def get_current_user_id(
    token_data: Dict[str, Any] = Depends(get_current_user_token)
) -> str:
    """Get current user ID from token."""
    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    return user_id


class RoleChecker:
    """Dependency for role-based access control."""
    
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
    
    async def __call__(
        self,
        token_data: Dict[str, Any] = Depends(get_current_user_token)
    ) -> Dict[str, Any]:
        user_role = token_data.get("role", "")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return token_data


# Common role checkers
require_patient = RoleChecker(["patient"])
require_doctor = RoleChecker(["doctor", "oncologist", "surgeon", "general_practitioner", "specialist", "cardiologist", "neurologist", "dermatologist", "radiologist", "pathologist"])
require_hospital_admin = RoleChecker(["hospital_admin", "system_admin", "super_admin"])
require_system_admin = RoleChecker(["system_admin", "super_admin"])
require_super_admin = RoleChecker(["super_admin"])
require_medical_staff = RoleChecker(["doctor", "nurse", "oncologist", "surgeon", "radiologist", "pathologist", "pharmacist", "lab_technician", "general_practitioner", "specialist"])
require_any_admin = RoleChecker(["hospital_admin", "system_admin", "super_admin"])

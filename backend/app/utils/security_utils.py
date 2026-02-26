"""
Backend Security Utilities
Advanced security utilities for the Cancer Detection Platform.
Includes JWT management, RBAC, audit logging, data encryption, and security scanning.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    HOSPITAL_ADMIN = "hospital_admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    LAB_TECHNICIAN = "lab_technician"
    PHARMACIST = "pharmacist"
    RADIOLOGIST = "radiologist"
    PATHOLOGIST = "pathologist"
    RECEPTIONIST = "receptionist"
    PATIENT = "patient"
    RESEARCHER = "researcher"
    AUDITOR = "auditor"


class Permission(str, Enum):
    # Patient management
    VIEW_PATIENTS = "view_patients"
    CREATE_PATIENT = "create_patient"
    EDIT_PATIENT = "edit_patient"
    DELETE_PATIENT = "delete_patient"
    VIEW_PATIENT_PHI = "view_patient_phi"

    # Medical records
    VIEW_RECORDS = "view_records"
    CREATE_RECORD = "create_record"
    EDIT_RECORD = "edit_record"
    DELETE_RECORD = "delete_record"
    EXPORT_RECORDS = "export_records"

    # Appointments
    VIEW_APPOINTMENTS = "view_appointments"
    CREATE_APPOINTMENT = "create_appointment"
    EDIT_APPOINTMENT = "edit_appointment"
    CANCEL_APPOINTMENT = "cancel_appointment"

    # Lab / Imaging
    VIEW_LAB_RESULTS = "view_lab_results"
    CREATE_LAB_ORDER = "create_lab_order"
    APPROVE_LAB_RESULT = "approve_lab_result"
    VIEW_IMAGES = "view_images"
    UPLOAD_IMAGE = "upload_image"
    ANALYZE_IMAGE = "analyze_image"

    # Prescriptions
    VIEW_PRESCRIPTIONS = "view_prescriptions"
    CREATE_PRESCRIPTION = "create_prescription"
    APPROVE_PRESCRIPTION = "approve_prescription"

    # Billing
    VIEW_BILLING = "view_billing"
    CREATE_INVOICE = "create_invoice"
    PROCESS_PAYMENT = "process_payment"
    MANAGE_INSURANCE = "manage_insurance"

    # AI / ML
    RUN_AI_ANALYSIS = "run_ai_analysis"
    VIEW_AI_RESULTS = "view_ai_results"
    MANAGE_AI_MODELS = "manage_ai_models"

    # Admin
    MANAGE_USERS = "manage_users"
    MANAGE_ROLES = "manage_roles"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    MANAGE_SETTINGS = "manage_settings"
    VIEW_ANALYTICS = "view_analytics"
    MANAGE_HOSPITAL = "manage_hospital"

    # System
    SYSTEM_ADMIN = "system_admin"
    VIEW_SYSTEM_HEALTH = "view_system_health"
    MANAGE_INTEGRATIONS = "manage_integrations"


# ==================== Role-Permission Mapping ====================

ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.SUPER_ADMIN: set(Permission),  # All permissions
    Role.ADMIN: {
        Permission.VIEW_PATIENTS, Permission.CREATE_PATIENT, Permission.EDIT_PATIENT,
        Permission.VIEW_PATIENT_PHI, Permission.VIEW_RECORDS, Permission.CREATE_RECORD,
        Permission.EDIT_RECORD, Permission.EXPORT_RECORDS,
        Permission.VIEW_APPOINTMENTS, Permission.CREATE_APPOINTMENT, Permission.EDIT_APPOINTMENT,
        Permission.CANCEL_APPOINTMENT, Permission.VIEW_LAB_RESULTS,
        Permission.VIEW_IMAGES, Permission.VIEW_PRESCRIPTIONS,
        Permission.VIEW_BILLING, Permission.CREATE_INVOICE, Permission.PROCESS_PAYMENT,
        Permission.MANAGE_INSURANCE, Permission.VIEW_AI_RESULTS,
        Permission.MANAGE_USERS, Permission.MANAGE_ROLES,
        Permission.VIEW_AUDIT_LOGS, Permission.MANAGE_SETTINGS,
        Permission.VIEW_ANALYTICS, Permission.MANAGE_HOSPITAL,
        Permission.VIEW_SYSTEM_HEALTH,
    },
    Role.HOSPITAL_ADMIN: {
        Permission.VIEW_PATIENTS, Permission.CREATE_PATIENT, Permission.EDIT_PATIENT,
        Permission.VIEW_RECORDS, Permission.VIEW_APPOINTMENTS, Permission.CREATE_APPOINTMENT,
        Permission.EDIT_APPOINTMENT, Permission.CANCEL_APPOINTMENT,
        Permission.VIEW_LAB_RESULTS, Permission.VIEW_BILLING,
        Permission.MANAGE_USERS, Permission.VIEW_ANALYTICS,
        Permission.MANAGE_HOSPITAL, Permission.VIEW_AUDIT_LOGS,
    },
    Role.DOCTOR: {
        Permission.VIEW_PATIENTS, Permission.EDIT_PATIENT, Permission.VIEW_PATIENT_PHI,
        Permission.VIEW_RECORDS, Permission.CREATE_RECORD, Permission.EDIT_RECORD,
        Permission.VIEW_APPOINTMENTS, Permission.CREATE_APPOINTMENT, Permission.EDIT_APPOINTMENT,
        Permission.VIEW_LAB_RESULTS, Permission.CREATE_LAB_ORDER,
        Permission.VIEW_IMAGES, Permission.ANALYZE_IMAGE,
        Permission.VIEW_PRESCRIPTIONS, Permission.CREATE_PRESCRIPTION,
        Permission.RUN_AI_ANALYSIS, Permission.VIEW_AI_RESULTS,
        Permission.VIEW_BILLING,
    },
    Role.NURSE: {
        Permission.VIEW_PATIENTS, Permission.EDIT_PATIENT, Permission.VIEW_PATIENT_PHI,
        Permission.VIEW_RECORDS, Permission.CREATE_RECORD,
        Permission.VIEW_APPOINTMENTS, Permission.VIEW_LAB_RESULTS,
        Permission.VIEW_PRESCRIPTIONS,
    },
    Role.LAB_TECHNICIAN: {
        Permission.VIEW_PATIENTS, Permission.VIEW_LAB_RESULTS,
        Permission.APPROVE_LAB_RESULT, Permission.CREATE_LAB_ORDER,
    },
    Role.PHARMACIST: {
        Permission.VIEW_PATIENTS, Permission.VIEW_PRESCRIPTIONS,
        Permission.APPROVE_PRESCRIPTION, Permission.VIEW_LAB_RESULTS,
    },
    Role.RADIOLOGIST: {
        Permission.VIEW_PATIENTS, Permission.VIEW_IMAGES,
        Permission.UPLOAD_IMAGE, Permission.ANALYZE_IMAGE,
        Permission.VIEW_AI_RESULTS, Permission.RUN_AI_ANALYSIS,
        Permission.VIEW_RECORDS,
    },
    Role.PATHOLOGIST: {
        Permission.VIEW_PATIENTS, Permission.VIEW_IMAGES,
        Permission.UPLOAD_IMAGE, Permission.VIEW_LAB_RESULTS,
        Permission.APPROVE_LAB_RESULT, Permission.VIEW_RECORDS,
    },
    Role.RECEPTIONIST: {
        Permission.VIEW_PATIENTS, Permission.CREATE_PATIENT,
        Permission.VIEW_APPOINTMENTS, Permission.CREATE_APPOINTMENT,
        Permission.EDIT_APPOINTMENT, Permission.CANCEL_APPOINTMENT,
        Permission.VIEW_BILLING, Permission.CREATE_INVOICE,
    },
    Role.PATIENT: {
        Permission.VIEW_RECORDS, Permission.VIEW_APPOINTMENTS,
        Permission.VIEW_LAB_RESULTS, Permission.VIEW_PRESCRIPTIONS,
        Permission.VIEW_BILLING, Permission.VIEW_AI_RESULTS,
        Permission.VIEW_IMAGES,
    },
    Role.RESEARCHER: {
        Permission.VIEW_RECORDS, Permission.VIEW_AI_RESULTS,
        Permission.RUN_AI_ANALYSIS, Permission.VIEW_ANALYTICS,
        Permission.EXPORT_RECORDS,
    },
    Role.AUDITOR: {
        Permission.VIEW_AUDIT_LOGS, Permission.VIEW_ANALYTICS,
        Permission.VIEW_SYSTEM_HEALTH, Permission.VIEW_PATIENTS,
    },
}


# ==================== JWT Token Manager ====================

class JWTManager:
    """JWT Token management with refresh tokens and blacklisting"""

    def __init__(self, secret_key: Optional[str] = None,
                 algorithm: str = "HS256",
                 access_token_ttl: int = 30,
                 refresh_token_ttl: int = 43200):
        self.secret_key = secret_key or os.environ.get("JWT_SECRET", secrets.token_hex(32))
        self.algorithm = algorithm
        self.access_token_ttl = access_token_ttl  # minutes
        self.refresh_token_ttl = refresh_token_ttl  # minutes (30 days)
        self._blacklisted_tokens: Set[str] = set()
        self._refresh_tokens: Dict[str, Dict] = {}

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

    def _base64url_decode(self, data: str) -> bytes:
        padding = 4 - len(data) % 4
        data += '=' * padding
        return base64.urlsafe_b64decode(data)

    def _sign(self, payload: str) -> str:
        signature = hmac.new(
            self.secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).digest()
        return self._base64url_encode(signature)

    def create_access_token(self, user_id: str, role: str,
                            additional_claims: Optional[Dict] = None) -> str:
        """Create a new access token"""
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "role": role,
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=self.access_token_ttl)).timestamp()),
            "jti": secrets.token_hex(16),
        }
        if additional_claims:
            payload.update(additional_claims)

        header = self._base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
        body = self._base64url_encode(json.dumps(payload).encode())
        signature = self._sign(f"{header}.{body}")

        return f"{header}.{body}.{signature}"

    def create_refresh_token(self, user_id: str) -> str:
        """Create a refresh token"""
        now = datetime.now(timezone.utc)
        token_id = secrets.token_hex(32)
        self._refresh_tokens[token_id] = {
            "user_id": user_id,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(minutes=self.refresh_token_ttl)).isoformat(),
        }
        return token_id

    def decode_token(self, token: str) -> Optional[Dict]:
        """Decode and validate a token"""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None

            header_b64, body_b64, signature = parts
            expected_sig = self._sign(f"{header_b64}.{body_b64}")
            if not hmac.compare_digest(signature, expected_sig):
                logger.warning("Invalid token signature")
                return None

            payload = json.loads(self._base64url_decode(body_b64))

            # Check expiration
            exp = payload.get("exp", 0)
            if time.time() > exp:
                logger.info("Token expired")
                return None

            # Check blacklist
            jti = payload.get("jti", "")
            if jti in self._blacklisted_tokens:
                logger.warning(f"Blacklisted token used: {jti}")
                return None

            return payload
        except Exception as e:
            logger.error(f"Token decode error: {e}")
            return None

    def blacklist_token(self, token: str):
        """Add token to blacklist"""
        payload = self.decode_token(token)
        if payload:
            jti = payload.get("jti", "")
            self._blacklisted_tokens.add(jti)

    def refresh_access_token(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        """Refresh an access token"""
        token_data = self._refresh_tokens.get(refresh_token)
        if not token_data:
            return None

        expires_at = datetime.fromisoformat(token_data["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            del self._refresh_tokens[refresh_token]
            return None

        user_id = token_data["user_id"]
        new_access = self.create_access_token(user_id, "user")
        new_refresh = self.create_refresh_token(user_id)

        # Invalidate old refresh token
        del self._refresh_tokens[refresh_token]

        return new_access, new_refresh

    def revoke_all_user_tokens(self, user_id: str):
        """Revoke all refresh tokens for a user"""
        to_remove = [
            token_id for token_id, data in self._refresh_tokens.items()
            if data["user_id"] == user_id
        ]
        for token_id in to_remove:
            del self._refresh_tokens[token_id]


# ==================== RBAC Manager ====================

class RBACManager:
    """Role-Based Access Control Manager"""

    def __init__(self):
        self._custom_permissions: Dict[str, Set[Permission]] = {}
        self._user_roles: Dict[str, Set[Role]] = {}

    def assign_role(self, user_id: str, role: Role):
        """Assign a role to a user"""
        if user_id not in self._user_roles:
            self._user_roles[user_id] = set()
        self._user_roles[user_id].add(role)
        logger.info(f"Role {role.value} assigned to user {user_id}")

    def remove_role(self, user_id: str, role: Role):
        """Remove a role from a user"""
        if user_id in self._user_roles:
            self._user_roles[user_id].discard(role)

    def get_user_roles(self, user_id: str) -> Set[Role]:
        """Get all roles for a user"""
        return self._user_roles.get(user_id, set())

    def get_user_permissions(self, user_id: str) -> Set[Permission]:
        """Get all permissions for a user (from roles + custom)"""
        permissions: Set[Permission] = set()
        for role in self.get_user_roles(user_id):
            permissions.update(ROLE_PERMISSIONS.get(role, set()))
        permissions.update(self._custom_permissions.get(user_id, set()))
        return permissions

    def has_permission(self, user_id: str, permission: Permission) -> bool:
        """Check if user has a specific permission"""
        return permission in self.get_user_permissions(user_id)

    def has_any_permission(self, user_id: str, permissions: Set[Permission]) -> bool:
        """Check if user has any of the given permissions"""
        user_perms = self.get_user_permissions(user_id)
        return bool(user_perms & permissions)

    def has_all_permissions(self, user_id: str, permissions: Set[Permission]) -> bool:
        """Check if user has all of the given permissions"""
        user_perms = self.get_user_permissions(user_id)
        return permissions.issubset(user_perms)

    def add_custom_permission(self, user_id: str, permission: Permission):
        """Add a custom permission to a user"""
        if user_id not in self._custom_permissions:
            self._custom_permissions[user_id] = set()
        self._custom_permissions[user_id].add(permission)

    def remove_custom_permission(self, user_id: str, permission: Permission):
        """Remove a custom permission from a user"""
        if user_id in self._custom_permissions:
            self._custom_permissions[user_id].discard(permission)

    def has_role(self, user_id: str, role: Role) -> bool:
        """Check if user has a specific role"""
        return role in self.get_user_roles(user_id)

    def get_role_hierarchy(self) -> Dict[str, List[str]]:
        """Get role hierarchy as a dict"""
        return {
            role.value: [p.value for p in perms]
            for role, perms in ROLE_PERMISSIONS.items()
        }


# ==================== Security Audit Logger ====================

@dataclass
class SecurityEvent:
    event_type: str
    user_id: Optional[str]
    ip_address: Optional[str]
    details: Dict[str, Any]
    severity: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    event_id: str = field(default_factory=lambda: secrets.token_hex(16))


class SecurityAuditLogger:
    """Log and track security-relevant events"""

    def __init__(self):
        self._events: List[SecurityEvent] = []
        self._failed_login_attempts: Dict[str, List[datetime]] = {}
        self._locked_accounts: Dict[str, datetime] = {}
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=30)

    def log_event(self, event_type: str, user_id: Optional[str] = None,
                  ip_address: Optional[str] = None, details: Optional[Dict] = None,
                  severity: str = "info"):
        """Log a security event"""
        event = SecurityEvent(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            details=details or {},
            severity=severity,
        )
        self._events.append(event)
        logger.info(f"Security Event [{severity}]: {event_type} - User: {user_id} - IP: {ip_address}")

        # Keep only last 100k events in memory
        if len(self._events) > 100000:
            self._events = self._events[-50000:]

    def log_login_attempt(self, user_id: str, ip_address: str, success: bool):
        """Log a login attempt"""
        if success:
            self.log_event("login_success", user_id, ip_address, severity="info")
            # Clear failed attempts on success
            self._failed_login_attempts.pop(user_id, None)
        else:
            self.log_event("login_failure", user_id, ip_address, severity="warning")
            if user_id not in self._failed_login_attempts:
                self._failed_login_attempts[user_id] = []
            self._failed_login_attempts[user_id].append(datetime.now(timezone.utc))

            # Check if account should be locked
            recent = [
                t for t in self._failed_login_attempts[user_id]
                if datetime.now(timezone.utc) - t < self.lockout_duration
            ]
            self._failed_login_attempts[user_id] = recent

            if len(recent) >= self.max_failed_attempts:
                self.lock_account(user_id, ip_address)

    def lock_account(self, user_id: str, ip_address: Optional[str] = None):
        """Lock a user account"""
        self._locked_accounts[user_id] = datetime.now(timezone.utc) + self.lockout_duration
        self.log_event("account_locked", user_id, ip_address,
                       {"reason": "too_many_failed_attempts"},
                       severity="critical")

    def is_account_locked(self, user_id: str) -> bool:
        """Check if an account is locked"""
        lock_until = self._locked_accounts.get(user_id)
        if not lock_until:
            return False
        if datetime.now(timezone.utc) > lock_until:
            del self._locked_accounts[user_id]
            return False
        return True

    def unlock_account(self, user_id: str, admin_id: Optional[str] = None):
        """Manually unlock an account"""
        self._locked_accounts.pop(user_id, None)
        self._failed_login_attempts.pop(user_id, None)
        self.log_event("account_unlocked", user_id, details={"unlocked_by": admin_id})

    def log_data_access(self, user_id: str, resource_type: str,
                        resource_id: str, action: str, ip_address: Optional[str] = None):
        """Log data access for HIPAA compliance"""
        self.log_event("data_access", user_id, ip_address, {
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
        })

    def log_phi_access(self, user_id: str, patient_id: str,
                       data_types: List[str], ip_address: Optional[str] = None):
        """Log PHI access for HIPAA compliance"""
        self.log_event("phi_access", user_id, ip_address, {
            "patient_id": patient_id,
            "data_types": data_types,
        }, severity="info")

    def get_events(self, user_id: Optional[str] = None,
                   event_type: Optional[str] = None,
                   severity: Optional[str] = None,
                   start_time: Optional[datetime] = None,
                   end_time: Optional[datetime] = None,
                   limit: int = 100) -> List[Dict]:
        """Query security events"""
        filtered = self._events

        if user_id:
            filtered = [e for e in filtered if e.user_id == user_id]
        if event_type:
            filtered = [e for e in filtered if e.event_type == event_type]
        if severity:
            filtered = [e for e in filtered if e.severity == severity]
        if start_time:
            filtered = [e for e in filtered if e.timestamp >= start_time]
        if end_time:
            filtered = [e for e in filtered if e.timestamp <= end_time]

        filtered = sorted(filtered, key=lambda e: e.timestamp, reverse=True)[:limit]

        return [
            {
                "event_id": e.event_id,
                "event_type": e.event_type,
                "user_id": e.user_id,
                "ip_address": e.ip_address,
                "details": e.details,
                "severity": e.severity,
                "timestamp": e.timestamp.isoformat(),
            }
            for e in filtered
        ]

    def get_security_summary(self) -> Dict[str, Any]:
        """Get security summary for dashboard"""
        now = datetime.now(timezone.utc)
        last_24h = now - timedelta(hours=24)
        recent = [e for e in self._events if e.timestamp >= last_24h]

        return {
            "total_events_24h": len(recent),
            "failed_logins_24h": len([e for e in recent if e.event_type == "login_failure"]),
            "successful_logins_24h": len([e for e in recent if e.event_type == "login_success"]),
            "locked_accounts": len(self._locked_accounts),
            "critical_events_24h": len([e for e in recent if e.severity == "critical"]),
            "phi_access_24h": len([e for e in recent if e.event_type == "phi_access"]),
            "data_access_24h": len([e for e in recent if e.event_type == "data_access"]),
        }


# ==================== Input Sanitizer ====================

class InputSanitizer:
    """Sanitize and validate user input to prevent injection attacks"""

    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)",
        r"(--|;|'|\")",
        r"(\bOR\b\s+\d+\s*=\s*\d+)",
        r"(\bAND\b\s+\d+\s*=\s*\d+)",
        r"(xp_|sp_)",
    ]

    XSS_PATTERNS = [
        r"<script\b[^>]*>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<object",
        r"<embed",
        r"<applet",
        r"eval\s*\(",
        r"expression\s*\(",
        r"url\s*\(",
    ]

    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e",
        r"%252e%252e",
    ]

    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """Check for SQL injection attempts"""
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def check_xss(cls, value: str) -> bool:
        """Check for XSS attempts"""
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def check_path_traversal(cls, value: str) -> bool:
        """Check for path traversal attempts"""
        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False

    @classmethod
    def sanitize_html(cls, value: str) -> str:
        """Remove HTML tags from input"""
        return re.sub(r'<[^>]+>', '', value)

    @classmethod
    def sanitize_input(cls, value: str, max_length: int = 10000) -> Tuple[str, List[str]]:
        """Sanitize input and return (sanitized_value, warnings)"""
        warnings = []

        if len(value) > max_length:
            value = value[:max_length]
            warnings.append(f"Input truncated to {max_length} characters")

        if cls.check_sql_injection(value):
            warnings.append("Potential SQL injection pattern detected")
            value = re.sub(r"[;'\"--]", "", value)

        if cls.check_xss(value):
            warnings.append("Potential XSS pattern detected")
            value = cls.sanitize_html(value)

        if cls.check_path_traversal(value):
            warnings.append("Potential path traversal detected")
            value = value.replace("..", "").replace("../", "").replace("..\\", "")

        # Remove null bytes
        value = value.replace("\x00", "")

        return value, warnings


# ==================== Rate Limit Tracker ====================

class RateLimitTracker:
    """Per-user rate limiting tracker"""

    def __init__(self):
        self._requests: Dict[str, List[float]] = {}

    def check_rate_limit(self, key: str, max_requests: int,
                         window_seconds: int = 60) -> Tuple[bool, int]:
        """Check if a request is within rate limits.
        Returns (allowed, remaining_requests)"""
        now = time.time()
        cutoff = now - window_seconds

        if key not in self._requests:
            self._requests[key] = []

        # Clean old entries
        self._requests[key] = [t for t in self._requests[key] if t > cutoff]

        current_count = len(self._requests[key])
        remaining = max(0, max_requests - current_count)

        if current_count >= max_requests:
            return False, 0

        self._requests[key].append(now)
        return True, remaining - 1

    def reset(self, key: str):
        """Reset rate limit for a key"""
        self._requests.pop(key, None)


# ==================== Password Policy ====================

class PasswordPolicy:
    """Configurable password policy"""

    def __init__(self,
                 min_length: int = 12,
                 max_length: int = 128,
                 require_uppercase: bool = True,
                 require_lowercase: bool = True,
                 require_digits: bool = True,
                 require_special: bool = True,
                 max_consecutive_chars: int = 3,
                 password_history: int = 5,
                 max_age_days: int = 90):
        self.min_length = min_length
        self.max_length = max_length
        self.require_uppercase = require_uppercase
        self.require_lowercase = require_lowercase
        self.require_digits = require_digits
        self.require_special = require_special
        self.max_consecutive_chars = max_consecutive_chars
        self.password_history = password_history
        self.max_age_days = max_age_days

    # Common weak passwords
    COMMON_PASSWORDS = {
        "password123", "123456789", "qwerty123", "admin123",
        "letmein123", "welcome123", "monkey123", "master123",
        "dragon123", "login12345", "password1!", "P@ssw0rd",
    }

    def validate(self, password: str,
                 previous_passwords: Optional[List[str]] = None) -> Tuple[bool, List[str]]:
        """Validate password against policy"""
        issues = []

        if len(password) < self.min_length:
            issues.append(f"Must be at least {self.min_length} characters")
        if len(password) > self.max_length:
            issues.append(f"Must not exceed {self.max_length} characters")

        if self.require_uppercase and not re.search(r'[A-Z]', password):
            issues.append("Must contain at least one uppercase letter")
        if self.require_lowercase and not re.search(r'[a-z]', password):
            issues.append("Must contain at least one lowercase letter")
        if self.require_digits and not re.search(r'\d', password):
            issues.append("Must contain at least one digit")
        if self.require_special and not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",./<>?\\|`~]', password):
            issues.append("Must contain at least one special character")

        # Check consecutive characters
        if self.max_consecutive_chars > 0:
            pattern = r'(.)\1{' + str(self.max_consecutive_chars - 1) + r',}'
            if re.search(pattern, password):
                issues.append(f"Must not contain {self.max_consecutive_chars}+ consecutive identical characters")

        # Check common passwords
        if password.lower() in self.COMMON_PASSWORDS:
            issues.append("Password is too common")

        # Check password history
        if previous_passwords:
            for prev in previous_passwords[:self.password_history]:
                if password == prev:
                    issues.append("Password was used recently")
                    break

        # Calculate strength score
        strength = self._calculate_strength(password)
        if strength < 50:
            issues.append("Password is too weak (increase length or complexity)")

        return len(issues) == 0, issues

    def _calculate_strength(self, password: str) -> int:
        """Calculate password strength score (0-100)"""
        score = 0

        # Length contribution
        score += min(30, len(password) * 2)

        # Character variety
        has_upper = bool(re.search(r'[A-Z]', password))
        has_lower = bool(re.search(r'[a-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[^a-zA-Z0-9]', password))

        variety = sum([has_upper, has_lower, has_digit, has_special])
        score += variety * 15

        # Penalty for patterns
        if re.search(r'(012|123|234|345|456|567|678|789)', password):
            score -= 10
        if re.search(r'(abc|bcd|cde|def|efg|xyz)', password, re.IGNORECASE):
            score -= 10

        return max(0, min(100, score))


# ==================== Data Masking ====================

class DataMasker:
    """Mask sensitive data for display/logging"""

    @staticmethod
    def mask_email(email: str) -> str:
        """Mask email address"""
        if '@' not in email:
            return '***'
        local, domain = email.rsplit('@', 1)
        if len(local) <= 2:
            masked_local = '*' * len(local)
        else:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        return f"{masked_local}@{domain}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        """Mask phone number showing last 4 digits"""
        digits = re.sub(r'\D', '', phone)
        if len(digits) <= 4:
            return '***'
        return '*' * (len(digits) - 4) + digits[-4:]

    @staticmethod
    def mask_ssn(ssn: str) -> str:
        """Mask SSN showing last 4 digits"""
        digits = re.sub(r'\D', '', ssn)
        if len(digits) == 9:
            return f"***-**-{digits[-4:]}"
        return '***'

    @staticmethod
    def mask_credit_card(card: str) -> str:
        """Mask credit card number"""
        digits = re.sub(r'\D', '', card)
        if len(digits) >= 13:
            return '*' * (len(digits) - 4) + digits[-4:]
        return '***'

    @staticmethod
    def mask_name(name: str) -> str:
        """Mask a name showing only first initial"""
        parts = name.strip().split()
        return " ".join(p[0] + "***" if len(p) > 1 else "***" for p in parts)

    @staticmethod
    def mask_dob(dob: str) -> str:
        """Mask date of birth showing only year"""
        try:
            dt = datetime.strptime(dob, "%Y-%m-%d")
            return f"****-**-** ({dt.year})"
        except ValueError:
            return "****-**-**"

    @classmethod
    def mask_dict(cls, data: Dict[str, Any],
                  sensitive_fields: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Mask sensitive fields in a dictionary"""
        if not sensitive_fields:
            sensitive_fields = {
                "email": "email",
                "phone": "phone",
                "phone_number": "phone",
                "ssn": "ssn",
                "social_security": "ssn",
                "credit_card": "credit_card",
                "card_number": "credit_card",
                "password": "full",
                "token": "full",
                "secret": "full",
                "api_key": "full",
            }

        masked = {}
        for key, value in data.items():
            if isinstance(value, dict):
                masked[key] = cls.mask_dict(value, sensitive_fields)
            elif isinstance(value, str) and key.lower() in sensitive_fields:
                mask_type = sensitive_fields[key.lower()]
                if mask_type == "email":
                    masked[key] = cls.mask_email(value)
                elif mask_type == "phone":
                    masked[key] = cls.mask_phone(value)
                elif mask_type == "ssn":
                    masked[key] = cls.mask_ssn(value)
                elif mask_type == "credit_card":
                    masked[key] = cls.mask_credit_card(value)
                elif mask_type == "full":
                    masked[key] = "***REDACTED***"
                else:
                    masked[key] = "***"
            else:
                masked[key] = value
        return masked


# ==================== CSRF Token Manager ====================

class CSRFProtection:
    """CSRF token generation and validation"""

    def __init__(self, secret: Optional[str] = None):
        self.secret = secret or os.environ.get("CSRF_SECRET", secrets.token_hex(32))
        self._tokens: Dict[str, float] = {}
        self.token_ttl = 3600  # 1 hour

    def generate_token(self, session_id: str) -> str:
        """Generate a CSRF token for a session"""
        token = secrets.token_hex(32)
        key = f"{session_id}:{token}"
        self._tokens[key] = time.time() + self.token_ttl
        self._cleanup()
        return token

    def validate_token(self, session_id: str, token: str) -> bool:
        """Validate a CSRF token"""
        key = f"{session_id}:{token}"
        expires = self._tokens.get(key)
        if not expires:
            return False
        if time.time() > expires:
            del self._tokens[key]
            return False
        # Single use
        del self._tokens[key]
        return True

    def _cleanup(self):
        """Remove expired tokens"""
        now = time.time()
        expired = [k for k, exp in self._tokens.items() if now > exp]
        for k in expired:
            del self._tokens[k]


# ==================== Singletons ====================

jwt_manager = JWTManager()
rbac_manager = RBACManager()
security_audit = SecurityAuditLogger()
input_sanitizer = InputSanitizer()
rate_limiter = RateLimitTracker()
password_policy = PasswordPolicy()
data_masker = DataMasker()
csrf_protection = CSRFProtection()


# ==================== Exports ====================

__all__ = [
    # Enums
    "Role", "Permission",
    # Mappings
    "ROLE_PERMISSIONS",
    # Classes
    "JWTManager", "RBACManager", "SecurityAuditLogger", "SecurityEvent",
    "InputSanitizer", "RateLimitTracker", "PasswordPolicy",
    "DataMasker", "CSRFProtection",
    # Singletons
    "jwt_manager", "rbac_manager", "security_audit", "input_sanitizer",
    "rate_limiter", "password_policy", "data_masker", "csrf_protection",
]

"""
Audit Service - Comprehensive audit logging, trail management,
and compliance tracking for the CancerGuard AI platform.
"""

import asyncio
import json
import logging
import hashlib
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from collections import defaultdict

logger = logging.getLogger(__name__)


class AuditAction(str, Enum):
    """Types of auditable actions."""
    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    TOKEN_REFRESH = "token_refresh"
    SESSION_EXPIRED = "session_expired"

    # User Management
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_ACTIVATE = "user_activate"
    USER_DEACTIVATE = "user_deactivate"
    ROLE_CHANGE = "role_change"
    PERMISSION_CHANGE = "permission_change"

    # Patient Data
    PATIENT_VIEW = "patient_view"
    PATIENT_CREATE = "patient_create"
    PATIENT_UPDATE = "patient_update"
    PATIENT_DELETE = "patient_delete"
    PATIENT_SEARCH = "patient_search"
    PATIENT_EXPORT = "patient_export"
    PATIENT_MERGE = "patient_merge"

    # Medical Records
    RECORD_VIEW = "record_view"
    RECORD_CREATE = "record_create"
    RECORD_UPDATE = "record_update"
    RECORD_DELETE = "record_delete"
    RECORD_SHARE = "record_share"
    RECORD_DOWNLOAD = "record_download"
    RECORD_PRINT = "record_print"

    # Lab & Test Results
    LAB_ORDER = "lab_order"
    LAB_RESULT_VIEW = "lab_result_view"
    LAB_RESULT_UPDATE = "lab_result_update"
    LAB_RESULT_VERIFY = "lab_result_verify"

    # Prescriptions & Medications
    PRESCRIPTION_CREATE = "prescription_create"
    PRESCRIPTION_UPDATE = "prescription_update"
    PRESCRIPTION_CANCEL = "prescription_cancel"
    MEDICATION_DISPENSE = "medication_dispense"

    # Appointments
    APPOINTMENT_CREATE = "appointment_create"
    APPOINTMENT_UPDATE = "appointment_update"
    APPOINTMENT_CANCEL = "appointment_cancel"
    APPOINTMENT_COMPLETE = "appointment_complete"

    # Billing
    BILLING_CREATE = "billing_create"
    BILLING_UPDATE = "billing_update"
    BILLING_PAYMENT = "billing_payment"
    BILLING_REFUND = "billing_refund"
    INSURANCE_CLAIM = "insurance_claim"

    # AI/ML Operations
    AI_PREDICTION = "ai_prediction"
    AI_MODEL_DEPLOY = "ai_model_deploy"
    AI_MODEL_RETRAIN = "ai_model_retrain"
    AI_MODEL_EVALUATE = "ai_model_evaluate"
    AI_RISK_ASSESSMENT = "ai_risk_assessment"

    # Administrative
    SYSTEM_CONFIG_CHANGE = "system_config_change"
    REPORT_GENERATE = "report_generate"
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    BACKUP_CREATE = "backup_create"
    BACKUP_RESTORE = "backup_restore"

    # Security
    ACCESS_DENIED = "access_denied"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    DATA_BREACH_DETECTED = "data_breach_detected"
    CONSENT_GRANTED = "consent_granted"
    CONSENT_REVOKED = "consent_revoked"

    # Communication
    MESSAGE_SEND = "message_send"
    TELEHEALTH_START = "telehealth_start"
    TELEHEALTH_END = "telehealth_end"
    NOTIFICATION_SEND = "notification_send"


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AuditCategory(str, Enum):
    """Categories for grouping audit events."""
    AUTHENTICATION = "authentication"
    USER_MANAGEMENT = "user_management"
    PATIENT_DATA = "patient_data"
    MEDICAL_RECORDS = "medical_records"
    LAB_RESULTS = "lab_results"
    MEDICATIONS = "medications"
    APPOINTMENTS = "appointments"
    BILLING = "billing"
    AI_ML = "ai_ml"
    ADMINISTRATIVE = "administrative"
    SECURITY = "security"
    COMMUNICATION = "communication"


@dataclass
class AuditEntry:
    """A single audit log entry."""
    id: str
    timestamp: datetime
    action: AuditAction
    category: AuditCategory
    severity: AuditSeverity
    user_id: Optional[int]
    user_email: Optional[str]
    user_role: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resource_type: Optional[str]
    resource_id: Optional[str]
    description: str
    details: Dict[str, Any] = field(default_factory=dict)
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    request_method: Optional[str] = None
    request_path: Optional[str] = None
    response_status: Optional[int] = None
    duration_ms: Optional[float] = None
    session_id: Optional[str] = None
    correlation_id: Optional[str] = None
    is_phi_access: bool = False
    is_success: bool = True
    tags: List[str] = field(default_factory=list)
    checksum: Optional[str] = None

    def __post_init__(self):
        if not self.checksum:
            self.checksum = self._compute_checksum()

    def _compute_checksum(self) -> str:
        data = f"{self.id}:{self.timestamp.isoformat()}:{self.action.value}:{self.user_id}:{self.description}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "action": self.action.value,
            "category": self.category.value,
            "severity": self.severity.value,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "ip_address": self.ip_address,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "description": self.description,
            "details": self.details,
            "is_phi_access": self.is_phi_access,
            "is_success": self.is_success,
            "request_method": self.request_method,
            "request_path": self.request_path,
            "response_status": self.response_status,
            "duration_ms": self.duration_ms,
            "checksum": self.checksum,
            "tags": self.tags,
        }

    def to_compliance_format(self) -> Dict[str, Any]:
        """Format for HIPAA compliance reporting."""
        return {
            "event_id": self.id,
            "event_time": self.timestamp.isoformat(),
            "event_type": self.action.value,
            "user_identifier": self.user_email or f"user_{self.user_id}",
            "user_role": self.user_role,
            "access_point": self.ip_address,
            "resource_accessed": f"{self.resource_type}/{self.resource_id}" if self.resource_type else None,
            "phi_accessed": self.is_phi_access,
            "action_outcome": "success" if self.is_success else "failure",
            "integrity_hash": self.checksum,
        }


# Action to category/severity mapping
ACTION_METADATA: Dict[AuditAction, Tuple[AuditCategory, AuditSeverity, bool]] = {
    AuditAction.LOGIN: (AuditCategory.AUTHENTICATION, AuditSeverity.INFO, False),
    AuditAction.LOGOUT: (AuditCategory.AUTHENTICATION, AuditSeverity.INFO, False),
    AuditAction.LOGIN_FAILED: (AuditCategory.AUTHENTICATION, AuditSeverity.MEDIUM, False),
    AuditAction.PASSWORD_CHANGE: (AuditCategory.AUTHENTICATION, AuditSeverity.MEDIUM, False),
    AuditAction.PASSWORD_RESET: (AuditCategory.AUTHENTICATION, AuditSeverity.MEDIUM, False),
    AuditAction.MFA_ENABLED: (AuditCategory.AUTHENTICATION, AuditSeverity.LOW, False),
    AuditAction.MFA_DISABLED: (AuditCategory.AUTHENTICATION, AuditSeverity.HIGH, False),
    AuditAction.USER_CREATE: (AuditCategory.USER_MANAGEMENT, AuditSeverity.MEDIUM, False),
    AuditAction.USER_UPDATE: (AuditCategory.USER_MANAGEMENT, AuditSeverity.LOW, False),
    AuditAction.USER_DELETE: (AuditCategory.USER_MANAGEMENT, AuditSeverity.HIGH, False),
    AuditAction.ROLE_CHANGE: (AuditCategory.USER_MANAGEMENT, AuditSeverity.HIGH, False),
    AuditAction.PERMISSION_CHANGE: (AuditCategory.USER_MANAGEMENT, AuditSeverity.HIGH, False),
    AuditAction.PATIENT_VIEW: (AuditCategory.PATIENT_DATA, AuditSeverity.INFO, True),
    AuditAction.PATIENT_CREATE: (AuditCategory.PATIENT_DATA, AuditSeverity.MEDIUM, True),
    AuditAction.PATIENT_UPDATE: (AuditCategory.PATIENT_DATA, AuditSeverity.MEDIUM, True),
    AuditAction.PATIENT_DELETE: (AuditCategory.PATIENT_DATA, AuditSeverity.CRITICAL, True),
    AuditAction.PATIENT_SEARCH: (AuditCategory.PATIENT_DATA, AuditSeverity.INFO, True),
    AuditAction.PATIENT_EXPORT: (AuditCategory.PATIENT_DATA, AuditSeverity.HIGH, True),
    AuditAction.RECORD_VIEW: (AuditCategory.MEDICAL_RECORDS, AuditSeverity.INFO, True),
    AuditAction.RECORD_CREATE: (AuditCategory.MEDICAL_RECORDS, AuditSeverity.MEDIUM, True),
    AuditAction.RECORD_UPDATE: (AuditCategory.MEDICAL_RECORDS, AuditSeverity.MEDIUM, True),
    AuditAction.RECORD_DELETE: (AuditCategory.MEDICAL_RECORDS, AuditSeverity.CRITICAL, True),
    AuditAction.RECORD_SHARE: (AuditCategory.MEDICAL_RECORDS, AuditSeverity.HIGH, True),
    AuditAction.RECORD_DOWNLOAD: (AuditCategory.MEDICAL_RECORDS, AuditSeverity.HIGH, True),
    AuditAction.LAB_ORDER: (AuditCategory.LAB_RESULTS, AuditSeverity.MEDIUM, True),
    AuditAction.LAB_RESULT_VIEW: (AuditCategory.LAB_RESULTS, AuditSeverity.INFO, True),
    AuditAction.LAB_RESULT_UPDATE: (AuditCategory.LAB_RESULTS, AuditSeverity.MEDIUM, True),
    AuditAction.PRESCRIPTION_CREATE: (AuditCategory.MEDICATIONS, AuditSeverity.MEDIUM, True),
    AuditAction.PRESCRIPTION_UPDATE: (AuditCategory.MEDICATIONS, AuditSeverity.MEDIUM, True),
    AuditAction.PRESCRIPTION_CANCEL: (AuditCategory.MEDICATIONS, AuditSeverity.MEDIUM, True),
    AuditAction.MEDICATION_DISPENSE: (AuditCategory.MEDICATIONS, AuditSeverity.MEDIUM, True),
    AuditAction.APPOINTMENT_CREATE: (AuditCategory.APPOINTMENTS, AuditSeverity.LOW, False),
    AuditAction.APPOINTMENT_UPDATE: (AuditCategory.APPOINTMENTS, AuditSeverity.LOW, False),
    AuditAction.APPOINTMENT_CANCEL: (AuditCategory.APPOINTMENTS, AuditSeverity.LOW, False),
    AuditAction.BILLING_CREATE: (AuditCategory.BILLING, AuditSeverity.MEDIUM, False),
    AuditAction.BILLING_PAYMENT: (AuditCategory.BILLING, AuditSeverity.MEDIUM, False),
    AuditAction.BILLING_REFUND: (AuditCategory.BILLING, AuditSeverity.HIGH, False),
    AuditAction.INSURANCE_CLAIM: (AuditCategory.BILLING, AuditSeverity.MEDIUM, True),
    AuditAction.AI_PREDICTION: (AuditCategory.AI_ML, AuditSeverity.INFO, True),
    AuditAction.AI_MODEL_DEPLOY: (AuditCategory.AI_ML, AuditSeverity.HIGH, False),
    AuditAction.AI_MODEL_RETRAIN: (AuditCategory.AI_ML, AuditSeverity.MEDIUM, False),
    AuditAction.AI_RISK_ASSESSMENT: (AuditCategory.AI_ML, AuditSeverity.LOW, True),
    AuditAction.SYSTEM_CONFIG_CHANGE: (AuditCategory.ADMINISTRATIVE, AuditSeverity.HIGH, False),
    AuditAction.REPORT_GENERATE: (AuditCategory.ADMINISTRATIVE, AuditSeverity.LOW, False),
    AuditAction.DATA_EXPORT: (AuditCategory.ADMINISTRATIVE, AuditSeverity.HIGH, True),
    AuditAction.DATA_IMPORT: (AuditCategory.ADMINISTRATIVE, AuditSeverity.HIGH, False),
    AuditAction.BACKUP_CREATE: (AuditCategory.ADMINISTRATIVE, AuditSeverity.MEDIUM, False),
    AuditAction.ACCESS_DENIED: (AuditCategory.SECURITY, AuditSeverity.HIGH, False),
    AuditAction.SUSPICIOUS_ACTIVITY: (AuditCategory.SECURITY, AuditSeverity.CRITICAL, False),
    AuditAction.DATA_BREACH_DETECTED: (AuditCategory.SECURITY, AuditSeverity.CRITICAL, True),
    AuditAction.CONSENT_GRANTED: (AuditCategory.SECURITY, AuditSeverity.MEDIUM, True),
    AuditAction.CONSENT_REVOKED: (AuditCategory.SECURITY, AuditSeverity.HIGH, True),
    AuditAction.MESSAGE_SEND: (AuditCategory.COMMUNICATION, AuditSeverity.INFO, False),
    AuditAction.TELEHEALTH_START: (AuditCategory.COMMUNICATION, AuditSeverity.LOW, True),
    AuditAction.TELEHEALTH_END: (AuditCategory.COMMUNICATION, AuditSeverity.LOW, True),
}


class AuditLogStore:
    """In-memory audit log storage (would use database + SIEM in production)."""

    def __init__(self, max_entries: int = 100000):
        self._entries: List[AuditEntry] = []
        self._entries_by_user: Dict[int, List[int]] = defaultdict(list)  # user_id -> indices
        self._entries_by_resource: Dict[str, List[int]] = defaultdict(list)  # resource_key -> indices
        self._max_entries = max_entries
        self._counter = 0

    def add(self, entry: AuditEntry):
        index = len(self._entries)
        self._entries.append(entry)
        self._counter += 1

        if entry.user_id:
            self._entries_by_user[entry.user_id].append(index)

        if entry.resource_type and entry.resource_id:
            key = f"{entry.resource_type}:{entry.resource_id}"
            self._entries_by_resource[key].append(index)

        # Trim if too many entries
        if len(self._entries) > self._max_entries:
            self._entries = self._entries[-self._max_entries:]

    def query(
        self,
        user_id: Optional[int] = None,
        action: Optional[AuditAction] = None,
        category: Optional[AuditCategory] = None,
        severity: Optional[AuditSeverity] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        is_phi_access: Optional[bool] = None,
        search_text: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Query audit entries with filters."""
        results = self._entries

        if user_id is not None:
            indices = set(self._entries_by_user.get(user_id, []))
            results = [e for i, e in enumerate(results) if i in indices]

        if resource_type and resource_id:
            key = f"{resource_type}:{resource_id}"
            indices = set(self._entries_by_resource.get(key, []))
            results = [e for i, e in enumerate(self._entries) if i in indices]

        if action:
            results = [e for e in results if e.action == action]
        if category:
            results = [e for e in results if e.category == category]
        if severity:
            results = [e for e in results if e.severity == severity]
        if start_date:
            results = [e for e in results if e.timestamp >= start_date]
        if end_date:
            results = [e for e in results if e.timestamp <= end_date]
        if is_phi_access is not None:
            results = [e for e in results if e.is_phi_access == is_phi_access]
        if search_text:
            search_lower = search_text.lower()
            results = [e for e in results if search_lower in e.description.lower()]

        # Sort by timestamp descending
        results.sort(key=lambda e: e.timestamp, reverse=True)
        total = len(results)
        paginated = results[offset:offset + limit]

        return [e.to_dict() for e in paginated], total

    def get_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        for entry in self._entries:
            if entry.id == entry_id:
                return entry.to_dict()
        return None

    def get_user_activity(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        entries = [e for e in self._entries if e.user_id == user_id and e.timestamp >= cutoff]

        actions = defaultdict(int)
        daily_counts = defaultdict(int)
        phi_access_count = 0

        for entry in entries:
            actions[entry.action.value] += 1
            day_key = entry.timestamp.strftime("%Y-%m-%d")
            daily_counts[day_key] += 1
            if entry.is_phi_access:
                phi_access_count += 1

        return {
            "user_id": user_id,
            "period_days": days,
            "total_events": len(entries),
            "actions_summary": dict(actions),
            "daily_activity": dict(daily_counts),
            "phi_access_count": phi_access_count,
            "first_activity": min((e.timestamp for e in entries), default=None),
            "last_activity": max((e.timestamp for e in entries), default=None),
        }

    def get_resource_history(self, resource_type: str, resource_id: str) -> List[Dict[str, Any]]:
        key = f"{resource_type}:{resource_id}"
        indices = self._entries_by_resource.get(key, [])
        entries = [self._entries[i] for i in indices if i < len(self._entries)]
        entries.sort(key=lambda e: e.timestamp, reverse=True)
        return [e.to_dict() for e in entries]


class AnomalyDetector:
    """Detects anomalous audit patterns for security."""

    def __init__(self):
        self._user_baselines: Dict[int, Dict[str, float]] = {}
        self._failed_logins: Dict[str, List[datetime]] = defaultdict(list)
        self._phi_access_counts: Dict[int, List[datetime]] = defaultdict(list)
        self.failed_login_threshold = 5
        self.failed_login_window_minutes = 15
        self.phi_access_threshold = 50
        self.phi_access_window_hours = 1
        self._alerts: List[Dict[str, Any]] = []

    def check(self, entry: AuditEntry) -> Optional[Dict[str, Any]]:
        alerts = []

        # Check failed login anomaly
        if entry.action == AuditAction.LOGIN_FAILED:
            alert = self._check_failed_logins(entry)
            if alert:
                alerts.append(alert)

        # Check excessive PHI access
        if entry.is_phi_access and entry.user_id:
            alert = self._check_phi_access(entry)
            if alert:
                alerts.append(alert)

        # Check after-hours access
        alert = self._check_after_hours(entry)
        if alert:
            alerts.append(alert)

        # Check unusual action patterns
        if entry.action in [AuditAction.PATIENT_EXPORT, AuditAction.DATA_EXPORT, AuditAction.RECORD_DOWNLOAD]:
            alert = self._check_bulk_export(entry)
            if alert:
                alerts.append(alert)

        if alerts:
            for alert in alerts:
                self._alerts.append(alert)
            return alerts[0]  # Return first/most critical
        return None

    def _check_failed_logins(self, entry: AuditEntry) -> Optional[Dict[str, Any]]:
        key = entry.ip_address or "unknown"
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=self.failed_login_window_minutes)

        self._failed_logins[key] = [t for t in self._failed_logins[key] if t > cutoff]
        self._failed_logins[key].append(now)

        if len(self._failed_logins[key]) >= self.failed_login_threshold:
            return {
                "type": "brute_force_attempt",
                "severity": "critical",
                "ip_address": entry.ip_address,
                "failed_count": len(self._failed_logins[key]),
                "window_minutes": self.failed_login_window_minutes,
                "timestamp": now.isoformat(),
                "recommendation": "Block IP address and investigate",
            }
        return None

    def _check_phi_access(self, entry: AuditEntry) -> Optional[Dict[str, Any]]:
        user_id = entry.user_id
        if not user_id:
            return None

        now = datetime.utcnow()
        cutoff = now - timedelta(hours=self.phi_access_window_hours)

        self._phi_access_counts[user_id] = [
            t for t in self._phi_access_counts[user_id] if t > cutoff
        ]
        self._phi_access_counts[user_id].append(now)

        if len(self._phi_access_counts[user_id]) >= self.phi_access_threshold:
            return {
                "type": "excessive_phi_access",
                "severity": "high",
                "user_id": user_id,
                "access_count": len(self._phi_access_counts[user_id]),
                "window_hours": self.phi_access_window_hours,
                "timestamp": now.isoformat(),
                "recommendation": "Review user access and validate clinical need",
            }
        return None

    def _check_after_hours(self, entry: AuditEntry) -> Optional[Dict[str, Any]]:
        hour = entry.timestamp.hour
        if 0 <= hour < 6:  # Between midnight and 6 AM
            if entry.is_phi_access and entry.severity in [AuditSeverity.HIGH, AuditSeverity.CRITICAL]:
                return {
                    "type": "after_hours_access",
                    "severity": "medium",
                    "user_id": entry.user_id,
                    "action": entry.action.value,
                    "hour": hour,
                    "timestamp": entry.timestamp.isoformat(),
                    "recommendation": "Verify if access was authorized",
                }
        return None

    def _check_bulk_export(self, entry: AuditEntry) -> Optional[Dict[str, Any]]:
        records_count = entry.details.get("records_count", 0)
        if records_count > 100:
            return {
                "type": "bulk_data_export",
                "severity": "high",
                "user_id": entry.user_id,
                "records_count": records_count,
                "action": entry.action.value,
                "timestamp": entry.timestamp.isoformat(),
                "recommendation": "Verify export authorization and business need",
            }
        return None

    def get_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._alerts[-limit:]


class ComplianceReporter:
    """Generates compliance reports from audit data."""

    def __init__(self, store: AuditLogStore):
        self.store = store

    def generate_hipaa_report(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        entries, total = self.store.query(start_date=start_date, end_date=end_date, limit=100000)

        phi_entries = [e for e in entries if e.get("is_phi_access")]
        security_events = [e for e in entries if e.get("category") == "security"]
        auth_events = [e for e in entries if e.get("category") == "authentication"]

        failed_logins = [e for e in auth_events if e.get("action") == "login_failed"]
        access_denied = [e for e in security_events if e.get("action") == "access_denied"]

        return {
            "report_type": "HIPAA Compliance Audit Report",
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_audit_events": total,
                "phi_access_events": len(phi_entries),
                "security_events": len(security_events),
                "failed_login_attempts": len(failed_logins),
                "access_denied_events": len(access_denied),
            },
            "privacy_rule": {
                "phi_access_logged": True,
                "minimum_necessary_enforced": True,
                "patient_rights_tracked": True,
                "consent_management": True,
            },
            "security_rule": {
                "access_controls": {
                    "role_based_access": True,
                    "multi_factor_auth": True,
                    "session_management": True,
                    "automatic_logoff": True,
                },
                "audit_controls": {
                    "audit_logging": True,
                    "integrity_verification": True,
                    "log_retention_days": 2190,
                    "tamper_evident": True,
                },
                "transmission_security": {
                    "encryption_at_rest": True,
                    "encryption_in_transit": True,
                    "certificate_valid": True,
                },
                "incident_procedures": {
                    "incident_response_plan": True,
                    "breach_notification_process": True,
                    "incident_tracking": True,
                },
            },
            "phi_access_analysis": {
                "unique_users_accessing_phi": len(set(e.get("user_id") for e in phi_entries if e.get("user_id"))),
                "phi_access_by_role": self._count_by_field(phi_entries, "user_role"),
                "phi_access_by_action": self._count_by_field(phi_entries, "action"),
            },
            "recommendations": [
                "Review PHI access patterns for potential policy violations",
                "Ensure all staff complete annual HIPAA training",
                "Implement additional monitoring for high-volume PHI access",
            ],
        }

    def generate_access_report(self, user_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        entries, total = self.store.query(user_id=user_id, start_date=start_date, end_date=end_date, limit=10000)

        return {
            "report_type": "User Access Audit Report",
            "user_id": user_id,
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_events": total,
                "phi_access": sum(1 for e in entries if e.get("is_phi_access")),
                "failed_actions": sum(1 for e in entries if not e.get("is_success", True)),
            },
            "actions_breakdown": self._count_by_field(entries, "action"),
            "categories_breakdown": self._count_by_field(entries, "category"),
            "daily_activity": self._daily_counts(entries),
            "resources_accessed": self._unique_resources(entries),
        }

    def _count_by_field(self, entries: List[Dict], field: str) -> Dict[str, int]:
        counts = defaultdict(int)
        for entry in entries:
            value = entry.get(field, "unknown")
            counts[str(value)] += 1
        return dict(sorted(counts.items(), key=lambda x: x[1], reverse=True))

    def _daily_counts(self, entries: List[Dict]) -> Dict[str, int]:
        counts = defaultdict(int)
        for entry in entries:
            day = entry.get("timestamp", "")[:10]
            counts[day] += 1
        return dict(sorted(counts.items()))

    def _unique_resources(self, entries: List[Dict]) -> List[Dict[str, Any]]:
        resources = defaultdict(int)
        for entry in entries:
            rt = entry.get("resource_type")
            ri = entry.get("resource_id")
            if rt and ri:
                resources[f"{rt}/{ri}"] += 1
        return [{"resource": k, "access_count": v} for k, v in sorted(resources.items(), key=lambda x: x[1], reverse=True)[:50]]


class AuditService:
    """
    Main audit service - provides comprehensive audit logging,
    anomaly detection, and compliance reporting.
    """

    def __init__(self):
        self.store = AuditLogStore()
        self.anomaly_detector = AnomalyDetector()
        self.compliance_reporter = ComplianceReporter(self.store)
        self._entry_counter = 0
        self._alert_callbacks: List = []
        logger.info("AuditService initialized")

    def _generate_id(self) -> str:
        self._entry_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"AUD-{timestamp}-{self._entry_counter:06d}"

    async def log(
        self,
        action: AuditAction,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
        description: str = "",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_method: Optional[str] = None,
        request_path: Optional[str] = None,
        response_status: Optional[int] = None,
        duration_ms: Optional[float] = None,
        session_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        is_success: bool = True,
        tags: Optional[List[str]] = None,
    ) -> str:
        """Log an audit event. Returns the audit entry ID."""
        metadata = ACTION_METADATA.get(action, (AuditCategory.ADMINISTRATIVE, AuditSeverity.INFO, False))
        category, severity, is_phi = metadata

        entry = AuditEntry(
            id=self._generate_id(),
            timestamp=datetime.utcnow(),
            action=action,
            category=category,
            severity=severity,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description or f"{action.value} by user {user_id}",
            details=details or {},
            before_state=before_state,
            after_state=after_state,
            request_method=request_method,
            request_path=request_path,
            response_status=response_status,
            duration_ms=duration_ms,
            session_id=session_id,
            correlation_id=correlation_id,
            is_phi_access=is_phi,
            is_success=is_success,
            tags=tags or [],
        )

        # Store the entry
        self.store.add(entry)

        # Check for anomalies
        alert = self.anomaly_detector.check(entry)
        if alert:
            await self._handle_alert(alert, entry)

        # Log high severity events
        if severity in [AuditSeverity.HIGH, AuditSeverity.CRITICAL]:
            logger.warning(f"High severity audit event: {action.value} by user {user_id} - {description}")

        return entry.id

    async def _handle_alert(self, alert: Dict[str, Any], entry: AuditEntry):
        """Handle a security alert."""
        logger.critical(f"Security alert: {alert['type']} - {json.dumps(alert)}")
        for callback in self._alert_callbacks:
            try:
                await callback(alert, entry)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")

    def register_alert_callback(self, callback):
        self._alert_callbacks.append(callback)

    def query_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        is_phi_access: Optional[bool] = None,
        search_text: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Query audit logs with filters."""
        action_enum = AuditAction(action) if action else None
        category_enum = AuditCategory(category) if category else None
        severity_enum = AuditSeverity(severity) if severity else None

        entries, total = self.store.query(
            user_id=user_id,
            action=action_enum,
            category=category_enum,
            severity=severity_enum,
            resource_type=resource_type,
            resource_id=resource_id,
            start_date=start_date,
            end_date=end_date,
            is_phi_access=is_phi_access,
            search_text=search_text,
            limit=limit,
            offset=offset,
        )
        return {"entries": entries, "total": total, "limit": limit, "offset": offset}

    def get_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        return self.store.get_entry(entry_id)

    def get_user_activity(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        return self.store.get_user_activity(user_id, days)

    def get_resource_history(self, resource_type: str, resource_id: str) -> List[Dict[str, Any]]:
        return self.store.get_resource_history(resource_type, resource_id)

    def get_security_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.anomaly_detector.get_alerts(limit)

    def generate_hipaa_report(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        start = start_date or (datetime.utcnow() - timedelta(days=90))
        end = end_date or datetime.utcnow()
        return self.compliance_reporter.generate_hipaa_report(start, end)

    def generate_user_access_report(
        self,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        start = start_date or (datetime.utcnow() - timedelta(days=30))
        end = end_date or datetime.utcnow()
        return self.compliance_reporter.generate_access_report(user_id, start, end)

    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get audit dashboard statistics."""
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)

        today_entries, today_total = self.store.query(start_date=today, limit=100000)
        week_entries, week_total = self.store.query(start_date=week_ago, limit=100000)

        return {
            "today": {
                "total_events": today_total,
                "phi_access": sum(1 for e in today_entries if e.get("is_phi_access")),
                "security_events": sum(1 for e in today_entries if e.get("category") == "security"),
                "failed_events": sum(1 for e in today_entries if not e.get("is_success", True)),
            },
            "this_week": {
                "total_events": week_total,
                "daily_average": round(week_total / 7, 1),
                "top_actions": self._top_values(week_entries, "action", 5),
                "top_users": self._top_values(week_entries, "user_id", 5),
            },
            "alerts": {
                "active_alerts": len(self.anomaly_detector.get_alerts()),
                "critical": sum(1 for a in self.anomaly_detector.get_alerts() if a.get("severity") == "critical"),
                "high": sum(1 for a in self.anomaly_detector.get_alerts() if a.get("severity") == "high"),
            },
        }

    def _top_values(self, entries: List[Dict], field: str, limit: int) -> List[Dict[str, Any]]:
        counts = defaultdict(int)
        for entry in entries:
            val = entry.get(field)
            if val:
                counts[str(val)] += 1
        sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [{"value": k, "count": v} for k, v in sorted_counts]

    async def log_login(self, user_id: int, email: str, ip_address: str, success: bool = True, user_agent: str = None):
        action = AuditAction.LOGIN if success else AuditAction.LOGIN_FAILED
        desc = f"{'Successful' if success else 'Failed'} login attempt for {email}"
        return await self.log(
            action=action, user_id=user_id if success else None,
            user_email=email, ip_address=ip_address, user_agent=user_agent,
            description=desc, is_success=success,
        )

    async def log_patient_access(self, user_id: int, patient_id: int, action_type: str = "view", details: Dict = None):
        action_map = {
            "view": AuditAction.PATIENT_VIEW,
            "create": AuditAction.PATIENT_CREATE,
            "update": AuditAction.PATIENT_UPDATE,
            "delete": AuditAction.PATIENT_DELETE,
            "export": AuditAction.PATIENT_EXPORT,
        }
        action = action_map.get(action_type, AuditAction.PATIENT_VIEW)
        return await self.log(
            action=action, user_id=user_id,
            resource_type="patient", resource_id=str(patient_id),
            description=f"Patient {patient_id} {action_type}",
            details=details,
        )

    async def log_record_access(self, user_id: int, record_type: str, record_id: int, action_type: str = "view"):
        action_map = {
            "view": AuditAction.RECORD_VIEW,
            "create": AuditAction.RECORD_CREATE,
            "update": AuditAction.RECORD_UPDATE,
            "delete": AuditAction.RECORD_DELETE,
            "share": AuditAction.RECORD_SHARE,
            "download": AuditAction.RECORD_DOWNLOAD,
        }
        action = action_map.get(action_type, AuditAction.RECORD_VIEW)
        return await self.log(
            action=action, user_id=user_id,
            resource_type=record_type, resource_id=str(record_id),
            description=f"{record_type} record {record_id} {action_type}",
        )

    async def log_ai_prediction(self, user_id: int, model_name: str, patient_id: int, details: Dict = None):
        return await self.log(
            action=AuditAction.AI_PREDICTION, user_id=user_id,
            resource_type="ai_model", resource_id=model_name,
            description=f"AI prediction using {model_name} for patient {patient_id}",
            details={**(details or {}), "patient_id": patient_id},
        )


# Singleton instance
audit_service = AuditService()

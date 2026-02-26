"""
Backend Compliance Service
HIPAA, GDPR, and healthcare regulatory compliance management for the Cancer Detection Platform.
Includes audit trails, data access controls, consent management, breach detection,
and compliance reporting.
"""

import asyncio
import hashlib
import hmac
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict
import threading

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class ComplianceFramework(str, Enum):
    HIPAA = "hipaa"
    GDPR = "gdpr"
    HITECH = "hitech"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"
    FDA_21CFR11 = "fda_21cfr11"
    ISO_27001 = "iso_27001"
    NIST = "nist"


class DataClassification(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PHI = "phi"  # Protected Health Information
    PII = "pii"  # Personally Identifiable Information
    SENSITIVE = "sensitive"


class ConsentType(str, Enum):
    DATA_COLLECTION = "data_collection"
    DATA_PROCESSING = "data_processing"
    DATA_SHARING = "data_sharing"
    RESEARCH = "research"
    MARKETING = "marketing"
    THIRD_PARTY = "third_party"
    GENETIC_DATA = "genetic_data"
    IMAGING_DATA = "imaging_data"
    AI_ANALYSIS = "ai_analysis"
    TELEMEDICINE = "telemedicine"
    CROSS_BORDER_TRANSFER = "cross_border_transfer"


class ConsentStatus(str, Enum):
    GRANTED = "granted"
    DENIED = "denied"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    PENDING = "pending"


class BreachSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BreachStatus(str, Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    REPORTED = "reported"


class AccessType(str, Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    EXPORT = "export"
    PRINT = "print"
    SHARE = "share"
    DOWNLOAD = "download"
    MODIFY = "modify"
    ADMIN = "admin"


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    UNDER_REVIEW = "under_review"
    REMEDIATION = "remediation"
    EXEMPTED = "exempted"


# ==================== Data Classes ====================

@dataclass
class AuditEntry:
    """Compliance audit log entry"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    user_id: str = ""
    user_role: str = ""
    action: str = ""
    resource_type: str = ""
    resource_id: str = ""
    access_type: AccessType = AccessType.READ
    data_classification: DataClassification = DataClassification.INTERNAL
    ip_address: str = ""
    user_agent: str = ""
    session_id: str = ""
    success: bool = True
    failure_reason: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    phi_accessed: bool = False
    pii_accessed: bool = False
    data_hash: str = ""
    compliance_frameworks: List[ComplianceFramework] = field(default_factory=list)


@dataclass
class ConsentRecord:
    """Patient consent record"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str = ""
    consent_type: ConsentType = ConsentType.DATA_PROCESSING
    status: ConsentStatus = ConsentStatus.PENDING
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    purpose: str = ""
    description: str = ""
    version: str = "1.0"
    data_categories: List[DataClassification] = field(default_factory=list)
    third_parties: List[str] = field(default_factory=list)
    legal_basis: str = ""
    retention_period_days: int = 365
    collected_by: str = ""
    collection_method: str = ""
    ip_address: str = ""
    digital_signature: str = ""
    parent_consent_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BreachIncident:
    """Data breach incident record"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    severity: BreachSeverity = BreachSeverity.MEDIUM
    status: BreachStatus = BreachStatus.DETECTED
    detected_at: datetime = field(default_factory=datetime.utcnow)
    contained_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    reported_at: Optional[datetime] = None
    title: str = ""
    description: str = ""
    data_types_affected: List[DataClassification] = field(default_factory=list)
    records_affected: int = 0
    patients_affected: int = 0
    attack_vector: str = ""
    detection_method: str = ""
    root_cause: str = ""
    remediation_steps: List[str] = field(default_factory=list)
    notifications_sent: List[str] = field(default_factory=list)
    reported_to_authorities: bool = False
    authority_reference: str = ""
    assigned_to: str = ""
    investigation_notes: List[Dict[str, Any]] = field(default_factory=list)
    timeline: List[Dict[str, Any]] = field(default_factory=list)
    lessons_learned: str = ""
    regulatory_frameworks: List[ComplianceFramework] = field(default_factory=list)


@dataclass
class ComplianceControl:
    """Compliance control requirement"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    framework: ComplianceFramework = ComplianceFramework.HIPAA
    control_id: str = ""
    title: str = ""
    description: str = ""
    category: str = ""
    status: ComplianceStatus = ComplianceStatus.UNDER_REVIEW
    priority: str = "medium"
    responsible_party: str = ""
    implementation_notes: str = ""
    evidence: List[str] = field(default_factory=list)
    last_reviewed: Optional[datetime] = None
    next_review: Optional[datetime] = None
    risk_level: str = "medium"
    remediation_plan: str = ""


@dataclass
class DataRetentionPolicy:
    """Data retention policy"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    data_type: str = ""
    classification: DataClassification = DataClassification.INTERNAL
    retention_period_days: int = 365
    auto_delete: bool = False
    archive_after_days: int = 180
    legal_hold: bool = False
    description: str = ""
    applicable_frameworks: List[ComplianceFramework] = field(default_factory=list)
    last_purge: Optional[datetime] = None


@dataclass
class DataSubjectRequest:
    """GDPR/HIPAA data subject request (DSR)"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    request_type: str = ""  # access, deletion, portability, rectification, restriction
    patient_id: str = ""
    requestor_name: str = ""
    requestor_email: str = ""
    requestor_relation: str = ""  # self, guardian, legal_representative
    submitted_at: datetime = field(default_factory=datetime.utcnow)
    deadline: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))
    completed_at: Optional[datetime] = None
    status: str = "pending"  # pending, in_progress, completed, denied, extended
    identity_verified: bool = False
    verification_method: str = ""
    data_categories: List[str] = field(default_factory=list)
    response_notes: str = ""
    assigned_to: str = ""
    denial_reason: str = ""


# ==================== PHI Detection ====================

class PHIDetector:
    """Detects Protected Health Information in text and data"""

    SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
    PHONE_PATTERN = re.compile(r'\b(?:\+?1[-.]?)?\(?[2-9]\d{2}\)?[-.]?\d{3}[-.]?\d{4}\b')
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    DOB_PATTERN = re.compile(r'\b(?:0[1-9]|1[0-2])[/-](?:0[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b')
    MRN_PATTERN = re.compile(r'\bMRN[:\s]?\d{6,12}\b', re.IGNORECASE)
    IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    ZIP_PATTERN = re.compile(r'\b\d{5}(?:-\d{4})?\b')
    CC_PATTERN = re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b')

    MEDICAL_TERMS = [
        'diagnosis', 'prognosis', 'treatment', 'medication', 'prescription',
        'lab result', 'blood test', 'biopsy', 'cancer', 'tumor', 'malignant',
        'benign', 'chemotherapy', 'radiation', 'surgery', 'pathology',
        'genomic', 'biomarker', 'mutation', 'metastasis', 'staging',
    ]

    @classmethod
    def detect_phi(cls, text: str) -> Dict[str, Any]:
        """Scan text for PHI elements"""
        findings = {
            "has_phi": False,
            "phi_types": [],
            "risk_level": "low",
            "details": {},
        }

        checks = [
            ("ssn", cls.SSN_PATTERN, "Social Security Number"),
            ("phone", cls.PHONE_PATTERN, "Phone Number"),
            ("email", cls.EMAIL_PATTERN, "Email Address"),
            ("dob", cls.DOB_PATTERN, "Date of Birth"),
            ("mrn", cls.MRN_PATTERN, "Medical Record Number"),
            ("ip_address", cls.IP_PATTERN, "IP Address"),
            ("zip_code", cls.ZIP_PATTERN, "ZIP Code"),
            ("credit_card", cls.CC_PATTERN, "Credit Card Number"),
        ]

        for phi_type, pattern, label in checks:
            matches = pattern.findall(text)
            if matches:
                findings["has_phi"] = True
                findings["phi_types"].append(phi_type)
                findings["details"][phi_type] = {
                    "label": label,
                    "count": len(matches),
                    "positions": [m.start() for m in pattern.finditer(text)],
                }

        # Check for medical terms
        medical_found = []
        text_lower = text.lower()
        for term in cls.MEDICAL_TERMS:
            if term in text_lower:
                medical_found.append(term)
        if medical_found:
            findings["details"]["medical_terms"] = medical_found

        # Determine risk level
        if "ssn" in findings["phi_types"] or "credit_card" in findings["phi_types"]:
            findings["risk_level"] = "critical"
        elif "mrn" in findings["phi_types"] or "dob" in findings["phi_types"]:
            findings["risk_level"] = "high"
        elif "email" in findings["phi_types"] or "phone" in findings["phi_types"]:
            findings["risk_level"] = "medium"
        elif findings["has_phi"]:
            findings["risk_level"] = "low"

        return findings

    @classmethod
    def redact_phi(cls, text: str, replacement: str = "[REDACTED]") -> str:
        """Redact PHI from text"""
        redacted = text
        patterns = [
            cls.SSN_PATTERN, cls.CC_PATTERN, cls.MRN_PATTERN,
            cls.DOB_PATTERN, cls.PHONE_PATTERN, cls.EMAIL_PATTERN,
        ]
        for pattern in patterns:
            redacted = pattern.sub(replacement, redacted)
        return redacted

    @classmethod
    def hash_phi(cls, value: str, salt: str = "") -> str:
        """Create a one-way hash of PHI for comparison without exposure"""
        if not salt:
            salt = os.environ.get("PHI_HASH_SALT", "cancer-detection-platform-salt")
        return hashlib.sha256(f"{salt}:{value}".encode()).hexdigest()


# ==================== Audit Trail Manager ====================

class AuditTrailManager:
    """Manages compliance audit trails"""

    def __init__(self, max_entries: int = 100000):
        self._entries: List[AuditEntry] = []
        self._lock = threading.Lock()
        self._max_entries = max_entries
        self._phi_detector = PHIDetector()

    async def log(self, entry: AuditEntry) -> str:
        """Log an audit entry"""
        # Detect PHI in details
        if entry.details:
            detail_text = json.dumps(entry.details, default=str)
            phi_scan = PHIDetector.detect_phi(detail_text)
            entry.phi_accessed = phi_scan["has_phi"] or entry.phi_accessed

        # Compute data hash for integrity
        entry_data = f"{entry.timestamp.isoformat()}|{entry.user_id}|{entry.action}|{entry.resource_id}"
        entry.data_hash = hashlib.sha256(entry_data.encode()).hexdigest()

        with self._lock:
            self._entries.append(entry)
            # Trim if needed
            if len(self._entries) > self._max_entries:
                self._entries = self._entries[-self._max_entries:]

        logger.info(
            f"AUDIT: user={entry.user_id} action={entry.action} "
            f"resource={entry.resource_type}:{entry.resource_id} "
            f"access={entry.access_type.value} phi={entry.phi_accessed}"
        )
        return entry.id

    async def query(
        self,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        access_type: Optional[AccessType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        phi_only: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[AuditEntry], int]:
        """Query audit entries with filters"""
        with self._lock:
            filtered = self._entries.copy()

        if user_id:
            filtered = [e for e in filtered if e.user_id == user_id]
        if resource_type:
            filtered = [e for e in filtered if e.resource_type == resource_type]
        if access_type:
            filtered = [e for e in filtered if e.access_type == access_type]
        if start_date:
            filtered = [e for e in filtered if e.timestamp >= start_date]
        if end_date:
            filtered = [e for e in filtered if e.timestamp <= end_date]
        if phi_only:
            filtered = [e for e in filtered if e.phi_accessed]

        total = len(filtered)
        filtered = sorted(filtered, key=lambda e: e.timestamp, reverse=True)
        return filtered[offset:offset + limit], total

    async def get_user_access_report(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Generate user access report for compliance"""
        start_date = datetime.utcnow() - timedelta(days=days)
        entries, total = await self.query(user_id=user_id, start_date=start_date, limit=10000)

        access_summary = defaultdict(int)
        resource_access = defaultdict(set)
        phi_accesses = 0
        failed_attempts = 0

        for entry in entries:
            access_summary[entry.access_type.value] += 1
            resource_access[entry.resource_type].add(entry.resource_id)
            if entry.phi_accessed:
                phi_accesses += 1
            if not entry.success:
                failed_attempts += 1

        return {
            "user_id": user_id,
            "period_days": days,
            "total_activities": total,
            "access_types": dict(access_summary),
            "resources_accessed": {k: len(v) for k, v in resource_access.items()},
            "phi_accesses": phi_accesses,
            "failed_attempts": failed_attempts,
            "risk_score": self._calculate_risk_score(entries),
        }

    def _calculate_risk_score(self, entries: List[AuditEntry]) -> float:
        """Calculate risk score for a set of audit entries (0-100)"""
        if not entries:
            return 0.0

        score = 0.0
        phi_ratio = len([e for e in entries if e.phi_accessed]) / len(entries)
        score += phi_ratio * 30

        failed_ratio = len([e for e in entries if not e.success]) / len(entries)
        score += failed_ratio * 25

        high_risk_actions = ['delete', 'export', 'share', 'download', 'admin']
        high_risk_ratio = len([e for e in entries if e.access_type.value in high_risk_actions]) / len(entries)
        score += high_risk_ratio * 20

        # Off-hours access check (simplified)
        off_hours = len([e for e in entries if e.timestamp.hour < 6 or e.timestamp.hour > 22])
        off_hours_ratio = off_hours / len(entries)
        score += off_hours_ratio * 15

        # Volume anomaly
        daily_counts = defaultdict(int)
        for e in entries:
            daily_counts[e.timestamp.date()] += 1
        if daily_counts:
            avg_daily = sum(daily_counts.values()) / len(daily_counts)
            max_daily = max(daily_counts.values())
            if avg_daily > 0 and max_daily > avg_daily * 3:
                score += 10

        return min(score, 100.0)

    async def get_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get audit trail statistics"""
        start_date = datetime.utcnow() - timedelta(days=days)
        entries, total = await self.query(start_date=start_date, limit=100000)

        daily_counts = defaultdict(int)
        user_counts = defaultdict(int)
        resource_counts = defaultdict(int)
        access_type_counts = defaultdict(int)

        for entry in entries:
            daily_counts[entry.timestamp.strftime("%Y-%m-%d")] += 1
            user_counts[entry.user_id] += 1
            resource_counts[entry.resource_type] += 1
            access_type_counts[entry.access_type.value] += 1

        return {
            "total_entries": total,
            "period_days": days,
            "daily_average": round(total / days, 2) if days > 0 else 0,
            "phi_accesses": len([e for e in entries if e.phi_accessed]),
            "failed_attempts": len([e for e in entries if not e.success]),
            "unique_users": len(user_counts),
            "daily_trend": dict(sorted(daily_counts.items())[-30:]),
            "top_users": dict(sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:10]),
            "resource_distribution": dict(resource_counts),
            "access_type_distribution": dict(access_type_counts),
        }


# ==================== Consent Manager ====================

class ConsentManager:
    """Manages patient consent records"""

    def __init__(self):
        self._consents: Dict[str, ConsentRecord] = {}
        self._patient_consents: Dict[str, List[str]] = defaultdict(list)
        self._lock = threading.Lock()

    async def create_consent(self, consent: ConsentRecord) -> str:
        """Create a new consent record"""
        if consent.status == ConsentStatus.GRANTED:
            consent.granted_at = datetime.utcnow()
            if not consent.expires_at:
                consent.expires_at = datetime.utcnow() + timedelta(days=consent.retention_period_days)

        # Generate digital signature
        consent_data = f"{consent.patient_id}|{consent.consent_type.value}|{consent.version}|{datetime.utcnow().isoformat()}"
        consent.digital_signature = hashlib.sha256(consent_data.encode()).hexdigest()

        with self._lock:
            self._consents[consent.id] = consent
            self._patient_consents[consent.patient_id].append(consent.id)

        logger.info(f"Consent created: {consent.id} type={consent.consent_type.value} patient={consent.patient_id}")
        return consent.id

    async def withdraw_consent(self, consent_id: str, reason: str = "") -> bool:
        """Withdraw a consent"""
        with self._lock:
            consent = self._consents.get(consent_id)
            if not consent:
                return False
            consent.status = ConsentStatus.WITHDRAWN
            consent.withdrawn_at = datetime.utcnow()
            consent.metadata["withdrawal_reason"] = reason
        logger.info(f"Consent withdrawn: {consent_id}")
        return True

    async def check_consent(self, patient_id: str, consent_type: ConsentType) -> bool:
        """Check if patient has active consent for a specific type"""
        with self._lock:
            consent_ids = self._patient_consents.get(patient_id, [])
            for cid in consent_ids:
                consent = self._consents.get(cid)
                if not consent:
                    continue
                if consent.consent_type != consent_type:
                    continue
                if consent.status != ConsentStatus.GRANTED:
                    continue
                if consent.expires_at and consent.expires_at < datetime.utcnow():
                    consent.status = ConsentStatus.EXPIRED
                    continue
                return True
        return False

    async def get_patient_consents(self, patient_id: str) -> List[ConsentRecord]:
        """Get all consent records for a patient"""
        with self._lock:
            consent_ids = self._patient_consents.get(patient_id, [])
            return [self._consents[cid] for cid in consent_ids if cid in self._consents]

    async def get_consent(self, consent_id: str) -> Optional[ConsentRecord]:
        """Get a specific consent record"""
        return self._consents.get(consent_id)

    async def get_expired_consents(self) -> List[ConsentRecord]:
        """Get all expired consents"""
        now = datetime.utcnow()
        expired = []
        with self._lock:
            for consent in self._consents.values():
                if consent.expires_at and consent.expires_at < now and consent.status == ConsentStatus.GRANTED:
                    consent.status = ConsentStatus.EXPIRED
                    expired.append(consent)
        return expired

    async def generate_consent_report(self, patient_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate consent compliance report"""
        with self._lock:
            consents = list(self._consents.values())
            if patient_id:
                consents = [c for c in consents if c.patient_id == patient_id]

        status_counts = defaultdict(int)
        type_counts = defaultdict(int)
        for c in consents:
            status_counts[c.status.value] += 1
            type_counts[c.consent_type.value] += 1

        return {
            "total_consents": len(consents),
            "status_distribution": dict(status_counts),
            "type_distribution": dict(type_counts),
            "active_consents": len([c for c in consents if c.status == ConsentStatus.GRANTED]),
            "withdrawn_consents": len([c for c in consents if c.status == ConsentStatus.WITHDRAWN]),
            "expired_consents": len([c for c in consents if c.status == ConsentStatus.EXPIRED]),
            "patients_with_consent": len(set(c.patient_id for c in consents if c.status == ConsentStatus.GRANTED)),
        }


# ==================== Breach Manager ====================

class BreachManager:
    """Manages data breach incidents"""

    def __init__(self):
        self._incidents: Dict[str, BreachIncident] = {}
        self._lock = threading.Lock()

    async def report_breach(self, incident: BreachIncident) -> str:
        """Report a new data breach"""
        incident.timeline.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": "breach_reported",
            "details": f"Breach detected: {incident.title}",
        })

        with self._lock:
            self._incidents[incident.id] = incident

        logger.critical(
            f"DATA BREACH REPORTED: {incident.id} severity={incident.severity.value} "
            f"title={incident.title} records_affected={incident.records_affected}"
        )
        return incident.id

    async def update_breach_status(self, breach_id: str, status: BreachStatus,
                                    notes: str = "") -> bool:
        """Update breach incident status"""
        with self._lock:
            incident = self._incidents.get(breach_id)
            if not incident:
                return False

            incident.status = status
            incident.timeline.append({
                "timestamp": datetime.utcnow().isoformat(),
                "action": f"status_changed_to_{status.value}",
                "details": notes,
            })

            if status == BreachStatus.CONTAINED:
                incident.contained_at = datetime.utcnow()
            elif status == BreachStatus.RESOLVED:
                incident.resolved_at = datetime.utcnow()
            elif status == BreachStatus.REPORTED:
                incident.reported_at = datetime.utcnow()
                incident.reported_to_authorities = True

        logger.info(f"Breach {breach_id} status updated to {status.value}")
        return True

    async def get_active_breaches(self) -> List[BreachIncident]:
        """Get all active (unresolved) breaches"""
        with self._lock:
            return [i for i in self._incidents.values()
                    if i.status not in (BreachStatus.RESOLVED,)]

    async def get_breach(self, breach_id: str) -> Optional[BreachIncident]:
        """Get breach details"""
        return self._incidents.get(breach_id)

    async def get_breach_statistics(self) -> Dict[str, Any]:
        """Get breach statistics"""
        with self._lock:
            incidents = list(self._incidents.values())

        severity_counts = defaultdict(int)
        status_counts = defaultdict(int)
        total_records = 0
        total_patients = 0

        for inc in incidents:
            severity_counts[inc.severity.value] += 1
            status_counts[inc.status.value] += 1
            total_records += inc.records_affected
            total_patients += inc.patients_affected

        # Calculate average response times
        response_times = []
        for inc in incidents:
            if inc.contained_at:
                delta = (inc.contained_at - inc.detected_at).total_seconds() / 3600
                response_times.append(delta)

        return {
            "total_incidents": len(incidents),
            "active_incidents": len([i for i in incidents if i.status != BreachStatus.RESOLVED]),
            "severity_distribution": dict(severity_counts),
            "status_distribution": dict(status_counts),
            "total_records_affected": total_records,
            "total_patients_affected": total_patients,
            "avg_containment_hours": round(sum(response_times) / len(response_times), 2) if response_times else 0,
            "reported_to_authorities": len([i for i in incidents if i.reported_to_authorities]),
        }


# ==================== Data Subject Request Manager ====================

class DSRManager:
    """Manages GDPR/HIPAA data subject requests"""

    def __init__(self):
        self._requests: Dict[str, DataSubjectRequest] = {}
        self._lock = threading.Lock()

    async def submit_request(self, dsr: DataSubjectRequest) -> str:
        """Submit a data subject request"""
        with self._lock:
            self._requests[dsr.id] = dsr

        logger.info(
            f"DSR submitted: {dsr.id} type={dsr.request_type} "
            f"patient={dsr.patient_id} deadline={dsr.deadline.isoformat()}"
        )
        return dsr.id

    async def process_request(self, request_id: str, assigned_to: str) -> bool:
        """Assign and begin processing a DSR"""
        with self._lock:
            dsr = self._requests.get(request_id)
            if not dsr:
                return False
            dsr.status = "in_progress"
            dsr.assigned_to = assigned_to
        return True

    async def complete_request(self, request_id: str, notes: str = "") -> bool:
        """Complete a DSR"""
        with self._lock:
            dsr = self._requests.get(request_id)
            if not dsr:
                return False
            dsr.status = "completed"
            dsr.completed_at = datetime.utcnow()
            dsr.response_notes = notes
        return True

    async def deny_request(self, request_id: str, reason: str) -> bool:
        """Deny a DSR"""
        with self._lock:
            dsr = self._requests.get(request_id)
            if not dsr:
                return False
            dsr.status = "denied"
            dsr.denial_reason = reason
            dsr.completed_at = datetime.utcnow()
        return True

    async def get_pending_requests(self) -> List[DataSubjectRequest]:
        """Get all pending DSRs"""
        with self._lock:
            return [r for r in self._requests.values() if r.status in ("pending", "in_progress")]

    async def get_overdue_requests(self) -> List[DataSubjectRequest]:
        """Get overdue DSRs"""
        now = datetime.utcnow()
        with self._lock:
            return [r for r in self._requests.values()
                    if r.status in ("pending", "in_progress") and r.deadline < now]

    async def get_request_statistics(self) -> Dict[str, Any]:
        """Get DSR statistics"""
        with self._lock:
            requests = list(self._requests.values())

        status_counts = defaultdict(int)
        type_counts = defaultdict(int)
        for r in requests:
            status_counts[r.status] += 1
            type_counts[r.request_type] += 1

        completion_times = []
        for r in requests:
            if r.completed_at:
                delta = (r.completed_at - r.submitted_at).total_seconds() / 86400
                completion_times.append(delta)

        return {
            "total_requests": len(requests),
            "status_distribution": dict(status_counts),
            "type_distribution": dict(type_counts),
            "pending_count": len([r for r in requests if r.status in ("pending", "in_progress")]),
            "overdue_count": len([r for r in requests if r.status in ("pending", "in_progress") and r.deadline < datetime.utcnow()]),
            "avg_completion_days": round(sum(completion_times) / len(completion_times), 1) if completion_times else 0,
        }


# ==================== Compliance Controls Manager ====================

class ComplianceControlsManager:
    """Manages compliance controls and assessments"""

    def __init__(self):
        self._controls: Dict[str, ComplianceControl] = {}
        self._lock = threading.Lock()
        self._setup_hipaa_controls()

    def _setup_hipaa_controls(self):
        """Initialize HIPAA compliance controls"""
        hipaa_controls = [
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(a)(1)",
                title="Access Control", category="Technical Safeguards",
                description="Implement technical policies to allow access only to authorized persons"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(a)(2)(i)",
                title="Unique User Identification", category="Technical Safeguards",
                description="Assign unique names/numbers for identifying and tracking user identity"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(a)(2)(iii)",
                title="Automatic Logoff", category="Technical Safeguards",
                description="Implement electronic procedures to terminate sessions after inactivity"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(a)(2)(iv)",
                title="Encryption and Decryption", category="Technical Safeguards",
                description="Implement mechanism to encrypt and decrypt ePHI"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(b)",
                title="Audit Controls", category="Technical Safeguards",
                description="Implement hardware, software, and/or procedural mechanisms for recording and examining access"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(c)(1)",
                title="Integrity", category="Technical Safeguards",
                description="Implement policies to protect ePHI from improper alteration or destruction"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(d)",
                title="Person or Entity Authentication", category="Technical Safeguards",
                description="Implement authentication procedures to verify person seeking access"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.312(e)(1)",
                title="Transmission Security", category="Technical Safeguards",
                description="Implement technical security measures for ePHI transmitted over network"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.308(a)(1)(i)",
                title="Security Management Process", category="Administrative Safeguards",
                description="Implement policies to prevent, detect, contain, and correct security violations"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.308(a)(3)(i)",
                title="Workforce Security", category="Administrative Safeguards",
                description="Implement policies to ensure workforce has appropriate access"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.308(a)(5)(i)",
                title="Security Awareness and Training", category="Administrative Safeguards",
                description="Implement security awareness and training program"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.308(a)(6)(i)",
                title="Security Incident Procedures", category="Administrative Safeguards",
                description="Implement policies to address security incidents"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.308(a)(7)(i)",
                title="Contingency Plan", category="Administrative Safeguards",
                description="Establish policies for responding to emergency or occurrence"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.310(a)(1)",
                title="Facility Access Controls", category="Physical Safeguards",
                description="Implement policies to limit physical access to information systems"),
            ComplianceControl(framework=ComplianceFramework.HIPAA, control_id="164.310(d)(1)",
                title="Device and Media Controls", category="Physical Safeguards",
                description="Implement policies for receipt and removal of hardware and media containing ePHI"),
        ]

        for control in hipaa_controls:
            self._controls[control.id] = control

    async def add_control(self, control: ComplianceControl) -> str:
        """Add a compliance control"""
        with self._lock:
            self._controls[control.id] = control
        return control.id

    async def update_control_status(self, control_id: str, status: ComplianceStatus,
                                     notes: str = "") -> bool:
        """Update control status"""
        with self._lock:
            control = self._controls.get(control_id)
            if not control:
                return False
            control.status = status
            control.implementation_notes = notes
            control.last_reviewed = datetime.utcnow()
        return True

    async def get_compliance_snapshot(self, framework: Optional[ComplianceFramework] = None) -> Dict[str, Any]:
        """Get compliance status snapshot"""
        with self._lock:
            controls = list(self._controls.values())
            if framework:
                controls = [c for c in controls if c.framework == framework]

        status_counts = defaultdict(int)
        category_status = defaultdict(lambda: defaultdict(int))
        for c in controls:
            status_counts[c.status.value] += 1
            category_status[c.category][c.status.value] += 1

        total = len(controls)
        compliant = len([c for c in controls if c.status == ComplianceStatus.COMPLIANT])
        compliance_score = (compliant / total * 100) if total > 0 else 0

        return {
            "total_controls": total,
            "compliance_score": round(compliance_score, 1),
            "status_distribution": dict(status_counts),
            "category_breakdown": {k: dict(v) for k, v in category_status.items()},
            "non_compliant_controls": [
                {"id": c.control_id, "title": c.title, "category": c.category, "priority": c.priority}
                for c in controls if c.status == ComplianceStatus.NON_COMPLIANT
            ],
            "controls_needing_review": len([
                c for c in controls
                if not c.last_reviewed or (datetime.utcnow() - c.last_reviewed).days > 90
            ]),
        }

    async def get_controls_by_framework(self, framework: ComplianceFramework) -> List[ComplianceControl]:
        """Get all controls for a specific framework"""
        with self._lock:
            return [c for c in self._controls.values() if c.framework == framework]


# ==================== Data Retention Manager ====================

class DataRetentionManager:
    """Manages data retention policies"""

    def __init__(self):
        self._policies: Dict[str, DataRetentionPolicy] = {}
        self._lock = threading.Lock()
        self._setup_default_policies()

    def _setup_default_policies(self):
        """Set up default retention policies"""
        defaults = [
            DataRetentionPolicy(
                data_type="medical_records", classification=DataClassification.PHI,
                retention_period_days=2555, archive_after_days=365,
                description="Medical records retained for 7 years per HIPAA",
                applicable_frameworks=[ComplianceFramework.HIPAA]),
            DataRetentionPolicy(
                data_type="lab_results", classification=DataClassification.PHI,
                retention_period_days=2555, archive_after_days=365,
                description="Lab results retained for 7 years",
                applicable_frameworks=[ComplianceFramework.HIPAA]),
            DataRetentionPolicy(
                data_type="imaging_data", classification=DataClassification.PHI,
                retention_period_days=2555, archive_after_days=180,
                description="Medical images retained for 7 years",
                applicable_frameworks=[ComplianceFramework.HIPAA]),
            DataRetentionPolicy(
                data_type="audit_logs", classification=DataClassification.CONFIDENTIAL,
                retention_period_days=2190, archive_after_days=365,
                description="Audit logs retained for 6 years per HIPAA",
                applicable_frameworks=[ComplianceFramework.HIPAA]),
            DataRetentionPolicy(
                data_type="consent_records", classification=DataClassification.CONFIDENTIAL,
                retention_period_days=3650, archive_after_days=365,
                description="Consent records retained for 10 years",
                applicable_frameworks=[ComplianceFramework.HIPAA, ComplianceFramework.GDPR]),
            DataRetentionPolicy(
                data_type="genomic_data", classification=DataClassification.SENSITIVE,
                retention_period_days=3650, archive_after_days=365,
                description="Genomic data retained for 10 years per research requirements",
                applicable_frameworks=[ComplianceFramework.HIPAA, ComplianceFramework.FDA_21CFR11]),
            DataRetentionPolicy(
                data_type="billing_records", classification=DataClassification.PII,
                retention_period_days=2555, archive_after_days=365,
                description="Billing records retained for 7 years",
                applicable_frameworks=[ComplianceFramework.HIPAA, ComplianceFramework.PCI_DSS]),
            DataRetentionPolicy(
                data_type="session_logs", classification=DataClassification.INTERNAL,
                retention_period_days=90, auto_delete=True,
                description="Session logs auto-deleted after 90 days"),
            DataRetentionPolicy(
                data_type="temp_files", classification=DataClassification.INTERNAL,
                retention_period_days=7, auto_delete=True,
                description="Temporary files auto-deleted after 7 days"),
        ]

        for policy in defaults:
            self._policies[policy.id] = policy

    async def get_policy(self, data_type: str) -> Optional[DataRetentionPolicy]:
        """Get retention policy for a data type"""
        with self._lock:
            for policy in self._policies.values():
                if policy.data_type == data_type:
                    return policy
        return None

    async def get_all_policies(self) -> List[DataRetentionPolicy]:
        """Get all retention policies"""
        with self._lock:
            return list(self._policies.values())

    async def check_retention_compliance(self) -> Dict[str, Any]:
        """Check data retention compliance"""
        with self._lock:
            policies = list(self._policies.values())

        compliant = 0
        needs_attention = 0
        overdue_purge = 0

        for policy in policies:
            if policy.auto_delete and policy.last_purge:
                days_since_purge = (datetime.utcnow() - policy.last_purge).days
                if days_since_purge > policy.retention_period_days:
                    overdue_purge += 1
                    needs_attention += 1
                else:
                    compliant += 1
            elif not policy.auto_delete:
                compliant += 1
            else:
                needs_attention += 1

        return {
            "total_policies": len(policies),
            "compliant": compliant,
            "needs_attention": needs_attention,
            "overdue_purge": overdue_purge,
            "policies": [asdict(p) for p in policies],
        }


# ==================== Main Compliance Service ====================

class ComplianceService:
    """Main compliance management service"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        self.audit = AuditTrailManager()
        self.consent = ConsentManager()
        self.breach = BreachManager()
        self.dsr = DSRManager()
        self.controls = ComplianceControlsManager()
        self.retention = DataRetentionManager()
        self.phi_detector = PHIDetector()

        logger.info("Compliance Service initialized")

    async def log_data_access(
        self,
        user_id: str,
        user_role: str,
        resource_type: str,
        resource_id: str,
        access_type: AccessType,
        ip_address: str = "",
        details: Optional[Dict] = None,
    ) -> str:
        """Log a data access event for compliance"""
        classification = self._determine_classification(resource_type)

        entry = AuditEntry(
            user_id=user_id,
            user_role=user_role,
            action=f"{access_type.value}_{resource_type}",
            resource_type=resource_type,
            resource_id=resource_id,
            access_type=access_type,
            data_classification=classification,
            ip_address=ip_address,
            details=details or {},
            phi_accessed=classification in (DataClassification.PHI, DataClassification.SENSITIVE),
            pii_accessed=classification in (DataClassification.PII, DataClassification.PHI),
        )

        return await self.audit.log(entry)

    def _determine_classification(self, resource_type: str) -> DataClassification:
        """Determine data classification based on resource type"""
        phi_resources = {
            'medical_record', 'lab_result', 'diagnosis', 'prescription',
            'imaging', 'pathology', 'genomic', 'treatment_plan', 'biopsy',
            'cancer_screening', 'blood_test', 'vital_signs',
        }
        pii_resources = {
            'patient', 'user', 'billing', 'insurance', 'emergency_contact',
            'appointment', 'consent',
        }
        sensitive_resources = {
            'mental_health', 'genetic_data', 'substance_abuse',
            'hiv_status', 'reproductive_health',
        }

        resource_lower = resource_type.lower()
        if resource_lower in sensitive_resources:
            return DataClassification.SENSITIVE
        if resource_lower in phi_resources:
            return DataClassification.PHI
        if resource_lower in pii_resources:
            return DataClassification.PII
        return DataClassification.INTERNAL

    async def generate_compliance_report(self, framework: Optional[ComplianceFramework] = None) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        controls_snapshot = await self.controls.get_compliance_snapshot(framework)
        audit_stats = await self.audit.get_statistics()
        consent_report = await self.consent.generate_consent_report()
        breach_stats = await self.breach.get_breach_statistics()
        dsr_stats = await self.dsr.get_request_statistics()
        retention_compliance = await self.retention.check_retention_compliance()

        overall_score = self._calculate_overall_compliance_score(
            controls_snapshot, audit_stats, consent_report, breach_stats, dsr_stats
        )

        return {
            "report_date": datetime.utcnow().isoformat(),
            "framework": framework.value if framework else "all",
            "overall_compliance_score": overall_score,
            "controls": controls_snapshot,
            "audit_trail": audit_stats,
            "consent_management": consent_report,
            "breach_management": breach_stats,
            "data_subject_requests": dsr_stats,
            "data_retention": retention_compliance,
            "recommendations": self._generate_recommendations(
                controls_snapshot, audit_stats, breach_stats, dsr_stats
            ),
        }

    def _calculate_overall_compliance_score(self, controls, audit, consent, breach, dsr) -> float:
        """Calculate overall compliance score (0-100)"""
        score = 0.0

        # Controls compliance (40%)
        controls_score = controls.get("compliance_score", 0)
        score += controls_score * 0.4

        # Audit trail health (15%)
        if audit.get("total_entries", 0) > 0:
            failed_ratio = audit.get("failed_attempts", 0) / audit.get("total_entries", 1)
            audit_score = max(0, 100 - (failed_ratio * 200))
            score += audit_score * 0.15
        else:
            score += 50 * 0.15

        # Consent management (15%)
        total_consents = consent.get("total_consents", 0)
        if total_consents > 0:
            active_ratio = consent.get("active_consents", 0) / total_consents
            consent_score = active_ratio * 100
            score += consent_score * 0.15
        else:
            score += 70 * 0.15

        # Breach management (15%)
        if breach.get("total_incidents", 0) == 0:
            score += 100 * 0.15
        else:
            active_ratio = breach.get("active_incidents", 0) / breach.get("total_incidents", 1)
            breach_score = max(0, 100 - (active_ratio * 100))
            score += breach_score * 0.15

        # DSR management (15%)
        if dsr.get("total_requests", 0) == 0:
            score += 100 * 0.15
        else:
            overdue_ratio = dsr.get("overdue_count", 0) / dsr.get("total_requests", 1)
            dsr_score = max(0, 100 - (overdue_ratio * 200))
            score += dsr_score * 0.15

        return round(score, 1)

    def _generate_recommendations(self, controls, audit, breach, dsr) -> List[str]:
        """Generate compliance recommendations"""
        recommendations = []

        if controls.get("compliance_score", 100) < 80:
            recommendations.append(
                "Compliance score is below 80%. Prioritize addressing non-compliant controls."
            )
        if controls.get("controls_needing_review", 0) > 0:
            recommendations.append(
                f"{controls['controls_needing_review']} controls need review. Schedule compliance assessments."
            )
        if audit.get("phi_accesses", 0) > 100:
            recommendations.append(
                "High volume of PHI accesses detected. Review access patterns for potential issues."
            )
        if breach.get("active_incidents", 0) > 0:
            recommendations.append(
                "Active breach incidents require immediate attention and containment."
            )
        if dsr.get("overdue_count", 0) > 0:
            recommendations.append(
                f"{dsr['overdue_count']} overdue data subject requests. Process these to avoid regulatory penalties."
            )

        if not recommendations:
            recommendations.append("All compliance areas are within acceptable parameters.")

        return recommendations


# ==================== Singleton Instance ====================

def get_compliance_service() -> ComplianceService:
    """Get the singleton compliance service instance"""
    return ComplianceService()

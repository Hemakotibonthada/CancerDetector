"""Emergency Contact, Device, Report, Feedback, System Config Models"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, AuditMixin

# ============================================================================
# Emergency Contact
# ============================================================================
class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    relationship: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    alternate_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    is_legal_guardian: Mapped[bool] = mapped_column(Boolean, default=False)
    can_make_medical_decisions: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

# ============================================================================
# Device
# ============================================================================
class DeviceType(str, enum.Enum):
    SMARTWATCH = "smartwatch"
    FITNESS_TRACKER = "fitness_tracker"
    BLOOD_PRESSURE_MONITOR = "blood_pressure_monitor"
    GLUCOSE_MONITOR = "glucose_monitor"
    PULSE_OXIMETER = "pulse_oximeter"
    THERMOMETER = "thermometer"
    SCALE = "scale"
    ECG_MONITOR = "ecg_monitor"
    OTHER = "other"

class DeviceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONNECTED = "disconnected"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"

class Device(Base, AuditMixin):
    __tablename__ = "devices"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    device_type: Mapped[str] = mapped_column(String(30), nullable=False)
    device_name: Mapped[str] = mapped_column(String(200), nullable=False)
    device_id_external: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    firmware_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=DeviceStatus.ACTIVE.value, nullable=False)
    paired_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_synced: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    battery_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sync_frequency_minutes: Mapped[int] = mapped_column(Integer, default=15)
    data_sharing_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    real_time_monitoring: Mapped[bool] = mapped_column(Boolean, default=True)

# ============================================================================
# Report
# ============================================================================
class ReportType(str, enum.Enum):
    PATIENT_SUMMARY = "patient_summary"
    LAB_REPORT = "lab_report"
    CANCER_RISK = "cancer_risk"
    HEALTH_TREND = "health_trend"
    SMARTWATCH_ANALYSIS = "smartwatch_analysis"
    HOSPITAL_ANALYTICS = "hospital_analytics"
    ADMIN_DASHBOARD = "admin_dashboard"
    MEDICATION_REPORT = "medication_report"
    BILLING_REPORT = "billing_report"
    RESEARCH_EXPORT = "research_export"
    CUSTOM = "custom"

class ReportTemplate(Base, AuditMixin):
    __tablename__ = "report_templates"
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    report_type: Mapped[str] = mapped_column(String(30), nullable=False)
    template_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parameters: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

class Report(Base, AuditMixin):
    __tablename__ = "reports"
    report_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    report_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    generated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patients.id"), nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospitals.id"), nullable=True)
    template_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("report_templates.id"), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_format: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    parameters_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date_range_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    date_range_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="completed", nullable=False)

# ============================================================================
# Feedback
# ============================================================================
class FeedbackType(str, enum.Enum):
    GENERAL = "general"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    AI_ACCURACY = "ai_accuracy"
    DOCTOR_FEEDBACK = "doctor_feedback"
    APPOINTMENT_FEEDBACK = "appointment_feedback"
    APP_EXPERIENCE = "app_experience"

class FeedbackStatus(str, enum.Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    CLOSED = "closed"
    WONT_FIX = "wont_fix"

class Feedback(Base, AuditMixin):
    __tablename__ = "feedbacks"
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    feedback_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=FeedbackStatus.OPEN.value, nullable=False)
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    screenshots: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responded_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

# ============================================================================
# System Config
# ============================================================================
class SystemConfig(Base, AuditMixin):
    __tablename__ = "system_configs"
    config_key: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    config_value: Mapped[str] = mapped_column(Text, nullable=False)
    value_type: Mapped[str] = mapped_column(String(20), default="string", nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    is_editable: Mapped[bool] = mapped_column(Boolean, default=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

class FeatureFlag(Base, AuditMixin):
    __tablename__ = "feature_flags"
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    enabled_for_roles: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enabled_for_users: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    percentage_rollout: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class MaintenanceWindow(Base, AuditMixin):
    __tablename__ = "maintenance_windows"
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    affected_services: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False)

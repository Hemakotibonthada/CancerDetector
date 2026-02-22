"""
Notification Model
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class NotificationType(str, enum.Enum):
    SYSTEM = "system"
    APPOINTMENT_REMINDER = "appointment_reminder"
    LAB_RESULT = "lab_result"
    MEDICATION_REMINDER = "medication_reminder"
    CANCER_RISK_ALERT = "cancer_risk_alert"
    HEALTH_ALERT = "health_alert"
    SMARTWATCH_ALERT = "smartwatch_alert"
    DOCTOR_MESSAGE = "doctor_message"
    PRESCRIPTION_READY = "prescription_ready"
    FOLLOW_UP_REMINDER = "follow_up_reminder"
    SCREENING_DUE = "screening_due"
    REPORT_READY = "report_ready"
    ACCOUNT_ALERT = "account_alert"
    EMERGENCY = "emergency"
    PROMOTIONAL = "promotional"
    NEWS = "news"
    AI_INSIGHT = "ai_insight"
    HOSPITAL_UPDATE = "hospital_update"
    BILLING = "billing"
    CONSENT_REQUEST = "consent_request"
    BLOOD_DONATION_REQUEST = "blood_donation_request"
    BLOOD_DONATION_ACCEPTED = "blood_donation_accepted"
    BLOOD_DONATION_DECLINED = "blood_donation_declined"

class NotificationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class Notification(Base):
    __tablename__ = "notifications"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    notification_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), default=NotificationPriority.MEDIUM.value, nullable=False)
    
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    short_message: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    action_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    action_taken: Mapped[bool] = mapped_column(Boolean, default=False)
    
    data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Delivery
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    push_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    websocket_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Source
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    sent_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    # Group
    group_key: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    __table_args__ = (
        Index("ix_notification_user_read", "user_id", "is_read"),
        Index("ix_notification_type_priority", "notification_type", "priority"),
    )

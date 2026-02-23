"""
Audit Log, Vital Signs, Lab Result, Medical Image, Insurance, Emergency Contact,
Device, Report, Feedback, System Config Models
================================================================
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, AuditMixin

# ============================================================================
# Audit Log
# ============================================================================

class AuditAction(str, enum.Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    FAILED_LOGIN = "failed_login"
    PASSWORD_CHANGE = "password_change"
    ROLE_CHANGE = "role_change"
    PERMISSION_CHANGE = "permission_change"
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    AI_PREDICTION = "ai_prediction"
    REPORT_GENERATED = "report_generated"
    CONSENT_CHANGE = "consent_change"
    EMERGENCY_ACCESS = "emergency_access"
    SYSTEM_CONFIG_CHANGE = "system_config_change"
    
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    old_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="success", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_audit_user_action", "user_id", "action"),
        Index("ix_audit_resource", "resource_type", "resource_id"),
        Index("ix_audit_created", "created_at"),
    )

"""Vital Signs Model"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class VitalSignType(str, enum.Enum):
    HEART_RATE = "heart_rate"
    BLOOD_PRESSURE = "blood_pressure"
    TEMPERATURE = "temperature"
    RESPIRATORY_RATE = "respiratory_rate"
    OXYGEN_SATURATION = "oxygen_saturation"
    WEIGHT = "weight"
    HEIGHT = "height"
    BMI = "bmi"
    PAIN_SCALE = "pain_scale"
    BLOOD_GLUCOSE = "blood_glucose"

class VitalSignAlert(str, enum.Enum):
    NORMAL = "normal"
    LOW = "low"
    HIGH = "high"
    CRITICAL_LOW = "critical_low"
    CRITICAL_HIGH = "critical_high"

class VitalSigns(Base):
    __tablename__ = "vital_signs"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False, index=True)
    health_record_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("health_records.id"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    recorded_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    source: Mapped[str] = mapped_column(String(30), default="manual", nullable=False)
    
    heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bp_systolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bp_diastolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperature_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    respiratory_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    oxygen_saturation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bmi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pain_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    blood_glucose: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_glucose_fasting: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    alert_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_vitals_patient_time", "patient_id", "recorded_at"),
    )

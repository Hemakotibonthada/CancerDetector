"""
Smartwatch Data Model - Wearable Device Health Data
====================================================

Models for smartwatch and wearable device data including heart rate,
SpO2, sleep patterns, activity, ECG, stress levels, temperature,
and blood pressure estimates.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    String, Boolean, Integer, DateTime, Text, Float,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


class DeviceBrand(str, enum.Enum):
    APPLE_WATCH = "apple_watch"
    SAMSUNG_GALAXY_WATCH = "samsung_galaxy_watch"
    FITBIT = "fitbit"
    GARMIN = "garmin"
    WHOOP = "whoop"
    OURA = "oura"
    WITHINGS = "withings"
    XIAOMI = "xiaomi"
    HUAWEI = "huawei"
    POLAR = "polar"
    AMAZFIT = "amazfit"
    GOOGLE_PIXEL_WATCH = "google_pixel_watch"
    OTHER = "other"


class DataQuality(str, enum.Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    INVALID = "invalid"


class SleepStage(str, enum.Enum):
    AWAKE = "awake"
    LIGHT = "light"
    DEEP = "deep"
    REM = "rem"
    UNKNOWN = "unknown"


class ActivityType(str, enum.Enum):
    WALKING = "walking"
    RUNNING = "running"
    CYCLING = "cycling"
    SWIMMING = "swimming"
    STRENGTH_TRAINING = "strength_training"
    YOGA = "yoga"
    HIIT = "hiit"
    ELLIPTICAL = "elliptical"
    ROWING = "rowing"
    STAIR_CLIMBING = "stair_climbing"
    HIKING = "hiking"
    DANCING = "dancing"
    SPORTS = "sports"
    SEDENTARY = "sedentary"
    STANDING = "standing"
    OTHER = "other"


class AlertLevel(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ALERT = "alert"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


# ============================================================================
# Smartwatch Device Model
# ============================================================================

class SmartwatchDevice(Base, AuditMixin):
    """
    Registered smartwatch/wearable device for a patient.
    """
    
    __tablename__ = "smartwatch_devices"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    # Device Info
    device_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    device_name: Mapped[str] = mapped_column(String(200), nullable=False)
    device_brand: Mapped[str] = mapped_column(String(50), nullable=False)
    device_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    firmware_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Capabilities
    has_heart_rate: Mapped[bool] = mapped_column(Boolean, default=True)
    has_spo2: Mapped[bool] = mapped_column(Boolean, default=True)
    has_ecg: Mapped[bool] = mapped_column(Boolean, default=False)
    has_blood_pressure: Mapped[bool] = mapped_column(Boolean, default=False)
    has_temperature: Mapped[bool] = mapped_column(Boolean, default=False)
    has_sleep_tracking: Mapped[bool] = mapped_column(Boolean, default=True)
    has_activity_tracking: Mapped[bool] = mapped_column(Boolean, default=True)
    has_stress_tracking: Mapped[bool] = mapped_column(Boolean, default=False)
    has_fall_detection: Mapped[bool] = mapped_column(Boolean, default=False)
    has_afib_detection: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Connection
    is_paired: Mapped[bool] = mapped_column(Boolean, default=True)
    paired_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_synced: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    sync_frequency_minutes: Mapped[int] = mapped_column(Integer, default=15)
    battery_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Data Collection
    continuous_monitoring: Mapped[bool] = mapped_column(Boolean, default=True)
    data_collection_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    real_time_alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Alert Thresholds
    heart_rate_high_alert: Mapped[Optional[int]] = mapped_column(Integer, default=120)
    heart_rate_low_alert: Mapped[Optional[int]] = mapped_column(Integer, default=50)
    spo2_low_alert: Mapped[Optional[float]] = mapped_column(Float, default=92.0)
    irregular_rhythm_alert: Mapped[bool] = mapped_column(Boolean, default=True)
    
    __table_args__ = (
        Index("ix_device_patient", "patient_id", "is_paired"),
    )


# ============================================================================
# Smartwatch Data (Aggregated)
# ============================================================================

class SmartwatchData(Base):
    """
    Aggregated smartwatch data for a time period.
    Used for AI analysis and trend detection.
    """
    
    __tablename__ = "smartwatch_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    
    # Time Period
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_type: Mapped[str] = mapped_column(String(20), nullable=False)  # minute, hour, day
    
    # Heart Rate
    heart_rate_avg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    heart_rate_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate_resting: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate_variability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # SpO2
    spo2_avg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    spo2_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    spo2_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Blood Pressure (estimated)
    bp_systolic_avg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bp_diastolic_avg: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Temperature
    skin_temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    temperature_variation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Activity
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_meters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    calories_burned: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    active_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sedentary_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    floors_climbed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Sleep
    sleep_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deep_sleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    light_sleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rem_sleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    awake_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_efficiency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Stress
    stress_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stress_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    relaxation_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # ECG
    ecg_recorded: Mapped[bool] = mapped_column(Boolean, default=False)
    ecg_classification: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    atrial_fibrillation_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    irregular_rhythm_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Respiratory
    respiratory_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Data Quality
    data_quality: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    data_completeness: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # AI Analysis
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_anomaly_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_anomaly_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_anomaly_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_health_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_risk_indicators: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    ai_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Alert Generated
    alert_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    alert_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    alert_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_smartwatch_patient_time", "patient_id", "timestamp"),
        Index("ix_smartwatch_device_time", "device_id", "timestamp"),
        Index("ix_smartwatch_anomaly", "ai_anomaly_detected", "timestamp"),
        Index("ix_smartwatch_alert", "alert_generated", "alert_level"),
    )


# ============================================================================
# Heart Rate Data (Detailed)
# ============================================================================

class HeartRateData(Base):
    """Detailed heart rate measurements."""
    
    __tablename__ = "heart_rate_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    heart_rate: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_resting: Mapped[bool] = mapped_column(Boolean, default=False)
    activity_context: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    
    # Derived metrics
    hrv_rmssd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hrv_sdnn: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    __table_args__ = (
        Index("ix_hr_patient_time", "patient_id", "timestamp"),
    )


# ============================================================================
# SpO2 Data
# ============================================================================

class SpO2Data(Base):
    """Blood oxygen saturation measurements."""
    
    __tablename__ = "spo2_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    spo2_value: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    perfusion_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_during_sleep: Mapped[bool] = mapped_column(Boolean, default=False)
    
    __table_args__ = (
        Index("ix_spo2_patient_time", "patient_id", "timestamp"),
    )


# ============================================================================
# Sleep Data
# ============================================================================

class SleepData(Base):
    """Detailed sleep tracking data."""
    
    __tablename__ = "sleep_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Sleep Period
    sleep_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sleep_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    
    # Duration
    total_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    time_to_fall_asleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Stages
    deep_sleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    light_sleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rem_sleep_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    awake_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    awake_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Quality Metrics
    sleep_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_efficiency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    restlessness_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Vitals During Sleep
    avg_heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_spo2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_spo2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_respiratory_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    snoring_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Environment
    room_temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    room_humidity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Stage Timeline (JSON array of {stage, start_offset_minutes, duration_minutes})
    stage_timeline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_sleep_patient_date", "patient_id", "date"),
    )


# ============================================================================
# Activity Data
# ============================================================================

class ActivityData(Base):
    """Activity and exercise tracking data."""
    
    __tablename__ = "activity_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Activity Period
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    
    # Activity Type
    activity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    activity_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Metrics
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_meters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    calories_burned: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    elevation_gain_meters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Heart Rate During Activity
    avg_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate_zones: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Performance
    pace_per_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    speed_avg_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    power_watts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vo2_max_estimate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # GPS (optional)
    gps_route: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    __table_args__ = (
        Index("ix_activity_patient_date", "patient_id", "date"),
        Index("ix_activity_type_date", "activity_type", "date"),
    )


# ============================================================================
# ECG Data
# ============================================================================

class ECGData(Base):
    """Electrocardiogram data from smartwatch."""
    
    __tablename__ = "ecg_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    # ECG Recording
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    sampling_rate_hz: Mapped[int] = mapped_column(Integer, nullable=False)
    lead_count: Mapped[int] = mapped_column(Integer, default=1)
    
    # Raw Data (stored as compressed JSON or binary reference)
    ecg_data_reference: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Classification
    classification: Mapped[str] = mapped_column(String(50), nullable=False)
    classification_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Findings
    heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pr_interval_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qrs_duration_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qt_interval_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    qtc_interval_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Abnormalities
    atrial_fibrillation: Mapped[bool] = mapped_column(Boolean, default=False)
    irregular_rhythm: Mapped[bool] = mapped_column(Boolean, default=False)
    bradycardia: Mapped[bool] = mapped_column(Boolean, default=False)
    tachycardia: Mapped[bool] = mapped_column(Boolean, default=False)
    st_elevation: Mapped[bool] = mapped_column(Boolean, default=False)
    st_depression: Mapped[bool] = mapped_column(Boolean, default=False)
    t_wave_abnormality: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Doctor Review
    reviewed_by_doctor: Mapped[bool] = mapped_column(Boolean, default=False)
    doctor_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    doctor_classification: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # AI Analysis
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    __table_args__ = (
        Index("ix_ecg_patient_time", "patient_id", "timestamp"),
    )


# ============================================================================
# Stress Data
# ============================================================================

class StressData(Base):
    """Stress level measurements."""
    
    __tablename__ = "stress_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    stress_level: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    stress_category: Mapped[str] = mapped_column(String(20), nullable=False)  # low, medium, high
    hrv_based: Mapped[bool] = mapped_column(Boolean, default=True)
    eda_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    body_battery: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        Index("ix_stress_patient_time", "patient_id", "timestamp"),
    )


# ============================================================================
# Temperature Data
# ============================================================================

class TemperatureData(Base):
    """Skin/body temperature measurements."""
    
    __tablename__ = "temperature_data"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    skin_temperature: Mapped[float] = mapped_column(Float, nullable=False)
    deviation_from_baseline: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ambient_temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    measurement_location: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    
    __table_args__ = (
        Index("ix_temp_patient_time", "patient_id", "timestamp"),
    )


# ============================================================================
# Blood Pressure Estimate
# ============================================================================

class BloodPressureEstimate(Base):
    """Blood pressure estimates from smartwatch."""
    
    __tablename__ = "blood_pressure_estimates"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    device_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    systolic: Mapped[int] = mapped_column(Integer, nullable=False)
    diastolic: Mapped[int] = mapped_column(Integer, nullable=False)
    pulse_pressure: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mean_arterial_pressure: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_calibrated: Mapped[bool] = mapped_column(Boolean, default=False)
    body_position: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Classification
    classification: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    # normal, elevated, hypertension_stage1, hypertension_stage2, hypertensive_crisis
    
    __table_args__ = (
        Index("ix_bp_patient_time", "patient_id", "timestamp"),
    )

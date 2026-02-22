"""
Enhanced Wearable & IoT Device Models
=======================================
Continuous glucose monitoring, fall detection, medication reminders,
gait analysis, respiratory monitors, and pain tracking.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class DeviceType(str, enum.Enum):
    CGM = "continuous_glucose_monitor"
    FALL_DETECTOR = "fall_detector"
    ECG_MONITOR = "ecg_monitor"
    PULSE_OX = "pulse_oximeter"
    BP_MONITOR = "blood_pressure_monitor"
    RESPIRATORY = "respiratory_monitor"
    ACTIVITY_TRACKER = "activity_tracker"
    SLEEP_TRACKER = "sleep_tracker"
    PAIN_TRACKER = "pain_tracker"
    SMART_SCALE = "smart_scale"
    TEMPERATURE = "temperature_monitor"


class AlertPriority(str, enum.Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class WearableDevice(Base):
    """Connected wearable/IoT device registration."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_type: Mapped[str] = mapped_column(String(30), nullable=False)
    device_name: Mapped[str] = mapped_column(String(200), nullable=False)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    firmware_version: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    connection_type: Mapped[str] = mapped_column(String(20), default="bluetooth")
    paired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    battery_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    settings: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    alert_thresholds: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    data_sharing_consent: Mapped[bool] = mapped_column(Boolean, default=True)


class ContinuousGlucoseReading(Base):
    """Continuous glucose monitor readings."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("wearable_device.id"), nullable=False)
    reading_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    glucose_mg_dl: Mapped[float] = mapped_column(Float, nullable=False)
    trend_direction: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    trend_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_high: Mapped[bool] = mapped_column(Boolean, default=False)
    is_low: Mapped[bool] = mapped_column(Boolean, default=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    calibrated: Mapped[bool] = mapped_column(Boolean, default=True)
    sensor_age_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class GlucoseSummary(Base):
    """Daily/weekly glucose summary statistics."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    period_type: Mapped[str] = mapped_column(String(10), default="daily")
    average_glucose: Mapped[float] = mapped_column(Float, default=0.0)
    standard_deviation: Mapped[float] = mapped_column(Float, default=0.0)
    coefficient_variation: Mapped[float] = mapped_column(Float, default=0.0)
    gmi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    time_in_range_percent: Mapped[float] = mapped_column(Float, default=0.0)
    time_above_range_percent: Mapped[float] = mapped_column(Float, default=0.0)
    time_below_range_percent: Mapped[float] = mapped_column(Float, default=0.0)
    time_very_high_percent: Mapped[float] = mapped_column(Float, default=0.0)
    time_very_low_percent: Mapped[float] = mapped_column(Float, default=0.0)
    readings_count: Mapped[int] = mapped_column(Integer, default=0)
    sensor_usage_percent: Mapped[float] = mapped_column(Float, default=0.0)


class FallDetectionEvent(Base):
    """Fall detection and response event."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("wearable_device.id"), nullable=False)
    event_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fall_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    impact_severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location_gps: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location_description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    confirmed_fall: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    false_alarm: Mapped[bool] = mapped_column(Boolean, default=False)
    patient_responded: Mapped[bool] = mapped_column(Boolean, default=False)
    response_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    emergency_called: Mapped[bool] = mapped_column(Boolean, default=False)
    caregiver_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    injury_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    injury_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hospitalization_required: Mapped[bool] = mapped_column(Boolean, default=False)
    pre_fall_activity: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    surface_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    accelerometer_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    gyroscope_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class MedicationReminder(Base):
    """Smart medication reminder and adherence."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    scheduled_times: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_advance_minutes: Mapped[int] = mapped_column(Integer, default=15)
    snooze_minutes: Mapped[int] = mapped_column(Integer, default=10)
    max_snooze_count: Mapped[int] = mapped_column(Integer, default=3)
    adherence_rate: Mapped[float] = mapped_column(Float, default=0.0)
    doses_taken: Mapped[int] = mapped_column(Integer, default=0)
    doses_missed: Mapped[int] = mapped_column(Integer, default=0)
    doses_late: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    refill_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    refill_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    smart_dispenser_linked: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active")


class MedicationDoseLog(Base):
    """Individual medication dose log."""
    reminder_id: Mapped[str] = mapped_column(String(36), ForeignKey("medication_reminder.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    scheduled_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    taken_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    skip_reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    side_effects: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    confirmed_by: Mapped[str] = mapped_column(String(20), default="patient")


class GaitAnalysis(Base):
    """Gait analysis and movement assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("wearable_device.id"), nullable=False)
    analysis_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    step_count: Mapped[int] = mapped_column(Integer, default=0)
    stride_length_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    walking_speed_m_s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cadence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    step_symmetry: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    double_support_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stance_phase_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    swing_phase_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gait_variability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    balance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fall_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    freezing_episodes: Mapped[int] = mapped_column(Integer, default=0)
    assistive_device_used: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    terrain_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    abnormalities: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    comparison_baseline: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class RespiratoryMonitoring(Base):
    """Respiratory monitoring data."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("wearable_device.id"), nullable=False)
    reading_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    respiratory_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    spo2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    peak_flow: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fev1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cough_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    wheeze_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    apnea_events: Mapped[int] = mapped_column(Integer, default=0)
    oxygen_desaturation_events: Mapped[int] = mapped_column(Integer, default=0)
    is_abnormal: Mapped[bool] = mapped_column(Boolean, default=False)
    alert_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    supplemental_oxygen: Mapped[bool] = mapped_column(Boolean, default=False)
    oxygen_flow_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    activity_context: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class PainTrackingEntry(Base):
    """Pain level tracking entry."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    entry_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pain_level: Mapped[int] = mapped_column(Integer, nullable=False)
    pain_scale: Mapped[str] = mapped_column(String(20), default="NRS")
    pain_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    character: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    triggers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    relieving_factors: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medication_taken: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medication_effective: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    activity_at_onset: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    functional_impact: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    mood_impact: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_impact: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class SleepAnalysis(Base):
    """Sleep tracking and analysis."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("wearable_device.id"), nullable=True)
    sleep_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    bedtime: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    wake_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_sleep_minutes: Mapped[int] = mapped_column(Integer, default=0)
    sleep_latency_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    awakenings: Mapped[int] = mapped_column(Integer, default=0)
    light_sleep_minutes: Mapped[int] = mapped_column(Integer, default=0)
    deep_sleep_minutes: Mapped[int] = mapped_column(Integer, default=0)
    rem_sleep_minutes: Mapped[int] = mapped_column(Integer, default=0)
    sleep_efficiency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sleep_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_spo2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    snoring_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    apnea_events: Mapped[int] = mapped_column(Integer, default=0)
    restless_periods: Mapped[int] = mapped_column(Integer, default=0)
    sleep_quality: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class VitalSignsStream(Base):
    """Continuous vital signs streaming data."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("wearable_device.id"), nullable=False)
    timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_pressure_systolic: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_pressure_diastolic: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    spo2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    respiratory_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hrv_sdnn: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hrv_rmssd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stress_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    body_battery: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    calories_burned: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    activity_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    alert_generated: Mapped[bool] = mapped_column(Boolean, default=False)

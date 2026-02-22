"""
Wearable Enhanced & IoT Monitoring API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.wearable_enhanced import (
    WearableDevice, ContinuousGlucoseReading, GlucoseSummary,
    FallDetectionEvent, MedicationReminder, MedicationDoseLog,
    GaitAnalysis, RespiratoryMonitoring, PainTrackingEntry, SleepAnalysis, VitalSignsStream,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/wearables", tags=["Wearables & IoT"])

@router.get("/devices")
async def list_devices(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(WearableDevice).where(WearableDevice.user_id == user_id, WearableDevice.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/devices")
async def register_device(device_type: str = Body(...), device_name: str = Body(None), manufacturer: str = Body(None),
                            model: str = Body(None), serial_number: str = Body(None),
                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    device = WearableDevice(user_id=user_id, device_type=device_type, device_name=device_name,
                             manufacturer=manufacturer, model=model, serial_number=serial_number, status="active")
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device.to_dict()

@router.get("/glucose")
async def list_glucose_readings(skip: int = 0, limit: int = 100, user_id: str = Depends(get_current_user_id),
                                  db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ContinuousGlucoseReading).where(ContinuousGlucoseReading.user_id == user_id)
                               .order_by(desc(ContinuousGlucoseReading.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/glucose")
async def submit_glucose_reading(glucose_mg_dl: float = Body(...), sensor_id: str = Body(None),
                                   trend: str = Body(None), user_id: str = Depends(get_current_user_id),
                                   db: AsyncSession = Depends(get_db_session)):
    reading = ContinuousGlucoseReading(user_id=user_id, glucose_mg_dl=glucose_mg_dl, sensor_id=sensor_id,
                                        trend=trend, recorded_at=datetime.now(timezone.utc))
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading.to_dict()

@router.get("/glucose/summary")
async def get_glucose_summary(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GlucoseSummary).where(GlucoseSummary.user_id == user_id)
                               .order_by(desc(GlucoseSummary.created_at)).limit(7))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/fall-events")
async def list_fall_events(patient_id: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                             db: AsyncSession = Depends(get_db_session)):
    q = select(FallDetectionEvent).where(FallDetectionEvent.user_id == (patient_id or user_id))
    result = await db.execute(q.order_by(desc(FallDetectionEvent.created_at)))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/fall-events")
async def report_fall_event(severity: str = Body("moderate"), location: str = Body(None),
                              injury_reported: bool = Body(False), user_id: str = Depends(get_current_user_id),
                              db: AsyncSession = Depends(get_db_session)):
    event = FallDetectionEvent(user_id=user_id, severity=severity, location=location,
                                injury_reported=injury_reported, detected_at=datetime.now(timezone.utc))
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event.to_dict()

@router.get("/medication-reminders")
async def list_medication_reminders(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(MedicationReminder).where(MedicationReminder.user_id == user_id, MedicationReminder.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/medication-reminders")
async def create_medication_reminder(medication_name: str = Body(...), dosage: str = Body(None),
                                       reminder_time: str = Body(None), frequency: str = Body("daily"),
                                       user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    reminder = MedicationReminder(user_id=user_id, medication_name=medication_name, dosage=dosage,
                                   reminder_time=reminder_time, frequency=frequency, is_active_reminder=True)
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder.to_dict()

@router.post("/medication-dose-logs")
async def log_medication_dose(reminder_id: str = Body(...), taken: bool = Body(True), notes: str = Body(None),
                                user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    log = MedicationDoseLog(reminder_id=reminder_id, user_id=user_id, taken=taken, notes=notes,
                             logged_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log.to_dict()

@router.get("/medication-dose-logs")
async def list_dose_logs(skip: int = 0, limit: int = 50, user_id: str = Depends(get_current_user_id),
                          db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(MedicationDoseLog).where(MedicationDoseLog.user_id == user_id)
                               .order_by(desc(MedicationDoseLog.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/gait-analysis")
async def list_gait_analyses(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GaitAnalysis).where(GaitAnalysis.user_id == user_id, GaitAnalysis.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/gait-analysis")
async def submit_gait_analysis(step_count: int = Body(None), gait_speed_m_s: float = Body(None),
                                 stride_length_cm: float = Body(None), symmetry_index: float = Body(None),
                                 fall_risk_score: float = Body(None), user_id: str = Depends(get_current_user_id),
                                 db: AsyncSession = Depends(get_db_session)):
    analysis = GaitAnalysis(user_id=user_id, step_count=step_count, gait_speed_m_s=gait_speed_m_s,
                             stride_length_cm=stride_length_cm, symmetry_index=symmetry_index,
                             fall_risk_score=fall_risk_score, analyzed_at=datetime.now(timezone.utc))
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis.to_dict()

@router.get("/respiratory")
async def list_respiratory_data(skip: int = 0, limit: int = 100, user_id: str = Depends(get_current_user_id),
                                  db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(RespiratoryMonitoring).where(RespiratoryMonitoring.user_id == user_id)
                               .order_by(desc(RespiratoryMonitoring.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/respiratory")
async def submit_respiratory_data(respiratory_rate: int = Body(None), spo2: float = Body(None),
                                    peak_flow: float = Body(None), cough_count: int = Body(None),
                                    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    data = RespiratoryMonitoring(user_id=user_id, respiratory_rate=respiratory_rate, spo2=spo2,
                                  peak_flow=peak_flow, cough_count=cough_count, recorded_at=datetime.now(timezone.utc))
    db.add(data)
    await db.commit()
    await db.refresh(data)
    return data.to_dict()

@router.get("/pain-tracking")
async def list_pain_entries(skip: int = 0, limit: int = 50, user_id: str = Depends(get_current_user_id),
                              db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(PainTrackingEntry).where(PainTrackingEntry.user_id == user_id)
                               .order_by(desc(PainTrackingEntry.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/pain-tracking")
async def log_pain(pain_level: int = Body(...), location: str = Body(None), pain_type: str = Body(None),
                    triggers: str = Body(None), relief_measures: str = Body(None),
                    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    entry = PainTrackingEntry(user_id=user_id, pain_level=pain_level, location=location, pain_type=pain_type,
                               triggers=triggers, relief_measures=relief_measures, logged_at=datetime.now(timezone.utc))
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry.to_dict()

@router.get("/sleep-analysis")
async def list_sleep_analyses(skip: int = 0, limit: int = 30, user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(SleepAnalysis).where(SleepAnalysis.user_id == user_id)
                               .order_by(desc(SleepAnalysis.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/sleep-analysis")
async def submit_sleep_analysis(total_sleep_hours: float = Body(None), deep_sleep_hours: float = Body(None),
                                  rem_sleep_hours: float = Body(None), light_sleep_hours: float = Body(None),
                                  awakenings: int = Body(None), sleep_score: int = Body(None),
                                  user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    analysis = SleepAnalysis(user_id=user_id, total_sleep_hours=total_sleep_hours, deep_sleep_hours=deep_sleep_hours,
                              rem_sleep_hours=rem_sleep_hours, light_sleep_hours=light_sleep_hours,
                              awakenings=awakenings, sleep_score=sleep_score)
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis.to_dict()

@router.get("/vitals-stream")
async def list_vitals_stream(skip: int = 0, limit: int = 100, user_id: str = Depends(get_current_user_id),
                               db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(VitalSignsStream).where(VitalSignsStream.user_id == user_id)
                               .order_by(desc(VitalSignsStream.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/vitals-stream")
async def submit_vitals(heart_rate: int = Body(None), systolic_bp: int = Body(None), diastolic_bp: int = Body(None),
                         temperature_f: float = Body(None), spo2: float = Body(None),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    vitals = VitalSignsStream(user_id=user_id, heart_rate=heart_rate, systolic_bp=systolic_bp,
                               diastolic_bp=diastolic_bp, temperature_f=temperature_f, spo2=spo2,
                               recorded_at=datetime.now(timezone.utc))
    db.add(vitals)
    await db.commit()
    await db.refresh(vitals)
    return vitals.to_dict()

@router.get("/dashboard/stats")
async def wearable_stats(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    devices = await db.execute(select(func.count()).select_from(WearableDevice).where(WearableDevice.user_id == user_id, WearableDevice.status == "active"))
    falls = await db.execute(select(func.count()).select_from(FallDetectionEvent).where(FallDetectionEvent.user_id == user_id))
    reminders = await db.execute(select(func.count()).select_from(MedicationReminder).where(MedicationReminder.user_id == user_id, MedicationReminder.is_active_reminder == True))
    avg_sleep = await db.execute(select(func.avg(SleepAnalysis.sleep_score)).where(SleepAnalysis.user_id == user_id))
    return {"active_devices": devices.scalar() or 0, "fall_events": falls.scalar() or 0,
            "active_reminders": reminders.scalar() or 0, "avg_sleep_score": round(avg_sleep.scalar() or 0, 1)}

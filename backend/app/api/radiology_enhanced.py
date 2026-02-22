"""
Radiology Enhanced API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.radiology_enhanced import (
    AIReadingResult, TumorMeasurement, RadiationDoseRecord,
    StructuredRadiologyReport, ImagingProtocol, ContrastReaction, ImagingOrderTracking,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/radiology", tags=["Radiology"])

@router.get("/ai-readings")
async def list_ai_readings(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(AIReadingResult).where(AIReadingResult.is_deleted == False)
    if patient_id:
        q = q.where(AIReadingResult.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/ai-readings")
async def create_ai_reading(patient_id: str = Body(...), study_id: str = Body(None), modality: str = Body(...),
                              findings: str = Body(None), confidence_score: float = Body(None),
                              abnormality_detected: bool = Body(False), ai_model_version: str = Body(None),
                              db: AsyncSession = Depends(get_db_session)):
    reading = AIReadingResult(patient_id=patient_id, study_id=study_id, modality=modality, findings=findings,
                               confidence_score=confidence_score, abnormality_detected=abnormality_detected,
                               ai_model_version=ai_model_version, analyzed_at=datetime.now(timezone.utc))
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading.to_dict()

@router.get("/tumor-measurements")
async def list_tumor_measurements(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(TumorMeasurement).where(TumorMeasurement.is_deleted == False)
    if patient_id:
        q = q.where(TumorMeasurement.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/tumor-measurements")
async def create_tumor_measurement(patient_id: str = Body(...), location: str = Body(...),
                                     longest_diameter_mm: float = Body(None), perpendicular_mm: float = Body(None),
                                     volume_cc: float = Body(None), recist_response: str = Body(None),
                                     user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    measurement = TumorMeasurement(patient_id=patient_id, location=location, longest_diameter_mm=longest_diameter_mm,
                                    perpendicular_mm=perpendicular_mm, volume_cc=volume_cc,
                                    recist_response=recist_response, measured_by=user_id, measured_at=datetime.now(timezone.utc))
    db.add(measurement)
    await db.commit()
    await db.refresh(measurement)
    return measurement.to_dict()

@router.get("/radiation-doses")
async def list_radiation_doses(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(RadiationDoseRecord).where(RadiationDoseRecord.is_deleted == False)
    if patient_id:
        q = q.where(RadiationDoseRecord.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/radiation-doses")
async def record_radiation_dose(patient_id: str = Body(...), modality: str = Body(...), dose_mgy: float = Body(None),
                                  dlp_mgy_cm: float = Body(None), ctdi_mgy: float = Body(None),
                                  body_part: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    dose = RadiationDoseRecord(patient_id=patient_id, modality=modality, dose_mgy=dose_mgy,
                                dlp_mgy_cm=dlp_mgy_cm, ctdi_mgy=ctdi_mgy, body_part=body_part,
                                recorded_at=datetime.now(timezone.utc))
    db.add(dose)
    await db.commit()
    await db.refresh(dose)
    return dose.to_dict()

@router.get("/structured-reports")
async def list_structured_reports(patient_id: Optional[str] = None, status: Optional[str] = None,
                                    db: AsyncSession = Depends(get_db_session)):
    q = select(StructuredRadiologyReport).where(StructuredRadiologyReport.is_deleted == False)
    if patient_id:
        q = q.where(StructuredRadiologyReport.patient_id == patient_id)
    if status:
        q = q.where(StructuredRadiologyReport.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/structured-reports")
async def create_structured_report(patient_id: str = Body(...), modality: str = Body(...), findings: str = Body(None),
                                     impression: str = Body(None), recommendations: str = Body(None),
                                     birads_category: str = Body(None), lung_rads: str = Body(None),
                                     user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    report = StructuredRadiologyReport(patient_id=patient_id, modality=modality, findings=findings,
                                        impression=impression, recommendations=recommendations,
                                        birads_category=birads_category, lung_rads=lung_rads,
                                        radiologist_id=user_id, status="draft")
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report.to_dict()

@router.get("/imaging-protocols")
async def list_imaging_protocols(modality: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ImagingProtocol).where(ImagingProtocol.is_deleted == False)
    if modality:
        q = q.where(ImagingProtocol.modality == modality)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/contrast-reactions")
async def list_contrast_reactions(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ContrastReaction).where(ContrastReaction.is_deleted == False)
    if patient_id:
        q = q.where(ContrastReaction.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/contrast-reactions")
async def report_contrast_reaction(patient_id: str = Body(...), contrast_agent: str = Body(...),
                                     reaction_type: str = Body(...), severity: str = Body("mild"),
                                     treatment: str = Body(None), user_id: str = Depends(get_current_user_id),
                                     db: AsyncSession = Depends(get_db_session)):
    reaction = ContrastReaction(patient_id=patient_id, contrast_agent=contrast_agent, reaction_type=reaction_type,
                                 severity=severity, treatment=treatment, reported_by=user_id)
    db.add(reaction)
    await db.commit()
    await db.refresh(reaction)
    return reaction.to_dict()

@router.get("/order-tracking")
async def list_imaging_orders(status: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(ImagingOrderTracking).where(ImagingOrderTracking.is_deleted == False)
    if status:
        q = q.where(ImagingOrderTracking.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def radiology_stats(db: AsyncSession = Depends(get_db_session)):
    ai_detections = await db.execute(select(func.count()).select_from(AIReadingResult).where(AIReadingResult.abnormality_detected == True))
    reports = await db.execute(select(func.count()).select_from(StructuredRadiologyReport).where(StructuredRadiologyReport.is_deleted == False))
    pending = await db.execute(select(func.count()).select_from(StructuredRadiologyReport).where(StructuredRadiologyReport.status == "draft"))
    measurements = await db.execute(select(func.count()).select_from(TumorMeasurement).where(TumorMeasurement.is_deleted == False))
    return {"ai_abnormalities_detected": ai_detections.scalar() or 0, "total_reports": reports.scalar() or 0,
            "pending_reports": pending.scalar() or 0, "tumor_measurements": measurements.scalar() or 0}

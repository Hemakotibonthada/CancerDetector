"""
Quality & Patient Safety API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.quality_safety import (
    AdverseEvent, IncidentReport, QualityMeasure, InfectionControlRecord,
    SafetyChecklist, ChecklistCompletion, RootCauseAnalysis,
    FallRiskAssessment, PressureInjuryAssessment,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/quality-safety", tags=["Quality & Safety"])

@router.get("/adverse-events")
async def list_adverse_events(severity: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 50,
                               db: AsyncSession = Depends(get_db_session)):
    q = select(AdverseEvent).where(AdverseEvent.is_deleted == False)
    if severity:
        q = q.where(AdverseEvent.severity == severity)
    if status:
        q = q.where(AdverseEvent.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/adverse-events")
async def report_adverse_event(patient_id: str = Body(...), event_type: str = Body(...), severity: str = Body("moderate"),
                                description: str = Body(...), medications_involved: str = Body(None),
                                user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    event = AdverseEvent(patient_id=patient_id, event_type=event_type, severity=severity, description=description,
                         medications_involved=medications_involved, reported_by=user_id, reported_at=datetime.now(timezone.utc))
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event.to_dict()

@router.get("/incident-reports")
async def list_incidents(status: Optional[str] = None, category: Optional[str] = None, skip: int = 0, limit: int = 50,
                         db: AsyncSession = Depends(get_db_session)):
    q = select(IncidentReport).where(IncidentReport.is_deleted == False)
    if status:
        q = q.where(IncidentReport.status == status)
    if category:
        q = q.where(IncidentReport.category == category)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/incident-reports")
async def create_incident_report(title: str = Body(...), category: str = Body(...), description: str = Body(...),
                                  severity: str = Body("moderate"), location: str = Body(None), patient_id: str = Body(None),
                                  user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    report = IncidentReport(title=title, category=category, description=description, severity=severity,
                             location=location, patient_id=patient_id, reported_by=user_id,
                             reported_at=datetime.now(timezone.utc), status="open")
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report.to_dict()

@router.put("/incident-reports/{report_id}/investigate")
async def update_incident_investigation(report_id: str, findings: str = Body(None), corrective_actions: str = Body(None),
                                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    report = await db.get(IncidentReport, report_id)
    if not report:
        raise HTTPException(404, "Incident report not found")
    report.status = "investigating"
    report.findings = findings
    report.corrective_actions = corrective_actions
    report.investigated_by = user_id
    await db.commit()
    return report.to_dict()

@router.get("/quality-measures")
async def list_quality_measures(category: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(QualityMeasure).where(QualityMeasure.is_deleted == False)
    if category:
        q = q.where(QualityMeasure.category == category)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/quality-measures")
async def create_quality_measure(name: str = Body(...), category: str = Body(...), description: str = Body(None),
                                  numerator_criteria: str = Body(None), denominator_criteria: str = Body(None),
                                  target_value: float = Body(None), db: AsyncSession = Depends(get_db_session)):
    measure = QualityMeasure(name=name, category=category, description=description, numerator_criteria=numerator_criteria,
                              denominator_criteria=denominator_criteria, target_value=target_value)
    db.add(measure)
    await db.commit()
    await db.refresh(measure)
    return measure.to_dict()

@router.get("/infection-control")
async def list_infection_records(infection_type: Optional[str] = None, skip: int = 0, limit: int = 50,
                                  db: AsyncSession = Depends(get_db_session)):
    q = select(InfectionControlRecord).where(InfectionControlRecord.is_deleted == False)
    if infection_type:
        q = q.where(InfectionControlRecord.infection_type == infection_type)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/infection-control")
async def create_infection_record(patient_id: str = Body(...), infection_type: str = Body(...), organism: str = Body(None),
                                   location: str = Body(None), onset_date: str = Body(None), is_hai: bool = Body(False),
                                   user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    record = InfectionControlRecord(patient_id=patient_id, infection_type=infection_type, organism=organism,
                                     location=location, onset_date=onset_date, is_hai=is_hai, reported_by=user_id)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record.to_dict()

@router.get("/safety-checklists")
async def list_safety_checklists(checklist_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(SafetyChecklist).where(SafetyChecklist.is_deleted == False)
    if checklist_type:
        q = q.where(SafetyChecklist.checklist_type == checklist_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/safety-checklists/{checklist_id}/complete")
async def complete_checklist(checklist_id: str, patient_id: str = Body(...), responses: str = Body(None),
                              user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    completion = ChecklistCompletion(checklist_id=checklist_id, patient_id=patient_id, completed_by=user_id,
                                     responses=responses, completed_at=datetime.now(timezone.utc))
    db.add(completion)
    await db.commit()
    await db.refresh(completion)
    return completion.to_dict()

@router.get("/root-cause-analyses")
async def list_rca(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(RootCauseAnalysis).where(RootCauseAnalysis.is_deleted == False)
    if status:
        q = q.where(RootCauseAnalysis.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/root-cause-analyses")
async def create_rca(incident_id: str = Body(...), root_causes: str = Body(None), contributing_factors: str = Body(None),
                     action_plan: str = Body(None), user_id: str = Depends(get_current_user_id),
                     db: AsyncSession = Depends(get_db_session)):
    rca = RootCauseAnalysis(incident_id=incident_id, root_causes=root_causes, contributing_factors=contributing_factors,
                             action_plan=action_plan, led_by=user_id, status="in_progress")
    db.add(rca)
    await db.commit()
    await db.refresh(rca)
    return rca.to_dict()

@router.get("/fall-risk-assessments")
async def list_fall_risk(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(FallRiskAssessment).where(FallRiskAssessment.is_deleted == False)
    if patient_id:
        q = q.where(FallRiskAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/fall-risk-assessments")
async def create_fall_risk_assessment(patient_id: str = Body(...), score: int = Body(...), risk_level: str = Body("moderate"),
                                       interventions: str = Body(None), user_id: str = Depends(get_current_user_id),
                                       db: AsyncSession = Depends(get_db_session)):
    assessment = FallRiskAssessment(patient_id=patient_id, score=score, risk_level=risk_level,
                                    interventions=interventions, assessed_by=user_id, assessed_at=datetime.now(timezone.utc))
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/pressure-injury-assessments")
async def list_pressure_injury(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PressureInjuryAssessment).where(PressureInjuryAssessment.is_deleted == False)
    if patient_id:
        q = q.where(PressureInjuryAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/pressure-injury-assessments")
async def create_pressure_injury_assessment(patient_id: str = Body(...), braden_score: int = Body(...),
                                              risk_level: str = Body("moderate"), location: str = Body(None),
                                              stage: str = Body(None), user_id: str = Depends(get_current_user_id),
                                              db: AsyncSession = Depends(get_db_session)):
    assessment = PressureInjuryAssessment(patient_id=patient_id, braden_score=braden_score, risk_level=risk_level,
                                           location=location, stage=stage, assessed_by=user_id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/dashboard/stats")
async def quality_safety_stats(db: AsyncSession = Depends(get_db_session)):
    adverse = await db.execute(select(func.count()).select_from(AdverseEvent).where(AdverseEvent.is_deleted == False))
    incidents_open = await db.execute(select(func.count()).select_from(IncidentReport).where(IncidentReport.status == "open", IncidentReport.is_deleted == False))
    infections = await db.execute(select(func.count()).select_from(InfectionControlRecord).where(InfectionControlRecord.is_hai == True, InfectionControlRecord.is_deleted == False))
    measures = await db.execute(select(func.count()).select_from(QualityMeasure).where(QualityMeasure.is_deleted == False))
    return {"total_adverse_events": adverse.scalar() or 0, "open_incidents": incidents_open.scalar() or 0,
            "hai_count": infections.scalar() or 0, "quality_measures": measures.scalar() or 0}

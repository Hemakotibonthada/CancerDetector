"""
Emergency & Critical Care API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.emergency import (
    TriageAssessment, SepsisScreening, StrokeAssessment,
    CodeEvent, TraumaAssessment, RapidResponseTeam,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/emergency", tags=["Emergency"])

@router.get("/triage")
async def list_triage(status: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(TriageAssessment).where(TriageAssessment.is_deleted == False)
    if status:
        q = q.where(TriageAssessment.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/triage")
async def create_triage(patient_id: str = Body(...), esi_level: int = Body(...), chief_complaint: str = Body(...),
                         vital_signs: str = Body(None), pain_level: int = Body(None), acuity: str = Body(None),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    triage = TriageAssessment(patient_id=patient_id, esi_level=esi_level, chief_complaint=chief_complaint,
                               vital_signs=vital_signs, pain_level=pain_level, acuity=acuity,
                               triaged_by=user_id, triaged_at=datetime.now(timezone.utc), status="active")
    db.add(triage)
    await db.commit()
    await db.refresh(triage)
    return triage.to_dict()

@router.get("/sepsis-screenings")
async def list_sepsis_screenings(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(SepsisScreening).where(SepsisScreening.is_deleted == False)
    if patient_id:
        q = q.where(SepsisScreening.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/sepsis-screenings")
async def create_sepsis_screening(patient_id: str = Body(...), sirs_criteria_met: int = Body(None),
                                    sofa_score: int = Body(None), qsofa_score: int = Body(None),
                                    lactate_level: float = Body(None), is_sepsis_positive: bool = Body(False),
                                    interventions: str = Body(None), user_id: str = Depends(get_current_user_id),
                                    db: AsyncSession = Depends(get_db_session)):
    screening = SepsisScreening(patient_id=patient_id, sirs_criteria_met=sirs_criteria_met, sofa_score=sofa_score,
                                 qsofa_score=qsofa_score, lactate_level=lactate_level,
                                 is_sepsis_positive=is_sepsis_positive, interventions=interventions,
                                 screened_by=user_id, screened_at=datetime.now(timezone.utc))
    db.add(screening)
    await db.commit()
    await db.refresh(screening)
    return screening.to_dict()

@router.get("/stroke-assessments")
async def list_stroke_assessments(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(StrokeAssessment).where(StrokeAssessment.is_deleted == False)
    if patient_id:
        q = q.where(StrokeAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/stroke-assessments")
async def create_stroke_assessment(patient_id: str = Body(...), nihss_score: int = Body(None),
                                     symptom_onset: str = Body(None), ct_findings: str = Body(None),
                                     tpa_eligible: bool = Body(None), is_stroke_positive: bool = Body(False),
                                     user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    assessment = StrokeAssessment(patient_id=patient_id, nihss_score=nihss_score, symptom_onset=symptom_onset,
                                   ct_findings=ct_findings, tpa_eligible=tpa_eligible,
                                   is_stroke_positive=is_stroke_positive, assessed_by=user_id,
                                   assessed_at=datetime.now(timezone.utc))
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/code-events")
async def list_code_events(code_type: Optional[str] = None, status: Optional[str] = None,
                            db: AsyncSession = Depends(get_db_session)):
    q = select(CodeEvent).where(CodeEvent.is_deleted == False)
    if code_type:
        q = q.where(CodeEvent.code_type == code_type)
    if status:
        q = q.where(CodeEvent.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/code-events")
async def create_code_event(patient_id: str = Body(...), code_type: str = Body(...), location: str = Body(None),
                              team_members: str = Body(None), user_id: str = Depends(get_current_user_id),
                              db: AsyncSession = Depends(get_db_session)):
    event = CodeEvent(patient_id=patient_id, code_type=code_type, location=location, team_members=team_members,
                       called_by=user_id, called_at=datetime.now(timezone.utc), status="active")
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event.to_dict()

@router.put("/code-events/{event_id}/resolve")
async def resolve_code_event(event_id: str, outcome: str = Body(None), duration_minutes: int = Body(None),
                               debrief_notes: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    event = await db.get(CodeEvent, event_id)
    if not event:
        raise HTTPException(404, "Code event not found")
    event.status = "resolved"
    event.outcome = outcome
    event.duration_minutes = duration_minutes
    event.debrief_notes = debrief_notes
    event.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    return event.to_dict()

@router.get("/trauma-assessments")
async def list_trauma_assessments(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(TraumaAssessment).where(TraumaAssessment.is_deleted == False)
    if patient_id:
        q = q.where(TraumaAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/trauma-assessments")
async def create_trauma_assessment(patient_id: str = Body(...), mechanism: str = Body(None),
                                     injury_severity_score: int = Body(None), gcs_score: int = Body(None),
                                     primary_survey: str = Body(None), secondary_survey: str = Body(None),
                                     user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    assessment = TraumaAssessment(patient_id=patient_id, mechanism=mechanism, injury_severity_score=injury_severity_score,
                                   gcs_score=gcs_score, primary_survey=primary_survey, secondary_survey=secondary_survey,
                                   assessed_by=user_id, assessed_at=datetime.now(timezone.utc))
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/rapid-response")
async def list_rapid_response(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(RapidResponseTeam).where(RapidResponseTeam.is_deleted == False)
    if status:
        q = q.where(RapidResponseTeam.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/rapid-response")
async def activate_rapid_response(patient_id: str = Body(...), trigger_criteria: str = Body(None),
                                    location: str = Body(None), user_id: str = Depends(get_current_user_id),
                                    db: AsyncSession = Depends(get_db_session)):
    rrt = RapidResponseTeam(patient_id=patient_id, trigger_criteria=trigger_criteria, location=location,
                             activated_by=user_id, activated_at=datetime.now(timezone.utc), status="activated")
    db.add(rrt)
    await db.commit()
    await db.refresh(rrt)
    return rrt.to_dict()

@router.get("/dashboard/stats")
async def emergency_stats(db: AsyncSession = Depends(get_db_session)):
    triage_active = await db.execute(select(func.count()).select_from(TriageAssessment).where(TriageAssessment.status == "active"))
    sepsis_pos = await db.execute(select(func.count()).select_from(SepsisScreening).where(SepsisScreening.is_sepsis_positive == True))
    stroke_pos = await db.execute(select(func.count()).select_from(StrokeAssessment).where(StrokeAssessment.is_stroke_positive == True))
    active_codes = await db.execute(select(func.count()).select_from(CodeEvent).where(CodeEvent.status == "active"))
    return {"active_triage": triage_active.scalar() or 0, "sepsis_positive": sepsis_pos.scalar() or 0,
            "stroke_positive": stroke_pos.scalar() or 0, "active_codes": active_codes.scalar() or 0}

"""
Rehabilitation & Therapy API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.rehabilitation import (
    RehabPlan, TherapySession, FunctionalAssessment, ExercisePrescription,
    ProgressMilestone, DisabilityScore, PainManagementPlan,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/rehabilitation", tags=["Rehabilitation"])

@router.get("/plans")
async def list_rehab_plans(patient_id: Optional[str] = None, plan_type: Optional[str] = None,
                            db: AsyncSession = Depends(get_db_session)):
    q = select(RehabPlan).where(RehabPlan.is_deleted == False)
    if patient_id:
        q = q.where(RehabPlan.patient_id == patient_id)
    if plan_type:
        q = q.where(RehabPlan.plan_type == plan_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/plans")
async def create_rehab_plan(patient_id: str = Body(...), plan_type: str = Body(...), goals: str = Body(None),
                             frequency: str = Body(None), duration_weeks: int = Body(None),
                             user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    plan = RehabPlan(patient_id=patient_id, plan_type=plan_type, goals=goals, frequency=frequency,
                     duration_weeks=duration_weeks, created_by=user_id, status="active")
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()

@router.get("/therapy-sessions")
async def list_therapy_sessions(plan_id: Optional[str] = None, patient_id: Optional[str] = None,
                                 skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(TherapySession).where(TherapySession.is_deleted == False)
    if plan_id:
        q = q.where(TherapySession.plan_id == plan_id)
    if patient_id:
        q = q.where(TherapySession.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/therapy-sessions")
async def create_therapy_session(plan_id: str = Body(...), patient_id: str = Body(...), session_type: str = Body(...),
                                  duration_minutes: int = Body(60), notes: str = Body(None), exercises_performed: str = Body(None),
                                  pain_level_before: int = Body(None), pain_level_after: int = Body(None),
                                  user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    session = TherapySession(plan_id=plan_id, patient_id=patient_id, session_type=session_type,
                              duration_minutes=duration_minutes, notes=notes, exercises_performed=exercises_performed,
                              pain_level_before=pain_level_before, pain_level_after=pain_level_after,
                              therapist_id=user_id, session_date=datetime.now(timezone.utc))
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session.to_dict()

@router.get("/functional-assessments")
async def list_functional_assessments(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(FunctionalAssessment).where(FunctionalAssessment.is_deleted == False)
    if patient_id:
        q = q.where(FunctionalAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/functional-assessments")
async def create_functional_assessment(patient_id: str = Body(...), assessment_type: str = Body(...),
                                         score: float = Body(None), findings: str = Body(None),
                                         recommendations: str = Body(None), user_id: str = Depends(get_current_user_id),
                                         db: AsyncSession = Depends(get_db_session)):
    assessment = FunctionalAssessment(patient_id=patient_id, assessment_type=assessment_type, score=score,
                                       findings=findings, recommendations=recommendations, assessed_by=user_id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/exercises")
async def list_exercise_prescriptions(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ExercisePrescription).where(ExercisePrescription.is_deleted == False)
    if patient_id:
        q = q.where(ExercisePrescription.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/exercises")
async def create_exercise_prescription(patient_id: str = Body(...), exercise_name: str = Body(...),
                                         sets: int = Body(None), reps: int = Body(None), frequency: str = Body(None),
                                         instructions: str = Body(None), precautions: str = Body(None),
                                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    rx = ExercisePrescription(patient_id=patient_id, exercise_name=exercise_name, sets=sets, reps=reps,
                               frequency=frequency, instructions=instructions, precautions=precautions, prescribed_by=user_id)
    db.add(rx)
    await db.commit()
    await db.refresh(rx)
    return rx.to_dict()

@router.get("/milestones")
async def list_milestones(plan_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ProgressMilestone).where(ProgressMilestone.is_deleted == False)
    if plan_id:
        q = q.where(ProgressMilestone.plan_id == plan_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/milestones")
async def create_milestone(plan_id: str = Body(...), title: str = Body(...), target_date: str = Body(None),
                            criteria: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    milestone = ProgressMilestone(plan_id=plan_id, title=title, target_date=target_date, criteria=criteria, status="pending")
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone.to_dict()

@router.put("/milestones/{milestone_id}/complete")
async def complete_milestone(milestone_id: str, notes: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    milestone = await db.get(ProgressMilestone, milestone_id)
    if not milestone:
        raise HTTPException(404, "Milestone not found")
    milestone.status = "completed"
    milestone.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return milestone.to_dict()

@router.get("/disability-scores")
async def list_disability_scores(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(DisabilityScore).where(DisabilityScore.is_deleted == False)
    if patient_id:
        q = q.where(DisabilityScore.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/pain-management")
async def list_pain_plans(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PainManagementPlan).where(PainManagementPlan.is_deleted == False)
    if patient_id:
        q = q.where(PainManagementPlan.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/pain-management")
async def create_pain_plan(patient_id: str = Body(...), pain_type: str = Body(None), current_level: int = Body(None),
                            target_level: int = Body(None), interventions: str = Body(None), medications: str = Body(None),
                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    plan = PainManagementPlan(patient_id=patient_id, pain_type=pain_type, current_level=current_level,
                               target_level=target_level, interventions=interventions, medications=medications,
                               created_by=user_id)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()

@router.get("/dashboard/stats")
async def rehab_stats(db: AsyncSession = Depends(get_db_session)):
    plans = await db.execute(select(func.count()).select_from(RehabPlan).where(RehabPlan.is_deleted == False))
    sessions = await db.execute(select(func.count()).select_from(TherapySession).where(TherapySession.is_deleted == False))
    milestones = await db.execute(select(func.count()).select_from(ProgressMilestone).where(ProgressMilestone.status == "completed"))
    return {"active_plans": plans.scalar() or 0, "total_sessions": sessions.scalar() or 0,
            "milestones_achieved": milestones.scalar() or 0}

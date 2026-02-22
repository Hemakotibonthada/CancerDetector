"""
Mental Health & Behavioral Health API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.mental_health_enhanced import (
    CBTSession, MindfulnessExercise, MindfulnessSession, CrisisIntervention,
    SafetyPlan, SubstanceUseLog, BehavioralGoal, MentalHealthScreening, GroupTherapySession,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/mental-health", tags=["Mental Health"])

@router.get("/cbt-sessions")
async def list_cbt_sessions(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50,
                              db: AsyncSession = Depends(get_db_session)):
    q = select(CBTSession).where(CBTSession.is_deleted == False)
    if patient_id:
        q = q.where(CBTSession.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/cbt-sessions")
async def create_cbt_session(patient_id: str = Body(...), session_number: int = Body(None), topic: str = Body(None),
                               thought_record: str = Body(None), behavioral_experiment: str = Body(None),
                               homework: str = Body(None), mood_before: int = Body(None), mood_after: int = Body(None),
                               user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    session = CBTSession(patient_id=patient_id, session_number=session_number, topic=topic,
                          thought_record=thought_record, behavioral_experiment=behavioral_experiment,
                          homework=homework, mood_before=mood_before, mood_after=mood_after, therapist_id=user_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session.to_dict()

@router.get("/mindfulness-exercises")
async def list_mindfulness_exercises(category: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(MindfulnessExercise).where(MindfulnessExercise.is_deleted == False)
    if category:
        q = q.where(MindfulnessExercise.category == category)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/mindfulness-exercises")
async def create_mindfulness_exercise(title: str = Body(...), category: str = Body(...), description: str = Body(None),
                                        duration_minutes: int = Body(10), instructions: str = Body(None),
                                        difficulty_level: str = Body("beginner"), db: AsyncSession = Depends(get_db_session)):
    exercise = MindfulnessExercise(title=title, category=category, description=description,
                                    duration_minutes=duration_minutes, instructions=instructions,
                                    difficulty_level=difficulty_level)
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise.to_dict()

@router.post("/mindfulness-sessions")
async def log_mindfulness_session(exercise_id: str = Body(...), duration_minutes: int = Body(None),
                                    mood_before: int = Body(None), mood_after: int = Body(None),
                                    notes: str = Body(None), user_id: str = Depends(get_current_user_id),
                                    db: AsyncSession = Depends(get_db_session)):
    session = MindfulnessSession(user_id=user_id, exercise_id=exercise_id, duration_minutes=duration_minutes,
                                  mood_before=mood_before, mood_after=mood_after, notes=notes,
                                  completed_at=datetime.now(timezone.utc))
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session.to_dict()

@router.get("/mindfulness-sessions")
async def list_mindfulness_sessions(skip: int = 0, limit: int = 50, user_id: str = Depends(get_current_user_id),
                                      db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(MindfulnessSession).where(MindfulnessSession.user_id == user_id)
                               .order_by(desc(MindfulnessSession.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/crisis-interventions")
async def list_crisis_interventions(patient_id: Optional[str] = None, status: Optional[str] = None,
                                      db: AsyncSession = Depends(get_db_session)):
    q = select(CrisisIntervention).where(CrisisIntervention.is_deleted == False)
    if patient_id:
        q = q.where(CrisisIntervention.patient_id == patient_id)
    if status:
        q = q.where(CrisisIntervention.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/crisis-interventions")
async def create_crisis_intervention(patient_id: str = Body(...), crisis_type: str = Body(...),
                                       risk_level: str = Body("moderate"), intervention: str = Body(None),
                                       disposition: str = Body(None), user_id: str = Depends(get_current_user_id),
                                       db: AsyncSession = Depends(get_db_session)):
    ci = CrisisIntervention(patient_id=patient_id, crisis_type=crisis_type, risk_level=risk_level,
                             intervention=intervention, disposition=disposition, clinician_id=user_id,
                             reported_at=datetime.now(timezone.utc), status="active")
    db.add(ci)
    await db.commit()
    await db.refresh(ci)
    return ci.to_dict()

@router.get("/safety-plans")
async def list_safety_plans(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(SafetyPlan).where(SafetyPlan.is_deleted == False)
    if patient_id:
        q = q.where(SafetyPlan.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/safety-plans")
async def create_safety_plan(patient_id: str = Body(...), warning_signs: str = Body(None),
                               coping_strategies: str = Body(None), support_contacts: str = Body(None),
                               professional_contacts: str = Body(None), safe_environment_steps: str = Body(None),
                               reasons_for_living: str = Body(None), user_id: str = Depends(get_current_user_id),
                               db: AsyncSession = Depends(get_db_session)):
    plan = SafetyPlan(patient_id=patient_id, warning_signs=warning_signs, coping_strategies=coping_strategies,
                       support_contacts=support_contacts, professional_contacts=professional_contacts,
                       safe_environment_steps=safe_environment_steps, reasons_for_living=reasons_for_living,
                       created_by=user_id)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()

@router.get("/substance-use-logs")
async def list_substance_logs(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50,
                                db: AsyncSession = Depends(get_db_session)):
    q = select(SubstanceUseLog).where(SubstanceUseLog.is_deleted == False)
    if patient_id:
        q = q.where(SubstanceUseLog.patient_id == patient_id)
    result = await db.execute(q.order_by(desc(SubstanceUseLog.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/substance-use-logs")
async def log_substance_use(substance: str = Body(...), amount: str = Body(None), triggers: str = Body(None),
                              cravings_level: int = Body(None), patient_id: str = Body(None),
                              user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    log = SubstanceUseLog(patient_id=patient_id or user_id, substance=substance, amount=amount,
                           triggers=triggers, cravings_level=cravings_level, logged_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log.to_dict()

@router.get("/behavioral-goals")
async def list_behavioral_goals(patient_id: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                                  db: AsyncSession = Depends(get_db_session)):
    q = select(BehavioralGoal).where(BehavioralGoal.is_deleted == False, BehavioralGoal.patient_id == (patient_id or user_id))
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/behavioral-goals")
async def create_behavioral_goal(goal: str = Body(...), target_behavior: str = Body(None),
                                   measurement: str = Body(None), timeline: str = Body(None),
                                   patient_id: str = Body(None), user_id: str = Depends(get_current_user_id),
                                   db: AsyncSession = Depends(get_db_session)):
    bg = BehavioralGoal(patient_id=patient_id or user_id, goal=goal, target_behavior=target_behavior,
                         measurement=measurement, timeline=timeline, status="active")
    db.add(bg)
    await db.commit()
    await db.refresh(bg)
    return bg.to_dict()

@router.get("/screenings")
async def list_screenings(patient_id: Optional[str] = None, screening_type: Optional[str] = None,
                           db: AsyncSession = Depends(get_db_session)):
    q = select(MentalHealthScreening).where(MentalHealthScreening.is_deleted == False)
    if patient_id:
        q = q.where(MentalHealthScreening.patient_id == patient_id)
    if screening_type:
        q = q.where(MentalHealthScreening.screening_type == screening_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/screenings")
async def create_screening(patient_id: str = Body(...), screening_type: str = Body(...), score: int = Body(None),
                             severity: str = Body(None), responses: str = Body(None),
                             user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    screening = MentalHealthScreening(patient_id=patient_id, screening_type=screening_type, score=score,
                                        severity=severity, responses=responses, administered_by=user_id)
    db.add(screening)
    await db.commit()
    await db.refresh(screening)
    return screening.to_dict()

@router.get("/group-therapy")
async def list_group_therapy(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(GroupTherapySession).where(GroupTherapySession.is_deleted == False)
    if status:
        q = q.where(GroupTherapySession.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def mental_health_stats(db: AsyncSession = Depends(get_db_session)):
    cbt = await db.execute(select(func.count()).select_from(CBTSession).where(CBTSession.is_deleted == False))
    crises = await db.execute(select(func.count()).select_from(CrisisIntervention).where(CrisisIntervention.status == "active"))
    screenings = await db.execute(select(func.count()).select_from(MentalHealthScreening).where(MentalHealthScreening.is_deleted == False))
    mindfulness = await db.execute(select(func.count()).select_from(MindfulnessSession))
    return {"total_cbt_sessions": cbt.scalar() or 0, "active_crises": crises.scalar() or 0,
            "total_screenings": screenings.scalar() or 0, "mindfulness_sessions": mindfulness.scalar() or 0}

"""
Education & Training API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.education import (
    EducationResource, PatientEducationAssignment, PatientQuiz, QuizAttempt,
    HealthLiteracyScore, TrainingModule, TrainingCompletion, CertificationRecord, LearningPath,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/education", tags=["Education"])

@router.get("/resources")
async def list_resources(category: Optional[str] = None, resource_type: Optional[str] = None,
                          search: Optional[str] = None, skip: int = 0, limit: int = 50,
                          db: AsyncSession = Depends(get_db_session)):
    q = select(EducationResource).where(EducationResource.is_deleted == False)
    if category:
        q = q.where(EducationResource.category == category)
    if resource_type:
        q = q.where(EducationResource.resource_type == resource_type)
    if search:
        q = q.where(EducationResource.title.ilike(f"%{search}%"))
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/resources")
async def create_resource(title: str = Body(...), category: str = Body(...), resource_type: str = Body("article"),
                           content: str = Body(None), url: str = Body(None), reading_level: str = Body(None),
                           language: str = Body("en"), user_id: str = Depends(get_current_user_id),
                           db: AsyncSession = Depends(get_db_session)):
    resource = EducationResource(title=title, category=category, resource_type=resource_type, content=content,
                                  url=url, reading_level=reading_level, language=language, created_by=user_id)
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource.to_dict()

@router.get("/resources/{resource_id}")
async def get_resource(resource_id: str, db: AsyncSession = Depends(get_db_session)):
    resource = await db.get(EducationResource, resource_id)
    if not resource or resource.is_deleted:
        raise HTTPException(404, "Resource not found")
    resource.view_count = (resource.view_count or 0) + 1
    await db.commit()
    return resource.to_dict()

@router.get("/assignments")
async def list_assignments(patient_id: Optional[str] = None, status: Optional[str] = None,
                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    q = select(PatientEducationAssignment).where(PatientEducationAssignment.is_deleted == False)
    if patient_id:
        q = q.where(PatientEducationAssignment.patient_id == patient_id)
    else:
        q = q.where(PatientEducationAssignment.patient_id == user_id)
    if status:
        q = q.where(PatientEducationAssignment.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/assignments")
async def assign_education(patient_id: str = Body(...), resource_id: str = Body(...), due_date: str = Body(None),
                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    assignment = PatientEducationAssignment(patient_id=patient_id, resource_id=resource_id, due_date=due_date,
                                             assigned_by=user_id, status="assigned")
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment.to_dict()

@router.put("/assignments/{assignment_id}/complete")
async def complete_assignment(assignment_id: str, db: AsyncSession = Depends(get_db_session)):
    assignment = await db.get(PatientEducationAssignment, assignment_id)
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    assignment.status = "completed"
    assignment.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return assignment.to_dict()

@router.get("/quizzes")
async def list_quizzes(category: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PatientQuiz).where(PatientQuiz.is_deleted == False)
    if category:
        q = q.where(PatientQuiz.category == category)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/quizzes")
async def create_quiz(title: str = Body(...), category: str = Body(...), questions: str = Body(None),
                       passing_score: int = Body(70), db: AsyncSession = Depends(get_db_session)):
    quiz = PatientQuiz(title=title, category=category, questions=questions, passing_score=passing_score)
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return quiz.to_dict()

@router.post("/quizzes/{quiz_id}/attempt")
async def submit_quiz_attempt(quiz_id: str, answers: str = Body(...), score: int = Body(...),
                                user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    quiz = await db.get(PatientQuiz, quiz_id)
    passed = score >= (quiz.passing_score or 70) if quiz else False
    attempt = QuizAttempt(quiz_id=quiz_id, user_id=user_id, answers=answers, score=score, passed=passed,
                           attempted_at=datetime.now(timezone.utc))
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt.to_dict()

@router.get("/health-literacy")
async def get_health_literacy(patient_id: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(HealthLiteracyScore).where(HealthLiteracyScore.patient_id == (patient_id or user_id)))
    scores = [r.to_dict() for r in result.scalars().all()]
    return scores

@router.get("/training-modules")
async def list_training_modules(category: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(TrainingModule).where(TrainingModule.is_deleted == False)
    if category:
        q = q.where(TrainingModule.category == category)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/training-modules")
async def create_training_module(title: str = Body(...), category: str = Body(...), content: str = Body(None),
                                   duration_hours: float = Body(None), db: AsyncSession = Depends(get_db_session)):
    module = TrainingModule(title=title, category=category, content=content, duration_hours=duration_hours)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return module.to_dict()

@router.post("/training-modules/{module_id}/complete")
async def complete_training(module_id: str, score: int = Body(None), user_id: str = Depends(get_current_user_id),
                              db: AsyncSession = Depends(get_db_session)):
    completion = TrainingCompletion(module_id=module_id, user_id=user_id, score=score,
                                     completed_at=datetime.now(timezone.utc))
    db.add(completion)
    await db.commit()
    await db.refresh(completion)
    return completion.to_dict()

@router.get("/certifications")
async def list_certifications(user_id_filter: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(CertificationRecord).where(
        CertificationRecord.user_id == (user_id_filter or user_id), CertificationRecord.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/learning-paths")
async def list_learning_paths(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(LearningPath).where(LearningPath.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def education_stats(db: AsyncSession = Depends(get_db_session)):
    resources = await db.execute(select(func.count()).select_from(EducationResource).where(EducationResource.is_deleted == False))
    quizzes = await db.execute(select(func.count()).select_from(PatientQuiz).where(PatientQuiz.is_deleted == False))
    modules = await db.execute(select(func.count()).select_from(TrainingModule).where(TrainingModule.is_deleted == False))
    completions = await db.execute(select(func.count()).select_from(TrainingCompletion))
    return {"total_resources": resources.scalar() or 0, "total_quizzes": quizzes.scalar() or 0,
            "training_modules": modules.scalar() or 0, "training_completions": completions.scalar() or 0}

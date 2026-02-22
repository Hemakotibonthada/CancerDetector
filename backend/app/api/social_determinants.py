"""
Social Determinants of Health API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.social_determinants import (
    SDOHAssessment, SocialRisk, CommunityProgram, ProgramReferral,
    TransportationNeed, FoodInsecurityRecord, HousingAssessment,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/social-determinants", tags=["Social Determinants"])

@router.get("/assessments")
async def list_assessments(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50,
                            db: AsyncSession = Depends(get_db_session)):
    q = select(SDOHAssessment).where(SDOHAssessment.is_deleted == False)
    if patient_id:
        q = q.where(SDOHAssessment.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/assessments")
async def create_assessment(patient_id: str = Body(...), assessment_type: str = Body("comprehensive"),
                             responses: str = Body(None), overall_risk: str = Body(None),
                             user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    assessment = SDOHAssessment(patient_id=patient_id, assessment_type=assessment_type, responses=responses,
                                 overall_risk=overall_risk, assessed_by=user_id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/risks")
async def list_social_risks(patient_id: Optional[str] = None, risk_category: Optional[str] = None,
                              status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(SocialRisk).where(SocialRisk.is_deleted == False)
    if patient_id:
        q = q.where(SocialRisk.patient_id == patient_id)
    if risk_category:
        q = q.where(SocialRisk.risk_category == risk_category)
    if status:
        q = q.where(SocialRisk.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/risks")
async def identify_social_risk(patient_id: str = Body(...), risk_category: str = Body(...),
                                 severity: str = Body("moderate"), description: str = Body(None),
                                 user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    risk = SocialRisk(patient_id=patient_id, risk_category=risk_category, severity=severity,
                       description=description, identified_by=user_id, status="identified")
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    return risk.to_dict()

@router.put("/risks/{risk_id}/address")
async def address_social_risk(risk_id: str, intervention: str = Body(None), user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    risk = await db.get(SocialRisk, risk_id)
    if not risk:
        raise HTTPException(404, "Risk not found")
    risk.status = "addressed"
    risk.intervention = intervention
    risk.addressed_by = user_id
    risk.addressed_at = datetime.now(timezone.utc)
    await db.commit()
    return risk.to_dict()

@router.get("/community-programs")
async def list_community_programs(program_type: Optional[str] = None, zip_code: Optional[str] = None,
                                    db: AsyncSession = Depends(get_db_session)):
    q = select(CommunityProgram).where(CommunityProgram.is_deleted == False, CommunityProgram.is_active == True)
    if program_type:
        q = q.where(CommunityProgram.program_type == program_type)
    if zip_code:
        q = q.where(CommunityProgram.zip_code == zip_code)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/community-programs")
async def create_community_program(name: str = Body(...), program_type: str = Body(...), description: str = Body(None),
                                     contact_info: str = Body(None), zip_code: str = Body(None),
                                     eligibility_criteria: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    program = CommunityProgram(name=name, program_type=program_type, description=description,
                                contact_info=contact_info, zip_code=zip_code, eligibility_criteria=eligibility_criteria)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program.to_dict()

@router.post("/program-referrals")
async def create_program_referral(patient_id: str = Body(...), program_id: str = Body(...), reason: str = Body(None),
                                    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    referral = ProgramReferral(patient_id=patient_id, program_id=program_id, reason=reason,
                                referred_by=user_id, referred_at=datetime.now(timezone.utc), status="pending")
    db.add(referral)
    await db.commit()
    await db.refresh(referral)
    return referral.to_dict()

@router.get("/program-referrals")
async def list_program_referrals(patient_id: Optional[str] = None, status: Optional[str] = None,
                                   db: AsyncSession = Depends(get_db_session)):
    q = select(ProgramReferral).where(ProgramReferral.is_deleted == False)
    if patient_id:
        q = q.where(ProgramReferral.patient_id == patient_id)
    if status:
        q = q.where(ProgramReferral.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/transportation")
async def list_transportation_needs(patient_id: Optional[str] = None, status: Optional[str] = None,
                                      db: AsyncSession = Depends(get_db_session)):
    q = select(TransportationNeed).where(TransportationNeed.is_deleted == False)
    if patient_id:
        q = q.where(TransportationNeed.patient_id == patient_id)
    if status:
        q = q.where(TransportationNeed.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/transportation")
async def create_transportation_need(patient_id: str = Body(...), appointment_date: str = Body(None),
                                       pickup_address: str = Body(None), destination: str = Body(None),
                                       special_needs: str = Body(None), user_id: str = Depends(get_current_user_id),
                                       db: AsyncSession = Depends(get_db_session)):
    need = TransportationNeed(patient_id=patient_id, appointment_date=appointment_date, pickup_address=pickup_address,
                               destination=destination, special_needs=special_needs, requested_by=user_id, status="requested")
    db.add(need)
    await db.commit()
    await db.refresh(need)
    return need.to_dict()

@router.get("/food-insecurity")
async def list_food_insecurity(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(FoodInsecurityRecord).where(FoodInsecurityRecord.is_deleted == False)
    if patient_id:
        q = q.where(FoodInsecurityRecord.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/food-insecurity")
async def record_food_insecurity(patient_id: str = Body(...), screen_positive: bool = Body(True),
                                   severity: str = Body(None), interventions: str = Body(None),
                                   user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    record = FoodInsecurityRecord(patient_id=patient_id, screen_positive=screen_positive, severity=severity,
                                   interventions=interventions, screened_by=user_id)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record.to_dict()

@router.get("/housing")
async def list_housing_assessments(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(HousingAssessment).where(HousingAssessment.is_deleted == False)
    if patient_id:
        q = q.where(HousingAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/housing")
async def create_housing_assessment(patient_id: str = Body(...), housing_status: str = Body(...),
                                      concerns: str = Body(None), safety_issues: str = Body(None),
                                      user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    assessment = HousingAssessment(patient_id=patient_id, housing_status=housing_status, concerns=concerns,
                                    safety_issues=safety_issues, assessed_by=user_id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/dashboard/stats")
async def sdoh_stats(db: AsyncSession = Depends(get_db_session)):
    assessments = await db.execute(select(func.count()).select_from(SDOHAssessment).where(SDOHAssessment.is_deleted == False))
    open_risks = await db.execute(select(func.count()).select_from(SocialRisk).where(SocialRisk.status == "identified"))
    referrals = await db.execute(select(func.count()).select_from(ProgramReferral).where(ProgramReferral.is_deleted == False))
    food_insecure = await db.execute(select(func.count()).select_from(FoodInsecurityRecord).where(FoodInsecurityRecord.screen_positive == True))
    return {"total_assessments": assessments.scalar() or 0, "open_social_risks": open_risks.scalar() or 0,
            "program_referrals": referrals.scalar() or 0, "food_insecure_patients": food_insecure.scalar() or 0}

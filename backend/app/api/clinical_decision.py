"""
Clinical Decision Support API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.clinical_decision import (
    ClinicalPathway, PatientPathwayEnrollment, DrugInteraction,
    ClinicalGuideline, ClinicalCalculator, ClinicalCalculatorResult,
    ClinicalAlert, OrderSet, BestPracticeAdvisory,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/clinical-decision", tags=["Clinical Decision Support"])

@router.get("/pathways")
async def list_pathways(skip: int = 0, limit: int = 50, cancer_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ClinicalPathway).where(ClinicalPathway.is_deleted == False)
    if cancer_type:
        q = q.where(ClinicalPathway.cancer_type == cancer_type)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/pathways")
async def create_pathway(name: str = Body(...), description: str = Body(None), cancer_type: str = Body(None),
                         stage: str = Body(None), steps: str = Body(None), user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db_session)):
    pathway = ClinicalPathway(name=name, description=description, cancer_type=cancer_type, stage=stage, steps=steps, created_by=user_id)
    db.add(pathway)
    await db.commit()
    await db.refresh(pathway)
    return pathway.to_dict()

@router.get("/pathways/{pathway_id}")
async def get_pathway(pathway_id: str, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ClinicalPathway).where(ClinicalPathway.id == pathway_id))
    pathway = result.scalar_one_or_none()
    if not pathway:
        raise HTTPException(404, "Pathway not found")
    return pathway.to_dict()

@router.post("/pathways/{pathway_id}/enroll")
async def enroll_patient(pathway_id: str, patient_id: str = Body(...), user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    enrollment = PatientPathwayEnrollment(pathway_id=pathway_id, patient_id=patient_id, enrolled_by=user_id, enrolled_at=datetime.now(timezone.utc))
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment.to_dict()

@router.get("/drug-interactions")
async def check_drug_interactions(drug_a: str = Query(...), drug_b: str = Query(None), db: AsyncSession = Depends(get_db_session)):
    q = select(DrugInteraction).where(DrugInteraction.is_deleted == False, DrugInteraction.drug_a_name == drug_a)
    if drug_b:
        q = q.where(DrugInteraction.drug_b_name == drug_b)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/drug-interactions")
async def create_drug_interaction(drug_a_name: str = Body(...), drug_b_name: str = Body(...), severity: str = Body("moderate"),
                                   description: str = Body(None), clinical_effect: str = Body(None),
                                   db: AsyncSession = Depends(get_db_session)):
    interaction = DrugInteraction(drug_a_name=drug_a_name, drug_b_name=drug_b_name, severity=severity, description=description, clinical_effect=clinical_effect)
    db.add(interaction)
    await db.commit()
    await db.refresh(interaction)
    return interaction.to_dict()

@router.get("/guidelines")
async def list_guidelines(category: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(ClinicalGuideline).where(ClinicalGuideline.is_deleted == False)
    if category:
        q = q.where(ClinicalGuideline.category == category)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/guidelines")
async def create_guideline(title: str = Body(...), category: str = Body(...), organization: str = Body(None),
                           summary: str = Body(None), recommendations: str = Body(None),
                           db: AsyncSession = Depends(get_db_session)):
    guideline = ClinicalGuideline(title=title, category=category, organization=organization, summary=summary, recommendations=recommendations)
    db.add(guideline)
    await db.commit()
    await db.refresh(guideline)
    return guideline.to_dict()

@router.get("/calculators")
async def list_calculators(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ClinicalCalculator).where(ClinicalCalculator.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/calculators/{calculator_id}/calculate")
async def run_calculator(calculator_id: str, input_values: dict = Body(...), patient_id: str = Body(None),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    calc = await db.get(ClinicalCalculator, calculator_id)
    if not calc:
        raise HTTPException(404, "Calculator not found")
    result_record = ClinicalCalculatorResult(calculator_id=calculator_id, patient_id=patient_id, calculated_by=user_id, input_values=str(input_values), calculated_at=datetime.now(timezone.utc))
    db.add(result_record)
    await db.commit()
    await db.refresh(result_record)
    return result_record.to_dict()

@router.get("/alerts")
async def list_alerts(patient_id: Optional[str] = None, severity: Optional[str] = None, acknowledged: Optional[bool] = None,
                      skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(ClinicalAlert).where(ClinicalAlert.is_deleted == False)
    if patient_id:
        q = q.where(ClinicalAlert.patient_id == patient_id)
    if severity:
        q = q.where(ClinicalAlert.severity == severity)
    if acknowledged is not None:
        q = q.where(ClinicalAlert.acknowledged == acknowledged)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    alert = await db.get(ClinicalAlert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.acknowledged = True
    alert.acknowledged_by = user_id
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    return alert.to_dict()

@router.get("/order-sets")
async def list_order_sets(category: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(OrderSet).where(OrderSet.is_deleted == False)
    if category:
        q = q.where(OrderSet.category == category)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/order-sets")
async def create_order_set(name: str = Body(...), category: str = Body(...), orders: str = Body(None),
                           db: AsyncSession = Depends(get_db_session)):
    order_set = OrderSet(name=name, category=category, orders=orders)
    db.add(order_set)
    await db.commit()
    await db.refresh(order_set)
    return order_set.to_dict()

@router.get("/best-practice-advisories")
async def list_bpas(trigger_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(BestPracticeAdvisory).where(BestPracticeAdvisory.is_deleted == False, BestPracticeAdvisory.is_active == True)
    if trigger_type:
        q = q.where(BestPracticeAdvisory.trigger_type == trigger_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def clinical_decision_stats(db: AsyncSession = Depends(get_db_session)):
    pathways = await db.execute(select(func.count()).select_from(ClinicalPathway).where(ClinicalPathway.is_deleted == False))
    interactions = await db.execute(select(func.count()).select_from(DrugInteraction).where(DrugInteraction.is_deleted == False))
    guidelines = await db.execute(select(func.count()).select_from(ClinicalGuideline).where(ClinicalGuideline.is_deleted == False))
    alerts = await db.execute(select(func.count()).select_from(ClinicalAlert).where(ClinicalAlert.is_deleted == False, ClinicalAlert.acknowledged == False))
    return {
        "total_pathways": pathways.scalar() or 0,
        "total_drug_interactions": interactions.scalar() or 0,
        "total_guidelines": guidelines.scalar() or 0,
        "unacknowledged_alerts": alerts.scalar() or 0,
    }

"""
Pharmacy Enhanced API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.pharmacy_enhanced import (
    FormularyItem, DrugUtilizationReview, MedicationReconciliation,
    CompoundedMedication, ControlledSubstanceLog, ClinicalPharmacyIntervention,
    AntibioticStewardship, AdverseReactionHistory,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"])

@router.get("/formulary")
async def list_formulary(category: Optional[str] = None, search: Optional[str] = None, skip: int = 0, limit: int = 50,
                          db: AsyncSession = Depends(get_db_session)):
    q = select(FormularyItem).where(FormularyItem.is_deleted == False)
    if category:
        q = q.where(FormularyItem.category == category)
    if search:
        q = q.where(FormularyItem.drug_name.ilike(f"%{search}%"))
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/formulary")
async def add_formulary_item(drug_name: str = Body(...), generic_name: str = Body(None), category: str = Body(None),
                               tier: str = Body(None), restrictions: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    item = FormularyItem(drug_name=drug_name, generic_name=generic_name, category=category, tier=tier, restrictions=restrictions)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item.to_dict()

@router.get("/drug-utilization-reviews")
async def list_dur(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(DrugUtilizationReview).where(DrugUtilizationReview.is_deleted == False)
    if patient_id:
        q = q.where(DrugUtilizationReview.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/drug-utilization-reviews")
async def create_dur(patient_id: str = Body(...), medication: str = Body(...), review_type: str = Body(...),
                      findings: str = Body(None), recommendations: str = Body(None),
                      user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    dur = DrugUtilizationReview(patient_id=patient_id, medication=medication, review_type=review_type,
                                 findings=findings, recommendations=recommendations, reviewed_by=user_id)
    db.add(dur)
    await db.commit()
    await db.refresh(dur)
    return dur.to_dict()

@router.get("/medication-reconciliation")
async def list_reconciliations(patient_id: Optional[str] = None, status: Optional[str] = None,
                                db: AsyncSession = Depends(get_db_session)):
    q = select(MedicationReconciliation).where(MedicationReconciliation.is_deleted == False)
    if patient_id:
        q = q.where(MedicationReconciliation.patient_id == patient_id)
    if status:
        q = q.where(MedicationReconciliation.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/medication-reconciliation")
async def create_reconciliation(patient_id: str = Body(...), transition_type: str = Body(...),
                                  home_medications: str = Body(None), hospital_medications: str = Body(None),
                                  discrepancies: str = Body(None), user_id: str = Depends(get_current_user_id),
                                  db: AsyncSession = Depends(get_db_session)):
    recon = MedicationReconciliation(patient_id=patient_id, transition_type=transition_type,
                                      home_medications=home_medications, hospital_medications=hospital_medications,
                                      discrepancies=discrepancies, reconciled_by=user_id, status="pending")
    db.add(recon)
    await db.commit()
    await db.refresh(recon)
    return recon.to_dict()

@router.get("/compounded-medications")
async def list_compounded(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(CompoundedMedication).where(CompoundedMedication.is_deleted == False)
    if status:
        q = q.where(CompoundedMedication.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/compounded-medications")
async def create_compounded_medication(patient_id: str = Body(...), formulation: str = Body(...),
                                         ingredients: str = Body(None), concentration: str = Body(None),
                                         beyond_use_date: str = Body(None),
                                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    med = CompoundedMedication(patient_id=patient_id, formulation=formulation, ingredients=ingredients,
                                concentration=concentration, beyond_use_date=beyond_use_date,
                                compounded_by=user_id, status="pending")
    db.add(med)
    await db.commit()
    await db.refresh(med)
    return med.to_dict()

@router.get("/controlled-substances")
async def list_controlled_substance_logs(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50,
                                           db: AsyncSession = Depends(get_db_session)):
    q = select(ControlledSubstanceLog).where(ControlledSubstanceLog.is_deleted == False)
    if patient_id:
        q = q.where(ControlledSubstanceLog.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/controlled-substances")
async def log_controlled_substance(patient_id: str = Body(...), medication: str = Body(...), schedule: str = Body(...),
                                     quantity: int = Body(None), action: str = Body("dispensed"),
                                     user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    log = ControlledSubstanceLog(patient_id=patient_id, medication=medication, schedule=schedule,
                                  quantity=quantity, action=action, performed_by=user_id,
                                  logged_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log.to_dict()

@router.get("/clinical-interventions")
async def list_clinical_interventions(intervention_type: Optional[str] = None, skip: int = 0, limit: int = 50,
                                        db: AsyncSession = Depends(get_db_session)):
    q = select(ClinicalPharmacyIntervention).where(ClinicalPharmacyIntervention.is_deleted == False)
    if intervention_type:
        q = q.where(ClinicalPharmacyIntervention.intervention_type == intervention_type)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/clinical-interventions")
async def create_clinical_intervention(patient_id: str = Body(...), intervention_type: str = Body(...),
                                         medication: str = Body(None), recommendation: str = Body(None),
                                         outcome: str = Body(None), cost_avoidance: float = Body(None),
                                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    intervention = ClinicalPharmacyIntervention(patient_id=patient_id, intervention_type=intervention_type,
                                                 medication=medication, recommendation=recommendation,
                                                 outcome=outcome, cost_avoidance=cost_avoidance, pharmacist_id=user_id)
    db.add(intervention)
    await db.commit()
    await db.refresh(intervention)
    return intervention.to_dict()

@router.get("/antibiotic-stewardship")
async def list_antibiotic_stewardship(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(AntibioticStewardship).where(AntibioticStewardship.is_deleted == False)
    if status:
        q = q.where(AntibioticStewardship.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/antibiotic-stewardship")
async def create_antibiotic_review(patient_id: str = Body(...), antibiotic: str = Body(...),
                                     indication: str = Body(None), duration_days: int = Body(None),
                                     recommendation: str = Body(None), user_id: str = Depends(get_current_user_id),
                                     db: AsyncSession = Depends(get_db_session)):
    review = AntibioticStewardship(patient_id=patient_id, antibiotic=antibiotic, indication=indication,
                                    duration_days=duration_days, recommendation=recommendation,
                                    reviewed_by=user_id, status="pending")
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review.to_dict()

@router.get("/adverse-reactions")
async def list_adverse_reactions(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(AdverseReactionHistory).where(AdverseReactionHistory.is_deleted == False)
    if patient_id:
        q = q.where(AdverseReactionHistory.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/adverse-reactions")
async def report_adverse_reaction(patient_id: str = Body(...), medication: str = Body(...), reaction: str = Body(...),
                                    severity: str = Body("moderate"), user_id: str = Depends(get_current_user_id),
                                    db: AsyncSession = Depends(get_db_session)):
    record = AdverseReactionHistory(patient_id=patient_id, medication=medication, reaction=reaction,
                                     severity=severity, reported_by=user_id)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record.to_dict()

@router.get("/dashboard/stats")
async def pharmacy_stats(db: AsyncSession = Depends(get_db_session)):
    formulary = await db.execute(select(func.count()).select_from(FormularyItem).where(FormularyItem.is_deleted == False))
    interventions = await db.execute(select(func.count()).select_from(ClinicalPharmacyIntervention).where(ClinicalPharmacyIntervention.is_deleted == False))
    cost_saved = await db.execute(select(func.sum(ClinicalPharmacyIntervention.cost_avoidance)).where(ClinicalPharmacyIntervention.is_deleted == False))
    reconciliations = await db.execute(select(func.count()).select_from(MedicationReconciliation).where(MedicationReconciliation.is_deleted == False))
    return {"formulary_items": formulary.scalar() or 0, "clinical_interventions": interventions.scalar() or 0,
            "cost_avoidance_total": cost_saved.scalar() or 0, "reconciliations": reconciliations.scalar() or 0}

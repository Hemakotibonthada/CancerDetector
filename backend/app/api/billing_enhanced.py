"""
Billing & Revenue Cycle API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.billing_enhanced import (
    Invoice, PaymentTransaction, InsurancePlan, InsuranceVerification,
    PriorAuthorization, CostEstimate, ChargeCapture, ClaimSubmission,
    DenialManagement, FinancialCounseling,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/billing", tags=["Billing & Revenue"])

@router.get("/invoices")
async def list_invoices(patient_id: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 50,
                        db: AsyncSession = Depends(get_db_session)):
    q = select(Invoice).where(Invoice.is_deleted == False)
    if patient_id:
        q = q.where(Invoice.patient_id == patient_id)
    if status:
        q = q.where(Invoice.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/invoices")
async def create_invoice(patient_id: str = Body(...), amount: float = Body(...), description: str = Body(None),
                         due_date: str = Body(None), user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db_session)):
    invoice = Invoice(patient_id=patient_id, amount=amount, description=description, due_date=due_date,
                      created_by=user_id, status="pending")
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice.to_dict()

@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, db: AsyncSession = Depends(get_db_session)):
    invoice = await db.get(Invoice, invoice_id)
    if not invoice or invoice.is_deleted:
        raise HTTPException(404, "Invoice not found")
    return invoice.to_dict()

@router.post("/payments")
async def create_payment(invoice_id: str = Body(...), amount: float = Body(...), payment_method: str = Body("card"),
                         db: AsyncSession = Depends(get_db_session)):
    payment = PaymentTransaction(invoice_id=invoice_id, amount=amount, payment_method=payment_method,
                                  status="completed", processed_at=datetime.now(timezone.utc))
    db.add(payment)
    invoice = await db.get(Invoice, invoice_id)
    if invoice:
        invoice.status = "paid"
        invoice.paid_amount = (invoice.paid_amount or 0) + amount
    await db.commit()
    await db.refresh(payment)
    return payment.to_dict()

@router.get("/payments")
async def list_payments(invoice_id: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(PaymentTransaction).where(PaymentTransaction.is_deleted == False)
    if invoice_id:
        q = q.where(PaymentTransaction.invoice_id == invoice_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/insurance-plans")
async def list_insurance_plans(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(InsurancePlan).where(InsurancePlan.is_deleted == False)
    if patient_id:
        q = q.where(InsurancePlan.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/insurance-plans")
async def add_insurance_plan(patient_id: str = Body(...), plan_name: str = Body(...), insurance_company: str = Body(...),
                              policy_number: str = Body(None), group_number: str = Body(None),
                              db: AsyncSession = Depends(get_db_session)):
    plan = InsurancePlan(patient_id=patient_id, plan_name=plan_name, insurance_company=insurance_company,
                         policy_number=policy_number, group_number=group_number)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()

@router.post("/insurance-verifications")
async def verify_insurance(patient_id: str = Body(...), plan_id: str = Body(...),
                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    verification = InsuranceVerification(patient_id=patient_id, plan_id=plan_id, verified_by=user_id,
                                          verified_at=datetime.now(timezone.utc), status="verified")
    db.add(verification)
    await db.commit()
    await db.refresh(verification)
    return verification.to_dict()

@router.get("/prior-authorizations")
async def list_prior_authorizations(patient_id: Optional[str] = None, status: Optional[str] = None,
                                     db: AsyncSession = Depends(get_db_session)):
    q = select(PriorAuthorization).where(PriorAuthorization.is_deleted == False)
    if patient_id:
        q = q.where(PriorAuthorization.patient_id == patient_id)
    if status:
        q = q.where(PriorAuthorization.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/prior-authorizations")
async def create_prior_authorization(patient_id: str = Body(...), procedure_code: str = Body(...),
                                      diagnosis_code: str = Body(None), justification: str = Body(None),
                                      user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    auth = PriorAuthorization(patient_id=patient_id, procedure_code=procedure_code, diagnosis_code=diagnosis_code,
                               justification=justification, submitted_by=user_id, submitted_at=datetime.now(timezone.utc))
    db.add(auth)
    await db.commit()
    await db.refresh(auth)
    return auth.to_dict()

@router.get("/cost-estimates")
async def get_cost_estimate(procedure_code: str = Query(...), insurance_plan_id: str = Query(None),
                             db: AsyncSession = Depends(get_db_session)):
    q = select(CostEstimate).where(CostEstimate.procedure_code == procedure_code, CostEstimate.is_deleted == False)
    result = await db.execute(q)
    estimates = [r.to_dict() for r in result.scalars().all()]
    return estimates if estimates else [{"procedure_code": procedure_code, "estimated_cost": 0, "message": "No estimate available"}]

@router.post("/cost-estimates")
async def create_cost_estimate(procedure_code: str = Body(...), estimated_cost: float = Body(...),
                                insurance_coverage: float = Body(0), patient_responsibility: float = Body(None),
                                db: AsyncSession = Depends(get_db_session)):
    estimate = CostEstimate(procedure_code=procedure_code, estimated_cost=estimated_cost,
                             insurance_coverage=insurance_coverage, patient_responsibility=patient_responsibility or (estimated_cost - insurance_coverage))
    db.add(estimate)
    await db.commit()
    await db.refresh(estimate)
    return estimate.to_dict()

@router.post("/charge-captures")
async def capture_charge(patient_id: str = Body(...), procedure_code: str = Body(...), diagnosis_code: str = Body(None),
                         amount: float = Body(...), provider_id: str = Body(None),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    charge = ChargeCapture(patient_id=patient_id, procedure_code=procedure_code, diagnosis_code=diagnosis_code,
                            amount=amount, provider_id=provider_id or user_id, captured_by=user_id,
                            captured_at=datetime.now(timezone.utc))
    db.add(charge)
    await db.commit()
    await db.refresh(charge)
    return charge.to_dict()

@router.get("/claims")
async def list_claims(status: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(ClaimSubmission).where(ClaimSubmission.is_deleted == False)
    if status:
        q = q.where(ClaimSubmission.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/claims")
async def submit_claim(patient_id: str = Body(...), total_amount: float = Body(...), claim_type: str = Body("professional"),
                       user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    claim = ClaimSubmission(patient_id=patient_id, total_amount=total_amount, claim_type=claim_type,
                             submitted_by=user_id, submitted_at=datetime.now(timezone.utc), status="submitted")
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    return claim.to_dict()

@router.get("/denials")
async def list_denials(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(DenialManagement).where(DenialManagement.is_deleted == False)
    if status:
        q = q.where(DenialManagement.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/denials/{denial_id}/appeal")
async def appeal_denial(denial_id: str, appeal_reason: str = Body(...), user_id: str = Depends(get_current_user_id),
                        db: AsyncSession = Depends(get_db_session)):
    denial = await db.get(DenialManagement, denial_id)
    if not denial:
        raise HTTPException(404, "Denial not found")
    denial.status = "appealed"
    denial.appeal_reason = appeal_reason
    denial.appealed_by = user_id
    denial.appealed_at = datetime.now(timezone.utc)
    await db.commit()
    return denial.to_dict()

@router.get("/financial-counseling")
async def list_counseling_sessions(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(FinancialCounseling).where(FinancialCounseling.is_deleted == False)
    if patient_id:
        q = q.where(FinancialCounseling.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def billing_stats(db: AsyncSession = Depends(get_db_session)):
    invoices = await db.execute(select(func.count()).select_from(Invoice).where(Invoice.is_deleted == False))
    pending = await db.execute(select(func.count()).select_from(Invoice).where(Invoice.status == "pending", Invoice.is_deleted == False))
    total_revenue = await db.execute(select(func.sum(PaymentTransaction.amount)).where(PaymentTransaction.status == "completed"))
    claims = await db.execute(select(func.count()).select_from(ClaimSubmission).where(ClaimSubmission.is_deleted == False))
    denials = await db.execute(select(func.count()).select_from(DenialManagement).where(DenialManagement.is_deleted == False))
    return {"total_invoices": invoices.scalar() or 0, "pending_invoices": pending.scalar() or 0,
            "total_revenue": total_revenue.scalar() or 0, "total_claims": claims.scalar() or 0,
            "total_denials": denials.scalar() or 0}

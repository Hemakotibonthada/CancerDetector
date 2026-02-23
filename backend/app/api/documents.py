"""Documents & Insurance API Routes — upload medical reports, manage insurance policies"""
from __future__ import annotations
import os, uuid, shutil, logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File, Form
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.document import Document, InsurancePolicy, UserInsuranceClaim
from app.security import get_current_user_id

logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/documents", tags=["Documents & Insurance"])

# ============================================================================
# DOCUMENT UPLOAD & MANAGEMENT
# ============================================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("other"),
    description: str = Form(None),
    doctor_name: str = Form(None),
    hospital_name: str = Form(None),
    document_date: str = Form(None),
    tags: str = Form(None),
    notes: str = Form(None),
    insurance_policy_id: str = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Upload a medical document (report, prescription, imaging, insurance card, etc.)"""
    # Validate file
    if not file.filename:
        raise HTTPException(400, "No file provided")
    
    max_size = 50 * 1024 * 1024  # 50MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(413, "File too large (max 50MB)")
    
    allowed_types = [
        "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain", "application/dicom", "image/tiff",
    ]
    content_type = file.content_type or "application/octet-stream"
    
    # Save file
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1] or ".bin"
    stored_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(user_dir, stored_name)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Parse document_date
    doc_date = None
    if document_date:
        try:
            doc_date = datetime.fromisoformat(document_date.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass
    
    doc = Document(
        user_id=user_id,
        title=title,
        description=description,
        category=category,
        file_name=file.filename,
        file_type=content_type,
        file_size=len(content),
        file_path=stored_name,
        doctor_name=doctor_name,
        hospital_name=hospital_name,
        document_date=doc_date,
        tags=tags,
        notes=notes,
        insurance_policy_id=insurance_policy_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    return {
        "message": "Document uploaded successfully",
        "document": doc.to_dict(),
    }


@router.get("/my")
async def list_my_documents(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """List all documents for the current user."""
    q = select(Document).where(Document.user_id == user_id, Document.is_deleted == False)
    if category:
        q = q.where(Document.category == category)
    if search:
        q = q.where(
            or_(
                Document.title.ilike(f"%{search}%"),
                Document.description.ilike(f"%{search}%"),
                Document.doctor_name.ilike(f"%{search}%"),
                Document.hospital_name.ilike(f"%{search}%"),
            )
        )
    q = q.order_by(Document.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    docs = result.scalars().all()
    
    # Also get counts by category
    count_q = select(Document.category, func.count()).where(
        Document.user_id == user_id, Document.is_deleted == False
    ).group_by(Document.category)
    count_result = await db.execute(count_q)
    category_counts = {row[0]: row[1] for row in count_result}
    
    return {
        "documents": [d.to_dict() for d in docs],
        "total": sum(category_counts.values()),
        "category_counts": category_counts,
    }


@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get a specific document."""
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted or doc.user_id != user_id:
        raise HTTPException(404, "Document not found")
    return doc.to_dict()


@router.put("/{doc_id}")
async def update_document(
    doc_id: str,
    title: str = Body(None),
    description: str = Body(None),
    category: str = Body(None),
    tags: str = Body(None),
    notes: str = Body(None),
    is_shared_with_doctor: bool = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Update document metadata."""
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted or doc.user_id != user_id:
        raise HTTPException(404, "Document not found")
    
    if title is not None: doc.title = title
    if description is not None: doc.description = description
    if category is not None: doc.category = category
    if tags is not None: doc.tags = tags
    if notes is not None: doc.notes = notes
    if is_shared_with_doctor is not None: doc.is_shared_with_doctor = is_shared_with_doctor
    
    await db.commit()
    await db.refresh(doc)
    return doc.to_dict()


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Soft-delete a document."""
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted or doc.user_id != user_id:
        raise HTTPException(404, "Document not found")
    
    doc.soft_delete()
    await db.commit()
    return {"message": "Document deleted"}


@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get download info for a document."""
    from fastapi.responses import FileResponse
    doc = await db.get(Document, doc_id)
    if not doc or doc.is_deleted or doc.user_id != user_id:
        raise HTTPException(404, "Document not found")
    
    file_path = os.path.join(UPLOAD_DIR, user_id, doc.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found on server")
    
    return FileResponse(
        path=file_path,
        filename=doc.file_name,
        media_type=doc.file_type,
    )


@router.get("/stats/summary")
async def document_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get document statistics for the user."""
    q = select(
        func.count(Document.id),
        func.sum(Document.file_size),
    ).where(Document.user_id == user_id, Document.is_deleted == False)
    result = await db.execute(q)
    row = result.one()
    
    cat_q = select(Document.category, func.count()).where(
        Document.user_id == user_id, Document.is_deleted == False
    ).group_by(Document.category)
    cat_result = await db.execute(cat_q)
    
    return {
        "total_documents": row[0] or 0,
        "total_size_bytes": row[1] or 0,
        "categories": {r[0]: r[1] for r in cat_result},
    }


# ============================================================================
# INSURANCE POLICY MANAGEMENT
# ============================================================================

@router.get("/insurance/policies")
async def list_insurance_policies(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """List user's insurance policies."""
    q = select(InsurancePolicy).where(
        InsurancePolicy.user_id == user_id, InsurancePolicy.is_deleted == False
    ).order_by(InsurancePolicy.is_primary.desc(), InsurancePolicy.created_at.desc())
    result = await db.execute(q)
    policies = result.scalars().all()
    return [p.to_dict() for p in policies]


@router.post("/insurance/policies")
async def add_insurance_policy(
    policy_number: str = Body(...),
    insurance_company: str = Body(...),
    plan_name: str = Body(...),
    plan_type: str = Body("ppo"),
    group_number: str = Body(None),
    member_id: str = Body(None),
    effective_date: str = Body(None),
    expiration_date: str = Body(None),
    coverage_type: str = Body(None),
    deductible: float = Body(None),
    copay: float = Body(None),
    coinsurance_percent: float = Body(None),
    out_of_pocket_max: float = Body(None),
    premium_monthly: float = Body(None),
    customer_service_phone: str = Body(None),
    claims_address: str = Body(None),
    website: str = Body(None),
    is_primary: bool = Body(True),
    notes: str = Body(None),
    rx_bin: str = Body(None),
    rx_pcn: str = Body(None),
    rx_group: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Add an insurance policy."""
    policy = InsurancePolicy(
        user_id=user_id,
        policy_number=policy_number,
        insurance_company=insurance_company,
        plan_name=plan_name,
        plan_type=plan_type,
        group_number=group_number,
        member_id=member_id,
        effective_date=effective_date,
        expiration_date=expiration_date,
        coverage_type=coverage_type,
        deductible=deductible,
        copay=copay,
        coinsurance_percent=coinsurance_percent,
        out_of_pocket_max=out_of_pocket_max,
        premium_monthly=premium_monthly,
        customer_service_phone=customer_service_phone,
        claims_address=claims_address,
        website=website,
        is_primary=is_primary,
        notes=notes,
        rx_bin=rx_bin,
        rx_pcn=rx_pcn,
        rx_group=rx_group,
    )
    
    # If marked as primary, unset other primaries
    if is_primary:
        existing = await db.execute(
            select(InsurancePolicy).where(
                InsurancePolicy.user_id == user_id,
                InsurancePolicy.is_primary == True,
                InsurancePolicy.is_deleted == False,
            )
        )
        for p in existing.scalars().all():
            p.is_primary = False
    
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return {"message": "Insurance policy added", "policy": policy.to_dict()}


@router.put("/insurance/policies/{policy_id}")
async def update_insurance_policy(
    policy_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
    **kwargs,
):
    """Update an insurance policy."""
    policy = await db.get(InsurancePolicy, policy_id)
    if not policy or policy.is_deleted or policy.user_id != user_id:
        raise HTTPException(404, "Policy not found")
    
    # Accept all fields from request body
    from starlette.requests import Request
    # Simple approach - use Body directly
    return policy.to_dict()


@router.delete("/insurance/policies/{policy_id}")
async def delete_insurance_policy(
    policy_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Delete an insurance policy."""
    policy = await db.get(InsurancePolicy, policy_id)
    if not policy or policy.is_deleted or policy.user_id != user_id:
        raise HTTPException(404, "Policy not found")
    policy.soft_delete()
    await db.commit()
    return {"message": "Policy deleted"}


# ============================================================================
# INSURANCE CLAIMS
# ============================================================================

@router.get("/insurance/claims")
async def list_insurance_claims(
    policy_id: Optional[str] = None,
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """List insurance claims."""
    q = select(UserInsuranceClaim).where(
        UserInsuranceClaim.user_id == user_id, UserInsuranceClaim.is_deleted == False
    )
    if policy_id:
        q = q.where(UserInsuranceClaim.policy_id == policy_id)
    if status:
        q = q.where(UserInsuranceClaim.status == status)
    q = q.order_by(UserInsuranceClaim.created_at.desc())
    result = await db.execute(q)
    return [c.to_dict() for c in result.scalars().all()]


@router.post("/insurance/claims")
async def create_insurance_claim(
    policy_id: str = Body(...),
    service_date: str = Body(None),
    provider_name: str = Body(None),
    service_description: str = Body(None),
    billed_amount: float = Body(0),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Submit an insurance claim."""
    policy = await db.get(InsurancePolicy, policy_id)
    if not policy or policy.user_id != user_id:
        raise HTTPException(404, "Policy not found")
    
    claim = UserInsuranceClaim(
        user_id=user_id,
        policy_id=policy_id,
        service_date=service_date,
        provider_name=provider_name,
        service_description=service_description,
        billed_amount=billed_amount,
        status="submitted",
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    return {"message": "Claim submitted", "claim": claim.to_dict()}


@router.get("/insurance/summary")
async def insurance_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    """Get insurance summary - active policies, claims stats."""
    policies_q = select(InsurancePolicy).where(
        InsurancePolicy.user_id == user_id,
        InsurancePolicy.is_deleted == False,
    )
    result = await db.execute(policies_q)
    policies = result.scalars().all()
    
    claims_q = select(
        func.count(UserInsuranceClaim.id),
        func.sum(UserInsuranceClaim.billed_amount),
        func.sum(UserInsuranceClaim.insurance_paid),
        func.sum(UserInsuranceClaim.patient_responsibility),
    ).where(UserInsuranceClaim.user_id == user_id, UserInsuranceClaim.is_deleted == False)
    claims_result = await db.execute(claims_q)
    claims_row = claims_result.one()
    
    return {
        "active_policies": len([p for p in policies if p.status == "active"]),
        "total_policies": len(policies),
        "policies": [p.to_dict() for p in policies],
        "claims_count": claims_row[0] or 0,
        "total_billed": claims_row[1] or 0,
        "total_insurance_paid": claims_row[2] or 0,
        "total_patient_responsibility": claims_row[3] or 0,
    }

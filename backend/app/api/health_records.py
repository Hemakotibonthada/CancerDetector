"""Health Records, Blood Samples, Smartwatch, Cancer Detection, Admin, Appointments, Notifications, Reports, Analytics API"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.health_record import HealthRecord
from app.models.patient import Patient
from app.schemas.health_record import HealthRecordCreate, HealthRecordResponse, HealthRecordDetailResponse
from app.security import get_current_user_id, get_current_user_token, generate_record_number

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health-records", tags=["Health Records"])

@router.get("/my", response_model=list[HealthRecordResponse])
async def get_my_health_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    record_type: str = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current patient's health records."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    query = select(HealthRecord).where(
        HealthRecord.patient_id == patient.id,
        HealthRecord.is_deleted == False
    )
    if record_type:
        query = query.where(HealthRecord.record_type == record_type)
    
    query = query.order_by(HealthRecord.encounter_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    records_result = await db.execute(query)
    records = records_result.scalars().all()
    return [HealthRecordResponse.model_validate(r) for r in records]

@router.get("/by-health-id/{health_id}", response_model=list[HealthRecordResponse])
async def get_records_by_health_id(
    health_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    record_type: str = None,
    is_cancer_related: bool = None,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get patient health records by Health ID (hospital staff access)."""
    query = select(HealthRecord).where(
        HealthRecord.health_id == health_id,
        HealthRecord.is_deleted == False
    )
    if record_type:
        query = query.where(HealthRecord.record_type == record_type)
    if is_cancer_related is not None:
        query = query.where(HealthRecord.is_cancer_related == is_cancer_related)
    
    query = query.order_by(HealthRecord.encounter_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    records = result.scalars().all()
    return [HealthRecordResponse.model_validate(r) for r in records]

@router.post("/", response_model=HealthRecordResponse, status_code=201)
async def create_health_record(
    record_data: HealthRecordCreate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new health record."""
    result = await db.execute(select(Patient).where(Patient.id == record_data.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    record = HealthRecord(
        patient_id=patient.id,
        health_id=patient.health_id,
        record_number=generate_record_number("HR"),
        **record_data.model_dump(exclude={"patient_id"})
    )
    db.add(record)
    await db.flush()
    return HealthRecordResponse.model_validate(record)

@router.get("/{record_id}", response_model=HealthRecordDetailResponse)
async def get_health_record(
    record_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific health record."""
    result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return HealthRecordDetailResponse.model_validate(record)

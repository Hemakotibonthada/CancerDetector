"""
Hospitals API Endpoints
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.hospital import Hospital, HospitalDepartment, Doctor, HospitalStaff
from app.models.patient import Patient
from app.models.operations import HospitalBed
from app.models.user import User
from app.services.stats_service import platform_snapshot
from app.schemas.hospital import (
    HospitalCreate, HospitalResponse, HospitalDetailResponse,
    HospitalUpdate, DepartmentCreate, DoctorCreate, DoctorResponse,
    HospitalDashboard
)
from app.security import get_current_user_token, require_any_admin, get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


class BedCreate(BaseModel):
    hospital_id: str
    ward: str
    bed_code: str


class BedUpdate(BaseModel):
    status: Optional[str] = None
    patient_id: Optional[str] = None
    diagnosis: Optional[str] = None
    attending_name: Optional[str] = None
    acuity: Optional[str] = None
    transfer_to_ward: Optional[str] = None
    transfer_reason: Optional[str] = None
    transfer_status: Optional[str] = None

@router.get("/", response_model=list[HospitalResponse])
async def list_hospitals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    city: str = None,
    has_cancer_center: bool = None,
    search: str = None,
    db: AsyncSession = Depends(get_db_session)
):
    """List hospitals."""
    query = select(Hospital).where(Hospital.is_deleted == False, Hospital.status == "active")
    
    if city:
        query = query.where(Hospital.city.ilike(f"%{city}%"))
    if has_cancer_center is not None:
        query = query.where(Hospital.has_cancer_center == has_cancer_center)
    if search:
        query = query.where(or_(
            Hospital.name.ilike(f"%{search}%"),
            Hospital.city.ilike(f"%{search}%"),
        ))
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    hospitals = result.scalars().all()
    
    return [HospitalResponse.model_validate(h) for h in hospitals]


@router.get("/doctors")
async def list_all_doctors(
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    """List recorded doctors. Empty when none have been added."""
    rows = (await db.execute(
        select(Doctor, User).join(User, User.id == Doctor.user_id).where(Doctor.is_deleted == False)
    )).all()
    return [{
        "id": doctor.id,
        "user_id": doctor.user_id,
        "hospital_id": doctor.hospital_id,
        "name": f"Dr. {user.first_name} {user.last_name}".strip(),
        "specialization": doctor.specialization,
    } for doctor, user in rows]


@router.get("/beds")
async def list_beds(
    hospital_id: str = None,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    query = select(HospitalBed).where(HospitalBed.is_deleted == False)
    if hospital_id:
        query = query.where(HospitalBed.hospital_id == hospital_id)
    beds = (await db.execute(query.order_by(HospitalBed.ward, HospitalBed.bed_code))).scalars().all()
    payload = []
    for bed in beds:
        patient_name = None
        health_id = None
        if bed.patient_id:
            row = (await db.execute(
                select(Patient, User).join(User, User.id == Patient.user_id).where(Patient.id == bed.patient_id)
            )).first()
            if row:
                patient, user = row
                patient_name = f"{user.first_name} {user.last_name}".strip()
                health_id = patient.health_id
        payload.append({
            **bed.to_dict(),
            "id": bed.bed_code,
            "record_id": bed.id,
            "patient": patient_name,
            "patientId": health_id,
            "admitDate": bed.admitted_at.isoformat() if bed.admitted_at else None,
            "diagnosis": bed.diagnosis,
            "doctor": bed.attending_name,
            "acuity": bed.acuity,
            "ward": bed.ward,
            "status": bed.status,
        })
    return payload


@router.post("/beds", status_code=201)
async def create_bed(
    payload: BedCreate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    bed = HospitalBed(
        hospital_id=payload.hospital_id,
        ward=payload.ward,
        bed_code=payload.bed_code,
        status="available",
    )
    db.add(bed)
    await db.flush()
    return {"id": bed.id, "bed_code": bed.bed_code, "record_id": bed.id}


@router.put("/beds/{bed_id}")
async def update_bed(
    bed_id: str,
    payload: BedUpdate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    bed = (await db.execute(select(HospitalBed).where(HospitalBed.id == bed_id))).scalar_one_or_none()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    data = payload.model_dump(exclude_unset=True)
    status = data.get("status")
    if status is not None:
        bed.status = status
        if status == "occupied" and bed.admitted_at is None:
            bed.admitted_at = datetime.now(timezone.utc)
        if status == "available":
            bed.patient_id = None
            bed.admitted_at = None
    if "patient_id" in data:
        bed.patient_id = data["patient_id"] or None
    if "diagnosis" in data:
        bed.diagnosis = data["diagnosis"]
    if "attending_name" in data:
        bed.attending_name = data["attending_name"]
    if "acuity" in data:
        bed.acuity = data["acuity"]
    if "transfer_to_ward" in data:
        bed.transfer_to_ward = data["transfer_to_ward"]
    if "transfer_reason" in data:
        bed.transfer_reason = data["transfer_reason"]
    if "transfer_status" in data:
        bed.transfer_status = data["transfer_status"]
        if data["transfer_status"] == "approved" and bed.transfer_to_ward:
            bed.ward = bed.transfer_to_ward
            bed.transfer_status = "completed"
    return bed.to_dict()


@router.get("/{hospital_id}", response_model=HospitalDetailResponse)
async def get_hospital(
    hospital_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get hospital details."""
    result = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hospital = result.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return HospitalDetailResponse.model_validate(hospital)


@router.post("/", response_model=HospitalResponse, status_code=201)
async def create_hospital(
    hospital_data: HospitalCreate,
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new hospital (admin only)."""
    existing = await db.execute(select(Hospital).where(Hospital.code == hospital_data.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Hospital code already exists")
    
    hospital = Hospital(**hospital_data.model_dump())
    db.add(hospital)
    await db.flush()
    return HospitalResponse.model_validate(hospital)


@router.put("/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: str,
    update_data: HospitalUpdate,
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Update hospital."""
    result = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hospital = result.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(hospital, key, value)
    
    return HospitalResponse.model_validate(hospital)


@router.get("/{hospital_id}/dashboard", response_model=HospitalDashboard)
async def get_hospital_dashboard(
    hospital_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get hospital dashboard data."""
    result = await db.execute(select(Hospital).where(Hospital.id == hospital_id))
    hospital = result.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    snapshot = await platform_snapshot(db)
    hospital_beds = [b for b in (await list_beds(hospital.id, token_data, db))]
    occupied = sum(1 for b in hospital_beds if b["status"] in ("occupied", "discharge_pending"))
    return HospitalDashboard(
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        total_patients=snapshot["total_patients"],
        total_doctors=snapshot["total_doctors"],
        total_staff=hospital.total_staff or 0,
        total_beds=len(hospital_beds) or (hospital.total_beds or 0),
        occupied_beds=occupied,
        today_appointments=snapshot["today_appointments"],
        pending_lab_results=snapshot["pending_lab_results"],
        high_risk_patients=snapshot["high_risk_patients"],
        ai_predictions_today=snapshot["ai_predictions_today"],
        critical_alerts=snapshot["critical_alerts"],
        revenue_this_month=snapshot["revenue_this_month"],
    )


@router.get("/{hospital_id}/doctors", response_model=list[DoctorResponse])
async def list_hospital_doctors(
    hospital_id: str,
    specialization: str = None,
    db: AsyncSession = Depends(get_db_session)
):
    """List doctors in a hospital."""
    query = select(Doctor).where(Doctor.hospital_id == hospital_id, Doctor.is_deleted == False)
    if specialization:
        query = query.where(Doctor.specialization == specialization)
    
    result = await db.execute(query)
    doctors = result.scalars().all()
    return [DoctorResponse.model_validate(d) for d in doctors]


@router.post("/{hospital_id}/departments", status_code=201)
async def create_department(
    hospital_id: str,
    dept_data: DepartmentCreate,
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a department."""
    dept = HospitalDepartment(hospital_id=hospital_id, **dept_data.model_dump())
    db.add(dept)
    return {"success": True, "message": "Department created"}

"""
Hospitals API Endpoints
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.hospital import Hospital, HospitalDepartment, Doctor, HospitalStaff
from app.schemas.hospital import (
    HospitalCreate, HospitalResponse, HospitalDetailResponse,
    HospitalUpdate, DepartmentCreate, DoctorCreate, DoctorResponse,
    HospitalDashboard
)
from app.security import get_current_user_token, require_any_admin, get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

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
    
    return HospitalDashboard(
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        total_beds=hospital.total_beds or 0,
        total_staff=hospital.total_staff or 0,
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

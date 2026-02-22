"""
Workforce & Staff Management API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.workforce import (
    StaffProfile, ShiftSchedule, LeaveRequest, CredentialingRecord, PerformanceReview, StaffingMetrics,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/workforce", tags=["Workforce"])

@router.get("/staff")
async def list_staff(department: Optional[str] = None, role: Optional[str] = None, skip: int = 0, limit: int = 50,
                     db: AsyncSession = Depends(get_db_session)):
    q = select(StaffProfile).where(StaffProfile.is_deleted == False)
    if department:
        q = q.where(StaffProfile.department == department)
    if role:
        q = q.where(StaffProfile.role == role)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/staff")
async def create_staff_profile(user_id_ref: str = Body(...), name: str = Body(...), department: str = Body(None),
                                 role: str = Body(None), specialization: str = Body(None),
                                 license_number: str = Body(None), hire_date: str = Body(None),
                                 db: AsyncSession = Depends(get_db_session)):
    profile = StaffProfile(user_id=user_id_ref, name=name, department=department, role=role,
                            specialization=specialization, license_number=license_number, hire_date=hire_date)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile.to_dict()

@router.get("/staff/{staff_id}")
async def get_staff_profile(staff_id: str, db: AsyncSession = Depends(get_db_session)):
    profile = await db.get(StaffProfile, staff_id)
    if not profile or profile.is_deleted:
        raise HTTPException(404, "Staff profile not found")
    return profile.to_dict()

@router.get("/shifts")
async def list_shifts(department: Optional[str] = None, date: Optional[str] = None, skip: int = 0, limit: int = 50,
                       db: AsyncSession = Depends(get_db_session)):
    q = select(ShiftSchedule).where(ShiftSchedule.is_deleted == False)
    if department:
        q = q.where(ShiftSchedule.department == department)
    if date:
        q = q.where(ShiftSchedule.shift_date == date)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/shifts")
async def create_shift(staff_id: str = Body(...), department: str = Body(None), shift_date: str = Body(...),
                        start_time: str = Body(...), end_time: str = Body(...), shift_type: str = Body("day"),
                        db: AsyncSession = Depends(get_db_session)):
    shift = ShiftSchedule(staff_id=staff_id, department=department, shift_date=shift_date, start_time=start_time,
                           end_time=end_time, shift_type=shift_type, status="scheduled")
    db.add(shift)
    await db.commit()
    await db.refresh(shift)
    return shift.to_dict()

@router.put("/shifts/{shift_id}/swap")
async def swap_shift(shift_id: str, new_staff_id: str = Body(...), db: AsyncSession = Depends(get_db_session)):
    shift = await db.get(ShiftSchedule, shift_id)
    if not shift:
        raise HTTPException(404, "Shift not found")
    shift.staff_id = new_staff_id
    shift.status = "swapped"
    await db.commit()
    return shift.to_dict()

@router.get("/leave-requests")
async def list_leave_requests(staff_id: Optional[str] = None, status: Optional[str] = None,
                                db: AsyncSession = Depends(get_db_session)):
    q = select(LeaveRequest).where(LeaveRequest.is_deleted == False)
    if staff_id:
        q = q.where(LeaveRequest.staff_id == staff_id)
    if status:
        q = q.where(LeaveRequest.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/leave-requests")
async def create_leave_request(start_date: str = Body(...), end_date: str = Body(...), leave_type: str = Body("vacation"),
                                 reason: str = Body(None), user_id: str = Depends(get_current_user_id),
                                 db: AsyncSession = Depends(get_db_session)):
    request = LeaveRequest(staff_id=user_id, start_date=start_date, end_date=end_date, leave_type=leave_type,
                            reason=reason, status="pending", submitted_at=datetime.now(timezone.utc))
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request.to_dict()

@router.put("/leave-requests/{request_id}/approve")
async def approve_leave(request_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    request = await db.get(LeaveRequest, request_id)
    if not request:
        raise HTTPException(404, "Leave request not found")
    request.status = "approved"
    request.approved_by = user_id
    request.approved_at = datetime.now(timezone.utc)
    await db.commit()
    return request.to_dict()

@router.get("/credentialing")
async def list_credentialing(staff_id: Optional[str] = None, status: Optional[str] = None,
                               db: AsyncSession = Depends(get_db_session)):
    q = select(CredentialingRecord).where(CredentialingRecord.is_deleted == False)
    if staff_id:
        q = q.where(CredentialingRecord.staff_id == staff_id)
    if status:
        q = q.where(CredentialingRecord.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/credentialing")
async def create_credentialing_record(staff_id: str = Body(...), credential_type: str = Body(...),
                                        credential_name: str = Body(...), issuing_body: str = Body(None),
                                        expiry_date: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    record = CredentialingRecord(staff_id=staff_id, credential_type=credential_type, credential_name=credential_name,
                                  issuing_body=issuing_body, expiry_date=expiry_date, status="active")
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record.to_dict()

@router.get("/performance-reviews")
async def list_performance_reviews(staff_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PerformanceReview).where(PerformanceReview.is_deleted == False)
    if staff_id:
        q = q.where(PerformanceReview.staff_id == staff_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/performance-reviews")
async def create_performance_review(staff_id: str = Body(...), review_period: str = Body(...),
                                      overall_rating: int = Body(None), strengths: str = Body(None),
                                      areas_for_improvement: str = Body(None), goals: str = Body(None),
                                      user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    review = PerformanceReview(staff_id=staff_id, review_period=review_period, overall_rating=overall_rating,
                                strengths=strengths, areas_for_improvement=areas_for_improvement, goals=goals,
                                reviewer_id=user_id)
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review.to_dict()

@router.get("/staffing-metrics")
async def list_staffing_metrics(department: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(StaffingMetrics).where(StaffingMetrics.is_deleted == False)
    if department:
        q = q.where(StaffingMetrics.department == department)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def workforce_stats(db: AsyncSession = Depends(get_db_session)):
    staff = await db.execute(select(func.count()).select_from(StaffProfile).where(StaffProfile.is_deleted == False))
    pending_leave = await db.execute(select(func.count()).select_from(LeaveRequest).where(LeaveRequest.status == "pending"))
    expiring_creds = await db.execute(select(func.count()).select_from(CredentialingRecord).where(CredentialingRecord.status == "expiring"))
    shifts_today = await db.execute(select(func.count()).select_from(ShiftSchedule).where(ShiftSchedule.status == "scheduled"))
    return {"total_staff": staff.scalar() or 0, "pending_leave_requests": pending_leave.scalar() or 0,
            "expiring_credentials": expiring_creds.scalar() or 0, "scheduled_shifts": shifts_today.scalar() or 0}

"""Notifications API"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.notification import Notification
from app.security import get_current_user_id

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
async def get_notifications(
    is_read: bool = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    query = select(Notification).where(
        Notification.user_id == user_id, Notification.is_active == True
    )
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    
    query = query.order_by(Notification.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    count_query = select(func.count(Notification.id)).where(
        Notification.user_id == user_id, Notification.is_read == False
    )
    unread_result = await db.execute(count_query)
    unread_count = unread_result.scalar()
    
    return {
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count,
    }

@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    return {"success": True}

@router.put("/read-all")
async def mark_all_read(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == user_id, Notification.is_read == False
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
        n.read_at = datetime.now(timezone.utc)
    return {"success": True, "count": len(notifications)}

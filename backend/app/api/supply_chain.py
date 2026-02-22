"""
Supply Chain & Asset Management API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.supply_chain import (
    InventoryItem, Vendor, PurchaseOrder, Equipment, MaintenanceRequest, AssetTracking, WasteManagement,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/supply-chain", tags=["Supply Chain"])

@router.get("/inventory")
async def list_inventory(category: Optional[str] = None, low_stock: bool = False, skip: int = 0, limit: int = 50,
                         db: AsyncSession = Depends(get_db_session)):
    q = select(InventoryItem).where(InventoryItem.is_deleted == False)
    if category:
        q = q.where(InventoryItem.category == category)
    if low_stock:
        q = q.where(InventoryItem.quantity <= InventoryItem.reorder_level)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/inventory")
async def add_inventory_item(name: str = Body(...), sku: str = Body(None), category: str = Body(None),
                              quantity: int = Body(0), unit_cost: float = Body(None), reorder_level: int = Body(10),
                              db: AsyncSession = Depends(get_db_session)):
    item = InventoryItem(name=name, sku=sku, category=category, quantity=quantity, unit_cost=unit_cost, reorder_level=reorder_level)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item.to_dict()

@router.put("/inventory/{item_id}/adjust")
async def adjust_inventory(item_id: str, adjustment: int = Body(...), reason: str = Body(None),
                            db: AsyncSession = Depends(get_db_session)):
    item = await db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    item.quantity = (item.quantity or 0) + adjustment
    await db.commit()
    return item.to_dict()

@router.get("/vendors")
async def list_vendors(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(Vendor).where(Vendor.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/vendors")
async def create_vendor(name: str = Body(...), contact_email: str = Body(None), phone: str = Body(None),
                        address: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    vendor = Vendor(name=name, contact_email=contact_email, phone=phone, address=address)
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor.to_dict()

@router.get("/purchase-orders")
async def list_purchase_orders(status: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(PurchaseOrder).where(PurchaseOrder.is_deleted == False)
    if status:
        q = q.where(PurchaseOrder.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/purchase-orders")
async def create_purchase_order(vendor_id: str = Body(...), items: str = Body(None), total_amount: float = Body(0),
                                 user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    po = PurchaseOrder(vendor_id=vendor_id, items=items, total_amount=total_amount, ordered_by=user_id,
                       status="pending", ordered_at=datetime.now(timezone.utc))
    db.add(po)
    await db.commit()
    await db.refresh(po)
    return po.to_dict()

@router.put("/purchase-orders/{po_id}/approve")
async def approve_purchase_order(po_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    po = await db.get(PurchaseOrder, po_id)
    if not po:
        raise HTTPException(404, "Purchase order not found")
    po.status = "approved"
    po.approved_by = user_id
    po.approved_at = datetime.now(timezone.utc)
    await db.commit()
    return po.to_dict()

@router.get("/equipment")
async def list_equipment(status: Optional[str] = None, department: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(Equipment).where(Equipment.is_deleted == False)
    if status:
        q = q.where(Equipment.status == status)
    if department:
        q = q.where(Equipment.department == department)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/equipment")
async def add_equipment(name: str = Body(...), serial_number: str = Body(None), department: str = Body(None),
                        manufacturer: str = Body(None), purchase_date: str = Body(None), warranty_expiry: str = Body(None),
                        db: AsyncSession = Depends(get_db_session)):
    equip = Equipment(name=name, serial_number=serial_number, department=department, manufacturer=manufacturer,
                      purchase_date=purchase_date, warranty_expiry=warranty_expiry, status="active")
    db.add(equip)
    await db.commit()
    await db.refresh(equip)
    return equip.to_dict()

@router.get("/maintenance-requests")
async def list_maintenance_requests(status: Optional[str] = None, priority: Optional[str] = None,
                                     db: AsyncSession = Depends(get_db_session)):
    q = select(MaintenanceRequest).where(MaintenanceRequest.is_deleted == False)
    if status:
        q = q.where(MaintenanceRequest.status == status)
    if priority:
        q = q.where(MaintenanceRequest.priority == priority)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/maintenance-requests")
async def create_maintenance_request(equipment_id: str = Body(...), issue_description: str = Body(...),
                                       priority: str = Body("normal"), user_id: str = Depends(get_current_user_id),
                                       db: AsyncSession = Depends(get_db_session)):
    req = MaintenanceRequest(equipment_id=equipment_id, issue_description=issue_description, priority=priority,
                              requested_by=user_id, status="open")
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req.to_dict()

@router.get("/asset-tracking")
async def list_asset_tracking(asset_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(AssetTracking).where(AssetTracking.is_deleted == False)
    if asset_type:
        q = q.where(AssetTracking.asset_type == asset_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/waste-management")
async def list_waste_records(waste_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(WasteManagement).where(WasteManagement.is_deleted == False)
    if waste_type:
        q = q.where(WasteManagement.waste_type == waste_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/waste-management")
async def log_waste(waste_type: str = Body(...), weight_kg: float = Body(...), disposal_method: str = Body(None),
                    department: str = Body(None), user_id: str = Depends(get_current_user_id),
                    db: AsyncSession = Depends(get_db_session)):
    record = WasteManagement(waste_type=waste_type, weight_kg=weight_kg, disposal_method=disposal_method,
                              department=department, logged_by=user_id)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record.to_dict()

@router.get("/dashboard/stats")
async def supply_chain_stats(db: AsyncSession = Depends(get_db_session)):
    items = await db.execute(select(func.count()).select_from(InventoryItem).where(InventoryItem.is_deleted == False))
    low_stock = await db.execute(select(func.count()).select_from(InventoryItem).where(InventoryItem.quantity <= InventoryItem.reorder_level, InventoryItem.is_deleted == False))
    equipment_count = await db.execute(select(func.count()).select_from(Equipment).where(Equipment.is_deleted == False))
    open_maintenance = await db.execute(select(func.count()).select_from(MaintenanceRequest).where(MaintenanceRequest.status == "open", MaintenanceRequest.is_deleted == False))
    return {"total_inventory_items": items.scalar() or 0, "low_stock_items": low_stock.scalar() or 0,
            "total_equipment": equipment_count.scalar() or 0, "open_maintenance": open_maintenance.scalar() or 0}

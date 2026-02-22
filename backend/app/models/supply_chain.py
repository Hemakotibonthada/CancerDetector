"""
Supply Chain & Asset Management Models
=======================================
Inventory, purchase orders, vendors, equipment,
maintenance, and hospital asset tracking.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    ORDERED = "ordered"
    SHIPPED = "shipped"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class AssetStatus(str, enum.Enum):
    ACTIVE = "active"
    IN_MAINTENANCE = "in_maintenance"
    DECOMMISSIONED = "decommissioned"
    RETIRED = "retired"


class InventoryItem(Base):
    """Hospital inventory item tracking."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(300), nullable=False)
    sku: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="each")
    current_quantity: Mapped[int] = mapped_column(Integer, default=0)
    minimum_quantity: Mapped[int] = mapped_column(Integer, default=0)
    maximum_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reorder_point: Mapped[int] = mapped_column(Integer, default=10)
    reorder_quantity: Mapped[int] = mapped_column(Integer, default=50)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_value: Mapped[float] = mapped_column(Float, default=0.0)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    storage_conditions: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    lot_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_controlled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hazardous: Mapped[bool] = mapped_column(Boolean, default=False)
    vendor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("vendor.id"), nullable=True)
    last_ordered: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    auto_reorder: Mapped[bool] = mapped_column(Boolean, default=False)


class Vendor(Base):
    """Medical supply vendor."""
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    vendor_code: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, unique=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    payment_terms: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=7)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    contract_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    contract_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    certifications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    product_categories: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    preferred: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active")


class PurchaseOrder(Base):
    """Purchase order for supplies."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendor.id"), nullable=False)
    po_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    requested_by: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=OrderStatus.DRAFT.value)
    order_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    shipping: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    line_items: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approval_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)


class Equipment(Base):
    """Hospital medical equipment."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    model_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    asset_tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, unique=True)
    purchase_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    purchase_price: Mapped[float] = mapped_column(Float, default=0.0)
    warranty_expiration: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_lifespan_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=AssetStatus.ACTIVE.value)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    last_maintenance: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_maintenance: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    maintenance_frequency_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    calibration_due: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fda_class: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    specifications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class MaintenanceRequest(Base):
    """Equipment maintenance request."""
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=False)
    requested_by: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    request_type: Mapped[str] = mapped_column(String(30), default="preventive")
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    work_performed: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parts_used: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    downtime_hours: Mapped[float] = mapped_column(Float, default=0.0)
    next_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class AssetTracking(Base):
    """Real-time asset location tracking."""
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    current_location: Mapped[str] = mapped_column(String(200), nullable=False)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    room: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tracking_method: Mapped[str] = mapped_column(String(30), default="rfid")
    last_scan: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    checked_out_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    checked_out_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_return: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    movement_history: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class WasteManagement(Base):
    """Medical waste management tracking."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    waste_type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, default=0.0)
    container_count: Mapped[int] = mapped_column(Integer, default=0)
    collection_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    disposal_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vendor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("vendor.id"), nullable=True)
    manifest_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    compliant: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

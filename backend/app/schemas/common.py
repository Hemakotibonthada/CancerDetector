"""Common Schemas"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class ResponseBase(BaseModel):
    success: bool = True
    message: str = "Success"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginatedResponse(ResponseBase, Generic[T]):
    data: List[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0
    has_next: bool = False
    has_previous: bool = False

class SingleResponse(ResponseBase, Generic[T]):
    data: Optional[T] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    uptime_seconds: float
    timestamp: datetime

class DashboardStats(BaseModel):
    total_patients: int = 0
    total_hospitals: int = 0
    total_doctors: int = 0
    total_screenings: int = 0
    total_predictions: int = 0
    high_risk_patients: int = 0
    active_alerts: int = 0
    pending_reviews: int = 0

"""Smartwatch & Cancer Screening Schemas"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class SmartwatchDataCreate(BaseModel):
    device_id: str
    timestamp: datetime
    heart_rate_avg: Optional[float] = None
    heart_rate_min: Optional[int] = None
    heart_rate_max: Optional[int] = None
    spo2_avg: Optional[float] = None
    steps: Optional[int] = None
    calories_burned: Optional[float] = None
    sleep_duration_minutes: Optional[int] = None
    stress_level: Optional[float] = None
    skin_temperature: Optional[float] = None

class SmartwatchDataResponse(BaseModel):
    id: str
    patient_id: str
    device_id: str
    timestamp: datetime
    heart_rate_avg: Optional[float] = None
    spo2_avg: Optional[float] = None
    steps: Optional[int] = None
    sleep_duration_minutes: Optional[int] = None
    stress_level: Optional[float] = None
    ai_anomaly_detected: bool = False
    ai_health_score: Optional[float] = None
    alert_generated: bool = False
    
    class Config:
        from_attributes = True

class SmartwatchDashboard(BaseModel):
    patient_id: str
    device_connected: bool = False
    last_sync: Optional[datetime] = None
    current_heart_rate: Optional[int] = None
    current_spo2: Optional[float] = None
    today_steps: int = 0
    today_calories: float = 0.0
    today_active_minutes: int = 0
    last_sleep_score: Optional[int] = None
    current_stress: Optional[float] = None
    health_score: Optional[float] = None
    anomalies_detected_today: int = 0
    heart_rate_history: List[Dict] = []
    spo2_history: List[Dict] = []
    sleep_history: List[Dict] = []
    activity_history: List[Dict] = []

class CancerRiskResponse(BaseModel):
    patient_id: str
    health_id: str
    assessment_date: datetime
    overall_risk_score: float
    overall_risk_category: str
    cancer_type_risks: Dict[str, float] = {}
    top_risk_factors: List[Dict[str, Any]] = []
    protective_factors: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    data_sources_used: Dict[str, bool] = {}
    model_confidence: float = 0.0
    model_version: str = ""
    next_screening_recommended: Optional[datetime] = None

class CancerScreeningCreate(BaseModel):
    patient_id: str
    cancer_type_screened: str
    screening_method: str
    screening_date: datetime
    hospital_id: Optional[str] = None
    doctor_id: Optional[str] = None
    result: Optional[str] = None
    findings: Optional[str] = None

class CancerScreeningResponse(BaseModel):
    id: str
    patient_id: str
    health_id: str
    screening_number: str
    screening_date: datetime
    cancer_type_screened: str
    screening_method: str
    result: Optional[str] = None
    cancer_detected: bool = False
    ai_risk_score: Optional[float] = None
    ai_risk_category: Optional[str] = None
    follow_up_required: bool = False
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

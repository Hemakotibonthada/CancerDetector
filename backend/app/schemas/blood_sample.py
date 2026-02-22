"""Blood Sample Schemas"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class BloodSampleCreate(BaseModel):
    patient_id: str
    test_type: str
    collection_date: datetime
    fasting: bool = False
    fasting_hours: Optional[int] = None
    hospital_id: Optional[str] = None
    ordering_doctor_id: Optional[str] = None
    clinical_indication: Optional[str] = None

class BloodSampleResponse(BaseModel):
    id: str
    patient_id: str
    health_id: str
    sample_number: str
    test_type: str
    sample_status: str
    collection_date: datetime
    total_tests: int = 0
    normal_results: int = 0
    abnormal_results: int = 0
    critical_results: int = 0
    ai_analyzed: bool = False
    ai_cancer_risk_score: Optional[float] = None
    ai_risk_level: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BiomarkerCreate(BaseModel):
    biomarker_name: str
    category: str
    value: float
    unit: str
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None

class BiomarkerResponse(BaseModel):
    id: str
    biomarker_name: str
    category: str
    value: float
    unit: str
    result_flag: str
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    is_cancer_marker: bool = False
    deviation_from_normal: Optional[float] = None
    trend_direction: Optional[str] = None
    ai_significance_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class BloodAnalysisResult(BaseModel):
    sample_id: str
    patient_id: str
    analysis_date: datetime
    overall_cancer_risk: float
    risk_category: str
    top_risk_biomarkers: List[Dict[str, Any]] = []
    abnormal_biomarkers: List[BiomarkerResponse] = []
    ai_recommendations: List[str] = []
    model_confidence: float = 0.0
    model_version: str = ""

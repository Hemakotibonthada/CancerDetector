"""
Report Generation Service - Comprehensive report generation for medical,
administrative, analytics, and compliance reporting.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
import math
import hashlib

logger = logging.getLogger(__name__)


class ReportType(str, Enum):
    """Types of reports supported."""
    PATIENT_SUMMARY = "patient_summary"
    PATIENT_HEALTH_HISTORY = "patient_health_history"
    CANCER_RISK_ASSESSMENT = "cancer_risk_assessment"
    TREATMENT_PLAN = "treatment_plan"
    LAB_RESULTS_SUMMARY = "lab_results_summary"
    VITAL_SIGNS_TREND = "vital_signs_trend"
    MEDICATION_HISTORY = "medication_history"
    SURGICAL_REPORT = "surgical_report"
    DISCHARGE_SUMMARY = "discharge_summary"
    REFERRAL_LETTER = "referral_letter"
    RADIOLOGY_REPORT = "radiology_report"
    PATHOLOGY_REPORT = "pathology_report"
    GENOMIC_ANALYSIS = "genomic_analysis"
    CLINICAL_TRIAL_REPORT = "clinical_trial_report"
    HOSPITAL_PERFORMANCE = "hospital_performance"
    DEPARTMENT_METRICS = "department_metrics"
    PHYSICIAN_PERFORMANCE = "physician_performance"
    FINANCIAL_SUMMARY = "financial_summary"
    REVENUE_ANALYSIS = "revenue_analysis"
    BILLING_RECONCILIATION = "billing_reconciliation"
    INSURANCE_CLAIMS = "insurance_claims"
    PATIENT_SATISFACTION = "patient_satisfaction"
    QUALITY_METRICS = "quality_metrics"
    INFECTION_CONTROL = "infection_control"
    MORTALITY_MORBIDITY = "mortality_morbidity"
    READMISSION_ANALYSIS = "readmission_analysis"
    COMPLIANCE_AUDIT = "compliance_audit"
    HIPAA_COMPLIANCE = "hipaa_compliance"
    STAFF_UTILIZATION = "staff_utilization"
    BED_OCCUPANCY = "bed_occupancy"
    SUPPLY_CHAIN = "supply_chain"
    INVENTORY_STATUS = "inventory_status"
    POPULATION_HEALTH = "population_health"
    DISEASE_SURVEILLANCE = "disease_surveillance"
    AI_MODEL_PERFORMANCE = "ai_model_performance"
    SYSTEM_AUDIT = "system_audit"
    CUSTOM = "custom"


class ReportFormat(str, Enum):
    """Output formats for reports."""
    PDF = "pdf"
    HTML = "html"
    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"
    WORD = "word"
    DICOM_SR = "dicom_sr"


class ReportStatus(str, Enum):
    """Status of report generation."""
    QUEUED = "queued"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class ReportFrequency(str, Enum):
    """Frequency for scheduled reports."""
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


@dataclass
class ReportConfig:
    """Configuration for report generation."""
    report_type: ReportType
    title: str
    description: str
    required_fields: List[str]
    optional_fields: List[str]
    default_format: ReportFormat
    supported_formats: List[ReportFormat]
    requires_auth_level: str = "user"
    max_date_range_days: int = 365
    cacheable: bool = True
    cache_ttl_minutes: int = 60
    estimated_generation_seconds: int = 5


@dataclass
class ReportRequest:
    """A request to generate a report."""
    id: str
    report_type: ReportType
    requested_by: int
    format: ReportFormat = ReportFormat.PDF
    parameters: Dict[str, Any] = field(default_factory=dict)
    filters: Dict[str, Any] = field(default_factory=dict)
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    status: ReportStatus = ReportStatus.QUEUED
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    output_path: Optional[str] = None
    file_size_bytes: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ReportSchedule:
    """Schedule for recurring report generation."""
    id: str
    report_type: ReportType
    frequency: ReportFrequency
    format: ReportFormat
    recipients: List[str]
    parameters: Dict[str, Any]
    created_by: int
    enabled: bool = True
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    run_count: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)


class ReportDataCollector:
    """Collects data needed for various report types."""

    def __init__(self):
        self._data_sources: Dict[str, Any] = {}

    async def collect_patient_data(self, patient_id: int, date_range: Tuple[datetime, datetime]) -> Dict[str, Any]:
        """Collect comprehensive patient data for reports."""
        start_date, end_date = date_range
        return {
            "patient_info": {
                "id": patient_id,
                "name": f"Patient {patient_id}",
                "date_of_birth": "1980-01-15",
                "gender": "Male",
                "blood_type": "A+",
                "mrn": f"MRN-{patient_id:06d}",
                "insurance": {"provider": "HealthCare Plus", "policy_id": f"HC-{patient_id}"},
            },
            "vitals_summary": {
                "latest": {
                    "blood_pressure_systolic": 120, "blood_pressure_diastolic": 80,
                    "heart_rate": 72, "temperature": 98.6, "respiratory_rate": 16,
                    "oxygen_saturation": 98, "weight": 170, "height": 70,
                },
                "trends": {
                    "blood_pressure": {"trend": "stable", "avg_systolic": 118, "avg_diastolic": 78},
                    "heart_rate": {"trend": "stable", "avg": 71, "min": 58, "max": 95},
                    "weight": {"trend": "decreasing", "change_lbs": -3, "period_days": 30},
                },
            },
            "lab_results": [
                {"test": "Complete Blood Count", "date": start_date.isoformat(), "status": "normal",
                 "values": {"WBC": 7.5, "RBC": 4.8, "Hemoglobin": 14.2, "Platelets": 250}},
                {"test": "Metabolic Panel", "date": start_date.isoformat(), "status": "normal",
                 "values": {"Glucose": 95, "BUN": 15, "Creatinine": 1.0, "Sodium": 140}},
                {"test": "Lipid Panel", "date": start_date.isoformat(), "status": "borderline",
                 "values": {"Total_Cholesterol": 210, "HDL": 45, "LDL": 130, "Triglycerides": 175}},
            ],
            "medications": [
                {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "start_date": "2024-01-01"},
                {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "start_date": "2024-02-15"},
            ],
            "diagnoses": [
                {"code": "E11.9", "description": "Type 2 diabetes mellitus", "date": "2023-06-15", "status": "active"},
                {"code": "I10", "description": "Essential hypertension", "date": "2024-02-15", "status": "active"},
            ],
            "appointments": [
                {"date": "2024-03-15", "type": "Follow-up", "doctor": "Dr. Smith", "department": "Internal Medicine"},
            ],
            "risk_assessments": {
                "cancer_risk": {"breast": "low", "lung": "moderate", "colorectal": "low"},
                "cardiovascular_risk": {"framingham_score": 12.5, "risk_level": "moderate"},
                "diabetes_risk": {"hba1c_trend": "improving", "control_status": "good"},
            },
            "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        }

    async def collect_hospital_data(self, hospital_id: int, date_range: Tuple[datetime, datetime]) -> Dict[str, Any]:
        """Collect hospital-wide data for administrative reports."""
        start_date, end_date = date_range
        days = (end_date - start_date).days or 1
        return {
            "hospital_info": {
                "id": hospital_id,
                "name": f"Hospital {hospital_id}",
                "total_beds": 500,
                "departments": 25,
                "staff_count": 1200,
            },
            "patient_statistics": {
                "total_patients": 15000,
                "new_patients": int(150 * days / 30),
                "active_patients": 8500,
                "discharges": int(200 * days / 30),
                "admissions": int(210 * days / 30),
                "average_los": 4.2,
                "readmission_rate": 0.08,
            },
            "bed_occupancy": {
                "overall_rate": 0.82,
                "icu_rate": 0.91,
                "general_rate": 0.78,
                "by_department": {
                    "Internal Medicine": 0.85, "Surgery": 0.79, "Oncology": 0.88,
                    "Cardiology": 0.82, "Neurology": 0.75, "Pediatrics": 0.68,
                    "Obstetrics": 0.71, "Emergency": 0.95,
                },
            },
            "financial_summary": {
                "total_revenue": 25000000 * days / 30,
                "total_expenses": 22000000 * days / 30,
                "net_income": 3000000 * days / 30,
                "revenue_by_department": {
                    "Surgery": 8000000 * days / 30, "Internal Medicine": 5000000 * days / 30,
                    "Oncology": 4000000 * days / 30, "Emergency": 3500000 * days / 30,
                    "Radiology": 2500000 * days / 30, "Laboratory": 2000000 * days / 30,
                },
                "outstanding_claims": 3500000,
                "collection_rate": 0.92,
            },
            "quality_metrics": {
                "patient_satisfaction": 4.3,
                "infection_rate": 0.012,
                "mortality_rate": 0.018,
                "adverse_events": 5 * days / 30,
                "medication_errors": 2 * days / 30,
                "falls_rate": 0.08,
                "pressure_ulcer_rate": 0.03,
                "hand_hygiene_compliance": 0.94,
                "documentation_completion": 0.97,
            },
            "staff_metrics": {
                "total_staff": 1200,
                "physicians": 180,
                "nurses": 450,
                "support_staff": 570,
                "vacancy_rate": 0.05,
                "overtime_hours": 2400 * days / 30,
                "turnover_rate": 0.12,
                "certification_compliance": 0.98,
            },
            "surgery_statistics": {
                "total_surgeries": int(120 * days / 30),
                "elective": int(80 * days / 30),
                "emergency": int(40 * days / 30),
                "cancellation_rate": 0.04,
                "on_time_start_rate": 0.88,
                "complication_rate": 0.025,
            },
            "emergency_department": {
                "total_visits": int(180 * days / 30),
                "avg_wait_time_minutes": 28,
                "avg_los_hours": 4.5,
                "left_without_being_seen": 0.03,
                "admission_rate": 0.25,
                "triage_distribution": {"1": 0.05, "2": 0.15, "3": 0.40, "4": 0.30, "5": 0.10},
            },
            "report_period": {"start": start_date.isoformat(), "end": end_date.isoformat(), "days": days},
        }

    async def collect_ai_model_data(self) -> Dict[str, Any]:
        """Collect AI model performance data."""
        return {
            "models": [
                {
                    "name": "Cancer Classifier",
                    "version": "3.2.1",
                    "type": "Classification",
                    "metrics": {
                        "accuracy": 0.945, "sensitivity": 0.932, "specificity": 0.958,
                        "auc_roc": 0.978, "f1_score": 0.938,
                    },
                    "predictions_count": 15000,
                    "avg_latency_ms": 45,
                    "last_retrained": "2024-02-01",
                    "data_drift_score": 0.03,
                    "status": "production",
                },
                {
                    "name": "Lung CT Analyzer",
                    "version": "2.1.0",
                    "type": "Image Classification",
                    "metrics": {
                        "accuracy": 0.918, "sensitivity": 0.906, "specificity": 0.931,
                        "auc_roc": 0.962, "f1_score": 0.912,
                    },
                    "predictions_count": 8500,
                    "avg_latency_ms": 120,
                    "last_retrained": "2024-01-15",
                    "data_drift_score": 0.05,
                    "status": "production",
                },
                {
                    "name": "Risk Predictor",
                    "version": "4.0.0",
                    "type": "Regression",
                    "metrics": {
                        "r2_score": 0.892, "mae": 0.045, "rmse": 0.067,
                        "concordance_index": 0.856,
                    },
                    "predictions_count": 22000,
                    "avg_latency_ms": 25,
                    "last_retrained": "2024-02-15",
                    "data_drift_score": 0.02,
                    "status": "production",
                },
                {
                    "name": "Symptom Analyzer",
                    "version": "1.5.2",
                    "type": "NLP",
                    "metrics": {
                        "accuracy": 0.875, "precision": 0.862, "recall": 0.889,
                        "f1_score": 0.875,
                    },
                    "predictions_count": 35000,
                    "avg_latency_ms": 65,
                    "last_retrained": "2024-01-20",
                    "data_drift_score": 0.04,
                    "status": "production",
                },
            ],
            "system_health": {
                "gpu_utilization": 0.65,
                "memory_usage": 0.72,
                "inference_queue_size": 12,
                "uptime_percentage": 99.95,
            },
        }


class ReportGenerator:
    """Generates report content in various formats."""

    def __init__(self):
        self.data_collector = ReportDataCollector()

    async def generate(self, request: ReportRequest) -> Dict[str, Any]:
        """Generate a report based on the request."""
        generators = {
            ReportType.PATIENT_SUMMARY: self._generate_patient_summary,
            ReportType.PATIENT_HEALTH_HISTORY: self._generate_health_history,
            ReportType.CANCER_RISK_ASSESSMENT: self._generate_cancer_risk,
            ReportType.LAB_RESULTS_SUMMARY: self._generate_lab_summary,
            ReportType.VITAL_SIGNS_TREND: self._generate_vitals_trend,
            ReportType.HOSPITAL_PERFORMANCE: self._generate_hospital_performance,
            ReportType.FINANCIAL_SUMMARY: self._generate_financial_summary,
            ReportType.QUALITY_METRICS: self._generate_quality_metrics,
            ReportType.AI_MODEL_PERFORMANCE: self._generate_ai_model_report,
            ReportType.COMPLIANCE_AUDIT: self._generate_compliance_audit,
            ReportType.POPULATION_HEALTH: self._generate_population_health,
            ReportType.BED_OCCUPANCY: self._generate_bed_occupancy,
            ReportType.STAFF_UTILIZATION: self._generate_staff_utilization,
            ReportType.READMISSION_ANALYSIS: self._generate_readmission_analysis,
        }

        generator = generators.get(request.report_type)
        if not generator:
            return self._generate_generic_report(request)

        return await generator(request)

    async def _generate_patient_summary(self, request: ReportRequest) -> Dict[str, Any]:
        patient_id = request.parameters.get("patient_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_patient_data(patient_id, date_range)

        return {
            "report_type": "Patient Summary Report",
            "generated_at": datetime.utcnow().isoformat(),
            "patient": data["patient_info"],
            "sections": [
                {
                    "title": "Demographics & Insurance",
                    "content": {
                        "name": data["patient_info"]["name"],
                        "dob": data["patient_info"]["date_of_birth"],
                        "gender": data["patient_info"]["gender"],
                        "blood_type": data["patient_info"]["blood_type"],
                        "mrn": data["patient_info"]["mrn"],
                        "insurance": data["patient_info"]["insurance"],
                    },
                },
                {
                    "title": "Current Vitals",
                    "content": data["vitals_summary"]["latest"],
                    "trends": data["vitals_summary"]["trends"],
                },
                {
                    "title": "Active Diagnoses",
                    "content": [d for d in data["diagnoses"] if d["status"] == "active"],
                },
                {
                    "title": "Current Medications",
                    "content": data["medications"],
                },
                {
                    "title": "Recent Lab Results",
                    "content": data["lab_results"],
                },
                {
                    "title": "Risk Assessments",
                    "content": data["risk_assessments"],
                },
                {
                    "title": "Upcoming Appointments",
                    "content": data["appointments"],
                },
            ],
            "recommendations": [
                "Schedule follow-up lipid panel in 3 months",
                "Continue current diabetes management regimen",
                "Monitor blood pressure at home weekly",
                "Schedule colorectal cancer screening",
            ],
        }

    async def _generate_health_history(self, request: ReportRequest) -> Dict[str, Any]:
        patient_id = request.parameters.get("patient_id", 1)
        date_range = self._get_date_range(request, default_days=1825)
        data = await self.data_collector.collect_patient_data(patient_id, date_range)

        return {
            "report_type": "Patient Health History",
            "generated_at": datetime.utcnow().isoformat(),
            "patient": data["patient_info"],
            "timeline": [
                {"date": "2020-03-01", "event": "Initial Visit", "type": "visit", "details": "Annual physical examination"},
                {"date": "2021-06-15", "event": "Diabetes Diagnosis", "type": "diagnosis", "details": "Type 2 diabetes mellitus diagnosed"},
                {"date": "2021-07-01", "event": "Metformin Started", "type": "medication", "details": "500mg twice daily"},
                {"date": "2022-01-10", "event": "Colonoscopy", "type": "procedure", "details": "Normal findings"},
                {"date": "2023-05-20", "event": "Skin Biopsy", "type": "procedure", "details": "Benign lesion removed"},
                {"date": "2024-02-15", "event": "Hypertension Diagnosis", "type": "diagnosis", "details": "Essential hypertension"},
                {"date": "2024-02-15", "event": "Lisinopril Started", "type": "medication", "details": "10mg once daily"},
            ],
            "surgical_history": [
                {"date": "2015-08-10", "procedure": "Appendectomy", "surgeon": "Dr. Wilson", "outcome": "Uneventful"},
            ],
            "family_history": [
                {"relation": "Father", "condition": "Heart Disease", "age_onset": 55},
                {"relation": "Mother", "condition": "Breast Cancer", "age_onset": 62},
                {"relation": "Sibling", "condition": "Type 2 Diabetes", "age_onset": 45},
            ],
            "immunization_history": [
                {"vaccine": "COVID-19", "date": "2023-10-15", "type": "Booster"},
                {"vaccine": "Influenza", "date": "2024-10-01", "type": "Annual"},
                {"vaccine": "Tdap", "date": "2020-03-01", "type": "Every 10 years"},
                {"vaccine": "Shingrix", "date": "2023-01-15", "type": "Series complete"},
            ],
            "allergies": [
                {"allergen": "Penicillin", "reaction": "Rash", "severity": "Moderate"},
                {"allergen": "Shellfish", "reaction": "Anaphylaxis", "severity": "Severe"},
            ],
        }

    async def _generate_cancer_risk(self, request: ReportRequest) -> Dict[str, Any]:
        patient_id = request.parameters.get("patient_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_patient_data(patient_id, date_range)
        risk_data = data["risk_assessments"]["cancer_risk"]

        cancer_types = {
            "breast": {
                "risk_level": risk_data.get("breast", "low"),
                "risk_score": 0.08,
                "factors": ["Family history (mother)", "Age > 40"],
                "protective_factors": ["Regular exercise", "Healthy BMI"],
                "screening_status": "Up to date",
                "next_screening": "2025-03-15",
                "screening_type": "Mammogram",
            },
            "lung": {
                "risk_level": risk_data.get("lung", "moderate"),
                "risk_score": 0.15,
                "factors": ["Former smoker (quit 5 years ago)", "Occupational exposure"],
                "protective_factors": ["Smoking cessation", "Regular exercise"],
                "screening_status": "Due",
                "next_screening": "2024-06-01",
                "screening_type": "Low-dose CT",
            },
            "colorectal": {
                "risk_level": risk_data.get("colorectal", "low"),
                "risk_score": 0.05,
                "factors": ["Age > 45", "Diet (moderate red meat intake)"],
                "protective_factors": ["Regular colonoscopy", "High fiber diet"],
                "screening_status": "Up to date",
                "next_screening": "2027-01-10",
                "screening_type": "Colonoscopy",
            },
            "prostate": {
                "risk_level": "low",
                "risk_score": 0.06,
                "factors": ["Age > 50", "Male"],
                "protective_factors": ["Healthy lifestyle"],
                "screening_status": "Due",
                "next_screening": "2024-08-01",
                "screening_type": "PSA + DRE",
            },
            "skin": {
                "risk_level": "low",
                "risk_score": 0.04,
                "factors": ["Fair skin", "History of sunburns"],
                "protective_factors": ["Sunscreen use", "Previous benign biopsy"],
                "screening_status": "Up to date",
                "next_screening": "2024-11-20",
                "screening_type": "Dermatological exam",
            },
        }

        return {
            "report_type": "Cancer Risk Assessment Report",
            "generated_at": datetime.utcnow().isoformat(),
            "patient": data["patient_info"],
            "overall_risk_category": "Moderate",
            "risk_by_cancer_type": cancer_types,
            "genomic_markers": {
                "tested": True,
                "brca1": "Negative",
                "brca2": "Negative",
                "lynch_syndrome": "Not tested",
                "tp53": "Normal",
            },
            "lifestyle_factors": {
                "smoking": {"status": "Former", "pack_years": 10, "quit_date": "2019-01-01"},
                "alcohol": {"status": "Moderate", "drinks_per_week": 5},
                "exercise": {"status": "Active", "minutes_per_week": 150},
                "diet": {"quality_score": 7.5, "fruits_vegs_servings": 4},
                "bmi": {"value": 26.5, "category": "Overweight"},
                "sun_exposure": {"protection": "Usually", "history_burns": "Occasional"},
            },
            "recommendations": [
                {"priority": "high", "action": "Schedule Low-dose CT for lung cancer screening",
                 "rationale": "Former smoker with 10+ pack-year history"},
                {"priority": "medium", "action": "Schedule PSA test and digital rectal exam",
                 "rationale": "Male over 50, due for prostate screening"},
                {"priority": "low", "action": "Continue annual mammogram schedule",
                 "rationale": "Family history of breast cancer"},
                {"priority": "medium", "action": "Consider Lynch syndrome genetic testing",
                 "rationale": "Family history pattern warrants evaluation"},
                {"priority": "low", "action": "Maintain healthy weight and exercise routine",
                 "rationale": "BMI slightly elevated at 26.5"},
            ],
        }

    async def _generate_lab_summary(self, request: ReportRequest) -> Dict[str, Any]:
        patient_id = request.parameters.get("patient_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_patient_data(patient_id, date_range)

        return {
            "report_type": "Laboratory Results Summary",
            "generated_at": datetime.utcnow().isoformat(),
            "patient": data["patient_info"],
            "summary": {
                "total_tests": len(data["lab_results"]),
                "normal": sum(1 for r in data["lab_results"] if r["status"] == "normal"),
                "abnormal": sum(1 for r in data["lab_results"] if r["status"] == "abnormal"),
                "borderline": sum(1 for r in data["lab_results"] if r["status"] == "borderline"),
            },
            "results": data["lab_results"],
            "trends": {
                "improving": ["Glucose (trending down)", "HbA1c (improving)"],
                "stable": ["CBC values", "Kidney function"],
                "monitoring": ["Lipid panel (borderline high)", "LDL cholesterol"],
            },
            "critical_flags": [],
            "follow_up_recommendations": [
                "Repeat lipid panel in 3 months",
                "Continue monitoring HbA1c quarterly",
            ],
        }

    async def _generate_vitals_trend(self, request: ReportRequest) -> Dict[str, Any]:
        patient_id = request.parameters.get("patient_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_patient_data(patient_id, date_range)

        return {
            "report_type": "Vital Signs Trend Report",
            "generated_at": datetime.utcnow().isoformat(),
            "patient": data["patient_info"],
            "current_vitals": data["vitals_summary"]["latest"],
            "trends": data["vitals_summary"]["trends"],
            "alerts": [],
            "chart_data": {
                "blood_pressure": [
                    {"date": "2024-01-01", "systolic": 125, "diastolic": 82},
                    {"date": "2024-01-15", "systolic": 122, "diastolic": 80},
                    {"date": "2024-02-01", "systolic": 120, "diastolic": 78},
                    {"date": "2024-02-15", "systolic": 118, "diastolic": 76},
                    {"date": "2024-03-01", "systolic": 120, "diastolic": 80},
                ],
                "heart_rate": [
                    {"date": "2024-01-01", "value": 75},
                    {"date": "2024-01-15", "value": 72},
                    {"date": "2024-02-01", "value": 70},
                    {"date": "2024-02-15", "value": 71},
                    {"date": "2024-03-01", "value": 72},
                ],
                "weight": [
                    {"date": "2024-01-01", "value": 173},
                    {"date": "2024-02-01", "value": 172},
                    {"date": "2024-03-01", "value": 170},
                ],
            },
        }

    async def _generate_hospital_performance(self, request: ReportRequest) -> Dict[str, Any]:
        hospital_id = request.parameters.get("hospital_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_hospital_data(hospital_id, date_range)

        return {
            "report_type": "Hospital Performance Report",
            "generated_at": datetime.utcnow().isoformat(),
            "hospital": data["hospital_info"],
            "period": data["report_period"],
            "kpis": {
                "patient_volume": data["patient_statistics"],
                "bed_occupancy": data["bed_occupancy"],
                "quality": data["quality_metrics"],
                "financial": {
                    "revenue": data["financial_summary"]["total_revenue"],
                    "expenses": data["financial_summary"]["total_expenses"],
                    "margin": round((data["financial_summary"]["net_income"] / max(data["financial_summary"]["total_revenue"], 1)) * 100, 1),
                },
                "emergency": data["emergency_department"],
                "surgery": data["surgery_statistics"],
            },
            "department_breakdown": data["bed_occupancy"]["by_department"],
            "benchmarks": {
                "bed_occupancy": {"target": 0.85, "actual": data["bed_occupancy"]["overall_rate"], "status": "on_target"},
                "patient_satisfaction": {"target": 4.5, "actual": data["quality_metrics"]["patient_satisfaction"], "status": "below_target"},
                "infection_rate": {"target": 0.01, "actual": data["quality_metrics"]["infection_rate"], "status": "above_target"},
                "readmission_rate": {"target": 0.07, "actual": data["patient_statistics"]["readmission_rate"], "status": "above_target"},
            },
            "action_items": [
                {"priority": "high", "area": "Infection Control", "action": "Review hand hygiene protocols",
                 "responsible": "Infection Control Team", "deadline": "2024-04-01"},
                {"priority": "medium", "area": "Patient Satisfaction", "action": "Implement patient feedback loop",
                 "responsible": "Quality Department", "deadline": "2024-04-15"},
                {"priority": "medium", "area": "Readmissions", "action": "Enhance discharge planning process",
                 "responsible": "Care Coordination", "deadline": "2024-05-01"},
            ],
        }

    async def _generate_financial_summary(self, request: ReportRequest) -> Dict[str, Any]:
        hospital_id = request.parameters.get("hospital_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_hospital_data(hospital_id, date_range)
        fin = data["financial_summary"]

        return {
            "report_type": "Financial Summary Report",
            "generated_at": datetime.utcnow().isoformat(),
            "hospital": data["hospital_info"],
            "period": data["report_period"],
            "revenue": {
                "total": fin["total_revenue"],
                "by_department": fin["revenue_by_department"],
                "by_payer": {
                    "Medicare": fin["total_revenue"] * 0.35,
                    "Medicaid": fin["total_revenue"] * 0.20,
                    "Commercial": fin["total_revenue"] * 0.30,
                    "Self-Pay": fin["total_revenue"] * 0.10,
                    "Other": fin["total_revenue"] * 0.05,
                },
            },
            "expenses": {
                "total": fin["total_expenses"],
                "by_category": {
                    "Salaries": fin["total_expenses"] * 0.55,
                    "Supplies": fin["total_expenses"] * 0.15,
                    "Equipment": fin["total_expenses"] * 0.10,
                    "Facilities": fin["total_expenses"] * 0.08,
                    "Technology": fin["total_expenses"] * 0.07,
                    "Other": fin["total_expenses"] * 0.05,
                },
            },
            "profitability": {
                "net_income": fin["net_income"],
                "operating_margin": round(fin["net_income"] / max(fin["total_revenue"], 1) * 100, 1),
                "ebitda": fin["net_income"] * 1.15,
            },
            "accounts_receivable": {
                "outstanding": fin["outstanding_claims"],
                "collection_rate": fin["collection_rate"],
                "days_in_ar": 42,
                "aging": {
                    "0-30_days": fin["outstanding_claims"] * 0.40,
                    "31-60_days": fin["outstanding_claims"] * 0.25,
                    "61-90_days": fin["outstanding_claims"] * 0.20,
                    "90+_days": fin["outstanding_claims"] * 0.15,
                },
            },
        }

    async def _generate_quality_metrics(self, request: ReportRequest) -> Dict[str, Any]:
        hospital_id = request.parameters.get("hospital_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_hospital_data(hospital_id, date_range)
        quality = data["quality_metrics"]

        return {
            "report_type": "Quality Metrics Report",
            "generated_at": datetime.utcnow().isoformat(),
            "hospital": data["hospital_info"],
            "period": data["report_period"],
            "patient_safety": {
                "infection_rate": quality["infection_rate"],
                "falls_rate": quality["falls_rate"],
                "pressure_ulcer_rate": quality["pressure_ulcer_rate"],
                "medication_errors": quality["medication_errors"],
                "adverse_events": quality["adverse_events"],
                "hand_hygiene_compliance": quality["hand_hygiene_compliance"],
            },
            "clinical_outcomes": {
                "mortality_rate": quality["mortality_rate"],
                "readmission_rate": data["patient_statistics"]["readmission_rate"],
                "average_los": data["patient_statistics"]["average_los"],
                "surgical_complication_rate": data["surgery_statistics"]["complication_rate"],
            },
            "patient_experience": {
                "overall_satisfaction": quality["patient_satisfaction"],
                "communication_score": 4.2,
                "responsiveness_score": 4.0,
                "environment_score": 4.4,
                "discharge_process_score": 3.9,
                "would_recommend": 0.87,
            },
            "process_measures": {
                "documentation_completion": quality["documentation_completion"],
                "on_time_surgery_start": data["surgery_statistics"]["on_time_start_rate"],
                "ed_wait_time_minutes": data["emergency_department"]["avg_wait_time_minutes"],
                "time_to_antibiotics_minutes": 45,
                "door_to_balloon_minutes": 68,
            },
            "compliance_scores": {
                "cms_star_rating": 4,
                "joint_commission": "Accredited",
                "leapfrog_grade": "A",
                "magnet_status": "Designated",
            },
            "improvement_priorities": [
                {"metric": "Infection Rate", "current": 0.012, "target": 0.008, "trend": "stable",
                 "action_plan": "Enhanced sterilization protocols and staff training"},
                {"metric": "Patient Satisfaction", "current": 4.3, "target": 4.7, "trend": "improving",
                 "action_plan": "Patient experience improvement program"},
                {"metric": "Readmission Rate", "current": 0.08, "target": 0.06, "trend": "stable",
                 "action_plan": "Strengthen transitional care and follow-up"},
            ],
        }

    async def _generate_ai_model_report(self, request: ReportRequest) -> Dict[str, Any]:
        data = await self.data_collector.collect_ai_model_data()
        return {
            "report_type": "AI Model Performance Report",
            "generated_at": datetime.utcnow().isoformat(),
            "models": data["models"],
            "system_health": data["system_health"],
            "recommendations": [
                {"model": "Lung CT Analyzer", "action": "Consider retraining with latest data",
                 "reason": "Higher data drift score (0.05)"},
                {"model": "Symptom Analyzer", "action": "Evaluate additional training data sources",
                 "reason": "Accuracy below 90% threshold"},
            ],
            "overall_summary": {
                "total_models": len(data["models"]),
                "in_production": sum(1 for m in data["models"] if m["status"] == "production"),
                "total_predictions": sum(m["predictions_count"] for m in data["models"]),
                "avg_accuracy": sum(m["metrics"].get("accuracy", 0) for m in data["models"]) / len(data["models"]),
                "avg_latency_ms": sum(m["avg_latency_ms"] for m in data["models"]) / len(data["models"]),
            },
        }

    async def _generate_compliance_audit(self, request: ReportRequest) -> Dict[str, Any]:
        return {
            "report_type": "Compliance Audit Report",
            "generated_at": datetime.utcnow().isoformat(),
            "audit_period": {
                "start": (request.date_range_start or datetime.utcnow() - timedelta(days=90)).isoformat(),
                "end": (request.date_range_end or datetime.utcnow()).isoformat(),
            },
            "hipaa_compliance": {
                "overall_score": 94,
                "privacy_rule": {"score": 96, "findings": 2, "critical": 0},
                "security_rule": {"score": 92, "findings": 5, "critical": 1},
                "breach_notification": {"score": 98, "findings": 0, "critical": 0},
                "enforcement_rule": {"score": 95, "findings": 1, "critical": 0},
            },
            "access_control": {
                "total_users": 1200,
                "active_sessions": 450,
                "failed_logins": 89,
                "locked_accounts": 12,
                "mfa_enabled_percentage": 92,
                "role_review_completed": True,
                "orphaned_accounts": 3,
            },
            "data_handling": {
                "encryption_at_rest": True,
                "encryption_in_transit": True,
                "pii_detected_unprotected": 0,
                "audit_trail_completeness": 99.8,
                "data_retention_compliance": 97,
                "backup_verification": True,
            },
            "audit_findings": [
                {
                    "id": "AUD-001", "severity": "high",
                    "finding": "Security rule gap in mobile device management",
                    "recommendation": "Implement MDM solution for all clinical devices",
                    "status": "open", "due_date": "2024-04-01",
                },
                {
                    "id": "AUD-002", "severity": "medium",
                    "finding": "3 orphaned user accounts detected",
                    "recommendation": "Disable accounts and review access logs",
                    "status": "in_progress", "due_date": "2024-03-15",
                },
                {
                    "id": "AUD-003", "severity": "low",
                    "finding": "8% of staff have not completed HIPAA training",
                    "recommendation": "Schedule mandatory training sessions",
                    "status": "open", "due_date": "2024-03-30",
                },
            ],
        }

    async def _generate_population_health(self, request: ReportRequest) -> Dict[str, Any]:
        return {
            "report_type": "Population Health Report",
            "generated_at": datetime.utcnow().isoformat(),
            "population_size": 50000,
            "demographics": {
                "age_distribution": {"0-17": 0.15, "18-34": 0.22, "35-49": 0.20, "50-64": 0.23, "65+": 0.20},
                "gender": {"male": 0.48, "female": 0.51, "other": 0.01},
            },
            "chronic_conditions": {
                "diabetes": {"prevalence": 0.12, "controlled": 0.65, "trend": "stable"},
                "hypertension": {"prevalence": 0.28, "controlled": 0.58, "trend": "improving"},
                "cancer": {"prevalence": 0.04, "five_year_survival": 0.68, "trend": "improving"},
                "heart_disease": {"prevalence": 0.08, "controlled": 0.62, "trend": "stable"},
                "copd": {"prevalence": 0.05, "controlled": 0.55, "trend": "stable"},
                "depression": {"prevalence": 0.15, "treated": 0.48, "trend": "increasing"},
            },
            "preventive_care": {
                "flu_vaccination": 0.45,
                "cancer_screening_adherence": 0.62,
                "wellness_visit_completion": 0.58,
                "bp_screening": 0.78,
            },
            "risk_stratification": {
                "high_risk": {"count": 5000, "percentage": 0.10, "avg_cost": 45000},
                "medium_risk": {"count": 12500, "percentage": 0.25, "avg_cost": 12000},
                "low_risk": {"count": 32500, "percentage": 0.65, "avg_cost": 3500},
            },
            "health_equity": {
                "disparities_identified": [
                    {"metric": "Cancer screening", "group": "Low income", "gap": "15% lower adherence"},
                    {"metric": "Diabetes management", "group": "Rural", "gap": "20% lower control rate"},
                ],
            },
        }

    async def _generate_bed_occupancy(self, request: ReportRequest) -> Dict[str, Any]:
        hospital_id = request.parameters.get("hospital_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_hospital_data(hospital_id, date_range)

        return {
            "report_type": "Bed Occupancy Report",
            "generated_at": datetime.utcnow().isoformat(),
            "hospital": data["hospital_info"],
            "overall": data["bed_occupancy"],
            "hourly_trend": [{"hour": h, "occupancy": 0.75 + 0.1 * math.sin(h * 0.5)} for h in range(24)],
            "forecast": {
                "next_7_days": [0.82, 0.84, 0.86, 0.83, 0.80, 0.78, 0.81],
                "model_confidence": 0.85,
            },
        }

    async def _generate_staff_utilization(self, request: ReportRequest) -> Dict[str, Any]:
        hospital_id = request.parameters.get("hospital_id", 1)
        date_range = self._get_date_range(request)
        data = await self.data_collector.collect_hospital_data(hospital_id, date_range)

        return {
            "report_type": "Staff Utilization Report",
            "generated_at": datetime.utcnow().isoformat(),
            "hospital": data["hospital_info"],
            "staff_metrics": data["staff_metrics"],
            "utilization_by_role": {
                "physicians": {"utilization": 0.88, "patient_ratio": "1:15", "satisfaction": 3.8},
                "nurses": {"utilization": 0.92, "patient_ratio": "1:5", "satisfaction": 3.6},
                "technicians": {"utilization": 0.78, "patient_ratio": "1:10", "satisfaction": 4.0},
            },
            "scheduling": {
                "shifts_covered": 0.97,
                "overtime_percentage": 0.08,
                "absenteeism_rate": 0.04,
                "agency_staff_usage": 0.06,
            },
        }

    async def _generate_readmission_analysis(self, request: ReportRequest) -> Dict[str, Any]:
        return {
            "report_type": "Readmission Analysis Report",
            "generated_at": datetime.utcnow().isoformat(),
            "overall_rate": 0.08,
            "target_rate": 0.06,
            "by_diagnosis": {
                "Heart Failure": {"rate": 0.18, "count": 45, "avg_days_to_readmit": 12},
                "Pneumonia": {"rate": 0.12, "count": 28, "avg_days_to_readmit": 8},
                "COPD": {"rate": 0.15, "count": 32, "avg_days_to_readmit": 10},
                "Hip/Knee": {"rate": 0.05, "count": 12, "avg_days_to_readmit": 15},
                "AMI": {"rate": 0.10, "count": 18, "avg_days_to_readmit": 7},
            },
            "risk_factors": [
                {"factor": "Multiple comorbidities", "odds_ratio": 2.8, "significance": "p<0.001"},
                {"factor": "Poor social support", "odds_ratio": 2.1, "significance": "p<0.005"},
                {"factor": "Medication non-adherence", "odds_ratio": 1.9, "significance": "p<0.01"},
                {"factor": "Inadequate follow-up", "odds_ratio": 1.7, "significance": "p<0.01"},
            ],
            "interventions": [
                {"name": "Transitional Care Program", "impact": "22% reduction", "status": "active"},
                {"name": "Post-discharge Phone Calls", "impact": "15% reduction", "status": "active"},
                {"name": "Medication Reconciliation", "impact": "18% reduction", "status": "active"},
            ],
        }

    async def _generate_generic_report(self, request: ReportRequest) -> Dict[str, Any]:
        return {
            "report_type": request.report_type.value,
            "generated_at": datetime.utcnow().isoformat(),
            "message": f"Report type '{request.report_type.value}' generated with default template.",
            "parameters": request.parameters,
            "filters": request.filters,
        }

    def _get_date_range(self, request: ReportRequest, default_days: int = 90) -> Tuple[datetime, datetime]:
        end = request.date_range_end or datetime.utcnow()
        start = request.date_range_start or (end - timedelta(days=default_days))
        return (start, end)


class ReportFormatRenderer:
    """Renders report data into various output formats."""

    def render_html(self, report_data: Dict[str, Any]) -> str:
        title = report_data.get("report_type", "Report")
        generated = report_data.get("generated_at", datetime.utcnow().isoformat())

        sections_html = ""
        for key, value in report_data.items():
            if key in ("report_type", "generated_at"):
                continue
            sections_html += self._render_section(key, value)

        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ font-family: 'Inter', system-ui, sans-serif; background: #f5f5f5; color: #263238; }}
                .container {{ max-width: 900px; margin: 0 auto; padding: 32px; }}
                .header {{ background: linear-gradient(135deg, #1565c0, #00897b); color: #fff;
                           padding: 32px; border-radius: 16px; margin-bottom: 24px; }}
                .header h1 {{ font-size: 24px; margin-bottom: 8px; }}
                .header .date {{ opacity: 0.8; font-size: 14px; }}
                .section {{ background: #fff; border-radius: 12px; padding: 24px;
                           margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }}
                .section h2 {{ font-size: 18px; color: #1565c0; margin-bottom: 16px;
                              border-bottom: 2px solid #e3f2fd; padding-bottom: 8px; }}
                .metric {{ display: inline-block; padding: 12px 20px; margin: 4px;
                          background: #f5f5f5; border-radius: 8px; }}
                .metric .value {{ font-size: 24px; font-weight: 700; color: #1565c0; }}
                .metric .label {{ font-size: 12px; color: #78909c; text-transform: uppercase; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
                th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #eceff1; }}
                th {{ font-size: 12px; color: #78909c; text-transform: uppercase; font-weight: 600; }}
                .badge {{ display: inline-block; padding: 4px 12px; border-radius: 12px;
                         font-size: 12px; font-weight: 600; }}
                .badge-high {{ background: #ffebee; color: #c62828; }}
                .badge-medium {{ background: #fff3e0; color: #e65100; }}
                .badge-low {{ background: #e8f5e9; color: #2e7d32; }}
                .footer {{ text-align: center; padding: 24px; color: #78909c; font-size: 12px; }}
                @media print {{ body {{ background: #fff; }} .container {{ padding: 0; }} }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{title}</h1>
                    <div class="date">Generated: {generated}</div>
                    <div class="date">CancerGuard AI Platform</div>
                </div>
                {sections_html}
                <div class="footer">
                    <p>This report was generated by CancerGuard AI. For questions, contact support@cancerguard.ai</p>
                    <p>Confidential - For authorized personnel only</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _render_section(self, title: str, data: Any, depth: int = 0) -> str:
        formatted_title = title.replace("_", " ").title()

        if isinstance(data, dict):
            content = "<div class='section'>"
            content += f"<h2>{formatted_title}</h2>"
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    content += self._render_section(key, value, depth + 1)
                else:
                    content += f"""
                    <div class="metric">
                        <div class="label">{key.replace('_', ' ').title()}</div>
                        <div class="value">{self._format_value(value)}</div>
                    </div>
                    """
            content += "</div>"
            return content
        elif isinstance(data, list):
            if not data:
                return ""
            if isinstance(data[0], dict):
                # Render as table
                headers = list(data[0].keys())
                header_html = "".join(f"<th>{h.replace('_', ' ').title()}</th>" for h in headers)
                rows = ""
                for item in data:
                    cells = "".join(f"<td>{self._format_value(item.get(h, ''))}</td>" for h in headers)
                    rows += f"<tr>{cells}</tr>"
                return f"""
                <div class="section">
                    <h2>{formatted_title}</h2>
                    <table><thead><tr>{header_html}</tr></thead><tbody>{rows}</tbody></table>
                </div>
                """
            else:
                items = "".join(f"<li>{self._format_value(item)}</li>" for item in data)
                return f"""
                <div class="section">
                    <h2>{formatted_title}</h2>
                    <ul>{items}</ul>
                </div>
                """
        else:
            return ""

    def _format_value(self, value: Any) -> str:
        if isinstance(value, float):
            if value < 1:
                return f"{value * 100:.1f}%"
            return f"{value:,.2f}"
        if isinstance(value, int):
            return f"{value:,}"
        if isinstance(value, bool):
            return "✓ Yes" if value else "✗ No"
        return str(value)

    def render_json(self, report_data: Dict[str, Any]) -> str:
        return json.dumps(report_data, indent=2, default=str)

    def render_csv(self, report_data: Dict[str, Any]) -> str:
        lines = []
        self._flatten_to_csv(report_data, lines)
        return "\n".join(lines)

    def _flatten_to_csv(self, data: Any, lines: List[str], prefix: str = ""):
        if isinstance(data, dict):
            for key, value in data.items():
                new_prefix = f"{prefix}.{key}" if prefix else key
                if isinstance(value, (dict, list)):
                    self._flatten_to_csv(value, lines, new_prefix)
                else:
                    lines.append(f"{new_prefix},{value}")
        elif isinstance(data, list):
            for i, item in enumerate(data):
                self._flatten_to_csv(item, lines, f"{prefix}[{i}]")


class ReportCache:
    """Caches generated reports for performance."""

    def __init__(self, max_size: int = 100):
        self._cache: Dict[str, Tuple[Dict[str, Any], datetime]] = {}
        self._max_size = max_size

    def _generate_key(self, request: ReportRequest) -> str:
        key_data = f"{request.report_type}:{json.dumps(request.parameters, sort_keys=True)}:{json.dumps(request.filters, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, request: ReportRequest, ttl_minutes: int = 60) -> Optional[Dict[str, Any]]:
        key = self._generate_key(request)
        if key in self._cache:
            data, cached_at = self._cache[key]
            if (datetime.utcnow() - cached_at).total_seconds() < ttl_minutes * 60:
                return data
            del self._cache[key]
        return None

    def set(self, request: ReportRequest, data: Dict[str, Any]):
        key = self._generate_key(request)
        if len(self._cache) >= self._max_size:
            oldest_key = min(self._cache, key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]
        self._cache[key] = (data, datetime.utcnow())

    def invalidate(self, report_type: Optional[ReportType] = None):
        if report_type:
            keys_to_remove = [k for k, (d, _) in self._cache.items() if d.get("report_type") == report_type.value]
            for key in keys_to_remove:
                del self._cache[key]
        else:
            self._cache.clear()


class ReportService:
    """
    Main report service - orchestrates report generation, scheduling,
    caching, and delivery.
    """

    def __init__(self):
        self.generator = ReportGenerator()
        self.renderer = ReportFormatRenderer()
        self.cache = ReportCache()
        self._requests: Dict[str, ReportRequest] = {}
        self._schedules: Dict[str, ReportSchedule] = {}
        self._request_counter = 0
        self._configs = self._register_configs()
        logger.info("ReportService initialized")

    def _register_configs(self) -> Dict[ReportType, ReportConfig]:
        return {
            ReportType.PATIENT_SUMMARY: ReportConfig(
                report_type=ReportType.PATIENT_SUMMARY,
                title="Patient Summary Report",
                description="Comprehensive overview of patient health status",
                required_fields=["patient_id"],
                optional_fields=["include_lab_results", "include_medications", "include_vitals"],
                default_format=ReportFormat.PDF,
                supported_formats=[ReportFormat.PDF, ReportFormat.HTML, ReportFormat.JSON],
            ),
            ReportType.CANCER_RISK_ASSESSMENT: ReportConfig(
                report_type=ReportType.CANCER_RISK_ASSESSMENT,
                title="Cancer Risk Assessment Report",
                description="Detailed cancer risk analysis with screening recommendations",
                required_fields=["patient_id"],
                optional_fields=["cancer_types", "include_genomics"],
                default_format=ReportFormat.PDF,
                supported_formats=[ReportFormat.PDF, ReportFormat.HTML, ReportFormat.JSON],
            ),
            ReportType.HOSPITAL_PERFORMANCE: ReportConfig(
                report_type=ReportType.HOSPITAL_PERFORMANCE,
                title="Hospital Performance Report",
                description="Key performance indicators and metrics",
                required_fields=["hospital_id"],
                optional_fields=["departments", "metrics_subset"],
                default_format=ReportFormat.PDF,
                supported_formats=[ReportFormat.PDF, ReportFormat.HTML, ReportFormat.JSON, ReportFormat.EXCEL],
                requires_auth_level="admin",
            ),
            ReportType.QUALITY_METRICS: ReportConfig(
                report_type=ReportType.QUALITY_METRICS,
                title="Quality Metrics Report",
                description="Patient safety and quality indicators",
                required_fields=["hospital_id"],
                optional_fields=["departments", "comparison_period"],
                default_format=ReportFormat.PDF,
                supported_formats=[ReportFormat.PDF, ReportFormat.HTML, ReportFormat.JSON],
                requires_auth_level="admin",
            ),
        }

    def _generate_request_id(self) -> str:
        self._request_counter += 1
        return f"RPT-{datetime.utcnow().strftime('%Y%m%d')}-{self._request_counter:05d}"

    async def generate_report(
        self,
        report_type: ReportType,
        requested_by: int,
        parameters: Dict[str, Any] = None,
        filters: Dict[str, Any] = None,
        format: ReportFormat = ReportFormat.JSON,
        date_range_start: Optional[datetime] = None,
        date_range_end: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        request = ReportRequest(
            id=self._generate_request_id(),
            report_type=report_type,
            requested_by=requested_by,
            format=format,
            parameters=parameters or {},
            filters=filters or {},
            date_range_start=date_range_start,
            date_range_end=date_range_end,
        )
        self._requests[request.id] = request

        # Check cache
        cached = self.cache.get(request)
        if cached:
            request.status = ReportStatus.COMPLETED
            request.completed_at = datetime.utcnow()
            return {"request_id": request.id, "status": "completed", "data": cached, "cached": True}

        # Generate
        try:
            request.status = ReportStatus.GENERATING
            report_data = await self.generator.generate(request)

            # Render to requested format
            rendered = self._render(report_data, format)

            # Cache result
            self.cache.set(request, report_data)

            request.status = ReportStatus.COMPLETED
            request.completed_at = datetime.utcnow()

            return {
                "request_id": request.id,
                "status": "completed",
                "data": report_data,
                "rendered": rendered if format != ReportFormat.JSON else None,
                "cached": False,
            }
        except Exception as e:
            request.status = ReportStatus.FAILED
            request.error_message = str(e)
            logger.error(f"Report generation failed: {e}")
            return {"request_id": request.id, "status": "failed", "error": str(e)}

    def _render(self, data: Dict[str, Any], format: ReportFormat) -> Optional[str]:
        if format == ReportFormat.HTML:
            return self.renderer.render_html(data)
        elif format == ReportFormat.CSV:
            return self.renderer.render_csv(data)
        elif format == ReportFormat.JSON:
            return self.renderer.render_json(data)
        return None

    def get_request_status(self, request_id: str) -> Optional[Dict[str, Any]]:
        request = self._requests.get(request_id)
        if not request:
            return None
        return {
            "request_id": request.id,
            "report_type": request.report_type.value,
            "status": request.status.value,
            "created_at": request.created_at.isoformat(),
            "completed_at": request.completed_at.isoformat() if request.completed_at else None,
            "error": request.error_message,
        }

    def list_available_reports(self) -> List[Dict[str, Any]]:
        return [
            {
                "type": config.report_type.value,
                "title": config.title,
                "description": config.description,
                "required_fields": config.required_fields,
                "supported_formats": [f.value for f in config.supported_formats],
                "requires_auth_level": config.requires_auth_level,
            }
            for config in self._configs.values()
        ]

    def schedule_report(
        self,
        report_type: ReportType,
        frequency: ReportFrequency,
        format: ReportFormat,
        recipients: List[str],
        parameters: Dict[str, Any],
        created_by: int,
    ) -> Dict[str, Any]:
        schedule_id = f"SCH-{self._request_counter + 1:05d}"
        self._request_counter += 1

        schedule = ReportSchedule(
            id=schedule_id,
            report_type=report_type,
            frequency=frequency,
            format=format,
            recipients=recipients,
            parameters=parameters,
            created_by=created_by,
            next_run=self._calculate_next_run(frequency),
        )
        self._schedules[schedule_id] = schedule

        return {
            "schedule_id": schedule_id,
            "report_type": report_type.value,
            "frequency": frequency.value,
            "next_run": schedule.next_run.isoformat() if schedule.next_run else None,
        }

    def _calculate_next_run(self, frequency: ReportFrequency) -> datetime:
        now = datetime.utcnow()
        deltas = {
            ReportFrequency.DAILY: timedelta(days=1),
            ReportFrequency.WEEKLY: timedelta(weeks=1),
            ReportFrequency.BIWEEKLY: timedelta(weeks=2),
            ReportFrequency.MONTHLY: timedelta(days=30),
            ReportFrequency.QUARTERLY: timedelta(days=90),
            ReportFrequency.ANNUALLY: timedelta(days=365),
        }
        return now + deltas.get(frequency, timedelta(days=1))

    def get_report_history(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        user_requests = [
            r for r in self._requests.values()
            if r.requested_by == user_id
        ]
        user_requests.sort(key=lambda r: r.created_at, reverse=True)
        return [
            {
                "request_id": r.id,
                "report_type": r.report_type.value,
                "status": r.status.value,
                "format": r.format.value,
                "created_at": r.created_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in user_requests[:limit]
        ]


# Singleton instance
report_service = ReportService()

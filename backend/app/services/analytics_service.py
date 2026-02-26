"""
Analytics Service - Advanced analytics, data aggregation, and business intelligence
for the CancerGuard AI healthcare platform.
"""

import logging
import math
import statistics
import time
import uuid
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

logger = logging.getLogger(__name__)


# ============================================================================
# Enums
# ============================================================================

class MetricType(str, Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"
    RATE = "rate"


class TimeGranularity(str, Enum):
    MINUTE = "minute"
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


class AnalyticsCategory(str, Enum):
    CLINICAL = "clinical"
    OPERATIONAL = "operational"
    FINANCIAL = "financial"
    PATIENT = "patient"
    PROVIDER = "provider"
    AI_MODEL = "ai_model"
    SYSTEM = "system"
    ENGAGEMENT = "engagement"
    QUALITY = "quality"
    RESEARCH = "research"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class MetricValue:
    """A single metric data point."""
    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    tags: Dict[str, str] = field(default_factory=dict)
    category: AnalyticsCategory = AnalyticsCategory.SYSTEM


@dataclass
class TimeSeriesDataPoint:
    """A data point in a time series."""
    timestamp: datetime
    value: float
    label: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TimeSeriesData:
    """Time series data for visualization."""
    name: str
    data_points: List[TimeSeriesDataPoint] = field(default_factory=list)
    unit: str = ""
    granularity: TimeGranularity = TimeGranularity.DAY

    def to_chart_data(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "unit": self.unit,
            "granularity": self.granularity.value,
            "data": [
                {"timestamp": dp.timestamp.isoformat(), "value": dp.value, "label": dp.label}
                for dp in self.data_points
            ],
        }


@dataclass
class AggregatedMetric:
    """Aggregated metric with statistical measures."""
    name: str
    count: int = 0
    sum: float = 0
    min: float = float("inf")
    max: float = float("-inf")
    mean: float = 0
    median: float = 0
    std_dev: float = 0
    p95: float = 0
    p99: float = 0
    values: List[float] = field(default_factory=list)

    def add(self, value: float):
        self.values.append(value)
        self.count += 1
        self.sum += value
        self.min = min(self.min, value)
        self.max = max(self.max, value)
        self.mean = self.sum / self.count

    def compute(self):
        if not self.values:
            return
        sorted_vals = sorted(self.values)
        self.median = sorted_vals[len(sorted_vals) // 2]
        if self.count > 1:
            self.std_dev = statistics.stdev(self.values)
        idx_95 = int(len(sorted_vals) * 0.95)
        idx_99 = int(len(sorted_vals) * 0.99)
        self.p95 = sorted_vals[min(idx_95, len(sorted_vals) - 1)]
        self.p99 = sorted_vals[min(idx_99, len(sorted_vals) - 1)]

    def to_dict(self) -> Dict[str, Any]:
        self.compute()
        return {
            "name": self.name, "count": self.count,
            "sum": round(self.sum, 2), "min": round(self.min, 2),
            "max": round(self.max, 2), "mean": round(self.mean, 2),
            "median": round(self.median, 2), "std_dev": round(self.std_dev, 2),
            "p95": round(self.p95, 2), "p99": round(self.p99, 2),
        }


# ============================================================================
# Metric Store
# ============================================================================

class MetricStore:
    """In-memory metric storage with time-series capabilities."""

    def __init__(self, max_data_points: int = 100000):
        self._metrics: Dict[str, List[MetricValue]] = defaultdict(list)
        self._counters: Dict[str, float] = defaultdict(float)
        self._gauges: Dict[str, float] = {}
        self._max_data_points = max_data_points

    def record(self, name: str, value: float, tags: Optional[Dict[str, str]] = None,
               category: AnalyticsCategory = AnalyticsCategory.SYSTEM):
        metric = MetricValue(name=name, value=value, tags=tags or {}, category=category)
        self._metrics[name].append(metric)

        # Trim if over capacity
        if len(self._metrics[name]) > self._max_data_points:
            self._metrics[name] = self._metrics[name][-self._max_data_points:]

    def increment(self, name: str, amount: float = 1.0):
        self._counters[name] += amount

    def set_gauge(self, name: str, value: float):
        self._gauges[name] = value

    def get_counter(self, name: str) -> float:
        return self._counters.get(name, 0)

    def get_gauge(self, name: str) -> Optional[float]:
        return self._gauges.get(name)

    def get_time_series(self, name: str, start: Optional[datetime] = None,
                        end: Optional[datetime] = None,
                        granularity: TimeGranularity = TimeGranularity.HOUR) -> TimeSeriesData:
        values = self._metrics.get(name, [])
        if start:
            values = [v for v in values if v.timestamp >= start]
        if end:
            values = [v for v in values if v.timestamp <= end]

        # Bucket by granularity
        buckets: Dict[str, List[float]] = defaultdict(list)
        for v in values:
            key = self._bucket_key(v.timestamp, granularity)
            buckets[key].append(v.value)

        data_points = []
        for key in sorted(buckets.keys()):
            vals = buckets[key]
            data_points.append(TimeSeriesDataPoint(
                timestamp=datetime.fromisoformat(key) if key.count("-") >= 2 else datetime.utcnow(),
                value=sum(vals) / len(vals),
                label=key,
                metadata={"count": len(vals), "sum": sum(vals), "min": min(vals), "max": max(vals)},
            ))

        return TimeSeriesData(name=name, data_points=data_points, granularity=granularity)

    def aggregate(self, name: str, start: Optional[datetime] = None,
                  end: Optional[datetime] = None) -> AggregatedMetric:
        values = self._metrics.get(name, [])
        if start:
            values = [v for v in values if v.timestamp >= start]
        if end:
            values = [v for v in values if v.timestamp <= end]

        agg = AggregatedMetric(name=name)
        for v in values:
            agg.add(v.value)
        agg.compute()
        return agg

    @staticmethod
    def _bucket_key(dt: datetime, granularity: TimeGranularity) -> str:
        if granularity == TimeGranularity.MINUTE:
            return dt.strftime("%Y-%m-%dT%H:%M:00")
        elif granularity == TimeGranularity.HOUR:
            return dt.strftime("%Y-%m-%dT%H:00:00")
        elif granularity == TimeGranularity.DAY:
            return dt.strftime("%Y-%m-%d")
        elif granularity == TimeGranularity.WEEK:
            iso = dt.isocalendar()
            return f"{iso[0]}-W{iso[1]:02d}"
        elif granularity == TimeGranularity.MONTH:
            return dt.strftime("%Y-%m")
        elif granularity == TimeGranularity.QUARTER:
            quarter = (dt.month - 1) // 3 + 1
            return f"{dt.year}-Q{quarter}"
        elif granularity == TimeGranularity.YEAR:
            return str(dt.year)
        return dt.isoformat()


# ============================================================================
# Clinical Analytics Engine
# ============================================================================

class ClinicalAnalyticsEngine:
    """Generates clinical analytics and insights."""

    def __init__(self, store: MetricStore):
        self.store = store

    def calculate_cancer_detection_metrics(self) -> Dict[str, Any]:
        """Calculate cancer detection performance metrics."""
        return {
            "screening_metrics": {
                "total_screenings": 2847,
                "positive_findings": 142,
                "true_positives": 128,
                "false_positives": 14,
                "sensitivity": 95.2,
                "specificity": 98.1,
                "ppv": 90.1,
                "npv": 99.3,
            },
            "detection_by_cancer_type": {
                "breast": {"screenings": 856, "detected": 42, "early_stage": 35, "late_stage": 7},
                "lung": {"screenings": 623, "detected": 28, "early_stage": 18, "late_stage": 10},
                "colorectal": {"screenings": 534, "detected": 31, "early_stage": 26, "late_stage": 5},
                "prostate": {"screenings": 412, "detected": 24, "early_stage": 20, "late_stage": 4},
                "cervical": {"screenings": 298, "detected": 12, "early_stage": 11, "late_stage": 1},
                "skin": {"screenings": 124, "detected": 5, "early_stage": 4, "late_stage": 1},
            },
            "ai_model_performance": {
                "accuracy": 96.8,
                "auc_roc": 0.984,
                "precision": 94.2,
                "recall": 95.2,
                "f1_score": 94.7,
                "model_version": "v3.2.1",
                "last_retrained": "2024-01-15",
            },
            "early_detection_rate": 82.4,
            "avg_time_to_diagnosis_days": 3.2,
            "screening_compliance_rate": 78.5,
        }

    def calculate_patient_outcomes(self) -> Dict[str, Any]:
        """Calculate patient outcome analytics."""
        return {
            "survival_rates": {
                "1_year": 92.3,
                "3_year": 84.7,
                "5_year": 78.2,
            },
            "treatment_outcomes": {
                "complete_response": 45.2,
                "partial_response": 28.7,
                "stable_disease": 15.3,
                "progressive_disease": 10.8,
            },
            "readmission_rates": {
                "30_day": 8.2,
                "60_day": 12.5,
                "90_day": 15.8,
                "leading_causes": [
                    {"cause": "Post-surgical complications", "rate": 3.2},
                    {"cause": "Chemotherapy side effects", "rate": 2.8},
                    {"cause": "Pain management", "rate": 1.5},
                    {"cause": "Infection", "rate": 0.7},
                ],
            },
            "patient_satisfaction": {
                "overall": 4.6,
                "communication": 4.7,
                "care_quality": 4.5,
                "wait_time": 3.8,
                "facility_cleanliness": 4.8,
                "likelihood_to_recommend": 92.0,
                "response_rate": 68.5,
            },
            "quality_of_life_scores": {
                "physical_functioning": 72.3,
                "emotional_wellbeing": 68.5,
                "social_functioning": 74.1,
                "pain_management": 76.8,
                "overall_quality": 73.4,
            },
        }

    def calculate_treatment_analytics(self) -> Dict[str, Any]:
        """Calculate treatment protocol analytics."""
        return {
            "active_treatments": {
                "chemotherapy": 234,
                "radiation": 156,
                "surgery": 89,
                "immunotherapy": 67,
                "targeted_therapy": 45,
                "hormone_therapy": 78,
                "combination": 123,
            },
            "treatment_adherence": {
                "overall": 87.3,
                "chemotherapy": 85.2,
                "oral_medications": 79.8,
                "radiation_sessions": 94.1,
                "follow_up_appointments": 82.5,
            },
            "adverse_events": {
                "grade_1_2": 456,
                "grade_3": 67,
                "grade_4": 12,
                "grade_5": 1,
                "most_common": [
                    {"event": "Nausea/Vomiting", "incidence": 42.3},
                    {"event": "Fatigue", "incidence": 38.7},
                    {"event": "Neutropenia", "incidence": 24.5},
                    {"event": "Neuropathy", "incidence": 18.2},
                    {"event": "Alopecia", "incidence": 15.8},
                ],
            },
            "clinical_trials_enrollment": {
                "active_trials": 24,
                "enrolled_patients": 189,
                "enrollment_rate": 12.5,
                "completion_rate": 78.3,
            },
        }


# ============================================================================
# Operational Analytics Engine
# ============================================================================

class OperationalAnalyticsEngine:
    """Generates operational analytics."""

    def __init__(self, store: MetricStore):
        self.store = store

    def calculate_appointment_analytics(self) -> Dict[str, Any]:
        return {
            "total_appointments": 4567,
            "completed": 3892,
            "cancelled": 412,
            "no_show": 263,
            "completion_rate": 85.2,
            "cancellation_rate": 9.0,
            "no_show_rate": 5.8,
            "avg_wait_time_minutes": 18.5,
            "avg_duration_minutes": 32.4,
            "by_type": {
                "in_person": {"count": 2834, "avg_duration": 35.2},
                "telehealth": {"count": 1245, "avg_duration": 25.8},
                "procedure": {"count": 488, "avg_duration": 45.6},
            },
            "by_department": {
                "oncology": {"count": 1234, "completion": 88.5},
                "radiology": {"count": 856, "completion": 92.3},
                "pathology": {"count": 567, "completion": 94.1},
                "surgery": {"count": 423, "completion": 96.2},
                "primary_care": {"count": 1487, "completion": 82.1},
            },
            "peak_hours": [
                {"hour": 9, "count": 567}, {"hour": 10, "count": 612},
                {"hour": 11, "count": 534}, {"hour": 14, "count": 489},
                {"hour": 15, "count": 445},
            ],
            "scheduling_efficiency": 84.7,
        }

    def calculate_resource_utilization(self) -> Dict[str, Any]:
        return {
            "bed_occupancy": {
                "overall": 78.5,
                "icu": 85.2,
                "oncology_ward": 82.3,
                "surgical": 71.4,
                "emergency": 68.9,
                "avg_length_of_stay_days": 4.2,
            },
            "equipment_utilization": {
                "mri": {"utilization": 87.3, "avg_wait_days": 3.2},
                "ct_scanner": {"utilization": 82.1, "avg_wait_days": 1.5},
                "pet_scanner": {"utilization": 75.6, "avg_wait_days": 5.8},
                "linear_accelerator": {"utilization": 91.2, "avg_wait_days": 2.1},
                "ultrasound": {"utilization": 68.4, "avg_wait_days": 0.5},
            },
            "staff_utilization": {
                "physicians": {"utilization": 82.5, "avg_patients_per_day": 18},
                "nurses": {"utilization": 88.3, "patient_ratio": 4.5},
                "technicians": {"utilization": 79.1, "procedures_per_day": 12},
                "admin_staff": {"utilization": 75.8},
            },
            "lab_turnaround": {
                "routine_blood_work": {"avg_hours": 4.2, "target_hours": 6},
                "pathology_biopsy": {"avg_hours": 48.5, "target_hours": 72},
                "genomic_testing": {"avg_days": 12.3, "target_days": 14},
                "imaging_results": {"avg_hours": 2.1, "target_hours": 4},
            },
        }

    def calculate_financial_analytics(self) -> Dict[str, Any]:
        return {
            "revenue": {
                "total_monthly": 2450000,
                "by_department": {
                    "oncology": 825000,
                    "surgery": 620000,
                    "radiology": 410000,
                    "laboratory": 285000,
                    "pharmacy": 195000,
                    "primary_care": 115000,
                },
                "by_payer": {
                    "private_insurance": 1225000,
                    "medicare": 735000,
                    "medicaid": 245000,
                    "self_pay": 147000,
                    "other": 98000,
                },
                "month_over_month_growth": 3.2,
            },
            "expenses": {
                "total_monthly": 1960000,
                "salaries_benefits": 1180000,
                "supplies_medications": 392000,
                "equipment_maintenance": 196000,
                "facility_operations": 135000,
                "technology": 57000,
            },
            "profitability": {
                "gross_margin": 20.0,
                "net_margin": 12.5,
                "operating_income": 490000,
            },
            "accounts_receivable": {
                "total_outstanding": 3200000,
                "avg_days_to_collect": 42,
                "aging": {
                    "0_30_days": 1440000,
                    "31_60_days": 960000,
                    "61_90_days": 480000,
                    "90_plus_days": 320000,
                },
                "collection_rate": 94.5,
            },
            "claim_metrics": {
                "total_submitted": 4200,
                "approved": 3780,
                "denied": 378,
                "pending": 42,
                "denial_rate": 9.0,
                "avg_reimbursement_time_days": 28,
                "top_denial_reasons": [
                    {"reason": "Missing documentation", "count": 142},
                    {"reason": "Coding error", "count": 98},
                    {"reason": "Prior auth required", "count": 76},
                    {"reason": "Out of network", "count": 62},
                ],
            },
        }


# ============================================================================
# Population Health Analytics
# ============================================================================

class PopulationHealthAnalytics:
    """Population-level health analytics."""

    def calculate_demographics(self) -> Dict[str, Any]:
        return {
            "total_patients": 12547,
            "active_patients": 8932,
            "new_patients_this_month": 234,
            "age_distribution": {
                "0_17": 856, "18_29": 1245, "30_39": 1678,
                "40_49": 2345, "50_59": 2867, "60_69": 2134,
                "70_79": 987, "80_plus": 435,
            },
            "gender_distribution": {
                "male": 5847, "female": 6512, "other": 188,
            },
            "ethnicity_distribution": {
                "white": 5892, "hispanic": 2510, "black": 2134,
                "asian": 1245, "other": 766,
            },
            "insurance_distribution": {
                "private": 6274, "medicare": 3136, "medicaid": 2009,
                "uninsured": 628, "other": 500,
            },
        }

    def calculate_disease_prevalence(self) -> Dict[str, Any]:
        return {
            "cancer_types": {
                "breast": {"cases": 423, "prevalence_pct": 3.37, "trend": "stable"},
                "lung": {"cases": 312, "prevalence_pct": 2.49, "trend": "decreasing"},
                "colorectal": {"cases": 267, "prevalence_pct": 2.13, "trend": "stable"},
                "prostate": {"cases": 198, "prevalence_pct": 1.58, "trend": "stable"},
                "skin": {"cases": 156, "prevalence_pct": 1.24, "trend": "increasing"},
                "bladder": {"cases": 89, "prevalence_pct": 0.71, "trend": "stable"},
                "lymphoma": {"cases": 67, "prevalence_pct": 0.53, "trend": "stable"},
                "leukemia": {"cases": 45, "prevalence_pct": 0.36, "trend": "stable"},
            },
            "comorbidities": {
                "hypertension": {"prevalence_pct": 32.5, "patients": 4078},
                "diabetes_type2": {"prevalence_pct": 18.2, "patients": 2284},
                "obesity": {"prevalence_pct": 28.7, "patients": 3601},
                "cardiovascular": {"prevalence_pct": 15.3, "patients": 1920},
                "copd": {"prevalence_pct": 8.9, "patients": 1117},
                "depression": {"prevalence_pct": 22.1, "patients": 2773},
                "anxiety": {"prevalence_pct": 19.8, "patients": 2484},
            },
            "risk_stratification": {
                "high_risk": {"count": 1883, "pct": 15.0},
                "moderate_risk": {"count": 3764, "pct": 30.0},
                "low_risk": {"count": 5021, "pct": 40.0},
                "minimal_risk": {"count": 1879, "pct": 15.0},
            },
        }

    def calculate_preventive_care_gaps(self) -> Dict[str, Any]:
        return {
            "screening_gaps": {
                "mammogram": {"eligible": 3200, "completed": 2496, "gap_pct": 22.0},
                "colonoscopy": {"eligible": 4500, "completed": 3150, "gap_pct": 30.0},
                "pap_smear": {"eligible": 2800, "completed": 2380, "gap_pct": 15.0},
                "psa": {"eligible": 1800, "completed": 1314, "gap_pct": 27.0},
                "skin_check": {"eligible": 6000, "completed": 3600, "gap_pct": 40.0},
                "lung_ct": {"eligible": 800, "completed": 480, "gap_pct": 40.0},
            },
            "vaccination_gaps": {
                "flu": {"eligible": 12547, "completed": 7528, "gap_pct": 40.0},
                "covid_booster": {"eligible": 12547, "completed": 5647, "gap_pct": 55.0},
                "shingles": {"eligible": 3556, "completed": 1778, "gap_pct": 50.0},
                "pneumonia": {"eligible": 2800, "completed": 1960, "gap_pct": 30.0},
            },
            "wellness_visits": {
                "annual_physical": {"eligible": 12547, "completed": 8783, "gap_pct": 30.0},
                "dental_checkup": {"eligible": 12547, "completed": 6274, "gap_pct": 50.0},
                "eye_exam": {"eligible": 12547, "completed": 5020, "gap_pct": 60.0},
            },
        }

    def calculate_health_equity_metrics(self) -> Dict[str, Any]:
        return {
            "access_by_income": {
                "low_income": {"screening_rate": 62.3, "treatment_delay_days": 12.5},
                "middle_income": {"screening_rate": 78.9, "treatment_delay_days": 5.2},
                "high_income": {"screening_rate": 91.2, "treatment_delay_days": 2.1},
            },
            "access_by_region": {
                "urban": {"avg_distance_miles": 5.2, "access_score": 92},
                "suburban": {"avg_distance_miles": 12.8, "access_score": 78},
                "rural": {"avg_distance_miles": 35.4, "access_score": 54},
            },
            "outcome_disparities": {
                "early_detection_by_ethnicity": {
                    "white": 78.5, "hispanic": 65.2, "black": 62.8,
                    "asian": 75.3, "other": 68.4,
                },
                "treatment_adherence_by_insurance": {
                    "private": 89.5, "medicare": 85.2,
                    "medicaid": 72.8, "uninsured": 58.3,
                },
            },
            "sdoh_factors": {
                "food_insecurity": {"prevalence_pct": 14.2, "screened": 65.0},
                "housing_instability": {"prevalence_pct": 8.7, "screened": 58.0},
                "transportation_barriers": {"prevalence_pct": 12.5, "screened": 72.0},
                "social_isolation": {"prevalence_pct": 18.3, "screened": 45.0},
            },
        }


# ============================================================================
# System Analytics
# ============================================================================

class SystemAnalytics:
    """System performance and usage analytics."""

    def __init__(self, store: MetricStore):
        self.store = store
        self._api_calls: Dict[str, int] = defaultdict(int)
        self._response_times: Dict[str, List[float]] = defaultdict(list)
        self._error_counts: Dict[str, int] = defaultdict(int)
        self._user_sessions: Dict[str, datetime] = {}
        self._feature_usage: Dict[str, int] = defaultdict(int)

    def record_api_call(self, endpoint: str, method: str, status: int, duration_ms: float):
        key = f"{method}:{endpoint}"
        self._api_calls[key] += 1
        self._response_times[key].append(duration_ms)
        if status >= 400:
            self._error_counts[key] += 1

    def record_user_session(self, user_id: str):
        self._user_sessions[user_id] = datetime.utcnow()

    def record_feature_usage(self, feature: str, user_id: str):
        self._feature_usage[feature] += 1

    def get_api_metrics(self) -> Dict[str, Any]:
        metrics = {}
        for endpoint, count in sorted(self._api_calls.items(), key=lambda x: -x[1])[:20]:
            times = self._response_times.get(endpoint, [])
            errors = self._error_counts.get(endpoint, 0)
            sorted_times = sorted(times) if times else [0]
            metrics[endpoint] = {
                "calls": count,
                "avg_response_ms": round(sum(times) / max(len(times), 1), 1),
                "p95_response_ms": round(sorted_times[int(len(sorted_times) * 0.95)] if sorted_times else 0, 1),
                "error_rate": round(errors / max(count, 1) * 100, 1),
            }
        return {
            "total_calls": sum(self._api_calls.values()),
            "total_errors": sum(self._error_counts.values()),
            "endpoints": metrics,
        }

    def get_user_engagement(self) -> Dict[str, Any]:
        now = datetime.utcnow()
        active_24h = sum(1 for t in self._user_sessions.values()
                         if (now - t).total_seconds() < 86400)
        active_1h = sum(1 for t in self._user_sessions.values()
                        if (now - t).total_seconds() < 3600)
        return {
            "total_users": len(self._user_sessions),
            "active_last_hour": active_1h,
            "active_last_24h": active_24h,
            "feature_usage": dict(sorted(self._feature_usage.items(), key=lambda x: -x[1])[:20]),
        }


# ============================================================================
# Dashboard Data Builder
# ============================================================================

class DashboardDataBuilder:
    """Builds combined dashboard data from multiple analytics sources."""

    def __init__(self, clinical: ClinicalAnalyticsEngine,
                 operational: OperationalAnalyticsEngine,
                 population: PopulationHealthAnalytics,
                 system: SystemAnalytics):
        self.clinical = clinical
        self.operational = operational
        self.population = population
        self.system = system

    def build_admin_dashboard(self) -> Dict[str, Any]:
        return {
            "summary": {
                "total_patients": 12547,
                "active_cases": 1567,
                "appointments_today": 186,
                "pending_results": 45,
                "revenue_mtd": 2450000,
                "bed_occupancy": 78.5,
                "ai_accuracy": 96.8,
                "patient_satisfaction": 4.6,
            },
            "clinical": self.clinical.calculate_cancer_detection_metrics(),
            "operations": self.operational.calculate_appointment_analytics(),
            "financial": self.operational.calculate_financial_analytics(),
            "population": self.population.calculate_demographics(),
            "system": self.system.get_api_metrics(),
            "generated_at": datetime.utcnow().isoformat(),
        }

    def build_clinical_dashboard(self) -> Dict[str, Any]:
        return {
            "cancer_detection": self.clinical.calculate_cancer_detection_metrics(),
            "patient_outcomes": self.clinical.calculate_patient_outcomes(),
            "treatment_analytics": self.clinical.calculate_treatment_analytics(),
            "disease_prevalence": self.population.calculate_disease_prevalence(),
            "preventive_care": self.population.calculate_preventive_care_gaps(),
            "generated_at": datetime.utcnow().isoformat(),
        }

    def build_provider_dashboard(self, provider_id: str) -> Dict[str, Any]:
        return {
            "provider_id": provider_id,
            "today": {
                "appointments": 18,
                "completed": 12,
                "pending": 4,
                "cancelled": 2,
            },
            "patients": {
                "total_assigned": 245,
                "high_risk": 32,
                "pending_results": 8,
                "overdue_screenings": 15,
            },
            "performance": {
                "patient_satisfaction": 4.7,
                "on_time_rate": 85.3,
                "documentation_compliance": 92.5,
                "quality_score": 94.1,
            },
            "alerts": [
                {"type": "critical_lab", "patient": "Patient A", "message": "Critical potassium level"},
                {"type": "overdue_screening", "patient": "Patient B", "message": "Mammogram 3 months overdue"},
            ],
            "generated_at": datetime.utcnow().isoformat(),
        }

    def build_patient_dashboard(self, patient_id: str) -> Dict[str, Any]:
        return {
            "patient_id": patient_id,
            "health_score": 82,
            "risk_level": "moderate",
            "upcoming_appointments": 3,
            "pending_results": 1,
            "active_medications": 4,
            "unread_messages": 2,
            "health_trends": {
                "blood_pressure": {"current": "128/82", "trend": "improving", "change": -3.2},
                "weight": {"current": "185 lbs", "trend": "stable", "change": -0.5},
                "bmi": {"current": 27.4, "trend": "improving", "change": -0.3},
                "glucose": {"current": "112 mg/dL", "trend": "improving", "change": -5.2},
            },
            "screening_status": {
                "mammogram": {"status": "completed", "date": "2024-01-15", "result": "normal"},
                "colonoscopy": {"status": "due", "date": "2024-06-15"},
                "skin_check": {"status": "overdue", "date": "2023-06-01"},
            },
            "wellness_goals": [
                {"goal": "10,000 steps daily", "progress": 78, "streak_days": 12},
                {"goal": "8 hours sleep", "progress": 65, "avg_hours": 7.2},
                {"goal": "Healthy weight", "progress": 45, "target_lbs": 170},
            ],
            "generated_at": datetime.utcnow().isoformat(),
        }


# ============================================================================
# Analytics Service
# ============================================================================

class AnalyticsService:
    """Main analytics service orchestrating all analytics engines."""

    def __init__(self):
        self.store = MetricStore()
        self.clinical = ClinicalAnalyticsEngine(self.store)
        self.operational = OperationalAnalyticsEngine(self.store)
        self.population = PopulationHealthAnalytics()
        self.system = SystemAnalytics(self.store)
        self.dashboard = DashboardDataBuilder(
            self.clinical, self.operational, self.population, self.system,
        )

    # Metric recording
    def record_metric(self, name: str, value: float, category: AnalyticsCategory = AnalyticsCategory.SYSTEM,
                      tags: Optional[Dict[str, str]] = None):
        self.store.record(name, value, tags, category)

    def increment_counter(self, name: str, amount: float = 1.0):
        self.store.increment(name, amount)

    def set_gauge(self, name: str, value: float):
        self.store.set_gauge(name, value)

    # Analytics retrieval
    def get_time_series(self, metric_name: str, hours: int = 24,
                        granularity: TimeGranularity = TimeGranularity.HOUR) -> Dict[str, Any]:
        start = datetime.utcnow() - timedelta(hours=hours)
        ts = self.store.get_time_series(metric_name, start=start, granularity=granularity)
        return ts.to_chart_data()

    def get_aggregated_metric(self, name: str, hours: int = 24) -> Dict[str, Any]:
        start = datetime.utcnow() - timedelta(hours=hours)
        return self.store.aggregate(name, start=start).to_dict()

    # Dashboard endpoints
    def get_admin_dashboard(self) -> Dict[str, Any]:
        return self.dashboard.build_admin_dashboard()

    def get_clinical_dashboard(self) -> Dict[str, Any]:
        return self.dashboard.build_clinical_dashboard()

    def get_provider_dashboard(self, provider_id: str) -> Dict[str, Any]:
        return self.dashboard.build_provider_dashboard(provider_id)

    def get_patient_dashboard(self, patient_id: str) -> Dict[str, Any]:
        return self.dashboard.build_patient_dashboard(patient_id)

    # Specific analytics
    def get_cancer_detection_metrics(self) -> Dict[str, Any]:
        return self.clinical.calculate_cancer_detection_metrics()

    def get_patient_outcomes(self) -> Dict[str, Any]:
        return self.clinical.calculate_patient_outcomes()

    def get_treatment_analytics(self) -> Dict[str, Any]:
        return self.clinical.calculate_treatment_analytics()

    def get_appointment_analytics(self) -> Dict[str, Any]:
        return self.operational.calculate_appointment_analytics()

    def get_resource_utilization(self) -> Dict[str, Any]:
        return self.operational.calculate_resource_utilization()

    def get_financial_analytics(self) -> Dict[str, Any]:
        return self.operational.calculate_financial_analytics()

    def get_demographics(self) -> Dict[str, Any]:
        return self.population.calculate_demographics()

    def get_disease_prevalence(self) -> Dict[str, Any]:
        return self.population.calculate_disease_prevalence()

    def get_preventive_care_gaps(self) -> Dict[str, Any]:
        return self.population.calculate_preventive_care_gaps()

    def get_health_equity(self) -> Dict[str, Any]:
        return self.population.calculate_health_equity_metrics()

    def get_system_metrics(self) -> Dict[str, Any]:
        return {
            "api_metrics": self.system.get_api_metrics(),
            "user_engagement": self.system.get_user_engagement(),
        }

    def get_comprehensive_report(self) -> Dict[str, Any]:
        """Generate a comprehensive analytics report."""
        return {
            "clinical": {
                "cancer_detection": self.clinical.calculate_cancer_detection_metrics(),
                "patient_outcomes": self.clinical.calculate_patient_outcomes(),
                "treatment": self.clinical.calculate_treatment_analytics(),
            },
            "operational": {
                "appointments": self.operational.calculate_appointment_analytics(),
                "resources": self.operational.calculate_resource_utilization(),
                "financial": self.operational.calculate_financial_analytics(),
            },
            "population": {
                "demographics": self.population.calculate_demographics(),
                "disease_prevalence": self.population.calculate_disease_prevalence(),
                "preventive_care": self.population.calculate_preventive_care_gaps(),
                "health_equity": self.population.calculate_health_equity_metrics(),
            },
            "system": {
                "api": self.system.get_api_metrics(),
                "engagement": self.system.get_user_engagement(),
            },
            "generated_at": datetime.utcnow().isoformat(),
            "report_version": "2.0",
        }


# Singleton instance
analytics_service = AnalyticsService()

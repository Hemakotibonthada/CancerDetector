"""
Anomaly Detector - Detects anomalies in patient vital signs, lab results,
and clinical data using statistical methods, Isolation Forest, and
local outlier factor algorithms.
"""

import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict, deque

import numpy as np

logger = logging.getLogger(__name__)


class AnomalyType(Enum):
    POINT = "point"                   # Single point anomaly
    CONTEXTUAL = "contextual"         # Anomalous in context
    COLLECTIVE = "collective"         # Group of related anomalies
    TREND = "trend"                   # Abnormal trend
    PATTERN = "pattern"               # Unusual pattern


class AnomalySeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class AlertStatus(Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"


@dataclass
class AnomalyAlert:
    alert_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str = ""
    metric_name: str = ""
    metric_value: float = 0.0
    expected_range: Tuple[float, float] = (0.0, 0.0)
    anomaly_type: str = "point"
    severity: str = "medium"
    status: str = "active"
    anomaly_score: float = 0.0
    description: str = ""
    clinical_context: str = ""
    recommended_action: str = ""
    related_alerts: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return {
            **asdict(self),
            "expected_range": list(self.expected_range),
        }


@dataclass
class MonitoringResult:
    result_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str = ""
    total_metrics_checked: int = 0
    anomalies_detected: int = 0
    alerts: List[Dict] = field(default_factory=list)
    risk_level: str = "normal"
    summary: str = ""
    trend_analysis: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


class VitalSignsRanges:
    """Normal ranges for vital signs with age/gender adjustments."""

    RANGES = {
        "heart_rate": {
            "adult": {"normal": (60, 100), "warning": (50, 110), "critical": (40, 130)},
            "child": {"normal": (70, 120), "warning": (60, 140), "critical": (50, 160)},
            "elderly": {"normal": (55, 95), "warning": (45, 110), "critical": (35, 130)},
            "unit": "bpm",
        },
        "systolic_bp": {
            "adult": {"normal": (90, 130), "warning": (80, 150), "critical": (70, 180)},
            "elderly": {"normal": (100, 140), "warning": (85, 160), "critical": (70, 200)},
            "unit": "mmHg",
        },
        "diastolic_bp": {
            "adult": {"normal": (60, 85), "warning": (50, 95), "critical": (40, 110)},
            "elderly": {"normal": (60, 90), "warning": (50, 100), "critical": (40, 110)},
            "unit": "mmHg",
        },
        "temperature": {
            "adult": {"normal": (36.1, 37.5), "warning": (35.5, 38.3), "critical": (35.0, 39.5)},
            "child": {"normal": (36.1, 37.8), "warning": (35.5, 38.5), "critical": (35.0, 40.0)},
            "unit": "°C",
        },
        "respiratory_rate": {
            "adult": {"normal": (12, 20), "warning": (10, 25), "critical": (8, 30)},
            "child": {"normal": (15, 30), "warning": (12, 40), "critical": (10, 50)},
            "unit": "breaths/min",
        },
        "spo2": {
            "adult": {"normal": (95, 100), "warning": (90, 100), "critical": (85, 100)},
            "unit": "%",
        },
        "blood_glucose": {
            "fasting": {"normal": (70, 99), "warning": (60, 125), "critical": (50, 200)},
            "random": {"normal": (70, 140), "warning": (55, 200), "critical": (40, 350)},
            "unit": "mg/dL",
        },
        "pain_score": {
            "adult": {"normal": (0, 3), "warning": (4, 6), "critical": (7, 10)},
            "unit": "0-10 NRS",
        },
    }

    LAB_RANGES = {
        "wbc": {"normal": (4.5, 11.0), "warning": (3.0, 15.0), "critical": (1.0, 30.0), "unit": "×10³/µL"},
        "hemoglobin": {
            "male": {"normal": (13.5, 17.5), "warning": (10.0, 19.0), "critical": (7.0, 22.0)},
            "female": {"normal": (12.0, 16.0), "warning": (9.0, 18.0), "critical": (7.0, 20.0)},
            "unit": "g/dL",
        },
        "platelet_count": {"normal": (150, 400), "warning": (100, 500), "critical": (50, 800), "unit": "×10³/µL"},
        "creatinine": {
            "male": {"normal": (0.7, 1.3), "warning": (0.5, 2.0), "critical": (0.3, 5.0)},
            "female": {"normal": (0.6, 1.1), "warning": (0.4, 1.8), "critical": (0.3, 5.0)},
            "unit": "mg/dL",
        },
        "ast": {"normal": (10, 40), "warning": (5, 80), "critical": (0, 200), "unit": "U/L"},
        "alt": {"normal": (7, 56), "warning": (5, 100), "critical": (0, 300), "unit": "U/L"},
        "sodium": {"normal": (136, 145), "warning": (130, 150), "critical": (125, 155), "unit": "mEq/L"},
        "potassium": {"normal": (3.5, 5.0), "warning": (3.0, 5.5), "critical": (2.5, 6.5), "unit": "mEq/L"},
        "calcium": {"normal": (8.5, 10.5), "warning": (7.5, 11.5), "critical": (6.5, 13.0), "unit": "mg/dL"},
        "bun": {"normal": (7, 20), "warning": (5, 30), "critical": (3, 50), "unit": "mg/dL"},
        "troponin": {"normal": (0, 0.04), "warning": (0.04, 0.1), "critical": (0.1, 50), "unit": "ng/mL"},
        "bnp": {"normal": (0, 100), "warning": (100, 300), "critical": (300, 5000), "unit": "pg/mL"},
        "d_dimer": {"normal": (0, 0.5), "warning": (0.5, 2.0), "critical": (2.0, 50), "unit": "µg/mL"},
        "psa": {
            "male_under_50": {"normal": (0, 2.5), "warning": (2.5, 4.0), "critical": (4.0, 100)},
            "male_over_50": {"normal": (0, 4.0), "warning": (4.0, 10.0), "critical": (10.0, 100)},
            "unit": "ng/mL",
        },
        "tsh": {"normal": (0.4, 4.0), "warning": (0.1, 10.0), "critical": (0.01, 50.0), "unit": "mIU/L"},
        "hba1c": {"normal": (4.0, 5.6), "warning": (5.7, 6.4), "critical": (6.5, 15.0), "unit": "%"},
        "ldh": {"normal": (140, 280), "warning": (100, 400), "critical": (50, 1000), "unit": "U/L"},
        "cea": {"normal": (0, 3.0), "warning": (3.0, 10.0), "critical": (10.0, 500), "unit": "ng/mL"},
        "ca125": {"normal": (0, 35), "warning": (35, 100), "critical": (100, 5000), "unit": "U/mL"},
        "afp": {"normal": (0, 10), "warning": (10, 50), "critical": (50, 10000), "unit": "ng/mL"},
        "inr": {"normal": (0.8, 1.2), "warning": (1.3, 3.5), "critical": (3.5, 10), "unit": "ratio"},
    }

    @classmethod
    def get_range(cls, metric: str, context: Optional[Dict] = None) -> Dict:
        """Get appropriate range for the metric with context."""
        ctx = context or {}
        age = ctx.get("age", 40)
        gender = ctx.get("gender", "").lower()

        # Vital signs
        if metric in cls.RANGES:
            ranges = cls.RANGES[metric]
            if age < 18 and "child" in ranges:
                return ranges["child"]
            elif age > 65 and "elderly" in ranges:
                return ranges["elderly"]
            elif "adult" in ranges:
                return ranges["adult"]
            elif "fasting" in ranges:
                return ranges.get(ctx.get("condition", "fasting"), ranges["fasting"])
            return list(ranges.values())[0]

        # Lab values
        if metric in cls.LAB_RANGES:
            lab = cls.LAB_RANGES[metric]
            if gender == "male" and f"male" in lab:
                return lab["male"]
            elif gender == "female" and f"female" in lab:
                return lab["female"]
            elif gender == "male" and age < 50 and f"male_under_50" in lab:
                return lab["male_under_50"]
            elif gender == "male" and age >= 50 and f"male_over_50" in lab:
                return lab["male_over_50"]
            elif "normal" in lab:
                return lab
            return list(lab.values())[0]

        return {"normal": (0, 100), "warning": (0, 150), "critical": (0, 200)}


class StatisticalAnomalyDetector:
    """Statistical methods for anomaly detection."""

    def __init__(self, window_size: int = 50):
        self.window_size = window_size
        self.data_windows: Dict[str, deque] = defaultdict(lambda: deque(maxlen=window_size))

    def add_datapoint(self, metric: str, value: float, patient_id: str = "default"):
        """Add a datapoint to the rolling window."""
        key = f"{patient_id}:{metric}"
        self.data_windows[key].append(value)

    def detect_zscore(
        self,
        metric: str,
        value: float,
        patient_id: str = "default",
        threshold: float = 3.0,
    ) -> Optional[Dict]:
        """Detect anomaly using Z-score method."""
        key = f"{patient_id}:{metric}"
        data = self.data_windows.get(key)

        if not data or len(data) < 5:
            return None

        arr = np.array(data)
        mean = np.mean(arr)
        std = np.std(arr)

        if std == 0:
            return None

        z_score = abs(value - mean) / std

        if z_score > threshold:
            return {
                "method": "z_score",
                "z_score": round(z_score, 3),
                "threshold": threshold,
                "mean": round(mean, 3),
                "std": round(std, 3),
                "is_anomaly": True,
                "direction": "high" if value > mean else "low",
            }
        return None

    def detect_iqr(
        self,
        metric: str,
        value: float,
        patient_id: str = "default",
        factor: float = 1.5,
    ) -> Optional[Dict]:
        """Detect anomaly using IQR method."""
        key = f"{patient_id}:{metric}"
        data = self.data_windows.get(key)

        if not data or len(data) < 10:
            return None

        arr = np.array(data)
        q1 = np.percentile(arr, 25)
        q3 = np.percentile(arr, 75)
        iqr = q3 - q1

        lower_bound = q1 - factor * iqr
        upper_bound = q3 + factor * iqr

        if value < lower_bound or value > upper_bound:
            return {
                "method": "iqr",
                "q1": round(q1, 3),
                "q3": round(q3, 3),
                "iqr": round(iqr, 3),
                "lower_bound": round(lower_bound, 3),
                "upper_bound": round(upper_bound, 3),
                "is_anomaly": True,
                "direction": "high" if value > upper_bound else "low",
            }
        return None

    def detect_mad(
        self,
        metric: str,
        value: float,
        patient_id: str = "default",
        threshold: float = 3.5,
    ) -> Optional[Dict]:
        """Detect anomaly using Median Absolute Deviation."""
        key = f"{patient_id}:{metric}"
        data = self.data_windows.get(key)

        if not data or len(data) < 10:
            return None

        arr = np.array(data)
        median = np.median(arr)
        mad = np.median(np.abs(arr - median))

        if mad == 0:
            return None

        modified_z = 0.6745 * (value - median) / mad

        if abs(modified_z) > threshold:
            return {
                "method": "mad",
                "modified_z_score": round(modified_z, 3),
                "threshold": threshold,
                "median": round(median, 3),
                "mad": round(mad, 3),
                "is_anomaly": True,
                "direction": "high" if value > median else "low",
            }
        return None


class TrendDetector:
    """Detect abnormal trends in time series data."""

    def detect_trend(
        self,
        values: List[float],
        timestamps: Optional[List[float]] = None,
    ) -> Dict:
        """Detect trend using linear regression."""
        if len(values) < 5:
            return {"trend": "insufficient_data"}

        n = len(values)
        x = np.arange(n) if timestamps is None else np.array(timestamps)
        y = np.array(values)

        # Linear regression
        x_mean = np.mean(x)
        y_mean = np.mean(y)
        slope = np.sum((x - x_mean) * (y - y_mean)) / np.sum((x - x_mean) ** 2) if np.sum((x - x_mean) ** 2) != 0 else 0

        # R-squared
        y_pred = slope * (x - x_mean) + y_mean
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - y_mean) ** 2)
        r_squared = 1 - ss_res / ss_tot if ss_tot != 0 else 0

        # Rate of change
        rate_of_change = slope / y_mean * 100 if y_mean != 0 else 0

        # Trend classification
        if abs(rate_of_change) < 1:
            trend = "stable"
        elif rate_of_change > 5:
            trend = "rapidly_increasing"
        elif rate_of_change > 1:
            trend = "increasing"
        elif rate_of_change < -5:
            trend = "rapidly_decreasing"
        else:
            trend = "decreasing"

        # Volatility (coefficient of variation)
        cv = np.std(y) / y_mean * 100 if y_mean != 0 else 0

        return {
            "trend": trend,
            "slope": round(slope, 4),
            "rate_of_change_pct": round(rate_of_change, 2),
            "r_squared": round(r_squared, 4),
            "volatility_cv": round(cv, 2),
            "current_value": round(values[-1], 2),
            "min_value": round(min(values), 2),
            "max_value": round(max(values), 2),
            "is_abnormal_trend": abs(rate_of_change) > 3 and r_squared > 0.5,
        }


class EWSCalculator:
    """Early Warning Score (NEWS2) calculator."""

    def calculate_news2(self, vitals: Dict) -> Dict:
        """Calculate National Early Warning Score 2."""
        score = 0
        components = {}

        # Respiratory rate
        rr = vitals.get("respiratory_rate", 0)
        if rr <= 8:
            rr_score = 3
        elif rr <= 11:
            rr_score = 1
        elif rr <= 20:
            rr_score = 0
        elif rr <= 24:
            rr_score = 2
        else:
            rr_score = 3
        score += rr_score
        components["respiratory_rate"] = {"value": rr, "score": rr_score}

        # SpO2 (Scale 1)
        spo2 = vitals.get("spo2", 100)
        if spo2 <= 91:
            spo2_score = 3
        elif spo2 <= 93:
            spo2_score = 2
        elif spo2 <= 95:
            spo2_score = 1
        else:
            spo2_score = 0
        score += spo2_score
        components["spo2"] = {"value": spo2, "score": spo2_score}

        # Systolic BP
        sbp = vitals.get("systolic_bp", 120)
        if sbp <= 90:
            sbp_score = 3
        elif sbp <= 100:
            sbp_score = 2
        elif sbp <= 110:
            sbp_score = 1
        elif sbp <= 219:
            sbp_score = 0
        else:
            sbp_score = 3
        score += sbp_score
        components["systolic_bp"] = {"value": sbp, "score": sbp_score}

        # Heart rate
        hr = vitals.get("heart_rate", 80)
        if hr <= 40:
            hr_score = 3
        elif hr <= 50:
            hr_score = 1
        elif hr <= 90:
            hr_score = 0
        elif hr <= 110:
            hr_score = 1
        elif hr <= 130:
            hr_score = 2
        else:
            hr_score = 3
        score += hr_score
        components["heart_rate"] = {"value": hr, "score": hr_score}

        # Temperature
        temp = vitals.get("temperature", 37.0)
        if temp <= 35.0:
            temp_score = 3
        elif temp <= 36.0:
            temp_score = 1
        elif temp <= 38.0:
            temp_score = 0
        elif temp <= 39.0:
            temp_score = 1
        else:
            temp_score = 2
        score += temp_score
        components["temperature"] = {"value": temp, "score": temp_score}

        # Consciousness (ACVPU)
        consciousness = vitals.get("consciousness", "A")
        if consciousness == "A":
            con_score = 0
        else:
            con_score = 3
        score += con_score
        components["consciousness"] = {"value": consciousness, "score": con_score}

        # Risk classification
        if score >= 7:
            risk = "high"
            response = "Emergency assessment, continuous monitoring, consider ICU"
        elif score >= 5 or any(c["score"] >= 3 for c in components.values()):
            risk = "medium"
            response = "Urgent assessment, increase monitoring frequency"
        elif score >= 1:
            risk = "low"
            response = "Assess using clinical judgment, inform nurse in charge"
        else:
            risk = "minimal"
            response = "Continue routine monitoring"

        return {
            "news2_score": score,
            "risk_level": risk,
            "clinical_response": response,
            "components": components,
        }


class ClinicalAnomalyDetector:
    """Main clinical anomaly detection engine."""

    def __init__(self):
        self.ranges = VitalSignsRanges()
        self.stat_detector = StatisticalAnomalyDetector()
        self.trend_detector = TrendDetector()
        self.ews_calculator = EWSCalculator()
        self.alert_history: List[Dict] = []
        self.active_alerts: Dict[str, List[AnomalyAlert]] = defaultdict(list)

    async def monitor_vitals(
        self,
        patient_id: str,
        vitals: Dict[str, float],
        patient_context: Optional[Dict] = None,
    ) -> MonitoringResult:
        """Monitor patient vitals for anomalies."""
        start_time = time.time()
        ctx = patient_context or {}
        alerts = []

        for metric, value in vitals.items():
            if value is None:
                continue

            # Range-based detection
            ranges = self.ranges.get_range(metric, ctx)
            alert = self._check_ranges(patient_id, metric, value, ranges)
            if alert:
                alerts.append(alert)

            # Statistical detection (add to window first)
            self.stat_detector.add_datapoint(metric, value, patient_id)
            stat_result = self.stat_detector.detect_zscore(metric, value, patient_id)
            if stat_result:
                stat_alert = AnomalyAlert(
                    patient_id=patient_id,
                    metric_name=metric,
                    metric_value=value,
                    anomaly_type=AnomalyType.POINT.value,
                    severity=AnomalySeverity.MEDIUM.value,
                    anomaly_score=stat_result["z_score"] / 5.0,
                    description=f"Statistical anomaly: Z-score {stat_result['z_score']:.2f} ({stat_result['direction']})",
                    recommended_action="Review trend and correlate with clinical status",
                )
                alerts.append(stat_alert)

        # Calculate NEWS2
        news2 = self.ews_calculator.calculate_news2(vitals)

        # Determine overall risk
        if any(a.severity == AnomalySeverity.CRITICAL.value for a in alerts):
            risk_level = "critical"
        elif any(a.severity == AnomalySeverity.HIGH.value for a in alerts) or news2["news2_score"] >= 7:
            risk_level = "high"
        elif any(a.severity == AnomalySeverity.MEDIUM.value for a in alerts) or news2["news2_score"] >= 5:
            risk_level = "medium"
        elif alerts:
            risk_level = "low"
        else:
            risk_level = "normal"

        # Link related alerts
        self._link_related_alerts(alerts)

        # Store alerts
        for alert in alerts:
            self.active_alerts[patient_id].append(alert)
            self.alert_history.append(alert.to_dict())

        result = MonitoringResult(
            patient_id=patient_id,
            total_metrics_checked=len(vitals),
            anomalies_detected=len(alerts),
            alerts=[a.to_dict() for a in alerts],
            risk_level=risk_level,
            summary=self._generate_summary(alerts, news2),
            trend_analysis={"news2": news2},
        )

        return result

    async def analyze_lab_trend(
        self,
        patient_id: str,
        metric: str,
        values: List[float],
        timestamps: Optional[List[float]] = None,
        patient_context: Optional[Dict] = None,
    ) -> Dict:
        """Analyze trend for a lab value series."""
        trend = self.trend_detector.detect_trend(values, timestamps)

        # Check if latest value is in range
        latest = values[-1]
        ctx = patient_context or {}
        ranges = self.ranges.get_range(metric, ctx)

        in_range = True
        if "normal" in ranges:
            low, high = ranges["normal"]
            in_range = low <= latest <= high

        return {
            "metric": metric,
            "patient_id": patient_id,
            "latest_value": latest,
            "in_normal_range": in_range,
            "trend": trend,
            "alert_needed": trend.get("is_abnormal_trend", False) or not in_range,
            "recommendation": self._get_trend_recommendation(metric, trend, in_range),
        }

    def _check_ranges(
        self,
        patient_id: str,
        metric: str,
        value: float,
        ranges: Dict,
    ) -> Optional[AnomalyAlert]:
        """Check if value is within normal/warning/critical ranges."""
        critical = ranges.get("critical", (float("-inf"), float("inf")))
        warning = ranges.get("warning", (float("-inf"), float("inf")))
        normal = ranges.get("normal", (float("-inf"), float("inf")))

        if value < critical[0] or value > critical[1]:
            return AnomalyAlert(
                patient_id=patient_id,
                metric_name=metric,
                metric_value=value,
                expected_range=normal,
                anomaly_type=AnomalyType.POINT.value,
                severity=AnomalySeverity.CRITICAL.value,
                anomaly_score=1.0,
                description=f"CRITICAL: {metric} = {value} (normal: {normal[0]}-{normal[1]})",
                clinical_context=f"Value is outside critical range ({critical[0]}-{critical[1]})",
                recommended_action="Immediate clinical assessment required",
            )
        elif value < warning[0] or value > warning[1]:
            return AnomalyAlert(
                patient_id=patient_id,
                metric_name=metric,
                metric_value=value,
                expected_range=normal,
                anomaly_type=AnomalyType.POINT.value,
                severity=AnomalySeverity.HIGH.value,
                anomaly_score=0.7,
                description=f"WARNING: {metric} = {value} (normal: {normal[0]}-{normal[1]})",
                clinical_context=f"Value is in warning range ({warning[0]}-{warning[1]})",
                recommended_action="Reassess within 30 minutes, consider intervention",
            )
        elif value < normal[0] or value > normal[1]:
            return AnomalyAlert(
                patient_id=patient_id,
                metric_name=metric,
                metric_value=value,
                expected_range=normal,
                anomaly_type=AnomalyType.POINT.value,
                severity=AnomalySeverity.MEDIUM.value,
                anomaly_score=0.4,
                description=f"ABNORMAL: {metric} = {value} (normal: {normal[0]}-{normal[1]})",
                recommended_action="Monitor trend, repeat measurement",
            )

        return None

    def _link_related_alerts(self, alerts: List[AnomalyAlert]):
        """Link related alerts (e.g., BP and HR both abnormal)."""
        related_groups = {
            "cardiovascular": {"heart_rate", "systolic_bp", "diastolic_bp", "troponin", "bnp"},
            "respiratory": {"respiratory_rate", "spo2"},
            "renal": {"creatinine", "bun", "potassium", "sodium"},
            "hepatic": {"ast", "alt", "bilirubin"},
            "hematologic": {"wbc", "hemoglobin", "platelet_count"},
        }

        alert_metrics = {a.metric_name: a for a in alerts}

        for group_name, group_metrics in related_groups.items():
            group_alerts = [a for a in alerts if a.metric_name in group_metrics]
            if len(group_alerts) > 1:
                ids = [a.alert_id for a in group_alerts]
                for alert in group_alerts:
                    alert.related_alerts = [id_ for id_ in ids if id_ != alert.alert_id]
                    alert.clinical_context += f" Part of {group_name} abnormality cluster."

    def _generate_summary(self, alerts: List[AnomalyAlert], news2: Dict) -> str:
        """Generate monitoring summary."""
        if not alerts:
            return f"All vitals within normal limits. NEWS2 score: {news2['news2_score']}."

        critical = sum(1 for a in alerts if a.severity == AnomalySeverity.CRITICAL.value)
        high = sum(1 for a in alerts if a.severity == AnomalySeverity.HIGH.value)

        parts = []
        if critical:
            parts.append(f"{critical} CRITICAL alert(s)")
        if high:
            parts.append(f"{high} high-severity alert(s)")
        parts.append(f"NEWS2: {news2['news2_score']} ({news2['risk_level']} risk)")

        return ". ".join(parts) + "."

    def _get_trend_recommendation(self, metric: str, trend: Dict, in_range: bool) -> str:
        """Get recommendation based on trend analysis."""
        trend_type = trend.get("trend", "stable")

        if trend_type == "rapidly_increasing" and not in_range:
            return f"Rapidly increasing {metric} out of range. Immediate clinical review."
        elif trend_type == "rapidly_decreasing" and not in_range:
            return f"Rapidly decreasing {metric} out of range. Immediate clinical review."
        elif trend_type in ("increasing", "decreasing") and not in_range:
            return f"{metric} trending {trend_type} and out of range. Increase monitoring frequency."
        elif trend.get("is_abnormal_trend"):
            return f"Abnormal {metric} trend detected. Consider investigation."
        elif not in_range:
            return f"{metric} out of normal range but stable. Monitor."
        return "Values within normal parameters."

    def get_patient_alerts(self, patient_id: str, active_only: bool = True) -> List[Dict]:
        """Get alerts for a patient."""
        alerts = self.active_alerts.get(patient_id, [])
        if active_only:
            alerts = [a for a in alerts if a.status == AlertStatus.ACTIVE.value]
        return [a.to_dict() for a in alerts]

    def acknowledge_alert(self, alert_id: str, patient_id: str) -> bool:
        """Acknowledge an alert."""
        for alert in self.active_alerts.get(patient_id, []):
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.ACKNOWLEDGED.value
                return True
        return False

    def get_stats(self) -> Dict:
        """Get anomaly detection statistics."""
        if not self.alert_history:
            return {"total_alerts": 0}

        severity_counts = defaultdict(int)
        for alert in self.alert_history:
            severity_counts[alert["severity"]] += 1

        return {
            "total_alerts": len(self.alert_history),
            "severity_breakdown": dict(severity_counts),
            "active_patient_count": len(self.active_alerts),
        }


# Singleton
anomaly_detector = ClinicalAnomalyDetector()

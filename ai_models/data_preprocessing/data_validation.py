"""
Data Validation & Quality - Data pipeline validation, schema enforcement,
drift detection, outlier analysis and data quality scoring.
"""

import logging
import uuid
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple, Set
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class ColumnSchema:
    """Schema definition for a single column."""
    name: str
    dtype: str  # "numeric", "categorical", "binary", "text", "datetime"
    required: bool = True
    nullable: bool = False
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    allowed_values: Optional[List[Any]] = None
    regex_pattern: Optional[str] = None
    description: str = ""


@dataclass 
class DatasetSchema:
    """Schema definition for a complete dataset."""
    name: str
    version: str = "1.0"
    columns: List[ColumnSchema] = field(default_factory=list)
    min_rows: int = 1
    max_rows: Optional[int] = None
    
    def get_column(self, name: str) -> Optional[ColumnSchema]:
        for col in self.columns:
            if col.name == name:
                return col
        return None


@dataclass
class ValidationResult:
    """Result of a data validation check."""
    valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    info: List[str] = field(default_factory=list)
    column_results: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    quality_score: float = 1.0
    checked_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class DriftReport:
    """Data drift detection report."""
    reference_stats: Dict[str, Dict[str, float]] = field(default_factory=dict)
    current_stats: Dict[str, Dict[str, float]] = field(default_factory=dict)
    drift_scores: Dict[str, float] = field(default_factory=dict)
    drifted_features: List[str] = field(default_factory=list)
    drift_detected: bool = False
    severity: str = "none"  # "none", "low", "moderate", "high"
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


# ============================================================================
# Schema Validator
# ============================================================================

class SchemaValidator:
    """Validate data against a defined schema."""
    
    def validate(self, data: np.ndarray, schema: DatasetSchema,
                 column_names: Optional[List[str]] = None) -> ValidationResult:
        """Validate dataset against schema."""
        result = ValidationResult()
        
        if column_names is None:
            column_names = [f"col_{i}" for i in range(data.shape[1])]
        
        # Check row count
        n_rows = data.shape[0]
        if n_rows < schema.min_rows:
            result.errors.append(f"Dataset has {n_rows} rows, minimum required: {schema.min_rows}")
            result.valid = False
        
        if schema.max_rows and n_rows > schema.max_rows:
            result.warnings.append(f"Dataset has {n_rows} rows, exceeds maximum: {schema.max_rows}")
        
        # Check columns
        schema_col_names = {col.name for col in schema.columns}
        data_col_names = set(column_names)
        
        missing_required = []
        for col_schema in schema.columns:
            if col_schema.required and col_schema.name not in data_col_names:
                missing_required.append(col_schema.name)
        
        if missing_required:
            result.errors.append(f"Missing required columns: {missing_required}")
            result.valid = False
        
        extra_columns = data_col_names - schema_col_names
        if extra_columns:
            result.info.append(f"Extra columns not in schema: {list(extra_columns)}")
        
        # Validate each column
        for col_schema in schema.columns:
            if col_schema.name in data_col_names:
                col_idx = column_names.index(col_schema.name)
                col_result = self._validate_column(data[:, col_idx], col_schema)
                result.column_results[col_schema.name] = col_result
                
                if col_result.get("errors"):
                    result.errors.extend(col_result["errors"])
                    result.valid = False
                if col_result.get("warnings"):
                    result.warnings.extend(col_result["warnings"])
        
        # Compute quality score
        total_checks = max(1, len(schema.columns) * 5)
        failed_checks = len(result.errors)
        result.quality_score = max(0, 1 - failed_checks / total_checks)
        
        return result
    
    def _validate_column(self, column: np.ndarray, schema: ColumnSchema) -> Dict[str, Any]:
        """Validate a single column."""
        col_result: Dict[str, Any] = {"errors": [], "warnings": [], "stats": {}}
        
        # Check for nulls/NaN
        try:
            col_float = column.astype(float)
            n_null = int(np.sum(np.isnan(col_float)))
        except (ValueError, TypeError):
            n_null = int(np.sum(column == None))  # noqa
        
        col_result["stats"]["null_count"] = n_null
        col_result["stats"]["null_rate"] = n_null / len(column) if len(column) > 0 else 0
        
        if not schema.nullable and n_null > 0:
            col_result["errors"].append(f"Column '{schema.name}' has {n_null} null values but is not nullable")
        
        if n_null > len(column) * 0.5:
            col_result["warnings"].append(f"Column '{schema.name}' has >50% null values ({n_null}/{len(column)})")
        
        # Type-specific validations
        if schema.dtype == "numeric":
            try:
                values = column.astype(float)
                valid_values = values[~np.isnan(values)]
                
                if len(valid_values) > 0:
                    col_result["stats"]["mean"] = float(np.mean(valid_values))
                    col_result["stats"]["std"] = float(np.std(valid_values))
                    col_result["stats"]["min"] = float(np.min(valid_values))
                    col_result["stats"]["max"] = float(np.max(valid_values))
                    col_result["stats"]["median"] = float(np.median(valid_values))
                    
                    if schema.min_value is not None and np.min(valid_values) < schema.min_value:
                        col_result["errors"].append(
                            f"Column '{schema.name}' has values below minimum {schema.min_value} (min: {np.min(valid_values):.4f})"
                        )
                    
                    if schema.max_value is not None and np.max(valid_values) > schema.max_value:
                        col_result["errors"].append(
                            f"Column '{schema.name}' has values above maximum {schema.max_value} (max: {np.max(valid_values):.4f})"
                        )
            except (ValueError, TypeError):
                col_result["errors"].append(f"Column '{schema.name}' expected numeric but contains non-numeric values")
        
        elif schema.dtype == "categorical":
            unique_values = set(column)
            col_result["stats"]["n_unique"] = len(unique_values)
            
            if schema.allowed_values:
                invalid = unique_values - set(schema.allowed_values)
                if invalid:
                    col_result["errors"].append(
                        f"Column '{schema.name}' has invalid categories: {list(invalid)[:5]}"
                    )
        
        elif schema.dtype == "binary":
            unique_values = set(column)
            non_binary = unique_values - {0, 1, 0.0, 1.0, True, False, '0', '1'}
            if non_binary:
                col_result["errors"].append(
                    f"Column '{schema.name}' expected binary but has values: {list(non_binary)[:5]}"
                )
        
        return col_result


# ============================================================================
# Data Quality Analyzer
# ============================================================================

class DataQualityAnalyzer:
    """Comprehensive data quality analysis."""
    
    def analyze(self, data: np.ndarray, column_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """Run complete data quality analysis."""
        n_rows, n_cols = data.shape
        if column_names is None:
            column_names = [f"col_{i}" for i in range(n_cols)]
        
        report = {
            "shape": {"rows": n_rows, "columns": n_cols},
            "completeness": self._check_completeness(data, column_names),
            "uniqueness": self._check_uniqueness(data, column_names),
            "consistency": self._check_consistency(data, column_names),
            "outliers": self._detect_outliers(data, column_names),
            "correlations": self._compute_correlations(data, column_names),
            "overall_score": 0.0,
        }
        
        # Overall quality score
        scores = [
            report["completeness"]["score"],
            report["uniqueness"]["score"],
            report["consistency"]["score"],
        ]
        report["overall_score"] = float(np.mean(scores))
        
        return report
    
    def _check_completeness(self, data: np.ndarray, columns: List[str]) -> Dict[str, Any]:
        """Check data completeness (missing values)."""
        result = {"per_column": {}, "score": 1.0}
        total_missing = 0
        total_cells = data.size
        
        for i, col in enumerate(columns):
            try:
                col_data = data[:, i].astype(float)
                n_missing = int(np.sum(np.isnan(col_data)))
            except (ValueError, TypeError):
                n_missing = int(np.sum(data[:, i] == None))  # noqa
            
            rate = n_missing / len(data[:, i]) if len(data[:, i]) > 0 else 0
            result["per_column"][col] = {
                "missing": n_missing,
                "missing_rate": float(rate),
                "complete_rate": float(1 - rate),
            }
            total_missing += n_missing
        
        result["total_missing"] = total_missing
        result["total_missing_rate"] = total_missing / total_cells if total_cells > 0 else 0
        result["score"] = max(0, 1 - result["total_missing_rate"] * 2)
        
        return result
    
    def _check_uniqueness(self, data: np.ndarray, columns: List[str]) -> Dict[str, Any]:
        """Check data uniqueness and duplicates."""
        result = {"per_column": {}, "duplicate_rows": 0, "score": 1.0}
        
        for i, col in enumerate(columns):
            n_unique = len(np.unique(data[:, i]))
            n_total = len(data[:, i])
            result["per_column"][col] = {
                "n_unique": n_unique,
                "uniqueness_ratio": float(n_unique / n_total) if n_total > 0 else 0,
                "is_constant": n_unique <= 1,
            }
        
        # Check for duplicate rows
        try:
            _, unique_counts = np.unique(data, axis=0, return_counts=True)
            result["duplicate_rows"] = int(np.sum(unique_counts > 1))
            result["duplicate_rate"] = float(result["duplicate_rows"] / len(data)) if len(data) > 0 else 0
        except (TypeError, ValueError):
            result["duplicate_rows"] = 0
            result["duplicate_rate"] = 0.0
        
        # Penalize constant columns
        constant_cols = sum(1 for c in result["per_column"].values() if c["is_constant"])
        result["score"] = max(0, 1 - constant_cols / max(len(columns), 1) - result.get("duplicate_rate", 0) * 0.5)
        
        return result
    
    def _check_consistency(self, data: np.ndarray, columns: List[str]) -> Dict[str, Any]:
        """Check data consistency (type consistency, value ranges)."""
        result = {"per_column": {}, "score": 1.0}
        inconsistencies = 0
        
        for i, col in enumerate(columns):
            col_result: Dict[str, Any] = {"issues": []}
            
            try:
                values = data[:, i].astype(float)
                valid = values[~np.isnan(values)]
                
                if len(valid) > 10:
                    # Check for extreme outliers
                    q1 = np.percentile(valid, 25)
                    q3 = np.percentile(valid, 75)
                    iqr = q3 - q1
                    extreme_low = valid < (q1 - 3 * iqr)
                    extreme_high = valid > (q3 + 3 * iqr)
                    n_extreme = int(np.sum(extreme_low | extreme_high))
                    
                    if n_extreme > 0:
                        col_result["issues"].append(f"{n_extreme} extreme outliers detected")
                        inconsistencies += 1
                    
                    # Check for suspicious patterns
                    if np.std(valid) < 1e-10 and len(valid) > 10:
                        col_result["issues"].append("Near-zero variance (constant or near-constant)")
                        inconsistencies += 1
                    
                    # Check for negative values in typically positive columns
                    if any(kw in col.lower() for kw in ['count', 'age', 'weight', 'height', 'rate']):
                        n_negative = int(np.sum(valid < 0))
                        if n_negative > 0:
                            col_result["issues"].append(f"{n_negative} negative values in typically positive column")
                            inconsistencies += 1
                
            except (ValueError, TypeError):
                pass
            
            result["per_column"][col] = col_result
        
        result["total_issues"] = inconsistencies
        result["score"] = max(0, 1 - inconsistencies / max(len(columns), 1) * 0.3)
        
        return result
    
    def _detect_outliers(self, data: np.ndarray, columns: List[str]) -> Dict[str, Any]:
        """Detect outliers using IQR and Z-score methods."""
        result = {"per_column": {}}
        
        for i, col in enumerate(columns):
            try:
                values = data[:, i].astype(float)
                valid = values[~np.isnan(values)]
                
                if len(valid) < 10:
                    continue
                
                # IQR method
                q1, q3 = np.percentile(valid, [25, 75])
                iqr = q3 - q1
                iqr_outliers = int(np.sum((valid < q1 - 1.5 * iqr) | (valid > q3 + 1.5 * iqr)))
                
                # Z-score method
                mean = np.mean(valid)
                std = np.std(valid)
                if std > 1e-10:
                    z_scores = np.abs((valid - mean) / std)
                    z_outliers = int(np.sum(z_scores > 3))
                else:
                    z_outliers = 0
                
                result["per_column"][col] = {
                    "iqr_outliers": iqr_outliers,
                    "zscore_outliers": z_outliers,
                    "outlier_rate": float(max(iqr_outliers, z_outliers) / len(valid)),
                }
                
            except (ValueError, TypeError):
                continue
        
        return result
    
    def _compute_correlations(self, data: np.ndarray, columns: List[str]) -> Dict[str, Any]:
        """Compute feature correlations."""
        result = {"high_correlations": [], "correlation_matrix_shape": None}
        
        try:
            # Only for numeric columns
            numeric_data = data.astype(float)
            valid_cols = []
            
            for i in range(numeric_data.shape[1]):
                col = numeric_data[:, i]
                if np.sum(~np.isnan(col)) > 10 and np.std(col[~np.isnan(col)]) > 1e-10:
                    valid_cols.append(i)
            
            if len(valid_cols) >= 2:
                subset = numeric_data[:, valid_cols]
                # Fill NaN with column means
                col_means = np.nanmean(subset, axis=0)
                for j in range(subset.shape[1]):
                    mask = np.isnan(subset[:, j])
                    subset[mask, j] = col_means[j]
                
                corr_matrix = np.corrcoef(subset.T)
                result["correlation_matrix_shape"] = list(corr_matrix.shape)
                
                for i in range(len(valid_cols)):
                    for j in range(i + 1, len(valid_cols)):
                        if abs(corr_matrix[i, j]) > 0.8:
                            result["high_correlations"].append({
                                "feature_1": columns[valid_cols[i]],
                                "feature_2": columns[valid_cols[j]],
                                "correlation": float(corr_matrix[i, j]),
                            })
        
        except (ValueError, TypeError):
            pass
        
        result["high_correlations"] = sorted(
            result["high_correlations"],
            key=lambda x: abs(x["correlation"]),
            reverse=True
        )
        
        return result


# ============================================================================
# Data Drift Detector
# ============================================================================

class DataDriftDetector:
    """Detect data distribution drift between reference and current data."""
    
    def __init__(self, drift_threshold: float = 0.1):
        self.drift_threshold = drift_threshold
        self.reference_stats: Optional[Dict[str, Dict[str, float]]] = None
    
    def fit_reference(self, data: np.ndarray, column_names: Optional[List[str]] = None) -> None:
        """Fit reference distribution statistics."""
        if column_names is None:
            column_names = [f"col_{i}" for i in range(data.shape[1])]
        
        self.reference_stats = {}
        for i, col in enumerate(column_names):
            try:
                values = data[:, i].astype(float)
                valid = values[~np.isnan(values)]
                
                if len(valid) > 0:
                    self.reference_stats[col] = {
                        "mean": float(np.mean(valid)),
                        "std": float(np.std(valid)),
                        "min": float(np.min(valid)),
                        "max": float(np.max(valid)),
                        "median": float(np.median(valid)),
                        "q1": float(np.percentile(valid, 25)),
                        "q3": float(np.percentile(valid, 75)),
                        "n": len(valid),
                    }
            except (ValueError, TypeError):
                continue
    
    def detect(self, data: np.ndarray, column_names: Optional[List[str]] = None) -> DriftReport:
        """Detect drift in current data relative to reference."""
        if self.reference_stats is None:
            raise ValueError("Reference data not fitted. Call fit_reference first.")
        
        if column_names is None:
            column_names = [f"col_{i}" for i in range(data.shape[1])]
        
        report = DriftReport()
        report.reference_stats = dict(self.reference_stats)
        
        for i, col in enumerate(column_names):
            if col not in self.reference_stats:
                continue
            
            try:
                values = data[:, i].astype(float)
                valid = values[~np.isnan(values)]
                
                if len(valid) == 0:
                    continue
                
                ref = self.reference_stats[col]
                
                current_stats = {
                    "mean": float(np.mean(valid)),
                    "std": float(np.std(valid)),
                    "min": float(np.min(valid)),
                    "max": float(np.max(valid)),
                    "median": float(np.median(valid)),
                    "n": len(valid),
                }
                report.current_stats[col] = current_stats
                
                # Population Stability Index (PSI) approximation
                drift_score = self._compute_psi(ref, current_stats)
                report.drift_scores[col] = drift_score
                
                if drift_score > self.drift_threshold:
                    report.drifted_features.append(col)
            
            except (ValueError, TypeError):
                continue
        
        # Overall drift assessment
        if report.drift_scores:
            max_drift = max(report.drift_scores.values())
            avg_drift = np.mean(list(report.drift_scores.values()))
            n_drifted = len(report.drifted_features)
            
            report.drift_detected = n_drifted > 0
            
            if max_drift > 0.25 or n_drifted > len(report.drift_scores) * 0.3:
                report.severity = "high"
            elif max_drift > 0.1 or n_drifted > len(report.drift_scores) * 0.1:
                report.severity = "moderate"
            elif n_drifted > 0:
                report.severity = "low"
            else:
                report.severity = "none"
        
        return report
    
    def _compute_psi(self, ref_stats: Dict[str, float], curr_stats: Dict[str, float]) -> float:
        """Compute approximate Population Stability Index."""
        ref_mean = ref_stats["mean"]
        ref_std = ref_stats.get("std", 1.0)
        curr_mean = curr_stats["mean"]
        curr_std = curr_stats.get("std", 1.0)
        
        if ref_std < 1e-10:
            ref_std = 1.0
        if curr_std < 1e-10:
            curr_std = 1.0
        
        # Standardized mean shift
        mean_shift = abs(curr_mean - ref_mean) / ref_std
        
        # Variance ratio
        var_ratio = abs(np.log(curr_std / ref_std)) if ref_std > 0 else 0
        
        # Combined score
        psi = mean_shift * 0.5 + var_ratio * 0.5
        
        return float(psi)


# ============================================================================
# Medical Data Schema Definitions
# ============================================================================

def create_blood_biomarker_schema() -> DatasetSchema:
    """Create schema for blood biomarker data."""
    return DatasetSchema(
        name="blood_biomarkers",
        version="1.0",
        min_rows=10,
        columns=[
            ColumnSchema("patient_id", "categorical", required=True),
            ColumnSchema("wbc_count", "numeric", min_value=0, max_value=100, description="White Blood Cell Count (10^3/μL)"),
            ColumnSchema("rbc_count", "numeric", min_value=0, max_value=10, description="Red Blood Cell Count (10^6/μL)"),
            ColumnSchema("hemoglobin", "numeric", min_value=0, max_value=25, description="Hemoglobin (g/dL)"),
            ColumnSchema("hematocrit", "numeric", min_value=0, max_value=70, description="Hematocrit (%)"),
            ColumnSchema("platelet_count", "numeric", min_value=0, max_value=1000, description="Platelet Count (10^3/μL)"),
            ColumnSchema("cea", "numeric", min_value=0, max_value=500, nullable=True, description="CEA (ng/mL)"),
            ColumnSchema("ca125", "numeric", min_value=0, max_value=5000, nullable=True, description="CA-125 (U/mL)"),
            ColumnSchema("ca199", "numeric", min_value=0, max_value=5000, nullable=True, description="CA 19-9 (U/mL)"),
            ColumnSchema("psa", "numeric", min_value=0, max_value=200, nullable=True, description="PSA (ng/mL)"),
            ColumnSchema("afp", "numeric", min_value=0, max_value=1000, nullable=True, description="AFP (ng/mL)"),
            ColumnSchema("ldh", "numeric", min_value=0, max_value=2000, description="LDH (U/L)"),
            ColumnSchema("crp", "numeric", min_value=0, max_value=200, description="CRP (mg/L)"),
            ColumnSchema("esr", "numeric", min_value=0, max_value=150, description="ESR (mm/hr)"),
            ColumnSchema("glucose", "numeric", min_value=0, max_value=500, description="Blood Glucose (mg/dL)"),
            ColumnSchema("creatinine", "numeric", min_value=0, max_value=20, description="Creatinine (mg/dL)"),
            ColumnSchema("alt", "numeric", min_value=0, max_value=1000, description="ALT (U/L)"),
            ColumnSchema("ast", "numeric", min_value=0, max_value=1000, description="AST (U/L)"),
            ColumnSchema("albumin", "numeric", min_value=0, max_value=10, description="Albumin (g/dL)"),
            ColumnSchema("bilirubin", "numeric", min_value=0, max_value=30, description="Total Bilirubin (mg/dL)"),
        ],
    )


def create_patient_demographics_schema() -> DatasetSchema:
    """Create schema for patient demographics data."""
    return DatasetSchema(
        name="patient_demographics",
        version="1.0",
        min_rows=10,
        columns=[
            ColumnSchema("patient_id", "categorical", required=True),
            ColumnSchema("age", "numeric", min_value=0, max_value=120),
            ColumnSchema("gender", "categorical", allowed_values=["M", "F", "Other"]),
            ColumnSchema("bmi", "numeric", min_value=10, max_value=80),
            ColumnSchema("smoking_status", "categorical", allowed_values=["never", "former", "current"]),
            ColumnSchema("alcohol_use", "categorical", allowed_values=["none", "moderate", "heavy"]),
            ColumnSchema("family_cancer_history", "binary"),
            ColumnSchema("physical_activity_level", "categorical", allowed_values=["sedentary", "low", "moderate", "high"]),
            ColumnSchema("cancer_type", "categorical", nullable=True, 
                        allowed_values=["breast", "lung", "colorectal", "prostate", "ovarian", "pancreatic", "liver", "skin", "none"]),
            ColumnSchema("cancer_stage", "categorical", nullable=True,
                        allowed_values=["0", "I", "II", "III", "IV", "none"]),
        ],
    )

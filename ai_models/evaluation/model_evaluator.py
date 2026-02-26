"""
Model Evaluation & Reporting - Comprehensive model evaluation framework
with statistical testing, confidence intervals, fairness analysis, 
clinical validation metrics, and automated report generation.
"""

import logging
import json
import uuid
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from pathlib import Path
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class EvaluationResult:
    """Complete evaluation result for a model."""
    model_name: str
    model_version: str
    evaluation_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    dataset_info: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, float] = field(default_factory=dict)
    class_metrics: Dict[str, Dict[str, float]] = field(default_factory=dict)
    confusion_matrix: Optional[List[List[int]]] = None
    confidence_intervals: Dict[str, Tuple[float, float]] = field(default_factory=dict)
    statistical_tests: Dict[str, Any] = field(default_factory=dict)
    fairness_metrics: Dict[str, Any] = field(default_factory=dict)
    calibration_metrics: Dict[str, float] = field(default_factory=dict)
    clinical_metrics: Dict[str, float] = field(default_factory=dict)
    feature_importance: Dict[str, float] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def summary(self) -> str:
        lines = [
            f"=== Evaluation Report: {self.model_name} v{self.model_version} ===",
            f"Evaluation ID: {self.evaluation_id}",
            f"Timestamp: {self.timestamp}",
            f"Duration: {self.duration_seconds:.2f}s",
            "",
            "--- Core Metrics ---",
        ]
        for k, v in self.metrics.items():
            lines.append(f"  {k}: {v:.4f}")
        
        if self.confidence_intervals:
            lines.append("\n--- Confidence Intervals (95%) ---")
            for k, (lo, hi) in self.confidence_intervals.items():
                lines.append(f"  {k}: [{lo:.4f}, {hi:.4f}]")
        
        if self.clinical_metrics:
            lines.append("\n--- Clinical Metrics ---")
            for k, v in self.clinical_metrics.items():
                lines.append(f"  {k}: {v:.4f}")
        
        if self.warnings:
            lines.append(f"\n⚠ Warnings: {len(self.warnings)}")
        if self.errors:
            lines.append(f"\n✗ Errors: {len(self.errors)}")
        
        return "\n".join(lines)


@dataclass
class ComparisonResult:
    """Result of comparing two or more models."""
    models: List[str]
    comparison_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    metric_comparison: Dict[str, Dict[str, float]] = field(default_factory=dict)
    statistical_significance: Dict[str, Any] = field(default_factory=dict)
    winner: Optional[str] = None
    ranking: List[str] = field(default_factory=list)
    recommendation: str = ""


# ============================================================================
# Bootstrap Confidence Intervals
# ============================================================================

class BootstrapCI:
    """Bootstrap-based confidence interval estimation."""
    
    def __init__(self, n_bootstrap: int = 1000, confidence_level: float = 0.95,
                 random_state: int = 42):
        self.n_bootstrap = n_bootstrap
        self.confidence_level = confidence_level
        self.rng = np.random.RandomState(random_state)
    
    def compute(self, y_true: np.ndarray, y_pred: np.ndarray,
                metric_fn: Callable) -> Tuple[float, float, float]:
        """Compute bootstrap CI for a metric.
        
        Returns: (point_estimate, lower_bound, upper_bound)
        """
        n = len(y_true)
        point_estimate = metric_fn(y_true, y_pred)
        bootstrap_scores = []
        
        for _ in range(self.n_bootstrap):
            indices = self.rng.randint(0, n, size=n)
            try:
                score = metric_fn(y_true[indices], y_pred[indices])
                bootstrap_scores.append(score)
            except Exception:
                continue
        
        if len(bootstrap_scores) < 10:
            return point_estimate, point_estimate, point_estimate
        
        alpha = (1 - self.confidence_level) / 2
        lower = float(np.percentile(bootstrap_scores, alpha * 100))
        upper = float(np.percentile(bootstrap_scores, (1 - alpha) * 100))
        
        return point_estimate, lower, upper
    
    def compute_multiple(self, y_true: np.ndarray, y_pred: np.ndarray,
                         metrics: Dict[str, Callable]) -> Dict[str, Tuple[float, float, float]]:
        """Compute CIs for multiple metrics at once (more efficient)."""
        n = len(y_true)
        results = {name: [] for name in metrics}
        point_estimates = {}
        
        for name, fn in metrics.items():
            try:
                point_estimates[name] = fn(y_true, y_pred)
            except Exception:
                point_estimates[name] = 0.0
        
        for _ in range(self.n_bootstrap):
            indices = self.rng.randint(0, n, size=n)
            for name, fn in metrics.items():
                try:
                    results[name].append(fn(y_true[indices], y_pred[indices]))
                except Exception:
                    pass
        
        alpha = (1 - self.confidence_level) / 2
        ci_results = {}
        for name in metrics:
            if len(results[name]) >= 10:
                lower = float(np.percentile(results[name], alpha * 100))
                upper = float(np.percentile(results[name], (1 - alpha) * 100))
            else:
                lower = upper = point_estimates[name]
            ci_results[name] = (point_estimates[name], lower, upper)
        
        return ci_results


# ============================================================================
# Statistical Tests
# ============================================================================

class StatisticalTests:
    """Statistical tests for model comparison."""
    
    @staticmethod
    def mcnemar_test(y_true: np.ndarray, y_pred_a: np.ndarray, 
                     y_pred_b: np.ndarray) -> Dict[str, Any]:
        """McNemar's test for comparing two classifiers."""
        correct_a = (y_true == y_pred_a)
        correct_b = (y_true == y_pred_b)
        
        # Contingency table
        b01 = np.sum(correct_a & ~correct_b)  # A correct, B wrong
        b10 = np.sum(~correct_a & correct_b)  # A wrong, B correct
        
        n = b01 + b10
        if n == 0:
            return {"statistic": 0, "p_value": 1.0, "significant": False}
        
        # McNemar with continuity correction
        statistic = (abs(b01 - b10) - 1) ** 2 / n if n > 0 else 0
        
        # Approximate p-value using chi-squared distribution with 1 df
        # Using simple approximation
        p_value = _chi2_survival(statistic, 1)
        
        return {
            "test": "McNemar",
            "statistic": float(statistic),
            "p_value": float(p_value),
            "b01": int(b01),
            "b10": int(b10),
            "significant": p_value < 0.05,
        }
    
    @staticmethod
    def paired_t_test(scores_a: np.ndarray, scores_b: np.ndarray) -> Dict[str, Any]:
        """Paired t-test for cross-validation score comparison."""
        differences = scores_a - scores_b
        n = len(differences)
        
        if n < 2:
            return {"test": "paired_t", "statistic": 0, "p_value": 1.0, "significant": False}
        
        mean_diff = np.mean(differences)
        std_diff = np.std(differences, ddof=1)
        
        if std_diff < 1e-10:
            return {"test": "paired_t", "statistic": 0, "p_value": 1.0, "significant": False}
        
        t_stat = mean_diff / (std_diff / np.sqrt(n))
        df = n - 1
        
        # Two-tailed p-value approximation
        p_value = 2 * _t_survival(abs(t_stat), df)
        
        return {
            "test": "paired_t",
            "statistic": float(t_stat),
            "p_value": float(p_value),
            "mean_difference": float(mean_diff),
            "std_difference": float(std_diff),
            "degrees_of_freedom": int(df),
            "significant": p_value < 0.05,
        }
    
    @staticmethod
    def wilcoxon_signed_rank(scores_a: np.ndarray, scores_b: np.ndarray) -> Dict[str, Any]:
        """Wilcoxon signed-rank test (non-parametric alternative to paired t-test)."""
        differences = scores_a - scores_b
        
        # Remove zeros
        nonzero = differences != 0
        differences = differences[nonzero]
        n = len(differences)
        
        if n < 5:
            return {"test": "wilcoxon", "statistic": 0, "p_value": 1.0, "significant": False}
        
        # Rank the absolute differences
        abs_diff = np.abs(differences)
        ranks = np.argsort(np.argsort(abs_diff)) + 1  # 1-based ranks
        
        # Signed ranks
        W_plus = np.sum(ranks[differences > 0])
        W_minus = np.sum(ranks[differences < 0])
        W = min(W_plus, W_minus)
        
        # Normal approximation for large n
        mean_W = n * (n + 1) / 4
        std_W = np.sqrt(n * (n + 1) * (2 * n + 1) / 24)
        
        if std_W < 1e-10:
            z = 0
        else:
            z = (W - mean_W) / std_W
        
        p_value = 2 * _normal_survival(abs(z))
        
        return {
            "test": "wilcoxon",
            "statistic": float(W),
            "z_score": float(z),
            "p_value": float(p_value),
            "W_plus": float(W_plus),
            "W_minus": float(W_minus),
            "significant": p_value < 0.05,
        }
    
    @staticmethod
    def friedman_test(*scores_groups: np.ndarray) -> Dict[str, Any]:
        """Friedman test for comparing multiple classifiers."""
        k = len(scores_groups)
        n = len(scores_groups[0])
        
        if k < 3 or n < 5:
            return {"test": "friedman", "statistic": 0, "p_value": 1.0, "significant": False}
        
        # Rank within each fold
        data = np.column_stack(scores_groups)
        ranks = np.zeros_like(data, dtype=float)
        
        for i in range(n):
            ranks[i] = np.argsort(np.argsort(-data[i])) + 1  # Rank (1 = best)
        
        avg_ranks = np.mean(ranks, axis=0)
        
        # Friedman statistic
        chi2_f = (12 * n / (k * (k + 1))) * (np.sum(avg_ranks ** 2) - k * (k + 1) ** 2 / 4)
        
        p_value = _chi2_survival(chi2_f, k - 1)
        
        return {
            "test": "friedman",
            "statistic": float(chi2_f),
            "p_value": float(p_value),
            "average_ranks": {f"model_{i}": float(r) for i, r in enumerate(avg_ranks)},
            "significant": p_value < 0.05,
        }


# ============================================================================
# Clinical Metrics
# ============================================================================

class ClinicalMetrics:
    """Metrics specifically relevant for clinical/medical applications."""
    
    @staticmethod
    def sensitivity_specificity(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Compute sensitivity (recall) and specificity."""
        tp = np.sum((y_true == 1) & (y_pred == 1))
        tn = np.sum((y_true == 0) & (y_pred == 0))
        fp = np.sum((y_true == 0) & (y_pred == 1))
        fn = np.sum((y_true == 1) & (y_pred == 0))
        
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        return {
            "sensitivity": float(sensitivity),
            "specificity": float(specificity),
            "true_positives": int(tp),
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
        }
    
    @staticmethod
    def positive_predictive_value(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """PPV = TP / (TP + FP)"""
        tp = np.sum((y_true == 1) & (y_pred == 1))
        fp = np.sum((y_true == 0) & (y_pred == 1))
        return float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    
    @staticmethod
    def negative_predictive_value(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """NPV = TN / (TN + FN)"""
        tn = np.sum((y_true == 0) & (y_pred == 0))
        fn = np.sum((y_true == 1) & (y_pred == 0))
        return float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0
    
    @staticmethod
    def likelihood_ratios(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Compute positive and negative likelihood ratios."""
        ss = ClinicalMetrics.sensitivity_specificity(y_true, y_pred)
        sens = ss["sensitivity"]
        spec = ss["specificity"]
        
        lr_positive = sens / (1 - spec) if spec < 1 else float('inf')
        lr_negative = (1 - sens) / spec if spec > 0 else float('inf')
        
        return {
            "lr_positive": float(lr_positive),
            "lr_negative": float(lr_negative),
        }
    
    @staticmethod
    def diagnostic_odds_ratio(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """DOR = (TP * TN) / (FP * FN)"""
        ss = ClinicalMetrics.sensitivity_specificity(y_true, y_pred)
        tp, tn, fp, fn = ss["true_positives"], ss["true_negatives"], ss["false_positives"], ss["false_negatives"]
        denom = fp * fn
        return float((tp * tn) / denom) if denom > 0 else float('inf')
    
    @staticmethod
    def number_needed_to_diagnose(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """NND = 1 / (Sensitivity + Specificity - 1) = 1 / Youden's J"""
        ss = ClinicalMetrics.sensitivity_specificity(y_true, y_pred)
        j = ss["sensitivity"] + ss["specificity"] - 1
        return float(1 / j) if j > 0 else float('inf')
    
    @staticmethod
    def youdens_index(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Youden's J statistic = Sensitivity + Specificity - 1"""
        ss = ClinicalMetrics.sensitivity_specificity(y_true, y_pred)
        return float(ss["sensitivity"] + ss["specificity"] - 1)
    
    @staticmethod
    def net_reclassification_improvement(
        y_true: np.ndarray,
        prob_old: np.ndarray,
        prob_new: np.ndarray,
        threshold: float = 0.5
    ) -> Dict[str, float]:
        """Net Reclassification Improvement (NRI) when comparing two models."""
        pred_old = (prob_old >= threshold).astype(int)
        pred_new = (prob_new >= threshold).astype(int)
        
        events = y_true == 1
        non_events = y_true == 0
        
        # For events (cases): upgrade = old predicted 0, new predicted 1
        event_up = np.sum(~pred_old[events].astype(bool) & pred_new[events].astype(bool))
        event_down = np.sum(pred_old[events].astype(bool) & ~pred_new[events].astype(bool))
        
        # For non-events: upgrade = old predicted 1, new predicted 0
        nonevent_up = np.sum(pred_old[non_events].astype(bool) & ~pred_new[non_events].astype(bool))
        nonevent_down = np.sum(~pred_old[non_events].astype(bool) & pred_new[non_events].astype(bool))
        
        n_events = np.sum(events)
        n_nonevents = np.sum(non_events)
        
        nri_events = (event_up - event_down) / n_events if n_events > 0 else 0
        nri_nonevents = (nonevent_up - nonevent_down) / n_nonevents if n_nonevents > 0 else 0
        nri = nri_events + nri_nonevents
        
        return {
            "nri": float(nri),
            "nri_events": float(nri_events),
            "nri_nonevents": float(nri_nonevents),
        }
    
    @staticmethod
    def integrated_discrimination_improvement(
        y_true: np.ndarray,
        prob_old: np.ndarray,
        prob_new: np.ndarray
    ) -> float:
        """Integrated Discrimination Improvement (IDI)."""
        events = y_true == 1
        non_events = y_true == 0
        
        # Discrimination slope = mean predicted probability in events - mean in non-events
        ds_old = np.mean(prob_old[events]) - np.mean(prob_old[non_events])
        ds_new = np.mean(prob_new[events]) - np.mean(prob_new[non_events])
        
        return float(ds_new - ds_old)


# ============================================================================
# Calibration Analysis
# ============================================================================

class CalibrationAnalysis:
    """Model probability calibration assessment."""
    
    @staticmethod
    def calibration_curve(y_true: np.ndarray, y_prob: np.ndarray,
                          n_bins: int = 10) -> Dict[str, Any]:
        """Compute calibration curve (reliability diagram data)."""
        bin_edges = np.linspace(0, 1, n_bins + 1)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        
        mean_predicted = []
        fraction_positive = []
        bin_counts = []
        
        for i in range(n_bins):
            mask = (y_prob >= bin_edges[i]) & (y_prob < bin_edges[i + 1])
            if i == n_bins - 1:
                mask = (y_prob >= bin_edges[i]) & (y_prob <= bin_edges[i + 1])
            
            if np.sum(mask) > 0:
                mean_predicted.append(float(np.mean(y_prob[mask])))
                fraction_positive.append(float(np.mean(y_true[mask])))
                bin_counts.append(int(np.sum(mask)))
            else:
                mean_predicted.append(float(bin_centers[i]))
                fraction_positive.append(0.0)
                bin_counts.append(0)
        
        return {
            "mean_predicted": mean_predicted,
            "fraction_positive": fraction_positive,
            "bin_counts": bin_counts,
            "bin_edges": bin_edges.tolist(),
        }
    
    @staticmethod
    def expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray,
                                    n_bins: int = 10) -> float:
        """Expected Calibration Error (ECE)."""
        cal = CalibrationAnalysis.calibration_curve(y_true, y_prob, n_bins)
        total = sum(cal["bin_counts"])
        
        if total == 0:
            return 0.0
        
        ece = 0.0
        for pred, frac, count in zip(cal["mean_predicted"], cal["fraction_positive"], cal["bin_counts"]):
            ece += (count / total) * abs(frac - pred)
        
        return float(ece)
    
    @staticmethod
    def maximum_calibration_error(y_true: np.ndarray, y_prob: np.ndarray,
                                   n_bins: int = 10) -> float:
        """Maximum Calibration Error (MCE)."""
        cal = CalibrationAnalysis.calibration_curve(y_true, y_prob, n_bins)
        
        mce = 0.0
        for pred, frac, count in zip(cal["mean_predicted"], cal["fraction_positive"], cal["bin_counts"]):
            if count > 0:
                mce = max(mce, abs(frac - pred))
        
        return float(mce)
    
    @staticmethod
    def brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
        """Brier score (mean squared error of probabilistic predictions)."""
        return float(np.mean((y_prob - y_true) ** 2))
    
    @staticmethod
    def brier_skill_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
        """Brier Skill Score relative to climatological baseline."""
        bs = CalibrationAnalysis.brier_score(y_true, y_prob)
        prevalence = np.mean(y_true)
        bs_ref = prevalence * (1 - prevalence)
        return float(1 - bs / bs_ref) if bs_ref > 0 else 0.0


# ============================================================================
# Fairness Analysis
# ============================================================================

class FairnessAnalysis:
    """Algorithmic fairness metrics for bias detection."""
    
    @staticmethod
    def demographic_parity(y_pred: np.ndarray, group_labels: np.ndarray) -> Dict[str, Any]:
        """Measure demographic parity across groups."""
        groups = np.unique(group_labels)
        positive_rates = {}
        
        for g in groups:
            mask = group_labels == g
            positive_rates[str(g)] = float(np.mean(y_pred[mask]))
        
        max_diff = max(positive_rates.values()) - min(positive_rates.values())
        
        return {
            "positive_rates": positive_rates,
            "max_difference": float(max_diff),
            "fair": max_diff < 0.1,  # Common threshold
        }
    
    @staticmethod
    def equalized_odds(y_true: np.ndarray, y_pred: np.ndarray,
                       group_labels: np.ndarray) -> Dict[str, Any]:
        """Measure equalized odds across groups."""
        groups = np.unique(group_labels)
        tpr = {}
        fpr = {}
        
        for g in groups:
            mask = group_labels == g
            pos = y_true[mask] == 1
            neg = y_true[mask] == 0
            
            tpr[str(g)] = float(np.mean(y_pred[mask][pos])) if np.sum(pos) > 0 else 0.0
            fpr[str(g)] = float(np.mean(y_pred[mask][neg])) if np.sum(neg) > 0 else 0.0
        
        tpr_diff = max(tpr.values()) - min(tpr.values()) if tpr else 0
        fpr_diff = max(fpr.values()) - min(fpr.values()) if fpr else 0
        
        return {
            "true_positive_rates": tpr,
            "false_positive_rates": fpr,
            "tpr_difference": float(tpr_diff),
            "fpr_difference": float(fpr_diff),
            "fair": tpr_diff < 0.1 and fpr_diff < 0.1,
        }
    
    @staticmethod
    def predictive_parity(y_true: np.ndarray, y_pred: np.ndarray,
                          group_labels: np.ndarray) -> Dict[str, Any]:
        """Measure predictive parity (equal PPV) across groups."""
        groups = np.unique(group_labels)
        ppvs = {}
        
        for g in groups:
            mask = group_labels == g
            pred_pos = y_pred[mask] == 1
            if np.sum(pred_pos) > 0:
                ppvs[str(g)] = float(np.mean(y_true[mask][pred_pos]))
            else:
                ppvs[str(g)] = 0.0
        
        max_diff = max(ppvs.values()) - min(ppvs.values()) if ppvs else 0
        
        return {
            "positive_predictive_values": ppvs,
            "max_difference": float(max_diff),
            "fair": max_diff < 0.1,
        }
    
    @staticmethod
    def calibration_by_group(y_true: np.ndarray, y_prob: np.ndarray,
                             group_labels: np.ndarray) -> Dict[str, float]:
        """Compute calibration error per group."""
        groups = np.unique(group_labels)
        results = {}
        
        for g in groups:
            mask = group_labels == g
            if np.sum(mask) > 10:
                results[str(g)] = CalibrationAnalysis.expected_calibration_error(
                    y_true[mask], y_prob[mask])
            else:
                results[str(g)] = float('nan')
        
        return results


# ============================================================================
# Model Evaluator
# ============================================================================

class ModelEvaluator:
    """Comprehensive model evaluation engine."""
    
    def __init__(self, n_bootstrap: int = 500, confidence_level: float = 0.95):
        self.bootstrap_ci = BootstrapCI(n_bootstrap, confidence_level)
        self.clinical = ClinicalMetrics()
        self.calibration = CalibrationAnalysis()
        self.fairness = FairnessAnalysis()
        self.stat_tests = StatisticalTests()

    def evaluate(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: Optional[np.ndarray] = None,
        model_name: str = "model",
        model_version: str = "1.0",
        group_labels: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None,
        feature_importances: Optional[np.ndarray] = None,
    ) -> EvaluationResult:
        """Run comprehensive evaluation."""
        import time
        start = time.time()
        
        result = EvaluationResult(
            model_name=model_name,
            model_version=model_version,
            dataset_info={
                "n_samples": len(y_true),
                "n_positive": int(np.sum(y_true == 1)),
                "n_negative": int(np.sum(y_true == 0)),
                "prevalence": float(np.mean(y_true)),
            },
        )
        
        try:
            # Core classification metrics
            result.metrics = self._compute_core_metrics(y_true, y_pred, y_prob)
            
            # Per-class metrics
            result.class_metrics = self._compute_class_metrics(y_true, y_pred)
            
            # Confusion matrix
            classes = np.unique(np.concatenate([y_true, y_pred]))
            n_classes = len(classes)
            cm = np.zeros((n_classes, n_classes), dtype=int)
            for t, p in zip(y_true, y_pred):
                ti = np.searchsorted(classes, t)
                pi = np.searchsorted(classes, p)
                cm[ti][pi] += 1
            result.confusion_matrix = cm.tolist()
            
            # Confidence intervals
            metric_fns = {
                "accuracy": lambda yt, yp: float(np.mean(yt == yp)),
            }
            if y_prob is not None:
                metric_fns["brier_score"] = lambda yt, yp: float(np.mean((yp - yt) ** 2))
            
            ci_results = self.bootstrap_ci.compute_multiple(
                y_true, y_pred if y_prob is None else y_prob, metric_fns
            )
            result.confidence_intervals = {k: (v[1], v[2]) for k, v in ci_results.items()}
            
            # Clinical metrics
            if len(classes) == 2:
                result.clinical_metrics = self._compute_clinical_metrics(y_true, y_pred, y_prob)
            
            # Calibration
            if y_prob is not None:
                result.calibration_metrics = {
                    "brier_score": self.calibration.brier_score(y_true, y_prob),
                    "brier_skill_score": self.calibration.brier_skill_score(y_true, y_prob),
                    "ece": self.calibration.expected_calibration_error(y_true, y_prob),
                    "mce": self.calibration.maximum_calibration_error(y_true, y_prob),
                }
            
            # Fairness
            if group_labels is not None:
                result.fairness_metrics = {
                    "demographic_parity": self.fairness.demographic_parity(y_pred, group_labels),
                    "equalized_odds": self.fairness.equalized_odds(y_true, y_pred, group_labels),
                    "predictive_parity": self.fairness.predictive_parity(y_true, y_pred, group_labels),
                }
                if y_prob is not None:
                    result.fairness_metrics["calibration_by_group"] = (
                        self.fairness.calibration_by_group(y_true, y_prob, group_labels)
                    )
            
            # Feature importance
            if feature_importances is not None and feature_names is not None:
                importance_dict = dict(zip(feature_names, feature_importances.tolist()))
                result.feature_importance = dict(
                    sorted(importance_dict.items(), key=lambda x: abs(x[1]), reverse=True)
                )
        
        except Exception as e:
            result.errors.append(str(e))
            logger.error(f"Evaluation error: {e}")
        
        result.duration_seconds = time.time() - start
        return result

    def compare_models(
        self,
        y_true: np.ndarray,
        predictions: Dict[str, np.ndarray],
        cv_scores: Optional[Dict[str, np.ndarray]] = None,
        primary_metric: str = "accuracy",
    ) -> ComparisonResult:
        """Compare multiple models statistically."""
        model_names = list(predictions.keys())
        result = ComparisonResult(models=model_names)
        
        # Compute metrics for each model
        for name, y_pred in predictions.items():
            acc = float(np.mean(y_true == y_pred))
            result.metric_comparison.setdefault(primary_metric, {})[name] = acc
        
        # Statistical tests
        if len(model_names) == 2:
            n1, n2 = model_names[0], model_names[1]
            result.statistical_significance["mcnemar"] = self.stat_tests.mcnemar_test(
                y_true, predictions[n1], predictions[n2]
            )
            
            if cv_scores and n1 in cv_scores and n2 in cv_scores:
                result.statistical_significance["paired_t"] = self.stat_tests.paired_t_test(
                    cv_scores[n1], cv_scores[n2]
                )
                result.statistical_significance["wilcoxon"] = self.stat_tests.wilcoxon_signed_rank(
                    cv_scores[n1], cv_scores[n2]
                )
        
        elif len(model_names) >= 3 and cv_scores:
            score_arrays = [cv_scores[n] for n in model_names if n in cv_scores]
            if len(score_arrays) >= 3:
                result.statistical_significance["friedman"] = self.stat_tests.friedman_test(*score_arrays)
        
        # Ranking
        primary_scores = result.metric_comparison.get(primary_metric, {})
        result.ranking = sorted(primary_scores, key=lambda x: primary_scores[x], reverse=True)
        result.winner = result.ranking[0] if result.ranking else None
        
        return result

    def _compute_core_metrics(self, y_true, y_pred, y_prob=None) -> Dict[str, float]:
        """Compute core classification metrics."""
        metrics = {
            "accuracy": float(np.mean(y_true == y_pred)),
        }
        
        classes = np.unique(y_true)
        n_classes = len(classes)
        
        # Macro averages
        precisions, recalls, f1s = [], [], []
        for c in classes:
            tp = np.sum((y_true == c) & (y_pred == c))
            fp = np.sum((y_true != c) & (y_pred == c))
            fn = np.sum((y_true == c) & (y_pred != c))
            p = tp / (tp + fp) if (tp + fp) > 0 else 0
            r = tp / (tp + fn) if (tp + fn) > 0 else 0
            f = 2 * p * r / (p + r) if (p + r) > 0 else 0
            precisions.append(p)
            recalls.append(r)
            f1s.append(f)
        
        metrics["precision_macro"] = float(np.mean(precisions))
        metrics["recall_macro"] = float(np.mean(recalls))
        metrics["f1_macro"] = float(np.mean(f1s))
        
        # Cohen's Kappa
        po = metrics["accuracy"]
        pe = sum((np.sum(y_true == c) * np.sum(y_pred == c)) for c in classes) / (len(y_true) ** 2)
        metrics["cohen_kappa"] = float((po - pe) / (1 - pe)) if pe < 1 else 0.0
        
        # Matthews Correlation Coefficient (binary)
        if n_classes == 2:
            tp = np.sum((y_true == 1) & (y_pred == 1))
            tn = np.sum((y_true == 0) & (y_pred == 0))
            fp = np.sum((y_true == 0) & (y_pred == 1))
            fn = np.sum((y_true == 1) & (y_pred == 0))
            denom = np.sqrt((tp+fp)*(tp+fn)*(tn+fp)*(tn+fn))
            metrics["mcc"] = float((tp*tn - fp*fn) / denom) if denom > 0 else 0.0
        
        return metrics

    def _compute_class_metrics(self, y_true, y_pred) -> Dict[str, Dict[str, float]]:
        """Per-class precision, recall, F1."""
        result = {}
        for c in np.unique(y_true):
            tp = np.sum((y_true == c) & (y_pred == c))
            fp = np.sum((y_true != c) & (y_pred == c))
            fn = np.sum((y_true == c) & (y_pred != c))
            p = tp / (tp + fp) if (tp + fp) > 0 else 0
            r = tp / (tp + fn) if (tp + fn) > 0 else 0
            f = 2 * p * r / (p + r) if (p + r) > 0 else 0
            result[str(c)] = {"precision": float(p), "recall": float(r), "f1": float(f), "support": int(np.sum(y_true == c))}
        return result

    def _compute_clinical_metrics(self, y_true, y_pred, y_prob=None) -> Dict[str, float]:
        """Clinical metrics for binary classification."""
        ss = self.clinical.sensitivity_specificity(y_true, y_pred)
        lr = self.clinical.likelihood_ratios(y_true, y_pred)
        
        clinical = {
            "sensitivity": ss["sensitivity"],
            "specificity": ss["specificity"],
            "ppv": self.clinical.positive_predictive_value(y_true, y_pred),
            "npv": self.clinical.negative_predictive_value(y_true, y_pred),
            "lr_positive": lr["lr_positive"],
            "lr_negative": lr["lr_negative"],
            "dor": self.clinical.diagnostic_odds_ratio(y_true, y_pred),
            "nnd": self.clinical.number_needed_to_diagnose(y_true, y_pred),
            "youdens_j": self.clinical.youdens_index(y_true, y_pred),
        }
        
        return clinical

    def save_report(self, result: EvaluationResult, output_dir: str = ".") -> str:
        """Save evaluation report to JSON."""
        path = Path(output_dir) / f"eval_{result.model_name}_{result.evaluation_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w') as f:
            json.dump(result.to_dict(), f, indent=2, default=str)
        
        logger.info(f"Evaluation report saved to {path}")
        return str(path)


# ============================================================================
# Utility Functions (survival functions for p-value calculation)
# ============================================================================

def _normal_survival(x: float) -> float:
    """Approximate normal survival function P(Z > x)."""
    # Abramowitz & Stegun approximation
    t = 1 / (1 + 0.2316419 * abs(x))
    d = 0.3989422804014327  # 1/sqrt(2*pi)
    p = d * np.exp(-x * x / 2) * (
        t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
    )
    return float(p) if x >= 0 else float(1 - p)


def _chi2_survival(x: float, df: int) -> float:
    """Approximate chi-squared survival function."""
    if x <= 0:
        return 1.0
    # Wilson-Hilferty approximation
    z = ((x / df) ** (1/3) - (1 - 2/(9*df))) / np.sqrt(2/(9*df))
    return _normal_survival(z)


def _t_survival(x: float, df: int) -> float:
    """Approximate t-distribution survival function."""
    if df >= 30:
        return _normal_survival(x)
    # Approximation for small df
    z = x * (1 - 1/(4*df)) / np.sqrt(1 + x*x/(2*df))
    return _normal_survival(z)

"""
Visualization Utilities - Generate charts, plots, and visual reports for
model evaluation, training progress, feature analysis, and clinical results.
"""

import logging
import json
import os
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from datetime import datetime

import numpy as np

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


class ChartDataGenerator:
    """Generate chart-ready data structures for frontend visualization."""

    @staticmethod
    def confusion_matrix_data(
        matrix: List[List[int]],
        labels: Optional[List[str]] = None,
    ) -> Dict:
        """Generate confusion matrix visualization data."""
        n = len(matrix)
        if labels is None:
            labels = [f"Class {i}" for i in range(n)]

        total = sum(sum(row) for row in matrix)
        cells = []
        for i in range(n):
            for j in range(n):
                cells.append({
                    "true_label": labels[i],
                    "predicted_label": labels[j],
                    "count": matrix[i][j],
                    "percentage": round(matrix[i][j] / total * 100, 2) if total > 0 else 0,
                    "is_correct": i == j,
                })

        return {
            "chart_type": "heatmap",
            "title": "Confusion Matrix",
            "labels": labels,
            "matrix": matrix,
            "cells": cells,
            "total_samples": total,
        }

    @staticmethod
    def roc_curve_data(
        fpr: List[float],
        tpr: List[float],
        auc_value: float,
        thresholds: Optional[List[float]] = None,
    ) -> Dict:
        """Generate ROC curve visualization data."""
        points = [{"fpr": f, "tpr": t} for f, t in zip(fpr, tpr)]

        # Find optimal threshold (Youden's index)
        j_stats = [t - f for f, t in zip(fpr, tpr)]
        optimal_idx = int(np.argmax(j_stats))

        return {
            "chart_type": "line",
            "title": f"ROC Curve (AUC = {auc_value:.3f})",
            "x_label": "False Positive Rate",
            "y_label": "True Positive Rate",
            "data": points,
            "diagonal": [{"fpr": 0, "tpr": 0}, {"fpr": 1, "tpr": 1}],
            "auc": auc_value,
            "optimal_point": {
                "fpr": fpr[optimal_idx],
                "tpr": tpr[optimal_idx],
                "threshold": thresholds[optimal_idx] if thresholds else None,
                "youden_index": j_stats[optimal_idx],
            },
        }

    @staticmethod
    def precision_recall_data(
        precision: List[float],
        recall: List[float],
        auc_pr: float,
    ) -> Dict:
        """Generate Precision-Recall curve data."""
        points = [{"recall": r, "precision": p} for p, r in zip(precision, recall)]

        return {
            "chart_type": "line",
            "title": f"Precision-Recall Curve (AUC = {auc_pr:.3f})",
            "x_label": "Recall",
            "y_label": "Precision",
            "data": points,
            "auc_pr": auc_pr,
        }

    @staticmethod
    def training_history_data(
        epochs: List[int],
        train_loss: List[float],
        val_loss: Optional[List[float]] = None,
        train_acc: Optional[List[float]] = None,
        val_acc: Optional[List[float]] = None,
        learning_rates: Optional[List[float]] = None,
    ) -> Dict:
        """Generate training history visualization data."""
        loss_data = [{"epoch": e, "train_loss": tl} for e, tl in zip(epochs, train_loss)]
        if val_loss:
            for i, vl in enumerate(val_loss):
                if i < len(loss_data):
                    loss_data[i]["val_loss"] = vl

        acc_data = None
        if train_acc:
            acc_data = [{"epoch": e, "train_accuracy": ta} for e, ta in zip(epochs, train_acc)]
            if val_acc:
                for i, va in enumerate(val_acc):
                    if i < len(acc_data):
                        acc_data[i]["val_accuracy"] = va

        lr_data = None
        if learning_rates:
            lr_data = [{"epoch": e, "learning_rate": lr} for e, lr in zip(epochs, learning_rates)]

        return {
            "chart_type": "multi_line",
            "title": "Training History",
            "loss_chart": {
                "title": "Loss",
                "x_label": "Epoch",
                "y_label": "Loss",
                "data": loss_data,
                "series": ["train_loss"] + (["val_loss"] if val_loss else []),
            },
            "accuracy_chart": {
                "title": "Accuracy",
                "x_label": "Epoch",
                "y_label": "Accuracy",
                "data": acc_data,
                "series": ["train_accuracy"] + (["val_accuracy"] if val_acc else []),
            } if acc_data else None,
            "lr_chart": {
                "title": "Learning Rate",
                "x_label": "Epoch",
                "y_label": "Learning Rate",
                "data": lr_data,
            } if lr_data else None,
        }

    @staticmethod
    def feature_importance_data(
        feature_names: List[str],
        importances: List[float],
        top_n: int = 20,
    ) -> Dict:
        """Generate feature importance chart data."""
        paired = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        top = paired[:top_n]

        return {
            "chart_type": "horizontal_bar",
            "title": f"Top {min(top_n, len(top))} Feature Importance",
            "x_label": "Importance",
            "y_label": "Feature",
            "data": [
                {"feature": name, "importance": round(imp, 4), "rank": i + 1}
                for i, (name, imp) in enumerate(top)
            ],
        }

    @staticmethod
    def class_distribution_data(
        labels: List[str],
        counts: List[int],
        title: str = "Class Distribution",
    ) -> Dict:
        """Generate class distribution chart data."""
        total = sum(counts)
        return {
            "chart_type": "bar",
            "title": title,
            "x_label": "Class",
            "y_label": "Count",
            "data": [
                {
                    "label": label,
                    "count": count,
                    "percentage": round(count / total * 100, 2) if total > 0 else 0,
                }
                for label, count in zip(labels, counts)
            ],
            "total": total,
        }

    @staticmethod
    def calibration_plot_data(
        observed: List[float],
        predicted: List[float],
        counts: List[int],
    ) -> Dict:
        """Generate calibration plot data."""
        return {
            "chart_type": "scatter_line",
            "title": "Calibration Plot",
            "x_label": "Predicted Probability",
            "y_label": "Observed Frequency",
            "data": [
                {
                    "predicted": p,
                    "observed": o,
                    "count": c,
                }
                for p, o, c in zip(predicted, observed, counts)
            ],
            "perfect_calibration": [
                {"predicted": 0, "observed": 0},
                {"predicted": 1, "observed": 1},
            ],
        }

    @staticmethod
    def survival_curve_data(
        time_points: List[float],
        survival_probs: List[float],
        confidence_upper: Optional[List[float]] = None,
        confidence_lower: Optional[List[float]] = None,
        label: str = "Overall",
    ) -> Dict:
        """Generate Kaplan-Meier survival curve data."""
        data = [
            {"time": t, "survival": s}
            for t, s in zip(time_points, survival_probs)
        ]

        if confidence_upper and confidence_lower:
            for i, (u, l) in enumerate(zip(confidence_upper, confidence_lower)):
                if i < len(data):
                    data[i]["upper_ci"] = u
                    data[i]["lower_ci"] = l

        # Median survival
        median = None
        for t, s in zip(time_points, survival_probs):
            if s <= 0.5:
                median = t
                break

        return {
            "chart_type": "step_line",
            "title": "Survival Curve",
            "x_label": "Time (months)",
            "y_label": "Survival Probability",
            "data": data,
            "label": label,
            "median_survival": median,
            "has_confidence_interval": confidence_upper is not None,
        }

    @staticmethod
    def risk_heatmap_data(
        risk_factors: List[str],
        cancer_types: List[str],
        risk_matrix: List[List[float]],
    ) -> Dict:
        """Generate risk factor heatmap data."""
        cells = []
        for i, factor in enumerate(risk_factors):
            for j, cancer in enumerate(cancer_types):
                cells.append({
                    "risk_factor": factor,
                    "cancer_type": cancer,
                    "risk_level": risk_matrix[i][j],
                })

        return {
            "chart_type": "heatmap",
            "title": "Cancer Risk Factor Analysis",
            "x_labels": cancer_types,
            "y_labels": risk_factors,
            "cells": cells,
            "color_scale": "risk",
        }

    @staticmethod
    def radar_chart_data(
        metrics: Dict[str, float],
        title: str = "Model Performance",
        max_value: float = 1.0,
    ) -> Dict:
        """Generate radar/spider chart data."""
        return {
            "chart_type": "radar",
            "title": title,
            "data": [
                {"metric": k, "value": round(v, 4), "max": max_value}
                for k, v in metrics.items()
            ],
        }

    @staticmethod
    def scatter_plot_data(
        x_values: List[float],
        y_values: List[float],
        labels: Optional[List[str]] = None,
        colors: Optional[List[str]] = None,
        x_label: str = "X",
        y_label: str = "Y",
        title: str = "Scatter Plot",
    ) -> Dict:
        """Generate scatter plot data."""
        data = []
        for i, (x, y) in enumerate(zip(x_values, y_values)):
            point = {"x": x, "y": y}
            if labels and i < len(labels):
                point["label"] = labels[i]
            if colors and i < len(colors):
                point["color"] = colors[i]
            data.append(point)

        return {
            "chart_type": "scatter",
            "title": title,
            "x_label": x_label,
            "y_label": y_label,
            "data": data,
        }

    @staticmethod
    def waterfall_chart_data(
        features: List[str],
        contributions: List[float],
        base_value: float = 0.5,
    ) -> Dict:
        """Generate SHAP-style waterfall chart data for model explanations."""
        # Sort by absolute contribution
        paired = sorted(zip(features, contributions), key=lambda x: abs(x[1]), reverse=True)

        cumulative = base_value
        data = [{"feature": "Base Value", "value": base_value, "cumulative": base_value, "direction": "neutral"}]

        for feature, contrib in paired:
            cumulative += contrib
            data.append({
                "feature": feature,
                "value": round(contrib, 4),
                "cumulative": round(cumulative, 4),
                "direction": "positive" if contrib > 0 else "negative",
            })

        data.append({
            "feature": "Prediction",
            "value": round(cumulative, 4),
            "cumulative": round(cumulative, 4),
            "direction": "total",
        })

        return {
            "chart_type": "waterfall",
            "title": "Feature Contributions",
            "data": data,
            "base_value": base_value,
            "prediction": round(cumulative, 4),
        }

    @staticmethod
    def gantt_chart_data(
        treatments: List[Dict],
    ) -> Dict:
        """Generate treatment timeline/Gantt chart data."""
        return {
            "chart_type": "gantt",
            "title": "Treatment Timeline",
            "data": [
                {
                    "treatment": t.get("name", ""),
                    "start_week": t.get("start_week", 0),
                    "end_week": t.get("end_week", 0),
                    "category": t.get("category", "treatment"),
                    "status": t.get("status", "planned"),
                }
                for t in treatments
            ],
        }


class ReportGenerator:
    """Generate comprehensive visual reports."""

    def __init__(self):
        self.chart_gen = ChartDataGenerator()

    def model_evaluation_report(
        self,
        model_name: str,
        metrics: Dict,
        confusion_mat: Optional[List[List[int]]] = None,
        roc_data: Optional[Dict] = None,
        feature_importance: Optional[Dict] = None,
        training_history: Optional[Dict] = None,
        class_labels: Optional[List[str]] = None,
    ) -> Dict:
        """Generate comprehensive model evaluation report."""
        charts = []

        # Performance radar
        radar_metrics = {
            k: v for k, v in metrics.items()
            if isinstance(v, (int, float)) and 0 <= v <= 1
        }
        if radar_metrics:
            charts.append(self.chart_gen.radar_chart_data(radar_metrics, f"{model_name} Performance"))

        # Confusion matrix
        if confusion_mat:
            charts.append(self.chart_gen.confusion_matrix_data(confusion_mat, class_labels))

        # ROC curve
        if roc_data:
            charts.append(self.chart_gen.roc_curve_data(
                roc_data["fpr"], roc_data["tpr"],
                metrics.get("auc_roc", 0),
                roc_data.get("thresholds"),
            ))

        # Feature importance
        if feature_importance:
            names = feature_importance.get("names", [])
            values = feature_importance.get("values", [])
            if names and values:
                charts.append(self.chart_gen.feature_importance_data(names, values))

        # Training history
        if training_history:
            charts.append(self.chart_gen.training_history_data(
                training_history.get("epochs", []),
                training_history.get("train_loss", []),
                training_history.get("val_loss"),
                training_history.get("train_acc"),
                training_history.get("val_acc"),
            ))

        return {
            "report_type": "model_evaluation",
            "model_name": model_name,
            "generated_at": datetime.utcnow().isoformat(),
            "summary_metrics": metrics,
            "charts": charts,
            "recommendations": self._generate_recommendations(metrics),
        }

    def patient_risk_report(
        self,
        patient_id: str,
        risk_scores: Dict[str, float],
        survival_data: Optional[Dict] = None,
        treatment_contributions: Optional[Dict] = None,
        genomic_highlights: Optional[List[Dict]] = None,
    ) -> Dict:
        """Generate patient risk assessment visual report."""
        charts = []

        # Risk radar
        charts.append(self.chart_gen.radar_chart_data(risk_scores, "Risk Profile"))

        # Risk breakdown bar chart
        labels = list(risk_scores.keys())
        values = list(risk_scores.values())
        charts.append(self.chart_gen.class_distribution_data(
            labels, [int(v * 100) for v in values],
            title="Risk Score Breakdown (%)",
        ))

        # Survival curve
        if survival_data:
            charts.append(self.chart_gen.survival_curve_data(
                survival_data.get("time_points", []),
                survival_data.get("survival_probs", []),
                survival_data.get("ci_upper"),
                survival_data.get("ci_lower"),
            ))

        # Treatment contributions (waterfall)
        if treatment_contributions:
            charts.append(self.chart_gen.waterfall_chart_data(
                list(treatment_contributions.keys()),
                list(treatment_contributions.values()),
            ))

        return {
            "report_type": "patient_risk",
            "patient_id": patient_id,
            "generated_at": datetime.utcnow().isoformat(),
            "risk_scores": risk_scores,
            "overall_risk": round(float(np.mean(list(risk_scores.values()))), 4),
            "charts": charts,
            "genomic_highlights": genomic_highlights or [],
        }

    def population_health_report(
        self,
        population_stats: Dict,
        risk_distribution: Dict,
        cancer_type_counts: Dict,
        age_distribution: Dict,
        screening_compliance: Dict,
    ) -> Dict:
        """Generate population health dashboard data."""
        charts = []

        # Risk distribution
        if risk_distribution:
            charts.append(self.chart_gen.class_distribution_data(
                list(risk_distribution.keys()),
                list(risk_distribution.values()),
                title="Risk Distribution",
            ))

        # Cancer type distribution
        if cancer_type_counts:
            charts.append(self.chart_gen.class_distribution_data(
                list(cancer_type_counts.keys()),
                list(cancer_type_counts.values()),
                title="Cancer Type Distribution",
            ))

        # Age distribution
        if age_distribution:
            charts.append(self.chart_gen.class_distribution_data(
                list(age_distribution.keys()),
                list(age_distribution.values()),
                title="Age Distribution",
            ))

        # Screening compliance
        if screening_compliance:
            charts.append(self.chart_gen.radar_chart_data(
                screening_compliance,
                "Screening Compliance Rates",
            ))

        return {
            "report_type": "population_health",
            "generated_at": datetime.utcnow().isoformat(),
            "summary": population_stats,
            "charts": charts,
        }

    def _generate_recommendations(self, metrics: Dict) -> List[str]:
        """Generate model improvement recommendations."""
        recs = []

        accuracy_val = metrics.get("accuracy", 0)
        sens = metrics.get("sensitivity", 0)
        spec = metrics.get("specificity", 0)
        auc = metrics.get("auc_roc", 0)
        brier = metrics.get("brier_score", 1)

        if accuracy_val < 0.85:
            recs.append("Consider feature engineering or more complex models to improve accuracy")
        if sens < 0.90:
            recs.append("Sensitivity is below 90% - adjust classification threshold or use class weighting")
        if spec < 0.85:
            recs.append("Specificity could be improved - review false positive patterns")
        if auc < 0.90:
            recs.append("AUC-ROC below 0.90 - consider ensemble methods or additional features")
        if brier > 0.15:
            recs.append("High Brier score indicates poor calibration - apply Platt scaling or isotonic regression")
        if sens > 0.95 and spec < 0.80:
            recs.append("High sensitivity but low specificity suggests over-prediction of positive class")
        if not recs:
            recs.append("Model performance meets clinical standards - monitor for distribution drift")

        return recs

    def save_report(self, report: Dict, filename: str):
        """Save report to JSON file."""
        output_dir = str(BASE_DIR / "saved_models" / "reports")
        os.makedirs(output_dir, exist_ok=True)
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "w") as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"Report saved: {filepath}")
        return filepath


# Singleton instances
chart_generator = ChartDataGenerator()
report_generator = ReportGenerator()

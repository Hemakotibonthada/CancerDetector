"""
Evaluation Metrics - Comprehensive metrics for classification, regression,
segmentation, survival analysis, and clinical model validation.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
import numpy as np

logger = logging.getLogger(__name__)


# ============================================================================
# Classification Metrics
# ============================================================================

def confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, n_classes: Optional[int] = None) -> np.ndarray:
    """Compute confusion matrix."""
    classes = np.unique(np.concatenate([y_true, y_pred]))
    if n_classes is None:
        n_classes = len(classes)

    cm = np.zeros((n_classes, n_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        t_idx = np.searchsorted(classes, t)
        p_idx = np.searchsorted(classes, p)
        if t_idx < n_classes and p_idx < n_classes:
            cm[t_idx][p_idx] += 1
    return cm


def accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Overall accuracy."""
    return float(np.mean(y_true == y_pred))


def precision_score(y_true: np.ndarray, y_pred: np.ndarray, average: str = "macro") -> float:
    """Precision (positive predictive value)."""
    cm = confusion_matrix(y_true, y_pred)
    n = cm.shape[0]
    precisions = np.zeros(n)
    supports = np.zeros(n)

    for i in range(n):
        tp = cm[i][i]
        fp = np.sum(cm[:, i]) - tp
        precisions[i] = tp / (tp + fp) if (tp + fp) > 0 else 0
        supports[i] = np.sum(cm[i, :])

    if average == "macro":
        return float(np.mean(precisions))
    elif average == "weighted":
        return float(np.average(precisions, weights=supports)) if np.sum(supports) > 0 else 0.0
    elif average == "micro":
        tp_total = np.sum(np.diag(cm))
        fp_total = np.sum(cm) - tp_total
        return float(tp_total / (tp_total + fp_total)) if (tp_total + fp_total) > 0 else 0.0
    return float(np.mean(precisions))


def recall_score(y_true: np.ndarray, y_pred: np.ndarray, average: str = "macro") -> float:
    """Recall (sensitivity, true positive rate)."""
    cm = confusion_matrix(y_true, y_pred)
    n = cm.shape[0]
    recalls = np.zeros(n)
    supports = np.zeros(n)

    for i in range(n):
        tp = cm[i][i]
        fn = np.sum(cm[i, :]) - tp
        recalls[i] = tp / (tp + fn) if (tp + fn) > 0 else 0
        supports[i] = np.sum(cm[i, :])

    if average == "macro":
        return float(np.mean(recalls))
    elif average == "weighted":
        return float(np.average(recalls, weights=supports)) if np.sum(supports) > 0 else 0.0
    elif average == "micro":
        return accuracy(y_true, y_pred)
    return float(np.mean(recalls))


def f1_score(y_true: np.ndarray, y_pred: np.ndarray, average: str = "macro") -> float:
    """F1 score (harmonic mean of precision and recall)."""
    p = precision_score(y_true, y_pred, average)
    r = recall_score(y_true, y_pred, average)
    return float(2 * p * r / (p + r)) if (p + r) > 0 else 0.0


def sensitivity(y_true: np.ndarray, y_pred: np.ndarray, positive_class: int = 1) -> float:
    """Sensitivity (True Positive Rate) for binary classification."""
    mask = y_true == positive_class
    if np.sum(mask) == 0:
        return 0.0
    return float(np.mean(y_pred[mask] == positive_class))


def specificity(y_true: np.ndarray, y_pred: np.ndarray, positive_class: int = 1) -> float:
    """Specificity (True Negative Rate) for binary classification."""
    mask = y_true != positive_class
    if np.sum(mask) == 0:
        return 0.0
    return float(np.mean(y_pred[mask] != positive_class))


def ppv(y_true: np.ndarray, y_pred: np.ndarray, positive_class: int = 1) -> float:
    """Positive Predictive Value."""
    predicted_positive = y_pred == positive_class
    if np.sum(predicted_positive) == 0:
        return 0.0
    return float(np.mean(y_true[predicted_positive] == positive_class))


def npv(y_true: np.ndarray, y_pred: np.ndarray, positive_class: int = 1) -> float:
    """Negative Predictive Value."""
    predicted_negative = y_pred != positive_class
    if np.sum(predicted_negative) == 0:
        return 0.0
    return float(np.mean(y_true[predicted_negative] != positive_class))


def matthews_correlation_coefficient(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Matthews Correlation Coefficient."""
    cm = confusion_matrix(y_true, y_pred)
    if cm.shape[0] != 2:
        return 0.0

    tp, fp, fn, tn = cm[1][1], cm[0][1], cm[1][0], cm[0][0]
    numerator = tp * tn - fp * fn
    denominator = np.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    return float(numerator / denominator) if denominator > 0 else 0.0


def cohen_kappa(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Cohen's Kappa coefficient."""
    cm = confusion_matrix(y_true, y_pred)
    n = np.sum(cm)
    if n == 0:
        return 0.0

    po = np.sum(np.diag(cm)) / n
    pe = np.sum(np.sum(cm, axis=0) * np.sum(cm, axis=1)) / (n * n)
    return float((po - pe) / (1 - pe)) if (1 - pe) > 0 else 0.0


def auc_roc(y_true: np.ndarray, y_score: np.ndarray) -> float:
    """Area Under ROC Curve (binary)."""
    # Simple trapezoidal AUC calculation
    pos_scores = y_score[y_true == 1]
    neg_scores = y_score[y_true == 0]

    if len(pos_scores) == 0 or len(neg_scores) == 0:
        return 0.0

    # Mann-Whitney U statistic
    auc = 0.0
    for ps in pos_scores:
        auc += np.sum(ps > neg_scores) + 0.5 * np.sum(ps == neg_scores)

    return float(auc / (len(pos_scores) * len(neg_scores)))


def roc_curve(y_true: np.ndarray, y_score: np.ndarray, n_thresholds: int = 100) -> Dict:
    """Compute ROC curve points."""
    thresholds = np.linspace(0, 1, n_thresholds)
    fpr_list = []
    tpr_list = []

    for thresh in thresholds:
        y_pred = (y_score >= thresh).astype(int)
        tp = np.sum((y_pred == 1) & (y_true == 1))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        fn = np.sum((y_pred == 0) & (y_true == 1))
        tn = np.sum((y_pred == 0) & (y_true == 0))

        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        tpr_list.append(tpr)
        fpr_list.append(fpr)

    return {
        "fpr": fpr_list,
        "tpr": tpr_list,
        "thresholds": thresholds.tolist(),
    }


def precision_recall_curve(y_true: np.ndarray, y_score: np.ndarray, n_thresholds: int = 100) -> Dict:
    """Compute Precision-Recall curve."""
    thresholds = np.linspace(0, 1, n_thresholds)
    precision_list = []
    recall_list = []

    for thresh in thresholds:
        y_pred = (y_score >= thresh).astype(int)
        tp = np.sum((y_pred == 1) & (y_true == 1))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        fn = np.sum((y_pred == 0) & (y_true == 1))

        p = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0.0

        precision_list.append(p)
        recall_list.append(r)

    return {
        "precision": precision_list,
        "recall": recall_list,
        "thresholds": thresholds.tolist(),
    }


def auc_pr(y_true: np.ndarray, y_score: np.ndarray) -> float:
    """Area Under Precision-Recall Curve."""
    curve = precision_recall_curve(y_true, y_score)
    recalls = curve["recall"]
    precisions = curve["precision"]

    # Trapezoidal integration
    area = 0.0
    for i in range(1, len(recalls)):
        area += abs(recalls[i] - recalls[i - 1]) * (precisions[i] + precisions[i - 1]) / 2
    return float(area)


def log_loss(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-15) -> float:
    """Logarithmic loss (cross-entropy)."""
    y_prob = np.clip(y_prob, eps, 1 - eps)
    if y_prob.ndim == 1:
        return float(-np.mean(y_true * np.log(y_prob) + (1 - y_true) * np.log(1 - y_prob)))
    else:
        n = len(y_true)
        loss = 0
        for i in range(n):
            loss -= np.log(y_prob[i, int(y_true[i])])
        return float(loss / n)


def brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Brier score for probability calibration."""
    return float(np.mean((y_prob - y_true) ** 2))


# ============================================================================
# Regression Metrics
# ============================================================================

def mean_absolute_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))


def mean_squared_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean((y_true - y_pred) ** 2))


def root_mean_squared_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def r_squared(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """R² (coefficient of determination)."""
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    return float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0


def mean_absolute_percentage_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """MAPE (ignoring zeros in y_true)."""
    mask = y_true != 0
    if not np.any(mask):
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def concordance_index(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Harrell's concordance index (C-index) for survival analysis."""
    n = len(y_true)
    concordant = 0
    discordant = 0
    tied = 0

    for i in range(n):
        for j in range(i + 1, n):
            if y_true[i] != y_true[j]:
                if (y_true[i] > y_true[j] and y_pred[i] > y_pred[j]) or \
                   (y_true[i] < y_true[j] and y_pred[i] < y_pred[j]):
                    concordant += 1
                elif y_pred[i] == y_pred[j]:
                    tied += 1
                else:
                    discordant += 1

    total = concordant + discordant + tied
    return float((concordant + 0.5 * tied) / total) if total > 0 else 0.5


# ============================================================================
# Segmentation Metrics
# ============================================================================

def dice_coefficient(y_true: np.ndarray, y_pred: np.ndarray, smooth: float = 1e-7) -> float:
    """Dice similarity coefficient (F1 for segmentation)."""
    intersection = np.sum(y_true * y_pred)
    return float((2.0 * intersection + smooth) / (np.sum(y_true) + np.sum(y_pred) + smooth))


def iou_score(y_true: np.ndarray, y_pred: np.ndarray, smooth: float = 1e-7) -> float:
    """Intersection over Union (Jaccard index)."""
    intersection = np.sum(y_true * y_pred)
    union = np.sum(y_true) + np.sum(y_pred) - intersection
    return float((intersection + smooth) / (union + smooth))


def hausdorff_distance(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Simplified Hausdorff distance between binary masks."""
    true_points = np.argwhere(y_true > 0)
    pred_points = np.argwhere(y_pred > 0)

    if len(true_points) == 0 or len(pred_points) == 0:
        return float("inf")

    # Forward distances (true -> pred)
    forward = np.zeros(len(true_points))
    for i, tp in enumerate(true_points):
        dists = np.sqrt(np.sum((pred_points - tp) ** 2, axis=1))
        forward[i] = np.min(dists)

    # Backward distances (pred -> true)
    backward = np.zeros(len(pred_points))
    for i, pp in enumerate(pred_points):
        dists = np.sqrt(np.sum((true_points - pp) ** 2, axis=1))
        backward[i] = np.min(dists)

    return float(max(np.max(forward), np.max(backward)))


def hausdorff_95(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """95th percentile Hausdorff distance."""
    true_points = np.argwhere(y_true > 0)
    pred_points = np.argwhere(y_pred > 0)

    if len(true_points) == 0 or len(pred_points) == 0:
        return float("inf")

    forward = np.zeros(len(true_points))
    for i, tp in enumerate(true_points):
        dists = np.sqrt(np.sum((pred_points - tp) ** 2, axis=1))
        forward[i] = np.min(dists)

    backward = np.zeros(len(pred_points))
    for i, pp in enumerate(pred_points):
        dists = np.sqrt(np.sum((true_points - pp) ** 2, axis=1))
        backward[i] = np.min(dists)

    all_distances = np.concatenate([forward, backward])
    return float(np.percentile(all_distances, 95))


def volume_similarity(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Volume similarity between segmentation masks."""
    vol_true = np.sum(y_true)
    vol_pred = np.sum(y_pred)
    return float(1 - abs(vol_true - vol_pred) / (vol_true + vol_pred)) if (vol_true + vol_pred) > 0 else 1.0


# ============================================================================
# Clinical Validation Metrics
# ============================================================================

def net_reclassification_improvement(
    y_true: np.ndarray,
    risk_old: np.ndarray,
    risk_new: np.ndarray,
    threshold: float = 0.5,
) -> Dict:
    """Net Reclassification Improvement (NRI)."""
    events = y_true == 1
    non_events = y_true == 0

    old_class = (risk_old >= threshold).astype(int)
    new_class = (risk_new >= threshold).astype(int)

    # Events
    up_events = np.sum((new_class[events] > old_class[events]))
    down_events = np.sum((new_class[events] < old_class[events]))
    nri_events = (up_events - down_events) / np.sum(events) if np.sum(events) > 0 else 0

    # Non-events
    up_non = np.sum((new_class[non_events] > old_class[non_events]))
    down_non = np.sum((new_class[non_events] < old_class[non_events]))
    nri_non = (down_non - up_non) / np.sum(non_events) if np.sum(non_events) > 0 else 0

    return {
        "nri": round(float(nri_events + nri_non), 4),
        "nri_events": round(float(nri_events), 4),
        "nri_non_events": round(float(nri_non), 4),
    }


def integrated_discrimination_improvement(
    y_true: np.ndarray,
    risk_old: np.ndarray,
    risk_new: np.ndarray,
) -> float:
    """Integrated Discrimination Improvement (IDI)."""
    events = y_true == 1
    non_events = y_true == 0

    is_events = np.mean(risk_new[events]) - np.mean(risk_old[events]) if np.sum(events) > 0 else 0
    ip_non = np.mean(risk_new[non_events]) - np.mean(risk_old[non_events]) if np.sum(non_events) > 0 else 0

    return float(is_events - ip_non)


def calibration_metrics(y_true: np.ndarray, y_score: np.ndarray, n_bins: int = 10) -> Dict:
    """Hosmer-Lemeshow calibration assessment."""
    bin_edges = np.linspace(0, 1, n_bins + 1)
    bins = []

    for i in range(n_bins):
        mask = (y_score >= bin_edges[i]) & (y_score < bin_edges[i + 1])
        if i == n_bins - 1:
            mask = (y_score >= bin_edges[i]) & (y_score <= bin_edges[i + 1])

        if np.sum(mask) > 0:
            observed = np.mean(y_true[mask])
            predicted = np.mean(y_score[mask])
            count = int(np.sum(mask))
            bins.append({
                "bin": i + 1,
                "predicted_mean": round(float(predicted), 4),
                "observed_mean": round(float(observed), 4),
                "count": count,
            })

    # Expected Calibration Error
    ece = 0.0
    total = len(y_true)
    for b in bins:
        ece += b["count"] / total * abs(b["observed_mean"] - b["predicted_mean"])

    return {
        "ece": round(float(ece), 4),
        "bins": bins,
        "n_bins": n_bins,
    }


def number_needed_to_examine(sensitivity_val: float, prevalence: float) -> float:
    """Number Needed to Examine (NNE) for screening tests."""
    if sensitivity_val == 0 or prevalence == 0:
        return float("inf")
    return float(1 / (sensitivity_val * prevalence))


def likelihood_ratios(sens: float, spec: float) -> Dict:
    """Positive and Negative likelihood ratios."""
    lr_pos = sens / (1 - spec) if (1 - spec) > 0 else float("inf")
    lr_neg = (1 - sens) / spec if spec > 0 else float("inf")
    return {
        "positive_lr": round(float(lr_pos), 4),
        "negative_lr": round(float(lr_neg), 4),
    }


def diagnostic_odds_ratio(sens: float, spec: float) -> float:
    """Diagnostic Odds Ratio."""
    lr = likelihood_ratios(sens, spec)
    if lr["negative_lr"] == 0:
        return float("inf")
    return float(lr["positive_lr"] / lr["negative_lr"])


# ============================================================================
# Comprehensive Evaluation
# ============================================================================

def evaluate_classification(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
    class_labels: Optional[List[str]] = None,
) -> Dict:
    """Comprehensive classification evaluation."""
    cm = confusion_matrix(y_true, y_pred)
    n_classes = cm.shape[0]

    result = {
        "accuracy": round(accuracy(y_true, y_pred), 4),
        "precision_macro": round(precision_score(y_true, y_pred, "macro"), 4),
        "precision_weighted": round(precision_score(y_true, y_pred, "weighted"), 4),
        "recall_macro": round(recall_score(y_true, y_pred, "macro"), 4),
        "recall_weighted": round(recall_score(y_true, y_pred, "weighted"), 4),
        "f1_macro": round(f1_score(y_true, y_pred, "macro"), 4),
        "f1_weighted": round(f1_score(y_true, y_pred, "weighted"), 4),
        "cohen_kappa": round(cohen_kappa(y_true, y_pred), 4),
        "confusion_matrix": cm.tolist(),
    }

    if n_classes == 2:
        result["sensitivity"] = round(sensitivity(y_true, y_pred), 4)
        result["specificity"] = round(specificity(y_true, y_pred), 4)
        result["ppv"] = round(ppv(y_true, y_pred), 4)
        result["npv"] = round(npv(y_true, y_pred), 4)
        result["mcc"] = round(matthews_correlation_coefficient(y_true, y_pred), 4)

        if y_prob is not None:
            scores = y_prob[:, 1] if y_prob.ndim > 1 else y_prob
            result["auc_roc"] = round(auc_roc(y_true, scores), 4)
            result["auc_pr"] = round(auc_pr(y_true, scores), 4)
            result["brier_score"] = round(brier_score(y_true, scores), 4)
            result["log_loss"] = round(log_loss(y_true, scores), 4)

            lr = likelihood_ratios(result["sensitivity"], result["specificity"])
            result["positive_lr"] = lr["positive_lr"]
            result["negative_lr"] = lr["negative_lr"]
            result["dor"] = round(diagnostic_odds_ratio(result["sensitivity"], result["specificity"]), 4)

    return result


def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    """Comprehensive regression evaluation."""
    return {
        "mae": round(mean_absolute_error(y_true, y_pred), 4),
        "mse": round(mean_squared_error(y_true, y_pred), 4),
        "rmse": round(root_mean_squared_error(y_true, y_pred), 4),
        "r_squared": round(r_squared(y_true, y_pred), 4),
        "mape": round(mean_absolute_percentage_error(y_true, y_pred), 4),
    }


def evaluate_segmentation(y_true: np.ndarray, y_pred: np.ndarray, per_class: bool = True) -> Dict:
    """Comprehensive segmentation evaluation."""
    result = {
        "dice": round(dice_coefficient(y_true, y_pred), 4),
        "iou": round(iou_score(y_true, y_pred), 4),
        "volume_similarity": round(volume_similarity(y_true, y_pred), 4),
    }

    if per_class and y_true.max() > 1:
        classes = np.unique(np.concatenate([y_true.flatten(), y_pred.flatten()]))
        per_class_metrics = {}
        for cls in classes:
            if cls == 0:
                continue
            true_cls = (y_true == cls).astype(int)
            pred_cls = (y_pred == cls).astype(int)
            per_class_metrics[str(int(cls))] = {
                "dice": round(dice_coefficient(true_cls, pred_cls), 4),
                "iou": round(iou_score(true_cls, pred_cls), 4),
            }
        result["per_class"] = per_class_metrics

    return result

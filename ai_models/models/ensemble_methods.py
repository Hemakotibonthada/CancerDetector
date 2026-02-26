"""
Ensemble Methods - Advanced model combination strategies for medical AI.
Implements stacking, blending, bagging, boosted ensembles, and dynamic
weighting for improved prediction reliability.
"""

import logging
import uuid
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Any, Callable, Dict, List, Optional, Tuple
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


# ============================================================================
# Ensemble Configuration
# ============================================================================

@dataclass
class EnsembleConfig:
    """Configuration for an ensemble model."""
    name: str
    strategy: str  # "voting", "stacking", "blending", "weighted", "dynamic"
    n_models: int = 3
    use_probabilities: bool = True
    voting_type: str = "soft"  # "hard" or "soft"
    meta_learner: str = "logistic"  # for stacking
    blend_ratio: float = 0.2  # for blending
    diversity_weight: float = 0.1  # encourage model diversity
    calibrate: bool = True


@dataclass
class ModelSlot:
    """Individual model within an ensemble."""
    model_id: str
    model_name: str
    weight: float = 1.0
    trained: bool = False
    performance: Dict[str, float] = field(default_factory=dict)
    predictions: Optional[np.ndarray] = None
    probabilities: Optional[np.ndarray] = None


@dataclass
class EnsembleResult:
    """Result of an ensemble prediction."""
    ensemble_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    predictions: Optional[np.ndarray] = None
    probabilities: Optional[np.ndarray] = None
    individual_predictions: Dict[str, np.ndarray] = field(default_factory=dict)
    individual_probabilities: Dict[str, np.ndarray] = field(default_factory=dict)
    weights_used: Dict[str, float] = field(default_factory=dict)
    agreement_score: float = 0.0
    confidence_scores: Optional[np.ndarray] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================================================
# Voting Ensemble
# ============================================================================

class VotingEnsemble:
    """Hard and soft voting ensemble."""
    
    def __init__(self, voting_type: str = "soft"):
        self.voting_type = voting_type
    
    def predict(self, model_predictions: Dict[str, np.ndarray],
                model_weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """Make predictions by voting."""
        names = list(model_predictions.keys())
        weights = model_weights or {n: 1.0 for n in names}
        
        if self.voting_type == "hard":
            return self._hard_vote(model_predictions, weights)
        else:
            return self._soft_vote(model_predictions, weights)
    
    def _hard_vote(self, preds: Dict[str, np.ndarray],
                   weights: Dict[str, float]) -> np.ndarray:
        """Hard voting (majority vote)."""
        n_samples = len(next(iter(preds.values())))
        all_classes = set()
        for p in preds.values():
            all_classes.update(np.unique(p))
        classes = sorted(all_classes)
        
        results = np.zeros(n_samples, dtype=int)
        for i in range(n_samples):
            votes = defaultdict(float)
            for name, pred in preds.items():
                votes[pred[i]] += weights.get(name, 1.0)
            results[i] = max(votes, key=votes.get)
        
        return results
    
    def _soft_vote(self, probs: Dict[str, np.ndarray],
                   weights: Dict[str, float]) -> np.ndarray:
        """Soft voting (weighted probability averaging)."""
        # Assume probs are probability arrays (n_samples,) for binary
        # or (n_samples, n_classes) for multiclass
        names = list(probs.keys())
        first = probs[names[0]]
        
        if first.ndim == 1:
            # Binary: average probabilities, threshold at 0.5
            total_weight = sum(weights.get(n, 1.0) for n in names)
            avg_prob = np.zeros_like(first, dtype=float)
            
            for name in names:
                w = weights.get(name, 1.0)
                avg_prob += w * probs[name]
            
            avg_prob /= total_weight
            return (avg_prob >= 0.5).astype(int)
        else:
            # Multiclass
            n_samples, n_classes = first.shape
            total_weight = sum(weights.get(n, 1.0) for n in names)
            avg_prob = np.zeros((n_samples, n_classes), dtype=float)
            
            for name in names:
                w = weights.get(name, 1.0)
                avg_prob += w * probs[name]
            
            avg_prob /= total_weight
            return np.argmax(avg_prob, axis=1)
    
    def predict_proba(self, model_probas: Dict[str, np.ndarray],
                      model_weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """Get weighted average probabilities."""
        names = list(model_probas.keys())
        weights = model_weights or {n: 1.0 for n in names}
        total_weight = sum(weights.get(n, 1.0) for n in names)
        
        first = model_probas[names[0]]
        avg_prob = np.zeros_like(first, dtype=float)
        
        for name in names:
            w = weights.get(name, 1.0)
            avg_prob += w * model_probas[name]
        
        return avg_prob / total_weight


# ============================================================================
# Stacking Ensemble
# ============================================================================

class StackingEnsemble:
    """Two-level stacking with meta-learner."""
    
    def __init__(self, meta_learner_type: str = "logistic"):
        self.meta_learner_type = meta_learner_type
        self.meta_weights: Optional[np.ndarray] = None
        self.meta_bias: float = 0.0
        self.trained = False
    
    def fit_meta(self, model_predictions: Dict[str, np.ndarray],
                 y_true: np.ndarray) -> None:
        """Train meta-learner on base model predictions."""
        # Stack predictions as features
        X_meta = np.column_stack([model_predictions[name] for name in sorted(model_predictions.keys())])
        
        if self.meta_learner_type == "logistic":
            self._fit_logistic(X_meta, y_true)
        elif self.meta_learner_type == "ridge":
            self._fit_ridge(X_meta, y_true)
        elif self.meta_learner_type == "simple_avg":
            n_models = X_meta.shape[1]
            self.meta_weights = np.ones(n_models) / n_models
            self.meta_bias = 0.0
        
        self.trained = True
        logger.info(f"Meta-learner trained with weights: {self.meta_weights}")
    
    def _fit_logistic(self, X: np.ndarray, y: np.ndarray,
                      lr: float = 0.01, n_iter: int = 1000) -> None:
        """Fit logistic regression meta-learner via gradient descent."""
        n_samples, n_features = X.shape
        self.meta_weights = np.zeros(n_features)
        self.meta_bias = 0.0
        
        for _ in range(n_iter):
            z = X @ self.meta_weights + self.meta_bias
            pred = 1 / (1 + np.exp(-np.clip(z, -500, 500)))
            
            error = pred - y
            grad_w = X.T @ error / n_samples
            grad_b = np.mean(error)
            
            self.meta_weights -= lr * grad_w
            self.meta_bias -= lr * grad_b
    
    def _fit_ridge(self, X: np.ndarray, y: np.ndarray, alpha: float = 1.0) -> None:
        """Fit ridge regression meta-learner (closed form)."""
        n_features = X.shape[1]
        # Add intercept
        X_aug = np.column_stack([X, np.ones(X.shape[0])])
        
        # Closed-form solution: (X^T X + alpha I)^-1 X^T y
        reg = alpha * np.eye(n_features + 1)
        reg[-1, -1] = 0  # Don't regularize intercept
        
        try:
            w = np.linalg.solve(X_aug.T @ X_aug + reg, X_aug.T @ y)
            self.meta_weights = w[:-1]
            self.meta_bias = w[-1]
        except np.linalg.LinAlgError:
            self.meta_weights = np.ones(n_features) / n_features
            self.meta_bias = 0.0
    
    def predict(self, model_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Predict using meta-learner."""
        if not self.trained:
            raise ValueError("Meta-learner not trained. Call fit_meta first.")
        
        X_meta = np.column_stack([model_predictions[name] for name in sorted(model_predictions.keys())])
        scores = X_meta @ self.meta_weights + self.meta_bias
        
        if self.meta_learner_type == "logistic":
            probs = 1 / (1 + np.exp(-np.clip(scores, -500, 500)))
            return (probs >= 0.5).astype(int)
        else:
            return (scores >= 0.5).astype(int)
    
    def predict_proba(self, model_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Get probability scores from meta-learner."""
        if not self.trained:
            raise ValueError("Meta-learner not trained.")
        
        X_meta = np.column_stack([model_predictions[name] for name in sorted(model_predictions.keys())])
        scores = X_meta @ self.meta_weights + self.meta_bias
        
        probs = 1 / (1 + np.exp(-np.clip(scores, -500, 500)))
        return probs


# ============================================================================
# Dynamic Weighting Ensemble
# ============================================================================

class DynamicWeightingEnsemble:
    """Dynamically weight models based on recent performance or sample similarity."""
    
    def __init__(self, decay_factor: float = 0.95, min_weight: float = 0.05):
        self.decay_factor = decay_factor
        self.min_weight = min_weight
        self.performance_history: Dict[str, List[float]] = defaultdict(list)
        self.current_weights: Dict[str, float] = {}
    
    def update_performance(self, model_name: str, score: float) -> None:
        """Update performance history for a model."""
        self.performance_history[model_name].append(score)
        self._recompute_weights()
    
    def _recompute_weights(self) -> None:
        """Recompute weights based on exponentially weighted performance."""
        models = list(self.performance_history.keys())
        if not models:
            return
        
        weighted_scores = {}
        for name in models:
            history = self.performance_history[name]
            if not history:
                weighted_scores[name] = 0
                continue
            
            weights = np.array([self.decay_factor ** i for i in range(len(history) - 1, -1, -1)])
            weighted_scores[name] = np.average(history, weights=weights)
        
        total = sum(max(s, self.min_weight) for s in weighted_scores.values())
        self.current_weights = {
            name: max(weighted_scores[name], self.min_weight) / total
            for name in models
        }
    
    def get_weights(self) -> Dict[str, float]:
        """Get current model weights."""
        return dict(self.current_weights)
    
    def predict(self, model_predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Predict with dynamic weights."""
        if not self.current_weights:
            # Equal weights if no history
            n = len(model_predictions)
            self.current_weights = {name: 1.0/n for name in model_predictions}
        
        voting = VotingEnsemble(voting_type="soft")
        return voting.predict(model_predictions, self.current_weights)


# ============================================================================
# Diversity-Aware Ensemble
# ============================================================================

class DiversityAnalyzer:
    """Analyze and maximize diversity among ensemble members."""
    
    @staticmethod
    def disagreement_measure(pred_a: np.ndarray, pred_b: np.ndarray) -> float:
        """Fraction of samples where two models disagree."""
        return float(np.mean(pred_a != pred_b))
    
    @staticmethod
    def correlation_diversity(predictions: Dict[str, np.ndarray]) -> Dict[str, Dict[str, float]]:
        """Pairwise correlation matrix of model predictions."""
        names = sorted(predictions.keys())
        result = {}
        
        for i, n1 in enumerate(names):
            result[n1] = {}
            for j, n2 in enumerate(names):
                if i == j:
                    result[n1][n2] = 1.0
                else:
                    p1 = predictions[n1].astype(float)
                    p2 = predictions[n2].astype(float)
                    
                    if np.std(p1) < 1e-10 or np.std(p2) < 1e-10:
                        result[n1][n2] = 0.0
                    else:
                        result[n1][n2] = float(np.corrcoef(p1, p2)[0, 1])
        
        return result
    
    @staticmethod
    def q_statistic(y_true: np.ndarray, pred_a: np.ndarray, pred_b: np.ndarray) -> float:
        """Yule's Q statistic for measuring dependency between classifiers.
        
        Q = 1 means total agreement, Q = -1 means total disagreement,
        Q = 0 means independence (desired for ensembles).
        """
        n11 = np.sum((pred_a == y_true) & (pred_b == y_true))
        n00 = np.sum((pred_a != y_true) & (pred_b != y_true))
        n10 = np.sum((pred_a == y_true) & (pred_b != y_true))
        n01 = np.sum((pred_a != y_true) & (pred_b == y_true))
        
        denom = n11 * n00 + n10 * n01
        if denom == 0:
            return 0.0
        
        return float((n11 * n00 - n10 * n01) / denom)
    
    @staticmethod
    def double_fault_measure(y_true: np.ndarray, pred_a: np.ndarray, pred_b: np.ndarray) -> float:
        """Double-fault measure: probability both classifiers are wrong."""
        return float(np.mean((pred_a != y_true) & (pred_b != y_true)))
    
    @staticmethod
    def entropy_measure(predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Per-sample entropy across ensemble members. High entropy = high disagreement."""
        n_models = len(predictions)
        preds = np.column_stack([predictions[n] for n in sorted(predictions.keys())])
        
        # For each sample, count votes for each class
        n_samples = preds.shape[0]
        entropies = np.zeros(n_samples)
        
        for i in range(n_samples):
            unique, counts = np.unique(preds[i], return_counts=True)
            probs = counts / n_models
            # Shannon entropy
            entropies[i] = -np.sum(probs * np.log2(probs + 1e-10))
        
        return entropies
    
    @staticmethod
    def select_diverse_subset(
        y_true: np.ndarray,
        all_predictions: Dict[str, np.ndarray],
        all_accuracies: Dict[str, float],
        k: int = 3,
        diversity_weight: float = 0.3
    ) -> List[str]:
        """Select k most diverse and accurate models from a pool.
        
        Uses a greedy approach balancing accuracy and diversity.
        """
        remaining = list(all_predictions.keys())
        selected = []
        
        # Pick best model first
        best = max(remaining, key=lambda n: all_accuracies.get(n, 0))
        selected.append(best)
        remaining.remove(best)
        
        while len(selected) < k and remaining:
            best_score = -1
            best_model = None
            
            for candidate in remaining:
                # Accuracy component
                acc = all_accuracies.get(candidate, 0)
                
                # Diversity component (average disagreement with selected models)
                diversity = np.mean([
                    DiversityAnalyzer.disagreement_measure(
                        all_predictions[candidate], all_predictions[s]
                    )
                    for s in selected
                ])
                
                score = (1 - diversity_weight) * acc + diversity_weight * diversity
                
                if score > best_score:
                    best_score = score
                    best_model = candidate
            
            if best_model:
                selected.append(best_model)
                remaining.remove(best_model)
        
        return selected


# ============================================================================
# Cascade Ensemble
# ============================================================================

class CascadeEnsemble:
    """Cascade ensemble: use simple models first, escalate to complex ones
    only for uncertain predictions."""
    
    def __init__(self, confidence_threshold: float = 0.85):
        self.confidence_threshold = confidence_threshold
        self.model_order: List[str] = []
    
    def set_model_order(self, order: List[str]) -> None:
        """Set the order of models from simple to complex."""
        self.model_order = order
    
    def predict(
        self,
        model_predictions: Dict[str, np.ndarray],
        model_confidences: Dict[str, np.ndarray],
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, int]]:
        """Cascade prediction.
        
        Returns: (predictions, confidences, model_usage_counts)
        """
        if not self.model_order:
            self.model_order = list(model_predictions.keys())
        
        n_samples = len(next(iter(model_predictions.values())))
        final_predictions = np.zeros(n_samples, dtype=int)
        final_confidences = np.zeros(n_samples)
        resolved = np.zeros(n_samples, dtype=bool)
        model_usage = defaultdict(int)
        
        for model_name in self.model_order:
            if model_name not in model_predictions:
                continue
            
            preds = model_predictions[model_name]
            confs = model_confidences[model_name]
            
            # Resolve unresolved samples with high confidence
            for i in range(n_samples):
                if not resolved[i] and confs[i] >= self.confidence_threshold:
                    final_predictions[i] = preds[i]
                    final_confidences[i] = confs[i]
                    resolved[i] = True
                    model_usage[model_name] += 1
        
        # Use last model for any remaining unresolved
        if not all(resolved) and self.model_order:
            last_model = self.model_order[-1]
            if last_model in model_predictions:
                for i in range(n_samples):
                    if not resolved[i]:
                        final_predictions[i] = model_predictions[last_model][i]
                        final_confidences[i] = model_confidences[last_model][i]
                        model_usage[last_model] += 1
        
        return final_predictions, final_confidences, dict(model_usage)


# ============================================================================
# Ensemble Manager
# ============================================================================

class EnsembleManager:
    """High-level ensemble management and orchestration."""
    
    def __init__(self, config: Optional[EnsembleConfig] = None):
        self.config = config or EnsembleConfig(name="default_ensemble", strategy="voting")
        self.voting = VotingEnsemble(voting_type=self.config.voting_type)
        self.stacking = StackingEnsemble(meta_learner_type=self.config.meta_learner)
        self.dynamic = DynamicWeightingEnsemble()
        self.cascade = CascadeEnsemble()
        self.diversity = DiversityAnalyzer()
    
    def predict(
        self,
        model_predictions: Dict[str, np.ndarray],
        model_probabilities: Optional[Dict[str, np.ndarray]] = None,
        weights: Optional[Dict[str, float]] = None,
    ) -> EnsembleResult:
        """Make ensemble prediction based on configured strategy."""
        result = EnsembleResult()
        result.individual_predictions = dict(model_predictions)
        if model_probabilities:
            result.individual_probabilities = dict(model_probabilities)
        
        strategy = self.config.strategy
        
        if strategy == "voting":
            data = model_probabilities if model_probabilities and self.config.voting_type == "soft" else model_predictions
            result.predictions = self.voting.predict(data, weights)
            if model_probabilities:
                result.probabilities = self.voting.predict_proba(model_probabilities, weights)
            result.weights_used = weights or {n: 1.0 for n in model_predictions}
        
        elif strategy == "stacking":
            if not self.stacking.trained:
                logger.warning("Stacking meta-learner not trained, falling back to voting")
                result.predictions = self.voting.predict(model_predictions, weights)
            else:
                data = model_probabilities or model_predictions
                result.predictions = self.stacking.predict(data)
                result.probabilities = self.stacking.predict_proba(data)
        
        elif strategy == "dynamic":
            result.predictions = self.dynamic.predict(
                model_probabilities or model_predictions
            )
            result.weights_used = self.dynamic.get_weights()
        
        elif strategy == "cascade":
            if model_probabilities:
                confidences = {n: np.max(p, axis=1) if p.ndim > 1 else p 
                              for n, p in model_probabilities.items()}
            else:
                confidences = {n: np.ones(len(p)) * 0.5 for n, p in model_predictions.items()}
            
            preds, confs, usage = self.cascade.predict(model_predictions, confidences)
            result.predictions = preds
            result.confidence_scores = confs
            result.metadata["model_usage"] = usage
        
        else:
            # Default to soft voting
            result.predictions = self.voting.predict(
                model_probabilities or model_predictions, weights
            )
        
        # Compute agreement score
        preds_list = list(model_predictions.values())
        if len(preds_list) >= 2:
            agreements = []
            for i in range(len(preds_list)):
                for j in range(i + 1, len(preds_list)):
                    agreements.append(float(np.mean(preds_list[i] == preds_list[j])))
            result.agreement_score = float(np.mean(agreements))
        
        return result
    
    def analyze_diversity(
        self,
        y_true: np.ndarray,
        model_predictions: Dict[str, np.ndarray],
    ) -> Dict[str, Any]:
        """Analyze diversity of ensemble members."""
        names = sorted(model_predictions.keys())
        
        diversity_report = {
            "correlation_matrix": self.diversity.correlation_diversity(model_predictions),
            "pairwise_q_statistics": {},
            "pairwise_double_fault": {},
            "pairwise_disagreement": {},
            "entropy_stats": {},
        }
        
        for i, n1 in enumerate(names):
            for j, n2 in enumerate(names):
                if i < j:
                    key = f"{n1}_vs_{n2}"
                    diversity_report["pairwise_q_statistics"][key] = (
                        self.diversity.q_statistic(y_true, model_predictions[n1], model_predictions[n2])
                    )
                    diversity_report["pairwise_double_fault"][key] = (
                        self.diversity.double_fault_measure(y_true, model_predictions[n1], model_predictions[n2])
                    )
                    diversity_report["pairwise_disagreement"][key] = (
                        self.diversity.disagreement_measure(model_predictions[n1], model_predictions[n2])
                    )
        
        entropies = self.diversity.entropy_measure(model_predictions)
        diversity_report["entropy_stats"] = {
            "mean": float(np.mean(entropies)),
            "std": float(np.std(entropies)),
            "max": float(np.max(entropies)),
            "high_disagreement_ratio": float(np.mean(entropies > 0.5)),
        }
        
        return diversity_report

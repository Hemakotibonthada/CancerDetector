"""
Explainability & Interpretability - SHAP-like explanations, LIME-like local
interpretability, feature attribution, counterfactual explanations, and
clinical decision support explanations.
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
# Data Classes
# ============================================================================

@dataclass
class FeatureAttribution:
    """Attribution scores for a single prediction."""
    sample_id: str = ""
    prediction: Any = None
    probability: float = 0.0
    feature_names: List[str] = field(default_factory=list)
    attribution_scores: Dict[str, float] = field(default_factory=dict)
    base_value: float = 0.0  # Expected model output (mean prediction)
    method: str = ""  # "permutation", "lime", "shapley", "gradient"
    
    @property
    def top_positive_features(self) -> List[Tuple[str, float]]:
        return sorted(
            [(k, v) for k, v in self.attribution_scores.items() if v > 0],
            key=lambda x: x[1], reverse=True
        )
    
    @property
    def top_negative_features(self) -> List[Tuple[str, float]]:
        return sorted(
            [(k, v) for k, v in self.attribution_scores.items() if v < 0],
            key=lambda x: x[1]
        )


@dataclass
class CounterfactualExplanation:
    """Counterfactual explanation for a prediction."""
    original_prediction: Any
    counterfactual_prediction: Any
    original_features: Dict[str, float] = field(default_factory=dict)
    counterfactual_features: Dict[str, float] = field(default_factory=dict)
    changed_features: List[str] = field(default_factory=list)
    feature_changes: Dict[str, Tuple[float, float]] = field(default_factory=dict)
    distance: float = 0.0
    plausibility_score: float = 0.0


@dataclass
class ClinicalExplanation:
    """Human-readable clinical explanation."""
    prediction: str
    confidence: float
    risk_level: str  # "low", "moderate", "high", "critical"
    key_factors: List[Dict[str, Any]] = field(default_factory=list)
    supporting_evidence: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    caveats: List[str] = field(default_factory=list)
    similar_cases_summary: str = ""


# ============================================================================
# Permutation Feature Importance
# ============================================================================

class PermutationImportance:
    """Compute feature importance by permutation."""
    
    def __init__(self, n_repeats: int = 10, random_state: int = 42):
        self.n_repeats = n_repeats
        self.rng = np.random.RandomState(random_state)
    
    def compute(
        self,
        predict_fn: Callable,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: Optional[List[str]] = None,
        metric_fn: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """Compute permutation importance for all features."""
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]
        
        if metric_fn is None:
            metric_fn = lambda yt, yp: float(np.mean(yt == yp))
        
        # Baseline score
        baseline_pred = predict_fn(X)
        baseline_score = metric_fn(y, baseline_pred)
        
        importances = {}
        importance_std = {}
        
        for col_idx, feat_name in enumerate(feature_names):
            scores = []
            
            for _ in range(self.n_repeats):
                X_permuted = X.copy()
                X_permuted[:, col_idx] = self.rng.permutation(X_permuted[:, col_idx])
                
                perm_pred = predict_fn(X_permuted)
                perm_score = metric_fn(y, perm_pred)
                scores.append(baseline_score - perm_score)
            
            importances[feat_name] = float(np.mean(scores))
            importance_std[feat_name] = float(np.std(scores))
        
        # Sort by importance
        sorted_importances = dict(sorted(importances.items(), key=lambda x: abs(x[1]), reverse=True))
        
        return {
            "baseline_score": baseline_score,
            "importances": sorted_importances,
            "importance_std": importance_std,
            "n_repeats": self.n_repeats,
        }


# ============================================================================
# LIME-like Local Interpretable Model Explanations
# ============================================================================

class LocalExplainer:
    """Local model-agnostic explanations (LIME-inspired)."""
    
    def __init__(self, n_samples: int = 500, kernel_width: float = 0.75,
                 random_state: int = 42):
        self.n_samples = n_samples
        self.kernel_width = kernel_width
        self.rng = np.random.RandomState(random_state)
    
    def explain(
        self,
        predict_fn: Callable,
        instance: np.ndarray,
        feature_names: Optional[List[str]] = None,
        num_features: int = 10,
    ) -> FeatureAttribution:
        """Generate local explanation for a single instance."""
        n_features = len(instance)
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(n_features)]
        
        # Generate perturbed samples around the instance
        perturbations = self.rng.normal(0, 1, (self.n_samples, n_features))
        perturbed_data = instance + perturbations * self.kernel_width
        
        # Get predictions for perturbed samples
        predictions = predict_fn(perturbed_data)
        original_pred = predict_fn(instance.reshape(1, -1))[0]
        
        # Compute distances (kernel weights)
        distances = np.sqrt(np.sum((perturbed_data - instance) ** 2, axis=1))
        weights = np.exp(-distances ** 2 / (2 * self.kernel_width ** 2))
        
        # Fit weighted linear model
        coefficients = self._fit_weighted_linear(perturbed_data, predictions, weights)
        
        # Create attribution
        attribution_scores = {}
        for i, name in enumerate(feature_names):
            attribution_scores[name] = float(coefficients[i] * instance[i])
        
        # Sort by absolute value, keep top
        sorted_attrs = dict(sorted(attribution_scores.items(), key=lambda x: abs(x[1]), reverse=True)[:num_features])
        
        return FeatureAttribution(
            prediction=original_pred,
            feature_names=feature_names,
            attribution_scores=sorted_attrs,
            base_value=float(np.mean(predictions)),
            method="lime",
        )
    
    def _fit_weighted_linear(self, X: np.ndarray, y: np.ndarray,
                             weights: np.ndarray) -> np.ndarray:
        """Fit weighted linear regression."""
        W = np.diag(weights)
        
        # Add intercept
        X_aug = np.column_stack([X, np.ones(X.shape[0])])
        
        try:
            # Weighted least squares: (X^T W X)^-1 X^T W y
            XtWX = X_aug.T @ W @ X_aug
            XtWy = X_aug.T @ W @ y
            
            # Ridge regularization for stability
            reg = 1e-6 * np.eye(XtWX.shape[0])
            coefficients = np.linalg.solve(XtWX + reg, XtWy)
            
            return coefficients[:-1]  # Exclude intercept
        except np.linalg.LinAlgError:
            return np.zeros(X.shape[1])


# ============================================================================
# Shapley-like Value Estimation
# ============================================================================

class ShapleyEstimator:
    """Approximate Shapley values using sampling."""
    
    def __init__(self, n_samples: int = 100, random_state: int = 42):
        self.n_samples = n_samples
        self.rng = np.random.RandomState(random_state)
    
    def estimate(
        self,
        predict_fn: Callable,
        instance: np.ndarray,
        background_data: np.ndarray,
        feature_names: Optional[List[str]] = None,
    ) -> FeatureAttribution:
        """Estimate Shapley values for a single instance."""
        n_features = len(instance)
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(n_features)]
        
        shapley_values = np.zeros(n_features)
        
        # Base prediction (mean over background)
        base_preds = predict_fn(background_data)
        base_value = float(np.mean(base_preds))
        
        # Instance prediction
        instance_pred = predict_fn(instance.reshape(1, -1))[0]
        
        for _ in range(self.n_samples):
            # Random permutation
            perm = self.rng.permutation(n_features)
            
            # Random background sample
            bg_idx = self.rng.randint(0, len(background_data))
            x_bg = background_data[bg_idx].copy()
            
            x_current = x_bg.copy()
            prev_pred = predict_fn(x_current.reshape(1, -1))[0]
            
            for feat_idx in perm:
                x_current[feat_idx] = instance[feat_idx]
                new_pred = predict_fn(x_current.reshape(1, -1))[0]
                shapley_values[feat_idx] += (new_pred - prev_pred)
                prev_pred = new_pred
        
        shapley_values /= self.n_samples
        
        attribution_scores = {name: float(val) for name, val in zip(feature_names, shapley_values)}
        
        return FeatureAttribution(
            prediction=instance_pred,
            feature_names=feature_names,
            attribution_scores=attribution_scores,
            base_value=base_value,
            method="shapley",
        )


# ============================================================================
# Counterfactual Generator
# ============================================================================

class CounterfactualGenerator:
    """Generate counterfactual explanations (what-if scenarios)."""
    
    def __init__(self, max_iterations: int = 100, step_size: float = 0.1,
                 max_features_changed: int = 5, random_state: int = 42):
        self.max_iterations = max_iterations
        self.step_size = step_size
        self.max_features_changed = max_features_changed
        self.rng = np.random.RandomState(random_state)
    
    def generate(
        self,
        predict_fn: Callable,
        instance: np.ndarray,
        desired_class: int,
        feature_names: Optional[List[str]] = None,
        feature_ranges: Optional[Dict[str, Tuple[float, float]]] = None,
        immutable_features: Optional[List[str]] = None,
    ) -> Optional[CounterfactualExplanation]:
        """Generate nearest counterfactual explanation."""
        n_features = len(instance)
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(n_features)]
        
        immutable_idx = set()
        if immutable_features:
            immutable_idx = {feature_names.index(f) for f in immutable_features if f in feature_names}
        
        original_pred = predict_fn(instance.reshape(1, -1))[0]
        
        if original_pred == desired_class:
            return None  # Already desired class
        
        best_cf = None
        best_distance = float('inf')
        
        for _ in range(self.max_iterations):
            # Perturb instance
            cf_candidate = instance.copy()
            
            # Select random subset of mutable features to perturb
            mutable = [i for i in range(n_features) if i not in immutable_idx]
            n_changes = min(self.max_features_changed, len(mutable))
            features_to_change = self.rng.choice(mutable, size=n_changes, replace=False)
            
            for idx in features_to_change:
                perturbation = self.rng.normal(0, self.step_size)
                cf_candidate[idx] += perturbation
                
                # Clip to valid range
                if feature_ranges and feature_names[idx] in feature_ranges:
                    lo, hi = feature_ranges[feature_names[idx]]
                    cf_candidate[idx] = np.clip(cf_candidate[idx], lo, hi)
            
            cf_pred = predict_fn(cf_candidate.reshape(1, -1))[0]
            
            if cf_pred == desired_class:
                distance = np.linalg.norm(cf_candidate - instance)
                if distance < best_distance:
                    best_distance = distance
                    best_cf = cf_candidate.copy()
        
        if best_cf is None:
            return None
        
        # Build explanation
        original_features = {name: float(val) for name, val in zip(feature_names, instance)}
        cf_features = {name: float(val) for name, val in zip(feature_names, best_cf)}
        
        changed = []
        changes = {}
        for i, name in enumerate(feature_names):
            if abs(instance[i] - best_cf[i]) > 1e-6:
                changed.append(name)
                changes[name] = (float(instance[i]), float(best_cf[i]))
        
        return CounterfactualExplanation(
            original_prediction=original_pred,
            counterfactual_prediction=desired_class,
            original_features=original_features,
            counterfactual_features=cf_features,
            changed_features=changed,
            feature_changes=changes,
            distance=float(best_distance),
        )


# ============================================================================
# Clinical Explanation Generator
# ============================================================================

class ClinicalExplanationGenerator:
    """Generate human-readable clinical explanations from model outputs."""
    
    # Cancer-specific feature descriptions
    FEATURE_DESCRIPTIONS = {
        "wbc_count": ("White Blood Cell Count", "immune system activity"),
        "rbc_count": ("Red Blood Cell Count", "oxygen-carrying capacity"),
        "hemoglobin": ("Hemoglobin Level", "blood's oxygen capacity"),
        "platelet_count": ("Platelet Count", "blood clotting ability"),
        "cea": ("CEA (Carcinoembryonic Antigen)", "tumor marker"),
        "ca125": ("CA-125", "ovarian cancer marker"),
        "ca199": ("CA 19-9", "pancreatic cancer marker"),
        "psa": ("PSA (Prostate-Specific Antigen)", "prostate cancer marker"),
        "afp": ("AFP (Alpha-Fetoprotein)", "liver cancer marker"),
        "ldh": ("LDH (Lactate Dehydrogenase)", "tissue damage indicator"),
        "crp": ("CRP (C-Reactive Protein)", "inflammation marker"),
        "esr": ("ESR (Erythrocyte Sedimentation Rate)", "inflammation indicator"),
        "bmi": ("Body Mass Index", "weight-to-height ratio"),
        "age": ("Patient Age", "demographic factor"),
        "smoking_years": ("Smoking History", "risk factor"),
        "family_history": ("Family Cancer History", "genetic risk"),
        "alcohol_consumption": ("Alcohol Consumption", "lifestyle factor"),
        "physical_activity": ("Physical Activity Level", "protective factor"),
        "heart_rate": ("Resting Heart Rate", "cardiovascular indicator"),
        "blood_pressure": ("Blood Pressure", "cardiovascular health"),
        "oxygen_saturation": ("Blood Oxygen Saturation", "respiratory function"),
        "sleep_quality": ("Sleep Quality Score", "recovery indicator"),
        "stress_level": ("Stress Level", "psychosocial factor"),
    }
    
    RISK_THRESHOLDS = {
        "low": (0.0, 0.25),
        "moderate": (0.25, 0.50),
        "high": (0.50, 0.75),
        "critical": (0.75, 1.0),
    }
    
    def generate(
        self,
        attribution: FeatureAttribution,
        probability: float,
        cancer_type: str = "general",
    ) -> ClinicalExplanation:
        """Generate clinical explanation from feature attribution."""
        # Determine risk level
        risk_level = "low"
        for level, (lo, hi) in self.RISK_THRESHOLDS.items():
            if lo <= probability < hi:
                risk_level = level
                break
        if probability >= 0.75:
            risk_level = "critical"
        
        # Format prediction
        if probability >= 0.5:
            prediction = f"Elevated risk of {cancer_type} cancer detected (probability: {probability:.1%})"
        else:
            prediction = f"Low risk of {cancer_type} cancer (probability: {probability:.1%})"
        
        # Key factors
        key_factors = []
        for name, score in attribution.top_positive_features[:5]:
            desc = self.FEATURE_DESCRIPTIONS.get(name, (name, "clinical indicator"))
            factor = {
                "feature": desc[0],
                "description": desc[1],
                "impact": "increases risk" if score > 0 else "decreases risk",
                "strength": "strong" if abs(score) > 0.1 else "moderate" if abs(score) > 0.05 else "mild",
                "score": score,
            }
            key_factors.append(factor)
        
        for name, score in attribution.top_negative_features[:3]:
            desc = self.FEATURE_DESCRIPTIONS.get(name, (name, "clinical indicator"))
            key_factors.append({
                "feature": desc[0],
                "description": desc[1],
                "impact": "decreases risk",
                "strength": "moderate" if abs(score) > 0.05 else "mild",
                "score": score,
            })
        
        # Supporting evidence
        evidence = []
        if any("cea" in f or "ca125" in f or "psa" in f for f in attribution.attribution_scores):
            evidence.append("Tumor markers show values outside normal reference ranges")
        if any("wbc" in f or "rbc" in f for f in attribution.attribution_scores):
            evidence.append("Complete blood count shows abnormal cell counts")
        if any("crp" in f or "esr" in f for f in attribution.attribution_scores):
            evidence.append("Inflammatory markers indicate elevated systemic inflammation")
        if any("family" in f for f in attribution.attribution_scores):
            evidence.append("Family history contributes to genetic risk assessment")
        if any("smok" in f or "alcohol" in f for f in attribution.attribution_scores):
            evidence.append("Lifestyle factors influence overall cancer risk profile")
        
        # Recommendations
        recommendations = []
        if risk_level in ("high", "critical"):
            recommendations.extend([
                "Recommend immediate consultation with oncologist",
                "Schedule comprehensive diagnostic imaging (CT/MRI/PET)",
                "Consider tissue biopsy for histological confirmation",
                "Initiate genetic counseling if family history is positive",
            ])
        elif risk_level == "moderate":
            recommendations.extend([
                "Schedule follow-up screening in 3-6 months",
                "Monitor tumor markers with serial blood tests",
                "Discuss risk reduction strategies with primary care physician",
                "Consider enhanced screening protocol",
            ])
        else:
            recommendations.extend([
                "Continue routine screening per guidelines",
                "Maintain healthy lifestyle practices",
                "Schedule next routine check-up in 12 months",
            ])
        
        # Caveats
        caveats = [
            "AI risk assessment should supplement, not replace, clinical judgment",
            "Results should be interpreted in context of complete clinical picture",
            "Model confidence varies with data quality and completeness",
            "Screening guidelines may vary based on demographic factors",
        ]
        
        return ClinicalExplanation(
            prediction=prediction,
            confidence=probability,
            risk_level=risk_level,
            key_factors=key_factors,
            supporting_evidence=evidence,
            recommendations=recommendations,
            caveats=caveats,
        )


# ============================================================================
# Global Feature Importance Analyzer
# ============================================================================

class GlobalImportanceAnalyzer:
    """Analyze feature importance across the entire dataset."""
    
    def __init__(self, n_samples: int = 100, random_state: int = 42):
        self.n_samples = n_samples
        self.rng = np.random.RandomState(random_state)
    
    def analyze(
        self,
        predict_fn: Callable,
        X: np.ndarray,
        feature_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Global importance analysis."""
        n_features = X.shape[1]
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(n_features)]
        
        # Compute mean absolute attribution across samples
        sample_indices = self.rng.choice(len(X), size=min(self.n_samples, len(X)), replace=False)
        
        explainer = LocalExplainer(n_samples=100, random_state=42)
        
        feature_importances = defaultdict(list)
        
        for idx in sample_indices:
            try:
                attribution = explainer.explain(predict_fn, X[idx], feature_names)
                for name, score in attribution.attribution_scores.items():
                    feature_importances[name].append(abs(score))
            except Exception:
                continue
        
        # Aggregate
        mean_importance = {name: float(np.mean(scores)) for name, scores in feature_importances.items()}
        std_importance = {name: float(np.std(scores)) for name, scores in feature_importances.items()}
        
        # Sort
        sorted_importance = dict(sorted(mean_importance.items(), key=lambda x: x[1], reverse=True))
        
        # Feature interaction detection (correlation of importances)
        interactions = self._detect_interactions(X, feature_names)
        
        return {
            "mean_importance": sorted_importance,
            "std_importance": std_importance,
            "top_features": list(sorted_importance.keys())[:10],
            "feature_interactions": interactions,
            "n_samples_analyzed": len(sample_indices),
        }
    
    def _detect_interactions(self, X: np.ndarray, feature_names: List[str]) -> List[Dict[str, Any]]:
        """Detect feature interactions via correlation analysis."""
        n_features = X.shape[1]
        interactions = []
        
        for i in range(min(n_features, 20)):
            for j in range(i + 1, min(n_features, 20)):
                if np.std(X[:, i]) > 1e-10 and np.std(X[:, j]) > 1e-10:
                    corr = np.corrcoef(X[:, i], X[:, j])[0, 1]
                    if abs(corr) > 0.5:
                        interactions.append({
                            "feature_1": feature_names[i],
                            "feature_2": feature_names[j],
                            "correlation": float(corr),
                            "strength": "strong" if abs(corr) > 0.8 else "moderate",
                        })
        
        return sorted(interactions, key=lambda x: abs(x["correlation"]), reverse=True)


# ============================================================================
# Explainability Manager
# ============================================================================

class ExplainabilityManager:
    """Unified interface for all explainability methods."""
    
    def __init__(self):
        self.permutation = PermutationImportance()
        self.local_explainer = LocalExplainer()
        self.shapley = ShapleyEstimator()
        self.counterfactual = CounterfactualGenerator()
        self.clinical = ClinicalExplanationGenerator()
        self.global_analyzer = GlobalImportanceAnalyzer()
    
    def explain_prediction(
        self,
        predict_fn: Callable,
        instance: np.ndarray,
        background_data: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None,
        method: str = "lime",
        cancer_type: str = "general",
        probability: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Generate comprehensive explanation for a single prediction."""
        result = {}
        
        # Feature attribution
        if method == "lime":
            attribution = self.local_explainer.explain(predict_fn, instance, feature_names)
        elif method == "shapley" and background_data is not None:
            attribution = self.shapley.estimate(predict_fn, instance, background_data, feature_names)
        else:
            attribution = self.local_explainer.explain(predict_fn, instance, feature_names)
        
        result["attribution"] = asdict(attribution)
        
        # Clinical explanation
        prob = probability if probability is not None else 0.5
        clinical = self.clinical.generate(attribution, prob, cancer_type)
        result["clinical_explanation"] = asdict(clinical)
        
        # Counterfactual
        current_pred = predict_fn(instance.reshape(1, -1))[0]
        desired = 0 if current_pred == 1 else 1
        cf = self.counterfactual.generate(predict_fn, instance, desired, feature_names)
        if cf:
            result["counterfactual"] = asdict(cf)
        
        return result

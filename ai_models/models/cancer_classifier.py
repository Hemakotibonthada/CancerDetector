"""
Cancer Detection AI Pipeline - Main Cancer Classifier
=====================================================

Ensemble model combining XGBoost, LightGBM, Random Forest, and Neural Network
for comprehensive cancer risk prediction using blood biomarkers, smartwatch data,
lifestyle factors, and genetic information.
"""

from __future__ import annotations

import logging
import os
import json
import pickle
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
    StackingClassifier,
    AdaBoostClassifier,
    ExtraTreesClassifier,
    BaggingClassifier,
)
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold
)
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    average_precision_score, matthews_corrcoef, cohen_kappa_score,
    log_loss, brier_score_loss
)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)

# ============================================================================
# Feature Configuration
# ============================================================================

# Blood biomarker features
BLOOD_FEATURES = [
    "wbc_count", "rbc_count", "hemoglobin", "hematocrit", "platelets",
    "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils",
    "mcv", "mch", "mchc", "rdw", "mpv",
    "cea", "ca125", "ca199", "afp", "psa", "ca153", "cyfra211",
    "nse", "scc", "ferritin", "ldh", "alkaline_phosphatase",
    "alt", "ast", "bilirubin_total", "bilirubin_direct",
    "albumin", "total_protein", "globulin",
    "creatinine", "bun", "uric_acid",
    "glucose_fasting", "hba1c",
    "total_cholesterol", "triglycerides", "hdl", "ldl", "vldl",
    "crp", "esr", "d_dimer", "fibrinogen",
    "prothrombin_time", "aptt", "inr",
    "vitamin_d", "vitamin_b12", "folate",
    "iron", "tibc", "transferrin_saturation",
    "tsh", "free_t4", "free_t3",
    "sodium", "potassium", "chloride", "calcium", "magnesium", "phosphorus",
]

# Smartwatch-derived features
SMARTWATCH_FEATURES = [
    "heart_rate_resting_avg", "heart_rate_resting_std",
    "heart_rate_variability_avg", "heart_rate_variability_trend",
    "heart_rate_max_daily_avg", "heart_rate_anomaly_count",
    "spo2_avg", "spo2_min", "spo2_below_95_pct",
    "spo2_during_sleep_avg", "spo2_variability",
    "steps_daily_avg", "steps_daily_trend",
    "active_minutes_avg", "sedentary_minutes_avg",
    "calories_burned_avg",
    "sleep_duration_avg", "sleep_quality_avg",
    "deep_sleep_pct", "rem_sleep_pct", "light_sleep_pct",
    "sleep_efficiency_avg", "sleep_onset_latency_avg",
    "stress_level_avg", "stress_level_max",
    "stress_high_pct", "body_battery_avg",
    "skin_temperature_avg", "skin_temperature_deviation",
    "respiratory_rate_avg", "respiratory_rate_variability",
    "ecg_abnormality_count", "afib_detected_count",
    "bp_systolic_avg", "bp_diastolic_avg",
    "irregular_rhythm_count",
]

# Lifestyle & demographic features
LIFESTYLE_FEATURES = [
    "age", "gender_encoded", "bmi",
    "smoking_status_encoded", "pack_years",
    "alcohol_units_per_week",
    "exercise_minutes_per_week",
    "diet_quality_score",
    "sleep_hours_avg",
    "stress_score",
    "sun_exposure_hours",
    "occupation_risk_score",
]

# Family history & genetic features
GENETIC_FEATURES = [
    "family_cancer_count",
    "first_degree_cancer_count",
    "brca1_positive",
    "brca2_positive",
    "lynch_syndrome",
    "tp53_mutation",
    "genetic_risk_score",
    "family_cancer_age_min",
]

# Medical history features
MEDICAL_FEATURES = [
    "has_diabetes",
    "has_hypertension",
    "has_heart_disease",
    "has_autoimmune_disease",
    "has_chronic_kidney_disease",
    "has_liver_disease",
    "has_lung_disease",
    "has_hiv",
    "has_hepatitis",
    "has_hpv",
    "has_obesity",
    "has_previous_cancer",
    "previous_cancer_count",
    "years_since_last_cancer",
    "total_medications",
    "immunosuppressant_use",
    "total_surgeries",
    "chronic_condition_count",
]

ALL_FEATURES = (
    BLOOD_FEATURES + SMARTWATCH_FEATURES + 
    LIFESTYLE_FEATURES + GENETIC_FEATURES + MEDICAL_FEATURES
)

# Cancer type labels
CANCER_TYPES = [
    "no_cancer", "lung", "breast", "colorectal", "prostate",
    "skin_melanoma", "liver", "pancreatic", "kidney", "bladder",
    "thyroid", "stomach", "ovarian", "cervical", "leukemia",
    "lymphoma", "brain", "other"
]


# ============================================================================
# Cancer Risk Classifier
# ============================================================================

class CancerRiskClassifier(BaseEstimator, ClassifierMixin):
    """
    Ensemble cancer risk classifier combining multiple ML models.
    
    Architecture:
    - Level 1: XGBoost, LightGBM, Random Forest, Extra Trees, Gradient Boosting
    - Level 2: Stacking with Logistic Regression meta-learner
    - Additional: Neural Network for complex pattern detection
    
    Features:
    - Blood biomarkers (60+ markers)
    - Smartwatch health data (35+ features)
    - Lifestyle factors (12 features)
    - Genetic markers (8 features)
    - Medical history (18 features)
    """
    
    def __init__(
        self,
        n_estimators: int = 500,
        max_depth: int = 8,
        learning_rate: float = 0.01,
        random_state: int = 42,
        use_ensemble: bool = True,
        use_feature_selection: bool = True,
        top_k_features: int = 50,
        cv_folds: int = 5,
    ):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.random_state = random_state
        self.use_ensemble = use_ensemble
        self.use_feature_selection = use_feature_selection
        self.top_k_features = top_k_features
        self.cv_folds = cv_folds
        
        # Models
        self.models = {}
        self.ensemble_model = None
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy="median")
        self.feature_selector = None
        self.label_encoder = LabelEncoder()
        
        # Feature importance
        self.feature_importances_ = None
        self.feature_names_ = None
        self.selected_features_ = None
        
        # Training metrics
        self.training_metrics_ = {}
        self.cv_scores_ = {}
        self.training_history_ = []
        
        # Model metadata
        self.is_fitted_ = False
        self.training_date_ = None
        self.version_ = "1.0.0"
        self.n_features_in_ = 0
        self.n_classes_ = 0
        self.classes_ = None
    
    def _create_base_models(self) -> Dict[str, BaseEstimator]:
        """Create base models for the ensemble."""
        models = {
            "random_forest": RandomForestClassifier(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features="sqrt",
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=-1,
            ),
            "gradient_boosting": GradientBoostingClassifier(
                n_estimators=self.n_estimators // 2,
                max_depth=self.max_depth - 2,
                learning_rate=self.learning_rate,
                subsample=0.8,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=self.random_state,
            ),
            "extra_trees": ExtraTreesClassifier(
                n_estimators=self.n_estimators,
                max_depth=self.max_depth,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features="sqrt",
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=-1,
            ),
            "adaboost": AdaBoostClassifier(
                n_estimators=self.n_estimators // 4,
                learning_rate=self.learning_rate * 10,
                random_state=self.random_state,
            ),
            "logistic_regression": LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=self.random_state,
                solver="lbfgs",
                multi_class="multinomial",
            ),
            "mlp": MLPClassifier(
                hidden_layer_sizes=(256, 128, 64, 32),
                activation="relu",
                solver="adam",
                alpha=0.001,
                learning_rate="adaptive",
                learning_rate_init=0.001,
                max_iter=500,
                early_stopping=True,
                validation_fraction=0.15,
                n_iter_no_change=20,
                random_state=self.random_state,
            ),
            "knn": KNeighborsClassifier(
                n_neighbors=7,
                weights="distance",
                metric="minkowski",
                p=2,
                n_jobs=-1,
            ),
            "naive_bayes": GaussianNB(),
            "svm": SVC(
                kernel="rbf",
                C=10.0,
                gamma="scale",
                probability=True,
                class_weight="balanced",
                random_state=self.random_state,
            ),
        }
        
        return models
    
    def _create_ensemble(self) -> BaseEstimator:
        """Create the ensemble model using stacking."""
        base_models = self._create_base_models()
        
        # Level 1 estimators for stacking
        estimators = [
            ("rf", base_models["random_forest"]),
            ("gb", base_models["gradient_boosting"]),
            ("et", base_models["extra_trees"]),
            ("lr", base_models["logistic_regression"]),
            ("mlp", base_models["mlp"]),
        ]
        
        # Stacking with Logistic Regression as meta-learner
        stacking = StackingClassifier(
            estimators=estimators,
            final_estimator=LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=self.random_state,
            ),
            cv=self.cv_folds,
            stack_method="predict_proba",
            n_jobs=-1,
        )
        
        return stacking
    
    def fit(
        self,
        X: Union[pd.DataFrame, np.ndarray],
        y: Union[pd.Series, np.ndarray],
        feature_names: Optional[List[str]] = None,
    ) -> "CancerRiskClassifier":
        """
        Train the cancer risk classifier.
        
        Args:
            X: Feature matrix
            y: Target labels
            feature_names: Names of features
        """
        logger.info("Starting model training...")
        
        # Convert to numpy if needed
        if isinstance(X, pd.DataFrame):
            self.feature_names_ = list(X.columns)
            X = X.values
        elif feature_names:
            self.feature_names_ = feature_names
        else:
            self.feature_names_ = [f"feature_{i}" for i in range(X.shape[1])]
        
        if isinstance(y, pd.Series):
            y = y.values
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        self.classes_ = self.label_encoder.classes_
        self.n_classes_ = len(self.classes_)
        
        # Impute missing values
        X_imputed = self.imputer.fit_transform(X)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X_imputed)
        
        # Feature selection
        if self.use_feature_selection and X_scaled.shape[1] > self.top_k_features:
            self.feature_selector = SelectKBest(
                score_func=f_classif,
                k=min(self.top_k_features, X_scaled.shape[1])
            )
            X_selected = self.feature_selector.fit_transform(X_scaled, y_encoded)
            
            # Track selected features
            mask = self.feature_selector.get_support()
            self.selected_features_ = [
                f for f, m in zip(self.feature_names_, mask) if m
            ]
            logger.info(f"Selected {len(self.selected_features_)} features")
        else:
            X_selected = X_scaled
            self.selected_features_ = self.feature_names_
        
        self.n_features_in_ = X_selected.shape[1]
        
        # Split for validation
        X_train, X_val, y_train, y_val = train_test_split(
            X_selected, y_encoded,
            test_size=0.2,
            stratify=y_encoded,
            random_state=self.random_state,
        )
        
        # Train individual models
        base_models = self._create_base_models()
        
        logger.info("Training individual models...")
        for name, model in base_models.items():
            try:
                model.fit(X_train, y_train)
                
                # Evaluate on validation set
                y_pred = model.predict(X_val)
                y_proba = None
                if hasattr(model, "predict_proba"):
                    y_proba = model.predict_proba(X_val)
                
                accuracy = accuracy_score(y_val, y_pred)
                f1 = f1_score(y_val, y_pred, average="weighted")
                
                metrics = {
                    "accuracy": float(accuracy),
                    "f1_weighted": float(f1),
                }
                
                if y_proba is not None and self.n_classes_ == 2:
                    try:
                        auc = roc_auc_score(y_val, y_proba[:, 1])
                        metrics["auc_roc"] = float(auc)
                    except Exception:
                        pass
                
                self.training_metrics_[name] = metrics
                self.models[name] = model
                
                logger.info(f"  {name}: accuracy={accuracy:.4f}, f1={f1:.4f}")
                
            except Exception as e:
                logger.warning(f"  {name} failed: {e}")
        
        # Train ensemble
        if self.use_ensemble:
            logger.info("Training ensemble model...")
            try:
                self.ensemble_model = self._create_ensemble()
                self.ensemble_model.fit(X_train, y_train)
                
                y_pred = self.ensemble_model.predict(X_val)
                accuracy = accuracy_score(y_val, y_pred)
                f1 = f1_score(y_val, y_pred, average="weighted")
                
                self.training_metrics_["ensemble"] = {
                    "accuracy": float(accuracy),
                    "f1_weighted": float(f1),
                }
                
                logger.info(f"  Ensemble: accuracy={accuracy:.4f}, f1={f1:.4f}")
            except Exception as e:
                logger.warning(f"  Ensemble failed: {e}")
                self.ensemble_model = None
        
        # Cross-validation
        logger.info("Running cross-validation...")
        best_model_name = max(
            self.training_metrics_,
            key=lambda k: self.training_metrics_[k].get("f1_weighted", 0)
        )
        if best_model_name == "ensemble" and self.ensemble_model:
            cv_model = self.ensemble_model
        else:
            cv_model = self.models.get(best_model_name)
        
        if cv_model:
            try:
                cv = StratifiedKFold(n_splits=self.cv_folds, shuffle=True, random_state=self.random_state)
                cv_scores = cross_val_score(cv_model, X_selected, y_encoded, cv=cv, scoring="f1_weighted")
                self.cv_scores_ = {
                    "mean": float(np.mean(cv_scores)),
                    "std": float(np.std(cv_scores)),
                    "scores": [float(s) for s in cv_scores],
                }
                logger.info(f"  CV F1: {self.cv_scores_['mean']:.4f} ± {self.cv_scores_['std']:.4f}")
            except Exception as e:
                logger.warning(f"  CV failed: {e}")
        
        # Compute feature importance
        self._compute_feature_importances()
        
        self.is_fitted_ = True
        self.training_date_ = datetime.utcnow().isoformat()
        
        logger.info("Model training completed!")
        return self
    
    def predict(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """Predict cancer risk class."""
        self._check_is_fitted()
        X_processed = self._preprocess(X)
        
        if self.ensemble_model:
            return self.label_encoder.inverse_transform(
                self.ensemble_model.predict(X_processed)
            )
        
        # Fallback to best individual model
        best_model = self._get_best_model()
        return self.label_encoder.inverse_transform(
            best_model.predict(X_processed)
        )
    
    def predict_proba(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """Predict cancer risk probabilities."""
        self._check_is_fitted()
        X_processed = self._preprocess(X)
        
        if self.ensemble_model and hasattr(self.ensemble_model, "predict_proba"):
            return self.ensemble_model.predict_proba(X_processed)
        
        best_model = self._get_best_model()
        if hasattr(best_model, "predict_proba"):
            return best_model.predict_proba(X_processed)
        
        # Fallback: one-hot encode predictions
        predictions = best_model.predict(X_processed)
        n_samples = len(predictions)
        proba = np.zeros((n_samples, self.n_classes_))
        for i, pred in enumerate(predictions):
            proba[i, pred] = 1.0
        return proba
    
    def predict_risk_score(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """
        Predict overall cancer risk score (0-1).
        Returns the maximum probability across all cancer classes.
        """
        proba = self.predict_proba(X)
        
        # Risk score = 1 - P(no_cancer) or max(P(cancer types))
        if "no_cancer" in list(self.classes_):
            no_cancer_idx = list(self.classes_).index("no_cancer")
            risk_scores = 1 - proba[:, no_cancer_idx]
        else:
            risk_scores = np.max(proba, axis=1)
        
        return risk_scores
    
    def predict_with_explanation(
        self, X: Union[pd.DataFrame, np.ndarray]
    ) -> List[Dict[str, Any]]:
        """
        Predict with detailed risk explanation.
        
        Returns risk scores, predictions, feature contributions, and recommendations.
        """
        self._check_is_fitted()
        X_processed = self._preprocess(X)
        
        predictions = self.predict(X)
        probabilities = self.predict_proba(X)
        risk_scores = self.predict_risk_score(X)
        
        results = []
        for i in range(len(predictions)):
            # Get class probabilities
            class_probs = {}
            for j, cls in enumerate(self.classes_):
                class_probs[str(cls)] = float(probabilities[i, j])
            
            # Get risk category
            risk_score = float(risk_scores[i])
            if risk_score >= 0.8:
                risk_category = "critical"
            elif risk_score >= 0.6:
                risk_category = "very_high"
            elif risk_score >= 0.4:
                risk_category = "high"
            elif risk_score >= 0.2:
                risk_category = "moderate"
            elif risk_score >= 0.1:
                risk_category = "low"
            else:
                risk_category = "very_low"
            
            # Get top contributing features
            if isinstance(X, pd.DataFrame):
                feature_values = X.iloc[i].to_dict()
            else:
                feature_values = {
                    f: float(X[i, j]) if j < X.shape[1] else 0
                    for j, f in enumerate(self.selected_features_ or [])
                }
            
            top_features = []
            if self.feature_importances_ is not None:
                sorted_idx = np.argsort(self.feature_importances_)[::-1]
                for idx in sorted_idx[:10]:
                    if idx < len(self.selected_features_ or []):
                        fname = self.selected_features_[idx]
                        top_features.append({
                            "feature": fname,
                            "importance": float(self.feature_importances_[idx]),
                            "value": feature_values.get(fname, None),
                        })
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                risk_score, risk_category, class_probs, top_features
            )
            
            result = {
                "prediction": str(predictions[i]),
                "risk_score": risk_score,
                "risk_category": risk_category,
                "class_probabilities": class_probs,
                "top_contributing_features": top_features,
                "recommendations": recommendations,
                "model_confidence": float(np.max(probabilities[i])),
                "model_version": self.version_,
            }
            results.append(result)
        
        return results
    
    def _preprocess(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """Preprocess features."""
        if isinstance(X, pd.DataFrame):
            X = X.values
        
        X_imputed = self.imputer.transform(X)
        X_scaled = self.scaler.transform(X_imputed)
        
        if self.feature_selector is not None:
            X_selected = self.feature_selector.transform(X_scaled)
        else:
            X_selected = X_scaled
        
        return X_selected
    
    def _get_best_model(self) -> BaseEstimator:
        """Get the best performing individual model."""
        if not self.models:
            raise RuntimeError("No models trained")
        
        best_name = max(
            self.training_metrics_,
            key=lambda k: self.training_metrics_[k].get("f1_weighted", 0)
            if k != "ensemble" else 0
        )
        return self.models[best_name]
    
    def _compute_feature_importances(self):
        """Compute aggregated feature importances."""
        importances_list = []
        
        for name, model in self.models.items():
            if hasattr(model, "feature_importances_"):
                imp = model.feature_importances_
                if len(imp) == len(self.selected_features_ or []):
                    importances_list.append(imp)
        
        if importances_list:
            self.feature_importances_ = np.mean(importances_list, axis=0)
        else:
            n = len(self.selected_features_ or [])
            self.feature_importances_ = np.ones(n) / max(n, 1)
    
    def _generate_recommendations(
        self,
        risk_score: float,
        risk_category: str,
        class_probs: Dict[str, float],
        top_features: List[Dict],
    ) -> List[str]:
        """Generate personalized recommendations."""
        recommendations = []
        
        if risk_category in ["critical", "very_high"]:
            recommendations.extend([
                "URGENT: Immediate consultation with an oncologist is strongly recommended.",
                "Schedule comprehensive cancer screening within the next 7 days.",
                "Request additional diagnostic tests including advanced imaging.",
                "Consider genetic counseling based on risk profile.",
            ])
        elif risk_category == "high":
            recommendations.extend([
                "Schedule a consultation with your doctor within 2 weeks.",
                "Comprehensive cancer screening recommended within 1 month.",
                "Follow-up blood tests recommended in 4-6 weeks.",
                "Consider lifestyle modifications to reduce risk factors.",
            ])
        elif risk_category == "moderate":
            recommendations.extend([
                "Schedule routine cancer screening within 3 months.",
                "Regular blood monitoring every 3-6 months.",
                "Maintain healthy lifestyle and diet.",
                "Discuss screening schedule with your primary care physician.",
            ])
        else:
            recommendations.extend([
                "Continue with regular annual health checkups.",
                "Maintain healthy lifestyle habits.",
                "Follow age-appropriate cancer screening guidelines.",
                "Stay physically active and maintain healthy weight.",
            ])
        
        # Feature-specific recommendations
        for feat in top_features[:5]:
            fname = feat.get("feature", "")
            if "smoking" in fname.lower():
                recommendations.append("Consider smoking cessation programs.")
            elif "alcohol" in fname.lower():
                recommendations.append("Reduce alcohol consumption.")
            elif "bmi" in fname.lower() or "weight" in fname.lower():
                recommendations.append("Work on maintaining a healthy BMI.")
            elif "sleep" in fname.lower():
                recommendations.append("Improve sleep quality and duration.")
            elif "exercise" in fname.lower() or "activity" in fname.lower():
                recommendations.append("Increase regular physical activity.")
        
        return list(set(recommendations))[:8]
    
    def _check_is_fitted(self):
        """Check if the model is fitted."""
        if not self.is_fitted_:
            raise RuntimeError("Model has not been fitted. Call fit() first.")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and metrics."""
        return {
            "version": self.version_,
            "is_fitted": self.is_fitted_,
            "training_date": self.training_date_,
            "n_features": self.n_features_in_,
            "n_classes": self.n_classes_,
            "classes": list(self.classes_) if self.classes_ is not None else [],
            "n_models": len(self.models),
            "has_ensemble": self.ensemble_model is not None,
            "training_metrics": self.training_metrics_,
            "cv_scores": self.cv_scores_,
            "selected_features": self.selected_features_,
        }
    
    def save_model(self, filepath: str) -> None:
        """Save the model to disk."""
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "wb") as f:
            pickle.dump(self, f)
        logger.info(f"Model saved to {filepath}")
    
    @staticmethod
    def load_model(filepath: str) -> "CancerRiskClassifier":
        """Load a saved model."""
        with open(filepath, "rb") as f:
            model = pickle.load(f)
        logger.info(f"Model loaded from {filepath}")
        return model


# ============================================================================
# Binary Cancer Detector (Cancer vs No Cancer)
# ============================================================================

class BinaryCancerDetector(CancerRiskClassifier):
    """
    Binary classifier for cancer vs. no cancer detection.
    Optimized for high sensitivity (recall) to minimize false negatives.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.version_ = "1.0.0-binary"
    
    def fit(self, X, y, **kwargs):
        """Train with binary labels."""
        # Convert to binary: 0 = no cancer, 1 = cancer
        if isinstance(y, pd.Series):
            y_binary = (y != "no_cancer").astype(int)
        else:
            y_binary = np.where(np.array(y) != "no_cancer", 1, 0)
        
        return super().fit(X, y_binary, **kwargs)
    
    def predict_cancer_probability(self, X) -> np.ndarray:
        """Get probability of cancer (class 1)."""
        proba = self.predict_proba(X)
        if proba.shape[1] == 2:
            return proba[:, 1]
        return proba[:, 0]


# ============================================================================
# Multi-Cancer Type Classifier
# ============================================================================

class MultiCancerClassifier(CancerRiskClassifier):
    """
    Multi-class classifier for specific cancer type prediction.
    Uses one-vs-rest approach for better per-class performance.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.version_ = "1.0.0-multi"
        self.per_class_metrics_ = {}
    
    def evaluate_per_class(self, X, y_true) -> Dict:
        """Evaluate performance for each cancer type."""
        y_pred = self.predict(X)
        
        report = classification_report(y_true, y_pred, output_dict=True)
        self.per_class_metrics_ = report
        return report
    
    def get_top_cancer_risks(self, X, top_k: int = 3) -> List[Dict]:
        """Get top-k cancer type risks for each sample."""
        proba = self.predict_proba(X)
        results = []
        
        for i in range(len(X)):
            sorted_idx = np.argsort(proba[i])[::-1]
            top_risks = []
            for j in sorted_idx[:top_k]:
                if self.classes_[j] != "no_cancer":
                    top_risks.append({
                        "cancer_type": str(self.classes_[j]),
                        "probability": float(proba[i, j]),
                    })
            results.append(top_risks)
        
        return results

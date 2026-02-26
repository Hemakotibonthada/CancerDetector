"""
Feature Engineering Pipeline - Automated feature extraction, transformation,
and selection for medical/clinical datasets.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

import numpy as np

logger = logging.getLogger(__name__)


class FeatureType(Enum):
    NUMERICAL = "numerical"
    CATEGORICAL = "categorical"
    BINARY = "binary"
    TEMPORAL = "temporal"
    TEXT = "text"
    ORDINAL = "ordinal"


@dataclass
class FeatureDefinition:
    name: str
    feature_type: str = FeatureType.NUMERICAL.value
    original_column: str = ""
    transformation: str = "none"
    description: str = ""
    clinical_relevance: str = ""


class NumericalTransformer:
    """Transform numerical features."""

    @staticmethod
    def standard_scale(values: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Z-score standardization."""
        mean = np.nanmean(values)
        std = np.nanstd(values)
        if std == 0:
            std = 1
        scaled = (values - mean) / std
        return scaled, {"mean": float(mean), "std": float(std)}

    @staticmethod
    def minmax_scale(values: np.ndarray, feature_range: Tuple = (0, 1)) -> Tuple[np.ndarray, Dict]:
        """Min-Max scaling."""
        min_val = np.nanmin(values)
        max_val = np.nanmax(values)
        if max_val == min_val:
            scaled = np.zeros_like(values) + feature_range[0]
        else:
            scaled = (values - min_val) / (max_val - min_val) * (feature_range[1] - feature_range[0]) + feature_range[0]
        return scaled, {"min": float(min_val), "max": float(max_val), "range": feature_range}

    @staticmethod
    def robust_scale(values: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Robust scaling using median and IQR."""
        median = np.nanmedian(values)
        q1 = np.nanpercentile(values, 25)
        q3 = np.nanpercentile(values, 75)
        iqr = q3 - q1
        if iqr == 0:
            iqr = 1
        scaled = (values - median) / iqr
        return scaled, {"median": float(median), "iqr": float(iqr), "q1": float(q1), "q3": float(q3)}

    @staticmethod
    def log_transform(values: np.ndarray, offset: float = 1.0) -> Tuple[np.ndarray, Dict]:
        """Log transformation for right-skewed data."""
        transformed = np.log(values + offset)
        return transformed, {"offset": offset}

    @staticmethod
    def power_transform(values: np.ndarray, power: float = 0.5) -> Tuple[np.ndarray, Dict]:
        """Power/Box-Cox-like transformation."""
        if np.any(values < 0):
            shifted = values - np.nanmin(values) + 1
        else:
            shifted = values + 1
        transformed = np.power(shifted, power)
        return transformed, {"power": power}

    @staticmethod
    def winsorize(values: np.ndarray, limits: Tuple[float, float] = (0.05, 0.95)) -> Tuple[np.ndarray, Dict]:
        """Winsorize outliers."""
        lower = np.nanpercentile(values, limits[0] * 100)
        upper = np.nanpercentile(values, limits[1] * 100)
        clipped = np.clip(values, lower, upper)
        return clipped, {"lower_clip": float(lower), "upper_clip": float(upper)}


class CategoricalEncoder:
    """Encode categorical features."""

    @staticmethod
    def one_hot_encode(values: np.ndarray, categories: Optional[List] = None) -> Tuple[np.ndarray, Dict]:
        """One-hot encoding."""
        if categories is None:
            categories = list(np.unique(values[~np.isnan(values)] if values.dtype.kind == 'f' else values))

        encoded = np.zeros((len(values), len(categories)))
        for i, val in enumerate(values):
            if val in categories:
                idx = categories.index(val)
                encoded[i, idx] = 1

        return encoded, {"categories": categories, "n_categories": len(categories)}

    @staticmethod
    def label_encode(values: np.ndarray, mapping: Optional[Dict] = None) -> Tuple[np.ndarray, Dict]:
        """Label encoding."""
        if mapping is None:
            unique_vals = sorted(np.unique(values))
            mapping = {val: i for i, val in enumerate(unique_vals)}

        encoded = np.array([mapping.get(v, -1) for v in values], dtype=float)
        return encoded, {"mapping": mapping}

    @staticmethod
    def ordinal_encode(values: np.ndarray, order: List) -> Tuple[np.ndarray, Dict]:
        """Ordinal encoding with specified order."""
        mapping = {val: i for i, val in enumerate(order)}
        encoded = np.array([mapping.get(v, -1) for v in values], dtype=float)
        return encoded, {"order": order, "mapping": mapping}

    @staticmethod
    def target_encode(values: np.ndarray, target: np.ndarray, smoothing: float = 10) -> Tuple[np.ndarray, Dict]:
        """Target encoding (mean of target per category)."""
        global_mean = np.nanmean(target)
        categories = np.unique(values)
        encoding = {}

        for cat in categories:
            mask = values == cat
            n = np.sum(mask)
            cat_mean = np.nanmean(target[mask])
            # Smoothed encoding
            encoding[cat] = (n * cat_mean + smoothing * global_mean) / (n + smoothing)

        encoded = np.array([encoding.get(v, global_mean) for v in values])
        return encoded, {"encoding": {str(k): float(v) for k, v in encoding.items()}, "global_mean": float(global_mean)}


class MissingValueHandler:
    """Handle missing values in features."""

    @staticmethod
    def impute_mean(values: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Mean imputation."""
        mean_val = np.nanmean(values)
        imputed = np.where(np.isnan(values), mean_val, values)
        n_missing = int(np.sum(np.isnan(values)))
        return imputed, {"strategy": "mean", "fill_value": float(mean_val), "n_imputed": n_missing}

    @staticmethod
    def impute_median(values: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Median imputation."""
        median_val = np.nanmedian(values)
        imputed = np.where(np.isnan(values), median_val, values)
        n_missing = int(np.sum(np.isnan(values)))
        return imputed, {"strategy": "median", "fill_value": float(median_val), "n_imputed": n_missing}

    @staticmethod
    def impute_mode(values: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Mode imputation (for categorical)."""
        non_nan = values[~np.isnan(values)] if values.dtype.kind == 'f' else values[values != None]
        if len(non_nan) == 0:
            return values, {"strategy": "mode", "fill_value": None, "n_imputed": 0}
        unique, counts = np.unique(non_nan, return_counts=True)
        mode_val = unique[np.argmax(counts)]
        imputed = np.where(np.isnan(values) if values.dtype.kind == 'f' else values == None, mode_val, values)
        return imputed, {"strategy": "mode", "fill_value": mode_val}

    @staticmethod
    def add_missing_indicator(values: np.ndarray) -> np.ndarray:
        """Create binary missing indicator feature."""
        return np.isnan(values).astype(float) if values.dtype.kind == 'f' else np.array([v is None for v in values], dtype=float)


class InteractionFeatureGenerator:
    """Generate interaction and polynomial features."""

    @staticmethod
    def pairwise_interactions(X: np.ndarray, feature_names: List[str]) -> Tuple[np.ndarray, List[str]]:
        """Generate pairwise interaction features."""
        n_features = X.shape[1]
        interactions = []
        interaction_names = []

        for i in range(n_features):
            for j in range(i + 1, n_features):
                interaction = X[:, i] * X[:, j]
                interactions.append(interaction)
                interaction_names.append(f"{feature_names[i]}_x_{feature_names[j]}")

        if interactions:
            return np.column_stack(interactions), interaction_names
        return np.array([]).reshape(X.shape[0], 0), []

    @staticmethod
    def polynomial_features(X: np.ndarray, feature_names: List[str], degree: int = 2) -> Tuple[np.ndarray, List[str]]:
        """Generate polynomial features."""
        poly_features = []
        poly_names = []

        for i in range(X.shape[1]):
            for d in range(2, degree + 1):
                poly_features.append(X[:, i] ** d)
                poly_names.append(f"{feature_names[i]}^{d}")

        if poly_features:
            return np.column_stack(poly_features), poly_names
        return np.array([]).reshape(X.shape[0], 0), []

    @staticmethod
    def ratio_features(X: np.ndarray, feature_names: List[str], pairs: List[Tuple[int, int]]) -> Tuple[np.ndarray, List[str]]:
        """Generate ratio features from specified pairs."""
        ratios = []
        ratio_names = []

        for i, j in pairs:
            denominator = X[:, j].copy()
            denominator[denominator == 0] = 1e-10
            ratio = X[:, i] / denominator
            ratios.append(ratio)
            ratio_names.append(f"{feature_names[i]}_div_{feature_names[j]}")

        if ratios:
            return np.column_stack(ratios), ratio_names
        return np.array([]).reshape(X.shape[0], 0), []


class ClinicalFeatureExtractor:
    """Extract domain-specific clinical features."""

    @staticmethod
    def bmi_features(height_cm: np.ndarray, weight_kg: np.ndarray) -> Dict[str, np.ndarray]:
        """Extract BMI-related features."""
        height_m = height_cm / 100
        bmi = weight_kg / (height_m ** 2)

        bmi_category = np.zeros(len(bmi))
        bmi_category[bmi < 18.5] = 0  # Underweight
        bmi_category[(bmi >= 18.5) & (bmi < 25)] = 1  # Normal
        bmi_category[(bmi >= 25) & (bmi < 30)] = 2  # Overweight
        bmi_category[bmi >= 30] = 3  # Obese

        return {
            "bmi": bmi,
            "bmi_category": bmi_category,
            "bsa": np.sqrt(height_cm * weight_kg / 3600),  # Body Surface Area (Mosteller)
        }

    @staticmethod
    def blood_pressure_features(systolic: np.ndarray, diastolic: np.ndarray) -> Dict[str, np.ndarray]:
        """Extract blood pressure features."""
        map_value = (systolic + 2 * diastolic) / 3  # Mean Arterial Pressure
        pp = systolic - diastolic  # Pulse Pressure

        bp_category = np.zeros(len(systolic))
        bp_category[(systolic < 120) & (diastolic < 80)] = 0  # Normal
        bp_category[(systolic >= 120) & (systolic < 130) & (diastolic < 80)] = 1  # Elevated
        bp_category[((systolic >= 130) & (systolic < 140)) | ((diastolic >= 80) & (diastolic < 90))] = 2  # Stage 1
        bp_category[(systolic >= 140) | (diastolic >= 90)] = 3  # Stage 2
        bp_category[(systolic >= 180) | (diastolic >= 120)] = 4  # Crisis

        return {
            "map": map_value,
            "pulse_pressure": pp,
            "bp_category": bp_category,
        }

    @staticmethod
    def age_features(age: np.ndarray) -> Dict[str, np.ndarray]:
        """Extract age-derived features."""
        age_group = np.zeros(len(age))
        age_group[(age >= 0) & (age < 18)] = 0
        age_group[(age >= 18) & (age < 30)] = 1
        age_group[(age >= 30) & (age < 45)] = 2
        age_group[(age >= 45) & (age < 60)] = 3
        age_group[(age >= 60) & (age < 75)] = 4
        age_group[age >= 75] = 5

        return {
            "age_squared": age ** 2,
            "age_log": np.log(age + 1),
            "age_group": age_group,
            "is_elderly": (age >= 65).astype(float),
            "is_pediatric": (age < 18).astype(float),
        }

    @staticmethod
    def lab_value_features(lab_values: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Extract features from lab values."""
        features = {}

        # Normal ranges for flagging
        normal_ranges = {
            "wbc": (4.5, 11.0),
            "hemoglobin": (12.0, 17.5),
            "platelets": (150, 400),
            "creatinine": (0.7, 1.3),
            "glucose": (70, 100),
            "sodium": (136, 145),
            "potassium": (3.5, 5.0),
            "calcium": (8.5, 10.5),
        }

        for lab, values in lab_values.items():
            if lab in normal_ranges:
                low, high = normal_ranges[lab]
                features[f"{lab}_abnormal"] = ((values < low) | (values > high)).astype(float)
                features[f"{lab}_zscore"] = (values - np.mean([low, high])) / ((high - low) / 4)

        return features

    @staticmethod
    def comorbidity_index(conditions: List[List[str]]) -> np.ndarray:
        """Calculate Charlson Comorbidity Index."""
        weights = {
            "myocardial_infarction": 1, "congestive_heart_failure": 1,
            "peripheral_vascular": 1, "cerebrovascular": 1,
            "dementia": 1, "chronic_pulmonary": 1,
            "connective_tissue": 1, "ulcer_disease": 1,
            "mild_liver": 1, "diabetes": 1,
            "hemiplegia": 2, "renal_disease": 2,
            "diabetes_complications": 2, "cancer": 2,
            "moderate_liver": 3, "metastatic_cancer": 6,
            "aids": 6,
        }

        scores = []
        for patient_conditions in conditions:
            score = sum(weights.get(c.lower().replace(" ", "_"), 0) for c in patient_conditions)
            scores.append(score)

        return np.array(scores)


class FeatureSelector:
    """Feature selection methods."""

    @staticmethod
    def variance_threshold(X: np.ndarray, threshold: float = 0.01) -> Tuple[np.ndarray, List[int]]:
        """Remove low-variance features."""
        variances = np.nanvar(X, axis=0)
        selected = np.where(variances > threshold)[0]
        return X[:, selected], selected.tolist()

    @staticmethod
    def correlation_filter(X: np.ndarray, threshold: float = 0.95) -> Tuple[np.ndarray, List[int]]:
        """Remove highly correlated features."""
        n_features = X.shape[1]
        to_remove = set()

        for i in range(n_features):
            if i in to_remove:
                continue
            for j in range(i + 1, n_features):
                if j in to_remove:
                    continue
                corr = np.abs(np.corrcoef(X[:, i], X[:, j])[0, 1])
                if corr > threshold:
                    to_remove.add(j)

        selected = [i for i in range(n_features) if i not in to_remove]
        return X[:, selected], selected

    @staticmethod
    def mutual_information_filter(X: np.ndarray, y: np.ndarray, top_k: int = 20) -> Tuple[np.ndarray, List[int]]:
        """Select features by approximate mutual information."""
        n_features = X.shape[1]
        mi_scores = np.zeros(n_features)

        for i in range(n_features):
            # Approximate MI using correlation for continuous features
            valid = ~np.isnan(X[:, i])
            if np.sum(valid) < 10:
                mi_scores[i] = 0
                continue
            corr = np.abs(np.corrcoef(X[valid, i], y[valid])[0, 1])
            mi_scores[i] = -0.5 * np.log(1 - corr ** 2 + 1e-10)

        top_indices = np.argsort(mi_scores)[::-1][:top_k]
        return X[:, top_indices], top_indices.tolist()


class FeatureEngineeringPipeline:
    """Complete feature engineering pipeline."""

    def __init__(self):
        self.num_transformer = NumericalTransformer()
        self.cat_encoder = CategoricalEncoder()
        self.missing_handler = MissingValueHandler()
        self.interaction_gen = InteractionFeatureGenerator()
        self.clinical_extractor = ClinicalFeatureExtractor()
        self.selector = FeatureSelector()
        self.transformations: Dict[str, Dict] = {}

    def fit_transform(
        self,
        X: np.ndarray,
        y: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None,
        numerical_indices: Optional[List[int]] = None,
        categorical_indices: Optional[List[int]] = None,
        scaling: str = "standard",
        add_interactions: bool = False,
        add_polynomial: bool = False,
        feature_selection: Optional[str] = None,
        top_k: int = 20,
    ) -> Tuple[np.ndarray, List[str]]:
        """Full feature engineering pipeline."""
        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]

        all_features = []
        all_names = []

        # Numerical features
        num_idx = numerical_indices or list(range(X.shape[1]))
        for i in num_idx:
            if i >= X.shape[1]:
                continue
            col = X[:, i].astype(float)

            # Handle missing
            col, missing_info = self.missing_handler.impute_median(col)
            self.transformations[feature_names[i]] = {"missing": missing_info}

            # Add missing indicator if many missing values
            if missing_info["n_imputed"] > len(col) * 0.05:
                indicator = self.missing_handler.add_missing_indicator(X[:, i].astype(float))
                all_features.append(indicator)
                all_names.append(f"{feature_names[i]}_missing")

            # Scale
            if scaling == "standard":
                col, scale_info = self.num_transformer.standard_scale(col)
            elif scaling == "minmax":
                col, scale_info = self.num_transformer.minmax_scale(col)
            elif scaling == "robust":
                col, scale_info = self.num_transformer.robust_scale(col)
            else:
                scale_info = {}

            self.transformations[feature_names[i]]["scaling"] = scale_info
            all_features.append(col)
            all_names.append(feature_names[i])

        # Categorical features
        if categorical_indices:
            for i in categorical_indices:
                if i >= X.shape[1]:
                    continue
                col = X[:, i]
                encoded, enc_info = self.cat_encoder.one_hot_encode(col)
                self.transformations[feature_names[i]] = {"encoding": enc_info}
                for j, cat in enumerate(enc_info["categories"]):
                    all_features.append(encoded[:, j])
                    all_names.append(f"{feature_names[i]}_{cat}")

        # Stack features
        X_processed = np.column_stack(all_features) if all_features else X

        # Interaction features
        if add_interactions and X_processed.shape[1] <= 20:
            interactions, int_names = self.interaction_gen.pairwise_interactions(X_processed, all_names)
            if interactions.shape[1] > 0:
                X_processed = np.hstack([X_processed, interactions])
                all_names.extend(int_names)

        # Polynomial features
        if add_polynomial:
            polys, poly_names = self.interaction_gen.polynomial_features(X_processed[:, :min(10, X_processed.shape[1])], all_names[:min(10, len(all_names))])
            if polys.shape[1] > 0:
                X_processed = np.hstack([X_processed, polys])
                all_names.extend(poly_names)

        # Feature selection
        if feature_selection and y is not None:
            if feature_selection == "variance":
                X_processed, selected = self.selector.variance_threshold(X_processed)
                all_names = [all_names[i] for i in selected]
            elif feature_selection == "correlation":
                X_processed, selected = self.selector.correlation_filter(X_processed)
                all_names = [all_names[i] for i in selected]
            elif feature_selection == "mutual_information":
                X_processed, selected = self.selector.mutual_information_filter(X_processed, y, top_k)
                all_names = [all_names[i] for i in selected]

        logger.info(f"Feature engineering complete: {X.shape[1]} original → {X_processed.shape[1]} final features")
        return X_processed, all_names

    def get_pipeline_summary(self) -> Dict:
        """Get summary of applied transformations."""
        return {
            "n_features_transformed": len(self.transformations),
            "transformations": {
                name: {k: str(v) for k, v in transforms.items()}
                for name, transforms in self.transformations.items()
            },
        }


# Singleton
feature_pipeline = FeatureEngineeringPipeline()

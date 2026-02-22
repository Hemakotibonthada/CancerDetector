"""
Data Preprocessing Pipeline for Cancer Detection
=================================================

Comprehensive data preprocessing including blood biomarker processing,
smartwatch data feature engineering, and data normalization.
"""

from __future__ import annotations
import logging
import numpy as np
import pandas as pd
from typing import Any, Dict, List, Optional, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer, KNNImputer
from scipy import stats

logger = logging.getLogger(__name__)


class BloodBiomarkerPreprocessor:
    """Preprocess blood biomarker data for cancer detection."""
    
    # Normal reference ranges for key biomarkers
    REFERENCE_RANGES = {
        "wbc_count": (4.0, 11.0),      # x10^3/uL
        "rbc_count": (4.0, 5.5),        # x10^6/uL
        "hemoglobin": (12.0, 17.5),     # g/dL
        "hematocrit": (36.0, 52.0),     # %
        "platelets": (150, 400),         # x10^3/uL
        "neutrophils": (40, 70),         # %
        "lymphocytes": (20, 40),         # %
        "monocytes": (2, 8),             # %
        "eosinophils": (1, 4),           # %
        "basophils": (0, 1),             # %
        "cea": (0, 5.0),                 # ng/mL - tumor marker
        "ca125": (0, 35),                # U/mL - tumor marker
        "ca199": (0, 37),                # U/mL - tumor marker
        "afp": (0, 10),                  # ng/mL - tumor marker
        "psa": (0, 4.0),                 # ng/mL - tumor marker
        "ca153": (0, 25),                # U/mL - tumor marker
        "cyfra211": (0, 3.3),            # ng/mL - tumor marker
        "nse": (0, 16.3),               # ng/mL - tumor marker
        "crp": (0, 3.0),                 # mg/L - inflammatory
        "esr": (0, 20),                  # mm/hr - inflammatory
        "ldh": (120, 246),               # U/L
        "alt": (7, 56),                  # U/L
        "ast": (10, 40),                 # U/L
        "albumin": (3.5, 5.5),           # g/dL
        "creatinine": (0.6, 1.2),        # mg/dL
        "glucose_fasting": (70, 100),    # mg/dL
        "hba1c": (4.0, 5.6),            # %
        "total_cholesterol": (0, 200),   # mg/dL
        "vitamin_d": (30, 100),          # ng/mL
    }
    
    TUMOR_MARKERS = [
        "cea", "ca125", "ca199", "afp", "psa", "ca153",
        "cyfra211", "nse", "scc", "ferritin", "ldh"
    ]
    
    def __init__(self):
        self.scaler = RobustScaler()
        self.imputer = KNNImputer(n_neighbors=5)
        self.is_fitted = False
    
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit and transform blood biomarker data."""
        df_processed = df.copy()
        
        # Add derived features
        df_processed = self._add_derived_features(df_processed)
        
        # Add deviation from normal
        df_processed = self._add_deviation_features(df_processed)
        
        # Add tumor marker aggregates
        df_processed = self._add_tumor_marker_features(df_processed)
        
        # Impute missing values
        numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
        df_processed[numeric_cols] = self.imputer.fit_transform(df_processed[numeric_cols])
        
        # Scale
        df_processed[numeric_cols] = self.scaler.fit_transform(df_processed[numeric_cols])
        
        self.is_fitted = True
        return df_processed
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform blood biomarker data using fitted preprocessor."""
        df_processed = df.copy()
        df_processed = self._add_derived_features(df_processed)
        df_processed = self._add_deviation_features(df_processed)
        df_processed = self._add_tumor_marker_features(df_processed)
        
        numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
        df_processed[numeric_cols] = self.imputer.transform(df_processed[numeric_cols])
        df_processed[numeric_cols] = self.scaler.transform(df_processed[numeric_cols])
        
        return df_processed
    
    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived blood features."""
        if "neutrophils" in df.columns and "lymphocytes" in df.columns:
            df["nlr"] = df["neutrophils"] / df["lymphocytes"].clip(lower=0.1)
        
        if "platelets" in df.columns and "lymphocytes" in df.columns:
            df["plr"] = df["platelets"] / df["lymphocytes"].clip(lower=0.1)
        
        if "alt" in df.columns and "ast" in df.columns:
            df["ast_alt_ratio"] = df["ast"] / df["alt"].clip(lower=0.1)
        
        if "albumin" in df.columns and "total_protein" in df.columns:
            df["ag_ratio"] = df["albumin"] / (df["total_protein"] - df["albumin"]).clip(lower=0.1)
        
        if "bun" in df.columns and "creatinine" in df.columns:
            df["bun_creatinine_ratio"] = df["bun"] / df["creatinine"].clip(lower=0.1)
        
        if "total_cholesterol" in df.columns and "hdl" in df.columns:
            df["cholesterol_hdl_ratio"] = df["total_cholesterol"] / df["hdl"].clip(lower=0.1)
        
        return df
    
    def _add_deviation_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add features measuring deviation from normal ranges."""
        for marker, (low, high) in self.REFERENCE_RANGES.items():
            if marker in df.columns:
                mid = (low + high) / 2
                range_width = (high - low) / 2
                if range_width > 0:
                    df[f"{marker}_deviation"] = (df[marker] - mid) / range_width
                    df[f"{marker}_is_abnormal"] = (
                        (df[marker] < low) | (df[marker] > high)
                    ).astype(int)
        
        return df
    
    def _add_tumor_marker_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add aggregate tumor marker features."""
        available_markers = [m for m in self.TUMOR_MARKERS if m in df.columns]
        
        if available_markers:
            elevated_cols = [f"{m}_is_abnormal" for m in available_markers if f"{m}_is_abnormal" in df.columns]
            if elevated_cols:
                df["tumor_markers_elevated_count"] = df[elevated_cols].sum(axis=1)
                df["tumor_markers_elevated_ratio"] = df["tumor_markers_elevated_count"] / len(elevated_cols)
            
            df["tumor_marker_mean_deviation"] = df[
                [f"{m}_deviation" for m in available_markers if f"{m}_deviation" in df.columns]
            ].mean(axis=1)
            
            df["tumor_marker_max_deviation"] = df[
                [f"{m}_deviation" for m in available_markers if f"{m}_deviation" in df.columns]
            ].max(axis=1)
        
        return df


class SmartwatchPreprocessor:
    """Preprocess smartwatch data for cancer detection."""
    
    def __init__(self, window_days: int = 30):
        self.window_days = window_days
        self.scaler = StandardScaler()
    
    def extract_features(self, raw_data: pd.DataFrame) -> pd.DataFrame:
        """Extract features from raw smartwatch time series data."""
        features = {}
        
        # Heart rate features
        if "heart_rate" in raw_data.columns:
            hr = raw_data["heart_rate"].dropna()
            features.update({
                "heart_rate_resting_avg": float(hr[hr < hr.quantile(0.25)].mean()),
                "heart_rate_resting_std": float(hr[hr < hr.quantile(0.25)].std()),
                "heart_rate_variability_avg": float(hr.rolling(10).std().mean()),
                "heart_rate_variability_trend": float(self._compute_trend(hr.rolling(10).std())),
                "heart_rate_max_daily_avg": float(hr.max()),
                "heart_rate_anomaly_count": int((hr > hr.mean() + 3 * hr.std()).sum()),
            })
        
        # SpO2 features
        if "spo2" in raw_data.columns:
            spo2 = raw_data["spo2"].dropna()
            features.update({
                "spo2_avg": float(spo2.mean()),
                "spo2_min": float(spo2.min()),
                "spo2_below_95_pct": float((spo2 < 95).mean()),
                "spo2_variability": float(spo2.std()),
            })
        
        # Activity features
        if "steps" in raw_data.columns:
            steps = raw_data["steps"].dropna()
            features.update({
                "steps_daily_avg": float(steps.mean()),
                "steps_daily_trend": float(self._compute_trend(steps)),
            })
        
        if "active_minutes" in raw_data.columns:
            features["active_minutes_avg"] = float(raw_data["active_minutes"].mean())
        if "sedentary_minutes" in raw_data.columns:
            features["sedentary_minutes_avg"] = float(raw_data["sedentary_minutes"].mean())
        if "calories" in raw_data.columns:
            features["calories_burned_avg"] = float(raw_data["calories"].mean())
        
        # Sleep features
        if "sleep_duration" in raw_data.columns:
            sleep = raw_data["sleep_duration"].dropna()
            features.update({
                "sleep_duration_avg": float(sleep.mean()),
                "sleep_quality_avg": float(raw_data.get("sleep_quality", pd.Series([50])).mean()),
            })
        
        # Stress features
        if "stress_level" in raw_data.columns:
            stress = raw_data["stress_level"].dropna()
            features.update({
                "stress_level_avg": float(stress.mean()),
                "stress_level_max": float(stress.max()),
                "stress_high_pct": float((stress > 70).mean()),
            })
        
        # Temperature features
        if "skin_temperature" in raw_data.columns:
            temp = raw_data["skin_temperature"].dropna()
            features.update({
                "skin_temperature_avg": float(temp.mean()),
                "skin_temperature_deviation": float(temp.std()),
            })
        
        # Respiratory rate
        if "respiratory_rate" in raw_data.columns:
            rr = raw_data["respiratory_rate"].dropna()
            features.update({
                "respiratory_rate_avg": float(rr.mean()),
                "respiratory_rate_variability": float(rr.std()),
            })
        
        # Fill any missing with defaults
        default_values = {
            "heart_rate_resting_avg": 70, "heart_rate_resting_std": 5,
            "heart_rate_variability_avg": 40, "heart_rate_variability_trend": 0,
            "heart_rate_max_daily_avg": 100, "heart_rate_anomaly_count": 0,
            "spo2_avg": 97, "spo2_min": 95, "spo2_below_95_pct": 0,
            "spo2_variability": 1, "steps_daily_avg": 5000,
            "steps_daily_trend": 0, "active_minutes_avg": 30,
            "sedentary_minutes_avg": 600, "calories_burned_avg": 2000,
            "sleep_duration_avg": 420, "sleep_quality_avg": 75,
            "stress_level_avg": 40, "stress_level_max": 70,
            "stress_high_pct": 0.1, "skin_temperature_avg": 33,
            "skin_temperature_deviation": 0.5,
            "respiratory_rate_avg": 16, "respiratory_rate_variability": 2,
        }
        
        for key, default in default_values.items():
            if key not in features or np.isnan(features.get(key, np.nan)):
                features[key] = default
        
        return pd.DataFrame([features])
    
    @staticmethod
    def _compute_trend(series: pd.Series) -> float:
        """Compute linear trend of a series."""
        series = series.dropna()
        if len(series) < 2:
            return 0.0
        x = np.arange(len(series))
        try:
            slope, _, _, _, _ = stats.linregress(x, series.values)
            return float(slope)
        except Exception:
            return 0.0


class LifestyleFeatureEncoder:
    """Encode lifestyle and demographic features."""
    
    SMOKING_ENCODING = {
        "never": 0, "former": 1, "current_light": 2,
        "current_moderate": 3, "current_heavy": 4, "unknown": 0
    }
    
    GENDER_ENCODING = {"male": 0, "female": 1, "non_binary": 2, "other": 2}
    
    ACTIVITY_ENCODING = {
        "sedentary": 0, "lightly_active": 1, "moderately_active": 2,
        "very_active": 3, "extremely_active": 4
    }
    
    ALCOHOL_ENCODING = {
        "none": 0, "occasional": 1, "moderate": 2, "heavy": 3
    }
    
    def encode(self, patient_data: Dict[str, Any]) -> Dict[str, float]:
        """Encode lifecycle features to numeric values."""
        features = {
            "age": float(patient_data.get("age", 50)),
            "gender_encoded": float(self.GENDER_ENCODING.get(
                patient_data.get("gender", ""), 0
            )),
            "bmi": float(patient_data.get("bmi", 25.0)),
            "smoking_status_encoded": float(self.SMOKING_ENCODING.get(
                patient_data.get("smoking_status", "never"), 0
            )),
            "pack_years": float(patient_data.get("pack_years", 0)),
            "alcohol_units_per_week": float(patient_data.get("alcohol_units_per_week", 0)),
            "exercise_minutes_per_week": float(patient_data.get("exercise_minutes_per_week", 0)),
            "diet_quality_score": float(patient_data.get("diet_quality_score", 50)),
            "sleep_hours_avg": float(patient_data.get("sleep_hours_avg", 7)),
            "stress_score": float(patient_data.get("stress_score", 5)),
            "sun_exposure_hours": float(patient_data.get("sun_exposure_hours", 1)),
            "occupation_risk_score": float(patient_data.get("occupation_risk_score", 1)),
        }
        return features


class GeneticFeatureEncoder:
    """Encode genetic and family history features."""
    
    def encode(self, patient_data: Dict[str, Any]) -> Dict[str, float]:
        """Encode genetic features."""
        features = {
            "family_cancer_count": float(patient_data.get("family_cancer_count", 0)),
            "first_degree_cancer_count": float(patient_data.get("first_degree_cancer_count", 0)),
            "brca1_positive": float(patient_data.get("brca1_positive", False)),
            "brca2_positive": float(patient_data.get("brca2_positive", False)),
            "lynch_syndrome": float(patient_data.get("lynch_syndrome", False)),
            "tp53_mutation": float(patient_data.get("tp53_mutation", False)),
            "genetic_risk_score": float(patient_data.get("genetic_risk_score", 0)),
            "family_cancer_age_min": float(patient_data.get("family_cancer_age_min", 100)),
        }
        return features


class MedicalHistoryEncoder:
    """Encode medical history features."""
    
    def encode(self, patient_data: Dict[str, Any]) -> Dict[str, float]:
        """Encode medical history."""
        features = {
            "has_diabetes": float(patient_data.get("has_diabetes", False)),
            "has_hypertension": float(patient_data.get("has_hypertension", False)),
            "has_heart_disease": float(patient_data.get("has_heart_disease", False)),
            "has_autoimmune_disease": float(patient_data.get("has_autoimmune_disease", False)),
            "has_chronic_kidney_disease": float(patient_data.get("has_chronic_kidney_disease", False)),
            "has_liver_disease": float(patient_data.get("has_liver_disease", False)),
            "has_lung_disease": float(patient_data.get("has_lung_disease", False)),
            "has_hiv": float(patient_data.get("has_hiv", False)),
            "has_hepatitis": float(patient_data.get("has_hepatitis", False)),
            "has_hpv": float(patient_data.get("has_hpv", False)),
            "has_obesity": float(patient_data.get("has_obesity", False)),
            "has_previous_cancer": float(patient_data.get("has_previous_cancer", False)),
            "previous_cancer_count": float(patient_data.get("previous_cancer_count", 0)),
            "years_since_last_cancer": float(patient_data.get("years_since_last_cancer", 99)),
            "total_medications": float(patient_data.get("total_medications", 0)),
            "immunosuppressant_use": float(patient_data.get("immunosuppressant_use", False)),
            "total_surgeries": float(patient_data.get("total_surgeries", 0)),
            "chronic_condition_count": float(patient_data.get("chronic_condition_count", 0)),
        }
        return features


class CancerDataPreprocessor:
    """
    Main preprocessing pipeline combining all feature categories.
    """
    
    def __init__(self):
        self.blood_preprocessor = BloodBiomarkerPreprocessor()
        self.smartwatch_preprocessor = SmartwatchPreprocessor()
        self.lifestyle_encoder = LifestyleFeatureEncoder()
        self.genetic_encoder = GeneticFeatureEncoder()
        self.medical_encoder = MedicalHistoryEncoder()
        self.final_scaler = StandardScaler()
        self.is_fitted = False
    
    def prepare_features(
        self,
        blood_data: Optional[pd.DataFrame] = None,
        smartwatch_data: Optional[pd.DataFrame] = None,
        patient_info: Optional[Dict[str, Any]] = None,
    ) -> pd.DataFrame:
        """
        Prepare all features for cancer prediction.
        
        Combines blood biomarkers, smartwatch data, lifestyle, genetic,
        and medical history features into a single feature vector.
        """
        all_features = {}
        
        # Process blood biomarkers
        if blood_data is not None and not blood_data.empty:
            blood_features = self.blood_preprocessor.fit_transform(blood_data)
            for col in blood_features.columns:
                if blood_features[col].dtype in [np.float64, np.int64, float, int]:
                    all_features[col] = float(blood_features[col].iloc[0])
        
        # Process smartwatch data
        if smartwatch_data is not None and not smartwatch_data.empty:
            sw_features = self.smartwatch_preprocessor.extract_features(smartwatch_data)
            for col in sw_features.columns:
                all_features[col] = float(sw_features[col].iloc[0])
        
        # Encode patient information
        if patient_info:
            lifestyle = self.lifestyle_encoder.encode(patient_info)
            all_features.update(lifestyle)
            
            genetic = self.genetic_encoder.encode(patient_info)
            all_features.update(genetic)
            
            medical = self.medical_encoder.encode(patient_info)
            all_features.update(medical)
        
        return pd.DataFrame([all_features])
    
    def generate_synthetic_data(
        self, n_samples: int = 1000, cancer_ratio: float = 0.3
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Generate synthetic training data for model development.
        """
        np.random.seed(42)
        
        n_cancer = int(n_samples * cancer_ratio)
        n_healthy = n_samples - n_cancer
        
        data = []
        labels = []
        
        # Generate healthy samples
        for _ in range(n_healthy):
            sample = self._generate_healthy_sample()
            data.append(sample)
            labels.append("no_cancer")
        
        # Generate cancer samples
        cancer_types = ["lung", "breast", "colorectal", "prostate", "liver", "pancreatic"]
        for i in range(n_cancer):
            cancer_type = cancer_types[i % len(cancer_types)]
            sample = self._generate_cancer_sample(cancer_type)
            data.append(sample)
            labels.append(cancer_type)
        
        df = pd.DataFrame(data)
        labels = pd.Series(labels)
        
        # Shuffle
        idx = np.random.permutation(len(df))
        df = df.iloc[idx].reset_index(drop=True)
        labels = labels.iloc[idx].reset_index(drop=True)
        
        return df, labels
    
    def _generate_healthy_sample(self) -> Dict[str, float]:
        """Generate a healthy patient's features."""
        return {
            "wbc_count": np.random.normal(7, 1.5),
            "rbc_count": np.random.normal(4.7, 0.4),
            "hemoglobin": np.random.normal(14, 1.5),
            "hematocrit": np.random.normal(42, 4),
            "platelets": np.random.normal(250, 50),
            "neutrophils": np.random.normal(55, 8),
            "lymphocytes": np.random.normal(30, 5),
            "monocytes": np.random.normal(5, 1.5),
            "eosinophils": np.random.normal(2, 0.8),
            "basophils": np.random.normal(0.5, 0.3),
            "cea": np.random.exponential(1.5),
            "ca125": np.random.normal(15, 8),
            "ca199": np.random.normal(15, 8),
            "afp": np.random.normal(4, 2),
            "psa": np.random.normal(1.5, 1),
            "ca153": np.random.normal(12, 5),
            "crp": np.random.exponential(1),
            "esr": np.random.normal(8, 4),
            "ldh": np.random.normal(180, 30),
            "alt": np.random.normal(25, 10),
            "ast": np.random.normal(20, 8),
            "albumin": np.random.normal(4.2, 0.3),
            "creatinine": np.random.normal(0.9, 0.15),
            "glucose_fasting": np.random.normal(85, 8),
            "hba1c": np.random.normal(5.2, 0.3),
            "total_cholesterol": np.random.normal(180, 25),
            "vitamin_d": np.random.normal(45, 15),
            # Smartwatch
            "heart_rate_resting_avg": np.random.normal(68, 8),
            "heart_rate_variability_avg": np.random.normal(50, 15),
            "spo2_avg": np.random.normal(97.5, 0.8),
            "steps_daily_avg": np.random.normal(7000, 2000),
            "sleep_duration_avg": np.random.normal(450, 30),
            "stress_level_avg": np.random.normal(35, 12),
            # Lifestyle
            "age": np.random.normal(45, 12),
            "gender_encoded": np.random.choice([0, 1]),
            "bmi": np.random.normal(24, 3),
            "smoking_status_encoded": np.random.choice([0, 0, 0, 1]),
            "pack_years": 0,
            "alcohol_units_per_week": np.random.exponential(3),
            "exercise_minutes_per_week": np.random.normal(150, 60),
            # Genetic
            "family_cancer_count": np.random.choice([0, 0, 0, 1]),
            "brca1_positive": 0,
            "brca2_positive": 0,
            "genetic_risk_score": np.random.normal(0.1, 0.05),
            # Medical
            "has_diabetes": np.random.choice([0, 0, 0, 0, 1]),
            "has_hypertension": np.random.choice([0, 0, 0, 1]),
            "has_previous_cancer": 0,
            "chronic_condition_count": np.random.choice([0, 0, 1, 1, 2]),
        }
    
    def _generate_cancer_sample(self, cancer_type: str) -> Dict[str, float]:
        """Generate a cancer patient's features with abnormal patterns."""
        sample = self._generate_healthy_sample()
        
        # Common cancer indicators
        sample["wbc_count"] = np.random.normal(12, 3)
        sample["hemoglobin"] = np.random.normal(10, 2)
        sample["platelets"] = np.random.normal(180, 80)
        sample["crp"] = np.random.exponential(5)
        sample["esr"] = np.random.normal(30, 15)
        sample["ldh"] = np.random.normal(300, 80)
        sample["albumin"] = np.random.normal(3.2, 0.5)
        sample["age"] = np.random.normal(60, 10)
        sample["has_previous_cancer"] = np.random.choice([0, 1], p=[0.7, 0.3])
        
        # Smartwatch anomalies
        sample["heart_rate_resting_avg"] = np.random.normal(78, 10)
        sample["heart_rate_variability_avg"] = np.random.normal(30, 10)
        sample["spo2_avg"] = np.random.normal(95, 2)
        sample["sleep_duration_avg"] = np.random.normal(360, 60)
        sample["stress_level_avg"] = np.random.normal(55, 15)
        
        # Cancer-type specific markers
        if cancer_type == "lung":
            sample["cea"] = np.random.exponential(15)
            sample["cyfra211"] = np.random.exponential(8) if "cyfra211" in sample else 8
            sample["smoking_status_encoded"] = np.random.choice([2, 3, 4], p=[0.2, 0.4, 0.4])
            sample["pack_years"] = np.random.normal(25, 10)
        elif cancer_type == "breast":
            sample["ca153"] = np.random.exponential(40)
            sample["brca1_positive"] = np.random.choice([0, 1], p=[0.7, 0.3])
            sample["gender_encoded"] = 1
        elif cancer_type == "colorectal":
            sample["cea"] = np.random.exponential(20)
            sample["ca199"] = np.random.exponential(30)
        elif cancer_type == "prostate":
            sample["psa"] = np.random.exponential(15)
            sample["gender_encoded"] = 0
        elif cancer_type == "liver":
            sample["afp"] = np.random.exponential(50)
            sample["alt"] = np.random.normal(80, 30)
            sample["ast"] = np.random.normal(70, 25)
        elif cancer_type == "pancreatic":
            sample["ca199"] = np.random.exponential(100)
            sample["glucose_fasting"] = np.random.normal(130, 30)
        
        return sample

"""
ML Pipeline Service - Machine Learning pipeline management for CancerGuard AI
Handles model training, inference, preprocessing, and deployment lifecycle.
"""

import os
import json
import logging
import asyncio
import hashlib
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union
from pathlib import Path
from enum import Enum
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import uuid

logger = logging.getLogger(__name__)


# ============================================================================
# ENUMS & DATA CLASSES
# ============================================================================
class ModelType(Enum):
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    SEGMENTATION = "segmentation"
    DETECTION = "detection"
    NLP = "nlp"
    TIME_SERIES = "time_series"
    ANOMALY_DETECTION = "anomaly_detection"
    RECOMMENDATION = "recommendation"


class ModelStatus(Enum):
    DRAFT = "draft"
    TRAINING = "training"
    VALIDATING = "validating"
    READY = "ready"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    FAILED = "failed"


class DatasetType(Enum):
    MEDICAL_IMAGES = "medical_images"
    LAB_RESULTS = "lab_results"
    PATIENT_RECORDS = "patient_records"
    GENOMIC_DATA = "genomic_data"
    VITAL_SIGNS = "vital_signs"
    PATHOLOGY = "pathology"
    RADIOLOGY = "radiology"
    TEXT_NOTES = "text_notes"


@dataclass
class ModelMetrics:
    accuracy: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1_score: float = 0.0
    auc_roc: float = 0.0
    specificity: float = 0.0
    sensitivity: float = 0.0
    loss: float = 0.0
    mae: float = 0.0
    rmse: float = 0.0
    confusion_matrix: Optional[List[List[int]]] = None
    class_report: Optional[Dict] = None

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ModelConfig:
    name: str
    version: str
    model_type: str
    architecture: str
    hyperparameters: Dict = field(default_factory=dict)
    input_shape: Optional[Tuple] = None
    output_classes: Optional[List[str]] = None
    preprocessing: Dict = field(default_factory=dict)
    training_config: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class TrainingJob:
    id: str
    model_id: str
    config: Dict
    status: str = "pending"
    progress: float = 0.0
    current_epoch: int = 0
    total_epochs: int = 100
    metrics: Dict = field(default_factory=dict)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None
    logs: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class InferenceRequest:
    id: str
    model_id: str
    input_data: Any
    preprocessing_steps: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class InferenceResult:
    request_id: str
    model_id: str
    predictions: Any
    confidence: float = 0.0
    probabilities: Optional[Dict] = None
    processing_time_ms: float = 0.0
    metadata: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


# ============================================================================
# PREPROCESSING PIPELINE
# ============================================================================
class PreprocessingPipeline:
    """Configurable data preprocessing pipeline for ML models."""

    def __init__(self):
        self.steps: List[Dict] = []
        self.fitted = False
        self.stats: Dict = {}

    def add_step(self, name: str, params: Optional[Dict] = None) -> "PreprocessingPipeline":
        self.steps.append({"name": name, "params": params or {}})
        return self

    async def fit(self, data: Any) -> "PreprocessingPipeline":
        """Fit preprocessing parameters from training data."""
        for step in self.steps:
            name = step["name"]

            if name == "normalize":
                # Calculate normalization stats
                if isinstance(data, list) and data and isinstance(data[0], dict):
                    for key in data[0].keys():
                        values = [row[key] for row in data if isinstance(row.get(key), (int, float))]
                        if values:
                            self.stats[f"{key}_mean"] = sum(values) / len(values)
                            self.stats[f"{key}_std"] = (
                                sum((v - self.stats[f"{key}_mean"]) ** 2 for v in values) / len(values)
                            ) ** 0.5

            elif name == "encode_labels":
                if isinstance(data, list):
                    if isinstance(data[0], dict):
                        label_field = step["params"].get("field", "label")
                        unique = sorted(set(row.get(label_field) for row in data if row.get(label_field)))
                        self.stats["label_encoding"] = {label: i for i, label in enumerate(unique)}
                    elif isinstance(data[0], str):
                        unique = sorted(set(data))
                        self.stats["label_encoding"] = {label: i for i, label in enumerate(unique)}

            elif name == "fill_missing":
                strategy = step["params"].get("strategy", "mean")
                if isinstance(data, list) and data and isinstance(data[0], dict):
                    for key in data[0].keys():
                        values = [row[key] for row in data if row.get(key) is not None and isinstance(row.get(key), (int, float))]
                        if values:
                            if strategy == "mean":
                                self.stats[f"{key}_fill"] = sum(values) / len(values)
                            elif strategy == "median":
                                sorted_vals = sorted(values)
                                mid = len(sorted_vals) // 2
                                self.stats[f"{key}_fill"] = sorted_vals[mid]
                            elif strategy == "zero":
                                self.stats[f"{key}_fill"] = 0

        self.fitted = True
        return self

    async def transform(self, data: Any) -> Any:
        """Apply preprocessing transformations."""
        if not self.fitted:
            raise ValueError("Pipeline must be fitted before transform")

        result = data

        for step in self.steps:
            name = step["name"]

            if name == "normalize" and isinstance(result, list):
                if result and isinstance(result[0], dict):
                    normalized = []
                    for row in result:
                        new_row = dict(row)
                        for key in row.keys():
                            mean_key = f"{key}_mean"
                            std_key = f"{key}_std"
                            if mean_key in self.stats and isinstance(row[key], (int, float)):
                                std = self.stats[std_key]
                                if std > 0:
                                    new_row[key] = (row[key] - self.stats[mean_key]) / std
                                else:
                                    new_row[key] = 0.0
                        normalized.append(new_row)
                    result = normalized

            elif name == "fill_missing" and isinstance(result, list):
                if result and isinstance(result[0], dict):
                    filled = []
                    for row in result:
                        new_row = dict(row)
                        for key in row.keys():
                            fill_key = f"{key}_fill"
                            if row[key] is None and fill_key in self.stats:
                                new_row[key] = self.stats[fill_key]
                        filled.append(new_row)
                    result = filled

            elif name == "encode_labels":
                encoding = self.stats.get("label_encoding", {})
                if encoding and isinstance(result, list):
                    if isinstance(result[0], str):
                        result = [encoding.get(v, -1) for v in result]
                    elif isinstance(result[0], dict):
                        label_field = step["params"].get("field", "label")
                        for row in result:
                            if label_field in row:
                                row[label_field] = encoding.get(row[label_field], -1)

            elif name == "remove_outliers" and isinstance(result, list):
                threshold = step["params"].get("threshold", 3.0)
                if result and isinstance(result[0], dict):
                    filtered = []
                    for row in result:
                        is_outlier = False
                        for key in row.keys():
                            mean_key = f"{key}_mean"
                            std_key = f"{key}_std"
                            if mean_key in self.stats and isinstance(row.get(key), (int, float)):
                                std = self.stats[std_key]
                                if std > 0:
                                    z_score = abs((row[key] - self.stats[mean_key]) / std)
                                    if z_score > threshold:
                                        is_outlier = True
                                        break
                        if not is_outlier:
                            filtered.append(row)
                    result = filtered

            elif name == "feature_selection":
                features = step["params"].get("features", [])
                if features and isinstance(result, list) and result and isinstance(result[0], dict):
                    result = [{k: v for k, v in row.items() if k in features} for row in result]

        return result

    async def fit_transform(self, data: Any) -> Any:
        await self.fit(data)
        return await self.transform(data)


# ============================================================================
# FEATURE ENGINEERING
# ============================================================================
class FeatureEngineering:
    """Automated feature engineering for medical data."""

    @staticmethod
    def extract_vital_features(vitals: List[Dict]) -> Dict:
        """Extract statistical features from vital signs time series."""
        features = {}

        vital_keys = ["heart_rate", "systolic_bp", "diastolic_bp", "temperature",
                       "spo2", "respiratory_rate"]

        for key in vital_keys:
            values = [v[key] for v in vitals if key in v and isinstance(v.get(key), (int, float))]
            if values:
                features[f"{key}_mean"] = sum(values) / len(values)
                features[f"{key}_min"] = min(values)
                features[f"{key}_max"] = max(values)
                features[f"{key}_range"] = max(values) - min(values)
                features[f"{key}_latest"] = values[-1]

                if len(values) >= 2:
                    features[f"{key}_trend"] = values[-1] - values[0]
                    # Variance
                    mean = features[f"{key}_mean"]
                    variance = sum((v - mean) ** 2 for v in values) / len(values)
                    features[f"{key}_std"] = variance ** 0.5
                    features[f"{key}_cv"] = features[f"{key}_std"] / mean if mean != 0 else 0

        return features

    @staticmethod
    def extract_lab_features(lab_results: List[Dict]) -> Dict:
        """Extract features from lab results."""
        features = {}

        for result in lab_results:
            test_name = result.get("test_name", "unknown").lower().replace(" ", "_")
            value = result.get("value")
            if isinstance(value, (int, float)):
                features[f"lab_{test_name}"] = value

                ref_min = result.get("ref_min")
                ref_max = result.get("ref_max")
                if isinstance(ref_min, (int, float)) and isinstance(ref_max, (int, float)):
                    ref_range = ref_max - ref_min
                    if ref_range > 0:
                        features[f"lab_{test_name}_normalized"] = (value - ref_min) / ref_range
                    features[f"lab_{test_name}_abnormal"] = 1 if (value < ref_min or value > ref_max) else 0

        return features

    @staticmethod
    def extract_demographic_features(patient: Dict) -> Dict:
        """Extract features from patient demographics."""
        features = {}

        if "date_of_birth" in patient:
            try:
                dob = datetime.strptime(patient["date_of_birth"][:10], "%Y-%m-%d")
                age = (datetime.utcnow() - dob).days / 365.25
                features["age"] = age
                features["age_group"] = (
                    "pediatric" if age < 18
                    else "young_adult" if age < 35
                    else "middle_aged" if age < 55
                    else "senior" if age < 75
                    else "elderly"
                )
            except (ValueError, TypeError):
                pass

        if "gender" in patient:
            gender = patient["gender"].lower()
            features["gender_male"] = 1 if gender == "male" else 0
            features["gender_female"] = 1 if gender == "female" else 0

        if "bmi" in patient:
            bmi = patient["bmi"]
            features["bmi"] = bmi
            features["bmi_category"] = (
                "underweight" if bmi < 18.5
                else "normal" if bmi < 25
                else "overweight" if bmi < 30
                else "obese"
            )

        if "smoking_status" in patient:
            features["smoker"] = 1 if patient["smoking_status"] in ("current", "former") else 0
            features["current_smoker"] = 1 if patient["smoking_status"] == "current" else 0

        return features

    @staticmethod
    def extract_medication_features(medications: List[Dict]) -> Dict:
        """Extract features from medication history."""
        features = {
            "total_medications": len(medications),
            "active_medications": len([m for m in medications if m.get("status") == "active"]),
        }

        categories = defaultdict(int)
        for med in medications:
            cat = med.get("category", "unknown")
            categories[cat] += 1

        for cat, count in categories.items():
            features[f"med_category_{cat.lower().replace(' ', '_')}"] = count

        return features

    @staticmethod
    def create_risk_features(patient_data: Dict) -> Dict:
        """Create composite risk features for cancer prediction."""
        features = {}

        # Family history risk
        family_history = patient_data.get("family_history", [])
        cancer_history = [
            h for h in family_history
            if "cancer" in str(h.get("condition", "")).lower()
        ]
        features["family_cancer_count"] = len(cancer_history)
        features["has_family_cancer"] = 1 if cancer_history else 0

        # Lifestyle risk score
        lifestyle_score = 0
        if patient_data.get("smoking_status") == "current":
            lifestyle_score += 3
        elif patient_data.get("smoking_status") == "former":
            lifestyle_score += 1
        if patient_data.get("alcohol_use") == "heavy":
            lifestyle_score += 2
        bmi = patient_data.get("bmi", 22)
        if bmi > 30:
            lifestyle_score += 2
        elif bmi > 25:
            lifestyle_score += 1
        features["lifestyle_risk_score"] = lifestyle_score

        # Previous screening results
        screenings = patient_data.get("screenings", [])
        abnormal_screenings = [
            s for s in screenings if s.get("result") in ("abnormal", "suspicious")
        ]
        features["abnormal_screening_count"] = len(abnormal_screenings)
        features["total_screenings"] = len(screenings)

        return features


# ============================================================================
# MODEL REGISTRY
# ============================================================================
class ModelRegistry:
    """Model versioning and lifecycle management."""

    def __init__(self, models_dir: str = "ai_models/saved_models"):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.registry: Dict[str, Dict] = {}
        self.deployments: Dict[str, str] = {}  # model_name -> version

    def register_model(
        self,
        name: str,
        version: str,
        config: Dict,
        metrics: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
    ) -> str:
        """Register a new model version."""
        model_id = f"{name}:{version}"

        self.registry[model_id] = {
            "id": model_id,
            "name": name,
            "version": version,
            "config": config,
            "metrics": metrics or {},
            "tags": tags or [],
            "status": ModelStatus.READY.value,
            "created_at": datetime.utcnow().isoformat(),
            "deployed": False,
        }

        logger.info(f"Model registered: {model_id}")
        return model_id

    def deploy_model(self, name: str, version: str) -> bool:
        """Deploy a specific model version."""
        model_id = f"{name}:{version}"
        if model_id not in self.registry:
            return False

        # Undeploy previous version
        if name in self.deployments:
            prev_id = f"{name}:{self.deployments[name]}"
            if prev_id in self.registry:
                self.registry[prev_id]["deployed"] = False
                self.registry[prev_id]["status"] = ModelStatus.READY.value

        self.deployments[name] = version
        self.registry[model_id]["deployed"] = True
        self.registry[model_id]["status"] = ModelStatus.DEPLOYED.value

        logger.info(f"Model deployed: {model_id}")
        return True

    def get_deployed_version(self, name: str) -> Optional[str]:
        return self.deployments.get(name)

    def get_model(self, name: str, version: Optional[str] = None) -> Optional[Dict]:
        if version is None:
            version = self.deployments.get(name)
        if version is None:
            return None
        return self.registry.get(f"{name}:{version}")

    def list_models(self, name: Optional[str] = None) -> List[Dict]:
        models = list(self.registry.values())
        if name:
            models = [m for m in models if m["name"] == name]
        return models

    def compare_models(self, model_ids: List[str]) -> List[Dict]:
        """Compare metrics across model versions."""
        comparisons = []
        for model_id in model_ids:
            model = self.registry.get(model_id)
            if model:
                comparisons.append({
                    "model_id": model_id,
                    "version": model["version"],
                    "metrics": model["metrics"],
                    "deployed": model["deployed"],
                })
        return comparisons


# ============================================================================
# ML PIPELINE SERVICE
# ============================================================================
class MLPipelineService:
    """Central ML pipeline orchestration service."""

    def __init__(self):
        self.registry = ModelRegistry()
        self.preprocessing = PreprocessingPipeline()
        self.feature_engineering = FeatureEngineering()
        self.training_jobs: Dict[str, TrainingJob] = {}
        self.inference_history: List[Dict] = []
        self.model_configs = self._load_model_configs()

    def _load_model_configs(self) -> Dict[str, ModelConfig]:
        """Load predefined model configurations."""
        return {
            "cancer_classifier": ModelConfig(
                name="cancer_classifier",
                version="1.0.0",
                model_type=ModelType.CLASSIFICATION.value,
                architecture="ensemble",
                hyperparameters={
                    "n_estimators": 100,
                    "max_depth": 10,
                    "learning_rate": 0.1,
                    "min_samples_split": 5,
                },
                output_classes=[
                    "benign", "malignant_stage_1", "malignant_stage_2",
                    "malignant_stage_3", "malignant_stage_4",
                ],
                preprocessing={
                    "normalize": True,
                    "fill_missing": "mean",
                    "feature_selection": True,
                },
                training_config={
                    "epochs": 100,
                    "batch_size": 32,
                    "validation_split": 0.2,
                    "early_stopping_patience": 10,
                },
            ),
            "medical_image_analyzer": ModelConfig(
                name="medical_image_analyzer",
                version="1.0.0",
                model_type=ModelType.CLASSIFICATION.value,
                architecture="cnn_resnet50",
                hyperparameters={
                    "learning_rate": 0.001,
                    "dropout": 0.5,
                    "weight_decay": 1e-4,
                },
                input_shape=(224, 224, 3),
                output_classes=[
                    "normal", "benign_tumor", "malignant_tumor",
                    "cyst", "calcification",
                ],
                preprocessing={
                    "resize": [224, 224],
                    "normalize": True,
                    "augmentation": {
                        "rotation": 15,
                        "flip_horizontal": True,
                        "brightness": 0.2,
                        "contrast": 0.2,
                    },
                },
                training_config={
                    "epochs": 50,
                    "batch_size": 16,
                    "optimizer": "adam",
                    "lr_scheduler": "cosine_annealing",
                },
            ),
            "risk_predictor": ModelConfig(
                name="risk_predictor",
                version="1.0.0",
                model_type=ModelType.REGRESSION.value,
                architecture="gradient_boosting",
                hyperparameters={
                    "n_estimators": 200,
                    "max_depth": 8,
                    "learning_rate": 0.05,
                    "subsample": 0.8,
                },
                output_classes=["low_risk", "moderate_risk", "high_risk", "critical_risk"],
                training_config={
                    "epochs": 150,
                    "early_stopping_patience": 15,
                    "cross_validation_folds": 5,
                },
            ),
            "symptom_analyzer": ModelConfig(
                name="symptom_analyzer",
                version="1.0.0",
                model_type=ModelType.NLP.value,
                architecture="transformer_bert",
                hyperparameters={
                    "max_sequence_length": 512,
                    "hidden_size": 768,
                    "num_attention_heads": 12,
                    "learning_rate": 2e-5,
                },
                output_classes=[
                    "respiratory", "cardiovascular", "neurological",
                    "gastrointestinal", "musculoskeletal", "dermatological",
                    "endocrine", "oncological",
                ],
                training_config={
                    "epochs": 10,
                    "batch_size": 8,
                    "warmup_steps": 100,
                },
            ),
            "survival_predictor": ModelConfig(
                name="survival_predictor",
                version="1.0.0",
                model_type=ModelType.TIME_SERIES.value,
                architecture="cox_proportional_hazards",
                hyperparameters={
                    "alpha": 0.1,
                    "l1_ratio": 0.5,
                    "max_iter": 1000,
                },
                training_config={
                    "cross_validation_folds": 5,
                    "bootstrap_samples": 100,
                },
            ),
            "anomaly_detector": ModelConfig(
                name="anomaly_detector",
                version="1.0.0",
                model_type=ModelType.ANOMALY_DETECTION.value,
                architecture="isolation_forest",
                hyperparameters={
                    "n_estimators": 100,
                    "contamination": 0.1,
                    "max_samples": "auto",
                },
            ),
            "drug_interaction": ModelConfig(
                name="drug_interaction",
                version="1.0.0",
                model_type=ModelType.CLASSIFICATION.value,
                architecture="graph_neural_network",
                hyperparameters={
                    "hidden_channels": 64,
                    "num_layers": 3,
                    "dropout": 0.3,
                },
                output_classes=[
                    "no_interaction", "minor", "moderate",
                    "major", "contraindicated",
                ],
            ),
            "treatment_recommender": ModelConfig(
                name="treatment_recommender",
                version="1.0.0",
                model_type=ModelType.RECOMMENDATION.value,
                architecture="collaborative_filtering",
                hyperparameters={
                    "n_factors": 50,
                    "regularization": 0.01,
                    "learning_rate": 0.005,
                },
            ),
        }

    async def create_training_job(
        self,
        model_name: str,
        dataset_config: Dict,
        custom_hyperparameters: Optional[Dict] = None,
    ) -> TrainingJob:
        """Create and queue a training job."""
        if model_name not in self.model_configs:
            raise ValueError(f"Unknown model: {model_name}")

        config = self.model_configs[model_name]
        if custom_hyperparameters:
            config.hyperparameters.update(custom_hyperparameters)

        job_id = str(uuid.uuid4())
        job = TrainingJob(
            id=job_id,
            model_id=model_name,
            config=config.to_dict(),
            total_epochs=config.training_config.get("epochs", 100),
        )

        self.training_jobs[job_id] = job
        logger.info(f"Training job created: {job_id} for model {model_name}")
        return job

    async def start_training(self, job_id: str) -> bool:
        """Start a training job (simulated)."""
        job = self.training_jobs.get(job_id)
        if not job:
            return False

        job.status = "training"
        job.started_at = datetime.utcnow().isoformat()
        job.logs.append(f"Training started at {job.started_at}")

        # Simulate training progress
        import random
        for epoch in range(1, min(job.total_epochs + 1, 6)):
            job.current_epoch = epoch
            job.progress = epoch / job.total_epochs * 100

            # Simulate metrics improving over epochs
            base_acc = 0.6 + (epoch / job.total_epochs) * 0.3
            job.metrics = {
                "epoch": epoch,
                "loss": max(0.1, 1.0 - (epoch / job.total_epochs) * 0.8 + random.uniform(-0.05, 0.05)),
                "accuracy": min(0.99, base_acc + random.uniform(-0.02, 0.02)),
                "val_loss": max(0.15, 1.1 - (epoch / job.total_epochs) * 0.7 + random.uniform(-0.05, 0.05)),
                "val_accuracy": min(0.98, base_acc - 0.02 + random.uniform(-0.02, 0.02)),
            }

            job.logs.append(
                f"Epoch {epoch}/{job.total_epochs} - "
                f"loss: {job.metrics['loss']:.4f} - "
                f"accuracy: {job.metrics['accuracy']:.4f} - "
                f"val_loss: {job.metrics['val_loss']:.4f} - "
                f"val_accuracy: {job.metrics['val_accuracy']:.4f}"
            )

        job.status = "completed"
        job.progress = 100.0
        job.completed_at = datetime.utcnow().isoformat()
        job.logs.append(f"Training completed at {job.completed_at}")

        # Register trained model
        self.registry.register_model(
            name=job.model_id,
            version=f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            config=job.config,
            metrics=job.metrics,
            tags=["auto-trained"],
        )

        return True

    async def run_inference(
        self,
        model_name: str,
        input_data: Any,
        version: Optional[str] = None,
    ) -> InferenceResult:
        """Run model inference."""
        start_time = time.time()

        model = self.registry.get_model(model_name, version)
        config = self.model_configs.get(model_name)

        request_id = str(uuid.uuid4())

        # Simulate inference
        import random

        if config and config.output_classes:
            num_classes = len(config.output_classes)
            probs = [random.random() for _ in range(num_classes)]
            total = sum(probs)
            probs = [p / total for p in probs]
            predicted_idx = probs.index(max(probs))

            result = InferenceResult(
                request_id=request_id,
                model_id=model_name,
                predictions=config.output_classes[predicted_idx],
                confidence=max(probs),
                probabilities={
                    config.output_classes[i]: round(probs[i], 4)
                    for i in range(num_classes)
                },
                processing_time_ms=round((time.time() - start_time) * 1000, 2),
            )
        else:
            result = InferenceResult(
                request_id=request_id,
                model_id=model_name,
                predictions=random.uniform(0, 1),
                confidence=random.uniform(0.7, 0.99),
                processing_time_ms=round((time.time() - start_time) * 1000, 2),
            )

        self.inference_history.append(result.to_dict())
        return result

    async def batch_inference(
        self,
        model_name: str,
        batch_data: List[Any],
        version: Optional[str] = None,
    ) -> List[InferenceResult]:
        """Run batch inference."""
        results = []
        for data in batch_data:
            result = await self.run_inference(model_name, data, version)
            results.append(result)
        return results

    def get_training_job(self, job_id: str) -> Optional[Dict]:
        job = self.training_jobs.get(job_id)
        return job.to_dict() if job else None

    def list_training_jobs(self, model_name: Optional[str] = None) -> List[Dict]:
        jobs = list(self.training_jobs.values())
        if model_name:
            jobs = [j for j in jobs if j.model_id == model_name]
        return [j.to_dict() for j in jobs]

    def get_available_models(self) -> List[Dict]:
        return [
            {
                "name": name,
                "type": config.model_type,
                "architecture": config.architecture,
                "version": config.version,
                "classes": config.output_classes,
            }
            for name, config in self.model_configs.items()
        ]

    def get_inference_stats(self) -> Dict:
        """Get inference performance stats."""
        if not self.inference_history:
            return {"total": 0}

        times = [r["processing_time_ms"] for r in self.inference_history]
        confidences = [r["confidence"] for r in self.inference_history]

        return {
            "total_inferences": len(self.inference_history),
            "avg_processing_time_ms": round(sum(times) / len(times), 2),
            "min_processing_time_ms": round(min(times), 2),
            "max_processing_time_ms": round(max(times), 2),
            "avg_confidence": round(sum(confidences) / len(confidences), 4),
            "models_used": list(set(r["model_id"] for r in self.inference_history)),
        }

    def get_pipeline_health(self) -> Dict:
        """Get overall ML pipeline health status."""
        active_jobs = [j for j in self.training_jobs.values() if j.status == "training"]
        failed_jobs = [j for j in self.training_jobs.values() if j.status == "failed"]
        deployed_models = [m for m in self.registry.registry.values() if m.get("deployed")]

        return {
            "status": "healthy" if not failed_jobs else "degraded",
            "registered_models": len(self.registry.registry),
            "deployed_models": len(deployed_models),
            "active_training_jobs": len(active_jobs),
            "failed_training_jobs": len(failed_jobs),
            "total_inferences": len(self.inference_history),
            "available_model_configs": len(self.model_configs),
        }


# ============================================================================
# SINGLETON INSTANCES
# ============================================================================
ml_pipeline = MLPipelineService()
feature_engineering = FeatureEngineering()

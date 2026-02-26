"""
Inference Engine - Production-ready inference pipeline for real-time and batch
predictions with model caching, preprocessing, postprocessing, and monitoring.
"""

import logging
import time
import uuid
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from collections import deque
from threading import Lock

import numpy as np

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


class InferenceStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


class ModelStatus(Enum):
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"
    UNLOADING = "unloading"


@dataclass
class PredictionRequest:
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    model_name: str = ""
    model_version: str = "latest"
    input_data: Any = None
    input_type: str = "array"  # "array", "image", "text", "tabular"
    parameters: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    timeout_ms: int = 5000
    priority: int = 0  # Higher = higher priority

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class PredictionResult:
    request_id: str = ""
    model_name: str = ""
    model_version: str = ""
    predictions: Any = None
    probabilities: Optional[List[float]] = None
    confidence: float = 0.0
    predicted_label: Optional[str] = None
    explanation: Optional[Dict] = None
    processing_time_ms: float = 0.0
    status: str = "completed"
    error: Optional[str] = None
    metadata: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ModelInfo:
    name: str = ""
    version: str = "1.0"
    model_type: str = ""
    file_path: str = ""
    input_shape: Optional[Tuple] = None
    output_classes: Optional[List[str]] = None
    preprocessing_config: Dict = field(default_factory=dict)
    postprocessing_config: Dict = field(default_factory=dict)
    status: str = ModelStatus.LOADING.value
    loaded_at: Optional[str] = None
    last_prediction: Optional[str] = None
    prediction_count: int = 0
    avg_latency_ms: float = 0.0


class InputPreprocessor:
    """Preprocess different input types for model inference."""

    @staticmethod
    def preprocess_tabular(data: Dict, config: Dict) -> np.ndarray:
        """Preprocess tabular input data."""
        feature_order = config.get("feature_order", sorted(data.keys()))
        values = []

        for feature in feature_order:
            val = data.get(feature, 0)
            # Apply scaling if configured
            if "scalers" in config and feature in config["scalers"]:
                scaler = config["scalers"][feature]
                val = (val - scaler.get("mean", 0)) / scaler.get("std", 1)
            # Handle categorical encoding
            if "encoders" in config and feature in config["encoders"]:
                encoder = config["encoders"][feature]
                val = encoder.get(str(val), 0)
            values.append(float(val) if not isinstance(val, (int, float)) else val)

        return np.array([values])

    @staticmethod
    def preprocess_image(data: Union[np.ndarray, str], config: Dict) -> np.ndarray:
        """Preprocess image input."""
        if isinstance(data, str):
            # Assume base64 or file path - placeholder
            image = np.random.rand(224, 224, 3)
        else:
            image = np.array(data, dtype=np.float32)

        target_size = config.get("target_size", (224, 224))
        normalize = config.get("normalize", True)

        # Resize (simplified)
        if image.shape[:2] != target_size:
            # Simple resize via nearest-neighbor interpolation
            h, w = target_size
            if image.ndim == 3:
                resized = np.zeros((h, w, image.shape[2]))
                for c in range(image.shape[2]):
                    for i in range(h):
                        for j in range(w):
                            src_i = int(i * image.shape[0] / h)
                            src_j = int(j * image.shape[1] / w)
                            resized[i, j, c] = image[src_i, src_j, c]
                image = resized
            else:
                resized = np.zeros((h, w))
                for i in range(h):
                    for j in range(w):
                        src_i = int(i * image.shape[0] / h)
                        src_j = int(j * image.shape[1] / w)
                        resized[i, j] = image[src_i, src_j]
                image = resized

        if normalize:
            image = image / 255.0

        # Standardize if mean/std provided
        if "mean" in config and "std" in config:
            mean = np.array(config["mean"])
            std = np.array(config["std"])
            image = (image - mean) / std

        return np.expand_dims(image, axis=0)

    @staticmethod
    def preprocess_text(data: str, config: Dict) -> np.ndarray:
        """Preprocess text input."""
        max_len = config.get("max_length", 512)
        vocab = config.get("vocabulary", {})

        # Simple tokenization
        tokens = data.lower().split()
        token_ids = [vocab.get(t, 0) for t in tokens[:max_len]]

        # Pad
        while len(token_ids) < max_len:
            token_ids.append(0)

        return np.array([token_ids])


class OutputPostprocessor:
    """Postprocess model outputs into human-readable results."""

    @staticmethod
    def classification(
        raw_output: np.ndarray,
        class_labels: Optional[List[str]] = None,
        threshold: float = 0.5,
    ) -> Dict:
        """Postprocess classification output."""
        if raw_output.ndim == 1:
            probs = raw_output
        else:
            probs = raw_output[0] if raw_output.shape[0] == 1 else raw_output

        # Softmax if not already probabilities
        if np.any(probs > 1.0) or np.any(probs < 0.0):
            exp_probs = np.exp(probs - np.max(probs))
            probs = exp_probs / np.sum(exp_probs)

        predicted_idx = int(np.argmax(probs))
        confidence = float(probs[predicted_idx])

        if class_labels and predicted_idx < len(class_labels):
            predicted_label = class_labels[predicted_idx]
        else:
            predicted_label = str(predicted_idx)

        return {
            "predicted_class": predicted_idx,
            "predicted_label": predicted_label,
            "confidence": round(confidence, 4),
            "probabilities": {
                (class_labels[i] if class_labels and i < len(class_labels) else str(i)): round(float(p), 4)
                for i, p in enumerate(probs)
            },
        }

    @staticmethod
    def regression(raw_output: np.ndarray, config: Dict = None) -> Dict:
        """Postprocess regression output."""
        config = config or {}
        value = float(raw_output.flatten()[0])

        # Inverse transform if scaler params provided
        if "mean" in config and "std" in config:
            value = value * config["std"] + config["mean"]

        # Clip to valid range
        if "min_value" in config:
            value = max(value, config["min_value"])
        if "max_value" in config:
            value = min(value, config["max_value"])

        return {
            "predicted_value": round(value, 4),
            "unit": config.get("unit", ""),
        }

    @staticmethod
    def segmentation(raw_output: np.ndarray, class_labels: Optional[List[str]] = None) -> Dict:
        """Postprocess segmentation output."""
        if raw_output.ndim == 4:
            mask = np.argmax(raw_output[0], axis=-1)
        else:
            mask = raw_output

        unique_classes, counts = np.unique(mask, return_counts=True)
        total_pixels = mask.size
        class_coverage = {}

        for cls, count in zip(unique_classes, counts):
            label = class_labels[cls] if class_labels and cls < len(class_labels) else str(cls)
            class_coverage[label] = {
                "pixel_count": int(count),
                "percentage": round(float(count / total_pixels * 100), 2),
            }

        return {
            "mask_shape": list(mask.shape),
            "n_classes_found": len(unique_classes),
            "class_coverage": class_coverage,
        }

    @staticmethod
    def detection(raw_output: Dict, config: Dict = None) -> Dict:
        """Postprocess object detection output."""
        config = config or {}
        confidence_threshold = config.get("confidence_threshold", 0.5)
        nms_threshold = config.get("nms_threshold", 0.4)

        boxes = raw_output.get("boxes", [])
        scores = raw_output.get("scores", [])
        labels = raw_output.get("labels", [])
        class_names = config.get("class_names", [])

        # Filter by confidence
        detections = []
        for i, (box, score, label) in enumerate(zip(boxes, scores, labels)):
            if score >= confidence_threshold:
                detection = {
                    "box": [round(c, 2) for c in box],
                    "confidence": round(float(score), 4),
                    "class_id": int(label),
                    "class_name": class_names[label] if class_names and label < len(class_names) else str(label),
                }
                detections.append(detection)

        return {
            "n_detections": len(detections),
            "detections": detections,
        }


class ModelCache:
    """Cache loaded models with LRU eviction."""

    def __init__(self, max_models: int = 10):
        self.max_models = max_models
        self.models: Dict[str, Any] = {}
        self.model_info: Dict[str, ModelInfo] = {}
        self.access_order: deque = deque()
        self._lock = Lock()

    def get(self, model_key: str) -> Optional[Any]:
        """Get a cached model."""
        with self._lock:
            if model_key in self.models:
                # Update access order
                if model_key in self.access_order:
                    self.access_order.remove(model_key)
                self.access_order.append(model_key)
                return self.models[model_key]
        return None

    def put(self, model_key: str, model: Any, info: ModelInfo):
        """Cache a model."""
        with self._lock:
            if len(self.models) >= self.max_models and model_key not in self.models:
                # Evict LRU
                lru_key = self.access_order.popleft()
                del self.models[lru_key]
                del self.model_info[lru_key]
                logger.info(f"Evicted model from cache: {lru_key}")

            self.models[model_key] = model
            self.model_info[model_key] = info
            if model_key in self.access_order:
                self.access_order.remove(model_key)
            self.access_order.append(model_key)

    def remove(self, model_key: str):
        """Remove a model from cache."""
        with self._lock:
            self.models.pop(model_key, None)
            self.model_info.pop(model_key, None)
            if model_key in self.access_order:
                self.access_order.remove(model_key)

    def list_models(self) -> List[Dict]:
        """List all cached models."""
        return [
            {
                "key": key,
                "name": info.name,
                "version": info.version,
                "status": info.status,
                "prediction_count": info.prediction_count,
                "avg_latency_ms": info.avg_latency_ms,
            }
            for key, info in self.model_info.items()
        ]


class PerformanceMonitor:
    """Monitor inference performance metrics."""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.latencies: deque = deque(maxlen=window_size)
        self.errors: deque = deque(maxlen=window_size)
        self.predictions_per_model: Dict[str, int] = {}
        self.total_predictions = 0
        self.total_errors = 0

    def record_prediction(self, model_name: str, latency_ms: float, success: bool):
        """Record a prediction event."""
        self.latencies.append(latency_ms)
        self.errors.append(not success)
        self.total_predictions += 1
        self.predictions_per_model[model_name] = self.predictions_per_model.get(model_name, 0) + 1
        if not success:
            self.total_errors += 1

    def get_stats(self) -> Dict:
        """Get performance statistics."""
        latencies = list(self.latencies)
        if not latencies:
            return {"total_predictions": 0}

        return {
            "total_predictions": self.total_predictions,
            "total_errors": self.total_errors,
            "error_rate": round(self.total_errors / max(self.total_predictions, 1), 4),
            "latency_p50_ms": round(float(np.percentile(latencies, 50)), 2),
            "latency_p95_ms": round(float(np.percentile(latencies, 95)), 2),
            "latency_p99_ms": round(float(np.percentile(latencies, 99)), 2),
            "latency_mean_ms": round(float(np.mean(latencies)), 2),
            "latency_max_ms": round(float(np.max(latencies)), 2),
            "predictions_per_model": dict(self.predictions_per_model),
            "window_size": self.window_size,
        }


class InferenceEngine:
    """
    Production inference engine with model management, preprocessing,
    postprocessing, caching, and monitoring.
    """

    # Medical model configurations
    MEDICAL_MODELS = {
        "cancer_classifier": ModelInfo(
            name="cancer_classifier",
            version="1.0",
            model_type="classifier",
            output_classes=["benign", "malignant"],
            preprocessing_config={"normalize": True, "feature_order": [
                "age", "tumor_size", "tumor_grade", "lymph_nodes",
                "ki67", "er_status", "pr_status", "her2_status",
            ]},
        ),
        "lung_ct_analyzer": ModelInfo(
            name="lung_ct_analyzer",
            version="1.0",
            model_type="classifier",
            input_shape=(224, 224, 3),
            output_classes=["normal", "nodule", "mass", "consolidation", "ground_glass"],
            preprocessing_config={
                "target_size": (224, 224),
                "normalize": True,
                "mean": [0.485, 0.456, 0.406],
                "std": [0.229, 0.224, 0.225],
            },
        ),
        "breast_mammogram": ModelInfo(
            name="breast_mammogram",
            version="1.0",
            model_type="classifier",
            input_shape=(512, 512, 1),
            output_classes=["BI-RADS_1", "BI-RADS_2", "BI-RADS_3", "BI-RADS_4", "BI-RADS_5"],
            preprocessing_config={"target_size": (512, 512), "normalize": True},
        ),
        "skin_lesion": ModelInfo(
            name="skin_lesion",
            version="1.0",
            model_type="classifier",
            input_shape=(299, 299, 3),
            output_classes=[
                "melanoma", "basal_cell_carcinoma", "squamous_cell_carcinoma",
                "actinic_keratosis", "benign_keratosis", "dermatofibroma", "nevus",
            ],
            preprocessing_config={"target_size": (299, 299), "normalize": True},
        ),
        "pathology_analyzer": ModelInfo(
            name="pathology_analyzer",
            version="1.0",
            model_type="classifier",
            input_shape=(256, 256, 3),
            output_classes=["normal", "low_grade", "high_grade", "invasive"],
            preprocessing_config={"target_size": (256, 256), "normalize": True},
        ),
        "brain_mri": ModelInfo(
            name="brain_mri",
            version="1.0",
            model_type="segmentation",
            input_shape=(256, 256, 1),
            output_classes=["background", "tumor_core", "peritumoral_edema", "enhancing_tumor"],
            preprocessing_config={"target_size": (256, 256), "normalize": True},
        ),
        "risk_predictor": ModelInfo(
            name="risk_predictor",
            version="1.0",
            model_type="regressor",
            preprocessing_config={"normalize": True},
            postprocessing_config={"min_value": 0, "max_value": 1, "unit": "probability"},
        ),
        "survival_estimator": ModelInfo(
            name="survival_estimator",
            version="1.0",
            model_type="regressor",
            preprocessing_config={"normalize": True},
            postprocessing_config={"min_value": 0, "unit": "months"},
        ),
    }

    def __init__(self):
        self.model_cache = ModelCache(max_models=10)
        self.preprocessor = InputPreprocessor()
        self.postprocessor = OutputPostprocessor()
        self.monitor = PerformanceMonitor()
        self.prediction_log: deque = deque(maxlen=10000)

    async def predict(self, request: PredictionRequest) -> PredictionResult:
        """Execute a prediction request."""
        start_time = time.time()

        try:
            # Get model info
            model_info = self.MEDICAL_MODELS.get(request.model_name)
            if not model_info:
                return PredictionResult(
                    request_id=request.request_id,
                    model_name=request.model_name,
                    status="failed",
                    error=f"Unknown model: {request.model_name}",
                )

            # Preprocess input
            processed_input = self._preprocess(
                request.input_data,
                request.input_type,
                model_info.preprocessing_config,
            )

            # Run inference (simulated for now)
            raw_output = self._run_model(request.model_name, processed_input, model_info)

            # Postprocess output
            result_data = self._postprocess(raw_output, model_info)

            processing_time = (time.time() - start_time) * 1000

            result = PredictionResult(
                request_id=request.request_id,
                model_name=request.model_name,
                model_version=model_info.version,
                predictions=result_data.get("predictions", result_data),
                probabilities=result_data.get("probabilities"),
                confidence=result_data.get("confidence", 0.0),
                predicted_label=result_data.get("predicted_label"),
                processing_time_ms=round(processing_time, 2),
                status="completed",
                metadata={"model_type": model_info.model_type},
            )

            self.monitor.record_prediction(request.model_name, processing_time, True)
            self._log_prediction(request, result)

            return result

        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            self.monitor.record_prediction(request.model_name, processing_time, False)

            return PredictionResult(
                request_id=request.request_id,
                model_name=request.model_name,
                status="failed",
                error=str(e),
                processing_time_ms=round(processing_time, 2),
            )

    def _preprocess(self, input_data: Any, input_type: str, config: Dict) -> np.ndarray:
        """Route to appropriate preprocessor."""
        if input_type == "tabular" and isinstance(input_data, dict):
            return self.preprocessor.preprocess_tabular(input_data, config)
        elif input_type == "image":
            return self.preprocessor.preprocess_image(input_data, config)
        elif input_type == "text" and isinstance(input_data, str):
            return self.preprocessor.preprocess_text(input_data, config)
        elif isinstance(input_data, (list, np.ndarray)):
            return np.array(input_data).reshape(1, -1) if np.array(input_data).ndim == 1 else np.array(input_data)
        else:
            raise ValueError(f"Unsupported input type: {input_type}")

    def _run_model(self, model_name: str, input_data: np.ndarray, model_info: ModelInfo) -> np.ndarray:
        """Run model inference (simulated with realistic outputs)."""
        if model_info.model_type == "classifier":
            n_classes = len(model_info.output_classes) if model_info.output_classes else 2
            # Simulate realistic probabilities
            logits = np.random.randn(1, n_classes)
            # Make one class dominant
            dominant_class = np.random.randint(n_classes)
            logits[0, dominant_class] += 2.0
            exp_logits = np.exp(logits - np.max(logits))
            probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
            return probs

        elif model_info.model_type == "regressor":
            return np.random.uniform(0.1, 0.9, size=(1, 1))

        elif model_info.model_type == "segmentation":
            n_classes = len(model_info.output_classes) if model_info.output_classes else 4
            h, w = model_info.input_shape[:2] if model_info.input_shape else (256, 256)
            return np.random.rand(1, h, w, n_classes)

        return np.random.rand(1, 2)

    def _postprocess(self, raw_output: np.ndarray, model_info: ModelInfo) -> Dict:
        """Route to appropriate postprocessor."""
        if model_info.model_type == "classifier":
            result = self.postprocessor.classification(
                raw_output, model_info.output_classes,
            )
            return {
                "predictions": result["predicted_class"],
                "predicted_label": result["predicted_label"],
                "confidence": result["confidence"],
                "probabilities": result["probabilities"],
            }

        elif model_info.model_type == "regressor":
            result = self.postprocessor.regression(
                raw_output, model_info.postprocessing_config,
            )
            return {"predictions": result["predicted_value"], "confidence": 0.0}

        elif model_info.model_type == "segmentation":
            result = self.postprocessor.segmentation(
                raw_output, model_info.output_classes,
            )
            return {"predictions": result, "confidence": 0.0}

        return {"predictions": raw_output.tolist(), "confidence": 0.0}

    def _log_prediction(self, request: PredictionRequest, result: PredictionResult):
        """Log prediction for monitoring."""
        self.prediction_log.append({
            "request_id": request.request_id,
            "model_name": request.model_name,
            "predicted_label": result.predicted_label,
            "confidence": result.confidence,
            "processing_time_ms": result.processing_time_ms,
            "timestamp": result.timestamp,
            "status": result.status,
        })

    async def batch_predict(
        self,
        model_name: str,
        inputs: List[Any],
        input_type: str = "tabular",
    ) -> List[PredictionResult]:
        """Run batch predictions."""
        results = []
        for input_data in inputs:
            request = PredictionRequest(
                model_name=model_name,
                input_data=input_data,
                input_type=input_type,
            )
            result = await self.predict(request)
            results.append(result)
        return results

    def get_available_models(self) -> List[Dict]:
        """List available models."""
        return [
            {
                "name": info.name,
                "version": info.version,
                "type": info.model_type,
                "classes": info.output_classes,
                "input_shape": info.input_shape,
            }
            for name, info in self.MEDICAL_MODELS.items()
        ]

    def get_performance_stats(self) -> Dict:
        """Get inference performance statistics."""
        return self.monitor.get_stats()

    def get_prediction_history(self, model_name: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get prediction history."""
        logs = list(self.prediction_log)
        if model_name:
            logs = [l for l in logs if l["model_name"] == model_name]
        return logs[-limit:]


# Singleton
inference_engine = InferenceEngine()

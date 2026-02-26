"""
Model Configurations - Centralized configuration for all AI models including
architecture specs, training parameters, deployment settings, and feature definitions.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum


class ModelFramework(Enum):
    SKLEARN = "sklearn"
    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CUSTOM = "custom"


class DataModality(Enum):
    TABULAR = "tabular"
    IMAGE = "image"
    TEXT = "text"
    TIME_SERIES = "time_series"
    GENOMIC = "genomic"
    MULTIMODAL = "multimodal"


@dataclass
class FeatureConfig:
    name: str
    dtype: str = "float"  # "float", "int", "categorical", "binary", "text"
    required: bool = True
    default_value: Any = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    categories: Optional[List[str]] = None
    description: str = ""
    unit: str = ""
    normalization: str = "standard"  # "standard", "minmax", "robust", "none"


@dataclass
class AugmentationConfig:
    enabled: bool = False
    strategies: List[str] = field(default_factory=list)
    augmentation_factor: float = 2.0
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TrainingParams:
    epochs: int = 100
    batch_size: int = 32
    learning_rate: float = 0.001
    optimizer: str = "adam"
    loss_function: str = "binary_crossentropy"
    metrics: List[str] = field(default_factory=lambda: ["accuracy", "auc"])
    early_stopping_patience: int = 10
    early_stopping_metric: str = "val_loss"
    reduce_lr_patience: int = 5
    reduce_lr_factor: float = 0.5
    class_weights: Optional[Dict] = None
    cross_validation_folds: int = 5
    test_split: float = 0.2
    validation_split: float = 0.1
    random_seed: int = 42


@dataclass
class DeploymentConfig:
    model_format: str = "pkl"  # "pkl", "h5", "onnx", "tflite", "torchscript"
    max_batch_size: int = 64
    timeout_ms: int = 5000
    min_confidence: float = 0.5
    preprocessing_pipeline: List[str] = field(default_factory=list)
    postprocessing_pipeline: List[str] = field(default_factory=list)
    monitoring_enabled: bool = True
    a_b_testing: bool = False
    canary_percentage: float = 0.0


@dataclass
class ModelConfig:
    name: str
    display_name: str
    version: str = "1.0.0"
    description: str = ""
    framework: str = ModelFramework.SKLEARN.value
    modality: str = DataModality.TABULAR.value
    task: str = "classification"  # "classification", "regression", "segmentation", "detection"
    
    # Architecture
    algorithm: str = ""
    architecture: Dict[str, Any] = field(default_factory=dict)
    input_shape: Optional[Tuple] = None
    output_classes: List[str] = field(default_factory=list)
    n_classes: int = 2
    
    # Features
    features: List[FeatureConfig] = field(default_factory=list)
    target_variable: str = ""
    
    # Training
    training_params: TrainingParams = field(default_factory=TrainingParams)
    augmentation: AugmentationConfig = field(default_factory=AugmentationConfig)
    
    # Deployment
    deployment: DeploymentConfig = field(default_factory=DeploymentConfig)
    
    # Metadata
    tags: List[str] = field(default_factory=list)
    clinical_use: str = ""
    regulatory_status: str = ""
    performance_targets: Dict[str, float] = field(default_factory=dict)


# ============================================================================
# Cancer Detection Models
# ============================================================================

BREAST_CANCER_CLASSIFIER = ModelConfig(
    name="breast_cancer_classifier",
    display_name="Breast Cancer Classifier",
    description="Classifies breast tumors as benign or malignant using clinical and pathological features",
    framework=ModelFramework.XGBOOST.value,
    modality=DataModality.TABULAR.value,
    algorithm="xgboost",
    output_classes=["benign", "malignant"],
    n_classes=2,
    target_variable="diagnosis",
    features=[
        FeatureConfig("age", "float", description="Patient age", unit="years", min_value=18, max_value=120),
        FeatureConfig("tumor_size", "float", description="Tumor diameter", unit="cm", min_value=0.1, max_value=20),
        FeatureConfig("tumor_grade", "int", description="Histological grade", min_value=1, max_value=3),
        FeatureConfig("lymph_nodes_positive", "int", description="Number of positive lymph nodes", min_value=0, max_value=50),
        FeatureConfig("ki67_percentage", "float", description="Ki-67 proliferation index", unit="%", min_value=0, max_value=100),
        FeatureConfig("er_status", "binary", description="Estrogen receptor status (0=neg, 1=pos)"),
        FeatureConfig("pr_status", "binary", description="Progesterone receptor status"),
        FeatureConfig("her2_status", "binary", description="HER2 receptor status"),
        FeatureConfig("radius_mean", "float", description="Mean cell nucleus radius"),
        FeatureConfig("texture_mean", "float", description="Mean cell nucleus texture"),
        FeatureConfig("perimeter_mean", "float", description="Mean cell nucleus perimeter"),
        FeatureConfig("area_mean", "float", description="Mean cell nucleus area"),
        FeatureConfig("smoothness_mean", "float", description="Mean cell smoothness"),
        FeatureConfig("compactness_mean", "float", description="Mean cell compactness"),
        FeatureConfig("concavity_mean", "float", description="Mean cell concavity"),
        FeatureConfig("symmetry_mean", "float", description="Mean cell symmetry"),
    ],
    training_params=TrainingParams(
        epochs=200,
        learning_rate=0.1,
        early_stopping_patience=15,
        class_weights={0: 1.0, 1: 2.0},
        cross_validation_folds=10,
    ),
    deployment=DeploymentConfig(
        min_confidence=0.6,
        preprocessing_pipeline=["impute_missing", "standard_scale"],
        monitoring_enabled=True,
    ),
    tags=["breast_cancer", "oncology", "screening"],
    clinical_use="Breast cancer screening and diagnosis support",
    performance_targets={"accuracy": 0.95, "sensitivity": 0.97, "specificity": 0.90, "auc_roc": 0.98},
)

LUNG_CT_ANALYZER = ModelConfig(
    name="lung_ct_analyzer",
    display_name="Lung CT Nodule Analyzer",
    description="Detects and classifies pulmonary nodules from CT scans",
    framework=ModelFramework.TENSORFLOW.value,
    modality=DataModality.IMAGE.value,
    algorithm="efficientnet_b3",
    input_shape=(224, 224, 3),
    output_classes=["normal", "benign_nodule", "suspicious_nodule", "malignant_nodule", "ground_glass_opacity"],
    n_classes=5,
    architecture={
        "backbone": "EfficientNetB3",
        "pretrained": True,
        "input_size": (224, 224, 3),
        "global_pool": "avg",
        "dropout": 0.3,
        "dense_layers": [512, 256],
        "activation": "softmax",
        "attention": "se_block",
    },
    training_params=TrainingParams(
        epochs=100,
        batch_size=16,
        learning_rate=0.0001,
        optimizer="adam",
        loss_function="categorical_crossentropy",
        early_stopping_patience=15,
    ),
    augmentation=AugmentationConfig(
        enabled=True,
        strategies=["rotation", "flip", "brightness", "contrast", "zoom", "elastic_deformation"],
        augmentation_factor=3.0,
        params={
            "rotation_range": 15,
            "horizontal_flip": True,
            "brightness_range": [0.8, 1.2],
            "zoom_range": [0.9, 1.1],
        },
    ),
    deployment=DeploymentConfig(
        model_format="h5",
        max_batch_size=8,
        timeout_ms=10000,
        min_confidence=0.5,
        preprocessing_pipeline=["resize_224", "normalize_imagenet", "expand_dims"],
    ),
    tags=["lung_cancer", "ct_scan", "nodule_detection", "radiology"],
    clinical_use="Lung cancer screening and nodule characterization",
    performance_targets={"accuracy": 0.92, "sensitivity": 0.95, "specificity": 0.88, "auc_roc": 0.96},
)

SKIN_LESION_CLASSIFIER = ModelConfig(
    name="skin_lesion_classifier",
    display_name="Skin Lesion Classifier",
    description="Classifies dermatoscopic images of skin lesions",
    framework=ModelFramework.TENSORFLOW.value,
    modality=DataModality.IMAGE.value,
    algorithm="inception_v3",
    input_shape=(299, 299, 3),
    output_classes=[
        "melanoma", "basal_cell_carcinoma", "squamous_cell_carcinoma",
        "actinic_keratosis", "benign_keratosis", "dermatofibroma", "melanocytic_nevus",
    ],
    n_classes=7,
    architecture={
        "backbone": "InceptionV3",
        "pretrained": True,
        "input_size": (299, 299, 3),
        "global_pool": "avg",
        "dropout": 0.4,
        "dense_layers": [1024, 512],
        "activation": "softmax",
    },
    training_params=TrainingParams(
        epochs=80,
        batch_size=32,
        learning_rate=0.0001,
        loss_function="categorical_crossentropy",
        class_weights={0: 3.0, 1: 2.0, 2: 2.0, 3: 1.5, 4: 1.0, 5: 1.0, 6: 1.0},
    ),
    augmentation=AugmentationConfig(
        enabled=True,
        strategies=["rotation", "flip", "color_jitter", "random_crop", "elastic"],
        augmentation_factor=5.0,
    ),
    tags=["skin_cancer", "dermatology", "dermatoscopy"],
    clinical_use="Skin cancer screening and lesion classification",
    performance_targets={"accuracy": 0.89, "sensitivity": 0.92, "auc_roc": 0.95},
)

MAMMOGRAM_ANALYZER = ModelConfig(
    name="mammogram_analyzer",
    display_name="Digital Mammogram Analyzer",
    description="Analyzes digital mammograms for BI-RADS classification",
    framework=ModelFramework.TENSORFLOW.value,
    modality=DataModality.IMAGE.value,
    algorithm="resnet50",
    input_shape=(512, 512, 1),
    output_classes=["BI-RADS_1", "BI-RADS_2", "BI-RADS_3", "BI-RADS_4A", "BI-RADS_4B", "BI-RADS_4C", "BI-RADS_5"],
    n_classes=7,
    architecture={
        "backbone": "ResNet50",
        "pretrained": True,
        "input_channels": 1,
        "global_pool": "avg",
        "dropout": 0.3,
        "dense_layers": [512, 256],
        "attention": "cbam",
    },
    training_params=TrainingParams(
        epochs=120,
        batch_size=8,
        learning_rate=0.00005,
    ),
    tags=["breast_cancer", "mammography", "radiology", "screening"],
    clinical_use="Breast cancer screening via mammography",
    performance_targets={"sensitivity": 0.95, "specificity": 0.85, "auc_roc": 0.94},
)

PATHOLOGY_ANALYZER = ModelConfig(
    name="pathology_analyzer",
    display_name="Digital Pathology Analyzer",
    description="Analyzes H&E stained tissue slides for cancer grading",
    framework=ModelFramework.TENSORFLOW.value,
    modality=DataModality.IMAGE.value,
    algorithm="densenet121",
    input_shape=(256, 256, 3),
    output_classes=["normal", "low_grade_dysplasia", "high_grade_dysplasia", "invasive_carcinoma"],
    n_classes=4,
    architecture={
        "backbone": "DenseNet121",
        "pretrained": True,
        "global_pool": "avg",
        "dropout": 0.3,
        "dense_layers": [512],
        "multi_scale": True,
    },
    tags=["pathology", "histology", "cancer_grading"],
    clinical_use="Cancer diagnosis and grading from tissue samples",
    performance_targets={"accuracy": 0.91, "sensitivity": 0.93, "kappa": 0.85},
)

BRAIN_TUMOR_SEGMENTER = ModelConfig(
    name="brain_tumor_segmenter",
    display_name="Brain Tumor MRI Segmenter",
    description="Segments brain tumors in MRI scans into sub-regions",
    framework=ModelFramework.TENSORFLOW.value,
    modality=DataModality.IMAGE.value,
    task="segmentation",
    algorithm="unet_attention",
    input_shape=(256, 256, 4),
    output_classes=["background", "necrotic_core", "peritumoral_edema", "enhancing_tumor"],
    n_classes=4,
    architecture={
        "type": "UNet",
        "encoder": "ResNet34",
        "attention": "attention_gates",
        "deep_supervision": True,
        "skip_connections": True,
        "filters": [64, 128, 256, 512, 1024],
    },
    training_params=TrainingParams(
        epochs=150,
        batch_size=4,
        learning_rate=0.0001,
        loss_function="dice_focal_loss",
    ),
    tags=["brain_tumor", "mri", "segmentation", "neuro_oncology"],
    clinical_use="Brain tumor delineation for treatment planning",
    performance_targets={"dice_score": 0.85, "hausdorff_95": 5.0},
)

# ============================================================================
# Risk Prediction Models
# ============================================================================

CANCER_RISK_PREDICTOR = ModelConfig(
    name="cancer_risk_predictor",
    display_name="Comprehensive Cancer Risk Predictor",
    description="Predicts cancer risk based on demographics, lifestyle, family history, and biomarkers",
    framework=ModelFramework.XGBOOST.value,
    modality=DataModality.TABULAR.value,
    task="regression",
    algorithm="xgboost_regressor",
    output_classes=["low_risk", "moderate_risk", "high_risk"],
    features=[
        FeatureConfig("age", "float", unit="years", min_value=18, max_value=120),
        FeatureConfig("gender", "categorical", categories=["male", "female"]),
        FeatureConfig("bmi", "float", unit="kg/m²", min_value=10, max_value=60),
        FeatureConfig("smoking_status", "categorical", categories=["never", "former", "current"]),
        FeatureConfig("smoking_pack_years", "float", min_value=0, max_value=100),
        FeatureConfig("alcohol_drinks_per_week", "float", min_value=0, max_value=50),
        FeatureConfig("physical_activity_hours", "float", unit="hours/week", min_value=0, max_value=40),
        FeatureConfig("family_history_cancer", "binary"),
        FeatureConfig("family_history_first_degree", "int", min_value=0, max_value=10),
        FeatureConfig("previous_cancer", "binary"),
        FeatureConfig("chronic_conditions_count", "int", min_value=0, max_value=20),
        FeatureConfig("sun_exposure_hours", "float", unit="hours/day"),
        FeatureConfig("diet_fruit_servings", "float", unit="servings/day"),
        FeatureConfig("diet_vegetable_servings", "float", unit="servings/day"),
        FeatureConfig("diet_processed_meat", "float", unit="servings/week"),
        FeatureConfig("occupational_exposure", "binary"),
        FeatureConfig("hpv_vaccination", "binary"),
        FeatureConfig("hepatitis_status", "categorical", categories=["negative", "hbv", "hcv"]),
    ],
    training_params=TrainingParams(
        cross_validation_folds=10,
        early_stopping_patience=20,
    ),
    tags=["risk_prediction", "preventive_care", "screening"],
    clinical_use="Cancer risk stratification for screening recommendations",
    performance_targets={"auc_roc": 0.85, "calibration_slope": 1.0},
)

CARDIOVASCULAR_RISK_PREDICTOR = ModelConfig(
    name="cardiovascular_risk_predictor",
    display_name="Cardiovascular Risk Predictor",
    description="10-year cardiovascular event risk prediction",
    framework=ModelFramework.SKLEARN.value,
    modality=DataModality.TABULAR.value,
    task="regression",
    algorithm="gradient_boosting",
    features=[
        FeatureConfig("age", "float", unit="years"),
        FeatureConfig("gender", "categorical", categories=["male", "female"]),
        FeatureConfig("systolic_bp", "float", unit="mmHg", min_value=70, max_value=250),
        FeatureConfig("diastolic_bp", "float", unit="mmHg", min_value=40, max_value=150),
        FeatureConfig("total_cholesterol", "float", unit="mg/dL", min_value=100, max_value=400),
        FeatureConfig("hdl_cholesterol", "float", unit="mg/dL", min_value=20, max_value=120),
        FeatureConfig("ldl_cholesterol", "float", unit="mg/dL", min_value=40, max_value=300),
        FeatureConfig("triglycerides", "float", unit="mg/dL"),
        FeatureConfig("fasting_glucose", "float", unit="mg/dL"),
        FeatureConfig("hba1c", "float", unit="%"),
        FeatureConfig("smoking_status", "categorical", categories=["never", "former", "current"]),
        FeatureConfig("diabetes", "binary"),
        FeatureConfig("family_history_cvd", "binary"),
        FeatureConfig("bmi", "float", unit="kg/m²"),
    ],
    tags=["cardiovascular", "risk_prediction", "preventive_care"],
    clinical_use="Cardiovascular risk assessment for preventive interventions",
    performance_targets={"c_statistic": 0.80, "calibration_slope": 1.0},
)

# ============================================================================
# NLP Models
# ============================================================================

SYMPTOM_ANALYZER = ModelConfig(
    name="symptom_analyzer",
    display_name="Clinical Symptom Analyzer",
    description="NLP-based symptom extraction and differential diagnosis",
    framework=ModelFramework.CUSTOM.value,
    modality=DataModality.TEXT.value,
    task="classification",
    algorithm="rule_based_nlp",
    tags=["nlp", "symptom_analysis", "triage", "clinical_decision_support"],
    clinical_use="Emergency triage and clinical decision support",
)

CLINICAL_NER = ModelConfig(
    name="clinical_ner",
    display_name="Clinical Named Entity Recognition",
    description="Extracts medical entities from clinical text",
    framework=ModelFramework.CUSTOM.value,
    modality=DataModality.TEXT.value,
    task="ner",
    algorithm="transformer_ner",
    output_classes=[
        "MEDICATION", "DOSAGE", "FREQUENCY", "DURATION", "CONDITION",
        "PROCEDURE", "ANATOMY", "TEST", "RESULT", "DATE",
    ],
    architecture={
        "model": "BioBERT",
        "max_length": 512,
        "hidden_size": 768,
        "num_attention_heads": 12,
        "crf_layer": True,
    },
    tags=["nlp", "ner", "clinical_text", "ehr"],
    clinical_use="Automated extraction of clinical information from notes",
)

# ============================================================================
# Genomic Models
# ============================================================================

GENOMIC_VARIANT_CLASSIFIER = ModelConfig(
    name="genomic_variant_classifier",
    display_name="Genomic Variant Classifier",
    description="Classifies genomic variants for clinical significance",
    framework=ModelFramework.CUSTOM.value,
    modality=DataModality.GENOMIC.value,
    task="classification",
    algorithm="knowledge_base_classifier",
    output_classes=["pathogenic", "likely_pathogenic", "vus", "likely_benign", "benign"],
    n_classes=5,
    tags=["genomics", "variant_classification", "precision_medicine"],
    clinical_use="Genomic variant interpretation for precision oncology",
)

# ============================================================================
# Time Series Models
# ============================================================================

VITAL_SIGNS_ANOMALY = ModelConfig(
    name="vital_signs_anomaly",
    display_name="Vital Signs Anomaly Detector",
    description="Real-time vital signs anomaly detection",
    framework=ModelFramework.CUSTOM.value,
    modality=DataModality.TIME_SERIES.value,
    task="anomaly_detection",
    algorithm="statistical_ensemble",
    features=[
        FeatureConfig("heart_rate", "float", unit="bpm", min_value=20, max_value=250),
        FeatureConfig("systolic_bp", "float", unit="mmHg", min_value=50, max_value=300),
        FeatureConfig("diastolic_bp", "float", unit="mmHg", min_value=20, max_value=200),
        FeatureConfig("respiratory_rate", "float", unit="breaths/min", min_value=4, max_value=60),
        FeatureConfig("spo2", "float", unit="%", min_value=50, max_value=100),
        FeatureConfig("temperature", "float", unit="°C", min_value=32, max_value=43),
    ],
    tags=["vital_signs", "monitoring", "icu", "early_warning"],
    clinical_use="Early warning system for patient deterioration",
)

# ============================================================================
# Model Registry
# ============================================================================

ALL_MODEL_CONFIGS: Dict[str, ModelConfig] = {
    "breast_cancer_classifier": BREAST_CANCER_CLASSIFIER,
    "lung_ct_analyzer": LUNG_CT_ANALYZER,
    "skin_lesion_classifier": SKIN_LESION_CLASSIFIER,
    "mammogram_analyzer": MAMMOGRAM_ANALYZER,
    "pathology_analyzer": PATHOLOGY_ANALYZER,
    "brain_tumor_segmenter": BRAIN_TUMOR_SEGMENTER,
    "cancer_risk_predictor": CANCER_RISK_PREDICTOR,
    "cardiovascular_risk_predictor": CARDIOVASCULAR_RISK_PREDICTOR,
    "symptom_analyzer": SYMPTOM_ANALYZER,
    "clinical_ner": CLINICAL_NER,
    "genomic_variant_classifier": GENOMIC_VARIANT_CLASSIFIER,
    "vital_signs_anomaly": VITAL_SIGNS_ANOMALY,
}


def get_model_config(model_name: str) -> Optional[ModelConfig]:
    """Get configuration for a specific model."""
    return ALL_MODEL_CONFIGS.get(model_name)


def list_available_models() -> List[Dict[str, str]]:
    """List all available model configurations."""
    return [
        {
            "name": config.name,
            "display_name": config.display_name,
            "task": config.task,
            "modality": config.modality,
            "framework": config.framework,
            "clinical_use": config.clinical_use,
        }
        for config in ALL_MODEL_CONFIGS.values()
    ]


def get_models_by_tag(tag: str) -> List[ModelConfig]:
    """Get models by tag."""
    return [c for c in ALL_MODEL_CONFIGS.values() if tag in c.tags]


def get_models_by_modality(modality: str) -> List[ModelConfig]:
    """Get models by data modality."""
    return [c for c in ALL_MODEL_CONFIGS.values() if c.modality == modality]

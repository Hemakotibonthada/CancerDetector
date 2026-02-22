"""
Application Configuration Module
================================

Centralized configuration management using Pydantic Settings.
Supports environment-based configuration with .env files.
"""

from __future__ import annotations

import os
import secrets
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

from pydantic import (
    AnyHttpUrl,
    EmailStr,
    Field,
    PostgresDsn,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


# ============================================================================
# Constants
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
AI_MODELS_DIR = PROJECT_DIR / "ai_models"
DATA_DIR = PROJECT_DIR / "data"
LOGS_DIR = PROJECT_DIR / "logs"
UPLOADS_DIR = PROJECT_DIR / "uploads"
EXPORTS_DIR = PROJECT_DIR / "exports"
TEMP_DIR = PROJECT_DIR / "temp"


class EnvironmentType(str, Enum):
    """Application environment types."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class LogLevel(str, Enum):
    """Logging levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


# ============================================================================
# Database Configuration
# ============================================================================

class DatabaseSettings(BaseSettings):
    """Database connection configuration."""
    
    model_config = SettingsConfigDict(env_prefix="DB_")
    
    host: str = Field(default="localhost", description="Database host")
    port: int = Field(default=5432, description="Database port")
    user: str = Field(default="cancerguard", description="Database user")
    password: str = Field(default="cancerguard_secret", description="Database password")
    name: str = Field(default="cancerguard_db", description="Database name")
    echo: bool = Field(default=False, description="Echo SQL queries")
    pool_size: int = Field(default=20, description="Connection pool size")
    max_overflow: int = Field(default=30, description="Max overflow connections")
    pool_timeout: int = Field(default=30, description="Pool timeout in seconds")
    pool_recycle: int = Field(default=1800, description="Pool recycle time in seconds")
    pool_pre_ping: bool = Field(default=True, description="Pre-ping connections")
    
    # SQLite fallback for development
    use_sqlite: bool = Field(default=True, description="Use SQLite for development")
    sqlite_path: str = Field(
        default=str(PROJECT_DIR / "cancerguard.db"),
        description="SQLite database path"
    )
    
    @property
    def database_url(self) -> str:
        """Generate database URL."""
        if self.use_sqlite:
            return f"sqlite+aiosqlite:///{self.sqlite_path}"
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
        )
    
    @property
    def sync_database_url(self) -> str:
        """Generate synchronous database URL."""
        if self.use_sqlite:
            return f"sqlite:///{self.sqlite_path}"
        return (
            f"postgresql://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
        )


# ============================================================================
# Redis Configuration
# ============================================================================

class RedisSettings(BaseSettings):
    """Redis cache configuration."""
    
    model_config = SettingsConfigDict(env_prefix="REDIS_")
    
    host: str = Field(default="localhost", description="Redis host")
    port: int = Field(default=6379, description="Redis port")
    db: int = Field(default=0, description="Redis database number")
    password: Optional[str] = Field(default=None, description="Redis password")
    max_connections: int = Field(default=50, description="Max connections")
    socket_timeout: int = Field(default=5, description="Socket timeout")
    socket_connect_timeout: int = Field(default=5, description="Connection timeout")
    retry_on_timeout: bool = Field(default=True, description="Retry on timeout")
    enabled: bool = Field(default=False, description="Enable Redis caching")
    
    @property
    def redis_url(self) -> str:
        """Generate Redis URL."""
        if self.password:
            return f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"


# ============================================================================
# JWT Authentication Configuration
# ============================================================================

class AuthSettings(BaseSettings):
    """Authentication and JWT configuration."""
    
    model_config = SettingsConfigDict(env_prefix="AUTH_")
    
    secret_key: str = Field(
        default_factory=lambda: secrets.token_urlsafe(64),
        description="JWT secret key"
    )
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=60, description="Access token expiry in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=30, description="Refresh token expiry in days"
    )
    password_min_length: int = Field(default=8, description="Minimum password length")
    password_max_length: int = Field(default=128, description="Maximum password length")
    max_login_attempts: int = Field(default=5, description="Max login attempts")
    lockout_duration_minutes: int = Field(default=30, description="Account lockout duration")
    require_email_verification: bool = Field(default=False, description="Require email verification")
    two_factor_enabled: bool = Field(default=False, description="Enable 2FA")
    session_timeout_minutes: int = Field(default=120, description="Session timeout")
    
    # OAuth2 Settings
    google_client_id: Optional[str] = Field(default=None, description="Google OAuth client ID")
    google_client_secret: Optional[str] = Field(default=None, description="Google OAuth secret")
    
    # Health ID Settings
    health_id_prefix: str = Field(default="CG", description="Health ID prefix")
    health_id_length: int = Field(default=12, description="Health ID length")


# ============================================================================
# AI/ML Model Configuration
# ============================================================================

class AIModelSettings(BaseSettings):
    """AI/ML model configuration."""
    
    model_config = SettingsConfigDict(env_prefix="AI_")
    
    models_dir: str = Field(
        default=str(AI_MODELS_DIR / "saved_models"),
        description="Saved models directory"
    )
    data_dir: str = Field(
        default=str(DATA_DIR),
        description="Training data directory"
    )
    batch_size: int = Field(default=32, description="Training batch size")
    epochs: int = Field(default=100, description="Training epochs")
    learning_rate: float = Field(default=0.001, description="Learning rate")
    early_stopping_patience: int = Field(default=10, description="Early stopping patience")
    validation_split: float = Field(default=0.2, description="Validation split ratio")
    test_split: float = Field(default=0.1, description="Test split ratio")
    random_seed: int = Field(default=42, description="Random seed for reproducibility")
    
    # Model Selection
    use_ensemble: bool = Field(default=True, description="Use ensemble model")
    ensemble_models: List[str] = Field(
        default=["xgboost", "lightgbm", "random_forest", "neural_network"],
        description="Models to include in ensemble"
    )
    ensemble_voting: str = Field(default="soft", description="Ensemble voting method")
    
    # Cancer Detection Thresholds
    cancer_risk_low_threshold: float = Field(default=0.3, description="Low risk threshold")
    cancer_risk_medium_threshold: float = Field(default=0.6, description="Medium risk threshold")
    cancer_risk_high_threshold: float = Field(default=0.8, description="High risk threshold")
    cancer_risk_critical_threshold: float = Field(default=0.95, description="Critical risk threshold")
    
    # Smartwatch Data Processing
    smartwatch_window_size: int = Field(default=60, description="Smartwatch data window (minutes)")
    smartwatch_sampling_rate: float = Field(default=1.0, description="Sampling rate (Hz)")
    anomaly_detection_sensitivity: float = Field(default=0.85, description="Anomaly detection sensitivity")
    
    # Blood Sample Analysis
    blood_biomarker_features: List[str] = Field(
        default=[
            "wbc_count", "rbc_count", "hemoglobin", "hematocrit", "platelets",
            "neutrophils", "lymphocytes", "monocytes", "eosinophils", "basophils",
            "cea", "ca125", "ca199", "afp", "psa", "ca153", "cyfra211",
            "nse", "scc", "ferritin", "ldh", "alkaline_phosphatase",
            "alt", "ast", "bilirubin", "albumin", "total_protein",
            "creatinine", "bun", "glucose", "hba1c", "cholesterol",
            "triglycerides", "hdl", "ldl", "crp", "esr", "d_dimer",
            "fibrinogen", "prothrombin_time", "aptt", "vitamin_d",
            "vitamin_b12", "folate", "iron", "tibc", "transferrin_saturation"
        ],
        description="Blood biomarker features for analysis"
    )
    
    # Feature Importance
    top_features_count: int = Field(default=20, description="Top features to track")
    feature_importance_method: str = Field(default="shap", description="Feature importance method")
    
    # Model Performance Metrics
    min_accuracy: float = Field(default=0.85, description="Minimum acceptable accuracy")
    min_auc_roc: float = Field(default=0.90, description="Minimum AUC-ROC score")
    min_sensitivity: float = Field(default=0.92, description="Minimum sensitivity (recall)")
    min_specificity: float = Field(default=0.88, description="Minimum specificity")


# ============================================================================
# Email Configuration
# ============================================================================

class EmailSettings(BaseSettings):
    """Email service configuration."""
    
    model_config = SettingsConfigDict(env_prefix="EMAIL_")
    
    smtp_host: str = Field(default="smtp.gmail.com", description="SMTP host")
    smtp_port: int = Field(default=587, description="SMTP port")
    smtp_user: Optional[str] = Field(default=None, description="SMTP username")
    smtp_password: Optional[str] = Field(default=None, description="SMTP password")
    from_email: str = Field(default="noreply@cancerguard.ai", description="From email")
    from_name: str = Field(default="CancerGuard AI", description="From name")
    use_tls: bool = Field(default=True, description="Use TLS")
    enabled: bool = Field(default=False, description="Enable email sending")


# ============================================================================
# File Upload Configuration
# ============================================================================

class UploadSettings(BaseSettings):
    """File upload configuration."""
    
    model_config = SettingsConfigDict(env_prefix="UPLOAD_")
    
    max_file_size_mb: int = Field(default=50, description="Max file size in MB")
    allowed_extensions: Set[str] = Field(
        default={"pdf", "jpg", "jpeg", "png", "csv", "xlsx", "dicom", "dcm"},
        description="Allowed file extensions"
    )
    upload_dir: str = Field(
        default=str(UPLOADS_DIR),
        description="Upload directory path"
    )
    max_files_per_request: int = Field(default=10, description="Max files per request")
    image_max_dimension: int = Field(default=4096, description="Max image dimension")
    scan_for_malware: bool = Field(default=False, description="Scan uploads for malware")


# ============================================================================
# Notification Configuration
# ============================================================================

class NotificationSettings(BaseSettings):
    """Notification service configuration."""
    
    model_config = SettingsConfigDict(env_prefix="NOTIFICATION_")
    
    enabled: bool = Field(default=True, description="Enable notifications")
    websocket_enabled: bool = Field(default=True, description="Enable WebSocket notifications")
    push_notification_enabled: bool = Field(default=False, description="Enable push notifications")
    sms_enabled: bool = Field(default=False, description="Enable SMS notifications")
    email_enabled: bool = Field(default=False, description="Enable email notifications")
    
    # Alert thresholds
    critical_alert_delay_seconds: int = Field(default=0, description="Critical alert delay")
    high_alert_delay_seconds: int = Field(default=60, description="High alert delay")
    medium_alert_delay_seconds: int = Field(default=300, description="Medium alert delay")
    low_alert_delay_seconds: int = Field(default=3600, description="Low alert delay")


# ============================================================================
# Monitoring & Observability
# ============================================================================

class MonitoringSettings(BaseSettings):
    """Application monitoring configuration."""
    
    model_config = SettingsConfigDict(env_prefix="MONITORING_")
    
    prometheus_enabled: bool = Field(default=False, description="Enable Prometheus metrics")
    prometheus_port: int = Field(default=9090, description="Prometheus port")
    sentry_dsn: Optional[str] = Field(default=None, description="Sentry DSN")
    sentry_traces_sample_rate: float = Field(default=0.1, description="Sentry traces sample rate")
    health_check_interval_seconds: int = Field(default=30, description="Health check interval")
    log_request_body: bool = Field(default=False, description="Log request bodies")
    log_response_body: bool = Field(default=False, description="Log response bodies")


# ============================================================================
# Rate Limiting Configuration
# ============================================================================

class RateLimitSettings(BaseSettings):
    """Rate limiting configuration."""
    
    model_config = SettingsConfigDict(env_prefix="RATELIMIT_")
    
    enabled: bool = Field(default=True, description="Enable rate limiting")
    default_limit: str = Field(default="100/minute", description="Default rate limit")
    auth_limit: str = Field(default="10/minute", description="Auth endpoint rate limit")
    api_limit: str = Field(default="200/minute", description="API rate limit")
    upload_limit: str = Field(default="10/minute", description="Upload rate limit")
    ai_prediction_limit: str = Field(default="50/minute", description="AI prediction rate limit")
    storage_backend: str = Field(default="memory", description="Rate limit storage backend")


# ============================================================================
# Main Application Settings
# ============================================================================

class Settings(BaseSettings):
    """Main application settings aggregating all configuration sections."""
    
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = Field(default="CancerGuard AI", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    app_description: str = Field(
        default="Advanced Cancer Detection & Health Monitoring Platform",
        description="Application description"
    )
    environment: EnvironmentType = Field(
        default=EnvironmentType.DEVELOPMENT,
        description="Application environment"
    )
    debug: bool = Field(default=True, description="Debug mode")
    log_level: LogLevel = Field(default=LogLevel.INFO, description="Logging level")
    
    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=4, description="Number of workers")
    reload: bool = Field(default=True, description="Auto-reload on code changes")
    
    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"],
        description="Allowed CORS origins"
    )
    cors_allow_credentials: bool = Field(default=True, description="Allow credentials")
    cors_allow_methods: List[str] = Field(default=["*"], description="Allowed methods")
    cors_allow_headers: List[str] = Field(default=["*"], description="Allowed headers")
    
    # API
    api_prefix: str = Field(default="/api/v1", description="API prefix")
    docs_url: str = Field(default="/docs", description="Swagger docs URL")
    redoc_url: str = Field(default="/redoc", description="ReDoc URL")
    openapi_url: str = Field(default="/openapi.json", description="OpenAPI URL")
    
    # Pagination
    default_page_size: int = Field(default=20, description="Default page size")
    max_page_size: int = Field(default=100, description="Maximum page size")
    
    # Sub-configurations
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    auth: AuthSettings = Field(default_factory=AuthSettings)
    ai_model: AIModelSettings = Field(default_factory=AIModelSettings)
    email: EmailSettings = Field(default_factory=EmailSettings)
    upload: UploadSettings = Field(default_factory=UploadSettings)
    notification: NotificationSettings = Field(default_factory=NotificationSettings)
    monitoring: MonitoringSettings = Field(default_factory=MonitoringSettings)
    rate_limit: RateLimitSettings = Field(default_factory=RateLimitSettings)
    
    @property
    def is_development(self) -> bool:
        return self.environment == EnvironmentType.DEVELOPMENT
    
    @property
    def is_production(self) -> bool:
        return self.environment == EnvironmentType.PRODUCTION
    
    @property
    def is_testing(self) -> bool:
        return self.environment == EnvironmentType.TESTING
    
    def ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        dirs = [
            LOGS_DIR, UPLOADS_DIR, EXPORTS_DIR, TEMP_DIR,
            DATA_DIR, Path(self.ai_model.models_dir),
            DATA_DIR / "sample_data",
            UPLOADS_DIR / "blood_reports",
            UPLOADS_DIR / "medical_images",
            UPLOADS_DIR / "prescriptions",
            UPLOADS_DIR / "lab_reports",
            UPLOADS_DIR / "profile_photos",
        ]
        for directory in dirs:
            directory.mkdir(parents=True, exist_ok=True)


# ============================================================================
# Global Settings Instance
# ============================================================================

_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create the global settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
        _settings.ensure_directories()
    return _settings


def reset_settings() -> None:
    """Reset the global settings instance (for testing)."""
    global _settings
    _settings = None

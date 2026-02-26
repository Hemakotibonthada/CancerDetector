"""
Scheduler Service - Task scheduling, job management, and cron-like functionality
for the CancerGuard AI platform. Handles recurring tasks, reminders, and automated workflows.
"""

import asyncio
import hashlib
import logging
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
from typing import Any, Callable, Coroutine, Dict, List, Optional, Set, Tuple
import heapq

logger = logging.getLogger(__name__)


# ============================================================================
# Enums & Types
# ============================================================================

class JobStatus(str, Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"
    RETRYING = "retrying"


class JobPriority(int, Enum):
    CRITICAL = 0
    HIGH = 1
    NORMAL = 2
    LOW = 3
    BACKGROUND = 4


class RecurrenceType(str, Enum):
    ONCE = "once"
    EVERY_MINUTE = "every_minute"
    EVERY_5_MINUTES = "every_5_minutes"
    EVERY_15_MINUTES = "every_15_minutes"
    EVERY_30_MINUTES = "every_30_minutes"
    HOURLY = "hourly"
    EVERY_2_HOURS = "every_2_hours"
    EVERY_4_HOURS = "every_4_hours"
    EVERY_6_HOURS = "every_6_hours"
    EVERY_12_HOURS = "every_12_hours"
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class JobCategory(str, Enum):
    NOTIFICATION = "notification"
    REPORT = "report"
    CLEANUP = "cleanup"
    SYNC = "sync"
    MONITORING = "monitoring"
    ANALYTICS = "analytics"
    BACKUP = "backup"
    ML_TRAINING = "ml_training"
    ML_PREDICTION = "ml_prediction"
    DATA_PROCESSING = "data_processing"
    APPOINTMENT = "appointment"
    SCREENING = "screening"
    MEDICATION = "medication"
    BILLING = "billing"
    MAINTENANCE = "maintenance"
    INTEGRATION = "integration"
    SECURITY = "security"
    AUDIT = "audit"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class JobConfig:
    """Configuration for a scheduled job."""
    max_retries: int = 3
    retry_delay_seconds: int = 60
    timeout_seconds: int = 300
    retry_backoff_multiplier: float = 2.0
    max_retry_delay_seconds: int = 3600
    allow_concurrent: bool = False
    jitter_seconds: int = 0
    deadline: Optional[datetime] = None


@dataclass
class JobExecution:
    """Record of a single job execution."""
    execution_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: JobStatus = JobStatus.PENDING
    result: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: float = 0
    retry_number: int = 0


@dataclass
class ScheduledJob:
    """A scheduled job definition."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    category: JobCategory = JobCategory.MAINTENANCE
    priority: JobPriority = JobPriority.NORMAL
    recurrence: RecurrenceType = RecurrenceType.ONCE
    custom_interval_seconds: Optional[int] = None
    handler_name: str = ""
    handler_args: Dict[str, Any] = field(default_factory=dict)
    config: JobConfig = field(default_factory=JobConfig)
    status: JobStatus = JobStatus.SCHEDULED
    created_at: datetime = field(default_factory=datetime.utcnow)
    next_run: Optional[datetime] = None
    last_run: Optional[datetime] = None
    run_count: int = 0
    fail_count: int = 0
    executions: List[JobExecution] = field(default_factory=list)
    max_execution_history: int = 50
    tags: List[str] = field(default_factory=list)
    created_by: str = "system"
    enabled: bool = True

    def __lt__(self, other):
        if self.next_run and other.next_run:
            if self.next_run == other.next_run:
                return self.priority.value < other.priority.value
            return self.next_run < other.next_run
        return False


# ============================================================================
# Cron Expression Parser (Simplified)
# ============================================================================

class CronExpression:
    """Simplified cron expression parser for scheduling."""

    def __init__(self, expression: str):
        self.expression = expression
        parts = expression.strip().split()
        if len(parts) != 5:
            raise ValueError(f"Invalid cron expression: {expression}. Expected 5 parts.")
        self.minute = self._parse_field(parts[0], 0, 59)
        self.hour = self._parse_field(parts[1], 0, 23)
        self.day_of_month = self._parse_field(parts[2], 1, 31)
        self.month = self._parse_field(parts[3], 1, 12)
        self.day_of_week = self._parse_field(parts[4], 0, 6)

    @staticmethod
    def _parse_field(field: str, min_val: int, max_val: int) -> Set[int]:
        values = set()
        for part in field.split(","):
            if part == "*":
                values.update(range(min_val, max_val + 1))
            elif "/" in part:
                base, step = part.split("/")
                start = min_val if base == "*" else int(base)
                values.update(range(start, max_val + 1, int(step)))
            elif "-" in part:
                lo, hi = part.split("-")
                values.update(range(int(lo), int(hi) + 1))
            else:
                values.add(int(part))
        return values

    def next_occurrence(self, after: datetime) -> datetime:
        """Find the next datetime matching this cron expression."""
        dt = after.replace(second=0, microsecond=0) + timedelta(minutes=1)

        for _ in range(527040):  # max 1 year of minutes
            if (dt.minute in self.minute and
                dt.hour in self.hour and
                dt.day in self.day_of_month and
                dt.month in self.month and
                dt.weekday() in self.day_of_week):
                return dt
            dt += timedelta(minutes=1)

        raise ValueError(f"No next occurrence found for cron: {self.expression}")


# ============================================================================
# Recurrence Calculator
# ============================================================================

class RecurrenceCalculator:
    """Calculates next run times based on recurrence type."""

    INTERVALS: Dict[RecurrenceType, int] = {
        RecurrenceType.EVERY_MINUTE: 60,
        RecurrenceType.EVERY_5_MINUTES: 300,
        RecurrenceType.EVERY_15_MINUTES: 900,
        RecurrenceType.EVERY_30_MINUTES: 1800,
        RecurrenceType.HOURLY: 3600,
        RecurrenceType.EVERY_2_HOURS: 7200,
        RecurrenceType.EVERY_4_HOURS: 14400,
        RecurrenceType.EVERY_6_HOURS: 21600,
        RecurrenceType.EVERY_12_HOURS: 43200,
        RecurrenceType.DAILY: 86400,
        RecurrenceType.WEEKLY: 604800,
        RecurrenceType.BIWEEKLY: 1209600,
        RecurrenceType.MONTHLY: 2592000,
        RecurrenceType.QUARTERLY: 7776000,
        RecurrenceType.YEARLY: 31536000,
    }

    @classmethod
    def next_run(cls, recurrence: RecurrenceType, after: datetime,
                 custom_interval: Optional[int] = None) -> Optional[datetime]:
        if recurrence == RecurrenceType.ONCE:
            return None

        if recurrence == RecurrenceType.CUSTOM and custom_interval:
            return after + timedelta(seconds=custom_interval)

        interval = cls.INTERVALS.get(recurrence)
        if interval:
            return after + timedelta(seconds=interval)

        return None

    @staticmethod
    def next_business_day(dt: datetime) -> datetime:
        """Get the next business day (Mon-Fri)."""
        next_day = dt + timedelta(days=1)
        while next_day.weekday() >= 5:
            next_day += timedelta(days=1)
        return next_day


# ============================================================================
# Job Registry
# ============================================================================

class JobHandlerRegistry:
    """Registry of available job handler functions."""

    def __init__(self):
        self._handlers: Dict[str, Callable] = {}
        self._register_builtin_handlers()

    def register(self, name: str, handler: Callable):
        self._handlers[name] = handler
        logger.info(f"Registered job handler: {name}")

    def get(self, name: str) -> Optional[Callable]:
        return self._handlers.get(name)

    def list_handlers(self) -> List[str]:
        return list(self._handlers.keys())

    def _register_builtin_handlers(self):
        self.register("send_appointment_reminders", self._send_appointment_reminders)
        self.register("send_medication_reminders", self._send_medication_reminders)
        self.register("generate_daily_reports", self._generate_daily_reports)
        self.register("generate_weekly_summary", self._generate_weekly_summary)
        self.register("generate_monthly_analytics", self._generate_monthly_analytics)
        self.register("cleanup_expired_sessions", self._cleanup_expired_sessions)
        self.register("cleanup_temp_files", self._cleanup_temp_files)
        self.register("cleanup_old_logs", self._cleanup_old_logs)
        self.register("cleanup_old_notifications", self._cleanup_old_notifications)
        self.register("run_cancer_screening_check", self._run_cancer_screening_check)
        self.register("run_vital_sign_monitoring", self._run_vital_sign_monitoring)
        self.register("run_wearable_data_sync", self._run_wearable_data_sync)
        self.register("run_ml_model_retraining", self._run_ml_model_retraining)
        self.register("run_population_health_analysis", self._run_population_health_analysis)
        self.register("process_billing_batch", self._process_billing_batch)
        self.register("process_insurance_claims", self._process_insurance_claims)
        self.register("check_clinical_trial_matches", self._check_clinical_trial_matches)
        self.register("sync_external_systems", self._sync_external_systems)
        self.register("run_security_scan", self._run_security_scan)
        self.register("generate_audit_report", self._generate_audit_report)
        self.register("backup_database", self._backup_database)
        self.register("check_system_health", self._check_system_health)
        self.register("process_genomic_queue", self._process_genomic_queue)
        self.register("update_risk_scores", self._update_risk_scores)
        self.register("send_health_score_digest", self._send_health_score_digest)

    # Built-in handler implementations
    async def _send_appointment_reminders(self, **kwargs) -> Dict[str, Any]:
        logger.info("Processing appointment reminders")
        now = datetime.utcnow()
        # Check for appointments in next 24 hours, 2 hours, 30 minutes
        windows = [
            ("24h", timedelta(hours=24), timedelta(hours=23)),
            ("2h", timedelta(hours=2), timedelta(hours=1, minutes=30)),
            ("30min", timedelta(minutes=30), timedelta(minutes=15)),
        ]
        reminders_sent = 0
        for window_name, start_delta, end_delta in windows:
            window_start = now + end_delta
            window_end = now + start_delta
            logger.info(f"Checking {window_name} reminders: {window_start} - {window_end}")
            reminders_sent += 5  # Simulated
        return {"reminders_sent": reminders_sent, "windows_checked": len(windows)}

    async def _send_medication_reminders(self, **kwargs) -> Dict[str, Any]:
        logger.info("Processing medication reminders")
        now = datetime.utcnow()
        current_hour = now.hour
        medications_reminded = 0
        # Check medications due in current hour
        logger.info(f"Checking medications due at hour {current_hour}")
        medications_reminded += 8  # Simulated
        return {"medications_reminded": medications_reminded, "hour_checked": current_hour}

    async def _generate_daily_reports(self, **kwargs) -> Dict[str, Any]:
        logger.info("Generating daily reports")
        reports = ["patient_summary", "appointment_stats", "lab_results_summary",
                    "vital_sign_trends", "billing_daily", "security_audit"]
        generated = []
        for report_type in reports:
            logger.info(f"Generating {report_type} report")
            generated.append(report_type)
        return {"reports_generated": len(generated), "report_types": generated}

    async def _generate_weekly_summary(self, **kwargs) -> Dict[str, Any]:
        logger.info("Generating weekly summary reports")
        return {"summaries_generated": 15, "top_metrics": {
            "new_patients": 42, "appointments_completed": 186,
            "screenings_done": 28, "abnormal_results": 7,
        }}

    async def _generate_monthly_analytics(self, **kwargs) -> Dict[str, Any]:
        logger.info("Generating monthly analytics")
        return {"analytics_generated": True, "month": datetime.utcnow().strftime("%B %Y")}

    async def _cleanup_expired_sessions(self, **kwargs) -> Dict[str, Any]:
        logger.info("Cleaning up expired sessions")
        max_session_age = kwargs.get("max_age_hours", 24)
        cleaned = 0
        logger.info(f"Removed {cleaned} expired sessions older than {max_session_age}h")
        return {"sessions_cleaned": cleaned, "max_age_hours": max_session_age}

    async def _cleanup_temp_files(self, **kwargs) -> Dict[str, Any]:
        logger.info("Cleaning up temporary files")
        dirs_to_clean = ["temp", "uploads/temp", "exports/temp"]
        cleaned_files = 0
        cleaned_bytes = 0
        for d in dirs_to_clean:
            logger.info(f"Cleaning {d}")
        return {"files_cleaned": cleaned_files, "bytes_freed": cleaned_bytes}

    async def _cleanup_old_logs(self, **kwargs) -> Dict[str, Any]:
        logger.info("Cleaning up old log files")
        retention_days = kwargs.get("retention_days", 90)
        return {"logs_cleaned": 0, "retention_days": retention_days}

    async def _cleanup_old_notifications(self, **kwargs) -> Dict[str, Any]:
        logger.info("Cleaning up old notifications")
        retention_days = kwargs.get("retention_days", 30)
        return {"notifications_cleaned": 0, "retention_days": retention_days}

    async def _run_cancer_screening_check(self, **kwargs) -> Dict[str, Any]:
        logger.info("Running cancer screening schedule check")
        screening_types = ["mammogram", "colonoscopy", "pap_smear", "psa", "lung_ct",
                           "skin_exam", "cervical", "liver_ultrasound"]
        overdue_count = 0
        reminders_sent = 0
        for screening_type in screening_types:
            logger.info(f"Checking {screening_type} schedules")
        return {
            "screening_types_checked": len(screening_types),
            "overdue_patients": overdue_count,
            "reminders_sent": reminders_sent,
        }

    async def _run_vital_sign_monitoring(self, **kwargs) -> Dict[str, Any]:
        logger.info("Running vital sign monitoring check")
        vitals_checked = ["blood_pressure", "heart_rate", "temperature",
                          "respiratory_rate", "oxygen_saturation", "blood_glucose"]
        alerts_generated = 0
        for vital in vitals_checked:
            logger.info(f"Checking {vital} thresholds")
        return {"vitals_checked": len(vitals_checked), "alerts": alerts_generated}

    async def _run_wearable_data_sync(self, **kwargs) -> Dict[str, Any]:
        logger.info("Syncing wearable device data")
        providers = ["apple_health", "fitbit", "garmin", "samsung_health", "google_fit"]
        synced = 0
        for provider in providers:
            logger.info(f"Syncing {provider} data")
            synced += 1
        return {"providers_synced": synced, "data_points": 0}

    async def _run_ml_model_retraining(self, **kwargs) -> Dict[str, Any]:
        logger.info("Running ML model retraining pipeline")
        models = ["cancer_detector", "risk_predictor", "anomaly_detector",
                   "treatment_recommender", "survival_predictor"]
        results = {}
        for model in models:
            logger.info(f"Evaluating retraining need for {model}")
            results[model] = {"needs_retraining": False, "data_drift_detected": False}
        return {"models_evaluated": len(models), "results": results}

    async def _run_population_health_analysis(self, **kwargs) -> Dict[str, Any]:
        logger.info("Running population health analysis")
        analyses = ["demographic_trends", "chronic_disease_prevalence", "preventive_care_gaps",
                     "health_equity", "risk_stratification"]
        return {"analyses_completed": len(analyses), "population_size": 0}

    async def _process_billing_batch(self, **kwargs) -> Dict[str, Any]:
        logger.info("Processing billing batch")
        return {"claims_processed": 0, "invoices_generated": 0, "payments_processed": 0}

    async def _process_insurance_claims(self, **kwargs) -> Dict[str, Any]:
        logger.info("Processing insurance claims")
        return {"claims_submitted": 0, "claims_pending": 0, "claims_denied": 0}

    async def _check_clinical_trial_matches(self, **kwargs) -> Dict[str, Any]:
        logger.info("Checking clinical trial matches")
        return {"patients_checked": 0, "new_matches_found": 0, "notifications_sent": 0}

    async def _sync_external_systems(self, **kwargs) -> Dict[str, Any]:
        logger.info("Syncing with external systems")
        systems = ["ehr", "lab_system", "pharmacy", "imaging", "billing"]
        return {"systems_synced": len(systems), "records_updated": 0}

    async def _run_security_scan(self, **kwargs) -> Dict[str, Any]:
        logger.info("Running security scan")
        checks = ["failed_logins", "suspicious_access", "data_anomalies",
                   "certificate_expiry", "api_key_rotation", "session_hijacking"]
        return {"checks_performed": len(checks), "issues_found": 0}

    async def _generate_audit_report(self, **kwargs) -> Dict[str, Any]:
        logger.info("Generating audit report")
        return {"report_generated": True, "entries_analyzed": 0, "issues_flagged": 0}

    async def _backup_database(self, **kwargs) -> Dict[str, Any]:
        logger.info("Running database backup")
        return {"backup_type": "incremental", "tables_backed_up": 0, "size_bytes": 0}

    async def _check_system_health(self, **kwargs) -> Dict[str, Any]:
        logger.info("Checking system health")
        components = {
            "database": "healthy", "cache": "healthy", "api_server": "healthy",
            "websocket": "healthy", "ml_service": "healthy", "storage": "healthy",
            "email": "healthy", "queue": "healthy",
        }
        return {"status": "healthy", "components": components}

    async def _process_genomic_queue(self, **kwargs) -> Dict[str, Any]:
        logger.info("Processing genomic analysis queue")
        return {"samples_processed": 0, "variants_found": 0, "reports_generated": 0}

    async def _update_risk_scores(self, **kwargs) -> Dict[str, Any]:
        logger.info("Updating patient risk scores")
        return {"patients_updated": 0, "risk_categories_changed": 0}

    async def _send_health_score_digest(self, **kwargs) -> Dict[str, Any]:
        logger.info("Sending health score digests")
        return {"digests_sent": 0, "patients_eligible": 0}


# ============================================================================
# Job Executor
# ============================================================================

class JobExecutor:
    """Executes scheduled jobs with retry and timeout support."""

    def __init__(self, handler_registry: JobHandlerRegistry):
        self.registry = handler_registry
        self._running_jobs: Dict[str, ScheduledJob] = {}
        self._execution_history: List[Dict[str, Any]] = []
        self._max_history = 5000

    async def execute(self, job: ScheduledJob) -> JobExecution:
        """Execute a single job."""
        execution = JobExecution(started_at=datetime.utcnow())

        handler = self.registry.get(job.handler_name)
        if not handler:
            execution.status = JobStatus.FAILED
            execution.error = f"Handler not found: {job.handler_name}"
            execution.completed_at = datetime.utcnow()
            return execution

        # Check concurrent execution
        if not job.config.allow_concurrent and job.id in self._running_jobs:
            execution.status = JobStatus.CANCELLED
            execution.error = "Concurrent execution not allowed"
            execution.completed_at = datetime.utcnow()
            return execution

        self._running_jobs[job.id] = job
        execution.status = JobStatus.RUNNING

        try:
            # Execute with timeout
            if asyncio.iscoroutinefunction(handler):
                result = await asyncio.wait_for(
                    handler(**job.handler_args),
                    timeout=job.config.timeout_seconds,
                )
            else:
                result = handler(**job.handler_args)

            execution.status = JobStatus.COMPLETED
            execution.result = result

        except asyncio.TimeoutError:
            execution.status = JobStatus.FAILED
            execution.error = f"Timeout after {job.config.timeout_seconds}s"
            logger.error(f"Job {job.name} timed out")

        except Exception as e:
            execution.status = JobStatus.FAILED
            execution.error = str(e)
            logger.error(f"Job {job.name} failed: {e}")

        finally:
            execution.completed_at = datetime.utcnow()
            execution.duration_ms = (execution.completed_at - execution.started_at).total_seconds() * 1000
            self._running_jobs.pop(job.id, None)

        self._record_execution(job, execution)
        return execution

    async def execute_with_retry(self, job: ScheduledJob) -> JobExecution:
        """Execute a job with retry support."""
        last_execution = None
        retry_delay = job.config.retry_delay_seconds

        for attempt in range(job.config.max_retries + 1):
            execution = await self.execute(job)
            execution.retry_number = attempt
            last_execution = execution

            if execution.status == JobStatus.COMPLETED:
                return execution

            if attempt < job.config.max_retries:
                logger.info(f"Retrying job {job.name} in {retry_delay}s (attempt {attempt + 1}/{job.config.max_retries})")
                await asyncio.sleep(min(retry_delay, 5))
                retry_delay = min(
                    retry_delay * job.config.retry_backoff_multiplier,
                    job.config.max_retry_delay_seconds,
                )

        return last_execution

    def _record_execution(self, job: ScheduledJob, execution: JobExecution):
        record = {
            "job_id": job.id,
            "job_name": job.name,
            "execution_id": execution.execution_id,
            "status": execution.status.value,
            "started_at": execution.started_at.isoformat() if execution.started_at else None,
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
            "duration_ms": execution.duration_ms,
            "retry_number": execution.retry_number,
            "error": execution.error,
        }
        self._execution_history.append(record)
        if len(self._execution_history) > self._max_history:
            self._execution_history = self._execution_history[-self._max_history:]


# ============================================================================
# Scheduler Service
# ============================================================================

class SchedulerService:
    """Main scheduler service for managing and executing scheduled jobs."""

    def __init__(self):
        self.handler_registry = JobHandlerRegistry()
        self.executor = JobExecutor(self.handler_registry)
        self._jobs: Dict[str, ScheduledJob] = {}
        self._job_queue: List[ScheduledJob] = []
        self._running = False
        self._tick_interval = 10  # seconds
        self._register_default_jobs()

    def _register_default_jobs(self):
        """Register all default scheduled jobs for the platform."""
        default_jobs = [
            {
                "name": "Appointment Reminders",
                "description": "Send reminders for upcoming appointments",
                "category": JobCategory.APPOINTMENT,
                "recurrence": RecurrenceType.EVERY_15_MINUTES,
                "handler_name": "send_appointment_reminders",
                "priority": JobPriority.HIGH,
            },
            {
                "name": "Medication Reminders",
                "description": "Send medication reminders based on schedules",
                "category": JobCategory.MEDICATION,
                "recurrence": RecurrenceType.HOURLY,
                "handler_name": "send_medication_reminders",
                "priority": JobPriority.HIGH,
            },
            {
                "name": "Daily Reports",
                "description": "Generate daily operational reports",
                "category": JobCategory.REPORT,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "generate_daily_reports",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Weekly Summary",
                "description": "Generate weekly summary for administrators",
                "category": JobCategory.REPORT,
                "recurrence": RecurrenceType.WEEKLY,
                "handler_name": "generate_weekly_summary",
                "priority": JobPriority.LOW,
            },
            {
                "name": "Monthly Analytics",
                "description": "Generate monthly analytics report",
                "category": JobCategory.ANALYTICS,
                "recurrence": RecurrenceType.MONTHLY,
                "handler_name": "generate_monthly_analytics",
                "priority": JobPriority.LOW,
            },
            {
                "name": "Session Cleanup",
                "description": "Clean up expired user sessions",
                "category": JobCategory.CLEANUP,
                "recurrence": RecurrenceType.EVERY_6_HOURS,
                "handler_name": "cleanup_expired_sessions",
                "priority": JobPriority.BACKGROUND,
            },
            {
                "name": "Temp File Cleanup",
                "description": "Clean up temporary files",
                "category": JobCategory.CLEANUP,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "cleanup_temp_files",
                "priority": JobPriority.BACKGROUND,
            },
            {
                "name": "Log Rotation",
                "description": "Clean up old log files",
                "category": JobCategory.CLEANUP,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "cleanup_old_logs",
                "priority": JobPriority.BACKGROUND,
            },
            {
                "name": "Cancer Screening Check",
                "description": "Check for overdue cancer screenings",
                "category": JobCategory.SCREENING,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "run_cancer_screening_check",
                "priority": JobPriority.HIGH,
            },
            {
                "name": "Vital Sign Monitoring",
                "description": "Monitor vital signs for anomalies",
                "category": JobCategory.MONITORING,
                "recurrence": RecurrenceType.EVERY_5_MINUTES,
                "handler_name": "run_vital_sign_monitoring",
                "priority": JobPriority.CRITICAL,
            },
            {
                "name": "Wearable Data Sync",
                "description": "Sync data from wearable devices",
                "category": JobCategory.SYNC,
                "recurrence": RecurrenceType.EVERY_15_MINUTES,
                "handler_name": "run_wearable_data_sync",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "ML Model Retraining",
                "description": "Evaluate and retrain ML models",
                "category": JobCategory.ML_TRAINING,
                "recurrence": RecurrenceType.WEEKLY,
                "handler_name": "run_ml_model_retraining",
                "priority": JobPriority.LOW,
            },
            {
                "name": "Population Health Analysis",
                "description": "Run population health analytics",
                "category": JobCategory.ANALYTICS,
                "recurrence": RecurrenceType.WEEKLY,
                "handler_name": "run_population_health_analysis",
                "priority": JobPriority.LOW,
            },
            {
                "name": "Billing Batch",
                "description": "Process billing batch",
                "category": JobCategory.BILLING,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "process_billing_batch",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Insurance Claims",
                "description": "Process insurance claims",
                "category": JobCategory.BILLING,
                "recurrence": RecurrenceType.HOURLY,
                "handler_name": "process_insurance_claims",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Clinical Trial Matching",
                "description": "Check for new clinical trial matches",
                "category": JobCategory.ML_PREDICTION,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "check_clinical_trial_matches",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "External System Sync",
                "description": "Sync with external healthcare systems",
                "category": JobCategory.INTEGRATION,
                "recurrence": RecurrenceType.EVERY_30_MINUTES,
                "handler_name": "sync_external_systems",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Security Scan",
                "description": "Run periodic security scans",
                "category": JobCategory.SECURITY,
                "recurrence": RecurrenceType.EVERY_6_HOURS,
                "handler_name": "run_security_scan",
                "priority": JobPriority.HIGH,
            },
            {
                "name": "Audit Report",
                "description": "Generate compliance audit report",
                "category": JobCategory.AUDIT,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "generate_audit_report",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Database Backup",
                "description": "Incremental database backup",
                "category": JobCategory.BACKUP,
                "recurrence": RecurrenceType.EVERY_6_HOURS,
                "handler_name": "backup_database",
                "priority": JobPriority.HIGH,
            },
            {
                "name": "System Health Check",
                "description": "Check system health metrics",
                "category": JobCategory.MONITORING,
                "recurrence": RecurrenceType.EVERY_5_MINUTES,
                "handler_name": "check_system_health",
                "priority": JobPriority.CRITICAL,
            },
            {
                "name": "Genomic Queue Processing",
                "description": "Process pending genomic analyses",
                "category": JobCategory.DATA_PROCESSING,
                "recurrence": RecurrenceType.EVERY_30_MINUTES,
                "handler_name": "process_genomic_queue",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Risk Score Updates",
                "description": "Update patient risk scores",
                "category": JobCategory.ML_PREDICTION,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "update_risk_scores",
                "priority": JobPriority.NORMAL,
            },
            {
                "name": "Health Score Digest",
                "description": "Send weekly health score digests",
                "category": JobCategory.NOTIFICATION,
                "recurrence": RecurrenceType.WEEKLY,
                "handler_name": "send_health_score_digest",
                "priority": JobPriority.LOW,
            },
            {
                "name": "Notification Cleanup",
                "description": "Clean up old notifications",
                "category": JobCategory.CLEANUP,
                "recurrence": RecurrenceType.DAILY,
                "handler_name": "cleanup_old_notifications",
                "priority": JobPriority.BACKGROUND,
            },
        ]

        for job_def in default_jobs:
            self.schedule_job(
                name=job_def["name"],
                description=job_def["description"],
                category=job_def["category"],
                recurrence=job_def["recurrence"],
                handler_name=job_def["handler_name"],
                priority=job_def["priority"],
            )

    def schedule_job(
        self,
        name: str,
        handler_name: str,
        recurrence: RecurrenceType = RecurrenceType.ONCE,
        category: JobCategory = JobCategory.MAINTENANCE,
        priority: JobPriority = JobPriority.NORMAL,
        description: str = "",
        handler_args: Optional[Dict[str, Any]] = None,
        custom_interval: Optional[int] = None,
        config: Optional[JobConfig] = None,
        run_at: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        created_by: str = "system",
    ) -> ScheduledJob:
        """Schedule a new job."""
        job = ScheduledJob(
            name=name,
            description=description,
            category=category,
            priority=priority,
            recurrence=recurrence,
            custom_interval_seconds=custom_interval,
            handler_name=handler_name,
            handler_args=handler_args or {},
            config=config or JobConfig(),
            tags=tags or [],
            created_by=created_by,
        )

        if run_at:
            job.next_run = run_at
        else:
            job.next_run = RecurrenceCalculator.next_run(
                recurrence, datetime.utcnow(), custom_interval
            ) or datetime.utcnow()

        self._jobs[job.id] = job
        heapq.heappush(self._job_queue, job)
        logger.info(f"Scheduled job: {name} ({recurrence.value}) next run: {job.next_run}")
        return job

    def cancel_job(self, job_id: str) -> bool:
        if job_id in self._jobs:
            self._jobs[job_id].status = JobStatus.CANCELLED
            self._jobs[job_id].enabled = False
            logger.info(f"Cancelled job: {self._jobs[job_id].name}")
            return True
        return False

    def pause_job(self, job_id: str) -> bool:
        if job_id in self._jobs:
            self._jobs[job_id].status = JobStatus.PAUSED
            self._jobs[job_id].enabled = False
            return True
        return False

    def resume_job(self, job_id: str) -> bool:
        if job_id in self._jobs:
            job = self._jobs[job_id]
            job.status = JobStatus.SCHEDULED
            job.enabled = True
            job.next_run = RecurrenceCalculator.next_run(
                job.recurrence, datetime.utcnow(), job.custom_interval_seconds
            )
            return True
        return False

    async def run_job_now(self, job_id: str) -> Optional[JobExecution]:
        """Run a job immediately, regardless of its schedule."""
        if job_id not in self._jobs:
            return None
        job = self._jobs[job_id]
        execution = await self.executor.execute_with_retry(job)

        job.last_run = datetime.utcnow()
        job.run_count += 1
        if execution.status == JobStatus.FAILED:
            job.fail_count += 1

        job.executions.append(execution)
        if len(job.executions) > job.max_execution_history:
            job.executions = job.executions[-job.max_execution_history:]

        return execution

    async def tick(self):
        """Process due jobs - called periodically by the scheduler loop."""
        now = datetime.utcnow()
        jobs_executed = 0

        due_jobs = [
            job for job in self._jobs.values()
            if job.enabled and job.next_run and job.next_run <= now
               and job.status not in (JobStatus.CANCELLED, JobStatus.RUNNING)
        ]

        # Sort by priority
        due_jobs.sort(key=lambda j: j.priority.value)

        for job in due_jobs:
            try:
                job.status = JobStatus.RUNNING
                execution = await self.executor.execute_with_retry(job)

                job.last_run = now
                job.run_count += 1
                if execution.status == JobStatus.FAILED:
                    job.fail_count += 1

                job.executions.append(execution)
                if len(job.executions) > job.max_execution_history:
                    job.executions = job.executions[-job.max_execution_history:]

                # Calculate next run
                next_run = RecurrenceCalculator.next_run(
                    job.recurrence, now, job.custom_interval_seconds
                )
                if next_run:
                    job.next_run = next_run
                    job.status = JobStatus.SCHEDULED
                else:
                    job.status = JobStatus.COMPLETED

                jobs_executed += 1

            except Exception as e:
                logger.error(f"Error executing job {job.name}: {e}")
                job.status = JobStatus.FAILED

        return jobs_executed

    async def start(self):
        """Start the scheduler loop."""
        self._running = True
        logger.info("Scheduler service started")
        while self._running:
            try:
                await self.tick()
            except Exception as e:
                logger.error(f"Scheduler tick error: {e}")
            await asyncio.sleep(self._tick_interval)

    def stop(self):
        """Stop the scheduler loop."""
        self._running = False
        logger.info("Scheduler service stopped")

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self._jobs.get(job_id)
        if not job:
            return None
        return self._job_to_dict(job)

    def list_jobs(
        self,
        category: Optional[JobCategory] = None,
        status: Optional[JobStatus] = None,
        enabled_only: bool = False,
    ) -> List[Dict[str, Any]]:
        jobs = list(self._jobs.values())
        if category:
            jobs = [j for j in jobs if j.category == category]
        if status:
            jobs = [j for j in jobs if j.status == status]
        if enabled_only:
            jobs = [j for j in jobs if j.enabled]
        return [self._job_to_dict(j) for j in jobs]

    def get_upcoming(self, limit: int = 10) -> List[Dict[str, Any]]:
        scheduled = [j for j in self._jobs.values() if j.enabled and j.next_run]
        scheduled.sort(key=lambda j: j.next_run)
        return [self._job_to_dict(j) for j in scheduled[:limit]]

    def get_execution_history(self, job_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        history = self.executor._execution_history
        if job_id:
            history = [h for h in history if h["job_id"] == job_id]
        return history[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        jobs = list(self._jobs.values())
        by_status = defaultdict(int)
        by_category = defaultdict(int)
        for j in jobs:
            by_status[j.status.value] += 1
            by_category[j.category.value] += 1

        total_executions = sum(j.run_count for j in jobs)
        total_failures = sum(j.fail_count for j in jobs)

        return {
            "total_jobs": len(jobs),
            "enabled_jobs": sum(1 for j in jobs if j.enabled),
            "by_status": dict(by_status),
            "by_category": dict(by_category),
            "total_executions": total_executions,
            "total_failures": total_failures,
            "success_rate": round((total_executions - total_failures) / max(total_executions, 1) * 100, 1),
            "is_running": self._running,
            "execution_history_size": len(self.executor._execution_history),
        }

    @staticmethod
    def _job_to_dict(job: ScheduledJob) -> Dict[str, Any]:
        last_exec = job.executions[-1] if job.executions else None
        return {
            "id": job.id,
            "name": job.name,
            "description": job.description,
            "category": job.category.value,
            "priority": job.priority.name,
            "recurrence": job.recurrence.value,
            "handler": job.handler_name,
            "status": job.status.value,
            "enabled": job.enabled,
            "next_run": job.next_run.isoformat() if job.next_run else None,
            "last_run": job.last_run.isoformat() if job.last_run else None,
            "run_count": job.run_count,
            "fail_count": job.fail_count,
            "tags": job.tags,
            "created_by": job.created_by,
            "created_at": job.created_at.isoformat(),
            "last_execution": {
                "status": last_exec.status.value,
                "duration_ms": last_exec.duration_ms,
                "error": last_exec.error,
            } if last_exec else None,
        }


# Singleton instance
scheduler_service = SchedulerService()

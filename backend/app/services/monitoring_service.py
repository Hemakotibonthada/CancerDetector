"""
Backend System Monitoring Service
Comprehensive health monitoring, performance tracking, alerting, and diagnostics
for the Cancer Detection Platform.
"""

import asyncio
import os
import time
import platform
import psutil
import logging
import uuid
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import deque, defaultdict
import threading
import traceback

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertChannel(str, Enum):
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    SMS = "sms"
    PAGERDUTY = "pagerduty"
    LOG = "log"


class MetricType(str, Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"
    RATE = "rate"


class ComponentType(str, Enum):
    DATABASE = "database"
    CACHE = "cache"
    API = "api"
    ML_MODEL = "ml_model"
    QUEUE = "queue"
    STORAGE = "storage"
    EXTERNAL_SERVICE = "external_service"
    SCHEDULER = "scheduler"


# ==================== Data Classes ====================

@dataclass
class MetricPoint:
    """Single metric measurement"""
    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    labels: Dict[str, str] = field(default_factory=dict)
    metric_type: MetricType = MetricType.GAUGE
    unit: str = ""


@dataclass
class HealthCheck:
    """Health check result for a component"""
    component: str
    component_type: ComponentType
    status: HealthStatus
    message: str = ""
    response_time_ms: float = 0.0
    details: Dict[str, Any] = field(default_factory=dict)
    checked_at: datetime = field(default_factory=datetime.utcnow)
    last_healthy: Optional[datetime] = None
    consecutive_failures: int = 0


@dataclass
class Alert:
    """System alert"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    severity: AlertSeverity = AlertSeverity.INFO
    title: str = ""
    message: str = ""
    component: str = ""
    metric_name: str = ""
    metric_value: float = 0.0
    threshold: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    channels: List[AlertChannel] = field(default_factory=list)
    tags: Dict[str, str] = field(default_factory=dict)
    notification_sent: bool = False


@dataclass
class AlertRule:
    """Alert rule configuration"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    metric_name: str = ""
    condition: str = "gt"  # gt, lt, gte, lte, eq, neq
    threshold: float = 0.0
    severity: AlertSeverity = AlertSeverity.WARNING
    channels: List[AlertChannel] = field(default_factory=lambda: [AlertChannel.LOG])
    cooldown_minutes: int = 15
    enabled: bool = True
    description: str = ""
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0


@dataclass
class PerformanceMetrics:
    """API performance metrics"""
    endpoint: str
    method: str
    total_requests: int = 0
    total_errors: int = 0
    avg_response_time_ms: float = 0.0
    p50_response_time_ms: float = 0.0
    p95_response_time_ms: float = 0.0
    p99_response_time_ms: float = 0.0
    min_response_time_ms: float = float('inf')
    max_response_time_ms: float = 0.0
    requests_per_minute: float = 0.0
    error_rate: float = 0.0
    last_request_at: Optional[datetime] = None
    status_codes: Dict[int, int] = field(default_factory=dict)


@dataclass
class SystemSnapshot:
    """Complete system snapshot"""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    overall_status: HealthStatus = HealthStatus.UNKNOWN
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_used_mb: float = 0.0
    memory_total_mb: float = 0.0
    disk_percent: float = 0.0
    disk_used_gb: float = 0.0
    disk_total_gb: float = 0.0
    network_bytes_sent: int = 0
    network_bytes_recv: int = 0
    open_connections: int = 0
    active_threads: int = 0
    process_count: int = 0
    uptime_seconds: float = 0.0
    python_version: str = ""
    platform_info: str = ""
    component_health: List[Dict[str, Any]] = field(default_factory=list)
    active_alerts: int = 0
    performance_summary: Dict[str, Any] = field(default_factory=dict)


# ==================== Metrics Collector ====================

class MetricsCollector:
    """Collects and stores time-series metrics"""

    def __init__(self, max_points: int = 10000, retention_hours: int = 24):
        self._metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_points))
        self._counters: Dict[str, float] = defaultdict(float)
        self._histograms: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.Lock()
        self._retention_hours = retention_hours
        self._start_time = time.time()

    def record(self, name: str, value: float, labels: Optional[Dict[str, str]] = None,
               metric_type: MetricType = MetricType.GAUGE, unit: str = ""):
        """Record a metric value"""
        with self._lock:
            point = MetricPoint(
                name=name, value=value, labels=labels or {},
                metric_type=metric_type, unit=unit,
            )
            self._metrics[name].append(point)

            if metric_type == MetricType.COUNTER:
                self._counters[name] += value
            elif metric_type == MetricType.HISTOGRAM:
                hist_key = name
                self._histograms[hist_key].append(value)
                # Keep histogram data bounded
                if len(self._histograms[hist_key]) > 10000:
                    self._histograms[hist_key] = self._histograms[hist_key][-5000:]

    def increment(self, name: str, amount: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """Increment a counter"""
        self.record(name, amount, labels, MetricType.COUNTER)

    def gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None, unit: str = ""):
        """Set a gauge value"""
        self.record(name, value, labels, MetricType.GAUGE, unit)

    def histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a histogram observation"""
        self.record(name, value, labels, MetricType.HISTOGRAM)

    def get_latest(self, name: str) -> Optional[MetricPoint]:
        """Get the latest value for a metric"""
        with self._lock:
            if name in self._metrics and self._metrics[name]:
                return self._metrics[name][-1]
        return None

    def get_series(self, name: str, minutes: int = 60) -> List[MetricPoint]:
        """Get time series data for a metric"""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        with self._lock:
            if name not in self._metrics:
                return []
            return [p for p in self._metrics[name] if p.timestamp >= cutoff]

    def get_counter(self, name: str) -> float:
        """Get current counter value"""
        with self._lock:
            return self._counters.get(name, 0)

    def get_percentile(self, name: str, percentile: float) -> float:
        """Get percentile from histogram"""
        with self._lock:
            data = sorted(self._histograms.get(name, []))
            if not data:
                return 0.0
            idx = int(len(data) * (percentile / 100))
            return data[min(idx, len(data) - 1)]

    def get_average(self, name: str, minutes: int = 5) -> float:
        """Get average value over time range"""
        series = self.get_series(name, minutes)
        if not series:
            return 0.0
        return sum(p.value for p in series) / len(series)

    def get_rate(self, name: str, minutes: int = 1) -> float:
        """Get rate of change per minute"""
        series = self.get_series(name, minutes)
        if len(series) < 2:
            return 0.0
        time_diff = (series[-1].timestamp - series[0].timestamp).total_seconds() / 60
        if time_diff == 0:
            return 0.0
        value_diff = series[-1].value - series[0].value
        return value_diff / time_diff

    def get_all_metric_names(self) -> List[str]:
        """Get all registered metric names"""
        with self._lock:
            return list(self._metrics.keys())

    def cleanup(self):
        """Remove old metrics beyond retention period"""
        cutoff = datetime.utcnow() - timedelta(hours=self._retention_hours)
        with self._lock:
            for name in list(self._metrics.keys()):
                while self._metrics[name] and self._metrics[name][0].timestamp < cutoff:
                    self._metrics[name].popleft()


# ==================== Performance Monitor ====================

class PerformanceMonitor:
    """Tracks API endpoint performance"""

    def __init__(self):
        self._endpoints: Dict[str, PerformanceMetrics] = {}
        self._response_times: Dict[str, deque] = defaultdict(lambda: deque(maxlen=5000))
        self._lock = threading.Lock()
        self._start_time = time.time()

    def record_request(self, endpoint: str, method: str, status_code: int,
                       response_time_ms: float, error: bool = False):
        """Record an API request"""
        key = f"{method}:{endpoint}"
        with self._lock:
            if key not in self._endpoints:
                self._endpoints[key] = PerformanceMetrics(endpoint=endpoint, method=method)

            metrics = self._endpoints[key]
            metrics.total_requests += 1
            if error:
                metrics.total_errors += 1
            metrics.last_request_at = datetime.utcnow()
            metrics.status_codes[status_code] = metrics.status_codes.get(status_code, 0) + 1

            self._response_times[key].append(response_time_ms)
            times = sorted(self._response_times[key])

            metrics.avg_response_time_ms = sum(times) / len(times)
            metrics.p50_response_time_ms = times[int(len(times) * 0.5)]
            metrics.p95_response_time_ms = times[int(len(times) * 0.95)]
            metrics.p99_response_time_ms = times[min(int(len(times) * 0.99), len(times) - 1)]
            metrics.min_response_time_ms = min(metrics.min_response_time_ms, response_time_ms)
            metrics.max_response_time_ms = max(metrics.max_response_time_ms, response_time_ms)

            elapsed_minutes = (time.time() - self._start_time) / 60
            if elapsed_minutes > 0:
                metrics.requests_per_minute = metrics.total_requests / elapsed_minutes

            if metrics.total_requests > 0:
                metrics.error_rate = (metrics.total_errors / metrics.total_requests) * 100

    def get_endpoint_metrics(self, endpoint: str = None, method: str = None) -> List[PerformanceMetrics]:
        """Get metrics for endpoints"""
        with self._lock:
            results = list(self._endpoints.values())
            if endpoint:
                results = [m for m in results if endpoint in m.endpoint]
            if method:
                results = [m for m in results if m.method == method]
            return results

    def get_slowest_endpoints(self, limit: int = 10) -> List[PerformanceMetrics]:
        """Get slowest endpoints by average response time"""
        with self._lock:
            sorted_endpoints = sorted(self._endpoints.values(),
                                      key=lambda x: x.avg_response_time_ms, reverse=True)
            return sorted_endpoints[:limit]

    def get_most_error_prone(self, limit: int = 10) -> List[PerformanceMetrics]:
        """Get endpoints with highest error rates"""
        with self._lock:
            sorted_endpoints = sorted(self._endpoints.values(),
                                      key=lambda x: x.error_rate, reverse=True)
            return [e for e in sorted_endpoints[:limit] if e.error_rate > 0]

    def get_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        with self._lock:
            total_requests = sum(m.total_requests for m in self._endpoints.values())
            total_errors = sum(m.total_errors for m in self._endpoints.values())
            all_times = [t for times in self._response_times.values() for t in times]

            return {
                "total_endpoints": len(self._endpoints),
                "total_requests": total_requests,
                "total_errors": total_errors,
                "overall_error_rate": (total_errors / total_requests * 100) if total_requests > 0 else 0,
                "avg_response_time_ms": sum(all_times) / len(all_times) if all_times else 0,
                "p95_response_time_ms": sorted(all_times)[int(len(all_times) * 0.95)] if all_times else 0,
                "uptime_minutes": round((time.time() - self._start_time) / 60, 2),
            }


# ==================== Alert Manager ====================

class AlertManager:
    """Manages alerts and notifications"""

    def __init__(self, max_alerts: int = 5000):
        self._alerts: deque = deque(maxlen=max_alerts)
        self._rules: Dict[str, AlertRule] = {}
        self._active_alerts: Dict[str, Alert] = {}
        self._notification_handlers: Dict[AlertChannel, Any] = {}
        self._lock = threading.Lock()
        self._setup_default_rules()

    def _setup_default_rules(self):
        """Set up default monitoring rules"""
        default_rules = [
            AlertRule(name="High CPU Usage", metric_name="system.cpu_percent",
                      condition="gt", threshold=90, severity=AlertSeverity.WARNING,
                      description="CPU usage exceeds 90%"),
            AlertRule(name="Critical CPU Usage", metric_name="system.cpu_percent",
                      condition="gt", threshold=95, severity=AlertSeverity.CRITICAL,
                      description="CPU usage exceeds 95%"),
            AlertRule(name="High Memory Usage", metric_name="system.memory_percent",
                      condition="gt", threshold=85, severity=AlertSeverity.WARNING,
                      description="Memory usage exceeds 85%"),
            AlertRule(name="Critical Memory Usage", metric_name="system.memory_percent",
                      condition="gt", threshold=95, severity=AlertSeverity.CRITICAL,
                      description="Memory usage exceeds 95%"),
            AlertRule(name="High Disk Usage", metric_name="system.disk_percent",
                      condition="gt", threshold=80, severity=AlertSeverity.WARNING,
                      description="Disk usage exceeds 80%"),
            AlertRule(name="High Error Rate", metric_name="api.error_rate",
                      condition="gt", threshold=5, severity=AlertSeverity.ERROR,
                      description="API error rate exceeds 5%"),
            AlertRule(name="Slow API Response", metric_name="api.avg_response_time_ms",
                      condition="gt", threshold=2000, severity=AlertSeverity.WARNING,
                      description="Average API response time exceeds 2s"),
            AlertRule(name="Database Connection Loss", metric_name="database.connection_active",
                      condition="eq", threshold=0, severity=AlertSeverity.CRITICAL,
                      description="Database connection lost"),
            AlertRule(name="ML Model Accuracy Drop", metric_name="ml.model_accuracy",
                      condition="lt", threshold=0.85, severity=AlertSeverity.ERROR,
                      description="ML model accuracy dropped below 85%"),
            AlertRule(name="High Queue Depth", metric_name="queue.depth",
                      condition="gt", threshold=1000, severity=AlertSeverity.WARNING,
                      description="Message queue depth exceeds 1000"),
        ]
        for rule in default_rules:
            self._rules[rule.id] = rule

    def add_rule(self, rule: AlertRule) -> str:
        """Add an alert rule"""
        with self._lock:
            self._rules[rule.id] = rule
            return rule.id

    def remove_rule(self, rule_id: str) -> bool:
        """Remove an alert rule"""
        with self._lock:
            return self._rules.pop(rule_id, None) is not None

    def check_rules(self, metrics: MetricsCollector):
        """Check all rules against current metrics"""
        with self._lock:
            for rule in self._rules.values():
                if not rule.enabled:
                    continue

                latest = metrics.get_latest(rule.metric_name)
                if latest is None:
                    continue

                triggered = self._evaluate_condition(latest.value, rule.condition, rule.threshold)

                if triggered:
                    # Check cooldown
                    if (rule.last_triggered and
                        datetime.utcnow() - rule.last_triggered < timedelta(minutes=rule.cooldown_minutes)):
                        continue

                    alert = Alert(
                        severity=rule.severity,
                        title=rule.name,
                        message=rule.description,
                        metric_name=rule.metric_name,
                        metric_value=latest.value,
                        threshold=rule.threshold,
                        channels=rule.channels,
                    )
                    self._fire_alert(alert)
                    rule.last_triggered = datetime.utcnow()
                    rule.trigger_count += 1
                else:
                    # Auto-resolve if previously triggered
                    alert_key = f"{rule.metric_name}:{rule.name}"
                    if alert_key in self._active_alerts:
                        self._resolve_alert(self._active_alerts[alert_key].id)

    def _evaluate_condition(self, value: float, condition: str, threshold: float) -> bool:
        """Evaluate an alert condition"""
        conditions = {
            "gt": lambda v, t: v > t,
            "lt": lambda v, t: v < t,
            "gte": lambda v, t: v >= t,
            "lte": lambda v, t: v <= t,
            "eq": lambda v, t: v == t,
            "neq": lambda v, t: v != t,
        }
        evaluator = conditions.get(condition, lambda v, t: False)
        return evaluator(value, threshold)

    def _fire_alert(self, alert: Alert):
        """Fire an alert"""
        alert_key = f"{alert.metric_name}:{alert.title}"
        self._alerts.append(alert)
        self._active_alerts[alert_key] = alert
        logger.warning(
            f"ALERT [{alert.severity.value.upper()}]: {alert.title} - "
            f"{alert.message} (value={alert.metric_value}, threshold={alert.threshold})"
        )
        self._send_notifications(alert)

    def _resolve_alert(self, alert_id: str):
        """Resolve an alert"""
        for key, alert in self._active_alerts.items():
            if alert.id == alert_id:
                alert.resolved_at = datetime.utcnow()
                del self._active_alerts[key]
                logger.info(f"Alert resolved: {alert.title}")
                break

    def _send_notifications(self, alert: Alert):
        """Send alert notifications to configured channels"""
        for channel in alert.channels:
            handler = self._notification_handlers.get(channel)
            if handler:
                try:
                    handler(alert)
                    alert.notification_sent = True
                except Exception as e:
                    logger.error(f"Failed to send notification to {channel}: {e}")

    def acknowledge_alert(self, alert_id: str, user: str) -> bool:
        """Acknowledge an alert"""
        for alert in self._active_alerts.values():
            if alert.id == alert_id:
                alert.acknowledged = True
                alert.acknowledged_by = user
                return True
        return False

    def get_active_alerts(self, severity: Optional[AlertSeverity] = None) -> List[Alert]:
        """Get active alerts"""
        alerts = list(self._active_alerts.values())
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        return sorted(alerts, key=lambda a: a.created_at, reverse=True)

    def get_alert_history(self, hours: int = 24, limit: int = 100) -> List[Alert]:
        """Get alert history"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return [a for a in list(self._alerts)[-limit:] if a.created_at >= cutoff]

    def get_alert_stats(self) -> Dict[str, Any]:
        """Get alert statistics"""
        all_alerts = list(self._alerts)
        active = list(self._active_alerts.values())
        return {
            "total_alerts": len(all_alerts),
            "active_alerts": len(active),
            "critical": len([a for a in active if a.severity == AlertSeverity.CRITICAL]),
            "errors": len([a for a in active if a.severity == AlertSeverity.ERROR]),
            "warnings": len([a for a in active if a.severity == AlertSeverity.WARNING]),
            "acknowledged": len([a for a in active if a.acknowledged]),
            "rules_count": len(self._rules),
            "rules_enabled": len([r for r in self._rules.values() if r.enabled]),
        }

    def register_notification_handler(self, channel: AlertChannel, handler):
        """Register a notification handler for a channel"""
        self._notification_handlers[channel] = handler


# ==================== Health Check Manager ====================

class HealthCheckManager:
    """Manages health checks for system components"""

    def __init__(self):
        self._checks: Dict[str, HealthCheck] = {}
        self._check_functions: Dict[str, Any] = {}
        self._check_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self._lock = threading.Lock()

    def register_check(self, name: str, component_type: ComponentType,
                       check_function, interval_seconds: int = 30):
        """Register a health check"""
        self._check_functions[name] = {
            "function": check_function,
            "type": component_type,
            "interval": interval_seconds,
            "last_checked": None,
        }

    async def run_check(self, name: str) -> HealthCheck:
        """Run a specific health check"""
        if name not in self._check_functions:
            return HealthCheck(
                component=name,
                component_type=ComponentType.API,
                status=HealthStatus.UNKNOWN,
                message=f"No check registered for {name}",
            )

        config = self._check_functions[name]
        start_time = time.time()

        try:
            check_fn = config["function"]
            if asyncio.iscoroutinefunction(check_fn):
                result = await check_fn()
            else:
                result = check_fn()

            response_time = (time.time() - start_time) * 1000

            if isinstance(result, dict):
                status = HealthStatus(result.get("status", "healthy"))
                message = result.get("message", "")
                details = result.get("details", {})
            elif isinstance(result, bool):
                status = HealthStatus.HEALTHY if result else HealthStatus.UNHEALTHY
                message = "OK" if result else "Check failed"
                details = {}
            else:
                status = HealthStatus.HEALTHY
                message = str(result)
                details = {}

            check = HealthCheck(
                component=name,
                component_type=config["type"],
                status=status,
                message=message,
                response_time_ms=response_time,
                details=details,
            )

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            check = HealthCheck(
                component=name,
                component_type=config["type"],
                status=HealthStatus.UNHEALTHY,
                message=str(e),
                response_time_ms=response_time,
                details={"error": traceback.format_exc()},
            )

        with self._lock:
            prev = self._checks.get(name)
            if prev and prev.status == HealthStatus.HEALTHY:
                check.last_healthy = prev.checked_at
            elif prev:
                check.last_healthy = prev.last_healthy
                if prev.status != HealthStatus.HEALTHY:
                    check.consecutive_failures = prev.consecutive_failures + 1

            self._checks[name] = check
            self._check_history[name].append(check)
            config["last_checked"] = datetime.utcnow()

        return check

    async def run_all_checks(self) -> Dict[str, HealthCheck]:
        """Run all registered health checks"""
        tasks = [self.run_check(name) for name in self._check_functions]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        result_map = {}
        for name, result in zip(self._check_functions.keys(), results):
            if isinstance(result, Exception):
                result_map[name] = HealthCheck(
                    component=name,
                    component_type=self._check_functions[name]["type"],
                    status=HealthStatus.UNHEALTHY,
                    message=str(result),
                )
            else:
                result_map[name] = result

        return result_map

    def get_overall_status(self) -> HealthStatus:
        """Determine overall system health"""
        if not self._checks:
            return HealthStatus.UNKNOWN

        statuses = [check.status for check in self._checks.values()]

        if any(s == HealthStatus.CRITICAL for s in statuses):
            return HealthStatus.CRITICAL
        if any(s == HealthStatus.UNHEALTHY for s in statuses):
            return HealthStatus.UNHEALTHY
        if any(s == HealthStatus.DEGRADED for s in statuses):
            return HealthStatus.DEGRADED
        if all(s == HealthStatus.HEALTHY for s in statuses):
            return HealthStatus.HEALTHY

        return HealthStatus.DEGRADED

    def get_component_status(self, name: str) -> Optional[HealthCheck]:
        """Get status of a specific component"""
        return self._checks.get(name)

    def get_all_statuses(self) -> Dict[str, HealthCheck]:
        """Get all component statuses"""
        return dict(self._checks)

    def get_check_history(self, name: str, limit: int = 100) -> List[HealthCheck]:
        """Get check history for a component"""
        history = list(self._check_history.get(name, []))
        return history[-limit:]


# ==================== System Monitor ====================

class SystemMonitorService:
    """Main system monitoring service"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        self.metrics = MetricsCollector()
        self.performance = PerformanceMonitor()
        self.alerts = AlertManager()
        self.health = HealthCheckManager()

        self._start_time = time.time()
        self._snapshots: deque = deque(maxlen=1440)  # 24h at 1/min
        self._monitoring_task = None
        self._monitoring_interval = 30  # seconds
        self._is_running = False

        self._setup_default_health_checks()
        logger.info("System Monitor Service initialized")

    def _setup_default_health_checks(self):
        """Register default health checks"""

        def check_cpu():
            usage = psutil.cpu_percent(interval=0.1)
            if usage > 95:
                return {"status": "critical", "message": f"CPU at {usage}%", "details": {"usage": usage}}
            elif usage > 80:
                return {"status": "degraded", "message": f"CPU at {usage}%", "details": {"usage": usage}}
            return {"status": "healthy", "message": f"CPU at {usage}%", "details": {"usage": usage}}

        def check_memory():
            mem = psutil.virtual_memory()
            if mem.percent > 95:
                return {"status": "critical", "message": f"Memory at {mem.percent}%"}
            elif mem.percent > 85:
                return {"status": "degraded", "message": f"Memory at {mem.percent}%"}
            return {"status": "healthy", "message": f"Memory at {mem.percent}%",
                    "details": {"used_gb": round(mem.used / (1024**3), 2), "total_gb": round(mem.total / (1024**3), 2)}}

        def check_disk():
            disk = psutil.disk_usage('/')
            if disk.percent > 90:
                return {"status": "critical", "message": f"Disk at {disk.percent}%"}
            elif disk.percent > 80:
                return {"status": "degraded", "message": f"Disk at {disk.percent}%"}
            return {"status": "healthy", "message": f"Disk at {disk.percent}%",
                    "details": {"used_gb": round(disk.used / (1024**3), 2), "total_gb": round(disk.total / (1024**3), 2)}}

        self.health.register_check("cpu", ComponentType.API, check_cpu)
        self.health.register_check("memory", ComponentType.API, check_memory)
        self.health.register_check("disk", ComponentType.STORAGE, check_disk)

    async def start_monitoring(self):
        """Start background monitoring loop"""
        if self._is_running:
            return
        self._is_running = True
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("System monitoring started")

    async def stop_monitoring(self):
        """Stop background monitoring"""
        self._is_running = False
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("System monitoring stopped")

    async def _monitoring_loop(self):
        """Background monitoring loop"""
        while self._is_running:
            try:
                await self._collect_system_metrics()
                await self.health.run_all_checks()
                self.alerts.check_rules(self.metrics)
                self.metrics.cleanup()

                snapshot = await self.get_system_snapshot()
                self._snapshots.append(snapshot)

            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")

            await asyncio.sleep(self._monitoring_interval)

    async def _collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=0.1)
            self.metrics.gauge("system.cpu_percent", cpu_percent, unit="%")
            cpu_freq = psutil.cpu_freq()
            if cpu_freq:
                self.metrics.gauge("system.cpu_freq_mhz", cpu_freq.current, unit="MHz")

            # Per-core CPU
            per_cpu = psutil.cpu_percent(interval=0.1, percpu=True)
            for i, usage in enumerate(per_cpu):
                self.metrics.gauge(f"system.cpu_core_{i}_percent", usage, unit="%")

            # Memory
            mem = psutil.virtual_memory()
            self.metrics.gauge("system.memory_percent", mem.percent, unit="%")
            self.metrics.gauge("system.memory_used_mb", mem.used / (1024**2), unit="MB")
            self.metrics.gauge("system.memory_available_mb", mem.available / (1024**2), unit="MB")

            # Swap
            swap = psutil.swap_memory()
            self.metrics.gauge("system.swap_percent", swap.percent, unit="%")

            # Disk
            disk = psutil.disk_usage('/')
            self.metrics.gauge("system.disk_percent", disk.percent, unit="%")
            self.metrics.gauge("system.disk_used_gb", disk.used / (1024**3), unit="GB")

            # Disk I/O
            try:
                disk_io = psutil.disk_io_counters()
                if disk_io:
                    self.metrics.gauge("system.disk_read_bytes", disk_io.read_bytes, unit="bytes")
                    self.metrics.gauge("system.disk_write_bytes", disk_io.write_bytes, unit="bytes")
            except Exception:
                pass

            # Network
            net = psutil.net_io_counters()
            self.metrics.gauge("system.net_bytes_sent", net.bytes_sent, unit="bytes")
            self.metrics.gauge("system.net_bytes_recv", net.bytes_recv, unit="bytes")
            self.metrics.gauge("system.net_packets_sent", net.packets_sent)
            self.metrics.gauge("system.net_packets_recv", net.packets_recv)

            # Network connections
            try:
                connections = psutil.net_connections()
                self.metrics.gauge("system.open_connections", len(connections))
                established = len([c for c in connections if c.status == 'ESTABLISHED'])
                self.metrics.gauge("system.established_connections", established)
            except (psutil.AccessDenied, PermissionError):
                pass

            # Process info
            process = psutil.Process()
            self.metrics.gauge("system.process_threads", process.num_threads())
            self.metrics.gauge("system.process_memory_mb", process.memory_info().rss / (1024**2), unit="MB")
            self.metrics.gauge("system.process_cpu_percent", process.cpu_percent())
            self.metrics.gauge("system.process_open_files", len(process.open_files()))

            # Uptime
            uptime = time.time() - self._start_time
            self.metrics.gauge("system.uptime_seconds", uptime, unit="s")

        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")

    async def get_system_snapshot(self) -> SystemSnapshot:
        """Get current system snapshot"""
        try:
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net = psutil.net_io_counters()
            uptime = time.time() - self._start_time

            component_health = []
            for name, check in self.health.get_all_statuses().items():
                component_health.append({
                    "component": check.component,
                    "type": check.component_type.value,
                    "status": check.status.value,
                    "message": check.message,
                    "response_time_ms": round(check.response_time_ms, 2),
                })

            return SystemSnapshot(
                overall_status=self.health.get_overall_status(),
                cpu_percent=psutil.cpu_percent(interval=0.1),
                memory_percent=mem.percent,
                memory_used_mb=round(mem.used / (1024**2), 2),
                memory_total_mb=round(mem.total / (1024**2), 2),
                disk_percent=disk.percent,
                disk_used_gb=round(disk.used / (1024**3), 2),
                disk_total_gb=round(disk.total / (1024**3), 2),
                network_bytes_sent=net.bytes_sent,
                network_bytes_recv=net.bytes_recv,
                open_connections=threading.active_count(),
                active_threads=threading.active_count(),
                process_count=len(psutil.pids()),
                uptime_seconds=round(uptime, 2),
                python_version=platform.python_version(),
                platform_info=f"{platform.system()} {platform.release()}",
                component_health=component_health,
                active_alerts=len(self.alerts.get_active_alerts()),
                performance_summary=self.performance.get_summary(),
            )
        except Exception as e:
            logger.error(f"Error creating system snapshot: {e}")
            return SystemSnapshot(overall_status=HealthStatus.UNKNOWN)

    def get_uptime(self) -> str:
        """Get formatted uptime string"""
        uptime_seconds = time.time() - self._start_time
        days = int(uptime_seconds // 86400)
        hours = int((uptime_seconds % 86400) // 3600)
        minutes = int((uptime_seconds % 3600) // 60)
        seconds = int(uptime_seconds % 60)

        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        parts.append(f"{minutes}m")
        parts.append(f"{seconds}s")
        return " ".join(parts)

    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Get complete dashboard monitoring data"""
        snapshot = await self.get_system_snapshot()
        alert_stats = self.alerts.get_alert_stats()
        performance_summary = self.performance.get_summary()
        slow_endpoints = self.performance.get_slowest_endpoints(5)
        error_endpoints = self.performance.get_most_error_prone(5)

        return {
            "system": asdict(snapshot),
            "alerts": alert_stats,
            "performance": performance_summary,
            "slow_endpoints": [asdict(e) for e in slow_endpoints] if slow_endpoints else [],
            "error_endpoints": [asdict(e) for e in error_endpoints] if error_endpoints else [],
            "active_alerts": [asdict(a) for a in self.alerts.get_active_alerts()],
            "uptime": self.get_uptime(),
            "health_status": self.health.get_overall_status().value,
        }

    def get_metric_series(self, metric_name: str, minutes: int = 60) -> List[Dict[str, Any]]:
        """Get metric time series for charting"""
        series = self.metrics.get_series(metric_name, minutes)
        return [
            {
                "timestamp": point.timestamp.isoformat(),
                "value": point.value,
                "labels": point.labels,
            }
            for point in series
        ]

    async def run_diagnostics(self) -> Dict[str, Any]:
        """Run comprehensive system diagnostics"""
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "platform": {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor(),
                "python_version": platform.python_version(),
            },
            "resources": {},
            "health_checks": {},
            "recommendations": [],
        }

        # Resource diagnostics
        cpu_count = psutil.cpu_count()
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        results["resources"] = {
            "cpu_cores": cpu_count,
            "cpu_percent": psutil.cpu_percent(interval=0.5),
            "memory_total_gb": round(mem.total / (1024**3), 2),
            "memory_available_gb": round(mem.available / (1024**3), 2),
            "memory_percent": mem.percent,
            "disk_total_gb": round(disk.total / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_percent": disk.percent,
        }

        # Health checks
        checks = await self.health.run_all_checks()
        for name, check in checks.items():
            results["health_checks"][name] = {
                "status": check.status.value,
                "message": check.message,
                "response_time_ms": round(check.response_time_ms, 2),
            }

        # Recommendations
        if mem.percent > 80:
            results["recommendations"].append(
                "High memory usage detected. Consider scaling up or optimizing memory-intensive operations."
            )
        if disk.percent > 80:
            results["recommendations"].append(
                "Disk space is running low. Consider cleaning up logs and temporary files."
            )
        if psutil.cpu_percent(interval=0.1) > 80:
            results["recommendations"].append(
                "High CPU usage detected. Consider optimizing compute-intensive tasks or scaling horizontally."
            )

        perf_summary = self.performance.get_summary()
        if perf_summary.get("overall_error_rate", 0) > 2:
            results["recommendations"].append(
                "API error rate is elevated. Check error logs for recurring issues."
            )
        if perf_summary.get("avg_response_time_ms", 0) > 1000:
            results["recommendations"].append(
                "Average API response time is high. Review database queries and external service calls."
            )

        if not results["recommendations"]:
            results["recommendations"].append("System is performing within normal parameters.")

        return results


# ==================== Singleton Instance ====================

def get_monitoring_service() -> SystemMonitorService:
    """Get the singleton monitoring service instance"""
    return SystemMonitorService()

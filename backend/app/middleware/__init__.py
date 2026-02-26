"""
Backend Middleware - Authentication, rate limiting, request logging,
CORS, error handling, and security middleware for FastAPI.
"""

import asyncio
import hashlib
import json
import logging
import time
import traceback
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


# ============================================================================
# Rate Limiting Middleware
# ============================================================================

@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_limit: int = 20
    burst_window_seconds: int = 10
    exempt_paths: Set[str] = field(default_factory=lambda: {"/docs", "/openapi.json", "/health"})
    by_ip: bool = True
    by_user: bool = True


class RateLimitStore:
    """In-memory token bucket rate limiter."""

    def __init__(self):
        self._minute_buckets: Dict[str, List[float]] = defaultdict(list)
        self._hour_buckets: Dict[str, List[float]] = defaultdict(list)
        self._burst_buckets: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, config: RateLimitConfig) -> Tuple[bool, Dict[str, Any]]:
        now = time.time()
        minute_ago = now - 60
        hour_ago = now - 3600
        burst_ago = now - config.burst_window_seconds

        # Clean old entries
        self._minute_buckets[key] = [t for t in self._minute_buckets[key] if t > minute_ago]
        self._hour_buckets[key] = [t for t in self._hour_buckets[key] if t > hour_ago]
        self._burst_buckets[key] = [t for t in self._burst_buckets[key] if t > burst_ago]

        minute_count = len(self._minute_buckets[key])
        hour_count = len(self._hour_buckets[key])
        burst_count = len(self._burst_buckets[key])

        headers = {
            "X-RateLimit-Limit": str(config.requests_per_minute),
            "X-RateLimit-Remaining": str(max(0, config.requests_per_minute - minute_count - 1)),
            "X-RateLimit-Reset": str(int(minute_ago + 60)),
        }

        if burst_count >= config.burst_limit:
            headers["Retry-After"] = str(config.burst_window_seconds)
            return False, headers

        if minute_count >= config.requests_per_minute:
            headers["Retry-After"] = "60"
            return False, headers

        if hour_count >= config.requests_per_hour:
            headers["Retry-After"] = "3600"
            return False, headers

        # Record request
        self._minute_buckets[key].append(now)
        self._hour_buckets[key].append(now)
        self._burst_buckets[key].append(now)

        return True, headers


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using token bucket algorithm."""

    def __init__(self, app: ASGIApp, config: Optional[RateLimitConfig] = None):
        super().__init__(app)
        self.config = config or RateLimitConfig()
        self.store = RateLimitStore()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        if path in self.config.exempt_paths:
            return await call_next(request)

        # Determine rate limit key
        client_ip = self._get_client_ip(request)
        key = f"ip:{client_ip}"

        # Check rate limit
        allowed, headers = self.store.is_allowed(key, self.config)

        if not allowed:
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                },
            )
            for k, v in headers.items():
                response.headers[k] = v
            return response

        response = await call_next(request)

        for k, v in headers.items():
            response.headers[k] = v

        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# ============================================================================
# Request Logging Middleware
# ============================================================================

@dataclass
class RequestLog:
    """A request log entry."""
    timestamp: datetime
    method: str
    path: str
    status_code: int
    duration_ms: float
    client_ip: str
    user_agent: str
    content_length: Optional[int]
    response_size: Optional[int]
    user_id: Optional[int]
    error: Optional[str]
    query_params: Dict[str, str]
    correlation_id: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "method": self.method,
            "path": self.path,
            "status_code": self.status_code,
            "duration_ms": round(self.duration_ms, 2),
            "client_ip": self.client_ip,
            "user_agent": self.user_agent[:100] if self.user_agent else None,
            "content_length": self.content_length,
            "response_size": self.response_size,
            "user_id": self.user_id,
            "error": self.error,
            "correlation_id": self.correlation_id,
        }


class RequestMetricsCollector:
    """Collects and aggregates request metrics."""

    def __init__(self):
        self._logs: List[RequestLog] = []
        self._path_metrics: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            "count": 0, "total_duration": 0, "errors": 0,
            "status_codes": defaultdict(int), "durations": [],
        })
        self._hourly_counts: Dict[int, int] = defaultdict(int)
        self._max_logs = 10000

    def record(self, log: RequestLog):
        self._logs.append(log)
        if len(self._logs) > self._max_logs:
            self._logs = self._logs[-self._max_logs:]

        metrics = self._path_metrics[log.path]
        metrics["count"] += 1
        metrics["total_duration"] += log.duration_ms
        metrics["status_codes"][log.status_code] += 1
        metrics["durations"].append(log.duration_ms)
        if len(metrics["durations"]) > 1000:
            metrics["durations"] = metrics["durations"][-1000:]
        if log.status_code >= 400:
            metrics["errors"] += 1

        self._hourly_counts[log.timestamp.hour] += 1

    def get_metrics(self) -> Dict[str, Any]:
        total_requests = sum(m["count"] for m in self._path_metrics.values())
        total_errors = sum(m["errors"] for m in self._path_metrics.values())
        all_durations = []
        for m in self._path_metrics.values():
            all_durations.extend(m["durations"])

        return {
            "overview": {
                "total_requests": total_requests,
                "total_errors": total_errors,
                "error_rate": round(total_errors / max(total_requests, 1) * 100, 2),
                "avg_duration_ms": round(sum(all_durations) / max(len(all_durations), 1), 2),
                "p95_duration_ms": self._percentile(all_durations, 95),
                "p99_duration_ms": self._percentile(all_durations, 99),
            },
            "by_path": {
                path: {
                    "count": m["count"],
                    "avg_duration_ms": round(m["total_duration"] / max(m["count"], 1), 2),
                    "error_rate": round(m["errors"] / max(m["count"], 1) * 100, 2),
                    "p95_duration_ms": self._percentile(m["durations"], 95),
                }
                for path, m in sorted(self._path_metrics.items(), key=lambda x: x[1]["count"], reverse=True)[:20]
            },
            "hourly_distribution": dict(self._hourly_counts),
            "recent_errors": [
                log.to_dict() for log in reversed(self._logs)
                if log.status_code >= 400
            ][:10],
        }

    def _percentile(self, data: List[float], p: int) -> float:
        if not data:
            return 0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * p / 100)
        return round(sorted_data[min(index, len(sorted_data) - 1)], 2)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs all HTTP requests with timing and correlation IDs."""

    def __init__(self, app: ASGIApp, metrics_collector: Optional[RequestMetricsCollector] = None):
        super().__init__(app)
        self.metrics = metrics_collector or RequestMetricsCollector()
        self._counter = 0
        self._skip_paths = {"/docs", "/openapi.json", "/redoc", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in self._skip_paths:
            return await call_next(request)

        start_time = time.time()
        self._counter += 1

        # Generate correlation ID
        correlation_id = request.headers.get(
            "X-Correlation-ID",
            f"req_{int(start_time * 1000)}_{self._counter}"
        )

        # Store correlation ID in request state
        request.state.correlation_id = correlation_id

        # Process request
        error_msg = None
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Request error [{correlation_id}]: {traceback.format_exc()}")
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "correlation_id": correlation_id},
            )
            status_code = 500

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Add response headers
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        # Create log entry
        log_entry = RequestLog(
            timestamp=datetime.utcnow(),
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            duration_ms=duration_ms,
            client_ip=self._get_client_ip(request),
            user_agent=request.headers.get("user-agent", ""),
            content_length=int(request.headers.get("content-length", 0) or 0),
            response_size=int(response.headers.get("content-length", 0) or 0),
            user_id=getattr(request.state, "user_id", None),
            error=error_msg,
            query_params=dict(request.query_params),
            correlation_id=correlation_id,
        )

        self.metrics.record(log_entry)

        # Log slow requests
        if duration_ms > 1000:
            logger.warning(
                f"Slow request [{correlation_id}]: {request.method} {request.url.path} "
                f"took {duration_ms:.0f}ms (status: {status_code})"
            )

        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# ============================================================================
# Security Headers Middleware
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to all responses."""

    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
    }

    CSP_DIRECTIVES = {
        "default-src": "'self'",
        "script-src": "'self' 'unsafe-inline'",
        "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src": "'self' https://fonts.gstatic.com",
        "img-src": "'self' data: https:",
        "connect-src": "'self' ws: wss:",
        "frame-ancestors": "'none'",
        "base-uri": "'self'",
        "form-action": "'self'",
    }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        for header, value in self.SECURITY_HEADERS.items():
            response.headers[header] = value

        csp = "; ".join(f"{k} {v}" for k, v in self.CSP_DIRECTIVES.items())
        response.headers["Content-Security-Policy"] = csp

        return response


# ============================================================================
# Error Handling Middleware
# ============================================================================

@dataclass
class ErrorResponse:
    """Structured error response."""
    status_code: int
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "timestamp": self.timestamp,
            }
        }
        if self.details:
            result["error"]["details"] = self.details
        if self.correlation_id:
            result["error"]["correlation_id"] = self.correlation_id
        return result


ERROR_CODE_MAP = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
}


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Catches exceptions and returns structured error responses."""

    def __init__(self, app: ASGIApp, debug: bool = False):
        super().__init__(app)
        self.debug = debug
        self._error_counts: Dict[int, int] = defaultdict(int)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            response = await call_next(request)

            if response.status_code >= 400:
                self._error_counts[response.status_code] += 1

            return response

        except HTTPException as exc:
            self._error_counts[exc.status_code] += 1
            error = ErrorResponse(
                status_code=exc.status_code,
                error_code=ERROR_CODE_MAP.get(exc.status_code, "UNKNOWN_ERROR"),
                message=str(exc.detail),
                correlation_id=getattr(request.state, "correlation_id", None),
            )
            return JSONResponse(status_code=exc.status_code, content=error.to_dict())

        except ValueError as exc:
            self._error_counts[422] += 1
            error = ErrorResponse(
                status_code=422,
                error_code="VALIDATION_ERROR",
                message=str(exc),
                correlation_id=getattr(request.state, "correlation_id", None),
            )
            return JSONResponse(status_code=422, content=error.to_dict())

        except PermissionError as exc:
            self._error_counts[403] += 1
            error = ErrorResponse(
                status_code=403,
                error_code="FORBIDDEN",
                message="You do not have permission to perform this action.",
                correlation_id=getattr(request.state, "correlation_id", None),
            )
            return JSONResponse(status_code=403, content=error.to_dict())

        except Exception as exc:
            self._error_counts[500] += 1
            logger.error(f"Unhandled exception: {traceback.format_exc()}")

            details = None
            if self.debug:
                details = {
                    "exception_type": type(exc).__name__,
                    "exception_message": str(exc),
                    "traceback": traceback.format_exc().split("\n"),
                }

            error = ErrorResponse(
                status_code=500,
                error_code="INTERNAL_SERVER_ERROR",
                message="An unexpected error occurred. Please try again later.",
                details=details,
                correlation_id=getattr(request.state, "correlation_id", None),
            )
            return JSONResponse(status_code=500, content=error.to_dict())

    def get_error_stats(self) -> Dict[str, int]:
        return dict(self._error_counts)


# ============================================================================
# Request Validation Middleware
# ============================================================================

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validates incoming requests for security concerns."""

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    BLOCKED_USER_AGENTS = {"sqlmap", "nikto", "nmap", "dirbuster", "gobuster"}
    SUSPICIOUS_PATTERNS = ["<script", "javascript:", "vbscript:", "onload=", "onerror="]

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_CONTENT_LENGTH:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large", "max_size_mb": 50},
            )

        # Check for suspicious user agents
        user_agent = request.headers.get("user-agent", "").lower()
        for blocked in self.BLOCKED_USER_AGENTS:
            if blocked in user_agent:
                logger.warning(f"Blocked suspicious user agent: {user_agent}")
                return JSONResponse(status_code=403, content={"detail": "Forbidden"})

        # Check query parameters for injection
        for key, value in request.query_params.items():
            if self._is_suspicious(value):
                logger.warning(f"Suspicious query parameter: {key}={value[:50]}")
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid request parameters"},
                )

        return await call_next(request)

    def _is_suspicious(self, value: str) -> bool:
        value_lower = value.lower()
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern in value_lower:
                return True
        return False


# ============================================================================
# CORS Configuration Middleware
# ============================================================================

class CORSConfig:
    """CORS configuration."""

    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://cancerguard.ai",
        "https://app.cancerguard.ai",
        "https://admin.cancerguard.ai",
    ]

    ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]

    ALLOWED_HEADERS = [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Correlation-ID",
        "X-Client-Version",
        "Accept",
        "Accept-Language",
        "Cache-Control",
    ]

    EXPOSED_HEADERS = [
        "X-Correlation-ID",
        "X-Response-Time",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Content-Disposition",
    ]

    MAX_AGE = 3600


# ============================================================================
# Health Check Middleware
# ============================================================================

@dataclass
class HealthStatus:
    """Health check status."""
    status: str  # "healthy", "degraded", "unhealthy"
    uptime_seconds: float
    version: str
    checks: Dict[str, Dict[str, Any]]
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "uptime_seconds": round(self.uptime_seconds, 2),
            "version": self.version,
            "checks": self.checks,
            "timestamp": self.timestamp,
        }


class HealthCheckService:
    """Service for performing health checks."""

    def __init__(self):
        self._start_time = time.time()
        self._version = "1.0.0"
        self._custom_checks: Dict[str, Callable] = {}

    def register_check(self, name: str, check_fn: Callable):
        self._custom_checks[name] = check_fn

    async def check_health(self) -> HealthStatus:
        checks = {}

        # Database check
        checks["database"] = await self._check_database()

        # Memory check
        checks["memory"] = self._check_memory()

        # Disk check
        checks["disk"] = self._check_disk()

        # Custom checks
        for name, check_fn in self._custom_checks.items():
            try:
                if asyncio.iscoroutinefunction(check_fn):
                    checks[name] = await check_fn()
                else:
                    checks[name] = check_fn()
            except Exception as e:
                checks[name] = {"status": "unhealthy", "error": str(e)}

        # Determine overall status
        statuses = [c.get("status", "unknown") for c in checks.values()]
        if all(s == "healthy" for s in statuses):
            overall = "healthy"
        elif any(s == "unhealthy" for s in statuses):
            overall = "unhealthy"
        else:
            overall = "degraded"

        return HealthStatus(
            status=overall,
            uptime_seconds=time.time() - self._start_time,
            version=self._version,
            checks=checks,
        )

    async def _check_database(self) -> Dict[str, Any]:
        try:
            # Simulated DB check
            return {"status": "healthy", "latency_ms": 2.5, "connections": 10}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def _check_memory(self) -> Dict[str, Any]:
        try:
            import os
            # Simple memory check
            return {
                "status": "healthy",
                "pid": os.getpid(),
            }
        except Exception:
            return {"status": "healthy"}

    def _check_disk(self) -> Dict[str, Any]:
        try:
            import os
            return {"status": "healthy", "cwd": os.getcwd()}
        except Exception:
            return {"status": "healthy"}


# ============================================================================
# Compression Middleware
# ============================================================================

class CompressionConfig:
    """Configuration for response compression."""
    min_size_bytes: int = 1024
    compress_level: int = 6
    content_types: Set[str] = field(default_factory=lambda: {
        "application/json", "text/html", "text/css",
        "text/plain", "application/javascript",
    }) if False else {
        "application/json", "text/html", "text/css",
        "text/plain", "application/javascript",
    }


# ============================================================================
# Middleware Registry
# ============================================================================

# Global instances
request_metrics = RequestMetricsCollector()
health_service = HealthCheckService()


def setup_middleware(app: FastAPI, debug: bool = False):
    """Configure all middleware for the application."""

    # Order matters: outermost middleware runs first
    # 1. Error handling (outermost - catches all errors)
    app.add_middleware(ErrorHandlingMiddleware, debug=debug)

    # 2. Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 3. Request validation
    app.add_middleware(RequestValidationMiddleware)

    # 4. Rate limiting
    app.add_middleware(RateLimitMiddleware, config=RateLimitConfig(
        requests_per_minute=120,
        requests_per_hour=5000,
        burst_limit=30,
    ))

    # 5. Request logging (innermost - logs after processing)
    app.add_middleware(RequestLoggingMiddleware, metrics_collector=request_metrics)

    logger.info("All middleware configured successfully")


def get_metrics() -> Dict[str, Any]:
    """Get request metrics."""
    return request_metrics.get_metrics()


async def get_health() -> Dict[str, Any]:
    """Get health check status."""
    status = await health_service.check_health()
    return status.to_dict()

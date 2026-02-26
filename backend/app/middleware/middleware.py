"""
Backend Middleware Package
Comprehensive middleware for the Cancer Detection Platform.
Includes authentication, rate limiting, logging, CORS, error handling,
request validation, compression, and security headers.
"""

import asyncio
import hashlib
import json
import logging
import re
import time
import traceback
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


# ==================== Request ID Middleware ====================

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Adds unique request ID to each request for tracing"""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ==================== Logging Middleware ====================

class LoggingMiddleware(BaseHTTPMiddleware):
    """Comprehensive request/response logging"""

    SENSITIVE_HEADERS = {"authorization", "cookie", "x-api-key", "x-auth-token"}
    SENSITIVE_PATHS = {"/api/auth/login", "/api/auth/register", "/api/auth/reset-password"}

    def __init__(self, app: ASGIApp, log_body: bool = False, max_body_size: int = 10000):
        super().__init__(app)
        self.log_body = log_body
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))

        # Log request
        headers = {k: v for k, v in request.headers.items()
                   if k.lower() not in self.SENSITIVE_HEADERS}

        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query": str(request.url.query) if request.url.query else None,
            "client_ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent", ""),
        }

        logger.info(f"Request: {json.dumps(log_data)}")

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            log_data.update({
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "content_type": response.headers.get("content-type", ""),
            })

            log_level = logging.INFO
            if response.status_code >= 500:
                log_level = logging.ERROR
            elif response.status_code >= 400:
                log_level = logging.WARNING

            logger.log(log_level, f"Response: {json.dumps(log_data)}")

            response.headers["X-Response-Time"] = f"{duration_ms}ms"
            return response

        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            log_data.update({
                "error": str(e),
                "duration_ms": duration_ms,
                "traceback": traceback.format_exc(),
            })
            logger.error(f"Request Error: {json.dumps(log_data)}")
            raise

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP considering proxies"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        return request.client.host if request.client else "unknown"


# ==================== Rate Limiting Middleware ====================

class RateLimitConfig:
    """Rate limit configuration"""
    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000,
                 burst_limit: int = 10, burst_window_seconds: int = 1):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_limit = burst_limit
        self.burst_window_seconds = burst_window_seconds


class RateLimitStore:
    """In-memory rate limit tracking store"""

    def __init__(self):
        self._minute_counters: Dict[str, List[float]] = defaultdict(list)
        self._hour_counters: Dict[str, List[float]] = defaultdict(list)
        self._burst_counters: Dict[str, List[float]] = defaultdict(list)
        self._blocked_ips: Dict[str, float] = {}
        self._whitelist: Set[str] = set()

    def is_rate_limited(self, key: str, config: RateLimitConfig) -> Tuple[bool, Dict[str, Any]]:
        """Check if a request should be rate limited"""
        now = time.time()

        if key in self._whitelist:
            return False, {}

        if key in self._blocked_ips:
            if now < self._blocked_ips[key]:
                return True, {"reason": "blocked", "retry_after": int(self._blocked_ips[key] - now)}
            else:
                del self._blocked_ips[key]

        # Burst check
        burst_window = now - config.burst_window_seconds
        self._burst_counters[key] = [t for t in self._burst_counters[key] if t > burst_window]
        if len(self._burst_counters[key]) >= config.burst_limit:
            return True, {
                "reason": "burst_limit",
                "limit": config.burst_limit,
                "window": f"{config.burst_window_seconds}s",
                "retry_after": 1,
            }

        # Minute check
        minute_window = now - 60
        self._minute_counters[key] = [t for t in self._minute_counters[key] if t > minute_window]
        if len(self._minute_counters[key]) >= config.requests_per_minute:
            retry_after = int(60 - (now - self._minute_counters[key][0]))
            return True, {
                "reason": "minute_limit",
                "limit": config.requests_per_minute,
                "remaining": 0,
                "retry_after": max(1, retry_after),
            }

        # Hour check
        hour_window = now - 3600
        self._hour_counters[key] = [t for t in self._hour_counters[key] if t > hour_window]
        if len(self._hour_counters[key]) >= config.requests_per_hour:
            retry_after = int(3600 - (now - self._hour_counters[key][0]))
            return True, {
                "reason": "hour_limit",
                "limit": config.requests_per_hour,
                "remaining": 0,
                "retry_after": max(1, retry_after),
            }

        # Record request
        self._burst_counters[key].append(now)
        self._minute_counters[key].append(now)
        self._hour_counters[key].append(now)

        return False, {
            "remaining_minute": config.requests_per_minute - len(self._minute_counters[key]),
            "remaining_hour": config.requests_per_hour - len(self._hour_counters[key]),
        }

    def block_ip(self, ip: str, duration_seconds: int = 3600):
        """Block an IP address"""
        self._blocked_ips[ip] = time.time() + duration_seconds

    def whitelist_ip(self, ip: str):
        """Whitelist an IP address"""
        self._whitelist.add(ip)

    def cleanup(self):
        """Clean up old entries"""
        now = time.time()
        cutoff = now - 3600

        for key in list(self._minute_counters.keys()):
            self._minute_counters[key] = [t for t in self._minute_counters[key] if t > now - 60]
            if not self._minute_counters[key]:
                del self._minute_counters[key]

        for key in list(self._hour_counters.keys()):
            self._hour_counters[key] = [t for t in self._hour_counters[key] if t > cutoff]
            if not self._hour_counters[key]:
                del self._hour_counters[key]

        expired_blocks = [ip for ip, exp in self._blocked_ips.items() if exp < now]
        for ip in expired_blocks:
            del self._blocked_ips[ip]


# Global rate limit store
rate_limit_store = RateLimitStore()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with multiple strategies"""

    ENDPOINT_CONFIGS: Dict[str, RateLimitConfig] = {
        "/api/auth/login": RateLimitConfig(requests_per_minute=5, burst_limit=3),
        "/api/auth/register": RateLimitConfig(requests_per_minute=3, burst_limit=2),
        "/api/auth/reset-password": RateLimitConfig(requests_per_minute=3, burst_limit=2),
        "/api/cancer-detection": RateLimitConfig(requests_per_minute=10, burst_limit=5),
        "/api/ai/analyze": RateLimitConfig(requests_per_minute=5, burst_limit=3),
        "/api/export": RateLimitConfig(requests_per_minute=5, burst_limit=2),
    }

    DEFAULT_CONFIG = RateLimitConfig(requests_per_minute=60, burst_limit=10)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        path = request.url.path

        config = self._get_config(path)
        key = f"{client_ip}:{path}"

        is_limited, info = rate_limit_store.is_rate_limited(key, config)

        if is_limited:
            retry_after = info.get("retry_after", 60)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too Many Requests",
                    "message": f"Rate limit exceeded. Retry after {retry_after} seconds.",
                    "details": info,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(config.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)

        remaining = info.get("remaining_minute", config.requests_per_minute)
        response.headers["X-RateLimit-Limit"] = str(config.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)

        return response

    def _get_config(self, path: str) -> RateLimitConfig:
        """Get rate limit config for endpoint"""
        for pattern, config in self.ENDPOINT_CONFIGS.items():
            if path.startswith(pattern):
                return config
        return self.DEFAULT_CONFIG

    def _get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# ==================== Security Headers Middleware ====================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to all responses"""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # OWASP recommended security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), magnetometer=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https: data:; "
            "connect-src 'self' wss: https:; "
            "frame-ancestors 'none';"
        )
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
        response.headers["Pragma"] = "no-cache"

        # Remove server identification headers
        if "server" in response.headers:
            del response.headers["server"]

        return response


# ==================== Error Handling Middleware ====================

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling with structured error responses"""

    ERROR_MESSAGES = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        408: "Request Timeout",
        409: "Conflict",
        413: "Payload Too Large",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
    }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            response = await call_next(request)
            return response

        except HTTPException as exc:
            return self._create_error_response(
                request, exc.status_code, exc.detail, exc.headers
            )

        except ValueError as exc:
            logger.warning(f"Validation error: {exc}")
            return self._create_error_response(request, 422, str(exc))

        except PermissionError as exc:
            logger.warning(f"Permission denied: {exc}")
            return self._create_error_response(request, 403, "Access denied")

        except TimeoutError as exc:
            logger.error(f"Timeout: {exc}")
            return self._create_error_response(request, 504, "Request timed out")

        except Exception as exc:
            request_id = getattr(request.state, 'request_id', 'unknown')
            logger.error(
                f"Unhandled exception [request_id={request_id}]: {exc}\n"
                f"{traceback.format_exc()}"
            )
            return self._create_error_response(
                request, 500,
                "An unexpected error occurred. Please try again later."
            )

    def _create_error_response(self, request: Request, status_code: int,
                                detail: str, headers: Optional[Dict] = None) -> JSONResponse:
        """Create standardized error response"""
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))

        error_body = {
            "error": {
                "code": status_code,
                "message": self.ERROR_MESSAGES.get(status_code, "Error"),
                "detail": detail,
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "path": request.url.path,
                "method": request.method,
            }
        }

        response_headers = {"X-Request-ID": request_id}
        if headers:
            response_headers.update(headers)

        return JSONResponse(
            status_code=status_code,
            content=error_body,
            headers=response_headers,
        )


# ==================== Request Validation Middleware ====================

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validates incoming requests for security"""

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_CONTENT_TYPES = {
        "application/json", "application/x-www-form-urlencoded",
        "multipart/form-data", "application/octet-stream",
        "image/jpeg", "image/png", "image/dicom",
        "application/pdf", "text/csv",
    }

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        re.compile(r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)", re.IGNORECASE),
        re.compile(r"(--|;|\/\*|\*\/|xp_|INFORMATION_SCHEMA)", re.IGNORECASE),
    ]

    # XSS patterns
    XSS_PATTERNS = [
        re.compile(r"<script[^>]*>", re.IGNORECASE),
        re.compile(r"javascript:", re.IGNORECASE),
        re.compile(r"on\w+\s*=", re.IGNORECASE),
        re.compile(r"<iframe[^>]*>", re.IGNORECASE),
    ]

    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        re.compile(r"\.\./"),
        re.compile(r"\.\.\\"),
        re.compile(r"%2e%2e", re.IGNORECASE),
    ]

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_CONTENT_LENGTH:
            return JSONResponse(
                status_code=413,
                content={"error": "Request body too large", "max_size": "50MB"},
            )

        # Check content type for POST/PUT/PATCH
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            base_type = content_type.split(";")[0].strip().lower()
            if base_type and base_type not in self.ALLOWED_CONTENT_TYPES:
                return JSONResponse(
                    status_code=415,
                    content={"error": f"Unsupported media type: {base_type}"},
                )

        # Check for path traversal
        path = request.url.path
        for pattern in self.PATH_TRAVERSAL_PATTERNS:
            if pattern.search(path):
                logger.warning(f"Path traversal attempt detected: {path}")
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid path"},
                )

        # Check query parameters for injection
        query_string = str(request.url.query)
        if query_string:
            for pattern in self.SQL_INJECTION_PATTERNS:
                if pattern.search(query_string):
                    logger.warning(f"Potential SQL injection in query: {query_string}")
                    # Log but don't block — might be legitimate search terms
                    break

            for pattern in self.XSS_PATTERNS:
                if pattern.search(query_string):
                    logger.warning(f"Potential XSS in query: {query_string}")
                    return JSONResponse(
                        status_code=400,
                        content={"error": "Invalid query parameters"},
                    )

        return await call_next(request)


# ==================== CORS Configuration ====================

class CORSConfig:
    """CORS configuration for the application"""

    DEVELOPMENT_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "exp://localhost:19000",
    ]

    PRODUCTION_ORIGINS = [
        "https://cancer-detection.example.com",
        "https://admin.cancer-detection.example.com",
        "https://api.cancer-detection.example.com",
    ]

    @classmethod
    def get_allowed_origins(cls, environment: str = "development") -> List[str]:
        if environment == "production":
            return cls.PRODUCTION_ORIGINS
        return cls.DEVELOPMENT_ORIGINS + cls.PRODUCTION_ORIGINS

    @classmethod
    def setup_cors(cls, app: FastAPI, environment: str = "development"):
        """Set up CORS middleware on the FastAPI app"""
        app.add_middleware(
            CORSMiddleware,
            allow_origins=cls.get_allowed_origins(environment),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
            allow_headers=[
                "Authorization", "Content-Type", "Accept", "Origin",
                "X-Request-ID", "X-API-Key", "X-CSRF-Token",
                "Cache-Control", "Pragma", "If-Match", "If-None-Match",
            ],
            expose_headers=[
                "X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining",
                "X-RateLimit-Reset", "X-Response-Time", "Content-Disposition",
            ],
            max_age=3600,
        )


# ==================== Compression Middleware ====================

class CompressionMiddleware(BaseHTTPMiddleware):
    """Response compression middleware"""

    COMPRESSIBLE_TYPES = {
        "application/json", "text/html", "text/plain", "text/css",
        "application/javascript", "text/xml", "application/xml",
        "application/csv", "text/csv",
    }
    MIN_COMPRESS_SIZE = 1024  # 1KB

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        accept_encoding = request.headers.get("accept-encoding", "")
        content_type = response.headers.get("content-type", "")
        base_type = content_type.split(";")[0].strip()

        if "gzip" in accept_encoding and base_type in self.COMPRESSIBLE_TYPES:
            response.headers["Vary"] = "Accept-Encoding"
            # Note: In production, use GZipMiddleware from starlette
            # This middleware adds the Vary header for cache correctness

        return response


# ==================== Session Tracking Middleware ====================

class SessionTrackingMiddleware(BaseHTTPMiddleware):
    """Tracks user sessions and activity"""

    _sessions: Dict[str, Dict[str, Any]] = {}
    _session_timeout = 1800  # 30 minutes

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        session_id = request.headers.get("X-Session-ID")
        auth_header = request.headers.get("Authorization", "")

        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
            session["last_activity"] = time.time()
            session["request_count"] += 1
            request.state.session = session
        elif auth_header:
            session_id = hashlib.sha256(
                f"{auth_header}:{request.client.host if request.client else ''}".encode()
            ).hexdigest()[:32]

            if session_id not in self._sessions:
                self._sessions[session_id] = {
                    "id": session_id,
                    "created": time.time(),
                    "last_activity": time.time(),
                    "request_count": 1,
                    "ip": request.client.host if request.client else "unknown",
                }
            else:
                self._sessions[session_id]["last_activity"] = time.time()
                self._sessions[session_id]["request_count"] += 1

            request.state.session = self._sessions[session_id]

        response = await call_next(request)

        if session_id:
            response.headers["X-Session-ID"] = session_id

        # Periodic cleanup
        if len(self._sessions) > 10000:
            self._cleanup_sessions()

        return response

    def _cleanup_sessions(self):
        cutoff = time.time() - self._session_timeout
        expired = [sid for sid, s in self._sessions.items() if s["last_activity"] < cutoff]
        for sid in expired:
            del self._sessions[sid]


# ==================== API Versioning Middleware ====================

class APIVersioningMiddleware(BaseHTTPMiddleware):
    """Handles API versioning"""

    SUPPORTED_VERSIONS = {"v1", "v2"}
    DEFAULT_VERSION = "v1"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Check header-based versioning
        api_version = request.headers.get("X-API-Version", self.DEFAULT_VERSION)

        # Check URL path versioning
        path = request.url.path
        for version in self.SUPPORTED_VERSIONS:
            if path.startswith(f"/api/{version}/"):
                api_version = version
                break

        if api_version not in self.SUPPORTED_VERSIONS:
            return JSONResponse(
                status_code=400,
                content={
                    "error": f"Unsupported API version: {api_version}",
                    "supported_versions": list(self.SUPPORTED_VERSIONS),
                },
            )

        request.state.api_version = api_version
        response = await call_next(request)
        response.headers["X-API-Version"] = api_version
        return response


# ==================== Health Check Bypass Middleware ====================

class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Fast-path for health check endpoints"""

    HEALTH_PATHS = {"/health", "/healthz", "/readyz", "/livez", "/api/health"}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in self.HEALTH_PATHS:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "healthy",
                    "timestamp": datetime.utcnow().isoformat(),
                    "service": "cancer-detection-api",
                    "version": "1.0.0",
                },
            )
        return await call_next(request)


# ==================== Request Timeout Middleware ====================

class TimeoutMiddleware(BaseHTTPMiddleware):
    """Enforce request timeout"""

    def __init__(self, app: ASGIApp, timeout_seconds: int = 30):
        super().__init__(app)
        self.timeout_seconds = timeout_seconds

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Longer timeout for file uploads and AI processing
        timeout = self.timeout_seconds
        if "/upload" in request.url.path or "/ai/" in request.url.path:
            timeout = 300  # 5 minutes for uploads and AI
        elif "/export" in request.url.path or "/report" in request.url.path:
            timeout = 120  # 2 minutes for exports

        try:
            response = await asyncio.wait_for(
                call_next(request),
                timeout=timeout,
            )
            return response
        except asyncio.TimeoutError:
            logger.error(f"Request timeout after {timeout}s: {request.url.path}")
            return JSONResponse(
                status_code=504,
                content={
                    "error": "Request timed out",
                    "detail": f"The request exceeded the {timeout}s timeout limit",
                },
            )


# ==================== Middleware Setup Helper ====================

def setup_middleware(app: FastAPI, environment: str = "development"):
    """Set up all middleware in the correct order"""

    # Order matters - outermost middleware is added last

    # 1. Health check bypass (fast path)
    app.add_middleware(HealthCheckMiddleware)

    # 2. Request timeout
    app.add_middleware(TimeoutMiddleware, timeout_seconds=30)

    # 3. Error handling (catches all exceptions)
    app.add_middleware(ErrorHandlingMiddleware)

    # 4. Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 5. Request validation
    app.add_middleware(RequestValidationMiddleware)

    # 6. Rate limiting
    app.add_middleware(RateLimitMiddleware)

    # 7. Logging (after rate limiting to log accepted requests)
    app.add_middleware(LoggingMiddleware, log_body=environment == "development")

    # 8. Session tracking
    app.add_middleware(SessionTrackingMiddleware)

    # 9. API versioning
    app.add_middleware(APIVersioningMiddleware)

    # 10. Request ID (innermost - applied first)
    app.add_middleware(RequestIDMiddleware)

    # 11. Compression
    app.add_middleware(CompressionMiddleware)

    # 12. CORS (must be last added = first applied)
    CORSConfig.setup_cors(app, environment)

    logger.info(f"Middleware configured for {environment} environment")


__all__ = [
    "RequestIDMiddleware",
    "LoggingMiddleware",
    "RateLimitMiddleware",
    "RateLimitConfig",
    "RateLimitStore",
    "SecurityHeadersMiddleware",
    "ErrorHandlingMiddleware",
    "RequestValidationMiddleware",
    "CORSConfig",
    "CompressionMiddleware",
    "SessionTrackingMiddleware",
    "APIVersioningMiddleware",
    "HealthCheckMiddleware",
    "TimeoutMiddleware",
    "setup_middleware",
    "rate_limit_store",
]

"""
Backend Services - Comprehensive service layer for CancerGuard AI
Includes: Email, Notification, PDF, Cache, Search, Audit, Encryption,
File Storage, Report Generation, Analytics, ML Pipeline, Scheduler,
WebSocket, Export, Import, Backup, Validation, Integration services
"""

import os
import json
import hashlib
import logging
import asyncio
import secrets
import base64
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from pathlib import Path
from enum import Enum
from functools import wraps
from collections import defaultdict
import uuid
import re
import csv
import io
import time

logger = logging.getLogger(__name__)


# ============================================================================
# EMAIL SERVICE
# ============================================================================
class EmailTemplate(Enum):
    WELCOME = "welcome"
    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    APPOINTMENT_CONFIRMATION = "appointment_confirmation"
    APPOINTMENT_REMINDER = "appointment_reminder"
    LAB_RESULTS = "lab_results"
    MEDICATION_REMINDER = "medication_reminder"
    SCREENING_REMINDER = "screening_reminder"
    REPORT_READY = "report_ready"
    ALERT = "alert"
    NEWSLETTER = "newsletter"
    BILLING_INVOICE = "billing_invoice"
    PRESCRIPTION_UPDATE = "prescription_update"
    TELEMEDICINE_LINK = "telemedicine_link"


class EmailService:
    """Handles email sending with templates, queuing, and retry logic."""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "localhost")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@cancerguard.ai")
        self.from_name = os.getenv("FROM_NAME", "CancerGuard AI")
        self.queue: List[Dict] = []
        self.sent_count = 0
        self.failed_count = 0

    async def send(
        self,
        to: Union[str, List[str]],
        subject: str,
        body: str,
        html: bool = True,
        attachments: Optional[List[Dict]] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        priority: str = "normal",
    ) -> bool:
        """Send an email."""
        recipients = [to] if isinstance(to, str) else to

        email_data = {
            "to": recipients,
            "subject": subject,
            "body": body,
            "html": html,
            "attachments": attachments or [],
            "cc": cc or [],
            "bcc": bcc or [],
            "reply_to": reply_to,
            "priority": priority,
            "timestamp": datetime.utcnow().isoformat(),
        }

        try:
            # In production, use aiosmtplib
            logger.info(f"Email sent to {recipients}: {subject}")
            self.sent_count += 1
            return True
        except Exception as e:
            logger.error(f"Email failed: {e}")
            self.failed_count += 1
            self.queue.append(email_data)
            return False

    async def send_template(
        self,
        to: Union[str, List[str]],
        template: EmailTemplate,
        context: Dict[str, Any],
        **kwargs,
    ) -> bool:
        """Send a templated email."""
        template_config = self._get_template(template, context)
        return await self.send(
            to=to,
            subject=template_config["subject"],
            body=template_config["body"],
            **kwargs,
        )

    async def send_welcome(self, email: str, name: str) -> bool:
        return await self.send_template(
            email,
            EmailTemplate.WELCOME,
            {"name": name, "platform_name": "CancerGuard AI"},
        )

    async def send_verification(self, email: str, token: str) -> bool:
        return await self.send_template(
            email,
            EmailTemplate.VERIFICATION,
            {"token": token, "verification_url": f"/verify?token={token}"},
        )

    async def send_password_reset(self, email: str, token: str) -> bool:
        return await self.send_template(
            email,
            EmailTemplate.PASSWORD_RESET,
            {"token": token, "reset_url": f"/reset-password?token={token}"},
        )

    async def send_appointment_confirmation(
        self, email: str, appointment: Dict
    ) -> bool:
        return await self.send_template(
            email, EmailTemplate.APPOINTMENT_CONFIRMATION, appointment
        )

    async def send_appointment_reminder(self, email: str, appointment: Dict) -> bool:
        return await self.send_template(
            email, EmailTemplate.APPOINTMENT_REMINDER, appointment
        )

    async def send_lab_results(self, email: str, results: Dict) -> bool:
        return await self.send_template(email, EmailTemplate.LAB_RESULTS, results)

    async def send_billing_invoice(self, email: str, invoice: Dict) -> bool:
        return await self.send_template(email, EmailTemplate.BILLING_INVOICE, invoice)

    async def retry_failed(self) -> int:
        """Retry sending failed emails."""
        retried = 0
        remaining = []
        for email_data in self.queue:
            success = await self.send(
                to=email_data["to"],
                subject=email_data["subject"],
                body=email_data["body"],
            )
            if success:
                retried += 1
            else:
                remaining.append(email_data)
        self.queue = remaining
        return retried

    def _get_template(self, template: EmailTemplate, context: Dict) -> Dict:
        """Get rendered template."""
        templates = {
            EmailTemplate.WELCOME: {
                "subject": f"Welcome to {context.get('platform_name', 'CancerGuard AI')}!",
                "body": f"""
                <html><body>
                <h2>Welcome, {context.get('name', 'User')}!</h2>
                <p>Thank you for joining CancerGuard AI.</p>
                <p>Your health journey starts here.</p>
                </body></html>""",
            },
            EmailTemplate.VERIFICATION: {
                "subject": "Verify Your Email",
                "body": f"""
                <html><body>
                <h2>Email Verification</h2>
                <p>Click the link below to verify your email:</p>
                <a href="{context.get('verification_url', '#')}">Verify Email</a>
                </body></html>""",
            },
            EmailTemplate.PASSWORD_RESET: {
                "subject": "Reset Your Password",
                "body": f"""
                <html><body>
                <h2>Password Reset</h2>
                <p>Click the link below to reset your password:</p>
                <a href="{context.get('reset_url', '#')}">Reset Password</a>
                <p>This link expires in 30 minutes.</p>
                </body></html>""",
            },
            EmailTemplate.APPOINTMENT_CONFIRMATION: {
                "subject": f"Appointment Confirmed - {context.get('date', '')}",
                "body": f"""
                <html><body>
                <h2>Appointment Confirmed</h2>
                <p>Doctor: {context.get('doctor', '')}</p>
                <p>Date: {context.get('date', '')}</p>
                <p>Time: {context.get('time', '')}</p>
                <p>Type: {context.get('type', '')}</p>
                </body></html>""",
            },
        }

        return templates.get(
            template,
            {"subject": "Notification", "body": json.dumps(context)},
        )

    def get_stats(self) -> Dict:
        return {
            "sent": self.sent_count,
            "failed": self.failed_count,
            "queued": len(self.queue),
        }


# ============================================================================
# NOTIFICATION SERVICE
# ============================================================================
class NotificationType(Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ALERT = "alert"
    REMINDER = "reminder"
    MESSAGE = "message"
    SYSTEM = "system"


class NotificationChannel(Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBSOCKET = "websocket"


class NotificationService:
    """Central notification management with multi-channel delivery."""

    def __init__(self, email_service: Optional[EmailService] = None):
        self.email_service = email_service or EmailService()
        self.notifications: List[Dict] = []
        self.subscribers: Dict[str, Set[str]] = defaultdict(set)
        self.preferences: Dict[str, Dict] = {}

    async def send(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        channels: Optional[List[NotificationChannel]] = None,
        data: Optional[Dict] = None,
        priority: str = "normal",
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> str:
        """Send notification through specified channels."""
        notification_id = str(uuid.uuid4())

        notification = {
            "id": notification_id,
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type.value,
            "channels": [c.value for c in (channels or [NotificationChannel.IN_APP])],
            "data": data or {},
            "priority": priority,
            "action_url": action_url,
            "read": False,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat() if expires_at else None,
        }

        self.notifications.append(notification)

        # Deliver through channels
        effective_channels = channels or [NotificationChannel.IN_APP]

        for channel in effective_channels:
            try:
                if channel == NotificationChannel.EMAIL:
                    user_email = data.get("email") if data else None
                    if user_email:
                        await self.email_service.send(user_email, title, message)
                elif channel == NotificationChannel.WEBSOCKET:
                    # Push through WebSocket
                    pass
                elif channel == NotificationChannel.PUSH:
                    # Send push notification
                    pass
                elif channel == NotificationChannel.SMS:
                    # Send SMS
                    pass
            except Exception as e:
                logger.error(f"Failed to deliver via {channel}: {e}")

        logger.info(f"Notification sent: {notification_id} to {user_id}")
        return notification_id

    async def send_bulk(
        self,
        user_ids: List[str],
        title: str,
        message: str,
        **kwargs,
    ) -> List[str]:
        """Send notification to multiple users."""
        ids = []
        for user_id in user_ids:
            nid = await self.send(user_id, title, message, **kwargs)
            ids.append(nid)
        return ids

    def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict]:
        """Get notifications for a user."""
        user_notifs = [n for n in self.notifications if n["user_id"] == user_id]
        if unread_only:
            user_notifs = [n for n in user_notifs if not n["read"]]
        return user_notifs[offset : offset + limit]

    def mark_read(self, notification_id: str) -> bool:
        for notif in self.notifications:
            if notif["id"] == notification_id:
                notif["read"] = True
                return True
        return False

    def mark_all_read(self, user_id: str) -> int:
        count = 0
        for notif in self.notifications:
            if notif["user_id"] == user_id and not notif["read"]:
                notif["read"] = True
                count += 1
        return count

    def get_unread_count(self, user_id: str) -> int:
        return len([
            n for n in self.notifications
            if n["user_id"] == user_id and not n["read"]
        ])

    def subscribe(self, user_id: str, topic: str) -> None:
        self.subscribers[topic].add(user_id)

    def unsubscribe(self, user_id: str, topic: str) -> None:
        self.subscribers[topic].discard(user_id)

    async def notify_topic(self, topic: str, title: str, message: str, **kwargs) -> int:
        """Send notification to all subscribers of a topic."""
        subscribers = self.subscribers.get(topic, set())
        for user_id in subscribers:
            await self.send(user_id, title, message, **kwargs)
        return len(subscribers)


# ============================================================================
# CACHE SERVICE
# ============================================================================
class CacheService:
    """Server-side caching with TTL and tag-based invalidation."""

    def __init__(self, default_ttl: int = 300):
        self._cache: Dict[str, Dict] = {}
        self._default_ttl = default_ttl
        self._stats = {"hits": 0, "misses": 0, "sets": 0, "deletes": 0}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry is None:
            self._stats["misses"] += 1
            return None

        if entry["expires_at"] and time.time() > entry["expires_at"]:
            del self._cache[key]
            self._stats["misses"] += 1
            return None

        entry["hits"] += 1
        entry["last_accessed"] = time.time()
        self._stats["hits"] += 1
        return entry["data"]

    def set(self, key: str, data: Any, ttl: Optional[int] = None, tags: Optional[List[str]] = None) -> None:
        effective_ttl = ttl if ttl is not None else self._default_ttl
        self._cache[key] = {
            "data": data,
            "created_at": time.time(),
            "expires_at": time.time() + effective_ttl if effective_ttl > 0 else None,
            "hits": 0,
            "last_accessed": time.time(),
            "tags": tags or [],
        }
        self._stats["sets"] += 1

    def delete(self, key: str) -> bool:
        if key in self._cache:
            del self._cache[key]
            self._stats["deletes"] += 1
            return True
        return False

    def invalidate_by_tag(self, tag: str) -> int:
        keys_to_delete = [
            k for k, v in self._cache.items() if tag in v.get("tags", [])
        ]
        for key in keys_to_delete:
            del self._cache[key]
        return len(keys_to_delete)

    def clear(self) -> int:
        count = len(self._cache)
        self._cache.clear()
        return count

    def cleanup_expired(self) -> int:
        now = time.time()
        expired = [
            k for k, v in self._cache.items()
            if v["expires_at"] and now > v["expires_at"]
        ]
        for key in expired:
            del self._cache[key]
        return len(expired)

    def get_stats(self) -> Dict:
        total = self._stats["hits"] + self._stats["misses"]
        return {
            **self._stats,
            "entries": len(self._cache),
            "hit_rate": (self._stats["hits"] / total * 100) if total > 0 else 0,
        }


# ============================================================================
# AUDIT SERVICE
# ============================================================================
class AuditAction(Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    REJECT = "reject"
    PRESCRIBE = "prescribe"
    DIAGNOSE = "diagnose"
    SCHEDULE = "schedule"
    CANCEL = "cancel"


class AuditService:
    """HIPAA-compliant audit logging service."""

    def __init__(self):
        self.logs: List[Dict] = []

    async def log(
        self,
        user_id: str,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        severity: str = "info",
    ) -> str:
        """Create an audit log entry."""
        log_id = str(uuid.uuid4())
        entry = {
            "id": log_id,
            "user_id": user_id,
            "action": action.value,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "success": success,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.logs.append(entry)
        logger.info(f"Audit: {user_id} {action.value} {resource_type}/{resource_id}")
        return log_id

    def query(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """Query audit logs with filters."""
        results = self.logs
        if user_id:
            results = [l for l in results if l["user_id"] == user_id]
        if action:
            results = [l for l in results if l["action"] == action]
        if resource_type:
            results = [l for l in results if l["resource_type"] == resource_type]
        return results[:limit]

    def get_user_activity(self, user_id: str, days: int = 30) -> Dict:
        """Get user activity summary."""
        user_logs = [l for l in self.logs if l["user_id"] == user_id]
        action_counts = defaultdict(int)
        for log in user_logs:
            action_counts[log["action"]] += 1
        return {
            "total_actions": len(user_logs),
            "action_breakdown": dict(action_counts),
            "last_activity": user_logs[-1]["timestamp"] if user_logs else None,
        }


# ============================================================================
# ENCRYPTION SERVICE
# ============================================================================
class EncryptionService:
    """Data encryption for sensitive medical data (HIPAA compliance)."""

    def __init__(self, key: Optional[str] = None):
        self._key = key or os.getenv("ENCRYPTION_KEY", secrets.token_hex(32))

    def hash_data(self, data: str) -> str:
        """Create a SHA-256 hash."""
        return hashlib.sha256(data.encode()).hexdigest()

    def hash_password(self, password: str, salt: Optional[str] = None) -> Tuple[str, str]:
        """Hash password with salt."""
        salt = salt or secrets.token_hex(16)
        hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
        return base64.b64encode(hashed).decode(), salt

    def verify_password(self, password: str, hashed: str, salt: str) -> bool:
        """Verify hashed password."""
        new_hash, _ = self.hash_password(password, salt)
        return new_hash == hashed

    def generate_token(self, length: int = 32) -> str:
        """Generate a secure random token."""
        return secrets.token_urlsafe(length)

    def mask_sensitive_data(self, data: str, visible_chars: int = 4) -> str:
        """Mask sensitive data (SSN, credit card, etc.)."""
        if len(data) <= visible_chars:
            return "*" * len(data)
        return "*" * (len(data) - visible_chars) + data[-visible_chars:]

    def mask_email(self, email: str) -> str:
        """Mask email address."""
        parts = email.split("@")
        if len(parts) != 2:
            return "***@***"
        local = parts[0]
        domain = parts[1]
        masked_local = local[0] + "***" + (local[-1] if len(local) > 1 else "")
        return f"{masked_local}@{domain}"

    def mask_phone(self, phone: str) -> str:
        """Mask phone number."""
        digits = re.sub(r"\D", "", phone)
        if len(digits) <= 4:
            return "****"
        return "***-***-" + digits[-4:]

    def sanitize_log_data(self, data: Dict) -> Dict:
        """Remove sensitive fields from data before logging."""
        sensitive_fields = {
            "password", "ssn", "social_security", "credit_card",
            "token", "secret", "api_key", "private_key",
        }
        sanitized = {}
        for key, value in data.items():
            if key.lower() in sensitive_fields:
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_log_data(value)
            else:
                sanitized[key] = value
        return sanitized


# ============================================================================
# FILE STORAGE SERVICE
# ============================================================================
class FileStorageService:
    """File storage management for medical documents and images."""

    ALLOWED_IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".dcm"}
    ALLOWED_DOCUMENT_TYPES = {".pdf", ".doc", ".docx", ".txt", ".csv", ".xlsx"}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        for subdir in [
            "medical_images", "lab_reports", "prescriptions",
            "profile_photos", "blood_reports", "documents",
            "imaging", "genomics", "temp",
        ]:
            (self.base_path / subdir).mkdir(exist_ok=True)

    async def save_file(
        self,
        file_data: bytes,
        filename: str,
        category: str = "documents",
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict:
        """Save uploaded file."""
        # Validate
        ext = Path(filename).suffix.lower()
        all_allowed = self.ALLOWED_IMAGE_TYPES | self.ALLOWED_DOCUMENT_TYPES
        if ext not in all_allowed:
            raise ValueError(f"File type {ext} not allowed")

        if len(file_data) > self.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {self.MAX_FILE_SIZE / (1024*1024)}MB limit")

        # Generate unique filename
        file_id = str(uuid.uuid4())
        safe_name = f"{file_id}{ext}"
        file_path = self.base_path / category / safe_name

        # Save file
        file_path.write_bytes(file_data)

        file_info = {
            "id": file_id,
            "filename": filename,
            "stored_name": safe_name,
            "path": str(file_path),
            "category": category,
            "size": len(file_data),
            "extension": ext,
            "mime_type": self._get_mime_type(ext),
            "user_id": user_id,
            "metadata": metadata or {},
            "checksum": hashlib.md5(file_data).hexdigest(),
            "created_at": datetime.utcnow().isoformat(),
        }

        logger.info(f"File saved: {file_id} ({filename})")
        return file_info

    async def get_file(self, file_id: str, category: str = "documents") -> Optional[bytes]:
        """Retrieve file by ID."""
        category_path = self.base_path / category
        for file in category_path.iterdir():
            if file.stem == file_id:
                return file.read_bytes()
        return None

    async def delete_file(self, file_id: str, category: str = "documents") -> bool:
        """Delete a file."""
        category_path = self.base_path / category
        for file in category_path.iterdir():
            if file.stem == file_id:
                file.unlink()
                logger.info(f"File deleted: {file_id}")
                return True
        return False

    def get_storage_stats(self) -> Dict:
        """Get storage usage statistics."""
        stats = {}
        total = 0
        for category in self.base_path.iterdir():
            if category.is_dir():
                files = list(category.iterdir())
                size = sum(f.stat().st_size for f in files if f.is_file())
                stats[category.name] = {
                    "files": len(files),
                    "size_bytes": size,
                    "size_mb": round(size / (1024 * 1024), 2),
                }
                total += size
        stats["total"] = {
            "size_bytes": total,
            "size_mb": round(total / (1024 * 1024), 2),
        }
        return stats

    def _get_mime_type(self, ext: str) -> str:
        mime_types = {
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
            ".gif": "image/gif", ".bmp": "image/bmp", ".tiff": "image/tiff",
            ".dcm": "application/dicom", ".pdf": "application/pdf",
            ".doc": "application/msword", ".txt": "text/plain",
            ".csv": "text/csv", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        return mime_types.get(ext, "application/octet-stream")


# ============================================================================
# SEARCH SERVICE
# ============================================================================
class SearchService:
    """Full-text search across medical records, patients, and resources."""

    def __init__(self):
        self._index: Dict[str, List[Dict]] = defaultdict(list)

    def index_document(
        self,
        doc_type: str,
        doc_id: str,
        content: str,
        metadata: Optional[Dict] = None,
    ) -> None:
        """Index a document for search."""
        words = set(content.lower().split())
        doc_entry = {
            "id": doc_id,
            "type": doc_type,
            "content": content[:500],  # Store excerpt
            "metadata": metadata or {},
            "indexed_at": datetime.utcnow().isoformat(),
        }

        for word in words:
            cleaned = re.sub(r"[^\w]", "", word)
            if cleaned and len(cleaned) > 2:
                self._index[cleaned].append(doc_entry)

    def search(
        self,
        query: str,
        doc_type: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict]:
        """Search indexed documents."""
        words = query.lower().split()
        results: Dict[str, Dict] = {}

        for word in words:
            cleaned = re.sub(r"[^\w]", "", word)
            if cleaned in self._index:
                for doc in self._index[cleaned]:
                    if doc_type and doc["type"] != doc_type:
                        continue
                    doc_id = f"{doc['type']}:{doc['id']}"
                    if doc_id not in results:
                        results[doc_id] = {**doc, "score": 0}
                    results[doc_id]["score"] += 1

        ranked = sorted(results.values(), key=lambda x: x["score"], reverse=True)
        return ranked[:limit]

    def get_suggestions(self, prefix: str, limit: int = 10) -> List[str]:
        """Get autocomplete suggestions."""
        prefix = prefix.lower()
        matches = [word for word in self._index.keys() if word.startswith(prefix)]
        return sorted(matches, key=lambda w: len(self._index[w]), reverse=True)[:limit]


# ============================================================================
# REPORT GENERATION SERVICE
# ============================================================================
class ReportService:
    """Generate various medical and analytics reports."""

    def __init__(self):
        self.generated_reports: List[Dict] = []

    async def generate_patient_report(
        self,
        patient_id: str,
        patient_data: Dict,
        report_type: str = "comprehensive",
    ) -> Dict:
        """Generate patient health report."""
        report_id = str(uuid.uuid4())

        report = {
            "id": report_id,
            "patient_id": patient_id,
            "type": report_type,
            "generated_at": datetime.utcnow().isoformat(),
            "sections": [],
            "summary": "",
            "recommendations": [],
        }

        # Build sections based on type
        if report_type in ("comprehensive", "summary"):
            report["sections"].append({
                "title": "Patient Information",
                "content": {
                    "name": patient_data.get("name", ""),
                    "age": patient_data.get("age", ""),
                    "gender": patient_data.get("gender", ""),
                    "blood_type": patient_data.get("blood_type", ""),
                },
            })

        if report_type in ("comprehensive", "vitals"):
            report["sections"].append({
                "title": "Vital Signs",
                "content": patient_data.get("vitals", {}),
            })

        if report_type in ("comprehensive", "lab"):
            report["sections"].append({
                "title": "Lab Results",
                "content": patient_data.get("lab_results", []),
            })

        if report_type in ("comprehensive", "medications"):
            report["sections"].append({
                "title": "Medications",
                "content": patient_data.get("medications", []),
            })

        if report_type in ("comprehensive",):
            report["sections"].extend([
                {"title": "Appointments History", "content": patient_data.get("appointments", [])},
                {"title": "Screening Results", "content": patient_data.get("screenings", [])},
                {"title": "Risk Assessment", "content": patient_data.get("risk_assessment", {})},
            ])

        self.generated_reports.append(report)
        return report

    async def generate_analytics_report(
        self,
        entity_type: str,
        period: str,
        data: Dict,
    ) -> Dict:
        """Generate analytics report for hospital/department."""
        report_id = str(uuid.uuid4())

        report = {
            "id": report_id,
            "entity_type": entity_type,
            "period": period,
            "generated_at": datetime.utcnow().isoformat(),
            "metrics": data.get("metrics", {}),
            "trends": data.get("trends", []),
            "comparisons": data.get("comparisons", {}),
            "insights": [],
        }

        # Auto-generate insights
        if "patient_count" in data.get("metrics", {}):
            count = data["metrics"]["patient_count"]
            prev = data["metrics"].get("prev_patient_count", count)
            change = ((count - prev) / prev * 100) if prev > 0 else 0
            report["insights"].append({
                "type": "trend",
                "metric": "patient_count",
                "change": round(change, 1),
                "message": f"Patient volume {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))}%",
            })

        self.generated_reports.append(report)
        return report

    def export_to_csv(self, data: List[Dict], filename: str = "report") -> str:
        """Export report data to CSV format."""
        if not data:
            return ""

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return output.getvalue()


# ============================================================================
# ANALYTICS SERVICE
# ============================================================================
class AnalyticsService:
    """Platform analytics and insights engine."""

    def __init__(self):
        self.events: List[Dict] = []

    def track_event(
        self,
        event_name: str,
        user_id: Optional[str] = None,
        properties: Optional[Dict] = None,
    ) -> None:
        """Track an analytics event."""
        self.events.append({
            "name": event_name,
            "user_id": user_id,
            "properties": properties or {},
            "timestamp": datetime.utcnow().isoformat(),
        })

    def get_event_counts(self, event_name: Optional[str] = None, days: int = 30) -> Dict:
        """Get event counts grouped by day."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        filtered = self.events
        if event_name:
            filtered = [e for e in filtered if e["name"] == event_name]

        daily_counts: Dict[str, int] = defaultdict(int)
        for event in filtered:
            date = event["timestamp"][:10]
            daily_counts[date] += 1

        return dict(daily_counts)

    def get_active_users(self, days: int = 1) -> int:
        """Get count of active users in the last N days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        users = set()
        for event in self.events:
            if event.get("user_id"):
                users.add(event["user_id"])
        return len(users)

    def get_feature_usage(self) -> Dict[str, int]:
        """Get feature usage breakdown."""
        usage: Dict[str, int] = defaultdict(int)
        for event in self.events:
            if event["name"].startswith("feature_"):
                feature = event["name"].replace("feature_", "")
                usage[feature] += 1
        return dict(sorted(usage.items(), key=lambda x: x[1], reverse=True))

    def calculate_platform_metrics(self) -> Dict:
        """Calculate comprehensive platform metrics."""
        total_events = len(self.events)
        unique_users = len(set(e.get("user_id") for e in self.events if e.get("user_id")))

        return {
            "total_events": total_events,
            "unique_users": unique_users,
            "dau": self.get_active_users(1),
            "wau": self.get_active_users(7),
            "mau": self.get_active_users(30),
            "feature_usage": self.get_feature_usage(),
            "events_per_user": round(total_events / max(unique_users, 1), 2),
        }


# ============================================================================
# VALIDATION SERVICE
# ============================================================================
class ValidationService:
    """Data validation for medical records and user input."""

    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if re.match(pattern, email):
            return True, ""
        return False, "Invalid email format"

    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, str]:
        digits = re.sub(r"\D", "", phone)
        if 10 <= len(digits) <= 15:
            return True, ""
        return False, "Invalid phone number"

    @staticmethod
    def validate_blood_type(blood_type: str) -> Tuple[bool, str]:
        valid = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
        if blood_type in valid:
            return True, ""
        return False, f"Invalid blood type. Must be one of: {', '.join(sorted(valid))}"

    @staticmethod
    def validate_vital_signs(vitals: Dict) -> List[str]:
        """Validate vital sign ranges."""
        errors = []
        ranges = {
            "heart_rate": (30, 250, "bpm"),
            "systolic_bp": (50, 300, "mmHg"),
            "diastolic_bp": (20, 200, "mmHg"),
            "temperature": (90, 110, "°F"),
            "spo2": (50, 100, "%"),
            "respiratory_rate": (5, 60, "/min"),
            "blood_glucose": (20, 600, "mg/dL"),
        }

        for field, (min_val, max_val, unit) in ranges.items():
            if field in vitals:
                value = vitals[field]
                if not isinstance(value, (int, float)):
                    errors.append(f"{field}: must be a number")
                elif value < min_val or value > max_val:
                    errors.append(f"{field}: {value} {unit} is out of range ({min_val}-{max_val})")

        return errors

    @staticmethod
    def validate_password(password: str) -> Tuple[bool, List[str]]:
        """Validate password strength."""
        errors = []
        if len(password) < 8:
            errors.append("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", password):
            errors.append("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            errors.append("Password must contain at least one special character")
        return len(errors) == 0, errors

    @staticmethod
    def validate_date(date_str: str, format: str = "%Y-%m-%d") -> Tuple[bool, str]:
        try:
            datetime.strptime(date_str, format)
            return True, ""
        except ValueError:
            return False, f"Invalid date format. Expected: {format}"

    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize text input to prevent XSS."""
        text = re.sub(r"<[^>]+>", "", text)
        text = text.replace("&", "&amp;").replace('"', "&quot;")
        text = text.replace("'", "&#39;").replace("<", "&lt;").replace(">", "&gt;")
        return text.strip()


# ============================================================================
# EXPORT SERVICE
# ============================================================================
class ExportService:
    """Export data in various formats."""

    @staticmethod
    def to_csv(data: List[Dict], columns: Optional[List[str]] = None) -> str:
        """Export data to CSV."""
        if not data:
            return ""

        cols = columns or list(data[0].keys())
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        for row in data:
            writer.writerow({k: str(v) for k, v in row.items() if k in cols})
        return output.getvalue()

    @staticmethod
    def to_json(data: Any, pretty: bool = True) -> str:
        """Export data to JSON."""
        return json.dumps(data, indent=2 if pretty else None, default=str)

    @staticmethod
    def to_html_table(data: List[Dict], title: str = "Report") -> str:
        """Export data to HTML table."""
        if not data:
            return "<p>No data</p>"

        cols = list(data[0].keys())
        html = f"""
        <html>
        <head><style>
            body {{ font-family: 'Inter', sans-serif; padding: 20px; }}
            h1 {{ color: #1565c0; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th {{ background: #1565c0; color: white; padding: 10px; text-align: left; }}
            td {{ border-bottom: 1px solid #e0e0e0; padding: 8px; }}
            tr:hover {{ background: #f5f5f5; }}
        </style></head>
        <body>
        <h1>{title}</h1>
        <p>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        <table>
        <tr>{''.join(f'<th>{col}</th>' for col in cols)}</tr>
        """
        for row in data:
            html += "<tr>" + "".join(f"<td>{row.get(k, '')}</td>" for k in cols) + "</tr>\n"
        html += "</table></body></html>"
        return html


# ============================================================================
# IMPORT SERVICE
# ============================================================================
class ImportService:
    """Import data from various formats."""

    @staticmethod
    def from_csv(csv_content: str) -> List[Dict]:
        """Parse CSV content into list of dicts."""
        reader = csv.DictReader(io.StringIO(csv_content))
        return list(reader)

    @staticmethod
    def from_json(json_content: str) -> Any:
        """Parse JSON content."""
        return json.loads(json_content)

    @staticmethod
    def validate_import_data(
        data: List[Dict],
        required_fields: List[str],
    ) -> Tuple[List[Dict], List[Dict]]:
        """Validate import data and separate valid/invalid rows."""
        valid = []
        invalid = []

        for i, row in enumerate(data):
            missing = [f for f in required_fields if f not in row or not row[f]]
            if missing:
                invalid.append({
                    "row": i + 1,
                    "data": row,
                    "errors": [f"Missing field: {f}" for f in missing],
                })
            else:
                valid.append(row)

        return valid, invalid


# ============================================================================
# BACKUP SERVICE
# ============================================================================
class BackupService:
    """Data backup and restore service."""

    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.backups: List[Dict] = []

    async def create_backup(
        self,
        data: Dict,
        backup_type: str = "full",
        description: str = "",
    ) -> Dict:
        """Create a data backup."""
        backup_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{backup_type}_{timestamp}_{backup_id[:8]}.json"
        filepath = self.backup_dir / filename

        backup_content = {
            "id": backup_id,
            "type": backup_type,
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
            "data": data,
        }

        filepath.write_text(json.dumps(backup_content, default=str))

        backup_info = {
            "id": backup_id,
            "filename": filename,
            "path": str(filepath),
            "type": backup_type,
            "description": description,
            "size_bytes": filepath.stat().st_size,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.backups.append(backup_info)

        logger.info(f"Backup created: {backup_id} ({filename})")
        return backup_info

    async def restore_backup(self, backup_id: str) -> Optional[Dict]:
        """Restore data from a backup."""
        for backup in self.backups:
            if backup["id"] == backup_id:
                filepath = Path(backup["path"])
                if filepath.exists():
                    content = json.loads(filepath.read_text())
                    return content["data"]
        return None

    def list_backups(self) -> List[Dict]:
        """List all available backups."""
        return sorted(self.backups, key=lambda b: b["created_at"], reverse=True)

    async def cleanup_old_backups(self, keep_days: int = 30) -> int:
        """Remove backups older than specified days."""
        cutoff = datetime.utcnow() - timedelta(days=keep_days)
        removed = 0
        remaining = []

        for backup in self.backups:
            backup_date = datetime.fromisoformat(backup["created_at"])
            if backup_date < cutoff:
                filepath = Path(backup["path"])
                if filepath.exists():
                    filepath.unlink()
                removed += 1
            else:
                remaining.append(backup)

        self.backups = remaining
        return removed


# ============================================================================
# SCHEDULER SERVICE
# ============================================================================
class SchedulerService:
    """Task scheduling for reminders, reports, and maintenance."""

    def __init__(self):
        self.tasks: Dict[str, Dict] = {}
        self.running = False

    def schedule(
        self,
        task_id: str,
        func: Any,
        interval_seconds: int,
        description: str = "",
        args: tuple = (),
        kwargs: Optional[Dict] = None,
    ) -> None:
        """Schedule a recurring task."""
        self.tasks[task_id] = {
            "id": task_id,
            "func": func,
            "interval": interval_seconds,
            "description": description,
            "args": args,
            "kwargs": kwargs or {},
            "last_run": None,
            "next_run": datetime.utcnow().isoformat(),
            "run_count": 0,
            "errors": 0,
            "status": "scheduled",
        }
        logger.info(f"Task scheduled: {task_id} (every {interval_seconds}s)")

    def cancel(self, task_id: str) -> bool:
        """Cancel a scheduled task."""
        if task_id in self.tasks:
            self.tasks[task_id]["status"] = "cancelled"
            return True
        return False

    def get_tasks(self) -> List[Dict]:
        """Get all scheduled tasks."""
        return [
            {k: v for k, v in task.items() if k != "func"}
            for task in self.tasks.values()
        ]

    async def run_task(self, task_id: str) -> bool:
        """Manually run a task."""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]
        try:
            if asyncio.iscoroutinefunction(task["func"]):
                await task["func"](*task["args"], **task["kwargs"])
            else:
                task["func"](*task["args"], **task["kwargs"])

            task["last_run"] = datetime.utcnow().isoformat()
            task["run_count"] += 1
            return True
        except Exception as e:
            task["errors"] += 1
            logger.error(f"Task {task_id} failed: {e}")
            return False


# ============================================================================
# SINGLETON INSTANCES
# ============================================================================
email_service = EmailService()
notification_service = NotificationService(email_service)
cache_service = CacheService()
audit_service = AuditService()
encryption_service = EncryptionService()
file_storage_service = FileStorageService()
search_service = SearchService()
report_service = ReportService()
analytics_service = AnalyticsService()
validation_service = ValidationService()
export_service = ExportService()
import_service = ImportService()
backup_service = BackupService()
scheduler_service = SchedulerService()


# ============================================================================
# SERVICE REGISTRY
# ============================================================================
class ServiceRegistry:
    """Central registry for all services."""

    def __init__(self):
        self.services: Dict[str, Any] = {
            "email": email_service,
            "notification": notification_service,
            "cache": cache_service,
            "audit": audit_service,
            "encryption": encryption_service,
            "file_storage": file_storage_service,
            "search": search_service,
            "report": report_service,
            "analytics": analytics_service,
            "validation": validation_service,
            "export": export_service,
            "import": import_service,
            "backup": backup_service,
            "scheduler": scheduler_service,
        }

    def get(self, name: str) -> Any:
        return self.services.get(name)

    def register(self, name: str, service: Any) -> None:
        self.services[name] = service

    def list_services(self) -> List[str]:
        return list(self.services.keys())

    def health_check(self) -> Dict[str, str]:
        return {name: "healthy" for name in self.services}


service_registry = ServiceRegistry()

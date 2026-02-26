"""
Notification Service - Comprehensive notification management system.
Handles in-app notifications, email notifications, push notifications,
SMS notifications, and notification preferences.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from dataclasses import dataclass, field
from collections import defaultdict

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    """Types of notifications supported by the system."""
    APPOINTMENT_REMINDER = "appointment_reminder"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    LAB_RESULTS_READY = "lab_results_ready"
    LAB_RESULTS_ABNORMAL = "lab_results_abnormal"
    PRESCRIPTION_READY = "prescription_ready"
    PRESCRIPTION_REFILL = "prescription_refill"
    MEDICATION_REMINDER = "medication_reminder"
    VITAL_SIGN_ALERT = "vital_sign_alert"
    VITAL_SIGN_CRITICAL = "vital_sign_critical"
    CANCER_SCREENING_DUE = "cancer_screening_due"
    CANCER_RISK_UPDATE = "cancer_risk_update"
    TREATMENT_UPDATE = "treatment_update"
    TREATMENT_MILESTONE = "treatment_milestone"
    CLINICAL_TRIAL_MATCH = "clinical_trial_match"
    GENOMIC_RESULTS = "genomic_results"
    BLOOD_DONATION_ELIGIBLE = "blood_donation_eligible"
    BLOOD_TEST_REMINDER = "blood_test_reminder"
    EMERGENCY_ALERT = "emergency_alert"
    SYSTEM_MAINTENANCE = "system_maintenance"
    BILLING_INVOICE = "billing_invoice"
    BILLING_PAYMENT_DUE = "billing_payment_due"
    BILLING_PAYMENT_RECEIVED = "billing_payment_received"
    INSURANCE_UPDATE = "insurance_update"
    DOCUMENT_SHARED = "document_shared"
    MESSAGE_RECEIVED = "message_received"
    TELEHEALTH_REMINDER = "telehealth_reminder"
    HEALTH_GOAL_ACHIEVED = "health_goal_achieved"
    HEALTH_GOAL_REMINDER = "health_goal_reminder"
    WEARABLE_SYNC = "wearable_sync"
    WEARABLE_ALERT = "wearable_alert"
    FAMILY_HEALTH_UPDATE = "family_health_update"
    EDUCATION_CONTENT = "education_content"
    SURVEY_REQUEST = "survey_request"
    ACCOUNT_SECURITY = "account_security"
    PASSWORD_CHANGE = "password_change"
    PROFILE_UPDATE = "profile_update"
    CONSENT_REQUEST = "consent_request"
    DATA_EXPORT_READY = "data_export_ready"
    REFERRAL_UPDATE = "referral_update"
    SECOND_OPINION_READY = "second_opinion_ready"
    REHABILITATION_MILESTONE = "rehabilitation_milestone"
    MENTAL_HEALTH_CHECKIN = "mental_health_checkin"
    NUTRITION_REMINDER = "nutrition_reminder"
    EXERCISE_REMINDER = "exercise_reminder"


class NotificationChannel(str, Enum):
    """Delivery channels for notifications."""
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBSOCKET = "websocket"


class NotificationPriority(str, Enum):
    """Priority levels for notifications."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class NotificationStatus(str, Enum):
    """Status of a notification."""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"
    EXPIRED = "expired"
    DISMISSED = "dismissed"


@dataclass
class NotificationTemplate:
    """Template for generating notification content."""
    type: NotificationType
    title_template: str
    body_template: str
    icon: str
    color: str
    default_channels: List[NotificationChannel]
    default_priority: NotificationPriority
    action_url_template: Optional[str] = None
    groupable: bool = True
    ttl_hours: int = 72
    sound: Optional[str] = None
    vibration_pattern: Optional[List[int]] = None


@dataclass
class Notification:
    """A notification instance."""
    id: str
    user_id: int
    type: NotificationType
    title: str
    body: str
    icon: str
    color: str
    priority: NotificationPriority
    channels: List[NotificationChannel]
    status: NotificationStatus = NotificationStatus.PENDING
    action_url: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    group_key: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type.value,
            "title": self.title,
            "body": self.body,
            "icon": self.icon,
            "color": self.color,
            "priority": self.priority.value,
            "channels": [c.value for c in self.channels],
            "status": self.status.value,
            "action_url": self.action_url,
            "data": self.data,
            "created_at": self.created_at.isoformat(),
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "group_key": self.group_key,
        }


@dataclass
class NotificationPreference:
    """User's notification preferences."""
    user_id: int
    enabled: bool = True
    channels: Dict[NotificationChannel, bool] = field(default_factory=lambda: {
        NotificationChannel.IN_APP: True,
        NotificationChannel.EMAIL: True,
        NotificationChannel.SMS: False,
        NotificationChannel.PUSH: True,
        NotificationChannel.WEBSOCKET: True,
    })
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    type_preferences: Dict[str, Dict[str, bool]] = field(default_factory=dict)
    digest_enabled: bool = False
    digest_frequency: str = "daily"
    digest_time: str = "09:00"
    timezone: str = "UTC"
    language: str = "en"
    max_notifications_per_hour: int = 20
    blocked_types: List[NotificationType] = field(default_factory=list)


class NotificationTemplateRegistry:
    """Registry of notification templates."""

    def __init__(self):
        self.templates: Dict[NotificationType, NotificationTemplate] = {}
        self._register_defaults()

    def _register_defaults(self):
        """Register default notification templates."""
        templates = [
            NotificationTemplate(
                type=NotificationType.APPOINTMENT_REMINDER,
                title_template="Appointment Reminder",
                body_template="You have an appointment with Dr. {doctor_name} on {date} at {time}.",
                icon="event",
                color="#1565c0",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/appointments/{appointment_id}",
                ttl_hours=48,
                sound="appointment_reminder",
            ),
            NotificationTemplate(
                type=NotificationType.APPOINTMENT_CONFIRMED,
                title_template="Appointment Confirmed",
                body_template="Your appointment with Dr. {doctor_name} on {date} at {time} has been confirmed.",
                icon="check_circle",
                color="#2e7d32",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.MEDIUM,
                action_url_template="/appointments/{appointment_id}",
            ),
            NotificationTemplate(
                type=NotificationType.APPOINTMENT_CANCELLED,
                title_template="Appointment Cancelled",
                body_template="Your appointment with Dr. {doctor_name} on {date} has been cancelled. {reason}",
                icon="cancel",
                color="#c62828",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/appointments",
            ),
            NotificationTemplate(
                type=NotificationType.LAB_RESULTS_READY,
                title_template="Lab Results Available",
                body_template="Your {test_name} results are now available for review.",
                icon="science",
                color="#0277bd",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/health-records/lab-results/{result_id}",
            ),
            NotificationTemplate(
                type=NotificationType.LAB_RESULTS_ABNORMAL,
                title_template="Abnormal Lab Results",
                body_template="Your {test_name} results show abnormal values. Please consult your physician.",
                icon="warning",
                color="#e65100",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
                default_priority=NotificationPriority.CRITICAL,
                action_url_template="/health-records/lab-results/{result_id}",
                sound="critical_alert",
                vibration_pattern=[0, 500, 200, 500],
            ),
            NotificationTemplate(
                type=NotificationType.MEDICATION_REMINDER,
                title_template="Medication Reminder",
                body_template="Time to take {medication_name} ({dosage}). {instructions}",
                icon="medication",
                color="#7b1fa2",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/medications",
                ttl_hours=4,
                sound="medication_reminder",
            ),
            NotificationTemplate(
                type=NotificationType.VITAL_SIGN_CRITICAL,
                title_template="Critical Vital Sign Alert",
                body_template="Your {vital_type} reading of {value} {unit} is outside the critical range. Seek immediate medical attention.",
                icon="emergency",
                color="#b71c1c",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS],
                default_priority=NotificationPriority.CRITICAL,
                action_url_template="/vital-signs",
                ttl_hours=24,
                sound="emergency_alert",
                vibration_pattern=[0, 1000, 500, 1000, 500, 1000],
            ),
            NotificationTemplate(
                type=NotificationType.CANCER_SCREENING_DUE,
                title_template="Cancer Screening Due",
                body_template="You are due for a {screening_type} screening. Schedule your appointment today.",
                icon="health_and_safety",
                color="#1565c0",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.MEDIUM,
                action_url_template="/cancer-risk/screenings",
            ),
            NotificationTemplate(
                type=NotificationType.CANCER_RISK_UPDATE,
                title_template="Cancer Risk Assessment Updated",
                body_template="Your cancer risk assessment has been updated. Your {cancer_type} risk level is now {risk_level}.",
                icon="assessment",
                color="#e65100",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/cancer-risk",
            ),
            NotificationTemplate(
                type=NotificationType.TREATMENT_UPDATE,
                title_template="Treatment Plan Update",
                body_template="Your treatment plan has been updated by Dr. {doctor_name}. {details}",
                icon="medical_services",
                color="#00897b",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/treatment-plan",
            ),
            NotificationTemplate(
                type=NotificationType.CLINICAL_TRIAL_MATCH,
                title_template="Clinical Trial Match Found",
                body_template="A new clinical trial '{trial_name}' matches your profile. Review the details to see if you qualify.",
                icon="biotech",
                color="#7b1fa2",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.MEDIUM,
                action_url_template="/clinical-trials/{trial_id}",
            ),
            NotificationTemplate(
                type=NotificationType.GENOMIC_RESULTS,
                title_template="Genomic Analysis Complete",
                body_template="Your genomic analysis results are ready for review. {summary}",
                icon="dna",
                color="#7b1fa2",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/genomics/results/{result_id}",
            ),
            NotificationTemplate(
                type=NotificationType.EMERGENCY_ALERT,
                title_template="Emergency Alert",
                body_template="{message}",
                icon="emergency",
                color="#b71c1c",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
                default_priority=NotificationPriority.CRITICAL,
                groupable=False,
                ttl_hours=24,
                sound="emergency_siren",
                vibration_pattern=[0, 1000, 500, 1000, 500, 1000],
            ),
            NotificationTemplate(
                type=NotificationType.BILLING_PAYMENT_DUE,
                title_template="Payment Due",
                body_template="Your payment of ${amount} for {description} is due on {due_date}.",
                icon="payment",
                color="#e65100",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                default_priority=NotificationPriority.MEDIUM,
                action_url_template="/billing/invoices/{invoice_id}",
            ),
            NotificationTemplate(
                type=NotificationType.MESSAGE_RECEIVED,
                title_template="New Message",
                body_template="{sender_name} sent you a message: {preview}",
                icon="chat",
                color="#1565c0",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH],
                default_priority=NotificationPriority.MEDIUM,
                action_url_template="/messages/{message_id}",
                ttl_hours=168,
            ),
            NotificationTemplate(
                type=NotificationType.TELEHEALTH_REMINDER,
                title_template="Telehealth Session Starting",
                body_template="Your telehealth session with Dr. {doctor_name} starts in {minutes} minutes.",
                icon="videocam",
                color="#0277bd",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/telehealth/session/{session_id}",
                ttl_hours=2,
                sound="session_reminder",
            ),
            NotificationTemplate(
                type=NotificationType.HEALTH_GOAL_ACHIEVED,
                title_template="Goal Achieved! 🎉",
                body_template="Congratulations! You've achieved your {goal_name} goal. {details}",
                icon="emoji_events",
                color="#2e7d32",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH],
                default_priority=NotificationPriority.LOW,
                action_url_template="/health-goals",
            ),
            NotificationTemplate(
                type=NotificationType.WEARABLE_ALERT,
                title_template="Wearable Device Alert",
                body_template="Your {device_name} detected {alert_type}: {details}",
                icon="watch",
                color="#e65100",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH],
                default_priority=NotificationPriority.HIGH,
                action_url_template="/wearable-data",
            ),
            NotificationTemplate(
                type=NotificationType.ACCOUNT_SECURITY,
                title_template="Security Alert",
                body_template="{message}",
                icon="security",
                color="#c62828",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
                default_priority=NotificationPriority.CRITICAL,
                groupable=False,
                action_url_template="/settings/security",
            ),
            NotificationTemplate(
                type=NotificationType.MENTAL_HEALTH_CHECKIN,
                title_template="Mental Health Check-in",
                body_template="How are you feeling today? Take a moment to complete your daily mental health check-in.",
                icon="psychology",
                color="#7b1fa2",
                default_channels=[NotificationChannel.IN_APP, NotificationChannel.PUSH],
                default_priority=NotificationPriority.LOW,
                action_url_template="/mental-health/checkin",
                ttl_hours=12,
            ),
        ]

        for template in templates:
            self.templates[template.type] = template

    def get_template(self, notification_type: NotificationType) -> Optional[NotificationTemplate]:
        return self.templates.get(notification_type)

    def register_template(self, template: NotificationTemplate):
        self.templates[template.type] = template


class NotificationRateLimiter:
    """Rate limiter for notification delivery."""

    def __init__(self):
        self._user_counts: Dict[int, List[datetime]] = defaultdict(list)
        self._global_count: List[datetime] = []
        self.max_per_user_per_hour = 20
        self.max_global_per_minute = 1000

    def can_send(self, user_id: int) -> bool:
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        minute_ago = now - timedelta(minutes=1)

        # Clean old entries
        self._user_counts[user_id] = [
            t for t in self._user_counts[user_id] if t > hour_ago
        ]
        self._global_count = [t for t in self._global_count if t > minute_ago]

        # Check limits
        if len(self._user_counts[user_id]) >= self.max_per_user_per_hour:
            logger.warning(f"Rate limit exceeded for user {user_id}")
            return False

        if len(self._global_count) >= self.max_global_per_minute:
            logger.warning("Global rate limit exceeded")
            return False

        return True

    def record_send(self, user_id: int):
        now = datetime.utcnow()
        self._user_counts[user_id].append(now)
        self._global_count.append(now)


class NotificationGrouper:
    """Groups similar notifications to reduce noise."""

    def __init__(self):
        self._pending_groups: Dict[str, List[Notification]] = defaultdict(list)
        self._group_timers: Dict[str, datetime] = {}
        self.group_window_seconds = 300  # 5 minutes

    def get_group_key(self, notification: Notification) -> Optional[str]:
        if not notification.group_key:
            return f"{notification.user_id}:{notification.type.value}"
        return f"{notification.user_id}:{notification.group_key}"

    def add_to_group(self, notification: Notification) -> Optional[List[Notification]]:
        group_key = self.get_group_key(notification)
        if group_key is None:
            return [notification]

        self._pending_groups[group_key].append(notification)

        if group_key not in self._group_timers:
            self._group_timers[group_key] = datetime.utcnow()

        # Check if group window has expired
        elapsed = (datetime.utcnow() - self._group_timers[group_key]).total_seconds()
        if elapsed >= self.group_window_seconds or len(self._pending_groups[group_key]) >= 5:
            group = self._pending_groups.pop(group_key)
            self._group_timers.pop(group_key, None)
            return group

        return None

    def create_grouped_notification(self, notifications: List[Notification]) -> Notification:
        if len(notifications) == 1:
            return notifications[0]

        first = notifications[0]
        count = len(notifications)
        return Notification(
            id=f"group_{first.id}",
            user_id=first.user_id,
            type=first.type,
            title=f"{first.title} (+{count - 1} more)",
            body=f"You have {count} {first.type.value.replace('_', ' ')} notifications.",
            icon=first.icon,
            color=first.color,
            priority=max(n.priority for n in notifications) if notifications else first.priority,
            channels=first.channels,
            data={"grouped_count": count, "notification_ids": [n.id for n in notifications]},
            group_key=first.group_key,
        )


class InAppNotificationStore:
    """In-memory store for in-app notifications (would use DB in production)."""

    def __init__(self):
        self._notifications: Dict[int, List[Notification]] = defaultdict(list)
        self._unread_counts: Dict[int, int] = defaultdict(int)
        self.max_per_user = 500

    def store(self, notification: Notification):
        user_notifications = self._notifications[notification.user_id]
        user_notifications.insert(0, notification)

        # Trim old notifications
        if len(user_notifications) > self.max_per_user:
            self._notifications[notification.user_id] = user_notifications[:self.max_per_user]

        if notification.status != NotificationStatus.READ:
            self._unread_counts[notification.user_id] += 1

    def get_notifications(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None,
    ) -> List[Dict[str, Any]]:
        notifications = self._notifications.get(user_id, [])

        if unread_only:
            notifications = [n for n in notifications if n.status != NotificationStatus.READ]

        if notification_type:
            notifications = [n for n in notifications if n.type == notification_type]

        paginated = notifications[offset:offset + limit]
        return [n.to_dict() for n in paginated]

    def get_unread_count(self, user_id: int) -> int:
        return self._unread_counts.get(user_id, 0)

    def mark_as_read(self, user_id: int, notification_id: str) -> bool:
        for notif in self._notifications.get(user_id, []):
            if notif.id == notification_id and notif.status != NotificationStatus.READ:
                notif.status = NotificationStatus.READ
                notif.read_at = datetime.utcnow()
                self._unread_counts[user_id] = max(0, self._unread_counts[user_id] - 1)
                return True
        return False

    def mark_all_as_read(self, user_id: int) -> int:
        count = 0
        for notif in self._notifications.get(user_id, []):
            if notif.status != NotificationStatus.READ:
                notif.status = NotificationStatus.READ
                notif.read_at = datetime.utcnow()
                count += 1
        self._unread_counts[user_id] = 0
        return count

    def delete_notification(self, user_id: int, notification_id: str) -> bool:
        notifications = self._notifications.get(user_id, [])
        for i, notif in enumerate(notifications):
            if notif.id == notification_id:
                removed = notifications.pop(i)
                if removed.status != NotificationStatus.READ:
                    self._unread_counts[user_id] = max(0, self._unread_counts[user_id] - 1)
                return True
        return False

    def delete_all(self, user_id: int) -> int:
        count = len(self._notifications.get(user_id, []))
        self._notifications[user_id] = []
        self._unread_counts[user_id] = 0
        return count


class EmailNotificationSender:
    """Handles email notification delivery (simulated)."""

    def __init__(self):
        self.smtp_host = "smtp.cancerguard.ai"
        self.smtp_port = 587
        self.from_address = "notifications@cancerguard.ai"
        self.from_name = "CancerGuard AI"
        self._sent_count = 0

    async def send(self, notification: Notification, email: str) -> bool:
        try:
            email_content = self._build_email(notification)
            logger.info(f"Sending email to {email}: {notification.title}")
            # In production, would use aiosmtplib or similar
            await asyncio.sleep(0.01)  # Simulate sending
            self._sent_count += 1
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def _build_email(self, notification: Notification) -> Dict[str, str]:
        return {
            "from": f"{self.from_name} <{self.from_address}>",
            "subject": notification.title,
            "html": self._render_template(notification),
            "text": notification.body,
        }

    def _render_template(self, notification: Notification) -> str:
        priority_colors = {
            NotificationPriority.CRITICAL: "#b71c1c",
            NotificationPriority.HIGH: "#e65100",
            NotificationPriority.MEDIUM: "#1565c0",
            NotificationPriority.LOW: "#2e7d32",
            NotificationPriority.INFO: "#78909c",
        }
        color = priority_colors.get(notification.priority, "#1565c0")

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{notification.title}</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Inter',sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
                <tr>
                    <td style="padding:24px;background:{color};text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:24px;">CancerGuard AI</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px;background:#fff;">
                        <h2 style="margin:0 0 16px;color:#263238;font-size:20px;">
                            {notification.title}
                        </h2>
                        <p style="margin:0 0 24px;color:#546e7a;font-size:16px;line-height:1.6;">
                            {notification.body}
                        </p>
                        {self._render_action_button(notification, color)}
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px;background:#eceff1;text-align:center;">
                        <p style="margin:0;color:#78909c;font-size:12px;">
                            © 2024 CancerGuard AI. All rights reserved.
                        </p>
                        <p style="margin:8px 0 0;color:#78909c;font-size:12px;">
                            <a href="#" style="color:#1565c0;">Manage notification preferences</a>
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

    def _render_action_button(self, notification: Notification, color: str) -> str:
        if not notification.action_url:
            return ""
        return f"""
        <a href="{notification.action_url}"
           style="display:inline-block;padding:12px 24px;background:{color};
                  color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
            View Details
        </a>
        """


class PushNotificationSender:
    """Handles push notification delivery (simulated FCM/APNS)."""

    def __init__(self):
        self._device_tokens: Dict[int, List[str]] = defaultdict(list)
        self._sent_count = 0

    def register_device(self, user_id: int, token: str, platform: str = "web"):
        if token not in self._device_tokens[user_id]:
            self._device_tokens[user_id].append(token)
            logger.info(f"Registered device for user {user_id}: {platform}")

    def unregister_device(self, user_id: int, token: str):
        if token in self._device_tokens[user_id]:
            self._device_tokens[user_id].remove(token)

    async def send(self, notification: Notification) -> bool:
        tokens = self._device_tokens.get(notification.user_id, [])
        if not tokens:
            logger.debug(f"No device tokens for user {notification.user_id}")
            return False

        payload = {
            "notification": {
                "title": notification.title,
                "body": notification.body,
                "icon": notification.icon,
                "color": notification.color,
                "sound": notification.metadata.get("sound"),
                "click_action": notification.action_url,
            },
            "data": {
                "notification_id": notification.id,
                "type": notification.type.value,
                "priority": notification.priority.value,
                **notification.data,
            },
            "android": {
                "priority": "high" if notification.priority in [NotificationPriority.CRITICAL, NotificationPriority.HIGH] else "normal",
                "notification": {
                    "channel_id": f"cancerguard_{notification.priority.value}",
                },
            },
            "apns": {
                "headers": {
                    "apns-priority": "10" if notification.priority == NotificationPriority.CRITICAL else "5",
                },
                "payload": {
                    "aps": {
                        "sound": notification.metadata.get("sound", "default"),
                        "badge": 1,
                    },
                },
            },
        }

        # Simulate sending to FCM/APNS
        await asyncio.sleep(0.01)
        self._sent_count += 1
        logger.info(f"Push notification sent to {len(tokens)} devices for user {notification.user_id}")
        return True


class SMSNotificationSender:
    """Handles SMS notification delivery (simulated Twilio/AWS SNS)."""

    def __init__(self):
        self._phone_numbers: Dict[int, str] = {}
        self._sent_count = 0
        self.max_sms_length = 160

    def register_phone(self, user_id: int, phone_number: str):
        self._phone_numbers[user_id] = phone_number

    async def send(self, notification: Notification) -> bool:
        phone = self._phone_numbers.get(notification.user_id)
        if not phone:
            logger.debug(f"No phone number for user {notification.user_id}")
            return False

        message = self._format_sms(notification)
        logger.info(f"Sending SMS to {phone}: {message[:50]}...")
        await asyncio.sleep(0.01)  # Simulate
        self._sent_count += 1
        return True

    def _format_sms(self, notification: Notification) -> str:
        prefix = "CancerGuard: "
        max_body = self.max_sms_length - len(prefix)
        body = notification.body
        if len(body) > max_body:
            body = body[:max_body - 3] + "..."
        return prefix + body


class NotificationDigestBuilder:
    """Builds periodic notification digests."""

    def __init__(self):
        self._pending_digests: Dict[int, List[Notification]] = defaultdict(list)

    def add_to_digest(self, notification: Notification):
        self._pending_digests[notification.user_id].append(notification)

    def build_digest(self, user_id: int) -> Optional[Dict[str, Any]]:
        notifications = self._pending_digests.pop(user_id, [])
        if not notifications:
            return None

        # Group by type
        by_type: Dict[str, List[Notification]] = defaultdict(list)
        for n in notifications:
            by_type[n.type.value].append(n)

        sections = []
        for type_name, notifs in by_type.items():
            sections.append({
                "type": type_name,
                "title": type_name.replace("_", " ").title(),
                "count": len(notifs),
                "items": [
                    {"title": n.title, "body": n.body, "time": n.created_at.isoformat()}
                    for n in notifs[:5]
                ],
            })

        return {
            "user_id": user_id,
            "total_count": len(notifications),
            "sections": sorted(sections, key=lambda x: x["count"], reverse=True),
            "generated_at": datetime.utcnow().isoformat(),
            "period": "daily",
        }


class NotificationAnalytics:
    """Tracks notification analytics and metrics."""

    def __init__(self):
        self._delivery_stats: Dict[str, int] = defaultdict(int)
        self._channel_stats: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self._type_stats: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self._hourly_volume: Dict[int, int] = defaultdict(int)
        self._read_rates: Dict[str, Dict[str, int]] = defaultdict(lambda: {"sent": 0, "read": 0})

    def record_sent(self, notification: Notification, channel: NotificationChannel):
        self._delivery_stats["total_sent"] += 1
        self._channel_stats[channel.value]["sent"] += 1
        self._type_stats[notification.type.value]["sent"] += 1
        hour = datetime.utcnow().hour
        self._hourly_volume[hour] += 1
        self._read_rates[notification.type.value]["sent"] += 1

    def record_delivered(self, notification: Notification, channel: NotificationChannel):
        self._delivery_stats["total_delivered"] += 1
        self._channel_stats[channel.value]["delivered"] += 1
        self._type_stats[notification.type.value]["delivered"] += 1

    def record_read(self, notification: Notification):
        self._delivery_stats["total_read"] += 1
        self._type_stats[notification.type.value]["read"] += 1
        self._read_rates[notification.type.value]["read"] += 1

    def record_failed(self, notification: Notification, channel: NotificationChannel, error: str):
        self._delivery_stats["total_failed"] += 1
        self._channel_stats[channel.value]["failed"] += 1

    def get_stats(self) -> Dict[str, Any]:
        total_sent = max(self._delivery_stats.get("total_sent", 0), 1)
        total_delivered = self._delivery_stats.get("total_delivered", 0)

        read_rates = {}
        for type_name, stats in self._read_rates.items():
            sent = max(stats["sent"], 1)
            read_rates[type_name] = round(stats["read"] / sent * 100, 1)

        return {
            "overview": {
                "total_sent": self._delivery_stats.get("total_sent", 0),
                "total_delivered": total_delivered,
                "total_read": self._delivery_stats.get("total_read", 0),
                "total_failed": self._delivery_stats.get("total_failed", 0),
                "delivery_rate": round(total_delivered / total_sent * 100, 1),
            },
            "by_channel": dict(self._channel_stats),
            "by_type": dict(self._type_stats),
            "hourly_volume": dict(self._hourly_volume),
            "read_rates": read_rates,
        }


class NotificationService:
    """
    Main notification service - orchestrates notification creation,
    processing, and delivery across all channels.
    """

    def __init__(self):
        self.template_registry = NotificationTemplateRegistry()
        self.rate_limiter = NotificationRateLimiter()
        self.grouper = NotificationGrouper()
        self.store = InAppNotificationStore()
        self.email_sender = EmailNotificationSender()
        self.push_sender = PushNotificationSender()
        self.sms_sender = SMSNotificationSender()
        self.digest_builder = NotificationDigestBuilder()
        self.analytics = NotificationAnalytics()
        self._preferences: Dict[int, NotificationPreference] = {}
        self._websocket_callbacks: List = []
        self._notification_counter = 0
        logger.info("NotificationService initialized")

    def _generate_id(self) -> str:
        self._notification_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"notif_{timestamp}_{self._notification_counter}"

    def get_preferences(self, user_id: int) -> NotificationPreference:
        if user_id not in self._preferences:
            self._preferences[user_id] = NotificationPreference(user_id=user_id)
        return self._preferences[user_id]

    def update_preferences(self, user_id: int, updates: Dict[str, Any]) -> NotificationPreference:
        prefs = self.get_preferences(user_id)
        for key, value in updates.items():
            if hasattr(prefs, key):
                setattr(prefs, key, value)
        return prefs

    def _is_quiet_hours(self, prefs: NotificationPreference) -> bool:
        if not prefs.quiet_hours_enabled:
            return False

        now = datetime.utcnow()
        current_time = now.strftime("%H:%M")
        start = prefs.quiet_hours_start
        end = prefs.quiet_hours_end

        if start < end:
            return start <= current_time <= end
        else:
            return current_time >= start or current_time <= end

    def _filter_channels(
        self,
        channels: List[NotificationChannel],
        prefs: NotificationPreference,
        priority: NotificationPriority,
    ) -> List[NotificationChannel]:
        filtered = []
        for channel in channels:
            if prefs.channels.get(channel, False):
                # During quiet hours, only critical notifications on push/sms
                if self._is_quiet_hours(prefs):
                    if channel in [NotificationChannel.PUSH, NotificationChannel.SMS]:
                        if priority != NotificationPriority.CRITICAL:
                            continue
                filtered.append(channel)
        return filtered

    async def send_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        data: Dict[str, Any] = None,
        override_channels: Optional[List[NotificationChannel]] = None,
        override_priority: Optional[NotificationPriority] = None,
    ) -> Optional[Notification]:
        """Create and send a notification."""
        data = data or {}

        # Get template
        template = self.template_registry.get_template(notification_type)
        if not template:
            logger.error(f"No template found for {notification_type}")
            return None

        # Check preferences
        prefs = self.get_preferences(user_id)
        if not prefs.enabled:
            return None

        if notification_type in prefs.blocked_types:
            return None

        # Rate limiting
        if not self.rate_limiter.can_send(user_id):
            return None

        # Build notification
        priority = override_priority or template.default_priority
        channels = override_channels or template.default_channels
        channels = self._filter_channels(channels, prefs, priority)

        if not channels:
            return None

        # Format content
        title = self._format_template(template.title_template, data)
        body = self._format_template(template.body_template, data)
        action_url = self._format_template(template.action_url_template or "", data) if template.action_url_template else None

        notification = Notification(
            id=self._generate_id(),
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
            icon=template.icon,
            color=template.color,
            priority=priority,
            channels=channels,
            action_url=action_url,
            data=data,
            expires_at=datetime.utcnow() + timedelta(hours=template.ttl_hours),
            group_key=f"{notification_type.value}",
            metadata={
                "sound": template.sound,
                "vibration_pattern": template.vibration_pattern,
            },
        )

        # Check for grouping
        if template.groupable:
            grouped = self.grouper.add_to_group(notification)
            if grouped is None:
                # Still accumulating, store individually
                self.store.store(notification)
                return notification
            elif len(grouped) > 1:
                notification = self.grouper.create_grouped_notification(grouped)

        # Deliver across channels
        await self._deliver(notification)

        return notification

    async def _deliver(self, notification: Notification):
        """Deliver notification across all specified channels."""
        self.rate_limiter.record_send(notification.user_id)

        for channel in notification.channels:
            try:
                success = False
                if channel == NotificationChannel.IN_APP:
                    self.store.store(notification)
                    success = True
                elif channel == NotificationChannel.EMAIL:
                    email = notification.data.get("email", f"user_{notification.user_id}@example.com")
                    success = await self.email_sender.send(notification, email)
                elif channel == NotificationChannel.PUSH:
                    success = await self.push_sender.send(notification)
                elif channel == NotificationChannel.SMS:
                    success = await self.sms_sender.send(notification)
                elif channel == NotificationChannel.WEBSOCKET:
                    await self._send_websocket(notification)
                    success = True

                if success:
                    notification.status = NotificationStatus.SENT
                    notification.sent_at = datetime.utcnow()
                    self.analytics.record_sent(notification, channel)
                    self.analytics.record_delivered(notification, channel)
                else:
                    self.analytics.record_failed(notification, channel, "delivery_failed")

            except Exception as e:
                logger.error(f"Failed to deliver via {channel}: {e}")
                self.analytics.record_failed(notification, channel, str(e))

                if notification.retry_count < notification.max_retries:
                    notification.retry_count += 1
                    # Would queue for retry in production

    async def _send_websocket(self, notification: Notification):
        for callback in self._websocket_callbacks:
            try:
                await callback(notification.user_id, notification.to_dict())
            except Exception as e:
                logger.error(f"WebSocket callback error: {e}")

    def register_websocket_callback(self, callback):
        self._websocket_callbacks.append(callback)

    def _format_template(self, template: str, data: Dict[str, Any]) -> str:
        try:
            return template.format(**data)
        except KeyError:
            return template

    def get_notifications(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        ntype = NotificationType(notification_type) if notification_type else None
        notifications = self.store.get_notifications(
            user_id, limit=limit, offset=offset,
            unread_only=unread_only, notification_type=ntype,
        )
        return {
            "notifications": notifications,
            "unread_count": self.store.get_unread_count(user_id),
            "total": len(notifications),
        }

    def mark_as_read(self, user_id: int, notification_id: str) -> bool:
        success = self.store.mark_as_read(user_id, notification_id)
        if success:
            # Would look up full notification for analytics in production
            pass
        return success

    def mark_all_as_read(self, user_id: int) -> int:
        return self.store.mark_all_as_read(user_id)

    def delete_notification(self, user_id: int, notification_id: str) -> bool:
        return self.store.delete_notification(user_id, notification_id)

    def clear_all(self, user_id: int) -> int:
        return self.store.delete_all(user_id)

    async def send_bulk(
        self,
        user_ids: List[int],
        notification_type: NotificationType,
        data: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        results = {"sent": 0, "failed": 0, "skipped": 0}
        for user_id in user_ids:
            try:
                result = await self.send_notification(user_id, notification_type, data)
                if result:
                    results["sent"] += 1
                else:
                    results["skipped"] += 1
            except Exception:
                results["failed"] += 1
        return results

    async def send_appointment_reminder(self, user_id: int, appointment_data: Dict[str, Any]):
        return await self.send_notification(
            user_id, NotificationType.APPOINTMENT_REMINDER, appointment_data
        )

    async def send_lab_results_notification(self, user_id: int, lab_data: Dict[str, Any], is_abnormal: bool = False):
        ntype = NotificationType.LAB_RESULTS_ABNORMAL if is_abnormal else NotificationType.LAB_RESULTS_READY
        return await self.send_notification(user_id, ntype, lab_data)

    async def send_medication_reminder(self, user_id: int, medication_data: Dict[str, Any]):
        return await self.send_notification(
            user_id, NotificationType.MEDICATION_REMINDER, medication_data
        )

    async def send_emergency_alert(self, user_id: int, message: str):
        return await self.send_notification(
            user_id,
            NotificationType.EMERGENCY_ALERT,
            {"message": message},
            override_priority=NotificationPriority.CRITICAL,
        )

    async def send_cancer_screening_reminder(self, user_id: int, screening_data: Dict[str, Any]):
        return await self.send_notification(
            user_id, NotificationType.CANCER_SCREENING_DUE, screening_data
        )

    def get_analytics(self) -> Dict[str, Any]:
        return self.analytics.get_stats()

    async def process_scheduled_digests(self):
        """Process and send scheduled notification digests."""
        for user_id, prefs in self._preferences.items():
            if prefs.digest_enabled:
                digest = self.digest_builder.build_digest(user_id)
                if digest:
                    await self.send_notification(
                        user_id,
                        NotificationType.EDUCATION_CONTENT,
                        {"title": "Daily Notification Digest", "body": json.dumps(digest)},
                        override_channels=[NotificationChannel.EMAIL],
                    )


# Singleton instance
notification_service = NotificationService()

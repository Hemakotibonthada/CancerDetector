"""
Email Service - Comprehensive email management for CancerGuard AI platform.
Handles transactional emails, templates, bulk sending, and email analytics.
"""

import asyncio
import hashlib
import logging
import re
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


# ============================================================================
# Enums & Types
# ============================================================================

class EmailType(str, Enum):
    WELCOME = "welcome"
    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR = "two_factor"
    APPOINTMENT_CONFIRMATION = "appointment_confirmation"
    APPOINTMENT_REMINDER = "appointment_reminder"
    APPOINTMENT_CANCELLATION = "appointment_cancellation"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    LAB_RESULTS_READY = "lab_results_ready"
    LAB_RESULTS_ABNORMAL = "lab_results_abnormal"
    PRESCRIPTION_READY = "prescription_ready"
    MEDICATION_REMINDER = "medication_reminder"
    BILLING_INVOICE = "billing_invoice"
    BILLING_RECEIPT = "billing_receipt"
    BILLING_OVERDUE = "billing_overdue"
    INSURANCE_CLAIM_STATUS = "insurance_claim_status"
    REFERRAL_CREATED = "referral_created"
    TELEHEALTH_INVITATION = "telehealth_invitation"
    CANCER_SCREENING_REMINDER = "cancer_screening_reminder"
    CANCER_RISK_REPORT = "cancer_risk_report"
    TREATMENT_PLAN_UPDATE = "treatment_plan_update"
    TREATMENT_MILESTONE = "treatment_milestone"
    CLINICAL_TRIAL_MATCH = "clinical_trial_match"
    GENOMIC_REPORT = "genomic_report"
    WEARABLE_ALERT = "wearable_alert"
    HEALTH_SUMMARY = "health_summary"
    MONTHLY_REPORT = "monthly_report"
    ANNUAL_SUMMARY = "annual_summary"
    EMERGENCY_ALERT = "emergency_alert"
    PROVIDER_MESSAGE = "provider_message"
    SYSTEM_NOTIFICATION = "system_notification"
    NEWSLETTER = "newsletter"
    FEEDBACK_REQUEST = "feedback_request"
    ACCOUNT_SECURITY = "account_security"
    CONSENT_REQUIRED = "consent_required"
    DATA_EXPORT_READY = "data_export_ready"


class EmailPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"
    BULK = "bulk"


class EmailStatus(str, Enum):
    QUEUED = "queued"
    SENDING = "sending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    FAILED = "failed"
    UNSUBSCRIBED = "unsubscribed"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class EmailAddress:
    email: str
    name: Optional[str] = None

    def formatted(self) -> str:
        if self.name:
            return f"{self.name} <{self.email}>"
        return self.email


@dataclass
class EmailAttachment:
    filename: str
    content: bytes
    content_type: str
    content_id: Optional[str] = None


@dataclass
class EmailMessage:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email_type: EmailType = EmailType.SYSTEM_NOTIFICATION
    priority: EmailPriority = EmailPriority.NORMAL
    sender: EmailAddress = field(default_factory=lambda: EmailAddress("noreply@cancerguard.ai", "CancerGuard AI"))
    recipients: List[EmailAddress] = field(default_factory=list)
    cc: List[EmailAddress] = field(default_factory=list)
    bcc: List[EmailAddress] = field(default_factory=list)
    reply_to: Optional[EmailAddress] = None
    subject: str = ""
    text_body: str = ""
    html_body: str = ""
    attachments: List[EmailAttachment] = field(default_factory=list)
    headers: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    status: EmailStatus = EmailStatus.QUEUED
    created_at: datetime = field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3


# ============================================================================
# Email Template Engine
# ============================================================================

class EmailTemplate:
    """HTML email template with variable substitution."""

    def __init__(self, name: str, subject: str, html_template: str, text_template: str = ""):
        self.name = name
        self.subject = subject
        self.html_template = html_template
        self.text_template = text_template

    def render(self, variables: Dict[str, Any]) -> Tuple[str, str, str]:
        subject = self._substitute(self.subject, variables)
        html = self._substitute(self.html_template, variables)
        text = self._substitute(self.text_template, variables) if self.text_template else ""
        return subject, html, text

    @staticmethod
    def _substitute(template: str, variables: Dict[str, Any]) -> str:
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result


class EmailTemplateRegistry:
    """Registry of all email templates used in the platform."""

    BASE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{title}}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; color: #333; line-height: 1.6; }}
.container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
.header {{ background: linear-gradient(135deg, #1565c0, #0d47a1); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; }}
.header h1 {{ color: #ffffff; font-size: 24px; margin-bottom: 8px; }}
.header .subtitle {{ color: rgba(255,255,255,0.85); font-size: 14px; }}
.logo {{ width: 48px; height: 48px; margin-bottom: 12px; }}
.body {{ background: #ffffff; padding: 32px 24px; }}
.body h2 {{ color: #1565c0; font-size: 20px; margin-bottom: 16px; }}
.body p {{ margin-bottom: 14px; color: #4a5568; }}
.highlight {{ background: #e3f2fd; border-left: 4px solid #1565c0; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
.highlight.warning {{ background: #fff3e0; border-color: #e65100; }}
.highlight.success {{ background: #e8f5e9; border-color: #2e7d32; }}
.highlight.critical {{ background: #fce4ec; border-color: #c62828; }}
.button {{ display: inline-block; background: linear-gradient(135deg, #1565c0, #1976d2); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; transition: background 0.3s; }}
.button:hover {{ background: linear-gradient(135deg, #0d47a1, #1565c0); }}
.button.secondary {{ background: linear-gradient(135deg, #00897b, #00acc1); }}
.info-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
.info-table td {{ padding: 10px 12px; border-bottom: 1px solid #e8e8e8; }}
.info-table td:first-child {{ font-weight: 600; color: #333; width: 40%; }}
.info-table td:last-child {{ color: #555; }}
.metric {{ display: inline-block; text-align: center; margin: 10px 15px; }}
.metric .value {{ font-size: 28px; font-weight: 700; color: #1565c0; }}
.metric .label {{ font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }}
.footer {{ background: #f8f9fa; padding: 24px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e8e8e8; }}
.footer p {{ color: #999; font-size: 12px; margin: 4px 0; }}
.footer a {{ color: #1565c0; text-decoration: none; }}
.unsubscribe {{ margin-top: 16px; font-size: 11px; }}
.divider {{ border: none; border-top: 1px solid #e8e8e8; margin: 24px 0; }}
.badge {{ display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }}
.badge.normal {{ background: #e8f5e9; color: #2e7d32; }}
.badge.warning {{ background: #fff3e0; color: #e65100; }}
.badge.critical {{ background: #fce4ec; color: #c62828; }}
.badge.info {{ background: #e3f2fd; color: #1565c0; }}
.steps {{ counter-reset: step; list-style: none; padding: 0; }}
.steps li {{ counter-increment: step; padding: 8px 0 8px 40px; position: relative; margin-bottom: 8px; }}
.steps li::before {{ content: counter(step); position: absolute; left: 0; top: 6px; width: 28px; height: 28px; background: #1565c0; color: #fff; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 600; }}
@media (max-width: 600px) {{
    .container {{ padding: 10px; }}
    .body {{ padding: 20px 16px; }}
    .header {{ padding: 24px 16px; }}
}}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🏥 CancerGuard AI</h1>
        <div class="subtitle">{{header_subtitle}}</div>
    </div>
    <div class="body">
        {{body_content}}
    </div>
    <div class="footer">
        <p>© 2024 CancerGuard AI - Advanced Healthcare Platform</p>
        <p>This is an automated message. Do not reply directly.</p>
        <p><a href="{{base_url}}/settings">Manage Preferences</a> | <a href="{{base_url}}/privacy">Privacy Policy</a> | <a href="{{base_url}}/contact">Contact Support</a></p>
        <div class="unsubscribe">
            <a href="{{base_url}}/unsubscribe?token={{unsubscribe_token}}">Unsubscribe from these emails</a>
        </div>
    </div>
</div>
</body>
</html>"""

    def __init__(self):
        self.templates: Dict[str, EmailTemplate] = {}
        self._register_all_templates()

    def get(self, template_name: str) -> Optional[EmailTemplate]:
        return self.templates.get(template_name)

    def register(self, template: EmailTemplate):
        self.templates[template.name] = template

    def _register_all_templates(self):
        self._register_welcome()
        self._register_verification()
        self._register_password_reset()
        self._register_appointment_confirmation()
        self._register_appointment_reminder()
        self._register_lab_results()
        self._register_lab_results_abnormal()
        self._register_prescription_ready()
        self._register_billing_invoice()
        self._register_billing_receipt()
        self._register_cancer_screening()
        self._register_cancer_risk_report()
        self._register_treatment_update()
        self._register_clinical_trial()
        self._register_genomic_report()
        self._register_telehealth_invitation()
        self._register_emergency_alert()
        self._register_health_summary()
        self._register_monthly_report()
        self._register_feedback_request()
        self._register_account_security()

    def _wrap_body(self, subtitle: str, body: str) -> str:
        return self.BASE_HTML.replace("{{header_subtitle}}", subtitle).replace("{{body_content}}", body)

    def _register_welcome(self):
        body = """
        <h2>Welcome to CancerGuard AI, {{patient_name}}! 🎉</h2>
        <p>Thank you for joining our advanced healthcare platform. We're committed to providing you with cutting-edge cancer detection and comprehensive health management.</p>
        <div class="highlight success">
            <strong>Your account has been created successfully.</strong><br>
            You can now access all platform features to manage your health journey.
        </div>
        <h3 style="margin-top:24px;">Get Started:</h3>
        <ol class="steps">
            <li>Complete your health profile for personalized recommendations</li>
            <li>Upload your medical records securely</li>
            <li>Set up wearable device integration</li>
            <li>Schedule your first cancer screening assessment</li>
            <li>Connect with your healthcare providers</li>
        </ol>
        <a href="{{base_url}}/profile/setup" class="button">Complete Your Profile</a>
        <hr class="divider">
        <p style="font-size:13px;color:#888;">If you didn't create this account, please contact our support team immediately.</p>
        """
        self.register(EmailTemplate("welcome", "Welcome to CancerGuard AI - Your Health Journey Starts Now",
                                     self._wrap_body("Welcome to the Future of Healthcare", body),
                                     "Welcome to CancerGuard AI, {{patient_name}}! Complete your profile at {{base_url}}/profile/setup"))

    def _register_verification(self):
        body = """
        <h2>Verify Your Email Address</h2>
        <p>Hi {{patient_name}},</p>
        <p>Please verify your email address to activate your CancerGuard AI account and access all features.</p>
        <div class="highlight">
            <strong>Verification Code:</strong>
            <div style="font-size:32px;font-weight:700;color:#1565c0;letter-spacing:8px;margin:12px 0;">{{verification_code}}</div>
            <p style="font-size:13px;color:#888;">This code expires in 15 minutes.</p>
        </div>
        <p>Or click the button below to verify directly:</p>
        <a href="{{base_url}}/verify?token={{verification_token}}" class="button">Verify Email</a>
        """
        self.register(EmailTemplate("verification", "Verify Your Email - CancerGuard AI",
                                     self._wrap_body("Email Verification Required", body),
                                     "Your verification code: {{verification_code}}"))

    def _register_password_reset(self):
        body = """
        <h2>Password Reset Request</h2>
        <p>Hi {{patient_name}},</p>
        <p>We received a request to reset your CancerGuard AI account password.</p>
        <a href="{{base_url}}/reset-password?token={{reset_token}}" class="button">Reset Password</a>
        <div class="highlight warning">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin-top:8px;padding-left:20px;">
                <li>This link expires in 1 hour</li>
                <li>If you didn't request this, ignore this email</li>
                <li>Never share this link with anyone</li>
            </ul>
        </div>
        <p style="color:#888;font-size:13px;">Request IP: {{request_ip}} | Time: {{request_time}}</p>
        """
        self.register(EmailTemplate("password_reset", "Password Reset - CancerGuard AI",
                                     self._wrap_body("Password Reset", body),
                                     "Reset your password: {{base_url}}/reset-password?token={{reset_token}}"))

    def _register_appointment_confirmation(self):
        body = """
        <h2>Appointment Confirmed ✓</h2>
        <p>Hi {{patient_name}},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <table class="info-table">
            <tr><td>Provider</td><td>{{provider_name}}, {{provider_specialty}}</td></tr>
            <tr><td>Date</td><td>{{appointment_date}}</td></tr>
            <tr><td>Time</td><td>{{appointment_time}}</td></tr>
            <tr><td>Location</td><td>{{location}}</td></tr>
            <tr><td>Type</td><td>{{appointment_type}}</td></tr>
            <tr><td>Duration</td><td>{{duration}} minutes</td></tr>
            <tr><td>Confirmation #</td><td><strong>{{confirmation_number}}</strong></td></tr>
        </table>
        <div class="highlight">
            <strong>Preparation Instructions:</strong>
            <p>{{preparation_instructions}}</p>
        </div>
        <a href="{{base_url}}/appointments/{{appointment_id}}" class="button">View Appointment</a>
        <a href="{{base_url}}/appointments/{{appointment_id}}/reschedule" class="button secondary">Reschedule</a>
        <p style="font-size:13px;color:#888;">Please arrive 15 minutes before your scheduled time. Bring your ID and insurance card.</p>
        """
        self.register(EmailTemplate("appointment_confirmation", "Appointment Confirmed - {{provider_name}} on {{appointment_date}}",
                                     self._wrap_body("Appointment Confirmation", body)))

    def _register_appointment_reminder(self):
        body = """
        <h2>Appointment Reminder</h2>
        <p>Hi {{patient_name}},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <table class="info-table">
            <tr><td>Provider</td><td>{{provider_name}}</td></tr>
            <tr><td>Date</td><td>{{appointment_date}}</td></tr>
            <tr><td>Time</td><td>{{appointment_time}}</td></tr>
            <tr><td>Location</td><td>{{location}}</td></tr>
        </table>
        <div class="highlight">
            <strong>📋 Remember to bring:</strong>
            <ul style="padding-left:20px;margin-top:8px;">
                <li>Photo ID</li>
                <li>Insurance card</li>
                <li>List of current medications</li>
                <li>Any recent test results</li>
                <li>Questions for your provider</li>
            </ul>
        </div>
        <a href="{{base_url}}/appointments/{{appointment_id}}" class="button">View Details</a>
        """
        self.register(EmailTemplate("appointment_reminder", "Reminder: Appointment {{reminder_period}} - {{provider_name}}",
                                     self._wrap_body("Appointment Reminder", body)))

    def _register_lab_results(self):
        body = """
        <h2>Lab Results Are Ready 📋</h2>
        <p>Hi {{patient_name}},</p>
        <p>Your lab results from {{lab_name}} are now available for review.</p>
        <table class="info-table">
            <tr><td>Test Type</td><td>{{test_type}}</td></tr>
            <tr><td>Order Date</td><td>{{order_date}}</td></tr>
            <tr><td>Results Date</td><td>{{results_date}}</td></tr>
            <tr><td>Ordering Provider</td><td>{{ordering_provider}}</td></tr>
            <tr><td>Status</td><td><span class="badge normal">Results Available</span></td></tr>
        </table>
        <a href="{{base_url}}/health-records/labs/{{lab_id}}" class="button">View Results</a>
        <p style="color:#888;font-size:13px;">Your provider will follow up if any action is needed.</p>
        """
        self.register(EmailTemplate("lab_results_ready", "Lab Results Ready - {{test_type}}",
                                     self._wrap_body("Lab Results Available", body)))

    def _register_lab_results_abnormal(self):
        body = """
        <h2>Lab Results Require Attention ⚠️</h2>
        <p>Hi {{patient_name}},</p>
        <p>Some of your recent lab results are outside the normal range.</p>
        <div class="highlight warning">
            <strong>⚠️ Action Required</strong>
            <p>Some results may need your provider's attention. Your healthcare team has been notified.</p>
        </div>
        <table class="info-table">
            <tr><td>Test</td><td>{{test_type}}</td></tr>
            <tr><td>Results Date</td><td>{{results_date}}</td></tr>
            <tr><td>Abnormal Findings</td><td>{{abnormal_count}} value(s) outside normal range</td></tr>
            <tr><td>Provider</td><td>{{ordering_provider}}</td></tr>
        </table>
        <a href="{{base_url}}/health-records/labs/{{lab_id}}" class="button">View Results</a>
        <p><strong>What to do next:</strong></p>
        <ol class="steps">
            <li>Review your results in the portal</li>
            <li>Wait for your provider to reach out</li>
            <li>Schedule a follow-up if recommended</li>
        </ol>
        """
        self.register(EmailTemplate("lab_results_abnormal", "⚠️ Lab Results Need Attention - {{test_type}}",
                                     self._wrap_body("Abnormal Lab Results", body)))

    def _register_prescription_ready(self):
        body = """
        <h2>Prescription Ready for Pickup 💊</h2>
        <p>Hi {{patient_name}},</p>
        <p>Your prescription is ready at the pharmacy.</p>
        <table class="info-table">
            <tr><td>Medication</td><td><strong>{{medication_name}}</strong></td></tr>
            <tr><td>Dosage</td><td>{{dosage}}</td></tr>
            <tr><td>Prescriber</td><td>{{prescriber_name}}</td></tr>
            <tr><td>Pharmacy</td><td>{{pharmacy_name}}</td></tr>
            <tr><td>Address</td><td>{{pharmacy_address}}</td></tr>
            <tr><td>Phone</td><td>{{pharmacy_phone}}</td></tr>
            <tr><td>Refills Remaining</td><td>{{refills_remaining}}</td></tr>
        </table>
        <a href="{{base_url}}/pharmacy/prescriptions/{{prescription_id}}" class="button">View Prescription</a>
        """
        self.register(EmailTemplate("prescription_ready", "Prescription Ready - {{medication_name}}",
                                     self._wrap_body("Prescription Ready", body)))

    def _register_billing_invoice(self):
        body = """
        <h2>New Invoice - {{invoice_number}}</h2>
        <p>Hi {{patient_name}},</p>
        <p>A new invoice has been generated for your recent services:</p>
        <table class="info-table">
            <tr><td>Invoice #</td><td><strong>{{invoice_number}}</strong></td></tr>
            <tr><td>Date of Service</td><td>{{service_date}}</td></tr>
            <tr><td>Provider</td><td>{{provider_name}}</td></tr>
            <tr><td>Description</td><td>{{service_description}}</td></tr>
            <tr><td>Total Charges</td><td>{{total_charges}}</td></tr>
            <tr><td>Insurance Covered</td><td>{{insurance_amount}}</td></tr>
            <tr><td style="font-size:18px;font-weight:700;color:#1565c0;">Your Balance</td><td style="font-size:18px;font-weight:700;color:#1565c0;">{{balance_due}}</td></tr>
            <tr><td>Due Date</td><td>{{due_date}}</td></tr>
        </table>
        <a href="{{base_url}}/billing/pay/{{invoice_id}}" class="button">Pay Now</a>
        <a href="{{base_url}}/billing/invoices/{{invoice_id}}" class="button secondary">View Details</a>
        <p style="color:#888;font-size:13px;">Payment plans are available. Contact our billing department for assistance.</p>
        """
        self.register(EmailTemplate("billing_invoice", "Invoice {{invoice_number}} - Amount Due: {{balance_due}}",
                                     self._wrap_body("Billing Invoice", body)))

    def _register_billing_receipt(self):
        body = """
        <h2>Payment Receipt ✓</h2>
        <p>Hi {{patient_name}},</p>
        <p>Thank you for your payment. Here is your receipt:</p>
        <div class="highlight success">
            <strong>Payment Received Successfully</strong>
        </div>
        <table class="info-table">
            <tr><td>Receipt #</td><td>{{receipt_number}}</td></tr>
            <tr><td>Invoice #</td><td>{{invoice_number}}</td></tr>
            <tr><td>Amount Paid</td><td><strong>{{amount_paid}}</strong></td></tr>
            <tr><td>Payment Method</td><td>{{payment_method}}</td></tr>
            <tr><td>Payment Date</td><td>{{payment_date}}</td></tr>
            <tr><td>Remaining Balance</td><td>{{remaining_balance}}</td></tr>
        </table>
        <a href="{{base_url}}/billing/receipts/{{receipt_id}}" class="button">Download Receipt</a>
        """
        self.register(EmailTemplate("billing_receipt", "Payment Receipt - {{receipt_number}}",
                                     self._wrap_body("Payment Confirmation", body)))

    def _register_cancer_screening(self):
        body = """
        <h2>Cancer Screening Reminder 🏥</h2>
        <p>Hi {{patient_name}},</p>
        <p>Based on your health profile and recommended guidelines, you are due for cancer screening:</p>
        <table class="info-table">
            <tr><td>Screening Type</td><td><strong>{{screening_type}}</strong></td></tr>
            <tr><td>Recommended By</td><td>{{guideline_source}}</td></tr>
            <tr><td>Last Screening</td><td>{{last_screening_date}}</td></tr>
            <tr><td>Next Due By</td><td>{{due_date}}</td></tr>
            <tr><td>Risk Category</td><td><span class="badge {{risk_class}}">{{risk_level}}</span></td></tr>
        </table>
        <div class="highlight">
            <strong>Why this screening is important:</strong>
            <p>{{screening_importance}}</p>
        </div>
        <a href="{{base_url}}/cancer-screening/schedule" class="button">Schedule Screening</a>
        <p>Early detection can significantly improve outcomes. Don't delay your screening.</p>
        """
        self.register(EmailTemplate("cancer_screening_reminder", "Cancer Screening Due - {{screening_type}}",
                                     self._wrap_body("Cancer Screening Reminder", body)))

    def _register_cancer_risk_report(self):
        body = """
        <h2>Cancer Risk Assessment Report 📊</h2>
        <p>Hi {{patient_name}},</p>
        <p>Your personalized cancer risk assessment has been updated based on the latest data and AI analysis.</p>
        <div style="text-align:center;margin:24px 0;">
            <div class="metric">
                <div class="value">{{overall_risk_score}}</div>
                <div class="label">Overall Risk</div>
            </div>
            <div class="metric">
                <div class="value" style="color:{{risk_color}};">{{risk_level}}</div>
                <div class="label">Risk Level</div>
            </div>
            <div class="metric">
                <div class="value">{{screenings_completed}}</div>
                <div class="label">Screenings Done</div>
            </div>
        </div>
        <h3>Risk Breakdown by Cancer Type:</h3>
        <table class="info-table">
            {{risk_breakdown_rows}}
        </table>
        <div class="highlight">
            <strong>Key Recommendations:</strong>
            <ul style="padding-left:20px;margin-top:8px;">
                {{recommendations_list}}
            </ul>
        </div>
        <a href="{{base_url}}/cancer-risk/report/{{report_id}}" class="button">View Full Report</a>
        <p style="color:#888;font-size:13px;">This assessment is generated by our AI system and should be reviewed with your healthcare provider.</p>
        """
        self.register(EmailTemplate("cancer_risk_report", "Cancer Risk Assessment Update - Risk: {{risk_level}}",
                                     self._wrap_body("Cancer Risk Assessment", body)))

    def _register_treatment_update(self):
        body = """
        <h2>Treatment Plan Update</h2>
        <p>Hi {{patient_name}},</p>
        <p>Your treatment plan has been updated by your care team:</p>
        <table class="info-table">
            <tr><td>Treatment</td><td><strong>{{treatment_name}}</strong></td></tr>
            <tr><td>Phase</td><td>{{treatment_phase}}</td></tr>
            <tr><td>Updated By</td><td>{{provider_name}}</td></tr>
            <tr><td>Update Date</td><td>{{update_date}}</td></tr>
        </table>
        <div class="highlight">
            <strong>Changes Made:</strong>
            <p>{{changes_description}}</p>
        </div>
        <h3>Next Steps:</h3>
        <ol class="steps">
            {{next_steps_list}}
        </ol>
        <a href="{{base_url}}/treatment/plan/{{plan_id}}" class="button">View Treatment Plan</a>
        """
        self.register(EmailTemplate("treatment_plan_update", "Treatment Plan Updated - {{treatment_name}}",
                                     self._wrap_body("Treatment Plan Update", body)))

    def _register_clinical_trial(self):
        body = """
        <h2>Clinical Trial Match Found 🔬</h2>
        <p>Hi {{patient_name}},</p>
        <p>Our AI system has identified a clinical trial that may match your profile:</p>
        <table class="info-table">
            <tr><td>Trial Name</td><td><strong>{{trial_name}}</strong></td></tr>
            <tr><td>Phase</td><td>{{trial_phase}}</td></tr>
            <tr><td>Sponsor</td><td>{{sponsor}}</td></tr>
            <tr><td>Location</td><td>{{location}}</td></tr>
            <tr><td>Match Score</td><td><span class="badge info">{{match_score}}% Match</span></td></tr>
            <tr><td>Enrollment Status</td><td>{{enrollment_status}}</td></tr>
        </table>
        <div class="highlight">
            <strong>Why This Trial Matches:</strong>
            <p>{{match_reason}}</p>
        </div>
        <a href="{{base_url}}/clinical-trials/{{trial_id}}" class="button">Learn More</a>
        <a href="{{base_url}}/clinical-trials/{{trial_id}}/interest" class="button secondary">Express Interest</a>
        <p style="color:#888;font-size:13px;">Discuss clinical trial options with your healthcare provider before enrolling.</p>
        """
        self.register(EmailTemplate("clinical_trial_match", "Clinical Trial Match - {{trial_name}}",
                                     self._wrap_body("Clinical Trial Match", body)))

    def _register_genomic_report(self):
        body = """
        <h2>Genomic Analysis Report 🧬</h2>
        <p>Hi {{patient_name}},</p>
        <p>Your genomic analysis results are now available:</p>
        <div style="text-align:center;margin:24px 0;">
            <div class="metric">
                <div class="value">{{variants_found}}</div>
                <div class="label">Variants Detected</div>
            </div>
            <div class="metric">
                <div class="value">{{actionable_findings}}</div>
                <div class="label">Actionable Findings</div>
            </div>
            <div class="metric">
                <div class="value">{{genes_analyzed}}</div>
                <div class="label">Genes Analyzed</div>
            </div>
        </div>
        <table class="info-table">
            <tr><td>Panel</td><td>{{panel_name}}</td></tr>
            <tr><td>Sample Type</td><td>{{sample_type}}</td></tr>
            <tr><td>Analysis Date</td><td>{{analysis_date}}</td></tr>
            <tr><td>Lab</td><td>{{lab_name}}</td></tr>
        </table>
        <div class="highlight {{finding_class}}">
            <strong>Key Findings:</strong>
            <p>{{key_findings_summary}}</p>
        </div>
        <a href="{{base_url}}/genomics/report/{{report_id}}" class="button">View Full Report</a>
        <p>We recommend scheduling a genetic counseling session to discuss these results in detail.</p>
        <a href="{{base_url}}/appointments/schedule?type=genetic_counseling" class="button secondary">Schedule Genetic Counseling</a>
        """
        self.register(EmailTemplate("genomic_report", "Genomic Analysis Results Ready",
                                     self._wrap_body("Genomic Analysis Report", body)))

    def _register_telehealth_invitation(self):
        body = """
        <h2>Telehealth Session Invitation 💻</h2>
        <p>Hi {{patient_name}},</p>
        <p>You have a telehealth session scheduled. Here are the details:</p>
        <table class="info-table">
            <tr><td>Provider</td><td>{{provider_name}}</td></tr>
            <tr><td>Date</td><td>{{session_date}}</td></tr>
            <tr><td>Time</td><td>{{session_time}}</td></tr>
            <tr><td>Duration</td><td>{{duration}} minutes</td></tr>
            <tr><td>Type</td><td>{{session_type}}</td></tr>
        </table>
        <a href="{{join_url}}" class="button">Join Session</a>
        <div class="highlight">
            <strong>Before your session:</strong>
            <ul style="padding-left:20px;margin-top:8px;">
                <li>Test your camera and microphone</li>
                <li>Find a quiet, well-lit space</li>
                <li>Have your medication list ready</li>
                <li>Prepare any questions for your provider</li>
                <li>Join 5 minutes before the scheduled time</li>
            </ul>
        </div>
        """
        self.register(EmailTemplate("telehealth_invitation", "Telehealth Session - {{provider_name}} on {{session_date}}",
                                     self._wrap_body("Telehealth Session", body)))

    def _register_emergency_alert(self):
        body = """
        <div class="highlight critical">
            <h2 style="color:#c62828;margin-bottom:8px;">🚨 EMERGENCY ALERT</h2>
            <p><strong>{{alert_type}}</strong></p>
        </div>
        <p>{{alert_message}}</p>
        <table class="info-table">
            <tr><td>Patient</td><td><strong>{{patient_name}}</strong></td></tr>
            <tr><td>Alert Time</td><td>{{alert_time}}</td></tr>
            <tr><td>Source</td><td>{{alert_source}}</td></tr>
            <tr><td>Severity</td><td><span class="badge critical">{{severity}}</span></td></tr>
            <tr><td>Location</td><td>{{location}}</td></tr>
        </table>
        <div class="highlight warning">
            <strong>Immediate Actions Required:</strong>
            <ol style="padding-left: 20px; margin-top: 8px;">
                {{action_items}}
            </ol>
        </div>
        <a href="{{base_url}}/emergency/{{alert_id}}" class="button" style="background:linear-gradient(135deg,#c62828,#e53935);">View Emergency Details</a>
        <p style="color:#888;font-size:13px;">If this is a life-threatening emergency, call 911 immediately.</p>
        """
        self.register(EmailTemplate("emergency_alert", "🚨 EMERGENCY: {{alert_type}} - {{patient_name}}",
                                     self._wrap_body("Emergency Alert", body)))

    def _register_health_summary(self):
        body = """
        <h2>Your Health Summary 📊</h2>
        <p>Hi {{patient_name}},</p>
        <p>Here's your comprehensive health summary for {{summary_period}}:</p>
        <div style="text-align:center;margin:24px 0;">
            <div class="metric">
                <div class="value" style="color:#2e7d32;">{{health_score}}</div>
                <div class="label">Health Score</div>
            </div>
            <div class="metric">
                <div class="value">{{appointments_count}}</div>
                <div class="label">Appointments</div>
            </div>
            <div class="metric">
                <div class="value">{{screenings_count}}</div>
                <div class="label">Screenings</div>
            </div>
            <div class="metric">
                <div class="value">{{goals_met}}</div>
                <div class="label">Goals Met</div>
            </div>
        </div>
        <h3>Vitals Trends</h3>
        <table class="info-table">
            {{vitals_rows}}
        </table>
        <h3>Upcoming</h3>
        <table class="info-table">
            {{upcoming_rows}}
        </table>
        <a href="{{base_url}}/health-summary" class="button">View Full Summary</a>
        """
        self.register(EmailTemplate("health_summary", "Your Health Summary - {{summary_period}}",
                                     self._wrap_body("Health Summary Report", body)))

    def _register_monthly_report(self):
        body = """
        <h2>Monthly Health Report - {{month_name}} {{year}}</h2>
        <p>Hi {{patient_name}},</p>
        <p>Here's your monthly health report with key insights and recommendations.</p>
        <div style="text-align:center;margin:24px 0;">
            <div class="metric"><div class="value">{{avg_steps}}</div><div class="label">Avg Daily Steps</div></div>
            <div class="metric"><div class="value">{{avg_sleep}}</div><div class="label">Avg Sleep (hrs)</div></div>
            <div class="metric"><div class="value">{{avg_heart_rate}}</div><div class="label">Avg Heart Rate</div></div>
        </div>
        <h3>Key Highlights</h3>
        <ul style="padding-left:20px;">{{highlights_list}}</ul>
        <h3>Recommendations</h3>
        <ol class="steps">{{recommendations_list}}</ol>
        <a href="{{base_url}}/reports/monthly/{{report_id}}" class="button">View Full Report</a>
        """
        self.register(EmailTemplate("monthly_report", "Monthly Health Report - {{month_name}} {{year}}",
                                     self._wrap_body("Monthly Health Report", body)))

    def _register_feedback_request(self):
        body = """
        <h2>How Was Your Experience? ⭐</h2>
        <p>Hi {{patient_name}},</p>
        <p>We'd love to hear about your recent experience with {{service_type}} on {{service_date}}.</p>
        <p style="text-align:center;font-size:32px;margin:24px 0;">⭐ ⭐ ⭐ ⭐ ⭐</p>
        <a href="{{base_url}}/feedback/{{feedback_id}}?rating=5" class="button">Rate Your Experience</a>
        <p>Your feedback helps us improve our services and provide better care for all patients.</p>
        """
        self.register(EmailTemplate("feedback_request", "How was your {{service_type}}?",
                                     self._wrap_body("We Value Your Feedback", body)))

    def _register_account_security(self):
        body = """
        <h2>Account Security Alert 🔒</h2>
        <p>Hi {{patient_name}},</p>
        <div class="highlight warning">
            <strong>{{security_event}}</strong>
            <p>{{security_description}}</p>
        </div>
        <table class="info-table">
            <tr><td>Date/Time</td><td>{{event_time}}</td></tr>
            <tr><td>IP Address</td><td>{{ip_address}}</td></tr>
            <tr><td>Location</td><td>{{location}}</td></tr>
            <tr><td>Device</td><td>{{device_info}}</td></tr>
        </table>
        <p><strong>If this was you:</strong> No action is needed.</p>
        <p><strong>If this wasn't you:</strong> Secure your account immediately.</p>
        <a href="{{base_url}}/security/lock-account" class="button" style="background:linear-gradient(135deg,#c62828,#e53935);">Secure Account</a>
        <a href="{{base_url}}/security/change-password" class="button secondary">Change Password</a>
        """
        self.register(EmailTemplate("account_security", "🔒 Security Alert - {{security_event}}",
                                     self._wrap_body("Account Security", body)))


# ============================================================================
# Email Queue & Rate Limiter
# ============================================================================

class EmailRateLimiter:
    """Rate limiter for email sending."""

    def __init__(self):
        self._rate_limits: Dict[str, Dict] = {
            "critical": {"per_minute": 100, "per_hour": 1000},
            "high": {"per_minute": 50, "per_hour": 500},
            "normal": {"per_minute": 30, "per_hour": 300},
            "low": {"per_minute": 10, "per_hour": 100},
            "bulk": {"per_minute": 5, "per_hour": 50},
        }
        self._counts: Dict[str, List[datetime]] = defaultdict(list)

    def can_send(self, recipient: str, priority: str) -> bool:
        now = datetime.utcnow()
        key = f"{recipient}:{priority}"
        limits = self._rate_limits.get(priority, self._rate_limits["normal"])

        # Clean old entries
        self._counts[key] = [t for t in self._counts[key] if (now - t).total_seconds() < 3600]

        # Check per-minute limit
        recent_minute = [t for t in self._counts[key] if (now - t).total_seconds() < 60]
        if len(recent_minute) >= limits["per_minute"]:
            return False

        # Check per-hour limit
        if len(self._counts[key]) >= limits["per_hour"]:
            return False

        return True

    def record_send(self, recipient: str, priority: str):
        key = f"{recipient}:{priority}"
        self._counts[key].append(datetime.utcnow())


class EmailQueue:
    """Priority email queue with retry support."""

    def __init__(self):
        self._queues: Dict[str, List[EmailMessage]] = {
            "critical": [],
            "high": [],
            "normal": [],
            "low": [],
            "bulk": [],
        }
        self._processing = False
        self._dead_letter: List[EmailMessage] = []

    def enqueue(self, message: EmailMessage):
        priority = message.priority.value
        self._queues.setdefault(priority, []).append(message)

    def dequeue(self) -> Optional[EmailMessage]:
        for priority in ["critical", "high", "normal", "low", "bulk"]:
            if self._queues.get(priority):
                return self._queues[priority].pop(0)
        return None

    def requeue(self, message: EmailMessage):
        message.retry_count += 1
        if message.retry_count >= message.max_retries:
            self._dead_letter.append(message)
            logger.error(f"Email {message.id} moved to dead letter queue after {message.retry_count} retries")
        else:
            self.enqueue(message)

    @property
    def total_size(self) -> int:
        return sum(len(q) for q in self._queues.values())

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total": self.total_size,
            "by_priority": {p: len(q) for p, q in self._queues.items()},
            "dead_letter_count": len(self._dead_letter),
            "is_processing": self._processing,
        }


# ============================================================================
# Email Analytics
# ============================================================================

class EmailAnalytics:
    """Email analytics and tracking."""

    def __init__(self):
        self._sent_count: Dict[str, int] = defaultdict(int)
        self._status_counts: Dict[str, int] = defaultdict(int)
        self._type_counts: Dict[str, int] = defaultdict(int)
        self._open_rates: Dict[str, List[bool]] = defaultdict(list)
        self._click_rates: Dict[str, List[bool]] = defaultdict(list)
        self._bounce_count = 0
        self._delivery_times: List[float] = []
        self._hourly_volume: Dict[int, int] = defaultdict(int)

    def record_sent(self, email: EmailMessage, delivery_time_ms: float = 0):
        self._sent_count[email.email_type.value] += 1
        self._status_counts["sent"] += 1
        self._type_counts[email.email_type.value] += 1
        self._hourly_volume[datetime.utcnow().hour] += 1
        if delivery_time_ms > 0:
            self._delivery_times.append(delivery_time_ms)

    def record_opened(self, email_type: str, recipient: str):
        self._status_counts["opened"] += 1
        self._open_rates[email_type].append(True)

    def record_clicked(self, email_type: str, recipient: str, link: str):
        self._status_counts["clicked"] += 1
        self._click_rates[email_type].append(True)

    def record_bounced(self, email: EmailMessage, reason: str):
        self._bounce_count += 1
        self._status_counts["bounced"] += 1

    def record_failed(self, email: EmailMessage, error: str):
        self._status_counts["failed"] += 1

    def get_stats(self) -> Dict[str, Any]:
        total_sent = sum(self._sent_count.values())
        total_opened = self._status_counts.get("opened", 0)
        total_clicked = self._status_counts.get("clicked", 0)

        return {
            "total_sent": total_sent,
            "total_opened": total_opened,
            "total_clicked": total_clicked,
            "total_bounced": self._bounce_count,
            "total_failed": self._status_counts.get("failed", 0),
            "open_rate": round(total_opened / max(total_sent, 1) * 100, 1),
            "click_rate": round(total_clicked / max(total_sent, 1) * 100, 1),
            "bounce_rate": round(self._bounce_count / max(total_sent, 1) * 100, 1),
            "avg_delivery_time_ms": round(sum(self._delivery_times) / max(len(self._delivery_times), 1), 1),
            "by_type": dict(self._type_counts),
            "hourly_volume": dict(self._hourly_volume),
        }


# ============================================================================
# Unsubscribe Manager
# ============================================================================

class UnsubscribeManager:
    """Manages email unsubscription preferences."""

    def __init__(self):
        self._preferences: Dict[str, Dict[str, bool]] = {}
        self._global_unsubscribed: Set[str] = set()

    def unsubscribe(self, email: str, email_type: Optional[str] = None):
        if email_type is None:
            self._global_unsubscribed.add(email)
        else:
            if email not in self._preferences:
                self._preferences[email] = {}
            self._preferences[email][email_type] = False

    def resubscribe(self, email: str, email_type: Optional[str] = None):
        if email_type is None:
            self._global_unsubscribed.discard(email)
        else:
            if email in self._preferences:
                self._preferences[email][email_type] = True

    def is_subscribed(self, email: str, email_type: str) -> bool:
        if email in self._global_unsubscribed:
            return False
        prefs = self._preferences.get(email, {})
        return prefs.get(email_type, True)

    def get_preferences(self, email: str) -> Dict[str, bool]:
        if email in self._global_unsubscribed:
            return {t.value: False for t in EmailType}
        prefs = {}
        for t in EmailType:
            prefs[t.value] = self._preferences.get(email, {}).get(t.value, True)
        return prefs


# ============================================================================
# Main Email Service
# ============================================================================

class EmailService:
    """Comprehensive email service for CancerGuard AI platform."""

    def __init__(self):
        self.templates = EmailTemplateRegistry()
        self.queue = EmailQueue()
        self.rate_limiter = EmailRateLimiter()
        self.analytics = EmailAnalytics()
        self.unsubscribe_manager = UnsubscribeManager()
        self._sent_history: List[Dict[str, Any]] = []
        self._max_history = 10000
        self._base_url = "https://cancerguard.ai"
        self._from_address = EmailAddress("noreply@cancerguard.ai", "CancerGuard AI")

    async def send_email(
        self,
        template_name: str,
        recipients: List[str],
        variables: Dict[str, Any],
        priority: EmailPriority = EmailPriority.NORMAL,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[EmailAttachment]] = None,
    ) -> Dict[str, Any]:
        """Send an email using a template."""
        template = self.templates.get(template_name)
        if not template:
            return {"success": False, "error": f"Template '{template_name}' not found"}

        variables.setdefault("base_url", self._base_url)
        variables.setdefault("unsubscribe_token", hashlib.md5(recipients[0].encode()).hexdigest())

        # Filter out unsubscribed recipients
        subscribed = [r for r in recipients if self.unsubscribe_manager.is_subscribed(r, template_name)]
        if not subscribed:
            return {"success": False, "error": "All recipients are unsubscribed"}

        subject, html_body, text_body = template.render(variables)

        message = EmailMessage(
            email_type=self._map_template_to_type(template_name),
            priority=priority,
            sender=self._from_address,
            recipients=[EmailAddress(e) for e in subscribed],
            cc=[EmailAddress(e) for e in (cc or [])],
            bcc=[EmailAddress(e) for e in (bcc or [])],
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            attachments=attachments or [],
            metadata={"template": template_name, "variables": variables},
        )

        # Check rate limits
        for recipient in subscribed:
            if not self.rate_limiter.can_send(recipient, priority.value):
                self.queue.enqueue(message)
                return {"success": True, "queued": True, "message_id": message.id}

        # Simulate sending
        result = await self._deliver_email(message)
        return result

    async def _deliver_email(self, message: EmailMessage) -> Dict[str, Any]:
        """Deliver an email (simulated for development)."""
        try:
            start_time = datetime.utcnow()

            # Simulate SMTP delivery
            await asyncio.sleep(0.01)

            message.status = EmailStatus.SENT
            message.sent_at = datetime.utcnow()

            delivery_time = (message.sent_at - start_time).total_seconds() * 1000

            for recipient in message.recipients:
                self.rate_limiter.record_send(recipient.email, message.priority.value)

            self.analytics.record_sent(message, delivery_time)
            self._record_history(message)

            logger.info(f"Email sent: {message.id} to {len(message.recipients)} recipients")

            return {
                "success": True,
                "message_id": message.id,
                "recipients": len(message.recipients),
                "delivery_time_ms": round(delivery_time, 1),
            }

        except Exception as e:
            message.status = EmailStatus.FAILED
            message.error_message = str(e)
            self.analytics.record_failed(message, str(e))
            self.queue.requeue(message)
            logger.error(f"Email delivery failed: {message.id} - {e}")
            return {"success": False, "error": str(e), "message_id": message.id}

    def _record_history(self, message: EmailMessage):
        self._sent_history.append({
            "id": message.id,
            "type": message.email_type.value,
            "subject": message.subject,
            "recipients": [r.email for r in message.recipients],
            "status": message.status.value,
            "sent_at": message.sent_at.isoformat() if message.sent_at else None,
            "priority": message.priority.value,
        })
        if len(self._sent_history) > self._max_history:
            self._sent_history = self._sent_history[-self._max_history:]

    @staticmethod
    def _map_template_to_type(template_name: str) -> EmailType:
        mapping = {
            "welcome": EmailType.WELCOME,
            "verification": EmailType.VERIFICATION,
            "password_reset": EmailType.PASSWORD_RESET,
            "appointment_confirmation": EmailType.APPOINTMENT_CONFIRMATION,
            "appointment_reminder": EmailType.APPOINTMENT_REMINDER,
            "lab_results_ready": EmailType.LAB_RESULTS_READY,
            "lab_results_abnormal": EmailType.LAB_RESULTS_ABNORMAL,
            "prescription_ready": EmailType.PRESCRIPTION_READY,
            "billing_invoice": EmailType.BILLING_INVOICE,
            "billing_receipt": EmailType.BILLING_RECEIPT,
            "cancer_screening_reminder": EmailType.CANCER_SCREENING_REMINDER,
            "cancer_risk_report": EmailType.CANCER_RISK_REPORT,
            "treatment_plan_update": EmailType.TREATMENT_PLAN_UPDATE,
            "clinical_trial_match": EmailType.CLINICAL_TRIAL_MATCH,
            "genomic_report": EmailType.GENOMIC_REPORT,
            "telehealth_invitation": EmailType.TELEHEALTH_INVITATION,
            "emergency_alert": EmailType.EMERGENCY_ALERT,
            "health_summary": EmailType.HEALTH_SUMMARY,
            "monthly_report": EmailType.MONTHLY_REPORT,
            "feedback_request": EmailType.FEEDBACK_REQUEST,
            "account_security": EmailType.ACCOUNT_SECURITY,
        }
        return mapping.get(template_name, EmailType.SYSTEM_NOTIFICATION)

    # Convenience methods for common email types
    async def send_welcome(self, recipient: str, patient_name: str) -> Dict[str, Any]:
        return await self.send_email("welcome", [recipient], {"patient_name": patient_name})

    async def send_verification(self, recipient: str, patient_name: str, code: str, token: str) -> Dict[str, Any]:
        return await self.send_email("verification", [recipient],
                                      {"patient_name": patient_name, "verification_code": code, "verification_token": token},
                                      priority=EmailPriority.HIGH)

    async def send_password_reset(self, recipient: str, patient_name: str, token: str, ip: str) -> Dict[str, Any]:
        return await self.send_email("password_reset", [recipient],
                                      {"patient_name": patient_name, "reset_token": token,
                                       "request_ip": ip, "request_time": datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")},
                                      priority=EmailPriority.HIGH)

    async def send_appointment_confirmation(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("appointment_confirmation", [recipient], variables)

    async def send_appointment_reminder(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("appointment_reminder", [recipient], variables, priority=EmailPriority.HIGH)

    async def send_lab_results(self, recipient: str, variables: Dict[str, Any], is_abnormal: bool = False) -> Dict[str, Any]:
        template = "lab_results_abnormal" if is_abnormal else "lab_results_ready"
        priority = EmailPriority.HIGH if is_abnormal else EmailPriority.NORMAL
        return await self.send_email(template, [recipient], variables, priority=priority)

    async def send_cancer_screening_reminder(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("cancer_screening_reminder", [recipient], variables, priority=EmailPriority.HIGH)

    async def send_cancer_risk_report(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("cancer_risk_report", [recipient], variables)

    async def send_emergency_alert(self, recipients: List[str], variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("emergency_alert", recipients, variables, priority=EmailPriority.CRITICAL)

    async def send_telehealth_invitation(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("telehealth_invitation", [recipient], variables, priority=EmailPriority.HIGH)

    async def send_billing_invoice(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("billing_invoice", [recipient], variables)

    async def send_genomic_report(self, recipient: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return await self.send_email("genomic_report", [recipient], variables, priority=EmailPriority.HIGH)

    async def send_bulk(self, template_name: str, recipient_vars: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Send bulk emails with per-recipient variables."""
        results = {"total": len(recipient_vars), "sent": 0, "failed": 0, "queued": 0}
        for rv in recipient_vars:
            recipient = rv.pop("email")
            result = await self.send_email(template_name, [recipient], rv, priority=EmailPriority.BULK)
            if result.get("success"):
                if result.get("queued"):
                    results["queued"] += 1
                else:
                    results["sent"] += 1
            else:
                results["failed"] += 1
        return results

    async def process_queue(self):
        """Process queued emails."""
        processed = 0
        while True:
            message = self.queue.dequeue()
            if not message:
                break
            result = await self._deliver_email(message)
            processed += 1
            if processed >= 100:
                break
        return {"processed": processed}

    def get_history(self, email_type: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        history = self._sent_history
        if email_type:
            history = [h for h in history if h["type"] == email_type]
        return history[-limit:]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "analytics": self.analytics.get_stats(),
            "queue": self.queue.get_stats(),
            "total_history": len(self._sent_history),
        }


# Singleton instance
email_service = EmailService()

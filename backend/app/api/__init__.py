"""API Package"""
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.patients import router as patients_router
from app.api.hospitals import router as hospitals_router
from app.api.health_records import router as health_records_router
from app.api.blood_samples import router as blood_samples_router
from app.api.smartwatch import router as smartwatch_router
from app.api.cancer_detection import router as cancer_detection_router
from app.api.admin import router as admin_router
from app.api.appointments import router as appointments_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.analytics import router as analytics_router
from app.api.blood_donor import router as blood_donor_router

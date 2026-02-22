"""Medical Image Model"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, AuditMixin

class ImageType(str, enum.Enum):
    XRAY = "xray"
    CT_SCAN = "ct_scan"
    MRI = "mri"
    PET_SCAN = "pet_scan"
    ULTRASOUND = "ultrasound"
    MAMMOGRAM = "mammogram"
    DEXA_SCAN = "dexa_scan"
    FLUOROSCOPY = "fluoroscopy"
    ANGIOGRAM = "angiogram"
    ECHOCARDIOGRAM = "echocardiogram"
    PATHOLOGY_SLIDE = "pathology_slide"
    DERMATOLOGY = "dermatology"
    ENDOSCOPY = "endoscopy"
    OTHER = "other"

class ImageAnalysisResult(str, enum.Enum):
    NORMAL = "normal"
    ABNORMAL = "abnormal"
    SUSPICIOUS = "suspicious"
    MALIGNANT = "malignant"
    BENIGN = "benign"
    INCONCLUSIVE = "inconclusive"
    PENDING = "pending"

class MedicalImage(Base, AuditMixin):
    __tablename__ = "medical_images"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    health_record_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("health_records.id"), nullable=True)
    image_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    image_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    body_part: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dicom_study_uid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dicom_series_uid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    modality: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    radiologist_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    radiologist_report: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    impression: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_analysis_result: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_heatmap_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ai_detected_regions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    ordering_doctor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospitals.id"), nullable=True)
    clinical_indication: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contrast_used: Mapped[bool] = mapped_column(Boolean, default=False)
    contrast_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    __table_args__ = (
        Index("ix_image_patient_date", "patient_id", "image_date"),
        Index("ix_image_type_analysis", "image_type", "ai_analysis_result"),
    )

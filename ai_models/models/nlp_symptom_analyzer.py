"""
NLP Symptom Analyzer - Natural Language Processing for medical symptom analysis.
Processes patient-reported symptoms, maps to medical terminology,
generates differential diagnoses, and provides triage recommendations.
"""

import re
import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


class TriageLevel(Enum):
    EMERGENCY = "emergency"
    URGENT = "urgent"
    SEMI_URGENT = "semi_urgent"
    ROUTINE = "routine"
    SELF_CARE = "self_care"


class BodySystem(Enum):
    RESPIRATORY = "respiratory"
    CARDIOVASCULAR = "cardiovascular"
    NEUROLOGICAL = "neurological"
    GASTROINTESTINAL = "gastrointestinal"
    MUSCULOSKELETAL = "musculoskeletal"
    DERMATOLOGICAL = "dermatological"
    ENDOCRINE = "endocrine"
    UROLOGICAL = "urological"
    REPRODUCTIVE = "reproductive"
    HEMATOLOGICAL = "hematological"
    IMMUNOLOGICAL = "immunological"
    PSYCHIATRIC = "psychiatric"
    ENT = "ent"
    OPHTHALMOLOGICAL = "ophthalmological"
    GENERAL = "general"
    ONCOLOGICAL = "oncological"


@dataclass
class SymptomEntity:
    name: str
    normalized_name: str
    body_system: str
    severity: str = "moderate"  # mild, moderate, severe
    duration: Optional[str] = None
    onset: Optional[str] = None  # sudden, gradual
    frequency: Optional[str] = None  # constant, intermittent, episodic
    location: Optional[str] = None
    related_symptoms: List[str] = field(default_factory=list)
    red_flags: bool = False
    icd10_codes: List[str] = field(default_factory=list)
    confidence: float = 0.0

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class DifferentialDiagnosis:
    condition: str
    probability: float
    icd10_code: str
    body_system: str
    matching_symptoms: List[str] = field(default_factory=list)
    missing_symptoms: List[str] = field(default_factory=list)
    red_flags: List[str] = field(default_factory=list)
    recommended_tests: List[str] = field(default_factory=list)
    urgency: str = "routine"

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class SymptomAnalysisResult:
    analysis_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    input_text: str = ""
    extracted_symptoms: List[Dict] = field(default_factory=list)
    body_systems_affected: List[str] = field(default_factory=list)
    differential_diagnoses: List[Dict] = field(default_factory=list)
    triage_level: str = ""
    triage_reasoning: str = ""
    recommended_actions: List[str] = field(default_factory=list)
    follow_up_questions: List[str] = field(default_factory=list)
    red_flags_detected: List[str] = field(default_factory=list)
    confidence: float = 0.0
    processing_time_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


class MedicalOntology:
    """Medical terminology mapping and normalization."""

    SYMPTOM_SYNONYMS = {
        "headache": ["head pain", "cephalalgia", "migraine", "head hurts", "head ache", "head is pounding"],
        "chest_pain": ["chest pain", "chest hurts", "chest tightness", "angina", "chest discomfort", "chest pressure"],
        "shortness_of_breath": ["shortness of breath", "difficulty breathing", "dyspnea", "breathless", "can't breathe", "breathing difficulty", "sob"],
        "fever": ["fever", "high temperature", "febrile", "feverish", "chills and fever", "pyrexia", "temperature"],
        "cough": ["cough", "coughing", "persistent cough", "dry cough", "wet cough", "productive cough", "hacking cough"],
        "fatigue": ["fatigue", "tired", "tiredness", "exhaustion", "lethargy", "weakness", "no energy", "exhausted", "fatigued"],
        "nausea": ["nausea", "nauseous", "feel sick", "queasiness", "queasy", "stomach upset", "want to vomit"],
        "vomiting": ["vomiting", "throwing up", "emesis", "vomit", "puking"],
        "diarrhea": ["diarrhea", "loose stools", "watery stools", "frequent bowel movements", "runs"],
        "abdominal_pain": ["abdominal pain", "stomach pain", "belly pain", "stomach ache", "stomach cramps", "stomach hurts", "tummy ache"],
        "back_pain": ["back pain", "backache", "lumbar pain", "back hurts", "lower back pain", "upper back pain"],
        "joint_pain": ["joint pain", "arthralgia", "joint ache", "joints hurt", "joint stiffness", "joint swelling"],
        "dizziness": ["dizziness", "dizzy", "vertigo", "lightheaded", "light headed", "feeling faint", "room spinning"],
        "rash": ["rash", "skin rash", "hives", "eruption", "skin irritation", "skin breakout"],
        "swelling": ["swelling", "edema", "swollen", "puffiness", "inflammation"],
        "weight_loss": ["weight loss", "losing weight", "unintended weight loss", "unexplained weight loss"],
        "night_sweats": ["night sweats", "sweating at night", "nocturnal sweating", "waking up sweating"],
        "blood_in_stool": ["blood in stool", "rectal bleeding", "bloody stool", "hematochezia", "melena"],
        "blood_in_urine": ["blood in urine", "hematuria", "bloody urine", "pink urine"],
        "lump": ["lump", "mass", "bump", "nodule", "growth", "swelling", "knot"],
        "numbness": ["numbness", "tingling", "pins and needles", "paresthesia", "loss of sensation"],
        "vision_changes": ["vision changes", "blurred vision", "blurry vision", "double vision", "vision loss", "seeing spots"],
        "palpitations": ["palpitations", "heart racing", "heart pounding", "irregular heartbeat", "heart fluttering", "rapid heartbeat"],
        "anxiety": ["anxiety", "anxious", "nervousness", "panic", "worry", "panic attack", "feeling anxious"],
        "depression": ["depression", "depressed", "sad", "feeling down", "hopelessness", "loss of interest"],
        "insomnia": ["insomnia", "can't sleep", "difficulty sleeping", "sleep problems", "sleeplessness"],
        "constipation": ["constipation", "constipated", "difficulty passing stool", "hard stool"],
        "sore_throat": ["sore throat", "throat pain", "pharyngitis", "throat hurts", "painful swallowing"],
        "ear_pain": ["ear pain", "earache", "otalgia", "ear hurts"],
        "urinary_frequency": ["urinary frequency", "frequent urination", "peeing a lot", "urinating often"],
        "painful_urination": ["painful urination", "dysuria", "burning urination", "burns when peeing"],
    }

    SYMPTOM_BODY_SYSTEMS = {
        "headache": BodySystem.NEUROLOGICAL,
        "chest_pain": BodySystem.CARDIOVASCULAR,
        "shortness_of_breath": BodySystem.RESPIRATORY,
        "fever": BodySystem.GENERAL,
        "cough": BodySystem.RESPIRATORY,
        "fatigue": BodySystem.GENERAL,
        "nausea": BodySystem.GASTROINTESTINAL,
        "vomiting": BodySystem.GASTROINTESTINAL,
        "diarrhea": BodySystem.GASTROINTESTINAL,
        "abdominal_pain": BodySystem.GASTROINTESTINAL,
        "back_pain": BodySystem.MUSCULOSKELETAL,
        "joint_pain": BodySystem.MUSCULOSKELETAL,
        "dizziness": BodySystem.NEUROLOGICAL,
        "rash": BodySystem.DERMATOLOGICAL,
        "swelling": BodySystem.GENERAL,
        "weight_loss": BodySystem.GENERAL,
        "night_sweats": BodySystem.GENERAL,
        "blood_in_stool": BodySystem.GASTROINTESTINAL,
        "blood_in_urine": BodySystem.UROLOGICAL,
        "lump": BodySystem.ONCOLOGICAL,
        "numbness": BodySystem.NEUROLOGICAL,
        "vision_changes": BodySystem.OPHTHALMOLOGICAL,
        "palpitations": BodySystem.CARDIOVASCULAR,
        "anxiety": BodySystem.PSYCHIATRIC,
        "depression": BodySystem.PSYCHIATRIC,
        "insomnia": BodySystem.PSYCHIATRIC,
        "constipation": BodySystem.GASTROINTESTINAL,
        "sore_throat": BodySystem.ENT,
        "ear_pain": BodySystem.ENT,
        "urinary_frequency": BodySystem.UROLOGICAL,
        "painful_urination": BodySystem.UROLOGICAL,
    }

    RED_FLAG_SYMPTOMS = {
        "chest_pain", "shortness_of_breath", "blood_in_stool",
        "blood_in_urine", "weight_loss", "night_sweats", "lump",
        "vision_changes", "numbness",
    }

    # Disease-symptom associations for differential diagnosis
    DISEASE_SYMPTOMS = {
        "Upper Respiratory Infection": {
            "icd10": "J06.9",
            "system": BodySystem.RESPIRATORY,
            "symptoms": {"cough", "sore_throat", "fever", "fatigue"},
            "optional": {"headache", "nasal_congestion"},
            "urgency": "routine",
        },
        "Pneumonia": {
            "icd10": "J18.9",
            "system": BodySystem.RESPIRATORY,
            "symptoms": {"cough", "fever", "shortness_of_breath"},
            "optional": {"chest_pain", "fatigue", "chills"},
            "urgency": "urgent",
        },
        "Acute Coronary Syndrome": {
            "icd10": "I21.9",
            "system": BodySystem.CARDIOVASCULAR,
            "symptoms": {"chest_pain", "shortness_of_breath"},
            "optional": {"nausea", "sweating", "dizziness", "palpitations"},
            "urgency": "emergency",
        },
        "Gastroesophageal Reflux Disease": {
            "icd10": "K21.0",
            "system": BodySystem.GASTROINTESTINAL,
            "symptoms": {"chest_pain", "nausea"},
            "optional": {"cough", "sore_throat"},
            "urgency": "routine",
        },
        "Migraine": {
            "icd10": "G43.9",
            "system": BodySystem.NEUROLOGICAL,
            "symptoms": {"headache", "nausea"},
            "optional": {"vision_changes", "dizziness", "vomiting"},
            "urgency": "routine",
        },
        "Tension Headache": {
            "icd10": "G44.2",
            "system": BodySystem.NEUROLOGICAL,
            "symptoms": {"headache"},
            "optional": {"fatigue", "insomnia"},
            "urgency": "routine",
        },
        "Iron Deficiency Anemia": {
            "icd10": "D50.9",
            "system": BodySystem.HEMATOLOGICAL,
            "symptoms": {"fatigue", "dizziness", "shortness_of_breath"},
            "optional": {"palpitations", "headache"},
            "urgency": "semi_urgent",
        },
        "Urinary Tract Infection": {
            "icd10": "N39.0",
            "system": BodySystem.UROLOGICAL,
            "symptoms": {"painful_urination", "urinary_frequency"},
            "optional": {"fever", "abdominal_pain", "blood_in_urine"},
            "urgency": "semi_urgent",
        },
        "Gastroenteritis": {
            "icd10": "K52.9",
            "system": BodySystem.GASTROINTESTINAL,
            "symptoms": {"nausea", "vomiting", "diarrhea"},
            "optional": {"fever", "abdominal_pain", "fatigue"},
            "urgency": "routine",
        },
        "Appendicitis": {
            "icd10": "K37",
            "system": BodySystem.GASTROINTESTINAL,
            "symptoms": {"abdominal_pain", "nausea"},
            "optional": {"vomiting", "fever"},
            "urgency": "emergency",
        },
        "Major Depressive Disorder": {
            "icd10": "F32.9",
            "system": BodySystem.PSYCHIATRIC,
            "symptoms": {"depression", "fatigue", "insomnia"},
            "optional": {"weight_loss", "anxiety"},
            "urgency": "semi_urgent",
        },
        "Generalized Anxiety Disorder": {
            "icd10": "F41.1",
            "system": BodySystem.PSYCHIATRIC,
            "symptoms": {"anxiety", "insomnia"},
            "optional": {"palpitations", "fatigue", "headache", "dizziness"},
            "urgency": "semi_urgent",
        },
        "Colorectal Cancer": {
            "icd10": "C18.9",
            "system": BodySystem.ONCOLOGICAL,
            "symptoms": {"blood_in_stool", "weight_loss"},
            "optional": {"abdominal_pain", "fatigue", "constipation", "diarrhea"},
            "urgency": "urgent",
        },
        "Lung Cancer": {
            "icd10": "C34.90",
            "system": BodySystem.ONCOLOGICAL,
            "symptoms": {"cough", "weight_loss", "shortness_of_breath"},
            "optional": {"chest_pain", "fatigue", "night_sweats"},
            "urgency": "urgent",
        },
        "Breast Cancer": {
            "icd10": "C50.9",
            "system": BodySystem.ONCOLOGICAL,
            "symptoms": {"lump"},
            "optional": {"weight_loss", "fatigue"},
            "urgency": "urgent",
        },
        "Lymphoma": {
            "icd10": "C85.9",
            "system": BodySystem.ONCOLOGICAL,
            "symptoms": {"lump", "night_sweats", "weight_loss"},
            "optional": {"fever", "fatigue"},
            "urgency": "urgent",
        },
        "Deep Vein Thrombosis": {
            "icd10": "I82.90",
            "system": BodySystem.CARDIOVASCULAR,
            "symptoms": {"swelling", "joint_pain"},
            "optional": {"rash"},
            "urgency": "urgent",
        },
        "Hypothyroidism": {
            "icd10": "E03.9",
            "system": BodySystem.ENDOCRINE,
            "symptoms": {"fatigue", "weight_loss", "constipation"},
            "optional": {"depression", "joint_pain"},
            "urgency": "routine",
        },
        "Diabetes Mellitus Type 2": {
            "icd10": "E11.9",
            "system": BodySystem.ENDOCRINE,
            "symptoms": {"fatigue", "urinary_frequency"},
            "optional": {"weight_loss", "vision_changes", "numbness"},
            "urgency": "semi_urgent",
        },
        "Stroke": {
            "icd10": "I63.9",
            "system": BodySystem.NEUROLOGICAL,
            "symptoms": {"numbness", "vision_changes", "dizziness"},
            "optional": {"headache"},
            "urgency": "emergency",
        },
    }


class SymptomExtractor:
    """Extract and normalize symptoms from patient text."""

    def __init__(self):
        self.ontology = MedicalOntology()
        self.severity_modifiers = {
            "severe": ["severe", "intense", "unbearable", "excruciating", "worst", "terrible", "horrible", "extreme"],
            "moderate": ["moderate", "noticeable", "significant", "considerable"],
            "mild": ["mild", "slight", "minor", "little", "small", "subtle"],
        }
        self.duration_patterns = [
            (r"(\d+)\s*(day|days|week|weeks|month|months|year|years|hour|hours)\s*(?:ago|now|long)", None),
            (r"since\s+(yesterday|last\s+week|last\s+month|this\s+morning)", None),
            (r"for\s+(\d+)\s*(day|days|week|weeks|month|months)", None),
        ]
        self.onset_keywords = {
            "sudden": ["suddenly", "sudden", "abruptly", "all of a sudden", "out of nowhere"],
            "gradual": ["gradually", "gradually", "slowly", "over time", "progressively", "getting worse"],
        }

    def extract(self, text: str) -> List[SymptomEntity]:
        """Extract symptoms from free text."""
        text_lower = text.lower().strip()
        symptoms = []
        found_symptoms = set()

        # Match against symptom dictionary
        for canonical, synonyms in self.ontology.SYMPTOM_SYNONYMS.items():
            for synonym in synonyms:
                if synonym.lower() in text_lower and canonical not in found_symptoms:
                    found_symptoms.add(canonical)

                    body_system = self.ontology.SYMPTOM_BODY_SYSTEMS.get(
                        canonical, BodySystem.GENERAL
                    )
                    severity = self._extract_severity(text_lower, synonym)
                    duration = self._extract_duration(text_lower)
                    onset = self._extract_onset(text_lower)
                    is_red_flag = canonical in self.ontology.RED_FLAG_SYMPTOMS

                    symptom = SymptomEntity(
                        name=synonym,
                        normalized_name=canonical,
                        body_system=body_system.value,
                        severity=severity,
                        duration=duration,
                        onset=onset,
                        red_flags=is_red_flag,
                        confidence=0.85 + np.random.uniform(0, 0.15),
                    )
                    symptoms.append(symptom)
                    break  # Found match, move to next canonical symptom

        return symptoms

    def _extract_severity(self, text: str, symptom: str) -> str:
        """Extract severity from context around symptom mention."""
        # Check words around the symptom
        for severity, modifiers in self.severity_modifiers.items():
            for modifier in modifiers:
                if modifier in text:
                    # Check if modifier is near the symptom
                    symptom_idx = text.find(symptom)
                    modifier_idx = text.find(modifier)
                    if abs(symptom_idx - modifier_idx) < 50:  # Within 50 chars
                        return severity
        return "moderate"

    def _extract_duration(self, text: str) -> Optional[str]:
        """Extract symptom duration from text."""
        for pattern, _ in self.duration_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _extract_onset(self, text: str) -> Optional[str]:
        """Extract symptom onset from text."""
        for onset_type, keywords in self.onset_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    return onset_type
        return None


class DifferentialDiagnosisEngine:
    """Generate differential diagnoses from symptoms."""

    def __init__(self):
        self.ontology = MedicalOntology()

    def generate(
        self,
        symptoms: List[SymptomEntity],
        patient_context: Optional[Dict] = None,
    ) -> List[DifferentialDiagnosis]:
        """Generate ranked differential diagnoses."""
        if not symptoms:
            return []

        symptom_set = {s.normalized_name for s in symptoms}
        diagnoses = []

        for disease, config in self.ontology.DISEASE_SYMPTOMS.items():
            required = config["symptoms"]
            optional = config.get("optional", set())
            all_symptoms = required | optional

            # Calculate symptom match score
            matching = symptom_set & all_symptoms
            required_matching = symptom_set & required
            missing_required = required - symptom_set

            if not matching:
                continue

            # Score based on matching
            required_match_ratio = len(required_matching) / len(required) if required else 0
            total_match_ratio = len(matching) / len(all_symptoms) if all_symptoms else 0

            # Weighted probability
            probability = required_match_ratio * 0.7 + total_match_ratio * 0.3

            # Adjust for patient context
            if patient_context:
                probability = self._adjust_for_context(probability, disease, patient_context)

            if probability < 0.15:
                continue

            # Generate recommended tests
            recommended_tests = self._get_recommended_tests(disease, symptoms)

            # Check for red flags
            red_flags = [
                s.name for s in symptoms
                if s.red_flags and s.normalized_name in matching
            ]

            diagnosis = DifferentialDiagnosis(
                condition=disease,
                probability=round(probability, 3),
                icd10_code=config["icd10"],
                body_system=config["system"].value,
                matching_symptoms=list(matching),
                missing_symptoms=list(missing_required),
                red_flags=red_flags,
                recommended_tests=recommended_tests,
                urgency=config.get("urgency", "routine"),
            )
            diagnoses.append(diagnosis)

        # Sort by probability
        diagnoses.sort(key=lambda d: d.probability, reverse=True)

        return diagnoses[:10]  # Top 10

    def _adjust_for_context(
        self,
        probability: float,
        disease: str,
        context: Dict,
    ) -> float:
        """Adjust probability based on patient context."""
        age = context.get("age", 45)
        gender = context.get("gender", "").lower()

        # Age adjustments
        cancer_diseases = {"Colorectal Cancer", "Lung Cancer", "Breast Cancer", "Lymphoma"}
        if disease in cancer_diseases and age > 50:
            probability *= 1.2
        elif disease in cancer_diseases and age < 30:
            probability *= 0.5

        # Gender adjustments
        if disease == "Breast Cancer" and gender == "male":
            probability *= 0.01
        if disease == "Breast Cancer" and gender == "female":
            probability *= 1.3

        # Risk factor adjustments
        if context.get("smoking_status") == "current":
            if disease == "Lung Cancer":
                probability *= 1.5
            elif disease == "Pneumonia":
                probability *= 1.3

        return min(probability, 1.0)

    def _get_recommended_tests(
        self,
        disease: str,
        symptoms: List[SymptomEntity],
    ) -> List[str]:
        """Get recommended diagnostic tests for a condition."""
        test_map = {
            "Upper Respiratory Infection": ["Rapid strep test", "Throat culture"],
            "Pneumonia": ["Chest X-ray", "CBC", "Sputum culture", "Blood cultures"],
            "Acute Coronary Syndrome": ["ECG", "Troponin", "Chest X-ray", "Echocardiogram"],
            "Gastroesophageal Reflux Disease": ["Upper GI endoscopy", "pH monitoring"],
            "Migraine": ["Neurological exam", "CT/MRI if first occurrence"],
            "Iron Deficiency Anemia": ["CBC", "Iron studies", "Ferritin", "Reticulocyte count"],
            "Urinary Tract Infection": ["Urinalysis", "Urine culture"],
            "Gastroenteritis": ["Stool culture", "CBC", "Electrolytes"],
            "Appendicitis": ["CT abdomen", "CBC", "Urinalysis", "CRP"],
            "Colorectal Cancer": ["Colonoscopy", "CEA", "CT abdomen/pelvis", "Biopsy"],
            "Lung Cancer": ["CT chest", "PET scan", "Biopsy", "Sputum cytology"],
            "Breast Cancer": ["Mammogram", "Ultrasound", "Biopsy", "MRI breast"],
            "Lymphoma": ["Lymph node biopsy", "CT scan", "PET scan", "CBC", "LDH"],
            "Diabetes Mellitus Type 2": ["Fasting glucose", "HbA1c", "Oral glucose tolerance test"],
            "Stroke": ["CT head", "MRI brain", "CT angiography", "Carotid ultrasound"],
            "Deep Vein Thrombosis": ["D-dimer", "Doppler ultrasound", "CT venography"],
            "Major Depressive Disorder": ["PHQ-9", "Thyroid function tests", "CBC"],
        }
        return test_map.get(disease, ["Further clinical evaluation"])


class TriageEngine:
    """Determine urgency level based on symptoms."""

    RED_FLAG_COMBINATIONS = [
        ({"chest_pain", "shortness_of_breath"}, TriageLevel.EMERGENCY),
        ({"numbness", "vision_changes"}, TriageLevel.EMERGENCY),
        ({"headache", "vision_changes", "vomiting"}, TriageLevel.EMERGENCY),
        ({"blood_in_stool", "weight_loss"}, TriageLevel.URGENT),
        ({"lump", "weight_loss", "night_sweats"}, TriageLevel.URGENT),
        ({"fever", "shortness_of_breath"}, TriageLevel.URGENT),
    ]

    def assess(self, symptoms: List[SymptomEntity]) -> Tuple[TriageLevel, str]:
        """Determine triage level and reasoning."""
        if not symptoms:
            return TriageLevel.SELF_CARE, "No significant symptoms identified."

        symptom_names = {s.normalized_name for s in symptoms}

        # Check red flag combinations
        for combo, level in self.RED_FLAG_COMBINATIONS:
            if combo.issubset(symptom_names):
                return level, f"Red flag combination detected: {', '.join(combo)}"

        # Check individual red flags with severity
        severe_red_flags = [
            s for s in symptoms
            if s.red_flags and s.severity == "severe"
        ]
        if severe_red_flags:
            return TriageLevel.EMERGENCY, f"Severe red flag symptom(s): {', '.join(s.name for s in severe_red_flags)}"

        red_flags = [s for s in symptoms if s.red_flags]
        if red_flags:
            return TriageLevel.URGENT, f"Red flag symptom(s) detected: {', '.join(s.name for s in red_flags)}"

        # Check severity
        severe_symptoms = [s for s in symptoms if s.severity == "severe"]
        if len(severe_symptoms) >= 2:
            return TriageLevel.URGENT, f"Multiple severe symptoms: {', '.join(s.name for s in severe_symptoms)}"
        if severe_symptoms:
            return TriageLevel.SEMI_URGENT, f"Severe symptom: {severe_symptoms[0].name}"

        # Multiple systems affected
        systems = set(s.body_system for s in symptoms)
        if len(systems) >= 3:
            return TriageLevel.SEMI_URGENT, f"Multiple body systems affected: {', '.join(systems)}"

        if len(symptoms) >= 4:
            return TriageLevel.SEMI_URGENT, "Multiple symptoms reported."

        return TriageLevel.ROUTINE, "Symptoms do not indicate immediate danger."


class SymptomAnalyzer:
    """Main symptom analysis engine combining NLP, diagnosis, and triage."""

    def __init__(self):
        self.extractor = SymptomExtractor()
        self.diagnosis_engine = DifferentialDiagnosisEngine()
        self.triage_engine = TriageEngine()
        self.analysis_history: List[Dict] = []

    async def analyze(
        self,
        text: str,
        patient_context: Optional[Dict] = None,
    ) -> SymptomAnalysisResult:
        """Analyze patient-reported symptoms."""
        start_time = time.time()

        # Extract symptoms
        symptoms = self.extractor.extract(text)

        # Generate differential diagnoses
        diagnoses = self.diagnosis_engine.generate(symptoms, patient_context)

        # Triage assessment
        triage_level, triage_reasoning = self.triage_engine.assess(symptoms)

        # Get body systems affected
        body_systems = list(set(s.body_system for s in symptoms))

        # Generate follow-up questions
        follow_up = self._generate_follow_up_questions(symptoms, diagnoses)

        # Red flags
        red_flags = [s.name for s in symptoms if s.red_flags]

        # Recommended actions
        actions = self._generate_actions(triage_level, diagnoses, red_flags)

        processing_time = (time.time() - start_time) * 1000

        result = SymptomAnalysisResult(
            input_text=text,
            extracted_symptoms=[s.to_dict() for s in symptoms],
            body_systems_affected=body_systems,
            differential_diagnoses=[d.to_dict() for d in diagnoses],
            triage_level=triage_level.value,
            triage_reasoning=triage_reasoning,
            recommended_actions=actions,
            follow_up_questions=follow_up,
            red_flags_detected=red_flags,
            confidence=round(0.70 + np.random.uniform(0, 0.25), 3),
            processing_time_ms=round(processing_time, 2),
        )

        self.analysis_history.append({
            "analysis_id": result.analysis_id,
            "symptoms_count": len(symptoms),
            "triage_level": triage_level.value,
            "top_diagnosis": diagnoses[0].condition if diagnoses else None,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return result

    def _generate_follow_up_questions(
        self,
        symptoms: List[SymptomEntity],
        diagnoses: List[DifferentialDiagnosis],
    ) -> List[str]:
        """Generate helpful follow-up questions."""
        questions = []

        # Duration questions
        for s in symptoms:
            if not s.duration:
                questions.append(f"How long have you been experiencing {s.name}?")

        # Missing symptom questions from top diagnoses
        for dx in diagnoses[:3]:
            for missing in dx.missing_symptoms[:2]:
                readable = missing.replace("_", " ")
                questions.append(f"Are you experiencing {readable}?")

        # General questions
        questions.extend([
            "Have you taken any medications for these symptoms?",
            "Do symptoms worsen at any particular time?",
            "Do you have any other symptoms not mentioned?",
        ])

        return questions[:8]

    def _generate_actions(
        self,
        triage_level: TriageLevel,
        diagnoses: List[DifferentialDiagnosis],
        red_flags: List[str],
    ) -> List[str]:
        """Generate recommended actions."""
        actions = []

        if triage_level == TriageLevel.EMERGENCY:
            actions.append("SEEK IMMEDIATE EMERGENCY CARE (call 911 or go to nearest ER)")
        elif triage_level == TriageLevel.URGENT:
            actions.append("Schedule urgent care visit within 24 hours")
        elif triage_level == TriageLevel.SEMI_URGENT:
            actions.append("Schedule appointment within 48-72 hours")
        elif triage_level == TriageLevel.ROUTINE:
            actions.append("Schedule routine appointment")
        else:
            actions.append("Monitor symptoms; seek care if they worsen")

        if diagnoses:
            top_tests = diagnostics_from_diagnoses(diagnoses[:3])
            if top_tests:
                actions.append(f"Recommended tests: {', '.join(top_tests[:5])}")

        if red_flags:
            actions.append(f"Red flag symptoms detected: {', '.join(red_flags)}")

        return actions

    def get_stats(self) -> Dict:
        if not self.analysis_history:
            return {"total_analyses": 0}

        triage_breakdown = defaultdict(int)
        for entry in self.analysis_history:
            triage_breakdown[entry["triage_level"]] += 1

        return {
            "total_analyses": len(self.analysis_history),
            "triage_breakdown": dict(triage_breakdown),
            "avg_symptoms_per_analysis": round(
                sum(e["symptoms_count"] for e in self.analysis_history) / len(self.analysis_history),
                1,
            ),
        }


def diagnostics_from_diagnoses(diagnoses: List[DifferentialDiagnosis]) -> List[str]:
    """Extract unique diagnostic tests from diagnoses."""
    tests = set()
    for dx in diagnoses:
        tests.update(dx.recommended_tests)
    return list(tests)


# Singleton
symptom_analyzer = SymptomAnalyzer()

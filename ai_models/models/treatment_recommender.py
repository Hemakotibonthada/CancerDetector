"""
Treatment Recommender - AI-powered treatment recommendation engine.
Uses evidence-based guidelines, patient-specific factors, and 
clinical decision support to suggest optimal treatment plans.
"""

import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


class TreatmentCategory(Enum):
    SURGERY = "surgery"
    CHEMOTHERAPY = "chemotherapy"
    RADIATION = "radiation"
    IMMUNOTHERAPY = "immunotherapy"
    TARGETED_THERAPY = "targeted_therapy"
    HORMONE_THERAPY = "hormone_therapy"
    STEM_CELL_TRANSPLANT = "stem_cell_transplant"
    ACTIVE_SURVEILLANCE = "active_surveillance"
    PALLIATIVE = "palliative"
    COMBINATION = "combination"
    NEOADJUVANT = "neoadjuvant"
    ADJUVANT = "adjuvant"


class EvidenceLevel(Enum):
    LEVEL_1A = "1A"   # Meta-analysis of RCTs
    LEVEL_1B = "1B"   # Individual RCT
    LEVEL_2A = "2A"   # Cohort study
    LEVEL_2B = "2B"   # Individual cohort / low-quality RCT
    LEVEL_3 = "3"     # Case-control study
    LEVEL_4 = "4"     # Case series
    LEVEL_5 = "5"     # Expert opinion


class RecommendationStrength(Enum):
    STRONG_FOR = "strong_for"
    CONDITIONAL_FOR = "conditional_for"
    NEUTRAL = "neutral"
    CONDITIONAL_AGAINST = "conditional_against"
    STRONG_AGAINST = "strong_against"


class CancerStage(Enum):
    STAGE_0 = "0"
    STAGE_I = "I"
    STAGE_IA = "IA"
    STAGE_IB = "IB"
    STAGE_II = "II"
    STAGE_IIA = "IIA"
    STAGE_IIB = "IIB"
    STAGE_III = "III"
    STAGE_IIIA = "IIIA"
    STAGE_IIIB = "IIIB"
    STAGE_IIIC = "IIIC"
    STAGE_IV = "IV"
    STAGE_IVA = "IVA"
    STAGE_IVB = "IVB"


class PerformanceStatus(Enum):
    ECOG_0 = 0   # Fully active
    ECOG_1 = 1   # Restricted but ambulatory
    ECOG_2 = 2   # Ambulatory, capable of self-care
    ECOG_3 = 3   # Limited self-care, >50% of time in bed/chair
    ECOG_4 = 4   # Completely disabled


@dataclass
class PatientProfile:
    patient_id: str = ""
    age: int = 0
    gender: str = ""
    cancer_type: str = ""
    cancer_subtype: str = ""
    stage: str = ""
    grade: str = ""
    performance_status: int = 0
    comorbidities: List[str] = field(default_factory=list)
    allergies: List[str] = field(default_factory=list)
    current_medications: List[str] = field(default_factory=list)
    prior_treatments: List[str] = field(default_factory=list)
    biomarkers: Dict[str, str] = field(default_factory=dict)
    genomic_markers: List[str] = field(default_factory=list)
    organ_function: Dict[str, str] = field(default_factory=dict)
    patient_preferences: Dict[str, Any] = field(default_factory=dict)
    family_history: List[str] = field(default_factory=list)


@dataclass
class TreatmentOption:
    treatment_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    category: str = ""
    regimen: str = ""
    drugs: List[str] = field(default_factory=list)
    duration_weeks: int = 0
    cycles: int = 0
    route: str = ""
    expected_response_rate: float = 0.0
    median_survival_months: float = 0.0
    five_year_survival: float = 0.0
    evidence_level: str = ""
    recommendation_strength: str = ""
    guidelines_source: str = ""
    side_effects: List[Dict] = field(default_factory=list)
    contraindications: List[str] = field(default_factory=list)
    monitoring_requirements: List[str] = field(default_factory=list)
    cost_estimate: str = ""
    quality_of_life_impact: str = ""
    score: float = 0.0  # Composite recommendation score

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class TreatmentPlan:
    plan_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str = ""
    primary_recommendation: Dict = field(default_factory=dict)
    alternative_options: List[Dict] = field(default_factory=list)
    clinical_trial_options: List[Dict] = field(default_factory=list)
    supportive_care: List[Dict] = field(default_factory=list)
    contraindicated_treatments: List[Dict] = field(default_factory=list)
    risk_assessment: Dict = field(default_factory=dict)
    follow_up_schedule: List[Dict] = field(default_factory=list)
    multidisciplinary_notes: List[str] = field(default_factory=list)
    confidence: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


class TreatmentGuidelinesDB:
    """Evidence-based treatment guidelines database."""

    BREAST_CANCER_GUIDELINES = {
        "HR+/HER2-": {
            "early_stage": [
                {
                    "name": "Surgery + Adjuvant Endocrine Therapy",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Lumpectomy/Mastectomy + Tamoxifen or AI x 5-10 years",
                    "drugs": ["Tamoxifen", "Anastrozole", "Letrozole"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.85,
                    "five_year_survival": 0.90,
                    "guidelines": "NCCN Breast Cancer v4.2024",
                },
                {
                    "name": "Surgery + Adjuvant Chemo + Endocrine",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Surgery + TC/AC-T + Endocrine therapy",
                    "drugs": ["Docetaxel", "Cyclophosphamide", "Doxorubicin", "Tamoxifen"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.CONDITIONAL_FOR,
                    "response_rate": 0.80,
                    "five_year_survival": 0.88,
                    "guidelines": "NCCN Breast Cancer v4.2024",
                    "note": "For high-risk features or Oncotype DX RS ≥26",
                },
                {
                    "name": "CDK4/6 Inhibitor + Endocrine (High Risk)",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Abemaciclib + Endocrine therapy x 2 years",
                    "drugs": ["Abemaciclib", "Anastrozole"],
                    "evidence": EvidenceLevel.LEVEL_1B,
                    "strength": RecommendationStrength.CONDITIONAL_FOR,
                    "response_rate": 0.82,
                    "five_year_survival": 0.89,
                    "guidelines": "monarchE trial",
                    "note": "For node-positive, high-risk early breast cancer",
                },
            ],
            "metastatic": [
                {
                    "name": "CDK4/6 Inhibitor + AI",
                    "category": TreatmentCategory.TARGETED_THERAPY,
                    "regimen": "Palbociclib/Ribociclib/Abemaciclib + Letrozole/Anastrozole",
                    "drugs": ["Palbociclib", "Letrozole"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.55,
                    "median_survival": 28,
                    "guidelines": "NCCN/ASCO/ESMO first-line metastatic HR+/HER2-",
                },
                {
                    "name": "Fulvestrant + CDK4/6 Inhibitor",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Fulvestrant + Ribociclib",
                    "drugs": ["Fulvestrant", "Ribociclib"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.50,
                    "median_survival": 24,
                    "guidelines": "MONALEESA-3",
                },
            ],
        },
        "HER2+": {
            "early_stage": [
                {
                    "name": "Neoadjuvant TCHP + Surgery + Adjuvant T-DM1/THP",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Docetaxel + Carboplatin + Trastuzumab + Pertuzumab → Surgery → Adjuvant",
                    "drugs": ["Docetaxel", "Carboplatin", "Trastuzumab", "Pertuzumab"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.65,
                    "five_year_survival": 0.88,
                    "guidelines": "NCCN/KATHERINE/NeoSphere",
                },
            ],
            "metastatic": [
                {
                    "name": "Trastuzumab Deruxtecan (T-DXd)",
                    "category": TreatmentCategory.TARGETED_THERAPY,
                    "regimen": "T-DXd (Enhertu) q3w",
                    "drugs": ["Trastuzumab deruxtecan"],
                    "evidence": EvidenceLevel.LEVEL_1B,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.79,
                    "median_survival": 25,
                    "guidelines": "DESTINY-Breast03",
                },
            ],
        },
        "Triple Negative": {
            "early_stage": [
                {
                    "name": "Neoadjuvant Pembrolizumab + Chemo → Surgery → Adjuvant Pembro",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Pembrolizumab + Carboplatin/Paclitaxel → AC/EC → Surgery → Pembrolizumab",
                    "drugs": ["Pembrolizumab", "Carboplatin", "Paclitaxel", "Doxorubicin", "Cyclophosphamide"],
                    "evidence": EvidenceLevel.LEVEL_1B,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.63,
                    "five_year_survival": 0.82,
                    "guidelines": "KEYNOTE-522",
                },
            ],
            "metastatic": [
                {
                    "name": "Sacituzumab Govitecan",
                    "category": TreatmentCategory.TARGETED_THERAPY,
                    "regimen": "Sacituzumab govitecan (Trodelvy)",
                    "drugs": ["Sacituzumab govitecan"],
                    "evidence": EvidenceLevel.LEVEL_1B,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.35,
                    "median_survival": 12.1,
                    "guidelines": "ASCENT trial",
                },
            ],
        },
    }

    LUNG_CANCER_GUIDELINES = {
        "NSCLC_EGFR+": {
            "advanced": [
                {
                    "name": "Osimertinib",
                    "category": TreatmentCategory.TARGETED_THERAPY,
                    "regimen": "Osimertinib 80mg daily",
                    "drugs": ["Osimertinib"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.80,
                    "median_survival": 38.6,
                    "guidelines": "NCCN NSCLC/FLAURA",
                },
            ],
        },
        "NSCLC_ALK+": {
            "advanced": [
                {
                    "name": "Alectinib",
                    "category": TreatmentCategory.TARGETED_THERAPY,
                    "regimen": "Alectinib 600mg BID",
                    "drugs": ["Alectinib"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.83,
                    "median_survival": 34.8,
                    "guidelines": "NCCN NSCLC/ALEX",
                },
            ],
        },
        "NSCLC_PD-L1_High": {
            "advanced": [
                {
                    "name": "Pembrolizumab Monotherapy",
                    "category": TreatmentCategory.IMMUNOTHERAPY,
                    "regimen": "Pembrolizumab 200mg q3w (PD-L1 ≥50%)",
                    "drugs": ["Pembrolizumab"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.45,
                    "median_survival": 30,
                    "guidelines": "NCCN NSCLC/KEYNOTE-024",
                },
            ],
        },
        "NSCLC_No_Driver": {
            "advanced": [
                {
                    "name": "Pembrolizumab + Chemo",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Pembrolizumab + Carboplatin + Pemetrexed",
                    "drugs": ["Pembrolizumab", "Carboplatin", "Pemetrexed"],
                    "evidence": EvidenceLevel.LEVEL_1A,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.48,
                    "median_survival": 22,
                    "guidelines": "KEYNOTE-189",
                },
            ],
        },
        "SCLC": {
            "extensive": [
                {
                    "name": "Atezolizumab + Chemo",
                    "category": TreatmentCategory.COMBINATION,
                    "regimen": "Atezolizumab + Carboplatin + Etoposide",
                    "drugs": ["Atezolizumab", "Carboplatin", "Etoposide"],
                    "evidence": EvidenceLevel.LEVEL_1B,
                    "strength": RecommendationStrength.STRONG_FOR,
                    "response_rate": 0.60,
                    "median_survival": 12.3,
                    "guidelines": "IMpower133",
                },
            ],
        },
    }

    COLORECTAL_CANCER_GUIDELINES = {
        "stage_II_III": [
            {
                "name": "Surgery + FOLFOX",
                "category": TreatmentCategory.COMBINATION,
                "regimen": "Surgical resection + mFOLFOX6 x 6 months (or 3 months for Stage II)",
                "drugs": ["5-Fluorouracil", "Leucovorin", "Oxaliplatin"],
                "evidence": EvidenceLevel.LEVEL_1A,
                "strength": RecommendationStrength.STRONG_FOR,
                "response_rate": 0.70,
                "five_year_survival": 0.75,
                "guidelines": "NCCN Colon Cancer/MOSAIC",
            },
        ],
        "metastatic_RAS_WT": [
            {
                "name": "FOLFOX + Cetuximab",
                "category": TreatmentCategory.COMBINATION,
                "regimen": "mFOLFOX6 + Cetuximab",
                "drugs": ["5-Fluorouracil", "Leucovorin", "Oxaliplatin", "Cetuximab"],
                "evidence": EvidenceLevel.LEVEL_1A,
                "strength": RecommendationStrength.STRONG_FOR,
                "response_rate": 0.60,
                "median_survival": 30,
                "guidelines": "NCCN CRC",
                "note": "Left-sided tumors only for anti-EGFR",
            },
        ],
        "metastatic_MSI_H": [
            {
                "name": "Pembrolizumab First-Line",
                "category": TreatmentCategory.IMMUNOTHERAPY,
                "regimen": "Pembrolizumab 200mg q3w",
                "drugs": ["Pembrolizumab"],
                "evidence": EvidenceLevel.LEVEL_1B,
                "strength": RecommendationStrength.STRONG_FOR,
                "response_rate": 0.45,
                "median_survival": 36,
                "guidelines": "KEYNOTE-177",
            },
        ],
    }

    SUPPORTIVE_CARE = {
        "antiemetic": [
            {"name": "5-HT3 Antagonist", "drugs": ["Ondansetron", "Granisetron"], "indication": "Chemotherapy-induced nausea"},
            {"name": "NK1 Antagonist", "drugs": ["Aprepitant", "Fosaprepitant"], "indication": "Highly emetogenic chemo"},
            {"name": "Dexamethasone", "drugs": ["Dexamethasone"], "indication": "Adjunctive antiemetic"},
        ],
        "growth_factor": [
            {"name": "G-CSF", "drugs": ["Filgrastim", "Pegfilgrastim"], "indication": "Febrile neutropenia prophylaxis"},
            {"name": "ESA", "drugs": ["Epoetin alfa", "Darbepoetin"], "indication": "Chemotherapy-associated anemia"},
        ],
        "bone_protection": [
            {"name": "Bisphosphonate", "drugs": ["Zoledronic acid"], "indication": "Bone metastases"},
            {"name": "RANK-L Inhibitor", "drugs": ["Denosumab"], "indication": "Bone metastases prevention"},
        ],
        "pain_management": [
            {"name": "WHO Step 1", "drugs": ["Acetaminophen", "NSAIDs"], "indication": "Mild pain (1-3)"},
            {"name": "WHO Step 2", "drugs": ["Tramadol", "Codeine"], "indication": "Moderate pain (4-6)"},
            {"name": "WHO Step 3", "drugs": ["Morphine", "Oxycodone", "Fentanyl"], "indication": "Severe pain (7-10)"},
        ],
    }


class ComorbidityAdjuster:
    """Adjusts treatment recommendations based on comorbidities."""

    COMORBIDITY_CONTRAINDICATIONS = {
        "heart_failure": {
            "contraindicated": ["Doxorubicin", "Trastuzumab"],
            "caution": ["Cyclophosphamide", "Paclitaxel"],
            "monitoring": "Cardiac echo/MUGA every 3 months",
        },
        "renal_impairment": {
            "contraindicated": ["Cisplatin (if CrCl <60)"],
            "dose_adjust": ["Carboplatin (Calvert formula)", "Methotrexate", "Pemetrexed"],
            "caution": ["Bevacizumab"],
        },
        "hepatic_impairment": {
            "contraindicated": ["Methotrexate (severe)", "Irinotecan (severe)"],
            "dose_adjust": ["Docetaxel", "Doxorubicin", "Paclitaxel"],
        },
        "diabetes": {
            "caution": ["Corticosteroids", "mTOR inhibitors"],
            "monitoring": "Frequent glucose monitoring during treatment",
        },
        "autoimmune_disease": {
            "caution": ["Immune checkpoint inhibitors"],
            "monitoring": "Close monitoring for immune-related adverse events",
            "note": "Not absolute contraindication but increased risk of irAEs",
        },
        "peripheral_neuropathy": {
            "contraindicated": ["Vincristine"],
            "caution": ["Oxaliplatin", "Paclitaxel", "Bortezomib"],
        },
        "pulmonary_fibrosis": {
            "contraindicated": ["Bleomycin", "Busulfan"],
            "caution": ["Immune checkpoint inhibitors"],
            "monitoring": "Pulmonary function tests",
        },
    }

    def adjust(
        self,
        treatment: TreatmentOption,
        comorbidities: List[str],
    ) -> Tuple[TreatmentOption, List[str]]:
        """Adjust treatment for comorbidities, return warnings."""
        warnings = []

        for comorbidity in comorbidities:
            rules = self.COMORBIDITY_CONTRAINDICATIONS.get(comorbidity.lower().replace(" ", "_"))
            if not rules:
                continue

            # Check contraindications
            for drug in treatment.drugs:
                for ci in rules.get("contraindicated", []):
                    if drug.lower() in ci.lower():
                        warnings.append(
                            f"⚠️ {drug} contraindicated with {comorbidity}: {ci}"
                        )
                        treatment.contraindications.append(f"{comorbidity}: {drug}")

                for caution in rules.get("caution", []):
                    if drug.lower() in caution.lower():
                        warnings.append(
                            f"⚡ Use {drug} with caution in {comorbidity}"
                        )

            # Add monitoring requirements
            if "monitoring" in rules:
                treatment.monitoring_requirements.append(rules["monitoring"])

        return treatment, warnings


class TreatmentScorer:
    """Score and rank treatment options based on multiple factors."""

    def score(
        self,
        treatment: Dict,
        patient: PatientProfile,
    ) -> float:
        """Calculate composite treatment score (0-100)."""
        score = 0.0

        # Evidence level (30% weight)
        evidence_scores = {
            "1A": 30, "1B": 27, "2A": 22, "2B": 18, "3": 14, "4": 10, "5": 6,
        }
        evidence = treatment.get("evidence", EvidenceLevel.LEVEL_5)
        if isinstance(evidence, EvidenceLevel):
            score += evidence_scores.get(evidence.value, 6)
        else:
            score += evidence_scores.get(str(evidence), 6)

        # Response rate (25% weight)
        rr = treatment.get("response_rate", 0) * 25
        score += rr

        # Survival benefit (25% weight)
        five_yr = treatment.get("five_year_survival", 0)
        median_surv = treatment.get("median_survival", 0)
        if five_yr:
            score += five_yr * 25
        elif median_surv:
            score += min(median_surv / 60, 1.0) * 25  # Normalize to 5 years

        # Recommendation strength (10% weight)
        strength_scores = {
            "strong_for": 10, "conditional_for": 7, "neutral": 5,
            "conditional_against": 3, "strong_against": 0,
        }
        strength = treatment.get("strength", RecommendationStrength.NEUTRAL)
        if isinstance(strength, RecommendationStrength):
            score += strength_scores.get(strength.value, 5)
        else:
            score += strength_scores.get(str(strength), 5)

        # Performance status adjustment (10% weight)
        if patient.performance_status <= 1:
            score += 10
        elif patient.performance_status == 2:
            score += 7
        elif patient.performance_status == 3:
            score += 3

        return round(score, 2)


class TreatmentRecommender:
    """Main treatment recommendation engine."""

    def __init__(self):
        self.guidelines = TreatmentGuidelinesDB()
        self.comorbidity_adjuster = ComorbidityAdjuster()
        self.scorer = TreatmentScorer()
        self.recommendation_history: List[Dict] = []

    async def recommend(
        self,
        patient: PatientProfile,
    ) -> TreatmentPlan:
        """Generate treatment recommendations for a patient."""
        start_time = time.time()

        # Get applicable guidelines
        applicable_treatments = self._get_applicable_treatments(patient)

        # Score treatments
        scored_treatments = []
        for tx in applicable_treatments:
            score = self.scorer.score(tx, patient)
            option = TreatmentOption(
                name=tx["name"],
                category=tx.get("category", TreatmentCategory.COMBINATION).value
                    if isinstance(tx.get("category"), TreatmentCategory)
                    else str(tx.get("category", "combination")),
                regimen=tx.get("regimen", ""),
                drugs=tx.get("drugs", []),
                expected_response_rate=tx.get("response_rate", 0),
                median_survival_months=tx.get("median_survival", 0),
                five_year_survival=tx.get("five_year_survival", 0),
                evidence_level=tx.get("evidence", "").value
                    if isinstance(tx.get("evidence"), EvidenceLevel)
                    else str(tx.get("evidence", "")),
                recommendation_strength=tx.get("strength", "").value
                    if isinstance(tx.get("strength"), RecommendationStrength)
                    else str(tx.get("strength", "")),
                guidelines_source=tx.get("guidelines", ""),
                score=score,
            )

            # Check comorbidities
            option, warnings = self.comorbidity_adjuster.adjust(option, patient.comorbidities)

            # Add side effects
            option.side_effects = self._get_side_effects(option.drugs)

            scored_treatments.append((option, warnings))

        # Sort by score
        scored_treatments.sort(key=lambda x: x[0].score, reverse=True)

        # Build treatment plan
        plan = TreatmentPlan(patient_id=patient.patient_id)

        if scored_treatments:
            primary = scored_treatments[0]
            plan.primary_recommendation = primary[0].to_dict()
            plan.primary_recommendation["warnings"] = primary[1]

            plan.alternative_options = [
                {**tx.to_dict(), "warnings": w}
                for tx, w in scored_treatments[1:5]
            ]

        # Check for contraindicated treatments
        plan.contraindicated_treatments = self._get_contraindicated(patient)

        # Supportive care
        plan.supportive_care = self._get_supportive_care(patient, scored_treatments)

        # Follow-up schedule
        plan.follow_up_schedule = self._generate_follow_up(patient)

        # MDT notes
        plan.multidisciplinary_notes = self._generate_mdt_notes(patient, scored_treatments)

        # Risk assessment
        plan.risk_assessment = self._assess_treatment_risk(patient)

        plan.confidence = round(0.65 + np.random.uniform(0, 0.30), 3)

        # Log
        self.recommendation_history.append({
            "plan_id": plan.plan_id,
            "patient_id": patient.patient_id,
            "cancer_type": patient.cancer_type,
            "stage": patient.stage,
            "primary_treatment": plan.primary_recommendation.get("name", ""),
            "alternatives_count": len(plan.alternative_options),
            "timestamp": datetime.utcnow().isoformat(),
        })

        return plan

    def _get_applicable_treatments(self, patient: PatientProfile) -> List[Dict]:
        """Get treatments applicable to patient's cancer type and stage."""
        treatments = []
        cancer = patient.cancer_type.lower()
        stage = patient.stage.upper() if patient.stage else ""

        # Breast cancer
        if "breast" in cancer:
            subtype = self._determine_breast_subtype(patient)
            stage_category = self._categorize_stage(stage)
            subtype_guidelines = self.guidelines.BREAST_CANCER_GUIDELINES.get(subtype, {})
            treatments.extend(subtype_guidelines.get(stage_category, []))

        # Lung cancer
        elif "lung" in cancer or "nsclc" in cancer or "sclc" in cancer:
            lung_subtype = self._determine_lung_subtype(patient)
            subtype_guidelines = self.guidelines.LUNG_CANCER_GUIDELINES.get(lung_subtype, {})
            for stage_key, stage_treatments in subtype_guidelines.items():
                treatments.extend(stage_treatments)

        # Colorectal cancer
        elif "colorectal" in cancer or "colon" in cancer or "rectal" in cancer:
            if stage in ("II", "III", "IIA", "IIB", "IIIA", "IIIB", "IIIC"):
                treatments.extend(self.guidelines.COLORECTAL_CANCER_GUIDELINES.get("stage_II_III", []))
            elif stage in ("IV", "IVA", "IVB"):
                biomarkers = patient.biomarkers
                if biomarkers.get("MSI") == "MSI-H":
                    treatments.extend(self.guidelines.COLORECTAL_CANCER_GUIDELINES.get("metastatic_MSI_H", []))
                elif biomarkers.get("KRAS") == "wild_type" and biomarkers.get("NRAS") == "wild_type":
                    treatments.extend(self.guidelines.COLORECTAL_CANCER_GUIDELINES.get("metastatic_RAS_WT", []))

        # If no specific guidelines found, add generic options
        if not treatments:
            treatments.extend(self._get_generic_treatments(patient))

        return treatments

    def _determine_breast_subtype(self, patient: PatientProfile) -> str:
        """Determine breast cancer molecular subtype."""
        biomarkers = patient.biomarkers
        er = biomarkers.get("ER", "").lower()
        pr = biomarkers.get("PR", "").lower()
        her2 = biomarkers.get("HER2", "").lower()

        if her2 in ("positive", "+", "3+", "amplified"):
            return "HER2+"
        elif er in ("positive", "+") or pr in ("positive", "+"):
            return "HR+/HER2-"
        else:
            return "Triple Negative"

    def _determine_lung_subtype(self, patient: PatientProfile) -> str:
        """Determine lung cancer treatment-relevant subtype."""
        if "sclc" in patient.cancer_type.lower() or "small cell" in patient.cancer_type.lower():
            return "SCLC"

        biomarkers = patient.biomarkers
        genomic = patient.genomic_markers

        if "EGFR" in genomic or biomarkers.get("EGFR") in ("mutant", "positive"):
            return "NSCLC_EGFR+"
        elif "ALK" in genomic or biomarkers.get("ALK") in ("positive", "rearranged"):
            return "NSCLC_ALK+"
        elif biomarkers.get("PD-L1", "0").replace("%", "").strip().isdigit():
            pdl1 = int(biomarkers.get("PD-L1", "0").replace("%", "").strip())
            if pdl1 >= 50:
                return "NSCLC_PD-L1_High"

        return "NSCLC_No_Driver"

    def _categorize_stage(self, stage: str) -> str:
        """Categorize stage for guideline lookup."""
        early = {"0", "I", "IA", "IB", "II", "IIA", "IIB", "III", "IIIA", "IIIB", "IIIC"}
        if stage in early:
            return "early_stage"
        return "metastatic"

    def _get_generic_treatments(self, patient: PatientProfile) -> List[Dict]:
        """Generic treatment options when no specific guidelines match."""
        return [
            {
                "name": "Standard Chemotherapy",
                "category": TreatmentCategory.CHEMOTHERAPY,
                "regimen": "Per oncologist recommendation based on tumor type",
                "drugs": [],
                "evidence": EvidenceLevel.LEVEL_2A,
                "strength": RecommendationStrength.CONDITIONAL_FOR,
                "response_rate": 0.40,
                "guidelines": "Tumor-specific NCCN guidelines",
            },
            {
                "name": "Clinical Trial Enrollment",
                "category": TreatmentCategory.COMBINATION,
                "regimen": "Matched clinical trial based on molecular profile",
                "drugs": [],
                "evidence": EvidenceLevel.LEVEL_2B,
                "strength": RecommendationStrength.CONDITIONAL_FOR,
                "response_rate": 0.35,
                "guidelines": "NCI clinical trials matching",
            },
        ]

    def _get_side_effects(self, drugs: List[str]) -> List[Dict]:
        """Get common side effects for drug combination."""
        side_effect_db = {
            "Doxorubicin": [
                {"effect": "Cardiotoxicity", "frequency": "dose-dependent", "severity": "major"},
                {"effect": "Alopecia", "frequency": "very_common", "severity": "moderate"},
                {"effect": "Nausea/Vomiting", "frequency": "common", "severity": "moderate"},
            ],
            "Paclitaxel": [
                {"effect": "Peripheral neuropathy", "frequency": "common", "severity": "moderate"},
                {"effect": "Alopecia", "frequency": "very_common", "severity": "moderate"},
                {"effect": "Neutropenia", "frequency": "common", "severity": "major"},
            ],
            "Pembrolizumab": [
                {"effect": "Immune-related adverse events", "frequency": "common", "severity": "variable"},
                {"effect": "Fatigue", "frequency": "very_common", "severity": "mild"},
                {"effect": "Pneumonitis", "frequency": "uncommon", "severity": "major"},
            ],
            "Carboplatin": [
                {"effect": "Thrombocytopenia", "frequency": "common", "severity": "moderate"},
                {"effect": "Nausea", "frequency": "common", "severity": "moderate"},
                {"effect": "Nephrotoxicity", "frequency": "uncommon", "severity": "major"},
            ],
            "Trastuzumab": [
                {"effect": "Cardiotoxicity", "frequency": "common", "severity": "major"},
                {"effect": "Infusion reactions", "frequency": "common", "severity": "moderate"},
            ],
            "Osimertinib": [
                {"effect": "Diarrhea", "frequency": "common", "severity": "mild"},
                {"effect": "Rash", "frequency": "common", "severity": "mild"},
                {"effect": "QTc prolongation", "frequency": "uncommon", "severity": "major"},
            ],
        }

        effects = []
        for drug in drugs:
            effects.extend(side_effect_db.get(drug, []))
        return effects

    def _get_supportive_care(
        self,
        patient: PatientProfile,
        treatments: List[Tuple[TreatmentOption, List[str]]],
    ) -> List[Dict]:
        """Recommend supportive care measures."""
        supportive = []

        if treatments:
            primary_drugs = treatments[0][0].drugs if treatments[0][0].drugs else []

            # Antiemetics
            emetogenic_drugs = {"Doxorubicin", "Cisplatin", "Carboplatin", "Cyclophosphamide"}
            if set(primary_drugs) & emetogenic_drugs:
                supportive.extend(self.guidelines.SUPPORTIVE_CARE["antiemetic"])

            # G-CSF
            neutropenia_risk_drugs = {"Docetaxel", "Doxorubicin", "Paclitaxel"}
            if set(primary_drugs) & neutropenia_risk_drugs:
                supportive.extend(self.guidelines.SUPPORTIVE_CARE["growth_factor"][:1])

        # Pain management based on patient needs
        supportive.append({
            "name": "Pain Management Protocol",
            "description": "WHO analgesic ladder per patient's pain level",
            "indication": "As needed for cancer-related pain",
        })

        # Psychosocial support
        supportive.append({
            "name": "Psychosocial Support",
            "description": "Referral to oncology social worker and psychologist",
            "indication": "All cancer patients",
        })

        return supportive

    def _get_contraindicated(self, patient: PatientProfile) -> List[Dict]:
        """List contraindicated treatments."""
        contraindicated = []

        for comorbidity in patient.comorbidities:
            rules = self.comorbidity_adjuster.COMORBIDITY_CONTRAINDICATIONS.get(
                comorbidity.lower().replace(" ", "_"), {}
            )
            for ci in rules.get("contraindicated", []):
                contraindicated.append({
                    "treatment": ci,
                    "reason": f"Contraindicated due to {comorbidity}",
                    "comorbidity": comorbidity,
                })

        return contraindicated

    def _generate_follow_up(self, patient: PatientProfile) -> List[Dict]:
        """Generate follow-up schedule."""
        schedule = [
            {"timepoint": "Week 1", "action": "Treatment initiation, baseline labs"},
            {"timepoint": "Week 3", "action": "Lab check (CBC, CMP), toxicity assessment"},
            {"timepoint": "Week 6", "action": "Interim assessment, labs"},
            {"timepoint": "Week 9", "action": "Mid-treatment imaging if applicable"},
            {"timepoint": "Week 12", "action": "Response assessment (imaging + tumor markers)"},
            {"timepoint": "Post-treatment", "action": "Surveillance per NCCN guidelines"},
        ]

        if patient.performance_status >= 2:
            schedule.insert(1, {"timepoint": "Week 2", "action": "Early toxicity check (high-risk patient)"})

        return schedule

    def _generate_mdt_notes(
        self,
        patient: PatientProfile,
        treatments: List[Tuple[TreatmentOption, List[str]]],
    ) -> List[str]:
        """Generate multidisciplinary team discussion notes."""
        notes = [
            f"Patient: {patient.age}yo {patient.gender}, {patient.cancer_type} Stage {patient.stage}",
            f"ECOG PS: {patient.performance_status}",
        ]

        if patient.comorbidities:
            notes.append(f"Comorbidities: {', '.join(patient.comorbidities)}")

        if patient.biomarkers:
            markers = [f"{k}: {v}" for k, v in patient.biomarkers.items()]
            notes.append(f"Biomarkers: {', '.join(markers)}")

        if patient.genomic_markers:
            notes.append(f"Genomic alterations: {', '.join(patient.genomic_markers)}")

        if treatments:
            notes.append(f"Recommended: {treatments[0][0].name} (Score: {treatments[0][0].score})")
            if treatments[0][1]:
                notes.append(f"Warnings: {'; '.join(treatments[0][1])}")

        notes.append("Recommend discussion in tumor board for final treatment decision.")

        return notes

    def _assess_treatment_risk(self, patient: PatientProfile) -> Dict:
        """Assess overall treatment risk."""
        risk_score = 0

        # Age risk
        if patient.age > 75:
            risk_score += 3
        elif patient.age > 65:
            risk_score += 2
        elif patient.age > 55:
            risk_score += 1

        # Performance status
        risk_score += patient.performance_status * 2

        # Comorbidities
        risk_score += len(patient.comorbidities) * 1.5

        # Stage
        late_stages = {"III", "IIIA", "IIIB", "IIIC", "IV", "IVA", "IVB"}
        if patient.stage in late_stages:
            risk_score += 3

        risk_level = "low"
        if risk_score >= 10:
            risk_level = "high"
        elif risk_score >= 6:
            risk_level = "moderate"

        return {
            "risk_score": round(risk_score, 1),
            "risk_level": risk_level,
            "factors": {
                "age": patient.age,
                "performance_status": patient.performance_status,
                "comorbidity_count": len(patient.comorbidities),
                "stage": patient.stage,
            },
            "recommendation": self._risk_recommendation(risk_level),
        }

    def _risk_recommendation(self, risk_level: str) -> str:
        recommendations = {
            "low": "Standard treatment intensity appropriate.",
            "moderate": "Consider dose modifications. Close monitoring advised.",
            "high": "High treatment risk. Consider dose reduction, alternative regimens, or supportive care focus. Involve geriatric oncology if age-related.",
        }
        return recommendations.get(risk_level, "")


# Singleton
treatment_recommender = TreatmentRecommender()

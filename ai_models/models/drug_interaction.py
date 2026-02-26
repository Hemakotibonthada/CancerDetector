"""
Drug Interaction Prediction Engine - Detects and predicts drug-drug interactions,
contraindications, and adverse effects using pharmacological knowledge graphs
and machine learning models.
"""

import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict
from itertools import combinations

import numpy as np

logger = logging.getLogger(__name__)


class InteractionSeverity(Enum):
    CONTRAINDICATED = "contraindicated"      # Must not be combined
    MAJOR = "major"                          # Life-threatening / significant harm
    MODERATE = "moderate"                    # May require monitoring
    MINOR = "minor"                          # Minimal clinical significance
    NONE = "none"                            # No known interaction


class InteractionMechanism(Enum):
    PHARMACOKINETIC = "pharmacokinetic"      # Absorption, distribution, metabolism, excretion
    PHARMACODYNAMIC = "pharmacodynamic"      # Effect at receptor/organ level
    PHARMACEUTICAL = "pharmaceutical"        # Physical/chemical incompatibility
    UNKNOWN = "unknown"


class InteractionType(Enum):
    DRUG_DRUG = "drug_drug"
    DRUG_FOOD = "drug_food"
    DRUG_SUPPLEMENT = "drug_supplement"
    DRUG_CONDITION = "drug_condition"
    DRUG_LAB = "drug_lab"
    DRUG_ALLERGY = "drug_allergy"


class DrugCategory(Enum):
    ANTICOAGULANT = "anticoagulant"
    ANTIPLATELET = "antiplatelet"
    NSAID = "nsaid"
    ACE_INHIBITOR = "ace_inhibitor"
    ARB = "arb"
    BETA_BLOCKER = "beta_blocker"
    CALCIUM_CHANNEL_BLOCKER = "calcium_channel_blocker"
    STATIN = "statin"
    ANTIDEPRESSANT_SSRI = "antidepressant_ssri"
    ANTIDEPRESSANT_SNRI = "antidepressant_snri"
    ANTIDEPRESSANT_TCA = "antidepressant_tca"
    BENZODIAZEPINE = "benzodiazepine"
    OPIOID = "opioid"
    ANTIBIOTIC = "antibiotic"
    ANTIFUNGAL = "antifungal"
    ANTIVIRAL = "antiviral"
    PROTON_PUMP_INHIBITOR = "proton_pump_inhibitor"
    DIURETIC = "diuretic"
    INSULIN = "insulin"
    ORAL_HYPOGLYCEMIC = "oral_hypoglycemic"
    CORTICOSTEROID = "corticosteroid"
    ANTICONVULSANT = "anticonvulsant"
    ANTIPSYCHOTIC = "antipsychotic"
    IMMUNOSUPPRESSANT = "immunosuppressant"
    CHEMOTHERAPY = "chemotherapy"
    THYROID = "thyroid"
    OTHER = "other"


@dataclass
class Drug:
    name: str
    generic_name: str
    brand_names: List[str] = field(default_factory=list)
    category: str = "other"
    rxnorm_code: str = ""
    atc_code: str = ""
    dosage: str = ""
    route: str = "oral"
    half_life_hours: float = 0
    cyp_enzymes: List[str] = field(default_factory=list)  # CYP450 enzymes involved
    pregnancy_category: str = ""
    renal_adjustment: bool = False
    hepatic_adjustment: bool = False
    narrow_therapeutic_index: bool = False
    active: bool = True


@dataclass
class DrugInteraction:
    interaction_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    drug_a: str = ""
    drug_b: str = ""
    severity: str = "none"
    interaction_type: str = "drug_drug"
    mechanism: str = "unknown"
    description: str = ""
    clinical_effect: str = ""
    management: str = ""
    evidence_level: str = "moderate"  # strong, moderate, weak, theoretical
    onset: str = ""  # immediate, delayed, variable
    documentation: str = ""  # established, probable, suspected, possible
    references: List[str] = field(default_factory=list)
    confidence: float = 0.0

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class InteractionCheckResult:
    check_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    medications: List[str] = field(default_factory=list)
    total_interactions: int = 0
    contraindicated: List[Dict] = field(default_factory=list)
    major: List[Dict] = field(default_factory=list)
    moderate: List[Dict] = field(default_factory=list)
    minor: List[Dict] = field(default_factory=list)
    food_interactions: List[Dict] = field(default_factory=list)
    condition_warnings: List[Dict] = field(default_factory=list)
    allergy_warnings: List[Dict] = field(default_factory=list)
    therapeutic_duplications: List[Dict] = field(default_factory=list)
    dosage_warnings: List[Dict] = field(default_factory=list)
    overall_risk_level: str = "low"
    recommendations: List[str] = field(default_factory=list)
    processing_time_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


class PharmacologicalKnowledgeBase:
    """Comprehensive drug interaction knowledge base."""

    # Drug database
    DRUGS: Dict[str, Drug] = {
        "warfarin": Drug("Warfarin", "warfarin", ["Coumadin", "Jantoven"], "anticoagulant", "11289", "B01AA03",
                         half_life_hours=40, cyp_enzymes=["CYP2C9", "CYP3A4"], pregnancy_category="X",
                         narrow_therapeutic_index=True),
        "aspirin": Drug("Aspirin", "aspirin", ["Bayer", "Ecotrin"], "antiplatelet", "1191", "B01AC06",
                        half_life_hours=4),
        "ibuprofen": Drug("Ibuprofen", "ibuprofen", ["Advil", "Motrin"], "nsaid", "5640", "M01AE01",
                          half_life_hours=2),
        "naproxen": Drug("Naproxen", "naproxen", ["Aleve", "Naprosyn"], "nsaid", "7258", "M01AE02",
                         half_life_hours=14),
        "lisinopril": Drug("Lisinopril", "lisinopril", ["Prinivil", "Zestril"], "ace_inhibitor", "29046", "C09AA03",
                           half_life_hours=12, renal_adjustment=True),
        "losartan": Drug("Losartan", "losartan", ["Cozaar"], "arb", "52175", "C09CA01",
                         half_life_hours=6, cyp_enzymes=["CYP2C9", "CYP3A4"]),
        "metoprolol": Drug("Metoprolol", "metoprolol", ["Lopressor", "Toprol-XL"], "beta_blocker", "6918", "C07AB02",
                           half_life_hours=5, cyp_enzymes=["CYP2D6"]),
        "amlodipine": Drug("Amlodipine", "amlodipine", ["Norvasc"], "calcium_channel_blocker", "17767", "C08CA01",
                           half_life_hours=35, cyp_enzymes=["CYP3A4"]),
        "atorvastatin": Drug("Atorvastatin", "atorvastatin", ["Lipitor"], "statin", "83367", "C10AA05",
                             half_life_hours=14, cyp_enzymes=["CYP3A4"], hepatic_adjustment=True),
        "simvastatin": Drug("Simvastatin", "simvastatin", ["Zocor"], "statin", "36567", "C10AA01",
                            half_life_hours=3, cyp_enzymes=["CYP3A4"], hepatic_adjustment=True),
        "sertraline": Drug("Sertraline", "sertraline", ["Zoloft"], "antidepressant_ssri", "36437", "N06AB06",
                           half_life_hours=26, cyp_enzymes=["CYP2B6", "CYP2C19", "CYP2D6"]),
        "fluoxetine": Drug("Fluoxetine", "fluoxetine", ["Prozac"], "antidepressant_ssri", "4493", "N06AB03",
                           half_life_hours=72, cyp_enzymes=["CYP2D6", "CYP2C9"]),
        "citalopram": Drug("Citalopram", "citalopram", ["Celexa"], "antidepressant_ssri", "2556", "N06AB04",
                           half_life_hours=35, cyp_enzymes=["CYP2C19", "CYP3A4"]),
        "venlafaxine": Drug("Venlafaxine", "venlafaxine", ["Effexor"], "antidepressant_snri", "39786", "N06AX16",
                            half_life_hours=5, cyp_enzymes=["CYP2D6", "CYP3A4"]),
        "amitriptyline": Drug("Amitriptyline", "amitriptyline", ["Elavil"], "antidepressant_tca", "704", "N06AA09",
                              half_life_hours=25, cyp_enzymes=["CYP2D6", "CYP2C19"]),
        "diazepam": Drug("Diazepam", "diazepam", ["Valium"], "benzodiazepine", "3322", "N05BA01",
                         half_life_hours=40, cyp_enzymes=["CYP2C19", "CYP3A4"]),
        "alprazolam": Drug("Alprazolam", "alprazolam", ["Xanax"], "benzodiazepine", "596", "N05BA12",
                           half_life_hours=11, cyp_enzymes=["CYP3A4"]),
        "oxycodone": Drug("Oxycodone", "oxycodone", ["OxyContin", "Percocet"], "opioid", "7804", "N02AA05",
                          half_life_hours=4.5, cyp_enzymes=["CYP3A4", "CYP2D6"]),
        "tramadol": Drug("Tramadol", "tramadol", ["Ultram"], "opioid", "10689", "N02AX02",
                         half_life_hours=6, cyp_enzymes=["CYP2D6", "CYP3A4"]),
        "metformin": Drug("Metformin", "metformin", ["Glucophage"], "oral_hypoglycemic", "6809", "A10BA02",
                          half_life_hours=6, renal_adjustment=True),
        "omeprazole": Drug("Omeprazole", "omeprazole", ["Prilosec"], "proton_pump_inhibitor", "7646", "A02BC01",
                           half_life_hours=1, cyp_enzymes=["CYP2C19", "CYP3A4"]),
        "ciprofloxacin": Drug("Ciprofloxacin", "ciprofloxacin", ["Cipro"], "antibiotic", "2551", "J01MA02",
                              half_life_hours=4, cyp_enzymes=["CYP1A2"]),
        "amoxicillin": Drug("Amoxicillin", "amoxicillin", ["Amoxil"], "antibiotic", "723", "J01CA04",
                            half_life_hours=1),
        "azithromycin": Drug("Azithromycin", "azithromycin", ["Zithromax", "Z-Pack"], "antibiotic", "18631", "J01FA10",
                             half_life_hours=68),
        "ketoconazole": Drug("Ketoconazole", "ketoconazole", ["Nizoral"], "antifungal", "6135", "J02AB02",
                             half_life_hours=8, cyp_enzymes=["CYP3A4"]),
        "prednisone": Drug("Prednisone", "prednisone", ["Deltasone"], "corticosteroid", "8640", "H02AB07",
                           half_life_hours=3),
        "levothyroxine": Drug("Levothyroxine", "levothyroxine", ["Synthroid", "Levoxyl"], "thyroid", "10582", "H03AA01",
                              half_life_hours=168, narrow_therapeutic_index=True),
        "gabapentin": Drug("Gabapentin", "gabapentin", ["Neurontin"], "anticonvulsant", "25480", "N03AX12",
                           half_life_hours=6, renal_adjustment=True),
        "phenytoin": Drug("Phenytoin", "phenytoin", ["Dilantin"], "anticonvulsant", "8183", "N03AB02",
                          half_life_hours=22, cyp_enzymes=["CYP2C9", "CYP2C19"],
                          narrow_therapeutic_index=True),
        "lithium": Drug("Lithium", "lithium", ["Lithobid"], "other", "6448", "N05AN01",
                        half_life_hours=24, narrow_therapeutic_index=True, renal_adjustment=True),
    }

    # Known drug interactions
    KNOWN_INTERACTIONS: List[Dict] = [
        {
            "drug_a": "warfarin", "drug_b": "aspirin",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "Increased risk of bleeding when anticoagulant combined with antiplatelet.",
            "clinical_effect": "Enhanced anticoagulation effect, increased bleeding risk including GI and intracranial bleeding.",
            "management": "Avoid combination unless specifically indicated. Monitor INR closely. Watch for signs of bleeding.",
            "evidence": "strong",
        },
        {
            "drug_a": "warfarin", "drug_b": "ibuprofen",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "NSAIDs increase anticoagulant effect and risk of GI bleeding.",
            "clinical_effect": "Significant increase in bleeding risk, GI hemorrhage, elevated INR.",
            "management": "Avoid NSAIDs. Use acetaminophen for pain. If NSAID required, use lowest dose for shortest duration with gastroprotection.",
            "evidence": "strong",
        },
        {
            "drug_a": "warfarin", "drug_b": "naproxen",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "NSAIDs increase anticoagulant effect and risk of GI bleeding.",
            "clinical_effect": "Significant increase in bleeding risk, GI hemorrhage.",
            "management": "Avoid combination. Use acetaminophen as alternative.",
            "evidence": "strong",
        },
        {
            "drug_a": "lisinopril", "drug_b": "losartan",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "Dual RAAS blockade increases risk of hyperkalemia, hypotension, and renal impairment.",
            "clinical_effect": "Hyperkalemia, acute kidney injury, hypotension.",
            "management": "Generally avoid combination. Monitor potassium and renal function if combined.",
            "evidence": "strong",
        },
        {
            "drug_a": "fluoxetine", "drug_b": "tramadol",
            "severity": InteractionSeverity.CONTRAINDICATED,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "Risk of serotonin syndrome when SSRI combined with serotonergic opioid.",
            "clinical_effect": "Serotonin syndrome: hyperthermia, rigidity, myoclonus, mental status changes, autonomic instability.",
            "management": "CONTRAINDICATED. Choose alternative analgesic. If used, monitor closely for serotonin syndrome symptoms.",
            "evidence": "strong",
        },
        {
            "drug_a": "sertraline", "drug_b": "tramadol",
            "severity": InteractionSeverity.CONTRAINDICATED,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "Risk of serotonin syndrome with concurrent serotonergic agents.",
            "clinical_effect": "Serotonin syndrome.",
            "management": "CONTRAINDICATED. Use alternative analgesic.",
            "evidence": "strong",
        },
        {
            "drug_a": "simvastatin", "drug_b": "ketoconazole",
            "severity": InteractionSeverity.CONTRAINDICATED,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "Strong CYP3A4 inhibitor dramatically increases statin levels.",
            "clinical_effect": "Severe rhabdomyolysis, myopathy, hepatotoxicity.",
            "management": "CONTRAINDICATED. Discontinue statin during antifungal therapy or use non-interacting statin.",
            "evidence": "strong",
        },
        {
            "drug_a": "atorvastatin", "drug_b": "ketoconazole",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "CYP3A4 inhibition increases statin exposure.",
            "clinical_effect": "Increased risk of myopathy and rhabdomyolysis.",
            "management": "Reduce statin dose or temporarily discontinue. Monitor for muscle pain.",
            "evidence": "strong",
        },
        {
            "drug_a": "metoprolol", "drug_b": "fluoxetine",
            "severity": InteractionSeverity.MODERATE,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "CYP2D6 inhibition by fluoxetine increases metoprolol levels.",
            "clinical_effect": "Increased beta-blocker effect: bradycardia, hypotension.",
            "management": "Monitor heart rate and blood pressure. Consider dose reduction of metoprolol.",
            "evidence": "moderate",
        },
        {
            "drug_a": "ciprofloxacin", "drug_b": "warfarin",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "Fluoroquinolones inhibit warfarin metabolism via CYP1A2.",
            "clinical_effect": "Elevated INR, increased bleeding risk.",
            "management": "Monitor INR closely. May need to reduce warfarin dose by 20-30%.",
            "evidence": "strong",
        },
        {
            "drug_a": "omeprazole", "drug_b": "citalopram",
            "severity": InteractionSeverity.MODERATE,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "Omeprazole inhibits CYP2C19, reducing citalopram metabolism.",
            "clinical_effect": "Increased citalopram levels, risk of QT prolongation.",
            "management": "Limit citalopram to 20mg/day if combined. Consider alternative PPI.",
            "evidence": "moderate",
        },
        {
            "drug_a": "oxycodone", "drug_b": "diazepam",
            "severity": InteractionSeverity.CONTRAINDICATED,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "Concurrent opioid and benzodiazepine causes additive CNS depression.",
            "clinical_effect": "Respiratory depression, profound sedation, coma, death.",
            "management": "AVOID combination. FDA Black Box Warning. If necessary, use lowest doses and shortest duration.",
            "evidence": "strong",
        },
        {
            "drug_a": "oxycodone", "drug_b": "alprazolam",
            "severity": InteractionSeverity.CONTRAINDICATED,
            "mechanism": InteractionMechanism.PHARMACODYNAMIC,
            "description": "Concurrent opioid and benzodiazepine causes additive CNS depression.",
            "clinical_effect": "Respiratory depression, profound sedation, death.",
            "management": "AVOID combination. FDA Black Box Warning.",
            "evidence": "strong",
        },
        {
            "drug_a": "metformin", "drug_b": "ciprofloxacin",
            "severity": InteractionSeverity.MODERATE,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "Ciprofloxacin may alter glucose control.",
            "clinical_effect": "Both hypoglycemia and hyperglycemia reported.",
            "management": "Monitor blood glucose closely during concurrent use.",
            "evidence": "moderate",
        },
        {
            "drug_a": "levothyroxine", "drug_b": "omeprazole",
            "severity": InteractionSeverity.MODERATE,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "PPIs reduce gastric acidity, decreasing levothyroxine absorption.",
            "clinical_effect": "Reduced levothyroxine efficacy, elevated TSH.",
            "management": "Monitor TSH. May need to increase levothyroxine dose. Separate by 4 hours.",
            "evidence": "moderate",
        },
        {
            "drug_a": "phenytoin", "drug_b": "fluoxetine",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "Fluoxetine inhibits CYP2C9, increasing phenytoin levels.",
            "clinical_effect": "Phenytoin toxicity: ataxia, nystagmus, confusion.",
            "management": "Monitor phenytoin levels closely. Reduce dose as needed.",
            "evidence": "strong",
        },
        {
            "drug_a": "lithium", "drug_b": "ibuprofen",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "NSAIDs reduce renal lithium clearance.",
            "clinical_effect": "Lithium toxicity: tremor, confusion, seizures, renal failure.",
            "management": "Avoid NSAIDs. Use acetaminophen. Monitor lithium levels if NSAID required.",
            "evidence": "strong",
        },
        {
            "drug_a": "lithium", "drug_b": "naproxen",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "NSAIDs reduce renal lithium clearance.",
            "clinical_effect": "Lithium toxicity.",
            "management": "Avoid combination. Monitor lithium levels.",
            "evidence": "strong",
        },
        {
            "drug_a": "lithium", "drug_b": "lisinopril",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "ACE inhibitors reduce lithium excretion.",
            "clinical_effect": "Elevated lithium levels, toxicity risk.",
            "management": "Monitor lithium levels closely, especially when starting/stopping ACE inhibitor.",
            "evidence": "strong",
        },
        {
            "drug_a": "amitriptyline", "drug_b": "fluoxetine",
            "severity": InteractionSeverity.MAJOR,
            "mechanism": InteractionMechanism.PHARMACOKINETIC,
            "description": "CYP2D6 inhibition increases TCA levels. Also serotonin syndrome risk.",
            "clinical_effect": "TCA toxicity: cardiac arrhythmias, anticholinergic effects. Serotonin syndrome.",
            "management": "Avoid combination. If necessary, reduce TCA dose and monitor levels and ECG.",
            "evidence": "strong",
        },
    ]

    # Food interactions
    FOOD_INTERACTIONS: Dict[str, List[Dict]] = {
        "warfarin": [
            {"food": "Vitamin K-rich foods (spinach, kale, broccoli)", "effect": "Reduces anticoagulant effect",
             "management": "Maintain consistent intake, don't dramatically change diet"},
            {"food": "Grapefruit juice", "effect": "May increase effect",
             "management": "Avoid large amounts of grapefruit juice"},
            {"food": "Cranberry juice", "effect": "May increase INR",
             "management": "Limit cranberry juice intake"},
            {"food": "Alcohol", "effect": "Unpredictable effect on INR",
             "management": "Limit alcohol consumption, avoid binge drinking"},
        ],
        "simvastatin": [
            {"food": "Grapefruit/grapefruit juice", "effect": "Dramatically increases statin levels via CYP3A4 inhibition",
             "management": "Avoid grapefruit entirely"},
        ],
        "atorvastatin": [
            {"food": "Grapefruit/grapefruit juice", "effect": "Increases statin levels",
             "management": "Limit grapefruit intake to small amounts"},
        ],
        "ciprofloxacin": [
            {"food": "Calcium/dairy products", "effect": "Reduced absorption due to chelation",
             "management": "Take 2 hours before or 6 hours after dairy or calcium supplements"},
            {"food": "Iron supplements", "effect": "Reduced absorption",
             "management": "Separate by at least 2 hours"},
        ],
        "levothyroxine": [
            {"food": "Calcium supplements", "effect": "Reduced absorption",
             "management": "Take levothyroxine 4 hours before/after calcium"},
            {"food": "Soy products", "effect": "May decrease absorption",
             "management": "Maintain consistent soy intake"},
            {"food": "Coffee", "effect": "Reduced absorption",
             "management": "Wait 30-60 minutes after levothyroxine before coffee"},
        ],
        "metformin": [
            {"food": "Alcohol", "effect": "Increased risk of lactic acidosis",
             "management": "Avoid excessive alcohol consumption"},
        ],
    }


class CYPInteractionPredictor:
    """Predicts drug interactions based on CYP450 enzyme metabolism."""

    # CYP enzyme inhibitors and inducers
    CYP_INHIBITORS = {
        "CYP3A4": ["ketoconazole", "itraconazole", "clarithromycin", "grapefruit"],
        "CYP2D6": ["fluoxetine", "paroxetine", "bupropion", "quinidine"],
        "CYP2C9": ["fluconazole", "amiodarone", "fluoxetine"],
        "CYP2C19": ["omeprazole", "fluvoxamine", "fluoxetine"],
        "CYP1A2": ["ciprofloxacin", "fluvoxamine", "cimetidine"],
    }

    CYP_INDUCERS = {
        "CYP3A4": ["rifampin", "carbamazepine", "phenytoin", "st_johns_wort"],
        "CYP2C9": ["rifampin", "phenobarbital"],
        "CYP2C19": ["rifampin", "carbamazepine"],
        "CYP1A2": ["smoking", "rifampin"],
    }

    def predict_interaction(
        self,
        drug_a: Drug,
        drug_b: Drug,
    ) -> Optional[Dict]:
        """Predict CYP-mediated interaction between two drugs."""
        interactions = []

        for enzyme in drug_a.cyp_enzymes:
            # Check if drug_b inhibits an enzyme that metabolizes drug_a
            inhibitors = self.CYP_INHIBITORS.get(enzyme, [])
            if drug_b.generic_name in inhibitors:
                interactions.append({
                    "type": "inhibition",
                    "enzyme": enzyme,
                    "inhibitor": drug_b.generic_name,
                    "substrate": drug_a.generic_name,
                    "effect": f"{drug_b.generic_name} inhibits {enzyme}, increasing {drug_a.generic_name} levels",
                    "severity": "major" if drug_a.narrow_therapeutic_index else "moderate",
                })

            # Check if drug_b induces an enzyme
            inducers = self.CYP_INDUCERS.get(enzyme, [])
            if drug_b.generic_name in inducers:
                interactions.append({
                    "type": "induction",
                    "enzyme": enzyme,
                    "inducer": drug_b.generic_name,
                    "substrate": drug_a.generic_name,
                    "effect": f"{drug_b.generic_name} induces {enzyme}, decreasing {drug_a.generic_name} levels",
                    "severity": "major" if drug_a.narrow_therapeutic_index else "moderate",
                })

        return interactions[0] if interactions else None


class TherapeuticDuplicationDetector:
    """Detects therapeutic duplications (same drug class)."""

    def detect(self, drugs: List[Drug]) -> List[Dict]:
        """Detect therapeutic duplications."""
        duplications = []
        categories = defaultdict(list)

        for drug in drugs:
            categories[drug.category].append(drug)

        for category, category_drugs in categories.items():
            if len(category_drugs) > 1 and category != "other":
                duplications.append({
                    "category": category,
                    "drugs": [d.generic_name for d in category_drugs],
                    "warning": f"Therapeutic duplication: Multiple {category.replace('_', ' ')}s prescribed",
                    "recommendation": f"Review necessity of multiple {category.replace('_', ' ')} agents",
                })

        return duplications


class DosageChecker:
    """Check for dosage-related concerns."""

    MAX_DAILY_DOSES = {
        "ibuprofen": {"max_mg": 3200, "common_mg": 1200},
        "naproxen": {"max_mg": 1500, "common_mg": 500},
        "acetaminophen": {"max_mg": 4000, "common_mg": 2000, "hepatic_max": 2000},
        "metformin": {"max_mg": 2550, "common_mg": 1500, "renal_max": 1000},
        "gabapentin": {"max_mg": 3600, "common_mg": 1800},
        "omeprazole": {"max_mg": 40, "common_mg": 20},
        "lisinopril": {"max_mg": 80, "common_mg": 20},
        "atorvastatin": {"max_mg": 80, "common_mg": 40},
        "sertraline": {"max_mg": 200, "common_mg": 100},
        "citalopram": {"max_mg": 40, "common_mg": 20, "elderly_max": 20},
    }

    def check_dosage(
        self,
        drug_name: str,
        daily_dose_mg: float,
        patient_context: Optional[Dict] = None,
    ) -> List[Dict]:
        """Check dosage for issues."""
        warnings = []
        dose_info = self.MAX_DAILY_DOSES.get(drug_name.lower())

        if not dose_info:
            return warnings

        if daily_dose_mg > dose_info["max_mg"]:
            warnings.append({
                "type": "overdose",
                "drug": drug_name,
                "current_dose": daily_dose_mg,
                "max_dose": dose_info["max_mg"],
                "severity": "major",
                "message": f"Daily dose of {drug_name} ({daily_dose_mg}mg) exceeds maximum recommended dose ({dose_info['max_mg']}mg)",
            })

        if patient_context:
            age = patient_context.get("age", 45)
            if age >= 65 and "elderly_max" in dose_info:
                if daily_dose_mg > dose_info["elderly_max"]:
                    warnings.append({
                        "type": "elderly_overdose",
                        "drug": drug_name,
                        "current_dose": daily_dose_mg,
                        "max_dose": dose_info["elderly_max"],
                        "severity": "major",
                        "message": f"Dose exceeds elderly maximum ({dose_info['elderly_max']}mg) for patients ≥65 years",
                    })

            if patient_context.get("hepatic_impairment") and "hepatic_max" in dose_info:
                if daily_dose_mg > dose_info["hepatic_max"]:
                    warnings.append({
                        "type": "hepatic_adjustment",
                        "drug": drug_name,
                        "current_dose": daily_dose_mg,
                        "recommended_max": dose_info["hepatic_max"],
                        "severity": "major",
                        "message": f"Dose requires hepatic adjustment (max {dose_info['hepatic_max']}mg)",
                    })

            if patient_context.get("renal_impairment") and "renal_max" in dose_info:
                if daily_dose_mg > dose_info["renal_max"]:
                    warnings.append({
                        "type": "renal_adjustment",
                        "drug": drug_name,
                        "current_dose": daily_dose_mg,
                        "recommended_max": dose_info["renal_max"],
                        "severity": "major",
                        "message": f"Dose requires renal adjustment (max {dose_info['renal_max']}mg)",
                    })

        return warnings


class DrugInteractionChecker:
    """Main drug interaction checking engine."""

    def __init__(self):
        self.kb = PharmacologicalKnowledgeBase()
        self.cyp_predictor = CYPInteractionPredictor()
        self.duplication_detector = TherapeuticDuplicationDetector()
        self.dosage_checker = DosageChecker()
        self.check_history: List[Dict] = []

    async def check_interactions(
        self,
        medication_names: List[str],
        patient_context: Optional[Dict] = None,
        include_food: bool = True,
    ) -> InteractionCheckResult:
        """Check all interactions for a list of medications."""
        start_time = time.time()

        # Normalize drug names
        drugs = []
        for name in medication_names:
            normalized = self._normalize_drug_name(name)
            if normalized and normalized in self.kb.DRUGS:
                drugs.append(self.kb.DRUGS[normalized])

        result = InteractionCheckResult(
            medications=[d.generic_name for d in drugs],
        )

        if len(drugs) < 2 and not include_food:
            result.processing_time_ms = (time.time() - start_time) * 1000
            return result

        # Check pairwise drug interactions
        for drug_a, drug_b in combinations(drugs, 2):
            interactions = self._check_pair(drug_a, drug_b)
            for interaction in interactions:
                severity = interaction.severity
                if severity == InteractionSeverity.CONTRAINDICATED.value:
                    result.contraindicated.append(interaction.to_dict())
                elif severity == InteractionSeverity.MAJOR.value:
                    result.major.append(interaction.to_dict())
                elif severity == InteractionSeverity.MODERATE.value:
                    result.moderate.append(interaction.to_dict())
                elif severity == InteractionSeverity.MINOR.value:
                    result.minor.append(interaction.to_dict())

        # Check CYP-mediated interactions not in known list
        for drug_a, drug_b in combinations(drugs, 2):
            cyp_interaction = self.cyp_predictor.predict_interaction(drug_a, drug_b)
            if cyp_interaction:
                # Check if already found in known interactions
                known_pair = any(
                    (i["drug_a"] in (drug_a.generic_name, drug_b.generic_name) and
                     i["drug_b"] in (drug_a.generic_name, drug_b.generic_name))
                    for bucket in [result.contraindicated, result.major, result.moderate, result.minor]
                    for i in bucket
                )
                if not known_pair:
                    interaction = DrugInteraction(
                        drug_a=drug_a.generic_name,
                        drug_b=drug_b.generic_name,
                        severity=cyp_interaction["severity"],
                        mechanism="pharmacokinetic",
                        description=cyp_interaction["effect"],
                        management="Monitor for altered drug effect. Consider dose adjustment.",
                        confidence=0.65,
                    )
                    if cyp_interaction["severity"] == "major":
                        result.major.append(interaction.to_dict())
                    else:
                        result.moderate.append(interaction.to_dict())

        # Check therapeutic duplications
        duplications = self.duplication_detector.detect(drugs)
        result.therapeutic_duplications = duplications

        # Check food interactions
        if include_food:
            for drug in drugs:
                food_ints = self.kb.FOOD_INTERACTIONS.get(drug.generic_name, [])
                for fi in food_ints:
                    result.food_interactions.append({
                        "drug": drug.generic_name,
                        **fi,
                    })

        # Set overall risk level
        result.total_interactions = (
            len(result.contraindicated) + len(result.major) +
            len(result.moderate) + len(result.minor)
        )

        if result.contraindicated:
            result.overall_risk_level = "critical"
        elif result.major:
            result.overall_risk_level = "high"
        elif result.moderate:
            result.overall_risk_level = "moderate"
        elif result.minor or result.therapeutic_duplications:
            result.overall_risk_level = "low"
        else:
            result.overall_risk_level = "none"

        # Generate recommendations
        result.recommendations = self._generate_recommendations(result)

        result.processing_time_ms = round((time.time() - start_time) * 1000, 2)

        # Log check
        self.check_history.append({
            "check_id": result.check_id,
            "medications": result.medications,
            "total_interactions": result.total_interactions,
            "risk_level": result.overall_risk_level,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return result

    def _normalize_drug_name(self, name: str) -> Optional[str]:
        """Normalize drug name to generic form."""
        name_lower = name.lower().strip()

        # Direct match
        if name_lower in self.kb.DRUGS:
            return name_lower

        # Check brand names
        for generic, drug in self.kb.DRUGS.items():
            for brand in drug.brand_names:
                if brand.lower() == name_lower:
                    return generic

        return name_lower

    def _check_pair(self, drug_a: Drug, drug_b: Drug) -> List[DrugInteraction]:
        """Check interaction between two drugs."""
        interactions = []

        for known in self.kb.KNOWN_INTERACTIONS:
            if ({drug_a.generic_name, drug_b.generic_name} ==
                    {known["drug_a"], known["drug_b"]}):
                interaction = DrugInteraction(
                    drug_a=drug_a.generic_name,
                    drug_b=drug_b.generic_name,
                    severity=known["severity"].value,
                    mechanism=known["mechanism"].value,
                    description=known["description"],
                    clinical_effect=known.get("clinical_effect", ""),
                    management=known.get("management", ""),
                    evidence_level=known.get("evidence", "moderate"),
                    confidence=0.95,
                )
                interactions.append(interaction)

        return interactions

    def _generate_recommendations(self, result: InteractionCheckResult) -> List[str]:
        """Generate clinical recommendations."""
        recs = []

        if result.contraindicated:
            recs.append("⚠️ CRITICAL: Contraindicated drug combinations detected. Immediate review required.")
            for ci in result.contraindicated:
                recs.append(f"  - {ci['drug_a']} + {ci['drug_b']}: {ci.get('management', 'Avoid combination')}")

        if result.major:
            recs.append("🔴 MAJOR interactions requiring close monitoring or alternatives:")
            for maj in result.major:
                recs.append(f"  - {maj['drug_a']} + {maj['drug_b']}: {maj.get('management', 'Monitor closely')}")

        if result.therapeutic_duplications:
            recs.append("📋 Therapeutic duplications detected - review for necessity:")
            for td in result.therapeutic_duplications:
                recs.append(f"  - {td['warning']}")

        if result.food_interactions:
            recs.append("🍽️ Food/beverage interactions to counsel patient about:")
            for fi in result.food_interactions:
                recs.append(f"  - {fi['drug']}: {fi['management']}")

        if not recs:
            recs.append("✅ No significant drug interactions detected.")

        return recs

    def get_drug_info(self, drug_name: str) -> Optional[Dict]:
        """Get information about a specific drug."""
        normalized = self._normalize_drug_name(drug_name)
        drug = self.kb.DRUGS.get(normalized)
        if drug:
            return {
                "name": drug.name,
                "generic_name": drug.generic_name,
                "brand_names": drug.brand_names,
                "category": drug.category,
                "half_life_hours": drug.half_life_hours,
                "cyp_enzymes": drug.cyp_enzymes,
                "pregnancy_category": drug.pregnancy_category,
                "narrow_therapeutic_index": drug.narrow_therapeutic_index,
                "renal_adjustment": drug.renal_adjustment,
                "hepatic_adjustment": drug.hepatic_adjustment,
            }
        return None

    def get_stats(self) -> Dict:
        """Get usage statistics."""
        if not self.check_history:
            return {"total_checks": 0}

        risk_breakdown = defaultdict(int)
        for entry in self.check_history:
            risk_breakdown[entry["risk_level"]] += 1

        return {
            "total_checks": len(self.check_history),
            "risk_breakdown": dict(risk_breakdown),
            "avg_medications_per_check": round(
                sum(len(e["medications"]) for e in self.check_history) / len(self.check_history),
                1,
            ),
        }


# Singleton
drug_interaction_checker = DrugInteractionChecker()

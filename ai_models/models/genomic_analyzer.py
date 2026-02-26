"""
Genomic Analyzer - Analyzes genomic data for cancer-related variants,
pharmacogenomic markers, and hereditary risk assessment.
Supports VCF parsing, variant annotation, and clinical interpretation.
"""

import logging
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


class VariantClassification(Enum):
    PATHOGENIC = "pathogenic"
    LIKELY_PATHOGENIC = "likely_pathogenic"
    UNCERTAIN = "uncertain_significance"
    LIKELY_BENIGN = "likely_benign"
    BENIGN = "benign"


class VariantType(Enum):
    SNV = "snv"                       # Single nucleotide variant
    INSERTION = "insertion"
    DELETION = "deletion"
    INDEL = "indel"
    CNV = "cnv"                       # Copy number variation
    STRUCTURAL = "structural"
    FUSION = "fusion"


class ClinicalSignificance(Enum):
    DIAGNOSTIC = "diagnostic"
    PROGNOSTIC = "prognostic"
    THERAPEUTIC = "therapeutic"
    PHARMACOGENOMIC = "pharmacogenomic"
    RISK_FACTOR = "risk_factor"
    PROTECTIVE = "protective"


class InheritancePattern(Enum):
    AUTOSOMAL_DOMINANT = "autosomal_dominant"
    AUTOSOMAL_RECESSIVE = "autosomal_recessive"
    X_LINKED = "x_linked"
    X_LINKED_DOMINANT = "x_linked_dominant"
    MITOCHONDRIAL = "mitochondrial"
    COMPLEX = "complex"
    SOMATIC = "somatic"


@dataclass
class GenomicVariant:
    variant_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    chromosome: str = ""
    position: int = 0
    reference_allele: str = ""
    alternate_allele: str = ""
    variant_type: str = "snv"
    gene: str = ""
    transcript: str = ""
    hgvs_c: str = ""                  # Coding DNA notation
    hgvs_p: str = ""                  # Protein notation
    consequence: str = ""             # e.g., missense, nonsense, frameshift
    classification: str = "uncertain_significance"
    clinical_significance: List[str] = field(default_factory=list)
    allele_frequency: float = 0.0     # Population allele frequency
    depth: int = 0                    # Read depth
    quality: float = 0.0             # Variant quality score
    zygosity: str = ""               # heterozygous, homozygous
    databases: List[str] = field(default_factory=list)  # ClinVar, COSMIC, etc.
    associated_conditions: List[str] = field(default_factory=list)
    evidence_level: str = ""         # Tier I-IV

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class GenePanel:
    panel_name: str
    genes: List[str]
    indication: str
    version: str = "1.0"
    total_regions: int = 0
    coverage_target: float = 99.0


@dataclass
class GenomicReport:
    report_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str = ""
    sample_id: str = ""
    test_type: str = ""
    panel_name: str = ""
    total_variants: int = 0
    pathogenic_variants: List[Dict] = field(default_factory=list)
    likely_pathogenic_variants: List[Dict] = field(default_factory=list)
    uncertain_variants: List[Dict] = field(default_factory=list)
    pharmacogenomic_results: List[Dict] = field(default_factory=list)
    tumor_mutational_burden: Optional[float] = None
    microsatellite_instability: Optional[str] = None
    actionable_findings: List[Dict] = field(default_factory=list)
    therapeutic_implications: List[Dict] = field(default_factory=list)
    clinical_trials_eligible: List[Dict] = field(default_factory=list)
    summary: str = ""
    recommendations: List[str] = field(default_factory=list)
    quality_metrics: Dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


class CancerGeneDatabase:
    """Database of cancer-related genes and their clinical significance."""

    # Key cancer genes with associated information
    CANCER_GENES = {
        "BRCA1": {
            "chromosome": "17",
            "full_name": "BRCA1 DNA Repair Associated",
            "function": "Tumor suppressor - DNA double-strand break repair",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Breast cancer", "Ovarian cancer", "Pancreatic cancer", "Prostate cancer"],
            "penetrance": "high",
            "risk_increase": {"breast": 5.0, "ovarian": 20.0},
            "actionable": True,
            "therapies": ["PARP inhibitors (Olaparib, Rucaparib)", "Platinum-based chemotherapy"],
            "screening": ["Annual mammogram + MRI from age 25", "Consider risk-reducing surgery"],
        },
        "BRCA2": {
            "chromosome": "13",
            "full_name": "BRCA2 DNA Repair Associated",
            "function": "Tumor suppressor - DNA repair by homologous recombination",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Breast cancer", "Ovarian cancer", "Pancreatic cancer", "Prostate cancer", "Melanoma"],
            "penetrance": "high",
            "risk_increase": {"breast": 4.0, "ovarian": 10.0, "prostate": 3.0},
            "actionable": True,
            "therapies": ["PARP inhibitors", "Platinum-based chemotherapy"],
            "screening": ["Annual mammogram + MRI from age 25", "Prostate cancer screening from age 40"],
        },
        "TP53": {
            "chromosome": "17",
            "full_name": "Tumor Protein P53",
            "function": "Tumor suppressor - cell cycle arrest, apoptosis, DNA repair",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Li-Fraumeni syndrome", "Breast cancer", "Sarcomas", "Brain tumors", "Leukemia"],
            "penetrance": "very_high",
            "risk_increase": {"any_cancer": 25.0},
            "actionable": True,
            "therapies": ["Depends on tumor type"],
            "screening": ["Comprehensive cancer screening from childhood"],
        },
        "KRAS": {
            "chromosome": "12",
            "full_name": "KRAS Proto-Oncogene",
            "function": "Oncogene - RAS/MAPK signaling pathway",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Lung adenocarcinoma", "Colorectal cancer", "Pancreatic cancer"],
            "penetrance": "N/A (somatic)",
            "actionable": True,
            "therapies": ["Sotorasib (KRAS G12C)", "Adagrasib (KRAS G12C)", "Anti-EGFR contraindicated in CRC with KRAS mut"],
        },
        "EGFR": {
            "chromosome": "7",
            "full_name": "Epidermal Growth Factor Receptor",
            "function": "Oncogene - cell growth signaling",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Non-small cell lung cancer", "Glioblastoma"],
            "actionable": True,
            "therapies": ["Erlotinib", "Gefitinib", "Afatinib", "Osimertinib"],
        },
        "ALK": {
            "chromosome": "2",
            "full_name": "ALK Receptor Tyrosine Kinase",
            "function": "Oncogene - receptor tyrosine kinase",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Non-small cell lung cancer", "Anaplastic large cell lymphoma"],
            "actionable": True,
            "therapies": ["Crizotinib", "Ceritinib", "Alectinib", "Lorlatinib"],
        },
        "BRAF": {
            "chromosome": "7",
            "full_name": "B-Raf Proto-Oncogene",
            "function": "Oncogene - MAPK signaling",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Melanoma", "Colorectal cancer", "Thyroid cancer", "Hairy cell leukemia"],
            "actionable": True,
            "therapies": ["Vemurafenib (V600E)", "Dabrafenib + Trametinib (V600E)", "Encorafenib"],
        },
        "HER2": {
            "chromosome": "17",
            "full_name": "Human Epidermal Growth Factor Receptor 2",
            "function": "Oncogene - cell growth and differentiation",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Breast cancer", "Gastric cancer"],
            "actionable": True,
            "therapies": ["Trastuzumab", "Pertuzumab", "T-DM1", "Trastuzumab deruxtecan"],
        },
        "PIK3CA": {
            "chromosome": "3",
            "full_name": "PI3K Catalytic Subunit Alpha",
            "function": "Oncogene - PI3K/AKT/mTOR pathway",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Breast cancer", "Endometrial cancer", "Colorectal cancer"],
            "actionable": True,
            "therapies": ["Alpelisib (for HR+/HER2- breast cancer with PIK3CA mutation)"],
        },
        "APC": {
            "chromosome": "5",
            "full_name": "APC Regulator of WNT Signaling",
            "function": "Tumor suppressor - Wnt signaling regulation",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Familial adenomatous polyposis", "Colorectal cancer"],
            "penetrance": "very_high",
            "actionable": True,
            "screening": ["Annual colonoscopy from age 10-12", "Consider prophylactic colectomy"],
        },
        "MLH1": {
            "chromosome": "3",
            "full_name": "MutL Homolog 1",
            "function": "Tumor suppressor - DNA mismatch repair",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Lynch syndrome", "Colorectal cancer", "Endometrial cancer"],
            "penetrance": "high",
            "actionable": True,
            "therapies": ["Pembrolizumab (for MSI-H tumors)"],
            "screening": ["Colonoscopy every 1-2 years from age 20-25"],
        },
        "MSH2": {
            "chromosome": "2",
            "full_name": "MutS Homolog 2",
            "function": "Tumor suppressor - DNA mismatch repair",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Lynch syndrome", "Colorectal cancer", "Endometrial cancer", "Ovarian cancer"],
            "penetrance": "high",
            "actionable": True,
            "therapies": ["Immune checkpoint inhibitors for MSI-H tumors"],
        },
        "RB1": {
            "chromosome": "13",
            "full_name": "RB Transcriptional Corepressor 1",
            "function": "Tumor suppressor - cell cycle regulation",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Retinoblastoma", "Osteosarcoma", "Small cell lung cancer"],
            "penetrance": "high",
            "actionable": True,
        },
        "PTEN": {
            "chromosome": "10",
            "full_name": "Phosphatase and Tensin Homolog",
            "function": "Tumor suppressor - PI3K pathway regulation",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Cowden syndrome", "Breast cancer", "Thyroid cancer", "Endometrial cancer"],
            "penetrance": "high",
            "actionable": True,
            "therapies": ["mTOR inhibitors under investigation"],
        },
        "CDH1": {
            "chromosome": "16",
            "full_name": "Cadherin 1",
            "function": "Tumor suppressor - cell adhesion",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Hereditary diffuse gastric cancer", "Lobular breast cancer"],
            "penetrance": "high",
            "actionable": True,
            "screening": ["Consider prophylactic total gastrectomy", "Annual breast MRI"],
        },
        "RET": {
            "chromosome": "10",
            "full_name": "Ret Proto-Oncogene",
            "function": "Oncogene - receptor tyrosine kinase",
            "inheritance": InheritancePattern.AUTOSOMAL_DOMINANT,
            "associated_cancers": ["Medullary thyroid cancer", "MEN2 syndrome", "Non-small cell lung cancer"],
            "actionable": True,
            "therapies": ["Selpercatinib", "Pralsetinib"],
        },
        "NTRK": {
            "chromosome": "Multiple",
            "full_name": "Neurotrophic Tyrosine Receptor Kinase",
            "function": "Oncogene (fusions) - receptor tyrosine kinase",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Multiple solid tumors (tumor agnostic)"],
            "actionable": True,
            "therapies": ["Larotrectinib", "Entrectinib"],
        },
        "IDH1": {
            "chromosome": "2",
            "full_name": "Isocitrate Dehydrogenase 1",
            "function": "Metabolic enzyme (mutant = oncometabolite production)",
            "inheritance": InheritancePattern.SOMATIC,
            "associated_cancers": ["Glioma", "Acute myeloid leukemia", "Cholangiocarcinoma"],
            "actionable": True,
            "therapies": ["Ivosidenib"],
        },
    }

    # Pharmacogenomic markers
    PHARMACOGENOMIC_MARKERS = {
        "CYP2D6": {
            "gene": "CYP2D6",
            "chromosome": "22",
            "phenotypes": {
                "poor_metabolizer": {
                    "drugs_affected": ["codeine", "tramadol", "tamoxifen", "fluoxetine"],
                    "clinical_impact": "Reduced efficacy of prodrugs, increased toxicity of active drugs",
                    "recommendations": {
                        "codeine": "Avoid codeine - use alternative analgesic",
                        "tramadol": "Avoid tramadol - use alternative analgesic",
                        "tamoxifen": "Consider alternative endocrine therapy or dose adjustment",
                    },
                },
                "ultrarapid_metabolizer": {
                    "drugs_affected": ["codeine", "tramadol"],
                    "clinical_impact": "Rapid conversion to active metabolites - toxicity risk",
                    "recommendations": {
                        "codeine": "AVOID - life-threatening toxicity risk",
                        "tramadol": "AVOID - increased seizure and respiratory depression risk",
                    },
                },
                "normal_metabolizer": {
                    "drugs_affected": [],
                    "clinical_impact": "Standard drug metabolism",
                    "recommendations": {},
                },
            },
        },
        "CYP2C19": {
            "gene": "CYP2C19",
            "chromosome": "10",
            "phenotypes": {
                "poor_metabolizer": {
                    "drugs_affected": ["clopidogrel", "omeprazole", "voriconazole"],
                    "clinical_impact": "Clopidogrel: reduced efficacy. PPIs: increased exposure.",
                    "recommendations": {
                        "clopidogrel": "Use alternative antiplatelet (prasugrel, ticagrelor)",
                        "voriconazole": "Reduce dose, monitor levels",
                    },
                },
                "ultrarapid_metabolizer": {
                    "drugs_affected": ["omeprazole", "pantoprazole"],
                    "clinical_impact": "Reduced PPI efficacy",
                    "recommendations": {
                        "omeprazole": "May need higher dose or alternative PPI",
                    },
                },
            },
        },
        "CYP2C9": {
            "gene": "CYP2C9",
            "chromosome": "10",
            "phenotypes": {
                "poor_metabolizer": {
                    "drugs_affected": ["warfarin", "phenytoin"],
                    "clinical_impact": "Increased drug levels - higher bleeding/toxicity risk",
                    "recommendations": {
                        "warfarin": "Reduce initial dose by 50-80%, monitor INR closely",
                        "phenytoin": "Reduce dose, monitor levels",
                    },
                },
            },
        },
        "VKORC1": {
            "gene": "VKORC1",
            "chromosome": "16",
            "phenotypes": {
                "high_sensitivity": {
                    "drugs_affected": ["warfarin"],
                    "clinical_impact": "Higher sensitivity to warfarin - lower doses needed",
                    "recommendations": {
                        "warfarin": "Start with lower dose (typically 2-3mg instead of 5mg)",
                    },
                },
                "low_sensitivity": {
                    "drugs_affected": ["warfarin"],
                    "clinical_impact": "Reduced warfarin sensitivity - higher doses may be needed",
                    "recommendations": {
                        "warfarin": "May need higher maintenance dose",
                    },
                },
            },
        },
        "DPYD": {
            "gene": "DPYD",
            "chromosome": "1",
            "phenotypes": {
                "poor_metabolizer": {
                    "drugs_affected": ["5-fluorouracil", "capecitabine"],
                    "clinical_impact": "SEVERE - life-threatening toxicity from fluoropyrimidines",
                    "recommendations": {
                        "5-fluorouracil": "AVOID or reduce dose by 50%+ with close monitoring",
                        "capecitabine": "AVOID or reduce dose by 50%+ with close monitoring",
                    },
                },
            },
        },
        "UGT1A1": {
            "gene": "UGT1A1",
            "chromosome": "2",
            "phenotypes": {
                "poor_metabolizer": {
                    "drugs_affected": ["irinotecan", "atazanavir"],
                    "clinical_impact": "Increased toxicity from reduced glucuronidation",
                    "recommendations": {
                        "irinotecan": "Reduce dose by 20-30%, monitor for neutropenia/diarrhea",
                    },
                },
            },
        },
        "TPMT": {
            "gene": "TPMT",
            "chromosome": "6",
            "phenotypes": {
                "poor_metabolizer": {
                    "drugs_affected": ["azathioprine", "6-mercaptopurine", "thioguanine"],
                    "clinical_impact": "Severe myelosuppression risk",
                    "recommendations": {
                        "azathioprine": "Reduce dose by 90% or use alternative",
                        "6-mercaptopurine": "Reduce dose by 90% or use alternative",
                    },
                },
            },
        },
        "HLA-B*5701": {
            "gene": "HLA-B",
            "chromosome": "6",
            "phenotypes": {
                "positive": {
                    "drugs_affected": ["abacavir"],
                    "clinical_impact": "High risk of hypersensitivity reaction",
                    "recommendations": {
                        "abacavir": "CONTRAINDICATED - do not prescribe",
                    },
                },
            },
        },
    }


class VariantAnnotator:
    """Annotates genomic variants with clinical information."""

    def __init__(self):
        self.gene_db = CancerGeneDatabase()

    def annotate(self, variant: GenomicVariant) -> GenomicVariant:
        """Annotate a variant with clinical information."""
        gene_info = self.gene_db.CANCER_GENES.get(variant.gene)

        if gene_info:
            variant.associated_conditions = gene_info.get("associated_cancers", [])

            # Determine clinical significance based on consequence
            if variant.consequence in ("missense_variant", "stop_gained", "frameshift_variant"):
                if gene_info.get("actionable"):
                    variant.clinical_significance.append(ClinicalSignificance.THERAPEUTIC.value)
                if gene_info.get("penetrance") in ("high", "very_high"):
                    variant.clinical_significance.append(ClinicalSignificance.RISK_FACTOR.value)

            # Classification heuristic
            if variant.consequence in ("stop_gained", "frameshift_variant"):
                if variant.allele_frequency < 0.001:
                    variant.classification = VariantClassification.LIKELY_PATHOGENIC.value
            elif variant.consequence == "synonymous_variant":
                variant.classification = VariantClassification.LIKELY_BENIGN.value

            # Evidence level
            if gene_info.get("therapies"):
                variant.evidence_level = "Tier I"
            elif gene_info.get("actionable"):
                variant.evidence_level = "Tier II"
            else:
                variant.evidence_level = "Tier III"

        return variant


class TumorMutationalBurdenCalculator:
    """Calculate Tumor Mutational Burden (TMB)."""

    def calculate(
        self,
        variants: List[GenomicVariant],
        panel_size_mb: float = 1.5,
    ) -> Dict:
        """Calculate TMB from variants."""
        # Count non-synonymous somatic variants
        somatic_ns = [
            v for v in variants
            if v.consequence not in ("synonymous_variant", "intron_variant", "intergenic_variant")
            and v.allele_frequency < 0.01  # Likely somatic
        ]

        tmb = len(somatic_ns) / panel_size_mb if panel_size_mb > 0 else 0

        # Classification
        if tmb >= 20:
            classification = "TMB-High"
        elif tmb >= 10:
            classification = "TMB-Intermediate"
        else:
            classification = "TMB-Low"

        return {
            "tmb_value": round(tmb, 2),
            "classification": classification,
            "total_variants_counted": len(somatic_ns),
            "panel_size_mb": panel_size_mb,
            "clinical_implication": self._get_tmb_implication(classification),
        }

    def _get_tmb_implication(self, classification: str) -> str:
        implications = {
            "TMB-High": "May benefit from immune checkpoint inhibitor therapy (e.g., pembrolizumab). "
                        "FDA-approved tumor-agnostic indication for TMB-H (≥10 mut/Mb) solid tumors.",
            "TMB-Intermediate": "Possible benefit from immunotherapy. Consider in context of other biomarkers (PD-L1, MSI).",
            "TMB-Low": "Less likely to respond to immunotherapy based on TMB alone. Consider other treatment options.",
        }
        return implications.get(classification, "")


class MicrosatelliteInstabilityAnalyzer:
    """Analyze microsatellite instability status."""

    MSI_MARKERS = [
        "BAT25", "BAT26", "NR21", "NR24", "MONO27",
        "D2S123", "D5S346", "D17S250", "BAT40", "D18S69",
    ]

    def analyze(
        self,
        marker_results: Dict[str, str],
    ) -> Dict:
        """Analyze MSI status from marker results."""
        unstable_count = sum(
            1 for marker, status in marker_results.items()
            if status.lower() in ("unstable", "positive")
        )
        total_markers = len(marker_results)

        if total_markers == 0:
            return {"status": "Not assessed", "markers_tested": 0}

        instability_fraction = unstable_count / total_markers

        if instability_fraction >= 0.3:
            status = "MSI-High (MSI-H)"
            implication = ("Associated with Lynch syndrome (germline) or sporadic (somatic MLH1 promoter methylation). "
                          "Eligible for immune checkpoint inhibitor therapy. "
                          "Consider genetic counseling referral.")
        elif instability_fraction > 0:
            status = "MSI-Low (MSI-L)"
            implication = "Low-level instability. Clinical significance similar to MSS in most contexts."
        else:
            status = "Microsatellite Stable (MSS)"
            implication = "No microsatellite instability detected."

        return {
            "status": status,
            "unstable_markers": unstable_count,
            "total_markers": total_markers,
            "instability_fraction": round(instability_fraction, 3),
            "clinical_implication": implication,
            "markers_tested": {
                marker: marker_results.get(marker, "not_tested")
                for marker in self.MSI_MARKERS
                if marker in marker_results
            },
        }


class ClinicalTrialMatcher:
    """Match genomic findings to clinical trials."""

    # Simulated trial database
    TRIALS = [
        {
            "trial_id": "NCT04000000",
            "title": "PARP Inhibitor + Immunotherapy in BRCA-mutated Solid Tumors",
            "phase": "Phase III",
            "biomarkers": ["BRCA1", "BRCA2"],
            "tumor_types": ["Breast", "Ovarian", "Prostate", "Pancreatic"],
            "status": "Recruiting",
        },
        {
            "trial_id": "NCT04111111",
            "title": "Sotorasib in KRAS G12C-mutated Non-Small Cell Lung Cancer",
            "phase": "Phase III",
            "biomarkers": ["KRAS"],
            "specific_variants": ["G12C"],
            "tumor_types": ["NSCLC"],
            "status": "Recruiting",
        },
        {
            "trial_id": "NCT04222222",
            "title": "Osimertinib + Savolitinib in EGFR-mutated, MET-amplified NSCLC",
            "phase": "Phase II",
            "biomarkers": ["EGFR", "MET"],
            "tumor_types": ["NSCLC"],
            "status": "Recruiting",
        },
        {
            "trial_id": "NCT04333333",
            "title": "Pembrolizumab in TMB-High Solid Tumors",
            "phase": "Phase III",
            "biomarkers": ["TMB-High"],
            "tumor_types": ["Any solid tumor"],
            "status": "Recruiting",
        },
        {
            "trial_id": "NCT04444444",
            "title": "Novel PI3K Inhibitor in PIK3CA-mutated Advanced Breast Cancer",
            "phase": "Phase II",
            "biomarkers": ["PIK3CA"],
            "tumor_types": ["Breast"],
            "status": "Recruiting",
        },
        {
            "trial_id": "NCT04555555",
            "title": "Combined BRAF + MEK Inhibition in BRAF V600E Colorectal Cancer",
            "phase": "Phase III",
            "biomarkers": ["BRAF"],
            "specific_variants": ["V600E"],
            "tumor_types": ["Colorectal"],
            "status": "Active, not recruiting",
        },
        {
            "trial_id": "NCT04666666",
            "title": "Immunotherapy in MSI-High Metastatic Cancer",
            "phase": "Phase II",
            "biomarkers": ["MSI-H"],
            "tumor_types": ["Any solid tumor"],
            "status": "Recruiting",
        },
        {
            "trial_id": "NCT04777777",
            "title": "Entrectinib in NTRK Fusion-Positive Tumors",
            "phase": "Phase II",
            "biomarkers": ["NTRK"],
            "tumor_types": ["Any solid tumor"],
            "status": "Recruiting",
        },
    ]

    def match(
        self,
        genes_with_variants: List[str],
        tumor_type: Optional[str] = None,
        biomarker_status: Optional[Dict] = None,
    ) -> List[Dict]:
        """Match patient genomic profile to clinical trials."""
        matched = []

        for trial in self.TRIALS:
            # Check biomarker match
            trial_biomarkers = set(trial["biomarkers"])
            patient_genes = set(genes_with_variants)

            # Check for biomarker status matches
            additional_markers = set()
            if biomarker_status:
                if biomarker_status.get("tmb_high"):
                    additional_markers.add("TMB-High")
                if biomarker_status.get("msi_high"):
                    additional_markers.add("MSI-H")

            all_patient_markers = patient_genes | additional_markers

            if trial_biomarkers & all_patient_markers:
                match_score = len(trial_biomarkers & all_patient_markers) / len(trial_biomarkers)

                # Tumor type match
                tumor_match = True
                if tumor_type and "Any solid tumor" not in trial["tumor_types"]:
                    tumor_match = any(
                        tumor_type.lower() in tt.lower()
                        for tt in trial["tumor_types"]
                    )

                if tumor_match:
                    matched.append({
                        **trial,
                        "match_score": round(match_score, 2),
                        "matching_biomarkers": list(trial_biomarkers & all_patient_markers),
                    })

        matched.sort(key=lambda t: t["match_score"], reverse=True)
        return matched


class GenomicAnalyzer:
    """Main genomic analysis engine."""

    def __init__(self):
        self.gene_db = CancerGeneDatabase()
        self.annotator = VariantAnnotator()
        self.tmb_calculator = TumorMutationalBurdenCalculator()
        self.msi_analyzer = MicrosatelliteInstabilityAnalyzer()
        self.trial_matcher = ClinicalTrialMatcher()
        self.analysis_count = 0

    async def analyze_variants(
        self,
        variants: List[Dict],
        patient_context: Optional[Dict] = None,
        panel_name: str = "Comprehensive Cancer Panel",
        panel_size_mb: float = 1.5,
        msi_markers: Optional[Dict] = None,
    ) -> GenomicReport:
        """Perform comprehensive genomic analysis."""
        start_time = time.time()

        # Parse variants
        parsed_variants = []
        for v_dict in variants:
            variant = GenomicVariant(**{k: v for k, v in v_dict.items() if k in GenomicVariant.__dataclass_fields__})
            annotated = self.annotator.annotate(variant)
            parsed_variants.append(annotated)

        # Classify variants
        pathogenic = [v for v in parsed_variants if v.classification == VariantClassification.PATHOGENIC.value]
        likely_pathogenic = [v for v in parsed_variants if v.classification == VariantClassification.LIKELY_PATHOGENIC.value]
        uncertain = [v for v in parsed_variants if v.classification == VariantClassification.UNCERTAIN.value]

        # Calculate TMB
        tmb_result = self.tmb_calculator.calculate(parsed_variants, panel_size_mb)

        # MSI analysis
        msi_result = None
        if msi_markers:
            msi_result = self.msi_analyzer.analyze(msi_markers)

        # Get actionable findings
        actionable = self._get_actionable_findings(parsed_variants)

        # Therapeutic implications
        therapeutic = self._get_therapeutic_implications(parsed_variants)

        # Match clinical trials
        genes_with_variants = list(set(v.gene for v in parsed_variants if v.gene))
        biomarker_status = {
            "tmb_high": tmb_result["classification"] == "TMB-High",
            "msi_high": msi_result and "MSI-H" in msi_result.get("status", ""),
        }
        trial_matches = self.trial_matcher.match(
            genes_with_variants,
            patient_context.get("tumor_type") if patient_context else None,
            biomarker_status,
        )

        # Pharmacogenomic results
        pgx_results = self._get_pharmacogenomic_results(parsed_variants)

        # Generate report
        report = GenomicReport(
            patient_id=patient_context.get("patient_id", "") if patient_context else "",
            test_type="Comprehensive Genomic Profiling",
            panel_name=panel_name,
            total_variants=len(parsed_variants),
            pathogenic_variants=[v.to_dict() for v in pathogenic],
            likely_pathogenic_variants=[v.to_dict() for v in likely_pathogenic],
            uncertain_variants=[v.to_dict() for v in uncertain],
            pharmacogenomic_results=pgx_results,
            tumor_mutational_burden=tmb_result["tmb_value"],
            microsatellite_instability=msi_result["status"] if msi_result else None,
            actionable_findings=actionable,
            therapeutic_implications=therapeutic,
            clinical_trials_eligible=trial_matches,
            summary=self._generate_summary(parsed_variants, tmb_result, msi_result, actionable),
            recommendations=self._generate_recommendations(actionable, therapeutic, tmb_result, msi_result),
            quality_metrics={
                "mean_depth": round(np.mean([v.depth for v in parsed_variants]) if parsed_variants else 0, 1),
                "mean_quality": round(np.mean([v.quality for v in parsed_variants]) if parsed_variants else 0, 1),
                "total_variants_analyzed": len(parsed_variants),
                "processing_time_ms": round((time.time() - start_time) * 1000, 2),
            },
        )

        self.analysis_count += 1
        return report

    def _get_actionable_findings(self, variants: List[GenomicVariant]) -> List[Dict]:
        """Identify clinically actionable findings."""
        actionable = []

        for variant in variants:
            gene_info = self.gene_db.CANCER_GENES.get(variant.gene)
            if gene_info and gene_info.get("actionable"):
                if variant.classification in (
                    VariantClassification.PATHOGENIC.value,
                    VariantClassification.LIKELY_PATHOGENIC.value,
                ):
                    finding = {
                        "gene": variant.gene,
                        "variant": f"{variant.hgvs_c} ({variant.hgvs_p})" if variant.hgvs_c else variant.consequence,
                        "classification": variant.classification,
                        "evidence_level": variant.evidence_level,
                        "therapies": gene_info.get("therapies", []),
                        "associated_cancers": gene_info.get("associated_cancers", []),
                    }
                    if gene_info.get("screening"):
                        finding["screening_recommendations"] = gene_info["screening"]
                    actionable.append(finding)

        return actionable

    def _get_therapeutic_implications(self, variants: List[GenomicVariant]) -> List[Dict]:
        """Get therapeutic implications from variants."""
        implications = []

        for variant in variants:
            gene_info = self.gene_db.CANCER_GENES.get(variant.gene)
            if gene_info and gene_info.get("therapies"):
                implications.append({
                    "gene": variant.gene,
                    "variant": variant.hgvs_p or variant.consequence,
                    "approved_therapies": gene_info["therapies"],
                    "evidence_level": variant.evidence_level,
                })

        return implications

    def _get_pharmacogenomic_results(self, variants: List[GenomicVariant]) -> List[Dict]:
        """Extract pharmacogenomic information."""
        results = []
        pgx_genes = set(v.gene for v in variants) & set(self.gene_db.PHARMACOGENOMIC_MARKERS.keys())

        for gene in pgx_genes:
            marker_info = self.gene_db.PHARMACOGENOMIC_MARKERS[gene]
            results.append({
                "gene": gene,
                "chromosome": marker_info["chromosome"],
                "phenotypes_available": list(marker_info["phenotypes"].keys()),
                "note": "Phenotype determination requires specific star allele analysis",
            })

        return results

    def _generate_summary(
        self,
        variants: List[GenomicVariant],
        tmb: Dict,
        msi: Optional[Dict],
        actionable: List[Dict],
    ) -> str:
        """Generate a narrative summary."""
        parts = []
        parts.append(f"Genomic analysis identified {len(variants)} total variants.")

        pathogenic_count = sum(1 for v in variants if v.classification in
                               (VariantClassification.PATHOGENIC.value, VariantClassification.LIKELY_PATHOGENIC.value))
        if pathogenic_count:
            parts.append(f"{pathogenic_count} pathogenic/likely pathogenic variant(s) detected.")

        parts.append(f"Tumor Mutational Burden: {tmb['tmb_value']} mutations/Mb ({tmb['classification']}).")

        if msi:
            parts.append(f"Microsatellite Instability: {msi['status']}.")

        if actionable:
            genes = [a["gene"] for a in actionable]
            parts.append(f"Clinically actionable findings in: {', '.join(genes)}.")

        return " ".join(parts)

    def _generate_recommendations(
        self,
        actionable: List[Dict],
        therapeutic: List[Dict],
        tmb: Dict,
        msi: Optional[Dict],
    ) -> List[str]:
        """Generate clinical recommendations."""
        recs = []

        for finding in actionable:
            if finding.get("therapies"):
                recs.append(f"Consider {', '.join(finding['therapies'][:2])} for {finding['gene']} alteration.")
            if finding.get("screening_recommendations"):
                recs.extend(finding["screening_recommendations"])

        if tmb["classification"] == "TMB-High":
            recs.append("TMB-High: Consider immune checkpoint inhibitor therapy (pembrolizumab FDA-approved for TMB-H solid tumors).")

        if msi and "MSI-H" in msi.get("status", ""):
            recs.append("MSI-High: Eligible for immune checkpoint inhibitor therapy. Recommend Lynch syndrome evaluation with genetic counseling.")

        if not recs:
            recs.append("No immediately actionable genomic findings. Continue standard of care treatment.")

        recs.append("Discuss findings in molecular tumor board for comprehensive treatment planning.")
        recs.append("Consider genetic counseling for hereditary cancer risk assessment if germline testing warranted.")

        return recs

    def get_gene_info(self, gene_name: str) -> Optional[Dict]:
        """Get information about a cancer gene."""
        info = self.gene_db.CANCER_GENES.get(gene_name.upper())
        if info:
            return {
                "gene": gene_name.upper(),
                **{k: v.value if isinstance(v, Enum) else v for k, v in info.items()},
            }
        return None

    def get_pgx_info(self, gene_name: str) -> Optional[Dict]:
        """Get pharmacogenomic information for a gene."""
        return self.gene_db.PHARMACOGENOMIC_MARKERS.get(gene_name.upper())


# Singleton
genomic_analyzer = GenomicAnalyzer()

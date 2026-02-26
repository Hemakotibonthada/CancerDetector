"""
Search Service - Full-text search, filtering, and indexing for CancerGuard AI platform.
Provides unified search across patients, records, providers, medications, and more.
"""

import logging
import re
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


# ============================================================================
# Enums & Types
# ============================================================================

class SearchEntityType(str, Enum):
    PATIENT = "patient"
    PROVIDER = "provider"
    HOSPITAL = "hospital"
    APPOINTMENT = "appointment"
    HEALTH_RECORD = "health_record"
    LAB_RESULT = "lab_result"
    MEDICATION = "medication"
    DIAGNOSIS = "diagnosis"
    PROCEDURE = "procedure"
    DOCUMENT = "document"
    CLINICAL_TRIAL = "clinical_trial"
    RESEARCH_PAPER = "research_paper"
    ICD_CODE = "icd_code"
    CPT_CODE = "cpt_code"
    DRUG = "drug"
    GENE = "gene"
    PATHWAY = "pathway"
    BILLING = "billing"
    INSURANCE = "insurance"
    NOTIFICATION = "notification"


class SortOrder(str, Enum):
    RELEVANCE = "relevance"
    DATE_ASC = "date_asc"
    DATE_DESC = "date_desc"
    NAME_ASC = "name_asc"
    NAME_DESC = "name_desc"
    SCORE_ASC = "score_asc"
    SCORE_DESC = "score_desc"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class SearchDocument:
    """A searchable document in the index."""
    id: str
    entity_type: SearchEntityType
    title: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    boost: float = 1.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    access_level: str = "public"
    owner_id: Optional[str] = None

    # Pre-computed search fields
    _title_tokens: List[str] = field(default_factory=list, repr=False)
    _content_tokens: List[str] = field(default_factory=list, repr=False)

    def tokenize(self):
        self._title_tokens = Tokenizer.tokenize(self.title)
        self._content_tokens = Tokenizer.tokenize(self.content)


@dataclass
class SearchResult:
    """A single search result."""
    document_id: str
    entity_type: str
    title: str
    snippet: str
    score: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    highlights: List[str] = field(default_factory=list)


@dataclass
class SearchResponse:
    """Complete search response."""
    query: str
    results: List[SearchResult]
    total: int
    page: int
    page_size: int
    took_ms: float
    facets: Dict[str, Dict[str, int]] = field(default_factory=dict)
    suggestions: List[str] = field(default_factory=list)
    did_you_mean: Optional[str] = None

    @property
    def total_pages(self) -> int:
        import math
        return math.ceil(self.total / max(self.page_size, 1))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "results": [
                {
                    "id": r.document_id,
                    "type": r.entity_type,
                    "title": r.title,
                    "snippet": r.snippet,
                    "score": round(r.score, 4),
                    "metadata": r.metadata,
                    "highlights": r.highlights,
                }
                for r in self.results
            ],
            "total": self.total,
            "page": self.page,
            "page_size": self.page_size,
            "total_pages": self.total_pages,
            "took_ms": round(self.took_ms, 2),
            "facets": self.facets,
            "suggestions": self.suggestions,
            "did_you_mean": self.did_you_mean,
        }


@dataclass
class SearchFilter:
    """Filters for search queries."""
    entity_types: Optional[List[SearchEntityType]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    tags: Optional[List[str]] = None
    metadata_filters: Optional[Dict[str, Any]] = None
    owner_id: Optional[str] = None
    access_level: Optional[str] = None
    min_score: float = 0.0


# ============================================================================
# Tokenizer & Text Processing
# ============================================================================

class Tokenizer:
    """Text tokenization and normalization utilities."""

    STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "has", "he", "in", "is", "it", "its", "of", "on", "or", "that",
        "the", "to", "was", "were", "will", "with", "this", "but", "they",
        "have", "had", "what", "when", "where", "who", "which", "their",
        "can", "do", "does", "did", "been", "being", "would", "could",
        "should", "may", "might", "shall", "not", "no", "nor", "if",
        "than", "too", "very", "just", "about", "into", "through",
        "during", "before", "after", "above", "below", "between",
    }

    MEDICAL_SYNONYMS = {
        "cancer": ["carcinoma", "malignancy", "neoplasm", "tumor", "tumour"],
        "heart attack": ["myocardial infarction", "mi", "cardiac arrest"],
        "high blood pressure": ["hypertension", "htn"],
        "diabetes": ["dm", "diabetes mellitus"],
        "stroke": ["cva", "cerebrovascular accident"],
        "kidney": ["renal", "nephro"],
        "liver": ["hepatic", "hepato"],
        "lung": ["pulmonary", "pneumo"],
        "brain": ["cerebral", "neuro"],
        "stomach": ["gastric", "gastro"],
        "breast cancer": ["breast carcinoma", "breast malignancy"],
        "lung cancer": ["pulmonary carcinoma", "lung carcinoma"],
        "colon cancer": ["colorectal carcinoma", "colon carcinoma"],
        "chemo": ["chemotherapy"],
        "radiation": ["radiotherapy", "radiation therapy"],
        "surgery": ["surgical procedure", "operation"],
        "xray": ["x-ray", "radiograph"],
        "mri": ["magnetic resonance imaging"],
        "ct scan": ["computed tomography", "cat scan"],
        "blood test": ["blood work", "cbc", "complete blood count"],
        "pain": ["ache", "discomfort", "soreness", "tenderness"],
        "fever": ["pyrexia", "temperature elevation"],
        "fatigue": ["tiredness", "exhaustion", "weakness", "lethargy"],
    }

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        """Tokenize text into normalized tokens."""
        text = text.lower()
        text = re.sub(r'[^\w\s\-]', ' ', text)
        tokens = text.split()
        tokens = [t for t in tokens if t not in cls.STOP_WORDS and len(t) > 1]
        return tokens

    @classmethod
    def normalize(cls, text: str) -> str:
        return " ".join(cls.tokenize(text))

    @classmethod
    def expand_query(cls, query: str) -> List[str]:
        """Expand query with medical synonyms."""
        query_lower = query.lower()
        expanded = [query_lower]
        for term, synonyms in cls.MEDICAL_SYNONYMS.items():
            if term in query_lower:
                for syn in synonyms:
                    expanded.append(query_lower.replace(term, syn))
            for syn in synonyms:
                if syn in query_lower:
                    expanded.append(query_lower.replace(syn, term))
        return list(set(expanded))

    @classmethod
    def generate_ngrams(cls, text: str, n: int = 2) -> List[str]:
        tokens = cls.tokenize(text)
        ngrams = []
        for i in range(len(tokens) - n + 1):
            ngrams.append(" ".join(tokens[i:i + n]))
        return ngrams

    @classmethod
    def stem(cls, word: str) -> str:
        """Simple suffix stripping stemmer."""
        suffixes = ["ing", "tion", "sion", "ment", "ness", "able", "ible",
                     "ful", "less", "ous", "ive", "ity", "ence", "ance",
                     "ly", "ed", "er", "est", "ism", "ist", "al", "ic"]
        word = word.lower()
        for suffix in sorted(suffixes, key=len, reverse=True):
            if word.endswith(suffix) and len(word) - len(suffix) >= 3:
                return word[:-len(suffix)]
        return word


# ============================================================================
# TF-IDF Scorer
# ============================================================================

class TFIDFScorer:
    """TF-IDF based relevance scoring."""

    def __init__(self):
        self._document_count = 0
        self._document_frequency: Dict[str, int] = defaultdict(int)
        self._field_weights = {
            "title": 3.0,
            "content": 1.0,
            "tags": 2.0,
            "metadata": 0.5,
        }

    def update_statistics(self, documents: Dict[str, SearchDocument]):
        """Update IDF statistics from all documents."""
        self._document_count = len(documents)
        self._document_frequency.clear()
        for doc in documents.values():
            unique_tokens = set(doc._title_tokens + doc._content_tokens + doc.tags)
            for token in unique_tokens:
                self._document_frequency[token] += 1

    def score(self, query_tokens: List[str], document: SearchDocument) -> float:
        """Calculate relevance score for a document against query tokens."""
        import math

        total_score = 0.0

        for token in query_tokens:
            # IDF
            df = self._document_frequency.get(token, 0)
            idf = math.log((self._document_count + 1) / (df + 1)) + 1

            # TF in title
            title_tf = document._title_tokens.count(token) / max(len(document._title_tokens), 1)
            total_score += title_tf * idf * self._field_weights["title"]

            # TF in content
            content_tf = document._content_tokens.count(token) / max(len(document._content_tokens), 1)
            total_score += content_tf * idf * self._field_weights["content"]

            # Tag match
            stemmed_token = Tokenizer.stem(token)
            for tag in document.tags:
                if token in tag.lower() or stemmed_token in Tokenizer.stem(tag):
                    total_score += idf * self._field_weights["tags"]

        # Apply boost
        total_score *= document.boost

        # Recency boost (newer documents get slight boost)
        days_old = (datetime.utcnow() - document.created_at).days
        recency_boost = max(0.5, 1.0 - (days_old / 365) * 0.3)
        total_score *= recency_boost

        return total_score

    def score_exact_match(self, query: str, document: SearchDocument) -> float:
        """Bonus score for exact phrase matches."""
        query_lower = query.lower()
        score = 0.0
        if query_lower in document.title.lower():
            score += 10.0
        if query_lower in document.content.lower():
            score += 3.0
        return score


# ============================================================================
# Search Index
# ============================================================================

class SearchIndex:
    """In-memory search index with inverted index support."""

    def __init__(self):
        self._documents: Dict[str, SearchDocument] = {}
        self._inverted_index: Dict[str, Set[str]] = defaultdict(set)
        self._type_index: Dict[str, Set[str]] = defaultdict(set)
        self._tag_index: Dict[str, Set[str]] = defaultdict(set)
        self._scorer = TFIDFScorer()

    def add_document(self, document: SearchDocument):
        """Add or update a document in the index."""
        document.tokenize()
        self._documents[document.id] = document

        # Update inverted index
        all_tokens = set(document._title_tokens + document._content_tokens)
        for token in all_tokens:
            self._inverted_index[token].add(document.id)

        # Update type index
        self._type_index[document.entity_type.value].add(document.id)

        # Update tag index
        for tag in document.tags:
            self._tag_index[tag.lower()].add(document.id)

    def remove_document(self, doc_id: str):
        """Remove a document from the index."""
        doc = self._documents.pop(doc_id, None)
        if not doc:
            return

        # Clean inverted index
        all_tokens = set(doc._title_tokens + doc._content_tokens)
        for token in all_tokens:
            self._inverted_index[token].discard(doc_id)

        # Clean type index
        self._type_index[doc.entity_type.value].discard(doc_id)

        # Clean tag index
        for tag in doc.tags:
            self._tag_index[tag.lower()].discard(doc_id)

    def search(self, query_tokens: List[str], filters: Optional[SearchFilter] = None) -> Set[str]:
        """Find candidate document IDs matching query tokens."""
        if not query_tokens:
            return set(self._documents.keys())

        # Union of all token matches
        candidate_ids = set()
        for token in query_tokens:
            # Exact token match
            if token in self._inverted_index:
                candidate_ids.update(self._inverted_index[token])

            # Prefix match for partial queries
            for indexed_token, doc_ids in self._inverted_index.items():
                if indexed_token.startswith(token) or token.startswith(indexed_token):
                    candidate_ids.update(doc_ids)

            # Stemmed match
            stemmed = Tokenizer.stem(token)
            for indexed_token, doc_ids in self._inverted_index.items():
                if Tokenizer.stem(indexed_token) == stemmed:
                    candidate_ids.update(doc_ids)

        # Apply filters
        if filters:
            candidate_ids = self._apply_filters(candidate_ids, filters)

        return candidate_ids

    def _apply_filters(self, candidates: Set[str], filters: SearchFilter) -> Set[str]:
        filtered = set()
        for doc_id in candidates:
            doc = self._documents.get(doc_id)
            if not doc:
                continue

            if filters.entity_types and doc.entity_type not in filters.entity_types:
                continue
            if filters.date_from and doc.created_at < filters.date_from:
                continue
            if filters.date_to and doc.created_at > filters.date_to:
                continue
            if filters.tags:
                if not any(t.lower() in [tag.lower() for tag in doc.tags] for t in filters.tags):
                    continue
            if filters.owner_id and doc.owner_id != filters.owner_id:
                continue
            if filters.access_level and doc.access_level != filters.access_level:
                continue
            if filters.metadata_filters:
                match = True
                for key, value in filters.metadata_filters.items():
                    if doc.metadata.get(key) != value:
                        match = False
                        break
                if not match:
                    continue

            filtered.add(doc_id)

        return filtered

    def rebuild_statistics(self):
        """Rebuild IDF statistics."""
        self._scorer.update_statistics(self._documents)

    def get_document(self, doc_id: str) -> Optional[SearchDocument]:
        return self._documents.get(doc_id)

    @property
    def document_count(self) -> int:
        return len(self._documents)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_documents": len(self._documents),
            "unique_tokens": len(self._inverted_index),
            "entity_types": {k: len(v) for k, v in self._type_index.items()},
            "total_tags": len(self._tag_index),
        }


# ============================================================================
# Search Suggestions
# ============================================================================

class SearchSuggestionEngine:
    """Provides search suggestions and autocomplete."""

    def __init__(self):
        self._popular_queries: Dict[str, int] = defaultdict(int)
        self._recent_queries: List[Tuple[str, datetime]] = []
        self._max_recent = 1000
        self._medical_terms = [
            "mammogram", "colonoscopy", "biopsy", "chemotherapy", "radiation",
            "immunotherapy", "MRI", "CT scan", "PET scan", "ultrasound",
            "blood test", "CBC", "metabolic panel", "thyroid", "lipid panel",
            "hemoglobin", "platelet", "white blood cell", "PSA", "CA-125",
            "BRCA", "HER2", "estrogen receptor", "progesterone receptor",
            "tumor marker", "genomic", "genetic testing", "biopsy",
            "stage", "grade", "prognosis", "remission", "metastasis",
            "lymph node", "oncology", "hematology", "pathology", "radiology",
            "surgical oncology", "radiation oncology", "medical oncology",
            "palliative care", "hospice", "clinical trial", "survival rate",
            "five year survival", "recurrence", "relapse",
        ]

    def record_query(self, query: str):
        self._popular_queries[query.lower()] += 1
        self._recent_queries.append((query, datetime.utcnow()))
        if len(self._recent_queries) > self._max_recent:
            self._recent_queries = self._recent_queries[-self._max_recent:]

    def suggest(self, prefix: str, limit: int = 10) -> List[str]:
        """Get autocomplete suggestions for a prefix."""
        prefix_lower = prefix.lower()
        suggestions = []

        # From popular queries
        for query, count in sorted(self._popular_queries.items(), key=lambda x: -x[1]):
            if query.startswith(prefix_lower):
                suggestions.append(query)

        # From medical terms
        for term in self._medical_terms:
            if term.lower().startswith(prefix_lower) and term.lower() not in suggestions:
                suggestions.append(term)

        return suggestions[:limit]

    def get_trending(self, hours: int = 24, limit: int = 10) -> List[Tuple[str, int]]:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_counts = defaultdict(int)
        for query, ts in self._recent_queries:
            if ts >= cutoff:
                recent_counts[query.lower()] += 1
        return sorted(recent_counts.items(), key=lambda x: -x[1])[:limit]


# ============================================================================
# Snippet Generator
# ============================================================================

class SnippetGenerator:
    """Generates highlighted text snippets for search results."""

    MAX_SNIPPET_LENGTH = 250
    CONTEXT_WORDS = 10

    @classmethod
    def generate(cls, content: str, query_tokens: List[str]) -> str:
        """Generate a relevant snippet highlighting query terms."""
        if not content:
            return ""

        content_lower = content.lower()

        # Find the best position (where most query tokens appear nearby)
        best_pos = 0
        best_score = 0

        words = content.split()
        for i, word in enumerate(words):
            score = 0
            for token in query_tokens:
                if token in word.lower():
                    score += 1
                    # Check nearby words
                    for j in range(max(0, i - 5), min(len(words), i + 5)):
                        for t in query_tokens:
                            if t in words[j].lower():
                                score += 0.5
            if score > best_score:
                best_score = score
                best_pos = i

        # Extract snippet around best position
        start = max(0, best_pos - cls.CONTEXT_WORDS)
        end = min(len(words), best_pos + cls.CONTEXT_WORDS)
        snippet_words = words[start:end]

        snippet = " ".join(snippet_words)
        if start > 0:
            snippet = "..." + snippet
        if end < len(words):
            snippet += "..."

        # Truncate if too long
        if len(snippet) > cls.MAX_SNIPPET_LENGTH:
            snippet = snippet[:cls.MAX_SNIPPET_LENGTH] + "..."

        return snippet

    @classmethod
    def highlight(cls, text: str, query_tokens: List[str], tag: str = "mark") -> str:
        """Add highlight tags around matching terms."""
        result = text
        for token in query_tokens:
            pattern = re.compile(re.escape(token), re.IGNORECASE)
            result = pattern.sub(f"<{tag}>\\g<0></{tag}>", result)
        return result


# ============================================================================
# Search Analytics
# ============================================================================

class SearchAnalytics:
    """Tracks search usage and performance."""

    def __init__(self):
        self._total_searches = 0
        self._total_time_ms = 0
        self._zero_result_queries: List[str] = []
        self._query_counts: Dict[str, int] = defaultdict(int)
        self._entity_type_searches: Dict[str, int] = defaultdict(int)
        self._hourly_volume: Dict[int, int] = defaultdict(int)
        self._avg_results_count: List[int] = []

    def record_search(self, query: str, result_count: int, took_ms: float,
                      entity_types: Optional[List[str]] = None):
        self._total_searches += 1
        self._total_time_ms += took_ms
        self._query_counts[query.lower()] += 1
        self._hourly_volume[datetime.utcnow().hour] += 1
        self._avg_results_count.append(result_count)

        if result_count == 0:
            self._zero_result_queries.append(query)

        if entity_types:
            for et in entity_types:
                self._entity_type_searches[et] += 1

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_searches": self._total_searches,
            "avg_response_time_ms": round(self._total_time_ms / max(self._total_searches, 1), 2),
            "avg_result_count": round(sum(self._avg_results_count) / max(len(self._avg_results_count), 1), 1),
            "zero_result_rate": round(len(self._zero_result_queries) / max(self._total_searches, 1) * 100, 1),
            "top_queries": sorted(self._query_counts.items(), key=lambda x: -x[1])[:20],
            "entity_type_distribution": dict(self._entity_type_searches),
            "hourly_volume": dict(self._hourly_volume),
            "recent_zero_results": self._zero_result_queries[-10:],
        }


# ============================================================================
# Search Service
# ============================================================================

class SearchService:
    """Main search service for the CancerGuard AI platform."""

    def __init__(self):
        self.index = SearchIndex()
        self.suggestions = SearchSuggestionEngine()
        self.analytics = SearchAnalytics()
        self._snippet_gen = SnippetGenerator()
        self._load_sample_data()

    def search(
        self,
        query: str,
        entity_types: Optional[List[SearchEntityType]] = None,
        filters: Optional[SearchFilter] = None,
        sort_by: SortOrder = SortOrder.RELEVANCE,
        page: int = 1,
        page_size: int = 20,
        expand_synonyms: bool = True,
    ) -> SearchResponse:
        """Execute a search query."""
        start_time = time.time()

        if not filters:
            filters = SearchFilter()
        if entity_types:
            filters.entity_types = entity_types

        # Tokenize and expand query
        query_tokens = Tokenizer.tokenize(query)
        if expand_synonyms:
            expanded = Tokenizer.expand_query(query)
            for exp in expanded[1:]:
                query_tokens.extend(Tokenizer.tokenize(exp))
            query_tokens = list(set(query_tokens))

        # Search index for candidates
        candidate_ids = self.index.search(query_tokens, filters)

        # Score candidates
        scored_results: List[Tuple[str, float]] = []
        for doc_id in candidate_ids:
            doc = self.index.get_document(doc_id)
            if not doc:
                continue

            score = self.index._scorer.score(query_tokens, doc)
            score += self.index._scorer.score_exact_match(query, doc)

            if score >= filters.min_score:
                scored_results.append((doc_id, score))

        # Sort
        if sort_by == SortOrder.RELEVANCE:
            scored_results.sort(key=lambda x: -x[1])
        elif sort_by == SortOrder.DATE_DESC:
            scored_results.sort(key=lambda x: -(self.index.get_document(x[0]).created_at.timestamp() if self.index.get_document(x[0]) else 0))
        elif sort_by == SortOrder.DATE_ASC:
            scored_results.sort(key=lambda x: (self.index.get_document(x[0]).created_at.timestamp() if self.index.get_document(x[0]) else 0))

        total = len(scored_results)

        # Pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_results = scored_results[start_idx:end_idx]

        # Build results
        results = []
        for doc_id, score in page_results:
            doc = self.index.get_document(doc_id)
            if not doc:
                continue

            snippet = self._snippet_gen.generate(doc.content, query_tokens)
            highlights = [self._snippet_gen.highlight(doc.title, query_tokens)]

            results.append(SearchResult(
                document_id=doc.id,
                entity_type=doc.entity_type.value,
                title=doc.title,
                snippet=snippet,
                score=score,
                metadata=doc.metadata,
                highlights=highlights,
            ))

        # Facets
        facets = self._compute_facets(candidate_ids)

        # Suggestions
        suggestions = self.suggestions.suggest(query, limit=5)

        took_ms = (time.time() - start_time) * 1000

        # Record analytics
        self.suggestions.record_query(query)
        self.analytics.record_search(
            query, total, took_ms,
            [et.value for et in entity_types] if entity_types else None,
        )

        return SearchResponse(
            query=query,
            results=results,
            total=total,
            page=page,
            page_size=page_size,
            took_ms=took_ms,
            facets=facets,
            suggestions=suggestions,
        )

    def _compute_facets(self, candidate_ids: Set[str]) -> Dict[str, Dict[str, int]]:
        facets: Dict[str, Dict[str, int]] = {"entity_type": defaultdict(int), "tags": defaultdict(int)}
        for doc_id in candidate_ids:
            doc = self.index.get_document(doc_id)
            if not doc:
                continue
            facets["entity_type"][doc.entity_type.value] += 1
            for tag in doc.tags:
                facets["tags"][tag] += 1

        # Sort facets by count
        for facet_name in facets:
            facets[facet_name] = dict(sorted(facets[facet_name].items(), key=lambda x: -x[1])[:20])
        return facets

    def add_to_index(self, entity_type: SearchEntityType, entity_id: str,
                     title: str, content: str, metadata: Optional[Dict] = None,
                     tags: Optional[List[str]] = None, boost: float = 1.0,
                     owner_id: Optional[str] = None, access_level: str = "public"):
        """Add an entity to the search index."""
        doc = SearchDocument(
            id=entity_id,
            entity_type=entity_type,
            title=title,
            content=content,
            metadata=metadata or {},
            tags=tags or [],
            boost=boost,
            owner_id=owner_id,
            access_level=access_level,
        )
        self.index.add_document(doc)
        self.index.rebuild_statistics()

    def remove_from_index(self, entity_id: str):
        self.index.remove_document(entity_id)
        self.index.rebuild_statistics()

    def get_suggestions(self, prefix: str, limit: int = 10) -> List[str]:
        return self.suggestions.suggest(prefix, limit)

    def get_trending_searches(self, hours: int = 24, limit: int = 10) -> List[Dict[str, Any]]:
        trending = self.suggestions.get_trending(hours, limit)
        return [{"query": q, "count": c} for q, c in trending]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "index": self.index.get_stats(),
            "analytics": self.analytics.get_stats(),
        }

    def _load_sample_data(self):
        """Load sample searchable data for development."""
        sample_entities = [
            {
                "type": SearchEntityType.PATIENT,
                "id": "patient-1",
                "title": "John Smith - Patient Profile",
                "content": "Male patient, 55 years old. History of type 2 diabetes and hypertension. Family history of colon cancer. Regular cancer screenings recommended. Currently on metformin and lisinopril.",
                "tags": ["diabetes", "hypertension", "cancer-screening", "male"],
                "metadata": {"age": 55, "gender": "male", "risk_level": "moderate"},
            },
            {
                "type": SearchEntityType.PATIENT,
                "id": "patient-2",
                "title": "Sarah Johnson - Patient Profile",
                "content": "Female patient, 42 years old. BRCA1 positive. Annual mammogram and breast MRI recommended. No current medications. Family history of breast and ovarian cancer.",
                "tags": ["brca1", "breast-cancer", "genetic", "female", "high-risk"],
                "metadata": {"age": 42, "gender": "female", "risk_level": "high"},
            },
            {
                "type": SearchEntityType.HEALTH_RECORD,
                "id": "record-1",
                "title": "Annual Physical Exam - John Smith",
                "content": "Blood pressure 140/90, heart rate 78, BMI 28.5. Fasting glucose 126 mg/dL elevated. HbA1c 7.2%. Total cholesterol 220, LDL 145. Recommended dietary changes and exercise program.",
                "tags": ["physical-exam", "diabetes", "cholesterol"],
                "metadata": {"patient_id": "patient-1", "date": "2024-01-15"},
            },
            {
                "type": SearchEntityType.LAB_RESULT,
                "id": "lab-1",
                "title": "Complete Blood Count (CBC) - Sarah Johnson",
                "content": "WBC 6.5 (normal), RBC 4.2 (normal), Hemoglobin 13.1 (normal), Hematocrit 39.2 (normal), Platelet 250 (normal). All values within normal range.",
                "tags": ["cbc", "blood-test", "normal"],
                "metadata": {"patient_id": "patient-2", "status": "normal"},
            },
            {
                "type": SearchEntityType.MEDICATION,
                "id": "med-1",
                "title": "Metformin 500mg - Diabetes Management",
                "content": "Metformin HCl 500mg tablets. Used for type 2 diabetes mellitus. Take twice daily with meals. Common side effects: nausea, diarrhea, stomach upset. Contraindicated in severe renal impairment.",
                "tags": ["diabetes", "oral-medication", "metformin"],
                "metadata": {"drug_class": "biguanide", "route": "oral"},
            },
            {
                "type": SearchEntityType.DIAGNOSIS,
                "id": "diag-1",
                "title": "Type 2 Diabetes Mellitus (E11.9)",
                "content": "Type 2 diabetes mellitus without complications. Characterized by insulin resistance and relative insulin deficiency. ICD-10: E11.9. Management includes lifestyle modifications, oral medications, and monitoring.",
                "tags": ["diabetes", "endocrine", "chronic"],
                "metadata": {"icd10": "E11.9", "category": "endocrine"},
            },
            {
                "type": SearchEntityType.CLINICAL_TRIAL,
                "id": "trial-1",
                "title": "Phase III: Novel Immunotherapy for BRCA-Mutated Breast Cancer",
                "content": "Randomized controlled trial evaluating pembrolizumab plus chemotherapy vs chemotherapy alone in BRCA-mutated advanced breast cancer patients. Primary endpoint: progression-free survival. Enrolling up to 500 participants.",
                "tags": ["immunotherapy", "breast-cancer", "brca", "pembrolizumab", "phase-3"],
                "metadata": {"phase": "III", "status": "recruiting", "sponsor": "National Cancer Institute"},
            },
            {
                "type": SearchEntityType.PROCEDURE,
                "id": "proc-1",
                "title": "Digital Mammography Screening",
                "content": "Digital mammography (full-field digital mammography, FFDM) for breast cancer screening. Recommended annually for women 40+ or earlier for high-risk patients. CPT: 77067. Typical duration: 20 minutes.",
                "tags": ["mammography", "screening", "breast-cancer", "imaging"],
                "metadata": {"cpt": "77067", "duration_minutes": 20},
            },
            {
                "type": SearchEntityType.DRUG,
                "id": "drug-1",
                "title": "Pembrolizumab (Keytruda)",
                "content": "Pembrolizumab is a programmed death receptor-1 (PD-1) blocking antibody indicated for melanoma, non-small cell lung cancer, head and neck squamous cell carcinoma, Hodgkin lymphoma, and other cancers. Administered IV every 3 weeks.",
                "tags": ["immunotherapy", "pd-1", "checkpoint-inhibitor", "iv"],
                "metadata": {"brand_name": "Keytruda", "manufacturer": "Merck"},
            },
            {
                "type": SearchEntityType.GENE,
                "id": "gene-1",
                "title": "BRCA1 - Breast Cancer Susceptibility Gene 1",
                "content": "BRCA1 gene located on chromosome 17. Mutations associated with increased risk of breast cancer (60-80% lifetime risk) and ovarian cancer (20-40% lifetime risk). Tumor suppressor gene involved in DNA damage repair.",
                "tags": ["brca1", "breast-cancer", "ovarian-cancer", "tumor-suppressor"],
                "metadata": {"chromosome": "17", "function": "DNA repair"},
            },
            {
                "type": SearchEntityType.PROVIDER,
                "id": "provider-1",
                "title": "Dr. Emily Chen - Oncologist",
                "content": "Board-certified medical oncologist specializing in breast cancer and genomic medicine. 15 years experience. Published 50+ peer-reviewed articles. Expertise in immunotherapy and targeted therapy.",
                "tags": ["oncology", "breast-cancer", "genomics"],
                "metadata": {"specialty": "Medical Oncology", "experience_years": 15},
            },
            {
                "type": SearchEntityType.RESEARCH_PAPER,
                "id": "paper-1",
                "title": "AI-Driven Early Detection of Colorectal Cancer from Blood Biomarkers",
                "content": "This study presents a machine learning model achieving 95% sensitivity and 92% specificity for early-stage colorectal cancer detection using circulating tumor DNA analysis. The model uses a gradient boosting classifier trained on 10,000 patient samples.",
                "tags": ["ai", "colorectal-cancer", "ctdna", "machine-learning", "early-detection"],
                "metadata": {"journal": "Nature Medicine", "year": 2024, "impact_factor": 87.2},
            },
        ]

        for entity in sample_entities:
            self.add_to_index(
                entity_type=entity["type"],
                entity_id=entity["id"],
                title=entity["title"],
                content=entity["content"],
                tags=entity.get("tags", []),
                metadata=entity.get("metadata", {}),
            )


# Singleton instance
search_service = SearchService()

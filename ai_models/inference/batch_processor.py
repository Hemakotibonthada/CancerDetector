"""
Batch Prediction Processor - Handles large-scale batch predictions with
parallel processing, progress tracking, result aggregation, and export.
"""

import logging
import time
import uuid
import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


class BatchStatus(Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PARTIALLY_COMPLETED = "partially_completed"


class OutputFormat(Enum):
    JSON = "json"
    CSV = "csv"
    NUMPY = "numpy"
    PARQUET = "parquet"


@dataclass
class BatchJob:
    job_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    model_name: str = ""
    model_version: str = "latest"
    total_samples: int = 0
    processed_samples: int = 0
    successful_predictions: int = 0
    failed_predictions: int = 0
    status: str = BatchStatus.QUEUED.value
    progress: float = 0.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    elapsed_seconds: float = 0.0
    estimated_remaining_seconds: float = 0.0
    output_path: str = ""
    output_format: str = "json"
    error_log: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class BatchResult:
    job_id: str = ""
    model_name: str = ""
    total_samples: int = 0
    successful: int = 0
    failed: int = 0
    results: List[Dict] = field(default_factory=list)
    summary_stats: Dict = field(default_factory=dict)
    processing_time_seconds: float = 0.0
    throughput_samples_per_sec: float = 0.0
    output_path: str = ""

    def to_dict(self) -> Dict:
        return asdict(self)


class BatchDataLoader:
    """Load and chunk data for batch processing."""

    @staticmethod
    def load_from_array(data: np.ndarray, chunk_size: int = 100) -> List[np.ndarray]:
        """Split array into chunks."""
        n = len(data)
        chunks = []
        for i in range(0, n, chunk_size):
            chunks.append(data[i:i + chunk_size])
        return chunks

    @staticmethod
    def load_from_dicts(data: List[Dict], chunk_size: int = 100) -> List[List[Dict]]:
        """Split list of dicts into chunks."""
        chunks = []
        for i in range(0, len(data), chunk_size):
            chunks.append(data[i:i + chunk_size])
        return chunks

    @staticmethod
    def load_from_csv(file_path: str, chunk_size: int = 100) -> List[List[Dict]]:
        """Load CSV file in chunks."""
        data = []
        try:
            with open(file_path, "r") as f:
                lines = f.readlines()
                if not lines:
                    return []
                headers = lines[0].strip().split(",")
                for line in lines[1:]:
                    values = line.strip().split(",")
                    row = {}
                    for h, v in zip(headers, values):
                        try:
                            row[h] = float(v)
                        except ValueError:
                            row[h] = v
                    data.append(row)
        except Exception as e:
            logger.error(f"Failed to load CSV: {e}")
            return []

        chunks = []
        for i in range(0, len(data), chunk_size):
            chunks.append(data[i:i + chunk_size])
        return chunks

    @staticmethod
    def load_from_json(file_path: str, chunk_size: int = 100) -> List[List[Dict]]:
        """Load JSON file in chunks."""
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
            if isinstance(data, list):
                chunks = []
                for i in range(0, len(data), chunk_size):
                    chunks.append(data[i:i + chunk_size])
                return chunks
        except Exception as e:
            logger.error(f"Failed to load JSON: {e}")
        return []


class ResultAggregator:
    """Aggregate and analyze batch prediction results."""

    @staticmethod
    def aggregate_classification(results: List[Dict]) -> Dict:
        """Aggregate classification results."""
        if not results:
            return {}

        predictions = [r.get("predicted_label", "") for r in results if r.get("status") == "completed"]
        confidences = [r.get("confidence", 0) for r in results if r.get("status") == "completed"]

        # Class distribution
        class_counts = defaultdict(int)
        class_confidences = defaultdict(list)
        for pred, conf in zip(predictions, confidences):
            class_counts[pred] += 1
            class_confidences[pred].append(conf)

        total = len(predictions)
        class_distribution = {
            cls: {
                "count": count,
                "percentage": round(count / total * 100, 2) if total > 0 else 0,
                "avg_confidence": round(float(np.mean(class_confidences[cls])), 4),
                "min_confidence": round(float(np.min(class_confidences[cls])), 4),
                "max_confidence": round(float(np.max(class_confidences[cls])), 4),
            }
            for cls, count in class_counts.items()
        }

        # Confidence statistics
        confidence_stats = {
            "mean": round(float(np.mean(confidences)), 4) if confidences else 0,
            "std": round(float(np.std(confidences)), 4) if confidences else 0,
            "min": round(float(np.min(confidences)), 4) if confidences else 0,
            "max": round(float(np.max(confidences)), 4) if confidences else 0,
            "median": round(float(np.median(confidences)), 4) if confidences else 0,
        }

        # Low confidence predictions (need review)
        low_confidence = [r for r in results if r.get("confidence", 0) < 0.7 and r.get("status") == "completed"]

        return {
            "total_predictions": total,
            "class_distribution": class_distribution,
            "confidence_statistics": confidence_stats,
            "low_confidence_count": len(low_confidence),
            "low_confidence_percentage": round(len(low_confidence) / total * 100, 2) if total > 0 else 0,
        }

    @staticmethod
    def aggregate_regression(results: List[Dict]) -> Dict:
        """Aggregate regression results."""
        values = [r.get("predicted_value", 0) for r in results if r.get("status") == "completed"]
        if not values:
            return {}

        return {
            "total_predictions": len(values),
            "mean": round(float(np.mean(values)), 4),
            "std": round(float(np.std(values)), 4),
            "min": round(float(np.min(values)), 4),
            "max": round(float(np.max(values)), 4),
            "median": round(float(np.median(values)), 4),
            "percentiles": {
                "p10": round(float(np.percentile(values, 10)), 4),
                "p25": round(float(np.percentile(values, 25)), 4),
                "p75": round(float(np.percentile(values, 75)), 4),
                "p90": round(float(np.percentile(values, 90)), 4),
            },
        }

    @staticmethod
    def aggregate_risk_scores(results: List[Dict]) -> Dict:
        """Aggregate risk prediction results for population health."""
        if not results:
            return {}

        scores = [r.get("risk_score", r.get("predicted_value", 0)) for r in results if r.get("status") == "completed"]

        # Risk stratification
        high_risk = [s for s in scores if s >= 0.7]
        medium_risk = [s for s in scores if 0.3 <= s < 0.7]
        low_risk = [s for s in scores if s < 0.3]

        total = len(scores)
        return {
            "total_screened": total,
            "risk_stratification": {
                "high_risk": {
                    "count": len(high_risk),
                    "percentage": round(len(high_risk) / total * 100, 2) if total > 0 else 0,
                    "avg_score": round(float(np.mean(high_risk)), 4) if high_risk else 0,
                },
                "medium_risk": {
                    "count": len(medium_risk),
                    "percentage": round(len(medium_risk) / total * 100, 2) if total > 0 else 0,
                    "avg_score": round(float(np.mean(medium_risk)), 4) if medium_risk else 0,
                },
                "low_risk": {
                    "count": len(low_risk),
                    "percentage": round(len(low_risk) / total * 100, 2) if total > 0 else 0,
                    "avg_score": round(float(np.mean(low_risk)), 4) if low_risk else 0,
                },
            },
            "population_risk_score": round(float(np.mean(scores)), 4) if scores else 0,
        }


class ResultExporter:
    """Export batch results in various formats."""

    @staticmethod
    def to_json(results: List[Dict], output_path: str):
        """Export results to JSON."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2, default=str)
        logger.info(f"Results exported to JSON: {output_path}")

    @staticmethod
    def to_csv(results: List[Dict], output_path: str):
        """Export results to CSV."""
        if not results:
            return

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Flatten nested dicts
        flat_results = []
        for r in results:
            flat = {}
            for k, v in r.items():
                if isinstance(v, dict):
                    for k2, v2 in v.items():
                        flat[f"{k}_{k2}"] = v2
                elif isinstance(v, list):
                    flat[k] = str(v)
                else:
                    flat[k] = v
            flat_results.append(flat)

        headers = list(flat_results[0].keys())
        with open(output_path, "w") as f:
            f.write(",".join(headers) + "\n")
            for row in flat_results:
                values = [str(row.get(h, "")) for h in headers]
                f.write(",".join(values) + "\n")

        logger.info(f"Results exported to CSV: {output_path}")

    @staticmethod
    def to_report(results: List[Dict], summary: Dict, output_path: str):
        """Generate a comprehensive batch report."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        report = {
            "report_type": "batch_prediction_report",
            "generated_at": datetime.utcnow().isoformat(),
            "summary": summary,
            "sample_results": results[:10],
            "total_results": len(results),
        }

        with open(output_path, "w") as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"Report exported: {output_path}")


class BatchProcessor:
    """Main batch prediction processor."""

    def __init__(self):
        self.jobs: Dict[str, BatchJob] = {}
        self.loader = BatchDataLoader()
        self.aggregator = ResultAggregator()
        self.exporter = ResultExporter()

    async def submit_batch(
        self,
        model_name: str,
        data: Any,
        input_type: str = "tabular",
        chunk_size: int = 100,
        output_format: str = "json",
        output_dir: Optional[str] = None,
    ) -> BatchJob:
        """Submit a batch prediction job."""
        job = BatchJob(
            model_name=model_name,
            output_format=output_format,
        )

        # Determine data size and create chunks
        if isinstance(data, np.ndarray):
            chunks = self.loader.load_from_array(data, chunk_size)
            job.total_samples = len(data)
        elif isinstance(data, list):
            chunks = self.loader.load_from_dicts(data, chunk_size)
            job.total_samples = len(data)
        elif isinstance(data, str) and data.endswith(".csv"):
            chunks = self.loader.load_from_csv(data, chunk_size)
            job.total_samples = sum(len(c) for c in chunks)
        elif isinstance(data, str) and data.endswith(".json"):
            chunks = self.loader.load_from_json(data, chunk_size)
            job.total_samples = sum(len(c) for c in chunks)
        else:
            job.status = BatchStatus.FAILED.value
            job.error_log.append(f"Unsupported data type: {type(data)}")
            self.jobs[job.job_id] = job
            return job

        # Set output path
        output_dir = output_dir or str(BASE_DIR / "saved_models" / "batch_results")
        os.makedirs(output_dir, exist_ok=True)
        job.output_path = os.path.join(output_dir, f"{job.job_id}.{output_format}")

        self.jobs[job.job_id] = job

        # Process
        await self._process_batch(job, chunks, input_type)

        return job

    async def _process_batch(
        self,
        job: BatchJob,
        chunks: List,
        input_type: str,
    ):
        """Process batch chunks."""
        from .engine import inference_engine

        job.status = BatchStatus.PROCESSING.value
        job.start_time = datetime.utcnow().isoformat()
        start = time.time()

        all_results = []

        for chunk_idx, chunk in enumerate(chunks):
            chunk_start = time.time()

            try:
                if isinstance(chunk, np.ndarray):
                    # Process array chunk
                    for i in range(len(chunk)):
                        sample = chunk[i:i + 1]
                        try:
                            from .engine import PredictionRequest
                            request = PredictionRequest(
                                model_name=job.model_name,
                                input_data=sample,
                                input_type=input_type,
                            )
                            result = await inference_engine.predict(request)
                            all_results.append(result.to_dict())
                            job.successful_predictions += 1
                        except Exception as e:
                            all_results.append({"status": "failed", "error": str(e)})
                            job.failed_predictions += 1
                            job.error_log.append(f"Sample {job.processed_samples}: {e}")

                        job.processed_samples += 1

                elif isinstance(chunk, list):
                    for item in chunk:
                        try:
                            from .engine import PredictionRequest
                            request = PredictionRequest(
                                model_name=job.model_name,
                                input_data=item,
                                input_type=input_type,
                            )
                            result = await inference_engine.predict(request)
                            all_results.append(result.to_dict())
                            job.successful_predictions += 1
                        except Exception as e:
                            all_results.append({"status": "failed", "error": str(e)})
                            job.failed_predictions += 1
                            job.error_log.append(f"Sample {job.processed_samples}: {e}")

                        job.processed_samples += 1

            except Exception as e:
                job.error_log.append(f"Chunk {chunk_idx} failed: {e}")

            # Update progress
            elapsed = time.time() - start
            job.progress = round(job.processed_samples / max(job.total_samples, 1) * 100, 2)
            job.elapsed_seconds = round(elapsed, 2)

            if job.processed_samples > 0:
                rate = job.processed_samples / elapsed
                remaining = job.total_samples - job.processed_samples
                job.estimated_remaining_seconds = round(remaining / rate, 2) if rate > 0 else 0

        # Finalize
        job.end_time = datetime.utcnow().isoformat()
        total_time = time.time() - start
        job.elapsed_seconds = round(total_time, 2)

        if job.failed_predictions > 0 and job.successful_predictions > 0:
            job.status = BatchStatus.PARTIALLY_COMPLETED.value
        elif job.failed_predictions == job.total_samples:
            job.status = BatchStatus.FAILED.value
        else:
            job.status = BatchStatus.COMPLETED.value

        # Aggregate results
        summary = self.aggregator.aggregate_classification(all_results)

        # Export results
        try:
            if job.output_format == "json":
                self.exporter.to_json(all_results, job.output_path)
            elif job.output_format == "csv":
                self.exporter.to_csv(all_results, job.output_path)

            # Also generate report
            report_path = job.output_path.replace(f".{job.output_format}", "_report.json")
            self.exporter.to_report(all_results, summary, report_path)
        except Exception as e:
            logger.error(f"Export failed: {e}")
            job.error_log.append(f"Export failed: {e}")

        logger.info(
            f"Batch job {job.job_id} completed: "
            f"{job.successful_predictions}/{job.total_samples} successful in {total_time:.1f}s"
        )

    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get job status."""
        job = self.jobs.get(job_id)
        return job.to_dict() if job else None

    def get_all_jobs(self) -> List[Dict]:
        """Get all batch jobs."""
        return [job.to_dict() for job in self.jobs.values()]

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a batch job."""
        job = self.jobs.get(job_id)
        if job and job.status == BatchStatus.PROCESSING.value:
            job.status = BatchStatus.CANCELLED.value
            return True
        return False


# Singleton
batch_processor = BatchProcessor()

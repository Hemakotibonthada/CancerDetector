"""
Cache and Queue Service - In-memory caching with TTL, distributed-style cache,
task queues, and pub/sub messaging for the CancerGuard AI platform.
"""

import asyncio
import hashlib
import json
import logging
import time
import uuid
from collections import OrderedDict, defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Coroutine, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


# ============================================================================
# Enums
# ============================================================================

class CacheStrategy(str, Enum):
    LRU = "lru"
    LFU = "lfu"
    TTL = "ttl"
    WRITE_THROUGH = "write_through"
    WRITE_BACK = "write_back"


class CacheRegion(str, Enum):
    DEFAULT = "default"
    SESSION = "session"
    QUERY = "query"
    API_RESPONSE = "api_response"
    FHIR_RESOURCE = "fhir_resource"
    ML_PREDICTION = "ml_prediction"
    DASHBOARD = "dashboard"
    REPORT = "report"
    SEARCH = "search"
    USER_PROFILE = "user_profile"
    ANALYTICS = "analytics"
    CONFIGURATION = "configuration"


class QueuePriority(int, Enum):
    CRITICAL = 0
    HIGH = 1
    NORMAL = 2
    LOW = 3
    BACKGROUND = 4


class TaskStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"
    TIMEOUT = "timeout"


class MessageType(str, Enum):
    PATIENT_CREATED = "patient.created"
    PATIENT_UPDATED = "patient.updated"
    APPOINTMENT_SCHEDULED = "appointment.scheduled"
    APPOINTMENT_CANCELLED = "appointment.cancelled"
    LAB_RESULT_READY = "lab.result.ready"
    LAB_RESULT_ABNORMAL = "lab.result.abnormal"
    VITAL_ALERT = "vital.alert"
    MEDICATION_DUE = "medication.due"
    SCREENING_DUE = "screening.due"
    RISK_SCORE_UPDATED = "risk.score.updated"
    ML_PREDICTION_COMPLETE = "ml.prediction.complete"
    REPORT_GENERATED = "report.generated"
    NOTIFICATION_SENT = "notification.sent"
    SYSTEM_ALERT = "system.alert"
    CACHE_INVALIDATED = "cache.invalidated"
    SYNC_COMPLETED = "sync.completed"
    BILLING_PROCESSED = "billing.processed"
    CLINICAL_TRIAL_MATCH = "clinical.trial.match"
    GENOMIC_REPORT_READY = "genomic.report.ready"
    TELEHEALTH_SESSION_STARTED = "telehealth.session.started"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class CacheEntry:
    key: str
    value: Any
    region: CacheRegion
    created_at: float = field(default_factory=time.time)
    expires_at: Optional[float] = None
    access_count: int = 0
    last_accessed: float = field(default_factory=time.time)
    size_bytes: int = 0
    tags: Set[str] = field(default_factory=set)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_expired(self) -> bool:
        return self.expires_at is not None and time.time() > self.expires_at

    @property
    def ttl_remaining(self) -> Optional[float]:
        if self.expires_at is None:
            return None
        return max(0, self.expires_at - time.time())


@dataclass
class QueueTask:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    handler: str = ""
    args: Dict[str, Any] = field(default_factory=dict)
    priority: QueuePriority = QueuePriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Any = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    timeout_seconds: int = 300
    queue_name: str = "default"
    progress: float = 0.0


@dataclass
class PubSubMessage:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    topic: str = ""
    message_type: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    published_at: datetime = field(default_factory=datetime.utcnow)
    publisher_id: Optional[str] = None
    correlation_id: Optional[str] = None
    headers: Dict[str, str] = field(default_factory=dict)
    delivery_count: int = 0


# ============================================================================
# Multi-Region Cache
# ============================================================================

class CacheRegionConfig:
    """Configuration for a cache region."""

    DEFAULTS = {
        CacheRegion.DEFAULT: {"max_size": 10000, "default_ttl": 300, "strategy": CacheStrategy.LRU},
        CacheRegion.SESSION: {"max_size": 5000, "default_ttl": 1800, "strategy": CacheStrategy.TTL},
        CacheRegion.QUERY: {"max_size": 2000, "default_ttl": 60, "strategy": CacheStrategy.LRU},
        CacheRegion.API_RESPONSE: {"max_size": 5000, "default_ttl": 120, "strategy": CacheStrategy.LRU},
        CacheRegion.FHIR_RESOURCE: {"max_size": 3000, "default_ttl": 600, "strategy": CacheStrategy.LRU},
        CacheRegion.ML_PREDICTION: {"max_size": 1000, "default_ttl": 3600, "strategy": CacheStrategy.LFU},
        CacheRegion.DASHBOARD: {"max_size": 500, "default_ttl": 180, "strategy": CacheStrategy.TTL},
        CacheRegion.REPORT: {"max_size": 200, "default_ttl": 900, "strategy": CacheStrategy.LFU},
        CacheRegion.SEARCH: {"max_size": 3000, "default_ttl": 60, "strategy": CacheStrategy.LRU},
        CacheRegion.USER_PROFILE: {"max_size": 5000, "default_ttl": 600, "strategy": CacheStrategy.LFU},
        CacheRegion.ANALYTICS: {"max_size": 500, "default_ttl": 300, "strategy": CacheStrategy.TTL},
        CacheRegion.CONFIGURATION: {"max_size": 200, "default_ttl": 3600, "strategy": CacheStrategy.LFU},
    }

    @classmethod
    def get(cls, region: CacheRegion) -> Dict[str, Any]:
        return cls.DEFAULTS.get(region, cls.DEFAULTS[CacheRegion.DEFAULT])


class MultiRegionCache:
    """Multi-region cache with different eviction strategies."""

    def __init__(self):
        self._regions: Dict[CacheRegion, OrderedDict[str, CacheEntry]] = {
            region: OrderedDict() for region in CacheRegion
        }
        self._tag_index: Dict[str, Set[str]] = defaultdict(set)
        self._stats = {
            "hits": 0, "misses": 0, "evictions": 0,
            "expired": 0, "puts": 0, "invalidations": 0,
            "region_stats": {r.value: {"hits": 0, "misses": 0, "size": 0} for r in CacheRegion},
        }
        self._total_size_bytes = 0
        self._max_total_size_bytes = 500 * 1024 * 1024  # 500MB

    def get(self, key: str, region: CacheRegion = CacheRegion.DEFAULT,
            default: Any = None) -> Any:
        """Get a value from cache."""
        entry = self._regions[region].get(key)
        if entry is None:
            self._stats["misses"] += 1
            self._stats["region_stats"][region.value]["misses"] += 1
            return default

        if entry.is_expired:
            self._remove_entry(key, region)
            self._stats["expired"] += 1
            self._stats["misses"] += 1
            return default

        entry.access_count += 1
        entry.last_accessed = time.time()
        self._regions[region].move_to_end(key)

        self._stats["hits"] += 1
        self._stats["region_stats"][region.value]["hits"] += 1
        return entry.value

    def put(self, key: str, value: Any, region: CacheRegion = CacheRegion.DEFAULT,
            ttl: Optional[int] = None, tags: Optional[Set[str]] = None,
            metadata: Optional[Dict[str, Any]] = None) -> None:
        """Put a value into cache."""
        config = CacheRegionConfig.get(region)
        if ttl is None:
            ttl = config["default_ttl"]

        size_bytes = len(str(value).encode("utf-8", errors="ignore"))

        entry = CacheEntry(
            key=key,
            value=value,
            region=region,
            expires_at=time.time() + ttl if ttl > 0 else None,
            size_bytes=size_bytes,
            tags=tags or set(),
            metadata=metadata or {},
        )

        if key in self._regions[region]:
            old_entry = self._regions[region][key]
            self._total_size_bytes -= old_entry.size_bytes

        self._regions[region][key] = entry
        self._regions[region].move_to_end(key)
        self._total_size_bytes += size_bytes

        for tag in entry.tags:
            self._tag_index[tag].add(f"{region.value}:{key}")

        max_size = config["max_size"]
        while len(self._regions[region]) > max_size:
            self._evict(region, config["strategy"])

        self._stats["puts"] += 1
        self._stats["region_stats"][region.value]["size"] = len(self._regions[region])

    def invalidate(self, key: str, region: CacheRegion = CacheRegion.DEFAULT) -> bool:
        """Remove a specific key from cache."""
        if key in self._regions[region]:
            self._remove_entry(key, region)
            self._stats["invalidations"] += 1
            return True
        return False

    def invalidate_by_tag(self, tag: str) -> int:
        """Remove all entries with a specific tag."""
        keys = self._tag_index.get(tag, set()).copy()
        count = 0
        for cache_key in keys:
            parts = cache_key.split(":", 1)
            if len(parts) == 2:
                region_name, key = parts
                try:
                    region = CacheRegion(region_name)
                    if self.invalidate(key, region):
                        count += 1
                except ValueError:
                    pass
        self._tag_index.pop(tag, None)
        return count

    def invalidate_by_pattern(self, pattern: str, region: CacheRegion = CacheRegion.DEFAULT) -> int:
        """Remove entries matching a key pattern (supports * wildcard)."""
        import fnmatch
        keys_to_remove = [
            k for k in self._regions[region].keys()
            if fnmatch.fnmatch(k, pattern)
        ]
        for key in keys_to_remove:
            self._remove_entry(key, region)
        return len(keys_to_remove)

    def invalidate_region(self, region: CacheRegion) -> int:
        """Clear an entire cache region."""
        count = len(self._regions[region])
        for key in list(self._regions[region].keys()):
            self._remove_entry(key, region)
        return count

    def clear_all(self) -> None:
        """Clear all cache regions."""
        for region in CacheRegion:
            self._regions[region].clear()
        self._tag_index.clear()
        self._total_size_bytes = 0

    def _evict(self, region: CacheRegion, strategy: CacheStrategy) -> None:
        """Evict an entry based on strategy."""
        if not self._regions[region]:
            return

        if strategy == CacheStrategy.LRU:
            key = next(iter(self._regions[region]))
        elif strategy == CacheStrategy.LFU:
            key = min(self._regions[region].keys(),
                      key=lambda k: self._regions[region][k].access_count)
        elif strategy == CacheStrategy.TTL:
            key = min(self._regions[region].keys(),
                      key=lambda k: self._regions[region][k].expires_at or float("inf"))
        else:
            key = next(iter(self._regions[region]))

        self._remove_entry(key, region)
        self._stats["evictions"] += 1

    def _remove_entry(self, key: str, region: CacheRegion) -> None:
        """Remove a cache entry and clean up indices."""
        entry = self._regions[region].pop(key, None)
        if entry:
            self._total_size_bytes -= entry.size_bytes
            for tag in entry.tags:
                self._tag_index[tag].discard(f"{region.value}:{key}")
                if not self._tag_index[tag]:
                    del self._tag_index[tag]

    def cleanup_expired(self) -> int:
        """Remove all expired entries across all regions."""
        removed = 0
        for region in CacheRegion:
            expired_keys = [
                k for k, v in self._regions[region].items() if v.is_expired
            ]
            for key in expired_keys:
                self._remove_entry(key, region)
                removed += 1
        self._stats["expired"] += removed
        return removed

    def get_region_info(self, region: CacheRegion) -> Dict[str, Any]:
        """Get information about a cache region."""
        config = CacheRegionConfig.get(region)
        entries = self._regions[region]
        return {
            "region": region.value,
            "size": len(entries),
            "max_size": config["max_size"],
            "utilization": len(entries) / config["max_size"] if config["max_size"] > 0 else 0,
            "default_ttl": config["default_ttl"],
            "strategy": config["strategy"].value,
            "stats": self._stats["region_stats"][region.value],
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        total_entries = sum(len(r) for r in self._regions.values())
        hit_rate = (self._stats["hits"] / max(1, self._stats["hits"] + self._stats["misses"])) * 100

        return {
            "total_entries": total_entries,
            "total_size_bytes": self._total_size_bytes,
            "total_size_mb": round(self._total_size_bytes / (1024 * 1024), 2),
            "max_size_mb": round(self._max_total_size_bytes / (1024 * 1024), 2),
            "hit_rate": round(hit_rate, 2),
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "evictions": self._stats["evictions"],
            "expired": self._stats["expired"],
            "puts": self._stats["puts"],
            "invalidations": self._stats["invalidations"],
            "regions": {r.value: self.get_region_info(r) for r in CacheRegion},
            "tag_count": len(self._tag_index),
        }


# ============================================================================
# Task Queue
# ============================================================================

class TaskQueue:
    """Priority-based task queue with execution tracking."""

    def __init__(self, name: str = "default", max_size: int = 10000,
                 max_concurrent: int = 10):
        self.name = name
        self.max_size = max_size
        self.max_concurrent = max_concurrent
        self._queues: Dict[QueuePriority, deque] = {p: deque() for p in QueuePriority}
        self._active_tasks: Dict[str, QueueTask] = {}
        self._completed_tasks: List[QueueTask] = []
        self._handlers: Dict[str, Callable] = {}
        self._max_completed = 1000
        self._processing = False
        self._stats = {
            "total_enqueued": 0, "total_completed": 0,
            "total_failed": 0, "total_retried": 0,
            "total_timeout": 0, "avg_wait_time_ms": 0,
            "avg_execution_time_ms": 0,
        }

    def register_handler(self, name: str, handler: Callable) -> None:
        """Register a task handler."""
        self._handlers[name] = handler

    def enqueue(self, name: str, handler: str, args: Optional[Dict] = None,
                priority: QueuePriority = QueuePriority.NORMAL,
                max_retries: int = 3, timeout: int = 300) -> str:
        """Add a task to the queue."""
        task = QueueTask(
            name=name,
            handler=handler,
            args=args or {},
            priority=priority,
            status=TaskStatus.QUEUED,
            max_retries=max_retries,
            timeout_seconds=timeout,
            queue_name=self.name,
        )

        total_size = sum(len(q) for q in self._queues.values())
        if total_size >= self.max_size:
            raise RuntimeError(f"Queue {self.name} is full ({self.max_size})")

        self._queues[priority].append(task)
        self._stats["total_enqueued"] += 1
        return task.id

    def dequeue(self) -> Optional[QueueTask]:
        """Get the highest priority task from the queue."""
        if len(self._active_tasks) >= self.max_concurrent:
            return None

        for priority in QueuePriority:
            if self._queues[priority]:
                task = self._queues[priority].popleft()
                task.status = TaskStatus.RUNNING
                task.started_at = datetime.utcnow()
                self._active_tasks[task.id] = task
                return task
        return None

    async def execute_task(self, task: QueueTask) -> Any:
        """Execute a queued task."""
        handler = self._handlers.get(task.handler)
        if not handler:
            task.status = TaskStatus.FAILED
            task.error = f"Handler not found: {task.handler}"
            self._complete_task(task)
            return None

        try:
            if asyncio.iscoroutinefunction(handler):
                result = await asyncio.wait_for(
                    handler(**task.args),
                    timeout=task.timeout_seconds,
                )
            else:
                result = handler(**task.args)

            task.status = TaskStatus.COMPLETED
            task.result = result
            self._stats["total_completed"] += 1

        except asyncio.TimeoutError:
            task.status = TaskStatus.TIMEOUT
            task.error = f"Task timed out after {task.timeout_seconds}s"
            self._stats["total_timeout"] += 1

            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.RETRYING
                self._queues[task.priority].append(task)
                self._stats["total_retried"] += 1
                del self._active_tasks[task.id]
                return None

        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)

            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.RETRYING
                self._queues[task.priority].append(task)
                self._stats["total_retried"] += 1
                del self._active_tasks[task.id]
                return None
            else:
                self._stats["total_failed"] += 1

        self._complete_task(task)
        return task.result

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a queued or active task."""
        for priority in QueuePriority:
            for task in self._queues[priority]:
                if task.id == task_id:
                    task.status = TaskStatus.CANCELLED
                    self._queues[priority].remove(task)
                    self._completed_tasks.append(task)
                    return True

        if task_id in self._active_tasks:
            self._active_tasks[task_id].status = TaskStatus.CANCELLED
            self._complete_task(self._active_tasks[task_id])
            return True
        return False

    def _complete_task(self, task: QueueTask) -> None:
        """Move a task to completed."""
        task.completed_at = datetime.utcnow()
        self._active_tasks.pop(task.id, None)
        self._completed_tasks.append(task)

        if len(self._completed_tasks) > self._max_completed:
            self._completed_tasks = self._completed_tasks[-self._max_completed:]

    async def process_queue(self) -> int:
        """Process all available tasks in the queue."""
        processed = 0
        while True:
            task = self.dequeue()
            if task is None:
                break
            await self.execute_task(task)
            processed += 1
        return processed

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status."""
        if task_id in self._active_tasks:
            task = self._active_tasks[task_id]
        else:
            task = next((t for t in self._completed_tasks if t.id == task_id), None)
        if task is None:
            for priority in QueuePriority:
                task = next((t for t in self._queues[priority] if t.id == task_id), None)
                if task:
                    break

        if task is None:
            return None

        return {
            "id": task.id, "name": task.name, "handler": task.handler,
            "status": task.status.value, "priority": task.priority.name,
            "progress": task.progress,
            "created_at": task.created_at.isoformat(),
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "retry_count": task.retry_count,
            "error": task.error,
        }

    def get_queue_size(self) -> Dict[str, int]:
        """Get queue sizes by priority."""
        return {p.name: len(q) for p, q in self._queues.items()}

    def get_stats(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "total_queued": sum(len(q) for q in self._queues.values()),
            "active_tasks": len(self._active_tasks),
            "max_concurrent": self.max_concurrent,
            "queues": self.get_queue_size(),
            **self._stats,
        }


# ============================================================================
# Pub/Sub Message Broker
# ============================================================================

class PubSubBroker:
    """In-memory publish/subscribe message broker."""

    def __init__(self):
        self._subscriptions: Dict[str, Dict[str, Callable]] = defaultdict(dict)
        self._message_history: Dict[str, List[PubSubMessage]] = defaultdict(list)
        self._max_history_per_topic = 1000
        self._dead_letter_queue: List[PubSubMessage] = []
        self._stats = {
            "total_published": 0,
            "total_delivered": 0,
            "total_failed": 0,
            "topics": set(),
            "subscribers": 0,
        }

    def subscribe(self, topic: str, subscriber_id: str, handler: Callable) -> None:
        """Subscribe to a topic."""
        self._subscriptions[topic][subscriber_id] = handler
        self._stats["subscribers"] = sum(len(s) for s in self._subscriptions.values())
        self._stats["topics"].add(topic)
        logger.info(f"Subscriber {subscriber_id} subscribed to {topic}")

    def unsubscribe(self, topic: str, subscriber_id: str) -> bool:
        """Unsubscribe from a topic."""
        if topic in self._subscriptions and subscriber_id in self._subscriptions[topic]:
            del self._subscriptions[topic][subscriber_id]
            self._stats["subscribers"] = sum(len(s) for s in self._subscriptions.values())
            return True
        return False

    async def publish(self, topic: str, payload: Dict[str, Any],
                      message_type: str = "", publisher_id: Optional[str] = None,
                      correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """Publish a message to a topic."""
        message = PubSubMessage(
            topic=topic,
            message_type=message_type or topic,
            payload=payload,
            publisher_id=publisher_id,
            correlation_id=correlation_id,
        )

        self._message_history[topic].append(message)
        if len(self._message_history[topic]) > self._max_history_per_topic:
            self._message_history[topic] = self._message_history[topic][-self._max_history_per_topic:]

        self._stats["total_published"] += 1

        delivered = 0
        failed = 0
        subscribers = self._subscriptions.get(topic, {})

        # Also check wildcard subscriptions
        wildcard_subs = {}
        for sub_topic, subs in self._subscriptions.items():
            if sub_topic.endswith(".*"):
                prefix = sub_topic[:-2]
                if topic.startswith(prefix):
                    wildcard_subs.update(subs)

        all_subs = {**subscribers, **wildcard_subs}

        for sub_id, handler in all_subs.items():
            try:
                message.delivery_count += 1
                if asyncio.iscoroutinefunction(handler):
                    await handler(message)
                else:
                    handler(message)
                delivered += 1
            except Exception as e:
                failed += 1
                logger.error(f"Failed to deliver message to {sub_id}: {e}")
                self._dead_letter_queue.append(message)

        self._stats["total_delivered"] += delivered
        self._stats["total_failed"] += failed

        return {
            "message_id": message.id,
            "topic": topic,
            "subscribers": len(all_subs),
            "delivered": delivered,
            "failed": failed,
        }

    def get_topic_history(self, topic: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get message history for a topic."""
        messages = self._message_history.get(topic, [])
        return [
            {
                "id": m.id, "topic": m.topic, "type": m.message_type,
                "payload": m.payload, "published_at": m.published_at.isoformat(),
                "publisher_id": m.publisher_id, "delivery_count": m.delivery_count,
            }
            for m in messages[-limit:]
        ]

    def list_topics(self) -> List[Dict[str, Any]]:
        """List all topics with subscriber counts."""
        topics = set(list(self._subscriptions.keys()) + list(self._message_history.keys()))
        return [
            {
                "topic": t,
                "subscribers": len(self._subscriptions.get(t, {})),
                "message_count": len(self._message_history.get(t, [])),
            }
            for t in sorted(topics)
        ]

    def get_dead_letter_queue(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get messages from dead letter queue."""
        return [
            {
                "id": m.id, "topic": m.topic, "type": m.message_type,
                "payload": m.payload, "published_at": m.published_at.isoformat(),
                "error": "Delivery failed",
            }
            for m in self._dead_letter_queue[-limit:]
        ]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_published": self._stats["total_published"],
            "total_delivered": self._stats["total_delivered"],
            "total_failed": self._stats["total_failed"],
            "topics_count": len(self._stats["topics"]),
            "subscriber_count": self._stats["subscribers"],
            "dead_letter_count": len(self._dead_letter_queue),
        }


# ============================================================================
# Rate Limiter
# ============================================================================

class TokenBucketRateLimiter:
    """Token bucket rate limiter for API endpoints."""

    def __init__(self):
        self._buckets: Dict[str, Dict[str, Any]] = {}
        self._configs: Dict[str, Dict[str, int]] = {
            "default": {"rate": 60, "burst": 10, "period_seconds": 60},
            "auth": {"rate": 10, "burst": 3, "period_seconds": 60},
            "search": {"rate": 30, "burst": 5, "period_seconds": 60},
            "ml_prediction": {"rate": 10, "burst": 2, "period_seconds": 60},
            "report": {"rate": 5, "burst": 1, "period_seconds": 60},
            "export": {"rate": 3, "burst": 1, "period_seconds": 60},
            "webhook": {"rate": 100, "burst": 20, "period_seconds": 60},
            "admin": {"rate": 120, "burst": 20, "period_seconds": 60},
            "upload": {"rate": 10, "burst": 3, "period_seconds": 60},
        }

    def check(self, key: str, endpoint_type: str = "default") -> Tuple[bool, Dict[str, Any]]:
        """Check if a request is allowed."""
        config = self._configs.get(endpoint_type, self._configs["default"])
        now = time.time()

        if key not in self._buckets:
            self._buckets[key] = {
                "tokens": config["burst"],
                "last_refill": now,
                "endpoint_type": endpoint_type,
            }

        bucket = self._buckets[key]
        elapsed = now - bucket["last_refill"]
        refill_rate = config["rate"] / config["period_seconds"]
        tokens_to_add = elapsed * refill_rate
        bucket["tokens"] = min(config["burst"], bucket["tokens"] + tokens_to_add)
        bucket["last_refill"] = now

        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            return True, {
                "remaining": int(bucket["tokens"]),
                "limit": config["rate"],
                "reset": int(now + config["period_seconds"]),
            }
        else:
            retry_after = (1 - bucket["tokens"]) / refill_rate
            return False, {
                "remaining": 0,
                "limit": config["rate"],
                "reset": int(now + config["period_seconds"]),
                "retry_after": round(retry_after, 2),
            }

    def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        self._buckets.pop(key, None)

    def get_status(self, key: str) -> Optional[Dict[str, Any]]:
        """Get current rate limit status for a key."""
        bucket = self._buckets.get(key)
        if not bucket:
            return None
        config = self._configs.get(bucket["endpoint_type"], self._configs["default"])
        return {
            "key": key,
            "tokens_remaining": round(bucket["tokens"], 2),
            "burst_limit": config["burst"],
            "rate_limit": config["rate"],
            "endpoint_type": bucket["endpoint_type"],
        }


# ============================================================================
# Distributed Lock (In-Memory Simulation)
# ============================================================================

class DistributedLock:
    """Simulated distributed lock for resource coordination."""

    def __init__(self):
        self._locks: Dict[str, Dict[str, Any]] = {}

    def acquire(self, resource: str, owner: str, ttl_seconds: int = 30) -> bool:
        """Try to acquire a lock on a resource."""
        now = time.time()

        if resource in self._locks:
            lock = self._locks[resource]
            if lock["expires_at"] > now and lock["owner"] != owner:
                return False
            if lock["expires_at"] <= now:
                del self._locks[resource]

        self._locks[resource] = {
            "owner": owner,
            "acquired_at": now,
            "expires_at": now + ttl_seconds,
        }
        return True

    def release(self, resource: str, owner: str) -> bool:
        """Release a lock on a resource."""
        if resource in self._locks and self._locks[resource]["owner"] == owner:
            del self._locks[resource]
            return True
        return False

    def is_locked(self, resource: str) -> bool:
        """Check if a resource is locked."""
        if resource not in self._locks:
            return False
        if self._locks[resource]["expires_at"] <= time.time():
            del self._locks[resource]
            return False
        return True

    def get_lock_info(self, resource: str) -> Optional[Dict[str, Any]]:
        if resource not in self._locks:
            return None
        lock = self._locks[resource]
        return {
            "resource": resource,
            "owner": lock["owner"],
            "acquired_at": datetime.fromtimestamp(lock["acquired_at"]).isoformat(),
            "expires_at": datetime.fromtimestamp(lock["expires_at"]).isoformat(),
            "ttl_remaining": max(0, lock["expires_at"] - time.time()),
        }

    def cleanup_expired(self) -> int:
        """Remove expired locks."""
        now = time.time()
        expired = [r for r, l in self._locks.items() if l["expires_at"] <= now]
        for r in expired:
            del self._locks[r]
        return len(expired)


# ============================================================================
# Cache & Queue Service
# ============================================================================

class CacheQueueService:
    """Unified cache and queue service."""

    def __init__(self):
        self.cache = MultiRegionCache()
        self.task_queues: Dict[str, TaskQueue] = {}
        self.pubsub = PubSubBroker()
        self.rate_limiter = TokenBucketRateLimiter()
        self.lock_manager = DistributedLock()
        self._setup_default_queues()
        self._register_default_handlers()

    def _setup_default_queues(self):
        """Set up default task queues."""
        queue_configs = [
            ("default", 10000, 10),
            ("email", 5000, 5),
            ("notification", 5000, 10),
            ("report", 1000, 3),
            ("ml_prediction", 500, 2),
            ("sync", 1000, 5),
            ("analytics", 2000, 3),
            ("export", 500, 2),
            ("cleanup", 1000, 2),
        ]
        for name, max_size, max_concurrent in queue_configs:
            self.task_queues[name] = TaskQueue(name, max_size, max_concurrent)

    def _register_default_handlers(self):
        """Register default task handlers."""
        async def process_email(**kwargs):
            await asyncio.sleep(0.01)
            return {"status": "sent", "recipient": kwargs.get("to")}

        async def generate_report(**kwargs):
            await asyncio.sleep(0.05)
            return {"status": "generated", "type": kwargs.get("type")}

        async def run_prediction(**kwargs):
            await asyncio.sleep(0.1)
            return {"status": "completed", "model": kwargs.get("model")}

        async def sync_data(**kwargs):
            await asyncio.sleep(0.05)
            return {"status": "synced", "provider": kwargs.get("provider")}

        async def export_data(**kwargs):
            await asyncio.sleep(0.05)
            return {"status": "exported", "format": kwargs.get("format")}

        async def cleanup_task(**kwargs):
            await asyncio.sleep(0.01)
            return {"status": "cleaned", "type": kwargs.get("type")}

        handlers = {
            "email": {"process_email": process_email},
            "report": {"generate_report": generate_report},
            "ml_prediction": {"run_prediction": run_prediction},
            "sync": {"sync_data": sync_data},
            "export": {"export_data": export_data},
            "cleanup": {"cleanup_task": cleanup_task},
        }

        for queue_name, queue_handlers in handlers.items():
            if queue_name in self.task_queues:
                for handler_name, handler in queue_handlers.items():
                    self.task_queues[queue_name].register_handler(handler_name, handler)

    # Queue operations
    def enqueue_task(self, queue_name: str, task_name: str, handler: str,
                     args: Optional[Dict] = None,
                     priority: QueuePriority = QueuePriority.NORMAL) -> str:
        """Enqueue a task to a specific queue."""
        queue = self.task_queues.get(queue_name)
        if not queue:
            raise ValueError(f"Queue not found: {queue_name}")
        return queue.enqueue(task_name, handler, args, priority)

    async def process_queue(self, queue_name: str) -> int:
        """Process tasks in a queue."""
        queue = self.task_queues.get(queue_name)
        if not queue:
            return 0
        return await queue.process_queue()

    async def process_all_queues(self) -> Dict[str, int]:
        """Process all queues."""
        results = {}
        for name, queue in self.task_queues.items():
            results[name] = await queue.process_queue()
        return results

    # Cache operations
    def cache_get(self, key: str, region: str = "default") -> Any:
        cache_region = CacheRegion(region) if region in [r.value for r in CacheRegion] else CacheRegion.DEFAULT
        return self.cache.get(key, cache_region)

    def cache_set(self, key: str, value: Any, region: str = "default",
                  ttl: Optional[int] = None, tags: Optional[List[str]] = None) -> None:
        cache_region = CacheRegion(region) if region in [r.value for r in CacheRegion] else CacheRegion.DEFAULT
        self.cache.put(key, value, cache_region, ttl, set(tags) if tags else None)

    def cache_invalidate(self, key: str, region: str = "default") -> bool:
        cache_region = CacheRegion(region) if region in [r.value for r in CacheRegion] else CacheRegion.DEFAULT
        return self.cache.invalidate(key, cache_region)

    # Pub/Sub operations
    async def publish_event(self, topic: str, payload: Dict[str, Any],
                            publisher_id: Optional[str] = None) -> Dict[str, Any]:
        return await self.pubsub.publish(topic, payload, publisher_id=publisher_id)

    def subscribe_event(self, topic: str, subscriber_id: str, handler: Callable) -> None:
        self.pubsub.subscribe(topic, subscriber_id, handler)

    # Rate limiting
    def check_rate_limit(self, key: str, endpoint_type: str = "default") -> Tuple[bool, Dict]:
        return self.rate_limiter.check(key, endpoint_type)

    # Locking
    def acquire_lock(self, resource: str, owner: str, ttl: int = 30) -> bool:
        return self.lock_manager.acquire(resource, owner, ttl)

    def release_lock(self, resource: str, owner: str) -> bool:
        return self.lock_manager.release(resource, owner)

    def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Get stats for all subsystems."""
        return {
            "cache": self.cache.get_stats(),
            "queues": {name: q.get_stats() for name, q in self.task_queues.items()},
            "pubsub": self.pubsub.get_stats(),
        }


# Singleton instance
cache_queue_service = CacheQueueService()

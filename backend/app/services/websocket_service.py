"""
WebSocket Service - Real-time communication for CancerGuard AI
Handles patient vitals streaming, notifications, chat, and alerts.
"""

import json
import logging
import asyncio
import time
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from enum import Enum
from collections import defaultdict
import uuid

logger = logging.getLogger(__name__)


class WSMessageType(Enum):
    VITAL_SIGNS = "vital_signs"
    ALERT = "alert"
    NOTIFICATION = "notification"
    CHAT_MESSAGE = "chat_message"
    APPOINTMENT_UPDATE = "appointment_update"
    LAB_RESULT = "lab_result"
    SYSTEM_STATUS = "system_status"
    USER_STATUS = "user_status"
    TYPING_INDICATOR = "typing_indicator"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    ACKNOWLEDGE = "acknowledge"
    BROADCAST = "broadcast"


class ConnectionStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    RECONNECTING = "reconnecting"
    ERROR = "error"


class WebSocketManager:
    """Manages WebSocket connections and message routing."""

    def __init__(self):
        self.active_connections: Dict[str, Any] = {}
        self.user_connections: Dict[str, Set[str]] = defaultdict(set)
        self.room_members: Dict[str, Set[str]] = defaultdict(set)
        self.subscriptions: Dict[str, Set[str]] = defaultdict(set)
        self.message_handlers: Dict[str, List[Callable]] = defaultdict(list)
        self.message_history: List[Dict] = []
        self.stats = {
            "total_connections": 0,
            "total_messages": 0,
            "total_broadcasts": 0,
        }

    async def connect(self, websocket: Any, user_id: str, connection_id: Optional[str] = None) -> str:
        """Register a new WebSocket connection."""
        conn_id = connection_id or str(uuid.uuid4())

        self.active_connections[conn_id] = {
            "websocket": websocket,
            "user_id": user_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_activity": time.time(),
            "status": ConnectionStatus.CONNECTED.value,
        }
        self.user_connections[user_id].add(conn_id)
        self.stats["total_connections"] += 1

        logger.info(f"WebSocket connected: {conn_id} (user: {user_id})")

        # Send connection acknowledgment
        await self.send_to_connection(conn_id, {
            "type": WSMessageType.ACKNOWLEDGE.value,
            "data": {
                "connection_id": conn_id,
                "message": "Connected successfully",
            },
        })

        # Notify user online status
        await self.broadcast_to_room("presence", {
            "type": WSMessageType.USER_STATUS.value,
            "data": {"user_id": user_id, "status": "online"},
        }, exclude={conn_id})

        return conn_id

    async def disconnect(self, connection_id: str) -> None:
        """Close and cleanup a WebSocket connection."""
        conn = self.active_connections.pop(connection_id, None)
        if conn:
            user_id = conn["user_id"]
            self.user_connections[user_id].discard(connection_id)

            # Remove from all rooms
            for room, members in self.room_members.items():
                members.discard(connection_id)

            # Remove all subscriptions
            for topic, subscribers in self.subscriptions.items():
                subscribers.discard(connection_id)

            # Notify offline if no more connections for user
            if not self.user_connections[user_id]:
                await self.broadcast_to_room("presence", {
                    "type": WSMessageType.USER_STATUS.value,
                    "data": {"user_id": user_id, "status": "offline"},
                })

            logger.info(f"WebSocket disconnected: {connection_id}")

    async def send_to_connection(self, connection_id: str, message: Dict) -> bool:
        """Send message to a specific connection."""
        conn = self.active_connections.get(connection_id)
        if not conn:
            return False

        try:
            websocket = conn["websocket"]
            msg = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                **message,
            }

            if hasattr(websocket, "send_json"):
                await websocket.send_json(msg)
            elif hasattr(websocket, "send_text"):
                await websocket.send_text(json.dumps(msg, default=str))

            conn["last_activity"] = time.time()
            self.stats["total_messages"] += 1

            self.message_history.append({
                "connection_id": connection_id,
                "user_id": conn["user_id"],
                **msg,
            })

            return True
        except Exception as e:
            logger.error(f"Failed to send to {connection_id}: {e}")
            return False

    async def send_to_user(self, user_id: str, message: Dict) -> int:
        """Send message to all connections of a user."""
        sent = 0
        for conn_id in list(self.user_connections.get(user_id, set())):
            if await self.send_to_connection(conn_id, message):
                sent += 1
        return sent

    async def broadcast(self, message: Dict, exclude: Optional[Set[str]] = None) -> int:
        """Broadcast message to all connected clients."""
        sent = 0
        exclude = exclude or set()
        for conn_id in list(self.active_connections.keys()):
            if conn_id not in exclude:
                if await self.send_to_connection(conn_id, message):
                    sent += 1
        self.stats["total_broadcasts"] += 1
        return sent

    async def broadcast_to_room(
        self, room: str, message: Dict, exclude: Optional[Set[str]] = None
    ) -> int:
        """Broadcast message to all members of a room."""
        sent = 0
        exclude = exclude or set()
        for conn_id in list(self.room_members.get(room, set())):
            if conn_id not in exclude:
                if await self.send_to_connection(conn_id, message):
                    sent += 1
        return sent

    async def join_room(self, connection_id: str, room: str) -> None:
        """Add connection to a room."""
        self.room_members[room].add(connection_id)
        logger.debug(f"Connection {connection_id} joined room: {room}")

    async def leave_room(self, connection_id: str, room: str) -> None:
        """Remove connection from a room."""
        self.room_members[room].discard(connection_id)

    async def subscribe(self, connection_id: str, topic: str) -> None:
        """Subscribe connection to a topic."""
        self.subscriptions[topic].add(connection_id)

    async def unsubscribe(self, connection_id: str, topic: str) -> None:
        """Unsubscribe connection from a topic."""
        self.subscriptions[topic].discard(connection_id)

    async def publish(self, topic: str, message: Dict) -> int:
        """Publish message to topic subscribers."""
        sent = 0
        for conn_id in list(self.subscriptions.get(topic, set())):
            if await self.send_to_connection(conn_id, message):
                sent += 1
        return sent

    def register_handler(self, message_type: str, handler: Callable) -> None:
        """Register a message handler for a specific type."""
        self.message_handlers[message_type].append(handler)

    async def handle_message(self, connection_id: str, raw_message: str) -> None:
        """Process an incoming WebSocket message."""
        try:
            message = json.loads(raw_message) if isinstance(raw_message, str) else raw_message
        except json.JSONDecodeError:
            await self.send_to_connection(connection_id, {
                "type": WSMessageType.ERROR.value,
                "data": {"message": "Invalid JSON"},
            })
            return

        msg_type = message.get("type", "")

        # Handle heartbeat
        if msg_type == WSMessageType.HEARTBEAT.value:
            conn = self.active_connections.get(connection_id)
            if conn:
                conn["last_activity"] = time.time()
            await self.send_to_connection(connection_id, {
                "type": WSMessageType.HEARTBEAT.value,
                "data": {"pong": True},
            })
            return

        # Handle typing indicator
        if msg_type == WSMessageType.TYPING_INDICATOR.value:
            room = message.get("data", {}).get("room")
            if room:
                conn = self.active_connections.get(connection_id)
                await self.broadcast_to_room(room, {
                    "type": WSMessageType.TYPING_INDICATOR.value,
                    "data": {
                        "user_id": conn["user_id"] if conn else None,
                        "typing": message.get("data", {}).get("typing", False),
                    },
                }, exclude={connection_id})
            return

        # Dispatch to registered handlers
        handlers = self.message_handlers.get(msg_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(connection_id, message)
                else:
                    handler(connection_id, message)
            except Exception as e:
                logger.error(f"Handler error for {msg_type}: {e}")

    # ---- Specialized Send Methods ----

    async def send_vital_signs(self, user_id: str, vitals: Dict) -> int:
        """Send real-time vital signs update."""
        return await self.send_to_user(user_id, {
            "type": WSMessageType.VITAL_SIGNS.value,
            "data": vitals,
        })

    async def send_alert(
        self, user_id: str, alert_type: str, message: str, severity: str = "warning", data: Optional[Dict] = None
    ) -> int:
        """Send alert to user."""
        return await self.send_to_user(user_id, {
            "type": WSMessageType.ALERT.value,
            "data": {
                "alert_type": alert_type,
                "message": message,
                "severity": severity,
                **(data or {}),
            },
        })

    async def send_notification(
        self, user_id: str, title: str, body: str, action_url: Optional[str] = None
    ) -> int:
        """Send notification to user."""
        return await self.send_to_user(user_id, {
            "type": WSMessageType.NOTIFICATION.value,
            "data": {
                "title": title,
                "body": body,
                "action_url": action_url,
            },
        })

    async def send_lab_result(self, user_id: str, result: Dict) -> int:
        """Send lab result notification."""
        return await self.send_to_user(user_id, {
            "type": WSMessageType.LAB_RESULT.value,
            "data": result,
        })

    async def send_appointment_update(self, user_id: str, appointment: Dict) -> int:
        """Send appointment status update."""
        return await self.send_to_user(user_id, {
            "type": WSMessageType.APPOINTMENT_UPDATE.value,
            "data": appointment,
        })

    async def send_chat_message(
        self, room: str, sender_id: str, message: str, attachments: Optional[List] = None
    ) -> int:
        """Send chat message to room."""
        return await self.broadcast_to_room(room, {
            "type": WSMessageType.CHAT_MESSAGE.value,
            "data": {
                "sender_id": sender_id,
                "message": message,
                "attachments": attachments or [],
            },
        })

    async def broadcast_system_status(self, status: Dict) -> int:
        """Broadcast system status to all connected clients."""
        return await self.broadcast({
            "type": WSMessageType.SYSTEM_STATUS.value,
            "data": status,
        })

    # ---- Connection Management ----

    def get_connection_count(self) -> int:
        return len(self.active_connections)

    def get_online_users(self) -> List[str]:
        return [
            user_id for user_id, conns in self.user_connections.items()
            if conns
        ]

    def is_user_online(self, user_id: str) -> bool:
        return bool(self.user_connections.get(user_id))

    async def cleanup_stale_connections(self, timeout_seconds: int = 300) -> int:
        """Remove connections that haven't been active."""
        now = time.time()
        stale = []

        for conn_id, conn in self.active_connections.items():
            if now - conn["last_activity"] > timeout_seconds:
                stale.append(conn_id)

        for conn_id in stale:
            await self.disconnect(conn_id)

        return len(stale)

    def get_stats(self) -> Dict:
        return {
            **self.stats,
            "active_connections": len(self.active_connections),
            "online_users": len(self.get_online_users()),
            "rooms": len(self.room_members),
            "topics": len(self.subscriptions),
        }


# ============================================================================
# VITAL SIGNS STREAMING
# ============================================================================
class VitalSignsStreamer:
    """Real-time vital signs streaming service."""

    def __init__(self, ws_manager: WebSocketManager):
        self.ws_manager = ws_manager
        self.active_streams: Dict[str, Dict] = {}
        self.alert_thresholds = {
            "heart_rate": {"low": 50, "high": 120, "critical_low": 40, "critical_high": 150},
            "systolic_bp": {"low": 90, "high": 140, "critical_low": 70, "critical_high": 180},
            "diastolic_bp": {"low": 60, "high": 90, "critical_low": 40, "critical_high": 120},
            "spo2": {"low": 92, "critical_low": 88},
            "temperature": {"low": 96.0, "high": 100.4, "critical_low": 95.0, "critical_high": 104.0},
            "respiratory_rate": {"low": 12, "high": 20, "critical_low": 8, "critical_high": 30},
        }

    async def start_stream(self, patient_id: str, monitoring_type: str = "continuous") -> str:
        """Start vital signs streaming for a patient."""
        stream_id = str(uuid.uuid4())

        self.active_streams[stream_id] = {
            "id": stream_id,
            "patient_id": patient_id,
            "type": monitoring_type,
            "started_at": datetime.utcnow().isoformat(),
            "latest_vitals": {},
            "alert_count": 0,
        }

        logger.info(f"Vital signs stream started: {stream_id} for patient {patient_id}")
        return stream_id

    async def process_vitals(self, stream_id: str, vitals: Dict) -> List[Dict]:
        """Process incoming vital signs and check for alerts."""
        stream = self.active_streams.get(stream_id)
        if not stream:
            return []

        stream["latest_vitals"] = vitals
        alerts = self._check_thresholds(vitals)

        if alerts:
            stream["alert_count"] += len(alerts)
            patient_id = stream["patient_id"]

            for alert in alerts:
                await self.ws_manager.send_alert(
                    patient_id,
                    alert_type="vital_sign",
                    message=alert["message"],
                    severity=alert["severity"],
                    data={"vital_sign": alert["vital_sign"], "value": alert["value"]},
                )

        # Send vitals update
        await self.ws_manager.publish(f"vitals:{stream['patient_id']}", {
            "type": WSMessageType.VITAL_SIGNS.value,
            "data": {
                "stream_id": stream_id,
                "vitals": vitals,
                "alerts": alerts,
                "timestamp": datetime.utcnow().isoformat(),
            },
        })

        return alerts

    def _check_thresholds(self, vitals: Dict) -> List[Dict]:
        """Check vital signs against alert thresholds."""
        alerts = []

        for vital_sign, thresholds in self.alert_thresholds.items():
            value = vitals.get(vital_sign)
            if value is None:
                continue

            critical_low = thresholds.get("critical_low")
            critical_high = thresholds.get("critical_high")
            low = thresholds.get("low")
            high = thresholds.get("high")

            if critical_low and value <= critical_low:
                alerts.append({
                    "vital_sign": vital_sign,
                    "value": value,
                    "severity": "critical",
                    "message": f"CRITICAL: {vital_sign.replace('_', ' ').title()} critically low at {value}",
                })
            elif critical_high and value >= critical_high:
                alerts.append({
                    "vital_sign": vital_sign,
                    "value": value,
                    "severity": "critical",
                    "message": f"CRITICAL: {vital_sign.replace('_', ' ').title()} critically high at {value}",
                })
            elif low and value <= low:
                alerts.append({
                    "vital_sign": vital_sign,
                    "value": value,
                    "severity": "warning",
                    "message": f"WARNING: {vital_sign.replace('_', ' ').title()} low at {value}",
                })
            elif high and value >= high:
                alerts.append({
                    "vital_sign": vital_sign,
                    "value": value,
                    "severity": "warning",
                    "message": f"WARNING: {vital_sign.replace('_', ' ').title()} high at {value}",
                })

        return alerts

    async def stop_stream(self, stream_id: str) -> Optional[Dict]:
        """Stop vital signs stream."""
        return self.active_streams.pop(stream_id, None)

    def get_active_streams(self) -> List[Dict]:
        return list(self.active_streams.values())


# ============================================================================
# SINGLETON INSTANCES
# ============================================================================
ws_manager = WebSocketManager()
vital_signs_streamer = VitalSignsStreamer(ws_manager)

"""
WebSocket Manager - ROVI CRM
Maneja conexiones WebSocket para actualizaciones en tiempo real del dashboard
"""

from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import Dict, Set, List, Optional
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Gestiona conexiones WebSocket para actualizaciones en tiempo real.
    Organiza conexiones por tenant_id para asegurar aislamiento de datos.
    """

    def __init__(self):
        # tenant_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # WebSocket -> tenant_id (para cleanup)
        self.connection_tenant: Dict[WebSocket, str] = {}
        # WebSocket -> user_id (para tracking)
        self.connection_user: Dict[WebSocket, str] = {}

    async def connect(
        self,
        websocket: WebSocket,
        tenant_id: str,
        user_id: str
    ):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()

        # Initialize tenant connection set if needed
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = set()

        # Register connection
        self.active_connections[tenant_id].add(websocket)
        self.connection_tenant[websocket] = tenant_id
        self.connection_user[websocket] = user_id

        logger.info(
            f"WebSocket connected: user={user_id}, "
            f"tenant={tenant_id}, "
            f"total_connections={self.get_total_connections()}"
        )

        # Send welcome message
        await websocket.send_json({
            "type": "connection_established",
            "timestamp": datetime.utcnow().isoformat(),
            "tenant_id": tenant_id,
            "user_id": user_id
        })

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        tenant_id = self.connection_tenant.get(websocket)
        user_id = self.connection_user.get(websocket)

        if tenant_id and tenant_id in self.active_connections:
            self.active_connections[tenant_id].discard(websocket)

        # Clean up tracking dicts
        self.connection_tenant.pop(websocket, None)
        self.connection_user.pop(websocket, None)

        logger.info(
            f"WebSocket disconnected: user={user_id}, "
            f"tenant={tenant_id}, "
            f"total_connections={self.get_total_connections()}"
        )

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        """
        Broadcast a message to all connections in a tenant.
        Automatically handles disconnections and cleanup.
        """
        if tenant_id not in self.active_connections:
            return

        disconnected = set()
        successful = 0

        for connection in self.active_connections[tenant_id]:
            try:
                await connection.send_json(message)
                successful += 1
            except Exception as e:
                logger.warning(f"Failed to send to connection: {e}")
                disconnected.add(connection)

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)

        logger.debug(
            f"Broadcast to tenant={tenant_id}: "
            f"sent={successful}, failed={len(disconnected)}"
        )

    async def broadcast_to_all(self, message: dict):
        """Broadcast a message to all active connections"""
        disconnected = set()
        successful = 0

        for tenant_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                    successful += 1
                except Exception as e:
                    logger.warning(f"Failed to broadcast: {e}")
                    disconnected.add(connection)

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)

        logger.info(
            f"Broadcast to all: sent={successful}, failed={len(disconnected)}"
        )

    def get_connections_count(self, tenant_id: str) -> int:
        """Get number of active connections for a tenant"""
        return len(self.active_connections.get(tenant_id, set()))

    def get_total_connections(self) -> int:
        """Get total number of active connections across all tenants"""
        return sum(len(conns) for conns in self.active_connections.values())

    def get_all_tenants(self) -> List[str]:
        """Get list of all tenants with active connections"""
        return [
            tenant_id
            for tenant_id, conns in self.active_connections.items()
            if len(conns) > 0
        ]


# Global connection manager instance
manager = ConnectionManager()


# Event types for WebSocket messages
class WebSocketEvent:
    """Event types sent over WebSocket"""

    # Lead events
    LEAD_CREATED = "lead_created"
    LEAD_UPDATED = "lead_updated"
    LEAD_DELETED = "lead_deleted"
    LEAD_STATUS_CHANGED = "lead_status_changed"

    # Dashboard events
    METRICS_UPDATED = "metrics_updated"
    LEADERBOARD_CHANGED = "leaderboard_changed"
    ACTIVITY_FEED_UPDATED = "activity_feed_updated"

    # Calendar events
    CALENDAR_EVENT_CREATED = "calendar_event_created"
    CALENDAR_EVENT_UPDATED = "calendar_event_updated"
    CALENDAR_EVENT_DELETED = "calendar_event_deleted"

    # Notification events
    NOTIFICATION = "notification"
    ERROR = "error"


async def emit_lead_created(
    tenant_id: str,
    lead: dict,
    created_by: str
):
    """Emit lead_created event to tenant"""
    await manager.broadcast_to_tenant(tenant_id, {
        "type": WebSocketEvent.LEAD_CREATED,
        "data": lead,
        "metadata": {
            "created_by": created_by,
            "timestamp": datetime.utcnow().isoformat()
        }
    })


async def emit_lead_updated(
    tenant_id: str,
    lead_id: str,
    changes: dict,
    updated_by: str
):
    """Emit lead_updated event to tenant"""
    await manager.broadcast_to_tenant(tenant_id, {
        "type": WebSocketEvent.LEAD_UPDATED,
        "data": {
            "lead_id": lead_id,
            "changes": changes
        },
        "metadata": {
            "updated_by": updated_by,
            "timestamp": datetime.utcnow().isoformat()
        }
    })


async def emit_metrics_updated(
    tenant_id: str,
    stats: dict
):
    """Emit metrics_updated event to tenant"""
    await manager.broadcast_to_tenant(tenant_id, {
        "type": WebSocketEvent.METRICS_UPDATED,
        "data": stats,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat()
        }
    })


async def emit_leaderboard_changed(
    tenant_id: str,
    leaderboard: List[dict]
):
    """Emit leaderboard_changed event to tenant"""
    await manager.broadcast_to_tenant(tenant_id, {
        "type": WebSocketEvent.LEADERBOARD_CHANGED,
        "data": leaderboard,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat()
        }
    })


async def emit_calendar_event_created(
    tenant_id: str,
    event: dict,
    created_by: str
):
    """Emit calendar_event_created event to tenant"""
    await manager.broadcast_to_tenant(tenant_id, {
        "type": WebSocketEvent.CALENDAR_EVENT_CREATED,
        "data": event,
        "metadata": {
            "created_by": created_by,
            "timestamp": datetime.utcnow().isoformat()
        }
    })


async def emit_notification(
    tenant_id: str,
    user_id: str,
    notification: dict
):
    """Emit notification to specific user in tenant"""
    # Find connection for user
    for ws, uid in manager.connection_user.items():
        if uid == user_id:
            await manager.send_personal_message({
                "type": WebSocketEvent.NOTIFICATION,
                "data": notification,
                "metadata": {
                    "timestamp": datetime.utcnow().isoformat()
                }
            }, ws)
            break

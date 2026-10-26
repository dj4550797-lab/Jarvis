"""WebSocket Gateway for Real-Time Event Streaming."""

import json
from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jarvis.core.events import event_bus
from jarvis.core.logging import logger

router = APIRouter(tags=["WebSockets"])


class ConnectionManager:
    """Manages active WebSocket client connections."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Active: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Active: %d", len(self.active_connections))

    async def broadcast(self, message: dict[str, Any]) -> None:
        serialized = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(serialized)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()


async def on_event_bus_message(payload: dict[str, Any]) -> None:
    """Forward internal bus events to connected WebSocket clients."""
    await manager.broadcast(payload)


# Subscribe WebSocket manager to all event bus events
event_bus.subscribe("*", on_event_bus_message)


@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket) -> None:
    """Duplex WebSocket endpoint for receiving live system events and streaming audio telemetry."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and accept ping / client messages
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                # Handle client heartbeats or client commands
                if parsed.get("action") == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

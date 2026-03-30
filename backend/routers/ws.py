import asyncio
import json
import logging
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()
active_connections: Set[WebSocket] = set()


@router.websocket("/ws/progress")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        active_connections.discard(websocket)
    except Exception as e:
        logger.debug("ws closed: %s", e)
        active_connections.discard(websocket)


async def broadcast(message: dict) -> None:
    dead: Set[WebSocket] = set()
    text = json.dumps(message)
    for ws in active_connections:
        try:
            await ws.send_text(text)
        except Exception:
            dead.add(ws)
    for ws in dead:
        active_connections.discard(ws)

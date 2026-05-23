from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt
from core.config import settings
from core.ws_manager import manager

router = APIRouter(tags=["websocket"])


def _decode_user_id(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        return int(sub) if sub else None
    except (JWTError, ValueError):
        return None


@router.websocket("/ws/conversations/{conversation_id}")
async def ws_conversation(
    conversation_id: int,
    websocket: WebSocket,
    token: str = Query(...),
):
    if not _decode_user_id(token):
        await websocket.close(code=1008)
        return

    await manager.connect_conv(conversation_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_conv(conversation_id, websocket)


@router.websocket("/ws/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(...),
):
    user_id = _decode_user_id(token)
    if not user_id:
        await websocket.close(code=1008)
        return

    await manager.connect_user(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(user_id, websocket)

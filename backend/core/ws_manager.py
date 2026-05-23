import asyncio
from typing import Dict, List, Optional
from fastapi import WebSocket

_main_loop: Optional[asyncio.AbstractEventLoop] = None


def set_main_loop(loop: asyncio.AbstractEventLoop) -> None:
    global _main_loop
    _main_loop = loop


class ConnectionManager:
    def __init__(self):
        # conversation_id → list of WebSocket connections
        self._conv: Dict[int, List[WebSocket]] = {}
        # user_id → list of WebSocket connections (for notifications)
        self._user: Dict[int, List[WebSocket]] = {}

    # ── Conversation (chat) connections ────────────────────────────────────

    async def connect_conv(self, conv_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._conv.setdefault(conv_id, []).append(ws)

    def disconnect_conv(self, conv_id: int, ws: WebSocket) -> None:
        conns = self._conv.get(conv_id, [])
        if ws in conns:
            conns.remove(ws)

    async def broadcast_conv(self, conv_id: int, data: dict) -> None:
        for ws in list(self._conv.get(conv_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect_conv(conv_id, ws)

    # ── User notification connections ──────────────────────────────────────

    async def connect_user(self, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._user.setdefault(user_id, []).append(ws)

    def disconnect_user(self, user_id: int, ws: WebSocket) -> None:
        conns = self._user.get(user_id, [])
        if ws in conns:
            conns.remove(ws)

    async def notify_user(self, user_id: int, data: dict) -> None:
        for ws in list(self._user.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect_user(user_id, ws)


manager = ConnectionManager()

_NOTIFY_MSG = {"type": "notification_update"}


def fire_notify(user_id: int) -> None:
    """Schedule a notification push to user_id from any thread (sync endpoints)."""
    if _main_loop and user_id:
        asyncio.run_coroutine_threadsafe(
            manager.notify_user(user_id, _NOTIFY_MSG),
            _main_loop,
        )

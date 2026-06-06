from __future__ import annotations

import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from auth import get_current_user


OPENWA_DEFAULT_BASE_URL = "http://127.0.0.1:2785/api"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_openwa_base_url(value: str | None) -> str:
    base_url = (value or OPENWA_DEFAULT_BASE_URL).strip().rstrip("/")
    return base_url or OPENWA_DEFAULT_BASE_URL


def normalize_chat_id(value: str) -> str:
    chat_id = (value or "").strip()
    if not chat_id:
        raise HTTPException(status_code=422, detail="chat_id es obligatorio")
    if chat_id.endswith(("@c.us", "@g.us", "@newsletter")):
        return chat_id
    digits = re.sub(r"\D+", "", chat_id)
    if not digits:
        raise HTTPException(
            status_code=422, detail="chat_id debe ser telefono o id de WhatsApp"
        )
    return f"{digits}@c.us"


def classify_whatsapp_text(text: str, is_group: bool = False) -> dict[str, Any]:
    lowered = (text or "").lower()
    category = "unknown"
    confidence = 0.35
    recommended_agent = "whatsapp_router"
    crm_action = "store_message"

    property_signals = [
        "recámara",
        "recamara",
        "m2",
        "amenidades",
        "departamento",
        "condo",
        "terreno",
        "precio",
        "easybroker",
        "wa.me/p/",
        "comisión",
        "comision",
    ]
    lead_signals = [
        "me interesa",
        "informes",
        "info",
        "disponible",
        "visita",
        "presupuesto",
        "enganche",
        "comprar",
        "rentar",
        "cotización",
        "cotizacion",
    ]
    broker_signals = [
        "comparto",
        "cliente comprador",
        "colaboración",
        "colaboracion",
        "broker",
        "asesor inmobiliario",
    ]
    personal_signals = [
        "mamá",
        "mama",
        "papá",
        "papa",
        "familia",
        "amor",
        "hijo",
        "hija",
        "cena",
        "cumple",
    ]

    if any(signal in lowered for signal in personal_signals):
        category = "family_personal"
        confidence = 0.76
        recommended_agent = "risk_guardian"
        crm_action = "ignore_by_default"
    elif any(signal in lowered for signal in broker_signals):
        category = "broker"
        confidence = 0.82
        recommended_agent = "property_matcher"
        crm_action = "review_contact"
    elif any(signal in lowered for signal in property_signals):
        category = "property"
        confidence = 0.8
        recommended_agent = "property_matcher"
        crm_action = "draft_property"
    elif any(signal in lowered for signal in lead_signals):
        category = "lead"
        confidence = 0.84
        recommended_agent = "ai_lead_qualifier"
        crm_action = "create_or_update_lead"

    if is_group and category in {"unknown", "lead"}:
        confidence = min(confidence, 0.55)
        crm_action = "review_group_message"

    return {
        "category": category,
        "confidence": confidence,
        "recommended_agent": recommended_agent,
        "crm_action": crm_action,
        "requires_human_approval": category in {"family_personal", "unknown"}
        or is_group,
    }


class OpenWASessionCreate(BaseModel):
    name: Optional[str] = None
    auto_start: bool = True


class OpenWASendText(BaseModel):
    chat_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1, max_length=4096)


class OpenWAWebhookRegistration(BaseModel):
    url: str
    events: list[str] = Field(
        default_factory=lambda: ["message", "message_ack", "session_status"]
    )
    secret: Optional[str] = None


class OpenWAClient:
    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = normalize_openwa_base_url(
            base_url or os.environ.get("OPENWA_API_BASE_URL")
        )
        self.api_key = (
            api_key if api_key is not None else os.environ.get("OPENWA_API_KEY", "")
        )

    def headers(self) -> dict[str, str]:
        headers = {"accept": "application/json"}
        if self.api_key:
            headers["x-api-key"] = self.api_key
        return headers

    async def request(
        self, method: str, path: str, json_body: Any | None = None
    ) -> Any:
        url = f"{self.base_url}/{path.lstrip('/')}"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.request(
                    method, url, json=json_body, headers=self.headers()
                )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=503, detail=f"OpenWA no disponible: {exc}"
            ) from exc

        if response.status_code >= 400:
            detail: Any
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise HTTPException(
                status_code=response.status_code, detail={"openwa": detail}
            )

        if not response.content:
            return {}
        try:
            return response.json()
        except ValueError:
            return {"raw": response.text}


async def get_owned_openwa_session(
    db: AsyncIOMotorDatabase, session_id: str, current_user: dict
) -> dict:
    session = await db.whatsapp_openwa_sessions.find_one(
        {
            "openwa_session_id": session_id,
            "tenant_id": current_user["tenant_id"],
            "user_id": current_user["user_id"],
            "status": {"$ne": "deleted"},
        },
        {"_id": 0},
    )
    if not session:
        raise HTTPException(
            status_code=404, detail="Sesion OpenWA no encontrada para este usuario"
        )
    return session


def build_openwa_session_name(current_user: dict, requested_name: str | None) -> str:
    raw = (
        requested_name
        or f"rovi-{current_user['tenant_id'][:8]}-{current_user['user_id'][:8]}-{uuid.uuid4().hex[:6]}"
    )
    cleaned = re.sub(r"[^a-zA-Z0-9-]+", "-", raw).strip("-").lower()
    return (cleaned or f"rovi-{uuid.uuid4().hex[:8]}")[:50]


def create_openwa_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/whatsapp/openwa", tags=["whatsapp-openwa"])

    @router.get("/health")
    async def openwa_health(current_user: dict = Depends(get_current_user)):
        client = OpenWAClient()
        health = await client.request("GET", "/health")
        return {
            "openwa": health,
            "base_url": client.base_url,
            "user_id": current_user["user_id"],
        }

    @router.get("/sessions")
    async def list_openwa_sessions(current_user: dict = Depends(get_current_user)):
        docs = (
            await db.whatsapp_openwa_sessions.find(
                {
                    "tenant_id": current_user["tenant_id"],
                    "user_id": current_user["user_id"],
                    "status": {"$ne": "deleted"},
                },
                {"_id": 0},
            )
            .sort("created_at", -1)
            .to_list(50)
        )
        return {"sessions": docs}

    @router.post("/sessions")
    async def create_openwa_session(
        payload: OpenWASessionCreate, current_user: dict = Depends(get_current_user)
    ):
        client = OpenWAClient()
        name = build_openwa_session_name(current_user, payload.name)
        openwa_session = await client.request("POST", "/sessions", {"name": name})
        session_id = openwa_session.get("id")
        if not session_id:
            raise HTTPException(
                status_code=502, detail="OpenWA no regreso id de sesion"
            )

        now = now_iso()
        doc = {
            "id": f"whatsapp-openwa-session-{uuid.uuid4()}",
            "tenant_id": current_user["tenant_id"],
            "user_id": current_user["user_id"],
            "openwa_session_id": session_id,
            "name": openwa_session.get("name") or name,
            "status": openwa_session.get("status") or "created",
            "phone": openwa_session.get("phone"),
            "push_name": openwa_session.get("pushName"),
            "created_at": now,
            "updated_at": now,
        }
        await db.whatsapp_openwa_sessions.insert_one(doc)

        if payload.auto_start:
            started = await client.request("POST", f"/sessions/{session_id}/start")
            doc["openwa_start"] = started
            doc["status"] = started.get("status") or doc["status"]
            await db.whatsapp_openwa_sessions.update_one(
                {"id": doc["id"]},
                {
                    "$set": {
                        "status": doc["status"],
                        "openwa_start": started,
                        "updated_at": now_iso(),
                    }
                },
            )

        return {k: v for k, v in doc.items() if k != "_id"}

    @router.get("/sessions/{session_id}/status")
    async def get_openwa_session_status(
        session_id: str, current_user: dict = Depends(get_current_user)
    ):
        await get_owned_openwa_session(db, session_id, current_user)
        openwa_session = await OpenWAClient().request("GET", f"/sessions/{session_id}")
        await db.whatsapp_openwa_sessions.update_one(
            {
                "openwa_session_id": session_id,
                "tenant_id": current_user["tenant_id"],
                "user_id": current_user["user_id"],
            },
            {
                "$set": {
                    "status": openwa_session.get("status"),
                    "phone": openwa_session.get("phone"),
                    "push_name": openwa_session.get("pushName"),
                    "last_synced_at": now_iso(),
                    "updated_at": now_iso(),
                }
            },
        )
        return openwa_session

    @router.get("/sessions/{session_id}/qr")
    async def get_openwa_session_qr(
        session_id: str, current_user: dict = Depends(get_current_user)
    ):
        await get_owned_openwa_session(db, session_id, current_user)
        return await OpenWAClient().request("GET", f"/sessions/{session_id}/qr")

    @router.post("/sessions/{session_id}/start")
    async def start_openwa_session(
        session_id: str, current_user: dict = Depends(get_current_user)
    ):
        await get_owned_openwa_session(db, session_id, current_user)
        result = await OpenWAClient().request("POST", f"/sessions/{session_id}/start")
        await db.whatsapp_openwa_sessions.update_one(
            {
                "openwa_session_id": session_id,
                "tenant_id": current_user["tenant_id"],
                "user_id": current_user["user_id"],
            },
            {
                "$set": {
                    "status": result.get("status", "starting"),
                    "updated_at": now_iso(),
                }
            },
        )
        return result

    @router.post("/sessions/{session_id}/stop")
    async def stop_openwa_session(
        session_id: str, current_user: dict = Depends(get_current_user)
    ):
        await get_owned_openwa_session(db, session_id, current_user)
        result = await OpenWAClient().request("POST", f"/sessions/{session_id}/stop")
        await db.whatsapp_openwa_sessions.update_one(
            {
                "openwa_session_id": session_id,
                "tenant_id": current_user["tenant_id"],
                "user_id": current_user["user_id"],
            },
            {
                "$set": {
                    "status": result.get("status", "stopped"),
                    "updated_at": now_iso(),
                }
            },
        )
        return result

    @router.post("/sessions/{session_id}/send-text")
    async def send_openwa_text(
        session_id: str,
        payload: OpenWASendText,
        current_user: dict = Depends(get_current_user),
    ):
        session = await get_owned_openwa_session(db, session_id, current_user)
        chat_id = normalize_chat_id(payload.chat_id)
        result = await OpenWAClient().request(
            "POST",
            f"/sessions/{session_id}/messages/send-text",
            {"chatId": chat_id, "text": payload.text},
        )
        now = now_iso()
        await db.whatsapp_openwa_messages.insert_one(
            {
                "id": f"whatsapp-message-{uuid.uuid4()}",
                "tenant_id": current_user["tenant_id"],
                "user_id": current_user["user_id"],
                "openwa_session_id": session_id,
                "session_name": session.get("name"),
                "direction": "outbound",
                "chat_id": chat_id,
                "text": payload.text,
                "openwa_result": result,
                "created_at": now,
            }
        )
        return result

    @router.post("/sessions/{session_id}/webhooks")
    async def create_openwa_webhook(
        session_id: str,
        payload: OpenWAWebhookRegistration,
        current_user: dict = Depends(get_current_user),
    ):
        await get_owned_openwa_session(db, session_id, current_user)
        headers = {}
        secret = payload.secret or os.environ.get("OPENWA_ROVI_WEBHOOK_SECRET", "")
        if secret:
            headers["x-rovi-openwa-secret"] = secret
        result = await OpenWAClient().request(
            "POST",
            f"/sessions/{session_id}/webhooks",
            {"url": payload.url, "events": payload.events, "headers": headers},
        )
        await db.whatsapp_openwa_sessions.update_one(
            {
                "openwa_session_id": session_id,
                "tenant_id": current_user["tenant_id"],
                "user_id": current_user["user_id"],
            },
            {"$set": {"last_webhook": result, "updated_at": now_iso()}},
        )
        return result

    @router.post("/webhook")
    async def receive_openwa_webhook(
        request: Request,
        x_rovi_openwa_secret: Optional[str] = Header(default=None),
    ):
        expected = os.environ.get("OPENWA_ROVI_WEBHOOK_SECRET", "")
        if expected and x_rovi_openwa_secret != expected:
            raise HTTPException(status_code=401, detail="Webhook OpenWA no autorizado")

        payload = await request.json()
        session_id = (
            payload.get("sessionId")
            or payload.get("session_id")
            or (payload.get("session") or {}).get("id")
            or payload.get("session")
        )
        message = payload.get("message") or payload.get("data") or payload
        chat_id = (
            message.get("from") or message.get("chatId") or message.get("chat_id") or ""
        )
        text = (
            message.get("body") or message.get("text") or message.get("caption") or ""
        )
        is_group = str(chat_id).endswith("@g.us") or bool(message.get("isGroupMsg"))

        session = None
        if session_id:
            session = await db.whatsapp_openwa_sessions.find_one(
                {"openwa_session_id": session_id}, {"_id": 0}
            )
        classification = classify_whatsapp_text(text, is_group=is_group)
        now = now_iso()
        doc = {
            "id": f"whatsapp-message-{uuid.uuid4()}",
            "tenant_id": (session or {}).get("tenant_id"),
            "user_id": (session or {}).get("user_id"),
            "openwa_session_id": session_id,
            "direction": "inbound",
            "chat_id": chat_id,
            "text": text,
            "classification": classification,
            "raw_payload": payload,
            "created_at": now,
        }
        await db.whatsapp_openwa_messages.insert_one(doc)
        if session_id:
            await db.whatsapp_openwa_sessions.update_one(
                {"openwa_session_id": session_id},
                {"$set": {"last_inbound_at": now, "updated_at": now}},
            )
        return {"status": "received", "classification": classification}

    return router

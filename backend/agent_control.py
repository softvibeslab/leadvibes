from __future__ import annotations

import os
import re
import time
import uuid
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from auth import get_current_user
from ai_service import get_ai_response
from rovi_internal import ROVI_INTERNAL_TENANT_ID, require_rovi_internal_workspace


DEFAULT_OPENAI_COMPATIBLE_BASE_URL = os.environ.get("ROVI_AI_BASE_URL", "https://api.z.ai/api/paas/v4")
DEFAULT_AI_PROVIDER = os.environ.get("ROVI_AI_PROVIDER", "chat.z")
DEFAULT_AI_MODEL = os.environ.get("ROVI_AI_DEFAULT_MODEL", "glm-5")
DEFAULT_AI_KEY_ENV = os.environ.get("ROVI_AI_KEY_ENV", "ROVI_AI_API_KEY")
FALLBACK_AI_KEY_ENV = "EMERGENT_LLM_KEY"
FALLBACK_OPENAI_KEY_ENV = "OPENAI_API_KEY"
FALLBACK_OPENAI_BASE_URL = os.environ.get("ROVI_FALLBACK_AI_BASE_URL", "https://api.openai.com/v1")
FALLBACK_OPENAI_MODEL = os.environ.get("ROVI_FALLBACK_AI_MODEL", "gpt-5.2")
USD_TO_MXN = float(os.environ.get("ROVI_AI_USD_TO_MXN", "18.5"))
ROVI_INTERNAL_KNOWLEDGE_SCOPE = "rovi_internal"
DEFAULT_CONTROL_TOWER_OWNER_EMAILS = {"rgarciavital@gmail.com"}
CONTROL_TOWER_OWNER_EMAILS = {
    email.strip().lower()
    for email in os.environ.get("ROVI_CONTROL_TOWER_OWNER_EMAILS", ",".join(DEFAULT_CONTROL_TOWER_OWNER_EMAILS)).split(",")
    if email.strip()
}


def require_ai_control_tower_owner(current_user: dict) -> dict:
    """Restrict the AI Control Tower to Roger/explicit owner emails only."""
    user = require_rovi_internal_workspace(current_user)
    if user.get("email", "").lower() not in CONTROL_TOWER_OWNER_EMAILS:
        raise HTTPException(status_code=403, detail="Esta Torre de Control es privada y solo Roger tiene acceso.")
    return user


ROLE_SCOPES = [
    "rovi_admin",
    "rovi_sales",
    "rovi_marketing",
    "rovi_customer_success",
    "rovi_ops",
    "copim_council",
    "copim_association",
    "copim_member",
    "agency_admin",
    "broker",
    "vibe_orchestrator",
    "audience_intel",
    "offer_architect",
    "whatsapp_copywriter",
    "fulfillment_agent",
    "ab_test_analyst",
    "risk_guardian",
]


ROLE_LABELS = {
    "rovi_admin": "ROVI Admin",
    "rovi_sales": "ROVI Sales",
    "rovi_marketing": "ROVI Marketing",
    "rovi_customer_success": "ROVI Customer Success",
    "rovi_ops": "ROVI Ops",
    "copim_council": "Consejo COPIM",
    "copim_association": "Asociacion COPIM",
    "copim_member": "Miembro COPIM",
    "agency_admin": "Inmobiliaria",
    "broker": "Broker",
    "vibe_orchestrator": "VibeLab Orquestador",
    "audience_intel": "VibeLab Audience Intel",
    "offer_architect": "VibeLab Offer Architect",
    "whatsapp_copywriter": "VibeLab WhatsApp Copywriter",
    "fulfillment_agent": "VibeLab Fulfillment",
    "ab_test_analyst": "VibeLab A/B Analyst",
    "risk_guardian": "VibeLab Risk Guardian",
}


KNOWLEDGE_SCOPE_LABELS = {
    "global": "Global",
    ROVI_INTERNAL_KNOWLEDGE_SCOPE: "ROVI Internal Workspace",
    **ROLE_LABELS,
}


ROVI_WORKSPACE_GRAPH_FILES = [
    *([Path(os.environ["ROVI_WORKSPACE_GRAPH_PATH"])] if os.environ.get("ROVI_WORKSPACE_GRAPH_PATH") else []),
    Path("/app/project-graphify-out/rovi-project-with-docs-graph.json"),
    Path("/app/project-graphify-out/rovi-project-graph.json"),
    Path(__file__).resolve().parents[1] / "graphify-out" / "rovi-project-with-docs-graph.json",
    Path(__file__).resolve().parents[1] / "graphify-out" / "rovi-project-graph.json",
    Path(__file__).resolve().parent / "graphify-out" / "graph.json",
]


ROVI_WORKSPACE_SOURCE_HINTS = {
    "backend/rovi_internal.py",
    "backend/agent_control.py",
    "frontend/src/pages/RoviInternalWorkspacePage.js",
    "frontend/src/pages/RoviAIControlTowerPage.js",
    "frontend/src/pages/VibeLabPage.js",
    "frontend/src/components/Sidebar.js",
    "frontend/src/App.js",
    "backend/vibe_lab.py",
    "docs/AI_AGENT_CONTROL_TOWER.md",
    "docs/ROVI_OPERATIONS_INDEX.md",
    "docs/WORKSPACE_STATUS_SUMMARY.md",
    "docs/WORKSPACE_STATUS_DASHBOARD.html",
    "docs/ROVI_POCKET_EXECUTION_DASHBOARD.md",
    "docs/ROVI_POCKET_MASTER_PLAN.md",
}


ROVI_WORKSPACE_TERMS = {
    "rovi internal",
    "rovi_internal",
    "roviinternal",
    "roviworkspace",
    "revenue hq",
    "ai control tower",
    "ai-control",
    "agent_control",
    "roviaicontroltower",
    "roviinternalworkspace",
    "rovi_prospects",
    "rovi_service_plans",
    "rovi-internal",
    "vibe_lab",
    "vibelab",
    "mamivibes",
    "audience_groups",
    "vibe_experiments",
}


ROLE_PROMPTS = {
    "rovi_admin": "Actua como copiloto ejecutivo de ROVI. Prioriza MRR, churn, crecimiento, margen, riesgos operativos y oportunidades de expansion.",
    "rovi_sales": "Actua como closer B2B SaaS para ROVI CRM. Ayuda a priorizar prospectos, preparar demos, manejar objeciones y convertir propuestas.",
    "rovi_marketing": "Actua como estratega de demanda para ROVI. Optimiza fuentes, mensajes, audiencias, CPL, MQL y handoff hacia ventas.",
    "rovi_customer_success": "Actua como Customer Success Manager. Prioriza onboarding, adopcion, expansion, salud de cuenta y riesgo de churn.",
    "rovi_ops": "Actua como Revenue Ops. Revisa calidad de datos, automatizaciones, integraciones, permisos, costos y confiabilidad operativa.",
    "copim_council": "Actua como asesor institucional COPIM. Ayuda a gestionar asociaciones, membresias, cobranza, eventos, marketplace y KPIs nacionales.",
    "copim_association": "Actua como operador de asociacion COPIM. Ayuda con socios locales, cobranza, eventos, cursos, comunidad y activacion comercial.",
    "copim_member": "Actua como asistente de un miembro COPIM. Ayuda con perfil profesional, cursos, eventos, propiedades, marketplace y oportunidades comerciales.",
    "agency_admin": "Actua como director comercial de una inmobiliaria. Ayuda a priorizar brokers, leads, pipeline, campanas, conversion y revenue.",
    "broker": "Actua como coach comercial inmobiliario. Ayuda a calificar leads, preparar seguimientos, scripts, tareas y siguientes acciones concretas.",
    "vibe_orchestrator": "Actua como orquestador de VibeLab. Convierte contexto, oferta, segmento y metricas en la siguiente accion comercial. Prioriza velocidad, etica, ROI y aprendizaje.",
    "audience_intel": "Actua como analista de audiencias hiperlocales. Clasifica grupos por intencion, permiso comercial, sensibilidad cultural, riesgo de spam y mejor propuesta de valor.",
    "offer_architect": "Actua como arquitecto de ofertas digitales. Disena ofertas entregables en menos de 30 minutos con precio, promesa, insumos, margen y flujo de fulfillment.",
    "whatsapp_copywriter": "Actua como copywriter nativo de WhatsApp. Escribe mensajes cortos por grupo, con tono contextual, CTA claro, sin promesas falsas ni presion abusiva.",
    "fulfillment_agent": "Actua como operador de fulfillment digital. Transforma datos del comprador en prompt final, activo entregable, mensaje de entrega y solicitud de testimonio.",
    "ab_test_analyst": "Actua como analista de experimentos A/B. Compara variantes por replies, clicks, pagos y revenue; recomienda ganador y siguiente experimento.",
    "risk_guardian": "Actua como guardian de riesgo y reputacion. Bloquea scraping, autoposting masivo, claims sensibles y mensajes que violen reglas de comunidad.",
}


DEFAULT_TOOLS = {
    "list_leads": True,
    "lead_metrics": True,
    "marketplace_recommendations": True,
    "copim_context": True,
    "rovi_internal_metrics": True,
    "vibe_lab_context": True,
    "write_actions": False,
}


AGENCY_AGENTS_CATALOG_PATH = Path(__file__).resolve().parent / "agency_agents_catalog.json"
try:
    AGENCY_AGENTS_CATALOG = json.loads(AGENCY_AGENTS_CATALOG_PATH.read_text(encoding="utf-8"))
except Exception:
    AGENCY_AGENTS_CATALOG = []

SPECIALIST_AGENT_CATALOG = [
    {"id": "lead_triage", "label": "Especialista en calificacion", "user_prompt": "Evalua intencion, presupuesto, urgencia, friccion y siguiente accion del lead.", "subcategory": "Calificacion y seguimiento", "recommended_roles": ["agency_admin", "broker"]},
    {"id": "whatsapp_followup", "label": "Copywriter WhatsApp", "user_prompt": "Escribe mensajes cortos, humanos, con contexto local y CTA claro; evita spam y presion abusiva.", "subcategory": "Seguimiento comercial", "recommended_roles": ["broker", "agency_admin", "copim_council", "copim_association"]},
    {"id": "appointment_setter", "label": "Agendador", "user_prompt": "Convierte conversaciones en citas: propone horarios, confirma datos y prepara recordatorios.", "subcategory": "Agenda y reuniones", "recommended_roles": ["agency_admin", "broker", "copim_council", "copim_association"]},
    {"id": "property_matcher", "label": "Matcher inmobiliario", "user_prompt": "Cruza necesidades, zona, presupuesto y etapa del cliente con inventario u oportunidades.", "subcategory": "Inventario y propiedades", "recommended_roles": ["agency_admin", "broker"]},
    {"id": "offer_architect", "label": "Arquitecto de ofertas", "user_prompt": "Disena ofertas simples con promesa, entregable, precio, margen, insumos y flujo de cumplimiento.", "subcategory": "Estrategia y ofertas", "recommended_roles": ["rovi_sales", "rovi_marketing", "copim_council", "copim_association"]},
    {"id": "audience_intel", "label": "Inteligencia de audiencia", "user_prompt": "Analiza segmentos, grupos, lenguaje, permiso comercial y sensibilidad cultural antes de comunicar.", "subcategory": "ROVI interno", "recommended_roles": ["rovi_marketing", "rovi_sales"]},
    {"id": "fulfillment_operator", "label": "Operador fulfillment", "user_prompt": "Transforma datos del comprador en entregable final, mensaje de entrega y solicitud de testimonio.", "subcategory": "ROVI interno", "recommended_roles": ["rovi_ops", "rovi_customer_success"]},
    {"id": "ab_test_analyst", "label": "Analista A/B", "user_prompt": "Compara variantes por replies, clicks, pagos y revenue; recomienda ganador y siguiente experimento.", "subcategory": "ROVI interno", "recommended_roles": ["rovi_marketing", "rovi_sales"]},
    {"id": "revenue_ops", "label": "Revenue Ops", "user_prompt": "Revisa pipeline, conversion, presupuestos, costos, calidad de datos y cuellos de botella.", "subcategory": "Direccion comercial", "recommended_roles": ["agency_admin", "rovi_ops", "rovi_admin"]},
    {"id": "copim_membership_ops", "label": "Operacion COPIM", "user_prompt": "Gestiona membresias, cobranza, eventos, cursos, comunidad, marketplace y KPIs institucionales.", "subcategory": "COPIM", "recommended_roles": ["copim_council", "copim_association", "copim_member"]},
    {"id": "risk_guardian", "label": "Guardian de riesgo", "user_prompt": "Detecta permisos faltantes, claims sensibles, riesgo reputacional, scraping y mensajes tipo spam.", "subcategory": "Gobernanza y riesgo", "recommended_roles": ["agency_admin", "rovi_admin", "rovi_ops"]},
    *AGENCY_AGENTS_CATALOG,
]

MULTIMODAL_SKILL_CATALOG = [
    {
        "id": "file_reader",
        "label": "Lectura de archivos",
        "user_prompt": "Lee documentos cargados por el usuario, extrae hechos clave, detecta tipo de entidad CRM y propone mapping antes de importar.",
        "category": "superpowers",
        "subcategory": "Archivos",
        "recommended_roles": ["agency_admin", "broker", "property_manager", "manager"],
        "input_types": ["pdf", "doc", "docx", "txt", "md", "csv", "xlsx", "json"],
    },
    {
        "id": "image_ocr",
        "label": "Imagenes y screenshots",
        "user_prompt": "Analiza imagenes, screenshots y fotos de documentos para extraer texto, contactos, datos de propiedad, tareas o eventos.",
        "category": "superpowers",
        "subcategory": "Imagenes",
        "recommended_roles": ["agency_admin", "broker", "property_manager", "manager"],
        "input_types": ["jpg", "jpeg", "png", "webp", "screenshot"],
    },
    {
        "id": "audio_transcription",
        "label": "Audios y notas de voz",
        "user_prompt": "Transcribe audios o notas de voz, resume intencion y convierte pendientes en leads, tareas, eventos o propiedades con confirmacion.",
        "category": "superpowers",
        "subcategory": "Audio",
        "recommended_roles": ["agency_admin", "broker", "property_manager"],
        "input_types": ["mp3", "m4a", "ogg", "wav", "voice_note"],
    },
    {
        "id": "video_understanding",
        "label": "Video",
        "user_prompt": "Procesa videos compartidos, identifica contexto comercial y extrae informacion util para propiedades, leads, reuniones o seguimiento.",
        "category": "superpowers",
        "subcategory": "Video",
        "recommended_roles": ["agency_admin", "broker", "property_manager"],
        "input_types": ["mp4", "mov", "webm"],
    },
    {
        "id": "drive_folder_reader",
        "label": "Links y carpetas publicas",
        "user_prompt": "Interpreta links publicos, especialmente Google Drive, detecta estructura de carpetas y propone una ruta de extraccion para CRM.",
        "category": "superpowers",
        "subcategory": "Links",
        "recommended_roles": ["agency_admin", "broker", "property_manager", "manager"],
        "input_types": ["url", "google_drive", "public_folder"],
    },
]

SKILL_CATALOG = [
    {
        "id": item["id"],
        "label": item["label"],
        "description": item["user_prompt"],
        "category": item.get("category", "operacion"),
        "subcategory": item.get("subcategory", "Skills comerciales"),
        "recommended_roles": item.get("recommended_roles", []),
        "input_types": item.get("input_types", []),
        "is_superpower": item.get("category") == "superpowers",
    }
    for item in [*SPECIALIST_AGENT_CATALOG, *MULTIMODAL_SKILL_CATALOG]
]

MEMBERSHIP_AGENT_RULES = {
    "free": {"role_agents": ["broker"], "specialist_agents": ["lead_triage"], "skills": ["lead_triage"]},
    "starter": {"role_agents": ["broker"], "specialist_agents": ["lead_triage", "whatsapp_followup", "appointment_setter"], "skills": ["lead_triage", "whatsapp_followup", "appointment_setter"]},
    "pro": {"role_agents": ["broker", "agency_admin"], "specialist_agents": ["lead_triage", "whatsapp_followup", "appointment_setter", "property_matcher", "offer_architect"], "skills": ["lead_triage", "whatsapp_followup", "appointment_setter", "property_matcher", "offer_architect"]},
    "business": {"role_agents": ["agency_admin", "broker", "rovi_sales", "rovi_ops"], "specialist_agents": ["lead_triage", "whatsapp_followup", "appointment_setter", "property_matcher", "offer_architect", "revenue_ops", "risk_guardian"], "skills": ["lead_triage", "whatsapp_followup", "appointment_setter", "property_matcher", "offer_architect", "revenue_ops", "risk_guardian"]},
    "copim": {"role_agents": ["copim_council", "copim_association", "copim_member"], "specialist_agents": ["copim_membership_ops", "whatsapp_followup", "appointment_setter", "offer_architect"], "skills": ["copim_membership_ops", "whatsapp_followup", "appointment_setter", "offer_architect"]},
    "internal": {"role_agents": ROLE_SCOPES, "specialist_agents": [item["id"] for item in SPECIALIST_AGENT_CATALOG], "skills": [item["id"] for item in SKILL_CATALOG]},
}


MODEL_PRICING_PER_1M_USD = {
    "glm-5": {"input": 0.40, "output": 1.28},
    "gpt-5.2": {"input": 1.25, "output": 10.00},
    "gpt-5.4-mini": {"input": 0.25, "output": 2.00},
}


class AgentConfigCreate(BaseModel):
    role_scope: str
    name: str
    description: str = ""
    provider: str = DEFAULT_AI_PROVIDER
    model: str = DEFAULT_AI_MODEL
    base_url: Optional[str] = DEFAULT_OPENAI_COMPATIBLE_BASE_URL
    api_key_env: str = DEFAULT_AI_KEY_ENV
    system_prompt: str
    temperature: float = 0.25
    max_output_tokens: int = 900
    is_active: bool = True
    knowledge_enabled: bool = True
    tools: dict[str, bool] = Field(default_factory=lambda: dict(DEFAULT_TOOLS))
    monthly_budget_mxn: float = 2500


class AgentConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None
    api_key_env: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_output_tokens: Optional[int] = None
    is_active: Optional[bool] = None
    knowledge_enabled: Optional[bool] = None
    tools: Optional[dict[str, bool]] = None
    monthly_budget_mxn: Optional[float] = None


class UserAgentAccessUpdate(BaseModel):
    membership_tier: Optional[str] = None
    orchestrator_role: Optional[str] = None
    orchestration_mode: str = "role_first"
    enabled_role_agents: list[str] = Field(default_factory=list)
    enabled_specialist_agents: list[str] = Field(default_factory=list)
    enabled_agents: list[str] = Field(default_factory=list)  # backwards compatible alias for role agents
    enabled_skills: list[str] = Field(default_factory=list)
    is_active: bool = True
    notes: str = ""


class LinkCodeRequest(BaseModel):
    channel: str = "whatsapp"
    destination: str = ""
    telegram_bot_token: str = ""


class AgentRunRequest(BaseModel):
    message: str
    role_scope: Optional[str] = None
    include_context: bool = True


class StrategyRunRequest(BaseModel):
    question: str
    role_scope: Optional[str] = None
    include_context: bool = True


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    result = {key: value for key, value in doc.items() if key != "_id"}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result


def serialize_docs(docs: list[dict]) -> list[dict]:
    return [serialize_doc(doc) for doc in docs]


def estimate_tokens(text: str | None) -> int:
    if not text:
        return 0
    return max(1, int(len(text) / 4))


def estimate_cost_usd(model: str, input_tokens: int, output_tokens: int, provider: str | None = None) -> float:
    if (provider or "").lower() in {"ollama", "ollama_local", "local_ollama"}:
        return 0
    pricing = MODEL_PRICING_PER_1M_USD.get(model, MODEL_PRICING_PER_1M_USD["glm-5"])
    return round(
        (input_tokens / 1_000_000) * pricing["input"]
        + (output_tokens / 1_000_000) * pricing["output"],
        6,
    )


def public_config(config: dict) -> dict:
    config = serialize_doc(config) or {}
    config.pop("_id", None)
    provider = (config.get("provider") or DEFAULT_AI_PROVIDER).lower()
    api_key_required = provider not in {"ollama", "ollama_local", "local_ollama"}
    primary_key_configured = bool(os.environ.get(config.get("api_key_env") or DEFAULT_AI_KEY_ENV))
    fallback_key_configured = bool(os.environ.get(FALLBACK_AI_KEY_ENV))
    config["api_key_required"] = api_key_required
    config["api_key_configured"] = (
        True
        if not api_key_required
        else primary_key_configured or fallback_key_configured
    )
    config["api_key_fallback"] = (
        "emergentintegrations"
        if api_key_required and not primary_key_configured and fallback_key_configured
        else None
    )
    return config


def apply_runtime_ai_overrides(config: dict) -> dict:
    """Let production env pick the live provider without rewriting stored profiles."""
    resolved = dict(config or {})
    overrides = {
        "provider": os.environ.get("ROVI_AI_PROVIDER"),
        "model": os.environ.get("ROVI_AI_DEFAULT_MODEL"),
        "base_url": os.environ.get("ROVI_AI_BASE_URL"),
        "api_key_env": os.environ.get("ROVI_AI_KEY_ENV"),
    }
    for key, value in overrides.items():
        if value:
            resolved[key] = value
    return resolved


def resolve_role_scope(current_user: dict) -> str:
    role = current_user.get("role") or "broker"
    account_type = current_user.get("account_type") or "individual"
    tenant_type = current_user.get("active_workspace", {}).get("tenant_type") if current_user.get("active_workspace") else None

    if role in {"rovi_admin", "rovi_sales", "rovi_marketing", "rovi_customer_success", "rovi_ops"}:
        return role
    if account_type == "rovi_internal" or current_user.get("tenant_id") == ROVI_INTERNAL_TENANT_ID:
        return "rovi_admin"
    if role == "copim_member" or account_type == "copim_member":
        return "copim_member"
    if role == "copim_operator" or tenant_type == "association":
        return "copim_association"
    if role == "copim_admin" or account_type == "copim" or tenant_type == "copim":
        return "copim_council"
    if account_type == "agency" or role in {"admin", "manager", "owner"}:
        return "agency_admin"
    return "broker"


def default_agent_doc(role_scope: str) -> dict:
    now = now_iso()
    label = ROLE_LABELS.get(role_scope, role_scope)
    return {
        "id": f"agent-config-{role_scope}",
        "role_scope": role_scope,
        "name": f"Agente {label}",
        "description": f"Prompt y herramientas base para {label}.",
        "provider": DEFAULT_AI_PROVIDER,
        "model": DEFAULT_AI_MODEL,
        "base_url": DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
        "api_key_env": DEFAULT_AI_KEY_ENV,
        "system_prompt": ROLE_PROMPTS.get(role_scope, ROLE_PROMPTS["broker"]),
        "temperature": 0.25,
        "max_output_tokens": 900,
        "is_active": True,
        "knowledge_enabled": True,
        "tools": dict(DEFAULT_TOOLS),
        "monthly_budget_mxn": 2500,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }


async def ensure_default_agent_configs(db: AsyncIOMotorDatabase) -> None:
    for role_scope in ROLE_SCOPES:
        doc = default_agent_doc(role_scope)
        await db.agent_configs.update_one(
            {"id": doc["id"]},
            {"$setOnInsert": doc},
            upsert=True,
        )


async def resolve_agent_config(
    db: AsyncIOMotorDatabase,
    role_scope: str,
) -> dict:
    await ensure_default_agent_configs(db)
    config = await db.agent_configs.find_one(
        {"role_scope": role_scope, "is_active": True},
        {"_id": 0},
    )
    if not config:
        config = default_agent_doc(role_scope if role_scope in ROLE_SCOPES else "broker")
    return config


def build_lead_query(current_user: dict) -> dict:
    tenant_id = current_user.get("tenant_id")
    query: dict[str, Any] = {"tenant_id": tenant_id}

    # Brokers inside agency workspaces should not receive another broker's assigned leads.
    if current_user.get("role") == "broker" and current_user.get("account_type") != "individual":
        user_id = current_user.get("user_id")
        query["$or"] = [
            {"assigned_broker_id": user_id},
            {"created_by": user_id},
            {"assigned_broker_id": {"$in": [None, ""]}},
        ]
    return query


async def build_database_context(
    db: AsyncIOMotorDatabase,
    current_user: dict,
    role_scope: str,
    tools: dict[str, bool],
) -> dict:
    tenant_id = current_user.get("tenant_id")
    context: dict[str, Any] = {
        "user": {
            "id": current_user.get("user_id"),
            "role": current_user.get("role"),
            "role_scope": role_scope,
            "tenant_id": tenant_id,
            "account_type": current_user.get("account_type"),
        },
        "metrics": {},
        "records": {},
    }

    if tools.get("lead_metrics") or tools.get("list_leads"):
        lead_query = build_lead_query(current_user)
        status_pipeline = [
            {"$match": lead_query},
            {"$group": {"_id": "$status", "count": {"$sum": 1}, "budget_mxn": {"$sum": {"$ifNull": ["$budget_mxn", 0]}}}},
            {"$sort": {"count": -1}},
        ]
        status_counts = await db.leads.aggregate(status_pipeline).to_list(20)
        context["metrics"]["lead_status"] = [
            {"status": item.get("_id") or "sin_estado", "count": item.get("count", 0), "budget_mxn": item.get("budget_mxn", 0)}
            for item in status_counts
        ]
        context["metrics"]["total_leads"] = await db.leads.count_documents(lead_query)

    if tools.get("list_leads"):
        leads = await db.leads.find(
            build_lead_query(current_user),
            {
                "_id": 0,
                "id": 1,
                "name": 1,
                "status": 1,
                "priority": 1,
                "source": 1,
                "budget_mxn": 1,
                "property_interest": 1,
                "next_action": 1,
                "assigned_broker_id": 1,
                "updated_at": 1,
            },
        ).sort("updated_at", -1).limit(8).to_list(8)
        context["records"]["recent_leads"] = serialize_docs(leads)

    if tools.get("copim_context") and role_scope.startswith("copim"):
        member_query = {"tenant_id": tenant_id}
        context["metrics"]["copim_members"] = await db.copim_members.count_documents(member_query)
        context["metrics"]["copim_invoices"] = await db.copim_invoices.count_documents({"tenant_id": tenant_id})
        context["metrics"]["copim_events"] = await db.copim_events.count_documents({"tenant_id": tenant_id})

    if tools.get("rovi_internal_metrics") and role_scope.startswith("rovi_"):
        prospect_count = await db.rovi_prospects.count_documents({"tenant_id": ROVI_INTERNAL_TENANT_ID})
        active_count = await db.rovi_prospects.count_documents({
            "tenant_id": ROVI_INTERNAL_TENANT_ID,
            "stage": {"$nin": ["perdido"]},
        })
        context["metrics"]["rovi_internal"] = {
            "prospects": prospect_count,
            "active_pipeline": active_count,
        }

    if tools.get("vibe_lab_context") and (role_scope.startswith("vibe_") or role_scope in {"audience_intel", "offer_architect", "whatsapp_copywriter", "fulfillment_agent", "ab_test_analyst", "risk_guardian"}):
        group_counts = await db.vibe_audience_groups.aggregate([
            {"$match": {"tenant_id": tenant_id, "is_excluded": {"$ne": True}}},
            {"$group": {"_id": "$segment", "count": {"$sum": 1}, "avg_score": {"$avg": "$score"}}},
            {"$sort": {"count": -1}},
        ]).to_list(20)
        context["metrics"]["vibe_lab_segments"] = [
            {"segment": item.get("_id") or "other", "count": item.get("count", 0), "avg_score": round(item.get("avg_score") or 0, 1)}
            for item in group_counts
        ]
        context["metrics"]["vibe_lab_experiments"] = await db.vibe_experiments.count_documents({"tenant_id": tenant_id})
        context["metrics"]["vibe_lab_posts_pending_approval"] = await db.vibe_posts.count_documents({
            "tenant_id": tenant_id,
            "status": "draft",
            "requires_approval": True,
        })
        context["records"]["vibe_top_groups"] = serialize_docs(await db.vibe_audience_groups.find(
            {"tenant_id": tenant_id, "is_excluded": {"$ne": True}},
            {"_id": 0, "id": 1, "name": 1, "segment": 1, "platform": 1, "score": 1, "proposed_value": 1},
        ).sort("score", -1).limit(8).to_list(8))
        context["records"]["vibe_active_offers"] = serialize_docs(await db.vibe_offers.find(
            {"tenant_id": tenant_id, "is_active": {"$ne": False}},
            {"_id": 0, "id": 1, "title": 1, "offer_type": 1, "price_mxn": 1, "delivery_minutes": 1, "value_prop": 1},
        ).sort("created_at", -1).limit(8).to_list(8))

    if tools.get("marketplace_recommendations"):
        marketplace_query = {"status": "published"}
        if role_scope.startswith("copim"):
            marketplace_query["visibility"] = {"$in": ["public", "copim"]}
        listings = await db.marketplace_listings.find(
            marketplace_query,
            {"_id": 0, "id": 1, "title": 1, "listing_type": 1, "price_mxn": 1, "category": 1},
        ).sort("created_at", -1).limit(5).to_list(5)
        context["records"]["marketplace_suggestions"] = serialize_docs(listings)

    return context


def normalize_terms(text: str) -> set[str]:
    return {
        token.lower()
        for token in "".join(ch if ch.isalnum() else " " for ch in text).split()
        if len(token) > 3
    }


async def find_relevant_knowledge(
    db: AsyncIOMotorDatabase,
    role_scope: str,
    message: str,
    limit: int = 5,
) -> list[dict]:
    query_terms = normalize_terms(message)
    scope_filter = ["global", role_scope]
    if role_scope.startswith("rovi_"):
        scope_filter.append(ROVI_INTERNAL_KNOWLEDGE_SCOPE)
    chunks = await db.agent_knowledge_chunks.find(
        {
            "role_scope": {"$in": scope_filter},
            "status": "indexed",
        },
        {"_id": 0},
    ).sort("created_at", -1).limit(250).to_list(250)

    ranked = []
    for chunk in chunks:
        content = chunk.get("content", "")
        score = len(query_terms.intersection(normalize_terms(content)))
        if score > 0:
            ranked.append((score, chunk))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [item[1] for item in ranked[:limit]]


def build_agent_messages(config: dict, user_message: str, db_context: dict, knowledge_chunks: list[dict]) -> list[dict]:
    context_block = ""
    if db_context:
        context_block += f"\n\nCONTEXTO CRM SEGURO:\n{db_context}"
    if knowledge_chunks:
        knowledge_lines = []
        for idx, chunk in enumerate(knowledge_chunks, start=1):
            title = chunk.get("title") or chunk.get("file_name") or f"Fuente {idx}"
            knowledge_lines.append(f"[{idx}] {title}\n{chunk.get('content', '')[:1600]}")
        context_block += "\n\nBASE DE CONOCIMIENTO RELEVANTE:\n" + "\n\n".join(knowledge_lines)

    system_sections = [config.get("system_prompt") or ROLE_PROMPTS["broker"]]
    if config.get("customer_prompt"):
        system_sections.append(f"Contexto del usuario y permisos:\n{config.get('customer_prompt')}")
    if config.get("tone_instructions"):
        system_sections.append(f"Tono requerido:\n{config.get('tone_instructions')}")
    if config.get("enabled_skills"):
        system_sections.append("Skills activas:\n" + "\n".join(f"- {skill}" for skill in config.get("enabled_skills") or []))

    system_prompt = f"""{chr(10).join(system_sections)}

Reglas de seguridad:
- Responde en espanol mexicano, claro y accionable.
- Usa solo los datos del contexto CRM que te fueron entregados.
- Si falta informacion, dilo y recomienda la siguiente accion.
- No inventes datos financieros, usuarios, leads, membresias ni permisos.
- Para acciones de escritura, prepara una propuesta y pide confirmacion humana.
"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"{user_message}{context_block}"},
    ]


async def call_openai_compatible(messages: list[dict], config: dict) -> dict:
    provider = (config.get("provider") or DEFAULT_AI_PROVIDER).lower()
    api_key_env = config.get("api_key_env") or DEFAULT_AI_KEY_ENV
    api_key = os.environ.get(api_key_env)
    api_key_required = provider not in {"ollama", "ollama_local", "local_ollama"}
    if api_key_required and not api_key:
        raise RuntimeError(f"Falta configurar {api_key_env} en el entorno del backend.")

    base_url = (config.get("base_url") or DEFAULT_OPENAI_COMPATIBLE_BASE_URL).rstrip("/")
    if base_url.endswith("/chat/completions"):
        endpoint = base_url
    elif provider in {"ollama", "ollama_local", "local_ollama"} and not base_url.endswith("/v1"):
        endpoint = f"{base_url}/v1/chat/completions"
    else:
        endpoint = f"{base_url}/chat/completions"
    payload = {
        "model": config.get("model") or DEFAULT_AI_MODEL,
        "messages": messages,
        "temperature": float(config.get("temperature", 0.25)),
        "max_tokens": int(config.get("max_output_tokens", 900)),
    }
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    timeout_seconds = float(config.get("timeout_seconds") or (180 if provider in {"ollama", "ollama_local", "local_ollama"} else 45))
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            endpoint,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    usage = data.get("usage") or {}
    return {
        "content": content or "El proveedor no devolvio contenido.",
        "usage": {
            "input_tokens": usage.get("prompt_tokens"),
            "output_tokens": usage.get("completion_tokens"),
            "total_tokens": usage.get("total_tokens"),
        },
        "raw_provider": provider or "openai_compatible",
    }


async def call_direct_openai_fallback(messages: list[dict], config: dict | None = None) -> dict:
    api_key = os.environ.get(FALLBACK_OPENAI_KEY_ENV) or os.environ.get(FALLBACK_AI_KEY_ENV)
    if not api_key:
        raise RuntimeError(f"Falta configurar {FALLBACK_OPENAI_KEY_ENV} o {FALLBACK_AI_KEY_ENV}.")

    base_url = FALLBACK_OPENAI_BASE_URL.rstrip("/")
    endpoint = base_url if base_url.endswith("/chat/completions") else f"{base_url}/chat/completions"
    payload = {
        "model": os.environ.get("ROVI_FALLBACK_AI_MODEL") or FALLBACK_OPENAI_MODEL,
        "messages": messages,
        "temperature": float((config or {}).get("temperature", 0.25)),
        "max_tokens": int((config or {}).get("max_output_tokens", 900)),
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            endpoint,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    usage = data.get("usage") or {}
    return {
        "content": content or "El proveedor no devolvio contenido.",
        "usage": {
            "input_tokens": usage.get("prompt_tokens"),
            "output_tokens": usage.get("completion_tokens"),
            "total_tokens": usage.get("total_tokens"),
        },
        "raw_provider": "openai_direct_fallback",
    }


def build_local_agent_response(messages: list[dict], config: dict, error: Exception | None = None) -> dict:
    role_scope = config.get("role_scope") or "broker"
    role_label = ROLE_LABELS.get(role_scope, "ROVI")
    prompt = ROLE_PROMPTS.get(role_scope, ROLE_PROMPTS["broker"])
    user_message = messages[-1]["content"] if messages else ""
    visible_question = short_text(user_message.replace("\n", " "), 280)
    domain_hint = (
        "socios, asociaciones, cursos, eventos, cobranza y marketplace"
        if role_scope.startswith("copim")
        else "leads, pipeline, campanas, scripts, marketplace y prioridades comerciales"
    )
    error_hint = f"\n\nDetalle tecnico: {short_text(error, 180)}" if error else ""

    content = (
        f"Estoy activo como {role_label} en modo local de respaldo. "
        f"{prompt}\n\n"
        f"Sobre tu solicitud: {visible_question}\n\n"
        f"Puedo ayudarte a priorizar {domain_hint} con la informacion disponible del workspace. "
        "Para una respuesta generativa completa, configura una llave valida de proveedor IA "
        "(`ROVI_AI_API_KEY` u `OPENAI_API_KEY`) o deja activo el fallback compatible."
        f"{error_hint}"
    )
    return {"content": content, "usage": {}, "raw_provider": "local_fallback"}


async def call_emergent_model(messages: list[dict], session_id: str, config: dict | None = None) -> dict:
    if not os.environ.get(FALLBACK_AI_KEY_ENV) and not os.environ.get(FALLBACK_OPENAI_KEY_ENV):
        raise RuntimeError(f"Falta configurar {FALLBACK_AI_KEY_ENV} o {FALLBACK_OPENAI_KEY_ENV} en el entorno del backend.")

    system_messages = [
        item.get("content", "")
        for item in messages
        if item.get("role") == "system" and item.get("content")
    ]
    user_content = messages[-1]["content"] if messages else ""
    full_message = user_content
    if system_messages:
        full_message = (
            "Instrucciones del agente:\n"
            + "\n\n".join(system_messages)
            + "\n\nMensaje del usuario:\n"
            + user_content
        )

    try:
        return await call_direct_openai_fallback(messages, config)
    except Exception:
        pass

    content = await get_ai_response(
        user_message=full_message,
        session_id=session_id,
        context=None,
        ai_profile={"style": "institucional y accionable", "goals": "resolver preguntas del workspace ROVI/COPIM"},
        user_name="ROVI",
    )
    if "funcionalidad de ia no" in content.lower():
        raise RuntimeError("emergentintegrations no esta instalado y no hubo fallback directo disponible.")
    return {"content": content, "usage": {}, "raw_provider": "emergentintegrations"}


async def call_model(messages: list[dict], config: dict, session_id: str) -> dict:
    provider = (config.get("provider") or DEFAULT_AI_PROVIDER).lower()
    if provider in {"emergent", "emergentintegrations"}:
        try:
            return await call_emergent_model(messages, session_id, config)
        except Exception as exc:
            return build_local_agent_response(messages, config, exc)

    try:
        return await call_openai_compatible(messages, config)
    except Exception as primary_error:
        if os.environ.get(FALLBACK_AI_KEY_ENV) or os.environ.get(FALLBACK_OPENAI_KEY_ENV):
            try:
                return await call_emergent_model(messages, session_id, config)
            except Exception as fallback_error:
                combined_error = RuntimeError(f"Proveedor principal: {primary_error}. Fallback: {fallback_error}")
                return build_local_agent_response(messages, config, combined_error)
        return build_local_agent_response(messages, config, primary_error)


async def record_agent_usage(
    db: AsyncIOMotorDatabase,
    *,
    run_id: str,
    config: dict,
    current_user: dict,
    role_scope: str,
    input_tokens: int,
    output_tokens: int,
    latency_ms: int,
    success: bool,
    error: Optional[str] = None,
) -> dict:
    total_tokens = input_tokens + output_tokens
    cost_usd = estimate_cost_usd(
        config.get("model", DEFAULT_AI_MODEL),
        input_tokens,
        output_tokens,
        config.get("provider", DEFAULT_AI_PROVIDER),
    )
    event = {
        "id": f"usage-{uuid.uuid4()}",
        "run_id": run_id,
        "tenant_id": current_user.get("tenant_id"),
        "user_id": current_user.get("user_id"),
        "role_scope": role_scope,
        "provider": config.get("provider", DEFAULT_AI_PROVIDER),
        "model": config.get("model", DEFAULT_AI_MODEL),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
        "cost_usd": cost_usd,
        "cost_mxn": round(cost_usd * USD_TO_MXN, 4),
        "latency_ms": latency_ms,
        "success": success,
        "error": error,
        "created_at": now_iso(),
    }
    await db.agent_usage_events.insert_one(event)
    return event


async def run_agent_turn(
    db: AsyncIOMotorDatabase,
    request: AgentRunRequest,
    current_user: dict,
    *,
    forced_role_scope: Optional[str] = None,
    source: str = "runtime",
    config_override: Optional[dict] = None,
) -> dict:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje es obligatorio.")

    role_scope = forced_role_scope or request.role_scope or resolve_role_scope(current_user)
    if role_scope not in ROLE_SCOPES:
        raise HTTPException(status_code=422, detail="Rol de agente invalido.")

    base_config = config_override or await resolve_agent_config(db, role_scope)
    config = apply_runtime_ai_overrides(base_config)
    tools = config.get("tools") or {}
    db_context = await build_database_context(db, current_user, role_scope, tools) if request.include_context else {}
    knowledge_chunks = (
        await find_relevant_knowledge(db, role_scope, request.message)
        if config.get("knowledge_enabled", True)
        else []
    )
    messages = build_agent_messages(config, request.message, db_context, knowledge_chunks)
    session_id = f"agent-{role_scope}-{current_user.get('user_id')}"
    run_id = f"agent-run-{uuid.uuid4()}"
    started = time.perf_counter()
    success = True
    error = None

    try:
        model_response = await call_model(messages, config, session_id)
        content = model_response.get("content", "")
        provider_usage = model_response.get("usage") or {}
    except Exception as exc:  # keep the control tower useful even while provider credentials are being wired.
        success = False
        provider_response = getattr(exc, "response", None)
        status_code = getattr(provider_response, "status_code", None)
        reason_phrase = getattr(provider_response, "reason_phrase", "")
        try:
            provider_body = (provider_response.text or "")[:280] if provider_response else ""
        except Exception:
            provider_body = ""
        error = f"{str(exc)} | {provider_body}" if provider_body else str(exc)
        provider_hint = f" ({status_code} {reason_phrase})" if status_code else ""
        provider_name = (config.get("provider") or DEFAULT_AI_PROVIDER).lower()
        if provider_name in {"ollama", "ollama_local", "local_ollama"} and status_code == 404:
            content = (
                f"Ollama respondio 404 para el modelo `{config.get('model')}`. "
                "Normalmente significa que ese modelo no esta instalado localmente. "
                "Cambia a un modelo disponible o ejecuta `ollama pull <modelo>` y vuelve a probar."
            )
        else:
            content = (
                f"El agente ya esta configurado en ROVI, pero el proveedor de IA no respondio{provider_hint}. "
                "Revisa cuota, rate limit, token, modelo o base URL y vuelve a probar."
            )
        provider_usage = {}

    latency_ms = int((time.perf_counter() - started) * 1000)
    input_tokens = provider_usage.get("input_tokens") or estimate_tokens(str(messages))
    output_tokens = provider_usage.get("output_tokens") or estimate_tokens(content)

    run_doc = {
        "id": run_id,
        "tenant_id": current_user.get("tenant_id"),
        "user_id": current_user.get("user_id"),
        "role_scope": role_scope,
        "config_id": config.get("id"),
        "source": source,
        "message": request.message,
        "response": content,
        "context_summary": {
            "knowledge_chunks": len(knowledge_chunks),
            "tools_enabled": [key for key, enabled in tools.items() if enabled],
            "include_context": request.include_context,
        },
        "success": success,
        "error": error,
        "latency_ms": latency_ms,
        "created_at": now_iso(),
    }
    await db.agent_runs.insert_one(run_doc)
    usage_event = await record_agent_usage(
        db,
        run_id=run_id,
        config=config,
        current_user=current_user,
        role_scope=role_scope,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        success=success,
        error=error,
    )

    return {
        "success": success,
        "run_id": run_id,
        "run": serialize_doc(run_doc),
        "response": content,
        "usage": serialize_doc(usage_event),
        "config": public_config(config),
        "knowledge_sources": [
            {
                "file_id": chunk.get("file_id"),
                "title": chunk.get("title"),
                "chunk_index": chunk.get("chunk_index"),
            }
            for chunk in knowledge_chunks
        ],
    }


def parse_strategy_json(content: str) -> dict:
    try:
        return json.loads(content)
    except Exception:
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(content[start:end + 1])
            except Exception:
                return {}
    return {}


def short_text(value: Any, max_chars: int = 220) -> str:
    text = str(value or "").strip()
    return text[:max_chars]


def grafana_ref_id(index: int) -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return alphabet[index % len(alphabet)]


def grafana_unit_for_format(value_format: str | None) -> str:
    if value_format == "currency":
        return "currencyMXN"
    if value_format == "percent":
        return "percent"
    return "short"


def grafana_color_for_tone(tone: str | None) -> str:
    return {
        "success": "green",
        "warning": "orange",
        "danger": "red",
        "primary": "blue",
    }.get(tone or "primary", "blue")


def build_panel_base(panel_id: int, title: str, panel_type: str, grid_pos: dict, description: str = "") -> dict:
    return {
        "id": panel_id,
        "type": panel_type,
        "title": short_text(title, 90),
        "description": short_text(description, 240),
        "gridPos": grid_pos,
        "datasource": {"type": "rovi-strategy", "uid": "rovi-ai"},
        "targets": [{"refId": "A", "queryType": panel_type, "source": "strategy_playground"}],
        "fieldConfig": {"defaults": {}, "overrides": []},
        "options": {},
        "transformations": [],
        "links": [],
        "transparent": False,
    }


def build_grafana_strategy_dashboard(question: str, role_scope: str, strategy: dict, metrics: dict, graph: dict) -> dict:
    """Grafana-inspired dashboard JSON.

    ROVI does not embed Grafana here. The shape mirrors the durable ideas from
    Grafana dashboards: panels, gridPos, targets, fieldConfig and templating.
    """
    panels: list[dict] = []
    panel_id = 1
    y = 0
    kpis = strategy.get("kpis") or metrics.get("kpis", [])
    charts = metrics.get("charts", [])

    for index, kpi in enumerate(kpis[:4]):
        panel = build_panel_base(
            panel_id,
            kpi.get("label") or f"KPI {index + 1}",
            "stat",
            {"x": (index % 4) * 6, "y": y, "w": 6, "h": 4},
            kpi.get("description", ""),
        )
        panel["targets"] = [{
            "refId": grafana_ref_id(index),
            "queryType": "kpi",
            "metric": kpi.get("label"),
            "source": "strategy_payload",
        }]
        panel["fieldConfig"]["defaults"] = {
            "unit": grafana_unit_for_format(kpi.get("format")),
            "color": {"mode": "thresholds"},
            "thresholds": {
                "mode": "absolute",
                "steps": [
                    {"color": grafana_color_for_tone(kpi.get("tone")), "value": None},
                ],
            },
        }
        panel["options"] = {
            "orientation": "auto",
            "textMode": "value_and_name",
            "reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
        }
        panel["data"] = {
            "value": kpi.get("value", 0),
            "format": kpi.get("format") or "number",
            "tone": kpi.get("tone") or "primary",
        }
        panels.append(panel)
        panel_id += 1

    y += 4
    for index, chart in enumerate(charts[:4]):
        x = 0 if index % 2 == 0 else 12
        if index and index % 2 == 0:
            y += 8
        panel = build_panel_base(
            panel_id,
            chart.get("title") or f"Chart {index + 1}",
            "barchart",
            {"x": x, "y": y, "w": 12, "h": 8},
            "Visualizacion generada desde metricas del CRM.",
        )
        panel["targets"] = [{
            "refId": grafana_ref_id(index),
            "queryType": "aggregate",
            "metric": chart.get("id"),
            "source": "crm_metrics",
        }]
        panel["fieldConfig"]["defaults"] = {
            "unit": "short",
            "color": {"mode": "palette-classic"},
        }
        panel["options"] = {
            "legend": {"showLegend": False},
            "tooltip": {"mode": "single", "sort": "none"},
            "xField": "label",
            "yField": "value",
        }
        panel["data"] = chart.get("data", [])
        panels.append(panel)
        panel_id += 1

    y += 8
    critical_panel = build_panel_base(
        panel_id,
        "Ruta critica",
        "state-timeline",
        {"x": 0, "y": y, "w": 8, "h": 8},
        "Secuencia operativa priorizada por el agente estratega.",
    )
    critical_panel["targets"] = [{"refId": "A", "queryType": "critical_path", "source": "strategy_payload"}]
    critical_panel["options"] = {"showValue": "always", "mergeValues": False}
    critical_panel["data"] = strategy.get("critical_path", [])
    panels.append(critical_panel)
    panel_id += 1

    action_panel = build_panel_base(
        panel_id,
        "Plan de accion",
        "table",
        {"x": 8, "y": y, "w": 8, "h": 8},
        "Acciones, responsables, prioridad e impacto.",
    )
    action_panel["targets"] = [{"refId": "A", "queryType": "action_plan", "source": "strategy_payload"}]
    action_panel["fieldConfig"]["defaults"] = {"custom": {"align": "left"}}
    action_panel["options"] = {"showHeader": True}
    action_panel["data"] = strategy.get("action_plan", [])
    panels.append(action_panel)
    panel_id += 1

    graph_panel = build_panel_base(
        panel_id,
        "Knowledge graph",
        "nodeGraph",
        {"x": 16, "y": y, "w": 8, "h": 8},
        "Nodos Graphify mas relevantes para la pregunta.",
    )
    graph_panel["targets"] = [{"refId": "A", "queryType": "graphify_context", "source": "graphify"}]
    graph_panel["options"] = {"nodeLimit": 18, "edgeLimit": 28}
    graph_panel["data"] = {"nodes": graph.get("nodes", []), "links": graph.get("links", [])}
    panels.append(graph_panel)
    panel_id += 1

    y += 8
    handoff_panel = build_panel_base(
        panel_id,
        "Transferencia a agentes",
        "table",
        {"x": 0, "y": y, "w": 12, "h": 7},
        "Misiones sugeridas para agentes especializados por rol.",
    )
    handoff_panel["targets"] = [{"refId": "A", "queryType": "agent_handoffs", "source": "strategy_payload"}]
    handoff_panel["options"] = {"showHeader": True}
    handoff_panel["data"] = strategy.get("agent_handoffs", [])
    panels.append(handoff_panel)
    panel_id += 1

    summary_panel = build_panel_base(
        panel_id,
        "Resumen ejecutivo",
        "text",
        {"x": 12, "y": y, "w": 12, "h": 7},
        "Lectura ejecutiva para toma de decision.",
    )
    summary_panel["targets"] = [{"refId": "A", "queryType": "executive_summary", "source": "strategy_payload"}]
    summary_panel["options"] = {"mode": "markdown", "content": strategy.get("executive_summary", "")}
    summary_panel["data"] = {
        "answer": strategy.get("answer"),
        "executive_summary": strategy.get("executive_summary"),
        "graph_summary": strategy.get("graph_summary"),
    }
    panels.append(summary_panel)

    dashboard_uid = uuid.uuid5(uuid.NAMESPACE_URL, f"{role_scope}:{question}:{len(panels)}").hex[:12]
    return {
        "uid": f"rovi-{dashboard_uid}",
        "title": short_text(f"ROVI Strategy - {question}", 90),
        "description": "Dashboard dinamico generado por el Asistente Estratega de ROVI.",
        "tags": ["rovi", "ai", "strategy", "graphify", role_scope],
        "timezone": "browser",
        "schemaVersion": 39,
        "version": 1,
        "editable": True,
        "style": "dark",
        "time": {"from": "now-30d", "to": "now"},
        "refresh": "5m",
        "templating": {
            "list": [
                {
                    "name": "role_scope",
                    "type": "constant",
                    "query": role_scope,
                    "current": {"text": role_scope, "value": role_scope},
                },
                {
                    "name": "question",
                    "type": "textbox",
                    "query": question,
                    "current": {"text": question, "value": question},
                },
            ]
        },
        "annotations": {"list": []},
        "links": [],
        "panels": panels,
        "meta": {
            "generated_by": "ROVI Strategy Playground",
            "source_pattern": "grafana_dashboard_model",
            "role_scope": role_scope,
            "graph_nodes": len(graph.get("nodes", [])),
            "chart_count": len(charts),
            "kpi_count": len(kpis),
        },
    }


def graphify_strategy_context(question: str, max_nodes: int = 18, max_links: int = 28) -> dict:
    try:
        graph_path = resolve_rovi_workspace_graph_path()
        graph_data = json.loads(graph_path.read_text())
    except Exception:
        return {"available": False, "nodes": [], "links": [], "summary": "Graphify no disponible."}

    nodes = graph_data.get("nodes") or []
    links = graph_data.get("links") or graph_data.get("edges") or []
    degree: dict[str, int] = {}
    for link in links:
        source = link.get("source")
        target = link.get("target")
        degree[source] = degree.get(source, 0) + 1
        degree[target] = degree.get(target, 0) + 1

    query_terms = normalize_terms(
        f"{question} estrategia negocio ruta critica revenue agentes roles marketplace copim crm workspace database"
    )
    scored = []
    for node in nodes:
        node_id = node.get("id")
        label = str(node.get("label") or "")
        source = normalize_source_path(node.get("source_file") or node.get("file") or "")
        haystack = normalize_terms(f"{label} {source} {node_id}")
        overlap = len(query_terms.intersection(haystack))
        structural_score = min(degree.get(node_id, 0), 12) / 4
        source_bonus = 2 if source.startswith(("docs/", "backend/", "frontend/src/pages/")) else 0
        score = overlap * 3 + structural_score + source_bonus
        if score > 1:
            scored.append((score, node))

    scored.sort(key=lambda item: item[0], reverse=True)
    selected = scored[:max_nodes]
    selected_ids = {node.get("id") for _, node in selected}
    selected_links = [
        link for link in links
        if link.get("source") in selected_ids and link.get("target") in selected_ids
    ][:max_links]

    graph_nodes = [
        {
            "id": node.get("id"),
            "label": node.get("label") or node.get("id"),
            "source": normalize_source_path(node.get("source_file") or node.get("file") or ""),
            "type": node.get("file_type") or "node",
            "community": node.get("community"),
            "score": round(score, 2),
        }
        for score, node in selected
    ]
    graph_links = [
        {
            "source": link.get("source"),
            "target": link.get("target"),
            "relation": link.get("relation") or "relacion",
            "confidence": link.get("confidence") or "EXTRACTED",
        }
        for link in selected_links
    ]
    summary_lines = [
        f"- {node['label']} [{node['type']}] ({node['source']})"
        for node in graph_nodes[:10]
    ]
    return {
        "available": True,
        "graph_path": str(graph_path),
        "nodes": graph_nodes,
        "links": graph_links,
        "summary": "\n".join(summary_lines),
    }


async def aggregate_count_by(db: AsyncIOMotorDatabase, collection: str, match: dict, field: str, limit: int = 8) -> list[dict]:
    rows = await db[collection].aggregate([
        {"$match": match},
        {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]).to_list(limit)
    return [{"label": item.get("_id") or "Sin dato", "value": item.get("count", 0)} for item in rows]


async def build_strategy_metrics(db: AsyncIOMotorDatabase, current_user: dict, role_scope: str) -> dict:
    tenant_id = current_user.get("tenant_id")
    charts = []
    kpis = []
    context: dict[str, Any] = {"tenant_id": tenant_id, "role_scope": role_scope}

    if role_scope.startswith("rovi_"):
        prospect_query = {"tenant_id": ROVI_INTERNAL_TENANT_ID}
        prospects = serialize_docs(await db.rovi_prospects.find(prospect_query, {"_id": 0}).limit(1000).to_list(1000))
        active = [item for item in prospects if item.get("stage") != "perdido"]
        weighted_mrr = round(sum(float(item.get("weighted_mrr_mxn") or 0) for item in active), 2)
        expected_mrr = round(sum(float(item.get("expected_mrr_mxn") or 0) for item in active), 2)
        demos = len([item for item in prospects if item.get("stage") in {"demo_agendada", "demo_completada"}])
        kpis.extend([
            {"label": "Prospectos activos", "value": len(active), "tone": "primary", "description": "Pipeline ROVI sin perdidos."},
            {"label": "MRR ponderado", "value": weighted_mrr, "format": "currency", "tone": "success", "description": "Valor estimado por probabilidad."},
            {"label": "MRR potencial", "value": expected_mrr, "format": "currency", "tone": "primary", "description": "MRR esperado del pipeline activo."},
            {"label": "Demos", "value": demos, "tone": "warning", "description": "Demos agendadas o completadas."},
        ])
        stage_data = await aggregate_count_by(db, "rovi_prospects", prospect_query, "stage")
        source_data = await aggregate_count_by(db, "rovi_prospects", prospect_query, "source")
        charts.extend([
            {"id": "rovi_stage", "title": "Pipeline ROVI por etapa", "type": "bar", "data": stage_data},
            {"id": "rovi_source", "title": "Fuentes ROVI", "type": "bar", "data": source_data},
        ])
        context["rovi_prospects"] = prospects[:12]

    lead_query = build_lead_query(current_user)
    lead_total = await db.leads.count_documents(lead_query)
    if lead_total:
        status_data = await aggregate_count_by(db, "leads", lead_query, "status")
        source_data = await aggregate_count_by(db, "leads", lead_query, "source")
        priority_data = await aggregate_count_by(db, "leads", lead_query, "priority")
        high_priority = await db.leads.count_documents({**lead_query, "priority": "alta"})
        budget_pipeline = await db.leads.aggregate([
            {"$match": lead_query},
            {"$group": {"_id": None, "budget": {"$sum": {"$ifNull": ["$budget_mxn", 0]}}}},
        ]).to_list(1)
        budget_total = round(float((budget_pipeline[0] if budget_pipeline else {}).get("budget") or 0), 2)
        kpis.extend([
            {"label": "Leads", "value": lead_total, "tone": "primary", "description": "Leads visibles para este usuario."},
            {"label": "Alta prioridad", "value": high_priority, "tone": "warning", "description": "Leads con prioridad alta."},
            {"label": "Pipeline estimado", "value": budget_total, "format": "currency", "tone": "success", "description": "Suma de presupuesto MXN."},
        ])
        charts.extend([
            {"id": "lead_status", "title": "Leads por estado", "type": "bar", "data": status_data},
            {"id": "lead_source", "title": "Leads por fuente", "type": "bar", "data": source_data},
            {"id": "lead_priority", "title": "Leads por prioridad", "type": "bar", "data": priority_data},
        ])
        leads = await db.leads.find(lead_query, {"_id": 0, "name": 1, "status": 1, "priority": 1, "source": 1, "budget_mxn": 1}).sort("updated_at", -1).limit(10).to_list(10)
        context["recent_leads"] = serialize_docs(leads)

    if role_scope.startswith("copim"):
        member_count = await db.copim_members.count_documents({"tenant_id": tenant_id})
        invoice_count = await db.copim_invoices.count_documents({"tenant_id": tenant_id})
        event_count = await db.copim_events.count_documents({"tenant_id": tenant_id})
        kpis.extend([
            {"label": "Socios COPIM", "value": member_count, "tone": "primary", "description": "Miembros en el tenant."},
            {"label": "Facturas", "value": invoice_count, "tone": "warning", "description": "Cobranza registrada."},
            {"label": "Eventos", "value": event_count, "tone": "success", "description": "Eventos del ecosistema."},
        ])

    marketplace_count = await db.marketplace_listings.count_documents({"status": "published"})
    context["marketplace_published"] = marketplace_count
    kpis.append({"label": "Marketplace", "value": marketplace_count, "tone": "primary", "description": "Listings publicados."})

    return {"kpis": kpis[:8], "charts": charts[:6], "context": context}


def default_strategy_payload(question: str, role_scope: str, metrics: dict, graph: dict, ai_payload: dict | None = None) -> dict:
    payload = ai_payload or {}
    kpis = payload.get("kpis") if isinstance(payload.get("kpis"), list) else metrics.get("kpis", [])
    action_plan = payload.get("action_plan") if isinstance(payload.get("action_plan"), list) else []
    if not action_plan:
        action_plan = [
            {
                "title": "Alinear pregunta estrategica con datos accionables",
                "owner": ROLE_LABELS.get(role_scope, role_scope),
                "priority": "alta",
                "next_step": "Convertir el objetivo en 3 KPIs y revisar los charts sugeridos.",
                "impact": "Reduce ambiguedad y acelera decisiones.",
            },
            {
                "title": "Identificar cuello de botella principal",
                "owner": "Revenue Ops",
                "priority": "media",
                "next_step": "Comparar etapa/fuente con menor avance y asignar responsable.",
                "impact": "Enfoca la siguiente accion comercial.",
            },
            {
                "title": "Transferir aprendizaje a agentes por rol",
                "owner": "AI Control Tower",
                "priority": "media",
                "next_step": "Crear o ajustar prompts de rol con el insight validado.",
                "impact": "Convierte estrategia en ejecucion repetible.",
            },
        ]

    critical_path = payload.get("critical_path") if isinstance(payload.get("critical_path"), list) else []
    if not critical_path:
        critical_path = [
            {"step": "Diagnostico", "why": "Entender brecha entre meta y datos actuales.", "metric": "KPIs visibles", "urgency": "alta"},
            {"step": "Priorizacion", "why": "Elegir el cuello de botella con mayor impacto.", "metric": "Pipeline/fuente/estado", "urgency": "alta"},
            {"step": "Orquestacion", "why": "Enviar contexto al agente especialista correcto.", "metric": "Handoff por rol", "urgency": "media"},
            {"step": "Ejecucion", "why": "Convertir insight en tareas y seguimiento.", "metric": "Acciones completadas", "urgency": "media"},
        ]

    handoffs = payload.get("agent_handoffs") if isinstance(payload.get("agent_handoffs"), list) else []
    if not handoffs:
        handoffs = [
            {"role_scope": "rovi_sales", "mission": "Traducir insight a siguiente accion comercial.", "context": "Pipeline, fuente y oportunidad prioritaria."},
            {"role_scope": "rovi_marketing", "mission": "Ajustar fuente, mensaje o campana.", "context": "Charts de fuentes y segmentos."},
            {"role_scope": "rovi_ops", "mission": "Auditar datos, prompts y automatizaciones.", "context": "Knowledge graph y calidad de datos."},
        ]

    strategy = {
        "answer": short_text(payload.get("answer")) or "Analisis estrategico generado con datos seguros del CRM y contexto Graphify.",
        "executive_summary": short_text(payload.get("executive_summary"), 420) or f"Ruta critica para: {question}",
        "kpis": kpis,
        "charts": metrics.get("charts", []),
        "critical_path": critical_path[:6],
        "action_plan": action_plan[:6],
        "agent_handoffs": handoffs[:6],
        "knowledge_graph": {"nodes": graph.get("nodes", []), "links": graph.get("links", [])},
        "graph_summary": graph.get("summary", ""),
    }
    strategy["dashboard"] = build_grafana_strategy_dashboard(question, role_scope, strategy, metrics, graph)
    return strategy


def build_strategy_prompt(question: str, role_scope: str, metrics: dict, graph: dict, knowledge_chunks: list[dict]) -> list[dict]:
    knowledge = [
        {"title": chunk.get("title"), "content": short_text(chunk.get("content"), 900)}
        for chunk in knowledge_chunks[:5]
    ]
    system = """Actua como el Asistente Estratega de ROVI CRM.
Tu trabajo es convertir datos, knowledge graph y contexto operativo en ruta critica accionable.
Responde SOLO JSON valido, sin markdown, con este contrato:
{
  "answer": "respuesta breve",
  "executive_summary": "resumen ejecutivo",
  "critical_path": [{"step":"", "why":"", "metric":"", "urgency":"alta|media|baja"}],
  "kpis": [{"label":"", "value":0, "format":"number|currency", "tone":"primary|success|warning|danger", "description":""}],
  "action_plan": [{"title":"", "owner":"", "priority":"alta|media|baja", "next_step":"", "impact":""}],
  "agent_handoffs": [{"role_scope":"", "mission":"", "context":""}]
}
No inventes datos. Si falta informacion, dilo y convierte la incertidumbre en una accion de validacion."""
    user = {
        "question": question,
        "role_scope": role_scope,
        "crm_metrics": metrics.get("context", {}),
        "available_kpis": metrics.get("kpis", []),
        "available_charts": metrics.get("charts", []),
        "graphify_nodes": graph.get("nodes", [])[:14],
        "graphify_summary": graph.get("summary", ""),
        "knowledge_chunks": knowledge,
    }
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
    ]


async def run_strategy_playground(
    db: AsyncIOMotorDatabase,
    request: StrategyRunRequest,
    current_user: dict,
) -> dict:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="La pregunta estrategica es obligatoria.")

    role_scope = request.role_scope or resolve_role_scope(current_user)
    if role_scope not in ROLE_SCOPES:
        role_scope = resolve_role_scope(current_user)

    config = await resolve_agent_config(db, role_scope)
    metrics = await build_strategy_metrics(db, current_user, role_scope)
    graph = graphify_strategy_context(question)
    knowledge_chunks = await find_relevant_knowledge(db, role_scope, question, limit=6)
    messages = build_strategy_prompt(question, role_scope, metrics, graph, knowledge_chunks)
    run_id = f"strategy-run-{uuid.uuid4()}"
    started = time.perf_counter()
    success = True
    error = None
    raw_response = ""
    ai_payload: dict = {}
    provider_usage = {}

    try:
        model_response = await call_model(messages, config, f"strategy-{role_scope}-{current_user.get('user_id')}")
        raw_response = model_response.get("content", "")
        provider_usage = model_response.get("usage") or {}
        ai_payload = parse_strategy_json(raw_response)
    except Exception as exc:
        success = False
        error = str(exc)

    latency_ms = int((time.perf_counter() - started) * 1000)
    strategy = default_strategy_payload(question, role_scope, metrics, graph, ai_payload)
    input_tokens = provider_usage.get("input_tokens") or estimate_tokens(str(messages))
    output_tokens = provider_usage.get("output_tokens") or estimate_tokens(raw_response or strategy.get("executive_summary"))

    run_doc = {
        "id": run_id,
        "tenant_id": current_user.get("tenant_id"),
        "user_id": current_user.get("user_id"),
        "role_scope": role_scope,
        "config_id": config.get("id"),
        "source": "strategy_playground",
        "message": question,
        "response": strategy.get("executive_summary"),
        "context_summary": {
            "graph_nodes": len(graph.get("nodes", [])),
            "knowledge_chunks": len(knowledge_chunks),
            "charts": len(metrics.get("charts", [])),
        },
        "success": success,
        "error": error,
        "latency_ms": latency_ms,
        "created_at": now_iso(),
    }
    await db.agent_runs.insert_one(run_doc)
    usage_event = await record_agent_usage(
        db,
        run_id=run_id,
        config=config,
        current_user=current_user,
        role_scope=role_scope,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        success=success,
        error=error,
    )

    return {
        "success": True,
        "ai_success": success,
        "role_scope": role_scope,
        "strategy": strategy,
        "run": serialize_doc(run_doc),
        "usage": serialize_doc(usage_event),
        "config": public_config(config),
        "knowledge_sources": [
            {"file_id": chunk.get("file_id"), "title": chunk.get("title"), "chunk_index": chunk.get("chunk_index")}
            for chunk in knowledge_chunks
        ],
        "provider_error": error,
    }


async def extract_text_from_upload(file: UploadFile) -> tuple[bytes, str]:
    data = await file.read()
    suffix = os.path.splitext(file.filename or "")[1].lower()

    if suffix in {".txt", ".md", ".csv", ".json", ".html", ".xml"}:
        return data, data.decode("utf-8", errors="ignore")

    if suffix in {".xlsx", ".xls"}:
        try:
            import io
            import pandas as pd  # type: ignore

            workbook = pd.ExcelFile(io.BytesIO(data))
            sections = []
            for sheet_name in workbook.sheet_names[:12]:
                frame = pd.read_excel(workbook, sheet_name=sheet_name, dtype=str).fillna("")
                if frame.empty:
                    continue
                sections.append(f"# Sheet: {sheet_name}")
                sections.append("Columns: " + ", ".join(str(column) for column in frame.columns))
                for index, row in frame.head(200).iterrows():
                    values = [
                        f"{column}={str(value).strip()}"
                        for column, value in row.items()
                        if str(value).strip()
                    ]
                    if values:
                        sections.append(f"Row {index + 1}: " + " | ".join(values))
            return data, "\n".join(sections) or "XLSX cargado sin filas legibles."
        except Exception as exc:
            return data, f"XLSX cargado. No se pudo extraer texto automaticamente: {exc}"

    if suffix == ".pdf":
        try:
            from pypdf import PdfReader  # type: ignore
            import io

            reader = PdfReader(io.BytesIO(data))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return data, text
        except Exception:
            return data, "PDF cargado. Instala pypdf en el backend para extraer texto automaticamente."

    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}:
        return data, f"Imagen cargada ({file.filename}). Pendiente de OCR/vision antes de mapear al CRM."

    if suffix in {".mp3", ".m4a", ".ogg", ".wav", ".aac"}:
        return data, f"Audio cargado ({file.filename}). Pendiente de transcripcion antes de mapear al CRM."

    if suffix in {".mp4", ".mov", ".webm", ".mkv"}:
        return data, f"Video cargado ({file.filename}). Pendiente de analisis/transcripcion antes de mapear al CRM."

    return data, data.decode("utf-8", errors="ignore")


def chunk_text(text: str, max_chars: int = 1400) -> list[str]:
    clean = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if not clean:
        return []
    chunks = []
    for start in range(0, len(clean), max_chars):
        chunks.append(clean[start:start + max_chars])
    return chunks


def resolve_rovi_workspace_graph_path() -> Path:
    for path in ROVI_WORKSPACE_GRAPH_FILES:
        if path.exists():
            return path
    raise FileNotFoundError(
        "No encontre graphify-out/rovi-project-with-docs-graph.json ni grafos Graphify locales."
    )


def normalize_source_path(value: str | None) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    marker = "/leadvibes/"
    if marker in text:
        text = text.split(marker, 1)[1]
    if text.startswith("./"):
        text = text[2:]
    if text.startswith("pages/"):
        text = f"frontend/src/{text}"
    if text.startswith("components/"):
        text = f"frontend/src/{text}"
    if text and "/" not in text and text.endswith(".py"):
        text = f"backend/{text}"
    return text


def node_matches_rovi_workspace(node: dict) -> bool:
    source = normalize_source_path(node.get("source_file") or node.get("file") or "")
    label = str(node.get("label") or "")
    node_id = str(node.get("id") or "")
    haystack = f"{source} {label} {node_id}".lower()

    if source in ROVI_WORKSPACE_SOURCE_HINTS:
        return True
    if source.startswith("docs/") and (
        "workspace" in source.lower()
        or "ai_agent_control_tower" in source.lower()
        or "operations" in source.lower()
        or "pocket" in source.lower()
    ):
        return True
    return any(term in haystack for term in ROVI_WORKSPACE_TERMS)


def load_rovi_workspace_graph_chunks(max_chunks: int = 80) -> dict:
    graph_path = resolve_rovi_workspace_graph_path()
    graph_data = json.loads(graph_path.read_text())
    nodes = graph_data.get("nodes") or []
    links = graph_data.get("links") or graph_data.get("edges") or []
    nodes_by_id = {node.get("id"): node for node in nodes if node.get("id")}
    base_selected_ids = {node["id"] for node in nodes if node.get("id") and node_matches_rovi_workspace(node)}
    selected_ids = set(base_selected_ids)

    # Bring direct neighbors without cascading through root/container nodes.
    for link in links:
        source = link.get("source")
        target = link.get("target")
        source_node = nodes_by_id.get(source)
        target_node = nodes_by_id.get(target)
        source_file = normalize_source_path((source_node or {}).get("source_file") or (source_node or {}).get("file") or "")
        target_file = normalize_source_path((target_node or {}).get("source_file") or (target_node or {}).get("file") or "")
        if source in base_selected_ids and target_node and source_file == target_file:
            selected_ids.add(target)
        if target in base_selected_ids and source_node and source_file == target_file:
            selected_ids.add(source)

    selected_nodes = [node for node in nodes if node.get("id") in selected_ids]
    selected_by_file: dict[str, list[dict]] = {}
    for node in selected_nodes:
        source = normalize_source_path(node.get("source_file") or node.get("file") or node.get("repo") or "sin_archivo")
        selected_by_file.setdefault(source or "sin_archivo", []).append(node)

    relevant_links = [
        link for link in links
        if link.get("source") in selected_ids and link.get("target") in selected_ids
    ]

    chunks = []
    overview_files = sorted(selected_by_file.keys())
    overview = [
        "Knowledge Graph tecnico del Workspace interno ROVI.",
        f"Fuente Graphify: {graph_path}",
        f"Nodos seleccionados: {len(selected_nodes)}",
        f"Relaciones seleccionadas: {len(relevant_links)}",
        "Archivos principales:",
        *[f"- {file}" for file in overview_files[:40]],
    ]
    chunks.append({
        "title": "ROVI Internal Workspace - mapa tecnico",
        "content": "\n".join(overview),
        "source_file": str(graph_path),
    })

    for source, file_nodes in sorted(selected_by_file.items(), key=lambda item: (-len(item[1]), item[0])):
        lines = [
            f"Archivo/modulo: {source}",
            "Nodos relevantes:",
        ]
        for node in sorted(file_nodes, key=lambda item: -(int(item.get("degree") or 0)))[:35]:
            lines.append(
                f"- {node.get('label') or node.get('id')} "
                f"({node.get('file_type') or 'node'}, degree={node.get('degree') or 0})"
            )

        local_ids = {node.get("id") for node in file_nodes}
        local_links = [
            link for link in relevant_links
            if link.get("source") in local_ids or link.get("target") in local_ids
        ][:30]
        if local_links:
            lines.append("Relaciones cercanas:")
            for link in local_links:
                source_node = nodes_by_id.get(link.get("source"), {})
                target_node = nodes_by_id.get(link.get("target"), {})
                lines.append(
                    f"- {source_node.get('label') or link.get('source')} "
                    f"--{link.get('relation') or 'relacion'}--> "
                    f"{target_node.get('label') or link.get('target')}"
                )

        chunks.append({
            "title": f"ROVI Workspace: {source}",
            "content": "\n".join(lines),
            "source_file": source,
        })
        if len(chunks) >= max_chunks:
            break

    return {
        "graph_path": str(graph_path),
        "node_count": len(selected_nodes),
        "link_count": len(relevant_links),
        "chunk_count": len(chunks),
        "chunks": chunks,
    }


async def import_rovi_workspace_graph_knowledge(
    db: AsyncIOMotorDatabase,
    current_user: dict,
) -> dict:
    payload = load_rovi_workspace_graph_chunks()
    file_id = "knowledge-rovi-internal-graphify"
    now = now_iso()
    await db.agent_knowledge_chunks.delete_many({"file_id": file_id})
    await db.agent_knowledge_files.delete_many({"id": file_id})

    file_doc = {
        "id": file_id,
        "role_scope": ROVI_INTERNAL_KNOWLEDGE_SCOPE,
        "title": "ROVI Internal Workspace Graphify Knowledge",
        "description": "Knowledge graph tecnico filtrado para el workspace interno de ROVI.",
        "file_name": payload["graph_path"],
        "content_type": "application/graphify+json",
        "size_bytes": 0,
        "status": "indexed",
        "chunk_count": payload["chunk_count"],
        "node_count": payload["node_count"],
        "link_count": payload["link_count"],
        "source_kind": "graphify_rovi_workspace",
        "created_by": current_user.get("user_id"),
        "created_at": now,
        "updated_at": now,
    }
    await db.agent_knowledge_files.insert_one(file_doc)
    if payload["chunks"]:
        await db.agent_knowledge_chunks.insert_many([
            {
                "id": f"knowledge-chunk-{uuid.uuid4()}",
                "file_id": file_id,
                "role_scope": ROVI_INTERNAL_KNOWLEDGE_SCOPE,
                "title": chunk["title"],
                "file_name": chunk["source_file"],
                "chunk_index": index,
                "content": chunk["content"],
                "status": "indexed",
                "source_kind": "graphify_rovi_workspace",
                "created_at": now,
            }
            for index, chunk in enumerate(payload["chunks"])
        ])

    return {**payload, "file": serialize_doc(file_doc)}


def infer_membership_tier(user: dict, memberships: list[dict] | None = None) -> str:
    raw = (
        user.get("membership_tier")
        or user.get("subscription_tier")
        or user.get("plan_tier")
        or user.get("membership_plan")
        or user.get("plan")
        or ""
    )
    account_type = (user.get("account_type") or "").lower()
    role = (user.get("role") or "").lower()
    if account_type == "rovi_internal" or role.startswith("rovi_"):
        return "internal"
    if account_type.startswith("copim") or role.startswith("copim"):
        return "copim"
    if raw:
        raw = str(raw).lower()
        if raw in MEMBERSHIP_AGENT_RULES:
            return raw
        if raw in {"premium", "growth"}:
            return "pro"
        if raw in {"enterprise", "agency", "team"}:
            return "business"
    if account_type == "agency":
        return "business"
    return "starter"


def recommended_access_for(user: dict, memberships: list[dict] | None = None) -> dict:
    tier = infer_membership_tier(user, memberships)
    rules = MEMBERSHIP_AGENT_RULES.get(tier, MEMBERSHIP_AGENT_RULES["starter"])
    role = (user.get("role") or "").lower()
    role_agents = list(dict.fromkeys([*rules["role_agents"], *( [role] if role in ROLE_SCOPES else [] )]))
    specialist_agents = list(dict.fromkeys(rules["specialist_agents"]))
    orchestrator_role = role if role in ROLE_SCOPES else role_agents[0] if role_agents else "broker"
    return {
        "membership_tier": tier,
        "orchestrator_role": orchestrator_role,
        "orchestration_mode": "role_first",
        "role_agents": role_agents,
        "specialist_agents": specialist_agents,
        "agents": role_agents,  # backwards compatible alias
        "skills": rules["skills"],
    }


def build_orchestration_prompt(role_agent: str, specialist_agents: list[str], mode: str) -> dict:
    system_prompt = ROLE_PROMPTS.get(role_agent, ROLE_PROMPTS.get("broker", "Actua como orquestador operativo."))
    specialist_map = {item["id"]: item for item in SPECIALIST_AGENT_CATALOG}
    user_prompt_parts = [specialist_map[item]["user_prompt"] for item in specialist_agents if item in specialist_map]
    return {
        "role_agent": role_agent,
        "mode": mode,
        "system_prompt": system_prompt,
        "user_prompt": "\n".join(f"- {part}" for part in user_prompt_parts),
        "specialists": [specialist_map[item] for item in specialist_agents if item in specialist_map],
    }


def public_user_for_access(user: dict, memberships: list[dict], entitlement: Optional[dict]) -> dict:
    recommendation = recommended_access_for(user, memberships)
    enabled_role_agents = (entitlement or {}).get("enabled_role_agents") or (entitlement or {}).get("enabled_agents")
    enabled_specialist_agents = (entitlement or {}).get("enabled_specialist_agents")
    enabled_skills = entitlement.get("enabled_skills") if entitlement else None
    orchestrator_role = (entitlement or {}).get("orchestrator_role") or recommendation["orchestrator_role"]
    orchestration_mode = (entitlement or {}).get("orchestration_mode") or recommendation["orchestration_mode"]
    return {
        "id": user.get("id") or user.get("user_id"),
        "name": user.get("name") or user.get("full_name") or user.get("email"),
        "email": user.get("email"),
        "phone": user.get("phone") or user.get("whatsapp"),
        "telegram": user.get("telegram") or user.get("telegram_username"),
        "role": user.get("role"),
        "account_type": user.get("account_type"),
        "tenant_id": user.get("tenant_id"),
        "memberships": serialize_docs(memberships),
        "recommended_membership_tier": recommendation["membership_tier"],
        "membership_tier": (entitlement or {}).get("membership_tier") or recommendation["membership_tier"],
        "recommended_agents": recommendation["agents"],
        "recommended_role_agents": recommendation["role_agents"],
        "recommended_specialist_agents": recommendation["specialist_agents"],
        "recommended_skills": recommendation["skills"],
        "orchestrator_role": orchestrator_role,
        "orchestration_mode": orchestration_mode,
        "enabled_role_agents": enabled_role_agents if enabled_role_agents is not None else recommendation["role_agents"],
        "enabled_specialist_agents": enabled_specialist_agents if enabled_specialist_agents is not None else recommendation["specialist_agents"],
        "enabled_agents": enabled_role_agents if enabled_role_agents is not None else recommendation["role_agents"],
        "enabled_skills": enabled_skills if enabled_skills is not None else recommendation["skills"],
        "orchestration_prompt": build_orchestration_prompt(orchestrator_role, enabled_specialist_agents if enabled_specialist_agents is not None else recommendation["specialist_agents"], orchestration_mode),
        "hermes_profile": (entitlement or {}).get("hermes_profile"),
        "hermes_profile_status": (entitlement or {}).get("hermes_profile_status"),
        "is_active": (entitlement or {}).get("is_active", True),
        "notes": (entitlement or {}).get("notes", ""),
        "last_link_code": (entitlement or {}).get("last_link_code"),
        "last_link_channel": (entitlement or {}).get("last_link_channel"),
        "last_link_sent_at": (entitlement or {}).get("last_link_sent_at"),
    }


async def build_user_agent_access_dashboard(db: AsyncIOMotorDatabase) -> dict:
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(500).to_list(500)
    memberships = await db.tenant_memberships.find({}, {"_id": 0}).to_list(2000)
    entitlements = await db.user_agent_entitlements.find({}, {"_id": 0}).to_list(1000)
    memberships_by_user: dict[str, list[dict]] = {}
    for item in memberships:
        memberships_by_user.setdefault(item.get("user_id"), []).append(item)
    entitlements_by_user = {item.get("user_id"): item for item in entitlements}
    return {
        "users": [
            public_user_for_access(user, memberships_by_user.get(user.get("id"), []), entitlements_by_user.get(user.get("id")))
            for user in users
        ],
        "agent_catalog": [{"value": role, "label": ROLE_LABELS.get(role, role), "prompt_type": "system"} for role in ROLE_SCOPES],
        "role_agent_catalog": [{"value": role, "label": ROLE_LABELS.get(role, role), "prompt_type": "system", "system_prompt": ROLE_PROMPTS.get(role, "")} for role in ROLE_SCOPES],
        "specialist_agent_catalog": [{"value": item["id"], "label": item["label"], "prompt_type": "user", "user_prompt": item["user_prompt"]} for item in SPECIALIST_AGENT_CATALOG],
        "skill_catalog": SKILL_CATALOG,
        "membership_rules": MEMBERSHIP_AGENT_RULES,
        "membership_tiers": list(MEMBERSHIP_AGENT_RULES.keys()),
    }


def safe_profile_slug(user: dict) -> str:
    base = user.get("email") or user.get("name") or user.get("id") or str(uuid.uuid4())
    return "rovi-user-" + re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:48]


def build_link_message(user: dict, code: str, channel: str) -> dict:
    name = user.get("name") or user.get("email") or "tu cuenta"
    message = (
        f"Hola {name}, tu codigo para vincular tus agentes ROVI en Hermes es: {code}\n\n"
        "Envia /start al bot de Telegram configurado o escanea el QR de WhatsApp del perfil Hermes. "
        "Tus agentes se activaran con tu rol, membresia y especialistas asignados."
    )
    return {
        "message": message,
        "whatsapp_url": f"https://wa.me/?text={quote(message)}",
        "telegram_url": f"https://t.me/share/url?text={quote(message)}",
        "channel": channel,
    }


def provision_hermes_profile(user: dict, entitlement: dict, channel: str, payload: LinkCodeRequest, code: str) -> dict:
    profile_name = safe_profile_slug(user)
    profiles_root = Path(os.environ.get("ROVI_HERMES_PROFILES_ROOT", "/tmp/rovi-hermes-profiles"))
    profile_dir = profiles_root / profile_name
    profile_dir.mkdir(parents=True, exist_ok=True)
    orchestration = build_orchestration_prompt(
        entitlement.get("orchestrator_role") or "broker",
        entitlement.get("enabled_specialist_agents") or [],
        entitlement.get("orchestration_mode") or "role_first",
    )
    profile_spec = {
        "profile_name": profile_name,
        "user_id": user.get("id"),
        "user_name": user.get("name") or user.get("email"),
        "channel": channel,
        "link_code": code,
        "membership_tier": entitlement.get("membership_tier"),
        "role_agents": entitlement.get("enabled_role_agents") or [],
        "specialist_agents": entitlement.get("enabled_specialist_agents") or [],
        "skills": entitlement.get("enabled_skills") or [],
        "orchestration": orchestration,
    }
    (profile_dir / "rovi_user_profile.json").write_text(json.dumps(profile_spec, ensure_ascii=False, indent=2), encoding="utf-8")
    env_lines = [
        f"ROVI_USER_ID={user.get('id') or ''}",
        f"ROVI_LINK_CODE={code}",
        f"ROVI_ORCHESTRATOR_ROLE={orchestration['role_agent']}",
        f"ROVI_SPECIALIST_AGENTS={','.join(entitlement.get('enabled_specialist_agents') or [])}",
        "DISCORD_BOT_TOKEN=",
        "SLACK_BOT_TOKEN=",
    ]
    if channel == "telegram":
        env_lines.extend([
            f"TELEGRAM_BOT_TOKEN={payload.telegram_bot_token.strip()}",
            f"TELEGRAM_ALLOWED_USERS={payload.destination}",
            f"TELEGRAM_HOME_CHANNEL={payload.destination}",
            f"TELEGRAM_HOME_CHANNEL_NAME={user.get('name') or user.get('email') or profile_name}",
            "WHATSAPP_SESSION_PATH=",
        ])
        setup_steps = [
            f"hermes profile create {profile_name} --clone-all  # si aun no existe",
            f"cp {profile_dir / '.env'} ~/.hermes/profiles/{profile_name}/.env",
            f"cp {profile_dir / 'rovi_user_profile.json'} ~/.hermes/profiles/{profile_name}/rovi_user_profile.json",
            f"{profile_name} gateway start",
            "Abrir el bot en Telegram y enviar /start.",
        ]
        status = "telegram_token_ready" if payload.telegram_bot_token.strip() else "awaiting_telegram_bot_token"
    else:
        env_lines.extend([
            "TELEGRAM_BOT_TOKEN=",
            f"WHATSAPP_ALLOWED_USERS={payload.destination}",
            f"WHATSAPP_SESSION_PATH=~/.hermes/profiles/{profile_name}/whatsapp-session",
        ])
        setup_steps = [
            f"hermes profile create {profile_name} --clone-all  # si aun no existe",
            f"cp {profile_dir / '.env'} ~/.hermes/profiles/{profile_name}/.env",
            f"cp {profile_dir / 'rovi_user_profile.json'} ~/.hermes/profiles/{profile_name}/rovi_user_profile.json",
            f"{profile_name} gateway start",
            "Escanear el QR de WhatsApp que aparece en logs/status del gateway.",
        ]
        status = "awaiting_whatsapp_qr_scan"
    (profile_dir / ".env").write_text("\n".join(env_lines) + "\n", encoding="utf-8")
    (profile_dir / "SETUP.md").write_text("# Vinculacion Hermes ROVI\n\n" + "\n".join(f"{idx+1}. `{step}`" for idx, step in enumerate(setup_steps)) + "\n", encoding="utf-8")
    return {
        "profile_name": profile_name,
        "profile_dir": str(profile_dir),
        "status": status,
        "setup_steps": setup_steps,
        "spec": profile_spec,
    }


async def build_usage_dashboard(db: AsyncIOMotorDatabase) -> dict:
    await ensure_default_agent_configs(db)
    events = serialize_docs(await db.agent_usage_events.find({}, {"_id": 0}).sort("created_at", -1).limit(5000).to_list(5000))
    runs = serialize_docs(await db.agent_runs.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50))
    configs = serialize_docs(await db.agent_configs.find({}, {"_id": 0}).sort("role_scope", 1).to_list(100))
    files = serialize_docs(await db.agent_knowledge_files.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100))

    totals = {
        "runs": len(events),
        "input_tokens": sum(int(item.get("input_tokens") or 0) for item in events),
        "output_tokens": sum(int(item.get("output_tokens") or 0) for item in events),
        "total_tokens": sum(int(item.get("total_tokens") or 0) for item in events),
        "cost_usd": round(sum(float(item.get("cost_usd") or 0) for item in events), 4),
        "cost_mxn": round(sum(float(item.get("cost_mxn") or 0) for item in events), 2),
        "errors": len([item for item in events if not item.get("success", True)]),
        "avg_latency_ms": round(sum(int(item.get("latency_ms") or 0) for item in events) / len(events), 1) if events else 0,
    }

    by_role: dict[str, dict[str, Any]] = {}
    by_model: dict[str, dict[str, Any]] = {}
    for item in events:
        role = item.get("role_scope") or "unknown"
        model = item.get("model") or "unknown"
        by_role.setdefault(role, {"role_scope": role, "runs": 0, "tokens": 0, "cost_mxn": 0})
        by_model.setdefault(model, {"model": model, "runs": 0, "tokens": 0, "cost_mxn": 0})
        by_role[role]["runs"] += 1
        by_role[role]["tokens"] += int(item.get("total_tokens") or 0)
        by_role[role]["cost_mxn"] = round(by_role[role]["cost_mxn"] + float(item.get("cost_mxn") or 0), 2)
        by_model[model]["runs"] += 1
        by_model[model]["tokens"] += int(item.get("total_tokens") or 0)
        by_model[model]["cost_mxn"] = round(by_model[model]["cost_mxn"] + float(item.get("cost_mxn") or 0), 2)

    return {
        "totals": totals,
        "by_role": sorted(by_role.values(), key=lambda item: item["tokens"], reverse=True),
        "by_model": sorted(by_model.values(), key=lambda item: item["tokens"], reverse=True),
        "recent_runs": runs,
        "configs": [public_config(item) for item in configs],
        "knowledge_files": files,
        "role_scopes": [{"value": role, "label": ROLE_LABELS.get(role, role)} for role in ROLE_SCOPES],
        "knowledge_scopes": [
            {"value": scope, "label": KNOWLEDGE_SCOPE_LABELS.get(scope, scope)}
            for scope in ["global", ROVI_INTERNAL_KNOWLEDGE_SCOPE, *ROLE_SCOPES]
        ],
        "defaults": {
            "provider": DEFAULT_AI_PROVIDER,
            "model": DEFAULT_AI_MODEL,
            "base_url": DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
            "api_key_env": DEFAULT_AI_KEY_ENV,
            "usd_to_mxn": USD_TO_MXN,
        },
    }


def create_agent_control_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(tags=["ai-agents"])

    @router.get("/ai-control/dashboard")
    async def get_control_tower(current_user: dict = Depends(get_current_user)):
        require_ai_control_tower_owner(current_user)
        return await build_usage_dashboard(db)

    @router.get("/ai-control/user-access")
    async def get_user_agent_access(current_user: dict = Depends(get_current_user)):
        require_ai_control_tower_owner(current_user)
        return await build_user_agent_access_dashboard(db)

    @router.put("/ai-control/user-access/{user_id}")
    async def update_user_agent_access(user_id: str, payload: UserAgentAccessUpdate, current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        role_agents = payload.enabled_role_agents or payload.enabled_agents
        invalid_agents = [agent for agent in role_agents if agent not in ROLE_SCOPES]
        if invalid_agents:
            raise HTTPException(status_code=422, detail=f"Agentes de rol invalidos: {', '.join(invalid_agents)}")
        if payload.orchestrator_role and payload.orchestrator_role not in ROLE_SCOPES:
            raise HTTPException(status_code=422, detail="Orquestador de rol invalido.")
        valid_specialists = {item["id"] for item in SPECIALIST_AGENT_CATALOG}
        invalid_specialists = [agent for agent in payload.enabled_specialist_agents if agent not in valid_specialists]
        if invalid_specialists:
            raise HTTPException(status_code=422, detail=f"Especialistas invalidos: {', '.join(invalid_specialists)}")
        valid_skills = {item["id"] for item in SKILL_CATALOG}
        invalid_skills = [skill for skill in payload.enabled_skills if skill not in valid_skills]
        if invalid_skills:
            raise HTTPException(status_code=422, detail=f"Skills invalidas: {', '.join(invalid_skills)}")
        now = now_iso()
        doc = {
            "user_id": user_id,
            "membership_tier": payload.membership_tier or recommended_access_for(user)["membership_tier"],
            "orchestrator_role": payload.orchestrator_role or (role_agents[0] if role_agents else recommended_access_for(user)["orchestrator_role"]),
            "orchestration_mode": payload.orchestration_mode if payload.orchestration_mode in {"role_first", "blend", "specialist_first"} else "role_first",
            "enabled_role_agents": role_agents,
            "enabled_specialist_agents": payload.enabled_specialist_agents,
            "enabled_agents": role_agents,
            "enabled_skills": payload.enabled_skills,
            "is_active": payload.is_active,
            "notes": payload.notes,
            "updated_by": current_user.get("user_id"),
            "updated_at": now,
        }
        await db.user_agent_entitlements.update_one(
            {"user_id": user_id},
            {"$set": doc, "$setOnInsert": {"id": f"user-agent-access-{uuid.uuid4()}", "created_at": now}},
            upsert=True,
        )
        entitlement = await db.user_agent_entitlements.find_one({"user_id": user_id}, {"_id": 0})
        memberships = await db.tenant_memberships.find({"user_id": user_id}, {"_id": 0}).to_list(100)
        return public_user_for_access(user, memberships, entitlement)

    @router.post("/ai-control/user-access/{user_id}/link-code")
    async def create_user_link_code(user_id: str, payload: LinkCodeRequest, current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        channel = (payload.channel or "whatsapp").lower()
        if channel not in {"whatsapp", "telegram"}:
            raise HTTPException(status_code=422, detail="Canal invalido. Usa whatsapp o telegram.")
        code = str(uuid.uuid4()).split("-")[0].upper()
        now = now_iso()
        message_payload = build_link_message(user, code, channel)
        entitlement = await db.user_agent_entitlements.find_one({"user_id": user_id}, {"_id": 0})
        if not entitlement:
            recommended = recommended_access_for(user)
            entitlement = {
                "user_id": user_id,
                "membership_tier": recommended["membership_tier"],
                "orchestrator_role": recommended["orchestrator_role"],
                "orchestration_mode": recommended["orchestration_mode"],
                "enabled_role_agents": recommended["role_agents"],
                "enabled_specialist_agents": recommended["specialist_agents"],
                "enabled_skills": recommended["skills"],
            }
        hermes_profile = provision_hermes_profile(user, entitlement, channel, payload, code)
        link_doc = {
            "id": f"agent-link-{uuid.uuid4()}",
            "user_id": user_id,
            "code": code,
            "channel": channel,
            "destination": payload.destination or user.get("phone") or user.get("telegram") or user.get("email") or "",
            "message": message_payload["message"],
            "hermes_profile": hermes_profile,
            "status": hermes_profile["status"],
            "created_by": current_user.get("user_id"),
            "created_at": now,
        }
        await db.agent_link_codes.insert_one(link_doc)
        await db.user_agent_entitlements.update_one(
            {"user_id": user_id},
            {"$set": {"last_link_code": code, "last_link_channel": channel, "last_link_sent_at": now, "hermes_profile": hermes_profile, "hermes_profile_status": hermes_profile["status"], "updated_at": now}, "$setOnInsert": {"id": f"user-agent-access-{uuid.uuid4()}", "created_at": now}},
            upsert=True,
        )
        return {**serialize_doc(link_doc), **message_payload}

    @router.get("/ai-control/configs")
    async def list_configs(current_user: dict = Depends(get_current_user)):
        require_ai_control_tower_owner(current_user)
        await ensure_default_agent_configs(db)
        configs = await db.agent_configs.find({}, {"_id": 0}).sort("role_scope", 1).to_list(100)
        return {"configs": [public_config(item) for item in configs], "role_scopes": ROLE_SCOPES}

    @router.post("/ai-control/configs")
    async def create_config(payload: AgentConfigCreate, current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        if payload.role_scope not in ROLE_SCOPES:
            raise HTTPException(status_code=422, detail="Rol de agente invalido.")
        now = now_iso()
        doc = {
            **payload.model_dump(),
            "id": f"agent-config-{payload.role_scope}-{uuid.uuid4()}",
            "created_by": current_user.get("user_id"),
            "version": 1,
            "created_at": now,
            "updated_at": now,
        }
        await db.agent_configs.insert_one(doc)
        return public_config(doc)

    @router.put("/ai-control/configs/{config_id}")
    async def update_config(config_id: str, payload: AgentConfigUpdate, current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        updates = {key: value for key, value in payload.model_dump(exclude_unset=True).items() if value is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No hay cambios para guardar.")
        updates["updated_at"] = now_iso()
        updates["updated_by"] = current_user.get("user_id")

        existing = await db.agent_configs.find_one({"id": config_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Configuracion no encontrada.")

        version_doc = {
            "id": f"prompt-version-{uuid.uuid4()}",
            "config_id": config_id,
            "role_scope": existing.get("role_scope"),
            "system_prompt": existing.get("system_prompt"),
            "provider": existing.get("provider"),
            "model": existing.get("model"),
            "created_by": current_user.get("user_id"),
            "created_at": now_iso(),
        }
        await db.agent_prompt_versions.insert_one(version_doc)
        await db.agent_configs.update_one(
            {"id": config_id},
            {"$set": updates, "$inc": {"version": 1}},
        )
        updated = await db.agent_configs.find_one({"id": config_id}, {"_id": 0})
        return public_config(updated)

    @router.delete("/ai-control/configs/{config_id}")
    async def delete_config(config_id: str, current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        existing = await db.agent_configs.find_one({"id": config_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Configuracion no encontrada.")

        now = now_iso()
        await db.agent_prompt_versions.insert_one({
            "id": f"prompt-version-{uuid.uuid4()}",
            "config_id": config_id,
            "role_scope": existing.get("role_scope"),
            "system_prompt": existing.get("system_prompt"),
            "provider": existing.get("provider"),
            "model": existing.get("model"),
            "created_by": current_user.get("user_id"),
            "created_at": now,
            "change_type": "deleted",
        })
        await db.agent_configs.delete_one({"id": config_id})
        return {"deleted": True, "id": config_id}

    @router.get("/ai-control/knowledge-files")
    async def list_knowledge_files(current_user: dict = Depends(get_current_user)):
        require_ai_control_tower_owner(current_user)
        files = await db.agent_knowledge_files.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
        return {"files": serialize_docs(files)}

    @router.post("/ai-control/knowledge-files")
    async def upload_knowledge_file(
        role_scope: str = Form("global"),
        title: str = Form(""),
        description: str = Form(""),
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
    ):
        current_user = require_ai_control_tower_owner(current_user)
        if role_scope not in {"global", ROVI_INTERNAL_KNOWLEDGE_SCOPE, *ROLE_SCOPES}:
            raise HTTPException(status_code=422, detail="Rol de conocimiento invalido.")

        raw_bytes, text = await extract_text_from_upload(file)
        chunks = chunk_text(text)
        file_id = f"knowledge-{uuid.uuid4()}"
        now = now_iso()
        file_doc = {
            "id": file_id,
            "role_scope": role_scope,
            "title": title or file.filename,
            "description": description,
            "file_name": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(raw_bytes),
            "status": "indexed" if chunks else "uploaded",
            "chunk_count": len(chunks),
            "created_by": current_user.get("user_id"),
            "created_at": now,
            "updated_at": now,
        }
        await db.agent_knowledge_files.insert_one(file_doc)
        if chunks:
            await db.agent_knowledge_chunks.insert_many([
                {
                    "id": f"knowledge-chunk-{uuid.uuid4()}",
                    "file_id": file_id,
                    "role_scope": role_scope,
                    "title": file_doc["title"],
                    "file_name": file.filename,
                    "chunk_index": index,
                    "content": chunk,
                    "status": "indexed",
                    "created_at": now,
                }
                for index, chunk in enumerate(chunks)
            ])
        return serialize_doc(file_doc)

    @router.get("/ai-control/knowledge/rovi-workspace/preview")
    async def preview_rovi_workspace_graph(current_user: dict = Depends(get_current_user)):
        require_ai_control_tower_owner(current_user)
        try:
            payload = load_rovi_workspace_graph_chunks(max_chunks=12)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc))
        return {
            "graph_path": payload["graph_path"],
            "node_count": payload["node_count"],
            "link_count": payload["link_count"],
            "chunk_count": payload["chunk_count"],
            "sample_chunks": payload["chunks"][:5],
            "role_scope": ROVI_INTERNAL_KNOWLEDGE_SCOPE,
        }

    @router.post("/ai-control/knowledge/rovi-workspace/import")
    async def import_rovi_workspace_graph(current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        try:
            payload = await import_rovi_workspace_graph_knowledge(db, current_user)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc))
        return {
            "message": "Knowledge graph de ROVI Internal indexado",
            "role_scope": ROVI_INTERNAL_KNOWLEDGE_SCOPE,
            "graph_path": payload["graph_path"],
            "node_count": payload["node_count"],
            "link_count": payload["link_count"],
            "chunk_count": payload["chunk_count"],
            "file": payload["file"],
        }

    @router.post("/ai-control/test-run")
    async def test_agent(payload: AgentRunRequest, current_user: dict = Depends(get_current_user)):
        current_user = require_ai_control_tower_owner(current_user)
        return await run_agent_turn(
            db,
            payload,
            current_user,
            forced_role_scope=payload.role_scope or "rovi_admin",
            source="control_tower",
        )

    @router.get("/ai-agent/config")
    async def get_runtime_config(current_user: dict = Depends(get_current_user)):
        role_scope = resolve_role_scope(current_user)
        config = await resolve_agent_config(db, role_scope)
        return {"role_scope": role_scope, "config": public_config(config)}

    @router.post("/ai-agent/run")
    async def run_runtime_agent(payload: AgentRunRequest, current_user: dict = Depends(get_current_user)):
        return await run_agent_turn(db, payload, current_user, source="runtime")

    @router.post("/strategy-playground/run")
    async def run_strategy_playground_route(payload: StrategyRunRequest, current_user: dict = Depends(get_current_user)):
        return await run_strategy_playground(db, payload, current_user)

    return router

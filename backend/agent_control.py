from __future__ import annotations

import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

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
USD_TO_MXN = float(os.environ.get("ROVI_AI_USD_TO_MXN", "18.5"))


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
}


DEFAULT_TOOLS = {
    "list_leads": True,
    "lead_metrics": True,
    "marketplace_recommendations": True,
    "copim_context": True,
    "rovi_internal_metrics": True,
    "write_actions": False,
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


class AgentRunRequest(BaseModel):
    message: str
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


def estimate_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = MODEL_PRICING_PER_1M_USD.get(model, MODEL_PRICING_PER_1M_USD["glm-5"])
    return round(
        (input_tokens / 1_000_000) * pricing["input"]
        + (output_tokens / 1_000_000) * pricing["output"],
        6,
    )


def public_config(config: dict) -> dict:
    config = serialize_doc(config) or {}
    config.pop("_id", None)
    config["api_key_configured"] = bool(os.environ.get(config.get("api_key_env") or DEFAULT_AI_KEY_ENV))
    return config


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
    chunks = await db.agent_knowledge_chunks.find(
        {
            "role_scope": {"$in": [role_scope, "global"]},
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

    system_prompt = f"""{config.get("system_prompt") or ROLE_PROMPTS["broker"]}

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
    api_key_env = config.get("api_key_env") or DEFAULT_AI_KEY_ENV
    api_key = os.environ.get(api_key_env)
    if not api_key:
        raise RuntimeError(f"Falta configurar {api_key_env} en el entorno del backend.")

    base_url = (config.get("base_url") or DEFAULT_OPENAI_COMPATIBLE_BASE_URL).rstrip("/")
    endpoint = base_url if base_url.endswith("/chat/completions") else f"{base_url}/chat/completions"
    payload = {
        "model": config.get("model") or DEFAULT_AI_MODEL,
        "messages": messages,
        "temperature": float(config.get("temperature", 0.25)),
        "max_tokens": int(config.get("max_output_tokens", 900)),
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
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
        "raw_provider": "openai_compatible",
    }


async def call_model(messages: list[dict], config: dict, session_id: str) -> dict:
    provider = (config.get("provider") or DEFAULT_AI_PROVIDER).lower()
    if provider in {"emergent", "emergentintegrations"}:
        content = await get_ai_response(
            user_message=messages[-1]["content"],
            session_id=session_id,
            context=None,
            ai_profile={"style": "estrategico", "goals": "resolver preguntas del CRM"},
            user_name="ROVI",
        )
        return {"content": content, "usage": {}, "raw_provider": "emergentintegrations"}

    return await call_openai_compatible(messages, config)


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
    cost_usd = estimate_cost_usd(config.get("model", DEFAULT_AI_MODEL), input_tokens, output_tokens)
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
) -> dict:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje es obligatorio.")

    role_scope = forced_role_scope or request.role_scope or resolve_role_scope(current_user)
    if role_scope not in ROLE_SCOPES:
        raise HTTPException(status_code=422, detail="Rol de agente invalido.")

    config = await resolve_agent_config(db, role_scope)
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
        error = str(exc)
        provider_response = getattr(exc, "response", None)
        status_code = getattr(provider_response, "status_code", None)
        reason_phrase = getattr(provider_response, "reason_phrase", "")
        provider_hint = f" ({status_code} {reason_phrase})" if status_code else ""
        content = (
            f"El agente ya esta configurado en ROVI, pero el proveedor de IA no respondio{provider_hint}. "
            "Revisa cuota, rate limit, token o base URL y vuelve a probar."
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


async def extract_text_from_upload(file: UploadFile) -> tuple[bytes, str]:
    data = await file.read()
    suffix = os.path.splitext(file.filename or "")[1].lower()

    if suffix in {".txt", ".md", ".csv", ".json", ".html", ".xml"}:
        return data, data.decode("utf-8", errors="ignore")

    if suffix == ".pdf":
        try:
            from pypdf import PdfReader  # type: ignore
            import io

            reader = PdfReader(io.BytesIO(data))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return data, text
        except Exception:
            return data, "PDF cargado. Instala pypdf en el backend para extraer texto automaticamente."

    return data, data.decode("utf-8", errors="ignore")


def chunk_text(text: str, max_chars: int = 1400) -> list[str]:
    clean = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if not clean:
        return []
    chunks = []
    for start in range(0, len(clean), max_chars):
        chunks.append(clean[start:start + max_chars])
    return chunks


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
        require_rovi_internal_workspace(current_user)
        return await build_usage_dashboard(db)

    @router.get("/ai-control/configs")
    async def list_configs(current_user: dict = Depends(get_current_user)):
        require_rovi_internal_workspace(current_user)
        await ensure_default_agent_configs(db)
        configs = await db.agent_configs.find({}, {"_id": 0}).sort("role_scope", 1).to_list(100)
        return {"configs": [public_config(item) for item in configs], "role_scopes": ROLE_SCOPES}

    @router.post("/ai-control/configs")
    async def create_config(payload: AgentConfigCreate, current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_internal_workspace(current_user)
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
        current_user = require_rovi_internal_workspace(current_user)
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

    @router.get("/ai-control/knowledge-files")
    async def list_knowledge_files(current_user: dict = Depends(get_current_user)):
        require_rovi_internal_workspace(current_user)
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
        current_user = require_rovi_internal_workspace(current_user)
        if role_scope != "global" and role_scope not in ROLE_SCOPES:
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

    @router.post("/ai-control/test-run")
    async def test_agent(payload: AgentRunRequest, current_user: dict = Depends(get_current_user)):
        current_user = require_rovi_internal_workspace(current_user)
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

    return router

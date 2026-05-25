from __future__ import annotations

import io
import re
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth import get_current_user
from models import (
    AudienceGroupCreate,
    ExperimentMetric,
    ExperimentMetricCreate,
    OutreachMode,
    VibeExperiment,
    VibeExperimentCreate,
    VibeExperimentStatus,
    VibeOffer,
    VibeOfferCreate,
    VibePost,
    VibePostStatus,
    VibeSegment,
)


SEGMENT_LABELS = {
    VibeSegment.BUY_SELL.value: "Compra/venta directa",
    VibeSegment.WOMEN_FAMILY.value: "Mujeres y familia",
    VibeSegment.WELLNESS.value: "Bienestar/holistico",
    VibeSegment.BUSINESS.value: "Negocios/emprendedoras",
    VibeSegment.EXPATS_FOODIES.value: "Expats, nomadas y foodies",
    VibeSegment.OTHER.value: "Otros",
}


SEGMENT_RULES = [
    (
        VibeSegment.BUY_SELL.value,
        re.compile(r"\b(buy|sell|sales|swap|market|venta|trade|rent)\b", re.I),
        "Voucher digital/local con CTA directo y precio cerrado.",
    ),
    (
        VibeSegment.WOMEN_FAMILY.value,
        re.compile(r"ladies|women|sisterhood|family|families|children|curvy|lesmex|strong black women|boss ladies", re.I),
        "Retrato, video o cancion emocional con entrada suave.",
    ),
    (
        VibeSegment.WELLNESS.value,
        re.compile(r"spiritual|well|yoga|medit|sound|healing|ceremon|tantra|breath|fitness|dance|mental health|kundalini|ecstatic|cosmic|abundance", re.I),
        "Vale de sesion, audio guiado o ritual digital respetuoso.",
    ),
    (
        VibeSegment.BUSINESS.value,
        re.compile(r"business|entrepreneur|owner|consultant|coach|pitch|network|airbnb|vrbo|real estate|trader|investor", re.I),
        "Kit de productividad o regalo de tiempo para mama emprendedora.",
    ),
    (
        VibeSegment.EXPATS_FOODIES.value,
        re.compile(r"expat|digital nomad|nomad|german|ukraine|mexpat|foreign|international|food|vegan|taco|lunch|dinner|brunch|restaurant|chef", re.I),
        "Regalo digital transfronterizo o experiencia gastronomica inmediata.",
    ),
]


EXCLUSION_RULES = [
    (re.compile(r"honeypot|do not click|spammer|spam trap", re.I), "honeypot/spam trap"),
    (re.compile(r"admin\s*only|admins only|for admins", re.I), "admin only"),
]


PRIORITY_GROUPS = [
    ("Active Ladie's Sales", VibeSegment.BUY_SELL.value, "WhatsApp", "Buy\\Sell"),
    ("Buy, Sell, Swap, Rent PDC", VibeSegment.BUY_SELL.value, "WhatsApp", "Buy\\Sell"),
    ("Clothes Swap and Sell Group for Curvy ladies", VibeSegment.BUY_SELL.value, "WhatsApp", "Buy and sell"),
    ("Playa & Area Buy/Sell/Trade", VibeSegment.BUY_SELL.value, "Telegram", "Buy\\Sell"),
    ("Active Ladies 2", VibeSegment.WOMEN_FAMILY.value, "WhatsApp", "Meetups"),
    ("Fun & Active Women", VibeSegment.WOMEN_FAMILY.value, "WhatsApp", "Social"),
    ("The Family - PDC", VibeSegment.WOMEN_FAMILY.value, "WhatsApp", "Family"),
    ("Soul Sister Circle Playa", VibeSegment.WOMEN_FAMILY.value, "WhatsApp", "Sisterhood"),
    ("GYST (Get Your Sh** Together) Parties for Women", VibeSegment.WOMEN_FAMILY.value, "WhatsApp", "Sisterhood"),
    ("Abundance Meetup", VibeSegment.WELLNESS.value, "WhatsApp", "Wellbeing"),
    ("Cosmic Love Soundbath", VibeSegment.WELLNESS.value, "WhatsApp", "Spirituality"),
    ("Meditacion Martes", VibeSegment.WELLNESS.value, "WhatsApp", "Spirituality"),
    ("Sound Healing Institute", VibeSegment.WELLNESS.value, "WhatsApp", "Spirituality"),
    ("Tantra Playa", VibeSegment.WELLNESS.value, "WhatsApp", "Spirituality"),
    ("Boss Ladies", VibeSegment.BUSINESS.value, "WhatsApp", "Business"),
    ("Entrepreneurs PDC", VibeSegment.BUSINESS.value, "WhatsApp", "Business"),
    ("Online Business Owners", VibeSegment.BUSINESS.value, "WhatsApp", "Business"),
    ("Playa Business Unite", VibeSegment.BUSINESS.value, "WhatsApp", "Business"),
    ("Obo Coaches & Consultants", VibeSegment.BUSINESS.value, "WhatsApp", "Business"),
    ("Playa del Carmen Nomads", VibeSegment.EXPATS_FOODIES.value, "WhatsApp", "Meetups"),
    ("Caribbean Mexpats", VibeSegment.EXPATS_FOODIES.value, "WhatsApp", "Expat"),
    ('"VIVA LA VIDA En MEXICO": German Speaking Expats Group', VibeSegment.EXPATS_FOODIES.value, "Telegram", "Expats"),
    ("Playa Foodie Alert", VibeSegment.EXPATS_FOODIES.value, "WhatsApp", "Food"),
    ("Vegans in Playa", VibeSegment.EXPATS_FOODIES.value, "WhatsApp", "Food"),
]


DEFAULT_OFFERS = [
    {
        "title": "Voucher digital local salva-regalo",
        "offer_type": "voucher",
        "segment": VibeSegment.BUY_SELL.value,
        "target_segments": [VibeSegment.BUY_SELL.value, VibeSegment.WELLNESS.value, VibeSegment.EXPATS_FOODIES.value],
        "description": "Certificado digital premium para spa, masaje, brunch o servicio futuro entregado por WhatsApp.",
        "value_prop": "Resuelve el regalo de ultimo minuto en 15 minutos sin depender de logistica fisica.",
        "price_mxn": 349,
        "delivery_minutes": 15,
        "cta": "Responder INFO para ver disenos y recibir el link de pago.",
        "payment_link": "https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago",
        "fulfillment_prompt": "Genera un voucher digital elegante para Dia de las Madres con nombre de la mama, servicio, vigencia y mensaje breve.",
        "tags": ["mvp", "voucher", "mercado-pago"],
    },
    {
        "title": "Cancion, retrato o video IA emocional",
        "offer_type": "ai_emotional_asset",
        "segment": VibeSegment.WOMEN_FAMILY.value,
        "target_segments": [VibeSegment.WOMEN_FAMILY.value, VibeSegment.EXPATS_FOODIES.value],
        "description": "Activo emocional personalizado con IA: cancion, retrato familiar, video con dedicatoria o tarjeta digital.",
        "value_prop": "Convierte una historia familiar en un regalo profundamente personal que llega en segundos.",
        "price_mxn": 349,
        "delivery_minutes": 30,
        "cta": "Responder MAMA y te mando 3 ejemplos.",
        "payment_link": "https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago",
        "fulfillment_prompt": "Pide nombre de mama, relacion, anecdotas, tono y fotos opcionales; crea prompt final para cancion/retrato/video.",
        "tags": ["mvp", "ia", "emocional"],
    },
    {
        "title": "Kit regálale tiempo a mamá emprendedora",
        "offer_type": "productivity_kit",
        "segment": VibeSegment.BUSINESS.value,
        "target_segments": [VibeSegment.BUSINESS.value, VibeSegment.WOMEN_FAMILY.value],
        "description": "Planner digital, mini automatizacion, horas de asistente virtual o kit de orden para una mama con negocio.",
        "value_prop": "El mejor regalo para una mama ocupada es tiempo libre y claridad operativa.",
        "price_mxn": 249,
        "delivery_minutes": 20,
        "cta": "Responder TIEMPO para elegir plantilla o asistente.",
        "payment_link": "https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago",
        "fulfillment_prompt": "Genera un planner/brief de productividad listo para entregar segun actividad, prioridad y rutina de la mama.",
        "tags": ["mvp", "productividad", "emprendedoras"],
    },
]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    result = {key: value for key, value in doc.items() if key != "_id"}
    for key, value in list(result.items()):
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result


def serialize_docs(docs: list[dict]) -> list[dict]:
    return [serialize_doc(doc) for doc in docs]


def resolve_tenant_id(current_user: dict) -> str:
    return current_user.get("active_tenant_id") or current_user.get("tenant_id") or f"tenant-{current_user['user_id'][:8]}"


def normalize_platform(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return "WhatsApp"
    lowered = text.lower()
    if "telegram" in lowered:
        return "Telegram"
    if "facebook" in lowered:
        return "Facebook"
    if "signal" in lowered:
        return "Signal"
    if "whatsapp" in lowered or "whatapp" in lowered:
        return "WhatsApp"
    return text


def is_truthy_full(value: Any) -> bool:
    text = str(value or "").strip().lower()
    return text in {"yeah", "yes", "si", "sí", "full", "almost", "almost full"}


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).replace("\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def infer_segment(text: str) -> tuple[str, str, Optional[str]]:
    for segment, pattern, proposed_value in SEGMENT_RULES:
        if pattern.search(text):
            offer_type = {
                VibeSegment.BUY_SELL.value: "voucher",
                VibeSegment.WOMEN_FAMILY.value: "ai_emotional_asset",
                VibeSegment.WELLNESS.value: "voucher",
                VibeSegment.BUSINESS.value: "productivity_kit",
                VibeSegment.EXPATS_FOODIES.value: "ai_emotional_asset",
            }.get(segment)
            return segment, proposed_value, offer_type
    return VibeSegment.OTHER.value, "Requiere validacion manual antes de proponer oferta.", None


def exclusion_reason(text: str) -> Optional[str]:
    for pattern, reason in EXCLUSION_RULES:
        if pattern.search(text):
            return reason
    return None


def score_group(platform: str, segment: str, is_full: bool, notes: str, is_excluded: bool) -> int:
    if is_excluded:
        return 0
    score = 35
    if platform == "WhatsApp":
        score += 20
    elif platform == "Telegram":
        score += 12
    if not is_full:
        score += 15
    if segment != VibeSegment.OTHER.value:
        score += 20
    if notes:
        score += 5
    if re.search(r"good signal|business|sisterhood|food|well|buy|sell", notes, re.I):
        score += 5
    return max(0, min(100, score))


def normalize_group_row(row: dict[str, Any], source_file: str) -> dict[str, Any]:
    name = clean_text(row.get("group") or row.get("Group") or row.get("name"))
    link = clean_text(row.get("link") or row.get("Link"))
    group_type = clean_text(row.get("type") or row.get("Type") or row.get("group_type"))
    platform = normalize_platform(row.get("platform") or row.get("Platform"))
    full = is_truthy_full(row.get("full") or row.get("Is Full / Almost?") or row.get("Is Full?"))
    notes = clean_text(row.get("notes") or row.get("Notes"))
    haystack = " ".join([name, link, group_type, platform, notes])
    reason = exclusion_reason(haystack)
    segment, proposed_value, offer_type = infer_segment(haystack)
    is_excluded = bool(reason)
    tags = [segment, platform.lower()]
    if full:
        tags.append("full")
    if is_excluded:
        tags.append("excluded")

    return {
        "name": name,
        "link": link or None,
        "group_type": group_type or None,
        "platform": platform,
        "segment": segment,
        "is_full": full,
        "is_excluded": is_excluded,
        "exclusion_reason": reason,
        "score": score_group(platform, segment, full, notes, is_excluded),
        "best_offer_type": offer_type,
        "proposed_value": proposed_value,
        "notes": notes or None,
        "source_file": source_file,
        "tags": tags,
        "metadata": {
            "raw_type": group_type,
            "normalized_from": source_file,
        },
    }


def parse_superlist_workbook(data: bytes, filename: str) -> list[dict[str, Any]]:
    try:
        import pandas as pd
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"pandas/openpyxl no disponible para XLSX: {exc}") from exc

    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    rows: list[dict[str, Any]] = []

    if suffix == "csv":
        frame = pd.read_csv(io.BytesIO(data), dtype=str)
        for item in frame.to_dict(orient="records"):
            normalized = normalize_group_row(
                {
                    "group": item.get("group") or item.get("Group"),
                    "link": item.get("link") or item.get("Link"),
                    "type": item.get("type") or item.get("Type"),
                    "platform": item.get("platform") or item.get("Platform"),
                    "full": item.get("full") or item.get("Is Full / Almost?") or item.get("Is Full?"),
                    "notes": item.get("notes") or item.get("Notes"),
                },
                filename,
            )
            if normalized["name"]:
                rows.append(normalized)
        return rows

    try:
        workbook = pd.ExcelFile(io.BytesIO(data))
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=f"Falta dependencia para leer XLSX. Instala backend/requirements.txt: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"No pude abrir el XLSX de Superlist: {exc}") from exc
    sheet_name = next((name for name in workbook.sheet_names if "historical" in name.lower()), workbook.sheet_names[0])
    raw = pd.read_excel(workbook, sheet_name=sheet_name, header=None, dtype=str)
    header_candidates = raw.index[raw.iloc[:, 0].fillna("").str.contains("Group \\(use icon to sort\\)", regex=True, na=False)]
    if len(header_candidates) == 0:
        raise HTTPException(status_code=422, detail="No encontre la fila de encabezados de grupos en la Superlist")

    header_idx = int(header_candidates[0])
    frame = raw.iloc[header_idx + 1 :, :7].copy()
    frame.columns = ["group", "link", "type", "platform", "full", "main_person", "notes"]
    frame = frame[frame["group"].notna()]
    for item in frame.to_dict(orient="records"):
        normalized = normalize_group_row(item, filename)
        if normalized["name"]:
            rows.append(normalized)
    return rows


def deterministic_id(prefix: str, *parts: str) -> str:
    key = ":".join(part for part in parts if part)
    return f"{prefix}-{uuid.uuid5(uuid.NAMESPACE_URL, key).hex[:18]}"


async def upsert_group(db: AsyncIOMotorDatabase, tenant_id: str, user_id: str, payload: dict[str, Any]) -> str:
    key = payload.get("link") or payload.get("name")
    group_id = deterministic_id("audience-group", tenant_id, key)
    now = now_utc()
    doc = {
        "id": group_id,
        "tenant_id": tenant_id,
        "created_by": user_id,
        **payload,
        "updated_at": now,
    }
    await db.vibe_audience_groups.update_one(
        {"id": group_id, "tenant_id": tenant_id},
        {
            "$set": doc,
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return group_id


def default_group_payload(name: str, segment: str, platform: str, group_type: str) -> dict[str, Any]:
    proposed_value = next((rule[2] for rule in SEGMENT_RULES if rule[0] == segment), "")
    return {
        "name": name,
        "link": None,
        "group_type": group_type,
        "platform": platform,
        "segment": segment,
        "is_full": False,
        "is_excluded": False,
        "exclusion_reason": None,
        "score": score_group(platform, segment, False, group_type, False),
        "best_offer_type": {
            VibeSegment.BUY_SELL.value: "voucher",
            VibeSegment.WOMEN_FAMILY.value: "ai_emotional_asset",
            VibeSegment.WELLNESS.value: "voucher",
            VibeSegment.BUSINESS.value: "productivity_kit",
            VibeSegment.EXPATS_FOODIES.value: "ai_emotional_asset",
        }.get(segment),
        "proposed_value": proposed_value,
        "notes": "Grupo prioritario del plan Mamivibes + Rovi VibeLab.",
        "source_file": "seed:mamivibes-plan",
        "tags": [segment, platform.lower(), "priority"],
        "metadata": {"seed": True},
    }


def build_default_experiment(offer: dict, group_ids: list[str]) -> dict[str, Any]:
    segment = offer.get("segment") or VibeSegment.OTHER.value
    offer_type = offer.get("offer_type")
    if offer_type == "voucher":
        variants = [
            {
                "key": "A",
                "name": "Urgencia directa",
                "copy": "Se te fue el regalo de Mama? Lo resolvemos hoy: voucher digital premium listo en 15 minutos. Responde INFO y te mando disenos + link de pago.",
                "cta": "Responder INFO",
                "utm_code": f"vibelab_{segment}_voucher_a",
                "expected_signal": "respuestas directas y pagos rapidos",
            },
            {
                "key": "B",
                "name": "Antiestres",
                "copy": "Hoy las tiendas estan saturadas. Te preparo un certificado digital elegante para spa, masaje o brunch y lo recibes por WhatsApp. Responde REGALO.",
                "cta": "Responder REGALO",
                "utm_code": f"vibelab_{segment}_voucher_b",
                "expected_signal": "menos friccion y mejor tono comunitario",
            },
        ]
    elif offer_type == "productivity_kit":
        variants = [
            {
                "key": "A",
                "name": "Regalale tiempo",
                "copy": "Para una mama emprendedora, tiempo libre vale mas que flores. Tengo kits digitales y mini-asistencia listos hoy. Responde TIEMPO.",
                "cta": "Responder TIEMPO",
                "utm_code": f"vibelab_{segment}_productivity_a",
                "expected_signal": "interes de emprendedoras y consultoras",
            },
            {
                "key": "B",
                "name": "Orden inmediato",
                "copy": "Regalo express para mama con negocio: planner digital + checklist de organizacion listo en minutos. Responde PLAN y te mando opciones.",
                "cta": "Responder PLAN",
                "utm_code": f"vibelab_{segment}_productivity_b",
                "expected_signal": "clics y respuestas de baja friccion",
            },
        ]
    else:
        variants = [
            {
                "key": "A",
                "name": "Distancia emocional",
                "copy": "Aunque estes lejos, Mama puede recibir algo personal hoy: cancion, retrato o video digital con su nombre e historia. Responde MAMA para ver ejemplos.",
                "cta": "Responder MAMA",
                "utm_code": f"vibelab_{segment}_ai_a",
                "expected_signal": "respuestas por DM y pedidos personalizados",
            },
            {
                "key": "B",
                "name": "Muestras suaves",
                "copy": "Estoy haciendo 3 muestras de regalos digitales de ultimo minuto para Dia de las Madres. Si quieres una cancion/retrato/video personalizado, responde EJEMPLO.",
                "cta": "Responder EJEMPLO",
                "utm_code": f"vibelab_{segment}_ai_b",
                "expected_signal": "aceptacion en grupos sensibles al spam",
            },
        ]

    return {
        "name": f"AB {offer['title']} - {SEGMENT_LABELS.get(segment, segment)}",
        "offer_id": offer["id"],
        "segment": segment,
        "audience_group_ids": group_ids[:8],
        "outreach_mode": OutreachMode.MANUAL_PERMISSION.value,
        "status": VibeExperimentStatus.READY.value,
        "hypothesis": "Una propuesta contextualizada por segmento superara un mensaje generico en respuestas y pagos.",
        "success_metric": "payments",
        "landing_url": "https://mamivibes.local/?utm_source=vibelab",
        "variants": variants,
        "planned_start_at": None,
    }


def build_post_message(experiment: dict, group: dict, variant: dict) -> str:
    segment_label = SEGMENT_LABELS.get(group.get("segment"), group.get("segment"))
    intro = ""
    if group.get("segment") in {VibeSegment.WELLNESS.value, VibeSegment.WOMEN_FAMILY.value}:
        intro = f"Hola, lo comparto porque va muy alineado con {segment_label.lower()} y lo estoy manejando manualmente para no saturar el grupo.\n\n"
    copy_text = variant.get("copy") or variant.get("copy_text") or ""
    return f"{intro}{copy_text.strip()}\n\nGrupo: {group.get('name')}\nCTA: {variant.get('cta') or 'Responder INFO'}"


def approval_warning(outreach_mode: str) -> str:
    if outreach_mode == OutreachMode.AGGRESSIVE_CONTROLLED.value:
        return "Modo agresivo controlado: solo cola/simulacion. No publicar ni enviar sin aprobacion humana explicita."
    if outreach_mode == OutreachMode.SEMI_AUTOMATED.value:
        return "Modo semi-automatizado: Rovi prepara copy y seguimiento, pero la publicacion debe ser humana."
    return "Modo permiso manual: valida reglas del grupo y publica solo si el contexto lo permite."


async def compute_metrics(db: AsyncIOMotorDatabase, tenant_id: str, experiment_ids: list[str]) -> dict[str, Any]:
    query: dict[str, Any] = {"tenant_id": tenant_id}
    if experiment_ids:
        query["experiment_id"] = {"$in": experiment_ids}
    metrics = await db.vibe_experiment_metrics.find(query, {"_id": 0}).to_list(5000)
    by_experiment: dict[str, dict[str, Any]] = defaultdict(lambda: {
        "replies": 0,
        "clicks": 0,
        "payments": 0,
        "revenue_mxn": 0.0,
        "refunds": 0,
        "complaints": 0,
        "variants": defaultdict(lambda: {"replies": 0, "clicks": 0, "payments": 0, "revenue_mxn": 0.0}),
    })
    for metric in metrics:
        item = by_experiment[metric["experiment_id"]]
        variant_key = metric.get("variant_key") or "A"
        for key in ("replies", "clicks", "payments", "refunds", "complaints"):
            item[key] += int(metric.get(key) or 0)
        item["revenue_mxn"] += float(metric.get("revenue_mxn") or 0)
        variant = item["variants"][variant_key]
        variant["replies"] += int(metric.get("replies") or 0)
        variant["clicks"] += int(metric.get("clicks") or 0)
        variant["payments"] += int(metric.get("payments") or 0)
        variant["revenue_mxn"] += float(metric.get("revenue_mxn") or 0)

    output = {}
    for experiment_id, item in by_experiment.items():
        variants = {
            key: value
            for key, value in item.pop("variants").items()
        }
        winner = None
        if variants:
            winner = max(variants.items(), key=lambda pair: (pair[1]["payments"], pair[1]["replies"], pair[1]["clicks"]))[0]
        conversion_rate = round((item["payments"] / item["clicks"]) * 100, 2) if item["clicks"] else 0
        output[experiment_id] = {**item, "variants": variants, "winner": winner, "conversion_rate": conversion_rate}
    return output


def create_vibe_lab_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/vibe-lab", tags=["vibe-lab"])

    @router.get("/dashboard")
    async def get_dashboard(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        groups = await db.vibe_audience_groups.find({"tenant_id": tenant_id}, {"_id": 0}).sort("score", -1).to_list(500)
        offers = await db.vibe_offers.find({"tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        experiments = await db.vibe_experiments.find({"tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        posts = await db.vibe_posts.find({"tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
        metrics = await compute_metrics(db, tenant_id, [experiment["id"] for experiment in experiments])
        segment_counts = Counter(group.get("segment") or VibeSegment.OTHER.value for group in groups if not group.get("is_excluded"))
        excluded_count = sum(1 for group in groups if group.get("is_excluded"))

        return {
            "summary": {
                "groups": len(groups),
                "eligible_groups": len(groups) - excluded_count,
                "excluded_groups": excluded_count,
                "offers": len(offers),
                "experiments": len(experiments),
                "draft_posts": sum(1 for post in posts if post.get("status") == VibePostStatus.DRAFT.value),
                "revenue_mxn": round(sum(item.get("revenue_mxn", 0) for item in metrics.values()), 2),
                "payments": sum(item.get("payments", 0) for item in metrics.values()),
            },
            "segments": [
                {"segment": key, "label": SEGMENT_LABELS.get(key, key), "count": value}
                for key, value in segment_counts.most_common()
            ],
            "top_groups": serialize_docs(groups[:30]),
            "offers": serialize_docs(offers),
            "experiments": serialize_docs(experiments),
            "posts": serialize_docs(posts[:40]),
            "metrics": metrics,
            "seed_needed": not offers or not experiments,
            "import_needed": len(groups) < 20,
            "outreach_modes": [
                {"value": OutreachMode.MANUAL_PERMISSION.value, "label": "Manual permiso"},
                {"value": OutreachMode.SEMI_AUTOMATED.value, "label": "Semi-automatizado"},
                {"value": OutreachMode.AGGRESSIVE_CONTROLLED.value, "label": "Agresivo controlado"},
            ],
        }

    @router.post("/seed-defaults")
    async def seed_defaults(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        user_id = current_user["user_id"]

        group_ids_by_segment: dict[str, list[str]] = defaultdict(list)
        for name, segment, platform, group_type in PRIORITY_GROUPS:
            group_id = await upsert_group(db, tenant_id, user_id, default_group_payload(name, segment, platform, group_type))
            group_ids_by_segment[segment].append(group_id)

        offer_docs = []
        now = now_utc()
        for offer_payload in DEFAULT_OFFERS:
            offer_id = deterministic_id("vibe-offer", tenant_id, offer_payload["offer_type"])
            doc = {
                "id": offer_id,
                "tenant_id": tenant_id,
                "created_by": user_id,
                **offer_payload,
                "created_at": now,
                "updated_at": now,
            }
            await db.vibe_offers.update_one(
                {"id": offer_id, "tenant_id": tenant_id},
                {"$set": doc},
                upsert=True,
            )
            offer_docs.append(doc)

        experiment_ids = []
        for offer in offer_docs:
            target_segments = offer.get("target_segments") or [offer["segment"]]
            group_ids = []
            for segment in target_segments:
                group_ids.extend(group_ids_by_segment.get(segment, []))
            experiment_payload = build_default_experiment(offer, group_ids)
            experiment_id = deterministic_id("vibe-experiment", tenant_id, offer["offer_type"], experiment_payload["segment"])
            doc = {
                "id": experiment_id,
                "tenant_id": tenant_id,
                "created_by": user_id,
                **experiment_payload,
                "created_at": now,
                "updated_at": now,
            }
            await db.vibe_experiments.update_one(
                {"id": experiment_id, "tenant_id": tenant_id},
                {"$set": doc},
                upsert=True,
            )
            experiment_ids.append(experiment_id)

        return {
            "message": "VibeLab sembrado",
            "groups": sum(len(items) for items in group_ids_by_segment.values()),
            "offers": len(offer_docs),
            "experiments": len(experiment_ids),
        }

    @router.post("/import-superlist")
    async def import_superlist(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        data = await file.read()
        rows = parse_superlist_workbook(data, file.filename or "superlist.xlsx")
        imported = 0
        excluded = 0
        for row in rows:
            await upsert_group(db, tenant_id, current_user["user_id"], row)
            imported += 1
            if row.get("is_excluded"):
                excluded += 1
        return {
            "message": "Superlist importada",
            "filename": file.filename,
            "imported": imported,
            "excluded": excluded,
            "eligible": imported - excluded,
        }

    @router.get("/audience-groups")
    async def list_audience_groups(
        segment: Optional[str] = Query(None),
        include_excluded: bool = Query(False),
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        query: dict[str, Any] = {"tenant_id": tenant_id}
        if segment:
            query["segment"] = segment
        if not include_excluded:
            query["is_excluded"] = {"$ne": True}
        groups = await db.vibe_audience_groups.find(query, {"_id": 0}).sort("score", -1).to_list(500)
        return serialize_docs(groups)

    @router.post("/audience-groups")
    async def create_audience_group(payload: AudienceGroupCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        data = payload.model_dump()
        group_id = await upsert_group(db, tenant_id, current_user["user_id"], data)
        group = await db.vibe_audience_groups.find_one({"id": group_id, "tenant_id": tenant_id}, {"_id": 0})
        return serialize_doc(group)

    @router.get("/offers")
    async def list_offers(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        offers = await db.vibe_offers.find({"tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return serialize_docs(offers)

    @router.post("/offers")
    async def create_offer(payload: VibeOfferCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        offer = VibeOffer(
            **payload.model_dump(),
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
        )
        await db.vibe_offers.insert_one(offer.model_dump())
        return serialize_doc(offer.model_dump())

    @router.get("/experiments")
    async def list_experiments(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        experiments = await db.vibe_experiments.find({"tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return serialize_docs(experiments)

    @router.post("/experiments")
    async def create_experiment(payload: VibeExperimentCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        if payload.offer_id:
            offer = await db.vibe_offers.find_one({"id": payload.offer_id, "tenant_id": tenant_id}, {"_id": 0, "id": 1})
            if not offer:
                raise HTTPException(status_code=404, detail="Oferta no encontrada")
        experiment = VibeExperiment(
            **payload.model_dump(by_alias=True),
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
        )
        await db.vibe_experiments.insert_one(experiment.model_dump())
        return serialize_doc(experiment.model_dump())

    @router.post("/experiments/{experiment_id}/generate-posts")
    async def generate_experiment_posts(experiment_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        experiment = await db.vibe_experiments.find_one({"id": experiment_id, "tenant_id": tenant_id}, {"_id": 0})
        if not experiment:
            raise HTTPException(status_code=404, detail="Experimento no encontrado")

        if experiment.get("outreach_mode") == OutreachMode.AGGRESSIVE_CONTROLLED.value:
            await db.vibe_experiments.update_one(
                {"id": experiment_id, "tenant_id": tenant_id},
                {"$set": {"status": VibeExperimentStatus.READY.value, "updated_at": now_utc()}},
            )

        group_ids = experiment.get("audience_group_ids") or []
        if not group_ids:
            groups = await db.vibe_audience_groups.find(
                {"tenant_id": tenant_id, "segment": experiment.get("segment"), "is_excluded": {"$ne": True}},
                {"_id": 0},
            ).sort("score", -1).limit(8).to_list(8)
        else:
            groups = await db.vibe_audience_groups.find(
                {"tenant_id": tenant_id, "id": {"$in": group_ids}, "is_excluded": {"$ne": True}},
                {"_id": 0},
            ).to_list(100)
        if not groups:
            raise HTTPException(status_code=400, detail="No hay grupos elegibles para este experimento")

        variants = experiment.get("variants") or []
        if not variants:
            variants = [{"key": "A", "name": "Default", "copy": "Oferta disponible. Responde INFO.", "cta": "INFO"}]

        created = []
        for group in groups:
            for variant in variants:
                post_id = deterministic_id("vibe-post", tenant_id, experiment_id, group["id"], variant.get("key", "A"))
                doc = {
                    "id": post_id,
                    "tenant_id": tenant_id,
                    "created_by": current_user["user_id"],
                    "experiment_id": experiment_id,
                    "audience_group_id": group["id"],
                    "variant_key": variant.get("key", "A"),
                    "outreach_mode": experiment.get("outreach_mode", OutreachMode.MANUAL_PERMISSION.value),
                    "message": build_post_message(experiment, group, variant),
                    "status": VibePostStatus.DRAFT.value,
                    "requires_approval": True,
                    "approval_warning": approval_warning(experiment.get("outreach_mode", OutreachMode.MANUAL_PERMISSION.value)),
                    "scheduled_at": None,
                    "published_at": None,
                    "metadata": {
                        "group_name": group.get("name"),
                        "group_segment": group.get("segment"),
                        "platform": group.get("platform"),
                        "variant_name": variant.get("name"),
                    },
                    "updated_at": now_utc(),
                }
                await db.vibe_posts.update_one(
                    {"id": post_id, "tenant_id": tenant_id},
                    {"$set": doc, "$setOnInsert": {"created_at": now_utc()}},
                    upsert=True,
                )
                created.append(doc)

        return {"message": "Posts generados en borrador", "created": len(created), "posts": serialize_docs(created)}

    @router.get("/posts")
    async def list_posts(
        experiment_id: Optional[str] = Query(None),
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        query: dict[str, Any] = {"tenant_id": tenant_id}
        if experiment_id:
            query["experiment_id"] = experiment_id
        posts = await db.vibe_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
        return serialize_docs(posts)

    @router.put("/posts/{post_id}/status")
    async def update_post_status(post_id: str, status: VibePostStatus, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        update: dict[str, Any] = {"status": status.value, "updated_at": now_utc()}
        if status == VibePostStatus.PUBLISHED_MANUAL:
            update["published_at"] = now_utc()
        result = await db.vibe_posts.update_one({"id": post_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Post no encontrado")
        post = await db.vibe_posts.find_one({"id": post_id, "tenant_id": tenant_id}, {"_id": 0})
        return serialize_doc(post)

    @router.post("/metrics")
    async def create_metric(payload: ExperimentMetricCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        experiment = await db.vibe_experiments.find_one({"id": payload.experiment_id, "tenant_id": tenant_id}, {"_id": 0, "id": 1})
        if not experiment:
            raise HTTPException(status_code=404, detail="Experimento no encontrado")
        metric = ExperimentMetric(
            **payload.model_dump(),
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
        )
        await db.vibe_experiment_metrics.insert_one(metric.model_dump())
        return serialize_doc(metric.model_dump())

    return router

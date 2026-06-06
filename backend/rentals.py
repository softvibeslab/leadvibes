from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth import get_current_user
from models import (
    BookingStatus,
    RentalBooking,
    RentalBookingCreate,
    RentalBookingUpdate,
    RentalCalendarEvent,
    RentalCalendarEventCreate,
    RentalCalendarEventUpdate,
    RentalCashClosure,
    RentalCashClosureCreate,
    RentalCashClosureUpdate,
    RentalExpense,
    RentalExpenseCreate,
    RentalExpenseUpdate,
    RentalExternalSale,
    RentalExternalSaleCreate,
    RentalExternalSaleUpdate,
    RentalGuest,
    RentalGuestCreate,
    MediaAsset,
    RentalOwner,
    RentalOwnerCreate,
    RentalPipeline,
    RentalPipelineCreate,
    RentalPipelineStage,
    RentalPipelineStageCreate,
    RentalPipelineStageUpdate,
    RentalPipelineUpdate,
    RentalProperty,
    RentalPropertyCreate,
    RentalPropertyStatus,
    RentalPropertyUpdate,
    RentalStaff,
    RentalStaffCreate,
    RentalStaffUpdate,
    RentalTask,
    RentalTaskCreate,
    RentalTaskStatus,
    RentalTaskUpdate,
)


IMPORT_TEMPLATES: dict[str, list[str]] = {
    "properties": [
        "title", "address", "zone", "rental_type", "operation_type", "bedrooms", "bathrooms",
        "max_guests", "nightly_price_mxn", "monthly_price_mxn", "cleaning_fee_mxn",
        "deposit_mxn", "commission_rate", "platforms", "amenities", "image_urls", "notes",
    ],
    "bookings": [
        "property_title", "property_id", "guest_name", "guest_email", "guest_phone", "source",
        "check_in", "check_out", "guests_count", "status", "total_amount_mxn",
        "paid_amount_mxn", "cleaning_fee_mxn", "deposit_mxn", "platform_fee_mxn", "notes",
    ],
    "calendar": [
        "property_title", "property_id", "event_type", "start_date", "end_date", "status", "source", "notes",
    ],
    "tasks": [
        "property_title", "property_id", "booking_reference", "task_type", "title", "due_at",
        "assigned_to", "status", "notes",
    ],
    "financials": [
        "property_title", "property_id", "booking_reference", "category", "amount_mxn",
        "description", "expense_date", "vendor",
    ],
}


IMPORT_REQUIRED_FIELDS = {
    "properties": ["title"],
    "bookings": ["guest_name", "check_in", "check_out"],
    "calendar": ["event_type", "start_date", "end_date"],
    "tasks": ["title"],
    "financials": ["amount_mxn", "description"],
}


IMPORT_SAMPLE_ROWS: dict[str, dict[str, Any]] = {
    "properties": {
        "title": "Casa Sol Tulum",
        "address": "Av. Kukulkan 123",
        "zone": "La Veleta",
        "rental_type": "short_term",
        "operation_type": "rent",
        "bedrooms": 2,
        "bathrooms": 2,
        "max_guests": 4,
        "nightly_price_mxn": 3200,
        "monthly_price_mxn": 45000,
        "cleaning_fee_mxn": 650,
        "deposit_mxn": 5000,
        "commission_rate": 0.18,
        "platforms": "Airbnb,Booking",
        "amenities": "wifi,pool,parking",
        "image_urls": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        "notes": "Vista a la alberca",
    },
    "bookings": {
        "property_title": "Casa Sol Tulum",
        "property_id": "",
        "guest_name": "Maria Gonzalez",
        "guest_email": "maria@example.com",
        "guest_phone": "+529981234567",
        "source": "Airbnb",
        "check_in": "2026-06-05",
        "check_out": "2026-06-09",
        "guests_count": 3,
        "status": "confirmed",
        "total_amount_mxn": 12800,
        "paid_amount_mxn": 12800,
        "cleaning_fee_mxn": 650,
        "deposit_mxn": 5000,
        "platform_fee_mxn": 450,
        "notes": "Llegada 3pm",
    },
    "calendar": {
        "property_title": "Casa Sol Tulum",
        "property_id": "",
        "event_type": "blocked",
        "start_date": "2026-06-12",
        "end_date": "2026-06-15",
        "status": "blocked",
        "source": "owner",
        "notes": "Bloqueo por mantenimiento",
    },
    "tasks": {
        "property_title": "Casa Sol Tulum",
        "property_id": "",
        "booking_reference": "AIRBNB-HM123",
        "task_type": "cleaning",
        "title": "Limpieza checkout",
        "due_at": "2026-06-09 11:00",
        "assigned_to": "Equipo limpieza",
        "status": "todo",
        "notes": "Revisar blancos y amenidades",
    },
    "financials": {
        "property_title": "Casa Sol Tulum",
        "property_id": "",
        "booking_reference": "AIRBNB-HM123",
        "category": "maintenance",
        "amount_mxn": 1200,
        "description": "Cambio de chapa",
        "expense_date": "2026-06-10",
        "vendor": "Cerrajeria Tulum",
    },
}

DEMO_CHANNEL_INTEGRATIONS: list[dict[str, Any]] = [
    {
        "provider": "airbnb",
        "name": "Airbnb",
        "logo_text": "A",
        "category": "OTA",
        "sort_order": 10,
        "description": "Reservas, huéspedes, payouts y calendario iCal para rentas de corta estancia.",
        "capabilities": ["Reservas", "Calendario", "Mensajes", "Pagos"],
        "demo_notes": "Mock de OAuth + webhook. No conecta con Airbnb real.",
    },
    {
        "provider": "booking",
        "name": "Booking.com",
        "logo_text": "B",
        "category": "OTA",
        "sort_order": 20,
        "description": "Reservas, disponibilidad, comisiones y cargos por plataforma.",
        "capabilities": ["Reservas", "Disponibilidad", "Comisiones", "Reportes"],
        "demo_notes": "Mock de conectividad tipo partner API.",
    },
    {
        "provider": "vrbo",
        "name": "Vrbo",
        "logo_text": "V",
        "category": "OTA",
        "sort_order": 30,
        "description": "Sincronización demo de estancias familiares, bloqueos y cobros externos.",
        "capabilities": ["Reservas", "Calendario", "Bloqueos"],
        "demo_notes": "Mock de canal vía iCal/API.",
    },
    {
        "provider": "expedia",
        "name": "Expedia",
        "logo_text": "E",
        "category": "OTA",
        "sort_order": 40,
        "description": "Integración demo para paquetes, reservas hoteleras y conciliación mensual.",
        "capabilities": ["Reservas", "Conciliación", "Reportes"],
        "demo_notes": "Mock de extranet y conciliación.",
    },
    {
        "provider": "google_calendar",
        "name": "Google Calendar",
        "logo_text": "G",
        "category": "Calendario",
        "sort_order": 50,
        "description": "Publica check-ins, check-outs, bloqueos y tareas al calendario operativo.",
        "capabilities": ["Eventos", "Bloqueos", "Recordatorios"],
        "demo_notes": "Mock de OAuth; no solicita permisos reales.",
    },
    {
        "provider": "ical_channel_manager",
        "name": "Channel Manager / iCal",
        "logo_text": "CM",
        "category": "Channel manager",
        "sort_order": 60,
        "description": "Demo para centralizar disponibilidad desde Guesty, Hospitable, Smoobu o iCal.",
        "capabilities": ["iCal", "Disponibilidad", "Bloqueos", "Propiedades"],
        "demo_notes": "Mock multi-canal para futuras integraciones reales.",
    },
]

DEFAULT_BOOKING_PIPELINE_STAGES: list[dict[str, Any]] = [
    {
        "name": "Solicitud recibida",
        "description": "Lead o huésped pregunta disponibilidad, precio o condiciones.",
        "booking_status": BookingStatus.INQUIRY.value,
        "color": "#0EA5E9",
        "probability": 10,
        "sort_order": 10,
        "automation_notes": "Enviar disponibilidad, reglas de casa y condiciones de apartado.",
    },
    {
        "name": "Apartada",
        "description": "Fechas separadas, pendiente de confirmación final o anticipo.",
        "booking_status": BookingStatus.RESERVED.value,
        "color": "#F59E0B",
        "probability": 35,
        "sort_order": 20,
        "automation_notes": "Solicitar anticipo, documento y hora estimada de llegada.",
    },
    {
        "name": "Confirmada",
        "description": "Reserva validada con pago, datos de huésped y condiciones aceptadas.",
        "booking_status": BookingStatus.CONFIRMED.value,
        "color": "#14B8A6",
        "probability": 70,
        "sort_order": 30,
        "automation_notes": "Crear tareas de limpieza/check-in y enviar instrucciones previas.",
    },
    {
        "name": "En estancia",
        "description": "Huésped dentro de la propiedad; seguimiento operativo activo.",
        "booking_status": BookingStatus.CHECKED_IN.value,
        "color": "#6366F1",
        "probability": 90,
        "sort_order": 40,
        "automation_notes": "Monitorear incidencias, amenidades, upsells y satisfacción.",
    },
    {
        "name": "Check-out / cierre",
        "description": "Salida terminada, revisión, cobranza final y solicitud de reseña.",
        "booking_status": BookingStatus.CHECKED_OUT.value,
        "color": "#22C55E",
        "probability": 100,
        "sort_order": 50,
        "is_closing_stage": True,
        "automation_notes": "Crear inspección, cerrar caja, liberar depósito y pedir reseña.",
    },
    {
        "name": "Cancelada",
        "description": "Reserva perdida o cancelada; útil para medir causas y recuperación.",
        "booking_status": BookingStatus.CANCELLED.value,
        "color": "#EF4444",
        "probability": 0,
        "sort_order": 60,
        "automation_notes": "Registrar motivo, política aplicada y oportunidad de rebooking.",
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


def default_demo_integration(provider_config: dict[str, Any], tenant_id: str, user_id: str) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_by": user_id,
        "provider": provider_config["provider"],
        "name": provider_config["name"],
        "logo_text": provider_config["logo_text"],
        "category": provider_config["category"],
        "sort_order": provider_config["sort_order"],
        "description": provider_config["description"],
        "capabilities": provider_config["capabilities"],
        "demo_notes": provider_config["demo_notes"],
        "mode": "demo",
        "status": "demo_available",
        "health": "not_connected",
        "webhook_status": "mock_ready",
        "last_sync_at": None,
        "connected_at": None,
        "setup_checklist": [
            {"label": "Credenciales demo", "done": False},
            {"label": "Mapeo de propiedades", "done": False},
            {"label": "Sincronización inicial", "done": False},
        ],
        "metrics": {
            "properties_mapped": 0,
            "bookings_imported": 0,
            "calendar_blocks": 0,
            "payouts_reconciled": 0,
            "sync_errors": 0,
        },
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }


async def ensure_demo_integrations(db: AsyncIOMotorDatabase, tenant_id: str, user_id: str) -> list[dict]:
    existing = await db.rental_integrations.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
    existing_providers = {item.get("provider") for item in existing}
    missing = [
        default_demo_integration(config, tenant_id, user_id)
        for config in DEMO_CHANNEL_INTEGRATIONS
        if config["provider"] not in existing_providers
    ]
    if missing:
        await db.rental_integrations.insert_many(missing)
        existing.extend(missing)
    return sorted(existing, key=lambda item: item.get("sort_order", 999))


def integration_summary(channels: list[dict]) -> dict[str, Any]:
    connected = [item for item in channels if item.get("status") == "connected"]
    warnings = [item for item in channels if item.get("health") == "warning" or (item.get("metrics") or {}).get("sync_errors")]
    last_sync_values = [item.get("last_sync_at") for item in channels if item.get("last_sync_at")]
    return {
        "mode": "demo",
        "channels_total": len(channels),
        "connected": len(connected),
        "pending": len([item for item in channels if item.get("status") != "connected"]),
        "warnings": len(warnings),
        "bookings_imported": sum(int((item.get("metrics") or {}).get("bookings_imported") or 0) for item in channels),
        "calendar_blocks": sum(int((item.get("metrics") or {}).get("calendar_blocks") or 0) for item in channels),
        "payouts_reconciled": sum(int((item.get("metrics") or {}).get("payouts_reconciled") or 0) for item in channels),
        "last_sync_at": max(last_sync_values) if last_sync_values else None,
    }


async def get_integration_or_404(db: AsyncIOMotorDatabase, tenant_id: str, provider: str) -> dict:
    integration = await db.rental_integrations.find_one({"tenant_id": tenant_id, "provider": provider}, {"_id": 0})
    if not integration:
        raise HTTPException(status_code=404, detail="Integración demo no encontrada")
    return integration


def resolve_tenant_id(current_user: dict) -> str:
    return current_user.get("active_tenant_id") or current_user.get("tenant_id") or f"tenant-{current_user['user_id'][:8]}"


def calc_nights(check_in: datetime, check_out: datetime) -> int:
    delta = check_out - check_in
    return max(delta.days, 1)


def calc_balance(total: float, paid: float) -> float:
    return round(float(total or 0) - float(paid or 0), 2)


def normalize_calendar_event_type(event_type: Optional[str]) -> str:
    value = as_text(event_type, "otro").lower()
    mapping = {
        "blocked": "bloqueo",
        "block": "bloqueo",
        "bloqueo": "bloqueo",
        "cleaning": "limpieza",
        "limpieza": "limpieza",
        "maintenance": "mantenimiento",
        "mantenimiento": "mantenimiento",
        "inspection": "tarea",
        "task": "tarea",
        "tarea": "tarea",
    }
    return mapping.get(value, value if value in {"reserva", "checkout", "limpieza", "mantenimiento", "tarea"} else "otro")


def calendar_event_title(item: dict, property_title: str, normalized_type: str) -> str:
    if item.get("title"):
        return item["title"]
    labels = {
        "bloqueo": "Bloqueo",
        "limpieza": "Limpieza",
        "mantenimiento": "Mantenimiento",
        "tarea": "Tarea",
        "otro": "Evento",
    }
    return f"{labels.get(normalized_type, 'Evento')}: {property_title}"


def clean_key(value: Any) -> str:
    text = str(value or "").strip().lower()
    for source, target in (
        ("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n"),
    ):
        text = text.replace(source, target)
    cleaned = "".join(char if char.isalnum() else "_" for char in text)
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_")


def normalize_row(row: dict) -> dict:
    normalized = {}
    for key, value in row.items():
        if not isinstance(value, (list, tuple, dict)) and pd.isna(value):
            value = ""
        normalized[clean_key(key)] = value
    return normalized


def as_text(value: Any, default: str = "") -> str:
    text = str(value or "").strip()
    return text if text else default


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or str(value).strip() == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def as_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or str(value).strip() == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def as_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value or "")
    separator = "|" if "|" in text else ","
    return [item.strip() for item in text.split(separator) if item.strip()]


def first_value(row: dict, *keys: str) -> Any:
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return value
    return ""


def build_media_assets_from_urls(image_urls: list[str], title: str) -> list[dict]:
    assets = []
    for index, image_url in enumerate(image_urls or []):
        url = str(image_url or "").strip()
        if not url:
            continue
        assets.append(
            MediaAsset(
                url=url,
                filename=url.rsplit("/", 1)[-1] or f"rental-property-{index + 1}",
                alt=f"{title} imagen {index + 1}",
                is_cover=index == 0,
                order=index,
                source="import_url",
            ).model_dump()
        )
    return assets


def parse_datetime_value(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value or "").strip()
    if not text:
        return None
    try:
        parsed = pd.to_datetime(text, utc=True)
        if pd.isna(parsed):
            return None
        return parsed.to_pydatetime()
    except Exception:
        return None


def to_aware_utc(value: Any) -> Optional[datetime]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return parse_datetime_value(value)


def iso_datetime(value: Any) -> Optional[str]:
    parsed = to_aware_utc(value)
    return parsed.isoformat() if parsed else None


def matches_date_range(value: Any, start_date: Optional[str], end_date: Optional[str]) -> bool:
    parsed = to_aware_utc(value)
    if not parsed:
        return False
    start = parse_datetime_value(start_date) if start_date else None
    end = parse_datetime_value(end_date) if end_date else None
    if start and parsed < start:
        return False
    if end and parsed >= end + timedelta(days=1):
        return False
    return True


def parse_upload_rows(filename: str, content: bytes) -> list[dict]:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else "csv"
    if suffix in {"xlsx", "xls"}:
        dataframe = pd.read_excel(io.BytesIO(content))
        return [normalize_row(row) for row in dataframe.to_dict(orient="records")]

    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [normalize_row(row) for row in reader]


async def resolve_property_id(db: AsyncIOMotorDatabase, tenant_id: str, row: dict) -> Optional[str]:
    property_id = as_text(row.get("property_id"))
    if property_id:
        existing = await db.rental_properties.find_one({"tenant_id": tenant_id, "id": property_id}, {"_id": 0, "id": 1})
        if existing:
            return existing["id"]

    title = as_text(row.get("property_title") or row.get("title"))
    if not title:
        return None
    existing = await db.rental_properties.find_one(
        {"tenant_id": tenant_id, "title": {"$regex": f"^{title}$", "$options": "i"}},
        {"_id": 0, "id": 1},
    )
    return existing["id"] if existing else None


def validate_import_row(import_type: str, row: dict) -> list[str]:
    errors = []
    for field in IMPORT_REQUIRED_FIELDS.get(import_type, []):
        if not as_text(row.get(field)):
            errors.append(f"Falta {field}")

    if import_type == "bookings":
        check_in = parse_datetime_value(row.get("check_in"))
        check_out = parse_datetime_value(row.get("check_out"))
        if not check_in:
            errors.append("check_in inválido")
        if not check_out:
            errors.append("check_out inválido")
        if check_in and check_out and check_out <= check_in:
            errors.append("check_out debe ser posterior a check_in")

    if import_type == "calendar":
        start_date = parse_datetime_value(row.get("start_date"))
        end_date = parse_datetime_value(row.get("end_date"))
        if not start_date:
            errors.append("start_date inválido")
        if not end_date:
            errors.append("end_date inválido")
        if start_date and end_date and end_date <= start_date:
            errors.append("end_date debe ser posterior a start_date")

    if import_type == "tasks" and row.get("due_at") and not parse_datetime_value(row.get("due_at")):
        errors.append("due_at inválido")

    if import_type == "financials" and as_float(row.get("amount_mxn"), -1) < 0:
        errors.append("amount_mxn inválido")

    return errors


async def get_property_or_404(db: AsyncIOMotorDatabase, tenant_id: str, property_id: str) -> dict:
    rental_property = await db.rental_properties.find_one(
        {"id": property_id, "tenant_id": tenant_id},
        {"_id": 0},
    )
    if not rental_property:
        raise HTTPException(status_code=404, detail="Propiedad de renta no encontrada")
    return rental_property


async def ensure_default_booking_pipeline(db: AsyncIOMotorDatabase, tenant_id: str, user_id: str) -> dict:
    existing = await db.rental_pipelines.find_one(
        {"tenant_id": tenant_id, "entity_type": "booking", "status": {"$ne": "archived"}},
        {"_id": 0},
        sort=[("is_default", -1), ("created_at", 1)],
    )
    if existing:
        stage_count = await db.rental_pipeline_stages.count_documents({
            "tenant_id": tenant_id,
            "pipeline_id": existing["id"],
        })
        if stage_count:
            return existing

    pipeline = RentalPipeline(
        tenant_id=tenant_id,
        created_by=user_id,
        name="Reservas de propiedades",
        description="Pipeline operativo para transformar solicitudes en check-in, estancia, check-out y cierre.",
        entity_type="booking",
        status="active",
        is_default=True,
    )
    await db.rental_pipelines.insert_one(pipeline.model_dump())
    stages = [
        RentalPipelineStage(
            tenant_id=tenant_id,
            created_by=user_id,
            pipeline_id=pipeline.id,
            **stage_data,
        ).model_dump()
        for stage_data in DEFAULT_BOOKING_PIPELINE_STAGES
    ]
    await db.rental_pipeline_stages.insert_many(stages)
    return pipeline.model_dump()


async def get_pipeline_or_404(db: AsyncIOMotorDatabase, tenant_id: str, pipeline_id: str) -> dict:
    pipeline = await db.rental_pipelines.find_one(
        {"id": pipeline_id, "tenant_id": tenant_id, "status": {"$ne": "archived"}},
        {"_id": 0},
    )
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline de rentas no encontrado")
    return pipeline


async def get_stage_or_404(db: AsyncIOMotorDatabase, tenant_id: str, stage_id: str) -> dict:
    stage = await db.rental_pipeline_stages.find_one(
        {"id": stage_id, "tenant_id": tenant_id},
        {"_id": 0},
    )
    if not stage:
        raise HTTPException(status_code=404, detail="Stage de pipeline no encontrado")
    return stage


async def build_pipeline_board(db: AsyncIOMotorDatabase, tenant_id: str, pipeline_id: str) -> dict:
    pipeline = await get_pipeline_or_404(db, tenant_id, pipeline_id)
    stages = await db.rental_pipeline_stages.find(
        {"tenant_id": tenant_id, "pipeline_id": pipeline_id},
        {"_id": 0},
    ).sort("sort_order", 1).to_list(100)

    bookings = await db.rental_bookings.find(
        {"tenant_id": tenant_id},
        {"_id": 0},
    ).sort("check_in", 1).to_list(500)
    property_ids = list({booking.get("property_id") for booking in bookings if booking.get("property_id")})
    properties = await db.rental_properties.find(
        {"tenant_id": tenant_id, "id": {"$in": property_ids}},
        {"_id": 0, "id": 1, "title": 1, "zone": 1, "address": 1, "images": 1},
    ).to_list(None)
    property_lookup = {item["id"]: item for item in properties}

    stage_by_id = {stage["id"]: stage for stage in stages}
    status_stage_lookup = {
        stage.get("booking_status"): stage
        for stage in stages
        if stage.get("booking_status")
    }
    fallback_stage = stages[0] if stages else None
    board_stages = []
    stage_metrics: dict[str, dict[str, Any]] = {}

    for stage in stages:
        stage_metrics[stage["id"]] = {
            "bookings": [],
            "bookings_count": 0,
            "revenue_mxn": 0.0,
            "paid_mxn": 0.0,
            "balance_due_mxn": 0.0,
            "nights": 0,
            "properties": [],
            "properties_count": 0,
            "nightly_potential_mxn": 0.0,
            "monthly_potential_mxn": 0.0,
        }

    for booking in bookings:
        explicit_stage = stage_by_id.get(booking.get("stage_id")) if booking.get("pipeline_id") == pipeline_id else None
        mapped_stage = explicit_stage or status_stage_lookup.get(booking.get("status")) or fallback_stage
        if not mapped_stage:
            continue

        metrics = stage_metrics[mapped_stage["id"]]
        metrics["bookings_count"] += 1
        metrics["revenue_mxn"] += float(booking.get("total_amount_mxn") or 0)
        metrics["paid_mxn"] += float(booking.get("paid_amount_mxn") or 0)
        metrics["balance_due_mxn"] += float(booking.get("balance_due_mxn") or 0)
        metrics["nights"] += int(booking.get("nights") or 0)

        if len(metrics["bookings"]) < 12:
            rental_property = property_lookup.get(booking.get("property_id"))
            metrics["bookings"].append({
                **serialize_doc(booking),
                "property": serialize_doc(rental_property),
            })

    rental_properties = await db.rental_properties.find(
        {"tenant_id": tenant_id, "status": {"$ne": RentalPropertyStatus.ARCHIVED.value}},
        {"_id": 0},
    ).sort("updated_at", -1).to_list(500)

    for rental_property in rental_properties:
        explicit_stage = stage_by_id.get(rental_property.get("stage_id")) if rental_property.get("pipeline_id") == pipeline_id else None
        mapped_stage = explicit_stage or fallback_stage
        if not mapped_stage:
            continue

        metrics = stage_metrics[mapped_stage["id"]]
        metrics["properties_count"] += 1
        metrics["nightly_potential_mxn"] += float(rental_property.get("nightly_price_mxn") or 0)
        metrics["monthly_potential_mxn"] += float(rental_property.get("monthly_price_mxn") or 0)
        metrics["properties"].append(serialize_doc(rental_property))

    for stage in stages:
        metrics = stage_metrics.get(stage["id"], {})
        board_stages.append({
            **serialize_doc(stage),
            "bookings": metrics.get("bookings", []),
            "bookings_count": metrics.get("bookings_count", 0),
            "revenue_mxn": round(metrics.get("revenue_mxn", 0), 2),
            "paid_mxn": round(metrics.get("paid_mxn", 0), 2),
            "balance_due_mxn": round(metrics.get("balance_due_mxn", 0), 2),
            "nights": metrics.get("nights", 0),
            "properties": metrics.get("properties", []),
            "properties_count": metrics.get("properties_count", 0),
            "nightly_potential_mxn": round(metrics.get("nightly_potential_mxn", 0), 2),
            "monthly_potential_mxn": round(metrics.get("monthly_potential_mxn", 0), 2),
        })

    return {
        "pipeline": serialize_doc(pipeline),
        "stages": board_stages,
        "summary": {
            "stages_count": len(stages),
            "bookings_count": sum(stage["bookings_count"] for stage in board_stages),
            "revenue_mxn": round(sum(stage["revenue_mxn"] for stage in board_stages), 2),
            "paid_mxn": round(sum(stage["paid_mxn"] for stage in board_stages), 2),
            "balance_due_mxn": round(sum(stage["balance_due_mxn"] for stage in board_stages), 2),
            "properties_count": sum(stage["properties_count"] for stage in board_stages),
            "nightly_potential_mxn": round(sum(stage["nightly_potential_mxn"] for stage in board_stages), 2),
            "monthly_potential_mxn": round(sum(stage["monthly_potential_mxn"] for stage in board_stages), 2),
        },
    }


async def attach_booking_context(db: AsyncIOMotorDatabase, tenant_id: str, bookings: list[dict]) -> list[dict]:
    property_ids = list({booking.get("property_id") for booking in bookings if booking.get("property_id")})
    properties = await db.rental_properties.find(
        {"tenant_id": tenant_id, "id": {"$in": property_ids}},
        {"_id": 0, "id": 1, "title": 1, "zone": 1, "address": 1},
    ).to_list(None)
    property_lookup = {item["id"]: item for item in properties}

    enriched = []
    for booking in bookings:
        enriched.append({
            **serialize_doc(booking),
            "property": serialize_doc(property_lookup.get(booking.get("property_id"))),
        })
    return enriched


async def attach_staff_context(db: AsyncIOMotorDatabase, tenant_id: str, items: list[dict]) -> list[dict]:
    staff_ids = list({item.get("assigned_staff_id") or item.get("staff_id") or item.get("responsible_staff_id") for item in items if item.get("assigned_staff_id") or item.get("staff_id") or item.get("responsible_staff_id")})
    staff = await db.rental_staff.find(
        {"tenant_id": tenant_id, "id": {"$in": staff_ids}},
        {"_id": 0, "id": 1, "name": 1, "role": 1, "phone": 1, "email": 1, "responsibilities": 1, "specialties": 1},
    ).to_list(None)
    staff_lookup = {item["id"]: item for item in staff}
    enriched = []
    for item in items:
        staff_id = item.get("assigned_staff_id") or item.get("staff_id") or item.get("responsible_staff_id")
        enriched.append({
            **serialize_doc(item),
            "staff": serialize_doc(staff_lookup.get(staff_id)),
        })
    return enriched


def same_local_day(value: Any, target: datetime) -> bool:
    parsed = to_aware_utc(value)
    if not parsed:
        return False
    return parsed.date() == target.date()


def same_local_month(value: Any, target: datetime) -> bool:
    parsed = to_aware_utc(value)
    if not parsed:
        return False
    return parsed.year == target.year and parsed.month == target.month


def payment_is_collected(status: Optional[str]) -> bool:
    return as_text(status, "collected").lower() in {"paid", "collected", "cobrado", "closed", "done"}


async def build_cash_closure_snapshot(db: AsyncIOMotorDatabase, tenant_id: str, closure_date: datetime) -> dict:
    bookings = await db.rental_bookings.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
    expenses = await db.rental_expenses.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
    external_sales = await db.rental_external_sales.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)

    day_bookings = [
        item for item in bookings
        if item.get("status") != BookingStatus.CANCELLED.value and (
            same_local_day(item.get("check_in"), closure_date)
            or same_local_day(item.get("check_out"), closure_date)
            or same_local_day(item.get("created_at"), closure_date)
        )
    ]
    day_expenses = [item for item in expenses if same_local_day(item.get("expense_date") or item.get("created_at"), closure_date)]
    day_sales = [item for item in external_sales if same_local_day(item.get("sale_date") or item.get("created_at"), closure_date)]

    bookings_collected = sum(float(item.get("paid_amount_mxn") or 0) for item in day_bookings)
    balance_due = sum(float(item.get("balance_due_mxn") or 0) for item in day_bookings)
    sales_collected = sum(float(item.get("amount_mxn") or 0) for item in day_sales if payment_is_collected(item.get("status")))
    expenses_paid = sum(float(item.get("amount_mxn") or 0) for item in day_expenses if payment_is_collected(item.get("status")))
    expenses_pending = sum(float(item.get("amount_mxn") or 0) for item in day_expenses if not payment_is_collected(item.get("status")))

    return {
        "bookings_count": len(day_bookings),
        "expenses_count": len(day_expenses),
        "external_sales_count": len(day_sales),
        "bookings_collected_mxn": round(bookings_collected, 2),
        "external_sales_mxn": round(sales_collected, 2),
        "expenses_paid_mxn": round(expenses_paid, 2),
        "expenses_pending_mxn": round(expenses_pending, 2),
        "balance_due_mxn": round(balance_due, 2),
        "net_mxn": round(bookings_collected + sales_collected - expenses_paid, 2),
        "booking_ids": [item.get("id") for item in day_bookings],
        "expense_ids": [item.get("id") for item in day_expenses],
        "external_sale_ids": [item.get("id") for item in day_sales],
    }


async def build_import_preview(db: AsyncIOMotorDatabase, tenant_id: str, import_type: str, rows: list[dict]) -> dict:
    preview_rows = []
    valid_rows = 0
    error_rows = 0
    for index, row in enumerate(rows[:500], start=1):
        errors = validate_import_row(import_type, row)
        if import_type in {"bookings", "calendar", "tasks", "financials"}:
            property_id = await resolve_property_id(db, tenant_id, row)
            if not property_id:
                errors.append("No se encontró la propiedad por property_id/property_title")

        if errors:
            error_rows += 1
        else:
            valid_rows += 1

        preview_rows.append({
            "row_number": index,
            "status": "error" if errors else "valid",
            "errors": errors,
            "data": row,
        })

    if len(rows) > 500:
        error_rows += len(rows) - 500

    return {
        "total_rows": len(rows),
        "valid_rows": valid_rows,
        "error_rows": error_rows,
        "preview_rows": preview_rows[:50],
        "columns": list(rows[0].keys()) if rows else [],
    }


async def execute_import_row(db: AsyncIOMotorDatabase, tenant_id: str, current_user: dict, import_type: str, row: dict) -> dict:
    user_id = current_user["user_id"]
    if import_type == "properties":
        title = as_text(row.get("title"))
        existing = await db.rental_properties.find_one(
            {"tenant_id": tenant_id, "title": {"$regex": f"^{title}$", "$options": "i"}},
            {"_id": 0, "id": 1},
        )
        payload = {
            "title": title,
            "owner_id": None,
            "address": as_text(row.get("address")),
            "zone": as_text(row.get("zone")),
            "operation_type": as_text(row.get("operation_type"), "rent"),
            "rental_type": as_text(row.get("rental_type"), "short_term"),
            "status": as_text(row.get("status"), "active"),
            "bedrooms": as_int(row.get("bedrooms"), 1),
            "bathrooms": as_float(row.get("bathrooms"), 1),
            "max_guests": as_int(row.get("max_guests"), 2),
            "nightly_price_mxn": as_float(row.get("nightly_price_mxn"), 0),
            "monthly_price_mxn": as_float(row.get("monthly_price_mxn"), 0),
            "cleaning_fee_mxn": as_float(row.get("cleaning_fee_mxn"), 0),
            "deposit_mxn": as_float(row.get("deposit_mxn"), 0),
            "commission_rate": as_float(row.get("commission_rate"), 0.2),
            "platforms": as_list(row.get("platforms")),
            "amenities": as_list(row.get("amenities")),
            "notes": as_text(row.get("notes")) or None,
        }
        images = build_media_assets_from_urls(
            as_list(first_value(row, "image_urls", "image_url", "imagenes", "imagen", "images")),
            title,
        )
        if images:
            payload["images"] = images
        if existing:
            payload["updated_at"] = now_utc()
            await db.rental_properties.update_one({"id": existing["id"], "tenant_id": tenant_id}, {"$set": payload})
            return {"action": "updated", "id": existing["id"]}
        rental_property = RentalProperty(tenant_id=tenant_id, created_by=user_id, **payload)
        await db.rental_properties.insert_one(rental_property.model_dump())
        return {"action": "created", "id": rental_property.id}

    property_id = await resolve_property_id(db, tenant_id, row)
    if not property_id:
        raise ValueError("Propiedad no encontrada")

    if import_type == "bookings":
        check_in = parse_datetime_value(row.get("check_in"))
        check_out = parse_datetime_value(row.get("check_out"))
        if not check_in or not check_out:
            raise ValueError("Fechas inválidas")
        guest = RentalGuest(
            tenant_id=tenant_id,
            created_by=user_id,
            name=as_text(row.get("guest_name")),
            email=as_text(row.get("guest_email")) or None,
            phone=as_text(row.get("guest_phone")) or None,
        )
        await db.rental_guests.insert_one(guest.model_dump())
        total = as_float(row.get("total_amount_mxn"), 0)
        paid = as_float(row.get("paid_amount_mxn"), 0)
        booking = RentalBooking(
            tenant_id=tenant_id,
            created_by=user_id,
            property_id=property_id,
            guest_id=guest.id,
            guest_name=guest.name,
            guest_email=guest.email,
            guest_phone=guest.phone,
            source=as_text(row.get("source"), "import"),
            check_in=check_in,
            check_out=check_out,
            guests_count=as_int(row.get("guests_count"), 1),
            status=as_text(row.get("status"), "reserved"),
            total_amount_mxn=total,
            paid_amount_mxn=paid,
            cleaning_fee_mxn=as_float(row.get("cleaning_fee_mxn"), 0),
            deposit_mxn=as_float(row.get("deposit_mxn"), 0),
            platform_fee_mxn=as_float(row.get("platform_fee_mxn"), 0),
            notes=as_text(row.get("notes")) or None,
            nights=calc_nights(check_in, check_out),
            balance_due_mxn=calc_balance(total, paid),
        )
        await db.rental_bookings.insert_one(booking.model_dump())
        return {"action": "created", "id": booking.id}

    if import_type == "calendar":
        start_date = parse_datetime_value(row.get("start_date"))
        end_date = parse_datetime_value(row.get("end_date"))
        if not start_date or not end_date:
            raise ValueError("Fechas inválidas")
        event_id = str(uuid.uuid4())
        await db.rental_calendar_events.insert_one({
            "id": event_id,
            "tenant_id": tenant_id,
            "property_id": property_id,
            "event_type": as_text(row.get("event_type"), "blocked"),
            "start_date": start_date,
            "end_date": end_date,
            "status": as_text(row.get("status"), "active"),
            "source": as_text(row.get("source"), "import"),
            "notes": as_text(row.get("notes")) or None,
            "created_by": user_id,
            "created_at": now_utc(),
            "updated_at": now_utc(),
        })
        return {"action": "created", "id": event_id}

    if import_type == "tasks":
        task = RentalTask(
            tenant_id=tenant_id,
            created_by=user_id,
            property_id=property_id,
            booking_id=as_text(row.get("booking_reference")) or None,
            task_type=as_text(row.get("task_type"), "cleaning"),
            title=as_text(row.get("title")),
            due_at=parse_datetime_value(row.get("due_at")),
            assigned_to=as_text(row.get("assigned_to")) or None,
            status=as_text(row.get("status"), "todo"),
            notes=as_text(row.get("notes")) or None,
        )
        await db.rental_tasks.insert_one(task.model_dump())
        return {"action": "created", "id": task.id}

    if import_type == "financials":
        expense = RentalExpense(
            tenant_id=tenant_id,
            created_by=user_id,
            property_id=property_id,
            booking_id=as_text(row.get("booking_reference")) or None,
            category=as_text(row.get("category"), "maintenance"),
            amount_mxn=as_float(row.get("amount_mxn"), 0),
            description=as_text(row.get("description")),
            expense_date=parse_datetime_value(row.get("expense_date")) or now_utc(),
            vendor=as_text(row.get("vendor")) or None,
        )
        await db.rental_expenses.insert_one(expense.model_dump())
        return {"action": "created", "id": expense.id}

    raise ValueError("Tipo de importación no soportado")


def create_rentals_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/rentals", tags=["rentals"])

    @router.get("/dashboard")
    async def get_rentals_dashboard(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        today = now_utc()
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        properties = await db.rental_properties.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
        active_properties = [item for item in properties if item.get("status") == RentalPropertyStatus.ACTIVE.value]

        bookings = await db.rental_bookings.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
        month_bookings = [
            item for item in bookings
            if to_aware_utc(item.get("check_in")) and to_aware_utc(item.get("check_in")) >= month_start
        ]
        confirmed_bookings = [
            item for item in month_bookings
            if item.get("status") in {
                BookingStatus.RESERVED.value,
                BookingStatus.CONFIRMED.value,
                BookingStatus.CHECKED_IN.value,
                BookingStatus.CHECKED_OUT.value,
            }
        ]

        expenses = await db.rental_expenses.find({
            "tenant_id": tenant_id,
            "expense_date": {"$gte": month_start},
        }, {"_id": 0}).to_list(None)

        monthly_revenue = sum(float(item.get("total_amount_mxn") or 0) for item in confirmed_bookings)
        monthly_paid = sum(float(item.get("paid_amount_mxn") or 0) for item in confirmed_bookings)
        monthly_expenses = sum(float(item.get("amount_mxn") or 0) for item in expenses)
        occupied_nights = sum(int(item.get("nights") or 0) for item in confirmed_bookings)
        available_nights = max(len(active_properties) * 30, 1)

        upcoming_check_ins = [
            item for item in bookings
            if to_aware_utc(item.get("check_in")) and to_aware_utc(item.get("check_in")) >= today
            and item.get("status") in {BookingStatus.RESERVED.value, BookingStatus.CONFIRMED.value}
        ]
        upcoming_check_outs = [
            item for item in bookings
            if to_aware_utc(item.get("check_out")) and to_aware_utc(item.get("check_out")) >= today
            and item.get("status") == BookingStatus.CHECKED_IN.value
        ]

        tasks = await db.rental_tasks.find({
            "tenant_id": tenant_id,
            "status": {"$in": ["todo", "in_progress"]},
        }, {"_id": 0}).sort("due_at", 1).limit(10).to_list(10)

        return {
            "summary": {
                "properties_total": len(properties),
                "properties_active": len(active_properties),
                "bookings_month": len(confirmed_bookings),
                "monthly_revenue_mxn": round(monthly_revenue, 2),
                "monthly_paid_mxn": round(monthly_paid, 2),
                "monthly_expenses_mxn": round(monthly_expenses, 2),
                "monthly_net_mxn": round(monthly_revenue - monthly_expenses, 2),
                "occupancy_rate": round((occupied_nights / available_nights) * 100, 1),
                "pending_tasks": len(tasks),
            },
            "upcoming_check_ins": await attach_booking_context(db, tenant_id, sorted(upcoming_check_ins, key=lambda item: to_aware_utc(item.get("check_in")) or today)[:8]),
            "upcoming_check_outs": await attach_booking_context(db, tenant_id, sorted(upcoming_check_outs, key=lambda item: to_aware_utc(item.get("check_out")) or today)[:8]),
            "tasks": serialize_docs(tasks),
        }

    @router.get("/integrations")
    async def list_demo_integrations(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        channels = await ensure_demo_integrations(db, tenant_id, current_user["user_id"])
        return {
            "summary": integration_summary(channels),
            "channels": serialize_docs(channels),
        }

    @router.post("/integrations/{provider}/connect-demo")
    async def connect_demo_integration(provider: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        await ensure_demo_integrations(db, tenant_id, current_user["user_id"])
        integration = await get_integration_or_404(db, tenant_id, provider)
        properties_count = await db.rental_properties.count_documents({
            "tenant_id": tenant_id,
            "status": {"$ne": RentalPropertyStatus.ARCHIVED.value},
        })
        timestamp = now_utc()
        await db.rental_integrations.update_one(
            {"id": integration["id"], "tenant_id": tenant_id},
            {"$set": {
                "status": "connected",
                "health": "healthy",
                "webhook_status": "mock_listening",
                "connected_at": integration.get("connected_at") or timestamp,
                "last_sync_at": timestamp,
                "setup_checklist": [
                    {"label": "Credenciales demo", "done": True},
                    {"label": "Mapeo de propiedades", "done": properties_count > 0},
                    {"label": "Sincronización inicial", "done": False},
                ],
                "metrics.properties_mapped": properties_count,
                "updated_at": timestamp,
            }},
        )
        return {"message": f"{integration['name']} conectado en modo demo", "provider": provider}

    @router.post("/integrations/{provider}/disconnect-demo")
    async def disconnect_demo_integration(provider: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        await ensure_demo_integrations(db, tenant_id, current_user["user_id"])
        integration = await get_integration_or_404(db, tenant_id, provider)
        await db.rental_integrations.update_one(
            {"id": integration["id"], "tenant_id": tenant_id},
            {"$set": {
                "status": "demo_available",
                "health": "not_connected",
                "webhook_status": "mock_ready",
                "setup_checklist": [
                    {"label": "Credenciales demo", "done": False},
                    {"label": "Mapeo de propiedades", "done": False},
                    {"label": "Sincronización inicial", "done": False},
                ],
                "updated_at": now_utc(),
            }},
        )
        return {"message": f"{integration['name']} desconectado del demo", "provider": provider}

    @router.post("/integrations/{provider}/sync-demo")
    async def sync_demo_integration(provider: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        user_id = current_user["user_id"]
        channels = await ensure_demo_integrations(db, tenant_id, user_id)
        integration = await get_integration_or_404(db, tenant_id, provider)
        provider_order = [item["provider"] for item in DEMO_CHANNEL_INTEGRATIONS]
        provider_index = provider_order.index(provider) if provider in provider_order else 0

        rental_property = await db.rental_properties.find_one({
            "tenant_id": tenant_id,
            "status": {"$ne": RentalPropertyStatus.ARCHIVED.value},
        }, {"_id": 0})
        if not rental_property:
            property_model = RentalProperty(
                tenant_id=tenant_id,
                created_by=user_id,
                title="Loft Canal Demo",
                address="Calle demo 24",
                zone="Aldea Zama",
                rental_type="short_term",
                bedrooms=1,
                bathrooms=1,
                max_guests=2,
                nightly_price_mxn=2400,
                monthly_price_mxn=36000,
                cleaning_fee_mxn=550,
                platforms=[integration["name"]],
                amenities=["wifi", "self_check_in", "parking"],
                notes="Propiedad creada por sincronización demo de canales.",
            )
            await db.rental_properties.insert_one(property_model.model_dump())
            rental_property = property_model.model_dump()

        created = {"bookings": 0, "calendar_events": 0, "tasks": 0, "payouts": 0}
        start = now_utc() + timedelta(days=provider_index + 5)
        end = start + timedelta(days=3)
        ota_providers = {"airbnb", "booking", "vrbo", "expedia"}

        if provider in ota_providers:
            nightly_price = float(rental_property.get("nightly_price_mxn") or 2200)
            total = nightly_price * 3 + float(rental_property.get("cleaning_fee_mxn") or 0)
            booking = RentalBooking(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                guest_name=f"Huésped demo {integration['name']}",
                guest_email=f"demo.{provider}@example.com",
                source=integration["name"],
                check_in=start,
                check_out=end,
                guests_count=min(int(rental_property.get("max_guests") or 2), 4),
                status=BookingStatus.CONFIRMED,
                total_amount_mxn=round(total, 2),
                paid_amount_mxn=round(total * 0.9, 2),
                cleaning_fee_mxn=float(rental_property.get("cleaning_fee_mxn") or 0),
                platform_fee_mxn=round(total * 0.08, 2),
                notes=f"Reserva mock importada desde {integration['name']}.",
                nights=3,
                balance_due_mxn=round(total * 0.1, 2),
            )
            await db.rental_bookings.insert_one(booking.model_dump())
            created["bookings"] = 1
            created["payouts"] = 1

            task = RentalTask(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                booking_id=booking.id,
                task_type="cleaning",
                title=f"Limpieza checkout {integration['name']}",
                due_at=end.replace(hour=11, minute=0, second=0, microsecond=0),
                priority="high",
                schedule_type="event_based",
                linked_event_type="after_check_out",
                notes=f"Tarea demo creada por sincronización de {integration['name']}.",
            )
            await db.rental_tasks.insert_one(task.model_dump())
            created["tasks"] = 1
        else:
            calendar_event = RentalCalendarEvent(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                title=f"Bloqueo demo {integration['name']}",
                event_type="blocked",
                start_date=start,
                end_date=end,
                status="blocked",
                source=integration["name"],
                notes=f"Bloqueo mock sincronizado desde {integration['name']}.",
            )
            await db.rental_calendar_events.insert_one(calendar_event.model_dump())
            created["calendar_events"] = 1

            task = RentalTask(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                task_type="inspection",
                title=f"Validar disponibilidad {integration['name']}",
                due_at=start - timedelta(hours=4),
                priority="medium",
                schedule_type="event_based",
                linked_event_type="calendar_sync",
                notes=f"Tarea demo para revisar bloqueo de {integration['name']}.",
            )
            await db.rental_tasks.insert_one(task.model_dump())
            created["tasks"] = 1

        timestamp = now_utc()
        await db.rental_integrations.update_one(
            {"id": integration["id"], "tenant_id": tenant_id},
            {
                "$set": {
                    "status": "connected",
                    "health": "healthy",
                    "webhook_status": "mock_listening",
                    "connected_at": integration.get("connected_at") or timestamp,
                    "last_sync_at": timestamp,
                    "setup_checklist": [
                        {"label": "Credenciales demo", "done": True},
                        {"label": "Mapeo de propiedades", "done": True},
                        {"label": "Sincronización inicial", "done": True},
                    ],
                    "updated_at": timestamp,
                },
                "$inc": {
                    "metrics.bookings_imported": created["bookings"],
                    "metrics.calendar_blocks": created["calendar_events"],
                    "metrics.payouts_reconciled": created["payouts"],
                },
            },
        )
        updated_channels = await ensure_demo_integrations(db, tenant_id, user_id)
        return {
            "message": f"Sincronización demo de {integration['name']} completada",
            "provider": provider,
            "created": created,
            "summary": integration_summary(updated_channels),
        }

    @router.get("/pipelines")
    async def list_rental_pipelines(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        await ensure_default_booking_pipeline(db, tenant_id, current_user["user_id"])
        pipelines = await db.rental_pipelines.find(
            {"tenant_id": tenant_id, "status": {"$ne": "archived"}},
            {"_id": 0},
        ).sort([("is_default", -1), ("created_at", 1)]).to_list(100)
        pipeline_ids = [pipeline["id"] for pipeline in pipelines]
        stages = await db.rental_pipeline_stages.find(
            {"tenant_id": tenant_id, "pipeline_id": {"$in": pipeline_ids}},
            {"_id": 0},
        ).sort("sort_order", 1).to_list(300)
        stages_by_pipeline: dict[str, list[dict]] = {}
        for stage in stages:
            stages_by_pipeline.setdefault(stage["pipeline_id"], []).append(serialize_doc(stage))

        return [
            {
                **serialize_doc(pipeline),
                "stages": stages_by_pipeline.get(pipeline["id"], []),
                "stages_count": len(stages_by_pipeline.get(pipeline["id"], [])),
            }
            for pipeline in pipelines
        ]

    @router.post("/pipelines")
    async def create_rental_pipeline(
        pipeline_data: RentalPipelineCreate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        if pipeline_data.is_default:
            await db.rental_pipelines.update_many(
                {"tenant_id": tenant_id, "entity_type": pipeline_data.entity_type},
                {"$set": {"is_default": False, "updated_at": now_utc()}},
            )
        pipeline = RentalPipeline(
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
            **pipeline_data.model_dump(),
        )
        await db.rental_pipelines.insert_one(pipeline.model_dump())
        return {"message": "Pipeline creado", "id": pipeline.id}

    @router.get("/pipelines/{pipeline_id}/board")
    async def get_rental_pipeline_board(pipeline_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        return await build_pipeline_board(db, tenant_id, pipeline_id)

    @router.put("/pipelines/{pipeline_id}")
    async def update_rental_pipeline(
        pipeline_id: str,
        pipeline_data: RentalPipelineUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        existing = await get_pipeline_or_404(db, tenant_id, pipeline_id)
        update = pipeline_data.model_dump(exclude_unset=True)
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        if update.get("is_default"):
            await db.rental_pipelines.update_many(
                {"tenant_id": tenant_id, "entity_type": update.get("entity_type") or existing.get("entity_type", "booking")},
                {"$set": {"is_default": False, "updated_at": now_utc()}},
            )
        update["updated_at"] = now_utc()
        await db.rental_pipelines.update_one({"id": pipeline_id, "tenant_id": tenant_id}, {"$set": update})
        return {"message": "Pipeline actualizado"}

    @router.delete("/pipelines/{pipeline_id}")
    async def archive_rental_pipeline(pipeline_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        pipeline = await get_pipeline_or_404(db, tenant_id, pipeline_id)
        if pipeline.get("is_default"):
            raise HTTPException(status_code=400, detail="No se puede archivar el pipeline default")
        await db.rental_pipelines.update_one(
            {"id": pipeline_id, "tenant_id": tenant_id},
            {"$set": {"status": "archived", "updated_at": now_utc()}},
        )
        await db.rental_bookings.update_many(
            {"tenant_id": tenant_id, "pipeline_id": pipeline_id},
            {"$set": {"pipeline_id": None, "stage_id": None, "updated_at": now_utc()}},
        )
        await db.rental_properties.update_many(
            {"tenant_id": tenant_id, "pipeline_id": pipeline_id},
            {"$set": {"pipeline_id": None, "stage_id": None, "updated_at": now_utc()}},
        )
        return {"message": "Pipeline archivado"}

    @router.post("/pipelines/{pipeline_id}/stages")
    async def create_rental_pipeline_stage(
        pipeline_id: str,
        stage_data: RentalPipelineStageCreate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        await get_pipeline_or_404(db, tenant_id, pipeline_id)
        payload = stage_data.model_dump()
        if payload.get("sort_order") is None:
            last_stage = await db.rental_pipeline_stages.find_one(
                {"tenant_id": tenant_id, "pipeline_id": pipeline_id},
                {"_id": 0, "sort_order": 1},
                sort=[("sort_order", -1)],
            )
            payload["sort_order"] = int((last_stage or {}).get("sort_order") or 0) + 10
        stage = RentalPipelineStage(
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
            pipeline_id=pipeline_id,
            **payload,
        )
        await db.rental_pipeline_stages.insert_one(stage.model_dump())
        return {"message": "Stage creado", "id": stage.id}

    @router.put("/pipeline-stages/{stage_id}")
    async def update_rental_pipeline_stage(
        stage_id: str,
        stage_data: RentalPipelineStageUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        await get_stage_or_404(db, tenant_id, stage_id)
        update = stage_data.model_dump(exclude_unset=True)
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        update["updated_at"] = now_utc()
        await db.rental_pipeline_stages.update_one({"id": stage_id, "tenant_id": tenant_id}, {"$set": update})
        return {"message": "Stage actualizado"}

    @router.delete("/pipeline-stages/{stage_id}")
    async def delete_rental_pipeline_stage(stage_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        stage = await get_stage_or_404(db, tenant_id, stage_id)
        stages_count = await db.rental_pipeline_stages.count_documents({
            "tenant_id": tenant_id,
            "pipeline_id": stage["pipeline_id"],
        })
        if stages_count <= 1:
            raise HTTPException(status_code=400, detail="El pipeline debe conservar al menos un stage")
        await db.rental_pipeline_stages.delete_one({"id": stage_id, "tenant_id": tenant_id})
        await db.rental_bookings.update_many(
            {"tenant_id": tenant_id, "stage_id": stage_id},
            {"$set": {"stage_id": None, "updated_at": now_utc()}},
        )
        await db.rental_properties.update_many(
            {"tenant_id": tenant_id, "stage_id": stage_id},
            {"$set": {"stage_id": None, "updated_at": now_utc()}},
        )
        return {"message": "Stage eliminado"}

    @router.get("/properties")
    async def list_rental_properties(
        status: Optional[RentalPropertyStatus] = None,
        rental_type: Optional[str] = None,
        search: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        query: dict = {"tenant_id": tenant_id}
        if status:
            query["status"] = status.value
        if rental_type:
            query["rental_type"] = rental_type
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"address": {"$regex": search, "$options": "i"}},
                {"zone": {"$regex": search, "$options": "i"}},
            ]

        properties = await db.rental_properties.find(query, {"_id": 0}).sort("updated_at", -1).to_list(300)
        return serialize_docs(properties)

    @router.post("/properties")
    async def create_rental_property(
        property_data: RentalPropertyCreate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        rental_property = RentalProperty(
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
            **property_data.model_dump(),
        )
        await db.rental_properties.insert_one(rental_property.model_dump())
        return {"message": "Propiedad de renta creada", "id": rental_property.id}

    @router.get("/properties/{property_id}")
    async def get_rental_property(property_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        rental_property = await get_property_or_404(db, tenant_id, property_id)
        return serialize_doc(rental_property)

    @router.get("/properties/{property_id}/detail")
    async def get_rental_property_detail(property_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        rental_property = await get_property_or_404(db, tenant_id, property_id)
        bookings = await db.rental_bookings.find({"tenant_id": tenant_id, "property_id": property_id}, {"_id": 0}).sort("check_in", -1).to_list(200)
        tasks = await db.rental_tasks.find({"tenant_id": tenant_id, "property_id": property_id}, {"_id": 0}).sort("due_at", 1).to_list(200)
        expenses = await db.rental_expenses.find({"tenant_id": tenant_id, "property_id": property_id}, {"_id": 0}).sort("expense_date", -1).to_list(200)
        external_sales = await db.rental_external_sales.find({"tenant_id": tenant_id, "property_id": property_id}, {"_id": 0}).sort("sale_date", -1).to_list(200)

        active_bookings = [item for item in bookings if item.get("status") != BookingStatus.CANCELLED.value]
        revenue = sum(float(item.get("total_amount_mxn") or 0) for item in active_bookings)
        paid = sum(float(item.get("paid_amount_mxn") or 0) for item in active_bookings)
        external = sum(float(item.get("amount_mxn") or 0) for item in external_sales if payment_is_collected(item.get("status")))
        expense_total = sum(float(item.get("amount_mxn") or 0) for item in expenses)
        nights = sum(int(item.get("nights") or 0) for item in active_bookings)

        return {
            "property": serialize_doc(rental_property),
            "stats": {
                "bookings_count": len(active_bookings),
                "nights_booked": nights,
                "revenue_mxn": round(revenue, 2),
                "paid_mxn": round(paid, 2),
                "external_sales_mxn": round(external, 2),
                "expenses_mxn": round(expense_total, 2),
                "net_mxn": round(revenue + external - expense_total, 2),
                "balance_due_mxn": round(revenue - paid, 2),
                "pending_tasks": len([item for item in tasks if item.get("status") in {"todo", "in_progress"}]),
                "average_nightly_mxn": round(revenue / nights, 2) if nights else 0,
            },
            "bookings": await attach_booking_context(db, tenant_id, bookings[:20]),
            "tasks": await attach_staff_context(db, tenant_id, tasks[:20]),
            "expenses": await attach_staff_context(db, tenant_id, expenses[:20]),
            "external_sales": await attach_staff_context(db, tenant_id, external_sales[:20]),
        }

    @router.post("/properties/{property_id}/ai-analysis")
    async def analyze_rental_property(property_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        detail = await get_rental_property_detail(property_id, current_user)
        rental_property = detail["property"]
        stats = detail["stats"]
        amenities = set(rental_property.get("amenities") or [])
        missing_amenities = [
            amenity for amenity in ["wifi", "pool", "parking", "workspace", "self_check_in", "laundry"]
            if amenity not in {str(item).lower() for item in amenities}
        ]
        base_rate = float(rental_property.get("nightly_price_mxn") or 0)
        margin = (stats["net_mxn"] / stats["revenue_mxn"] * 100) if stats["revenue_mxn"] else 0
        suggested_rate = base_rate
        if stats["bookings_count"] >= 3 and margin > 55:
            suggested_rate = round(base_rate * 1.08, 0)
        elif stats["bookings_count"] <= 1 and base_rate:
            suggested_rate = round(base_rate * 0.95, 0)

        recommendations = []
        if missing_amenities:
            recommendations.append(f"Agregar o destacar amenidades: {', '.join(missing_amenities[:4])}.")
        if stats["pending_tasks"] > 2:
            recommendations.append("Reducir tareas pendientes antes de abrir más noches para evitar reseñas bajas.")
        if margin < 35 and stats["revenue_mxn"]:
            recommendations.append("Revisar gastos recurrentes: el margen operativo está debajo de 35%.")
        if suggested_rate and suggested_rate != base_rate:
            recommendations.append(f"Probar tarifa sugerida de {round(suggested_rate)} MXN por noche en próximas semanas.")
        if not recommendations:
            recommendations.append("La propiedad se ve estable; prioriza reseñas, velocidad de respuesta y calendario sin huecos.")

        return {
            "score": max(35, min(95, round(65 + margin / 3 + min(stats["bookings_count"], 8) * 2 - stats["pending_tasks"] * 3))),
            "summary": f"{rental_property.get('title')} tiene {stats['bookings_count']} reservas, margen estimado de {round(margin, 1)}% y neto de {round(stats['net_mxn'], 2)} MXN.",
            "suggested_nightly_price_mxn": suggested_rate,
            "missing_amenities": missing_amenities,
            "recommendations": recommendations,
            "risk_flags": [
                flag for flag, enabled in {
                    "Saldo por cobrar alto": stats["balance_due_mxn"] > stats["paid_mxn"],
                    "Gasto alto vs ingresos": stats["expenses_mxn"] > stats["revenue_mxn"] * 0.45 if stats["revenue_mxn"] else False,
                    "Pocas imágenes": len(rental_property.get("images") or []) < 3,
                }.items() if enabled
            ],
        }

    @router.put("/properties/{property_id}")
    async def update_rental_property(
        property_id: str,
        property_data: RentalPropertyUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        update = {key: value for key, value in property_data.model_dump().items() if value is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        update["updated_at"] = now_utc()
        result = await db.rental_properties.update_one(
            {"id": property_id, "tenant_id": tenant_id},
            {"$set": update},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Propiedad de renta no encontrada")
        return {"message": "Propiedad de renta actualizada"}

    @router.delete("/properties/{property_id}")
    async def archive_rental_property(property_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_properties.update_one(
            {"id": property_id, "tenant_id": tenant_id},
            {"$set": {"status": RentalPropertyStatus.ARCHIVED.value, "updated_at": now_utc()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Propiedad de renta no encontrada")
        return {"message": "Propiedad archivada"}

    @router.get("/bookings")
    async def list_bookings(
        property_id: Optional[str] = None,
        status: Optional[BookingStatus] = None,
        date_from: Optional[datetime] = Query(None),
        date_to: Optional[datetime] = Query(None),
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        query: dict = {"tenant_id": tenant_id}
        if property_id:
            query["property_id"] = property_id
        if status:
            query["status"] = status.value
        if date_from or date_to:
            query["check_in"] = {}
            if date_from:
                query["check_in"]["$gte"] = date_from
            if date_to:
                query["check_in"]["$lte"] = date_to

        bookings = await db.rental_bookings.find(query, {"_id": 0}).sort("check_in", 1).to_list(500)
        return await attach_booking_context(db, tenant_id, bookings)

    @router.post("/bookings")
    async def create_booking(booking_data: RentalBookingCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        await get_property_or_404(db, tenant_id, booking_data.property_id)

        guest_id = booking_data.guest_id
        if not guest_id:
            guest = RentalGuest(
                tenant_id=tenant_id,
                created_by=current_user["user_id"],
                name=booking_data.guest_name,
                email=booking_data.guest_email,
                phone=booking_data.guest_phone,
            )
            await db.rental_guests.insert_one(guest.model_dump())
            guest_id = guest.id

        payload = booking_data.model_dump()
        payload["guest_id"] = guest_id
        nights = calc_nights(payload["check_in"], payload["check_out"])
        booking = RentalBooking(
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
            nights=nights,
            balance_due_mxn=calc_balance(payload["total_amount_mxn"], payload["paid_amount_mxn"]),
            **payload,
        )
        await db.rental_bookings.insert_one(booking.model_dump())
        return {"message": "Reserva creada", "id": booking.id}

    @router.put("/bookings/{booking_id}")
    async def update_booking(
        booking_id: str,
        booking_data: RentalBookingUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        existing = await db.rental_bookings.find_one({"id": booking_id, "tenant_id": tenant_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        update = {key: value for key, value in booking_data.model_dump().items() if value is not None}
        if "property_id" in update:
            await get_property_or_404(db, tenant_id, update["property_id"])
        check_in = update.get("check_in") or existing["check_in"]
        check_out = update.get("check_out") or existing["check_out"]
        total = update.get("total_amount_mxn", existing.get("total_amount_mxn", 0))
        paid = update.get("paid_amount_mxn", existing.get("paid_amount_mxn", 0))
        update["nights"] = calc_nights(check_in, check_out)
        update["balance_due_mxn"] = calc_balance(total, paid)
        update["updated_at"] = now_utc()
        await db.rental_bookings.update_one({"id": booking_id, "tenant_id": tenant_id}, {"$set": update})
        return {"message": "Reserva actualizada"}

    @router.get("/bookings/{booking_id}")
    async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        booking = await db.rental_bookings.find_one({"id": booking_id, "tenant_id": tenant_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        enriched = await attach_booking_context(db, tenant_id, [booking])
        return enriched[0]

    @router.post("/bookings/{booking_id}/check-in")
    async def check_in_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_bookings.update_one(
            {"id": booking_id, "tenant_id": tenant_id},
            {"$set": {"status": BookingStatus.CHECKED_IN.value, "updated_at": now_utc()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        return {"message": "Check-in registrado"}

    @router.post("/bookings/{booking_id}/check-out")
    async def check_out_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_bookings.update_one(
            {"id": booking_id, "tenant_id": tenant_id},
            {"$set": {"status": BookingStatus.CHECKED_OUT.value, "updated_at": now_utc()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        return {"message": "Check-out registrado"}

    @router.post("/bookings/{booking_id}/cancel")
    async def cancel_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_bookings.update_one(
            {"id": booking_id, "tenant_id": tenant_id},
            {"$set": {"status": BookingStatus.CANCELLED.value, "updated_at": now_utc()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        return {"message": "Reserva cancelada"}

    @router.delete("/bookings/{booking_id}")
    async def delete_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_bookings.delete_one({"id": booking_id, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        await db.rental_tasks.update_many(
            {"tenant_id": tenant_id, "booking_id": booking_id},
            {"$set": {"booking_id": None, "updated_at": now_utc()}},
        )
        await db.rental_expenses.update_many(
            {"tenant_id": tenant_id, "booking_id": booking_id},
            {"$set": {"booking_id": None}},
        )
        return {"message": "Reserva eliminada"}

    @router.get("/calendar/events")
    async def get_rental_calendar_events(
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        properties = await db.rental_properties.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(500)
        property_lookup = {item["id"]: item for item in properties}

        events: list[dict] = []

        bookings = await db.rental_bookings.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(500)
        for booking in bookings:
            if booking.get("status") == BookingStatus.CANCELLED.value:
                continue
            rental_property = property_lookup.get(booking.get("property_id"), {})
            property_title = rental_property.get("title") or "Propiedad"
            guest_name = booking.get("guest_name") or "Huésped"
            for date_key, label, event_type in (
                ("check_in", "Check-in", "reserva"),
                ("check_out", "Check-out", "checkout"),
            ):
                if not matches_date_range(booking.get(date_key), start_date, end_date):
                    continue
                events.append({
                    "id": f"{booking['id']}-{date_key}",
                    "source_id": booking["id"],
                    "source_module": "rental_booking",
                    "title": f"{label}: {guest_name}",
                    "description": f"{property_title} · {booking.get('source') or 'directo'}",
                    "event_type": event_type,
                    "start_time": iso_datetime(booking.get(date_key)),
                    "end_time": iso_datetime(booking.get(date_key)),
                    "completed": booking.get("status") in {BookingStatus.CHECKED_OUT.value, BookingStatus.CANCELLED.value},
                    "property": {"id": rental_property.get("id"), "title": property_title},
                    "booking": booking,
                    "read_only": True,
                })

        calendar_items = await db.rental_calendar_events.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(500)
        for item in calendar_items:
            if not matches_date_range(item.get("start_date"), start_date, end_date):
                continue
            rental_property = property_lookup.get(item.get("property_id"), {})
            property_title = rental_property.get("title") or "Propiedad"
            event_type = normalize_calendar_event_type(item.get("event_type"))
            events.append({
                "id": item["id"],
                "source_id": item["id"],
                "source_module": "rental_calendar",
                "title": calendar_event_title(item, property_title, event_type),
                "description": item.get("notes") or item.get("source") or "",
                "event_type": event_type,
                "start_time": iso_datetime(item.get("start_date")),
                "end_time": iso_datetime(item.get("end_date")),
                "completed": item.get("status") in {"done", "completed"},
                "property": {"id": rental_property.get("id"), "title": property_title},
                "calendar_event": item,
                "read_only": False,
            })

        tasks = await db.rental_tasks.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(500)
        for task in tasks:
            if not matches_date_range(task.get("due_at"), start_date, end_date):
                continue
            rental_property = property_lookup.get(task.get("property_id"), {})
            task_type = task.get("task_type") or "task"
            events.append({
                "id": task["id"],
                "source_id": task["id"],
                "source_module": "rental_task",
                "title": task.get("title") or "Tarea operativa",
                "description": f"{rental_property.get('title') or 'Propiedad'} · {task_type}",
                "event_type": "limpieza" if task_type == "cleaning" else "mantenimiento" if task_type == "maintenance" else "tarea",
                "start_time": iso_datetime(task.get("due_at")),
                "end_time": iso_datetime(task.get("due_at")),
                "completed": task.get("status") == RentalTaskStatus.DONE.value,
                "property": {"id": rental_property.get("id"), "title": rental_property.get("title")},
                "read_only": True,
            })

        return sorted(events, key=lambda item: item.get("start_time") or "")

    @router.post("/calendar/events")
    async def create_rental_calendar_event(
        event_data: RentalCalendarEventCreate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        await get_property_or_404(db, tenant_id, event_data.property_id)
        if event_data.end_date < event_data.start_date:
            raise HTTPException(status_code=400, detail="La fecha de fin debe ser posterior al inicio")

        event = RentalCalendarEvent(
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
            **event_data.model_dump(),
        )
        await db.rental_calendar_events.insert_one(event.model_dump())
        return {"message": "Evento creado", "id": event.id}

    @router.put("/calendar/events/{event_id}")
    async def update_rental_calendar_event(
        event_id: str,
        event_data: RentalCalendarEventUpdate,
        current_user: dict = Depends(get_current_user),
    ):
        tenant_id = resolve_tenant_id(current_user)
        existing = await db.rental_calendar_events.find_one({"id": event_id, "tenant_id": tenant_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Evento no encontrado")

        update = {key: value for key, value in event_data.model_dump().items() if value is not None}
        if "property_id" in update:
            await get_property_or_404(db, tenant_id, update["property_id"])
        start_date = update.get("start_date") or existing["start_date"]
        end_date = update.get("end_date") or existing["end_date"]
        if end_date < start_date:
            raise HTTPException(status_code=400, detail="La fecha de fin debe ser posterior al inicio")

        update["updated_at"] = now_utc()
        await db.rental_calendar_events.update_one({"id": event_id, "tenant_id": tenant_id}, {"$set": update})
        return {"message": "Evento actualizado"}

    @router.delete("/calendar/events/{event_id}")
    async def delete_rental_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_calendar_events.delete_one({"id": event_id, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        return {"message": "Evento eliminado"}

    @router.get("/calendar")
    async def get_rental_calendar(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        bookings = await db.rental_bookings.find({"tenant_id": tenant_id}, {"_id": 0}).sort("check_in", 1).to_list(500)
        return await attach_booking_context(db, tenant_id, bookings)

    @router.get("/owners")
    async def list_owners(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        owners = await db.rental_owners.find({"tenant_id": tenant_id}, {"_id": 0}).sort("name", 1).to_list(300)
        return serialize_docs(owners)

    @router.post("/owners")
    async def create_owner(owner_data: RentalOwnerCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        owner = RentalOwner(tenant_id=tenant_id, created_by=current_user["user_id"], **owner_data.model_dump())
        await db.rental_owners.insert_one(owner.model_dump())
        return {"message": "Propietario creado", "id": owner.id}

    @router.get("/guests")
    async def list_guests(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        guests = await db.rental_guests.find({"tenant_id": tenant_id}, {"_id": 0}).sort("updated_at", -1).to_list(500)
        return serialize_docs(guests)

    @router.post("/guests")
    async def create_guest(guest_data: RentalGuestCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        guest = RentalGuest(tenant_id=tenant_id, created_by=current_user["user_id"], **guest_data.model_dump())
        await db.rental_guests.insert_one(guest.model_dump())
        return {"message": "Huésped/Inquilino creado", "id": guest.id}

    @router.get("/staff")
    async def list_staff(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        staff = await db.rental_staff.find({"tenant_id": tenant_id}, {"_id": 0}).sort("name", 1).to_list(300)
        return serialize_docs(staff)

    @router.post("/staff")
    async def create_staff(staff_data: RentalStaffCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        staff = RentalStaff(tenant_id=tenant_id, created_by=current_user["user_id"], **staff_data.model_dump())
        await db.rental_staff.insert_one(staff.model_dump())
        return {"message": "Staff creado", "id": staff.id}

    @router.put("/staff/{staff_id}")
    async def update_staff(staff_id: str, staff_data: RentalStaffUpdate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        update = {key: value for key, value in staff_data.model_dump().items() if value is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        update["updated_at"] = now_utc()
        result = await db.rental_staff.update_one({"id": staff_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Staff no encontrado")
        return {"message": "Staff actualizado"}

    @router.delete("/staff/{staff_id}")
    async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_staff.update_one(
            {"id": staff_id, "tenant_id": tenant_id},
            {"$set": {"status": "inactive", "updated_at": now_utc()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Staff no encontrado")
        await db.rental_tasks.update_many(
            {"tenant_id": tenant_id, "assigned_staff_id": staff_id},
            {"$set": {"assigned_staff_id": None, "updated_at": now_utc()}},
        )
        return {"message": "Staff desactivado"}

    @router.get("/tasks")
    async def list_tasks(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        tasks = await db.rental_tasks.find({"tenant_id": tenant_id}, {"_id": 0}).sort("due_at", 1).to_list(500)
        return await attach_staff_context(db, tenant_id, tasks)

    @router.post("/tasks")
    async def create_task(task_data: RentalTaskCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        await get_property_or_404(db, tenant_id, task_data.property_id)
        if task_data.assigned_staff_id:
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": task_data.assigned_staff_id}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Responsable no encontrado")
        task = RentalTask(tenant_id=tenant_id, created_by=current_user["user_id"], **task_data.model_dump())
        await db.rental_tasks.insert_one(task.model_dump())
        return {"message": "Tarea creada", "id": task.id}

    @router.put("/tasks/{task_id}")
    async def update_task(task_id: str, task_data: RentalTaskUpdate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        update = {key: value for key, value in task_data.model_dump().items() if value is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        if "property_id" in update:
            await get_property_or_404(db, tenant_id, update["property_id"])
        if update.get("assigned_staff_id"):
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": update["assigned_staff_id"]}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Responsable no encontrado")
        update["updated_at"] = now_utc()
        result = await db.rental_tasks.update_one({"id": task_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tarea no encontrada")
        return {"message": "Tarea actualizada"}

    @router.delete("/tasks/{task_id}")
    async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_tasks.delete_one({"id": task_id, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tarea no encontrada")
        return {"message": "Tarea eliminada"}

    @router.get("/financials")
    async def get_financials(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        bookings = await db.rental_bookings.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
        expenses = await db.rental_expenses.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(None)
        external_sales = await db.rental_external_sales.find({"tenant_id": tenant_id}, {"_id": 0}).sort("sale_date", -1).to_list(None)
        closures = await db.rental_cash_closures.find({"tenant_id": tenant_id}, {"_id": 0}).sort("closure_date", -1).to_list(60)
        properties = await db.rental_properties.find({"tenant_id": tenant_id}, {"_id": 0, "id": 1, "title": 1}).to_list(None)
        property_lookup = {item["id"]: item for item in properties}
        today = now_utc()
        revenue = sum(float(item.get("total_amount_mxn") or 0) for item in bookings if item.get("status") != BookingStatus.CANCELLED.value)
        paid = sum(float(item.get("paid_amount_mxn") or 0) for item in bookings if item.get("status") != BookingStatus.CANCELLED.value)
        external_total = sum(float(item.get("amount_mxn") or 0) for item in external_sales if payment_is_collected(item.get("status")))
        expense_total = sum(float(item.get("amount_mxn") or 0) for item in expenses if item.get("status") != "cancelled")
        month_bookings = [item for item in bookings if same_local_month(item.get("check_in") or item.get("created_at"), today) and item.get("status") != BookingStatus.CANCELLED.value]
        month_expenses = [item for item in expenses if same_local_month(item.get("expense_date") or item.get("created_at"), today) and item.get("status") != "cancelled"]
        month_sales = [item for item in external_sales if same_local_month(item.get("sale_date") or item.get("created_at"), today) and payment_is_collected(item.get("status"))]

        category_totals: dict[str, float] = {}
        for expense in month_expenses:
            category = expense.get("category") or "otros"
            category_totals[category] = round(category_totals.get(category, 0) + float(expense.get("amount_mxn") or 0), 2)

        property_profitability = []
        for rental_property in properties:
            property_id = rental_property["id"]
            prop_revenue = sum(float(item.get("total_amount_mxn") or 0) for item in bookings if item.get("property_id") == property_id and item.get("status") != BookingStatus.CANCELLED.value)
            prop_external = sum(float(item.get("amount_mxn") or 0) for item in external_sales if item.get("property_id") == property_id and payment_is_collected(item.get("status")))
            prop_expenses = sum(float(item.get("amount_mxn") or 0) for item in expenses if item.get("property_id") == property_id and item.get("status") != "cancelled")
            property_profitability.append({
                "property_id": property_id,
                "property_title": rental_property.get("title"),
                "revenue_mxn": round(prop_revenue + prop_external, 2),
                "expenses_mxn": round(prop_expenses, 2),
                "net_mxn": round(prop_revenue + prop_external - prop_expenses, 2),
            })

        def enrich_property(item: dict) -> dict:
            rental_property = property_lookup.get(item.get("property_id"))
            return {**serialize_doc(item), "property": serialize_doc(rental_property)}

        return {
            "revenue_mxn": round(revenue + external_total, 2),
            "booking_revenue_mxn": round(revenue, 2),
            "external_sales_mxn": round(external_total, 2),
            "paid_mxn": round(paid, 2),
            "balance_due_mxn": round(revenue - paid, 2),
            "expenses_mxn": round(expense_total, 2),
            "net_mxn": round(revenue + external_total - expense_total, 2),
            "month": {
                "revenue_mxn": round(sum(float(item.get("total_amount_mxn") or 0) for item in month_bookings) + sum(float(item.get("amount_mxn") or 0) for item in month_sales), 2),
                "booking_revenue_mxn": round(sum(float(item.get("total_amount_mxn") or 0) for item in month_bookings), 2),
                "external_sales_mxn": round(sum(float(item.get("amount_mxn") or 0) for item in month_sales), 2),
                "expenses_mxn": round(sum(float(item.get("amount_mxn") or 0) for item in month_expenses), 2),
                "net_mxn": round(sum(float(item.get("total_amount_mxn") or 0) for item in month_bookings) + sum(float(item.get("amount_mxn") or 0) for item in month_sales) - sum(float(item.get("amount_mxn") or 0) for item in month_expenses), 2),
                "ticket_average_mxn": round((sum(float(item.get("total_amount_mxn") or 0) for item in month_bookings) / len(month_bookings)), 2) if month_bookings else 0,
                "sales_count": len(month_bookings) + len(month_sales),
                "expense_categories": category_totals,
                "property_profitability": sorted(property_profitability, key=lambda item: item["net_mxn"], reverse=True),
            },
            "expenses": await attach_staff_context(db, tenant_id, [enrich_property(item) for item in expenses]),
            "external_sales": await attach_staff_context(db, tenant_id, [enrich_property(item) for item in external_sales]),
            "cash_closures": await attach_staff_context(db, tenant_id, closures),
        }

    @router.get("/expenses")
    async def list_expenses(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        expenses = await db.rental_expenses.find({"tenant_id": tenant_id}, {"_id": 0}).sort("expense_date", -1).to_list(500)
        return await attach_staff_context(db, tenant_id, expenses)

    @router.post("/expenses")
    async def create_expense(expense_data: RentalExpenseCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        await get_property_or_404(db, tenant_id, expense_data.property_id)
        if expense_data.staff_id:
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": expense_data.staff_id}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Staff no encontrado")
        expense = RentalExpense(tenant_id=tenant_id, created_by=current_user["user_id"], **expense_data.model_dump())
        await db.rental_expenses.insert_one(expense.model_dump())
        return {"message": "Gasto registrado", "id": expense.id}

    @router.put("/expenses/{expense_id}")
    async def update_expense(expense_id: str, expense_data: RentalExpenseUpdate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        update = {key: value for key, value in expense_data.model_dump().items() if value is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        if "property_id" in update:
            await get_property_or_404(db, tenant_id, update["property_id"])
        if update.get("staff_id"):
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": update["staff_id"]}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Staff no encontrado")
        update["updated_at"] = now_utc()
        result = await db.rental_expenses.update_one({"id": expense_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
        return {"message": "Gasto actualizado"}

    @router.delete("/expenses/{expense_id}")
    async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_expenses.delete_one({"id": expense_id, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
        return {"message": "Gasto eliminado"}

    @router.get("/external-sales")
    async def list_external_sales(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        sales = await db.rental_external_sales.find({"tenant_id": tenant_id}, {"_id": 0}).sort("sale_date", -1).to_list(500)
        return await attach_staff_context(db, tenant_id, sales)

    @router.post("/external-sales")
    async def create_external_sale(sale_data: RentalExternalSaleCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        if sale_data.property_id:
            await get_property_or_404(db, tenant_id, sale_data.property_id)
        if sale_data.staff_id:
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": sale_data.staff_id}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Staff no encontrado")
        sale = RentalExternalSale(tenant_id=tenant_id, created_by=current_user["user_id"], **sale_data.model_dump())
        await db.rental_external_sales.insert_one(sale.model_dump())
        return {"message": "Ingreso externo registrado", "id": sale.id}

    @router.put("/external-sales/{sale_id}")
    async def update_external_sale(sale_id: str, sale_data: RentalExternalSaleUpdate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        update = {key: value for key, value in sale_data.model_dump().items() if value is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        if update.get("property_id"):
            await get_property_or_404(db, tenant_id, update["property_id"])
        if update.get("staff_id"):
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": update["staff_id"]}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Staff no encontrado")
        update["updated_at"] = now_utc()
        result = await db.rental_external_sales.update_one({"id": sale_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Ingreso externo no encontrado")
        return {"message": "Ingreso externo actualizado"}

    @router.delete("/external-sales/{sale_id}")
    async def delete_external_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_external_sales.delete_one({"id": sale_id, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ingreso externo no encontrado")
        return {"message": "Ingreso externo eliminado"}

    @router.get("/cash-closures")
    async def list_cash_closures(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        closures = await db.rental_cash_closures.find({"tenant_id": tenant_id}, {"_id": 0}).sort("closure_date", -1).to_list(200)
        return await attach_staff_context(db, tenant_id, closures)

    @router.post("/cash-closures")
    async def create_cash_closure(closure_data: RentalCashClosureCreate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        if closure_data.responsible_staff_id:
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": closure_data.responsible_staff_id}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Responsable no encontrado")
        snapshot = await build_cash_closure_snapshot(db, tenant_id, closure_data.closure_date)
        closure = RentalCashClosure(
            tenant_id=tenant_id,
            created_by=current_user["user_id"],
            bookings_collected_mxn=snapshot["bookings_collected_mxn"],
            external_sales_mxn=snapshot["external_sales_mxn"],
            expenses_paid_mxn=snapshot["expenses_paid_mxn"],
            expenses_pending_mxn=snapshot["expenses_pending_mxn"],
            balance_due_mxn=snapshot["balance_due_mxn"],
            net_mxn=snapshot["net_mxn"],
            snapshot=snapshot,
            **closure_data.model_dump(),
        )
        await db.rental_cash_closures.insert_one(closure.model_dump())
        return {"message": "Cierre de caja creado", "id": closure.id}

    @router.put("/cash-closures/{closure_id}")
    async def update_cash_closure(closure_id: str, closure_data: RentalCashClosureUpdate, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        update = {key: value for key, value in closure_data.model_dump().items() if value is not None}
        if not update:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        if update.get("responsible_staff_id"):
            staff = await db.rental_staff.find_one({"tenant_id": tenant_id, "id": update["responsible_staff_id"]}, {"_id": 0})
            if not staff:
                raise HTTPException(status_code=404, detail="Responsable no encontrado")
        update["updated_at"] = now_utc()
        result = await db.rental_cash_closures.update_one({"id": closure_id, "tenant_id": tenant_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Cierre no encontrado")
        return {"message": "Cierre actualizado"}

    @router.delete("/cash-closures/{closure_id}")
    async def delete_cash_closure(closure_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        result = await db.rental_cash_closures.delete_one({"id": closure_id, "tenant_id": tenant_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Cierre no encontrado")
        return {"message": "Cierre eliminado"}

    @router.post("/seed-demo")
    async def seed_rentals_demo(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        user_id = current_user["user_id"]
        rental_property = await db.rental_properties.find_one({"tenant_id": tenant_id}, {"_id": 0})
        if not rental_property:
            rental_property_model = RentalProperty(
                tenant_id=tenant_id,
                created_by=user_id,
                title="Casa Demo Rentals",
                address="Av. Kukulkan 123",
                zone="La Veleta",
                rental_type="short_term",
                bedrooms=2,
                bathrooms=2,
                max_guests=4,
                nightly_price_mxn=2800,
                monthly_price_mxn=42000,
                cleaning_fee_mxn=650,
                amenities=["wifi", "pool", "parking"],
                platforms=["Airbnb", "Directo"],
            )
            await db.rental_properties.insert_one(rental_property_model.model_dump())
            rental_property = rental_property_model.model_dump()

        demo_staff = [
            ("Ana López", "Supervisora de limpieza", ["Limpieza checkout", "Inventario de blancos"], ["cleaning"]),
            ("Luis Hernández", "Mantenimiento", ["Reparaciones", "Aire acondicionado", "Alberca"], ["maintenance"]),
            ("Carla Méndez", "Administración y pagos", ["Servicios", "Cierre de caja", "Pagos"], ["finance"]),
            ("Diego Ruiz", "Guest Experience", ["Check-in", "Kit bienvenida", "Atención huésped"], ["guest_experience"]),
        ]
        staff_lookup = {}
        for name, role, responsibilities, specialties in demo_staff:
            existing = await db.rental_staff.find_one({"tenant_id": tenant_id, "name": name}, {"_id": 0})
            if existing:
                staff_lookup[name] = existing
                continue
            staff = RentalStaff(
                tenant_id=tenant_id,
                created_by=user_id,
                name=name,
                role=role,
                responsibilities=responsibilities,
                specialties=specialties,
                notes="Demo operativo Rentals",
            )
            await db.rental_staff.insert_one(staff.model_dump())
            staff_lookup[name] = staff.model_dump()

        demo_tasks = [
            ("Limpieza checkout", "cleaning", "event_based", "after_check_out", "Ana López", 1),
            ("Pagar luz mensual", "utilities", "recurring", "monthly", "Carla Méndez", 5),
            ("Reparación aire acondicionado", "maintenance", "one_time", None, "Luis Hernández", 2),
            ("Preparar kit de bienvenida", "check_in", "event_based", "before_check_in", "Diego Ruiz", 1),
            ("Limpieza de alberca semanal", "maintenance", "recurring", "weekly", "Luis Hernández", 7),
        ]
        created_tasks = 0
        for title, task_type, schedule_type, recurrence_rule, staff_name, days in demo_tasks:
            existing = await db.rental_tasks.find_one({"tenant_id": tenant_id, "title": title, "property_id": rental_property["id"]}, {"_id": 0})
            if existing:
                continue
            task = RentalTask(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                assigned_staff_id=staff_lookup.get(staff_name, {}).get("id"),
                assigned_to=staff_name,
                task_type=task_type,
                title=title,
                due_at=now_utc() + timedelta(days=days),
                priority="high" if days <= 2 else "medium",
                schedule_type=schedule_type,
                recurrence_rule=recurrence_rule,
                linked_event_type=recurrence_rule if schedule_type == "event_based" else None,
                next_due_at=now_utc() + timedelta(days=days),
                notes="Tarea demo ligada a staff y propiedad",
            )
            await db.rental_tasks.insert_one(task.model_dump())
            created_tasks += 1

        demo_expenses = [
            ("utilities", 1850, "Pago de luz mensual", "CFE", "Carla Méndez"),
            ("cleaning", 650, "Limpieza checkout demo", "Ana López", "Ana López"),
            ("maintenance", 2200, "Reparación aire acondicionado", "Técnico AC", "Luis Hernández"),
        ]
        created_expenses = 0
        for category, amount, description, vendor, staff_name in demo_expenses:
            existing = await db.rental_expenses.find_one({"tenant_id": tenant_id, "description": description, "property_id": rental_property["id"]}, {"_id": 0})
            if existing:
                continue
            expense = RentalExpense(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                staff_id=staff_lookup.get(staff_name, {}).get("id"),
                category=category,
                amount_mxn=amount,
                description=description,
                vendor=vendor,
                status="paid",
                payment_method="transfer",
                notes="Gasto demo Rentals",
            )
            await db.rental_expenses.insert_one(expense.model_dump())
            created_expenses += 1

        demo_sales = [
            ("Late check-out", 900, "Diego Ruiz"),
            ("Limpieza extra", 750, "Ana López"),
            ("Tour vendido al huésped", 1400, "Diego Ruiz"),
        ]
        created_sales = 0
        for concept, amount, staff_name in demo_sales:
            existing = await db.rental_external_sales.find_one({"tenant_id": tenant_id, "concept": concept, "property_id": rental_property["id"]}, {"_id": 0})
            if existing:
                continue
            sale = RentalExternalSale(
                tenant_id=tenant_id,
                created_by=user_id,
                property_id=rental_property["id"],
                staff_id=staff_lookup.get(staff_name, {}).get("id"),
                guest_name="Huésped demo",
                concept=concept,
                amount_mxn=amount,
                payment_method="transfer",
                status="collected",
                source="demo",
                notes="Ingreso externo demo",
            )
            await db.rental_external_sales.insert_one(sale.model_dump())
            created_sales += 1

        return {
            "message": "Demo Rentals listo",
            "property_id": rental_property["id"],
            "staff_total": len(staff_lookup),
            "tasks_created": created_tasks,
            "expenses_created": created_expenses,
            "external_sales_created": created_sales,
        }

    @router.get("/import/templates")
    async def get_import_templates():
        return {
            key: {
                "fields": fields,
                "required": IMPORT_REQUIRED_FIELDS.get(key, []),
                "csv_header": ",".join(fields),
                "download_url": f"/api/rentals/import/templates/{key}.csv",
            }
            for key, fields in IMPORT_TEMPLATES.items()
        }

    @router.get("/import/templates/{import_type}.csv")
    async def download_import_template(import_type: str):
        if import_type not in IMPORT_TEMPLATES:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=IMPORT_TEMPLATES[import_type])
        writer.writeheader()
        writer.writerow(IMPORT_SAMPLE_ROWS.get(import_type, {}))
        output.seek(0)

        filename = f"rovi_rentas_{import_type}_template.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    @router.post("/import/upload")
    async def upload_import_file(
        import_type: str = Query(...),
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
    ):
        if import_type not in IMPORT_TEMPLATES:
            raise HTTPException(status_code=400, detail="Tipo de importación inválido")
        filename = file.filename or "import.csv"
        if not filename.lower().endswith((".csv", ".xlsx", ".xls")):
            raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV o XLSX")

        tenant_id = resolve_tenant_id(current_user)
        content = await file.read()
        try:
            rows = parse_upload_rows(filename, content)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {exc}") from exc
        if not rows:
            raise HTTPException(status_code=400, detail="El archivo no contiene filas para importar")

        preview = await build_import_preview(db, tenant_id, import_type, rows)
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "tenant_id": tenant_id,
            "import_type": import_type,
            "filename": filename,
            "status": "preview",
            "total_rows": preview["total_rows"],
            "valid_rows": preview["valid_rows"],
            "error_rows": preview["error_rows"],
            "columns": preview["columns"],
            "preview_rows": preview["preview_rows"],
            "rows": rows[:500],
            "created_by": current_user["user_id"],
            "created_at": now_utc(),
            "completed_at": None,
            "result": None,
        }
        await db.rental_import_jobs.insert_one(job)
        return serialize_doc(job)

    @router.post("/import/execute/{job_id}")
    async def execute_import_job(job_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        job = await db.rental_import_jobs.find_one({"id": job_id, "tenant_id": tenant_id}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Import job no encontrado")
        if job.get("status") == "completed":
            return serialize_doc(job)

        created = 0
        updated = 0
        failed = 0
        errors = []
        import_type = job["import_type"]

        for index, row in enumerate(job.get("rows", []), start=1):
            row_errors = validate_import_row(import_type, row)
            if import_type in {"bookings", "calendar", "tasks", "financials"} and not await resolve_property_id(db, tenant_id, row):
                row_errors.append("No se encontró la propiedad por property_id/property_title")
            if row_errors:
                failed += 1
                errors.append({"row_number": index, "errors": row_errors})
                continue
            try:
                result = await execute_import_row(db, tenant_id, current_user, import_type, row)
                if result.get("action") == "updated":
                    updated += 1
                else:
                    created += 1
            except Exception as exc:
                failed += 1
                errors.append({"row_number": index, "errors": [str(exc)]})

        result_payload = {
            "created": created,
            "updated": updated,
            "failed": failed,
            "errors": errors[:100],
        }
        await db.rental_import_jobs.update_one(
            {"id": job_id, "tenant_id": tenant_id},
            {"$set": {
                "status": "completed" if failed == 0 else "completed_with_errors",
                "completed_at": now_utc(),
                "result": result_payload,
            }},
        )
        updated_job = await db.rental_import_jobs.find_one({"id": job_id, "tenant_id": tenant_id}, {"_id": 0})
        return serialize_doc(updated_job)

    @router.get("/import/jobs")
    async def list_import_jobs(current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        jobs = await db.rental_import_jobs.find(
            {"tenant_id": tenant_id},
            {"_id": 0, "rows": 0},
        ).sort("created_at", -1).limit(25).to_list(25)
        return serialize_docs(jobs)

    @router.get("/import/jobs/{job_id}")
    async def get_import_job(job_id: str, current_user: dict = Depends(get_current_user)):
        tenant_id = resolve_tenant_id(current_user)
        job = await db.rental_import_jobs.find_one(
            {"id": job_id, "tenant_id": tenant_id},
            {"_id": 0, "rows": 0},
        )
        if not job:
            raise HTTPException(status_code=404, detail="Import job no encontrado")
        return serialize_doc(job)

    return router

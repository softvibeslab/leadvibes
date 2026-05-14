from __future__ import annotations

from datetime import datetime, timezone, timedelta
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional
import csv
import io
import re
import shutil
import unicodedata
import uuid
import zipfile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from models import ColumnMapping, ImportJob, ImportStatus


COPIM_MEMBER_IMPORT_FIELDS: Dict[str, Dict[str, Any]] = {
    "external_member_id": {"label": "ID socio CIIB", "required": False, "type": "string"},
    "full_name": {"label": "Nombre completo", "required": True, "type": "string"},
    "email": {"label": "Email", "required": False, "type": "email"},
    "phone": {"label": "Telefono / WhatsApp", "required": False, "type": "phone"},
    "city": {"label": "Ciudad", "required": False, "type": "string"},
    "company_name": {"label": "Nombre comercial", "required": False, "type": "string"},
    "company_legal_name": {"label": "Razon social", "required": False, "type": "string"},
    "company_address": {"label": "Direccion comercial", "required": False, "type": "string"},
    "tax_regime": {"label": "Regimen fiscal", "required": False, "type": "string"},
    "business_start_date": {"label": "Inicio de operaciones", "required": False, "type": "date"},
    "birth_date": {"label": "Fecha de nacimiento", "required": False, "type": "date"},
    "join_date": {"label": "Fecha de ingreso", "required": False, "type": "date"},
    "specialty": {"label": "Giro / Especialidad", "required": False, "type": "string"},
    "title": {"label": "Rol profesional", "required": False, "type": "string"},
    "team_type": {"label": "Independiente o equipo", "required": False, "type": "string"},
    "team_size": {"label": "Tamano de equipo", "required": False, "type": "number"},
    "license_status": {"label": "Cuenta con licencia", "required": False, "type": "string"},
    "license_number": {"label": "Numero de licencia", "required": False, "type": "string"},
    "website": {"label": "Sitio web", "required": False, "type": "string"},
    "facebook_url": {"label": "Facebook", "required": False, "type": "string"},
    "instagram_url": {"label": "Instagram", "required": False, "type": "string"},
    "linkedin_url": {"label": "LinkedIn", "required": False, "type": "string"},
    "company_logo_source": {"label": "Logo empresarial", "required": False, "type": "media"},
    "avatar_source": {"label": "Foto personal", "required": False, "type": "media"},
    "membership_plan": {"label": "Tipo de membresia", "required": False, "type": "string"},
    "membership_price": {"label": "Precio membresia", "required": False, "type": "number"},
    "affiliation_source": {"label": "Como conocio CIIB", "required": False, "type": "string"},
    "affiliation_motives": {"label": "Motivos de afiliacion", "required": False, "type": "list"},
    "mentor_interest": {"label": "Interes en mentor/ponente", "required": False, "type": "string"},
    "profession": {"label": "Profesion", "required": False, "type": "string"},
    "participation_frequency": {"label": "Frecuencia de participacion", "required": False, "type": "string"},
    "professional_values": {"label": "Valores profesionales", "required": False, "type": "text"},
    "sector_challenge_opinion": {"label": "Reto del sector", "required": False, "type": "text"},
    "two_year_goal": {"label": "Meta 2 anos", "required": False, "type": "text"},
    "ciib_expectation": {"label": "Expectativa del CIIB", "required": False, "type": "text"},
    "notes": {"label": "Notas", "required": False, "type": "text"},
}


COPIM_MEMBER_FIELD_ALIASES: Dict[str, List[str]] = {
    "external_member_id": ["id", "id socio", "id ciib", "codigo", "codigo socio"],
    "full_name": ["nombre completo", "nombre", "socio", "contacto"],
    "email": ["email", "correo", "correo electronico principal", "correo electronico", "e-mail", "mail"],
    "phone": ["telefono", "telefono movil whatsapp", "telefono movil / whatsapp", "teléfono", "whatsapp", "celular"],
    "city": ["ciudad", "ciudad y estado de residencia", "estado", "residencia"],
    "company_name": ["nombre comercial de la empresa", "empresa", "nombre comercial", "empresa razon social"],
    "company_legal_name": ["empresa razon social", "razon social", "empresa / razon social"],
    "company_address": ["direccion comercial oficina", "direccion comercial / oficina", "direccion", "oficina"],
    "tax_regime": ["regimen fiscal", "regimen"],
    "business_start_date": ["fecha de inicio de operaciones", "fecha de creacion", "inicio operaciones"],
    "birth_date": ["fecha de nacimiento"],
    "join_date": ["fecha de ingreso al ciib", "fecha ingreso", "fecha de ingreso"],
    "specialty": ["giro de la empresa", "giro", "especialidad", "como te defines dentro del ecosistema inmobiliario"],
    "title": ["profesion", "cual es tu profesion", "rol", "puesto"],
    "team_type": ["trabajas de manera independiente o cuentas con equipo", "independiente o equipo"],
    "team_size": ["cuantas personas conforman tu equipo", "tamano de equipo", "equipo"],
    "license_status": ["cuentas con licencia de asesor inmobiliario", "licencia"],
    "license_number": ["num de licencia", "numero de licencia", "num. de licencia"],
    "website": ["sitio web", "website", "web"],
    "facebook_url": ["facebook", "redes sociales de la empresa facebook"],
    "instagram_url": ["instagram"],
    "linkedin_url": ["linkedin", "linkedIn"],
    "company_logo_source": ["sube tu logo empresarial con la mayor definicion posible", "logo empresarial", "logo"],
    "avatar_source": ["sube una foto tuya para poderte identificar con la mayor definicion posible", "foto tuya", "foto personal", "avatar"],
    "membership_plan": ["tipo de membresia", "tipo de membresía", "tipo de menbresia"],
    "affiliation_source": ["como conociste al ciib", "como conociste del ciib"],
    "affiliation_motives": ["areas o motivo principal para afiliarte", "motivo principal para afiliarte"],
    "mentor_interest": ["te interesaria participar como ponente o mentor", "ponente", "mentor"],
    "profession": ["tienes alguna profesion", "cual es tu profesion"],
    "participation_frequency": ["con que frecuencia te gustaria participar en actividades del ciib", "frecuencia"],
    "professional_values": ["describe brevemente quien eres como profesional", "valores que rigen tu forma de hacer negocios"],
    "sector_challenge_opinion": ["mayor reto que enfrenta actualmente el sector inmobiliario", "innovacion y desarrollo profesional"],
    "two_year_goal": ["donde te gustaria estar profesionalmente en los proximos 2 anos"],
    "ciib_expectation": ["que esperas que el ciib aporte a tu crecimiento"],
    "notes": ["notas", "observaciones", "comentarios"],
}


MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
DATA_EXTENSIONS = {".csv", ".xlsx", ".xls"}
ZIP_EXTENSIONS = {".zip"}
PROFILE_METADATA_FIELDS = {
    "external_member_id",
    "company_legal_name",
    "company_address",
    "tax_regime",
    "business_start_date",
    "birth_date",
    "team_type",
    "team_size",
    "license_status",
    "license_number",
    "website",
    "facebook_url",
    "instagram_url",
    "linkedin_url",
    "company_logo_source",
    "avatar_source",
    "affiliation_source",
    "affiliation_motives",
    "mentor_interest",
    "profession",
    "participation_frequency",
    "professional_values",
    "sector_challenge_opinion",
    "two_year_goal",
    "ciib_expectation",
}


class CopimMemberImportPreviewRequest(BaseModel):
    job_id: str
    mapping: List[ColumnMapping]
    skip_duplicates: bool = True
    duplicate_field: str = "email"
    create_memberships: bool = True
    merge_strategy: str = "smart_merge"
    default_member_status: str = "source"


class CopimMemberImportExecuteRequest(CopimMemberImportPreviewRequest):
    confirmed_duplicate_actions: Dict[str, str] = Field(default_factory=dict)


def serialize_doc(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    serialized = {key: value for key, value in doc.items() if key != "_id"}
    for key, value in list(serialized.items()):
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
    return serialized


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc: Optional[dict]) -> Optional[dict]:
    if doc is None:
        return None
    result = {key: value for key, value in doc.items() if key != "_id"}
    for key, value in list(result.items()):
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result


def normalize_text(value: Any) -> str:
    value = str(value or "").strip().lower()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def normalize_filename(value: Any) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    filename = Path(raw.split("?", 1)[0]).name
    filename = filename.replace("%20", " ").replace("%2B", "+")
    stem = Path(filename).stem
    suffix = Path(filename).suffix.lower()
    return f"{normalize_text(stem)}{suffix}"


def normalize_header_name(value: Any) -> str:
    return normalize_text(value)


def normalize_email(value: Any) -> str:
    return str(value or "").strip().lower()


def normalize_phone(value: Any) -> str:
    digits = re.sub(r"\D+", "", str(value or ""))
    if len(digits) > 10 and digits.startswith("52"):
        digits = digits[-10:]
    if len(digits) == 10:
        return f"+52{digits}"
    return f"+{digits}" if digits else ""


def parse_number(value: Any) -> float:
    if value in (None, ""):
        return 0
    if isinstance(value, (int, float)):
        return float(value)
    clean = str(value).replace("$", "").replace(",", "").strip()
    try:
        return float(clean)
    except ValueError:
        return 0


def parse_list_value(value: Any) -> List[str]:
    if value in (None, ""):
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value)
    separators = "|" if "|" in text else ","
    return [item.strip() for item in text.split(separators) if item.strip()]


def parse_date_value(value: Any) -> Optional[str]:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat() if value.tzinfo else value.replace(tzinfo=timezone.utc).isoformat()
    if isinstance(value, (int, float)) or re.fullmatch(r"\d+(\.0+)?", str(value).strip()):
        try:
            serial = float(value)
            if serial > 20000:
                return (datetime(1899, 12, 30, tzinfo=timezone.utc) + timedelta(days=serial)).isoformat()
        except Exception:
            pass
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(text[:10], fmt).replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            continue
    return None


def normalize_membership_plan(value: Any) -> tuple[str, str]:
    text = normalize_text(value)
    if "mensual" in text or "monthly" in text:
        return "CIIB Mensual", "monthly"
    if "anual" in text or "annual" in text or "year" in text:
        return "CIIB Anual", "annual"
    return "CIIB Pendiente", "annual"


def sanitize_filename(filename: str) -> str:
    stem = normalize_text(Path(filename).stem).replace(" ", "-") or "archivo"
    suffix = Path(filename).suffix.lower()
    return f"{stem}{suffix}"


def build_mapping_suggestions(headers: List[str]) -> Dict[str, str]:
    header_map = {normalize_header_name(header): header for header in headers}
    suggestions: Dict[str, str] = {}
    for field, aliases in COPIM_MEMBER_FIELD_ALIASES.items():
        for alias in aliases:
            normalized_alias = normalize_header_name(alias)
            if normalized_alias in header_map:
                suggestions[field] = header_map[normalized_alias]
                break
    return suggestions


def resolve_mapped_value(row: Dict[str, Any], source_column: str, target_field: str) -> Any:
    raw_value = row.get(source_column, "")
    if raw_value not in ("", None):
        return raw_value

    normalized_candidates = {
        normalize_header_name(candidate)
        for candidate in [source_column, *COPIM_MEMBER_FIELD_ALIASES.get(target_field, [])]
        if candidate
    }
    for header, value in row.items():
        if header.startswith("__") or value in ("", None):
            continue
        if normalize_header_name(header) in normalized_candidates:
            return value
    return raw_value


def parse_tabular_file(content: bytes, filename: str) -> dict:
    filename_lower = filename.lower()
    if filename_lower.endswith(".csv"):
        for encoding in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
            try:
                text = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise HTTPException(status_code=400, detail=f"No se pudo decodificar {filename}")
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames or []
        rows = []
        for index, row in enumerate(reader, start=2):
            row["__source_file"] = filename
            row["__source_row"] = index
            rows.append(row)
        return {"headers": headers, "rows": rows, "file_type": "csv", "sample_data": rows[:5]}

    import openpyxl

    workbook = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    sheet = workbook.active
    headers: List[str] = []
    rows: List[dict] = []
    for index, row in enumerate(sheet.iter_rows(values_only=True), start=1):
        if index == 1:
            headers = [str(cell).strip() if cell not in (None, "") else f"Column_{column + 1}" for column, cell in enumerate(row)]
            continue
        if not any(cell not in (None, "") for cell in row):
            continue
        row_doc = {headers[column]: row[column] for column in range(min(len(headers), len(row)))}
        row_doc["__source_file"] = filename
        row_doc["__source_sheet"] = sheet.title
        row_doc["__source_row"] = index
        rows.append(row_doc)
    workbook.close()
    return {"headers": headers, "rows": rows, "file_type": "xlsx", "sample_data": rows[:5]}


def transform_member_row(row: Dict[str, Any], mapping: Dict[str, str]) -> tuple[Dict[str, Any], List[str]]:
    transformed: Dict[str, Any] = {}
    errors: List[str] = []

    for source_column, target_field in mapping.items():
        raw_value = resolve_mapped_value(row, source_column, target_field)
        field_config = COPIM_MEMBER_IMPORT_FIELDS.get(target_field, {})
        field_type = field_config.get("type", "string")
        value: Any = raw_value if raw_value is not None else ""
        if isinstance(value, str):
            value = value.strip()

        if value in ("", None):
            transformed[target_field] = [] if field_type == "list" else None
            continue

        if field_type == "email":
            value = normalize_email(value)
            if "@" not in value:
                errors.append(f"Email invalido: {value}")
        elif field_type == "phone":
            value = normalize_phone(value)
        elif field_type == "number":
            value = parse_number(value)
        elif field_type == "date":
            value = parse_date_value(value)
        elif field_type == "list":
            value = parse_list_value(value)
        else:
            value = str(value).strip()

        transformed[target_field] = value

    if not transformed.get("full_name"):
        errors.append("Nombre completo es requerido")
    if not transformed.get("email") and not transformed.get("phone"):
        errors.append("Email o telefono es requerido para deduplicacion")

    return transformed, errors


def build_profile_metadata(transformed: Dict[str, Any], row: Dict[str, Any]) -> Dict[str, Any]:
    metadata = {
        key: transformed.get(key)
        for key in PROFILE_METADATA_FIELDS
        if transformed.get(key) not in (None, "", [], {})
    }
    metadata["import_source"] = {
        "file": row.get("__source_file"),
        "sheet": row.get("__source_sheet"),
        "row": row.get("__source_row"),
    }
    return metadata


def find_media_match(source_value: Any, media_manifest: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not source_value:
        return None
    normalized = normalize_filename(source_value)
    if not normalized:
        return None

    for item in media_manifest:
        if item.get("normalized_filename") == normalized:
            return {**item, "match_type": "exact"}

    source_stem = normalize_text(Path(normalized).stem)
    best_item = None
    best_score = 0.0
    for item in media_manifest:
        item_stem = item.get("normalized_stem") or normalize_text(Path(item.get("filename", "")).stem)
        score = SequenceMatcher(None, source_stem, item_stem).ratio()
        if score > best_score:
            best_item = item
            best_score = score

    if best_item and best_score >= 0.86:
        return {**best_item, "match_type": "fuzzy", "score": round(best_score, 3)}
    return None


def build_existing_query(tenant_id: str, association_id: str, transformed_rows: List[Dict[str, Any]]) -> dict:
    emails = [row.get("email") for row in transformed_rows if row.get("email")]
    phones = [row.get("phone") for row in transformed_rows if row.get("phone")]
    external_ids = [row.get("external_member_id") for row in transformed_rows if row.get("external_member_id")]
    clauses = []
    if emails:
        clauses.append({"email": {"$in": emails}})
    if phones:
        clauses.append({"phone": {"$in": phones}})
    if external_ids:
        clauses.append({"profile_metadata.external_member_id": {"$in": external_ids}})
    if not clauses:
        return {"tenant_id": tenant_id, "association_id": association_id, "id": "__none__"}
    return {"tenant_id": tenant_id, "association_id": association_id, "$or": clauses}


def index_existing_members(existing_members: List[Dict[str, Any]]) -> dict:
    index = {"email": {}, "phone": {}, "external": {}}
    for member in existing_members:
        if member.get("email"):
            index["email"][normalize_email(member["email"])] = member
        if member.get("phone"):
            index["phone"][normalize_phone(member["phone"])] = member
        external_id = (member.get("profile_metadata") or {}).get("external_member_id")
        if external_id:
            index["external"][str(external_id).strip()] = member
    return index


def resolve_existing_member(transformed: Dict[str, Any], existing_index: dict) -> Optional[dict]:
    external_id = transformed.get("external_member_id")
    if external_id and external_id in existing_index["external"]:
        return existing_index["external"][external_id]
    email = normalize_email(transformed.get("email"))
    if email and email in existing_index["email"]:
        return existing_index["email"][email]
    phone = normalize_phone(transformed.get("phone"))
    if phone and phone in existing_index["phone"]:
        return existing_index["phone"][phone]
    return None


def index_member_candidate(existing_index: dict, transformed: Dict[str, Any], member_doc: Dict[str, Any]) -> None:
    if transformed.get("email"):
        existing_index["email"][normalize_email(transformed["email"])] = member_doc
    if transformed.get("phone"):
        existing_index["phone"][normalize_phone(transformed["phone"])] = member_doc
    if transformed.get("external_member_id"):
        existing_index["external"][str(transformed["external_member_id"]).strip()] = member_doc


def resolve_member_status(default_status: str, source_file: str | None, transformed: Dict[str, Any]) -> str:
    if default_status in {"active", "pending", "suspended"}:
        return default_status
    source = normalize_text(source_file)
    if "base de datos" in source or transformed.get("external_member_id"):
        return "active"
    return "pending"


def build_member_payload(
    transformed: Dict[str, Any],
    row: Dict[str, Any],
    *,
    tenant_id: str,
    association_id: str,
    user_id: str,
    member_status: str,
    normalize_checklist: Callable[[Any], Dict[str, bool]],
    credential_builder: Callable[[], str],
) -> Dict[str, Any]:
    now = now_iso()
    checklist = normalize_checklist({
        "perfil_completo": bool(transformed.get("full_name") and transformed.get("email")),
        "correo_validado": bool(transformed.get("email")),
        "documentacion_recibida": member_status == "active",
        "membresia_asignada": bool(transformed.get("membership_plan")),
    })
    join_date = transformed.get("join_date")

    return {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_by_user_id": user_id,
        "full_name": transformed.get("full_name"),
        "email": normalize_email(transformed.get("email")),
        "phone": normalize_phone(transformed.get("phone")),
        "association_id": association_id,
        "title": transformed.get("title") or transformed.get("profession") or transformed.get("specialty"),
        "city": transformed.get("city"),
        "specialty": transformed.get("specialty"),
        "company_name": transformed.get("company_name"),
        "avatar_url": None,
        "bio": transformed.get("professional_values") or transformed.get("notes"),
        "certifications": [item for item in [transformed.get("license_number")] if item],
        "join_date": join_date or (now if member_status == "active" else None),
        "member_status": member_status,
        "review_state": "approved" if member_status == "active" else "submitted",
        "membership_tier": normalize_membership_plan(transformed.get("membership_plan"))[1],
        "credential_status": "issued" if member_status == "active" else "pending",
        "credential_id": credential_builder() if member_status == "active" else None,
        "directory_visible": True,
        "amount_due": 0,
        "validation_checklist": checklist,
        "validation_notes": "Importado desde fuente CIIB.",
        "requested_information": None,
        "linked_user_id": None,
        "portal_access_enabled": False,
        "notes": transformed.get("notes") or f"Importado desde {row.get('__source_file')}",
        "profile_metadata": build_profile_metadata(transformed, row),
        "created_at": now,
        "updated_at": now,
    }


def build_update_payload(existing: Dict[str, Any], transformed: Dict[str, Any], row: Dict[str, Any]) -> Dict[str, Any]:
    update: Dict[str, Any] = {"updated_at": now_iso()}
    field_map = {
        "full_name": "full_name",
        "email": "email",
        "phone": "phone",
        "title": "title",
        "city": "city",
        "specialty": "specialty",
        "company_name": "company_name",
        "join_date": "join_date",
        "notes": "notes",
    }
    for source, target in field_map.items():
        value = transformed.get(source)
        if value not in (None, "", [], {}):
            update[target] = normalize_phone(value) if source == "phone" else normalize_email(value) if source == "email" else value

    metadata = dict(existing.get("profile_metadata") or {})
    metadata.update(build_profile_metadata(transformed, row))
    update["profile_metadata"] = metadata
    if transformed.get("membership_plan"):
        update["membership_tier"] = normalize_membership_plan(transformed.get("membership_plan"))[1]
    return update


def copy_media_to_member(
    source_path: str,
    upload_dir: Path,
    *,
    tenant_id: str,
    member_id: str,
    kind: str,
) -> str:
    source = Path(source_path)
    suffix = source.suffix.lower()
    target_dir = upload_dir / "copim" / tenant_id / "members" / member_id
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{kind}{suffix}"
    target = target_dir / filename
    shutil.copy2(source, target)
    return f"/api/uploads/copim/{tenant_id}/members/{member_id}/{filename}"


async def maybe_create_membership(
    db: AsyncIOMotorDatabase,
    *,
    tenant_id: str,
    user_id: str,
    member_id: str,
    association_id: str,
    transformed: Dict[str, Any],
    member_name: str,
    sync_member_financials: Callable[[str, str], Awaitable[None]],
) -> bool:
    plan_name, billing_period = normalize_membership_plan(transformed.get("membership_plan"))
    if plan_name == "CIIB Pendiente":
        return False

    existing = await db.copim_memberships.find_one(
        {"tenant_id": tenant_id, "member_id": member_id, "association_id": association_id, "plan_name": plan_name},
        {"_id": 0, "id": 1},
    )
    if existing:
        return False

    join_date_raw = transformed.get("join_date")
    try:
        join_date = datetime.fromisoformat(str(join_date_raw).replace("Z", "+00:00")) if join_date_raw else datetime.now(timezone.utc)
    except ValueError:
        join_date = datetime.now(timezone.utc)

    renewal_date = join_date + (timedelta(days=365) if billing_period == "annual" else timedelta(days=30))
    price = parse_number(transformed.get("membership_price"))
    now = now_iso()
    membership_doc = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "created_by_user_id": user_id,
        "member_id": member_id,
        "association_id": association_id,
        "plan_name": plan_name,
        "plan_price": price,
        "billing_period": billing_period,
        "renewal_date": renewal_date.isoformat(),
        "payment_status": "active" if price <= 0 else "due",
        "balance_due": max(price, 0),
        "auto_renew": False,
        "reminder_enabled": True,
        "payment_method": None,
        "invoice_status": "not_requested",
        "paid_at": now if price <= 0 else None,
        "benefits_summary": f"Membresia {plan_name} importada para {member_name}.",
        "notes": "Creada automaticamente por importacion CIIB.",
        "last_reminder_at": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.copim_memberships.insert_one(membership_doc)
    await sync_member_financials(tenant_id, member_id)
    return True


def create_copim_member_import_router(
    db: AsyncIOMotorDatabase,
    *,
    require_copim_admin_workspace: Callable,
    resolve_scoped_copim_association_id: Callable[..., Awaitable[Optional[str]]],
    fetch_copim_association_or_404: Callable[[str, str], Awaitable[dict]],
    sync_copim_association_stats: Callable[[str, Optional[str]], Awaitable[None]],
    sync_copim_member_financials: Callable[[str, str], Awaitable[None]],
    normalize_copim_validation_checklist: Callable[[Any], Dict[str, bool]],
    build_copim_credential_id: Callable[[], str],
    upload_dir: Path,
    emit_import_realtime_events: Optional[Callable[..., Awaitable[None]]] = None,
) -> APIRouter:
    router = APIRouter(prefix="/copim/import/members", tags=["copim-member-import"])

    def resolve_upload_path(*parts: str) -> Path:
        path = upload_dir.joinpath(*parts)
        path.mkdir(parents=True, exist_ok=True)
        return path

    async def resolve_association(current_user: dict, requested_association_id: Optional[str]) -> str:
        association_id = await resolve_scoped_copim_association_id(
            current_user,
            requested_association_id,
            strict=current_user.get("role") == "copim_operator",
        )
        if not association_id:
            raise HTTPException(status_code=400, detail="Selecciona una asociacion destino para importar socios")
        await fetch_copim_association_or_404(current_user["tenant_id"], association_id)
        return association_id

    async def build_preview_payload(request: CopimMemberImportPreviewRequest, current_user: dict, limit: int = 25) -> dict:
        job = await db.import_jobs.find_one({"id": request.job_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Job de importacion no encontrado")
        data = await db.import_data.find_one({"job_id": request.job_id}, {"_id": 0})
        if not data:
            raise HTTPException(status_code=404, detail="Datos de importacion no encontrados")

        association_id = await resolve_association(current_user, data.get("association_id"))
        mapping = {item.source_column: item.target_field for item in request.mapping}
        transformed_rows = [transform_member_row(row, mapping)[0] for row in data.get("rows", [])]
        existing = await db.copim_members.find(
            build_existing_query(current_user["tenant_id"], association_id, transformed_rows),
            {"_id": 0},
        ).to_list(1000)
        existing_index = index_existing_members(existing)
        media_manifest = data.get("media_manifest", [])

        stats = {
            "total_rows": len(data.get("rows", [])),
            "create_count": 0,
            "update_count": 0,
            "skipped_count": 0,
            "error_count": 0,
            "duplicate_count": 0,
            "media_linked_count": 0,
            "membership_count": 0,
        }
        preview_rows = []
        errors = []

        seen_keys: set[str] = set()
        for index, row in enumerate(data.get("rows", []), start=1):
            transformed, row_errors = transform_member_row(row, mapping)
            duplicate_key = transformed.get("email") or transformed.get("phone") or transformed.get("external_member_id")
            local_duplicate = duplicate_key in seen_keys if duplicate_key else False
            if duplicate_key:
                seen_keys.add(duplicate_key)
            existing_member = resolve_existing_member(transformed, existing_index)
            avatar_match = find_media_match(transformed.get("avatar_source"), media_manifest)
            logo_match = find_media_match(transformed.get("company_logo_source"), media_manifest)
            action = "create"

            if row_errors:
                action = "error"
                stats["error_count"] += 1
                errors.append({"row": index, "errors": row_errors})
            elif existing_member or local_duplicate:
                stats["duplicate_count"] += 1
                if request.merge_strategy == "create_only":
                    action = "skip_duplicate"
                    stats["skipped_count"] += 1
                else:
                    action = "update"
                    stats["update_count"] += 1
            else:
                stats["create_count"] += 1

            if action in {"create", "update"} and (avatar_match or logo_match):
                stats["media_linked_count"] += int(bool(avatar_match)) + int(bool(logo_match))
            if action in {"create", "update"} and request.create_memberships and transformed.get("membership_plan"):
                stats["membership_count"] += 1

            if action == "create":
                index_member_candidate(existing_index, transformed, {"id": f"preview-{index}", **transformed})

            if len(preview_rows) < limit:
                preview_rows.append({
                    "row_number": index,
                    "action": action,
                    "data": transformed,
                    "errors": row_errors,
                    "existing_member_id": existing_member.get("id") if existing_member else None,
                    "media": {
                        "avatar": avatar_match,
                        "company_logo": logo_match,
                    },
                    "source": {
                        "file": row.get("__source_file"),
                        "sheet": row.get("__source_sheet"),
                        "row": row.get("__source_row"),
                    },
                })

        return {
            "job_id": request.job_id,
            "association_id": association_id,
            "preview_rows": preview_rows,
            "stats": stats,
            "errors": errors[:25],
        }

    @router.get("/fields", response_model=dict)
    async def get_copim_member_import_fields(
        current_user: dict = Depends(require_copim_admin_workspace),
    ):
        return {"fields": COPIM_MEMBER_IMPORT_FIELDS, "aliases": COPIM_MEMBER_FIELD_ALIASES}

    @router.post("/upload", response_model=dict)
    async def upload_copim_member_import(
        data_files: List[UploadFile] = File(...),
        media_files: List[UploadFile] = File(default_factory=list),
        association_id: Optional[str] = Form(default=None),
        merge_strategy: str = Form(default="smart_merge"),
        create_memberships: bool = Form(default=True),
        default_member_status: str = Form(default="source"),
        current_user: dict = Depends(require_copim_admin_workspace),
    ):
        association_id = await resolve_association(current_user, association_id)
        rows: List[dict] = []
        headers: List[str] = []
        parsed_files = []

        for file in data_files:
            suffix = Path(file.filename or "").suffix.lower()
            if suffix not in DATA_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"Archivo de datos no soportado: {file.filename}")
            parsed = parse_tabular_file(await file.read(), file.filename or "archivo")
            rows.extend(parsed["rows"])
            headers.extend([header for header in parsed["headers"] if header not in headers])
            parsed_files.append({
                "filename": file.filename,
                "file_type": parsed["file_type"],
                "rows": len(parsed["rows"]),
                "headers": parsed["headers"],
            })

        job = ImportJob(
            user_id=current_user["user_id"],
            tenant_id=current_user["tenant_id"],
            filename=", ".join(file.filename or "archivo" for file in data_files),
            file_type="mixed" if len(parsed_files) > 1 else (parsed_files[0]["file_type"] if parsed_files else "csv"),
            import_kind="copim_members",
            total_rows=len(rows),
        )

        job_dir = resolve_upload_path("import_jobs", job.id)
        media_dir = job_dir / "media"
        media_dir.mkdir(parents=True, exist_ok=True)
        media_manifest: List[Dict[str, Any]] = []

        for file in media_files or []:
            suffix = Path(file.filename or "").suffix.lower()
            content = await file.read()
            if suffix in ZIP_EXTENSIONS:
                with zipfile.ZipFile(io.BytesIO(content)) as archive:
                    for member_name in archive.namelist():
                        member_suffix = Path(member_name).suffix.lower()
                        if member_suffix not in MEDIA_EXTENSIONS:
                            continue
                        safe_name = sanitize_filename(Path(member_name).name)
                        target = media_dir / safe_name
                        target.write_bytes(archive.read(member_name))
                        media_manifest.append({
                            "filename": Path(member_name).name,
                            "stored_filename": safe_name,
                            "path": str(target),
                            "extension": member_suffix,
                            "normalized_filename": normalize_filename(Path(member_name).name),
                            "normalized_stem": normalize_text(Path(member_name).stem),
                        })
            elif suffix in MEDIA_EXTENSIONS:
                safe_name = sanitize_filename(file.filename or f"media-{uuid.uuid4()}{suffix}")
                target = media_dir / safe_name
                target.write_bytes(content)
                media_manifest.append({
                    "filename": file.filename,
                    "stored_filename": safe_name,
                    "path": str(target),
                    "extension": suffix,
                    "normalized_filename": normalize_filename(file.filename),
                    "normalized_stem": normalize_text(Path(file.filename or "").stem),
                })

        await db.import_jobs.insert_one(job.model_dump())
        await db.import_data.insert_one({
            "job_id": job.id,
            "rows": rows,
            "headers": headers,
            "association_id": association_id,
            "import_kind": "copim_members",
            "merge_strategy": merge_strategy,
            "create_memberships": create_memberships,
            "default_member_status": default_member_status,
            "media_manifest": media_manifest,
            "created_at": datetime.now(timezone.utc),
        })

        return {
            "job_id": job.id,
            "filename": job.filename,
            "association_id": association_id,
            "total_rows": len(rows),
            "headers": headers,
            "sample_data": rows[:5],
            "parsed_files": parsed_files,
            "mapping_suggestions": build_mapping_suggestions(headers),
            "available_fields": COPIM_MEMBER_IMPORT_FIELDS,
            "media_summary": {
                "total_files": len(media_manifest),
                "image_files": len([item for item in media_manifest if item.get("extension") in MEDIA_EXTENSIONS]),
            },
        }

    @router.post("/preview", response_model=dict)
    async def preview_copim_member_import(
        request: CopimMemberImportPreviewRequest,
        current_user: dict = Depends(require_copim_admin_workspace),
    ):
        return await build_preview_payload(request, current_user)

    @router.post("/execute", response_model=dict)
    async def execute_copim_member_import(
        request: CopimMemberImportExecuteRequest,
        current_user: dict = Depends(require_copim_admin_workspace),
    ):
        job = await db.import_jobs.find_one({"id": request.job_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Job de importacion no encontrado")
        data = await db.import_data.find_one({"job_id": request.job_id}, {"_id": 0})
        if not data:
            raise HTTPException(status_code=404, detail="Datos de importacion no encontrados")

        association_id = await resolve_association(current_user, data.get("association_id"))
        mapping = {item.source_column: item.target_field for item in request.mapping}
        transformed_rows = [transform_member_row(row, mapping)[0] for row in data.get("rows", [])]
        existing_members = await db.copim_members.find(
            build_existing_query(current_user["tenant_id"], association_id, transformed_rows),
            {"_id": 0},
        ).to_list(1000)
        existing_index = index_existing_members(existing_members)
        media_manifest = data.get("media_manifest", [])

        await db.import_jobs.update_one(
            {"id": request.job_id},
            {"$set": {"status": ImportStatus.PROCESSING.value, "column_mapping": mapping}},
        )

        imported = 0
        updated = 0
        skipped = 0
        memberships_created = 0
        media_linked = 0
        errors: List[dict] = []
        seen_keys: set[str] = set()

        for index, row in enumerate(data.get("rows", []), start=1):
            transformed, row_errors = transform_member_row(row, mapping)
            duplicate_key = transformed.get("email") or transformed.get("phone") or transformed.get("external_member_id")
            local_duplicate = duplicate_key in seen_keys if duplicate_key else False
            if duplicate_key:
                seen_keys.add(duplicate_key)

            if row_errors:
                errors.append({"row": index, "errors": row_errors})
                continue

            existing = resolve_existing_member(transformed, existing_index)
            if local_duplicate and not existing:
                skipped += 1
                continue
            if existing and request.merge_strategy == "create_only":
                skipped += 1
                continue

            member_status = resolve_member_status(request.default_member_status, row.get("__source_file"), transformed)
            avatar_match = find_media_match(transformed.get("avatar_source"), media_manifest)
            logo_match = find_media_match(transformed.get("company_logo_source"), media_manifest)

            if existing:
                update_payload = build_update_payload(existing, transformed, row)
                if avatar_match:
                    update_payload["avatar_url"] = copy_media_to_member(
                        avatar_match["path"],
                        upload_dir,
                        tenant_id=current_user["tenant_id"],
                        member_id=existing["id"],
                        kind="avatar",
                    )
                    media_linked += 1
                if logo_match:
                    metadata = dict(update_payload.get("profile_metadata") or existing.get("profile_metadata") or {})
                    metadata["company_logo_url"] = copy_media_to_member(
                        logo_match["path"],
                        upload_dir,
                        tenant_id=current_user["tenant_id"],
                        member_id=existing["id"],
                        kind="company-logo",
                    )
                    update_payload["profile_metadata"] = metadata
                    media_linked += 1

                await db.copim_members.update_one(
                    {"tenant_id": current_user["tenant_id"], "id": existing["id"]},
                    {"$set": update_payload},
                )
                member_id = existing["id"]
                index_member_candidate(existing_index, transformed, {**existing, **update_payload})
                updated += 1
            else:
                member_doc = build_member_payload(
                    transformed,
                    row,
                    tenant_id=current_user["tenant_id"],
                    association_id=association_id,
                    user_id=current_user["user_id"],
                    member_status=member_status,
                    normalize_checklist=normalize_copim_validation_checklist,
                    credential_builder=build_copim_credential_id,
                )
                await db.copim_members.insert_one(member_doc)
                member_id = member_doc["id"]
                imported += 1

                update_after_media: Dict[str, Any] = {}
                if avatar_match:
                    update_after_media["avatar_url"] = copy_media_to_member(
                        avatar_match["path"],
                        upload_dir,
                        tenant_id=current_user["tenant_id"],
                        member_id=member_id,
                        kind="avatar",
                    )
                    media_linked += 1
                if logo_match:
                    metadata = dict(member_doc.get("profile_metadata") or {})
                    metadata["company_logo_url"] = copy_media_to_member(
                        logo_match["path"],
                        upload_dir,
                        tenant_id=current_user["tenant_id"],
                        member_id=member_id,
                        kind="company-logo",
                    )
                    update_after_media["profile_metadata"] = metadata
                    media_linked += 1
                if update_after_media:
                    update_after_media["updated_at"] = now_iso()
                    await db.copim_members.update_one(
                        {"tenant_id": current_user["tenant_id"], "id": member_id},
                        {"$set": update_after_media},
                    )

                index_member_candidate(existing_index, transformed, {**member_doc, **update_after_media})

            if request.create_memberships:
                created = await maybe_create_membership(
                    db,
                    tenant_id=current_user["tenant_id"],
                    user_id=current_user["user_id"],
                    member_id=member_id,
                    association_id=association_id,
                    transformed=transformed,
                    member_name=transformed.get("full_name") or "Socio CIIB",
                    sync_member_financials=sync_copim_member_financials,
                )
                memberships_created += int(created)

        final_status = ImportStatus.COMPLETED.value
        if errors and not imported and not updated:
            final_status = ImportStatus.FAILED.value
        elif errors or skipped:
            final_status = ImportStatus.PARTIAL.value

        await sync_copim_association_stats(current_user["tenant_id"], association_id)
        result = {
            "status": final_status,
            "imported": imported,
            "imported_count": imported,
            "updated": updated,
            "updated_count": updated,
            "skipped": skipped,
            "skipped_count": skipped,
            "membership_created_count": memberships_created,
            "media_linked_count": media_linked,
            "errors": len(errors),
            "error_count": len(errors),
            "error_details": errors[:25],
            "message": f"Importacion CIIB completada: {imported} creados, {updated} actualizados, {skipped} omitidos, {len(errors)} errores",
        }

        await db.import_jobs.update_one(
            {"id": request.job_id},
            {"$set": {
                "status": final_status,
                "imported_count": imported,
                "skipped_count": skipped,
                "error_count": len(errors),
                "errors": errors[:50],
                "completed_at": datetime.now(timezone.utc),
                "result": result,
            }},
        )
        await db.import_data.delete_one({"job_id": request.job_id})
        if emit_import_realtime_events:
            await emit_import_realtime_events(current_user, request.job_id, result)
        return result

    @router.get("/jobs", response_model=List[dict])
    async def list_copim_member_import_jobs(
        current_user: dict = Depends(require_copim_admin_workspace),
    ):
        jobs = await db.import_jobs.find(
            {"tenant_id": current_user["tenant_id"], "import_kind": "copim_members"},
            {"_id": 0},
        ).sort("created_at", -1).to_list(50)
        return [serialize_doc(job) for job in jobs]

    return router

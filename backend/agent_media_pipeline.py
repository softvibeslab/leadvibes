"""Utilities for the ROVI agent multimodal interpretation pipeline.

The functions in this module are intentionally deterministic. They create the
first audited interpretation job before any OCR, transcription, model call or
CRM write happens.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


URL_PATTERN = re.compile(r"https?://[^\s<>\]\)\"']+", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")

SOURCE_TYPE_BY_FILE_TYPE = {
    "image": "image",
    "audio": "audio",
    "video": "video",
    "document": "document",
    "spreadsheet": "spreadsheet",
    "archive": "archive",
}


def extract_public_urls(text: str | None) -> list[str]:
    """Return public-looking URLs from free text."""
    return [match.group(0).rstrip(".,;") for match in URL_PATTERN.finditer(text or "")]


def normalize_text(value: str | None) -> str:
    return " ".join(str(value or "").strip().lower().split())


def contains_phone_like_value(value: str | None) -> bool:
    text = value or ""
    for match in PHONE_PATTERN.finditer(text):
        digits = "".join(ch for ch in match.group(0) if ch.isdigit())
        if len(digits) >= 8:
            return True
    return False


def classify_url_source(url: str) -> dict[str, Any]:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path.lower()
    if "drive.google.com" in host or "docs.google.com" in host:
        return {
            "source_type": "google_drive",
            "source_label": "Google Drive publico",
            "extraction_strategy": "drive_public_folder_scan",
            "input_types": ["google_drive", "public_folder", "url"],
        }
    if "youtube.com" in host or "youtu.be" in host:
        return {
            "source_type": "youtube",
            "source_label": "YouTube",
            "extraction_strategy": "public_video_transcript_or_summary",
            "input_types": ["youtube_url", "video_url"],
        }
    if any(domain in host for domain in ("instagram.com", "tiktok.com", "facebook.com", "fb.watch", "linkedin.com", "x.com", "twitter.com")):
        return {
            "source_type": "social_link",
            "source_label": "Red social",
            "extraction_strategy": "public_social_context_scan",
            "input_types": ["social_url", host],
        }
    if path.endswith(".vcf"):
        return {
            "source_type": "shared_contact",
            "source_label": "Contacto compartido",
            "extraction_strategy": "contact_card_parse",
            "input_types": ["vcf", "contact"],
        }
    return {
        "source_type": "public_link",
        "source_label": "Link publico",
        "extraction_strategy": "public_link_fetch_and_summarize",
        "input_types": ["url"],
    }


def detect_agent_input_source(
    *,
    text: str | None = None,
    attachment: dict | None = None,
    asset: dict | None = None,
) -> dict[str, Any]:
    urls = extract_public_urls(text)
    if urls:
        detected = classify_url_source(urls[0])
        return {
            **detected,
            "urls": urls,
            "extraction_status": "queued",
            "raw_text_available": bool(text),
        }

    filename = (attachment or {}).get("filename") or (asset or {}).get("filename") or ""
    mime_type = ((attachment or {}).get("mime_type") or (asset or {}).get("mime_type") or "").lower()
    file_type = (asset or {}).get("file_type") or ""
    suffix = Path(filename).suffix.lower()

    if (attachment or {}).get("kind") in {"voice", "audio"} or mime_type.startswith("audio/"):
        source_type = "audio"
        strategy = "speech_to_text_then_crm_mapping"
    elif (attachment or {}).get("kind") in {"video", "video_note", "animation"} or mime_type.startswith("video/"):
        source_type = "video"
        strategy = "video_keyframes_transcript_then_crm_mapping"
    elif (attachment or {}).get("kind") == "photo" or mime_type.startswith("image/"):
        source_type = "image"
        strategy = "ocr_vision_then_crm_mapping"
    elif suffix in {".csv", ".xls", ".xlsx", ".tsv", ".numbers"}:
        source_type = "spreadsheet"
        strategy = "tabular_import_mapping"
    elif suffix in {".vcf"}:
        source_type = "shared_contact"
        strategy = "contact_card_parse"
    elif suffix in {".txt"} and "whatsapp" in normalize_text(filename):
        source_type = "whatsapp_export"
        strategy = "whatsapp_export_parse"
    else:
        source_type = SOURCE_TYPE_BY_FILE_TYPE.get(file_type, "file")
        strategy = "document_text_extraction_then_crm_mapping"

    return {
        "source_type": source_type,
        "source_label": source_type.replace("_", " ").title(),
        "extraction_strategy": strategy,
        "input_types": [source_type, suffix.lstrip(".") or file_type or "file"],
        "urls": [],
        "extraction_status": "queued",
        "raw_text_available": bool(text),
    }


def classify_agent_input_intent(
    *,
    text: str | None = None,
    source_type: str = "text",
    filename: str | None = None,
) -> dict[str, Any]:
    haystack = normalize_text(" ".join([text or "", filename or "", source_type or ""]))
    property_terms = (
        "propiedad", "propiedades", "inmueble", "lote", "departamento", "depa",
        "condo", "condominio", "casa", "villa", "terreno", "m2", "recamaras",
        "amenidades", "brochure", "planos", "renders", "precio", "disponibilidad",
    )
    lead_terms = (
        "lead", "cliente", "prospecto", "comprador", "interesado", "busca",
        "presupuesto", "telefono", "teléfono", "whatsapp", "correo", "email",
    )
    task_terms = ("tarea", "pendiente", "seguimiento", "recordar", "llamar", "hacer", "revisar")
    event_terms = ("evento", "cita", "visita", "reunion", "reunión", "agenda", "calendar", "meet")
    campaign_terms = ("campaña", "campana", "copy", "script", "post", "anuncio", "contenido", "ads")
    skill_terms = ("skill", "playbook", "proceso", "automatiza", "automatización", "repetitivo")

    if source_type == "google_drive":
        return {
            "intent": "import_or_enrich_property",
            "entity_type": "property",
            "crm_target": "properties",
            "confidence": 0.78,
            "proposed_next_action": "scan_drive_folder_and_create_property_draft",
        }
    if source_type == "whatsapp_export":
        return {
            "intent": "extract_crm_entities_from_conversation",
            "entity_type": "mixed",
            "crm_target": "import_preview",
            "confidence": 0.72,
            "proposed_next_action": "parse_whatsapp_export_and_group_entities",
        }
    if source_type == "shared_contact":
        return {
            "intent": "create_or_update_lead",
            "entity_type": "lead",
            "crm_target": "leads",
            "confidence": 0.82,
            "proposed_next_action": "parse_contact_and_upsert_lead",
        }
    if contains_phone_like_value(text):
        return {
            "intent": "create_or_update_lead",
            "entity_type": "lead",
            "crm_target": "leads",
            "confidence": 0.76,
            "proposed_next_action": "extract_contact_fields_and_upsert_lead",
        }
    if source_type in {"youtube", "social_link"}:
        return {
            "intent": "create_campaign_or_knowledge",
            "entity_type": "campaign",
            "crm_target": "campaigns",
            "confidence": 0.66,
            "proposed_next_action": "extract_marketing_insights_and_create_campaign_draft",
        }
    if any(term in haystack for term in skill_terms):
        return {
            "intent": "draft_skill",
            "entity_type": "skill",
            "crm_target": "agent_skill_drafts",
            "confidence": 0.7,
            "proposed_next_action": "create_skill_draft",
        }
    if any(term in haystack for term in event_terms):
        return {
            "intent": "create_or_update_event",
            "entity_type": "event",
            "crm_target": "calendar_events",
            "confidence": 0.7,
            "proposed_next_action": "map_event_fields_and_upsert",
        }
    if any(term in haystack for term in task_terms):
        return {
            "intent": "create_or_update_task",
            "entity_type": "task",
            "crm_target": "tasks",
            "confidence": 0.68,
            "proposed_next_action": "map_task_fields_and_upsert",
        }
    if any(term in haystack for term in property_terms):
        return {
            "intent": "create_or_update_property",
            "entity_type": "property",
            "crm_target": "properties",
            "confidence": 0.7,
            "proposed_next_action": "map_property_fields_and_upsert",
        }
    if any(term in haystack for term in lead_terms):
        return {
            "intent": "create_or_update_lead",
            "entity_type": "lead",
            "crm_target": "leads",
            "confidence": 0.7,
            "proposed_next_action": "map_lead_fields_and_upsert",
        }
    if any(term in haystack for term in campaign_terms):
        return {
            "intent": "create_campaign_or_script",
            "entity_type": "campaign",
            "crm_target": "campaigns",
            "confidence": 0.62,
            "proposed_next_action": "create_campaign_or_script_draft",
        }
    return {
        "intent": "knowledge_or_inbox",
        "entity_type": "knowledge",
        "crm_target": "media_hub",
        "confidence": 0.45,
        "proposed_next_action": "store_for_review_and_enrichment",
    }


def build_agent_interpretation_job_doc(
    *,
    tenant_id: str,
    user_id: str,
    role_scope: str,
    source_channel: str,
    source_payload: dict[str, Any] | None = None,
    text: str | None = None,
    attachment: dict | None = None,
    asset: dict | None = None,
    link_id: str | None = None,
    profile_id: str | None = None,
) -> dict[str, Any]:
    source = detect_agent_input_source(text=text, attachment=attachment, asset=asset)
    intent = classify_agent_input_intent(
        text=text,
        source_type=source["source_type"],
        filename=(attachment or {}).get("filename") or (asset or {}).get("filename"),
    )
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": f"agent-interpretation-job-{uuid.uuid4()}",
        "tenant_id": tenant_id,
        "user_id": user_id,
        "role_scope": role_scope,
        "link_id": link_id,
        "profile_id": profile_id,
        "source_channel": source_channel,
        "source_type": source["source_type"],
        "source_label": source["source_label"],
        "input_types": source.get("input_types", []),
        "urls": source.get("urls", []),
        "media_asset_id": (asset or {}).get("id"),
        "original_filename": (asset or {}).get("original_filename") or (attachment or {}).get("filename"),
        "mime_type": (asset or {}).get("mime_type") or (attachment or {}).get("mime_type"),
        "raw_text_preview": (text or "")[:1000],
        "source_payload": source_payload or {},
        "extraction_strategy": source["extraction_strategy"],
        "extraction_status": source.get("extraction_status", "queued"),
        "classification": intent,
        "intent": intent["intent"],
        "entity_type": intent["entity_type"],
        "crm_target": intent["crm_target"],
        "confidence": intent["confidence"],
        "proposed_next_action": intent["proposed_next_action"],
        "mapping_status": "queued" if intent["confidence"] >= 0.6 else "needs_review",
        "autopilot_allowed": intent["entity_type"] != "knowledge",
        "delete_requires_confirmation": True,
        "audit_status": "created",
        "created_at": now,
        "updated_at": now,
    }

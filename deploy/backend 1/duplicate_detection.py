"""
Duplicate Detection - ROVI CRM
Sistema mejorado de detección de duplicados con fuzzy matching
"""

import re
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Intentar importar fuzzy matching
try:
    from fuzzywuzzy import fuzz, process
    FUZZY_AVAILABLE = True
except ImportError:
    FUZZY_AVAILABLE = False
    logger.warning("fuzzywuzzy no disponible, usando matching básico")

# Intentar importar phone number parser
try:
    from phonenumbers import parse, format_number, PhoneNumberFormat, NumberParseException
    PHONENUMBERS_AVAILABLE = True
except ImportError:
    PHONENUMBERS_AVAILABLE = False
    logger.warning("phonenumbers no disponible, usando normalización básica")


def normalize_phone(phone: str, country: str = "MX") -> str:
    """
    Normaliza teléfono a formato internacional estándar.

    Args:
        phone: Teléfono en cualquier formato
        country: Código de país (default: MX)

    Returns:
        Teléfono normalizado o string vacío si falla
    """
    if not phone:
        return ""

    # Limpiar phone
    phone_clean = phone.strip()
    if not phone_clean:
        return ""

    # Usar phonenumbers si está disponible
    if PHONENUMBERS_AVAILABLE:
        try:
            parsed = parse(phone_clean, country)
            if parsed:
                return format_number(parsed, PhoneNumberFormat.E164)
        except NumberParseException:
            pass  # Fallback a normalización básica

    # Normalización básica (fallback)
    # Remover todo excepto dígitos y +
    normalized = re.sub(r'[^\d+]', '', phone_clean)

    # Si tiene + y código país, ya está bien
    if normalized.startswith('+'):
        return normalized

    # Si es México y empieza con código país sin +
    if country == "MX" and normalized.startswith('52'):
        # Verificar si es un celular (empieza con 1 después de 52)
        if len(normalized) == 13 and normalized[2] == '1':
            # +52 1 XXX XXX XXX -> +52 XXX XXX XXX
            normalized = '+52' + normalized[3:]
        else:
            normalized = '+' + normalized

    # Si no tiene código país, asumir México
    elif not normalized.startswith('+'):
        if country == "MX":
            # Asumir celular mexicano
            normalized = '+52' + normalized[-10:] if len(normalized) >= 10 else '+52' + normalized

    return normalized


def normalize_email(email: str) -> str:
    """
    Normaliza email para comparación.

    Args:
        email: Email en cualquier formato

    Returns:
        Email normalizado en minúsculas y sin espacios
    """
    if not email:
        return ""

    # Convertir a minúsculas y limpiar
    normalized = email.strip().lower()

    # Remover puntos de Gmail (opcional, ya que john.doe@gmail.com == johndoe@gmail.com)
    if "@gmail.com" in normalized:
        local_part = normalized.split("@")[0]
        local_part = local_part.replace(".", "")
        normalized = local_part + "@gmail.com"

    return normalized


def normalize_name(name: str) -> str:
    """
    Normaliza nombre para comparación fuzzy.

    Args:
        name: Nombre en cualquier formato

    Returns:
        Nombre normalizado
    """
    if not name:
        return ""

    # Minúsculas y sin espacios extra
    normalized = name.strip().lower()

    # Remover caracteres especiales
    normalized = re.sub(r'[^\w\s]', '', normalized)

    # Remover espacios múltiples
    normalized = re.sub(r'\s+', ' ', normalized)

    return normalized


def calculate_name_similarity(name1: str, name2: str) -> int:
    """
    Calcula similitud entre dos nombres (0-100).

    Args:
        name1: Primer nombre
        name2: Segundo nombre

    Returns:
        Score de similitud (0-100)
    """
    if not name1 or not name2:
        return 0

    # Normalizar nombres
    norm1 = normalize_name(name1)
    norm2 = normalize_name(name2)

    # Si son idénticos después de normalizar
    if norm1 == norm2:
        return 100

    # Usar fuzzy matching si está disponible
    if FUZZY_AVAILABLE:
        # Ratio de Levenshtein
        ratio = fuzz.ratio(norm1, norm2)

        # Token sort ratio (ignora orden de palabras)
        token_sort = fuzz.token_sort_ratio(norm1, norm2)

        # Token set ratio (ignora palabras duplicadas)
        token_set = fuzz.token_set_ratio(norm1, norm2)

        # Retornar el máximo de los tres
        return max(ratio, token_sort, token_set)

    # Fallback: comparación básica
    return int(norm1 == norm2) * 100


async def find_potential_duplicates(
    db,
    tenant_id: str,
    lead_data: dict,
    threshold: int = 85,
    max_results: int = 10
) -> List[Dict[str, Any]]:
    """
    Encuentra leads potencialmente duplicados usando múltiples estrategias.

    Estrategias:
    1. Email exact match (confianza: 100%)
    2. Phone exact match después de normalizar (confianza: 95%)
    3. Fuzzy name match + phone/email similar (confianza: 70-100%)

    Args:
        db: Database connection
        tenant_id: Tenant ID para filtrar
        lead_data: Datos del lead a verificar
        threshold: Umbral de similitud para fuzzy matching (default: 85)
        max_results: Máximo de resultados a retornar

    Returns:
        Lista de duplicados potenciales ordenados por confianza
    """
    duplicates = []

    logger.info(
        f"Buscando duplicados para lead: "
        f"name={lead_data.get('name')}, "
        f"email={lead_data.get('email')}, "
        f"phone={lead_data.get('phone')}"
    )

    # 1. Email exact match (máxima confianza)
    if lead_data.get("email"):
        normalized_email = normalize_email(lead_data["email"])

        email_match = await db.leads.find_one({
            "tenant_id": tenant_id,
            "email": normalized_email
        })

        if email_match:
            duplicates.append({
                "lead": email_match,
                "reason": "email_exact_match",
                "reason_display": "Email idéntico",
                "confidence": 100
            })
            logger.info(f"Duplicado encontrado por email: {normalized_email}")

    # 2. Phone exact match (alta confianza)
    if lead_data.get("phone"):
        normalized_phone = normalize_phone(lead_data["phone"])

        if normalized_phone:
            # Buscar todos los leads del tenant y comparar teléfonos
            all_leads = await db.leads.find({
                "tenant_id": tenant_id
            }).to_list(None)

            for lead in all_leads:
                if lead.get("phone"):
                    lead_phone_normalized = normalize_phone(lead["phone"])

                    if lead_phone_normalized and lead_phone_normalized == normalized_phone:
                        # Verificar que no esté ya en duplicados
                        if not any(d["lead"]["id"] == lead["id"] for d in duplicates):
                            duplicates.append({
                                "lead": lead,
                                "reason": "phone_exact_match",
                                "reason_display": "Teléfono idéntico",
                                "confidence": 95
                            })
                            logger.info(f"Duplicado encontrado por teléfono: {normalized_phone}")
                            break

    # 3. Fuzzy name match (si no hay duplicados de alta confianza)
    if lead_data.get("name"):
        # Obtener todos los leads del tenant (optimizar con índice)
        all_leads = await db.leads.find({
            "tenant_id": tenant_id
        }).to_list(None)

        for lead in all_leads:
            # Skip si ya está en duplicados
            if any(d["lead"]["id"] == lead["id"] for d in duplicates):
                continue

            # Skip si no tiene nombre
            if not lead.get("name"):
                continue

            # Calcular similitud de nombres
            name_similarity = calculate_name_similarity(
                lead_data["name"],
                lead["name"]
            )

            # Si supera el threshold
            if name_similarity >= threshold:
                # Chequear si también coincide teléfono o email (boost confidence)
                additional_confidence = 0
                phone_similar = False
                email_similar = False

                if lead_data.get("phone") and lead.get("phone"):
                    if normalize_phone(lead_data["phone"]) == normalize_phone(lead["phone"]):
                        phone_similar = True
                        additional_confidence += 10

                if lead_data.get("email") and lead.get("email"):
                    if normalize_email(lead_data["email"]) == normalize_email(lead["email"]):
                        email_similar = True
                        additional_confidence += 10

                confidence = min(100, name_similarity + additional_confidence)

                duplicates.append({
                    "lead": lead,
                    "reason": "name_fuzzy_match",
                    "reason_display": f"Nombre similar ({name_similarity}%)",
                    "confidence": confidence,
                    "name_similarity": name_similarity,
                    "phone_similar": phone_similar,
                    "email_similar": email_similar
                })

                logger.info(
                    f"Duplicado por fuzzy name: "
                    f"similarity={name_similarity}%, "
                    f"phone_similar={phone_similar}, "
                    f"email_similar={email_similar}"
                )

    # Ordenar por confianza y limitar resultados
    duplicates = sorted(duplicates, key=lambda x: x["confidence"], reverse=True)
    duplicates = duplicates[:max_results]

    logger.info(f"Total duplicados encontrados: {len(duplicates)}")

    return duplicates


async def bulk_find_duplicates(
    db,
    tenant_id: str,
    leads_batch: List[dict],
    threshold: int = 85
) -> Dict[str, List[Dict]]:
    """
    Encuentra duplicados para un batch de leads (eficiente para import).

    Args:
        db: Database connection
        tenant_id: Tenant ID
        leads_batch: Lista de leads a verificar
        threshold: Umbral de similitud

    Returns:
        Dict con lead_index -> lista de duplicados
    """
    # Obtener todos los leads existentes del tenant (una sola query)
    existing_leads = await db.leads.find({
        "tenant_id": tenant_id
    }).to_list(None)

    # Crear índices para búsqueda rápida
    existing_emails = {}
    existing_phones = {}
    existing_names = {}

    for lead in existing_leads:
        lead_id = lead["id"]

        if lead.get("email"):
            email_norm = normalize_email(lead["email"])
            existing_emails[email_norm] = lead

        if lead.get("phone"):
            phone_norm = normalize_phone(lead["phone"])
            existing_phones[phone_norm] = lead

        if lead.get("name"):
            name_norm = normalize_name(lead["name"])
            if name_norm not in existing_names:
                existing_names[name_norm] = []
            existing_names[name_norm].append(lead)

    # Verificar duplicados para cada lead del batch
    duplicates_map = {}

    for idx, lead_data in enumerate(leads_batch):
        duplicates = []

        # Email match
        if lead_data.get("email"):
            email_norm = normalize_email(lead_data["email"])
            if email_norm in existing_emails:
                duplicates.append({
                    "lead": existing_emails[email_norm],
                    "reason": "email_exact_match",
                    "confidence": 100
                })

        # Phone match
        if lead_data.get("phone"):
            phone_norm = normalize_phone(lead_data["phone"])
            if phone_norm in existing_phones:
                lead = existing_phones[phone_norm]
                if not any(d["lead"]["id"] == lead["id"] for d in duplicates):
                    duplicates.append({
                        "lead": lead,
                        "reason": "phone_exact_match",
                        "confidence": 95
                    })

        # Name fuzzy match
        if lead_data.get("name") and FUZZY_AVAILABLE:
            name_norm = normalize_name(lead_data["name"])

            for existing_name, leads_list in existing_names.items():
                similarity = fuzz.ratio(name_norm, existing_name)

                if similarity >= threshold:
                    for lead in leads_list:
                        if not any(d["lead"]["id"] == lead["id"] for d in duplicates):
                            duplicates.append({
                                "lead": lead,
                                "reason": "name_fuzzy_match",
                                "confidence": similarity
                            })

        # Ordenar por confianza
        duplicates = sorted(duplicates, key=lambda x: x["confidence"], reverse=True)

        if duplicates:
            duplicates_map[str(idx)] = duplicates[:5]  # Max 5 por lead

    return duplicates_map


def get_duplicate_suggestions(
    lead_original: dict,
    lead_duplicate: dict
) -> List[str]:
    """
    Genera sugerencias de cómo fusionar dos leads duplicados.

    Args:
        lead_original: Lead original
        lead_duplicate: Lead duplicado

    Returns:
        Lista de sugerencias
    """
    suggestions = []

    # Comparar campos
    if lead_original.get("email") and not lead_duplicate.get("email"):
        suggestions.append("Conservar email del lead original")

    if lead_duplicate.get("email") and not lead_original.get("email"):
        suggestions.append("Agregar email del duplicado al original")

    if lead_duplicate.get("phone") and lead_original.get("phone"):
        phone_orig = normalize_phone(lead_original["phone"])
        phone_dup = normalize_phone(lead_duplicate["phone"])
        if phone_orig != phone_dup:
            suggestions.append("Agregar teléfono adicional del duplicado")

    if lead_duplicate.get("budget_mxn", 0) > lead_original.get("budget_mxn", 0):
        suggestions.append("Actualizar presupuesto con el mayor valor")

    if lead_duplicate.get("notes") and not lead_original.get("notes"):
        suggestions.append("Conservar notas del duplicado")

    if not suggestions:
        suggestions.append("Los leads son muy similares, se recomienda mantener solo el más reciente")

    return suggestions

"""
Import Optimization - ROVI CRM
Importación masiva optimizada para procesar 100 leads en < 2 minutos
"""

import asyncio
import csv
import io
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Importar duplicate detection
from duplicate_detection import normalize_phone, normalize_email, bulk_find_duplicates


async def validate_row_fast(
    row: dict,
    mapping: Dict[str, str],
    required_fields: List[str] = None
) -> dict:
    """
    Validación rápida de una fila de importación.

    Args:
        row: Fila del CSV/Excel
        mapping: Mapeo de columnas
        required_fields: Campos requeridos

    Returns:
        Dict con validated=True/False y datos transformados
    """
    if required_fields is None:
        required_fields = ["name", "phone"]

    transformed = {}
    errors = []

    # Transformar campos según mapeo
    for source_col, target_field in mapping.items():
        value = row.get(source_col, "")

        if value is not None:
            value = str(value).strip()

        # Validar required
        if target_field in required_fields and not value:
            errors.append(f"{target_field} es requerido")

        # Type conversion
        if target_field == "email" and value:
            if "@" not in value:
                errors.append(f"Email inválido: {value}")
            else:
                transformed[target_field] = normalize_email(value)

        elif target_field == "phone" and value:
            transformed[target_field] = normalize_phone(value)

        elif target_field == "budget_mxn" and value:
            try:
                # Limpiar formato: $1,234.56 -> 1234.56
                cleaned = str(value).replace("$", "").replace(",", "").strip()
                transformed[target_field] = float(cleaned)
            except:
                transformed[target_field] = 0.0

        elif target_field in ["status", "priority"] and value:
            # Normalizar a minúsculas
            transformed[target_field] = value.lower()

        else:
            transformed[target_field] = value

    # Default values
    if "status" not in transformed or not transformed["status"]:
        transformed["status"] = "nuevo"

    if "priority" not in transformed or not transformed["priority"]:
        transformed["priority"] = "media"

    if "source" not in transformed or not transformed["source"]:
        transformed["source"] = "importado"

    return {
        "valid": len(errors) == 0,
        "data": transformed,
        "errors": errors
    }


async def execute_import_optimized(
    db,
    job_id: str,
    rows: List[dict],
    mapping: Dict[str, str],
    tenant_id: str,
    user_id: str,
    skip_duplicates: bool = True
) -> dict:
    """
    Importación optimizada con bulk operations.
    Meta: < 2 min para 100 leads

    Optimizaciones:
    1. Validación paralela con asyncio.gather
    2. Bulk duplicate check (1 query en vez de N)
    3. Bulk insert (MongoDB puede insertar 1000+ docs a la vez)
    4. Procesamiento por batches para no saturar memoria

    Args:
        db: Database connection
        job_id: Import job ID
        rows: Filas del CSV/Excel
        mapping: Mapeo de columnas a campos
        tenant_id: Tenant ID
        user_id: User ID
        skip_duplicates: Si debe omitir duplicados

    Returns:
        Dict con resultados de la importación
    """
    start_time = time.time()
    logger.info(f"Starting optimized import for job {job_id}: {len(rows)} rows")

    # Paso 1: Validación paralela de todas las filas
    logger.info("Step 1: Validating rows in parallel...")
    validation_tasks = [
        validate_row_fast(row, mapping)
        for row in rows
    ]

    # Ejecutar validaciones en paralelo
    validated_results = await asyncio.gather(*validation_tasks)

    # Separar válidos vs inválidos
    valid_rows = []
    invalid_rows = []

    for i, result in enumerate(validated_results):
        if result["valid"]:
            result["row_number"] = i + 1
            valid_rows.append(result)
        else:
            invalid_rows.append({
                "row_number": i + 1,
                "errors": result["errors"],
                "data": result["data"]
            })

    logger.info(f"Validation complete: {len(valid_rows)} valid, {len(invalid_rows)} invalid")

    # Paso 2: Bulk duplicate check (1 query)
    duplicates_found = 0
    if skip_duplicates and valid_rows:
        logger.info("Step 2: Checking for duplicates in bulk...")

        # Extraer emails y teléfonos
        emails = [
            r["data"]["email"]
            for r in valid_rows
            if r["data"].get("email")
        ]
        phones = [
            r["data"]["phone"]
            for r in valid_rows
            if r["data"].get("phone")
        ]

        # Query única para todos los duplicados
        existing_leads = await db.leads.find({
            "tenant_id": tenant_id,
            "$or": [
                {"email": {"$in": emails}},
                {"phone": {"$in": phones}}
            ]
        }).to_list(None)

        # Crear sets para búsqueda rápida
        existing_emails = set(
            normalize_email(l.get("email", ""))
            for l in existing_leads
            if l.get("email")
        )
        existing_phones = set(
            normalize_phone(l.get("phone", ""))
            for l in existing_leads
            if l.get("phone")
        )

        logger.info(
            f"Found {len(existing_leads)} existing leads: "
            f"{len(existing_emails)} unique emails, {len(existing_phones)} unique phones"
        )

        # Filtrar duplicados
        final_valid_rows = []
        duplicates_skipped = []

        for row_data in valid_rows:
            email = row_data["data"].get("email", "")
            phone = row_data["data"].get("phone", "")

            is_duplicate = False

            if email and email in existing_emails:
                is_duplicate = True
                duplicates_skipped.append({
                    "row_number": row_data["row_number"],
                    "reason": "email_duplicate",
                    "email": email
                })

            elif phone and phone in existing_phones:
                is_duplicate = True
                duplicates_skipped.append({
                    "row_number": row_data["row_number"],
                    "reason": "phone_duplicate",
                    "phone": phone
                })

            if not is_duplicate:
                final_valid_rows.append(row_data)

        logger.info(
            f"Duplicates filtered: {len(duplicates_skipped)} skipped, "
            f"{len(final_valid_rows)} remaining"
        )

        duplicates_found = len(duplicates_skipped)
        valid_rows = final_valid_rows

    # Paso 3: Preparar documents para bulk insert
    logger.info("Step 3: Preparing documents for bulk insert...")

    leads_to_insert = []
    now = datetime.now(timezone.utc).isoformat()

    for row_data in valid_rows:
        lead_doc = {
            "id": f"lead-{int(time.time() * 1000000)}-{len(leads_to_insert)}",
            "tenant_id": tenant_id,
            "created_by": user_id,
            "created_at": now,
            "updated_at": now,
            "deleted": False,
            "intent_score": 50,
            **row_data["data"]
        }
        leads_to_insert.append(lead_doc)

    # Paso 4: Bulk insert en batches de 100
    logger.info("Step 4: Bulk inserting leads in batches...")

    batch_size = 100
    total_inserted = 0

    for i in range(0, len(leads_to_insert), batch_size):
        batch = leads_to_insert[i:i + batch_size]

        if batch:
            await db.leads.insert_many(batch)
            total_inserted += len(batch)
            logger.info(f"Inserted batch {i // batch_size + 1}: {len(batch)} leads")

    # Paso 5: Actualizar job con resultados
    duration = time.time() - start_time

    final_status = "completed"
    if len(invalid_rows) > 0 and total_inserted == 0:
        final_status = "failed"
    elif len(invalid_rows) > 0:
        final_status = "partial"

    await db.import_jobs.update_one(
        {"id": job_id},
        {"$set": {
            "status": final_status,
            "imported_count": total_inserted,
            "skipped_count": duplicates_found,
            "error_count": len(invalid_rows),
            "errors": invalid_rows[:50],  # Max 50 errores
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    logger.info(
        f"Import completed: "
        f"{total_inserted} inserted, "
        f"{duplicates_found} skipped, "
        f"{len(invalid_rows)} errors, "
        f"duration={duration:.2f}s"
    )

    return {
        "status": final_status,
        "imported": total_inserted,
        "skipped": duplicates_found,
        "errors": len(invalid_rows),
        "error_details": invalid_rows[:10],
        "duration_seconds": round(duration, 2),
        "rows_per_second": round(len(rows) / duration, 2) if duration > 0 else 0,
        "message": (
            f"Importación completada: {total_inserted} leads importados, "
            f"{duplicates_found} duplicados omitidos, "
            f"{len(invalid_rows)} errores "
            f"({duration:.2f}s)"
        )
    }


async def execute_import_with_advanced_duplicates(
    db,
    job_id: str,
    rows: List[dict],
    mapping: Dict[str, str],
    tenant_id: str,
    user_id: str,
    duplicate_threshold: int = 85
) -> dict:
    """
    Importación con detección avanzada de duplicados usando fuzzy matching.

    Args:
        db: Database connection
        job_id: Import job ID
        rows: Filas del CSV/Excel
        mapping: Mapeo de columnas
        tenant_id: Tenant ID
        user_id: User ID
        duplicate_threshold: Umbral de similitud para duplicados (0-100)

    Returns:
        Dict con resultados incluyendo duplicados encontrados
    """
    start_time = time.time()
    logger.info(f"Starting import with advanced duplicate detection: {len(rows)} rows")

    # Validación paralela
    validation_tasks = [
        validate_row_fast(row, mapping)
        for row in rows
    ]
    validated_results = await asyncio.gather(*validation_tasks)

    valid_rows = []
    invalid_rows = []

    for i, result in enumerate(validated_results):
        if result["valid"]:
            result["row_number"] = i + 1
            valid_rows.append(result)
        else:
            invalid_rows.append({
                "row_number": i + 1,
                "errors": result["errors"],
                "data": result["data"]
            })

    logger.info(f"Validation: {len(valid_rows)} valid, {len(invalid_rows)} invalid")

    # Bulk duplicate check con fuzzy matching
    logger.info("Checking for duplicates with fuzzy matching...")

    duplicates_map = await bulk_find_duplicates(
        db, tenant_id, [r["data"] for r in valid_rows], duplicate_threshold
    )

    # Filtrar duplicados
    final_valid_rows = []
    duplicates_skipped = []

    for i, row_data in enumerate(valid_rows):
        idx_str = str(i)

        if idx_str in duplicates_map:
            duplicates = duplicates_map[idx_str]

            # Skip si hay duplicado de alta confianza (>= 95)
            high_conf_duplicates = [d for d in duplicates if d["confidence"] >= 95]

            if high_conf_duplicates:
                duplicates_skipped.append({
                    "row_number": row_data["row_number"],
                    "reason": "high_confidence_duplicate",
                    "duplicates": [
                        {
                            "lead_id": d["lead"]["id"],
                            "name": d["lead"].get("name"),
                            "confidence": d["confidence"]
                        }
                        for d in duplicates[:3]
                    ]
                })
                continue

        final_valid_rows.append(row_data)

    logger.info(
        f"Duplicates: {len(duplicates_skipped)} skipped, "
        f"{len(final_valid_rows)} remaining"
    )

    # Bulk insert
    leads_to_insert = []
    now = datetime.now(timezone.utc).isoformat()

    for row_data in final_valid_rows:
        lead_doc = {
            "id": f"lead-{int(time.time() * 1000000)}-{len(leads_to_insert)}",
            "tenant_id": tenant_id,
            "created_by": user_id,
            "created_at": now,
            "updated_at": now,
            "deleted": False,
            "intent_score": 50,
            **row_data["data"]
        }
        leads_to_insert.append(lead_doc)

    # Insert en batches
    batch_size = 100
    total_inserted = 0

    for i in range(0, len(leads_to_insert), batch_size):
        batch = leads_to_insert[i:i + batch_size]
        if batch:
            await db.leads.insert_many(batch)
            total_inserted += len(batch)
            logger.info(f"Inserted batch {i // batch_size + 1}: {len(batch)} leads")

    # Actualizar job
    duration = time.time() - start_time

    final_status = "completed"
    if len(invalid_rows) > 0 and total_inserted == 0:
        final_status = "failed"
    elif len(invalid_rows) > 0:
        final_status = "partial"

    await db.import_jobs.update_one(
        {"id": job_id},
        {"$set": {
            "status": final_status,
            "imported_count": total_inserted,
            "skipped_count": len(duplicates_skipped),
            "error_count": len(invalid_rows),
            "errors": invalid_rows[:50] + duplicates_skipped[:50],
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    logger.info(
        f"Import completed: "
        f"{total_inserted} inserted, "
        f"{len(duplicates_skipped)} duplicates skipped, "
        f"{len(invalid_rows)} errors, "
        f"duration={duration:.2f}s"
    )

    return {
        "status": final_status,
        "imported": total_inserted,
        "skipped": len(duplicates_skipped),
        "errors": len(invalid_rows),
        "duration_seconds": round(duration, 2),
        "rows_per_second": round(len(rows) / duration, 2) if duration > 0 else 0,
        "message": (
            f"Importación completada: {total_inserted} leads importados, "
            f"{len(duplicates_skipped)} duplicados omitidos (fuzzy matching), "
            f"{len(invalid_rows)} errores "
            f"({duration:.2f}s)"
        )
    }


def calculate_import_performance_metrics(
    total_rows: int,
    duration_seconds: float,
    imported_count: int
) -> dict:
    """
    Calcula métricas de performance de la importación.

    Args:
        total_rows: Total de filas procesadas
        duration_seconds: Duración en segundos
        imported_count: Total de leads importados

    Returns:
        Dict con métricas
    """
    return {
        "total_rows": total_rows,
        "duration_seconds": round(duration_seconds, 2),
        "imported_count": imported_count,
        "rows_per_second": round(total_rows / duration_seconds, 2) if duration_seconds > 0 else 0,
        "seconds_per_row": round(duration_seconds / total_rows, 3) if total_rows > 0 else 0,
        "success_rate": round((imported_count / total_rows) * 100, 1) if total_rows > 0 else 0,
        "estimated_time_for_100_rows": round((duration_seconds / total_rows) * 100, 1) if total_rows > 0 else 0
    }

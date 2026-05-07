"""
LEADS IMPROVEMENTS - ROVI CRM
Implementación de mejoras para Semana 1

Tasks:
1. Validación de email/phone únicos
2. Filtros avanzados con debounce
3. Búsqueda en tiempo real
4. Bulk operations
5. DELETE endpoint
"""

from fastapi import HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from models import LeadCreate, LeadUpdate, LeadStatus, LeadPriority
from auth import get_current_user


async def validate_lead_unique_fields(db, lead_data: dict, tenant_id: str, exclude_lead_id: str = None):
    """
    Validar que email y phone del lead sean únicos dentro del tenant
    """
    errors = []

    email = lead_data.get("email")
    phone = lead_data.get("phone")

    # Build query
    query = {"tenant_id": tenant_id}

    if exclude_lead_id:
        query["_id"] = {"$ne": exclude_lead_id}

    # Check email uniqueness
    if email:
        email_query = query.copy()
        email_query["email"] = email
        existing_email = await db.leads.find_one(email_query)
        if existing_email:
            errors.append({"field": "email", "message": "Email ya registrado en otro lead"})

    # Check phone uniqueness
    if phone:
        phone_query = query.copy()
        phone_query["phone"] = phone
        existing_phone = await db.leads.find_one(phone_query)
        if existing_phone:
            errors.append({"field": "phone", "message": "Teléfono ya registrado en otro lead"})

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validación fallida", "errors": errors}
        )

    return {"valid": True}


async def get_leads_advanced_filters(
    db,
    tenant_id: str,
    current_user: dict,
    status: Optional[List[LeadStatus]] = Query(None),
    priority: Optional[List[LeadPriority]] = Query(None),
    source: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,  # Búsqueda en tiempo real
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 50
):
    """
    Get leads con filtros avanzados y búsqueda en tiempo real
    Incluye debounce logic (implementado en frontend)
    """
    try:
        # Build query
        query = {"tenant_id": tenant_id}

        # Filtros de status (múltiples)
        if status:
            query["status"] = {"$in": [s.value for s in status]}

        # Filtros de priority (múltiples)
        if priority:
            query["priority"] = {"$in": [p.value for p in priority]}

        # Filtro de source
        if source:
            query["source"] = source

        # Filtro de rango de fechas
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = date_from
            if date_to:
                date_query["$lte"] = date_to
            query["created_at"] = date_query

        # Búsqueda en tiempo real (full-text search)
        if search:
            # Buscar en múltiples campos
            search_query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"phone": {"$regex": search, "$options": "i"}},
                    {"property": {"$regex": search, "$options": "i"}},
                    {"notes": {"$regex": search, "$options": "i"}}
                ]
            }
            query.update(search_query)

        # Count total
        total = await db.leads.count_documents(query)

        # Sorting
        sort_order_int = -1 if sort_order == "desc" else 1
        sort_spec = [(sort_by, sort_order_int)]

        # Pagination
        skip = (page - 1) * page_size

        # Execute query
        cursor = db.leads.find(query).sort(sort_spec).skip(skip).limit(page_size)
        leads = await cursor.to_list(length=page_size)

        return {
            "leads": leads,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener leads: {str(e)}"
        )


async def delete_lead(db, lead_id: str, current_user: dict):
    """
    Soft delete de un lead (marca como deleted)
    Previene pérdida de datos accidental
    """
    try:
        # Verificar que el lead existe y pertenece al tenant
        lead = await db.leads.find_one({
            "id": lead_id,
            "tenant_id": current_user["tenant_id"]
        })

        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead no encontrado"
            )

        # Soft delete
        await db.leads.update_one(
            {"id": lead_id},
            {
                "$set": {
                    "deleted": True,
                    "deleted_at": datetime.now(timezone.utc),
                    "deleted_by": current_user["user_id"]
                }
            }
        )

        return {"message": "Lead eliminado correctamente", "lead_id": lead_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar lead: {str(e)}"
        )


async def bulk_update_leads_status(
    db,
    lead_ids: List[str],
    new_status: LeadStatus,
    current_user: dict
):
    """
    Bulk update: actualizar status de múltiples leads
    """
    try:
        # Verificar que todos los leads pertenecen al tenant
        leads = await db.leads.find({
            "id": {"$in": lead_ids},
            "tenant_id": current_user["tenant_id"]
        }).to_list(None)

        if len(leads) != len(lead_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Algunos leads no existen. Encontrados: {len(leads)}, Solicitados: {len(lead_ids)}"
            )

        # Actualizar todos
        result = await db.leads.update_many(
            {
                "id": {"$in": lead_ids},
                "tenant_id": current_user["tenant_id"]
            },
            {
                "$set": {
                    "status": new_status.value,
                    "status_updated_at": datetime.now(timezone.utc),
                    "status_updated_by": current_user["user_id"]
                }
            }
        )

        return {
            "message": "Status actualizado correctamente",
            "updated_count": result.modified_count
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en bulk update: {str(e)}"
        )


async def bulk_delete_leads(db, lead_ids: List[str], current_user: dict):
    """
    Bulk delete: soft delete de múltiples leads
    """
    try:
        # Verificar que todos los leads pertenecen al tenant
        leads = await db.leads.find({
            "id": {"$in": lead_ids},
            "tenant_id": current_user["tenant_id"]
        }).to_list(None)

        if len(leads) != len(lead_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Algunos leads no existen. Encontrados: {len(leads)}, Solicitados: {len(lead_ids)}"
            )

        # Soft delete todos
        result = await db.leads.update_many(
            {
                "id": {"$in": lead_ids},
                "tenant_id": current_user["tenant_id"]
            },
            {
                "$set": {
                    "deleted": True,
                    "deleted_at": datetime.now(timezone.utc),
                    "deleted_by": current_user["user_id"]
                }
            }
        )

        return {
            "message": "Leads eliminados correctamente",
            "deleted_count": result.modified_count
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en bulk delete: {str(e)}"
        )

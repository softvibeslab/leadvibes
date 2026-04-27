"""
AUTH IMPROVEMENTS - ROVI CRM
Implementación de mejoras para Semana 1

Tasks:
1. Endpoint /auth/logout para revocar refresh tokens
2. Cleanup automático de refresh tokens expirados
3. Validación de email/phone únicos
4. Rate limiting en auth endpoints
"""

from fastapi import HTTPException, Depends, status
from datetime import datetime, timezone, timedelta
from auth import get_current_user
import asyncio

async def logout_user(db, refresh_token: str, current_user: dict = Depends(get_current_user)):
    """
    Revocar refresh token (logout)
    Marca el token como revocado para prevenir reutilización
    """
    try:
        import jwt
        from auth import JWT_SECRET, JWT_ALGORITHM, decode_token

        # Decodificar token
        payload = decode_token(refresh_token)
        token_jti = payload.get("jti")
        token_type = payload.get("type")

        if token_type != "refresh" or not token_jti:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido. Debe ser un refresh token"
            )

        # Verificar que el token pertenece al usuario actual
        token_data = await db.refresh_tokens.find_one({"jti": token_jti})
        if not token_data or token_data["user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token no pertenece a este usuario"
            )

        # Marcar como revocado
        await db.refresh_tokens.update_one(
            {"jti": token_jti},
            {
                "$set": {
                    "revoked": True,
                    "revoked_at": datetime.now(timezone.utc)
                }
            }
        )

        return {"message": "Logout exitoso", "revoked_at": datetime.now(timezone.utc).isoformat()}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante logout: {str(e)}"
        )


async def cleanup_expired_tokens(db):
    """
    Cleanup automático de refresh tokens expirados
    Debe ejecutarse periódicamente (cron job)
    """
    try:
        # Buscar tokens expirados o revocados hace más de 30 días
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

        result = await db.refresh_tokens.delete_many({
            "$or": [
                {"exp": {"$lt": datetime.now(timezone.utc).timestamp()}},
                {"revoked": True, "revoked_at": {"$lt": cutoff_date}}
            ]
        })

        return {
            "message": "Cleanup completado",
            "deleted_count": result.deleted_count
        }

    except Exception as e:
        return {
            "message": f"Error durante cleanup: {str(e)}",
            "deleted_count": 0
        }


async def validate_email_phone_unique(db, email: str, phone: str = None, exclude_user_id: str = None):
    """
    Validar que email y phone sean únicos
    Retorna dict con errores si existen duplicados
    """
    errors = []

    # Check email uniqueness
    if email:
        email_query = {"email": email}
        if exclude_user_id:
            email_query["_id"] = {"$ne": exclude_user_id}

        existing_email = await db.users.find_one(email_query)
        if existing_email:
            errors.append({"field": "email", "message": "Email ya registrado"})

    # Check phone uniqueness
    if phone:
        phone_query = {"phone": phone}
        if exclude_user_id:
            phone_query["_id"] = {"$ne": exclude_user_id}

        existing_phone = await db.users.find_one(phone_query)
        if existing_phone:
            errors.append({"field": "phone", "message": "Teléfono ya registrado"})

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validación fallida", "errors": errors}
        )

    return {"valid": True}


async def check_auth_rate_limit(db, user_id: str, action: str = "login", max_attempts: int = 5):
    """
    Rate limiting para auth endpoints
    Previene brute force attacks
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=15)  # 15 min window

    # Contar intentos en la ventana de tiempo
    attempts = await db.auth_attempts.count_documents({
        "user_id": user_id,
        "action": action,
        "timestamp": {"$gte": window_start}
    })

    if attempts >= max_attempts:
        # Calcular tiempo restante
        oldest_attempt = await db.auth_attempts.find_one({
            "user_id": user_id,
            "action": action,
            "timestamp": {"$gte": window_start}
        }, sort=[("timestamp", 1)])

        if oldest_attempt:
            retry_after = 15 - int((now - oldest_attempt["timestamp"]).total_seconds() / 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "message": "Demasiados intentos. Intente nuevamente más tarde.",
                    "retry_after_minutes": max(1, retry_after)
                },
                headers={"Retry-After": str(max(1, retry_after * 60))}
            )

    # Registrar intento
    await db.auth_attempts.insert_one({
        "user_id": user_id,
        "action": action,
        "timestamp": now
    })

    return {"allowed": True, "attempts": attempts + 1}

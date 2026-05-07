# 🔧 SERVER.PATCH - ROVI CRM

Este archivo contiene los patches para agregar a `server.py` en la implementación de Semana 1.

## 1. AGREGAR ENDPOINT DE LOGOUT

Después de la línea 390 (después de `/auth/refresh`), agregar:

```python
@api_router.post("/auth/logout")
async def logout(
    refresh_token: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Revocar refresh token (logout del usuario)
    Marca el token como revocado para prevenir reutilización
    """
    from auth_improvements import logout_user

    return await logout_user(db, refresh_token, current_user)
```

## 2. AGREGAR ENDPOINT DE CLEANUP TOKENS (ADMIN)

```python
@api_router.post("/auth/cleanup-tokens")
async def cleanup_tokens(current_user: dict = Depends(require_role(["admin"]))):
    """
    Cleanup de refresh tokens expirados
    Solo admin puede ejecutar
    """
    from auth_improvements import cleanup_expired_tokens

    return await cleanup_expired_tokens(db)
```

## 3. MEJORAR LEAD FILTERS

Reemplazar la función `get_leads` (aprox línea 910) con la versión mejorada:

```python
@api_router.get("/leads")
async def get_leads(
    current_user: dict = Depends(get_current_user),
    status: Optional[List[LeadStatus]] = Query(None),
    priority: Optional[List[LeadPriority]] = Query(None),
    source: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 50
):
    """
    Get leads con filtros avanzados y búsqueda en tiempo real
    """
    from leads_improvements import get_leads_advanced_filters

    result = await get_leads_advanced_filters(
        db=db,
        tenant_id=current_user["tenant_id"],
        current_user=current_user,
        status=status,
        priority=priority,
        source=source,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

    return result
```

## 4. AGREGAR DELETE LEAD

Después de `update_lead` (aprox línea 1091), agregar:

```python
@api_router.delete("/leads/{lead_id}")
async def delete_lead_endpoint(
    lead_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Soft delete de un lead
    """
    from leads_improvements import delete_lead

    return await delete_lead(db, lead_id, current_user)
```

## 5. AGREGAR BULK OPERATIONS

```python
@api_router.put("/leads/bulk/status")
async def bulk_update_status(
    lead_ids: List[str],
    new_status: LeadStatus,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar status de múltiples leads
    """
    from leads_improvements import bulk_update_leads_status

    return await bulk_update_leads_status(db, lead_ids, new_status, current_user)


@api_router.delete("/leads/bulk")
async def bulk_delete_endpoint(
    lead_ids: List[str],
    current_user: dict = Depends(get_current_user)
):
    """
    Soft delete de múltiples leads
    """
    from leads_improvements import bulk_delete_leads

    return await bulk_delete_leads(db, lead_ids, current_user)
```

## 6. MEJORAR CREATE LEAD CON VALIDACIÓN

En la función `create_lead` (aprox línea 968), agregar validación:

```python
@api_router.post("/leads", response_model=Lead, status_code=status.HTTP_201_CREATED)
async def create_lead_endpoint(
    lead_data: LeadCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear nuevo lead con validación de email/phone únicos
    """
    from leads_improvements import validate_lead_unique_fields

    # Validar campos únicos
    lead_dict = lead_data.model_dump()
    await validate_lead_unique_fields(
        db=db,
        lead_data=lead_dict,
        tenant_id=current_user["tenant_id"]
    )

    # ... resto del código existente ...
```

## 7. AGREGAR RATE LIMITING EN LOGIN

En la función `login` (aprox línea 232), agregar rate limiting:

```python
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin):
    """
    Login user con rate limiting
    """
    from auth_improvements import check_auth_rate_limit
    from auth import verify_password, create_access_token, create_refresh_token

    # Buscar usuario
    user = await db.users.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # Rate limiting
    await check_auth_rate_limit(db, user["id"], "login", max_attempts=5)

    # Verificar password
    if not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    # ... resto del código existente ...
```

## 8. AGREGAR VALIDACIÓN EN REGISTRO

En la función de registro (si existe), agregar:

```python
from auth_improvements import validate_email_phone_unique

# Validar email/phone únicos
await validate_email_phone_unique(
    db=db,
    email=user_data.email,
    phone=user_data.phone
)
```

## 9. CREAR INDICES EN MONGODB

Agregar a seed_data.py o ejecutar en MongoDB shell:

```python
# Índices para mejorar performance
await db.leads.create_index([("tenant_id", 1), ("email", 1)], unique=True)
await db.leads.create_index([("tenant_id", 1), ("phone", 1)], unique=True)
await db.leads.create_index([("tenant_id", 1), ("deleted", 1)])
await db.leads.create_index([("tenant_id", 1), ("status", 1)])
await db.leads.create_index([("tenant_id", 1), ("priority", 1)])
await db.leads.create_index([("tenant_id", 1), ("created_at", -1)])

# Text index para búsqueda full-text
await db.leads.create_index([
    ("name", "text"),
    ("email", "text"),
    ("phone", "text"),
    ("property", "text"),
    ("notes", "text")
])

# Índices para auth
await db.refresh_tokens.create_index([("jti", 1)], unique=True)
await db.refresh_tokens.create_index([("user_id", 1), ("revoked", 1)])
await db.auth_attempts.create_index([("user_id", 1), ("action", 1), ("timestamp", -1)])
```

## 10. FRONTEND: AGREGAR DEBOUNCE

En el frontend React, agregar debounce para búsqueda:

```javascript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

function LeadsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState([]);

  // Debounce search (500ms)
  const debouncedSearch = debounce(async (term) => {
    const response = await api.get(`/leads?search=${term}`);
    setLeads(response.data.leads);
  }, 500);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      fetchLeads();
    }

    // Cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar leads..."
    />
  );
}
```

## IMPLEMENTACIÓN PASO A PASO

1. **Copiar archivos nuevos:**
   ```bash
   cp auth_improvements.py ~/Documents/GitHub/leadvibes/backend/
   cp leads_improvements.py ~/Documents/GitHub/leadvibes/backend/
   ```

2. **Editar server.py:**
   - Agregar imports al inicio
   - Agregar endpoints según las secciones anteriores
   - Reemplazar funciones existentes con versiones mejoradas

3. **Crear índices en MongoDB:**
   ```bash
   cd ~/Documents/GitHub/leadvibes/backend
   python3 -c "from seed_data import create_indexes; import asyncio; asyncio.run(create_indexes())"
   ```

4. **Testing:**
   - Probar logout
   - Probar filtros avanzados
   - Probar búsqueda con debounce
   - Probar bulk operations
   - Probar rate limiting

5. **Deploy a staging:**
   ```bash
   git add .
   git commit -m "feat: implement auth improvements and advanced lead filters"
   git push origin rovi_deploy
   ```

---

**Todos los patches están listos para implementar.**

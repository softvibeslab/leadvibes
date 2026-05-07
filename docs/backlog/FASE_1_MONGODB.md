# Fase 1 — MongoDB: Multi-tenancy robusto

**Semanas:** 1-2  
**Prioridad:** 🔴 Crítica — todo el sistema depende de esto  
**Archivos afectados:** `models.py`, `auth.py`, `server.py`, `permissions.py` (nuevo)

---

## Problema que resuelve

Hoy el multi-tenancy es un string plano derivado del user_id:

```python
# server.py ~línea 179
tenant_id = f"tenant-{user_id[:8]}"
```

No existe el concepto de "inmobiliaria que agrupa brokers". Para que el agente de IA pueda responder "¿cómo van los leads de todos mis brokers esta semana?" sin hacer 10 queries separadas, se necesita una jerarquía real.

**Jerarquía objetivo:**
```
Organization (org_id)
  └── Users — role: admin | manager | broker
       └── Leads, Campaigns, Activities...
            ├── org_id   → para queries de toda la org (inmobiliaria)
            └── broker_id → para queries individuales (broker)
```

---

## Paso 1.1 — Nuevo archivo `backend/permissions.py`

Crear este archivo desde cero. Es el corazón del sistema de permisos.

```python
"""
permissions.py — Control de acceso centralizado para Rovi CRM.

REGLA: Todos los endpoints deben construir sus filtros MongoDB
usando build_resource_filter(). Nunca escribir {"tenant_id": x}
directamente en server.py.
"""
from enum import Enum
from typing import Dict, Any, Optional


class AccessScope(str, Enum):
    OWN = "own"    # solo recursos del broker autenticado
    ORG = "org"    # todos los recursos de la organización


def build_resource_filter(
    user: Dict[str, Any],
    scope: Optional[AccessScope] = None
) -> Dict[str, Any]:
    """
    Construye el filtro MongoDB correcto según el rol del usuario.

    Casos:
    - broker individual (account_type='individual') → {org_id, broker_id}
    - broker en agencia (role='broker')             → {org_id, broker_id}
    - manager en agencia (role='manager')           → {org_id}
    - admin en agencia (role='admin')               → {org_id}
    - scope=OWN forzado                             → {org_id, broker_id}
    - scope=ORG forzado                             → {org_id}

    Uso básico:
        f = build_resource_filter(current_user)
        leads = await db.leads.find(f).to_list(None)

    Uso con scope explícito:
        f = build_resource_filter(current_user, scope=AccessScope.ORG)
    """
    org_id = user.get("org_id", "")
    user_id = user.get("user_id", "")
    role = user.get("role", "broker")
    account_type = user.get("account_type", "individual")

    # Override explícito tiene precedencia
    if scope == AccessScope.ORG:
        return {"org_id": org_id}
    if scope == AccessScope.OWN:
        return {"org_id": org_id, "broker_id": user_id}

    # Admin y manager de agencia ven toda la organización
    if role in ("admin", "manager") and account_type == "agency":
        return {"org_id": org_id}

    # Default: broker ve solo sus propios recursos
    return {"org_id": org_id, "broker_id": user_id}


def can_access_resource(
    user: Dict[str, Any],
    resource: Dict[str, Any]
) -> bool:
    """
    Verifica si un usuario puede acceder a un recurso específico por ID.
    Usar en endpoints GET /leads/{id}, GET /campaigns/{id}, etc.

    Retorna True si tiene acceso, False si no.
    """
    org_id = user.get("org_id", "")
    user_id = user.get("user_id", "")
    role = user.get("role", "broker")

    # Org diferente = acceso denegado siempre
    if resource.get("org_id") != org_id:
        return False

    # Admin y manager ven todo dentro de su org
    if role in ("admin", "manager"):
        return True

    # Broker solo ve sus propios recursos
    return resource.get("broker_id") == user_id


def get_org_id(user: Dict[str, Any]) -> str:
    """Helper para extraer org_id limpiamente."""
    return user.get("org_id", "")


def get_broker_id(user: Dict[str, Any]) -> str:
    """Helper para extraer broker_id (= user_id) limpiamente."""
    return user.get("user_id", "")
```

---

## Paso 1.2 — Actualizar `backend/models.py`

### Agregar modelo `Organization` (antes de la clase `User`)

```python
class OrganizationType(str, Enum):
    INDIVIDUAL = "individual"   # broker independiente
    AGENCY = "agency"           # inmobiliaria con múltiples brokers


class OrganizationCreate(BaseModel):
    name: str
    type: OrganizationType = OrganizationType.INDIVIDUAL


class Organization(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: str
    type: OrganizationType = OrganizationType.INDIVIDUAL
    owner_id: str                       # user_id del admin/dueño
    plan: str = "free"                  # free | pro | enterprise
    settings: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=now_utc)
    is_active: bool = True
```

### Actualizar clase `User`

```python
class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    created_at: datetime = Field(default_factory=now_utc)
    onboarding_completed: bool = False

    # NUEVO: reemplaza tenant_id con jerarquía clara
    org_id: str = ""              # FK a Organization.id
    # broker_id no se guarda en User porque broker_id == user.id siempre

    # DEPRECADO: mantener durante período de transición para backward compat
    tenant_id: str = ""
    account_type: str = "individual"   # individual | agency

    ai_profile: Optional['AIProfile'] = None
```

### Actualizar `UserResponse`

```python
class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    onboarding_completed: bool
    account_type: str = "individual"
    org_id: str = ""              # NUEVO
    ai_profile: Optional['AIProfile'] = None
```

### Actualizar todos los modelos de recursos

Busca todas las clases que tienen `tenant_id: str` y agrégales estos dos campos:

```python
# Patrón a aplicar en: Lead, Activity, Campaign, Goal,
# EmailTemplate, GamificationRule, AIProfile,
# IntegrationSettings, Product, CalendarEvent

# ANTES
tenant_id: str = ""

# DESPUÉS
org_id: str = ""          # FK a Organization — para queries de agencia
broker_id: str = ""       # user_id del broker asignado
tenant_id: str = ""       # DEPRECATED — mantener para compatibilidad
```

---

## Paso 1.3 — Actualizar `backend/auth.py`

Incluir `org_id` en el payload del JWT para que esté disponible en todos los endpoints sin hacer un lookup extra a MongoDB:

```python
# En la función que crea el JWT token (buscar create_access_token o similar)
def create_access_token(user: dict) -> str:
    payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user.get("role", "broker"),
        "account_type": user.get("account_type", "individual"),
        "org_id": user.get("org_id", ""),          # NUEVO
        "tenant_id": user.get("tenant_id", ""),    # mantener por compat
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# En get_current_user — incluir org_id en el dict retornado
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    return {
        "user_id": payload.get("user_id"),
        "email": payload.get("email"),
        "role": payload.get("role", "broker"),
        "account_type": payload.get("account_type", "individual"),
        "org_id": payload.get("org_id", ""),       # NUEVO
        "tenant_id": payload.get("tenant_id", ""), # mantener
    }
```

---

## Paso 1.4 — Actualizar `backend/server.py`

### Registro de usuario — reemplazar creación de tenant_id

Buscar la función de registro (probablemente `POST /api/auth/register`) y reemplazar:

```python
# ANTES (~línea 179)
tenant_id = f"tenant-{user_id[:8]}"

# DESPUÉS
import uuid as uuid_lib

# Crear organización para el nuevo usuario
org_id = f"org-{str(uuid_lib.uuid4())[:12]}"
org_doc = {
    "id": org_id,
    "name": user_data.name,
    "type": user_data.account_type,   # "individual" o "agency"
    "owner_id": user_id,
    "plan": "free",
    "settings": {},
    "created_at": datetime.now(timezone.utc).isoformat(),
    "is_active": True,
}
await db.organizations.insert_one(org_doc)

# tenant_id mantiene el valor por backward compat
tenant_id = org_id
```

### Al guardar el usuario nuevo

```python
user_doc = {
    "id": user_id,
    "email": user_data.email,
    "name": user_data.name,
    "role": "admin",              # primer usuario de una org es admin
    "account_type": user_data.account_type,
    "org_id": org_id,             # NUEVO
    "tenant_id": org_id,          # backward compat
    "password_hash": hashed_password,
    "is_active": True,
    "onboarding_completed": False,
    "created_at": datetime.now(timezone.utc).isoformat(),
}
```

### Actualizar queries en endpoints

Importar permissions.py y reemplazar los filtros directos:

```python
from permissions import build_resource_filter, can_access_resource

# ANTES (patrón a buscar y reemplazar en todo server.py)
leads = await db.leads.find({"tenant_id": current_user["tenant_id"]}).to_list(None)

# DESPUÉS
resource_filter = build_resource_filter(current_user)
leads = await db.leads.find(resource_filter).to_list(None)
```

---

## Paso 1.5 — Índices MongoDB

Agregar al startup de la app (o correr manualmente una vez):

```python
# En la función de startup de FastAPI (lifespan o @app.on_event("startup"))
async def create_indexes():
    # Leads — los dos patrones de acceso principales
    await db.leads.create_index([("org_id", 1), ("status", 1)])
    await db.leads.create_index([("org_id", 1), ("broker_id", 1), ("status", 1)])
    await db.leads.create_index([("org_id", 1), ("created_at", -1)])
    await db.leads.create_index([("org_id", 1), ("broker_id", 1), ("created_at", -1)])

    # Activities — timeline por broker
    await db.activities.create_index([("org_id", 1), ("broker_id", 1), ("created_at", -1)])

    # Campaigns — por tipo y estado
    await db.campaigns.create_index([("org_id", 1), ("type", 1), ("status", 1)])

    # Users — lookup por organización
    await db.users.create_index([("org_id", 1), ("role", 1), ("is_active", 1)])

    # Organizations
    await db.organizations.create_index([("owner_id", 1)], unique=True)
    await db.organizations.create_index([("id", 1)], unique=True)
```

---

## Criterios de éxito — Fase 1

- [ ] Existe colección `organizations` en MongoDB con un doc por usuario
- [ ] Todos los documentos en `leads`, `campaigns`, `activities` tienen `org_id` y `broker_id`
- [ ] `permissions.py` existe y `build_resource_filter()` es usado en todos los GET endpoints
- [ ] Un broker autenticado no puede ver leads de otra organización (probar manualmente)
- [ ] Un usuario con `role=admin` y `account_type=agency` ve los leads de todos sus brokers
- [ ] JWT incluye `org_id` en el payload
- [ ] Tests de integración existentes (`pytest -m integration`) siguen pasando
- [ ] Los índices compuestos están creados (verificar con `db.leads.index_information()`)

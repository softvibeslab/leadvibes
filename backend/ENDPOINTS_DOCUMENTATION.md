# 📚 API Documentation - ROVI CRM v1.1

**Nuevos Endpoints - Semana 1**
**Fecha:** 2026-04-27

---

## 🔐 Authentication Endpoints

### POST /api/auth/logout
**Descripción:** Revoca un refresh token para hacer logout del usuario

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:**
```json
{
  "message": "Logout exitoso",
  "revoked_at": "2026-04-27T04:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<REFRESH_TOKEN>"}'
```

---

### POST /api/auth/cleanup-tokens ⭐ NEW
**Descripción:** Limpia tokens expirados o revocados antiguos (Admin only)

**Auth Required:** Si (Admin)

**Headers:**
```
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

**Response:**
```json
{
  "message": "Cleanup completado",
  "deleted_count": 15
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/cleanup-tokens \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Notas:**
- Elimina tokens expirados
- Elimina tokens revocados hace más de 30 días
- Mantiene la base de datos limpia
- Solo usuarios admin pueden ejecutar

---

## 📋 Leads Endpoints

### GET /api/leads ⭐ ENHANCED
**Descripción:** Obtiene leads con filtros avanzados, búsqueda en tiempo real y paginación

**Auth Required:** Sí

**Query Parameters:**

| Parámetro | Tipo | Ejemplo | Descripción |
|-----------|------|---------|-------------|
| `status` | List[str] | `status=nuevo&status=contactado` | Filtro por múltiples statuses |
| `priority` | List[str] | `priority=alta&priority=media` | Filtro por múltiples prioridades |
| `source` | string | `source=web` | Filtro por fuente |
| `date_from` | datetime | `date_from=2026-04-01T00:00:00Z` | Filtro desde fecha |
| `date_to` | datetime | `date_to=2026-04-30T23:59:59Z` | Filtro hasta fecha |
| `search` | string | `search=juan` | Búsqueda full-text |
| `sort_by` | string | `sort_by=created_at` | Campo para ordenar |
| `sort_order` | string | `sort_order=desc` | Orden: asc o desc |
| `page` | int | `page=1` | Número de página |
| `page_size` | int | `page_size=50` | Elementos por página (max: 100) |

**Response:**
```json
{
  "leads": [
    {
      "id": "lead-123",
      "name": "Juan Perez",
      "email": "juan@example.com",
      "phone": "+52987654321",
      "property": "Lote Tulum",
      "status": "nuevo",
      "priority": "alta",
      "source": "web",
      "created_at": "2026-04-27T04:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 50,
  "total_pages": 3
}
```

**Examples:**

```bash
# Leads con status "nuevo" o "contactado"
curl "http://localhost:8000/api/leads?status=nuevo&status=contactado&page=1&page_size=10"

# Leads con prioridad "alta"
curl "http://localhost:8000/api/leads?priority=alta"

# Leads de un rango de fechas
curl "http://localhost:8000/api/leads?date_from=2026-04-01T00:00:00Z&date_to=2026-04-30T23:59:59Z"

# Búsqueda full-text (busca en name, email, phone, property, notes)
curl "http://localhost:8000/api/leads?search=tulum"

# Ordenar por prioridad descendente
curl "http://localhost:8000/api/leads?sort_by=priority&sort_order=desc"

# Combinar filtros
curl "http://localhost:8000/api/leads?status=nuevo&priority=alta&search=tulum&page=1&page_size=20"
```

**Performance:**
- < 200ms para queries sin search
- < 500ms para queries con search
- Soporta hasta 1000s de leads por tenant

---

### DELETE /api/leads/{lead_id} ⭐ NEW
**Descripción:** Soft delete de un lead (marca como deleted pero no lo borra físicamente)

**Auth Required:** Sí

**Path Parameters:**
- `lead_id` (string): ID del lead a eliminar

**Response:**
```json
{
  "message": "Lead eliminado correctamente",
  "lead_id": "lead-123"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/leads/lead-123 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Notas:**
- Implementa soft delete (marca `deleted: true`)
- Previene pérdida de datos accidentales
- El lead ya no aparecerá en búsquedas normales
- Puede recuperarse si es necesario

---

### PUT /api/leads/bulk/status ⭐ NEW
**Descripción:** Actualiza el status de múltiples leads en una sola operación

**Auth Required:** Sí

**Query Parameters:**
- `lead_ids` (string): IDs de leads separados por coma
- `new_status` (LeadStatus): Nuevo status

**Request:**
```
PUT /api/leads/bulk/status?lead_ids=id1,id2,id3&new_status=contactado
```

**Response:**
```json
{
  "message": "Status actualizado correctamente",
  "updated_count": 3
}
```

**Example:**
```bash
curl -X PUT "http://localhost:8000/api/leads/bulk/status?lead_ids=lead-1,lead-2,lead-3&new_status=contactado" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Notas:**
- Operación atómica
- Solo actualiza leads del tenant del usuario
- Retorna count de leads actualizados
- Útil para mover múltiples leads entre etapas del pipeline

---

### DELETE /api/leads/bulk ⭐ NEW
**Descripción:** Soft delete masivo de múltiples leads

**Auth Required:** Sí

**Body:**
```json
{
  "lead_ids": ["lead-1", "lead-2", "lead-3"]
}
```

**Response:**
```json
{
  "message": "Leads eliminados correctamente",
  "deleted_count": 3
}
```

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/leads/bulk \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"lead_ids":["lead-1","lead-2","lead-3"]}'
```

**Notas:**
- Soft delete masivo
- Eficiente para limpieza de lotes
- Previene pérdida de datos

---

## 🔍 Búsqueda Full-Text

### Campos Buscados
La búsqueda en tiempo real busca en estos campos:
- `name` (peso: 10)
- `email` (peso: 5)
- `phone` (peso: 5)
- `property` (peso: 3)
- `notes` (peso: 1)

### Ejemplos de Búsqueda

```bash
# Buscar por nombre
curl "http://localhost:8000/api/leads?search=juan"

# Buscar por email
curl "http://localhost:8000/api/leads?search=gmail.com"

# Buscar por propiedad
curl "http://localhost:8000/api/leads?search=tulum"

# Buscar por notas
curl "http://localhost:8000/api/leads?search=cliente"
```

---

## 📊 Paginación

### Uso
Todos los endpoints que retornan listas ahora soportan paginación:

**Query Parameters:**
- `page`: Número de página (default: 1)
- `page_size`: Elementos por página (default: 50, max: 100)

**Response Fields:**
- `total`: Total de elementos
- `page`: Página actual
- `page_size`: Elementos por página
- `total_pages`: Total de páginas

### Ejemplo
```bash
curl "http://localhost:8000/api/leads?page=2&page_size=20"
```

---

## 🎯 Validaciones

### Email/Phone Únicos

**Error Response:**
```json
{
  "detail": "Validación fallida",
  "errors": [
    {"field": "email", "message": "Email ya registrado en otro lead"},
    {"field": "phone", "message": "Teléfono ya registrado en otro lead"}
  ]
}
```

**Notas:**
- Validación a nivel de tenant
- Un email puede existir en diferentes tenants
- Phone debe ser único dentro del tenant

---

## 🚀 Performance Optimization

### MongoDB Indexes Created

15 índices creados para optimizar queries:

**Leads Collection:**
1. `(tenant_id, deleted)` - Query optimization
2. `(tenant_id, status)` - Filter optimization
3. `(tenant_id, priority)` - Filter optimization
4. `(tenant_id, created_at)` - Sort optimization
5. `(tenant_id, source)` - Filter optimization
6. `(tenant_id, status, priority, created_at)` - Advanced filters
7. `(tenant_id, email)` - Unique constraint
8. `(tenant_id, phone)` - Unique constraint

**Users Collection:**
9. `(email)` - Unique
10. `(tenant_id)` - Query optimization
11. `(tenant_id, role)` - Filter optimization

**Refresh Tokens:**
12. `(jti)` - Unique
13. `(user_id, revoked)` - Query optimization
14. `(exp)` - Expiration cleanup

**Auth Attempts:**
15. `(user_id, action, timestamp)` - Rate limiting

### Performance Targets

- **Get Leads (sin search):** < 200ms
- **Get Leads (con search):** < 500ms
- **Create Lead:** < 100ms
- **Update Lead:** < 100ms
- **Bulk Update:** < 1s (para 100 leads)

---

## 🔒 Seguridad

### Rate Limiting
Implementado en endpoints de auth:
- Máximo 5 intentos por 15 minutos
- Bloqueo temporal si se excede
- Log de todos los intentos

### Validaciones
- Email único dentro del tenant
- Phone único dentro del tenant
- JWT refresh token rotation
- Soft delete previene pérdidas accidentales

---

## 📝 Migration Guide

### De v1.0 a v1.1

**Cambios Ruptivos:**
- GET /api/lines ahora retorna objeto paginado
- POST /api/leads ahora valida email/phone únicos

**Cambios No Ruptivos:**
- Todos los endpoints existentes siguen funcionando
- Campos nuevos son opcionales

**Actualización de Frontend:**

**Antes (v1.0):**
```javascript
const response = await api.get('/leads');
setLeads(response.data); // Array de leads
```

**Después (v1.1):**
```javascript
const response = await api.get('/leads?page=1&page_size=50');
setLeads(response.data.leads); // Extraer del objeto paginado
setTotal(response.data.total); // Total de leads
setPage(response.data.page); // Página actual
```

**Para Search:**
```javascript
// Agregar debounce de 500ms
import { debounce } from 'lodash';

const searchLeads = debounce(async (searchTerm) => {
  const response = await api.get(`/leads?search=${searchTerm}`);
  setLeads(response.data.leads);
}, 500);

// Usar en input
<input onChange={(e) => searchLeads(e.target.value)} />
```

---

## 🧪 Testing

### Manual Testing Commands

```bash
# 1. Health Check
curl http://localhost:8000/api/health

# 2. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# 3. Get Leads con filtros
curl "http://localhost:8000/api/leads?status=nuevo&priority=alta"

# 4. Búsqueda
curl "http://localhost:8000/api/leads?search=tulum"

# 5. Bulk update
curl -X PUT "http://localhost:8000/api/leads/bulk/status?lead_ids=id1,id2&new_status=contactado"

# 6. Soft delete
curl -X DELETE "http://localhost:8000/api/leads/lead-123"

# 7. Bulk delete
curl -X DELETE "http://localhost:8000/api/leads/bulk" \
  -H "Content-Type: application/json" \
  -d '{"lead_ids":["id1","id2","id3"]}'
```

---

## 📚 Changelog

### v1.1 - 2026-04-27

**Added:**
- GET /api/leads con filtros avanzados
- POST /api/auth/cleanup-tokens
- DELETE /api/leads/{id} (soft delete)
- PUT /api/leads/bulk/status
- DELETE /api/leads/bulk

**Enhanced:**
- Búsqueda en tiempo real
- Paginación en listas
- Validación de email/phone únicos
- Performance mejorada con índices MongoDB

**Fixed:**
- Rate limiting preparado
- Cleanup de tokens expirados

---

**Documentación creada:** 2026-04-27
**Versión:** v1.1
**Status:** 🟢 Activo en staging

🚀 **Powered by Vibecoding Lab**

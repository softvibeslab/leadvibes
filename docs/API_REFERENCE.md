# LeadVibes API Reference

> Complete REST API documentation for LeadVibes CRM.

**Base URL:** `http://localhost:8001/api`
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Leads](#2-leads)
3. [Activities](#3-activities)
4. [Dashboard](#4-dashboard)
5. [Brokers](#5-brokers)
6. [Gamification](#6-gamification)
7. [AI Chat](#7-ai-chat)
8. [Scripts](#8-scripts)
9. [Goals](#9-goals)

---

## Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication:

```
Authorization: Bearer <your_jwt_token>
```

### Get Token

#### Register New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "broker",
  "phone": "+525512345678"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "broker",
    "is_active": true,
    "onboarding_completed": false
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "broker",
    "avatar_url": null,
    "phone": "+525512345678",
    "is_active": true,
    "onboarding_completed": true
  }
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "broker",
  "avatar_url": "https://...",
  "phone": "+525512345678",
  "is_active": true,
  "onboarding_completed": true
}
```

---

## 2. Leads

### List Leads

```http
GET /api/leads?status=nuevo&priority=alta&assigned_broker_id=xxx&search=juan
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (nuevo, contactado, calificacion, presentacion, apartado, venta, perdido) |
| `priority` | string | No | Filter by priority (baja, media, alta, urgente) |
| `assigned_broker_id` | string | No | Filter by assigned broker |
| `search` | string | No | Search in name, email, phone |

**Response (200):**
```json
[
  {
    "id": "lead-uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+525512345678",
    "status": "nuevo",
    "priority": "alta",
    "source": "web",
    "budget_mxn": 5000000,
    "property_interest": "Casa en Cancún",
    "notes": "Interested in beachfront properties",
    "assigned_broker_id": "broker-uuid",
    "intent_score": 75,
    "next_action": "Call to discuss options",
    "last_contact": "2026-03-01T10:00:00Z",
    "created_at": "2026-03-01T09:00:00Z",
    "updated_at": "2026-03-01T09:00:00Z"
  }
]
```

### Get Lead Details

```http
GET /api/leads/{lead_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "lead-uuid",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+525512345678",
  "status": "contactado",
  "priority": "alta",
  "source": "web",
  "budget_mxn": 5000000,
  "property_interest": "Casa en Cancún",
  "notes": "Interested in beachfront",
  "assigned_broker_id": "broker-uuid",
  "assigned_broker": {
    "id": "broker-uuid",
    "name": "María González",
    "avatar_url": "https://...",
    "email": "maria@example.com"
  },
  "intent_score": 85,
  "next_action": "Schedule property visit",
  "ai_analysis": {
    "intent_score": 85,
    "next_action": "Schedule property visit",
    "analysis": "High intent, specific location preference, good budget match"
  },
  "last_contact": "2026-03-04T10:00:00Z",
  "created_at": "2026-03-01T09:00:00Z",
  "updated_at": "2026-03-04T10:00:00Z",
  "activities": [
    {
      "id": "activity-uuid",
      "activity_type": "llamada",
      "description": "Initial contact call",
      "outcome": "Interested in 3 properties",
      "points_earned": 10,
      "created_at": "2026-03-04T10:00:00Z",
      "broker_name": "María González"
    }
  ]
}
```

### Create Lead

```http
POST /api/leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+525512345678",
  "source": "web",
  "budget_mxn": 5000000,
  "property_interest": "Casa en Cancún",
  "notes": "Interested in beachfront",
  "assigned_broker_id": "broker-uuid"
}
```

**Response (200):**
```json
{
  "message": "Lead creado exitosamente",
  "id": "lead-uuid"
}
```

### Update Lead

```http
PUT /api/leads/{lead_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "contactado",
  "priority": "alta",
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{
  "message": "Lead actualizado exitosamente"
}
```

### Analyze Lead with AI

```http
POST /api/leads/{lead_id}/analyze
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "intent_score": 85,
  "next_action": "Schedule property visit within 3 days",
  "analysis": "High purchase intent. Lead has specific location preference (Cancún beachfront) and budget ($5M MXN) aligns well with market prices. Recommend immediate follow-up with curated property list."
}
```

### Generate Sales Script

```http
POST /api/leads/{lead_id}/generate-script?script_type=apertura
Authorization: Bearer <token>
```

**Query Parameters:**
- `script_type`: apertura, presentacion, cierre

**Response (200):**
```json
{
  "script": "Hola Juan, soy María de SoftVibes. Te llamo porque vi que estás interesado en propiedades en Cancún...",
  "type": "apertura"
}
```

---

## 3. Activities

### Create Activity

```http
POST /api/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "lead_id": "lead-uuid",
  "activity_type": "llamada",
  "description": "Called to discuss property options",
  "outcome": "Interested in 3 properties, will send list"
}
```

**Activity Types:**
- `llamada` - Phone call
- `whatsapp` - WhatsApp message
- `email` - Email sent
- `zoom` - Video presentation
- `visita` - In-person visit
- `nota` - Internal note
- `apartado` - Property reserved
- `venta` - Sale closed

**Response (200):**
```json
{
  "message": "Actividad registrada",
  "id": "activity-uuid",
  "points_earned": 10
}
```

### List Activities

```http
GET /api/activities?lead_id=xxx&broker_id=yyy&limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "activity-uuid",
    "lead_id": "lead-uuid",
    "broker_id": "broker-uuid",
    "activity_type": "llamada",
    "description": "Initial contact",
    "outcome": "Interested",
    "points_earned": 10,
    "created_at": "2026-03-04T10:00:00Z"
  }
]
```

---

## 4. Dashboard

### Get Statistics

```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total_points": 450,
  "points_goal": 500,
  "points_progress": 90.0,
  "apartados": 3,
  "apartados_goal": 10,
  "ventas": 2,
  "ventas_goal": 5,
  "brokers_activos": 5,
  "leads_nuevos": 8,
  "conversion_rate": 25.0
}
```

### Get Leaderboard

```http
GET /api/dashboard/leaderboard
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "broker_id": "broker-uuid",
    "broker_name": "María González",
    "avatar_url": "https://...",
    "total_points": 450,
    "ventas": 5,
    "apartados": 8,
    "leads_asignados": 25,
    "llamadas": 45,
    "presentaciones": 15,
    "rank": 1,
    "month_progress": 90.0
  }
]
```

### Get Recent Activity

```http
GET /api/dashboard/recent-activity?limit=10
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "activity-uuid",
    "activity_type": "venta",
    "description": "Sale closed",
    "points_earned": 100,
    "broker_name": "María González",
    "lead_name": "Juan Pérez",
    "created_at": "2026-03-04T15:30:00Z"
  }
]
```

---

## 5. Brokers

### List Brokers

```http
GET /api/brokers
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "broker-uuid",
    "name": "María González",
    "email": "maria@example.com",
    "role": "broker",
    "avatar_url": "https://...",
    "phone": "+525598765432",
    "is_active": true,
    "leads_asignados": 25,
    "total_points": 450
  }
]
```

### Get Broker Details

```http
GET /api/brokers/{broker_id}
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "broker-uuid",
  "name": "María González",
  "email": "maria@example.com",
  "role": "broker",
  "avatar_url": "https://...",
  "phone": "+525598765432",
  "is_active": true,
  "stats": {
    "ventas": 5,
    "apartados": 8,
    "leads_total": 25,
    "llamadas": 45,
    "zooms": 15,
    "visitas": 12,
    "total_points": 450
  }
}
```

---

## 6. Gamification

### List Rules

```http
GET /api/gamification/rules
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "rule-uuid",
    "action": "llamada",
    "points": 10,
    "description": "Puntos por realizar llamada",
    "icon": "phone",
    "is_active": true
  },
  {
    "id": "rule-uuid",
    "action": "venta",
    "points": 100,
    "description": "Puntos por cerrar venta",
    "icon": "star",
    "is_active": true
  }
]
```

### Create Rule (Admin/Manager Only)

```http
POST /api/gamification/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "reunion",
  "points": 15,
  "description": "Puntos por asistir a reunión de equipo",
  "icon": "users"
}
```

**Response (200):**
```json
{
  "message": "Regla creada exitosamente",
  "id": "rule-uuid"
}
```

### Get Point Ledger

```http
GET /api/gamification/points?broker_id=xxx&limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "ledger-uuid",
    "broker_id": "broker-uuid",
    "points": 10,
    "action": "llamada",
    "description": "Puntos por llamada",
    "lead_id": "lead-uuid",
    "activity_id": "activity-uuid",
    "created_at": "2026-03-04T10:00:00Z"
  }
]
```

---

## 7. AI Chat

### Send Message

```http
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "How can I improve my conversion rate?"
}
```

**Response (200):**
```json
{
  "id": "message-uuid",
  "role": "assistant",
  "content": "Based on your current stats, here are some recommendations..."
}
```

### Get Chat History

```http
GET /api/chat/history?limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "msg-uuid",
    "role": "user",
    "content": "How can I improve my conversion rate?",
    "created_at": "2026-03-04T11:00:00Z"
  },
  {
    "id": "msg-uuid",
    "role": "assistant",
    "content": "Based on your stats...",
    "created_at": "2026-03-04T11:00:01Z"
  }
]
```

---

## 8. Scripts

### List Scripts

```http
GET /api/scripts?category=apertura
Authorization: Bearer <token>
```

**Query Parameters:**
- `category`: Filter by category (apertura, presentacion, cierre, etc.)

**Response (200):**
```json
[
  {
    "id": "script-uuid",
    "title": "Script de Apertura - Web Leads",
    "category": "apertura",
    "content": "Hola, soy [NOMBRE] de SoftVibes...",
    "tags": ["apertura", "web", "corto"],
    "created_by": "user-uuid",
    "is_active": true,
    "created_at": "2026-03-01T09:00:00Z",
    "updated_at": "2026-03-01T09:00:00Z"
  }
]
```

### Create Script

```http
POST /api/scripts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Script de Cierre - Vacacionales",
  "category": "cierre",
  "content": "Considerando que es propiedad vacacional...",
  "tags": ["cierre", "vacacional", "inversion"]
}
```

**Response (200):**
```json
{
  "message": "Script creado exitosamente",
  "id": "script-uuid"
}
```

### Get Script

```http
GET /api/scripts/{script_id}
Authorization: Bearer <token>
```

---

## 9. Goals

### Create/Update Goals

```http
POST /api/goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "ventas_mes": 10,
  "ingresos_objetivo": 1000000,
  "leads_contactados": 100,
  "tasa_conversion": 15,
  "apartados_mes": 20,
  "periodo": "mensual"
}
```

**Response (200):**
```json
{
  "message": "Metas guardadas exitosamente",
  "goal_id": "goal-uuid"
}
```

### Get Goals

```http
GET /api/goals
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "ventas_mes": 10,
  "ingresos_objetivo": 1000000,
  "leads_contactados": 100,
  "tasa_conversion": 15.0,
  "apartados_mes": 20,
  "periodo": "mensual"
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

Currently not enforced. Will be added in future versions.

---

## Pagination

List endpoints support up to 500 items. Use `limit` parameter for smaller sets.

---

## Versioning

Current API version: **v1.0**

API versioning will be handled via URL prefix in future:
```
/api/v1/leads
/api/v2/leads
```

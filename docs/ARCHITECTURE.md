# LeadVibes - Architecture Documentation

> **LeadVibes CRM** - Plataforma de gestión de leads con gamificación y asistente de IA para corredores de propiedades inmobiliarias.

**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2026-03-04

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Backend API](#4-backend-api)
5. [Frontend Application](#5-frontend-application)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [AI Integration](#8-ai-integration)
9. [Gamification System](#9-gamification-system)
10. [Deployment](#10-deployment)

---

## 1. Overview

LeadVibes is a multi-tenant CRM platform designed specifically for real estate brokers. It combines lead management, gamification, and AI-powered assistance to help brokers close more deals.

### Key Features

- **Multi-tenant Architecture**: Each tenant (real estate agency) has isolated data
- **Lead Management**: Track leads through the sales pipeline (nuevo → venta)
- **Gamification**: Points system and leaderboard to motivate brokers
- **AI Assistant**: Chat interface for sales coaching and lead analysis
- **Activity Tracking**: Log all broker interactions with leads
- **Sales Scripts**: Repository of customizable sales scripts
- **Dashboard**: Real-time statistics and performance metrics

### Business Model

```
┌─────────────────────────────────────────────────────────────┐
│  Tenant (Real Estate Agency)                                 │
│  ├── Admin (manages brokers, rules, scripts)                │
│  ├── Manager (oversees team performance)                    │
│  └── Brokers (work leads, earn points)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │  Lead List   │  │   AI Chat Interface  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI/Python)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Layer  │  │  Business    │  │   AI Service Layer   │  │
│  │  (JWT)       │  │  Logic       │  │   (LiteLLM/OpenAI)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Async Driver
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB (Database)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  users   │  │  leads   │  │activities│  │point_ledger  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Strategy

LeadVibes uses **shared database, tenant-isolated data** pattern:

```python
# Every data document includes tenant_id
{
  "id": "uuid",
  "tenant_id": "tenant-{user_id[:8]}",  # Isolation key
  "data": "..."
}

# Query isolation (server.py:367)
query = {"tenant_id": current_user["tenant_id"]}
```

---

## 3. Technology Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Python | 3.13+ |
| Framework | FastAPI | 0.110+ |
| Database | MongoDB | 8 (via Motor async driver) |
| Auth | JWT | python-jose |
| Validation | Pydantic | 2.x |
| AI/LLM | LiteLLM | 1.80+ |
| Testing | pytest | 9.0+ |
| Linting | ruff, black, flake8 | - |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | React | 19.0 |
| Build Tool | CRACO | 7.1+ |
| Styling | TailwindCSS | 3.4+ |
| UI Components | Radix UI | - |
| State | React Context | - |
| Routing | React Router | 7.5+ |

### DevOps

| Component | Technology |
|-----------|-----------|
| Container | Docker |
| Orchestration | Docker Compose |
| Reverse Proxy | (Future: Nginx) |
| CI/CD | (To be defined) |

---

## 4. Backend API

### API Structure

All endpoints are prefixed with `/api`:

```
/api
├── /auth          (Authentication)
├── /goals         (User goals/KPIs)
├── /dashboard     (Statistics & analytics)
├── /leads         (Lead management)
├── /activities    (Activity tracking)
├── /brokers       (Broker management)
├── /gamification (Points & rules)
├── /chat          (AI assistant)
└── /scripts       (Sales scripts)
```

### Core Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user + create tenant |
| POST | `/auth/login` | Login + return JWT token |
| GET | `/auth/me` | Get current user profile |

**Register Flow** (server.py:70-143):
```python
1. Validate email uniqueness
2. Create user with tenant_id = f"tenant-{user_id[:8]}"
3. Seed default gamification rules
4. Seed default sales scripts
5. Return JWT token + user profile
```

#### Leads (`/api/leads`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leads` | List leads (filters: status, priority, broker, search) |
| GET | `/leads/{id}` | Get lead details + activities |
| POST | `/leads` | Create new lead |
| PUT | `/leads/{id}` | Update lead |
| POST | `/leads/{id}/analyze` | AI lead analysis |
| POST | `/leads/{id}/generate-script` | Generate sales script |

**Lead Status Pipeline** (models.py:14-21):
```
nuevo → contactado → calificacion → presentacion
                                  → apartado → venta
                                  ↘ perdido
```

#### Activities (`/api/activities`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/activities` | Log activity + award points |
| GET | `/activities` | List activities (filters: lead_id, broker_id) |

**Activity Types** (models.py:29-37):
- `llamada` - Phone call
- `whatsapp` - WhatsApp message
- `email` - Email sent
- `zoom` - Video presentation
- `visita` - In-person visit
- `apartado` - Property reserved
- `venta` - Sale closed

#### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Current user statistics |
| GET | `/dashboard/leaderboard` | Monthly broker rankings |
| GET | `/dashboard/recent-activity` | Recent team activities |

**Stats Calculation** (server.py:242-284):
```python
{
  "total_points": sum(point_ledger.points),
  "points_goal": ventas_goal * 30 + apartados_goal * 15 + 50,
  "apartados": count(leads.status == "apartado"),
  "ventas": count(leads.status == "venta"),
  "conversion_rate": ventas / total_leads * 100
}
```

#### Gamification (`/api/gamification`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gamification/rules` | List active point rules |
| POST | `/gamification/rules` | Create new rule (admin/manager) |
| GET | `/gamification/points` | Point ledger history |

**Default Point Rules** (seed_data.py):
```python
{
  "llamada": 10,
  "whatsapp": 5,
  "email": 5,
  "zoom": 20,
  "visita": 30,
  "apartado": 50,
  "venta": 100
}
```

#### AI Chat (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send message to AI assistant |
| GET | `/chat/history` | Get conversation history |

**AI Context** (server.py:691-712):
```python
{
  "user_goals": goal document,
  "stats": {
    "total_points": current_points,
    "ventas": sales_count,
    "apartados": reservations_count
  }
}
```

---

## 5. Frontend Application

### Directory Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Radix UI components
│   │   └── ...         # Feature components
│   ├── context/        # React Context providers
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── lib/            # Utilities
│   │   └── utils.js
│   └── index.js        # Entry point
├── package.json
├── craco.config.js     # Build configuration
└── tailwind.config.js  # Styling configuration
```

### Key Components

#### Authentication Context (`context/AuthContext.js`)

```javascript
AuthContext.Provider
├── login(email, password)
├── register(userData)
├── logout()
├── updateUser()
└── State: { user, token, isAuthenticated }
```

#### Routing

- `/` - Dashboard (home)
- `/leads` - Lead list
- `/leads/:id` - Lead details
- `/leaderboard` - Gamification rankings
- `/scripts` - Sales scripts
- `/chat` - AI assistant

---

## 6. Database Schema

### Collections

#### `users`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "email": "user@example.com",
  "password_hash": "bcrypt",
  "name": "Full Name",
  "role": "broker|manager|admin",
  "tenant_id": "tenant-xxxxxx",
  "avatar_url": "https://...",
  "phone": "+52...",
  "is_active": true,
  "onboarding_completed": false,
  "created_at": ISODate
}
```

#### `leads`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "tenant_id": "tenant-xxxxxx",
  "name": "Lead Name",
  "email": "lead@example.com",
  "phone": "+52...",
  "status": "nuevo|contactado|...|venta|perdido",
  "priority": "baja|media|alta|urgente",
  "source": "web|facebook|referral",
  "budget_mxn": 5000000,
  "property_interest": "Casa en Cancún",
  "notes": "Interested in beachfront...",
  "assigned_broker_id": "broker-uuid",
  "ai_analysis": { ... },
  "intent_score": 75,
  "next_action": "Call to confirm viewing",
  "last_contact": ISODate,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### `activities`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "tenant_id": "tenant-xxxxxx",
  "broker_id": "broker-uuid",
  "lead_id": "lead-uuid",
  "activity_type": "llamada|whatsapp|...",
  "description": "Called to discuss...",
  "outcome": "Interested in 3 properties",
  "points_earned": 10,
  "created_at": ISODate
}
```

#### `point_ledger`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "tenant_id": "tenant-xxxxxx",
  "broker_id": "broker-uuid",
  "points": 10,
  "action": "llamada",
  "description": "Puntos por llamada",
  "lead_id": "lead-uuid",
  "activity_id": "activity-uuid",
  "created_at": ISODate
}
```

#### `gamification_rules`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "tenant_id": "tenant-xxxxxx",
  "action": "llamada",
  "points": 10,
  "description": "Puntos por realizar llamada",
  "icon": "phone",
  "is_active": true,
  "created_at": ISODate
}
```

#### `scripts`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "tenant_id": "tenant-xxxxxx",
  "created_by": "user-uuid",
  "title": "Script de Apertura",
  "category": "apertura",
  "content": "Hola, soy... llamé de...",
  "tags": ["apertura", "presentación"],
  "is_active": true,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### `goals`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "user_id": "user-uuid",
  "tenant_id": "tenant-xxxxxx",
  "ventas_mes": 5,
  "ingresos_objetivo": 500000,
  "leads_contactados": 50,
  "tasa_conversion": 10,
  "apartados_mes": 10,
  "periodo": "mensual",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### `chat_messages`
```javascript
{
  "_id": ObjectId,
  "id": "uuid",
  "user_id": "user-uuid",
  "tenant_id": "tenant-xxxxxx",
  "role": "user|assistant",
  "content": "Message text...",
  "created_at": ISODate
}
```

### Indexes

```javascript
// Performance-critical indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ tenant_id: 1 })
db.leads.createIndex({ tenant_id: 1, status: 1 })
db.leads.createIndex({ tenant_id: 1, assigned_broker_id: 1 })
db.activities.createIndex({ tenant_id: 1, broker_id: 1 })
db.point_ledger.createIndex({ tenant_id: 1, broker_id: 1 })
db.chat_messages.createIndex({ user_id: 1, created_at: -1 })
```

---

## 7. Authentication & Authorization

### JWT Flow

```
┌─────────────┐     POST /auth/login      ┌──────────────┐
│   Frontend  │ ────────────────────────> │   Backend    │
│  (React)    │                           │  (FastAPI)   │
└─────────────┘                           └──────────────┘
       │                                         │
       │   { email, password }                    │
       │                                         │
       │                                         ├── Verify password
       │                                         ├── Create JWT
       │                                         │   payload: {
       │                                         │     sub: user_id,
       │                                         │     tenant_id: ...,
       │                                         │     email: ...,
       │                                         │     role: ...
       │                                         │   }
       │                                         │
       │   { access_token, user }                │
       │ <───────────────────────────────────────┘
       │
       ├── Store token in localStorage
       └── Include in Authorization header
           Authorization: Bearer <token>
```

### Authorization Middleware

```python
# auth.py
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Decode JWT and return user dict"""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    return {
        "user_id": user_id,
        "tenant_id": payload.get("tenant_id"),
        "email": payload.get("email"),
        "role": payload.get("role")
    }

async def require_role(roles: List[str]):
    """Role-based access control"""
    async def check(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return current_user
    return check
```

### Role Hierarchy

| Role | Permissions |
|------|-------------|
| `admin` | Full tenant control + user management |
| `manager` | View team stats + create gamification rules |
| `broker` | Work assigned leads + log activities |

---

## 8. AI Integration

### AI Service Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    AI Service Layer                        │
│  ┌────────────────┐  ┌────────────────┐                  │
│  │  Lead Analysis │  │ Sales Scripts  │                  │
│  │  (analyze_lead)│  │ (generate_...)  │                  │
│  └────────┬───────┘  └────────┬───────┘                  │
│           │                   │                           │
│           └─────────┬─────────┘                           │
│                     ▼                                     │
│           ┌──────────────────┐                            │
│           │   LiteLLM Proxy  │                            │
│           │  (ai_service.py)  │                            │
│           └─────────┬─────────┘                            │
│                     │                                     │
│      ┌──────────────┼──────────────┐                      │
│      ▼              ▼              ▼                      │
│  ┌────────┐   ┌────────┐    ┌─────────┐                  │
│  │ OpenAI │   │ Claude │    │ Google  │                  │
│  │  GPT-4 │   │  AI    │    │  Gemini │                  │
│  └────────┘   └────────┘    └─────────┘                  │
└───────────────────────────────────────────────────────────┘
```

### AI Features

#### 1. Lead Analysis (`POST /api/leads/{id}/analyze`)

Analyzes lead information and provides:
- **Intent Score** (0-100): Likelihood to purchase
- **Next Action**: Recommended follow-up
- **Analysis**: Qualitative assessment

**Implementation** (ai_service.py):
```python
async def analyze_lead(lead: dict) -> dict:
    prompt = f"""
    Analyze this real estate lead:
    - Name: {lead['name']}
    - Budget: ${lead['budget_mxn']:,} MXN
    - Interest: {lead['property_interest']}
    - Source: {lead['source']}

    Provide:
    1. Intent score (0-100)
    2. Next best action
    3. Qualitative analysis
    """
    response = await llm.chat([UserMessage(content=prompt)])
    return parse_response(response)
```

#### 2. Sales Script Generation (`POST /api/leads/{id}/generate-script`)

Generates personalized scripts:
- **apertura**: Initial contact
- **presentación**: Property showcase
- **cierre**: Closing techniques

#### 3. AI Chat Assistant (`POST /api/chat`)

Context-aware coaching assistant with access to:
- User goals and KPIs
- Current performance stats
- Sales history

---

## 9. Gamification System

### Points Logic

```python
# server.py:492-539
async def create_activity(activity_data: ActivityCreate):
    # 1. Look up point value for this activity type
    rule = await db.gamification_rules.find_one(
        {"action": activity_data.activity_type}
    )
    points_earned = rule["points"] if rule else 0

    # 2. Create activity record
    activity_doc = {
        "points_earned": points_earned,
        ...
    }
    await db.activities.insert_one(activity_doc)

    # 3. Record in point ledger
    if points_earned > 0:
        await db.point_ledger.insert_one({
            "points": points_earned,
            "action": activity_data.activity_type,
            ...
        })

    return {"points_earned": points_earned}
```

### Leaderboard Algorithm

```python
# server.py:286-333
async def get_leaderboard():
    brokers = await db.users.find({"role": {"$in": ["broker", "manager"]}})

    for broker in brokers:
        # Aggregate points
        pipeline = [
            {"$match": {"broker_id": broker["id"]}},
            {"$group": {"_id": None, "total": {"$sum": "$points"}}}
        ]
        total_points = aggregate(pipeline)

        # Count conversions
        ventas = count_leads(status="venta", broker_id=broker["id"])
        apartados = count_leads(status="apartado", broker_id=broker["id"])

        leaderboard.append({
            "broker": broker["name"],
            "total_points": total_points,
            "ventas": ventas,
            "apartados": apartados
        })

    # Sort by points descending
    return sorted(leaderboard, key=lambda x: x["total_points"], reverse=True)
```

### Point Rules (Default)

| Action | Points | Description |
|--------|--------|-------------|
| `llamada` | 10 | Phone call completed |
| `whatsapp` | 5 | WhatsApp message sent |
| `email` | 5 | Email sent |
| `zoom` | 20 | Video presentation done |
| `visita` | 30 | In-person property visit |
| `apartado` | 50 | Property reserved |
| `venta` | 100 | Sale closed |

---

## 10. Deployment

### Docker Compose Stack

```yaml
services:
  mongodb:
    image: mongo:8
    ports:
      - "27018:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      dockerfile: Dockerfile.backend
    ports:
      - "8001:8000"
    environment:
      - MONGO_URL=mongodb://mongodb:27017/leadvibes
      - DB_NAME=leadvibes
      - JWT_SECRET_KEY=...
    depends_on:
      - mongodb

  frontend:
    build:
      dockerfile: Dockerfile.frontend
    ports:
      - "3001:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8001
    depends_on:
      - backend
```

### Environment Variables

**Backend** (.env):
```bash
MONGO_URL=mongodb://mongodb:27017/leadvibes
DB_NAME=leadvibes
JWT_SECRET_KEY=your-secret-key-here
CORS_ORIGINS=*
```

**Frontend**:
```bash
REACT_APP_API_URL=http://localhost:8001
```

### Local Development

```bash
# Start all services
cd /root/leadvibes
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after changes
docker compose up -d --build backend
```

### Production Considerations

| Area | Recommendation |
|------|----------------|
| **Reverse Proxy** | Use Nginx/Caddy for SSL termination |
| **MongoDB** | Use Atlas or managed replica set |
| **Secrets** | Use environment variables or vault |
| **Monitoring** | Add Sentry (frontend), Prometheus (backend) |
| **CI/CD** | GitHub Actions or GitLab CI |
| **Backups** | MongoDB automated snapshots |

---

## Appendix A: API Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "detail": "Error message description"
}
```

### Lead Detail Response
```json
{
  "id": "lead-uuid",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+525512345678",
  "status": "contactado",
  "priority": "alta",
  "budget_mxn": 5000000,
  "property_interest": "Casa en Cancún",
  "assigned_broker": {
    "id": "broker-uuid",
    "name": "María González",
    "avatar_url": "https://..."
  },
  "activities": [
    {
      "activity_type": "llamada",
      "description": "Initial contact",
      "points_earned": 10,
      "created_at": "2026-03-04T12:00:00Z"
    }
  ],
  "ai_analysis": {
    "intent_score": 85,
    "next_action": "Schedule property visit",
    "analysis": "High budget, specific location interest..."
  }
}
```

---

## Appendix B: Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 422 | Unprocessable Entity (Pydantic validation) |
| 500 | Internal Server Error |

---

**Document Version:** 1.0.0
**Authors:** MoAI-ADK Auto-Generated
**License:** Proprietary - SoftVibes Lab

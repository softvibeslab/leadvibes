# Variables de entorno — Nuevas y modificadas

Referencia completa de todas las variables necesarias para las 3 fases.  
Agregar al archivo `backend/.env` (y al servidor de producción en Hostinger).

---

## Variables nuevas por fase

### Fase 2 — Redis

```bash
# URL de conexión a Redis
# Local/Docker: redis://redis:6379  (nombre del servicio en docker-compose)
# Producción:   redis://localhost:6379  (si Redis está en el mismo servidor)
REDIS_URL=redis://redis:6379
```

### Fase 3 — Supabase

```bash
# URL del proyecto Supabase
# Encontrar en: Supabase Dashboard → Project Settings → API → Project URL
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Clave de servicio (service_role) — NO la anon key
# Esta clave bypasea Row Level Security — solo usar en el backend
# Encontrar en: Supabase Dashboard → Project Settings → API → service_role
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### OpenAI (verificar que existe, puede estar con otro nombre)

```bash
# Necesario para embeddings en Fase 3
# Si ya existe como EMERGENT_LLM_KEY, crear un alias o agregar este:
OPENAI_API_KEY=sk-...
```

---

## `.env` completo de referencia

```bash
# ═══════════════════════════════════════
# BACKEND — Variables de entorno completas
# Rovi CRM — backend/.env
# ═══════════════════════════════════════

# ── Base de datos ─────────────────────
MONGO_URL=mongodb://mongodb:27017
DB_NAME=rovi_crm

# ── Autenticación ─────────────────────
JWT_SECRET=<cambia_esto_por_un_string_aleatorio_largo>

# ── CORS ──────────────────────────────
CORS_ORIGINS=http://localhost:3000,https://tu-dominio.com

# ── IA / OpenAI ───────────────────────
EMERGENT_LLM_KEY=<tu_openai_key>     # existente
OPENAI_API_KEY=<tu_openai_key>        # NUEVO — mismo valor que EMERGENT_LLM_KEY

# ── Integraciones existentes ──────────
VAPI_API_KEY=<tu_vapi_key>
TWILIO_ACCOUNT_SID=<tu_sid>
TWILIO_AUTH_TOKEN=<tu_token>
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=SG.<tu_key>

# ── Google Calendar ───────────────────
GOOGLE_CLIENT_ID=<tu_client_id>
GOOGLE_CLIENT_SECRET=<tu_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/oauth/google/callback

# ── Redis (NUEVO — Fase 2) ────────────
REDIS_URL=redis://redis:6379

# ── Supabase (NUEVO — Fase 3) ─────────
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Variables de entorno en producción (Hostinger)

Agregar en el servidor de producción. Si usas el docker-compose de Hostinger, editar el archivo `.env` en el servidor:

```bash
# SSH al servidor
ssh root@srv1318804.hstgr.cloud

# Editar .env
nano /ruta/al/proyecto/.env

# Agregar las variables nuevas al final
REDIS_URL=redis://redis:6379
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...

# Reiniciar servicios para que tomen los nuevos valores
docker compose -f docker-compose.hostinger.yml up -d --build backend
```

---

## Verificación de variables

Agregar este bloque al inicio de `backend/server.py` para que el servidor falle rápido si falta alguna variable crítica:

```python
import os
import sys

REQUIRED_ENV_VARS = [
    "MONGO_URL",
    "DB_NAME",
    "JWT_SECRET",
]

PHASE_2_VARS = ["REDIS_URL"]
PHASE_3_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "OPENAI_API_KEY"]

def check_env_vars():
    missing = [v for v in REQUIRED_ENV_VARS if not os.environ.get(v)]
    if missing:
        print(f"ERROR: Variables de entorno faltantes: {missing}")
        sys.exit(1)

    # Warnings para Fase 2 y 3 (no críticos para arrancar)
    for v in PHASE_2_VARS + PHASE_3_VARS:
        if not os.environ.get(v):
            print(f"WARNING: {v} no está configurado — funcionalidad limitada")

check_env_vars()
```

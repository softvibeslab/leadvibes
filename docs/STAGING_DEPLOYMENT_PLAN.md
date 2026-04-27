# 🎯 PLAN COMPLETO: Nuevo Deployment Aislado (Staging)

## 📋 **RESUMEN EJECUTIVO**

Crear un **nuevo entorno de staging/testing** completamente aislado de producción para:
- ✅ Testing de SendGrid campaigns sin riesgo a producción
- ✅ Desarrollo de webhook integration para leads externos  
- ✅ Sandbox para nuevas funcionalidades
- ✅ Base de datos separada con datos de prueba

**REGLA DE ORO**: **NO afectar el deployment actual** (puertos 13000, 18080, 27027)

---

## 🏗️ **ARQUITECTURA PROPUESTA**

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCCIÓN (EXISTENTE)                      │
│  Frontend: localhost:13000  → rovi-frontend                │
│  Backend:  localhost:18080  → rovi-backend                 │
│  MongoDB:  localhost:27027  → rovi-mongodb                 │
│  Database: rovi_crm                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  STAGING (NUEVO) ✨                          │
│  Frontend: localhost:2403   → rovi-staging-frontend   ⭐   │
│  Backend:  localhost:1607   → rovi-staging-backend    ⭐   │
│  MongoDB:  localhost:2504   → rovi-staging-mongodb    ⭐   │
│  Webhook:  localhost:2906   → rovi-webhook-server     ⭐   │
│  Database: rovi_crm_staging                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **PLAN DE IMPLEMENTACIÓN**

### **FASE 1: Preparación de Archivos** ✅ COMPLETADO

**Archivos creados:**
1. ✅ `docker-compose.staging.yml` - Configuración Docker Compose
2. ✅ `.env.staging` - Variables de entorno aisladas
3. ✅ `scripts/staging-deploy.sh` - Script de gestión del entorno
4. ✅ `scripts/test_webhook_staging.sh` - Script de testing
5. ✅ `backend/server.py` - Endpoint `/api/webhooks/external-lead`
6. ✅ `backend/auth.py` - Función `get_current_user_optional`

### **FASE 2: Levantar Entorno de Staging**

**Comandos a ejecutar:**

```bash
# 1. Verificar que producción no se afecte
./scripts/staging-deploy.sh compare

# 2. Levantar entorno staging
./scripts/staging-deploy.sh up

# 3. Verificar health
./scripts/staging-deploy.sh health

# 4. Ver status
./scripts/staging-deploy.sh status
```

**Resultado esperado:**
- ✅ 4 nuevos contenedores corriendo
- ✅ Base de datos separada (rovi_crm_staging)
- ✅ Frontend accesible en http://localhost:2403
- ✅ Backend accesible en http://localhost:1607
- ✅ MongoDB accesible en localhost:2504
- ✅ Webhook server accesible en http://localhost:2906

### **FASE 3: Testing de Webhooks**

**Procesar el archivo webhook_lead_example.json:**

```bash
# Ejecutar test de webhook
./scripts/test_webhook_staging.sh

# O manualmente:
curl -X POST http://localhost:2906/webhooks/lead \
  -H "Content-Type: application/json" \
  -d @webhook_lead_example.json
```

**Resultado esperado:**
- ✅ Webhook recibido y procesado
- ✅ Lead creado en base de datos staging
- ✅ Email automático enviado (si está configurado)
- ✅ Respuesta con lead_id, lead_score, next_action

### **FASE 4: Testing de SendGrid Campaigns**

**Crear y probar campaña de email en staging:**

```bash
# 1. Acceder a frontend staging
open http://localhost:2403

# 2. Login con credenciales de staging
# (Crear usuario nuevo en staging)

# 3. Crear plantilla de email
# Campaigns → Templates → Nueva Plantilla

# 4. Crear campaña de prueba
# Campaigns → Nueva Campaña → Email

# 5. Enviar a segmento pequeño
# (Sin riesgo a producción)
```

### **FASE 5: Integración Continua**

**Opcional: Configurar CI/CD**

```bash
# Git branch para staging
git checkout -b develop

# Pull requests a develop van a staging automático
# Pull requests a main van a producción automático
```

---

## 📊 **COMPARATIVA DE ENTORNOS**

| Característica | Producción | Staging |
|----------------|------------|---------|
| **Frontend** | :13000 | :2403 |
| **Backend** | :18080 | :1607 |
| **MongoDB** | :27027 | :2504 |
| **Webhook** | N/A | :2906 |
| **Database** | rovi_crm | rovi_crm_staging |
| **Contenedores** | rovi-* | rovi-staging-* |
| **Datos** | Reales ✅ | Prueba 🧪 |
| **Emails** | SendGrid real | SendGrid test |
| **Riesgo** | Alto 🔴 | Bajo 🟢 |
| **Propósito** | Producción | Development/Testing |

---

## 🎯 **CARACTERÍSTICAS DEL NUEVO ENTORNO**

### **1. AISLAMIENTO COMPLETO**
- ✅ **Base de datos separada**: `rovi_crm_staging`
- ✅ **Contenedores separados**: `rovi-staging-*`
- ✅ **Puertos diferentes**: 2403, 1607, 2504, 2906
- ✅ **Secretos diferentes**: JWT, MongoDB password
- ✅ **Datos de prueba**: Sin riesgo a producción

### **2. WEBHOOK SERVER (NUEVO)**
- ✅ **Endpoint**: `POST /webhooks/lead`
- ✅ **Integración externa**: Facebook, WhatsApp, etc.
- ✅ **Procesamiento inteligente**:
  - Extracción automática de datos
  - Scoring de leads
  - Asignación de prioridad
  - Email automático de bienvenida
- ✅ **Formato compatible**: Con `webhook_lead_example.json`

### **3. FEATURE FLAGS**
- ✅ **Environment variable**: `ENVIRONMENT=staging`
- ✅ **Debug mode**: `DEBUG=true`
- ✅ **SendGrid testing**: Sin afectar producción
- ✅ **Webhook development**: Sandbox seguro

### **4. GESTIÓN SIMPLIFICADA**
- ✅ **Script único**: `./scripts/staging-deploy.sh`
- ✅ **Comandos intuitivos**: up, down, restart, logs, status
- ✅ **Backup/Restore**: Para datos de staging
- ✅ **Health checks**: Automáticos
- ✅ **MongoDB access**: Acceso directo via script

---

## 🔧 **COMANDOS DISPONIBLES**

### **Gestión del Entorno**

```bash
# Levantar entorno
./scripts/staging-deploy.sh up

# Detener entorno
./scripts/staging-deploy.sh down

# Reiniciar entorno
./scripts/staging-deploy.sh restart

# Ver status
./scripts/staging-deploy.sh status

# Health check
./scripts/staging-deploy.sh health

# Comparar con producción
./scripts/staging-deploy.sh compare
```

### **Logs y Debugging**

```bash
# Ver todos los logs
./scripts/staging-deploy.sh logs

# Ver logs de un servicio específico
./scripts/staging-deploy.sh logs backend-staging
./scripts/staging-deploy.sh logs frontend-staging
./scripts/staging-deploy.sh logs webhook-server

# Acceder a MongoDB staging
./scripts/staging-deploy.sh mongo
```

### **Gestión de Datos**

```bash
# Crear backup
./scripts/staging-deploy.sh backup

# Restaurar backup
./scripts/staging-deploy.sh restore backups/staging/staging_backup_20260126_120000.gz

# Reset completo (eliminar datos)
./scripts/staging-deploy.sh reset
```

### **Testing**

```bash
# Test de webhook
./scripts/test_webhook_staging.sh

# Test manual de webhook
curl -X POST http://localhost:2906/webhooks/lead \
  -H "Content-Type: application/json" \
  -d @webhook_lead_example.json
```

---

## 🔐 **SEGURIDAD Y AISLAMIENTO**

### **Protecciones Implementadas:**

1. **Verificación de puertos libres** antes de levantar
2. **Nombres de contenedores únicos** con prefijo `staging`
3. **Base de datos separada** con nombre diferente
4. **Secretos diferentes** (JWT, MongoDB passwords)
5. **Network aislada** (`rovi-staging-network`)
6. **Volumes separados** (`mongodb_staging_data`)
7. **Environment tags** para tracking

### **Reglas de Seguridad:**

- ✅ **NO usar datos reales** en staging
- ✅ **NO exponer staging** a internet sin firewall
- ✅ **ROTAR passwords** regularmente
- ✅ **BACKUP antes de reset**
- ✅ **MONITOREAR logs** por actividad inusual

---

## 📈 **FLUJO DE TRABAJO RECOMENDADO**

### **Development Workflow:**

```
1. Desarrollo local (puertos estándar)
   └─> Git branch: feature/nueva-funcionalidad

2. Testing en staging (nuevos puertos)
   └─> feature/nueva-funcionalidad → develop → staging

3. Validación en staging
   └─> Testing completo sin riesgo

4. Deploy a producción
   └─> develop → main → producción
```

### **Webhook Testing:**

```
1. Preparar webhook_lead_example.json
   └─> Configurar datos de prueba

2. Enviar a staging webhook
   └─> POST http://localhost:2906/webhooks/lead

3. Verificar en UI de staging
   └─> http://localhost:2403 → Leads

4. Validar procesamiento
   └─> Lead creado, score calculado, email enviado

5. Aprobar para producción
   └─> Merge to main
```

---

## 🚨 **MANEJO DE ERRORES**

### **Si los puertos están ocupados:**

```bash
# Ver qué está usando los puertos
lsof -i :2403  # Frontend
lsof -i :1607  # Backend
lsof -i :2504  # MongoDB
lsof -i :2906  # Webhook

# Matar proceso si necesario
kill -9 <PID>

# O cambiar puertos en .env.staging
```

### **Si los contenedores no inician:**

```bash
# Ver logs detallados
docker compose -f docker-compose.staging.yml logs

# Reconstruir imágenes
docker compose -f docker-compose.staging.yml up -d --build --force-recreate

# Reset completo (último recurso)
./scripts/staging-deploy.sh reset
```

### **Si el webhook no responde:**

```bash
# Ver logs del webhook server
./scripts/staging-deploy.sh logs webhook-server

# Verificar backend
curl http://localhost:1607/api/health

# Verificar webhook server
curl http://localhost:2906/webhooks/health

# Test manual
curl -X POST http://localhost:2906/webhooks/lead \
  -H "Content-Type: application/json" \
  -d '{"webhook_lead_data": {"event_type": "test"}}'
```

---

## 🎯 **SIGUIENTES PASOS**

### **Inmediato (Hoy):**

1. **Levantar entorno staging**
   ```bash
   ./scripts/staging-deploy.sh up
   ```

2. **Probar webhook**
   ```bash
   ./scripts/test_webhook_staging.sh
   ```

3. **Verificar en UI**
   ```bash
   open http://localhost:2403
   ```

### **Corto (Esta semana):**

1. **Crear datos de prueba en staging**
2. **Probar SendGrid campaigns en staging**
3. **Validar integración de webhooks externos**
4. **Documentar bugs encontrados**

### **Mediano (Próximo sprint):**

1. **Migrar developments a staging-first workflow**
2. **Configurar CI/CD para staging**
3. **Automatizar testing en staging**
4. **Implementar monitoring**

---

## 📚 **DOCUMENTACIÓN CREADA**

**Archivos nuevos:**
1. `docker-compose.staging.yml` - Configuración Docker
2. `.env.staging` - Variables de entorno
3. `scripts/staging-deploy.sh` - Gestión del entorno
4. `scripts/test_webhook_staging.sh` - Testing webhooks
5. `backend/server.py` - Endpoint `/api/webhooks/external-lead`
6. `backend/auth.py` - Función `get_current_user_optional`

**Documentación:**
- Este plan completo
- Guías de SendGrid ya existentes
- Ejemplo de webhook: `webhook_lead_example.json`

---

## ✅ **CRITERIOS DE ÉXITO**

El nuevo entorno staging será exitoso cuando:

- ✅ **Producción no se afecta**: Contenedores originales intactos
- ✅ **Staging funciona**: Todos los servicios healthy
- ✅ **Webhook procesa**: Leads creados correctamente
- ✅ **SendGrid funciona**: Emails de prueba enviados
- ✅ **UI funcional**: Frontend staging accesible
- ✅ **Datos separados**: Staging data isolated
- ✅ **Gestión fácil**: Script intuitivo y robusto

---

## 🎉 **RESUMEN**

**Objetivo**: Crear entorno staging aislado para testing seguro  
**Tiempo estimado**: 15-20 minutos  
**Riesgo**: Mínimo (no afecta producción)  
**Beneficio**: Testing sandbox para desarrollo  
**Status**: ✅ **LISTO PARA IMPLEMENTAR**

**¿Procedemos con el deployment?** 🚀
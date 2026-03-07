# Guía de Deploy - Rovi CRM

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Preparación del Entorno](#preparación-del-entorno)
4. [Deploy del Backend](#deploy-del-backend)
5. [Deploy del Frontend](#deploy-del-frontend)
6. [Base de Datos](#base-de-datos)
7. [Configuración de Producción](#configuración-de-producción)
8. [Dominios y SSL](#dominios-y-ssl)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Mantenimiento](#mantenimiento)

---

## Visión General

Esta guía cubre el deployment completo de Rovi CRM, un sistema compuesto por:

- **Backend**: FastAPI + MongoDB
- **Frontend**: React SPA + CRACO

### Arquitectura de Producción

```
┌─────────────────┐
│  CloudFlare /   │
│   Nginx / SSL   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐  ┌─▼─────────┐
│ Front │  │  Backend   │
│ React │  │  FastAPI   │
└───────┘  └─────┬─────┘
                 │
         ┌───────▼────────┐
         │   MongoDB      │
         │   (Atlas/VPS)  │
         └────────────────┘
```

---

## Requisitos Previos

### Servidor Requerido

**Mínimo**:
- CPU: 2 vCPU
- RAM: 4 GB
- Disco: 40 GB SSD

**Recomendado**:
- CPU: 4 vCPU
- RAM: 8 GB
- Disco: 80 GB SSD

### Software Requerido

- **Ubuntu 22.04 LTS** o superior
- **Python 3.10+**
- **Node.js 18+** (con npm/yarn)
- **MongoDB 6.0+** o MongoDB Atlas
- **Nginx** (como reverse proxy)
- **PM2** (process manager)

### Servicios Externos

- **MongoDB Atlas** (recomendado) o VPS con MongoDB
- **Dominio** configurado con DNS
- **Certificado SSL** (Let's Encrypt o CloudFlare)

---

## Preparación del Entorno

### 1. Acceso al Servidor

```bash
# Conectar via SSH
ssh usuario@tu-servidor.com

# Actualizar sistema
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Dependencias Básicas

```bash
# Instalar Python y pip
sudo apt install -y python3 python3-pip python3-venv

# Instalar Node.js y yarn
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2

# Instalar Git
sudo apt install -y git
```

### 3. Configurar Firewall

```bash
# Permitir SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Deploy del Backend

### Paso 1: Clonar Repositorio

```bash
# Crear directorio
sudo mkdir -p /var/www/rovi-crm
cd /var/www/rovi-crm

# Clonar repositorio
sudo git clone https://github.com/tu-repo/leadvibes.git .

# O copiar archivos via SCP
# scp -r ./lead-vibes usuario@servidor:/var/www/rovi-crm
```

### Paso 2: Crear Entorno Virtual

```bash
cd backend

# Crear venv
python3 -m venv venv

# Activar venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 3: Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

```bash
# Copiar y configurar estas variables:

# Base de Datos
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm?retryWrites=true&w=majority
DB_NAME=rovi_crm

# JWT (Generar clave segura)
JWT_SECRET=tu_clave_super_segura_aqui_minimo_32_caracteres
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# IA (Emergent Integrations)
EMERGENT_LLM_KEY=tu_api_key_de_emergent

# Integraciones (Configurables por usuario en Settings)
# VAPI
VAPI_API_KEY=
VAPI_PHONE_NUMBER_ID=
VAPI_ASSISTANT_ID=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_SENDER_EMAIL=
SENDGRID_SENDER_NAME=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Environment
ENVIRONMENT=production
DEBUG=false
```

### Paso 4: Configurar PM2

```bash
# Crear configuración de PM2
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'rovi-backend',
    script: 'server.py',
    interpreter: 'python3',
    interpreter_args: '-m uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8000',
    cwd: '/var/www/rovi-crm/backend',
    env: {
      PYTHONPATH: '/var/www/rovi-crm/backend'
    },
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/rovi-backend-error.log',
    out_file: '/var/log/pm2/rovi-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

### Paso 5: Iniciar Backend con PM2

```bash
# Crear directorio de logs
sudo mkdir -p /var/log/pm2

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
# Copiar y ejecutar el comando que aparece
```

### Paso 6: Verificar Backend

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs rovi-backend

# Verificar endpoint
curl http://localhost:8000/api/health
```

---

## Deploy del Frontend

### Paso 1: Preparar Frontend

```bash
cd /var/www/rovi-crm/frontend

# Instalar dependencias
yarn install

# Configurar variables de entorno
echo "REACT_APP_BACKEND_URL=https://api.tu-dominio.com" > .env
echo "ENABLE_HEALTH_CHECK=false" >> .env
```

### Paso 2: Build de Producción

```bash
# Crear build optimizado
yarn build

# Output en: build/
```

### Paso 3: Configurar Nginx

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/rovi-crm
```

```nginx
# Frontend (React SPA)
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Root del frontend
    root /var/www/rovi-crm/frontend/build;
    index index.html;

    # Client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Backend API (Reverse proxy)
server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### Paso 4: Habilitar Sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/rovi-crm /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## Base de Datos

### Opción 1: MongoDB Atlas (Recomendado)

1. **Crear cuenta en MongoDB Atlas**
   - Ir a https://www.mongodb.com/cloud/atlas
   - Crear cuenta gratuita

2. **Crear cluster**
   - Seleccionar tier gratuito (M0)
   - Seleccionar región más cercana (ej: us-east-1)

3. **Configurar acceso**
   - Database Access: Crear usuario con contraseña
   - Network Access: Permitir acceso desde `0.0.0.0/0`

4. **Obtener connection string**
   - Click en "Connect" → "Connect your application"
   - Copiar la URL de conexión

5. **Configurar en .env del backend**
   ```bash
   MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm?retryWrites=true&w=majority
   ```

### Opción 2: MongoDB en VPS

```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Crear usuario y base de datos
mongosh
```

```javascript
use admin
db.createUser({
  user: "rovi_admin",
  pwd: "contraseña_segura",
  roles: [{ role: "readWrite", db: "rovi_crm" }]
})
```

### Índices de Producción

```bash
# Conectar a MongoDB
mongosh mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm

# Crear índices
db.leads.createIndex({ "tenant_id": 1, "status": 1 })
db.leads.createIndex({ "tenant_id": 1, "priority": 1 })
db.activities.createIndex({ "tenant_id": 1, "broker_id": 1, "created_at": -1 })
db.calendar_events.createIndex({ "tenant_id": 1, "user_id": 1, "start_time": 1 })
```

---

## Configuración de Producción

### SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com

# Renovación automática (configurada por defecto)
sudo certbot renew --dry-run
```

### Archivo .env de Producción Completo

```bash
# ========== BASE DE DATOS ==========
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm?retryWrites=true&w=majority
DB_NAME=rovi_crm

# ========== JWT ==========
# Generar con: openssl rand -base64 32
JWT_SECRET=tu_clave_super_segura_generada_con_openssl
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# ========== IA ==========
EMERGENT_LLM_KEY=sk-emergent-tu-api-key

# ========== INTEGRACIONES ==========
# VAPI (AI Voice)
VAPI_API_KEY=your_vapi_key
VAPI_PHONE_NUMBER_ID=your_phone_id
VAPI_ASSISTANT_ID=your_assistant_id

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+525512345678

# SendGrid (Email)
SENDGRID_API_KEY=SG.your_key
SENDGRID_SENDER_EMAIL=contacto@tu-dominio.com
SENDGRID_SENDER_NAME=Rovi CRM

# Google Calendar (OAuth)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# ========== ENTORNO ==========
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
```

---

## Dominios y SSL

### Configuración de DNS

En tu proveedor de DNS (ej: CloudFlare, Namecheap):

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | IP de tu servidor |
| A | www | IP de tu servidor |
| A | api | IP de tu servidor |

### Configuración de CloudFlare (Opcional)

1. **Agregar sitio a CloudFlare**
2. **Configurar DNS records** (A records)
3. **Modo SSL**: Full (strict)
4. **Page Rules**: Cache para assets estáticos
5. **Firewall**: Reglas según necesidad

---

## Monitoreo y Logs

### Logs del Backend

```bash
# Logs en tiempo real
pm2 logs rovi-backend

# Logs de errores
pm2 logs rovi-backend --err

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoreo con PM2

```bash
# Instalar PM2 Plus (opcional)
pm2 plus

# Monitoreo básico
pm2 monit

# Listado de procesos
pm2 list

# Información detallada
pm2 show rovi-backend
```

### Alertas (Opcional)

Configurar alertas con:
- **UptimeRobot** - Monitoreo de uptime
- **Sentry** - Tracking de errores
- **LogRocket** - Session replay

---

## Mantenimiento

### Actualizar Aplicación

```bash
# 1. Hacer backup
tar -czf rovi-backup-$(date +%Y%m%d).tar.gz /var/www/rovi-crm

# 2. Actualizar código
cd /var/www/rovi-crm
git pull origin main

# 3. Actualizar backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart rovi-backend

# 4. Actualizar frontend
cd ../frontend
yarn install
yarn build
sudo systemctl reload nginx
```

### Comandos Útiles de PM2

```bash
pm2 restart rovi-backend    # Reiniciar
pm2 stop rovi-backend        # Detener
pm2 start rovi-backend       # Iniciar
pm2 delete rovi-backend      # Eliminar
pm2 reset rovi-backend       # Resetear contadores
pm2 flush                    # Limpiar logs
pm2 reloadLogs               # Recargar logs
```

### Backup de Base de Datos

```bash
# Backup de MongoDB Atlas
mongodump --uri="mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm" --out=/backup/mongodb/$(date +%Y%m%d)

# Backup automatizado con cron
crontab -e

# Agregar: Backup diario a las 3 AM
0 3 * * * mongodump --uri="mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm" --out=/backup/mongodb/$(date +\%Y\%m\%d)
```

### Restaurar Backup

```bash
# Restaurar MongoDB
mongorestore --uri="mongodb+srv://usuario:password@cluster.mongodb.net/rovi_crm" --drop /backup/mongodb/20260307
```

---

## Troubleshooting

### Backend no inicia

```bash
# Ver logs de PM2
pm2 logs rovi-backend --err

# Verificar puerto
sudo netstat -tulpn | grep 8000

# Verificar si MongoDB es accesible
mongosh mongodb://localhost:27017
```

### Frontend muestra 404

```bash
# Verificar Nginx
sudo nginx -t

# Verificar permisos
ls -la /var/www/rovi-crm/frontend/build

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Error de CORS

```bash
# Verificar configuración de CORS en backend
# En server.py, asegúrate de tener:

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error de Memoria

```bash
# Aumentar memoria de PM2
pm2 restart rovi-backend --max-memory-restart 2G

# O modificar ecosystem.config.js
max_memory_restart: '2G'
```

---

## Checklist de Deploy

### Pre-Deploy

- [ ] Servidor preparado con requisitos mínimos
- [ ] MongoDB configurado (Atlas o VPS)
- [ ] Dominio configurado con DNS
- [ ] Variables de entorno preparadas

### Backend Deploy

- [ ] Código clonado en servidor
- [ ] Entorno virtual de Python creado
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] PM2 configurado y ejecutando
- [ ] Health check funcionando

### Frontend Deploy

- [ ] Dependencias instaladas
- [ ] Build de producción creado
- [ ] Nginx configurado
- [ ] Sitio habilitado y funcionando

### Post-Deploy

- [ ] SSL/TLS configurado
- [ ] Logs monitoreando
- [ ] Backup automatizado configurado
- [ ] Monitoreo de uptime configurado
- [ ] Documentación actualizada

---

## Seguridad Adicional

### Configurar Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Configurar para Nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### Configurar Rate Limiting en Nginx

```nginx
# Agregar en http block
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Aplicar a locations
location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8000;
}
```

---

## Licencia

Confidencial - Rovi Real Estate

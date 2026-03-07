# Deployment con Panel Docker de Hostinger

Guía para desplegar Rovi CRM usando el panel de Docker de Hostinger (sin SSH).

## Requisitos Previos

1. VPS con Docker Panel activado en Hostinger
2. Acceso al panel de control de Hostinger
3. Repositorio de GitHub con el código (o archivos para subir)

## Opción 1: Desde Repositorio GitHub

### Paso 1: Preparar el Repositorio

Asegúrate de que estos archivos estén en tu repositorio:
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.env.example`

### Paso 2: Acceder al Panel Docker en Hostinger

1. Inicia sesión en **Hostinger hPanel**
2. Ve a **Servidores** → **Docker**
3. Selecciona tu VPS

### Paso 3: Crear Proyecto desde Git

1. Click en **"Create New Project"** o **"New Stack"**
2. Selecciona **"Git Repository"**
3. Ingresa los datos:
   ```
   Repository: https://github.com/softvibeslab/leadvibes.git
   Branch: rovi_deploy (o main)
   ```
4. Click en **"Continue"**

### Paso 4: Configurar Variables de Entorno

El panel detectará automáticamente el `docker-compose.yml`. Configura las variables:

En **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `MONGO_ROOT_USERNAME` | `admin` |
| `MONGO_ROOT_PASSWORD` | `tu_password_segura_aqui` |
| `DB_NAME` | `rovi_crm` |
| `JWT_SECRET` | `generar_con_openssl` |
| `EMERGENT_LLM_KEY` | `tu_api_key` |
| `CORS_ORIGINS` | `http://TU_IP:3000` |

### Paso 5: Configurar Puertos

Asegúrate de que estos puertos estén mapeados:

| Servicio | Puerto Interno | Puerto Externo |
|----------|----------------|----------------|
| Frontend | 80 | 3000 |
| Backend | 8000 | 8000 |
| MongoDB | 27017 | (no exponer) |

### Paso 6: Desplegar

1. Click en **"Deploy"** o **"Create"**
2. Espera a que se construyan las imágenes
3. Verifica que los 3 contenedores estén corriendo

## Opción 2: Subir Archivos Manualmente

### Paso 1: Acceder al Administrador de Archivos

1. En Hostinger hPanel → **File Manager**
2. Ve a la raíz de tu VPS (usualmente `/home/usuario/public_html` o `/var/www/html`)

### Paso 2: Subir Archivos

Sube estos archivos mediante **Upload**:

```
/home/usuario/rovi-crm/
├── docker-compose.yml
├── .env.example (renombrar a .env después)
├── backend/
│   ├── Dockerfile
│   ├── server.py
│   ├── requirements.txt
│   └── (demás archivos del backend)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── (demás archivos del frontend)
```

### Paso 3: Renombrar .env

1. En File Manager, encuentra `.env.example`
2. Renombra a `.env`
3. Click derecho → **Edit** y modifica con tus valores

### Paso 4: Ir al Panel Docker

1. Ve a **Docker Manager** en el panel
2. Click en **"New Project"**
3. Selecciona **"Custom Stack"** o **"From Directory"**
4. Selecciona el directorio `/home/usuario/rovi-crm`

### Paso 5: Configurar y Desplegar

Sigue los pasos de configuración de la Opción 1 (Paso 4-6)

## Configuración de Puertos en Hostinger

### Abrir Puertos en Firewall

1. En hPanel, ve a **Servidores** → **Manage**
2. Busca **Firewall** o **Security Rules**
3. Agrega estas reglas:

| Protocol | Puerto | Description |
|----------|--------|-------------|
| TCP | 3000 | Frontend Rovi CRM |
| TCP | 8000 | Backend API Rovi CRM |
| TCP | 22 | SSH (si necesitas acceso) |

### Puertos Exponer en Panel Docker

En el panel Docker, configura **Port Mapping**:

```
rovi-frontend:  3000 → 80
rovi-backend:    8000 → 8000
rovi-mongodb:    (no mapear puerto externo)
```

## Verificar Deployment

### En el Panel Docker

Deberías ver los 3 contenedores con status **Running**:

- ✅ `rovi-mongodb`
- ✅ `rovi-backend`
- ✅ `rovi-frontend`

### Probar URLs

Abre en tu navegador:

- Frontend: `http://TU_IP_VPS:3000`
- Backend: `http://TU_IP_VPS:8000/api/health`

## Ver Logs en Panel Hostinger

### Método 1: Panel Docker

1. En Docker Manager, click en el contenedor (ej: `rovi-backend`)
2. Ve a la pestaña **Logs** o **Console**
3. Verifica que no haya errores

### Método 2: Terminal en Panel

1. En hPanel → **Terminal** (si está disponible)
2. Ejecuta:
   ```bash
   cd /home/usuario/rovi-crm
   docker-compose logs -f
   ```

## Actualizar la Aplicación

### Desde Panel Hostinger

1. Ve a **Docker Manager**
2. Selecciona tu proyecto
3. Click en **"Rebuild"** o **"Redeploy"**
4. O elimina y crea nuevamente el proyecto

### Si usas Git

1. Haz push a tu repositorio
2. En el panel, click en **"Pull & Redeploy"** (si está disponible)
3. O elimina y recrea el proyecto

## Troubleshooting

### Error: "Port already in use"

**Solución**: Verifica que ningún otro servicio esté usando los puertos 3000 o 8000

1. En **Terminal** del panel:
   ```bash
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8000
   ```

2. Detén el servicio que esté usando el puerto

### Error: "Cannot connect to MongoDB"

**Solución**: Verifica las variables de entorno

1. En el panel Docker, edita el contenedor `rovi-backend`
2. Verifica que `MONGO_URL` sea correcta
3. Asegúrate de que `rovi-mongodb` esté corriendo

### Error: "Frontend muestra 404"

**Solución**: Verifica que nginx.conf esté subido correctamente

1. En File Manager, verifica que `frontend/nginx.conf` exista
2. Rebuild el contenedor frontend

### Error: "CORS error"

**Solución**: Actualiza `CORS_ORIGINS` con tu IP

1. Edita las Environment Variables del contenedor `rovi-backend`
2. Cambia `CORS_ORIGINS` a: `http://TU_IP:3000`
3. Restart el contenedor backend

## Tips para Hostinger Docker Panel

1. **Auto-restart**: Asegúrate de que la opción **"Restart on failure"** esté activada

2. **Resource Limits**: Configura límites de recursos:
   - MongoDB: 512MB RAM mínimo
   - Backend: 256MB RAM mínimo
   - Frontend: 128MB RAM mínimo

3. **Volumes/Persistencia**: Asegúrate de que el volumen de MongoDB esté configurado para persistir datos

4. **Health Checks**: Activa health checks si el panel lo soporta:
   - Frontend: `GET /`
   - Backend: `GET /api/health`

5. **Access Logs**: Activa los logs de acceso para monitoreo

## Estructura Final de Directorios en Hostinger

```
/home/tu-usuario/
└── rovi-crm/
    ├── docker-compose.yml
    ├── .env (creado manualmente)
    ├── backend/
    │   ├── Dockerfile
    │   ├── server.py
    │   ├── requirements.txt
    │   └── ...
    └── frontend/
        ├── Dockerfile
        ├── nginx.conf
        ├── package.json
        └── ...
```

## Soporte Hostinger

- Hostinger Documentation: https://support.hostinger.com
- Docker Guide: Busca "Docker container management" en la base de conocimiento de Hostinger

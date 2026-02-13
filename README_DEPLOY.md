# Guía de Despliegue en VPS Hostinger

## Archivos Creados

Esta implementación ha creado los siguientes archivos:

```
leadvibes/
├── backend/
│   ├── Dockerfile              ✅ Imagen Docker para FastAPI
│   └── .dockerignore          ✅ Archivos a excluir del build
├── frontend/
│   ├── Dockerfile              ✅ Imagen Docker multi-stage (Node + Nginx)
│   ├── nginx.conf             ✅ Configuración de Nginx
│   └── .dockerignore          ✅ Archivos a excluir del build
├── docker-compose.yml          ✅ Orquestación de servicios
├── .env.example              ✅ Plantilla de variables de entorno
├── deploy.sh                 ✅ Script de despliegue automatizado
└── README_DEPLOY.md           ✅ Este archivo
```

## Pasos Previos

### 1. Preparar el VPS

Asegúrate de tener:
- **IP del VPS**: Ej: `123.45.67.89`
- **Acceso SSH**: Usuario y contraseña/clave
- **Recursos mínimos recomendados**:
  - CPU: 2-4 vCPU
  - RAM: 4-8 GB
  - Disco: 40-80 GB SSD

### 2. Instalar Docker en el VPS (Primera vez)

```bash
# Reemplazar con tu IP real
export VPS_HOST="123.45.67.89"

# Ejecutar instalación inicial
./deploy.sh setup
```

Este script:
- Actualiza el sistema Ubuntu
- Instala Docker y Docker Compose
- Configura firewall (puertos 22, 80, 443)
- Crea directorio de trabajo

### 3. Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env.production

# Editar con valores reales
nano .env.production
```

**Variables críticas a configurar:**

```bash
# Generar JWT_SECRET seguro
openssl rand -hex 32

# Configurar estos valores en .env.production:
JWT_SECRET=<resultado-del-comando-anterior>
EMERGENT_LLM_KEY=<tu-api-key>
CORS_ORIGINS=http://tu-ip-vps
```

**IMPORTANTE**: No commitear `.env.production` al repositorio

## Despliegue Inicial

### Opción A: Script Automatizado (Recomendado)

```bash
# Configurar variables
export VPS_HOST="123.45.67.89"
export VPS_USER="root"  # o tu usuario

# Ejecutar despliegue
./deploy.sh deploy
```

### Opción B: Manual

```bash
# 1. Subir archivos al VPS
rsync -avz --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude '.git' \
    ./ root@123.45.67.89:/root/leadvibes/

# 2. Conectar al VPS
ssh root@123.45.67.89

# 3. Navegar al directorio
cd /root/leadvibes

# 4. Verificar .env.production existe
ls .env.production  # Si no existe, copiar de .env.example

# 5. Construir e iniciar
docker-compose up -d --build
```

## Verificar Despliegue

### 1. Ver estado de contenedores

```bash
# Desde tu máquina local
./deploy.sh status

# O en el VPS
cd /root/leadvibes
docker-compose ps
```

Deberías ver 3 contenedores corriendo:
- `leadvibes-mongo` (healthy)
- `leadvibes-backend` (healthy)
- `leadvibes-frontend` (healthy)

### 2. Ver logs

```bash
# Ver logs en tiempo real
./deploy.sh logs

# O logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo
```

### 3. Probar la aplicación

Abrir en el navegador:
- **Frontend**: `http://tu-ip-vps`
- **API Health**: `http://tu-ip-vps/api/health`
- **API Docs**: `http://tu-ip-vps/api/docs` (FastAPI Swagger)

## Comandos Útiles

```bash
# Ver logs
./deploy.sh logs

# Reiniciar servicios
./deploy.sh restart

# Detener servicios
./deploy.sh stop

# Ver estado y recursos
./deploy.sh status

# Hacer backup de MongoDB
./deploy.sh backup
```

## Configurar Dominio y SSL

### 1. Configurar Dominio en Hostinger

1. Ir al panel de Hostinger → Dominios
2. Buscar tu dominio
3. Ir a DNS / Registros
4. Crear registro A:
   - **Type**: A
   - **Name**: @ (o el subdominio)
   - **IPv4 address**: Tu IP del VPS
   - **TTL**: 3600 (1 hora)

### 2. Esperar Propagación DNS

Puede tardar desde **10 minutos hasta 48 horas**.
Verificar con:
```bash
# En Linux/Mac
dig tudominio.com

# O verificar en https://dnschecker.org
```

### 3. Configurar SSL en Hostinger

1. En el panel de Hostinger → SSL/TLS
2. Seleccionar tu dominio
3. Instalar certificado SSL gratuito (Let's Encrypt)
4. Hostinger instalará automáticamente el certificado en tu VPS

### 4. Actualizar Variables de Entorno

Una vez que el dominio y SSL estén funcionando:

```bash
# Editar .env.production
nano .env.production

# Cambiar:
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Re-desplegar
./deploy.sh deploy
```

## Solución de Problemas

### Contenedor no inicia ("Exit 1" o "Restarting")

```bash
# Ver logs del contenedor problemático
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo
```

**Causas comunes**:
- Variables de entorno incorrectas (verificar `.env.production`)
- Puerto ya en uso (verificar con `netstat -tulpn`)
- Error de sintaxis en `docker-compose.yml`

### Error de MongoDB Connection

**Problema**: Backend no puede conectar a MongoDB

**Solución**: Verificar que en `.env.production`:
```bash
MONGO_URL=mongodb://mongo:27017  # NO localhost
```

El nombre `mongo` es el nombre del servicio en `docker-compose.yml`

### Error de CORS

**Problema**: Frontend no puede hacer requests a la API

**Solución**: Verificar `CORS_ORIGINS` en `.env.production`:
```bash
# Correcto para IP:
CORS_ORIGINS=http://123.45.67.89

# Correcto para dominio:
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

### 502 Bad Gateway

**Problema**: Nginx no puede conectar con el backend

**Solución**:
```bash
# Verificar que backend esté corriendo
docker-compose ps

# Ver logs del backend
docker-compose logs backend

# Verificar健康检查
curl http://localhost:8000/api/health
```

### Acceso por IP no funciona

**Problema**: No se puede acceder al VPS por IP pública

**Solución**: Verificar firewall
```bash
# En el VPS
ufw status

# Si está bloqueado:
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

### Actualización de código

```bash
# 1. Hacer cambios en local
git commit -m "nueva funcionalidad"

# 2. Re-desplegar
./deploy.sh deploy

# Los cambios se aplicarán automáticamente
```

## Backups Automatizados

### Configurar Backup Diario de MongoDB

```bash
# En el VPS
crontab -e

# Agregar esta línea (backup diario a las 3 AM):
0 3 * * * cd /root/leadvibes && /root/leadvibes/deploy.sh backup
```

### Restaurar Backup

```bash
# En el VPS
docker-compose exec -T mongo mongorestore \
    --db=leadvibes \
    --archive=/data/dump/leadvibes-backup-20250213-030000.gz \
    --gzip
```

## Monitoreo

### Recursos del VPS

```bash
# Ver uso de recursos de contenedores
docker stats

# Ver recursos del sistema
htop
df -h  # Espacio en disco
free -h # Memoria disponible
```

### Logs Específicos

```bash
# Logs del backend FastAPI
docker-compose logs -f backend

# Logs del frontend Nginx
docker-compose logs -f frontend

# Logs de MongoDB
docker-compose logs -f mongo
```

## Seguridad Adicional

### 1. Crear Usuario No-Root

```bash
# En el VPS
adduser deploy
usermod -aG docker deploy

# Usar este usuario para despliegues futuros
export VPS_USER="deploy"
```

### 2. Configurar SSH Keys

```bash
# En tu máquina local
ssh-keygen -t rsa -b 4096

# Copiar key al VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub root@123.45.67.89

# Deshabilitar login con password
# En el VPS: /etc/ssh/sshd_config
PasswordAuthentication no
```

### 3. Habilitar Autenticación MongoDB

En `docker-compose.yml`, agregar:
```yaml
mongo:
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: tu-password-seguro
```

## Soporte

Si encuentras problemas:

1. **Verificar logs**: `./deploy.sh logs`
2. **Verificar estado**: `./deploy.sh status`
3. **Reiniciar**: `./deploy.sh restart`
4. **Revisar este README**

Para problemas avanzados, revisar:
- Documentación de Docker: https://docs.docker.com
- Documentación de FastAPI: https://fastapi.tiangolo.com
- Documentación de Hostinger: https://support.hostinger.com

# Deployment con Docker - Rovi CRM

Guía de deployment en VPS (Hostinger) usando Docker y Docker Compose.

## Requisitos Previos

- VPS con SSH access
- Al menos 2GB RAM y 20GB disco
- Linux (Ubuntu 20.04+ recomendado)

## Configuración Inicial

### 1. Conectar al VPS

```bash
ssh root@IP_DEL_VPS
```

### 2. Instalar Docker y Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. Clonar el Repositorio

```bash
cd /var/www
git clone https://github.com/softvibeslab/leadvibes.git rovi-crm
cd rovi-crm
```

### 4. Configurar Variables de Entorno

```bash
cp .env.example .env
nano .env
```

**Importante**: Edita estos valores en `.env`:
- `MONGO_ROOT_PASSWORD` - Password de MongoDB (cambiarla)
- `JWT_SECRET` - Clave secreta para JWT (generar con `openssl rand -base64 32`)
- `EMERGENT_LLM_KEY` - Tu API key de Emergent
- `CORS_ORIGINS` - Agrega tu IP: `http://TU_IP:3000`

### 5. Configurar Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # Frontend
ufw allow 8000/tcp  # Backend
ufw enable
```

## Deployment

### Opción A: Usar el Script de Deployment

```bash
chmod +x deploy.sh
./deploy.sh init    # Primera vez
./deploy.sh build   # Construir imágenes
./deploy.sh up      # Levantar contenedores
```

### Opción B: Comandos Directos

```bash
# Construir
docker-compose build

# Levantar
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
```

## URLs de Acceso

Una vez deployado, accede a:

- **Frontend**: `http://TU_IP_VPS:3000`
- **Backend API**: `http://TU_IP_VPS:8000`
- **Health Check**: `http://TU_IP_VPS:8000/api/health`

## Comandos Útiles

### Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Reiniciar Servicios

```bash
docker-compose restart
```

### Actualizar Código

```bash
git pull
docker-compose up -d --build
```

### Detener Todo

```bash
docker-compose down
```

### Entrar a un Contenedor

```bash
# Backend
docker exec -it rovi-backend bash

# MongoDB
docker exec -it rovi-mongodb mongosh
```

## Resolución de Problemas

### El contenedor no inicia

```bash
# Ver logs del servicio
docker-compose logs backend

# Verificar variables de entorno
docker-compose config
```

### Error de conexión a MongoDB

1. Verificar que MongoDB esté corriendo:
```bash
docker-compose ps mongodb
```

2. Verificar las credenciales en `.env`

3. Revisar logs de MongoDB:
```bash
docker-compose logs mongodb
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Detener servicios que conflictúen
```

### Limpiar y Empezar de Nuevo

```bash
docker-compose down -v
docker system prune -a
./deploy.sh build
./deploy.sh up
```

## Backup y Restore

### Backup de MongoDB

```bash
# Backup
docker exec rovi-mongodb mongodump --archive=/data/db/backup-$(date +%Y%m%d).tar --db=rovi_crm

# Copiar fuera del contenedor
docker cp rovi-mongodb:/data/db/backup-YYYYMMDD.tar ./backups/
```

### Restore de MongoDB

```bash
# Copiar al contenedor
docker cp ./backups/backup-YYYYMMDD.tar rovi-mongodb:/data/db/

# Restore
docker exec rovi-mongodb mongorestore --archive=/data/db/backup-YYYYMMDD.tar --db=rovi_crm
```

## Monitoreo

### Estado de Contenedores

```bash
docker-compose ps
docker stats
```

### Recursos Usados

```bash
# CPU y Memoria
docker stats --no-stream

# Espacio en disco
df -h

# Espacio de Docker
docker system df
```

## Seguridad

### Recomendaciones

1. **Cambiar passwords por defecto** en `.env`
2. **No commitear** `.env` al repositorio
3. **Configurar SSH** con llaves, no solo password
4. **Actualizar el sistema** regularmente: `apt update && apt upgrade`
5. **Considerar HTTPS** con Certbot para producción

### HTTPS con Certbot (Futuro)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx

# Obtener certificado
certbot --nginx -d tu-dominio.com

# Renovación automática
certbot renew --dry-run
```

## Arquitectura

```
┌─────────────────────────────────────┐
│         Hostinger VPS               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────┐                   │
│  │  Frontend   │  Nginx + React    │
│  │   :3000     │  Puerto 3000      │
│  └─────────────┘                   │
│         │                           │
│         ▼                           │
│  ┌─────────────┐                   │
│  │  Backend    │  FastAPI          │
│  │   :8000     │  Puerto 8000      │
│  └─────────────┘                   │
│         │                           │
│         ▼                           │
│  ┌─────────────┐                   │
│  │  MongoDB    │  Puerto 27017     │
│  └─────────────┘  (Interno)        │
│                                     │
└─────────────────────────────────────┘
```

## Soporte

Para problemas o dudas:
- Documentación: `/docs`
- Issues: GitHub Issues
- Email: hola@rovicrm.com

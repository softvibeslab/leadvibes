# 🚀 LeadVibes - Guía de Deploy en VPS con Docker

**VPS**: srv1318804.hstgr.cloud (Hostinger)
**Panel**: Administrador de Docker (Docker Compose)

---

## 📋 Contenido de esta Carpeta

```
deploy/
├── docker-compose.yml          # Archivo principal para Docker Compose
├── .env.example                # Plantilla de variables de entorno
├── Dockerfile.backend          # Dockerfile para el backend
├── Dockerfile.frontend         # Dockerfile para el frontend
├── deploy.sh                   # Script de deploy automatizado
├── backup.sh                   # Script de backup de MongoDB
└── README.md                   # Este archivo
```

---

## 🔧 Método 1: Deploy con GitHub URL (Recomendado)

### Paso 1: Subir código a GitHub

Si aún no tienes el código en GitHub:

```bash
# En tu máquina local
cd /rogervibes/leadvibes
git add .
git commit -m "chore: prepare for deploy"
git push origin feature/tdd-implementation-49percent
```

### Paso 2: Obtener URL del repositorio

```
GitHub URL: https://github.com/softvibeslab/leadvibes.git
```

### Paso 3: Usar el Administrador de Docker

1. **Acceder al panel**:
   - URL del VPS: https://srv1318804.hstgr.cloud
   - Usuario: (tu usuario de Hostinger)
   - Contraseña: (tu contraseña)

2. **Abrir "Administrador de Docker"**

3. **Crear nuevo proyecto**:
   - **Nombre del proyecto**: `leadvibes-preview`
   - **URL**: Pegar la URL de GitHub
   - **Click**: "Implementar"

4. **Esperar configuración automática**:
   - El sistema detectará el `docker-compose.yml`
   - Creará los contenedores automáticamente
   - Tomará ~5-10 minutos

---

## 🔧 Método 2: Deploy Manual con SSH

### Paso 1: Conectar al VPS por SSH

```bash
# Conectar al servidor
ssh root@srv1318804.hstgr.cloud

# O si usas un usuario diferente
ssh usuario@srv1318804.hstgr.cloud
```

### Paso 2: Instalar Docker (si no está instalado)

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

### Paso 3: Crear directorio del proyecto

```bash
# Crear directorio
mkdir -p /var/www/leadvibes
cd /var/www/leadvibes
```

### Paso 4: Subir archivos

**Opción A: Usar SCP desde tu máquina local**

```bash
# Copiar carpeta deploy/
scp -r deploy/ root@srv1318804.hstgr.cloud:/var/www/leadvibes/

# Copiar código del backend
scp -r backend/ root@srv1318804.hstgr.cloud:/var/www/leadvibes/

# Copiar código del frontend
scp -r frontend/ root@srv1318804.hstgr.cloud:/var/www/leadvibes/
```

**Opción B: Clonar desde GitHub directamente en el VPS**

```bash
# Clonar repositorio
cd /var/www
git clone https://github.com/softvibeslab/leadvibes.git
cd leadvibes

# Cambiar a la rama correcta
git checkout feature/tdd-implementation-49percent
```

### Paso 5: Configurar variables de entorno

```bash
# Copiar plantilla
cp deploy/.env.example .env

# Editar con nano o vim
nano .env
```

**Valores CRÍTICOS que debes cambiar**:

```bash
# CAMBIAR ESTO - Contraseña segura de MongoDB
MONGO_ROOT_PASSWORD=tu_password_segura_aqui

# CAMBIAR ESTO - Generar con: openssl rand -hex 32
JWT_SECRET=tu_jwt_secret_aqui

# CAMBIAR ESTO - Tu dominio real
CORS_ORIGINS=https://tu-dominio.com

# CAMBIAR ESTO - URL del backend
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
```

### Paso 6: Crear Dockerfile del Backend

```bash
# Crear Dockerfile en la raíz del backend
cat > backend/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
```

### Paso 7: Crear Dockerfile del Frontend

```bash
# Crear Dockerfile en la raíz del frontend
cat > frontend/Dockerfile << 'EOF'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código
COPY . .

# Build argumentos
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_ENVIRONMENT

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build from previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOF
```

### Paso 8: Crear configuración de Nginx

```bash
# Crear nginx.conf en la raíz del frontend
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### Paso 9: Iniciar contenedores

```bash
# Desde el directorio /var/www/leadvibes
cd /var/www/leadvibes

# Crear directorio logs
mkdir -p logs

# Iniciar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver estado de contenedores
docker-compose ps
```

### Paso 10: Verificar deploy

```bash
# Verificar health check del backend
curl http://localhost:8000/api/health

# Verificar frontend
curl http://localhost/

# Ver logs de MongoDB
docker-compose logs mongodb

# Ver logs del backend
docker-compose logs backend

# Ver logs del frontend
docker-compose logs frontend
```

---

## 🌐 Configurar Dominio

### Paso 1: Configurar DNS

En tu proveedor de dominio (ej. GoDaddy, Namecheap):

1. **Ir a Configuración DNS**
2. **Agregar registros A**:

```
Tipo: A
Nombre: @
Valor: IP_DEL_VPS (obtener con: curl ifconfig.me)
TTL: 3600

Tipo: A
Nombre: www
Valor: IP_DEL_VPS
TTL: 3600

Tipo: A
Nombre: api
Valor: IP_DEL_VPS
TTL: 3600
```

### Paso 2: Configurar Nginx para dominio

```bash
# Editar nginx.conf del frontend
nano frontend/nginx.conf
```

Cambiar `server_name localhost;` por:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    # ... resto de la config
}
```

```bash
# Reconstruir y reiniciar
docker-compose down
docker-compose up -d --build
```

---

## 🔐 Configurar SSL con Let's Encrypt

### Paso 1: Instalar Certbot

```bash
# En el VPS
apt install certbot python3-certbot-nginx -y
```

### Paso 2: Obtener certificado

```bash
# Obtener certificado
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com

# Seguir instrucciones (ingresar email, aceptar términos)
```

### Paso 3: Auto-renewal

```bash
# Verificar configuración de auto-renewal
certbot renew --dry-run

# El cron job ya está configurado automáticamente
```

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real

```bash
# Todos los contenedores
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo MongoDB
docker-compose logs -f mongodb

# Últimas 100 líneas
docker-compose logs --tail=100
```

### Verificar estado de contenedores

```bash
# Estado de todos
docker-compose ps

# Ver recursos usados
docker stats

# Ver detalles de un contenedor
docker inspect leadvibes-backend
```

### Acceder a un contenedor

```bash
# Acceder al backend
docker-compose exec backend bash

# Acceder a MongoDB
docker-compose exec mongodb mongosh -u admin -p

# Dentro de MongoDB
show dbs
use leadvibes
db.users.find()
```

---

## 🔄 Actualizar la Aplicación

### Método A: Pull desde GitHub

```bash
# En el VPS
cd /var/www/leadvibes
git pull origin feature/tdd-implementation-49percent
docker-compose down
docker-compose up -d --build
```

### Método B: Subir cambios nuevos

```bash
# Desde tu máquina local
scp -r backend/ root@srv1318804.hstgr.cloud:/var/www/leadvibes/

# En el VPS
cd /var/www/leadvibes
docker-compose down
docker-compose up -d --build
```

---

## 💾 Backup de MongoDB

```bash
# Usar script de backup
chmod +x deploy/backup.sh
./deploy/backup.sh

# O manualmente
docker-compose exec mongodb mongodump --username=admin --password=PASSWORD --archive=/backup/leadvibes-backup-$(date +%Y%m%d).gz
```

---

## 🚨 Troubleshooting

### Contenedor no inicia

```bash
# Ver logs del contenedor
docker-compose logs backend

# Ver detalles
docker inspect leadvibes-backend

# Reconstruir desde cero
docker-compose down -v
docker-compose up -d --build
```

### Error de conexión a MongoDB

```bash
# Verificar que MongoDB está corriendo
docker-compose ps mongodb

# Ver logs de MongoDB
docker-compose logs mongodb

# Verificar conexión
docker-compose exec backend python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('mongodb://admin:PASSWORD@mongodb:27017').list_database_names())"
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto
netstat -tulpn | grep :8000
netstat -tulpn | grep :80

# Matar proceso si es necesario
kill -9 <PID>
```

### Limpiar todo y empezar de cero

```bash
# ⚠️ Esto borrará todos los datos
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 📞 Soporte

**VPS**: Hostinger
**IP**: srv1318804.hstgr.cloud
**Panel**: https://panel.hostinger.com

**Documentación adicional**:
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Hostinger VPS Guide](https://support.hostinger.com/en/articles/4983558-how-to-access-your-vps-using-ssh-command)

---

**Última actualización**: 2026-03-23
**Versión**: 1.0

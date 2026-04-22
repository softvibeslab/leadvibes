# 🚀 Instrucciones de Deploy - Panel Hostinger

## Información del Servidor

**VPS**: srv1318804.hstgr.cloud
**Panel**: Hostinger Docker Manager
**URL Repositorio**: https://github.com/softvibeslab/leadvibes

---

## Método 1: Usar GitHub URL (MÁS FÁCIL) ⭐

### Paso 1: Acceder al Panel

1. Ir a: https://panel.hostinger.com
2. Iniciar sesión
3. Ir al servidor: **srv1318804.hstgr.cloud**
4. Buscar **"Administrador de Docker"** o **"Docker Manager"**
5. Click en **"Nuevo Proyecto"**

### Paso 2: Configurar el Proyecto

**Campo: Nombre del Proyecto**
```
leadvibes-preview
```

**Campo: URL del Repositorio**
```
https://github.com/softvibeslab/leadvibes.git
```

**Campo: Rama (Branch)**
```
feature/tdd-implementation-49percent
```

### Paso 3: Deploy

Click en **"Implementar"** o **"Deploy"**

El sistema automáticamente:
- ✅ Clonará el repositorio
- ✅ Detectará `docker-compose.yml`
- ✅ Construirá las imágenes Docker
- ✅ Iniciará los contenedores

**Tiempo estimado**: 5-10 minutos

---

## Método 2: Docker Compose Manual

Si el panel no puede leer desde GitHub, usa este método:

### Paso 1: Conectar por SSH

```bash
ssh root@srv1318804.hstgr.cloud
# O con tu usuario
ssh usuario@srv1318804.hstgr.cloud
```

### Paso 2: Descargar archivos

```bash
# Crear directorio
mkdir -p /var/www/leadvibes
cd /var/www/leadvibes

# Clonar repositorio
git clone https://github.com/softvibeslab/leadvibes.git .
git checkout feature/tdd-implementation-49percent
```

### Paso 3: Configurar variables

```bash
# Crear archivo .env
cat > .env << 'EOF'
MONGO_ROOT_PASSWORD=tu_password_aqui
JWT_SECRET=tu_jwt_secret_aqui
CORS_ORIGINS=https://tu-dominio.com
DB_NAME=leadvibes
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
EOF
```

### Paso 4: Iniciar

```bash
docker-compose up -d
```

---

## 🔧 Variables de Entorno CRÍTICAS

**OBLIGATORIO cambiar estas 4 variables:**

| Variable | Valor Actual | Debe Cambiar a |
|----------|--------------|----------------|
| `MONGO_ROOT_PASSWORD` | CAMBIAR_ESTO... | Tu password segura |
| `JWT_SECRET` | CAMBIAR_ESTO... | Tu JWT secret (openssl rand -hex 32) |
| `CORS_ORIGINS` | https://leadvibes.com | Tu dominio real |
| `REACT_APP_BACKEND_URL` | https://api.leadvibes.com | Tu API URL real |

**Generar JWT Secret seguro:**
```bash
openssl rand -hex 32
```

---

## 📊 Verificar Deploy

### Check de Salud

```bash
# Verificar contenedores corriendo
docker-compose ps

# Verificar logs
docker-compose logs -f

# Verificar backend API
curl http://localhost:8000/api/health

# Verificar frontend
curl http://localhost/
```

### Acceder a la Aplicación

Una vez deployado, la app estará disponible en:

```
Frontend: http://TU_IP_PUBLICA/
Backend API: http://TU_IP_PUBLICA:8000/
API Docs: http://TU_IP_PUBLICA:8000/docs
```

**Obtener IP pública:**
```bash
curl ifconfig.me
```

---

## 🌐 Configurar Dominio (Opcional)

### Paso 1: Configurar DNS

En tu proveedor de dominio, agregar registros:

```
Tipo: A
Nombre: @
Valor: TU_IP_PUBLICA

Tipo: A
Nombre: www
Valor: TU_IP_PUBLICA

Tipo: A
Nombre: api
Valor: TU_IP_PUBLICA
```

### Paso 2: Actualizar variables

Actualizar `.env`:
```bash
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
```

### Paso 3: Reiniciar

```bash
docker-compose down
docker-compose up -d
```

---

## 🔐 Configurar SSL (Let's Encrypt)

### Paso 1: Instalar Certbot

```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### Paso 2: Obtener Certificado

```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com
```

### Paso 3: Auto-renewal

Certbot configura auto-renewal automáticamente.

Verificar:
```bash
certbot renew --dry-run
```

---

## 📝 Resumen Rápido

### Opción Más Rápida (GitHub URL)

1. Panel Hostinger → Docker Manager
2. Nuevo Proyecto → Nombre: `leadvibes-preview`
3. URL: `https://github.com/softvibeslab/leadvibes.git`
4. Click: Implementar
5. ✅ Esperar 5-10 minutos
6. 🎉 Listo!

### Si Falla la URL GitHub

1. SSH al servidor
2. `git clone https://github.com/softvibeslab/leadvibes.git`
3. `cd leadvibes && git checkout feature/tdd-implementation-49percent`
4. `cp .env.example .env` y editar
5. `docker-compose up -d`
6. ✅ Listo!

---

## 🆘 Soporte y Troubleshooting

### Contenedor no inicia

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

### Reemplazar todo y empezar de cero

```bash
docker-compose down
docker system prune -a
git pull
docker-compose up -d --build
```

### Verificar puertos disponibles

```bash
netstat -tulpn | grep :8000
netstat -tulpn | grep :80
```

---

## 📞 Contactos de Soporte

- **Hostinger**: https://support.hostinger.com
- **VPS Panel**: https://panel.hostinger.com
- **GitHub Issues**: https://github.com/softvibeslab/leadvibes/issues

---

**¡Buena suerte con el deploy!** 🚀

**Última actualización**: 2026-03-23

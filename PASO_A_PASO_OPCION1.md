# 🚀 OPCIÓN 1: Deploy con GitHub URL (MÁS FÁCIL)

## Información Necesaria

### Datos del Servidor
- **VPS**: srv1318804.hstgr.cloud
- **Panel**: Hostinger Docker Manager
- **URL GitHub**: https://github.com/softvibeslab/leadvibes.git
- **Rama**: feature/tdd-implementation-49percent

---

## 🎯 Paso a Paso - Deploy con GitHub URL

### PASO 1: Acceder al Panel de Hostinger

1. **Ir a**: https://panel.hostinger.com
2. **Iniciar sesión** con tus credenciales
3. **Buscar "Servidores VPS"**
4. **Click en** srv1318804.hstgr.cloud
5. **Buscar "Administrador de Docker"** o **"Docker Manager"**

### PASO 2: Crear Nuevo Proyecto

**Click en**: "Nuevo Proyecto" o "New Project"

#### Campos del Formulario:

| Campo | Valor |
|------|-------|
| **Nombre del proyecto** | `leadvibes-preview` |
| **URL del repositorio** | `https://github.com/softvibeslab/leadvibes.git` |
| **Rama (Branch)** | `feature/tdd-implementation-49percent` |

### PASO 3: Configurar Variables de Entorno

**IMPORTANTE**: El panel debería detectar automáticamente el archivo `deploy/.env.example`

Si detecta variables, configura estas **4 críticas**:

```bash
# 1. Password de MongoDB (genera una segura)
MONGO_ROOT_PASSWORD=tu_password_segura_aqui_2026

# 2. JWT Secret (genera con: openssl rand -hex 32)
JWT_SECRET=tu_jwt_secret_aqui

# 3. CORS (tu dominio o IP)
CORS_ORIGINS=https://tu-dominio.com

# 4. Backend URL
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
```

**Resto de las variables**: Dejar valores por defecto (son opcionales)

### PASO 4: Deploy

**Click en**: "Implementar" o "Deploy" o "Crear"

**El sistema hará automáticamente**:
1. Clonar el repositorio desde GitHub
2. Detectar `deploy/docker-compose.yml`
3. Detectar `backend/Dockerfile`
4. Detectar `frontend/Dockerfile`
5. Construir imágenes Docker
6. Iniciar contenedores

**⏱️ Tiempo estimado**: 5-10 minutos

---

## ✅ Verificar Deploy Exitoso

### Indicadores de Éxito:

- ✅ Status del proyecto: "Running" o "Corriendo"
- ✅ 3 contenedores activos: mongodb, backend, frontend
- ✅ Puerto 80: Abierto
- ✅ Puerto 8000: Abierto

### URLs Resultantes:

```
Frontend: http://TU_IP_PUBLICA/
Backend API: http://TU_IP_PUBLICA:8000/
API Docs: http://TU_IP_PUBLICA:8000/docs
MongoDB: mongodb://TU_IP_PUBLICA:27017
```

**Obtener IP pública**:
```bash
curl ifconfig.me
```

---

## 🧪 Primer Acceso y Testing

### 1. Verificar Frontend

```bash
curl http://TU_IP_PUBLICA/
```

**Debería retornar**: HTML del frontend (React app)

### 2. Verificar Backend

```bash
curl http://TU_IP_PUBLICA:8000/api/health
```

**Debería retornar**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-23T..."
}
```

### 3. Ver API Documentation

Abrir en navegador:
```
http://TU_IP_PUBLICA:8000/docs
```

**Debería mostrar**: Swagger UI con todos los endpoints

---

## 🌐 Configurar Dominio (Opcional)

### PASO 1: Configurar DNS en tu Proveedor

En GoDaddy, Namecheap, o donde compraste tu dominio:

**Agregar registros A**:

```
Tipo: A
Nombre: @
Valor: TU_IP_PUBLICA
TTL: 3600

Tipo: A
Nombre: www
Valor: TU_IP_PUBLICA
TTL: 3600

Tipo: A
Nombre: api
Valor: TU_IP_PUBLICA
TTL: 3600
```

### PASO 2: Actualizar Variables en Panel

Volver al panel de Docker y actualizar:

```bash
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
REACT_APP_BACKEND_URL=https://api.tu-dominio.com
```

### PASO 3: Reiniciar

Click en "Reiniciar" o "Restart" en el panel

---

## 🔐 Configurar SSL (Let's Encrypt)

### PASO 1: Conectar por SSH

```bash
ssh root@srv1318804.hstgr.cloud
```

### PASO 2: Instalar Certbot

```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### PASO 3: Obtener Certificados

```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com
```

**Seguir instrucciones**:
- Ingresar email
- Aceptar términos de servicio
- Elegir si redirigir HTTP a HTTPS (recomendado: Sí, redirect)

### PASO 4: Verificar Auto-renewal

```bash
certbot renew --dry-run
```

✅ Si muestra "success", el auto-renewal está configurado

---

## 📊 Monitoreo desde el Panel

### Ver Logs

La mayoría de paneles de Docker tienen:

- **Logs** → Ver logs de contenedores
- **Console** → Terminal web
- **Stats** → Uso de recursos

### Comandos Útiles (desde SSH)

```bash
# Ver todos los contenedores
docker ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Ver estado
docker-compose ps

# Ver recursos usados
docker stats

# Reiniciar un servicio
docker-compose restart backend
```

---

## 🔄 Actualizar la Aplicación

### Desde el Panel de Docker

1. **Ir al proyecto**: leadvibes-preview
2. **Click**: "Actualizar" o "Update"
3. **Seleccionar rama**: feature/tdd-implementation-49percent
4. **Click**: "Deploy"

### Desde SSH (si el panel no funciona)

```bash
ssh root@srv1318804.hstgr.cloud
cd /var/www/leadvibes  # o donde esté clonado
git pull origin feature/tdd-implementation-49percent
docker-compose down
docker-compose up -d --build
```

---

## 🆘 Troubleshooting

### Problema: El proyecto no aparece en el panel

**Solución**: Verificar que Docker esté instalado
```bash
ssh root@srv1318804.hstgr.cloud
docker --version
docker-compose --version
```

Si no está instalado:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y
```

### Problema: "Error al clonar repositorio"

**Solución**: Verificar que el repositorio sea público

Si es privado:
- Configurar credenciales SSH en el panel
- O usar método manual (deploy.sh)

### Problema: Contenedores no inician

**Diagnóstico**:
```bash
docker-compose logs
```

**Solución**:
```bash
docker-compose down
docker-compose up -d --build
```

### Problema: No puedo acceder a los puertos

**Verificar firewall**:
```bash
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
```

### Problema: Error de conexión a MongoDB

**Verificar que MongoDB esté corriendo**:
```bash
docker-compose ps mongodb
docker-compose logs mongodb
```

**Verificar contraseña en .env** coincide con la configurada

---

## 📞 Soporte

### Hostinger

- **Panel**: https://panel.hostinger.com
- **Soporte**: https://support.hostinger.com
- **Tutoriales**: https://support.hostinger.com/en/articles/4983558-how-to-access-your-vps-using-ssh-command

### LeadVibes

- **GitHub**: https://github.com/softvibeslab/leadvibes
- **Issues**: https://github.com/softvibeslab/leadvibes/issues

---

## ✅ Checklist Final

Antes de considerar el deploy completo:

- [ ] Proyecto creado en el panel Docker
- [ ] Variables MONGO_ROOT_PASSWORD y JWT_SECRET cambiadas
- [ ] Contenedores corriendo (3 servicios)
- [ ] Frontend accesible en navegador
- [ ] Backend API responde a /api/health
- [ ] API Docs visible en /docs
- [ ] DNS configurado (si usas dominio)
- [ ] SSL configurado (si usas dominio)
- [ ] Backup automatizado configurado

---

## 🎉 ¡Felicidades!

Si llegaste hasta aquí, tu deploy está completo.

**URLs de tu aplicación**:

```
Frontend: http://tu-dominio.com o http://TU_IP/
Backend: http://api.tu-dominio.com o http://TU_IP:8000/
Docs: http://api.tu-dominio.com/docs o http://TU_IP:8000/docs
```

**Happy Coding!** 🚀

---

**Última actualización**: 2026-03-23
**Versión**: 1.0
**Autor**: @Alfred Agent

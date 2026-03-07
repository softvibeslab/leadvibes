# Guía Rápida - Panel Docker Hostinger

## Acceso al Panel

1. **Hostinger hPanel** → **Servidores** → **Docker Manager**
2. Selecciona tu VPS

## Método 1: Importar desde GitHub (Recomendado)

### Paso 1: Nuevo Proyecto desde Git

```
┌─────────────────────────────────────┐
│  [+ Create New Project]             │
└─────────────────────────────────────┘
```

### Paso 2: Seleccionar Origen

```
○ Upload from Computer
● Git Repository
○ Custom Stack
```

### Paso 3: Configurar Repositorio

```
Repository URL: https://github.com/softvibeslab/leadvibes.git
Branch: rovi_deploy
```

Click en **[ Continue ]**

### Paso 4: Detectar docker-compose

El panel detectará automáticamente el archivo `docker-compose.yml`

### Paso 5: Configurar Variables

Click en **[ Environment Variables ]** y agregar:

```
MONGO_ROOT_USERNAME       = admin
MONGO_ROOT_PASSWORD       = [INVENTAR_PASSWORD_SEGURO]
DB_NAME                   = rovi_crm
JWT_SECRET                = [GENERAR_CON_OPENSSL]
EMERGENT_LLM_KEY          = [TU_API_KEY]
CORS_ORIGINS              = http://[TU_IP]:3000
```

### Paso 6: Mapear Puertos

| Contenedor | Puerto Host | Puerto Container |
|------------|-------------|------------------|
| frontend   | 3000        | 80               |
| backend    | 8000        | 8000             |
| mongodb    | -           | 27017            |

### Paso 7: Deploy

Click en **[ Deploy Now ]**

## Método 2: Subir Archivos Manualmente

### Paso 1: Abrir File Manager

```
hPanel → [ File Manager ]
```

### Paso 2: Crear Estructura

```
public_html/rovi-crm/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   └── ...
└── frontend/
    ├── Dockerfile
    └── ...
```

### Paso 3: Subir Archivos

1. Click en **[ Upload ]**
2. Arrastra los archivos o selecciónalos
3. Sube: `docker-compose.yml`, carpetas `backend/` y `frontend/`

### Paso 4: Crear .env

1. Sube `.env.example`
2. Renombra a `.env` (click derecho → Rename)
3. Edita (click derecho → Edit) y completa valores

### Paso 5: Crear Proyecto

En Docker Manager:
```
[ Create New Project ] → [ Custom Stack ]
→ Selecciona directorio: /rovi-crm
→ [ Deploy ]
```

## Verificar Deployment

### En el Panel

```
Docker Manager → Mis Proyectos → rovi-crm
```

Deberías ver:

```
┌──────────────────────────────────────┐
│  rovi-crm                            │
│  ┌────────────────────────────────┐  │
│  │ rovi-mongodb    ● Running      │  │
│  │ rovi-backend   ● Running      │  │
│  │ rovi-frontend  ● Running      │  │
│  └────────────────────────────────┘  │
│  [ Logs ]  [ Restart ]  [ Delete ]  │
└──────────────────────────────────────┘
```

### Probar en Navegador

| URL | Qué Deberías Ver |
|-----|------------------|
| `http://TU_IP:3000` | Landing page de Rovi CRM |
| `http://TU_IP:8000/api/health` | `{"status": "healthy"}` |

## Ver Logs

```
Docker Manager → rovi-crm → [ Logs ]
→ Selecciona contenedor → Ver logs en tiempo real
```

## Reiniciar Servicios

```
Docker Manager → rovi-crm
→ [ Restart ] para reiniciar todos
→ Click en contenedor → [ Restart ] individual
```

## Actualizar

```
Opción A: Si usas Git
1. Haz push a GitHub
2. Docker Manager → rovi-crm → [ Pull & Redeploy ]

Opción B: Manual
1. Sube archivos modificados via File Manager
2. Docker Manager → rovi-crm → [ Rebuild ]
```

## Firewall en Hostinger

```
hPanel → Servidores → [ Manage ] → Firewall
```

Asegúrate de tener:

```
✓ TCP  22   (SSH)
✓ TCP  3000 (Frontend)
✓ TCP  8000 (Backend)
```

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Contenedor no inicia | Ver **Logs** para ver el error |
| Puerto ya en uso | Ver **Firewall**, detén otros servicios |
| Error de MongoDB | Verifica variables `MONGO_*` en `.env` |
| Frontend 404 | Verifica que `nginx.conf` esté subido |
| Error CORS | Verifica `CORS_ORIGINS` con tu IP |

## Checklist de Deployment

- [ ] Archivos subidos (docker-compose.yml, Dockerfiles, nginx.conf)
- [ ] `.env` creado con valores reales
- [ ] Puertos abiertos en Firewall (3000, 8000)
- [ ] Variables de entorno configuradas
- [ ] Proyecto creado en Docker Manager
- [ ] Contenedores en estado "Running"
- [ ] Frontend accesible en IP:3000
- [ ] Backend responde en IP:8000/api/health

## Tips

1. **Usa la versión hostinger del docker-compose**: `docker-compose.hostinger.yml`
   - Renómbralo a `docker-compose.yml` antes de subir

2. **Para editar variables**:
   - Docker Manager → Proyecto → Settings → Environment Variables

3. **Para ver IP del servidor**:
   - hPanel → Servidores → [ Manage ] → IP Address

4. **Guarda tus credenciales**:
   - Guarda `.env` localmente de forma segura
   - No lo commitees a GitHub

## Contacto

- Hostinger Support: https://support.hostinger.com
- Live Chat: 24/7 en hPanel

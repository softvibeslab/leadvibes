# Docker local (Mongo + backend + frontend)

## Requisitos

- [Docker Desktop](https://docs.docker.com/desktop/) (o Docker Engine + Compose plugin) en ejecución.
- Puertos libres por defecto en `docker-local.sample`: **13000** (web), **18080** (API), **27027** (Mongo).

Si esos puertos están ocupados, edita `.env` y cambia `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, `MONGO_HOST_PORT` (y `CORS_ORIGINS` para que coincida con el host del frontend).

## Arranque rápido

```bash
cd /path/to/leadvibes
cp docker-local.sample .env
docker compose up -d --build
```

- **Interfaz:** http://localhost:13000 (con la muestra por defecto)  
- **API directa:** http://localhost:18080/api/health  
- **MongoDB** (desde el host): `mongodb://admin:TU_PASSWORD@127.0.0.1:27027/` (usuario/clave según `.env`)

## Comandos útiles

```bash
docker compose logs -f backend
docker compose ps
docker compose down
```

Volúmenes: los datos de Mongo persisten en el volumen `mongodb_data`.

## Variables de puerto (compose)

En `docker-compose.yml` los puertos en el host se resuelven así:

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `MONGO_HOST_PORT` | 27017 | MongoDB |
| `BACKEND_HOST_PORT` | 8000 | FastAPI |
| `FRONTEND_HOST_PORT` | 3000 | Nginx (React) |

El archivo `docker-local.sample` fija **27027 / 18080 / 13000** para evitar choques con servicios típicos.

## Notas

- El backend en imagen usa **Python 3.11** (alineado con `requirements.txt` y `numpy` 2.x).
- El frontend se construye con **Yarn** y `yarn.lock`.
- `CORS_ORIGINS` en `.env` debe incluir la URL exacta desde la que abres el navegador (p. ej. `http://localhost:13000`).

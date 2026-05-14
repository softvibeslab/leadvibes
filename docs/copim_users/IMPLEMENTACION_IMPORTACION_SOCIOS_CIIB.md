# Implementacion importacion masiva de socios CIIB

Fecha: 2026-05-14
Rama: `codex/copim-members-import-photos`

## Resumen ejecutivo

Se implemento el modulo operativo para importar socios CIIB dentro del workspace COPIM. El flujo permite cargar CSV/XLSX, mapear columnas, previsualizar creaciones/actualizaciones, resolver duplicados por email/telefono y vincular fotos personales/logos desde archivos de media o ZIP.

La vista de socios ahora muestra la foto real importada en el avatar circular de la lista, las cards tipo pipeline y la ficha/perfil individual. Si el socio no tiene foto, el sistema mantiene el avatar generado por iniciales.

## Alcance implementado

- Ruta frontend: `/copim/members/import`.
- Acceso desde el boton `Importar socios` en `/copim/members`.
- Backend router: `/api/copim/import/members/*`.
- Almacenamiento local de media en `/app/uploads`.
- Servicio publico de archivos: `/api/uploads/...`.
- Importacion por asociacion usando el alcance COPIM del usuario logueado.
- Upsert/merge para evitar duplicar socios existentes.
- Soporte para crear membresias asociadas durante la importacion.
- Preview con estadisticas de creacion, actualizacion, duplicados, errores y media vinculada.
- Avatares reales en lista, pipeline y ficha de socio.
- Nginx local/staging/deploy ajustado para cargas grandes y para servir `/api/uploads` via backend.

## Archivos principales

Backend:

- `backend/copim_member_import.py`: flujo de upload, preview, execute, mapeo, deduplicacion y media.
- `backend/server.py`: registro del router y montaje de `StaticFiles` en `/api/uploads`.

Frontend:

- `frontend/src/pages/CopimMemberImportPage.js`: wizard de importacion.
- `frontend/src/pages/CopimMembersPage.js`: boton de importacion, avatars reales y ficha de socio.
- `frontend/src/components/copim/CopimModulePrimitives.js`: tamanos extendidos de avatar.
- `frontend/src/App.js`: ruta `/copim/members/import`.

Infra:

- `frontend/nginx.conf`
- `frontend/nginx.staging.conf`
- `deploy/nginx-production.conf`
- `deploy/nginx-development.conf`
- `deploy/nginx-preview.conf`

## Modelo de media

Las fotos y logos quedan copiados a:

```text
/api/uploads/copim/{tenant_id}/members/{member_id}/avatar.{ext}
/api/uploads/copim/{tenant_id}/members/{member_id}/company-logo.{ext}
```

El documento del socio guarda:

- `avatar_url`
- `profile_metadata.company_logo_url`
- `profile_metadata.avatar_source`
- `profile_metadata.company_logo_source`
- `profile_metadata.import_source`

## Nota de seguridad

La carpeta `docs/copim_users` contiene fuentes reales con datos personales, fotos, telefonos y correos. Por eso se agregaron reglas en `.gitignore` para no subir:

- CSV/XLSX/XLS
- `media/`
- `.DS_Store`

Solo se versiona la documentacion del flujo.

## Validacion local

Comandos usados:

```bash
python3 -m py_compile backend/copim_member_import.py backend/server.py
npm run build
docker compose up -d --build backend frontend
curl -fsS http://localhost:13000/api/health
curl -I http://localhost:13000/api/uploads/copim/tenant-7eff1060/members/bdd112e6-dc6b-47a7-ac01-3731ecd4ba74/avatar.jpg
```

Resultado esperado:

- API healthy.
- Frontend healthy.
- La foto importada responde `200 OK` desde `localhost:13000`.
- `/copim/members` muestra la foto real del socio cuando existe `avatar_url`.

## Pendientes recomendados

- Agregar tests automatizados del preview/execute con fixtures anonimizados.
- Crear una opcion de reintento para media no encontrada.
- Agregar compresion/resize de imagenes para reducir peso de avatars grandes.
- Mover almacenamiento de uploads a S3 compatible cuando se pase a produccion con multiples replicas.

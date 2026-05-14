# Plan de importacion masiva de socios CIIB para ROVI COPIM

Fecha de analisis: 2026-05-13
Carpeta analizada: `docs/copim_users`
Objetivo: crear un modulo de importacion masiva de socios CIIB con datos, membresias, fotos personales y logos empresariales, integrado a los roles COPIM.

## Estado de implementacion

Implementado en rama `codex/copim-members-import-photos`.

- Ruta operativa: `/copim/members/import`.
- Entrada desde `/copim/members` con boton `Importar socios`.
- Backend: router `/api/copim/import/members/*`.
- Media servida desde `/api/uploads`.
- Avatares reales visibles en lista, pipeline y perfil del socio.
- Configuracion nginx ajustada para uploads grandes y para priorizar `/api/` sobre assets estaticos.

Ver detalle tecnico en `docs/copim_users/IMPLEMENTACION_IMPORTACION_SOCIOS_CIIB.md`.

## 1. Estado actual detectado

### Asociacion CIIB

CIIB ya existe en el sistema como asociacion semilla y tambien en la base local:

- Nombre actual en backend seed: `CIIB Queretaro`.
- Coleccion: `copim_associations`.
- El seed esta en `backend/server.py`, dentro de `ensure_copim_seed_data`.
- En Mongo local hay varias instancias por tenant, porque cada usuario COPIM demo crea su propio tenant semilla.
- Tenant demo nacional mas util para pruebas: `tenant-7eff1060`.
- Usuario nacional asociado a ese tenant: `nacional@copim.mx`.
- Usuario operador local CIIB detectado: `operacion.ciib@copim.mx`, rol `copim_operator`, ligado a la asociacion `CIIB Queretaro` dentro de `tenant-7eff1060`.

Recomendacion: mantener `name = CIIB Queretaro`, pero agregar campos de alias:

- `short_name`: `CIIB`.
- `legal_name`: `Colegio de Inmobiliarios de Queretaro A.C.`
- `slug`: `ciib-queretaro`.
- `external_codes`: `["CIIB", "CIIB_QRO"]`.

Esto evita romper datos existentes y permite que el importador encuentre CIIB aunque el archivo diga `CIIB`, `CIIB QRO` o `CIIB Queretaro`.

## 2. Archivos fuente analizados

La carpeta contiene:

- `¡ Registro quiero ser socio CIIB! 🚀_Submissions_2026-05-13.csv`
- `¡Bienvenido al Registro de Socios CIIB! 🚀_Submissions_2026-05-13.csv`
- `BASE DE DATOS SOCIOS CIIB. .xlsx`
- `media/` con fotos y logos.

### Conteo de datos

CSV nuevo:

- 7 filas.
- 48 columnas.
- Incluye datos narrativos largos: valores profesionales, reto del sector, vision a 2 anos y expectativa del CIIB.

CSV bienvenido:

- 28 filas.
- 43 columnas.
- Incluye fecha de ingreso y tipo de membresia.

XLSX base:

- Hoja `Organizada`: 29 socios con ID CIIB, telefono, email, ciudad, empresa, giro, fecha de ingreso, tipo de membresia y fecha de nacimiento.
- Hoja `FALTA DE REGISTRO`: 14 telefonos/personas no registradas o sin identificar.
- Hoja `Hoja 4`: 41 nombres con telefono y link WhatsApp.

Media:

- 56 archivos.
- Tipos: 44 imagenes JPG/JPEG, 11 PNG, 1 SVG.
- Hay referencias en CSV a fotos/logos de Tally.
- Match exacto local detectado:
  - Logos: 17 de 35 referencias.
  - Fotos: 19 de 35 referencias.
- Hay archivos que no hacen match exacto por diferencias de nombre, espacios, guiones, mayusculas, acentos o porque Tally referencio archivos que no estan en `media`.

### Duplicados detectados

Combinando CSV + hoja `Organizada`:

- 64 registros brutos.
- 35 contactos unicos aproximados.
- 34 emails unicos.
- 34 telefonos unicos.
- 28 valores de email repetidos.
- 28 valores de telefono repetidos.
- 26 nombres repetidos.

Lectura: el XLSX y los CSV se pisan parcialmente. El importador debe ser de tipo **upsert/merge**, no solo insert.

## 3. Modelo de importacion recomendado

El importador debe importar hacia estas colecciones:

- `copim_members`
- `copim_memberships`
- `copim_invoices`, opcional si se desea crear adeudos/cobros.
- `users`, opcional si se quiere provisionar acceso portal.
- `media_assets` o almacenamiento local `/uploads`, para fotos y logos.
- `import_jobs` e `import_data`, reutilizando el patron actual del importador de leads/productos.

### Campos principales de socio

Mapear a `copim_members`:

| Campo destino | Fuente probable |
|---|---|
| `full_name` | `Nombre Completo`, `Nombre` |
| `email` | `Correo electronico principal`, `Email` |
| `phone` | `Telefono movil / WhatsApp`, `Telefono` |
| `association_id` | seleccionado en UI: CIIB |
| `city` | `Ciudad y estado de residencia`, `Ciudad` |
| `specialty` | `Giro de la empresa`, `Como te defines dentro del ecosistema inmobiliario` |
| `company_name` | `Nombre comercial de la empresa`, `Empresa`, `Empresa / Razon social` |
| `title` | `Profesion`, `Como te defines...`, `Giro` |
| `avatar_url` | foto personal desde Tally/media |
| `bio` | descripcion profesional + valores |
| `certifications` | licencia, mentor, areas de interes |
| `join_date` | `Fecha de Ingreso al CIIB`, `Fecha Ingreso` |
| `member_status` | `active` si viene del XLSX/base, `pending` si solo viene del registro nuevo |
| `review_state` | `approved` para base organizada, `submitted` para solicitudes nuevas |
| `membership_tier` | normalizar `Anual`, `Mensual`, vacio |
| `credential_status` | `issued` si activo, `pending` si solicitud |
| `directory_visible` | true por default, false si esta incompleto |
| `notes` | fuente, observaciones, campos no mapeados |

### Campos nuevos recomendados

El modelo actual de `CopimMemberCreate` cubre lo basico, pero CIIB trae informacion mas rica. Recomiendo extender `copim_members` con:

- `external_member_id`: ejemplo `CIIB25-001`.
- `birth_date`.
- `company_legal_name`.
- `company_address`.
- `tax_regime`.
- `business_start_date`.
- `team_type`.
- `team_size`.
- `license_status`.
- `license_number`.
- `website`.
- `social_links`: `{ facebook, instagram, linkedin }`.
- `company_logo_url`.
- `affiliation_source`.
- `affiliation_motives`: lista de areas marcadas.
- `mentor_interest`.
- `profession`.
- `participation_frequency`.
- `professional_values`.
- `sector_challenge_opinion`.
- `two_year_goal`.
- `ciib_expectation`.
- `import_source`: nombre de archivo y fila.
- `import_fingerprint`: hash para deduplicacion.

Estos campos pueden vivir primero como `profile_metadata` para no bloquear el importador por cambios de UI.

## 4. Estrategia para fotos y logos

El modulo debe soportar tres formas de media:

1. URL original de Tally.
2. Archivo local en `docs/copim_users/media`.
3. Archivo subido en un ZIP junto al CSV/XLSX.

### Matching de archivos

Reglas de match:

1. Match exacto por filename.
2. Match normalizado:
   - minusculas.
   - quitar acentos.
   - reemplazar espacios, guiones y underscores por separador unico.
   - ignorar extension si el nombre base coincide.
3. Match fuzzy por similitud mayor a 0.86.
4. Si no hay match:
   - conservar URL Tally como `remote_source_url`.
   - marcar `media_status = missing_local`.
   - permitir resolver manualmente en preview.

### Almacenamiento

Agregar en backend:

- `UPLOAD_DIR=/app/uploads`
- `StaticFiles` para servir `/uploads`.

Estructura sugerida:

```text
uploads/
  copim/
    {tenant_id}/
      associations/
        {association_id}/
          logos/
      members/
        {member_id}/
          avatar.{ext}
          company-logo.{ext}
```

Campos:

- `copim_members.avatar_url = /uploads/copim/{tenant_id}/members/{member_id}/avatar.jpg`
- `copim_members.company_logo_url = /uploads/copim/{tenant_id}/members/{member_id}/company-logo.png`
- `copim_associations.logo_url` para logo de CIIB si se importa logo institucional.

Validaciones:

- Max 8 MB por imagen.
- Extensiones permitidas para avatar: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Logos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg` con sanitizacion.
- No servir PDF como imagen. Si aparece `logo-firmante.pdf`, marcar como archivo no soportado o convertir manualmente.

## 5. Flujo UX recomendado

Crear una ruta COPIM:

- Consejo nacional: `/copim/members/import`
- Asociacion local: `/copim/association/members/import`

Tambien agregar boton en `CopimMembersPage`:

- `Importar socios`

### Paso 1: Seleccionar alcance

Campos:

- Asociacion destino: CIIB Queretaro.
- Modo:
  - Solo crear nuevos.
  - Actualizar existentes.
  - Merge inteligente recomendado.
- Estado inicial:
  - Activo.
  - Pendiente.
  - Segun fuente.
- Crear membresias automaticamente: si/no.
- Provisionar acceso portal: si/no.

Reglas por rol:

- `copim_admin`: puede seleccionar cualquier asociacion.
- `copim_operator`: solo puede importar a su `linked_copim_association_id`.
- `copim_member`: no puede importar.

### Paso 2: Subir datos y media

Opciones:

- CSV/XLSX principal.
- ZIP opcional con `media`.
- O carga multiple de imagenes.

Para este caso:

- Subir los dos CSV y el XLSX como fuentes separadas.
- Subir `media` como ZIP.

### Paso 3: Mapeo de columnas

Reutilizar UI de `ImportLeadsPage`:

- Auto-mapping por aliases.
- Campos requeridos: nombre + email o telefono.
- Asociacion destino obligatoria.
- Vista de columnas detectadas.
- Preview de 10 filas.

Campos requeridos minimos:

- `full_name`.
- `email` o `phone`.
- `association_id`.

### Paso 4: Duplicados y merge

Deduplicar en este orden:

1. `external_member_id`.
2. `email`.
3. `phone`.
4. `full_name + company_name`.
5. `full_name + city`.

Prioridad de fuentes:

1. Registro existente en Mongo, si ya existe.
2. XLSX `Organizada`, porque parece base oficial de socios.
3. CSV `Bienvenido`, porque trae membresia y alta.
4. CSV `Registro quiero ser socio`, porque trae narrativa y campos extra.
5. Hoja `FALTA DE REGISTRO` y `Hoja 4` como pendientes de completar.

Acciones posibles por fila:

- Crear socio.
- Actualizar socio.
- Omitir duplicado.
- Fusionar informacion.
- Marcar como pendiente de validacion.

### Paso 5: Media matching

Pantalla especial:

- Foto detectada.
- Logo detectado.
- Status:
  - exact match.
  - fuzzy match.
  - remote only.
  - missing.
  - unsupported.
- Selector manual para corregir.

### Paso 6: Preview final

KPIs:

- Registros brutos.
- Socios unicos.
- Nuevos.
- Actualizados.
- Duplicados omitidos.
- Errores.
- Fotos vinculadas.
- Logos vinculados.
- Membresias a crear.
- Facturas a crear, si aplica.

Tabla:

- Nombre.
- Email.
- Telefono.
- Empresa.
- Membresia.
- Estado.
- Foto.
- Logo.
- Accion.
- Errores.

### Paso 7: Ejecutar importacion

El backend debe procesar en bulk:

- Insert/update `copim_members`.
- Crear/actualizar `copim_memberships`.
- Opcional: crear `copim_invoices`.
- Copiar imagenes a `/uploads`.
- Actualizar `copim_associations.member_count`, `active_members`, `pending_members`.
- Guardar `import_jobs`.
- Emitir eventos realtime usando `emit_import_completed`.

## 6. Endpoints propuestos

Reutilizar `ImportJob`, pero con `import_kind = "copim_members"`.

```text
GET  /api/copim/import/members/fields
POST /api/copim/import/members/upload
POST /api/copim/import/members/preview
POST /api/copim/import/members/execute
GET  /api/copim/import/members/jobs
GET  /api/copim/import/members/jobs/{job_id}
POST /api/copim/import/members/{job_id}/resolve-media
```

### `POST /upload`

Multipart:

- `data_files`: uno o varios CSV/XLSX.
- `media_zip`: opcional.
- `association_id`.
- `merge_strategy`: `smart_merge`, `create_only`, `update_only`.
- `create_memberships`: bool.
- `default_member_status`: `source`, `active`, `pending`.

Respuesta:

- `job_id`.
- `headers_by_file`.
- `sample_data`.
- `mapping_suggestions`.
- `media_summary`.
- `duplicate_summary`.
- `available_fields`.

### `POST /preview`

Payload:

- `job_id`.
- `mapping`.
- `media_mapping`.
- `dedupe_rules`.
- `membership_rules`.

Respuesta:

- `preview_rows`.
- `stats`.
- `errors`.
- `media_matches`.
- `duplicates`.

### `POST /execute`

Payload:

- `job_id`.
- `mapping`.
- `confirmed_media_mapping`.
- `confirmed_duplicate_actions`.

Respuesta:

- `imported_count`.
- `updated_count`.
- `skipped_count`.
- `membership_created_count`.
- `media_linked_count`.
- `error_count`.
- `errors`.
- `association_summary`.

## 7. Frontend propuesto

Crear:

- `frontend/src/pages/CopimMemberImportPage.js`

Reutilizar:

- `ImportPreviewTable`.
- `ImportProgress`.
- Componentes UI existentes.
- Estilo COPIM de `CopimMembersPage`.

Agregar ruta en `App.js`:

```text
/copim/members/import
```

Agregar boton en `CopimMembersPage`:

```text
Importar socios
```

Para `copim_operator`, la pagina debe ocultar selector de asociacion y usar su CIIB ligado.

## 8. Plan de implementacion por fases

### Fase 1: Backend parser y preview

Archivos:

- `backend/models.py`
- `backend/server.py` o nuevo router `backend/copim_import.py`

Tareas:

- Crear `COPIM_MEMBER_IMPORT_FIELDS`.
- Crear aliases de columnas CIIB.
- Parsear multiples CSV/XLSX.
- Normalizar telefonos, emails, fechas Excel serial y texto.
- Detectar duplicados.
- Generar preview.

Resultado esperado: subir archivos y ver preview sin escribir datos finales.

### Fase 2: Media

Tareas:

- Aceptar ZIP/media.
- Crear normalizador de filenames.
- Copiar archivos a `/app/uploads`.
- Servir `/uploads`.
- Resolver match exacto/fuzzy/manual.
- Validar extensiones y tamanos.

Resultado esperado: preview muestra foto/logo por socio antes de importar.

### Fase 3: Execute/import

Tareas:

- Upsert de miembros.
- Crear membresias.
- Actualizar conteos de asociacion.
- Registrar errores por fila.
- Emitir evento realtime.

Resultado esperado: CIIB queda poblado en `/copim/members` con fotos.

### Fase 4: UI COPIM

Tareas:

- Crear pagina importadora.
- Boton desde miembros.
- Flujo por pasos.
- Preview de media.
- Resultado final.

Resultado esperado: el equipo COPIM puede importar sin tocar scripts.

### Fase 5: Validacion y pruebas

Tareas:

- Tests de parser CSV/XLSX.
- Tests de deduplicacion.
- Tests de permisos `copim_admin` vs `copim_operator`.
- Tests de media matching.
- Smoke E2E contra API local.

## 9. Reglas especificas para los datos actuales

Para este lote CIIB:

- Usar `BASE DE DATOS SOCIOS CIIB. .xlsx / Organizada` como fuente maestra de membresia.
- Usar los CSV de Tally para enriquecer perfil, redes, logos, fotos y motivaciones.
- Tratar `FALTA DE REGISTRO` como backlog de contactos incompletos, no como socios activos.
- Tratar `Hoja 4` como tabla auxiliar de WhatsApp, no como fuente principal.
- Crear aproximadamente 35 socios unicos.
- Crear membresias:
  - `Anual` -> `billing_period = annual`.
  - `Mensual` -> `billing_period = monthly`.
  - vacio -> no crear membresia o crear `plan_name = Pendiente`.
- Si existe en DB por email/telefono, actualizar en vez de duplicar.

## 10. Criterios de aceptacion

El modulo esta listo cuando:

- Un admin COPIM puede importar CSV/XLSX + ZIP de fotos/logos.
- Un operador CIIB solo puede importar a CIIB.
- El preview detecta duplicados antes de ejecutar.
- El preview muestra foto/logo si hay match.
- La ejecucion crea/actualiza socios y membresias.
- Los socios importados aparecen en `/copim/members`.
- Las fotos aparecen en directorio, credencial y portal de socio.
- Los conteos de CIIB se actualizan correctamente.
- El resultado muestra importados, actualizados, omitidos, errores y media vinculada.

## 11. Riesgos y decisiones pendientes

- Definir si `CIIB Queretaro` se renombra visualmente a `CIIB` o solo se agrega alias.
- Definir si se crean usuarios portal automaticamente para todos o solo para activos.
- Definir precio de membresia mensual/anual si el XLSX no trae monto.
- Definir si se permite servir SVG como logo o si se convierte a PNG.
- Definir si las URLs privadas de Tally se intentan descargar o solo se usan como referencia local.
- Definir si los registros sin email pero con telefono entran como pendientes o requieren revision manual.

## 12. Implementacion inicial completada

Fecha de avance: 2026-05-13

Se implemento la primera version funcional del importador dentro de ROVI COPIM:

- Backend nuevo: `backend/copim_member_import.py`.
- Ruta frontend nueva: `/copim/members/import`.
- Pantalla nueva: `frontend/src/pages/CopimMemberImportPage.js`.
- Boton agregado en `CopimMembersPage`: `Importar socios`.
- Uploads servidos desde `/api/uploads` para fotos y logos importados.
- Endpoints activos:
  - `GET /api/copim/import/members/fields`
  - `POST /api/copim/import/members/upload`
  - `POST /api/copim/import/members/preview`
  - `POST /api/copim/import/members/execute`
  - `GET /api/copim/import/members/jobs`

Alcance incluido:

- Carga multiple de CSV/XLSX.
- Carga opcional de imagenes sueltas o ZIP.
- Automapping por aliases CIIB.
- Preview con crear, actualizar, omitir duplicado, errores, membresias y media vinculada.
- Execute con upsert de `copim_members`.
- Creacion automatica de `copim_memberships` cuando existe tipo de membresia.
- Copia de avatar y logo por socio cuando hay match exacto/fuzzy.
- Restriccion por rol: `copim_admin` puede elegir asociacion; `copim_operator` queda limitado a su asociacion local.

Validacion local realizada:

- `python3 -m py_compile backend/server.py backend/copim_member_import.py`.
- `npm run build` en frontend, compilando con warnings historicos de hooks ya existentes.
- Smoke API contra Docker local:
  - Login `nacional@copim.mx`.
  - `fields` devuelve 36 campos.
  - `upload` de CSV minimo devuelve 1 fila.
  - `preview` devuelve `create_count = 1` y `membership_count = 1`.
  - `preview` con los 3 archivos reales de `docs/copim_users` devuelve 64 filas, 34 posibles creaciones, 29 duplicados internos, 27 membresias y 1 fila incompleta sin email/telefono.
  - Job de prueba eliminado despues de validar.
- Smoke UI con Playwright:
  - `/copim/members/import` renderiza correctamente despues de autenticar.
- Correccion de uploads grandes:
  - Nginx local/staging/deploy ahora permite `client_max_body_size 200m`.
  - `/api/` usa `proxy_request_buffering off` y timeouts de 180s.
  - Validado upload por `localhost:13000/api` con ZIP de media de 22 MB: 28 filas y 56 imagenes detectadas.

Pendiente recomendado para la siguiente iteracion:

- Resolver media manual desde la vista previa cuando el match fuzzy no sea suficiente.
- Agregar endpoint `GET /jobs/{job_id}`.
- Agregar tests unitarios de parser/deduplicacion con archivos reales anonimizados.
- Decidir si se provisionan usuarios portal durante la importacion o en una accion posterior.

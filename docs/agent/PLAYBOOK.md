# Playbook

## Al Iniciar Una Tarea

1. Identifica dominio: CRM, agencia, rentas, COPIM, ROVI interno, marketplace, IA o deploy.
2. Lee archivos existentes del modulo antes de editar.
3. Ubica rutas backend y frontend relacionadas.
4. Define usuarios afectados y permisos.
5. Decide pruebas minimas antes de tocar archivos.

## Feature Nueva

Backend:

1. Modelo en `backend/models.py` si la entidad es de dominio compartido.
2. Router modular si el feature es grande; endpoint local en `server.py` solo si sigue un bloque existente.
3. Autenticacion con `get_current_user`.
4. Filtro por tenant/workspace activo.
5. Serializacion con `serialize_doc()`.
6. Test smoke o unit si el riesgo lo amerita.

Frontend:

1. Pagina en `frontend/src/pages`.
2. Ruta en `frontend/src/App.js`.
3. Guard correcto segun workspace.
4. Navegacion en `frontend/src/components/Sidebar.js`.
5. API desde `useAuth().api`.
6. UI con shadcn/ui y lucide-react.

## Bug

1. Reproduce mentalmente o con comando.
2. Busca el punto exacto con `rg`.
3. Corrige el menor area posible.
4. Verifica con prueba o comando.
5. Si el bug era de permisos o tenancy, revisa rutas similares.

## Cambios En Auth O Workspaces

Revisar siempre:

- `backend/auth.py`
- `backend/server.py` rutas `/auth/*`
- `frontend/src/context/AuthContext.js`
- `frontend/src/App.js`
- `frontend/src/lib/copimAccess.js`
- `frontend/src/components/Sidebar.js`

Validar login, refresh, switch workspace, redirect de home y logout.

## Cambios En Deploy

Revisar siempre:

- `docker-compose.yml`
- `docker-compose.dev.yml`
- `docker-compose.preview.yml`
- `docker-compose.hostinger.yml`
- `docker-local.sample`
- `docs/DEPLOYMENT_URLS.md`
- `docs/DOCKER_LOCAL.md`
- workflows de `.github/workflows/`

No cambiar puertos o DB names sin documentarlo.

## Cambios En Integraciones

No asumir llaves. Implementar:

- validacion de configuracion faltante,
- errores claros,
- fallback sin tumbar la app,
- tests con mocks o smoke cuando sea posible.

## Checklist De Cierre

- El cambio respeta `tenant_id`.
- El frontend usa `api` de AuthContext.
- Las rutas tienen guard correcto.
- Los errores importantes se manejan con HTTP status claro.
- Se corrio al menos una verificacion.
- La wiki se actualizo si aparecio conocimiento nuevo.


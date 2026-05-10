# ROVI AI Control Tower

Modulo interno para configurar agentes de IA por rol, knowledge base y medicion de consumo.

## Variables de entorno

No guardar tokens en Git. En local o VPS agrega:

```bash
ROVI_AI_PROVIDER=chat.z
ROVI_AI_DEFAULT_MODEL=glm-5
ROVI_AI_BASE_URL=https://api.z.ai/api/paas/v4
ROVI_AI_KEY_ENV=ROVI_AI_API_KEY
ROVI_AI_API_KEY=<token-secreto>
ROVI_AI_USD_TO_MXN=18.5
```

El backend usa un endpoint compatible con Chat Completions. Si el proveedor de `chat.z` entrega otra base URL, cambia `ROVI_AI_BASE_URL` sin tocar codigo.

## Endpoints principales

- `GET /api/ai-control/dashboard`: torre de control con tokens, costos, runs, configuraciones y archivos.
- `GET /api/ai-control/configs`: configuraciones por rol.
- `PUT /api/ai-control/configs/{config_id}`: modelo, prompt, permisos y presupuesto.
- `POST /api/ai-control/knowledge-files`: carga e indexa archivos por rol o global.
- `POST /api/ai-control/test-run`: prueba un agente desde el workspace interno.
- `GET /api/ai-agent/config`: configuracion publica del agente del usuario logeado.
- `POST /api/ai-agent/run`: ejecucion runtime con contexto filtrado por usuario/tenant.

## Roles soportados

- `rovi_admin`
- `rovi_sales`
- `rovi_marketing`
- `rovi_customer_success`
- `rovi_ops`
- `copim_council`
- `copim_association`
- `copim_member`
- `agency_admin`
- `broker`

## Datos que usa el agente

El agente nunca recibe acceso libre a MongoDB. El backend arma un contexto seguro usando el usuario logeado:

- Leads y metricas filtradas por `tenant_id`.
- Para brokers de inmobiliaria, leads asignados o creados por el usuario.
- Contexto COPIM solo para roles COPIM.
- Metricas ROVI internal solo para roles internos.
- Productos de marketplace publicados.
- Chunks relevantes de la base de conocimiento por rol o global.

## Medicion

Cada ejecucion crea:

- `agent_runs`: prompt, respuesta, estado, latencia, fuentes y herramientas.
- `agent_usage_events`: tokens de entrada/salida, costo estimado USD/MXN, modelo, rol y tenant.

Los costos son estimados. Cuando el proveedor devuelva usage real, el sistema usa esos tokens; si no, calcula una aproximacion por caracteres.

# ROVI AI Control Tower

Modulo interno para configurar agentes de IA por rol, knowledge base y medicion de consumo.

Ver tambien: `docs/ROVI_AI_WORKSPACE_CONTROL_TOWER_IMPLEMENTATION.md` para el cierre tecnico de la implementacion local.

## Variables de entorno

No guardar tokens en Git. En local o VPS agrega:

```bash
ROVI_AI_PROVIDER=chat.z
ROVI_AI_DEFAULT_MODEL=glm-5
ROVI_AI_BASE_URL=https://api.z.ai/api/paas/v4
ROVI_AI_KEY_ENV=ROVI_AI_API_KEY
ROVI_AI_API_KEY=<token-secreto>
ROVI_AI_USD_TO_MXN=18.5
# Opcional si el grafo vive fuera de graphify-out:
ROVI_WORKSPACE_GRAPH_PATH=/ruta/rovi-project-with-docs-graph.json
```

El backend usa un endpoint compatible con Chat Completions. Si el proveedor de `chat.z` entrega otra base URL, cambia `ROVI_AI_BASE_URL` sin tocar codigo.

## Ollama local

La torre de control permite usar `provider=ollama` sin API key. El backend llama el endpoint compatible con OpenAI de Ollama (`/v1/chat/completions`).

1. Instalar y levantar Ollama en la maquina host.
2. Descargar un modelo, por ejemplo:

```bash
ollama pull qwen2.5:3b
```

3. En `/rovi/ai-control`, pestana `Agentes`, elegir preset `Ollama local`.
4. Usar esta Base URL segun el entorno:

- Backend dentro de Docker: `http://host.docker.internal:11434`
- Backend corriendo directo en tu Mac: `http://localhost:11434`

Ollama queda marcado como costo estimado `$0` porque corre localmente.

## Endpoints principales

- `GET /api/ai-control/dashboard`: torre de control con tokens, costos, runs, configuraciones y archivos.
- `GET /api/ai-control/configs`: configuraciones por rol.
- `PUT /api/ai-control/configs/{config_id}`: modelo, prompt, permisos y presupuesto.
- `POST /api/ai-control/knowledge-files`: carga e indexa archivos por rol o global.
- `GET /api/ai-control/knowledge/rovi-workspace/preview`: vista previa del grafo Graphify filtrado para Workspace ROVI.
- `POST /api/ai-control/knowledge/rovi-workspace/import`: indexa el grafo Graphify en el scope `rovi_internal`.
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
- Chunks del knowledge graph de Graphify en `rovi_internal`, disponibles solo para roles internos `rovi_*`.

## Knowledge Graph del Workspace ROVI

El modulo puede convertir el grafo generado por Graphify en base de conocimiento para los agentes internos de ROVI.

Flujo recomendado:

1. Generar o actualizar `graphify-out/rovi-project-with-docs-graph.json`.
2. En Docker, el directorio `./graphify-out` se monta como lectura en `/app/project-graphify-out`.
3. Entrar a `/rovi/ai-control`, pestana `Base`, y usar `Indexar grafo ROVI`.
4. El backend filtra nodos relacionados con `RoviInternalWorkspacePage`, `RoviAIControlTowerPage`, `agent_control.py`, `rovi_internal.py` y docs ROVI.
5. Se guarda como un archivo de conocimiento con `source_kind=graphify_rovi_workspace` y `role_scope=rovi_internal`.

Esto mantiene el grafo tecnico/documental separado de COPIM, brokers, inmobiliarias y asociaciones.

## Medicion

Cada ejecucion crea:

- `agent_runs`: prompt, respuesta, estado, latencia, fuentes y herramientas.
- `agent_usage_events`: tokens de entrada/salida, costo estimado USD/MXN, modelo, rol y tenant.

Los costos son estimados. Cuando el proveedor devuelva usage real, el sistema usa esos tokens; si no, calcula una aproximacion por caracteres.

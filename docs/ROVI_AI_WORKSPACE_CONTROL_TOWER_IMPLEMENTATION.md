# ROVI AI Workspace Control Tower - Implementacion

Documento de cierre para la implementacion local del modulo de IA del Workspace interno de ROVI.

## Objetivo

Convertir el Workspace interno de ROVI en una torre de control para agentes de IA por rol, con:

- Configuracion visual de proveedor, modelo, prompt, herramientas y presupuesto.
- Soporte para proveedores remotos OpenAI-compatible.
- Soporte para Ollama local sin API key.
- Base de conocimiento por rol y scope interno ROVI.
- Indexacion del knowledge graph de Graphify solo para el Workspace ROVI.
- Dashboard de consumo, tokens, costos, latencia y runs.

## Alcance implementado

### Backend

Archivo principal: `backend/agent_control.py`.

Se agrego:

- Scope interno `rovi_internal` para conocimiento exclusivo del Workspace ROVI.
- Labels de scopes de conocimiento para `global`, `rovi_internal` y roles existentes.
- Busqueda de conocimiento que agrega `rovi_internal` solo para roles internos `rovi_*`.
- Importador de Graphify:
  - Detecta `graphify-out/rovi-project-with-docs-graph.json`.
  - Filtra nodos relacionados con `agent_control.py`, `rovi_internal.py`, pantallas ROVI y docs operativos.
  - Crea chunks en `agent_knowledge_chunks`.
  - Registra un archivo virtual con `source_kind=graphify_rovi_workspace`.
- Endpoints:
  - `GET /api/ai-control/knowledge/rovi-workspace/preview`
  - `POST /api/ai-control/knowledge/rovi-workspace/import`
- Soporte para Ollama:
  - `provider=ollama` no requiere API key.
  - Usa endpoint OpenAI-compatible `/v1/chat/completions`.
  - Si la Base URL no incluye `/v1`, el backend la agrega automaticamente.
  - Costo estimado en `$0`.
  - Mensaje de error mas claro cuando el modelo no esta instalado localmente.
- `public_config` ahora expone:
  - `api_key_required`
  - `api_key_configured`

### Frontend

Archivo principal: `frontend/src/pages/RoviAIControlTowerPage.js`.

Se mejoro la experiencia de configuracion:

- Tabs controladas para que `Agentes`, `Base` y `Prueba` no regresen a `Torre` al guardar o recargar datos.
- Prompt Studio con presets visuales:
  - `Chat.Z / GLM`
  - `Ollama local`
  - `OpenAI compatible`
- Selector de modelos recomendados por proveedor.
- Campo de modelo final personalizable.
- Bloque visual de conexion activa.
- Campo de Base URL con ayuda contextual para Ollama.
- Variable de API key con indicador visual.
- Slider de temperatura.
- Presupuesto y max output tokens en un bloque de comportamiento.
- Badges de estado:
  - `key ok`
  - `sin key`
  - `local`
- Tarjeta `Knowledge Graph ROVI` en la pestana `Base`.
- Boton `Indexar grafo ROVI` / `Actualizar grafo ROVI`.

### Docker/local

Archivos:

- `docker-compose.yml`
- `docker-local.sample`

Se agrego:

- `ROVI_WORKSPACE_GRAPH_PATH` como variable opcional.
- Montaje de `./graphify-out` dentro del backend:

```yaml
./graphify-out:/app/project-graphify-out:ro
```

Esto permite que el backend dentro de Docker lea el grafo generado por Graphify sin copiar archivos manualmente.

### Documentacion

Archivo actualizado: `docs/AI_AGENT_CONTROL_TOWER.md`.

Se documento:

- Variables de entorno del proveedor IA.
- Uso de Ollama local.
- Endpoints de Graphify/knowledge graph.
- Flujo para indexar el grafo desde la UI.
- Separacion del scope `rovi_internal`.

## Flujo para probar local

URL local:

```text
http://localhost:13000/rovi/ai-control
```

Usuario recomendado:

```text
admin@rovicrm.com
demo123
```

Otros usuarios ROVI internos:

- `sales@rovicrm.com`
- `marketing@rovicrm.com`
- `cs@rovicrm.com`
- `ops@rovicrm.com`

Todos usan password:

```text
demo123
```

## Configurar Ollama local

Modelos detectados localmente durante la prueba:

- `qwen2.5:3b`
- `llama3.2:latest`
- `phi3:mini`

El preset de Ollama quedo usando:

```text
qwen2.5:3b
```

Para descargar otro modelo:

```bash
ollama pull llama3.1:8b
```

Base URL recomendada:

```text
http://host.docker.internal:11434
```

Si el backend corre fuera de Docker:

```text
http://localhost:11434
```

## Knowledge graph de Graphify como base de conocimiento

La fuente esperada es:

```text
graphify-out/rovi-project-with-docs-graph.json
```

Desde la UI:

1. Entrar a `/rovi/ai-control`.
2. Ir a `Base`.
3. Usar `Indexar grafo ROVI`.

Resultado validado localmente:

- Scope: `rovi_internal`
- Nodos: `195`
- Relaciones: `263`
- Chunks: `19`

Estos chunks solo entran en contexto para roles internos ROVI (`rovi_*`).

## Validaciones realizadas

Comandos ejecutados:

```bash
python3 -m py_compile backend/agent_control.py backend/server.py
cd frontend && npm run build
docker compose up -d --build backend frontend
curl -fsS http://localhost:18080/api/health
```

Prueba real con Ollama:

```text
success: True
provider: ollama
model: qwen2.5:3b
cost_mxn: 0.0
response: OK
```

Notas:

- El build de frontend compila con warnings historicos de `react-hooks/exhaustive-deps` en pantallas no relacionadas.
- `.env` no se debe commitear.
- `graphify-out/` permanece ignorado por git.

## Archivos modificados

- `backend/agent_control.py`
- `frontend/src/pages/RoviAIControlTowerPage.js`
- `docker-compose.yml`
- `docker-local.sample`
- `docs/AI_AGENT_CONTROL_TOWER.md`
- `docs/ROVI_AI_WORKSPACE_CONTROL_TOWER_IMPLEMENTATION.md`


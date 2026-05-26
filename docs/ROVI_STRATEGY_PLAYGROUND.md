# ROVI Strategy Playground

Modulo estrategico construido sobre `DatabaseChatPage.js` para convertir preguntas de negocio en dashboards, grafos y planes de accion.

## Objetivo

Crear un asistente estratega que ayude a responder:

- Cual es la ruta critica del negocio.
- Que KPIs importan para decidir hoy.
- Que graficas debe ver el equipo para actuar.
- Que conocimiento debe transferirse a agentes especializados por rol.
- Que conexiones existen entre CRM, COPIM, marketplace, Workspace ROVI y documentacion tecnica.

## Arquitectura

### Frontend

Archivo:

```text
frontend/src/pages/DatabaseChatPage.js
```

La pantalla ahora tiene dos modos:

- `Estratega`: genera analisis, KPIs, ruta critica, plan de accion, handoffs y grafo Graphify.
- `Datos`: mantiene el chat de consulta directa a MongoDB usando lenguaje natural.

Componentes visuales incluidos:

- Prompt cards para preguntas guia.
- Conversacion estrategica.
- Dashboard dinamico con `recharts`.
- Vista de Knowledge Graph con nodos y relaciones relevantes.
- Panel de estado del modo, Graphify y tenant seguro.

### Backend

Archivo:

```text
backend/agent_control.py
```

Endpoint:

```text
POST /api/strategy-playground/run
```

Payload:

```json
{
  "question": "Cual es la ruta critica del negocio esta semana?",
  "role_scope": "rovi_admin",
  "include_context": true
}
```

Respuesta principal:

```json
{
  "success": true,
  "ai_success": true,
  "role_scope": "rovi_admin",
  "strategy": {
    "answer": "...",
    "executive_summary": "...",
    "kpis": [],
    "charts": [],
    "critical_path": [],
    "action_plan": [],
    "agent_handoffs": [],
    "dashboard": {
      "uid": "rovi-...",
      "panels": []
    },
    "knowledge_graph": {
      "nodes": [],
      "links": []
    }
  }
}
```

## Dashboard dinamico tipo Grafana

El modulo genera `strategy.dashboard` con un contrato inspirado en los dashboards persistentes de Grafana:

```json
{
  "uid": "rovi-...",
  "title": "ROVI Strategy - ...",
  "schemaVersion": 39,
  "time": { "from": "now-30d", "to": "now" },
  "refresh": "5m",
  "templating": { "list": [] },
  "panels": []
}
```

Cada panel incluye:

- `type`: `stat`, `barchart`, `table`, `state-timeline`, `nodeGraph` o `text`.
- `gridPos`: posicion y tamano en una grilla de 24 columnas.
- `targets`: referencia logica a `strategy_payload`, `crm_metrics` o `graphify`.
- `fieldConfig`: unidad, color y thresholds.
- `options`: configuracion visual del panel.
- `data`: datos ya filtrados por usuario y tenant.

ROVI no embebe Grafana como runtime. Toma el modelo de dashboard/panel para renderizar, exportar y versionar dashboards generados por agentes sin operar un servidor Grafana separado.

## Uso de Graphify

El backend lee el grafo generado previamente:

```text
graphify-out/rovi-project-with-docs-graph.json
```

En Docker se monta como:

```text
/app/project-graphify-out
```

El modulo rankea nodos del grafo segun:

- Coincidencia semantica con la pregunta.
- Grado/conectividad del nodo.
- Relevancia de fuente (`docs/`, `backend/`, `frontend/src/pages/`).

Luego devuelve:

- `graph_summary`: resumen de nodos clave.
- `knowledge_graph.nodes`: nodos para visualizacion.
- `knowledge_graph.links`: relaciones entre nodos.

## Datos seguros

El modulo respeta aislamiento por usuario:

- Leads se filtran con `build_lead_query(current_user)`.
- ROVI internal usa `tenant-rovi-internal`.
- COPIM solo agrega contexto COPIM cuando el rol corresponde.
- Marketplace solo cuenta publicaciones visibles.

## Agente estratega

El agente usa la configuracion de la AI Control Tower para el `role_scope` correspondiente.

El prompt obliga una respuesta JSON con:

- `answer`
- `executive_summary`
- `critical_path`
- `kpis`
- `action_plan`
- `agent_handoffs`

Si el proveedor falla, el backend genera una respuesta fallback estructurada con datos y Graphify disponibles.

## Transferencia de conocimiento

`agent_handoffs` convierte el diagnostico estrategico en instrucciones para agentes especializados:

- `rovi_sales`: siguiente accion comercial.
- `rovi_marketing`: fuentes, mensajes y campanas.
- `rovi_ops`: datos, prompts, automatizaciones y calidad operativa.
- Roles COPIM, inmobiliaria o broker segun el usuario autenticado.

## Validacion esperada

Comandos:

```bash
python3 -m py_compile backend/agent_control.py backend/server.py
cd frontend && npm run build
```

Prueba local:

```bash
curl -X POST http://localhost:18080/api/strategy-playground/run \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Cual es la ruta critica del negocio?","include_context":true}'
```

UI:

```text
http://localhost:13000/database-chat
```

Para usuarios ROVI internos, la navegacion muestra el item:

```text
Estratega IA
```

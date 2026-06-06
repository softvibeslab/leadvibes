# Graphify Audit

Fecha de auditoria: 2026-06-06

Se ejecuto deteccion de corpus con Graphify sobre el repositorio completo. El corpus es demasiado grande para una generacion completa de grafo en esta pasada, asi que esta wiki fue curada desde fuentes primarias del repo.

## Resultado Detectado

- Archivos soportados totales: 1199
- Palabras aproximadas: 7051482
- Codigo: 275 archivos
- Documentos: 165 archivos
- Papers/PDF: 7 archivos
- Imagenes: 676 archivos
- Video/audio: 76 archivos
- Sensibles/convertidos fallidos: 3 elementos omitidos por la herramienta

## Decision

No se genero grafo completo porque el corpus supera los umbrales razonables de una corrida interactiva. Para crear un grafo navegable conviene ejecutar Graphify por subcarpeta:

```bash
graphify backend --mode deep --no-viz
graphify frontend/src --mode deep --no-viz
graphify docs --mode deep --no-viz
```

## Fuentes Curadas En Esta Wiki

- `AGENTS.md`
- `CLAUDE.md`
- `rovi-crm/SKILL.md`
- `backend/server.py`
- `backend/models.py`
- `backend/auth.py`
- `backend/requirements.txt`
- `frontend/package.json`
- `frontend/src/App.js`
- `frontend/src/context/AuthContext.js`
- `frontend/src/components/Sidebar.js`
- `docs/ROVI_OPERATIONS_INDEX.md`
- `docs/ROVI_GOLDEN_RELEASE_PLAN.md`
- `docs/DEPLOYMENT_URLS.md`


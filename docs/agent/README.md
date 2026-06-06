# Rovi Expert Agent Wiki

Esta carpeta concentra la wiki y base de conocimiento para que un agente opere como experto en Rovi.

## Indice

- [Architecture](./ARCHITECTURE.md) - como esta armado el sistema.
- [Knowledge Base](./KNOWLEDGE_BASE.md) - hechos clave, reglas de negocio y patrones.
- [Module Map](./MODULE_MAP.md) - modulos, rutas, archivos y permisos.
- [Playbook](./PLAYBOOK.md) - forma de trabajar cambios, bugs y features.
- [Runbook](./RUNBOOK.md) - comandos, entornos, pruebas y deploy.
- [Prompts](./PROMPTS.md) - prompts reutilizables para agentes Rovi.
- [Graphify Audit](./GRAPHIFY_AUDIT.md) - alcance detectado del corpus.

## Como Usarla

1. Lee `SOUL.md` en raiz para entender los principios.
2. Lee `MODULE_MAP.md` para ubicar el area afectada.
3. Lee `PLAYBOOK.md` antes de modificar codigo.
4. Usa `RUNBOOK.md` para validar.
5. Actualiza esta wiki si descubres un patron nuevo.

## Regla De Oro

Rovi es multi-workspace. Antes de tocar cualquier feature, pregunta: que tipo de usuario la ve, que `tenant_id` usa, que rol la autoriza y que entorno la validara.


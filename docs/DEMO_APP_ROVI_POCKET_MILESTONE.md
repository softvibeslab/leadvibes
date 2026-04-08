# Demo App Rovi Pocket — Hito publicado

Fecha de corte: 7 de abril de 2026
Hito: `Demo App Rovi Pocket`
Estado: listo para publicar en GitHub

## Resumen ejecutivo

Este hito consolida tres avances que ya quedaron funcionales dentro del workspace:

1. `Rovi Pocket` ya existe como app mobile-first independiente en `apps/rovi-pocket/`, conectada al repo principal como submódulo Git.
2. El demo navegable de Pocket quedó refinado para enseñar mejor el flujo diario del broker, con foco en ejecución, guía reutilizable y accesos rápidos.
3. El repo principal quedó mejor preparado para operar y validar cambios con Docker local, smoke tests deterministas y documentación de entrega/go-live.

## Lo logrado en Rovi Pocket

- App Expo con TypeScript publicada como subproyecto independiente en `https://github.com/softvibeslab/rovi_pocket.git`.
- Shell mobile-first con tabs para `Dashboard`, `Leads`, `Agenda`, `IA` y `Perfil`.
- Dashboard replanteado en `Modo Momentum`: la app prioriza el movimiento del día, el lead más caliente y la acción recomendada por IA.
- Demo guiada más usable: la guía ahora es flotante y se puede abrir, ocultar o retomar sin tapar el flujo principal.
- Nuevo rail de utilidades para separar la guía de los atajos rápidos del broker.
- Popup de acciones rápidas para no invadir tarjetas ni pantallas clave.
- Ajustes de copy y narrativa del demo para presentar Pocket como sistema operativo diario del broker, no como dashboard administrativo.
- Scripts y configuración EAS para generar APKs Android de preview con `autoIncrement` y comandos reproducibles.
- Asset QR del APK agregado para compartir builds internas con más facilidad.

## Lo logrado en el repo principal

- Registro de `apps/rovi-pocket` como submódulo mediante `.gitmodules`.
- Docker local más seguro y menos frágil:
  - puertos configurables con `MONGO_HOST_PORT`, `BACKEND_HOST_PORT` y `FRONTEND_HOST_PORT`,
  - plantilla `docker-local.sample`,
  - script `scripts/docker-local-up.sh`,
  - guía dedicada en `docs/DOCKER_LOCAL.md`.
- Backend alineado a `Python 3.11`.
- Build del frontend alineado con `yarn.lock` y healthcheck real en la imagen nginx.
- Suite de pruebas backend separada entre smoke/unit e integración remota:
  - `backend/pytest.ini`,
  - `backend/tests/conftest.py`,
  - `backend/tests/test_api_smoke.py`,
  - `backend/tests/test_auth_unit.py`,
  - marker `integration` aplicado a pruebas remotas existentes.
- Workflows de GitHub Actions endurecidos para fallar correctamente si fallan los smoke/unit tests.
- Nuevo paquete documental para operación, QA, setup de cliente, roadmap Pocket y trazabilidad del workspace.
- Plantillas de GitHub Issues agregadas para historias de usuario y tareas de go-live.

## Artefactos de documentación creados o consolidados

- `docs/ROVI_OPERATIONS_INDEX.md`
- `docs/CI_AND_TESTING.md`
- `docs/DOCKER_LOCAL.md`
- `docs/WORKSPACE_STATUS_SUMMARY.md`
- `docs/WORKSPACE_STATUS_DASHBOARD.html`
- `docs/ROVI_POCKET_MASTER_PLAN.md`
- `docs/ROVI_POCKET_EXECUTION_DASHBOARD.md`
- `docs/ROVI_POCKET_REPO_SETUP.md`
- `docs/ROVI_POCKET_FIGMA_PROMPTS.md`

## Validación recomendada para este hito

Repo principal:

```bash
cd backend
pytest
```

Subrepo Pocket:

```bash
cd apps/rovi-pocket
npm run typecheck
```

Android preview:

```bash
cd apps/rovi-pocket
npm run build:android:preview:no-wait
```

## Siguiente paso natural

Después de este hito, el siguiente bloque de valor es conectar Pocket con datos reales del backend de forma más profunda: auth persistente, dashboard real, leads reales, agenda conectada y copiloto respaldado por API.

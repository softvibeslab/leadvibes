# CI y pruebas — estado y próximos pasos

## Situación actual (actualizado)

- **`pytest.ini`** en `backend/`: por defecto `pytest` ejecuta **solo** tests que **no** tienen `@pytest.mark.integration` (`addopts = -m "not integration"`).
- **`tests/conftest.py`:** define variables de entorno mínimas y fixtures `app` / `client` (TestClient) antes de importar `server`.
- **`test_api_smoke.py`:** `GET /api/health` y `GET /api/` sin Mongo en uso en esas rutas.
- **`test_auth_unit.py`:** hash de contraseña y JWT roundtrip.
- Los tres archivos antiguos (`test_leadvibes_crm.py`, `test_import_leads.py`, `test_google_calendar_email_templates.py`) llevan **`pytestmark = pytest.mark.integration`** (API remota con `requests`).

**CI (GitHub Actions):** los workflows de deploy ejecutan:

`pytest tests/ -v --tb=short -m "not integration"`

Si algún smoke/unit falla, **el pipeline falla** (ya no se enmascara el error).

**Ejecutar tests de integración manualmente** (requiere API accesible y datos seed):

```bash
cd backend
pytest tests/ -v -m integration
# opcional:
export REACT_APP_BACKEND_URL=https://tu-preview.example.com
```

## Próximos pasos (medio plazo)

1. **Tests API con Mongo:** servicio Mongo en CI (GitHub Actions `services:`) o Testcontainers, y tests de registro/login con `TestClient`.
2. **Extraer lógica** de `server.py` a módulos para unit tests más finos.
3. **Job opcional** (cron o manual) para `-m integration` contra preview.

| Prioridad | Tarea |
|-----------|--------|
| Hecho | `conftest.py`, smoke, unit auth, marker integration, CI estricto |
| P1 | Mongo en CI + tests auth/leads con DB de prueba |
| P2 | Cobertura mínima en `models` / helpers |

## Referencia

- Sprint de pruebas: [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md)  
- Comandos locales: [CLAUDE.md](../CLAUDE.md)  

---
id: TEST-001
version: 0.0.1
status: draft
created: 2026-03-20
updated: 2026-03-20
author: @RogerVibes
priority: critical
category: feature
labels:
  - testing
  - quality-assurance
  - coverage
  - pytest
depends_on: []
blocks: []
related_specs:
  - AUTH-001
  - LEAD-001
  - CAMP-001
  - GAMI-001
  - CAL-001
scope:
  packages:
    - backend/tests
  files:
    - conftest.py
    - test_auth.py
    - test_leads.py
    - test_campaigns.py
    - test_gamification.py
    - test_calendar.py
---

# @SPEC:TEST-001: Test Suite Core - Cobertura 85%

## HISTORY

### v0.0.1 (2026-03-20)
- **INITIAL**: Test Suite Core para cobertura 85% de toda la aplicación - Creación inicial
- **AUTHOR**: @RogerVibes
- **SCOPE**: Suite de tests E2E para endpoints críticos del backend (Auth, Leads, Campaigns, Gamification, Calendar)
- **CONTEXT**: Proyecto LeadVibes sin tests automatizados, requiere suite robusta antes de continuar desarrollo
- **REASON**: Garantizar estabilidad y calidad del código existente antes de agregar nuevas features

---

## Environment

### Sistema de Testing Actual
- **Framework**: pytest (Python)
- **Cobertura Objetivo**: 85% mínimo
- **Tipo de Tests**:
  - Unit tests (funciones individuales)
  - Integration tests (endpoints + database)
  - E2E tests (flows completos de usuario)

### Infraestructura de Testing
- **Backend**: FastAPI en `backend/server.py`
- **Database**: MongoDB con contenedor Docker para testing
- **Dependencies**: pytest, pytest-asyncio, pytest-cov, httpx

### Herramientas de Calidad
- **Coverage**: `coverage.py` para medir porcentaje de cobertura
- **Linting**: flake8, mypy (type checking), black (formatting)
- **CI/CD**: GitHub Actions para ejecutar tests en cada PR

---

## Assumptions

1. **Database Aislada**: Tests usan instancia de MongoDB separada de producción
2. **Datos de Prueba**: Fixtures de pytest crean datos necesarios antes de cada test
3. **Limpieza Automática**: Cada test limpia sus datos después de ejecutarse
4. **Tokens de Test**: JWT tokens generados con usuario de prueba exclusivo
5. **Integraciones Mockeadas**: VAPI, Twilio, SendGrid se mockean en tests

---

## Requirements

### Ubiquitous Requirements (Básicas)

- El sistema debe proveer una suite de tests automatizados con pytest
- El sistema debe alcanzar cobertura mínima del 85% en código backend
- El sistema debe ejecutar tests en menos de 5 minutos
- El sistema debe limpiar automáticamente datos de prueba después de cada test
- El sistema debe proveer fixtures reutilizables para datos comunes

### Event-driven Requirements (WHEN-THEN)

- **WHEN** se ejecute `pytest`, el sistema debe ejecutar todos los tests en paralelo
- **WHEN** un test falle, el sistema debe reportar stack trace completo y línea de error
- **WHEN** se ejecute `pytest --cov`, el sistema debe generar reporte HTML de cobertura
- **WHEN** se cree un nuevo endpoint, el sistema debe requerir test previo a merge
- **WHEN** la cobertura baje del 85%, el sistema debe fallar el build de CI/CD

### State-driven Requirements (WHILE-THEN)

- **WHILE** se ejecutan tests, el sistema debe mostrar progreso en tiempo real
- **WHILE** un test falla, el sistema debe continuar con los demás tests
- **WHILE** se desarrolla nueva feature, el sistema debe ejecutar tests relacionados en cada save

### Optional Requirements (WHERE-THEN)

- **WHERE** se ejecute `pytest -v`, el sistema debe mostrar verbose output con nombres de tests
- **WHERE** se ejecute `pytest -k "lead"`, el sistema debe ejecutar solo tests relacionados con leads
- **WHERE** se configure `--cov-fail-under=85`, el sistema debe fallar si cobertura es menor al 85%

### Constraints (IF-THEN)

- **IF** un test modifica la base de datos, debe limpiar datos en `tearDown`
- **IF** un test requiere autenticación, debe usar token de prueba generado en fixture
- **IF** una integración externa falla en test, debe mockearse para no afectar test
- **IF** un test tarda más de 5 segundos, debe marcarse como `@pytest.mark.slow`
- **IF** se usa MongoDB real en test, debe usar base de datos separada `test_leadvibes`

---

## Specifications

### @TEST:TEST-001:AUTH Authentication Tests

**Ubicación**: `backend/tests/test_auth.py`

#### Test Cases

1. **test_login_success**
   - GIVEN: Usuario registrado con email y password válidos
   - WHEN: POST `/api/auth/login` con credenciales correctas
   - THEN: Retorna status 200 y JWT token válido
   - AND: Token contiene user_id y role correctos

2. **test_login_invalid_credentials**
   - GIVEN: Usuario registrado en base de datos
   - WHEN: POST `/api/auth/login` con password incorrecto
   - THEN: Retorna status 401 y mensaje "Credenciales inválidas"

3. **test_register_new_user**
   - GIVEN: Email no registrado previamente
   - WHEN: POST `/api/auth/register` con datos válidos
   - THEN: Retorna status 201 y usuario creado
   - AND: Password está hasheado con bcrypt

4. **test_get_current_user**
   - GIVEN: Usuario autenticado con JWT token
   - WHEN: GET `/api/auth/me` con header `Authorization: Bearer {token}`
   - THEN: Retorna status 200 y datos del usuario

5. **test_token_expiration**
   - GIVEN: JWT token expirado (24h después)
   - WHEN: GET `/api/auth/me` con token expirado
   - THEN: Retorna status 401 y mensaje "Token expirado"

---

### @TEST:TEST-001:LEAD Lead Management Tests

**Ubicación**: `backend/tests/test_leads.py`

#### Test Cases

1. **test_create_lead**
   - GIVEN: Broker autenticado
   - WHEN: POST `/api/leads` con datos de lead válidos
   - THEN: Retorna status 201 y lead creado
   - AND: Lead tiene status "nuevo" y broker asignado

2. **test_list_leads_filtered**
   - GIVEN: 50 leads creados con diferentes statuses
   - WHEN: GET `/api/leads?status=nuevo&broker_id={id}`
   - THEN: Retorna solo leads con status "nuevo" del broker

3. **test_update_lead_status**
   - GIVEN: Lead con status "nuevo"
   - WHEN: PATCH `/api/leads/{id}` con `{"status": "contactado"}`
   - THEN: Retorna status 200 y lead actualizado
   - AND: Status history muestra cambio de "nuevo" → "contactado"

4. **test_assign_lead_to_broker**
   - GIVEN: Lead sin broker asignado
   - WHEN: PATCH `/api/leads/{id}/assign` con `broker_id`
   - THEN: Retorna status 200 y broker asignado correctamente

5. **test_delete_lead**
   - GIVEN: Lead existente
   - WHEN: DELETE `/api/leads/{id}`
   - THEN: Retorna status 204
   - AND: Lead ya no existe en base de datos

6. **test_bulk_import_leads**
   - GIVEN: CSV con 100 leads válidos
   - WHEN: POST `/api/leads/bulk-import` con archivo CSV
   - THEN: Retorna status 201 y crea 100 leads
   - AND: Todos los leads tienen broker asignado (round robin)

---

### @TEST:TEST-001:CAMP Campaign Tests

**Ubicación**: `backend/tests/test_campaigns.py`

#### Test Cases

1. **test_create_campaign**
   - GIVEN: Admin autenticado
   - WHEN: POST `/api/campaigns` con datos de campaña válidos
   - THEN: Retorna status 201 y campaña creada
   - AND: Campaign tiene status "draft"

2. **test_execute_campaign_calls**
   - GIVEN: Campaña de tipo "call" con 10 leads
   - WHEN: POST `/api/campaigns/{id}/execute`
   - THEN: Retorna status 200 y campaña ejecutada
   - AND: Se crean 10 CallRecords en base de datos

3. **test_campaign_filters_leads**
   - GIVEN: 50 leads, 25 con status "nuevo"
   - WHEN: POST `/api/campaigns` con filtro `{"status": "nuevo"}`
   - THEN: Campaña solo incluye los 25 leads con status "nuevo"

4. **test_campaign_metrics**
   - GIVEN: Campaña ejecutada con 100 llamadas
   - WHEN: GET `/api/campaigns/{id}/metrics`
   - THEN: Retorna estadísticas: sent, delivered, failed, response_rate

5. **test_scheduled_campaign**
   - GIVEN: Campaña programada para fecha futura
   - WHEN: Se alcanza la fecha programada
   - THEN: Campaign se ejecuta automáticamente
   - AND: Status cambia de "scheduled" → "running" → "completed"

---

### @TEST:TEST-001:GAMI Gamification Tests

**Ubicación**: `backend/tests/test_gamification.py`

#### Test Cases

1. **test_add_points_for_activity**
   - GIVEN: Broker con 0 puntos
   - WHEN: POST `/api/activities` con type="llamada"
   - THEN: Broker gana 10 puntos
   - AND: Activity se guarda en PointLedger

2. **test_leaderboard_ranking**
   - GIVEN: 5 brokers con diferentes puntos (0, 50, 100, 150, 200)
   - WHEN: GET `/api/gamification/leaderboard`
   - THEN: Retorna ranking ordenado: 200 puntos (1ro), 150 (2do), etc.

3. **test_monthly_points_reset**
   - GIVEN: Broker con 500 puntos en mes actual
   - WHEN: Inicia nuevo mes
   - THEN: Puntos mensuales se resetean a 0
   - AND: Puntos totales acumulados se mantienen

4. **test_achievement_unlocked**
   - GIVEN: Broker alcanza 1000 puntos totales
   - WHEN: Se consulta logros desbloqueados
   - THEN: Achievement "Mil Puntos" aparece como desbloqueado
   - AND: Broker recibe notificación de logro

---

### @TEST:TEST-001:CAL Calendar Tests

**Ubicación**: `backend/tests/test_calendar.py`

#### Test Cases

1. **test_create_event**
   - GIVEN: Broker autenticado
   - WHEN: POST `/api/calendar/events` con datos de evento válidos
   - THEN: Retorna status 201 y evento creado
   - AND: Evento tiene broker_id y lead_id asociados

2. **test_list_events_by_date_range**
   - GIVEN: 10 eventos creados en diferentes fechas
   - WHEN: GET `/api/calendar/events?start=2026-03-01&end=2026-03-31`
   - THEN: Retorna solo eventos dentro del rango de marzo 2026

3. **test_event_reminder**
   - GIVEN: Evento programado para mañana 10am
   - WHEN: Son las 9am del día siguiente
   - THEN: Sistema envía notificación al broker
   - AND: Notificación incluye detalles del evento

4. **test_round_robin_assignment**
   - GIVEN: 3 brokers disponibles y 5 eventos a asignar
   - WHEN: Se ejecuta round robin
   - THEN: Eventos se distribuyen: 2, 2, 1 (lo más balanceado posible)

---

## Traceability (@TAG)

- **SPEC**: @SPEC:TEST-001
- **TEST**:
  - `backend/tests/test_auth.py` → @TEST:TEST-001:AUTH
  - `backend/tests/test_leads.py` → @TEST:TEST-001:LEAD
  - `backend/tests/test_campaigns.py` → @TEST:TEST-001:CAMP
  - `backend/tests/test_gamification.py` → @TEST:TEST-001:GAMI
  - `backend/tests/test_calendar.py` → @TEST:TEST-001:CAL
- **CODE**:
  - `backend/server.py` → @CODE:TEST-001:API (Endpoints principales)
  - `backend/auth.py` → @CODE:TEST-001:AUTH (Lógica de autenticación)
  - `backend/models.py` → @CODE:TEST-001:DATA (Modelos Pydantic)
- **DOC**: `docs/testing-guide.md` → @DOC:TEST-001 (Guía de testing)

---

## Acceptance Criteria

### Criterios de Aceptación

1. **Cobertura 85%**: `pytest --cov` reporta ≥85% de cobertura
2. **Todos los Tests Pasan**: `pytest` ejecuta sin fallos
3. **Velocidad**: Suite completa ejecuta en <5 minutos
4. **CI/CD Integration**: GitHub Actions ejecuta tests en cada PR
5. **Limpieza de Datos**: Tests no dejan datos residuales en MongoDB

### Definición de Done

- [ ] Suite de tests creada con 50+ tests
- [ ] Cobertura del 85% alcanzada y mantenida
- [ ] CI/CD configurado para ejecutar tests automáticamente
- [ ] Documentación de testing creada (`docs/testing-guide.md`)
- [ ] Todos los tests existentes pasan consistentemente

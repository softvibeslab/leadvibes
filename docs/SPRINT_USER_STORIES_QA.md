# Sprint: historias de usuario, casos de uso y pruebas por flujo

## 1. Objetivo del sprint

Producir **trazabilidad completa** entre negocio y código:

- Historias de usuario (formato estándar).  
- Casos de uso por actor.  
- **Pruebas:** unitarias (backend), integración y E2E donde aplique — cubriendo **todos los flujos críticos** del MVP.

**Duración sugerida:** 2 semanas (Sprint 1) con posible **Sprint 2** para cobertura de automatizaciones y analíticas avanzadas.

---

## 2. Metodología

| Artefacto | Formato | Herramienta sugerida |
|-----------|---------|----------------------|
| Historias | “Como [rol], quiero [acción], para [beneficio]” + criterios de aceptación | GitHub Issues / Jira / Linear |
| Casos de uso | Actor, precondición, flujo principal, alternativos | Mismo board + etiqueta `use-case` |
| Pruebas unitarias | `pytest`, funciones puras y lógica en módulos extraídos | `backend/tests/` |
| Pruebas API | `TestClient` de FastAPI o `httpx` contra app en memoria | `backend/tests/` |
| E2E (opcional) | Playwright / Cypress contra staging | `frontend/` o repo e2e |

**Nota técnica actual:** Hoy parte de los tests usan `requests` contra un backend en ejecución. El sprint debe **migrar o añadir** tests con `TestClient` + Mongo de prueba (o mock) para que CI sea determinista (alineado con [GO_LIVE_AND_CLIENT_SETUP.md](./GO_LIVE_AND_CLIENT_SETUP.md)).

---

## 3. Backlog del sprint (épicas)

| ID | Épica | Prioridad |
|----|-------|-----------|
| E1 | Autenticación, onboarding y sesión | P0 |
| E2 | Leads, pipeline y actividades | P0 |
| E3 | Importación de leads | P0 |
| E4 | Integraciones (Settings + tests de conexión) | P0 |
| E5 | Campañas (llamadas, SMS, email) | P1 |
| E6 | Plantillas de email y editor | P1 |
| E7 | Calendario CRM + Google | P1 |
| E8 | Brokers, gamificación, dashboard/leaderboard | P1 |
| E9 | Analíticas y export | P2 |
| E10 | Automatizaciones (workflows) | P2 |
| E11 | Landing, demo request, captura pública | P2 |
| E12 | IA (chat, análisis lead, perfil IA) | P2 |

---

## 4. Historias de usuario (plantillas listas para tickets)

Cada historia debe incluir: **criterios de aceptación** (Given/When/Then) y etiqueta de **épica**.

### E1 — Autenticación

| ID | Historia |
|----|----------|
| US-1.1 | Como usuario nuevo, quiero registrarme, para acceder al CRM. |
| US-1.2 | Como usuario, quiero iniciar sesión con email y contraseña, para ver mis datos aislados por tenant. |
| US-1.3 | Como usuario sin onboarding completo, quiero ser guiado al asistente inicial, para configurar lo mínimo. |
| US-1.4 | Como usuario, quiero cerrar sesión de forma segura. |

### E2 — Leads

| US-2.1 | Como broker, quiero crear un lead con datos de contacto, para dar seguimiento. |
| US-2.2 | Como broker, quiero mover leads entre columnas del pipeline, para reflejar el estado real. |
| US-2.3 | Como broker, quiero filtrar y buscar leads, para priorizar el día. |
| US-2.4 | Como broker, quiero registrar actividades en un lead, para dejar trazabilidad. |

### E3 — Importación

| US-3.1 | Como usuario, quiero subir un archivo CSV/XLSX, para migrar mi base. |
| US-3.2 | Como usuario, quiero mapear columnas a campos del CRM, para importar sin errores. |
| US-3.3 | Como usuario, quiero ver una vista previa antes de confirmar, para validar datos. |

### E4 — Integraciones

| US-4.1 | Como admin, quiero guardar credenciales de SendGrid/Twilio/VAPI de forma segura en Settings. |
| US-4.2 | Como admin, quiero ejecutar “test” de cada integración, para verificar conexión antes de campañas. |
| US-4.3 | Como admin, quiero conectar Google Calendar vía OAuth, para sincronizar citas. |

### E5 — Campañas

| US-5.1 | Como usuario, quiero crear una campaña de tipo email/SMS/llamadas, para comunicarme con segmentos. |
| US-5.2 | Como usuario, quiero iniciar una campaña y ver su estado, para controlar el envío. |

### E6 — Email

| US-6.1 | Como usuario, quiero crear plantillas con el editor visual, para reutilizar diseños. |
| US-6.2 | Como usuario, quiero enviar un email de prueba, para validar antes de masivos. |

### E7 — Calendario

| US-7.1 | Como usuario, quiero crear y editar eventos en el calendario del CRM. |
| US-7.2 | Como usuario, quiero sincronizar con Google según la configuración. |

### E8 — Agencia

| US-8.1 | Como admin de agencia, quiero ver el listado de brokers. |
| US-8.2 | Como admin de agencia, quiero ver leaderboard y reglas de gamificación. |

### E9 — Analíticas

| US-9.1 | Como usuario, quiero ver resumen de métricas y exportar datos, para reportar resultados. |

### E10 — Automatizaciones

| US-10.1 | Como usuario avanzado, quiero crear/editar workflows y activarlos con control. |

### E11 — Público

| US-11.1 | Como visitante, quiero solicitar demo desde la landing, para que el equipo me contacte. |

### E12 — IA

| US-12.1 | Como usuario, quiero usar el chat de IA contextualizado al tenant. |
| US-12.2 | Como usuario, quiero analizar un lead con IA, para obtener siguientes pasos sugeridos. |

---

## 5. Casos de uso (resumen por actor)

Documentar en cada ticket de épicas o en wiki breve.

| UC | Actor | Caso de uso | Flujo principal resumido |
|----|-------|-------------|---------------------------|
| UC-A1 | Visitante | Solicitar demo | Landing → formulario → backend guarda lead / notificación |
| UC-A2 | Broker individual | Gestionar pipeline | Login → leads → drag estado → actividad |
| UC-A3 | Admin agencia | Coordinar equipo | Login → brokers → asignación / gamificación |
| UC-A4 | Admin | Configurar integraciones | Settings → pegar keys → test → OK |
| UC-A5 | Usuario | Importar base | Import → upload → map → preview → execute |
| UC-A6 | Usuario | Campaña multicanal | Campaigns → tipo → audiencia → start |
| UC-A7 | Usuario | Sincronizar calendario | OAuth Google → eventos bidireccionales |

---

## 6. Matriz de pruebas (por flujo)

| Flujo | Pruebas unitarias (objetivo) | Pruebas integración API | E2E manual mínimo |
|-------|------------------------------|-------------------------|-------------------|
| Auth | JWT encode/decode, hash password | register/login/me | login UI |
| Leads CRUD | validación Pydantic, reglas tenant | CRUD con `TestClient` | crear lead en UI |
| Pipeline | transiciones de estado permitidas | update lead status | drag en Kanban |
| Import | parsing CSV, dedupe | upload/preview/execute | wizard completo |
| Integraciones | no commitear secretos; helpers | mock Twilio/SendGrid en test | test button en Settings |
| Campañas | lógica de selección de leads | start campaign (mock envíos) | una campaña de prueba |
| Email templates | render variables | CRUD template | editor guarda |
| Calendar | fechas/timezone | events CRUD | crear evento |
| Google OAuth | state, callback (mock) | rutas con mock | conectar cuenta real en staging |
| Gamificación | cálculo puntos | rules endpoints | ver leaderboard |
| Analytics | agregaciones | overview endpoint | export |
| Automations | validación workflow | activate/test | flujo simple |
| IA | prompts acotados (mock LLM) | chat/analyze con mock | un mensaje en UI |

---

## 7. Cronograma sugerido (2 semanas)

| Día | Enfoque |
|-----|---------|
| 1–2 | Issues: US + casos de uso E1–E4; spike tests `TestClient` + DB test |
| 3–5 | Implementar/reforzar tests P0; CI debe fallar si tests fallan |
| 6–8 | E5–E7 + tests |
| 9–10 | E8–E12 + documentación de cobertura y deuda |

**Definition of Done (sprint):**

- [ ] Cada historia P0 tiene al menos un test automatizado o justificación explícita.  
- [ ] Casos de uso UC-A1–UC-A7 documentados y enlazados a PRs.  
- [ ] Lista de flujos sin cobertura añadida al backlog (Sprint 2).  

---

## 8. Archivos de código a priorizar para tests

| Área | Archivos típicos (ajustar al repo) |
|------|--------------------------------------|
| API | `backend/server.py` (extraer lógica a servicios si hace falta para testear) |
| Auth | `backend/auth.py` |
| Modelos | `backend/models.py` |
| IA | `backend/ai_service.py` |
| Tests existentes | `backend/tests/test_*.py` |

---

## 9. Enlaces relacionados

- [REQUIREMENTS_AND_INFRASTRUCTURE.md](./REQUIREMENTS_AND_INFRASTRUCTURE.md) — requisitos que validan las historias  
- [GO_LIVE_AND_CLIENT_SETUP.md](./GO_LIVE_AND_CLIENT_SETUP.md) — criterios de salida a producción  
- [TOOLS_PRICING_CHECKLIST.md](./TOOLS_PRICING_CHECKLIST.md) — herramientas para CI y staging  

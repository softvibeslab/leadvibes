# Issues listos para crear en GitHub (P0 / MVP)

**Cómo usar:** En GitHub → Issues → New issue → pegar **Título** y **Cuerpo** de cada bloque. Añade etiquetas sugeridas: `epic/E*`, `priority/P0`, `mvp`.

---

## E1 — Autenticación

**Título:** `[US-1.1] Registro de usuario`

**Cuerpo:**
```markdown
## Historia
Como usuario nuevo, quiero registrarme, para acceder al CRM.

## Criterios de aceptación
- [ ] POST `/api/auth/register` crea usuario y devuelve token
- [ ] Datos persisten con `tenant_id` correcto
- [ ] Validación de email/contraseña coherente con UI

## Épica
E1 — Autenticación
```

---

**Título:** `[US-1.2] Login y sesión JWT`

**Cuerpo:**
```markdown
## Historia
Como usuario, quiero iniciar sesión, para ver solo los datos de mi tenant.

## Criterios de aceptación
- [ ] POST `/api/auth/login` devuelve JWT válido
- [ ] GET `/api/auth/me` con token devuelve usuario actual
- [ ] Credenciales inválidas → 401

## Épica
E1
```

---

**Título:** `[US-1.3] Onboarding obligatorio`

**Cuerpo:**
```markdown
## Historia
Como usuario nuevo, quiero completar el onboarding antes del CRM completo.

## Criterios de aceptación
- [ ] Si `onboarding_completed` es false, redirige a `/onboarding`
- [ ] Al completar, acceso normal al layout principal

## Épica
E1
```

---

## E2 — Leads

**Título:** `[US-2.1] CRUD de leads y pipeline`

**Cuerpo:**
```markdown
## Historia
Como broker, quiero crear y actualizar leads y mover etapas, para reflejar el embudo real.

## Criterios de aceptación
- [ ] GET/POST/PUT leads filtrados por tenant
- [ ] Cambio de estado visible en Kanban y tabla
- [ ] Actividades asociadas al lead

## Épica
E2
```

---

## E3 — Importación

**Título:** `[US-3.1] Importar CSV/XLSX con preview`

**Cuerpo:**
```markdown
## Historia
Como usuario, quiero importar un archivo con mapeo de columnas y vista previa.

## Criterios de aceptación
- [ ] Upload → preview → execute sin romper tenant
- [ ] Duplicados manejados según reglas del producto

## Épica
E3
```

---

## E4 — Integraciones

**Título:** `[US-4.1] Settings: integraciones y tests de conexión`

**Cuerpo:**
```markdown
## Historia
Como administrador, quiero guardar claves y probar SendGrid, Twilio y VAPI antes de campañas.

## Criterios de aceptación
- [ ] Endpoints de test devuelven éxito/error claro
- [ ] Secretos no expuestos en respuestas API

## Épica
E4
```

---

## Etiquetas sugeridas (crearlas una vez en GitHub)

| Etiqueta | Color sugerido |
|----------|------------------|
| `mvp` | rojo |
| `priority/P0` | naranja |
| `epic/E1` … `epic/E4` | morado |
| `area/backend` / `area/frontend` | azul / verde |

---

## Orden recomendado de implementación en el tablero

1. US-1.1 → US-1.2 → US-1.3  
2. US-2.1  
3. US-3.1  
4. US-4.1  

Luego continuar con [SPRINT_USER_STORIES_QA.md](./SPRINT_USER_STORIES_QA.md) (E5+).

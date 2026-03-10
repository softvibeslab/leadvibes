# Plan de Pruebas - Feature 3: Automations Module

## Resumen
Este documento describe el plan de pruebas para el módulo de automatizaciones con integración n8n.

## Backend - API Endpoints

### 1. GET /api/automations/workflows
- **Descripción:** Obtener todos los workflows del tenant
- **Parámetros:**
  - `category` (opcional): Filtrar por categoría
- **Pruebas:**
  - [ ] Retornar lista de workflows
  - [ ] Filtrar por categoría funciona
  - [ ] Tenant sin workflows retorna lista vacía
  - [ ] Solo retorna workflows del tenant actual

### 2. POST /api/automations/workflows
- **Descripción:** Crear nuevo workflow
- **Pruebas:**
  - [ ] Crear workflow con todos los campos
  - [ ] Crear workflow sin nombre - retorna error
  - [ ] Verificar asignación de tenant_id
  - [ ] Verificar is_template = False por defecto

### 3. GET /api/automations/workflows/{id}
- **Descripción:** Obtener workflow específico
- **Pruebas:**
  - [ ] Obtener workflow existente
  - [ ] Obtener workflow de otro tenant - retorna 404
  - [ ] Obtener workflow inexistente - retorna 404

### 4. PUT /api/automations/workflows/{id}
- **Descripción:** Actualizar workflow
- **Pruebas:**
  - [ ] Actualizar nombre y descripción
  - [ ] Actualizar config_values
  - [ ] Actualizar de otro tenant - retorna 404

### 5. DELETE /api/automations/workflows/{id}
- **Descripción:** Eliminar workflow
- **Pruebas:**
  - [ ] Eliminar workflow existente
  - [ ] Eliminar workflow de otro tenant - retorna 404

### 6. POST /api/automations/workflows/{id}/activate
- **Descripción:** Activar workflow
- **Pruebas:**
  - [ ] Activar workflow inactivo
  - [ ] Verificar is_active = True después
  - [ ] TODO: Integración real con n8n

### 7. POST /api/automations/workflows/{id}/deactivate
- **Descripción:** Desactivar workflow
- **Pruebas:**
  - [ ] Desactivar workflow activo
  - [ ] Verificar is_active = False después

### 8. POST /api/automations/workflows/{id}/test
- **Descripción:** Ejecutar prueba del workflow
- **Pruebas:**
  - [ ] Ejecutar test exitoso
  - [ ] Crear registro en automation_executions
  - [ ] Incrementar total_runs y successful_runs
  - [ ] Actualizar last_run
  - [ ] Retornar execution_id y resultado

### 9. GET /api/automations/workflows/{id}/variables
- **Descripción:** Obtener variables configurables del workflow
- **Pruebas:**
  - [ ] Retornar schema de variables
  - [ ] Si hay config_schema guardado, retornarlo
  - [ ] Si no, retornar schema por defecto
  - [ ] TODO: Integración real con webhook n8n

### 10. GET /api/automations/workflows/{id}/executions
- **Descripción:** Obtener historial de ejecuciones
- **Pruebas:**
  - [ ] Retornar lista de ejecuciones
  - [ ] Parámetro limit funciona
  - [ ] Ordenar por started_at descendente
  - [ ] Solo ejecuciones del tenant

### 11. POST /api/automations/seed
- **Descripción:** Crear plantillas de workflows predefinidos
- **Pruebas:**
  - [ ] Crear 5 plantillas predefinidas
  - [ ] Ejecutar nuevamente no duplica
  - [ ] Categorías: lead_generation, sales, promotion
  - [ ] is_template = True en todas

## Frontend - AutomationsPage

### 1. Componente WorkflowCard
- **Pruebas:**
  - [ ] Muestra nombre, descripción, categoría
  - [ ] Badge de estado (Activo/Inactivo)
  - [ ] Icono y color según categoría
  - [ ] Estadísticas: ejecuciones totales, última ejecución

### 2. Acciones en WorkflowCard
- **Pruebas:**
  - [ ] Botón Activar/Pausar funciona
  - [ ] Botón Probar ejecuta test
  - [ ] Menu desplegable funciona:
    - [ ] Ver detalles
    - [ ] Configurar abre modal
    - [ ] Eliminar muestra confirmación

### 3. ConfigModal
- **Pruebas:**
  - [ ] Modal abre con workflow seleccionado
  - [ ] Carga variables desde API
  - [ ] Renderiza campos según tipo:
    - [ ] text/email - Input
    - [ ] number - Input type number
    - [ ] boolean - Switch
    - [ ] select - Select con opciones
    - [ ] textarea - Textarea
  - [ ] Guardar actualiza config_values
  - [ ] Toast de éxito al guardar

### 4. TestResultModal
- **Pruebas:**
  - [ ] Modal abre con resultado del test
  - [ ] Muestra execution_id
  - [ ] Muestra resultado formateado
  - [ ] Indicador visual de éxito

### 5. Filtros por Categoría
- **Pruebas:**
  - [ ] Tab "Todos" muestra todos los workflows
  - [ ] Tab "Leads" filtra por lead_generation
  - [ ] Tab "Ventas" filtra por sales
  - [ ] Tab "Promoción" filtra por promotion

### 6. Plantillas Predefinidas
- **Pruebas:**
  - [ ] Botón "Cargar Plantillas" funciona
  - [ ] Crea 5 workflows predefinidos:
    - [ ] Seguimiento Automático de Nuevos Leads
    - [ ] Nurturing para Compradores
    - [ ] Promoción de Nueva Propiedad
    - [ ] Recordatorio de Citas
    - [ ] Reactivación de Leads Fríos
  - [ ] Cada plantilla tiene sus variables

### 7. Estados y Transiciones
- **Pruebas:**
  - [ ] Workflows inactivos muestran "Activar"
  - [ ] Workflows activos muestran "Pausar"
  - [ ] Estado cambia después de acción
  - [ ] Color del badge cambia según estado

## Integración con n8n

### 1. Configuración de Webhook
- **Pruebas:**
  - [ ] URL de n8n webhook se guarda en workflow
  - [ ] Endpoint /variables consulta webhook de n8n
  - [ ] Schema de variables se parsea correctamente

### 2. Activación/Desactivación
- **Pruebas:**
  - [ ] Al activar, se llama webhook de n8n
  - [ ] Config values se envían en el payload
  - [ ] n8n confirma la activación
  - [ ] Desactivación también llama webhook

### 3. Ejecución de Prueba
- **Pruebas:**
  - [ ] Botón "Probar" llama webhook de test
  - [ ] Payload incluye config_values
  - [ ] Respuesta se muestra en modal
  - [ ] Execution log se guarda

## Variables Dinámicas

### 1. Tipos de Variables
- **Pruebas:**
  - [ ] Text: Input simple
  - [ ] Email: Input con validación
  - [ ] Number: Input numérico
  - [ ] Boolean: Switch toggle
  - [ ] Select: Dropdown con opciones
  - [ ] Textarea: Input multilínea

### 2. Variables Predefinidas en Plantillas
- **Seguimiento de Leads:**
  - [ ] first_email_subject (text)
  - [ ] delay_email_1 (number)
  - [ ] delay_email_2 (number)
  - [ ] enable_sms (boolean)

- **Nurturing Compradores:**
  - [ ] sequence_duration (number)
  - [ ] email_frequency (select)
  - [ ] include_property_recommendations (boolean)

- **Promoción Propiedad:**
  - [ ] max_budget (number)
  - [ ] property_type (select)
  - [ ] min_bedrooms (number)

- **Recordatorios:**
  - [ ] reminder_hours_before (number)
  - [ ] include_location (boolean)
  - [ ] send_whatsapp (boolean)

- **Reactivación:**
  - [ ] inactive_days (number)
  - [ ] offer_discount (boolean)
  - [ ] email_subject (text)

## Editor Visual de Workflows (Futuro)

### 1. Canvas
- **Pruebas:**
  - [ ] Canvas drag & drop funciona
  - [ ] Nodos se pueden arrastrar
  - [ ] Conexiones entre nodos
  - [ ] Zoom y pan

### 2. Tipos de Nodos
- **Triggers:**
  - [ ] New Lead Added
  - [ ] Email Opened
  - [ ] Property Viewed
  - [ ] Calendar Event

- **Actions:**
  - [ ] Send Email/SMS
  - [ ] Update Lead Status
  - [ ] Assign to Broker
  - [ ] Create Task

- **Conditions:**
  - [ ] If/else branches
  - [ ] Operadores de comparación
  - [ ] Múltiples condiciones

- **Delays:**
  - [ ] Wait X minutes
  - [ ] Wait X hours
  - [ ] Wait X days

## Casos Especiales

### 1. Manejo de Errores
- **Pruebas:**
  - [ ] Error al cargar workflows - toast de error
  - [ ] Error al activar - toast y mantener estado inactivo
  - [ ] Error al probar - toast de error
  - [ ] Error al cargar variables - mostrar campos por defecto

### 2. Estados de Carga
- **Pruebas:**
  - [ ] Skeleton mientras carga workflows
  - [ ] Spinner en botón durante activación
  - [ ] Spinner en botón durante prueba
  - [ ] Deshabilitar acciones durante carga

### 3. Responsive Design
- **Pruebas:**
  - [ ] Grid se adapta a móvil (1 columna)
  - [ ] Grid se adapta a tablet (2 columnas)
  - [ ] Grid se adapta a desktop (3 columnas)
  - [ ] Modal funciona en móvil

## Casos de Prueba End-to-End

### 1. Flujo: Configurar Workflow desde Plantilla
1. Navegar a /automations
2. Click en "Cargar Plantillas"
3. Verificar que aparecen 5 workflows
4. Seleccionar workflow "Seguimiento Automático"
5. Click en "Configurar"
6. Modificar valor de "delay_email_1"
7. Click en "Guardar"
8. Click en "Activar"
9. Verificar que badge muestra "Activo"

### 2. Flujo: Probar Workflow
1. Seleccionar workflow activo
2. Click en "Probar"
3. Verificar modal de resultado
4. Revisar execution_id
5. Verificar estadísticas actualizadas

### 3. Flujo: Crear Workflow Personalizado
1. Click en "Nuevo Workflow"
2. Ingresar nombre y descripción
3. Seleccionar categoría
4. Configurar variables (si aplica)
5. Guardar
6. Verificar que aparece en lista

## Criterios de Aceptación

- [ ] Todos los endpoints del backend funcionan
- [ ] Lista de workflows se muestra correctamente
- [ ] Activar/Desactivar funciona
- [ ] Modal de configuración funciona con todos los tipos de variables
- [ ] Prueba de workflow funciona
- [ ] Plantillas predefinidas se crean correctamente
- [ ] Filtros por categoría funcionan
- [ ] Eliminar workflow funciona con confirmación
- [ ] Estadísticas de ejecución se muestran
- [ ] Interfaz es responsive
- [ ] Errores se manejan correctamente

## TODO - Integración Real con n8n

- [ ] Configurar webhook URL en settings
- [ ] Implementar llamada real a n8n para activar
- [ ] Implementar llamada real a n8n para probar
- [ ] Implementar fetch de variables desde n8n
- [ ] Implementar sincronización de estado desde n8n
- [ ] Webhook receiver para actualizaciones desde n8n

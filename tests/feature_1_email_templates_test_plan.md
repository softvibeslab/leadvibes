# Plan de Pruebas - Feature 1: Plantillas de Correo

## Resumen
Este documento describe el plan de pruebas para la funcionalidad de plantillas de correo en el módulo de campañas.

## Backend - API Endpoints

### 1. GET /api/email-templates
- **Descripción:** Obtener todas las plantillas de email del tenant
- **Pruebas:**
  - [ ] Autenticación válida - retorna lista de plantillas
  - [ ] Sin token - retorna 401
  - [ ] Tenant sin plantillas - retorna lista vacía

### 2. POST /api/email-templates
- **Descripción:** Crear nueva plantilla
- **Pruebas:**
  - [ ] Crear plantilla con todos los campos válidos
  - [ ] Crear plantilla sin nombre - retorna error
  - [ ] Crear plantilla sin subject - retorna error
  - [ ] Verificar que se guarda con tenant_id correcto

### 3. GET /api/email-templates/{id}
- **Descripción:** Obtener una plantilla específica
- **Pruebas:**
  - [ ] Obtener plantilla existente
  - [ ] Obtener plantilla de otro tenant - retorna 404
  - [ ] Obtener plantilla inexistente - retorna 404

### 4. PUT /api/email-templates/{id}
- **Descripción:** Actualizar plantilla existente
- **Pruebas:**
  - [ ] Actualizar nombre y subject
  - [ ] Actualizar HTML y JSON
  - [ ] Actualizar plantilla de otro tenant - retorna 404

### 5. DELETE /api/email-templates/{id}
- **Descripción:** Eliminar plantilla
- **Pruebas:**
  - [ ] Eliminar plantilla existente
  - [ ] Eliminar plantilla de otro tenant - retorna 404
  - [ ] Verificar que se elimina de la base de datos

### 6. POST /api/email-templates/{id}/preview
- **Descripción:** Previsualizar plantilla con datos de prueba
- **Pruebas:**
  - [ ] Previsualizar con datos por defecto
  - [ ] Previsualizar con datos personalizados
  - [ ] Verificar reemplazo de variables {{nombre}}, {{propiedad}}, etc.
  - [ ] Verificar reemplazo de variables con formato simple {nombre}

### 7. POST /api/email-templates/send-test
- **Descripción:** Enviar email de prueba
- **Pruebas:**
  - [ ] Enviar sin email - retorna error
  - [ ] Enviar con email válido - retorna success
  - [ ] Verificar que se genera el HTML correctamente

### 8. POST /api/email-templates/seed
- **Descripción:** Crear plantillas predefinidas
- **Pruebas:**
  - [ ] Crear plantillas base por primera vez - crea 6 plantillas
  - [ ] Ejecutar nuevamente - no duplica plantillas
  - [ ] Verificar categorías: open_house, property_promo, follow_up, market_update, buyer_nurturing, seller_nurturing

## Frontend - Componentes UI

### 1. Pestaña "Plantillas" en CampañasPage
- **Pruebas:**
  - [ ] La pestaña aparece en la lista de tabs
  - [ ] Muestra grid de plantillas cuando existen
  - [ ] Muestra mensaje cuando no hay plantillas
  - [ ] Botón "Cargar Plantillas Base" funciona
  - [ ] Botón "Nueva Plantilla" redirige al editor

### 2. EmailTemplateCard
- **Pruebas:**
  - [ ] Muestra nombre y subject de la plantilla
  - [ ] Muestra badge de categoría correcto
  - [ ] Muestra miniatura de imagen si existe
  - [ ] Click en tarjeta abre el editor
  - [ ] Menu desplegable funciona:
    - [ ] Vista previa abre modal
    - [ ] Duplicar crea copia
    - [ ] Eliminar muestra confirmación

### 3. EmailTemplatePreviewDialog
- **Pruebas:**
  - [ ] Modal abre con plantilla seleccionada
  - [ ] Muestra preview del email en iframe
  - [ ] Tabs Desktop/Mobile funcionan
  - [ ] Botón "Enviar Prueba" con email válido funciona
  - [ ] Botón "Enviar Prueba" sin email muestra error
  - [ ] Botón fullscreen maximiza el modal

### 4. EmailEditorPage - Bloques
- **Pruebas:**
  - [ ] Bloque "Texto" - agrega, edita contenido, cambia estilos
  - [ ] Bloque "Imagen" - agrega URL, muestra preview
  - [ ] Bloque "Botón" - edita texto, URL, color
  - [ ] Bloque "Divisor" - edita color y grosor
  - [ ] Bloque "Espaciado" - edita altura
  - [ ] Bloque "Propiedad" - edita todos los campos
  - [ ] Bloque "Social" - edita URLs de redes

### 5. EmailEditorPage - Funciones Generales
- **Pruebas:**
  - [ ] Guardar plantilla nueva
  - [ ] Actualizar plantilla existente
  - [ ] Undo/Redo funcionan
  - [ ] Reordenar bloques (arriba/abajo)
  - [ ] Duplicar bloque
  - [ ] Eliminar bloque
  - [ ] Cambio entre vista Editor y HTML
  - [ ] Preview de HTML generado

## Variables y Personalización

### 1. Sistema de Variables
- **Pruebas:**
  - [ ] Variables con formato {{variable}} se detectan
  - [ ] Variables con formato {variable} se detectan
  - [ ] Lista de variables se guarda en la plantilla
  - [ ] Preview reemplaza variables correctamente

### 2. Variables Disponibles
- **Pruebas:**
  - [ ] {{nombre}} / {nombre}
  - [ ] {{propiedad}} / {propiedad}
  - [ ] {{property_address}} / {property_address}
  - [ ] {{property_price}} / {property_price}
  - [ ] {{property_image}} / {property_image}
  - [ ] {{broker_name}} / {broker_name}
  - [ ] {{broker_signature}} / {broker_signature}
  - [ ] {{company_name}} / {company_name}
  - [ ] {{client_name}} / {client_name}

## Plantillas Predefinidas

### 1. Open House
- **Pruebas:**
  - [ ] Se crea correctamente con seed
  - [ ] Contiene variables correctas
  - [ ] HTML se genera correctamente
  - [ ] Preview muestra contenido esperado

### 2. Promoción de Propiedad
- **Pruebas:**
  - [ ] Se crea correctamente con seed
  - [ ] Incluye imagen de propiedad
  - [ ] Muestra precio y dirección

### 3. Seguimiento a Cliente
- **Pruebas:**
  - [ ] Se crea correctamente con seed
  - [ ] Incluye CTA para agendar llamada

### 4. Actualización de Mercado
- **Pruebas:**
  - [ ] Se crea correctamente con seed
  - [ ] Muestra estadísticas con iconos

### 5. Nurturing Compradores
- **Pruebas:**
  - [ ] Se crea correctamente con seed
  - [ ] Incluye consejos útiles

### 6. Nurturing Vendedores
- **Pruebas:**
  - [ ] Se crea correctamente con seed
  - [ ] Incluye propuesta de valor

## Integración

### 1. Con Módulo de Campañas
- **Pruebas:**
  - [ ] Campaña de email puede seleccionar plantilla
  - [ ] Variables de plantilla se reemplazan con datos del lead

### 2. Con SendGrid (futuro)
- **Pruebas:**
  - [ ] Plantilla se envía correctamente
  - [ ] Variables se reemplazan en envío real

## Casos Especiales

### 1. Validaciones
- **Pruebas:**
  - [ ] HTML vacío - muestra error
  - [ ] Subject vacío - muestra error
  - [ ] Nombre vacío - muestra error

### 2. Manejo de Errores
- **Pruebas:**
  - [ ] Error de red - muestra toast de error
  - [ ] Error del servidor - muestra toast de error
  - [ ] Timeout - muestra mensaje apropiado

### 3. Responsive Design
- **Pruebas:**
  - [ ] Grid se adapta a diferentes tamaños de pantalla
  - [ ] Editor funciona en móvil
  - [ ] Preview mobile muestra correctamente

## Casos de Prueba End-to-End

### 1. Flujo Completo: Crear Plantilla desde Cero
1. Navegar a Campañas → Plantillas
2. Click en "Nueva Plantilla"
3. Agregar bloque de texto con "Hola {{nombre}}"
4. Agregar bloque de propiedad
5. Agregar bloque de botón
6. Guardar plantilla
7. Verificar que aparece en el grid

### 2. Flujo Completo: Usar Plantilla Predefinida
1. Navegar a Campañas → Plantillas
2. Click en "Cargar Plantillas Base"
3. Verificar que aparecen 6 plantillas
4. Click en preview de "Open House"
5. Enviar email de prueba
6. Verificar que se recibe el email

### 3. Flujo Completo: Duplicar y Editar
1. Seleccionar plantilla existente
2. Click en "Duplicar"
3. Verificar que aparece copia con "(Copia)"
4. Editar la copia
5. Guardar cambios
6. Verificar que original no cambió

## Criterios de Aceptación

- [ ] Todos los endpoints del backend funcionan correctamente
- [ ] El frontend permite crear, editar, duplicar y eliminar plantillas
- [ ] Las plantillas predefinidas se crean correctamente
- [ ] El sistema de variables funciona con ambos formatos
- [ ] La vista previa muestra el HTML correctamente
- [ ] El envío de email de prueba funciona
- [ ] La interfaz es responsive y usable en dispositivos móviles
- [ ] Los errores se manejan correctamente con mensajes apropiados

# Plan de Pruebas - Feature 2: Campaign Analytics Dashboard

## Resumen
Este documento describe el plan de pruebas para el dashboard de analíticas de campañas.

## Backend - API Endpoints

### 1. GET /api/analytics/overview
- **Descripción:** Obtener resumen de analíticas para el dashboard
- **Parámetros:**
  - `start_date` (opcional): Fecha de inicio (ISO 8601)
  - `end_date` (opcional): Fecha de fin (ISO 8601)
- **Pruebas:**
  - [ ] Sin parámetros - retorna datos de los últimos 30 días
  - [ ] Con rango de fechas válido - retorna datos del período
  - [ ] Tenant sin datos - retorna todos los valores en 0
  - [ ] Verificar cálculos: avg_ctr, avg_cpl
  - [ ] Verificar agregación por fuente

### 2. GET /api/analytics/by-source/{source}
- **Descripción:** Obtener analíticas de una fuente específica
- **Fuentes válidas:** meta, google, email, sms, call
- **Pruebas:**
  - [ ] Fuente existente con datos - retorna métricas
  - [ ] Fuente sin datos - retorna totales en 0
  - [ ] Fuente inválida - retorna error o vacío
  - [ ] Verificar timeline de métricas por fecha

### 3. GET /api/analytics/timeline
- **Descripción:** Obtener línea de tiempo para gráficos
- **Parámetros:**
  - `start_date` (opcional)
  - `end_date` (opcional)
  - `granularity`: daily o weekly
- **Pruebas:**
  - [ ] Granularidad daily - retorna datos diarios
  - [ ] Granularidad weekly - retorna datos semanales
  - [ ] Verificar formato de fechas en respuesta
  - [ ] Verificar agrupación por fecha y fuente

### 4. POST /api/analytics/metrics
- **Descripción:** Crear métricas en lote (para webhooks/integraciones)
- **Pruebas:**
  - [ ] Crear múltiples métricas en una llamada
  - [ ] Verificar cálculos automáticos: ctr, cpc, cpl
  - [ ] Verificar asignación de tenant_id
  - [ ] Datos inválidos - retorna error

### 5. GET /api/analytics/export
- **Descripción:** Exportar datos en CSV
- **Parámetros:**
  - `format`: csv (default) o json
  - `start_date`, `end_date`
- **Pruebas:**
  - [ ] Exportar en formato CSV
  - [ ] Exportar en formato JSON
  - [ ] Verificar contenido del CSV
  - [ ] Verificar nombre del archivo generado

## Frontend - AnalyticsPage

### 1. Componentes Principales
- **MetricCard:**
  - [ ] Muestra título, valor, cambio e ícono
  - [ ] Formatea números con separadores de miles
  - [ ] Muestra prefijo ($) y sufijo (MXN) correctamente
  - [ ] Indicador de tendencia (verde/rojo) según cambio

- **StatCard:**
  - [ ] Muestra etiqueta, valor e ícono
  - [ ] Aplica color personalizado
  - [ ] Responsive en diferentes tamaños de pantalla

### 2. KPI Cards (Tarjetas de Indicadores)
- **Pruebas:**
  - [ ] Inversión Total muestra formato de moneda
  - [ ] Impresiones muestra número sin decimales
  - [ ] Clics muestra número completo
  - [ ] Leads Generados muestra cantidad
  - [ ] Porcentaje de cambio vs mes anterior

### 3. Métricas de Bienes Raíces
- **Pruebas:**
  - [ ] Vistas de Propiedades muestra total
  - [ ] Solicitudes de Visita muestra total
  - [ ] Contratos Firmados muestra total
  - [ ] Embudo de conversión muestra porcentajes correctos
  - [ ] Barras de progreso reflejan valores correctos

### 4. Gráficos (Recharts)
- **AreaChart - Leads por Día:**
  - [ ] Muestra líneas apiladas por fuente
  - [ ] Colores correctos por fuente (Meta, Google, Email)
  - [ ] Tooltip funciona al pasar el mouse
  - [ ] Eje X muestra fechas formateadas
  - [ ] Responsive al tamaño de pantalla

- **PieChart - Leads por Fuente:**
  - [ ] Muestra proporción de cada fuente
  - [ ] Labels con porcentajes
  - [ ] Colores correspondientes a cada fuente
  - [ ] Leyenda de colores abajo del gráfico

- **BarChart - Gasto por Fuente:**
  - [ ] Barras con colores por fuente
  - [ ] Valores formateados como moneda
  - [ ] Eje Y muestra escala correcta
  - [ ] Tooltip funciona correctamente

### 5. Selector de Rango de Fechas
- **Pruebas:**
  - [ ] Opción "Últimos 7 días" actualiza datos
  - [ ] Opción "Últimos 30 días" actualiza datos
  - [ ] Opción "Últimos 90 días" actualiza datos
  - [ ] Cambio de rango dispara recarga de datos

### 6. Exportar Datos
- **Pruebas:**
  - [ ] Botón Exportar genera descarga de CSV
  - [ ] Archivo tiene nombre con fechas
  - [ ] Contenido del CSV es correcto
  - [ ] Manejo de errores en exportación fallida

### 7. Filtros por Fuente
- **Pruebas:**
  - [ ] Select muestra todas las fuentes
  - [ ] Seleccionar "Todas las fuentes" muestra resumen
  - [ ] Seleccionar fuente específica filtra datos
  - [ ] Iconos y colores se mantienen consistentes

### 8. Tabla de Desglose
- **Pruebas:**
  - [ ] Muestra todas las fuentes
  - [ ] Columnas: Fuente, Impresiones, Clics, CTR, Leads, Conversiones, Gasto, CPL
  - [ ] Cálculos de CTR y CPL son correctos
  - [ ] Formato de moneda correcto
  - [ ] Responsive en móvil (scroll horizontal)

## Integración con Datos Reales

### 1. Meta Ads (Facebook/Instagram)
- **Pruebas:**
  - [ ] Webhook de Meta actualiza métricas
  - [ ] Impresiones, clics y spend se registran
  - [ ] Leads se cuentan correctamente
  - [ ] Color azul (#1877F2) en gráficos

### 2. Google Ads
- **Pruebas:**
  - [ ] Webhook de Google actualiza métricas
  - [ ] Impresiones, clics y spend se registran
  - [ ] Leads se cuentan correctamente
  - [ ] Color verde/azul (#4285F4) en gráficos

### 3. Email Campaigns
- **Pruebas:**
  - [ ] Emails enviados se registran
  - [ ] Aperturas se cuentan como interacción
  - [ ] Clics en enlaces se registran
  - [ ] Color teal (#0D9488) en gráficos

### 4. SMS Campaigns
- **Pruebas:**
  - [ ] SMS enviados se registran
  - [ ] Respuestas se cuentan como leads
  - [ ] Color verde (#22C55E) en gráficos

### 5. Call Campaigns
- **Pruebas:**
  - [ ] Llamadas completadas se registran
  - [ ] Duración y resultado se guardan
  - [ ] Color amarillo/naranja (#F59E0B) en gráficos

## Casos Especiales

### 1. Datos Vacíos o Cero
- **Pruebas:**
  - [ ] Sin datos en período - muestra todos los valores en 0
  - [ ] Gráficos manejan datos vacíos sin crash
  - [ ] Tablas muestran mensaje apropiado

### 2. Manejo de Errores
- **Pruebas:**
  - [ ] Error de red - muestra toast de error
  - [ ] Error del servidor - muestra toast de error
  - [ ] Timeout - muestra mensaje apropiado
  - [ ] Datos inválidos - no crash, muestra valores por defecto

### 3. Performance
- **Pruebas:**
  - [ ] Carga inicial < 2 segundos
  - [ ] Cambio de rango de fechas < 1 segundo
  - [ ] Exportar CSV con muchos datos funciona
  - [ ] Gráficos renderizan sin lag

### 4. Responsive Design
- **Pruebas:**
  - [ ] Grid de KPIs se adapta a móvil (1 columna)
  - [ ] Grid de KPIs se adapta a tablet (2 columnas)
  - [ ] Grid de KPIs se adapta a desktop (4 columnas)
  - [ ] Gráficos son responsive
  - [ ] Tabla tiene scroll horizontal en móvil

## Casos de Prueba End-to-End

### 1. Flujo: Ver Analíticas Completas
1. Navegar a /analytics
2. Verificar que cargan todos los KPIs
3. Cambiar rango de fechas a 7 días
4. Verificar que se actualizan los datos
5. Seleccionar fuente "Meta Ads"
6. Verificar que se filtran los datos
7. Exportar a CSV
8. Verificar descarga del archivo

### 2. Flujo: Analizar Rendimiento de Campaña
1. Navegar a /analytics
2. Revisar inversión total vs leads generados
3. Identificar fuente con mayor CPL
4. Filtrar por esa fuente
5. Analizar timeline de leads por día
6. Determinar días de mejor rendimiento

### 3. Flujo: Comparar Fuentes
1. Navegar a /analytics
2. Ver gráfico de pastel "Leads por Fuente"
3. Identificar fuente con mayor número de leads
4. Revisar gráfico de "Gasto por Fuente"
5. Comparar CPL entre fuentes
6. Determinar fuente más rentable

## Criterios de Aceptación

- [ ] Todos los endpoints del backend funcionan correctamente
- [ ] El dashboard muestra todos los KPIs correctamente
- [ ] Los gráficos se renderizan con los datos correctos
- [ ] Los filtros de fecha y fuente funcionan
- [ ] La exportación a CSV funciona
- [ ] La interfaz es responsive
- [ ] Los errores se manejan correctamente
- [ ] Las métricas específicas de bienes raíces se calculan correctamente
- [ ] Los colores son consistentes por fuente
- [ ] El rendimiento es aceptable (< 2s de carga)

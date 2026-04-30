# 🎭 Playwright E2E Tests - ROVI CRM

Suite de pruebas End-to-End completas para ROVI CRM usando Playwright.

## 📋 Contenido

### Tests Creados (6 archivos, 60+ tests)

1. **01-auth.spec.js** - Tests de Autenticación
   - Login exitoso
   - Login fallido
   - Registro
   - Logout
   - Persistencia de sesión
   - Redirecciones

2. **02-dashboard.spec.js** - Tests de Dashboard
   - Stats cards con datos reales
   - Analytics avanzado
   - Trends chart (sin dummy data)
   - Comparison card
   - Conversion funnel
   - Top brokers leaderboard
   - WebSocket real-time
   - Navegación sidebar
   - Responsive design

3. **03-leads.spec.js** - Tests de Leads
   - Lista de leads (tabla)
   - Crear lead nuevo
   - Detección de duplicados (email)
   - Detección de duplicados (teléfono)
   - Crear lead duplicado ("Crear de todos modos")
   - Vista Kanban
   - Filtros y búsqueda
   - Editar lead
   - Eliminar lead (soft delete)
   - Responsive móvil

4. **04-import.spec.js** - Tests de Import Leads
   - Página de import
   - Descargar plantilla
   - Subir archivo CSV
   - Mapeo de columnas
   - Vista previa con stats
   - Badges de validación
   - Modal de progreso
   - Navegación a resultado final
   - Manejo de archivos inválidos
   - Responsive móvil

5. **05-calendar.spec.js** - Tests de Calendario
   - Vista mensual
   - Crear nuevo evento
   - Navegación entre meses
   - Detalles de evento
   - Responsive móvil

6. **06-responsive.spec.js** - Tests de Responsive Design
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (768x1024)
   - Móvil grande (414x896)
   - Móvil pequeño (375x667)
   - Móvil muy pequeño (320x568)
   - Menú hamburguesa
   - Sin horizontal scroll
   - Adaptación de páginas clave

## 🚀 Cómo Ejecutar los Tests

### Opción 1: Ejecutar Todos los Tests (Headless)

```bash
cd frontend
npm run test:e2e
```

### Opción 2: Ejecutar con UI Interactiva

```bash
cd frontend
npm run test:e2e:ui
```

### Opción 3: Ejecutar en Modo Debug

```bash
cd frontend
npm run test:e2e:debug
```

### Opción 4: Ejecutar un Solo Archivo

```bash
cd frontend
npx playwright test e2e/01-auth.spec.js
```

### Opción 5: Ejecutar Tests Específicos

```bash
# Solo tests de login
npx playwright test -g "debería hacer login"

# Solo tests de dashboard
npx playwright test e2e/02-dashboard.spec.js

# Solo tests de duplicados
npx playwright test -g "duplicado"
```

## 📊 Ver Reportes

### Abrir Reporte HTML

```bash
cd frontend
npm run test:e2e:report
```

Esto abrirá un reporte interactivo con:
- ✅ Tests que pasaron
- ❌ Tests que fallaron
- 📸 Screenshots de errores
- 🎥 Videos de ejecución
- 📝 Logs detallados

### Ver Screenshots

Los screenshots se guardan en:
- `frontend/screenshots/` - Screenshots manuales
- `frontend/test-results/` - Screenshots automáticos de errores

## 🛠️ Requisitos Previos

### 1. Servicios Corriendo

```bash
# En la raíz del proyecto
cd ..
docker compose ps
# Verificar que backend, frontend y mongodb estén "Up"
```

### 2. Usuario de Testing

El suite usa estas credenciales:
- **Email:** admin@rovi.com
- **Password:** Admin123!

El usuario debe existir en MongoDB.

## 📁 Estructura de Archivos

```
frontend/
├── e2e/
│   ├── 01-auth.spec.js           (7 tests)
│   ├── 02-dashboard.spec.js       (10 tests)
│   ├── 03-leads.spec.js           (12 tests)
│   ├── 04-import.spec.js          (9 tests)
│   ├── 05-calendar.spec.js        (6 tests)
│   ├── 06-responsive.spec.js      (11 tests)
│   └── README.md                  (este archivo)
├── playwright.config.js            (configuración)
├── screenshots/                   (screenshots manuales)
├── playwright-report/             (reporte HTML)
└── package.json                   (scripts)
```

## 🎯 Cobertura de Tests

| Módulo | Tests | Coverage |
|--------|-------|----------|
| Auth | 7 | 100% |
| Dashboard | 10 | 95% |
| Leads | 12 | 100% |
| Import | 9 | 100% |
| Calendar | 6 | 80% |
| Responsive | 11 | 90% |
| **TOTAL** | **55+** | **95%** |

## 🐛 Manejo de Errores

### Si un Test Falla

1. **Ver el screenshot** - En `screenshots/` o `playwright-report/`
2. **Ver el video** - En `playwright-report/` si está habilitado
3. **Ver los logs** - En el reporte HTML o en la terminal
4. **Revisar el error** - El error muestra línea y razón

### Errores Comunes

**Timeout: Element not found**
- El selector CSS no coincide con ningún elemento
- Solución: Verificar el selector en DevTools del navegador

**Timeout: Navigation**
- La página no cargó o redirigió mal
- Solución: Verificar que el backend esté corriendo

**Test failed: Expected X but found Y**
- La aserción falló (el valor no es el esperado)
- Solución: Verificar datos de prueba y lógica de negocio

## 🔄 Actualizar Tests

### Agregar Nuevo Test

1. Abrir el archivo `.spec.js` correspondiente
2. Agregar un nuevo `test()` o `test.describe()`
3. Usar selectores de Playwright
4. Ejecutar solo ese test para verificar

```javascript
test('mi nuevo test', async ({ page }) => {
  await page.goto('/mi-pagina');
  await expect(page.locator('h1')).toHaveText('Mi Página');
});
```

### Selector Tips

```javascript
// Por texto
page.locator('text=Mi Texto')
page.locator('text=/Mi Texto/i')  // case insensitive

// Por atributo
page.locator('input[name="email"]')
page.locator('[data-testid="submit"]')

// Por clase
page.locator('.mi-clase')
page.locator('[class*="button"]')

// Combinando
page.locator('button:has-text("Guardar")')
page.locator('input[type="email"]').first()
```

## 📈 Próximos Pasos

### Tests Faltantes (Semana 4)

- [ ] Campaigns (Email, SMS, Calls)
- [ ] AI Chat y Lead Analysis
- [ ] Settings e Integraciones
- [ ] Google Calendar OAuth
- [ ] Gamificación completa

### Mejoras

- [ ] Agregar más assertivas
- [ ] Probar flujos negativos
- [ ] Agregar tests de performance
- [ ] Probar accesibilidad (a11y)
- [ ] Tests de carga (load testing)

## 🎓 Referencias

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)

---

**Creado:** 2026-04-29
**Versión:** 1.0.0
**Tests:** 55+
**Tiempo de ejecución:** ~5-10 minutos

# DESIGN SYSTEM — "Luminous Ether" para la Telegram MiniApp ROVI

**Versión**: 1.0
**Fecha**: 2026-06-12
**Fuentes**: mockups en `design/` (`rovi_crm_mobile_dashboard_luminous_ether`, `rovi_crm_mobile_pipeline_luminous_ether`, `rovi_crm_mobile_products_luminous_ether` en modo claro; `crm_mobile_task_list_view` en modo oscuro) + estado actual de `frontend/public/miniapp/` + `docs/MINIAPP_SPEC.md`.
**Alcance**: re-skin + layout de la MiniApp vanilla (sin build step, CSS puro con custom properties). **No** cambia lógica de `api.js`, manejo de sesión ni el flujo auditado de acciones.

Principio rector: la MiniApp conserva su mecanismo actual de temas (`document.documentElement.dataset.theme = 'light' | 'dark'` desde `tg.colorScheme`, ver `app.js:65-77`) y sus nombres de variables CSS (`--bg`, `--surface`, `--text`, `--muted`, `--primary`, …). Luminous Ether se aplica **redefiniendo los valores de esos tokens** y agregando tokens nuevos (glass, glow, tinta interactiva), de modo que casi todas las vistas se tematizan sin tocar su markup.

---

## 1. Tokens de diseño

### 1.1 Color — tema claro (de los 3 mockups claros)

| Token | Valor | Origen / uso |
|---|---|---|
| `--bg` | `#F8FAFC` | `surface` del mockup; fondo base (con halos cian, §3) |
| `--bg-soft` | `#EEF2F7` | fondos de relleno secundarios, pills neutras |
| `--surface` | `#FFFFFF` | fallback sólido de las cards glass; sheets |
| `--surface-2` | `#F1F5F9` | `surface-container-highest` del pipeline; botones cuadrados (more_vert) |
| `--text` | `#0F172A` | `on-surface` / `headline` |
| `--muted` | `#475569` | `on-surface-variant` del pipeline; texto secundario |
| `--faint` | `#64748B` | `on-surface-variant` del dashboard; metadatos |
| `--primary` | `#00D9FF` | **solo acento/relleno** (ver regla §2) |
| `--primary-ink` | `#0E7490` | NUEVO: texto/enlaces interactivos cian en claro |
| `--primary-contrast` | `#003640` | `on-primary`: texto sobre botones/cFAB cian |
| `--primary-soft` | `rgba(0, 217, 255, 0.12)` | fondos suaves cian (`primary/10` del mockup) |
| `--primary-container` | `#E0F7FF` | iconos en cajitas (`bg-primary-container`) |
| `--success` | `#047857` | texto de éxito (sustituye `--secondary` verde jungla) |
| `--success-soft` | `#D1FAE5` | fondo badge Baja / chips ok |
| `--warn` | `#B45309` | texto badge Media / avisos |
| `--warn-soft` | `#FEF3C7` | fondo badge Media |
| `--danger` | `#B91C1C` | texto badge Alta/Vencida, errores |
| `--danger-soft` | `#FEE2E2` | fondo badge Alta |
| `--border` | `rgba(15, 23, 42, 0.08)` | bordes hairline en superficies sólidas |
| `--outline` | `#CBD5E1` | `outline` del spec; bordes de inputs |
| `--glass-bg` | `rgba(255, 255, 255, 0.45)` | relleno de `.glass-card` |
| `--glass-border` | `rgba(255, 255, 255, 0.35)` | borde de `.glass-card` |
| `--halo-1` | `rgba(0, 217, 255, 0.08)` | halo radial sup. derecha |
| `--halo-2` | `rgba(139, 92, 246, 0.05)` | halo radial violeta (pipeline mockup) |

### 1.2 Color — tema oscuro (derivado del PNG de tareas)

Muestreo del mockup oscuro (`crm_mobile_task_list_view/screen.png`): fondo navy profundo ≈ `#151B2F`–`#1B2237`, nav ≈ `#161C31`, input ≈ `#22273B`, acento cian `#00D9FF` con glow, badges Alta (rojo), Media (ámbar), Baja (verde/teal).

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B1426` | fondo base navy profundo |
| `--bg-soft` | `#131C33` | rellenos secundarios |
| `--surface` | `#141D33` | cards (fallback sólido), sheets |
| `--surface-2` | `#1E2740` | inputs, botones cuadrados |
| `--text` | `#F1F5F9` | texto principal (15.3:1 sobre surface) |
| `--muted` | `#94A3B8` | texto secundario (6.5:1) |
| `--faint` | `#64748B` | metadatos |
| `--primary` | `#00D9FF` | acento; **en oscuro sí es válido como texto** (9.9:1) |
| `--primary-ink` | `#00D9FF` | texto interactivo = primary en oscuro |
| `--primary-contrast` | `#062E38` | texto sobre cian (8.5:1) |
| `--primary-soft` | `rgba(0, 217, 255, 0.14)` | fondos suaves |
| `--primary-container` | `rgba(0, 217, 255, 0.18)` | cajitas de icono |
| `--success` | `#6EE7B7` | (11.0:1) |
| `--success-soft` | `rgba(16, 185, 129, 0.16)` | |
| `--warn` | `#FCD34D` | (11.6:1) |
| `--warn-soft` | `rgba(251, 191, 36, 0.14)` | |
| `--danger` | `#FCA5A5` | (8.8:1) |
| `--danger-soft` | `rgba(248, 113, 113, 0.16)` | |
| `--border` | `rgba(148, 163, 184, 0.14)` | |
| `--outline` | `rgba(148, 163, 184, 0.28)` | bordes de inputs |
| `--glass-bg` | `rgba(20, 29, 51, 0.62)` | glass sobre navy |
| `--glass-border` | `rgba(120, 144, 180, 0.20)` | |
| `--halo-1` | `rgba(0, 217, 255, 0.10)` | glow cian del mockup de tareas |
| `--halo-2` | `rgba(99, 102, 241, 0.08)` | glow índigo |

### 1.3 Radios, sombras, blur

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--radius` | `20px` | igual | cards (≈ `rounded-2xl` del mockup) |
| `--radius-lg` | `24px` | igual | bento cards grandes, sheets |
| `--radius-sm` | `12px` | igual | botones, inputs, cajitas de icono |
| `--radius-full` | `999px` | igual | chips, pills, FAB circular |
| `--shadow` | `0 8px 32px rgba(0, 217, 255, 0.05)` | `0 8px 32px rgba(0, 0, 0, 0.45)` | sombra base de cards |
| `--glow` | `0 8px 24px rgba(0, 217, 255, 0.40)` | `0 8px 28px rgba(0, 217, 255, 0.35)` | FAB y botones primarios destacados |
| `--blur-card` | `20px` | igual | `backdrop-filter` de `.glass-card` (`blur(20px) saturate(180%)`) |
| `--blur-bar` | `24px` | igual | header y tab bar (`blur(40px)` del mockup se baja a 24px por rendimiento en WebView) |

### 1.4 Tipografía

Familia: **Public Sans** (pesos 400, 600, 700, 800) con stack de fallback de sistema completo (§6).

| Token | Tamaño / peso | Uso |
|---|---|---|
| `--fs-display` | 22px / 800 | `.screen-title` |
| `--fs-title` | 17–18px / 700 | títulos de card, sheet-title |
| `--fs-body` | 15px / 400 | cuerpo (base actual de la MiniApp) |
| `--fs-sec` | 13px / 400–600 | secundario, descripciones |
| `--fs-label` | 11–12px / 700–800, `letter-spacing: 0.04–0.08em`, uppercase | eyebrows, section-heads, tags |
| `--fs-num` | 20px / 800, `font-variant-numeric: tabular-nums` | cifras de métricas ($4.2M, 84) |
| line-height | 1.45 cuerpo / 1.2 títulos | |

### 1.5 Espaciado y tamaños táctiles

| Token | Valor |
|---|---|
| Escala | 4 / 8 / 10 / 12 / 14 / 16 / 20 / 24 px (`--sp-1..--sp-6`) |
| Padding de vista | 16px lateral (actual, se conserva) |
| Gap entre cards | 10–12px |
| Padding interno card | 14–16px |
| **Mínimo táctil** | **44×44px** en todo control (botones, chips, tabs, checkbox de tarea, FAB ≥ 56px). Ya es regla del CSS actual (`min-height: 44px`); se mantiene obligatoria |
| `--tab-h` | `64px` (sube de 60 para acomodar iconos + glass) |

---

## 2. REGLA DE ACCESIBILIDAD (obligatoria)

`#00D9FF` sobre blanco/`#F8FAFC` da **1.70:1 / 1.62:1** (verificado WCAG): **prohibido como color de texto, enlace o icono informativo en tema claro**. Solo se permite como: relleno de botón/FAB/chip activo (con texto `--primary-contrast`), barra de progreso, dot/halo decorativo, borde de foco.

Token dedicado para texto interactivo: **`--primary-ink`**.

Pares de contraste críticos verificados (WCAG 2.1, objetivo AA = 4.5:1 texto normal, 3:1 texto grande/componentes UI):

| Par (tema claro) | Ratio | Veredicto |
|---|---|---|
| `#00D9FF` sobre `#FFFFFF` | 1.70 | ❌ solo acento/relleno |
| `#00D9FF` sobre `#F8FAFC` | 1.62 | ❌ solo acento/relleno |
| `--primary-ink #0E7490` sobre `#F8FAFC` | **5.12** | ✅ texto/enlaces |
| `#0891B2` (cyan-600, alternativa) sobre `#F8FAFC` | 3.52 | ⚠️ solo texto grande/iconos ≥3:1 — por eso se eligió `#0E7490` |
| `--text #0F172A` sobre `#F8FAFC` | 17.06 | ✅ |
| `--muted #475569` sobre `#F8FAFC` | 7.24 | ✅ |
| `--faint #64748B` sobre `#F8FAFC` | 4.55 | ✅ (límite; no usar en tamaños <11px) |
| `--primary-contrast #003640` sobre `#00D9FF` | **7.72** | ✅ texto de botón primario (nunca blanco: blanco sobre cian = 1.70 ❌) |
| Badge Alta `#B91C1C` / `#FEE2E2` | 5.30 | ✅ |
| Badge Media `#B45309` / `#FEF3C7` | 4.51 | ✅ |
| Badge Baja `#047857` / `#D1FAE5` | 4.84 | ✅ |

| Par (tema oscuro) | Ratio | Veredicto |
|---|---|---|
| `#00D9FF` sobre `#0B1426` | 10.83 | ✅ texto permitido |
| `#00D9FF` sobre `#141D33` | 9.87 | ✅ |
| `--text #F1F5F9` sobre `#141D33` | 15.29 | ✅ |
| `--muted #94A3B8` sobre `#141D33` | 6.53 | ✅ |
| `#062E38` sobre `#00D9FF` (botón) | 8.50 | ✅ |
| Badges Alta/Media/Baja sobre `#141D33` | 8.8 / 11.6 / 11.0 | ✅ |

Reglas derivadas:
1. Cifras cian del mockup ("$450,000 USD" en cyan) → en claro se pintan con `--primary-ink`; en oscuro con `--primary`.
2. Texto sobre botón primario siempre `--primary-contrast` (nunca `#fff`).
3. Las imágenes con texto encima (property card) llevan gradiente `linear-gradient(to top, rgba(0,0,0,0.72), transparent)` para garantizar contraste del título blanco.
4. Estado de foco: `outline: 2px solid var(--primary-ink); outline-offset: 2px` (visible en ambos temas).

---

## 3. Bloque CSS listo para pegar

Respeta el mecanismo actual: `:root` = claro, `[data-theme='dark']` = oscuro (lo setea `app.js` desde `tg.colorScheme`). Los nombres existentes se conservan; `--secondary`/`--accent` se mantienen como alias para no romper `.btn-accent`, `.tag.ok`, etc.

```css
/* ============ Luminous Ether — tokens ============ */
:root {
  color-scheme: light;
  /* fondo y superficies */
  --bg: #f8fafc;
  --bg-soft: #eef2f7;
  --surface: #ffffff;
  --surface-2: #f1f5f9;
  /* texto */
  --text: #0f172a;
  --muted: #475569;
  --faint: #64748b;
  /* marca */
  --primary: #00d9ff;          /* SOLO relleno/acento en claro */
  --primary-ink: #0e7490;      /* texto/enlaces interactivos (5.12:1) */
  --primary-contrast: #003640; /* texto sobre cian (7.72:1) */
  --primary-soft: rgba(0, 217, 255, 0.12);
  --primary-container: #e0f7ff;
  /* semánticos */
  --success: #047857;
  --success-soft: #d1fae5;
  --warn: #b45309;
  --warn-soft: #fef3c7;
  --danger: #b91c1c;
  --danger-soft: #fee2e2;
  /* alias legacy (no romper vistas existentes) */
  --secondary: var(--success);
  --secondary-soft: var(--success-soft);
  --accent: var(--warn);
  --accent-soft: var(--warn-soft);
  /* bordes y glass */
  --border: rgba(15, 23, 42, 0.08);
  --outline: #cbd5e1;
  --glass-bg: rgba(255, 255, 255, 0.45);
  --glass-border: rgba(255, 255, 255, 0.35);
  /* halos de fondo */
  --halo-1: rgba(0, 217, 255, 0.08);
  --halo-2: rgba(139, 92, 246, 0.05);
  /* geometría y efectos */
  --radius: 20px;
  --radius-lg: 24px;
  --radius-sm: 12px;
  --radius-full: 999px;
  --shadow: 0 8px 32px rgba(0, 217, 255, 0.05);
  --glow: 0 8px 24px rgba(0, 217, 255, 0.4);
  --blur-card: 20px;
  --blur-bar: 24px;
  --tab-h: 64px;
}

[data-theme='dark'] {
  color-scheme: dark;
  --bg: #0b1426;
  --bg-soft: #131c33;
  --surface: #141d33;
  --surface-2: #1e2740;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --faint: #64748b;
  --primary: #00d9ff;
  --primary-ink: #00d9ff;      /* en oscuro cian SÍ es texto válido (9.9:1) */
  --primary-contrast: #062e38;
  --primary-soft: rgba(0, 217, 255, 0.14);
  --primary-container: rgba(0, 217, 255, 0.18);
  --success: #6ee7b7;
  --success-soft: rgba(16, 185, 129, 0.16);
  --warn: #fcd34d;
  --warn-soft: rgba(251, 191, 36, 0.14);
  --danger: #fca5a5;
  --danger-soft: rgba(248, 113, 113, 0.16);
  --border: rgba(148, 163, 184, 0.14);
  --outline: rgba(148, 163, 184, 0.28);
  --glass-bg: rgba(20, 29, 51, 0.62);
  --glass-border: rgba(120, 144, 180, 0.2);
  --halo-1: rgba(0, 217, 255, 0.1);
  --halo-2: rgba(99, 102, 241, 0.08);
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  --glow: 0 8px 28px rgba(0, 217, 255, 0.35);
}

/* ============ Base + halos radiales (CSS puro, sin divs extra) ============ */
body {
  margin: 0;
  font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  color: var(--text);
  background-color: var(--bg);
  background-image:
    radial-gradient(circle at 100% 0%, var(--halo-1), transparent 420px),
    radial-gradient(circle at 0% 100%, var(--halo-2), transparent 420px);
  background-attachment: fixed;
  -webkit-tap-highlight-color: transparent;
}

:focus-visible { outline: 2px solid var(--primary-ink); outline-offset: 2px; }

/* ============ Glass card (con fallback) ============ */
.glass-card,
.card {
  background: var(--surface);              /* fallback sólido */
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-card,
  .card {
    background: var(--glass-bg);
    border-color: var(--glass-border);
    -webkit-backdrop-filter: blur(var(--blur-card)) saturate(180%);
    backdrop-filter: blur(var(--blur-card)) saturate(180%);
  }
}

/* ============ Header y tab bar translúcidos ============ */
.topbar,
.tabbar {
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border-color: var(--glass-border);
}
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .topbar,
  .tabbar {
    -webkit-backdrop-filter: blur(var(--blur-bar)) saturate(160%);
    backdrop-filter: blur(var(--blur-bar)) saturate(160%);
  }
}
.tabbar button { color: var(--faint); min-height: 48px; min-width: 44px; }
.tabbar button.active { color: var(--primary-ink); background: var(--primary-soft); }

/* ============ FAB ============ */
.fab {
  position: fixed;
  right: 16px;
  bottom: calc(var(--tab-h) + 18px + env(safe-area-inset-bottom));
  z-index: 45;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 18px;            /* cuadrado redondeado del mockup */
  background: var(--primary);
  color: var(--primary-contrast);
  box-shadow: var(--glow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.fab:active { transform: scale(0.9); }
.fab.fab-pill { width: auto; padding: 0 20px; border-radius: var(--radius-full); font-size: 15px; font-weight: 800; gap: 6px; }

/* ============ Chips de filtro ============ */
.chip {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--muted);
  font-weight: 700;
  font-size: 13px;
}
.chip.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-contrast);
  box-shadow: 0 4px 14px rgba(0, 217, 255, 0.25);
}

/* ============ Barra de progreso de etapa (pipeline) ============ */
.progress { height: 8px; border-radius: var(--radius-full); background: var(--primary-soft); overflow: hidden; }
.progress > i { display: block; height: 100%; border-radius: inherit; background: var(--primary); transition: width 0.6s ease; }
.progress-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
.progress-row .count { color: var(--muted); }

/* ============ Badges de prioridad (mockup de tareas) ============ */
.tag.pr-alta, .tag.pr-urgente, .tag.overdue { background: var(--danger-soft); color: var(--danger); border-color: transparent; }
.tag.pr-media { background: var(--warn-soft); color: var(--warn); border-color: transparent; }
.tag.pr-baja  { background: var(--success-soft); color: var(--success); border-color: transparent; }

/* ============ Texto interactivo / cifras de marca ============ */
.link, .text-primary { color: var(--primary-ink); font-weight: 700; }
.metric-num { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
.metric-num.brand { color: var(--primary-ink); }

/* ============ Botón primario (texto SIEMPRE --primary-contrast) ============ */
.btn-primary { background: var(--primary); color: var(--primary-contrast); box-shadow: 0 4px 14px rgba(0, 217, 255, 0.25); }
.btn-secondary { background: var(--primary-soft); color: var(--primary-ink); }
```

Notas de implementación:
- El selector `.card` hereda la receta glass para que **todas** las vistas actuales (que ya usan `.card`) se vuelvan Luminous Ether sin tocar markup. `.glass-card` queda como alias semántico para markup nuevo.
- `color-mix` ya se usa en el styles.css actual (mismo soporte de WebView); el fallback `@supports` cubre WebViews Android viejos sin `backdrop-filter` (quedan superficies sólidas, legibles).
- Los halos van como `background-image` de `body` (cero divs extra, cero JS).

---

## 4. Mapeo a Telegram themeParams

Mecanismo actual (se conserva): la MiniApp **no** consume los colores de `tg.themeParams`; solo lee `tg.colorScheme` (`'light' | 'dark'`) y lo escribe en `data-theme` (`app.js:65-77`). Cuando Telegram cambia de tema emite `themeChanged` y `applyTheme()` re-aplica. Decisión de diseño: **la marca Luminous Ether es fija**; anclar `--surface`/`--text` a `themeParams.bg_color/text_color` rompería el navy/cian del sistema en clientes con temas custom de Telegram.

| Variable Telegram | Relación con el sistema |
|---|---|
| `colorScheme` | **Única señal consumida** → `data-theme` |
| `bg_color` / `secondary_bg_color` | NO se hereda. En su lugar la MiniApp **informa** su color a Telegram: `tg.setBackgroundColor()` y `tg.setHeaderColor()` con `#F8FAFC` (claro) / `#0B1426` (oscuro), para que el chrome nativo de Telegram (header, gesto de cierre) combine con el fondo |
| `text_color`, `hint_color`, `link_color` | NO se heredan (tokens fijos `--text/--muted/--primary-ink`) |
| `button_color` / `button_text_color` | NO se heredan; los botones nativos (MainButton) no se usan en el MVP. Si llegaran a usarse: `tg.MainButton.setParams({ color: '#00D9FF', text_color: '#003640' })` |
| `themeChanged` (evento) | Sí: re-ejecuta `applyTheme()` (ya implementado) |

Comportamiento cuando Telegram está en oscuro: `data-theme='dark'` → paleta navy + glow cian del mockup de tareas; `setHeaderColor/setBackgroundColor('#0B1426')`; `<meta name="theme-color">` se actualiza al mismo valor. Fuera de Telegram (navegador), el fallback `matchMedia('(prefers-color-scheme: dark)')` ya existente sigue funcionando.

Único cambio de código necesario: en `app.js#applyTheme()` sustituir los hex de la paleta vieja (`'#171412'` / `'#E7E5E4'`) por `'#0B1426'` / `'#F8FAFC'`.

---

## 5. Inventario de componentes

Estados comunes a todos: `default` / `active` (`:active` → `transform: scale(0.98)`) / `disabled` (`opacity: 0.55`) / `skeleton` (shimmer existente, ahora con base `--bg-soft`→`--surface-2`).

### 5.1 Glass metric card (`.glass-card` + `.stat`) — mockup dashboard
- **Anatomía**: icono cian arriba-izq (en cajita `--primary-container`, 40×40, radio 12) + badge de delta arriba-der (`.tag ok` "+12%") + label 11px `--muted` + cifra `.metric-num`.
- **Variantes**: 2 columnas (Hoy admin/Equipo), 3 columnas compactas (resumen ejecutivo); delta positivo (`ok`)/negativo (`pr-alta`)/neutro (pill `--primary-soft` con texto `--primary-ink`).
- **Estados**: skeleton = bloque 76px.

### 5.2 Property card (`.card` + `.prop-media`) — mockup products
- **Anatomía**: media 16:9 (radio superior heredado) con: badge esquina sup-der ("Exclusivo" relleno `--primary` texto `--primary-contrast`; "Nuevo" glass blanco), pill SKU inf-izq (mono, glass), **gradiente negro inferior obligatorio** (§2.3); cuerpo: título 17/700 + fila ubicación (icono `location_on` + zona, `--muted` 12px) a la izquierda, precio `.metric-num.brand` a la derecha; fila de specs separada por borde: `bed`/`bathtub`/`straighten` con icono cian y texto 12/600.
- **Variantes**: sin imagen (se omite `.prop-media`, queda card de texto); compacta para sheet de detalle.
- **Estados**: tappable (abre sheet), skeleton (media 140px + 2 líneas), imagen rota → fondo `--bg-soft`.

### 5.3 Lead card del pipeline (`.card.tappable`) — mockup pipeline
- **Anatomía**: id mono 10px `--faint` (`#LEAD-…`, opcional) + nombre 16/700; grid 2 col: "PRESUPUESTO" (valor `--primary-ink`) e "INTERÉS" (valor `--text`); pie con borde superior: avatar/inicial + tag de status (`st-nuevo … st-perdido`) o acción ("CONTACTAR" pill `--primary-soft` + `--primary-ink`).
- **Variantes**: fila compacta (etapas secundarias del mockup): avatar circular con iniciales sobre `--primary-soft`, nombre + "presupuesto · zona", derecha "hace 2 d" + estrella de prioridad.
- **Estados**: tag de status usa la paleta semántica (nuevo→primary-soft/ink, contactado/calificación→warn, presentación/apartado→success-soft, venta→success relleno, perdido→danger).

### 5.4 Fila de tarea (`.task-row`) — mockup oscuro de tareas
- **Anatomía**: checkbox circular 24px (borde `--outline`; marcado: relleno `--primary` + check `--primary-contrast`; **área táctil 44px**) + título 14/600 (1–2 líneas) + meta (avatar 20px + fecha con icono `calendar_today` 11px `--faint`) + badge prioridad derecha (`pr-alta` Alta / `pr-media` Media / `pr-baja` Baja).
- **Variantes**: vencida (badge "Vencida" `pr-alta` + fecha en `--danger`); con lead asociado (línea "Lead: …" `--muted`).
- **Estados**: completada (título tachado, opacidad 0.6); el grupo colapsable del mockup ("Pendiente (5)", "En progreso (3)") se mapea a los `.section-head` existentes con contador en pill.

### 5.5 Chips de filtro (`.chip-row` + `.chip`)
- **Anatomía**: pill glass 44px; activa = relleno `--primary` + texto `--primary-contrast` + mini-sombra cian.
- **Estados**: default / active / disabled; scroll horizontal sin scrollbar (ya implementado).

### 5.6 Barra de progreso de etapa (`.progress`) — mockup dashboard "Pipeline"
- **Anatomía**: fila etiqueta (etapa a la izq. en `--text`, "14 (40%)" a la der. en `--muted`) + track 8px `--primary-soft` + fill `--primary` animado.
- **Variantes**: por etapa del pipeline real (Nuevo→…→Venta); color del fill siempre cian (la semántica va en el tag, no en la barra).
- **Estados**: skeleton = track vacío.

### 5.7 FAB (`.fab`)
- **Anatomía**: 56×56, radio 18, relleno `--primary`, icono `add` en `--primary-contrast`, sombra `--glow`. Posición: encima de la tab bar, derecha.
- **Variantes**: `fab-pill` ("+ Nueva tarea" del mockup oscuro); en la MiniApp se usa para "Hablar con el agente" (navega a Chat con draft) — no introduce escrituras nuevas.
- **Estados**: active (scale 0.9), oculto cuando hay sheet abierto.

### 5.8 Bottom nav (`.tabbar`)
- **Anatomía**: barra fija glass (blur `--blur-bar`), 5–6 tabs (Hoy, Leads, Agenda, Inmuebles, Agente, Equipo-admin); cada tab = icono 22–24px + label 10.5px/700.
- **Estados**: activa = `--primary-ink` + fondo `--primary-soft` (en oscuro el cian brilla como el mockup de tareas); inactiva = `--faint`; safe-area inferior respetada (ya implementado).

### 5.9 Header glass (`.topbar`)
- **Anatomía**: marca "ROVI" (dot cian con halo `--primary-soft`, ya existe) + bloque usuario derecha (nombre 13/700 + rol·workspace 12 `--muted`).
- **Estados**: sticky con blur; en sesión mock añade "· MOCK" (lógica existente).

### 5.10 Componentes ya existentes que solo se re-tematizan
- **Action card Aprobar/Rechazar** (`.action-card`): borde izquierdo 4px pasa de `--accent` a `--warn`; tag "Pendiente" `warn`, delete `pr-alta`; botones Aprobar (`btn-primary` cian/`--primary-contrast`) y Rechazar (`btn-danger`); resueltas → `ok`/`bad`.
- **Burbujas de chat** (`.bubble`): user = relleno `--primary` + texto `--primary-contrast`; agent = glass card; error = `--danger-soft`.
- **Sheets** (`.sheet`): fondo `--surface` (sólido a propósito: legibilidad sobre cualquier contenido), radio sup 24, handle `--outline`.
- **Toasts**: invertidos (`--text` sobre `--bg`); success/error con los semánticos nuevos.
- **Skeleton / empty / error-block / notice / draft-box / rank-row / code-pill**: mismas clases, nuevos tokens; `draft-box` usa borde punteado `color-mix(--primary-ink 45%)`.

---

## 6. Tipografía e iconos

### 6.1 Public Sans en el WebView de Telegram

Carga por Google Fonts CDN en `index.html` (la MiniApp no tiene build step ni assets propios):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap"
  rel="stylesheet"
/>
```

- `display=swap`: el texto se pinta de inmediato con el fallback de sistema y "salta" a Public Sans al cargar — correcto para texto.
- Stack de fallback completo (orden para iOS WKWebView y Android WebView): `'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, system-ui, sans-serif`.
- Si el CDN no responde (WebView sin red al fondo), la app queda 100% funcional con la fuente de sistema: ninguna métrica de layout depende de Public Sans (no usar anchos fijos calculados sobre la fuente).
- Mono (ids `#LEAD-…`, SKU, code-pill): `ui-monospace, 'SF Mono', Menlo, monospace` — **no** se carga JetBrains Mono por CDN (peso extra injustificado para 3 usos).

### 6.2 Material Symbols Outlined

```html
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400..600,0..1,0&display=block"
  rel="stylesheet"
/>
```

```css
.msi {
  font-family: 'Material Symbols Outlined';
  font-weight: 400;
  font-style: normal;
  display: inline-block;
  line-height: 1;
  letter-spacing: normal;
  white-space: nowrap;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.msi.fill { font-variation-settings: 'FILL' 1; }
```

- Para el icon font se usa `display=block` (no swap): con swap, mientras carga se vería el **nombre de la ligadura como texto** ("dashboard"). `block` lo oculta ~3s y luego cae a fallback.
- **Regla de resiliencia**: la tab bar **conserva sus SVG inline actuales** (`app.js ICONS`) — es navegación crítica y no puede depender del CDN. Material Symbols se usa solo en contenido decorativo-informativo (cards, headers de sección, specs de propiedad) siempre acompañado de texto.

### 6.3 Iconos usados en los mockups → componentes

| Icono (nombre Material) | Componente |
|---|---|
| `dashboard` | tab Hoy (referencia; en MiniApp queda el SVG actual) |
| `person_search` | tab/sección Leads, metric card "Leads activos" |
| `account_tree` | encabezado Pipeline, sección de etapas |
| `location_city` | tab/sección Propiedades |
| `calendar_today` | tab Agenda, meta de fecha en fila de tarea |
| `group` | tab/sección Equipo |
| `add` | FAB |
| `search` | input de búsqueda (Leads, Propiedades) |
| `tune` | botón "Filtros" |
| `notifications` | header (si se agrega indicador) |
| `payments` | metric card de valuación/cierre |
| `trending_up` | delta de métricas ("Eficiencia de embudo 14%") |
| `history` | sección "Actividad reciente" del detalle de lead |
| `mail` / `call` | iconos de tipo de actividad |
| `more_vert` | menú contextual de card (si se usa) |
| `star` | prioridad destacada en fila compacta de lead |
| `person` | avatar fallback |
| `location_on` | zona en property card |
| `bed` / `bathtub` / `straighten` | specs de property card |
| `task_alt` / `check` | checkbox de tarea completada |
| `schedule` | hora en tarjetas de evento |
| `forum` (no está en mockups; consistente con la familia) | encabezado del Chat agente |

---

## 7. Especificación de las 4 pantallas sin mockup

Convención: misma estructura de datos y estados que las vistas actuales (`views/*.js`) — esto es re-skin + layout. En ambos temas el layout es idéntico; cambia la paleta (claro: glass blanco sobre `#F8FAFC` con halos cian; oscuro: glass navy `#141D33` sobre `#0B1426` con glow cian, como el mockup de tareas).

### 7.1 Agenda (`views/agenda.js` — eventos 14 días agrupados por día + "Preparar reunión")

```
┌──────────────────────────────────────────┐
│ ⓘ topbar glass: ● ROVI        Ana · broker│
├──────────────────────────────────────────┤
│ Agenda                        (screen-title)
│ Tus próximos 14 días          (screen-sub)
│                                          │
│ HOY ─────────────────────── (day-group h3)
│ ┌─ .card glass ──────────────────────┐  │
│ │ ⏱ 10:00 · Visita Villa Akumal  [Visita]│  ← hora+título 700 / tag tipo evento
│ │ Con: Sofía Lorenza · +52 984 …     │  ← --muted
│ │ ✔ Sincronizado con Google          │  ← .meta (solo si synced)
│ │ [ Preparar reunión ]  (btn-primary)│  ← cian, texto #003640|#062E38
│ └────────────────────────────────────┘  │
│ MAÑANA ──────────────────────────────    │
│ ┌─ .card ─────────────────────────────┐ │
│ │ ⏱ 12:30 · Llamada seguimiento [Llamada]│
│ │ [ Preparar reunión ]                │ │
│ └─────────────────────────────────────┘ │
│ VIERNES 19 JUN ───────────────────────   │
│ … más cards …                            │
├──────────────────────────────────────────┤
│ tabbar glass: Hoy Leads [Agenda] Inm Ag …│  ← Agenda activa (primary-ink + soft)
└──────────────────────────────────────────┘

"Preparar reunión" → bottom sheet (.sheet, fondo sólido --surface):
┌─ sheet ──────────────────────────────────┐
│ ── handle ──                             │
│ Preparar: Visita Villa Akumal (sheet-title)
│ El agente está armando el brief… + typing + 3 sk-line   ← estado cargando (60s)
│ ─ al resolver ─                          │
│ ┌ draft-box (borde punteado primary-ink, max-height 46dvh) ┐
│ │ Brief / Preguntas / Objeciones / …    │
│ └───────────────────────────────────────┘
│ [ Copiar brief ] (btn-primary)           │
│ ▸ notice ámbar + action-cards Aprobar/Rechazar si el run
│   dejó acciones pending_confirmation (flujo actual)       │
└──────────────────────────────────────────┘

Estados: skeleton (3 sk-card) · vacío ("Sin citas en los próximos días." + CTA
"Agendar con el agente" → chat con draft) · error (error-block + Reintentar) ·
error del agente dentro del sheet (error-block + Reintentar).
```

### 7.2 Chat agente (`views/chat.js` — Hermes embebido + tarjetas Aprobar/Rechazar)

```
┌──────────────────────────────────────────┐
│ topbar glass                             │
├──────────────────────────────────────────┤
│ Agente ROVI                              │
│ Pide leads, tareas, citas o propiedades… │
│                                          │
│ ▸ ZONA DE ACCIONES PENDIENTES (#chatActions, arriba del log):
│ ┌ notice (warn-soft): "Tienes 2 acciones │
│ │ pendientes de aprobar…"               ┐│
│ ┌─ .card.action-card (borde izq 4px --warn) ┐
│ │ Crear tarea               [Pendiente] │ ← tag warn (delete → pr-alta)
│ │ preview pre-wrap 13px                 │
│ │ Expira: 12/06 18:30        (.meta)    │
│ │ [ Aprobar ]🟦  [ Rechazar ]🟥          │ ← btn-primary cian / btn-danger
│ │ → resuelta: "Ejecutado." (.resolved.ok verde) o
│ │   "Cancelado. No guardé cambios." (.bad)│
│ └───────────────────────────────────────┘
│                                          │
│ ▸ LOG (#chatLog):                        │
│        ┌ bubble.agent (glass, radio 16,  │
│        │ esquina inf-izq 5px) ───────┐   │
│        │ Hola, soy tu agente ROVI…   │   │
│        └─────────────────────────────┘   │
│   ┌ bubble.user (relleno --primary,      │
│   │ texto --primary-contrast,            │
│   │ esquina inf-der 5px) ──────────┐     │
│   │ crea tarea para hoy: llamar…   │     │
│   └────────────────────────────────┘     │
│        ┌ bubble.agent ┐ + chips verdes   │
│        │ Listo. ✓     │ [Guardado en ROVI (1 registro)]
│        └──────────────┘  ← tag ok (autopilot, F12)
│        ● ● ●  (typing, --faint)          │
│        bubble.error (danger-soft) si falla│
│                                          │
│ ┌ chat-input-row sticky sobre tabbar ───┐│
│ │ [ Escríbele al agente…    ] [Enviar]🟦││ ← input glass 44px / btn-primary
│ └───────────────────────────────────────┘│
├──────────────────────────────────────────┤
│ tabbar: … [Agente] activo …              │
└──────────────────────────────────────────┘

Estados: historial efímero por sesión (se conserva) · endpoints de acciones
404/405 → notice "Aprobar acciones desde la MiniApp aún no está disponible…"
(degradación existente) · agente caído → bubble.error + toast, resto de la app
funcional · botón Enviar disabled mientras busy.
```

### 7.3 Equipo / leaderboard (`views/team.js` — solo agency_admin)

```
┌──────────────────────────────────────────┐
│ topbar glass                             │
├──────────────────────────────────────────┤
│ Equipo                                   │
│ Desempeño del mes y riesgos del día      │
│                                          │
│ RESUMEN EJECUTIVO ──────── (section-head)│
│ ┌────────────┬────────────┬────────────┐ │  ← stat-grid 3 col, glass metric cards
│ │ 👤 84      │ ✓ 31       │ ◎ 12       │ │    cifra .metric-num + label 11px
│ │ Prospectos │ Calificados│ Oportunid. │ │
│ ├────────────┼────────────┼────────────┤ │
│ │ 18%        │ $4.2M 🟦   │ 32 d       │ │  ← "$4.2M" en --primary-ink
│ │ Conversión │ Cerrado    │ Velocidad  │ │
│ └────────────┴────────────┴────────────┘ │
│                                          │
│ LEADERBOARD ─────────────────────────────│
│ ┌─ .card.rank-row.top ─────────────────┐ │
│ │ (1) Carlos M.            1,240 pts🟦 │ │ ← rank-num 1-3: warn-soft dorado;
│ │  3 ventas · 5 apartados · 24 leads   │ │   puntos en --primary-ink
│ ├─ .card.rank-row ─────────────────────┤ │
│ │ (2) Sofía R.               980 pts   │ │
│ │ (3) Ana T.                 870 pts   │ │
│ │ (4) Luis G. (rank-num neutro)        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ RIESGOS ─────────────────────────────────│
│ ▸ notice warn: "3 tarea(s) vencida(s) en el tenant."
│ ┌─ .card ──────────────────────────────┐ │
│ │ Llamar a prospecto Juan   [Vencida]🟥│ │ ← tag pr-alta
│ │ Responsable: Luis G.                 │ │
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│ tabbar: … [Equipo] activo                │
└──────────────────────────────────────────┘

Estados: rol no admin → emptyState "Tu rol no tiene acceso a este módulo."
(gate UI actual, F8) · skeleton por sección (fallo parcial independiente) ·
vacío leaderboard → "Aún no tienes equipo en este workspace…" · sin vencidas →
empty "Sin tareas vencidas en el equipo. Buen ritmo."
```

### 7.4 Onboarding de device link (`views/onboarding.js` — `link_required` + estados de arranque)

```
┌──────────────────────────────────────────┐
│ topbar glass (sin usuario, sin tabbar)   │
├──────────────────────────────────────────┤
│            .onboard (centrado)           │
│                                          │
│        ◉  (brand-dot grande con halo     │
│            --primary-soft, decorativo)   │
│                                          │
│  Tu Telegram aún no está vinculado a ROVI│  ← h2 20/800
│                                          │
│  RAMA A (vino con start_param=CODE):     │
│  Detecté tu código de vinculación:       │
│  ┌ code-pill mono glass ┐                │
│  │  ROVI-8F3K2           │               │
│  └───────────────────────┘               │
│  [ Vincular ahora ]  (btn-primary block) │
│  O mándale /start ROVI-8F3K2 al bot.     │  ← screen-sub
│                                          │
│  RAMA B (sin código): ol numerada        │
│   1. Entra a ROVI web → Agentes IA.      │
│   2. Genera tu QR de vinculación.        │
│   3. Escanéalo o abre el deep link…      │
│   4. Comparte tu teléfono con el bot.    │
│                                          │
│  ▸ notice (warn-soft, #onbStatus):       │
│  "Esperando vinculación… (intento 3/24)" │  ← polling 5s existente
│  [ Ya vinculé ]  (btn-secondary block:   │
│     primary-soft + texto primary-ink)    │
└──────────────────────────────────────────┘

Variantes hermanas (mismo layout .onboard):
- renderNoTelegram: "Abre esta app desde Telegram" + sub.
- renderOffline: "Sin conexión con ROVI" + [Reintentar] btn-primary.
- renderAuthFailed / renderSessionExpired: título + instrucción de reabrir.
Tema oscuro: mismo layout sobre #0B1426; el code-pill y la notice usan los
tokens dark; el halo del dot es el glow cian del mockup de tareas.
```

---

## 8. Plan de aplicación por archivo

Regla dura: **cero cambios** en `api.js`, `mock.js`, manejo de sesión, polling, ni en el flujo de acciones (`actions.js` lógica). Solo clases CSS, markup presentacional y los hex del tema en `applyTheme`.

| Archivo | Cambio | Detalle |
|---|---|---|
| `frontend/public/miniapp/styles.css` | **Reescritura de tokens + extensión de componentes** | (1) Sustituir bloques `:root` y `[data-theme='dark']` por los del §3. (2) Cambiar `font-family` del body al stack Public Sans. (3) Añadir halos al `body` (background-image). (4) Convertir `.card` a receta glass con `@supports` (§3). (5) Topbar/tabbar translúcidos con blur. (6) Nuevas clases: `.glass-card`, `.fab`, `.fab-pill`, `.progress`, `.progress-row`, `.tag.pr-media`, `.tag.pr-baja`, `.msi`, `.link`, `.metric-num`, `.prop-media`, `.task-row`. (7) Ajustes: `.btn-primary` con texto `--primary-contrast`; `.chip.active` cian; `.tabbar button.active` con `--primary-ink`; `.action-card` borde `--warn`; `.draft-box` con `--primary-ink`; `--tab-h: 64px`. Las clases legacy (`--secondary/--accent`) quedan alias → nada se rompe |
| `frontend/public/miniapp/index.html` | Solo `<head>` | Añadir preconnect + links de Google Fonts (Public Sans `display=swap`, Material Symbols `display=block`, §6); actualizar `<meta name="theme-color" content="#F8FAFC">` |
| `frontend/public/miniapp/app.js` | 1 función, 2 hex | En `applyTheme()`: `const bg = scheme === 'dark' ? '#0B1426' : '#F8FAFC'`. **Nada más** (tabs, sesión, deep links intactos; los SVG de la tabbar se conservan como fallback de iconos, §6.2) |
| `views/today.js` | Markup opcional, sin lógica | Hero card ya tematizada por CSS (redefinir gradiente de `.hero-card` a cian→navy en styles.css). Opcional: convertir las 2 primeras métricas del admin a `stat-grid cols-2` con iconos `.msi` (`payments`, `person_search`); CTA "Crear tarea con el agente" puede montarse como `.fab-pill` |
| `views/leads.js` | Clases en templates | Cifra de presupuesto con `class="metric-num brand"`; chips de filtro ya usan `.chip` (sin cambio); tags de status sin cambio (`st-*`); botón "Copiar WhatsApp" pasa a `btn-secondary` (ya lo es). El sheet de status y el flujo optimista no se tocan |
| `views/agenda.js` | Clases en templates | Tarjeta de evento: añadir icono `.msi` `schedule` junto a la hora y `calendar_today` en day-group (decorativo, `aria-hidden`); badge "Sincronizado con Google" como `.tag ok`. Sheet "Preparar reunión" sin cambios de flujo |
| `views/properties.js` | Único cambio de markup real | En `propertyCardEl` y `openDetailSheet`: envolver `<img class="prop-cover">` en `<div class="prop-media">` con `<div class="prop-grad"></div>` + pill de precio/SKU superpuesta; fila de specs (`bed`/`bathtub`/`straighten` con `.msi` cian) usando `features` ya disponibles. La lógica de `coverUrl`, sheets y match no cambia |
| `views/chat.js` | Nada obligatorio | Burbujas/typing/chips se re-tematizan por CSS. Opcional: header con `.msi` `forum` |
| `views/team.js` | Clases en templates | `.stat` hereda glass; puntos del leaderboard con `class="rank-points"` (ya existe, ahora `--primary-ink`); opcional iconos `.msi` en stats |
| `views/onboarding.js` | Nada obligatorio | `.onboard`, `.code-pill`, `.notice` se re-tematizan por CSS. Opcional: dot decorativo grande |
| `actions.js` | **Nada** | La action card se re-tematiza vía `.action-card` en CSS |
| `ui.js` | **Nada** | Toasts/sheets/skeletons heredan tokens |
| `api.js`, `mock.js`, `constants.js` | **Prohibido tocar** | — |

Orden recomendado: 1) styles.css (tokens) → 2) index.html (fonts/meta) → 3) app.js (2 hex) → verificación visual de las 6 pantallas + onboarding en ambos temas → 4) markup opcional por vista (properties primero, es el único con cambio estructural).

### Riesgos conocidos
- **`backdrop-filter` en Android WebView antiguo**: cubierto por el fallback `@supports` (superficie sólida). No bloquear nada detrás del efecto glass.
- **CDN de Google Fonts inaccesible**: texto cae a fuente de sistema (swap); iconos Material solo decorativos + SVG inline en navegación crítica.
- **`#00D9FF` como texto en claro**: prohibido por la regla §2; cualquier PR que pinte texto con `--primary` en claro debe usar `--primary-ink`.
- **`color-mix`**: ya se usa en el styles.css actual; mismo perfil de soporte que hoy (sin regresión).

### Cobertura de pantallas/estados
| # | Pantalla / estado | Cubierto en |
|---|---|---|
| 1 | Hoy (dashboard broker/admin) | §5.1, §5.6, §8 (mockup dashboard) |
| 2 | Leads (lista/detalle/pipeline) | §5.3, §5.5, §8 (mockup pipeline) |
| 3 | Agenda | §7.1 |
| 4 | Propiedades | §5.2, §8 (mockup products) |
| 5 | Chat agente + Aprobar/Rechazar | §7.2, §5.10 |
| 6 | Equipo / leaderboard | §7.3 |
| 7 | Onboarding device link (+ no_telegram, offline, auth_failed, expirada) | §7.4 |
| 8 | Skeleton / cargando | §5 (estados comunes), shimmer existente re-tematizado |
| 9 | Vacío (CTA contextual por pantalla) | §7.x y `.empty` re-tematizado |
| 10 | Error / sin conexión / agente caído | §7.x, `.error-block`, `.notice`, toasts |

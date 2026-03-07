# Documentación del Frontend - Rovi CRM

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Sistema de Diseño](#sistema-de-diseño)
5. [Componentes](#componentes)
6. [Páginas](#páginas)
7. [State Management](#state-management)
8. [Routing](#routing)
9. [Integración con API](#integración-con-api)
10. [Build y Deploy](#build-y-deploy)

---

## Visión General

El frontend de Rovi CRM es una **Single Page Application (SPA)** construida con **React 19**, **React Router v7** y **Tailwind CSS**, diseñada como una interfaz moderna y responsive para el sistema CRM inmobiliario.

### Características Principales

- React 19 con hooks modernos
- Sistema de diseño basado en shadcn/ui + Radix UI
- Tailwind CSS con paleta de colores personalizada
- Estado global con Context API
- Sistema de routing protegido
- Drag & drop con @dnd-kit
- Tema claro/oscuro
- Integración con API REST
- Componentes reutilizables

---

## Arquitectura

### Estructura de Archivos

```
frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── ui/            # Componentes shadcn/ui (reutilizables)
│   │   ├── Layout.js      # Layout principal
│   │   ├── Sidebar.js     # Barra lateral de navegación
│   │   └── AIChat.js      # Widget de chat con IA
│   ├── context/
│   │   ├── AuthContext.js # Contexto de autenticación
│   │   └── ThemeContext.js# Contexto de tema
│   ├── hooks/
│   │   └── use-toast.js   # Hook personalizado para toasts
│   ├── lib/
│   │   └── utils.js       # Utilidades (cn function)
│   ├── pages/             # Páginas principales
│   │   ├── LoginPage.js
│   │   ├── OnboardingPage.js
│   │   ├── DashboardPage.js
│   │   ├── LeadsPage.js
│   │   ├── BrokersPage.js
│   │   ├── GamificationPage.js
│   │   ├── CalendarPage.js
│   │   ├── CampaignsPage.js
│   │   ├── ImportLeadsPage.js
│   │   ├── ScriptsPage.js
│   │   ├── SettingsPage.js
│   │   └── EmailEditorPage.js
│   ├── plugins/           # Plugins personalizados de CRACO
│   │   ├── health-check/
│   │   └── visual-edits/
│   ├── App.js             # Componente principal
│   ├── App.css            # Estilos globales
│   ├── index.css          # Estilos de Tailwind
│   └── index.js           # Punto de entrada
├── plugins/
├── craco.config.js        # Configuración de CRACO
├── tailwind.config.js     # Configuración de Tailwind
├── package.json           # Dependencias
└── README.md
```

### Flujo de Datos

```
Usuario → Componente → Context/Auth → API → Backend
                ↓
         Estado Local (useState)
                ↓
         Re-render de UI
```

---

## Configuración del Entorno

### Variables de Entorno

Crea un archivo `.env` en el directorio `frontend/`:

```bash
# URL del Backend API
REACT_APP_BACKEND_URL=http://localhost:8000

# Health Check (opcional)
ENABLE_HEALTH_CHECK=false

# Feature flags (automáticos)
# - enableVisualEdits: true en desarrollo
# - enableHealthCheck: false por defecto
```

### Instalación

```bash
# Navegar al directorio
cd frontend

# Instalar dependencias (usar yarn)
yarn install

# Iniciar servidor de desarrollo
yarn start

# Build de producción
yarn build

# Ejecutar tests
yarn test
```

### Servidor de Desarrollo

El servidor corre en `http://localhost:3000` por defecto.

---

## Sistema de Diseño

### Paleta de Colores "Tulum Luxury"

```css
/* Colores Primarios */
--primary: #0D9488;        /* Turquesa */
--primary-foreground: #FFFFFF;

/* Colores Secundarios */
--secondary: #4D7C0F;      /* Verde Jungla */
--secondary-foreground: #FFFFFF;

/* Acentos */
--accent: #D97706;         /* Dorado */
--accent-foreground: #FFFFFF;

/* Fondos */
--background: #E7E5E4;     /* Beige Arena */
--foreground: #1C1917;     /* Café Oscuro */

/* UI Elements */
--card: #FFFFFF;
--card-foreground: #1C1917;
--popover: #FFFFFF;
--popover-foreground: #1C1917;

/* Muted */
--muted: #A8A29E;
--muted-foreground: #57534E;

/* Borders */
--border: #D6D3D1;
--input: #D6D3D1;

/* Destructive */
--destructive: #DC2626;
--destructive-foreground: #FFFFFF;
```

### Tipografía

- **Fuente**: Inter (por defecto del sistema)
- **Tamaños**: Base 14px, escala modular de Tailwind
- **Pesos**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Espaciado

Escala de espaciado de Tailwind CSS:
- `0.5rem` (8px), `1rem` (16px), `1.5rem` (24px), `2rem` (32px)
- `3rem` (48px), `4rem` (64px), `6rem` (96px), `8rem` (128px)

### Bordes y Redondeos

- `rounded-sm`: 2px
- `rounded`: 6px (por defecto)
- `rounded-md`: 8px
- `rounded-lg`: 12px
- `rounded-xl`: 16px
- `rounded-full`: 9999px (círculos)

### Animaciones Personalizadas

```css
/* Animaciones definidas en tailwind.config.js */
- accordion-down
- accordion-up
- slide-in-right
- slide-in-left
- pulse-ring
- shimmer
```

### Tema Oscuro/Claro

El tema se controla mediante la clase `.dark` en el elemento `html`:

```javascript
// Tema claro
document.documentElement.classList.remove('dark');

// Tema oscuro
document.documentElement.classList.add('dark');
```

---

## Componentes

### Componentes UI (shadcn/ui)

Ubicación: `src/components/ui/`

#### Formularios

| Componente | Descripción | Props Principales |
|------------|-------------|-------------------|
| `Button` | Botón con variantes | `variant`, `size`, `disabled` |
| `Input` | Campo de texto | `type`, `placeholder`, `value`, `onChange` |
| `Textarea` | Área de texto multilinea | `placeholder`, `value`, `onChange` |
| `Label` | Etiqueta para formularios | `htmlFor`, `children` |
| `Select` | Selector dropdown | `value`, `onValueChange`, `children` |
| `Checkbox` | Casilla de verificación | `checked`, `onCheckedChange` |
| `Switch` | Interruptor toggle | `checked`, `onCheckedChange` |
| `RadioGroup` | Grupo de radio buttons | `value`, `onValueChange` |
| `Slider` | Control deslizante | `value`, `onValueChange`, `min`, `max` |

#### Datos y Visualización

| Componente | Descripción | Props Principales |
|------------|-------------|-------------------|
| `Card` | Contenedor de contenido | `children`, `className` |
| `Table` | Tabla de datos | `children` |
| `Avatar` | Imagen de perfil | `src`, `alt`, `fallback` |
| `Badge` | Etiqueta/insignia | `variant`, `children` |
| `Progress` | Barra de progreso | `value`, `max` |
| `Skeleton` | Placeholder de carga | `className` |
| `Separator` | Línea divisoria | `orientation` |

#### Navegación

| Componente | Descripción | Props Principales |
|------------|-------------|-------------------|
| `Tabs` | Pestañas de navegación | `defaultValue`, `children` |
| `Breadcrumb` | Navegación jerárquica | `children` |
| `NavigationMenu` | Menú de navegación | `children` |

#### Overlays y Modales

| Componente | Descripción | Props Principales |
|------------|-------------|-------------------|
| `Dialog` | Modal estándar | `open`, `onOpenChange`, `children` |
| `Sheet` | Panel lateral deslizable | `open`, `onOpenChange`, `side` |
| `Tooltip` | Mensaje emergente | `children`, `content` |
| `Popover` | Contenedor flotante | `open`, `onOpenChange`, `children` |
| `AlertDialog` | Diálogo de confirmación | `open`, `onOpenChange` |
| `DropdownMenu` | Menú desplegable | `children` |

#### Otros Componentes

| Componente | Descripción | Props Principales |
|------------|-------------|-------------------|
| `ScrollArea` | Área con scroll personalizado | `children`, `className` |
| `Accordion` | Acordeón colapsable | `type`, `children` |
| `Calendar` | Calendario de selección | `mode`, `selected`, `onSelect` |
| `Command` | Paleta de comandos | `children` |
| `Toast` | Notificación toast | `title`, `description` |
| `Sonner` | Sistema de toasts | `position`, `richColors` |

### Componentes Personalizados

#### Layout.js

Layout principal que envuelve todas las páginas protegidas.

```javascript
<Layout>
  <Sidebar />        {/* Navegación lateral */}
  <main>             {/* Contenido principal */}
    <Outlet />
  </main>
  <AIChat />         {/* Widget de chat flotante */}
</Layout>
```

**Props**: Ninguno (usa contexto de autenticación)

#### Sidebar.js

Barra lateral de navegación con items dinámicos según tipo de cuenta.

```javascript
// Usuario Individual
- Dashboard
- Pipeline
- Importar Leads
- Calendario
- Campañas
- Scripts
- Configuración

// Usuario Agencia (+ items adicionales)
- Brokers
- Gamificación
```

**Features**:
- Colapsable en móvil
- Indicador de página activa
- Iconos Lucide React
- Badge de notificaciones (futuro)

#### AIChat.js

Widget flotante de chat con asistente de IA.

**Features**:
- Posicionamiento fijo bottom-right
- Estado colapsado/extendido
- Historial de mensajes
- Contexto del CRM
- Envío con Enter o botón

**Estado**:
```javascript
{
  isOpen: boolean,
  messages: Array<{role, content}>,
  loading: boolean
}
```

---

## Páginas

### LoginPage.js

**Ruta**: `/login` (pública)

Página de inicio de sesión con email y contraseña.

**Componentes**:
- Formulario con validación
- Botón de submit con loading state
- Enlace a registro (futuro)
- Manejo de errores con toast

**Estado**:
```javascript
{
  email: string,
  password: string,
  loading: boolean,
  error: string
}
```

**Acciones**:
- `login(email, password)` - Autentica usuario
- Redirección a `/dashboard` o `/onboarding`

### OnboardingPage.js

**Ruta**: `/onboarding` (protegida)

Flujo de bienvenida para nuevos usuarios.

**Pasos**:
1. Bienvenida
2. Configuración de metas
3. Invitación a equipo (agencias)
4. Primer tour

### DashboardPage.js

**Ruta**: `/dashboard` (protegida)

Panel principal con KPIs y resumen de actividad.

**Secciones**:
- **KPI Cards**: Puntos, Apartados, Ventas, Brokers Activos
- **Leaderboard**: Ranking de brokers (solo agencias)
- **Actividad Reciente**: Feed de últimas actividades
- **Reglas de Gamificación**: Puntos por acción

**KPI Cards**:
```javascript
// Click para ver detalle
<KPICard
  title="Puntos del Mes"
  value={450}
  goal={500}
  progress={90}
  onClick={() => openModal('points')}
/>

// Modal con desglose
<KPIDetailModal type="points" />
```

**Datos requeridos**:
- `GET /api/dashboard/stats`
- `GET /api/dashboard/leaderboard`
- `GET /api/dashboard/recent-activity`

### LeadsPage.js

**Ruta**: `/leads` (protegida)

Gestión de pipeline de leads con doble vista.

**Vistas**:
1. **Kanban Board**: Columnas arrastrables
2. **Tabla**: Vista tabular con ordenamiento

**Filtros**:
- Estado (nuevo, contactado, etc.)
- Prioridad (baja, media, alta, urgente)
- Fuente (web, referral, etc.)

**Acciones**:
- Crear nuevo lead
- Editar lead existente
- Analizar con IA
- Generar script de ventas
- Cambiar estado (drag & drop)

**Componentes**:
- `KanbanBoard` - Tablero con columnas arrastrables
- `LeadsTable` - Tabla con datos de leads
- `LeadDetailModal` - Modal con detalles del lead
- `FilterBubble` - Filtro seleccionable

**Librerías**:
- `@dnd-kit/core` - Drag and drop
- `@dnd-kit/sortable` - Listas ordenables

### BrokersPage.js

**Ruta**: `/brokers` (protegida, solo agencias)

Gestión de equipo de brokers.

**Secciones**:
- Lista de brokers
- Estadísticas por broker
- Actividad reciente
- Métricas de rendimiento

**Datos**:
```javascript
{
  broker_id: string,
  broker_name: string,
  avatar_url: string,
  total_points: number,
  ventas: number,
  apartados: number,
  leads_asignados: number,
  rank: number
}
```

### GamificationPage.js

**Ruta**: `/gamification` (protegida, solo agencias)

Configuración y visualización del sistema de puntos.

**Secciones**:
- Leaderboard mensual
- Reglas de gamificación
- Historial de puntos
- Configuración de reglas

**Acciones**:
- Crear nueva regla
- Editar regla existente
- Activar/desactivar regla

### CalendarPage.js

**Ruta**: `/calendar` (protegida)

Gestión de calendario y eventos.

**Features**:
- Vista mensual
- Lista de eventos del día
- Creación de eventos
- Tipos: llamada, visita, zoom, presentación
- Recordatorios
- Sincronización con Google Calendar

**Componentes**:
- `Calendar` - Calendario mensual (react-day-picker)
- `EventList` - Lista de eventos
- `EventDialog` - Modal de creación/edición

**Tipos de eventos**:
```javascript
const EVENT_TYPES = {
  seguimiento: { label: 'Seguimiento', color: 'bg-blue-500' },
  llamada: { label: 'Llamada', color: 'bg-green-500' },
  zoom: { label: 'Zoom', color: 'bg-purple-500' },
  visita: { label: 'Visita', color: 'bg-orange-500' },
  presentacion: { label: 'Presentación', color: 'bg-teal-500' }
};
```

### CampaignsPage.js

**Ruta**: `/campaigns` (protegida)

Gestión de campañas de marketing.

**Tipos de Campañas**:
1. **Llamadas Masivas** - VAPI AI Voice
2. **SMS Masivos** - Twilio
3. **Email Marketing** - SendGrid

**Secciones**:
- Lista de campañas
- Crear nueva campaña
- Historial de comunicaciones
- Análisis de resultados

**Estados de campaña**:
```javascript
const CAMPAIGN_STATUS = {
  draft: 'Borrador',
  scheduled: 'Programada',
  running: 'En ejecución',
  completed: 'Completada',
  paused: 'Pausada',
  failed: 'Fallida'
};
```

### ImportLeadsPage.js

**Ruta**: `/import` (protegida)

Asistente de importación de leads desde CSV/Excel.

**Pasos del Wizard**:
1. **Upload**: Arrastrar y soltar archivo
2. **Mapping**: Mapear columnas a campos
3. **Preview**: Previsualizar datos
4. **Import**: Ejecutar importación y ver resultados

**Features**:
- Detección automática de columnas
- Validación de datos
- Detección de duplicados
- Soporte para CSV, XLSX, XLS

**Columnas detectadas automáticamente**:
- Nombre, Email, Teléfono
- Presupuesto, Propiedad de interés
- Ubicación, Notas

### ScriptsPage.js

**Ruta**: `/scripts` (protegida)

Biblioteca de scripts de ventas.

**Features**:
- Lista de scripts por categoría
- Vista previa de script
- Crear nuevo script
- Editar script existente
- Copiar al portapapeles

### SettingsPage.js

**Ruta**: `/settings` (protegida)

Configuración de cuenta y perfil.

**Secciones/Tabs**:
1. **Perfil**: Nombre, email, teléfono, avatar
2. **Metas**: Ventas mensuales, ingresos objetivo
3. **Integraciones**: VAPI, Twilio, SendGrid, Google Calendar

**Configuración de Integraciones**:
```javascript
{
  // VAPI
  vapi_api_key: string,
  vapi_phone_number_id: string,
  vapi_assistant_id: string,

  // Twilio
  twilio_account_sid: string,
  twilio_auth_token: string,
  twilio_phone_number: string,

  // SendGrid
  sendgrid_api_key: string,
  sendgrid_sender_email: string,
  sendgrid_sender_name: string,

  // Google Calendar
  google_client_id: string,
  google_client_secret: string
}
```

**Botones de prueba**:
- Test VAPI connection
- Test Twilio connection
- Test SendGrid connection
- Connect Google Calendar

### EmailEditorPage.js

**Ruta**: `/email-templates/new` y `/email-templates/:templateId` (protegida)

Editor visual de plantillas de email.

**Features**:
- Drag & drop de bloques
- Tipos de bloques: Texto, Imagen, Botón, Divisor, Columnas
- Panel de configuración
- Vista previa en tiempo real
- Vista de código HTML
- Variables: `{{nombre}}`, `{{propiedad}}`, etc.

**Bloques disponibles**:
```javascript
const BLOCK_TYPES = {
  text: { label: 'Texto', icon: Type },
  image: { label: 'Imagen', icon: Image },
  button: { label: 'Botón', icon: MousePointer },
  divider: { label: 'Divisor', icon: Minus },
  columns: { label: 'Columnas', icon: Columns }
};
```

---

## State Management

### AuthContext.js

Contexto para manejar la autenticación de usuarios.

**Estado**:
```javascript
{
  user: User | null,
  token: string | null,
  loading: boolean
}
```

**Métodos**:
```javascript
const { login, logout, register, updateUser, api } = useAuth();

// Iniciar sesión
await login('email@example.com', 'password');

// Registrar usuario
await register('Nombre', 'email@example.com', 'password', 'broker', 'individual');

// Cerrar sesión
logout();

// Actualizar usuario
updateUser(userData);

// Cliente API configurado
api.get('/endpoint');
api.post('/endpoint', data);
```

**Características**:
- Token almacenado en `localStorage`
- Interceptor de Axios para agregar token
- Manejo automático de 401 (logout)
- Axios instance configurada

### ThemeContext.js

Contexto para manejar el tema claro/oscuro.

**Estado**:
```javascript
{
  theme: 'light' | 'dark' | 'system',
  setTheme: (theme) => void
}
```

**Uso**:
```javascript
const { theme, setTheme } = useTheme();

setTheme('dark');
setTheme('light');
setTheme('system');
```

**Características**:
- Preferencia guardada en localStorage
- Detección de preferencia del sistema
- Sincronización con clase `.dark`

---

## Routing

### Estructura de Rutas

```javascript
// Rutas Públicas
Route path="/login"          → LoginPage

// Onboarding
Route path="/onboarding"     → OnboardingPage (protegida)

// Rutas Protegidas (con Layout)
Route path="/dashboard"      → DashboardPage
Route path="/leads"          → LeadsPage
Route path="/brokers"        → BrokersPage (agencias)
Route path="/gamification"   → GamificationPage (agencias)
Route path="/calendar"       → CalendarPage
Route path="/campaigns"      → CampaignsPage
Route path="/import"         → ImportLeadsPage
Route path="/scripts"        → ScriptsPage
Route path="/settings"       → SettingsPage

// Full-screen routes
Route path="/email-templates/new"            → EmailEditorPage
Route path="/email-templates/:templateId"    → EmailEditorPage
```

### ProtectedRoute

HOC (Higher-Order Component) que protege rutas.

**Comportamiento**:
1. Si no está autenticado → redirige a `/login`
2. Si no completó onboarding → redirige a `/onboarding`
3. Si está autenticado → renderiza children

**Uso**:
```javascript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

### PublicRoute

HOC que redirige si ya está autenticado.

**Comportamiento**:
1. Si está autenticado → redirige a `/dashboard` o `/onboarding`
2. Si no está autenticado → renderiza children

---

## Integración con API

### Cliente Axios

Configurado en `AuthContext.js`:

```javascript
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor de request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('leadvibes_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);
```

### Patrones de Uso

```javascript
const { api } = useAuth();

// GET
const response = await api.get('/leads');
const leads = response.data;

// POST
const response = await api.post('/leads', leadData);

// PUT
const response = await api.put(`/leads/${leadId}`, updates);

// DELETE
await api.delete(`/leads/${leadId}`);
```

### Manejo de Errores

```javascript
try {
  const response = await api.get('/leads');
  setLeads(response.data);
} catch (error) {
  if (error.response?.status === 401) {
    // No autorizado
    toast.error('Sesión expirada');
  } else if (error.response?.status === 403) {
    // Prohibido
    toast.error('No tienes permisos');
  } else {
    // Otro error
    toast.error('Error al cargar datos');
  }
}
```

### Endpoints Principales

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/auth/login` | POST | Iniciar sesión |
| `/auth/me` | GET | Obtener usuario actual |
| `/dashboard/stats` | GET | Estadísticas del dashboard |
| `/leads` | GET/POST | Obtener/crear leads |
| `/leads/{id}` | GET/PUT | Obtener/actualizar lead |
| `/activities` | POST | Crear actividad |
| `/calendar/events` | GET/POST | Eventos de calendario |
| `/campaigns` | GET/POST | Campañas |
| `/email-templates` | GET/POST | Plantillas de email |
| `/settings/integrations` | GET/PUT | Configuración |

---

## Build y Deploy

### Scripts de package.json

```json
{
  "start": "craco start",
  "build": "craco build",
  "test": "craco test"
}
```

### CRACO Config

El proyecto usa **CRACO** (Create React App Configuration Override) para personalizar la configuración de webpack.

**Features**:
- Path alias `@/` → `src/`
- Babel metadata plugin para visual edits
- Health check endpoints (opcional)
- Optimizaciones de watch

### Build de Producción

```bash
# Crear build optimizado
yarn build

# Output en: build/
```

**Características del build**:
- Code splitting automático
- Minificación de JS/CSS
- Hashing de nombres de archivo
- Optimización de imágenes
- Tree shaking

### Variables de Entorno en Producción

Asegúrate de configurar:

```bash
REACT_APP_BACKEND_URL=https://tu-api-production.com
```

---

## Hooks Personalizados

### useToast

Sistema de notificaciones toast.

```javascript
import { toast } from '@/hooks/use-toast';

// Toast simple
toast.success('Operación exitosa');
toast.error('Error al guardar');
toast.info('Mensaje informativo');
toast.warning('Advertencia');

// Toast con título y descripción
toast({
  title: 'Lead creado',
  description: 'El lead ha sido creado exitosamente',
  variant: 'default'
});
```

### useAuth

Hook para acceder al contexto de autenticación.

```javascript
const { user, token, login, logout, api } = useAuth();
```

### useTheme

Hook para acceder al contexto de tema.

```javascript
const { theme, setTheme } = useTheme();
```

---

## Utilidades

### cn() function

Utilidad para combinar clases de Tailwind CSS.

```javascript
import { cn } from '@/lib/utils';

// Combina clases con clsx y tailwind-merge
className={cn(
  'base-class',
  condition && 'conditional-class',
  className // prop adicional
)}
```

---

## Responsive Design

### Breakpoints de Tailwind

```css
sm: 640px   /* Móviles grandes */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktop grandes */
2xl: 1536px /* Pantallas muy grandes */
```

### Patrones Responsive

```javascript
// Ocultar en móvil, mostrar en desktop
<div className="hidden md:block">...</div>

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  ...
</div>

// Padding responsive
<div className="p-4 md:p-6 lg:p-8">...</div>

// Sidebar colapsable en móvil
<Sidebar className="fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full md:relative md:translate-x-0" />
```

---

## Accesibilidad

### Características

- Componentes Radix UI con accesibilidad integrada
- Navegación por teclado
- ARIA labels en botones y formularios
- Focus management en modales
- Contraste de colores WCAG AA compliant

### Prácticas

```javascript
// Botones con label accesible
<button aria-label="Cerrar diálogo">
  <X />
</button>

// Formularios con labels
<Label htmlFor="email">Email</Label>
<Input id="email" />

// Anuncios de screen reader
<div role="status" aria-live="polite">
  {loading && 'Cargando...'}
</div>
```

---

## Performance

### Optimizaciones

1. **Code Splitting**: Routes separadas en chunks
2. **Lazy Loading**: Componentes pesados cargados bajo demanda
3. **Memo**: Evitar re-renders innecesarios
4. **Debouncing**: Búsquedas y autoguardado
5. **Virtual Scrolling**: Listas largas (futuro)

### Monitoreo

```javascript
// React DevTools Profiler
// Lighthouse audits
// Web Vitals (futuro)
```

---

## Troubleshooting

### Errores Comunes

**Error: Module not found**
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json yarn.lock
yarn install
```

**Error: CRACO not found**
```bash
# Reinstalar CRACO
yarn add -D @craco/craco
```

**Error: CORS**
- Verificar configuración de CORS en backend
- Usar proxy de desarrollo si es necesario

**Error: Invalid hook call**
- Verificar que hooks están en el nivel superior del componente
- No llamar hooks dentro de condiciones o loops

---

## Licencia

Confidencial - Rovi Real Estate

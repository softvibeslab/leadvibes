# 🎨 Guía de Identidad de Marca - Rovi CRM

**Versión:** 1.0
**Fecha:** Abril 2026
**Estado:** Oficial - Implementación Activa

---

## 📋 Índice

1. [Brief de Branding](#brief-de-branding)
2. [Paleta Principal - Rovi AI Tech Palette](#paleta-principal---rovi-ai-tech-palette)
3. [Sistema de Gradientes](#sistema-de-gradientes)
4. [Tipografía](#tipografía)
5. [Aplicación en UI](#aplicación-en-ui)
6. [Dark Mode](#dark-mode)
7. [Paletas Alternativas](#paletas-alternativas)
8. [Ejemplos de Código](#ejemplos-de-código)
9. [Guía de Uso por Componente](#guía-de-uso-por-componente)
10. [Assets y Recursos](#assets-y-recursos)

---

## 🎯 Brief de Branding

### **Posicionamiento**

**Rovi** es un CRM con IA extremadamente avanzada que automatiza la generación de leads de alta calidad desde Instagram. Su identidad visual debe transmitir:

- ✅ **Confianza y profesionalismo** del sector inmobiliario
- ✅ **Innovación y futurismo** de una IA muy avanzada
- ✅ **Eficiencia, velocidad y automatización**
- ✅ **Sensación premium, sofisticada y moderna**
- ✅ **Aspecto tecnológico y aspiracional** (nivel Follow Up Boss + OpenAI + Figma)

### **Público Objetivo**

- Brokers, agentes inmobiliarios y agencias modernas
- Perfiles que valoran la tecnología, la eficiencia y la sofisticación
- Enfoque en perfiles de 1,000-10,000 seguidores del sector real estate
- Búsqueda de ventaja competitiva mediante IA de vanguardia

### **Dirección Estratégica 2026**

**De:** "Eco-luxury Tulum" → **A:** "AI-powered Real Estate Tech"
**De:** Naturaleza y tierra → **A:** Futuro digital y automatización inteligente
**De:** Calidez orgánica → **A:** Sofisticación tecnológica con personalidad
**Inspiración:** OpenAI (futurismo), Figma (modernidad limpia), Linear (tech premium), Follow Up Boss (confianza inmobiliaria)

---

## 🎨 Paleta Principal - Rovi AI Tech Palette

### **Colores Primarios**

#### **Primary: Deep Velocity Blue**
```css
/* Nombre */ Deep Velocity Blue
/* HEX */ #0A4DAF
/* RGB */ rgb(10, 77, 175)
/* HSL */ hsl(217, 89%, 36%)
/* Uso */ Botones principales, links, branding, headers
```

**Descripción:** Azul profundo que inspira confianza inmobiliaria + tecnología avanzada. Más saturado y vibrante que los azules corporativos aburridos.

**Psicología:** Estabilidad, profesionalismo, innovación. Similar a Google, IBM, Facebook pero más distintivo.

---

#### **Primary Dark: Midnight Forge**
```css
/* Nombre */ Midnight Forge
/* HEX */ #062B5F
/* RGB */ rgb(6, 43, 95)
/* HSL */ hsl(217, 89%, 20%)
/* Uso */ Headers, sidebar, estados hover primarios, fondos oscuros
```

**Descripción:** Versión más oscura del primary. Perfecta para fondos que necesitan profundidad sin ser negro puro.

---

#### **Accent: Electric Cyan**
```css
/* Nombre */ Electric Cyan ⚡
/* HEX */ #00D9FF
/* RGB */ rgb(0, 217, 255)
/* HSL */ hsl(187, 100%, 50%)
/* Uso */ CTAs, notificaciones, AI indicators, estados activos, highlights
```

**Descripción:** **EL VERDADERO PROTAGONISTA** - Color que grita "IA del futuro". Solo para elementos que quieren destacar.

**Uso estratégico:**
- Botones CTA principales
- Badges "Powered by AI"
- Indicadores de estados activos
- Notificaciones y alerts
- Hover effects
- AI processing indicators

---

### **Colores Secundarios**

#### **Secondary: Neural Violet**
```css
/* Nombre */ Neural Violet 🟣
/* HEX */ #7C3AED
/* RGB */ rgb(124, 58, 237)
/* HSL */ hsl(262, 75%, 50%)
/* Uso */ Badges de IA, features avanzadas, gradientes, elementos ML
```

**Descripción:** Color de IA, machine learning y futurismo. Usar en combinación con cyan para crear gradientes tecnológicos.

---

### **Neutros**

#### **Neutral Dark: Obsidian Base**
```css
/* Nombre */ Obsidian Base ⚫
/* HEX */ #0F172A
/* RGB */ rgb(15, 23, 42)
/* HSL */ hsl(222, 47%, 11%)
/* Uso */ Background dark mode, cards profundos, surface elevada
```

**Descripción:** Negro azulado más elegante y sofisticado que negro puro. Inspirado en Apple, Tesla.

---

#### **Neutral Light: Arctic Surface**
```css
/* Nombre */ Arctic Surface ⬜
/* HEX */ #F8FAFC
/* RGB */ rgb(248, 250, 252)
/* HSL */ hsl(210, 40%, 98%)
/* Uso */ Background light mode, cards, surface elevada
```

**Descripción:** Blanco azulado limpio, clínico y moderno. Aspiracional y tech-forward.

---

### **Colores Funcionales**

#### **Success: Growth Mint**
```css
/* Nombre */ Growth Mint ✅
/* HEX */ #10B981
/* RGB */ rgb(16, 185, 129)
/* HSL */ hsl(160, 84%, 39%)
/* Uso */ Estados positivos, conversión, éxito, growth metrics
```

---

#### **Warning: Solar Amber**
```css
/* Nombre */ Solar Amber ⚠️
/* HEX */ #F59E0B
/* RGB */ rgb(245, 158, 11)
/* HSL */ hsl(38, 92%, 50%)
/* Uso */ Alertas, estados intermedios, warning, atención requerida
```

---

#### **Error: Crimson Edge**
```css
/* Nombre */ Crimson Edge ❌
/* HEX */ #EF4444
/* RGB */ rgb(239, 68, 68)
/* HSL */ hsl(0, 84%, 60%)
/* Uso */ Errores, destructive, estados críticos, alertas rojas
```

---

### **Colores de Texto**

#### **Text Primary: Charcoal Ink**
```css
/* Nombre */ Charcoal Ink
/* HEX */ #1E293B
/* RGB */ rgb(30, 41, 59)
/* HSL */ hsl(215, 25%, 27%)
/* Uso */ Texto principal en light mode
```

---

#### **Text Secondary: Slate Gray**
```css
/* Nombre */ Slate Gray
/* HEX */ #64748B
/* RGB */ rgb(100, 116, 139)
/* HSL */ hsl(215, 20%, 65%)
/* Uso */ Texto secundario, labels, descripciones, metadata
```

---

## 🌈 Sistema de Gradientes

### **Gradientes Principales**

#### **Gradient: Velocity** (Hero, Landing Pages)
```css
gradient-velocity: linear-gradient(135deg, #0F172A 0%, #062B5F 40%, #0A4DAF 100%);
/* Uso */ Hero sections, backgrounds principales, landing pages
```

---

#### **Gradient: Neural** (AI Features, Advanced)
```css
gradient-neural: linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%);
/* Uso */ Features de IA, badges "Powered by AI", elementos avanzados
```

---

#### **Gradient: Primary** (Botones, CTAs)
```css
gradient-primary: linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%);
/* Uso */ Botones primarios, cards importantes, headers
```

---

#### **Gradient: Growth** (Success, Metrics)
```css
gradient-growth: linear-gradient(135deg, #10B981 0%, #059669 100%);
/* Uso */ Success states, métricas positivas, growth indicators
```

---

### **Gradientes de Texto**

#### **Text Gradient: Velocity**
```css
.text-gradient-velocity {
  background-image: linear-gradient(135deg, #0A4DAF 0%, #00D9FF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
/* Uso */ Headings importantes, branding, hero text
```

---

#### **Text Gradient: Neural**
```css
.text-gradient-neural {
  background-image: linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
/* Uso */ Features de IA, elementos tecnológicos, badges
```

---

## 🔤 Tipografía

### **Font Families**

#### **Primary Font: Outfit**
```css
font-family: 'Outfit', sans-serif;
/* Uso */ Headings (h1-h6), titulos, elementos destacados
/* Weight */ 300, 400, 500, 600, 700, 800
/* Características */ Moderna, geométrica, tech-forward
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

---

#### **Secondary Font: Plus Jakarta Sans**
```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
/* Uso */ Body text, párrafos, UI elements
/* Weight */ 300, 400, 500, 600, 700
/* Características */ Legible, moderna, profesional
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

### **Tipografía Scale**

```css
/* Display */
text-display: font-size: 4.5rem; line-height: 1.1; font-weight: 700; letter-spacing: -0.025em;

/* H1 */
text-h1: font-size: 3rem; line-height: 1.2; font-weight: 700; letter-spacing: -0.025em;

/* H2 */
text-h2: font-size: 2.25rem; line-height: 1.3; font-weight: 600; letter-spacing: -0.025em;

/* H3 */
text-h3: font-size: 1.875rem; line-height: 1.4; font-weight: 600; letter-spacing: -0.015em;

/* H4 */
text-h4: font-size: 1.5rem; line-height: 1.5; font-weight: 600;

/* Body Large */
text-lg: font-size: 1.125rem; line-height: 1.7; font-weight: 400;

/* Body */
text-base: font-size: 1rem; line-height: 1.6; font-weight: 400;

/* Body Small */
text-sm: font-size: 0.875rem; line-height: 1.5; font-weight: 400;

/* Caption */
text-caption: font-size: 0.75rem; line-height: 1.4; font-weight: 500;
```

---

## 🖥️ Aplicación en UI

### **Botones**

#### **Primary Button**
```css
.btn-primary {
  background: linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(10, 77, 175, 0.4);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0D5FD4 0%, #08367A 100%);
  box-shadow: 0 12px 32px rgba(10, 77, 175, 0.5);
  transform: translateY(-2px);
}
```

---

#### **Accent CTA Button**
```css
.btn-accent {
  background: #00D9FF;
  color: #0F172A;
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 217, 255, 0.5);
}

.btn-accent:hover {
  background: #33E1FF;
  box-shadow: 0 12px 32px rgba(0, 217, 255, 0.7);
  transform: translateY(-2px);
}
```

---

### **Cards & Panels**

#### **Light Mode Card**
```css
.card-light {
  background: #F8FAFC;
  border: 1px solid rgba(10, 77, 175, 0.1);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.card-light:hover {
  border-color: rgba(10, 77, 175, 0.3);
  box-shadow: 0 8px 30px rgba(10, 77, 175, 0.15);
}
```

---

#### **Dark Mode Card**
```css
.card-dark {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 217, 255, 0.15);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card-dark:hover {
  border-color: rgba(0, 217, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 217, 255, 0.2);
}
```

---

### **Efectos Glow**

#### **Primary Glow**
```css
.glow-primary {
  box-shadow: 0 0 20px rgba(10, 77, 175, 0.4);
}

.glow-primary-strong {
  box-shadow: 0 0 40px rgba(10, 77, 175, 0.6);
}
```

---

#### **Accent Glow**
```css
.glow-accent {
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
}

.glow-accent-strong {
  box-shadow: 0 0 40px rgba(0, 217, 255, 0.7);
}
```

---

#### **Violet Glow**
```css
.glow-violet {
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.4);
}
```

---

### **Estados de Scraping (Instagram)**

#### **Scanning State**
```css
.state-scanning {
  border: 2px solid #00D9FF;
  animation: pulse-cyan 1.5s infinite;
}

.state-scanning::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: linear-gradient(45deg, #00D9FF, #7C3AED);
  opacity: 0.5;
  filter: blur(8px);
  animation: spin 3s linear infinite;
}

@keyframes pulse-cyan {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

#### **Found Leads**
```css
.state-found {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%);
  border: 1px solid #10B981;
}
```

---

#### **AI Processing**
```css
.state-processing {
  background: linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

### **Gráficos de IA y Analytics**

#### **Main Chart Line**
```css
.chart-line {
  stroke: url(#gradient-neural);
  stroke-width: 3;
  fill: none;
}

/* SVG Gradient Definition */
<defs>
  <linearGradient id="gradient-neural" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#00D9FF;stop-opacity:1" />
  </linearGradient>
</defs>
```

---

#### **Confidence Score Ring**
```css
.score-ring {
  stroke: #7C3AED;
  stroke-width: 8;
  fill: rgba(124, 58, 237, 0.1);
  stroke-linecap: round;
}

.score-ring.high {
  stroke: #00D9FF;
  fill: rgba(0, 217, 255, 0.1);
}
```

---

#### **Lead Score Badges**
```css
.score-excellent { background: #00D9FF; color: #0F172A; } /* 80-100 */
.score-good { background: #0A4DAF; color: white; } /* 60-79 */
.score-average { background: #7C3AED; color: white; } /* 40-59 */
.score-low { background: #F59E0B; color: #0F172A; } /* <40 */
```

---

## 🌙 Dark Mode

### **Backgrounds**
```css
/* Primary Background */
--background: 222 47% 11%; /* #0F172A Obsidian Base */

/* Surface / Cards */
--surface: 217 20% 17%; /* #1E293B Deep Slate */

/* Surface Elevated */
--surface-elevated: 217 25% 22%; /* #334155 Light Slate */
```

---

### **Primary Colors (Mismo HEX, diferente perceived brightness)**
```css
--primary: 217 89% 36%; /* #0A4DAF */
--primary-dark: 217 89% 20%; /* #062B5F */
--accent: 187 100% 50%; /* #00D9FF */
--secondary: 262 75% 50%; /* #7C3AED */
```

---

### **Text Colors**
```css
--text-primary: 210 40% 98%; /* #F8FAFC Arctic Surface */
--text-secondary: 215 20% 65%; /* #64748B Slate Gray */
```

---

### **Borders**
```css
--border: 217 20% 25%; /* rgba(10, 77, 175, 0.2) */
--border-accent: 187 100% 50% rgba(0, 217, 255, 0.2);
```

---

### **Dark Mode Adjustments**
- Cards usan `backdrop-filter: blur(12px)` + bordes semi-transparentes
- Texto usa slightly higher contrast para legibilidad
- Accent cyan se mantiene igual HEX pero con más glow
- Gradientes son más sutiles en dark mode

---

## 🎭 Paletas Alternativas

### **🔵 ALTERNATIVA 1: "Corporate Premium Azul"**

**Vibe:** Más conservadora, enterprise B2B, confianza máxima

| Color | HEX | Nombre |
|-------|-----|--------|
| Primary | `#0F62FE` | IBM Electric Blue |
| Primary Dark | `#052B85` | Navy Enterprise |
| Accent | `#4589FF` | Sky Azure |
| Secondary | `#0043CE` | Royal Blue |
| Neutral | `#161616` | Carbon Black |

**Justificación:** Para clientes que prefieren maximal confianza sobre futurismo. Inspirado en IBM, Salesforce, Follow Up Boss. Menos arriesgado, más "safe corporate".

**Cuándo usar:**
- Clientes enterprise tradicionales
- Mercados conservadores
- Cuando la innovación es menos importante que la confianza

---

### **🌌 ALTERNATIVA 2: "Futurista Cyber-Teal/Purple"**

**Vibe:** Maximal futurismo, cyberpunk 2026, IA agresiva

| Color | HEX | Nombre |
|-------|-----|--------|
| Primary | `#06B6D4` | Cyber Teal |
| Primary Dark | `#0E7490` | Deep Teal |
| Accent | `#A855F7` | Electric Purple |
| Secondary | `#EC4899` | Hot Pink |
| Neutral | `#030712` | Void Black |

**Justificación:** Para posicionarse como "la IA más avanzada del mercado". Inspirado en Linear, Vercel, startups web3. Muy arriesgado pero muy diferenciado.

**Cuándo usar:**
- Startups tech-forward
- Mercado adolescente/milenial
- Cuando la diferenciación es prioridad absoluta

---

## 💻 Ejemplos de Código

### **React con Tailwind CSS**

#### **Componente: Button Primary**
```jsx
const ButtonPrimary = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-8 py-4 rounded-xl font-semibold text-white
      bg-gradient-to-r from-[#0A4DAF] to-[#062B5F]
      hover:from-[#0D5FD4] hover:to-[#08367A]
      shadow-[0_8px_24px_rgba(10,77,175,0.4)]
      hover:shadow-[0_12px_32px_rgba(10,77,175,0.5)]
      transform hover:-translate-y-0.5
      transition-all duration-300"
  >
    {children}
  </button>
);
```

---

#### **Componente: Button Accent (CTA)**
```jsx
const ButtonAccent = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-8 py-4 rounded-xl font-semibold
      bg-[#00D9FF] text-[#0F172A]
      hover:bg-[#33E1FF]
      shadow-[0_8px_24px_rgba(0,217,255,0.5)]
      hover:shadow-[0_12px_32px_rgba(0,217,255,0.7)]
      transform hover:-translate-y-0.5
      transition-all duration-300"
  >
    {children}
  </button>
);
```

---

#### **Componente: Card con Gradient**
```jsx
const Card = ({ children, className = "" }) => (
  <div
    className={`
      bg-white dark:bg-[#0F172A]/80
      backdrop-blur-xl
      border border-primary/10
      hover:border-[#00D9FF]/30
      rounded-3xl p-8
      shadow-lg hover:shadow-2xl
      transition-all duration-300
      ${className}
    `}
  >
    {children}
  </div>
);
```

---

#### **Componente: Badge AI**
```jsx
const BadgeAI = () => (
  <span className="inline-flex items-center gap-2
    bg-gradient-to-r from-[#7C3AED] to-[#00D9FF]
    text-white text-xs font-semibold px-3 py-1 rounded-full
    shadow-[0_4px_12px_rgba(124,58,237,0.4)]
  ">
    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
    Powered by AI
  </span>
);
```

---

### **CSS Puro**

#### **Variables CSS Completas**
```css
:root {
  /* Primary Colors */
  --rovi-primary: #0A4DAF;
  --rovi-primary-dark: #062B5F;
  --rovi-primary-light: #3370D9;

  /* Accent Colors */
  --rovi-accent: #00D9FF;
  --rovi-accent-hover: #33E1FF;
  --rovi-secondary: #7C3AED;
  --rovi-secondary-light: #8B5CF6;

  /* Neutrals */
  --rovi-bg-dark: #0F172A;
  --rovi-bg-light: #F8FAFC;
  --rovi-surface: rgba(255, 255, 255, 0.05);
  --rovi-surface-hover: rgba(0, 217, 255, 0.1);

  /* Functional */
  --rovi-success: #10B981;
  --rovi-warning: #F59E0B;
  --rovi-error: #EF4444;

  /* Text */
  --rovi-text-primary: #1E293B;
  --rovi-text-secondary: #64748B;
  --rovi-text-muted: #94A3B8;
}

/* Gradientes */
:root {
  --gradient-velocity: linear-gradient(135deg, #0F172A 0%, #062B5F 40%, #0A4DAF 100%);
  --gradient-neural: linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%);
  --gradient-primary: linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%);
  --gradient-growth: linear-gradient(135deg, #10B981 0%, #059669 100%);
}

/* Shadows */
:root {
  --shadow-primary: 0 0 20px rgba(10, 77, 175, 0.4);
  --shadow-accent: 0 0 30px rgba(0, 217, 255, 0.5);
  --shadow-violet: 0 0 30px rgba(124, 58, 237, 0.4);
  --shadow-card: 0 8px 30px rgba(0, 0, 0, 0.12);
}
```

---

## 🧩 Guía de Uso por Componente

### **Landing Page (/for-brokers)**

#### **Hero Section**
- Background: `gradient-velocity`
- Floating Orbs: Cyan y Violeta con blur
- Badge "LANZAMIENTO": Cyan con texto oscuro
- Title Animation: Gradient cyan → violeta → cyan
- CTA Button: `bg-[#00D9FF]` con hover glow
- Mockup Dashboard: Bordes cyan, indicators violeta

---

#### **Features Section (8 Módulos)**
- Onboarding: `from-[#0A4DAF] to-[#062B5F]` (azul)
- Dashboard: `from-[#00D9FF] to-[#0A4DAF]` (cyan → azul)
- Pipeline: `from-[#10B981] to-[#059669]` (verde)
- Inventario: `from-[#7C3AED] to-[#6D28D9]` (violeta)
- Campañas: `from-[#0A4DAF] to-[#062B5F]` (azul)
- Inbox: `from-[#00D9FF] to-[#7C3AED]` (cyan → violeta)
- Analíticas: `from-[#7C3AED] to-[#0A4DAF]` (violeta → azul)
- Scripts: `from-[#F59E0B] to-[#D97706]` (ámbar)

---

#### **Benefits Section**
- Icon Cards: Gradient primary con iconos blancos
- Impact Badges: Cyan con texto oscuro
- CTA Button: `hover-accent` con glow

---

#### **Comparison Section**
- "Sin Rovi": Rojo/coral con bordes sólidos
- "Con Rovi": Verde growth con checkmarks
- Stats Cards: Cyan con gradient velocity

---

#### **Launch Form**
- Background: `gradient-primary → cyan → violeta` con opacidad
- Progress Bar: Cyan → violeta
- Info Card: Gradient cyan-violeta con glow
- Submit Button: Gradient primary con hover

---

### **Dashboard Principal**

#### **Sidebar**
- Background: `#062B5F` (primary dark)
- Active Item: Bordes left cyan, fondo `rgba(0, 217, 255, 0.1)`
- Hover: `rgba(0, 217, 255, 0.15)`
- Logo "Rovi": Cyan

---

#### **Top Navigation**
- Background: Obsidian base con glass effect
- Breadcrumb: Primary color
- User Menu: Gradient cyan-violeta

---

#### **Stats Cards**
- Background: White / Dark mode: Obsidian con glass
- Icon: Cyan o Violeta según tipo
- Value: Primary con gradient
- Change: Verde (positivo) o rojo (negativo)

---

#### **Pipeline Kanban**
- Column Headers: Primary dark
- Cards: White con bordes primary/10
- Priority Badges:
  - Alta: Cyan
  - Media: Violeta
  - Baja: Slate

---

### **Estados de Scraping Instagram**

#### **Scanning**
- Border: Cyan con pulse animation
- Icon: Spinning + cyan glow
- Background: `rgba(0, 217, 255, 0.05)`

---

#### **Processing**
- Gradient: Violeta → cyan
- Shimmer animation
- AI badge: Pulsing violeta

---

#### **Completed**
- Background: Verde growth con baja opacidad
- Border: Success
- Icon: Checkmark verde

---

### **Modales y Tooltips**

#### **Modal**
- Backdrop: Obsidian con blur
- Content: White / Dark mode: Obsidian light
- Header: Gradient primary
- Close Button: Primary hover

---

#### **Tooltip**
- Background: Obsidian con alto contraste
- Border: Cyan
- Arrow: Mismo color
- Text: White

---

## 📦 Assets y Recursos

### **Favicon**
- **Formato:** ICO, PNG
- **Tamaños:** 16x16, 32x32, 48x48, 256x256
- **Colores:** Primary blue + "R" en cyan

---

### **Logo**
- **Principal:** "Rovi" en Outfit Bold + "CRM" en Plus Jakarta Sans Regular
- **Variante Dark:** Texto blanco + "R" en cyan
- **Variante Light:** Texto primary + "R" en cyan
- **Icon Only:** "R" en círculo cyan con borde primary

---

### **Open Graph Images**
- **Facebook:** 1200 x 630px
- **Twitter:** 1600 x 900px
- **LinkedIn:** 1200 x 627px
- **Background:** Gradient velocity
- **Overlay:** Mockup del dashboard con glow cyan

---

### **Illustrations**
- **Hero:** Futurista, tech, con elementos cyan y violeta
- **Features:** Minimalistas, con iconos en gradient
- **Empty States:** Friendly, cyan primary, texto slate

---

### **Icons**
- **Library:** Lucide React (usando actualmente)
- **Custom Icons:** AI, Scraping, Processing (en cyan/violeta)
- **Style:** Outline para secondary, solid para primary/accent

---

## 🚀 Implementación

### **CSS Variables en Tailwind Config**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        rovi: {
          primary: '#0A4DAF',
          'primary-dark': '#062B5F',
          'primary-light': '#3370D9',
          accent: '#00D9FF',
          'accent-hover': '#33E1FF',
          secondary: '#7C3AED',
          'secondary-light': '#8B5CF6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      backgroundImage: {
        'gradient-velocity': 'linear-gradient(135deg, #0F172A 0%, #062B5F 40%, #0A4DAF 100%)',
        'gradient-neural': 'linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%)',
        'gradient-primary': 'linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%)',
        'gradient-growth': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      }
    }
  }
}
```

---

### **Clases de Utilidad Custom**

```css
/* En index.css */

.glass-light {
  @apply bg-white/70 backdrop-blur-lg border border-white/20;
}

.glass-dark {
  @apply bg-slate-900/60 backdrop-blur-xl border border-slate-700/30;
}

.shadow-glow-primary {
  box-shadow: 0 0 20px rgba(10, 77, 175, 0.4);
}

.shadow-glow-accent {
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
}

.shadow-glow-violet {
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.4);
}

.text-gradient-velocity {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, #0A4DAF 0%, #00D9FF 100%);
}

.text-gradient-neural {
  @apply bg-clip-text text-transparent;
  background-image: linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%);
}
```

---

## 📊 Checklist de Implementación

### **✅ Completado**
- [x] Paleta principal definida
- [x] Gradientes creados
- [x] Variables CSS implementadas
- [x] Landing page /for-brokers actualizada
- [x] Hero section con gradient velocity
- [x] Features con gradient tecnológicos
- [x] CTAs en cyan con glow
- [x] Dark mode configurado

### **🔄 Pendiente**
- [ ] Aplicar paleta al dashboard principal
- [ ] Actualizar componentes shadcn/ui
- [ ] Crear favicons y logos
- [ ] Generar Open Graph images
- [ ] Actualizar email templates
- [ ] Aplicar a documentación

---

## 📞 Contacto y Soporte

**Preguntas sobre el branding?**
- **Design Lead:** [Tu nombre]
- **Email:** design@rovicrm.com
- **Slack:** #rovi-brand

**Reportar bugs o sugerencias:**
- **GitHub:** [repositorio]
- **Issue Template:** Branding & Design

---

## 📝 Notas de Versión

### **v1.0 (Abril 2026)**
- ✨ Paleta "Rovi AI Tech" inicial
- ✨ Gradientes velocity, neural, primary, growth
- ✨ Dark mode completo
- ✨ Landing page /for-brokers implementada
- 📝 Documentación creada

### **Próximas Actualizaciones**
- [ ] Component library en Storybook
- [ ] Figma design system completo
- [ ] Animaciones y micro-interactions
- [ ] Accessibilidad (WCAG 2.1 AA)

---

**Este documento es la fuente oficial de verdad para la identidad de marca de Rovi CRM.**
**Cualquier cambio debe ser aprobado por el equipo de diseño y actualizado aquí primero.**

---

**© 2026 Rovi CRM. Todos los derechos reservados.**

# 🎨 Rovi Brand Quick Reference

**Guía rápida de consulta para desarrolladores y diseñadores**

---

## 🎯 Colores Principales

### **HEX Quick Copy**

| Color | HEX | Nombre | Uso Principal |
|-------|-----|--------|---------------|
| 🔵 Primary | `#0A4DAF` | Deep Velocity Blue | Botones, links |
| ⚫ Primary Dark | `#062B5F` | Midnight Forge | Headers, sidebar |
| ⚡ Accent | `#00D9FF` | Electric Cyan | CTAs, AI badges |
| 🟣 Secondary | `#7C3AED` | Neural Violet | Features IA |
| ✅ Success | `#10B981` | Growth Mint | Estados positivos |
| ⚠️ Warning | `#F59E0B` | Solar Amber | Alertas |
| ❌ Error | `#EF4444` | Crimson Edge | Errores |

---

## 🌈 Gradientes CSS (Copy & Paste)

```css
/* Hero / Background Principal */
background: linear-gradient(135deg, #0F172A 0%, #062B5F 40%, #0A4DAF 100%);

/* AI Features / Neural */
background: linear-gradient(135deg, #7C3AED 0%, #00D9FF 100%);

/* Botones Primarios */
background: linear-gradient(135deg, #0A4DAF 0%, #062B5F 100%);

/* Success / Growth */
background: linear-gradient(135deg, #10B981 0%, #059669 100%);
```

---

## 💻 Tailwind Classes

### **Botones**

```jsx
/* Primary Button */
className="bg-gradient-to-r from-[#0A4DAF] to-[#062B5F]
  hover:from-[#0D5FD4] hover:to-[#08367A]
  text-white px-8 py-4 rounded-xl font-semibold
  shadow-[0_8px_24px_rgba(10,77,175,0.4)]
  hover:shadow-[0_12px_32px_rgba(10,77,175,0.5)]
  transform hover:-translate-y-0.5
  transition-all duration-300"

/* CTA / Accent Button */
className="bg-[#00D9FF] text-[#0F172A]
  hover:bg-[#33E1FF]
  px-8 py-4 rounded-xl font-semibold
  shadow-[0_8px_24px_rgba(0,217,255,0.5)]
  hover:shadow-[0_12px_32px_rgba(0,217,255,0.7)]
  transform hover:-translate-y-0.5
  transition-all duration-300"
```

---

### **Cards**

```jsx
/* Light Mode */
className="bg-white
  border border-primary/10
  hover:border-[#00D9FF]/30
  rounded-3xl p-8
  shadow-lg hover:shadow-2xl
  transition-all duration-300"

/* Dark Mode */
className="bg-[#0F172A]/80
  backdrop-blur-xl
  border border-[#00D9FF]/15
  hover:border-[#00D9FF]/30
  rounded-3xl p-8
  shadow-xl hover:shadow-2xl
  transition-all duration-300"
```

---

### **Badges**

```jsx
/* AI Badge */
className="inline-flex items-center gap-2
  bg-gradient-to-r from-[#7C3AED] to-[#00D9FF]
  text-white text-xs font-semibold px-3 py-1 rounded-full
  shadow-[0_4px_12px_rgba(124,58,237,0.4)]"

/* Status Badge */
className="bg-[#10B981] text-white
  text-xs font-semibold px-3 py-1 rounded-full"
```

---

### **Text Gradients**

```jsx
/* Velocity Gradient */
className="bg-clip-text text-transparent
  bg-gradient-to-r from-[#0A4DAF] to-[#00D9FF]"

/* Neural Gradient */
className="bg-clip-text text-transparent
  bg-gradient-to-r from-[#7C3AED] to-[#00D9FF]"
```

---

## 🎨 Componentes Específicos

### **Landing Page Hero**
```jsx
<section className="gradient-velocity min-h-screen">
  <div className="absolute inset-0 opacity-10">
    {/* Pattern */}
  </div>
  <div className="absolute top-20 right-10 w-72 h-72
    bg-[#00D9FF]/20 rounded-full blur-3xl" />
  <div className="absolute bottom-20 left-10 w-96 h-96
    bg-[#7C3AED]/20 rounded-full blur-3xl" />
  {/* Content */}
</section>
```

---

### **AI Assistant Card**
```jsx
<div className="bg-gradient-to-r from-[#7C3AED]/20
  to-[#00D9FF]/20 rounded-xl p-4
  border border-[#00D9FF]/30">
  <div className="w-8 h-8 bg-[#00D9FF]
    rounded-full flex items-center justify-center">
    <span className="text-[#0F172A] text-sm font-bold">
      AI
    </span>
  </div>
  <div className="text-sm text-[#00D9FF] font-semibold">
    Asistente Rovi
  </div>
</div>
```

---

### **Scraping States**

```jsx
/* Scanning */
<div className="border-2 border-[#00D9FF] animate-pulse">
  <div className="w-6 h-6 bg-[#00D9FF] animate-spin" />
</div>

/* Processing */
<div className="bg-gradient-to-r from-[#7C3AED]
  to-[#00D9FF] animate-shimmer">
</div>

/* Completed */
<div className="bg-[#10B981]/10 border border-[#10B981]">
  <CheckCircle className="text-[#10B981]" />
</div>
```

---

## 📐 Common Spacing

```jsx
// Buttons
px-4 py-2    // sm
px-6 py-3    // md
px-8 py-4    // lg

// Cards
p-4          // sm
p-6          // md
p-8          // lg

// Sections
py-12        // sm
py-20        // md
py-24        // lg
```

---

## 🔄 Animation Presets

```jsx
// Fade In
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}

// Hover
whileHover={{ y: -8, scale: 1.02 }}
transition={{ type: "spring", stiffness: 300 }}

// Pulse
animate={{ opacity: [0.5, 1, 0.5] }}
transition={{ duration: 2, repeat: Infinity }}

// Float
animate={{ y: [0, -20, 0] }}
transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
```

---

## 🎯 Uso de Iconos (Lucide React)

```jsx
import { Bot, Zap, Target, TrendingUp } from 'lucide-react';

// Primary color
<Bot className="w-6 h-6 text-[#0A4DAF]" />

// Accent color
<Zap className="w-6 h-6 text-[#00D9FF]" />

// Secondary color
<Target className="w-6 h-6 text-[#7C3AED]" />

// Success
<TrendingUp className="w-6 h-6 text-[#10B981]" />
```

---

## 📱 Responsive Breakpoints

```jsx
// Mobile First approach
className="text-2xl md:text-4xl lg:text-6xl"
//             ↑↑↑      ↑↑↑↑      ↑↑↑↑↑↑
//           mobile   tablet    desktop

// Grid
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Flex
className="flex-col md:flex-row"
```

---

## 🌙 Dark Mode Toggle

```jsx
// With Tailwind
<div className="bg-white dark:bg-[#0F172A]
  text-gray-900 dark:text-gray-100">

// Manual toggle
const [isDark, setIsDark] = useState(false);
<div className={isDark ? 'dark' : ''}>
  <div className="bg-white dark:bg-[#0F172A]">
```

---

## 🚨 Pro Tips

1. **SIEMPRE** usa colores con opacidad para borders y fondos
   ```jsx
   border-[#00D9FF]/20  // ✅ Correcto
   border-[#00D9FF]     // ❌ Demasiado fuerte
   ```

2. **USA** gradient-neural para elementos de IA
   ```jsx
   className="bg-gradient-to-r from-[#7C3AED] to-[#00D9FF]"
   ```

3. **AÑADE** shadow-glow-accent en CTAs
   ```jsx
   className="shadow-[0_8px_24px_rgba(0,217,255,0.5)]"
   ```

4. **USA** backdrop-blur en dark mode
   ```jsx
   className="backdrop-blur-xl bg-[#0F172A]/80"
   ```

5. **TRANSICIONES** siempre con duration-300
   ```jsx
   className="transition-all duration-300"
   ```

---

## 📁 Archivos Relacionados

- **[ROVI_BRAND_GUIDE.md](./ROVI_BRAND_GUIDE.md)** - Documento completo
- **[rovi-brand-colors.json](./rovi-brand-colors.json)** - Variables JSON
- **[index.css](../frontend/src/index.css)** - Implementación CSS

---

**¿Necesitas más ayuda?** Revisa el documento completo o contacta al equipo de diseño. 🎨

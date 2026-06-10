# 🧞 ROVI - Presentación Mágica Interactiva

Presentación 3D interactiva tipo "Aladino" donde ROVI es el genio que amplifica tu potencial inmobiliario.

## ✨ Características

- 🎭 **Storytelling tipo Aladino** - ROVI como el genio mágico
- 🌟 **Gráficos 3D con Three.js** - Escenas interactivas con WebGL
- ✨ **Efectos mágicos** - Partículas, brillos, transiciones cinematográficas
- 🎮 **Navegación interactiva** - Flechas, clicks, o teclas
- 📱 **Responsive** - Funciona en desktop y tablet
- 🎨 **Colores de marca Rovi** - Turquesa, verde jungla, dorado

## 🚀 Instalación y Uso

```bash
# Instalar dependencias
cd rovi-presentation
npm install

# Modo desarrollo
npm run dev
# Abre http://localhost:3000

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🎯 Contenido (7 Slides)

1. **La Lámpara** - Intro mística con la lámpara flotante
2. **El Genio Emerge** - ROVI se presenta como copiloto cognitivo
3. **El Ecosistema** - 4 familias de agentes (Sales, Estratega, Marketing, Datos)
4. **Amplificación Cognitiva** - El concepto de "× 16"
5. **Eisenhower 2.0** - Matriz visual interactiva
6. **El Camino** - 90 días de transformación
7. **La Promesa** - Cierre con CTA a registro

## 🎨 Tecnologías

- **React 18** - Framework base
- **Three.js + React Three Fiber** - Gráficos 3D
- **@react-three/drei** - Helpers y componentes 3D
- **@react-three/postprocessing** - Efectos post-procesamiento
- **Framer Motion** - Animaciones de transición
- **GSAP** - Animaciones complejas (disponible)
- **Vite** - Build tool ultra rápido

## 🎮 Navegación

- **Flechas** ← → : Navegar entre slides
- **Espacio** : Siguiente slide
- **Click** en indicadores : Ir a slide específico
- **Arrastrar** en escenas 3D : Rotar vista (OrbitControls)

## 🌟 Efectos Implementados

### Efectos 3D
- ✨ Partículas brillantes (Sparkles)
- 🌟 Estrellas de fondo (Stars)
- ☁️ Nubes etéreas (Cloud)
- 🎈 Flotación suave (Float)
- 🌟 Emisiones de luz (emissive materials)

### Efectos UI
- 📊 Transiciones slide-in/slide-out
- ✨ Texto con gradiente mágico
- 💫 Glows y sombras
- 🎯 Progress bar animado
- 📱 Cards con backdrop blur

### Colores Rovi
- **Turquesa** #0D9488 - Primary
- **Verde Jungla** #4D7C0F - Secondary  
- **Dorado** #D97706 - Accent
- **Fondo oscuro** #0a0a1a - Background

## 📁 Estructura del Proyecto

```
rovi-presentation/
├── index.html          # Entry point
├── package.json        # Dependencias
├── vite.config.js      # Configuración Vite
├── src/
│   ├── main.jsx        # ReactDOM render
│   ├── App.jsx         # Componente principal + slides
│   └── index.css       # Estilos globales + animaciones
└── README.md           # Este archivo
```

## 🎬 Personalización

### Cambiar textos
Edita `src/App.jsx`, busca las constantes `slides` y modifica el contenido.

### Cambiar colores
Los colores están definidos en:
- `src/App.jsx` - Colores de componentes 3D
- `src/index.css` - CSS variables y gradientes
- `index.html` - Estilos base

### Añadir más slides
Añade un nuevo objeto al array `slides`:

```javascript
{
  id: 7,
  content: () => (
    <>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <CosmicBackground />
        {/* Tus componentes 3D aquí */}
        <OrbitControls enableZoom={false} autoRotate />
      </Canvas>
      <div className="absolute bottom-20 left-0 right-0 text-center px-8">
        <QuoteText text="Tu texto aquí" />
      </div>
    </>
  )
}
```

## 🚀 Deployment

### Netlify / Vercel
1. Conecta tu repo
2. Configura el comando de build: `npm run build`
3. Configura el directorio de publish: `dist`
4. Deploy!

### GitHub Pages
```bash
npm run build
# Push la carpeta /dist a gh-pages branch
```

### Exportar como video
Usa [Remotion](https://www.remotion.dev/) para exportar a MP4:
```bash
npx remotion video
```

## 📝 Notas

- La presentación usa WebGL, requiere navegador moderno
- Performance óptima en desktop y tablet
- Los controles 3D permiten rotar las escenas
- Las transiciones usan spring physics para suavidad

---

**Creado para ROVI CRM** - Amplificando el potencial inmobiliario con IA 🚀

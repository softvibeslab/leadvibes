# 🌴 ROVI Presentation - Riviera Maya Implementation Plan

## 🎯 Overview

Actualizar la presentación para resonar con brokers de:
- **Tulum** - Bohemian eco-luxury, wellness, spiritual
- **Playa del Carmen** - Urban beach, vibrant, social
- **Cancún** - Luxury resort, international, business
- **Tuluminti** - Authentic, local, Mayan roots

---

## 📨 Step 1: Update Color Palette

### Add to `src/index.css`:

```css
/* ==================== RIVIERA MAYA PALETTE ==================== */
:root {
  /* Tulum - Bohemian Eco-Luxury */
  --tulum-jungle: #2D5A27;
  --tulum-sand: #C4A484;
  --tulum-cenote: #4A90A4;

  /* Playa del Carmen - Urban Beach */
  --playa-sunset: #FF6B35;
  --playa-neon: #00D9FF;
  --playa-vibrant: #FF1493;

  /* Cancún - Resort Luxury */
  --cancun-aqua: #00CED1;
  --cancun-gold: #FFD700;
  --cancun-white: #F5F5F5;

  /* Tuluminti - Authentic Local */
  --tuluminti-earth: #8B4513;
  --tuluminti-stone: #9C8B75;
  --tuluminti-jade: #00A86B;

  /* ROVI Brand Base */
  --rovi-turquesa: #0D9488;
  --rovi-verde: #4D7C0F;
  --rovi-dorado: #D97706;
}

.riviera-gradient {
  background: linear-gradient(135deg,
    var(--tulum-jungle) 0%,
    var(--tulum-cenote) 25%,
    var(--cancun-aqua) 50%,
    var(--playa-sunset) 75%,
    var(--rovi-dorado) 100%
  );
  background-size: 200% 200%;
  animation: rivieraShift 8s ease infinite;
}

@keyframes rivieraShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Zone-specific glow effects */
.glow-tulum {
  box-shadow: 0 0 20px rgba(45, 90, 39, 0.5),
              0 0 40px rgba(74, 144, 164, 0.3);
}

.glow-playa {
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.5),
              0 0 40px rgba(0, 217, 255, 0.3);
}

.glow-cancun {
  box-shadow: 0 0 20px rgba(0, 206, 209, 0.5),
              0 0 40px rgba(255, 215, 0, 0.3);
}

.glow-tuluminti {
  box-shadow: 0 0 20px rgba(139, 69, 19, 0.5),
              0 0 40px rgba(0, 168, 107, 0.3);
}
```

---

## 📨 Step 2: Update Slide Content

### Slide 0: Lámpara Maya
```jsx
const quote = "Como un cenote que guarda secretos milenarios,
tu pipeline esconde oportunidades que solo ROVI puede revelar..."

<motion.div className="text-center">
  <p className="text-2xl text-white/90 italic">
    "En la Riviera Maya, cada propiedad cuenta una historia.
    <span className="text-cyan-400">ROVI</span> te ayuda a escribir la siguiente."
  </p>
</motion.div>
```

### Slide 2: Ecosistema Localizado
```jsx
const agentes = [
  {
    icon: '🏖️',
    name: 'Sales',
    zone: 'Playa del Carmen',
    desc: 'Broker urbano con 5 años en Fifth Avenue'
  },
  {
    icon: '🌿',
    name: 'Estratega',
    zone: 'Tulum',
    desc: 'Inversor de eco-luxury con 12 propiedades'
  },
  {
    icon: '🌊',
    name: 'Marketing',
    zone: 'Cancún',
    desc: 'Digital nomad que domina el mercado internacional'
  },
  {
    icon: '🏛️',
    name: 'Datos',
    zone: 'Tuluminti',
    desc: 'Analista local que conoce cada cenote'
  },
]
```

### Slide 3: Amplificación ×16
```jsx
const amplificationData = [
  "16 propiedades vendidas entre Tulum y Playa",
  "16× más rápido que el broker promedio de Cancún",
  "16 años de experiencia de Riviera Maya en 16 días",
]
```

### Slide 4: Eisenhower Contextualizado
```jsx
const matrixData = [
  {
    title: 'CIERRES HOY',
    pct: '30%',
    action: 'Visitas en Tulum Norte',
    example: 'Cita con los canadienses en La Veleta',
    zone: 'tulum'
  },
  {
    title: 'PROSPECCIÓN',
    pct: '40%',
    action: 'Aldea Maya + Kavi',
    example: 'Recorrer nuevas zonas de Tuluminti',
    zone: 'tuluminti'
  },
  {
    title: 'DELEGAR',
    pct: '20%',
    action: 'Seguimiento de leads',
    example: 'ROVI responde WhatsApp de 50 leads',
    zone: 'playa'
  },
  {
    title: 'SOLTAR',
    pct: '10%',
    action: 'Eventos sin ROI',
    example: 'Reducir networking en Playa del Carmen',
    zone: 'cancun'
  },
]
```

---

## 📨 Step 3: Add 3D Zone Models

### Cenote Background (for Slide 0-1)
```jsx
const CenoteBackground = () => (
  <mesh position={[0, -3, -5]}>
    <sphereGeometry args={[8, 32, 32]} />
    <meshStandardMaterial
      color="#1a3a4a"
      transparent
      opacity={0.3}
      emissive="#4A90A4"
      emissiveIntensity={0.2}
    />
  </mesh>
)
```

### Riviera Maya Map (for Slide 3)
```jsx
const RivieraMap = () => (
  <group>
    {/* Costa */}
    <mesh position={[0, -2, 0]} rotation={[0, 0, 0]}>
      <planeGeometry args={[10, 0.5]} />
      <meshStandardMaterial color="#0D9488" emissive="#0D9488" emissiveIntensity={0.3} />
    </mesh>

    {/* Puntos de ventas */}
    {[
      { pos: [-3, 0, 0], color: '#2D5A27', name: 'Tulum' },
      { pos: [-1, 0.5, 0], color: '#FF6B35', name: 'Playa' },
      { pos: [2, 1, 0], color: '#00CED1', name: 'Cancún' },
      { pos: [-2, -0.5, 0], color: '#8B4513', name: 'Tuluminti' },
    ].map((point, i) => (
      <Float key={i} speed={1 + i * 0.2}>
        <group position={point.pos}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color={point.color}
              emissive={point.color}
              emissiveIntensity={0.8}
            />
          </mesh>
          <Sparkles count={15} scale={0.8} size={4} color={point.color} />
        </group>
      </Float>
    ))}
  </group>
)
```

---

## 📨 Step 4: Zone-Specific Components

### TulumCard
```jsx
const TulumCard = ({ children }) => (
  <motion.div
    className="glow-tulum rounded-xl p-6"
    style={{
      background: 'linear-gradient(135deg, rgba(45,90,39,0.2) 0%, rgba(74,144,164,0.1) 100%)',
      borderColor: 'rgba(45,90,39,0.4)'
    }}
  >
    <span className="text-2xl mb-2">🌿</span>
    <h3 className="text-green-400 font-bold text-sm">TULUM</h3>
    {children}
  </motion.div>
)
```

### PlayaCard
```jsx
const PlayaCard = ({ children }) => (
  <motion.div
    className="glow-playa rounded-xl p-6"
    style={{
      background: 'linear-gradient(135deg, rgba(255,107,53,0.2) 0%, rgba(0,217,255,0.1) 100%)',
      borderColor: 'rgba(255,107,53,0.4)'
    }}
  >
    <span className="text-2xl mb-2">🏖️</span>
    <h3 className="text-orange-400 font-bold text-sm">PLAYA DEL CARMEN</h3>
    {children}
  </motion.div>
)
```

### CancunCard
```jsx
const CancunCard = ({ children }) => (
  <motion.div
    className="glow-cancun rounded-xl p-6"
    style={{
      background: 'linear-gradient(135deg, rgba(0,206,209,0.2) 0%, rgba(255,215,0,0.1) 100%)',
      borderColor: 'rgba(0,206,209,0.4)'
    }}
  >
    <span className="text-2xl mb-2">🌊</span>
    <h3 className="text-cyan-400 font-bold text-sm">CANCÚN</h3>
    {children}
  </motion.div>
)
```

### TulumintiCard
```jsx
const TulumintiCard = ({ children }) => (
  <motion.div
    className="glow-tuluminti rounded-xl p-6"
    style={{
      background: 'linear-gradient(135deg, rgba(139,69,19,0.2) 0%, rgba(0,168,107,0.1) 100%)',
      borderColor: 'rgba(139,69,19,0.4)'
    }}
  >
    <span className="text-2xl mb-2">🏛️</span>
    <h3 className="text-amber-700 font-bold text-sm">TULUMINTI</h3>
    {children}
  </motion.div>
)
```

---

## 📨 Step 5: Update Quote Content

### Zone-Specific Quotes
```jsx
const zoneQuotes = {
  tulum: {
    text: "Tulum no es solo destino, es lifestyle.
    ROVI amplifica tu conexión con el mercado bohemio.",
    author: "Broker de La Veleta",
  },
  playa: {
    text: "En Fifth Avenue, la energía es todo.
    ROVI canaliza esa energía en tu pipeline.",
    author: "Broker de Playa del Carmen",
  },
  cancun: {
    text: "Cancún es donde el mundo nos busca.
    ROVI asegura que el mundo te encuentre.",
    author: "Broker de Hotel Zone",
  },
  tuluminti: {
    text: "Lo auténtico está en los detalles locales.
    ROVI conoce cada calle y cada oportunidad.",
    author: "Broker de Tuluminti",
  },
}
```

---

## 📨 Step 6: Final CTA with Local Context

### Updated CTA
```jsx
<motion.a
  href="https://rovi.crm/auth/register"
  className="riviera-gradient text-white font-bold py-4 px-12 rounded-full text-xl"
>
  🌴 Únete a los Brokers de Riviera Maya
</motion.a>

<motion.p
  className="mt-4 text-white/60 text-sm"
>
  De Tulum a Cancún, 16 brokers ya amplificaron su éxito.
  <br />
  <span className="text-cyan-400">¿Listo para ser el siguiente?</span>
</motion.p>
```

---

## 🎨 Implementation Checklist

- [ ] Add Riviera Maya color palette to `index.css`
- [ ] Update `App.jsx` with zone-specific cards
- [ ] Add `CenoteBackground` component
- [ ] Add `RivieraMap` component
- [ ] Update quote content with local context
- [ ] Add zone-specific glow effects
- [ ] Test on different screen sizes
- [ ] Verify color contrast ratios
- [ ] Test with real estate professionals from each zone

---

## 🚀 Next Steps After Implementation

1. **Generate AI images** using the prompts in `PROMPTS-RIVIERA-MAYA.md`
2. **A/B test** with brokers from each zone
3. **Create zone-specific landing pages**
4. **Build zone-specific onboarding flows**
5. **Develop zone-specific agent training**

Ready to implement! 🌴

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import './index.css'

// ==================== ESCENAS 3D ====================

const CosmicBackground = () => (
  <>
    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} intensity={2} color="#0D9488" />
    <pointLight position={[-10, -10, -10]} intensity={1} color="#D97706" />
    <pointLight position={[0, 5, 5]} intensity={1.5} color="#4D7C0F" />
  </>
)

const GenieLamp = () => (
  <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.1} emissive="#D97706" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 0.6, 0.8, 32]} />
        <meshStandardMaterial color="#B45309" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <torusGeometry args={[0.2, 0.08, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  </Float>
)

const GenieCharacter = () => {
  const groupRef = useRef()
  const [pulse, setPulse] = useState(0)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
      setPulse(Math.sin(state.clock.elapsedTime * 2))
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.5 + pulse * 0.1, 32, 32]} />
        <meshStandardMaterial color="#0D9488" transparent opacity={0.6} emissive="#0D9488" emissiveIntensity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#4D7C0F" transparent opacity={0.2} emissive="#4D7C0F" emissiveIntensity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <Sparkles count={150} scale={3} size={8} speed={0.6} opacity={0.9} color="#D97706" />
      <mesh position={[-0.4, 0.4, 1.3]} scale={0.2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.4, 0.4, 1.3]} scale={0.2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

const AgentesFlotantes = () => {
  const agentes = [
    { position: [-3, 2, 0], color: '#FF6B35', name: 'Playa del Carmen', emoji: '🏖️' },
    { position: [3, 2, 0], color: '#2D5A27', name: 'Tulum', emoji: '🌿' },
    { position: [-3, -2, 0], color: '#00CED1', name: 'Cancún', emoji: '🌊' },
    { position: [3, -2, 0], color: '#8B4513', name: 'Tuluminti', emoji: '🏛️' },
  ]

  return (
    <>
      {agentes.map((agente, i) => (
        <Float key={agente.name} speed={1.5 + i * 0.2} rotationIntensity={0.3} floatIntensity={0.5}>
          <group position={agente.position}>
            <mesh>
              <sphereGeometry args={[0.9, 32, 32]} />
              <meshStandardMaterial color={agente.color} emissive={agente.color} emissiveIntensity={0.6} transparent opacity={0.8} />
            </mesh>
            <Sparkles count={30} scale={1.5} size={4} color={agente.color} />
          </group>
        </Float>
      ))}
    </>
  )
}

const AmplificationSphere = () => (
  <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
    <group>
      <mesh>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial color="#0D9488" transparent opacity={0.3} emissive="#0D9488" emissiveIntensity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={1.8}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#4D7C0F" transparent opacity={0.2} emissive="#4D7C0F" emissiveIntensity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <Sparkles count={300} scale={6} size={10} speed={0.8} color="#D97706" />
    </group>
  </Float>
)

const MatrixVisualization = () => {
  const colors = ['#EF4444', '#10B981', '#F59E0B', '#6B7280']
  const positions = [[-2, 2, 0], [2, 2, 0], [-2, -2, 0], [2, -2, 0]]

  return (
    <>
      {positions.map((pos, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <group position={pos}>
            <mesh>
              <boxGeometry args={[1.8, 1.8, 0.4]} />
              <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={0.4} transparent opacity={0.7} />
            </mesh>
            <Sparkles count={20} scale={1} size={3} color={colors[i]} />
          </group>
        </Float>
      ))}
    </>
  )
}

const PathTimeline = () => {
  const data = [
    { position: [-4, 0, 0], color: '#2D5A27', label: 'Tulum' },
    { position: [0, 0, 0], color: '#FF6B35', label: 'Playa' },
    { position: [4, 0, 0], color: '#00CED1', label: 'Cancún' },
  ]

  return (
    <>
      {data.map((item, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={0.2} floatIntensity={0.4}>
          <group position={item.position}>
            <mesh>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.6} transparent opacity={0.8} />
            </mesh>
            <Sparkles count={40} scale={2} size={5} color={item.color} />
          </group>
        </Float>
      ))}
    </>
  )
}

// ==================== RIVIERA MAYA MAP ====================

const RivieraMap = () => {
  const zones = [
    { pos: [-3, 0, 0], color: '#2D5A27', name: 'Tulum', emoji: '🌿' },
    { pos: [-1, 0.5, 0], color: '#FF6B35', name: 'Playa', emoji: '🏖️' },
    { pos: [2, 1, 0], color: '#00CED1', name: 'Cancún', emoji: '🌊' },
    { pos: [-2, -0.5, 0], color: '#8B4513', name: 'Tuluminti', emoji: '🏛️' },
  ]

  return (
    <group>
      {/* Costa */}
      <mesh position={[0, -2, 0]}>
        <planeGeometry args={[12, 1]} />
        <meshStandardMaterial color="#0D9488" transparent opacity={0.3} emissive="#0D9488" emissiveIntensity={0.2} />
      </mesh>

      {/* Puntos de zonas */}
      {zones.map((zone, i) => (
        <Float key={zone.name} speed={1 + i * 0.15} rotationIntensity={0.2} floatIntensity={0.3}>
          <group position={zone.pos}>
            <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={0.8} />
            </mesh>
            <Sparkles count={20} scale={0.8} size={4} color={zone.color} />
          </group>
        </Float>
      ))}
    </group>
  )
}

// ==================== CENOTE BACKGROUND ====================

const CenoteBackground = () => (
  <mesh position={[0, -3, -3]}>
    <sphereGeometry args={[10, 32, 32]} />
    <meshStandardMaterial
      color="#1a3a4a"
      transparent
      opacity={0.2}
      emissive="#4A90A4"
      emissiveIntensity={0.15}
      blending={THREE.AdditiveBlending}
    />
  </mesh>
)

// ==================== ESCENA 3D POR SLIDE ====================

const Scene3D = ({ slideIndex }) => {
  return (
    <>
      <CosmicBackground />
      {slideIndex === 0 && (
        <>
          <CenoteBackground />
          <GenieLamp />
        </>
      )}
      {slideIndex === 1 && (
        <>
          <CenoteBackground />
          <GenieLamp />
          <GenieCharacter />
          <Sparkles count={200} scale={5} size={6} color="#4A90A4" />
        </>
      )}
      {slideIndex === 2 && <AgentesFlotantes />}
      {slideIndex === 3 && <RivieraMap />}
      {slideIndex === 4 && <MatrixVisualization />}
      {slideIndex === 5 && <PathTimeline />}
      {slideIndex === 6 && (
        <>
          <GenieCharacter />
          <Sparkles count={400} scale={15} size={8} speed={1.2} color="#D97706" />
        </>
      )}
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}

// ==================== COMPONENTES DE TEXTO ====================

const QuoteText = ({ text, author, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1, delay }}
    className="quote-box max-w-2xl mx-auto"
  >
    <p className="text-xl md:text-2xl lg:text-3xl text-white leading-relaxed mb-6">
      "{text}"
    </p>
    {author && <p className="text-right text-cyan-400 font-semibold">— {author}</p>}
  </motion.div>
)

const TitleText = ({ children, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.5, ease: "easeOut" }}
    className="text-center"
  >
    <h1 className="magic-title text-4xl md:text-5xl lg:text-7xl font-black magic-gradient mb-6">
      {children}
    </h1>
    {subtitle && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-base md:text-xl lg:text-2xl text-gray-300"
      >
        {subtitle}
      </motion.p>
    )}
  </motion.div>
)

// ==================== CONTENIDO POR SLIDE ====================

const SlideContent = ({ slideIndex }) => {
  const slides = {
    0: (
      <div className="absolute bottom-24 left-0 right-0 text-center px-8">
        <QuoteText text="Como un cenote que guarda secretos milenarios, tu pipeline esconde oportunidades que solo ROVI puede revelar..." delay={0.5} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-4 text-white/70 text-sm"
        >
          De Tulum a Cancún, tu próxima gran venta está esperando.
        </motion.p>
      </div>
    ),

    1: (
      <>
        <div className="absolute top-24 left-0 right-0 text-center px-8">
          <TitleText subtitle="Tu copiloto cognitivo en la Riviera Maya">ROVI</TitleText>
        </div>
        <div className="absolute bottom-24 left-0 right-0 text-center px-8">
          <QuoteText text="Conozco cada calle de Playa del Carmen, cada zona de Tulum, cada oportunidad en Cancún. No soy un asistente, soy tu co-piloto en la Riviera Maya." author="ROVI 🧞" delay={0.8} />
        </div>
      </>
    ),

    2: (
      <>
        <div className="absolute top-24 left-0 right-0 text-center px-8">
          <TitleText subtitle="Un ejército invisible a tu servicio">ECOSISTEMA</TitleText>
        </div>
        <div className="absolute bottom-24 left-0 right-0 px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            {[
              { icon: '🏖️', name: 'Sales Playa', desc: 'Broker urbano de 5th Ave', zone: 'playa' },
              { icon: '🌿', name: 'Estratega Tulum', desc: 'Inversor eco-luxury', zone: 'tulum' },
              { icon: '🌊', name: 'Marketing Cancún', desc: 'Experto mercado internacional', zone: 'cancun' },
              { icon: '🏛️', name: 'Datos Tuluminti', desc: 'Analista local auténtico', zone: 'tuluminti' },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className={`glow-${item.zone} rounded-xl p-4 card-${item.zone}`}
              >
                <span className="text-3xl md:text-4xl block mb-2">{item.icon}</span>
                <h3 className={`magic-title font-bold text-sm text-${item.zone}`}>{item.name}</h3>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </>
    ),

    3: (
      <>
        <div className="absolute top-24 left-0 right-0 text-center px-8">
          <TitleText subtitle="× 16 en toda la Riviera Maya">AMPLIFICACIÓN</TitleText>
        </div>
        <div className="absolute bottom-32 left-0 right-0 px-8">
          <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
            {[
              '16 propiedades vendidas entre Tulum y Playa',
              '16× más rápido que el broker promedio de Cancún',
              '16 años de experiencia local en 16 días con ROVI',
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.25, duration: 0.8 }}
                className="glow-box rounded-lg p-3 md:p-4"
              >
                <p className="text-base md:text-lg lg:text-xl text-white text-center">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </>
    ),

    4: (
      <>
        <div className="absolute top-24 left-0 right-0 text-center px-8">
          <TitleText subtitle="Tu día optimizado por IA en la Riviera Maya">EISENHOWER 2.0</TitleText>
        </div>
        <div className="absolute bottom-24 left-0 right-0 px-8">
          <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto">
            {[
              { title: 'CIERRES', pct: '30%', action: 'Visitas Tulum hoy', zone: 'tulum', example: 'Cita canadienses en La Veleta' },
              { title: 'PROSPECCIÓN', pct: '40%', action: 'Explorar Tuluminti', zone: 'tuluminti', example: 'Recorrer Aldea Maya + Kavi' },
              { title: 'DELEGAR', pct: '20%', action: 'A ROVI', zone: 'playa', example: 'Responder 50 WhatsApp' },
              { title: 'SOLTAR', pct: '10%', action: 'Eventos sin ROI', zone: 'cancun', example: 'Reducir networking Playa' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className={`glow-${item.zone} rounded-lg p-3 md:p-4 text-center card-${item.zone}`}
              >
                <h3 className="magic-title text-xs font-bold mb-1">{item.title}</h3>
                <p className="text-xl md:text-2xl font-bold mb-1">{item.pct}</p>
                <p className="text-xs text-white/80">{item.action}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </>
    ),

    5: (
      <>
        <div className="absolute top-24 left-0 right-0 text-center px-8">
          <TitleText subtitle="90 días de transformación en la Riviera Maya">EL CAMINO</TitleText>
        </div>
        <div className="absolute bottom-24 left-0 right-0 px-8">
          <div className="flex justify-center items-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {[
              { month: 'MES 1', title: 'FUNDACIÓN TULUM', desc: 'Descubre tu eco-luxury', zone: 'tulum' },
              { month: 'MES 2', title: 'ACELERACIÓN PLAYA', desc: 'Domina lo urbano', zone: 'playa' },
              { month: 'MES 3', title: 'MAESTRÍA CANCÚN', desc: 'Experto internacional', zone: 'cancun' },
            ].map((item, i) => (
              <motion.div
                key={item.month}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.25, duration: 0.8 }}
                className={`flex-1 glow-${item.zone} rounded-xl p-4 md:p-6 text-center card-${item.zone}`}
              >
                <span className="magic-title text-2xl md:text-3xl font-black">{item.month}</span>
                <h3 className="text-base md:text-lg font-bold text-white mt-2">{item.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </>
    ),

    6: (
      <>
        <div className="absolute top-32 left-0 right-0 text-center px-8">
          <TitleText>TU ÉXITO EN LA RIVIERA MAYA...</TitleText>
        </div>
        <div className="absolute bottom-24 left-0 right-0 px-8">
          <div className="max-w-3xl mx-auto">
            <QuoteText
              text="En 90 días, cerrarás más ventas en Tulum que la mayoría de los brokers en un año. No serás el mismo broker — serás la versión amplificada de ti mismo."
              author="ROVI 🧞"
              delay={0.3}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-6 md:mt-8 text-center"
            >
              <a
                href="https://rovi.crm/auth/register"
                target="_blank"
                rel="noopener noreferrer"
                className="magic-button"
              >
                🚀 Comienza Tu Transformación
              </a>
            </motion.div>
          </div>
        </div>
      </>
    ),
  }

  return slides[slideIndex] || null
}

// ==================== APP PRINCIPAL ====================

function App() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  const paginate = (newDirection) => {
    setCurrentSlide((prev) => Math.max(0, Math.min(6, prev + newDirection)))
  }

  const goToSlide = (index) => {
    setDirection(index > currentSlide ? 1 : -1)
    setCurrentSlide(index)
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') paginate(1)
      if (e.key === 'ArrowLeft') paginate(-1)
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Efecto de estrellas
  useEffect(() => {
    const createStar = () => {
      const star = document.createElement('div')
      star.className = 'star'
      star.style.left = Math.random() * 100 + '%'
      star.style.top = Math.random() * 100 + '%'
      star.style.animationDelay = Math.random() * 2 + 's'
      document.body.appendChild(star)
      setTimeout(() => star.remove(), 4000)
    }
    const interval = setInterval(createStar, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Canvas 3D - Capa 0 */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <Scene3D slideIndex={currentSlide} />
        </Canvas>
      </div>

      {/* Contenido HTML - Capa 1 */}
      <div className="absolute inset-0 z-10">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full relative"
          >
            <SlideContent slideIndex={currentSlide} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación - Capa 2 */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-20 px-4">
        <button
          onClick={() => paginate(-1)}
          disabled={currentSlide === 0}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-full transition-all text-sm md:text-base"
        >
          ←
        </button>

        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all ${
                i === currentSlide ? 'bg-cyan-500 scale-125' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          disabled={currentSlide === 6}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-full transition-all text-sm md:text-base"
        >
          →
        </button>
      </div>

      {/* Progress bar - Capa 2 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / 7) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Indicador - Capa 2 */}
      <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 z-20">
        <span className="magic-title text-white text-sm font-bold">{currentSlide + 1} / 7</span>
      </div>

      {/* Instrucciones - Capa 2 */}
      {currentSlide === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-28 left-0 right-0 text-center text-white/50 text-xs z-20 px-4"
        >
          Flechas ← → o espacio • Arrastra para rotar
        </motion.div>
      )}
    </div>
  )
}

export default App

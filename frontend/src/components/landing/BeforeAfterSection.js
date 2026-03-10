import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, TrendingUp, Calendar, Phone } from 'lucide-react';

export const BeforeAfterSection = () => {
  const [activeTab, setActiveTab] = useState('pipeline');

  const scenarios = [
    {
      id: 'pipeline',
      title: 'Gestión del Pipeline',
      before: {
        icon: <X className="w-6 h-6 text-red-500" />,
        title: 'Desorganizado',
        description: 'Leads en Excel, notas en WhatsApp, sin seguimiento sistemático.',
        painPoints: [
          'Leads que se pierden',
          'Sin visibilidad del proceso',
          'Difícil priorizar',
          'Nadie sabe qué hacer'
        ],
        visual: (
          <div className="bg-red-500/10 rounded-xl p-6 border-2 border-red-500/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-red-500/20 rounded-lg p-3">
                <span className="text-sm">📋 Excel desordenado</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex items-center justify-between bg-red-500/20 rounded-lg p-3">
                <span className="text-sm">💬 WhatsApp perdido</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex items-center justify-between bg-red-500/20 rounded-lg p-3">
                <span className="text-sm">📝 Notas en papel</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>
        )
      },
      after: {
        icon: <Check className="w-6 h-6 text-emerald-500" />,
        title: 'Pipeline Visual',
        description: 'Kanban con arrastrar y soltar, estados claros, seguimiento automático.',
        benefits: [
          'Leads organizados',
          'Visibilidad total',
          'IA prioriza automáticamente',
          'Próxima acción clara'
        ],
        visual: (
          <div className="bg-emerald-500/10 rounded-xl p-6 border-2 border-emerald-500/30">
            <div className="grid grid-cols-4 gap-2">
              {['Nuevo', 'Contactado', 'Calificado', 'Cerrado'].map((stage, i) => (
                <div key={stage} className="text-center">
                  <div className="text-xs font-semibold mb-2">{stage}</div>
                  <div className="space-y-1">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-8 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 rounded flex items-center justify-center text-xs">
                        🏠
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    },
    {
      id: 'followup',
      title: 'Seguimiento de Leads',
      before: {
        icon: <X className="w-6 h-6 text-red-500" />,
        title: 'Manual y Olvidadizo',
        description: 'El broker llama cuando recuerda, pierde el 60% por falta de seguimiento.',
        painPoints: [
          'Olvidas llamar',
          'Sin recordatorios',
          'Leads se enfrían',
          'Perd oportunidades'
        ],
        visual: (
          <div className="bg-red-500/10 rounded-xl p-6 border-2 border-red-500/30">
            <div className="space-y-2">
              <div className="text-center text-sm text-red-500">⏰ Se olvidaron 47 leads</div>
              <div className="text-center text-sm text-red-500">📞 Sin seguimiento sistemtico</div>
              <div className="text-center text-sm text-red-500">😫 Demasiado trabajo manual</div>
            </div>
          </div>
        )
      },
      after: {
        icon: <Check className="w-6 h-6 text-emerald-500" />,
        title: 'Automatizado 24/7',
        description: 'WhatsApp, Email y SMS automáticos. IA llama y agenda citas.',
        benefits: [
          '100% de leads contactados',
          'Seguimiento sin esfuerzo',
          'IA agenda citas',
          'Nunca olvidas un lead'
        ],
        visual: (
          <div className="bg-emerald-500/10 rounded-xl p-6 border-2 border-emerald-500/30">
            <div className="space-y-2">
              <div className="flex items-center justify-center text-sm text-emerald-600">
                <Phone className="w-4 h-4 mr-2" />
                Llamada IA automtica
              </div>
              <div className="flex items-center justify-center text-sm text-emerald-600">
                💬 WhatsApp automtico
              </div>
              <div className="flex items-center justify-center text-sm text-emerald-600">
                📧 Email secuencial
              </div>
              <div className="text-center text-sm font-semibold text-emerald-600 mt-3">
                +300% contactos efectivos
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: 'team',
      title: 'Productividad del Equipo',
      before: {
        icon: <X className="w-6 h-6 text-red-500" />,
        title: 'Sin Motivacin',
        description: 'Brokers desmotivados, sin competencia sana, baja productividad.',
        painPoints: [
          'No hay medicin',
          'Sin incentivos',
          'Bajo rendimiento',
          'Difcil gestionar'
        ],
        visual: (
          <div className="bg-red-500/10 rounded-xl p-6 border-2 border-red-500/30">
            <div className="text-center space-y-3">
              <div className="text-red-500 font-bold">Productividad Baja</div>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl">😴</div>
                  <div className="text-xs">Broker 1</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">😐</div>
                  <div className="text-xs">Broker 2</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">😕</div>
                  <div className="text-xs">Broker 3</div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      after: {
        icon: <Check className="w-6 h-6 text-emerald-500" />,
        title: 'Gamificado y Motivado',
        description: 'Leaderboards, puntos, medallas. Tu equipo compite por ser #1.',
        benefits: [
          '127% ms productividad',
          'Competencia sana',
          'Motivacin diaria',
          'Fcil de gestionar'
        ],
        visual: (
          <div className="bg-emerald-500/10 rounded-xl p-6 border-2 border-emerald-500/30">
            <div className="text-center space-y-3">
              <div className="text-emerald-600 font-bold">Leaderboard Activo</div>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl">🥇</div>
                  <div className="text-xs font-bold">450 pts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🥈</div>
                  <div className="text-xs font-bold">380 pts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🥉</div>
                  <div className="text-xs font-bold">320 pts</div>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto" />
            </div>
          </div>
        )
      }
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            ANTES VS DESPUÉS
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            La diferencia es
            <span className="text-primary"> abrumadora</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Mira cómo Rovi transforma completamente tu proceso de ventas inmobiliarias.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center gap-4 mb-12 flex-wrap"
        >
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setActiveTab(scenario.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === scenario.id
                  ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {scenario.title}
            </button>
          ))}
        </motion.div>

        {/* Comparison */}
        <AnimatePresence mode="wait">
          {scenarios.map((scenario) => (
            activeTab === scenario.id && (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Before */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ANTES
                    </div>
                    <div className="bg-card rounded-3xl p-8 border-2 border-red-500/30 h-full">
                      <div className="flex items-center mb-4">
                        {scenario.before.icon}
                        <h3 className="text-2xl font-bold ml-3">{scenario.before.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-6">{scenario.before.description}</p>
                      {scenario.before.visual}
                      <ul className="mt-6 space-y-2">
                        {scenario.before.painPoints.map((point, i) => (
                          <li key={i} className="flex items-center text-sm text-red-500">
                            <X className="w-4 h-4 mr-2" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>

                  {/* After */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      CON ROVI
                    </div>
                    <div className="bg-card rounded-3xl p-8 border-2 border-emerald-500/30 h-full">
                      <div className="flex items-center mb-4">
                        {scenario.after.icon}
                        <h3 className="text-2xl font-bold ml-3">{scenario.after.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-6">{scenario.after.description}</p>
                      {scenario.after.visual}
                      <ul className="mt-6 space-y-2">
                        {scenario.after.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center text-sm text-emerald-600">
                            <Check className="w-4 h-4 mr-2" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Improvement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/30 rounded-full px-8 py-4">
            <TrendingUp className="w-6 h-6 text-emerald-500 mr-3" />
            <span className="text-lg font-bold">
              {activeTab === 'pipeline' && '+200% organizacin'}
              {activeTab === 'followup' && '+300% ms contactos'}
              {activeTab === 'team' && '+127% productividad'}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

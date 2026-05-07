import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, ArrowRight, AlertCircle } from 'lucide-react';

export const BrokerComparisonSection = () => {
  const comparisons = [
    {
      category: 'Gestión de Leads',
      before: [
        'Leads desorganizados en múltiples lugares',
        'Sin saber cuáles son calificados',
        'Olvidas dar seguimiento por días',
        'Sin historial de interacciones',
        'Difícil saber qué propiedades mostrar'
      ],
      after: [
        'Todos los leads en un solo lugar',
        'IA pre-califica por intención de compra',
        'Calendarización automática de seguimientos',
        'Historial completo de cada conversación',
        'Sugerencias de propiedades por perfil'
      ]
    },
    {
      category: 'Tiempo y Productividad',
      before: [
        '10+ horas semanales en tareas admin',
        'Respuestas lentas a nuevos leads',
        'Sin tiempo para prospección',
        'Trabajando hasta tarde organizando',
        'Estrés por sentir que siempre vas atrás'
      ],
      after: [
        'Ahorra 15+ horas semanales',
        'IA responde en segundos, 24/7',
        'Tiempo para enfocarte en cerrar',
        'Todo organizado automáticamente',
        'Tranquilidad sabiendo que nada se olvida'
      ]
    },
    {
      category: 'Venta y Conversión',
      before: [
        'Sin proceso de venta estructurado',
        'Scripts que no siempre funcionan',
        'No sabes tu tasa de conversión real',
        'Perdiendo leads por falta de follow-up',
        'Difícil saber qué mejorar'
      ],
      after: [
        'Pipeline visual con etapas claras',
        'Scripts probados que aumentan cierre 45%',
        'KPIs en tiempo real, personalizables',
        'Alertas de leads que requieren atención',
        'IA sugiere mejoras constantemente'
      ]
    },
    {
      category: 'Inventario y Marketing',
      before: [
        'Propiedades desorganizadas',
        'Sin forma profesional de presentar',
        'Sin automatización de marketing',
        'Sin saber qué campañas funcionan',
        'Difícil compartir propiedades'
      ],
      after: [
        'Inventario con SKU y geolocalización',
        'Comparte múltiples propiedades al instante',
        'Campañas automatizadas (email, SMS, llamadas)',
        'Analíticas de cada campaña',
        'Diseño profesional en cada envío'
      ]
    }
  ];

  return (
    <section id="comparacion" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            ANTES Y DESPUÉS
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Tu vida como broker
            <span className="text-primary"> antes y después</span> de Rovi
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            La diferencia real que experimentarán los brokers que se registran en el lanzamiento oficial.
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <div className="space-y-8">
          {comparisons.map((comparison, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-center mb-2">{comparison.category}</h3>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-900">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mr-3">
                      <X className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-red-700 dark:text-red-400">Sin Rovi</h4>
                  </div>
                  <ul className="space-y-3">
                    {comparison.before.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-red-700 dark:text-red-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* After */}
                <div className="bg-[#0D9488]/10 dark:bg-[#0D9488]/20 rounded-2xl p-6 border-2 border-[#0D9488]/30 dark:border-[#0D9488]/50">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center mr-3">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-secondary dark:text-surface-arena-light">Con Rovi</h4>
                  </div>
                  <ul className="space-y-3">
                    {comparison.after.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-secondary mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-[#365314] dark:text-[#0D9488]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-secondary-dark/10 rounded-3xl p-8 border border-primary/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  El cambio real que verás
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Los brokers que usan Rovi pasan de sentirse abrumados y desorganizados
                  a tener un proceso de venta estructurado, más tiempo libre y, lo más importante,
                  más ventas cerradas cada mes.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">3x</div>
                  <div className="text-sm text-muted-foreground">Más conversiones</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">15h</div>
                  <div className="text-sm text-muted-foreground">Ahorradas/semana</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">95%</div>
                  <div className="text-sm text-muted-foreground">Leads organizados</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">IA trabajando</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a
            href="#registro"
            className="inline-flex items-center bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition transform hover:scale-105"
          >
            Quiero estos resultados
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

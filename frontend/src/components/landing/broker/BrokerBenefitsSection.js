import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock, TrendingUp, Target, Zap, Shield, Users, MessageSquare } from 'lucide-react';

export const BrokerBenefitsSection = () => {
  const benefitCategories = [
    {
      title: 'Ahorra Tiempo Todos los Días',
      icon: Clock,
      description: 'Recupera más de 10 horas semanales',
      benefits: [
        {
          title: 'Automatización de tareas repetitivas',
          description: 'La IA se encarga del primer contacto, calificación y seguimiento inicial de tus leads. Tú solo te enfocas en cerrar ventas.',
          impact: 'Ahorra 15+ horas a la semana'
        },
        {
          title: 'Importación inteligente de contactos',
          description: 'Arrastra tu archivo CSV o conéctalo desde otro CRM. Rovi organiza automáticamente tus contactos y te sugiere cuáles contactar primero.',
          impact: 'Setup en menos de 10 minutos'
        },
        {
          title: 'Calendarización automática',
          description: 'Todas las actividades obligatoriamente se pueden calendarizar. El sistema te recuerda y te conecta con la IA para agendar.',
          impact: 'Nunca más olvides un seguimiento'
        }
      ]
    },
    {
      title: 'Cierra Más Ventas',
      icon: TrendingUp,
      description: 'Aumenta tu tasa de conversión hasta 3x',
      benefits: [
        {
          title: 'Leads pre-calificados por IA',
          description: 'El sistema analiza intención de compra, presupuesto y nivel de interés. Solo inviertes tiempo en leads que realmente quieren comprar.',
          impact: '+300% en conversión de leads'
        },
        {
          title: 'Scripts de venta probados',
          description: 'Plantillas de apertura, seguimiento y presentación que funcionan. Personalizables para tu estilo y cada tipo de cliente.',
          impact: '+45% en tasa de cierre'
        },
        {
          title: 'Inbox omnicanal con prioridades',
          description: 'WhatsApp, correo y Telegram en un solo lugar. El sistema destaca los chats no contestados que necesitan atención inmediata.',
          impact: 'Respuesta 5x más rápida'
        }
      ]
    },
    {
      title: 'Control Total de Tu Negocio',
      icon: Target,
      description: 'Toma decisiones basadas en datos',
      benefits: [
        {
          title: 'Dashboard del día a día',
          description: 'No solo ventas cerradas. Ve estatus de cualificación, actividades programadas, calendario integrado y prioridades del día.',
          impact: 'Visibilidad total de tu pipeline'
        },
        {
          title: 'KPIs personalizables',
          description: 'Define tus metas reales con tu líder o desarrollador. Modifica tus KPIs cuando quieras para reflejar tus acuerdos.',
          impact: 'Metas alineadas a tu realidad'
        },
        {
          title: 'Calendario con vista de estrategia',
          description: 'Ordena tus prioridades del día y la semana por niveles de estrategia. Incluye vista de tabla para planificación detallada.',
          impact: 'Planificación estratégica diaria'
        }
      ]
    },
    {
      title: 'Inventario Siempre Organizado',
      icon: Shield,
      description: 'Tus propiedades profesionales y listas para compartir',
      benefits: [
        {
          title: 'SKU único para cada propiedad',
          description: 'Olvídate del desorden. Cada inmueble tiene su identificador único. Clasifícalo por venta, renta o subarrendamiento.',
          impact: 'Catálogo profesional'
        },
        {
          title: 'Geolocalización con mapas',
          description: 'Cada propiedad muestra su ubicación en Google Maps. Tú y tus clients identifican visualmente la zona al instante.',
          impact: 'Mejor experiencia para clientes'
        },
        {
          title: 'Compartición masiva de propiedades',
          description: 'Selecciona múltiples propiedades y envíalas por correo o mensajería con diseño preestablecido. Incluye thumbnails profesionales.',
          impact: 'Presentación impecable en segundos'
        }
      ]
    }
  ];

  return (
    <section id="beneficios" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            BENEFICIOS REALES
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Resultados que verás desde el
            <span className="text-primary"> primer mes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            No es solo software, es una transformación de cómo trabajas como broker independiente.
            Estos son los beneficios que obtendrás desde el día 1.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid gap-8">
          {benefitCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="bg-card rounded-3xl p-8 border border-border shadow-lg">
                {/* Category Header */}
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0 mr-6">
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold mb-2">{category.title}</h3>
                    <p className="text-muted-foreground text-lg">{category.description}</p>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="grid md:grid-cols-3 gap-6">
                  {category.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="bg-background rounded-xl p-6 border border-border">
                      <h4 className="font-bold text-lg mb-3 flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-1" />
                        {benefit.title}
                      </h4>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        {benefit.description}
                      </p>
                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="flex items-center text-primary font-semibold text-sm">
                          <Zap className="w-4 h-4 mr-2" />
                          {benefit.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: '10+', label: 'Horas ahorradas por semana', icon: Clock },
              { value: '3x', label: 'Más conversiones', icon: TrendingUp },
              { value: '95%', label: 'Leads organizados', icon: Target },
              { value: '24/7', label: 'IA trabajando por ti', icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border text-center hover:border-primary/50 transition">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <a
            href="#registro"
            className="inline-flex items-center hover-accent bg-[#00D9FF] text-[#0F172A] px-8 py-4 rounded-full font-semibold text-lg transition transform hover:scale-105"
          >
            Quiero estos beneficios
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            Únete a la lista de espera del lanzamiento oficial
          </p>
        </motion.div>
      </div>
    </section>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Phone, Mail, Calendar, Users, Trophy,
  Target, Zap, Bot, BarChart3, Smartphone, Shield,
  ChevronRight
} from 'lucide-react';

export const FeaturesSection = () => {
  const categories = [
    {
      title: 'Gestión de Leads',
      description: 'Captura, califica y convierte más leads con herramientas inteligentes',
      icon: Target,
      color: 'from-teal-500 to-teal-600',
      features: [
        { icon: MessageSquare, title: 'Omnicanalidad', desc: 'WhatsApp, Email, SMS y Llamadas en un solo lugar' },
        { icon: Bot, title: 'IA Calificadora', desc: 'Analiza intención de compra automáticamente' },
        { icon: Zap, title: 'Respuesta Rápida', desc: 'Automatiza primeros contactos en segundos' },
        { icon: BarChart3, title: 'Pipeline Visual', desc: 'Kanban arrastrable con etapas personalizables' },
      ]
    },
    {
      title: 'Automatización de Ventas',
      description: 'Deja que la IA trabaje por ti mientras cierras más ventas',
      icon: Bot,
      color: 'from-amber-500 to-amber-600',
      features: [
        { icon: Phone, title: 'Llamadas IA', desc: 'VAPI integra llamadas automáticas con IA' },
        { icon: Mail, title: 'Email Marketing', desc: 'Campañas personalizadas con SendGrid' },
        { icon: MessageSquare, title: 'SMS Masivos', desc: 'Twilio integrado para broadcast de mensajes' },
        { icon: Calendar, title: 'Agenda Inteligente', desc: 'Sincronización con Google Calendar' },
      ]
    },
    {
      title: 'Gamificación & Equipos',
      description: 'Motiva a tu equipo y mejora el rendimiento con competencia sana',
      icon: Trophy,
      color: 'from-emerald-500 to-emerald-600',
      features: [
        { icon: Trophy, title: 'Leaderboards', desc: 'Rankings mensuales por broker y equipo' },
        { icon: Target, title: 'Metas Claras', desc: 'Define y trackea objetivos de venta' },
        { icon: Users, title: 'Equipos', desc: 'Gestiona brokers individuales o agencias completas' },
        { icon: Zap, title: 'Puntos & Recompensas', desc: 'Sistema de puntos por cada actividad' },
      ]
    },
    {
      title: 'Analítica & Insights',
      description: 'Toma decisiones basadas en datos con dashboards en tiempo real',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      features: [
        { icon: BarChart3, title: 'KPIs en Vivo', desc: 'Ventas, conversión y tickets promedio' },
        { icon: Target, title: 'Predicción de Ventas', desc: 'IA que estima probabilidad de cierre' },
        { icon: Smartphone, title: 'Móvil First', desc: 'Accede desde cualquier dispositivo' },
        { icon: Shield, title: 'Datos Seguros', desc: 'Multi-tenant con aislamiento total' },
      ]
    },
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            FUNCIONALIDADES
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Todo lo que necesitas para
            <span className="text-primary"> vender más</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Un suite completo de herramientas diseñadas específicamente para el mercado
            inmobiliario de alto valor en México y Latinoamérica.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-3xl p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                {/* Category Header */}
                <div className="flex items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0 mr-4`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  {category.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (categoryIndex * 0.1) + (featureIndex * 0.05) }}
                      className="flex items-start p-3 rounded-xl hover:bg-muted/50 transition group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mr-4 group-hover/item:bg-primary/20 transition">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 group-hover/item:text-primary transition">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <button className="w-full mt-6 py-3 text-primary font-semibold hover:bg-primary/5 rounded-xl transition flex items-center justify-center group/btn">
                  Explorar {category.title.toLowerCase()}
                  <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

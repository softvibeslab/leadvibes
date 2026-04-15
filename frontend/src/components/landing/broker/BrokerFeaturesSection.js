import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Phone, Mail, Calendar, Users, Target,
  Zap, Bot, BarChart3, Smartphone, Home, MapPin,
  FolderOpen, Megaphone, Bell, Inbox, FileText, Settings
} from 'lucide-react';

export const BrokerFeaturesSection = () => {
  const modules = [
    {
      title: 'Onboarding Inteligente',
      description: 'Configuración personalizada que entiende tu negocio',
      icon: Settings,
      color: 'from-[#0A4DAF] to-[#062B5F]',
      features: [
        'Perfilado profundo: ventas, apartados, ingresos objetivos',
        'KPIs flexibles y 100% personalizables',
        'Conexión fácil de APIs (Google, VAPI, Twilio)',
        'Preguntas sobre expertise y áreas de mejora',
        'Metas adaptadas a tu periodo de medición'
      ]
    },
    {
      title: 'Dashboard del Día a Día',
      description: 'Lo que necesitas ver, cuando lo necesitas',
      icon: BarChart3,
      color: 'from-[#00D9FF] to-[#0A4DAF]',
      features: [
        'Visibilidad operativa de tus leads y actividades',
        'Calendario integrado con prioridades del día',
        'Insights de IA con propuestas de mejora',
        'Leads mejor cualificados destacados',
        'Importación guiada con plantilla .CSV'
      ]
    },
    {
      title: 'Pipeline de Leads',
      description: 'Gestión visual con inteligencia artificial',
      icon: Target,
      color: 'from-[#10B981] to-[#059669]',
      features: [
        'Vista Kanban con arrastrar y soltar',
        'Datos modificables por IA y manualmente',
        'Crear propiedades al agregar nuevo lead',
        'Hasta 3 propiedades custom gratuitas',
        'Actividades con calendarización obligatoria'
      ]
    },
    {
      title: 'Inventario de Propiedades',
      description: 'Tu catálogo de inmuebles siempre organizado',
      icon: Home,
      color: 'from-[#7C3AED] to-[#6D28D9]',
      features: [
        'Clasificación: venta, renta, subarrendamiento',
        'SKU único para cada propiedad',
        'Geolocalización con Google Maps',
        'Repositorio de imágenes con thumbnails',
        'Compartición masiva de propiedades',
        'Importar/exportar con plantilla'
      ]
    },
    {
      title: 'Campañas y Automatizaciones',
      description: 'Marketing automatizado que funciona',
      icon: Megaphone,
      color: 'from-[#0A4DAF] to-[#062B5F]',
      features: [
        'Llamadas masivas con IA (VAPI)',
        'SMS masivos (Twilio)',
        'Email marketing personalizado',
        'Vista de tabla para evitar desorden',
        'Columnas: apertura, rebote, respuestas',
        'Free trial: 4 plantillas, 100 contactos'
      ]
    },
    {
      title: 'Inbox Omnicanal',
      description: 'Todas tus conversaciones en un solo lugar',
      icon: Inbox,
      color: 'from-[#00D9FF] to-[#7C3AED]',
      features: [
        'WhatsApp, correo, Telegram unificados',
        'Panel de IA con recomendaciones',
        'Filtro "No contestado" para priorizar',
        'Almacenamiento total de conversaciones',
        'Top leads destacados por IA'
      ]
    },
    {
      title: 'Analíticas Integradas',
      description: 'Conecta y mide todo en un solo dashboard',
      icon: BarChart3,
      color: 'from-[#7C3AED] to-[#0A4DAF]',
      features: [
        'Google Ads, Facebook, etc.',
        'Reportes de rendimiento por campaña',
        'Métricas agrupadas por etiquetas',
        'Análisis de ROI por canal'
      ]
    },
    {
      title: 'Scripts de Venta',
      description: 'Plantillas probadas que funcionan',
      icon: FileText,
      color: 'from-[#F59E0B] to-[#D97706]',
      features: [
        'Scripts de apertura, seguimiento, presentación',
        'Editor de diseño de correos',
        'Variables personalizables',
        'A/B testing de mensajes'
      ]
    }
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
            MÓDULOS EXCLUSIVOS PARA BROKERS
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Todo lo que necesitas como
            <span className="text-primary"> broker independiente</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            8 módulos diseñados específicamente para los desafíos de los agentes inmobiliarios independientes.
            Sin complejidades innecesarias, solo herramientas que sí funcionan.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl shadow-primary/20 h-full">
                {/* Module Header */}
                <div className="flex items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0 mr-4`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2">
                  {module.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button className="w-full mt-4 py-2 text-primary font-semibold hover:bg-primary/10 rounded-lg transition-all duration-300 text-sm flex items-center justify-center group/btn opacity-0 group-hover:opacity-100">
                  Ver más detalles
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary/10 via-teal-600/10 to-emerald-600/10 rounded-3xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">
              ¿Listo para transformar tu proceso de ventas?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Únete a la lista de espera del lanzamiento oficial y obtén acceso prioritario
              a todas estas funcionalidades diseñadas para brokers independientes.
            </p>
            <a
              href="#registro"
              className="inline-block bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white px-8 py-3 rounded-full font-semibold transition transform hover:scale-105"
            >
              Registrarme Ahora
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

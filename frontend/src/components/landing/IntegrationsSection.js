import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

export const IntegrationsSection = () => {
  const [activeIntegration, setActiveIntegration] = useState(null);

  const integrations = [
    {
      name: 'Google Calendar',
      icon: '📅',
      desc: 'Sincronización OAuth2 bidireccional',
      features: ['Agenda en tiempo real', 'Eventos sincronizados', 'Invitaciones automáticas'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'SendGrid',
      icon: '📧',
      desc: 'Email marketing con plantillas',
      features: ['Campañas masivas', 'Editor drag & drop', 'Tracking de aperturas'],
      color: 'from-teal-500 to-teal-600'
    },
    {
      name: 'Twilio',
      icon: '💬',
      desc: 'SMS masivo programable',
      features: ['Envío masivo', 'SMS programados', 'Respuestas automatizadas'],
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'VAPI',
      icon: '🤖',
      desc: 'Llamadas IA con transcripción',
      features: ['Llamadas automáticas', 'Transcripción en vivo', 'Análisis de sentimiento'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'WhatsApp',
      icon: '📱',
      desc: 'Conexión directa con clientes',
      features: ['Enlaces directos', 'Plantillas de mensaje', 'Seguimiento automático'],
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'OpenAI',
      icon: '🧠',
      desc: 'IA para análisis de leads',
      features: ['Score de intención', 'Sentimiento', 'Recomendaciones'],
      color: 'from-amber-500 to-amber-600'
    },
    {
      name: 'n8n',
      icon: '⚡',
      desc: 'Automatización de workflows',
      features: ['Workflows visuales', 'Conectores ilimitados', 'Ejecución programada'],
      color: 'from-orange-500 to-orange-600'
    },
    {
      name: 'Meta Ads',
      icon: '📣',
      desc: 'Leads de Facebook & Instagram',
      features: ['Importación automática', 'Mapeo de campos', 'Lead sync en tiempo real'],
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <section id="integrations" className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            INTEGRACIONES
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Conectado con tus herramientas
            <span className="text-primary"> favoritas</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Rovi se integra con las mejores plataformas del mercado para que tengas todo en un solo lugar.
          </p>
        </motion.div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group"
              onMouseEnter={() => setActiveIntegration(index)}
              onMouseLeave={() => setActiveIntegration(null)}
            >
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
                  {integration.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{integration.name}</h3>
                <p className="text-sm text-muted-foreground">{integration.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Featured Integration Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary/10 via-teal-600/10 to-emerald-600/10 rounded-3xl p-8 md:p-12 border border-primary/20"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Zap className="w-4 h-4 mr-2" />
                Destacado
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Integración con VAPI: Llamadas IA que cierran ventas
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Nuestra integración con VAPI permite que la IA realice llamadas telefónicas automáticas,
                transcriba conversaciones, analice sentimiento y extraiga próximos pasos.
              </p>
              <ul className="space-y-3">
                {[
                  'Llamadas automáticas a leads fríos',
                  'Transcripción en tiempo real',
                  'Análisis de sentimiento y objeciones',
                  'Extracción automática de acción'
                ].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="w-5 h-5 text-primary mr-3" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl mr-3">
                  🤖
                </div>
                <div>
                  <div className="font-bold">VAPI + Rovi</div>
                  <div className="text-sm text-muted-foreground">Llamadas IA Integradas</div>
                </div>
              </div>
              {/* Simulated Call Interface */}
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">AI</div>
                  <div className="bg-card rounded-lg p-3 text-sm flex-1">
                    <p>"Hola, te llamo de Tulum Premier sobre la propiedad que viste..."</p>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Transcribiendo...
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-500/20 text-emerald-500 rounded-lg p-2">
                    <div className="font-bold">Sentimiento</div>
                    <div>Positivo</div>
                  </div>
                  <div className="bg-blue-500/20 text-blue-500 rounded-lg p-2">
                    <div className="font-bold">Interés</div>
                    <div>Alto (85%)</div>
                  </div>
                  <div className="bg-amber-500/20 text-amber-500 rounded-lg p-2">
                    <div className="font-bold">Acción</div>
                    <div>Agendar visita</div>
                  </div>
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
          <p className="text-muted-foreground mb-6">
            ¿Necesitas una integración personalizada?
          </p>
          <a
            href="#demo-request"
            className="inline-flex items-center text-primary font-semibold hover:underline"
          >
            Contáctanos para hablar de integraciones enterprise
          </a>
        </motion.div>
      </div>
    </section>
  );
};

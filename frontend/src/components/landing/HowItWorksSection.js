import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      step: 1,
      title: 'Importa tus Leads',
      desc: 'Sube tu archivo CSV/Excel o conecta tus fuentes de publicidad',
      detail: 'Importa desde Facebook Ads, Google Ads, Instagram, o cualquier otro CRM en segundos.',
      icon: '📥',
      time: '2 min',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: 2,
      title: 'La IA los Analiza',
      desc: 'Obtén score de intención, sentimiento y recomendaciones',
      detail: 'Nuestra IA analiza cada lead y te dice exactamente quién priorizar, cuándo contactar y qué decir.',
      icon: '🧠',
      time: 'Automático',
      color: 'from-purple-500 to-pink-500'
    },
    {
      step: 3,
      title: 'Automatiza Seguimiento',
      desc: 'WhatsApp, Email, SMS y Llamadas IA se activan solas',
      detail: 'Configura secuencias automáticas que nunca pierden un lead. El sistema trabaja 24/7 por ti.',
      icon: '⚡',
      time: 'Configura 1 vez',
      color: 'from-amber-500 to-orange-500'
    },
    {
      step: 4,
      title: 'Cierra Más Ventas',
      desc: 'Dashboard claro, gamificación y scripts probados',
      detail: 'Motiva a tu equipo con leaderboards, usa scripts de ventas validados y cierra más rápido.',
      icon: '🏆',
      time: 'Desde el primer día',
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            CÓMO FUNCIONA
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            De lead a venta en
            <span className="text-primary"> 4 pasos simples</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Configura Rovi en menos de 30 minutos y empieza a cerrar más ventas el mismo día.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 to-emerald-500 transform -translate-y-1/2 z-0" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Card */}
                <div className="bg-card rounded-3xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl h-full">
                  {/* Step Number */}
                  <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} items-center justify-center text-white font-bold text-lg mb-4`}>
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-3">{step.icon}</div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>

                  {/* Description */}
                  <p className="text-muted-foreground mb-4">{step.desc}</p>

                  {/* Detail */}
                  <p className="text-sm text-muted-foreground/70 mb-4">{step.detail}</p>

                  {/* Time Badge */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {step.time}
                  </div>
                </div>

                {/* Arrow (not for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2 z-20">
                    <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 grid md:grid-cols-3 gap-8"
        >
          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-bold mb-2">Configuración en 30 min</h4>
            <p className="text-sm text-muted-foreground">Sin conocimientos técnicos necesarios</p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-bold mb-2">IA ya entrenada</h4>
            <p className="text-sm text-muted-foreground">Optimizada para mercado inmobiliario mexicano</p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-bold mb-2">Resultados desde el día 1</h4>
            <p className="text-sm text-muted-foreground">Ve el impacto inmediatamente</p>
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
            href="#demo-request"
            className="inline-flex items-center bg-gradient-to-r from-primary to-teal-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Comenzar Ahora - Es Gratis
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            14 días gratis • Sin tarjeta de crédito
          </p>
        </motion.div>
      </div>
    </section>
  );
};

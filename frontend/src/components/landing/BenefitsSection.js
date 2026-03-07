import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, Target, DollarSign, Award } from 'lucide-react';

export const BenefitsSection = () => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { icon: TrendingUp, value: '45%', label: 'Aumento en conversión', desc: 'Promedio en los primeros 3 meses' },
    { icon: Clock, value: '3.5h', label: 'Ahorradas por día', desc: 'En tareas administrativas' },
    { icon: Users, value: '2,500+', label: 'Brokers activos', desc: 'Usando Rovi CRM diariamente' },
    { icon: Target, value: '89%', label: 'Tasa de retención', desc: 'Clientes que renuevan anualmente' },
    { icon: DollarSign, value: '$500M', label: 'En ventas gestionadas', desc: 'Volumen total anual en plataforma' },
    { icon: Award, value: '#1', label: 'CRM inmobiliario', desc: 'En México y Latinoamérica' },
  ];

  const benefits = [
    {
      title: 'Acelera tu Ciclo de Venta',
      description: 'Reduce el tiempo de primer contacto de horas a segundos con automatización inteligente.',
      icon: '⚡',
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
      insights: ['Respuesta en < 5 minutos', '2x más reuniones agendadas', '35% más cierres']
    },
    {
      title: 'Nunca Pierdas un Lead',
      description: 'Seguimiento automático por WhatsApp, Email y SMS hasta que el cliente responda.',
      icon: '🎯',
      color: 'from-teal-500/20 to-emerald-500/20',
      borderColor: 'border-teal-500/30',
      insights: ['100% de leads contactados', 'Alertas de leads fríos', 'Reactivación automática']
    },
    {
      title: 'CIerra con Datos, no con Suerte',
      description: 'La IA analiza cada lead y te dice exactamente qué decir y cuándo contactarlo.',
      icon: '🧠',
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      insights: ['Score de intención 95% preciso', 'Scripts personalizados', 'Mejor momento de contacto']
    },
    {
      title: 'Motiva a tu Equipo',
      description: 'Gamificación que funciona: leaderboards, puntos y recompensas en tiempo real.',
      icon: '🏆',
      color: 'from-emerald-500/20 to-green-500/20',
      borderColor: 'border-emerald-500/30',
      insights: ['3x más actividad', '+127% produtividad', 'Competencia sana']
    },
  ];

  return (
    <section id="benefits" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-4">
            RESULTADOS COMPROBADOS
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Por qué las inmobiliarias
            <span className="text-accent"> eligen Rovi</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            No es solo otro CRM. Es una plataforma de crecimiento diseñada específicamente
            para el mercado inmobiliario de alto valor.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 text-center border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="font-semibold text-sm mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className={`bg-gradient-to-br ${benefit.color} rounded-3xl p-8 border ${benefit.borderColor} hover:border-primary/50 transition-all duration-300 h-full`}>
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground mb-6">{benefit.description}</p>

                <div className="space-y-3">
                  {benefit.insights.map((insight, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-3" />
                      <span className="text-sm font-medium">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-2xl font-bold text-center mb-10">Rovi vs Otros CRMs</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 font-semibold">Característica</th>
                  <th className="py-4 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 text-white font-bold">
                      R
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center text-muted-foreground">Otros CRMs</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Diseñado para inmobiliarias', true, false],
                  ['IA para análisis de leads', true, false],
                  ['Llamadas automáticas con VAPI', true, false],
                  ['Gamificación incluida', true, false],
                  ['SMS e Email integrados', true, false],
                  ['Sincronización Google Calendar', true, false],
                  ['En español', true, false],
                  ['Soporte en México', true, false],
                ].map(([feature, hasRovi, hasOther], i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition">
                    <td className="py-4 px-6 font-medium">{feature}</td>
                    <td className="py-4 px-6 text-center">
                      {hasRovi ? (
                        <span className="text-emerald-500 text-xl">✓</span>
                      ) : (
                        <span className="text-red-500 text-xl">✗</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {hasOther ? (
                        <span className="text-emerald-500 text-xl">✓</span>
                      ) : (
                        <span className="text-muted-foreground text-xl">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

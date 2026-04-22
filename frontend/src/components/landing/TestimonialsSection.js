import React from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, TrendingUp, Users, Target, Shield, Zap, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection = () => {
  const experiencePoints = [
    {
      icon: Building2,
      title: "Expertos en Real Estate",
      description: "Conocemos profundamente el mercado inmobiliario de alto valor en México. Desarrollamos Rovi entendiendo los desafíos reales de brokers y agencias.",
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      icon: Target,
      title: "Problemas Reales, Soluciones Reales",
      description: "Cada funcionalidad está diseñada para resolver dolores específicos: seguimiento de leads, gestión del pipeline, automatización de comunicaciones y más.",
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30"
    },
    {
      icon: TrendingUp,
      title: "Tecnología que Escala Contigo",
      description: "Desde brokers independientes hasta grandes inmobiliarias con múltiples equipos. Rovi se adapta a tu crecimiento sin complicaciones.",
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30"
    }
  ];

  const whyChooseUs = [
    {
      icon: Zap,
      title: "Innovación Constante",
      desc: "Actualizaciones mensuales con nuevas funcionalidades basadas en feedback del mercado"
    },
    {
      icon: Shield,
      title: "Seguridad Empresarial",
      desc: "Infraestructura robusta con respaldos automáticos y protección de datos"
    },
    {
      icon: Users,
      title: "Soporte Especializado",
      desc: "Equipo que entiende tanto de tecnología como de inmobiliario"
    },
    {
      icon: Award,
      title: "Mejor Valor del Mercado",
      desc: "Functionality premium a precios accesibles para el mercado mexicano"
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
          <span className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-4">
            EXPERIENCIA COMPROBADA
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Por qué elegir
            <span className="text-accent"> Rovi CRM</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Desarrollado por profesionales con más de 10 años de experiencia en tecnología e inmobiliario,
            entendiendo las necesidades reales del mercado mexicano.
          </p>
        </motion.div>

        {/* Main Experience Points */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {experiencePoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`bg-gradient-to-br ${point.color} rounded-3xl p-8 border ${point.borderColor} hover:border-primary/50 transition-all duration-300 h-full`}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6">
                  <point.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{point.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Why Choose Us Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-10">
            Lo que nos diferencia
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mr-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 via-teal-600/10 to-emerald-600/10 rounded-2xl p-8 border border-primary/20"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-1">10+</div>
              <div className="text-muted-foreground">Años en Real Estate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">24/7</div>
              <div className="text-muted-foreground">Soporte Activo</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">99.9%</div>
              <div className="text-muted-foreground">Uptime Garantizado</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">MX</div>
              <div className="text-muted-foreground">Hecho en México</div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-xl text-muted-foreground mb-6">
            Descubre cómo Rovi puede transformar tu proceso de ventas
          </p>
          <a
            href="#demo-request"
            className="inline-flex items-center bg-gradient-to-r from-primary to-teal-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Solicita tu Demo Gratis
          </a>
        </motion.div>
      </div>
    </section>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Phone, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UseCasesSection = () => {
  const useCases = [
    {
      title: 'Broker Individual',
      subtitle: 'Para agentes independientes',
      icon: User,
      color: 'from-blue-500 to-cyan-500',
      bgPattern: 'bg-blue-500/10',
      quote: 'Antes perdía el 40% de mis leads por no dar seguimiento. Ahora Rovi lo hace por mí.',
      author: 'Carlos Mendoza',
      role: 'Broker Independiente, Tulum',
      image: '👤',
      features: [
        { label: 'Gestión de leads personal', included: true },
        { label: 'Pipeline visual', included: true },
        { label: 'IA para análisis', included: true },
        { label: 'Calendario integrado', included: true },
        { label: 'Campañas de marketing', included: true },
        { label: 'Leaderboards de equipo', included: false },
        { label: 'Gestión de múltiples brokers', included: false },
        { label: 'Reportes de equipo', included: false },
      ],
      cta: 'Perfecto para mí',
      price: 'Desde $1,490 MXN/mes'
    },
    {
      title: 'Agencia Inmobiliaria',
      subtitle: 'Para equipos de ventas',
      icon: Building2,
      color: 'from-emerald-500 to-teal-500',
      bgPattern: 'bg-emerald-500/10',
      quote: 'Nuestra productividad aumentó 127% en el primer trimestre. Los brokers aman la gamificación.',
      author: 'María González',
      role: 'Directora de Ventas, Caribe Realty',
      image: '🏢',
      features: [
        { label: 'Gestión de leads personal', included: true },
        { label: 'Pipeline visual', included: true },
        { label: 'IA para análisis', included: true },
        { label: 'Calendario integrado', included: true },
        { label: 'Campañas de marketing', included: true },
        { label: 'Leaderboards de equipo', included: true },
        { label: 'Gestión de múltiples brokers', included: true },
        { label: 'Reportes de equipo', included: true },
      ],
      cta: 'Perfecto para mi equipo',
      price: 'Desde $4,990 MXN/mes',
      popular: true
    },
    {
      title: 'Desarrollador Inmobiliario',
      subtitle: 'Para proyectos con ventas internas',
      icon: Building2,
      color: 'from-amber-500 to-orange-500',
      bgPattern: 'bg-amber-500/10',
      quote: 'Rovi nos ayudó a vender el 80% de Phase 1 en 4 meses. La integración de IA es increíble.',
      author: 'Roberto Hernández',
      role: 'Director Comercial, Mayan Developments',
      image: '🏗️',
      features: [
        { label: 'Todo lo de Agencia', included: true },
        { label: 'Integración con ERP', included: true },
        { label: 'Gestión de inventario', included: true },
        { label: 'Reportes ejecutivos', included: true },
        { label: 'API personalizada', included: true },
        { label: 'Soporte prioritario', included: true },
        { label: 'Entrenamiento in-situ', included: true },
        { label: 'SLA garantizado', included: true },
      ],
      cta: 'Contactar ventas',
      price: 'Cotización personalizada'
    },
  ];

  const scenarios = [
    {
      icon: Phone,
      title: 'Seguimiento Automático',
      before: 'El broker llama manualmente a cada lead, pierde el 60% por falta de tiempo.',
      after: 'Rovi envía WhatsApp automático, agenda llamadas con IA y neverca un lead.',
      improvement: '300% más contactos'
    },
    {
      icon: Zap,
      title: 'Calificación de Leads',
      before: 'Todos los leads parecen iguales. Se pierde tiempo con curiosos.',
      after: 'La IA analiza y puntúa cada lead. Sabes exactamente a quién priorizar.',
      improvement: '2x más cierres'
    },
    {
      icon: CheckCircle2,
      title: 'Cierre de Ventas',
      before: 'Proceso manual, desorganizado, sin seguimiento post-venta.',
      after: 'Pipeline completo desde primer contacto hasta escrituración.',
      improvement: '45% menos tiempo de cierre'
    },
  ];

  return (
    <section id="use-cases" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            CASOS DE USO
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Soluciones para cada tipo de
            <span className="text-primary"> negocio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ya seas un broker independiente o una gran inmobiliaria, Rovi se adapta a tus necesidades.
          </p>
        </motion.div>

        {/* Scenarios */}
        <div className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl p-6 border border-border h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mb-4">
                    <scenario.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{scenario.title}</h3>

                  <div className="space-y-4">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-xs text-red-500 font-semibold mb-1">ANTES</div>
                      <p className="text-sm text-muted-foreground">{scenario.before}</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="text-xs text-emerald-500 font-semibold mb-1">CON ROVI</div>
                      <p className="text-sm text-muted-foreground">{scenario.after}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <span className="text-primary font-semibold">{scenario.improvement}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Plans/Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {useCase.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
              )}

              <div className={`bg-card rounded-3xl p-8 border ${useCase.popular ? 'border-primary shadow-xl' : 'border-border'} h-full flex flex-col`}>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.color} items-center justify-center text-3xl mb-4`}>
                    {useCase.image}
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{useCase.title}</h3>
                  <p className="text-muted-foreground">{useCase.subtitle}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold">{useCase.price}</div>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-6">
                  {useCase.features.map((feature, i) => (
                    <div key={i} className="flex items-center">
                      {feature.included ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 mr-3 flex-shrink-0 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-muted" />
                        </div>
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="bg-muted/30 rounded-xl p-4 mb-6">
                  <p className="text-sm italic mb-3">"{useCase.quote}"</p>
                  <div className="text-xs">
                    <div className="font-semibold">{useCase.author}</div>
                    <div className="text-muted-foreground">{useCase.role}</div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  to="/demo-request"
                  className={`block text-center py-3 rounded-xl font-semibold transition ${
                    useCase.popular
                      ? 'bg-gradient-to-r from-primary to-teal-600 text-white hover:shadow-lg'
                      : 'bg-muted hover:bg-muted/70'
                  }`}
                >
                  {useCase.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-primary/10 to-teal-600/10 rounded-3xl p-8 md:p-12 text-center border border-primary/20"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Necesitas una solución enterprise personalizada?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Ofrecemos implementaciones personalizadas, integración con tus sistemas existentes,
            y soporte dedicado para grandes desarrollos inmobiliarios.
          </p>
          <Link
            to="/contact-sales"
            className="inline-flex items-center bg-gradient-to-r from-primary to-teal-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition"
          >
            Contactar Ventas Enterprise
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

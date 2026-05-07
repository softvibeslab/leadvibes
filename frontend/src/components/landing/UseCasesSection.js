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
      color: 'gradient-neural',
      bgPattern: 'bg-[#50F4E2]/10',
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
      color: 'gradient-growth',
      bgPattern: 'bg-[#0D9488]/10',
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
      color: 'gradient-gold',
      bgPattern: 'bg-[#14B8A6]/10',
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
          <span className="inline-block bg-[#14B8A6]/10 text-[#14B8A6] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            CASOS DE USO
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Soluciones para cada tipo de
            <span className="text-gradient-neural"> negocio</span>
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
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glow-primary">
                    <scenario.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{scenario.title}</h3>

                  <div className="space-y-4">
                    <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg">
                      <div className="text-xs text-[#EF4444] font-semibold mb-1">ANTES</div>
                      <p className="text-sm text-muted-foreground">{scenario.before}</p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="p-3 bg-[#0D9488]/10 border border-[#0D9488]/20 rounded-lg">
                      <div className="text-xs text-[#0D9488] font-semibold mb-1">CON ROVI</div>
                      <p className="text-sm text-muted-foreground">{scenario.after}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <span className="text-gradient-primary font-semibold">{scenario.improvement}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Single CTA - Sin Precios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-velocity rounded-3xl p-8 md:p-16 text-center border border-[#0F172A]/30 shadow-glow-primary-strong"
        >
          {/* Badge */}
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            Soluciones Personalizadas
          </div>

          {/* Heading */}
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Precios según las necesidades
            <span className="block mt-2">de tu negocio</span>
          </h3>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Cada inmobiliaria es diferente. Diseñamos un plan a tu medida
            según el tamaño de tu equipo, volumen de leads y objetivos de crecimiento.
          </p>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="text-white font-semibold mb-2">Sin Costos Ocultos</h4>
              <p className="text-white/80 text-sm">Transparencia total en tu inversión</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="text-white font-semibold mb-2">ROI Medible</h4>
              <p className="text-white/80 text-sm">Métricas claras de retorno</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-3">🤝</div>
              <h4 className="text-white font-semibold mb-2">Soporte Dedicado</h4>
              <p className="text-white/80 text-sm">Implementación y capacitación</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/demo-request"
              className="inline-flex items-center justify-center bg-white text-[#0F172A] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Solicitar Cotización Personalizada
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href="https://wa.me/525580483839?text=Hola,%20me%20interesa%20cotizar%20Rovi%20CRM%20para%20mi%20inmobiliaria"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/30 transition border-2 border-white/30"
            >
              WhatsApp Directo
            </a>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span>Demo Gratuita</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span>Sin Contrato Forzoso</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span>Implementación en 48h</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Check, User, TrendingUp, Clock, MessageSquare, Phone, Calendar, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BrokerHeroSection = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = `/brokers#registro?email=${encodeURIComponent(email)}`;
  };

  return (
    <section className="relative min-h-screen overflow-hidden gradient-velocity">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300D9FF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-[#00D9FF]/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-[#7C3AED]/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-32">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#0A4DAF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold text-white">Rovi CRM</span>
            <span className="ml-2 bg-[#00D9FF] text-[#0F172A] text-xs font-bold px-3 py-1 rounded-full">
              PARA BROKERS
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition">Funcionalidades</a>
            <a href="#beneficios" className="text-white/80 hover:text-white transition">Beneficios</a>
            <a href="#comparacion" className="text-white/80 hover:text-white transition">Comparativa</a>
            <a href="#faq" className="text-white/80 hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-white/80 hover:text-white transition">
              Iniciar Sesión
            </Link>
            <a
              href="#registro"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-full font-semibold transition transform hover:scale-105"
            >
              Registrarse
            </a>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="bg-[#00D9FF] text-[#0F172A] text-xs font-bold px-2 py-1 rounded-full mr-2">LANZAMIENTO</span>
              <span className="text-white/90 text-sm">Regístrate antes del lanzamiento oficial</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              El CRM diseñado
              <motion.span
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#7C3AED] to-[#00D9FF] block mt-2"
                style={{ backgroundSize: '200% auto' }}
              >
                para brokers independientes
              </motion.span>
            </h1>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Como broker independiente, necesitas herramientas que trabajen para ti, no al revés.
              Rovi CRM automatiza tu seguimiento, organiza tus leads y te da las scripts de venta que necesitas para cerrar más propiedades.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#registro"
                className="group relative hover-accent bg-[#00D9FF] text-[#0F172A] px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center"
              >
                Registrarme Gratis
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
              </a>
              <button className="group relative flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg text-white border-2 border-white/30 hover:border-[#00D9FF] hover:bg-white/10 hover:shadow-glow-accent transition-all">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition" />
                Ver cómo funciona
              </button>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: 'Ahorra 10+ horas', desc: 'a la semana' },
                { icon: TrendingUp, label: '+3x más conversiones', desc: 'de leads a ventas' },
                { icon: MessageSquare, label: 'Nunca pierdas', desc: 'un lead por olvido' },
                { icon: Target, label: 'Scripts probados', desc: 'que sí funcionan' },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <benefit.icon className="w-6 h-6 text-[#00D9FF] mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-white font-semibold">{benefit.label}</div>
                    <div className="text-white/60 text-sm">{benefit.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mockup - Broker Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative glass-dark rounded-3xl p-4 shadow-2xl">
              {/* Browser Window */}
              <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5">
                {/* Browser Header */}
                <div className="flex items-center px-4 py-3 bg-slate-800/50">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="bg-slate-700/50 rounded-lg px-4 py-1 text-sm text-slate-400 inline-block">
                      app.rovicrm.com/broker
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview - Broker Focus */}
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                  {/* Broker Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Hoy', value: '12 leads', icon: User },
                      { label: 'Esta semana', value: '8 citas', icon: Calendar },
                      { label: 'Del mes', value: '3 ventas', icon: Target },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ delay: i * 0.2, duration: 2, repeat: Infinity }}
                        className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30"
                      >
                        <stat.icon className="w-4 h-4 text-[#00D9FF] mb-2" />
                        <div className="text-xs text-slate-400">{stat.label}</div>
                        <div className="text-base font-bold text-white">{stat.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Priority Leads */}
                  <div className="bg-slate-700/20 rounded-xl p-4 border border-slate-600/30 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-white">Leads Prioritarios</div>
                      <div className="bg-[#00D9FF] text-[#0F172A] text-xs px-2 py-1 rounded-full">3 urgentes</div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'María González', status: 'Calificado', action: 'Llamar hoy' },
                        { name: 'John Smith', status: 'Presentación', action: 'Enviar propiedades' },
                        { name: 'Ana López', status: 'Contactado', action: 'Agendar cita' },
                      ].map((lead, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#00D9FF] to-[#0A4DAF] rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-sm text-white font-medium">{lead.name}</div>
                              <div className="text-xs text-slate-400">{lead.status}</div>
                            </div>
                          </div>
                          <div className="text-xs text-[#00D9FF]">{lead.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Assistant */}
                  <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#00D9FF]/20 rounded-xl p-4 border border-[#00D9FF]/30">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-[#00D9FF] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0F172A] text-sm font-bold">AI</span>
                      </div>
                      <div>
                        <div className="text-sm text-[#00D9FF] font-semibold mb-1">Asistente Rovi</div>
                        <div className="text-sm text-white/80">
                          Tienes 5 leads calificados listos para cerrar esta semana. He preparado los scripts de llamada para cada uno. ¿Empezamos?
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-4 shadow-xl"
            >
              <div className="text-white">
                <div className="text-2xl font-bold">+450%</div>
                <div className="text-xs opacity-80">ROI promedio</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -bottom-4 -left-4 bg-gradient-to-br from-[#00D9FF] to-[#0A4DAF] rounded-2xl p-4 shadow-xl"
            >
              <div className="text-white">
                <div className="text-2xl font-bold">10min</div>
                <div className="text-xs opacity-80">Setup inicial</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Social Proof - Brokers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          <div className="text-center mb-6">
            <p className="text-white/80 text-sm uppercase tracking-wider font-semibold">
              BROKERS EN TULUM YA ESTÁN USANDO ROVI
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Carlos M.', role: 'Broker independiente', result: '+40% ventas' },
              { name: 'Laura P.', role: 'Agente inmobiliario', result: '15hrs/sem ahorradas' },
              { name: 'Miguel R.', role: 'Broker Tulum', result: '200+ leads organizados' },
              { name: 'Sofía L.', role: 'Consultora inmobiliaria', result: '3x más conversiones' },
            ].map((broker, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#0A4DAF] rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                  {broker.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-white font-semibold">{broker.name}</div>
                <div className="text-white/60 text-sm mb-1">{broker.role}</div>
                <div className="text-[#00D9FF] text-sm font-semibold">{broker.result}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

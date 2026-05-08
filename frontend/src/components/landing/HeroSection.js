import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Check, Building2, TrendingUp, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  const [email, setEmail] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí se enviará el lead al backend
    window.location.href = `/demo-request?email=${encodeURIComponent(email)}`;
  };

  const handleOpenVideo = () => {
    setShowVideoModal(true);
  };

  const handleCloseVideo = () => {
    setShowVideoModal(false);
  };

  return (
    <section className="relative min-h-screen overflow-hidden gradient-velocity">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-10 w-72 h-72 bg-[#00D9FF]/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00D9FF] to-[#0A4DAF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold text-white">Rovi CRM</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition">Funcionalidades</a>
            <a href="#integrations" className="text-white/80 hover:text-white transition">Integraciones</a>
            <a href="#roi" className="text-white/80 hover:text-white transition">Calculadora ROI</a>
            <a href="#faq" className="text-white/80 hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://wa.me/525580483839?text=Hola,%20me%20interesa%20solicitar%20una%20demo%20de%20Rovi%20CRM"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00D9FF] hover:bg-[#33E1FF] text-[#062B5F] px-6 py-2.5 rounded-full font-semibold transition transform hover:scale-105 shadow-glow-accent"
            >
              Solicitar Demo
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
              <span className="bg-[#7C3AED] text-white text-xs font-bold px-2 py-1 rounded-full mr-2">NUEVO</span>
              <span className="text-white/90 text-sm">IA integrada para maximizar tus ventas</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              El CRM que
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#7C3AED]">
                {' '}
                revoluciona
              </span>
              <br />
              tus ventas inmobiliarias
            </h1>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Diseñado específicamente para el mercado de bienes raíces de alto valor en México.
              Gestiona leads, automatiza comunicaciones y cierra más ventas con IA.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/demo-request"
                className="group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition transform hover:scale-105 flex items-center justify-center"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
              </Link>
              <button
                onClick={handleOpenVideo}
                className="group flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg text-white border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition" />
                Ver Demo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Building2, label: '10+ años', sublabel: 'Experiencia en Real Estate' },
                { icon: TrendingUp, label: '+45%', sublabel: 'Aumento en conversiones' },
                { icon: Zap, label: '24/7', sublabel: 'Soporte especializado' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.label}</div>
                  <div className="text-sm text-white/60">{stat.sublabel}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-4 shadow-2xl">
              {/* Browser Window */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center px-4 py-3 bg-slate-800/50">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="bg-slate-700/50 rounded-lg px-4 py-1 text-sm text-slate-400 inline-block">
                      app.rovicrm.com
                    </div>
                  </div>
                </div>

                {/* Dashboard Preview */}
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {['Puntos', 'Ventas', 'Leads', 'Meta'].map((label, i) => (
                      <motion.div
                        key={label}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ delay: i * 0.2, duration: 2, repeat: Infinity }}
                        className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30"
                      >
                        <div className="text-xs text-slate-400">{label}</div>
                        <div className="text-lg font-bold text-white">{['450', '12', '89', '80%'][i]}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pipeline Preview */}
                  <div className="bg-slate-700/20 rounded-xl p-4 border border-slate-600/30">
                    <div className="text-sm font-semibold text-white mb-3">Pipeline de Ventas</div>
                    <div className="grid grid-cols-5 gap-2">
                      {['Nuevo', 'Contactado', 'Calificación', 'Presentación', 'Cierre'].map((stage) => (
                        <div key={stage} className="bg-slate-700/30 rounded-lg p-2">
                          <div className="text-xs text-slate-400 mb-2">{stage}</div>
                          <div className="space-y-1">
                            {[1, 2, 3].map((j) => (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (stage.length + j) * 0.1 }}
                                className="h-6 bg-gradient-to-r from-teal-500/30 to-emerald-500/30 rounded"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Chat Preview */}
                  <div className="mt-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl p-4 border border-amber-500/30">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">AI</span>
                      </div>
                      <div>
                        <div className="text-sm text-amber-400 font-semibold mb-1">Asistente Rovi</div>
                        <div className="text-sm text-white/80">Tienes 3 leads calificados que requieren seguimiento hoy. ¿Quieres que prepare los scripts de llamada?</div>
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
              className="absolute -top-4 -right-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-4 shadow-xl"
            >
              <div className="text-white">
                <div className="text-2xl font-bold">+127%</div>
                <div className="text-xs opacity-80">Conversión</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -bottom-4 -left-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-4 shadow-xl"
            >
              <div className="text-white">
                <div className="text-2xl font-bold">3.5h</div>
                <div className="text-xs opacity-80">Ahorradas/día</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* Experience Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <Zap className="w-5 h-5 text-[#00D9FF] mr-2" />
            <span className="text-white/90 text-sm font-medium">
              Desarrollado por expertos en tecnología e inmobiliario
            </span>
          </div>
        </motion.div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl">
            {/* Close Button */}
            <button
              onClick={handleCloseVideo}
              className="absolute -top-12 right-0 text-white hover:text-[#00D9FF] transition z-10"
              aria-label="Cerrar video"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Video Container - Loom Embed */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
              {/* Subtitles Hint */}
              <div className="bg-gradient-to-r from-[#00D9FF]/10 to-[#7C3AED]/10 border-b border-white/10 px-4 py-2 flex items-center justify-center">
                <div className="flex items-center text-white/80 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span>Activa los subtítulos con el botón <strong className="text-[#00D9FF]">CC</strong> en el reproductor</span>
                </div>
              </div>

              <div className="relative" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                <iframe
                  src="https://www.loom.com/embed/11ff86de4edd428cbc586bf44b75b421"
                  frameBorder="0"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title="Demo de Rovi CRM"
                />
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-6 text-center">
              <p className="text-white/80 text-lg mb-4">
                ¿Te gusta lo que ves? <span className="text-[#00D9FF] font-semibold">Comienza gratis hoy</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/demo-request"
                  onClick={handleCloseVideo}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-full font-semibold transition transform hover:scale-105"
                >
                  Solicitar Demo Gratuita
                </Link>
                <a
                  href="https://wa.me/525580483839?text=Hola,%20vi%20el%20demo%20y%20me%20interesa%20Rovi%20CRM"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCloseVideo}
                  className="bg-[#00D9FF] hover:bg-[#33E1FF] text-[#062B5F] px-8 py-3 rounded-full font-semibold transition transform hover:scale-105"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

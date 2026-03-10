import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, CreditCard, MessageCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FinalCTASection = () => {
  const trustBadges = [
    { icon: <Lock className="w-5 h-5" />, text: '14 das gratis' },
    { icon: <CreditCard className="w-5 h-5" />, text: 'Sin tarjeta' },
    { icon: <MapPin className="w-5 h-5" />, text: 'Soporte MX' },
    { icon: <MessageCircle className="w-5 h-5" />, text: 'Setup en 5 min' }
  ];

  const stats = [
    { value: '500+', label: 'Inmobiliarias' },
    { value: '2,500+', label: 'Brokers' },
    { value: '4.9/5', label: 'Calificacin' },
    { value: '89%', label: 'Retencin' }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-teal-600 to-emerald-700" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full mr-2">NUEVO</span>
            <span className="text-sm">IA integrada para maximizar tus ventas</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            ¿Listo para cerrar
            <span className="text-amber-300"> ms ventas</span>
            <br />este mes?
          </h2>

          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            nete a ms de 500 inmobiliarias que ya transformaron su proceso de ventas
            y estn cerrando ms propiedades con Rovi CRM.
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-6 mb-10"
        >
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5"
            >
              {badge.icon}
              <span className="ml-2 font-medium">{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link
            to="/demo-request"
            className="group bg-white text-primary px-10 py-5 rounded-full font-bold text-lg hover:bg-amber-50 transition transform hover:scale-105 flex items-center justify-center shadow-2xl"
          >
            Comenzar Gratis Ahora
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition" />
          </Link>
          <a
            href="https://wa.me/5219841234567?text=Hola!%20Me%20interesa%20Rovi%20CRM"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-emerald-500 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-emerald-600 transition transform hover:scale-105 flex items-center justify-center shadow-2xl"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Hablar por WhatsApp
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
              <div className="text-white/70 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-sm"
        >
          Configuracin en 5 minutos • Cancela cuando quieras • Soporte en espaol
        </motion.p>
      </div>
    </section>
  );
};

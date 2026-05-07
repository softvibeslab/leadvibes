import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Send, ArrowRight, User, Mail, Phone, Briefcase, MapPin, Calendar, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const BrokerLaunchForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    monthlyDeals: '',
    monthlyContacts: '',
    goals: '',
    launchInterest: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Enviar lead al backend
      const response = await fetch(`/api/landing/broker-launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'broker_landing',
          account_type: 'individual'
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success('¡Registro exitoso! Te contactaremos pronto.');
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      toast.error('Hubo un error. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && formData.name && formData.email && formData.phone) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const benefits = [
    { icon: User, text: 'Acceso prioritario al lanzamiento' },
    { icon: Send, text: 'Precio especial early adopter' },
    { icon: Calendar, text: 'Demo personalizada antes del lanzamiento' },
    { icon: Target, text: 'Configuración inicial incluida' },
  ];

  if (isSuccess) {
    return (
      <section id="registro" className="py-24 bg-gradient-to-br from-primary/10 via-[#50F4E2]/10 to-[#14B8A6]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl p-12 border border-border"
          >
            <div className="w-20 h-20 rounded-full bg-[#0D9488]/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">¡Registro Exitoso!</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Gracias por registrarte en el lanzamiento de Rovi CRM para brokers.
              Te contactaremos en las próximas 48 horas con los detalles del acceso prioritario.
            </p>
            <div className="bg-muted/30 rounded-xl p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-4">Mientras tanto, puedes:</p>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="#features" className="text-primary hover:underline flex items-center justify-center">
                  Ver funcionalidades
                </a>
                <a href="#beneficios" className="text-primary hover:underline flex items-center justify-center">
                  Explorar beneficios
                </a>
                <a href="mailto:hola@rovicrm.com" className="text-primary hover:underline flex items-center justify-center">
                  Contactarnos directamente
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="registro" className="py-24 bg-gradient-to-br from-primary/10 via-[#50F4E2]/10 to-[#14B8A6]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block bg-primary/20 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              LANZAMIENTO OFICIAL
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Únete a la lista de
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                {' '}espera
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8">
              Sé de los primeros en acceder a Rovi CRM diseñado específicamente para brokers independientes.
              Registro gratuito con beneficios exclusivos.
            </p>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-card/50 backdrop-blur-sm rounded-xl border border-border"
                >
                  <benefit.icon className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                  <span className="text-lg">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-[#50F4E2]/20 to-[#14B8A6]/20 rounded-xl p-6 border border-[#50F4E2]/30">
              <div className="flex items-start mb-3">
                <TrendingUp className="w-6 h-6 text-accent mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-secondary dark:text-surface-arena-light mb-2">
                    ¿Por qué registrarte ahora?
                  </h4>
                  <p className="text-sm text-secondary dark:text-surface-arena-light leading-relaxed">
                    Los primeros 100 brokers registrados obtendrán acceso prioritario,
                    precios especiales y configuración personalizada incluida. Después del lanzamiento,
                    el precio será mayor y estos beneficios ya no estarán disponibles.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-card rounded-3xl p-8 shadow-xl border border-border">
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Paso {step} de 2</span>
                  <span className="text-sm text-muted-foreground">
                    {step === 1 ? 'Información básica' : 'Tu perfil'}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 2) * 100}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {step === 1 ? (
                  <>
                    {/* Step 1: Basic Info */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Juan Pérez"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Correo electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="juan@ejemplo.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Teléfono (WhatsApp) *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+52 998 123 4567"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ubicación (Ciudad/Estado) *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          name="location"
                          required
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Tulum, Quintana Roo"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.name || !formData.email || !formData.phone || !formData.location}
                      className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary/90 hover:to-secondary/90 text-white py-4 rounded-xl font-semibold text-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                    >
                      Continuar
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Step 2: Profile */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Experiencia como broker *
                      </label>
                      <select
                        name="experience"
                        required
                        value={formData.experience}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="menos-1-año">Menos de 1 año</option>
                        <option value="1-3-años">1-3 años</option>
                        <option value="3-5-años">3-5 años</option>
                        <option value="mas-5-años">Más de 5 años</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ventas/Apartados por mes *
                      </label>
                      <select
                        name="monthlyDeals"
                        required
                        value={formData.monthlyDeals}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="0-1">0-1</option>
                        <option value="2-3">2-3</option>
                        <option value="4-5">4-5</option>
                        <option value="6-mas">6 o más</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        ¿Cuántos contactos quieres gestionar al mes?
                      </label>
                      <input
                        type="number"
                        name="monthlyContacts"
                        value={formData.monthlyContacts}
                        onChange={handleChange}
                        placeholder="50"
                        min="1"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Principal desafío actual (opcional)
                      </label>
                      <textarea
                        name="goals"
                        value={formData.goals}
                        onChange={handleChange}
                        placeholder="Ej: Falta de follow-up, leads desorganizados, sin proceso de venta..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-4 rounded-xl font-semibold transition"
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:from-primary/90 hover:to-secondary/90 text-white py-4 rounded-xl font-semibold transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                      >
                        {isSubmitting ? (
                          'Enviando...'
                        ) : (
                          <>
                            Completar Registro
                            <Send className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Al registrarte, aceptas nuestra política de privacidad. No compartimos tus datos con terceros.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

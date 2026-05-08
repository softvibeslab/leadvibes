import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Send, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const LeadFormSection = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    accountType: 'individual',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Construir mensaje de WhatsApp con los datos del formulario
    const accountTypeText = formData.accountType === 'individual' ? 'Broker Independiente' : 'Inmobiliaria';

    const message = `🏠 *NUEVO LEAD DESDE LANDING PAGE*

📋 *DATOS DE CONTACTO*
━━━━━━━━━━━━━━━
👤 *Nombre:* ${formData.name}
📧 *Email:* ${formData.email}
📱 *Teléfono:* ${formData.phone}
🏢 *Empresa:* ${formData.company || 'No especificada'}

🎯 *TIPO DE CUENTA*
━━━━━━━━━━━━━━━
${accountTypeText}

💬 *MENSAJE*
━━━━━━━━━━━━━━━
${formData.message || 'Sin mensaje adicional'}

---
📌 Enviado desde rovicrm.com`;

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Número de WhatsApp
    const whatsappNumber = '525580483839';

    // Abrir WhatsApp con el mensaje
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Mostrar mensaje de éxito
    toast.success('¡Abriendo WhatsApp!');

    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');

    // Mostrar estado de éxito
    setIsSuccess(true);

    setIsSubmitting(false);
  };

  const benefits = [
    'Demo personalizada de 30 minutos',
    'Acceso a trial gratuito de 14 días',
    'Configuración inicial incluida',
    'Sin compromiso de compra'
  ];

  if (isSuccess) {
    return (
      <section id="demo-request" className="py-24 bg-gradient-to-br from-primary/10 via-teal-600/10 to-emerald-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl p-12 border border-border"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">¡WhatsApp Abierto!</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Gracias por tu interés en Rovi CRM. Hemos abierto WhatsApp con toda tu información
              prellenada. Solo presiona "Enviar" para contactarnos directamente.
            </p>
            <div className="bg-muted/30 rounded-xl p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-2">¿No se abrió WhatsApp?</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://wa.me/525580483839"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Abrir WhatsApp manualmente
                </a>
                <span className="text-muted-foreground">•</span>
                <a href="#features" className="text-primary hover:underline">Ver funcionalidades</a>
                <span className="text-muted-foreground">•</span>
                <a href="mailto:rovicrm@softvibes.com.mx" className="text-primary hover:underline">Enviar email</a>
              </div>
            </div>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-primary hover:underline"
            >
              Enviar otro mensaje
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="demo-request" className="py-24 bg-gradient-to-br from-primary/10 via-teal-600/10 to-emerald-600/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              CONTACTO DIRECTO
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Contáctanos por{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-600">
                WhatsApp
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Completa el formulario y te contactaremos de inmediato por WhatsApp.
              Sin intermediarios, respuesta directa en minutos.
            </p>

            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center"
                >
                  <CheckCircle2 className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <p className="text-sm text-muted-foreground mb-2">¿Prefieres WhatsApp?</p>
              <a href="https://wa.me/525580483839?text=Hola,%20me%20interesa%20solicitar%20una%20demo%20de%20Rovi%20CRM" target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-primary hover:underline">
                +52 55 8048 3839
              </a>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-card rounded-3xl p-8 shadow-xl border border-border">
              <h3 className="text-2xl font-bold mb-6">Contáctanos por WhatsApp</h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email corporativo *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan@empresa.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+52 998 123 4567"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Empresa / Inmobiliaria
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Tulum Premier Realty"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Soy *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'individual', label: 'Broker Independiente' },
                      { value: 'agency', label: 'Inmobiliaria' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center justify-center px-4 py-3 rounded-xl border cursor-pointer transition ${
                          formData.accountType === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value={option.value}
                          checked={formData.accountType === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos sobre tus necesidades..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white py-4 rounded-xl font-semibold text-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isSubmitting ? (
                    'Abriendo WhatsApp...'
                  ) : (
                    <>
                      Enviar por WhatsApp
                      <Send className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Al enviar este formulario, se abrirá WhatsApp con tu información prellenada.
                  No compartimos tus datos con terceros.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

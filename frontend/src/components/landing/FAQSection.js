import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Shield, CreditCard, GraduationCap, Users, Zap, Check } from 'lucide-react';

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "¿Cunto tiempo toma implementar Rovi CRM?",
      a: "La configuracin inicial toma menos de 30 minutos. La mayora de nuestros clientes estn operativos el mismo da. Nuestro equipo de soporte te gua paso a paso durante todo el proceso.",
      icon: <Clock className="w-5 h-5" />
    },
    {
      q: "¿Puedo importar mis leads desde otro CRM?",
      a: "S! Soportamos importacin desde HubSpot, Pipedrive, Salesforce, Excel, CSV y ms. Tambin podemos crear integraciones personalizadas para tu sistema actual.",
      icon: <Zap className="w-5 h-5" />
    },
    {
      q: "¿Estn mis datos seguros?",
      a: "Absolutamente. Usamos encriptacin AES-256 de grado militar, servidores en Mxico con redundancia, y cumplimos con todas las leyes de proteccin de datos (LFPDPPP). Realizamos backups diarios y auditoras de seguridad trimestrales.",
      icon: <Shield className="w-5 h-5" />
    },
    {
      q: "¿Necesito tarjeta de crdito para la prueba?",
      a: "No. Disfruta de 14 das completamente gratis sin compromiso y sin pedir informacin de pago. Solo aades tu tarjeta cuando decidas continuar.",
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      q: "¿Ofrecen entrenamiento para mi equipo?",
      a: "S! Incluimos onboarding virtual para todo tu equipo, documentacin completa, videos tutoriales y sesiones de Q&A semanales. Los planes Enterprise incluyen entrenamiento presencial.",
      icon: <GraduationCap className="w-5 h-5" />
    },
    {
      q: "¿Cuntos brokers puedo tener?",
      a: "En el plan Individual: 1 broker. En Agencia: hasta 20 brokers. En Enterprise: brokers ilimitados. Puedes actualizar tu plan en cualquier momento segn crezca tu equipo.",
      icon: <Users className="w-5 h-5" />
    },
    {
      q: "Funciona para el mercado inmobiliario de Mxico?",
      a: "Rovi fue diseado especficamente para el mercado inmobiliario mexicano. Entendemos el proceso de apartados, escrituracin, y las particularidades de comprar propiedades en Mxico. Nuestra IA est entrenada con el lenguaje y contextos locales.",
      icon: <Check className="w-5 h-5" />
    },
    {
      q: "¿Puedo cancelar cuando quiera?",
      a: "S, no hay contratos forzosos. Puedes cancelar en cualquier momento desde tu panel de control. Si cancelas, conservamos tus datos por 30 das por si deseas reactivar.",
      icon: <Check className="w-5 h-5" />
    }
  ];

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            PREGUNTAS FRECUENTES
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Todo lo que necesitas
            <span className="text-primary"> saber</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Respuestas a las preguntas ms comunes sobre Rovi CRM
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  openIndex === index
                    ? 'bg-gradient-to-r from-primary/10 to-teal-600/10 border-2 border-primary/30'
                    : 'bg-card border-2 border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${
                      openIndex === index ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {faq.icon}
                    </div>
                    <span className={`font-semibold pr-4 ${openIndex === index ? 'text-primary' : ''}`}>
                      {faq.q}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className={`w-5 h-5 ${openIndex === index ? 'text-primary' : 'text-muted-foreground'}`} />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 pl-14 text-muted-foreground">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Still have questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-br from-primary/10 to-teal-600/10 rounded-3xl p-8 border border-primary/20"
        >
          <h3 className="text-2xl font-bold mb-4">¿An tienes preguntas?</h3>
          <p className="text-muted-foreground mb-6">
            Nuestro equipo est listo para ayudarte. Contctanos y te responderemos en menos de 24 horas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hola@rovicrm.com"
              className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition"
            >
              Enviar Email
            </a>
            <a
              href="#demo-request"
              className="inline-flex items-center justify-center bg-card border-2 border-border px-6 py-3 rounded-full font-semibold hover:border-primary/50 transition"
            >
              Agendar Demo
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

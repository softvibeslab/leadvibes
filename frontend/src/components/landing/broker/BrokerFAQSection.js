import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const BrokerFAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: '¿Rovi CRM es solo para inmobiliarias grandes o también para brokers independientes?',
      answer: 'Rovi CRM está diseñado específicamente para brokers independientes y agentes inmobiliarios que trabajan por su cuenta. Aunque también tenemos versiones para agencias, nuestra enfoque principal son los brokers independientes que necesitan herramientas profesionales sin la complejidad de sistemas empresariales.'
    },
    {
      question: '¿Cuánto tiempo toma configurar Rovi CRM?',
      answer: 'La configuración inicial toma menos de 10 minutos. Puedes importar tus contactos desde un archivo CSV o conectar otros CRMs. El sistema te guía paso a paso y pre-califica tus leads automáticamente. La mayoría de los brokers están operativos en menos de una semana.'
    },
    {
      question: '¿Necesito conocimientos técnicos para usar Rovi?',
      answer: 'No, Rovi está diseñado para ser intuitivo y fácil de usar. No necesitas conocimientos técnicos. El onboarding incluye preguntas sobre tu negocio y el sistema se configura automáticamente según tus respuestas. Además, ofrecemos soporte personalizado y configuración incluida.'
    },
    {
      question: '¿Puedo importar mis contactos desde otros sistemas?',
      answer: 'Sí, puedes importar tus contactos desde archivos CSV, Excel o conectar otros CRMs. Rovi incluye una plantilla .CSV descargable para que puedes estructurar correctamente tus contactos si los tienes desorganizados. El sistema detecta automáticamente duplicados y te sugiere cuáles contactar primero.'
    },
    {
      question: '¿Qué incluye el free trial?',
      answer: 'El free trial incluye acceso completo a todos los módulos por tiempo limitado. Para automatizaciones, el plan de prueba incluye 4 plantillas/recomendaciones operables con un tope máximo de 100 contactos. También incluye configuración inicial, soporte y todos los features de gestión de leads, inventario y campañas.'
    },
    {
      question: '¿Cómo funciona la integración con WhatsApp, correo y SMS?',
      answer: 'Rovi unifica todas tus conversaciones en un solo inbox omnicanal. Puedes ver y responder mensajes de WhatsApp, correo y Telegram desde un solo lugar. El sistema destaca los chats no contestados que necesitan atención inmediata. Para SMS y llamadas usamos integraciones con Twilio y VAPI.'
    },
    {
      question: '¿Puedo personalizar los scripts de venta?',
      answer: 'Sí, Rovi incluye scripts probados para apertura, seguimiento y presentación que puedes personalizar completamente según tu estilo y cada tipo de cliente. También puedes crear tus propios templates y usar variables personalizables como {{nombre}}, {{propiedad}}, etc.'
    },
    {
      question: '¿Cómo me ayuda la IA con mis leads?',
      answer: 'La IA de Rovi pre-califica tus leads analizando intención de compra, presupuesto, nivel de interés y comportamiento. Te destaca los leads mejor cualificados y aquellos que necesitan atención inmediata. También sugiere próximos pasos, prepara scripts de llamada y te recuerda actividades calendarizadas.'
    },
    {
      question: '¿Puedo gestionar mi inventario de propiedades en Rovi?',
      answer: 'Sí, puedes agregar manualmente tus propiedades con clasificación (venta, renta, subarrendamiento), SKU único para evitar desorden, geolocalización con Google Maps y repositorio de imágenes. También puedes importar/exportar tu inventario con plantilla predefinida y compartir múltiples propiedades masivamente con diseño profesional.'
    },
    {
      question: '¿Qué pasa después del lanzamiento oficial?',
      answer: 'Los primeros 100 brokers registrados obtendrán acceso prioritario, precios especiales early adopter y configuración personalizada incluida. Después del lanzamiento, estos beneficios ya no estarán disponibles y el precio será mayor. Registrarte ahora te garantiza los mejores beneficios.'
    },
    {
      question: '¿Tienen soporte y capacitación?',
      answer: 'Sí, incluimos demo personalizada, configuración inicial, capacitación completa y soporte continuo. También tenemos documentación detallada, video tutoriales y un equipo de soporte dedicado. Los brokers en el lanzamiento reciben atención prioritaria.'
    },
    {
      question: '¿Es seguro mi información en Rovi?',
      answer: 'Absolutamente. Rovi usa arquitectura multi-tenant con aislamiento total de datos. Toda la información está encriptada y cumplimos con estándares de seguridad. Tus datos y los de tus clientes están completamente protegidos y nunca son compartidos con terceros.'
    }
  ];

  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Preguntas
            <span className="text-primary"> frecuentes</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Todo lo que necesitas saber sobre Rovi CRM para brokers independientes
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
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-muted/50 transition"
              >
                <span className="font-semibold text-lg pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {openIndex === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-5"
                >
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="bg-card rounded-2xl p-8 border border-border">
            <h3 className="text-2xl font-bold mb-4">
              ¿Tienes más preguntas?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nuestro equipo está aquí para ayudarte. Contáctanos directamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hola@rovicrm.com"
                className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-6 py-3 rounded-full font-semibold transition"
              >
                Envíanos un correo
              </a>
              <a
                href="#registro"
                className="inline-flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-full font-semibold transition"
              >
                Registrarse ahora
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

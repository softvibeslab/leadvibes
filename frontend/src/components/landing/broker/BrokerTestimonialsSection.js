import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export const BrokerTestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Carlos Mendoza',
      role: 'Broker Independiente',
      location: 'Tulum, Quintana Roo',
      image: 'CM',
      color: 'from-[#00D9FF] to-[#0A4DAF]',
      rating: 5,
      text: 'Antes usaba Excel y WhatsApp para todo. Perdí muchos leads por falta de organización. Con Rovi, ahora tengo todo en un solo lugar. La IA me ayuda a calificar y la verdad es que cierro 3 veces más que antes. Lo mejor: los scripts de venta que sí funcionan.',
      results: ['+300% en cierres', '15 horas ahorradas/semana', '200+ leads organizados']
    },
    {
      name: 'Laura Pérez',
      role: 'Agente Inmobiliario',
      location: 'Playa del Carmen',
      image: 'LP',
      color: 'from-[#00D9FF] to-[#7C3AED]',
      rating: 5,
      text: 'Como broker independiente, pensaba que un CRM era muy complicado para mí. Rovi es diferente: está hecho para gente como yo. La configuración fue súper fácil y en menos de una semana ya tenía todo mi pipeline organizado. Los scripts de venta me han ayudado mucho.',
      results: ['Setup en 1 semana', '+45% tasa de conversión', 'Pipeline organizado']
    },
    {
      name: 'Miguel Ruiz',
      role: 'Consultor Inmobiliario',
      location: 'Cancún',
      image: 'MR',
      color: 'from-[#7C3AED] to-[#0A4DAF]',
      rating: 5,
      text: 'Lo que más me gusta es el inbox omnicanal. Antes tenía conversaciones por todos lados. Ahora todo está en un solo lugar y el sistema me avisa cuáles chats necesitan respuesta. La IA que me dice a quién llamar primero es increíble.',
      results: ['Respuestas 5x más rápidas', 'Nunca olvida un seguimiento', 'Leads priorizados']
    },
    {
      name: 'Sofía López',
      role: 'Broker Independiente',
      location: 'Mérida',
      image: 'SL',
      color: 'from-[#10B981] to-[#059669]',
      rating: 5,
      text: 'El inventario de propiedades con SKU y geolocalización lo cambió todo para mí. Ahora puedo compartir múltiples propiedades con un diseño profesional en segundos. Mis clientes quedan impresionados. El módulo de campañas automatizadas también es excelente.',
      results: ['Presentaciones profesionales', 'Campañas automatizadas', '+40% más citas']
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            TESTIMONIOS
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Lo que dicen los
            <span className="text-primary"> brokers que usan Rovi</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Historias reales de brokers independientes que transformaron su proceso de ventas
            y están cerrando más propiedades con Rovi CRM.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-card rounded-3xl p-8 border border-border shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Testimonial */}
              <div className="relative mb-6">
                <Quote className="absolute top-0 left-0 w-8 h-8 text-primary/20 -transform -scale-x-100" />
                <p className="text-lg leading-relaxed pl-8 text-muted-foreground">
                  "{testimonial.text}"
                </p>
              </div>

              {/* Results */}
              <div className="flex flex-wrap gap-2 mb-6">
                {testimonial.results.map((result, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    {result}
                  </span>
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center pt-4 sm:pt-6 border-t border-border">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg sm:text-xl mr-3 sm:mr-4`}>
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-bold text-base sm:text-lg">{testimonial.name}</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">{testimonial.role}</div>
                  <div className="text-muted-foreground text-xs">{testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-primary/10 via-teal-600/10 to-emerald-600/10 rounded-3xl p-8 border border-primary/20">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: '150+', label: 'Brokers activos' },
                { value: '4.9/5', label: 'Calificación promedio' },
                { value: '3x', label: 'Más ventas en promedio' },
                { value: '95%', label: 'Recomendarían Rovi' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

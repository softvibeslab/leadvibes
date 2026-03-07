import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      content: "Rovi transformó completamente nuestra forma de trabajar. Pasamos de perder el 50% de los leads a convertir el 35% en ventas. La IA es increíble.",
      author: "Laura Méndez",
      role: "Directora Comercial, Tulum Premier",
      avatar: "LM",
      rating: 5,
      company: "Tulum Premier",
      results: "50% más ventas en 6 meses"
    },
    {
      content: "La gamificación hizo que nuestros brokers duplicaran su actividad. Ahora compiten por ser #1 en el leaderboard y los resultados se ven en las ventas.",
      author: "Miguel Ángel Torres",
      role: "Gerente de Ventas, Caribe Realty",
      avatar: "MT",
      rating: 5,
      company: "Caribe Realty",
      results: "127% más productividad"
    },
    {
      content: "Como broker independiente, necesitaba algo simple pero potente. Rovi es perfecto: gestiono mis leads, automatizo seguimientos y cierro más ventas.",
      author: "Carlos Mendoza",
      role: "Broker Independiente",
      avatar: "CM",
      rating: 5,
      company: "Independiente",
      results: "3x más cierres mensuales"
    },
    {
      content: "La integración con Google Calendar y las llamadas automáticas me ahorran al menos 3 horas al día. Ahora puedo enfocarme en cerrar, no en administrar.",
      author: "Ana Patricia Ruiz",
      role: "Broker Senior, Akumal Estates",
      avatar: "AR",
      rating: 5,
      company: "Akumal Estates",
      results: "3h ahorradas por día"
    },
    {
      content: "Implementamos Rovi en todo nuestro equipo de 15 brokers. En el primer trimestre vendimos más que en todo el año anterior.¡Increíble ROI!",
      author: "Roberto Hernández",
      role: "CEO, Mayan Developments",
      avatar: "RH",
      rating: 5,
      company: "Mayan Developments",
      results: "ROI de 10x en 1 año"
    },
    {
      content: "El soporte es excepcional. Nos ayudaron a migrar de nuestro CRM anterior y entrenaron a todo nuestro equipo. Realmente se preocupan por nuestro éxito.",
      author: "Daniela Fernández",
      role: "Operations Manager, Puerto Aventuras Realty",
      avatar: "DF",
      rating: 5,
      company: "Puerto Aventuras Realty",
      results: "Migración perfecta en 2 semanas"
    },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-4">
            TESTIMONIOS
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Lo que dicen nuestros
            <span className="text-accent"> clientes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Más de 500 inmobiliarias y 2,500 brokers confían en Rovi CRM para gestionar sus ventas.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 via-teal-600/10 to-emerald-600/10 rounded-2xl p-8 mb-16 border border-primary/20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-1">500+</div>
              <div className="text-muted-foreground">Inmobiliarias</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">2,500+</div>
              <div className="text-muted-foreground">Brokers Activos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">4.9/5</div>
              <div className="text-muted-foreground">Calificación</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">89%</div>
              <div className="text-muted-foreground">Retención</div>
            </div>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="bg-card rounded-2xl p-6 border border-border h-full hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                  <p className="text-muted-foreground relative z-10 pl-4">
                    {testimonial.content}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>

                {/* Results Badge */}
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="inline-flex items-center text-sm font-semibold text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                    {testimonial.results}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-xl text-muted-foreground mb-6">
            Únete a las inmobiliarias que están transformando sus ventas con Rovi
          </p>
          <a
            href="#demo-request"
            className="inline-flex items-center bg-gradient-to-r from-primary to-teal-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Solicita tu Demo Gratis
          </a>
        </motion.div>
      </div>
    </section>
  );
};

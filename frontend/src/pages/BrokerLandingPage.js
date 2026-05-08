import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BrokerHeroSection } from '../components/landing/broker/BrokerHeroSection';
import { BrokerFeaturesSection } from '../components/landing/broker/BrokerFeaturesSection';
import { BrokerBenefitsSection } from '../components/landing/broker/BrokerBenefitsSection';
import { BrokerComparisonSection } from '../components/landing/broker/BrokerComparisonSection';
import { BrokerLaunchForm } from '../components/landing/broker/BrokerLaunchForm';
import { BrokerTestimonialsSection } from '../components/landing/broker/BrokerTestimonialsSection';
import { BrokerFAQSection } from '../components/landing/broker/BrokerFAQSection';
import { Footer } from '../components/landing/Footer';

export const BrokerLandingPage = () => {
  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Rovi CRM para Brokers",
    "applicationCategory": "BusinessApplication, CRMApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "MXN",
      "description": "Prueba gratis para brokers independientes"
    },
    "description": "Rovi CRM es la plataforma líder para brokers inmobiliarios independientes en México. Gestiona leads, automatiza comunicaciones y cierra más ventas con IA.",
    "author": {
      "@type": "Organization",
      "name": "Rovi CRM",
      "url": "https://rovicrm.com"
    },
    "featureList": [
      "Gestión de leads con IA",
      "Pipeline de ventas visual",
      "Automatización de comunicaciones",
      "Inventario de propiedades",
      "Campañas de marketing",
      "Scripts de venta",
      "Calendario integrado",
      "Análisis y reportes"
    ]
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Rovi CRM para Brokers - El CRM Inmobiliario para Agentes Independientes</title>
        <meta
          name="description"
          content="Rovi CRM es el CRM inmobiliario diseñado específicamente para brokers independientes. Gestiona tus leads, automatiza tus ventas y cierra más propiedades en Tulum y México. Prueba gratis."
        />
        <meta
          name="keywords"
          content="CRM para brokers, CRM inmobiliario individual, broker independiente, CRM Tulum, gestión de leads inmobiliarios, automatización de ventas, CRM para agentes inmobiliarios"
        />
        <meta name="author" content="Rovi CRM" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://rovicrm.com/brokers" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rovicrm.com/brokers" />
        <meta property="og:title" content="Rovi CRM para Brokers - El CRM Inmobiliario para Agentes Independientes" />
        <meta
          property="og:description"
          content="Diseñado específicamente para brokers inmobiliarios independientes. Gestiona leads, automatiza comunicaciones y cierra más ventas con IA."
        />
        <meta property="og:image" content="https://rovicrm.com/brokers-og-image.jpg" />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rovi CRM para Brokers - Agentes Independientes" />
        <meta
          name="twitter:description"
          content="El CRM inmobiliario diseñado para brokers independientes. Más ventas, menos esfuerzo."
        />
        <meta name="twitter:image" content="https://rovicrm.com/brokers-twitter-image.jpg" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <BrokerHeroSection />

      {/* Pain Points Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            ¿Te suena familiar esto como broker independiente?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mt-12 text-left">
            {[
              "¿Pierdes leads por no dar seguimiento a tiempo?",
              "¿Tu base de contactos está desorganizada?",
              "¿No sabes qué leads realmente quieren comprar?",
              "¿Pierdes horas en tareas administrativas?",
              "¿Sin scripts ni proceso de venta estructurado?",
              "¿Difícil saber qué propiedades mostrar a cada cliente?"
            ].map((pain, i) => (
              <div key={i} className="flex items-start p-4 bg-card rounded-xl border border-red-200 dark:border-red-900">
                <span className="text-red-500 text-xl mr-3">❌</span>
                <span className="text-muted-foreground">{pain}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <BrokerFeaturesSection />

      {/* Benefits Section */}
      <BrokerBenefitsSection />

      {/* Comparison Section */}
      <BrokerComparisonSection />

      {/* Launch Form Section */}
      <BrokerLaunchForm />

      {/* Testimonials Section */}
      <BrokerTestimonialsSection />

      {/* FAQ Section */}
      <BrokerFAQSection />

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-teal-600/20 to-emerald-600/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Únete al lanzamiento oficial de Rovi CRM
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sé de los primeros en acceder a la plataforma diseñada específicamente para brokers independientes.
          </p>
          <a
            href="#registro"
            className="inline-block bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white px-8 py-4 rounded-full font-semibold text-lg transition transform hover:scale-105"
          >
            Registrarme Ahora - Es Gratis
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BrokerLandingPage;

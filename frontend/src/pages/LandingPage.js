import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { LeadFormSection } from '../components/landing/LeadFormSection';
import { Footer } from '../components/landing/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Rovi CRM - El CRM Inmobiliario que Aumenta tus Ventas</title>
        <meta
          name="description"
          content="Rovi CRM es la plataforma líder para gestionar ventas inmobiliarias de alto valor en México. IA, automatización y gamificación para cerrar más ventas."
        />
        <meta
          name="keywords"
          content="CRM inmobiliario, ventas inmobiliarias, gestión de leads, CRM México, Tulum, bienes raíces, automatización de ventas"
        />
        <meta property="og:title" content="Rovi CRM - El CRM Inmobiliario que Aumenta tus Ventas" />
        <meta
          property="og:description"
          content="Diseñado específicamente para el mercado inmobiliario de alto valor en México. Gestiona leads, automatiza comunicaciones y cierra más ventas con IA."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rovicrm.com" />
        <meta property="og:image" content="https://rovicrm.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Rovi CRM - El CRM Inmobiliario que Aumenta tus Ventas" />
        <meta
          name="twitter:description"
          content="Diseñado específicamente para el mercado inmobiliario de alto valor en México."
        />
        <link rel="canonical" href="https://rovicrm.com" />
      </Helmet>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Lead Form Section */}
      <LeadFormSection />

      {/* Footer */}
      <Footer />

      {/* Floating CTA Button (Mobile) */}
      <a
        href="#demo-request"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105 md:hidden z-50"
      >
        Solicitar Demo
      </a>
    </div>
  );
};

export default LandingPage;

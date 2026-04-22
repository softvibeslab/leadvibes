import React from 'react';
import { Helmet } from 'react-helmet-async';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { IntegrationsSection } from '../components/landing/IntegrationsSection';
import { BeforeAfterSection } from '../components/landing/BeforeAfterSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { ROICalculatorSection } from '../components/landing/ROICalculatorSection';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { LeadFormSection } from '../components/landing/LeadFormSection';
import { Footer } from '../components/landing/Footer';
import { LiveChatWidget } from '../components/landing/LiveChatWidget';

export const LandingPage = () => {
  // Schema.org structured data for SaaS
  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Rovi CRM",
    "applicationCategory": "BusinessApplication, CRMApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "1490",
      "priceCurrency": "MXN",
      "priceValidUntil": "2025-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "450",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "Rovi CRM es la plataforma líder para gestionar ventas inmobiliarias de alto valor en México. IA, automatización y gamificación para cerrar más ventas.",
    "author": {
      "@type": "Organization",
      "name": "Rovi CRM",
      "url": "https://rovicrm.com"
    },
    "featureList": [
      "Gestión de leads con IA",
      "Pipeline de ventas visual",
      "Automatización de comunicaciones",
      "Llamadas con IA (VAPI)",
      "Email marketing",
      "SMS masivo",
      "Gamificación de equipos",
      "Integración con Google Calendar",
      "Análisis y reportes"
    ]
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Rovi CRM - El CRM Inmobiliario #1 en México | +500 Inmobiliarias Confían</title>
        <meta
          name="description"
          content="Rovi CRM es la plataforma líder para gestionar ventas inmobiliarias de alto valor en México. IA, automatización y gamificación para cerrar más ventas. Prueba gratis 14 días."
        />
        <meta
          name="keywords"
          content="CRM inmobiliario, ventas inmobiliarias, gestión de leads, CRM México, Tulum, bienes raíces, automatización de ventas, CRM para inmobiliarias, leads inmobiliarios, WhatsApp para inmobiliarias, VAPI IA"
        />
        <meta name="author" content="Rovi CRM" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://rovicrm.com" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rovicrm.com" />
        <meta property="og:title" content="Rovi CRM - El CRM Inmobiliario #1 en México | +500 Inmobiliarias Confían" />
        <meta
          property="og:description"
          content="Diseñado específicamente para el mercado inmobiliario de alto valor en México. Gestiona leads, automatiza comunicaciones y cierra más ventas con IA. Prueba gratis 14 días."
        />
        <meta property="og:image" content="https://rovicrm.com/og-image.jpg" />
        <meta property="og:locale" content="es_MX" />
        <meta property="og:site_name" content="Rovi CRM" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://rovicrm.com" />
        <meta name="twitter:title" content="Rovi CRM - El CRM Inmobiliario #1 en México" />
        <meta
          name="twitter:description"
          content="Gestiona leads, automatiza comunicaciones y cierra más ventas con IA. Prueba gratis 14 días."
        />
        <meta name="twitter:image" content="https://rovicrm.com/twitter-image.jpg" />
        <meta name="twitter:creator" content="@rovicrm" />

        {/* Additional SEO */}
        <meta name="geo.region" content="MX-QROO" />
        <meta name="geo.placename" content="Tulum, México" />
        <meta name="geo.position" content="20.2114;-87.4654" />
        <meta name="ICBM" content="20.2114, -87.4654" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <HeroSection />

      {/* Social Proof Bar */}
      <section className="py-12 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              Confían en nosotros las mejores inmobiliarias de México
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {['Tulum Premier', 'Caribe Realty', 'Mayan Lands', 'Akumal Estates', 'Puerto Aventuras', 'Mayakoba'].map((company, i) => (
              <div key={i} className="text-xl font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Before/After Section */}
      <BeforeAfterSection />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* ROI Calculator Section */}
      <ROICalculatorSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Lead Form Section */}
      <LeadFormSection />

      {/* Final CTA Section */}
      <FinalCTASection />

      {/* Footer */}
      <Footer />

      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
};

export default LandingPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { LeadFormSection } from '../components/landing/LeadFormSection';

export const DemoRequestPage = ({ enterprise = false }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-bold">Rovi CRM</span>
            </Link>
            <Link
              to="/"
              className="flex items-center text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        {enterprise ? (
          <>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Contacta con{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-600">
                Ventas Enterprise
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Soluciones personalizadas para grandes desarrolladores inmobiliarios
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Solicita tu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-600">
                Demo Gratis
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Descubre cómo Rovi CRM puede transformar tu proceso de ventas
            </p>
          </>
        )}
      </div>

      {/* Form Section */}
      <LeadFormSection />

      {/* Additional Info for Enterprise */}
      {enterprise && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-primary/10 to-teal-600/10 rounded-3xl p-8 border border-primary/20">
            <h2 className="text-2xl font-bold mb-6">¿Por qué elegir Enterprise?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Implementación personalizada',
                'Integración con tus sistemas existentes',
                'API dedicada y documentación completa',
                'SLA garantizado con 99.9% uptime',
                'Entrenamiento in-situ para tu equipo',
                'Soporte prioritario 24/7',
                'Reportes personalizados y dashboards ejecutivos',
                'Gestión de múltiples desarrolladores',
              ].map((benefit, i) => (
                <div key={i} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Simple */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Rovi CRM. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition">
                Términos
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition">
                Privacidad
              </a>
              <Link to="/login" className="text-primary hover:text-primary/80 text-sm font-semibold">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoRequestPage;

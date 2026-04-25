import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export const LeadSearchDashboard = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Search className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold">Lead Search Dashboard</h1>
        <p className="text-muted-foreground">
          Esta vista pública aún no está aterrizada en el frontend actual. La ruta queda activa para no romper la app mientras se define el flujo final.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <Link to="/pricing-calculator" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
            Ir a calculadora de costos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeadSearchDashboard;

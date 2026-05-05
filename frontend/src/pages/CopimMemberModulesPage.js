import React, { useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, CreditCard, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CopimEmptyState, CopimPageHeader, formatCopimCurrency } from '../components/copim/CopimModulePrimitives';

export const CopimMemberModulesPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);

  const loadModules = useCallback(async () => {
    try {
      const response = await api.get('/copim/member-portal/modules');
      setData(response.data);
    } catch (error) {
      console.error('Error loading member modules:', error);
      toast.error(error.response?.data?.detail || 'No se pudieron cargar tus módulos');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  const handleActivate = async (moduleId) => {
    setActivatingId(moduleId);
    try {
      await api.post(`/copim/member-portal/modules/${moduleId}/activate`);
      toast.success('Módulo activado y cobro generado');
      await loadModules();
    } catch (error) {
      console.error('Error activating module:', error);
      toast.error(error.response?.data?.detail || 'No se pudo activar el módulo');
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const summary = data.summary || {};
  const modules = data.modules || [];

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mis módulos"
        description="Activa capacidades que potencien tu operación sin mezclarte con la lógica administrativa de la asociación."
        stats={[
          { label: 'Activos', value: summary.active_count || 0, helper: 'Incluidos y add-ons' },
          { label: 'Disponibles', value: summary.available_count || 0, helper: 'Listos para activar' },
          { label: 'Cargo mensual', value: formatCopimCurrency(summary.monthly_total || 0), helper: 'Solo add-ons activos' },
          { label: 'Nivel', value: (summary.membership_tier || 'base').toUpperCase(), helper: 'Tier actual' },
        ]}
      />

      {modules.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {modules.map((module) => {
            const isActive = module.status === 'active';
            const isIncluded = Boolean(module.included);
            return (
              <Card key={module.id} className="overflow-hidden border-border/70 bg-card/95">
                <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="border-b border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between gap-3">
                      <Badge className={`rounded-full ${isActive ? 'bg-emerald-400/20 text-emerald-50' : 'bg-white/12 text-white'}`}>
                        {isActive ? 'Activo' : 'Disponible'}
                      </Badge>
                      <div className="rounded-full border border-white/12 bg-white/10 p-2">
                        <Bot className="h-4 w-4" />
                      </div>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold">{module.label}</h2>
                    <p className="mt-3 text-sm leading-7 text-white/72">{module.description}</p>
                    <div className="mt-6 rounded-3xl border border-white/12 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/62">Costo mensual</p>
                      <p className="mt-2 text-xl font-semibold">
                        {module.price_monthly ? formatCopimCurrency(module.price_monthly) : 'Incluido'}
                      </p>
                    </div>
                  </div>

                  <CardContent className="space-y-4 p-6">
                    <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-sm font-medium">Lectura simple</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{module.plan_note}</p>
                    </div>

                    <div className="grid gap-2">
                      {(module.features || []).map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isActive ? (
                        <Button variant="outline" className="rounded-full" disabled>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {isIncluded ? 'Incluido en tu plan' : 'Activo'}
                        </Button>
                      ) : (
                        <Button className="rounded-full" onClick={() => handleActivate(module.id)} disabled={activatingId === module.id}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          {activatingId === module.id ? 'Activando...' : 'Activar módulo'}
                        </Button>
                      )}
                      <Button variant="outline" className="rounded-full" disabled={!isActive}>
                        <Zap className="mr-2 h-4 w-4" />
                        Ver beneficio
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <CopimEmptyState
          icon={Bot}
          title="No hay módulos visibles"
          description="Cuando tu plan y tus add-ons estén listos, aquí podrás activar y entender mejor tus capacidades disponibles."
        />
      )}
    </div>
  );
};

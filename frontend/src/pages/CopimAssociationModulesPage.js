import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Bot, DollarSign, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CopimPageHeader, formatCopimCurrency } from '../components/copim/CopimModulePrimitives';

export const CopimAssociationModulesPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadModules = async () => {
      try {
        const response = await api.get('/copim/local-association/modules');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading local modules:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar revenue share');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadModules();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-80 w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const association = data.association || {};
  const stats = data.stats || {};
  const modules = data.modules || [];

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Asociacion local"
        title="Gestion de modulos y revenue share"
        description={`Vista administrativa para ${association.name || 'tu asociacion'} con modulos disponibles, adopcion premium y comisiones visibles sin complicar la operacion base.`}
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/campaigns')}>
              Abrir campanas
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
              Ver socios
            </Button>
          </>
        )}
        stats={[
          { label: 'Socios activos', value: stats.active_members || 0, helper: 'Base actual del capitulo' },
          { label: 'Premium activos', value: stats.premium_members || 0, helper: 'Socios con mayor potencial comercial' },
          { label: 'Revenue share', value: formatCopimCurrency(stats.revenue_share_mxn || 0), helper: 'Ingreso estimado del mes' },
          { label: 'Adopcion', value: `${stats.adoption_rate || 0}%`, helper: 'Pulso de activacion actual' },
        ]}
      />

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Como se lee esta vista</CardTitle>
          <CardDescription>La asociacion no activa modulos aqui; usa esta cabina para ver disponibilidad, comisiones y que empujar comercialmente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="h-4 w-4" />
              <p className="font-medium text-foreground">Comision visible</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Cada modulo deja claro cuanto gana el capitulo si un socio lo activa.</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-cyan-600">
              <Users className="h-4 w-4" />
              <p className="font-medium text-foreground">Adopcion premium</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">La meta es que la asociacion vea a cuantos socios ya les hace sentido una capa superior.</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <BarChart3 className="h-4 w-4" />
              <p className="font-medium text-foreground">Lectura simple</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Sin settings complejos ni enterprise pesado: solo revenue share, disponibilidad y siguiente paso.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.id} className="overflow-hidden border-border/70 bg-card/95">
            <div className="grid gap-0 lg:grid-cols-[0.94fr_1.06fr]">
              <div className="border-b border-border/70 bg-gradient-to-br from-slate-950 to-cyan-950 p-6 text-white lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-full bg-white/10 text-white">{module.status}</Badge>
                  <div className="rounded-full border border-white/15 bg-white/10 p-2">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">{module.name}</h2>
                <p className="mt-2 text-sm text-white/72">{module.price_label}</p>
                <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Tu comision</p>
                  <p className="mt-2 text-lg font-semibold text-white">{module.commission_label}</p>
                </div>
              </div>

              <CardContent className="space-y-4 p-6">
                <p className="text-sm leading-7 text-muted-foreground">{module.summary}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Adopcion</p>
                    <p className="mt-2 text-2xl font-semibold">{module.adoption}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comision</p>
                    <p className="mt-2 text-sm font-medium">{module.commission_rate}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Categoria</p>
                    <p className="mt-2 text-sm font-medium">Upsell institucional</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/campaigns')}>
                    Abrir campana
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
                    Revisar socios
                  </Button>
                  <Button className="rounded-full" onClick={() => navigate('/copim/memberships')}>
                    <Zap className="mr-2 h-4 w-4" />
                    Ver adopcion
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

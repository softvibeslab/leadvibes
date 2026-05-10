import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  LineChart,
  Plus,
  Target,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { getEffectiveRole } from '../lib/copimAccess';

const currency = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value || 0);

const stageLabels = {
  prospecto: 'Prospecto',
  contactado: 'Contactado',
  discovery_call: 'Discovery',
  demo_agendada: 'Demo agendada',
  demo_completada: 'Demo completada',
  propuesta_enviada: 'Propuesta',
  negociacion: 'Negociacion',
  contrato_cerrado: 'Contrato',
  onboarding: 'Onboarding',
  active_user: 'Cliente activo',
  perdido: 'Perdido',
};

const roleCopy = {
  rovi_admin: {
    title: 'Revenue HQ',
    subtitle: 'Vista ejecutiva para MRR, pipeline, fuentes, equipos y crecimiento interno de ROVI.',
  },
  rovi_sales: {
    title: 'Sales Desk',
    subtitle: 'Prioriza demos, propuestas y negociaciones con inmobiliarias listas para comprar.',
  },
  rovi_marketing: {
    title: 'Marketing Demand',
    subtitle: 'Mide generacion de demanda, MQLs, fuentes y handoff hacia Sales.',
  },
  rovi_customer_success: {
    title: 'Customer Success',
    subtitle: 'Control de onboarding, adopcion y riesgos tempranos de churn.',
  },
  rovi_ops: {
    title: 'Revenue Ops',
    subtitle: 'Operaciones, automatizaciones, calidad de datos e integraciones comerciales.',
  },
};

const emptyProspectForm = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  source: 'manual',
  broker_count: 5,
  current_crm: 'excel',
  monthly_budget_mxn: 7999,
  expected_mrr_mxn: 7999,
  urgency: '30_days',
  pain_points: '',
  next_action: 'Agendar discovery call',
};

const MetricCard = ({ icon: Icon, label, value, helper }) => (
  <Card className="h-full rounded-lg border-border/70 bg-card/85 shadow-sm">
    <CardContent className="flex min-h-[112px] items-center gap-4 p-5 sm:p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{value}</p>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </div>
    </CardContent>
  </Card>
);

const StagePill = ({ stage, count, max }) => {
  const width = max ? Math.max(8, Math.round((count / max) * 100)) : 0;
  return (
    <div className="rounded-lg border border-border/70 bg-background/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{stageLabels[stage] || stage}</span>
        <Badge variant="outline">{count}</Badge>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const ProspectCard = ({ prospect, onAdvance }) => (
  <Card className="h-full rounded-lg border-border/70 bg-card/85 shadow-sm">
    <CardContent className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">{prospect.company_name}</p>
          <p className="text-sm text-muted-foreground">{prospect.contact_name} · {prospect.source}</p>
        </div>
        <Badge className="bg-primary text-primary-foreground">{prospect.score_label}</Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Score</p>
          <p className="font-semibold">{prospect.score}/100</p>
        </div>
        <div>
          <p className="text-muted-foreground">MRR esperado</p>
          <p className="font-semibold">{currency(prospect.expected_mrr_mxn)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Plan</p>
          <p className="font-semibold capitalize">{prospect.recommended_plan}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(prospect.pain_points || []).slice(0, 3).map((pain) => (
          <Badge key={pain} variant="secondary">{pain}</Badge>
        ))}
      </div>

      <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
        {prospect.next_action || prospect.last_activity || 'Sin siguiente accion registrada'}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline">{stageLabels[prospect.stage] || prospect.stage}</Badge>
        <Button size="sm" variant="outline" onClick={() => onAdvance(prospect)}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Avanzar
        </Button>
      </div>
    </CardContent>
  </Card>
);

const PlanCard = ({ plan }) => (
  <Card className="h-full rounded-lg border-border/70 bg-card/85 shadow-sm">
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>{plan.ideal_for}</CardDescription>
        </div>
        <Badge variant="outline" className="capitalize">{plan.tier}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-3xl font-semibold">{plan.price_mxn ? currency(plan.price_mxn) : 'Cotizacion'}</p>
      <div className="space-y-2">
        {(plan.features || []).map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {feature}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const RoviInternalWorkspacePage = ({ view = 'dashboard' }) => {
  const { api, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [team, setTeam] = useState([]);
  const [stageFilter, setStageFilter] = useState('all');
  const [form, setForm] = useState(emptyProspectForm);

  const effectiveRole = getEffectiveRole(user);
  const header = roleCopy[effectiveRole] || roleCopy.rovi_admin;

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const [dashboardRes, prospectsRes, plansRes, teamRes] = await Promise.all([
        api.get('/rovi-internal/dashboard'),
        api.get('/rovi-internal/prospects'),
        api.get('/rovi-internal/service-plans'),
        api.get('/rovi-internal/team'),
      ]);
      setDashboard(dashboardRes.data);
      setProspects(prospectsRes.data?.prospects || []);
      setPlans(plansRes.data?.plans || []);
      setTeam(teamRes.data?.team || []);
    } catch (error) {
      toast({
        title: 'No pude cargar ROVI Internal',
        description: error.response?.data?.detail || 'Revisa permisos o sesion.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = dashboard?.metrics || {};
  const filteredProspects = useMemo(() => (
    stageFilter === 'all'
      ? prospects
      : prospects.filter((prospect) => prospect.stage === stageFilter)
  ), [prospects, stageFilter]);

  const maxStageCount = Math.max(...(dashboard?.stage_counts || []).map((item) => item.count), 1);

  const advanceProspect = async (prospect) => {
    const stages = dashboard?.stage_counts?.map((item) => item.stage) || Object.keys(stageLabels);
    const currentIndex = stages.indexOf(prospect.stage);
    const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)] || prospect.stage;
    if (nextStage === prospect.stage) return;

    try {
      await api.put(`/rovi-internal/prospects/${prospect.id}`, {
        stage: nextStage,
        last_activity: `Movido a ${stageLabels[nextStage] || nextStage}`,
      });
      toast({ title: 'Prospecto actualizado', description: `${prospect.company_name} avanzo a ${stageLabels[nextStage]}.` });
      await loadWorkspace();
    } catch (error) {
      toast({
        title: 'No se pudo avanzar',
        description: error.response?.data?.detail || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const createProspect = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/rovi-internal/prospects', {
        ...form,
        broker_count: Number(form.broker_count || 1),
        monthly_budget_mxn: Number(form.monthly_budget_mxn || 0),
        expected_mrr_mxn: Number(form.expected_mrr_mxn || 0),
        pain_points: form.pain_points.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setForm(emptyProspectForm);
      toast({ title: 'Prospecto creado', description: 'Ya aparece en el pipeline interno.' });
      await loadWorkspace();
    } catch (error) {
      toast({
        title: 'No se pudo crear',
        description: error.response?.data?.detail || 'Revisa los campos obligatorios.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1560px] space-y-8 px-5 py-7 pb-24 sm:px-7 sm:py-8 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-3">ROVI Internal Workspace</Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">{header.title}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{header.subtitle}</p>
          </div>
          <Button onClick={loadWorkspace} variant="outline" className="w-fit">
            Actualizar
          </Button>
        </div>

        {view === 'dashboard' && (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={CircleDollarSign} label="MRR cerrado" value={currency(metrics.closed_mrr_mxn)} helper="Contratos, onboarding y activos" />
              <MetricCard icon={LineChart} label="MRR ponderado" value={currency(metrics.weighted_mrr_mxn)} helper="Pipeline por probabilidad" />
              <MetricCard icon={Target} label="SQL activos" value={metrics.sql_count || 0} helper={`${metrics.mql_count || 0} MQLs totales`} />
              <MetricCard icon={CalendarClock} label="Demos" value={metrics.demos || 0} helper={`${metrics.open_proposals || 0} propuestas abiertas`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Pipeline SaaS</CardTitle>
                  <CardDescription>Venta B2B de suscripciones ROVI CRM.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {(dashboard?.stage_counts || []).map((item) => (
                    <StagePill key={item.stage} stage={item.stage} count={item.count} max={maxStageCount} />
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Top fuentes</CardTitle>
                  <CardDescription>Ordenado por MRR ponderado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dashboard?.source_stats || []).slice(0, 5).map((source) => (
                    <div key={source.source} className="rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{source.source}</p>
                        <Badge variant="secondary">{source.count}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{currency(source.weighted_mrr_mxn)} ponderado</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle>Prospectos calientes</CardTitle>
                <CardDescription>El sistema prioriza por fit, presupuesto, urgencia y dolor operativo.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-2">
                {(dashboard?.hot_prospects || []).map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} onAdvance={advanceProspect} />
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {view === 'prospects' && (
          <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>Nuevo prospecto SaaS</CardTitle>
                <CardDescription>Alta rapida para campañas, referidos o prospeccion directa.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={createProspect}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Empresa</Label>
                      <Input value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} required />
                    </div>
                    <div>
                      <Label>Contacto</Label>
                      <Input value={form.contact_name} onChange={(event) => setForm({ ...form, contact_name: event.target.value })} required />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                    </div>
                    <div>
                      <Label>Fuente</Label>
                      <Input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} />
                    </div>
                    <div>
                      <Label>Brokers</Label>
                      <Input type="number" value={form.broker_count} onChange={(event) => setForm({ ...form, broker_count: event.target.value })} min="1" />
                    </div>
                    <div>
                      <Label>Budget mensual</Label>
                      <Input type="number" value={form.monthly_budget_mxn} onChange={(event) => setForm({ ...form, monthly_budget_mxn: event.target.value })} min="0" />
                    </div>
                  </div>
                  <div>
                    <Label>Pain points</Label>
                    <Textarea value={form.pain_points} onChange={(event) => setForm({ ...form, pain_points: event.target.value })} placeholder="Separados por coma" />
                  </div>
                  <Button type="submit" disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear prospecto
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Pipeline interno</CardTitle>
                  <CardDescription>{filteredProspects.length} prospectos visibles.</CardDescription>
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filtrar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las etapas</SelectItem>
                    {Object.entries(stageLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-2">
                {filteredProspects.map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} onAdvance={advanceProspect} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'plans' && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}

        {view === 'analytics' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <MetricCard icon={BriefcaseBusiness} label="Pipeline value" value={currency(metrics.pipeline_value_mxn)} helper="MRR potencial abierto" />
            <MetricCard icon={BarChart3} label="Conversion rate" value={`${metrics.conversion_rate || 0}%`} helper="Cerrados sobre total de prospectos" />
            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle>ROI por fuente</CardTitle>
                <CardDescription>Base inicial para decisiones de pauta y canales.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {(dashboard?.source_stats || []).map((source) => (
                  <div key={source.source} className="rounded-lg border border-border/70 bg-background/45 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{source.source}</p>
                      <Badge variant="outline">{source.count} leads</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">MRR cerrado: {currency(source.closed_mrr_mxn)}</p>
                    <p className="text-sm text-muted-foreground">MRR ponderado: {currency(source.weighted_mrr_mxn)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'campaigns' && (
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              ['MQL engine', 'Campañas que generan inmobiliarias calificadas para demo.'],
              ['Nurturing', 'Secuencias para leads sin urgencia inmediata.'],
              ['Handoff Sales', 'Reglas para pasar SQL a ejecutivos con contexto completo.'],
            ].map(([title, description]) => (
              <Card key={title} className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline">Abrir playbook</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {view === 'team' && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {team.map((member) => (
              <Card key={member.id} className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{member.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                    <Badge variant="outline" className="mt-2">{member.role?.replaceAll('_', ' ')}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

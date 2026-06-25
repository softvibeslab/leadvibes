import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const money = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value || 0));

const PageShell = ({ title, subtitle, children, action }) => (
  <div className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">Rovi Gremial OS</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const LoadingState = () => <div className="rounded-2xl border bg-card p-8 text-muted-foreground">Cargando datos gremiales...</div>;
const ErrorState = ({ error }) => <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;

const useGremialApi = (endpoint, fallback = null) => {
  const { api } = useAuth();
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }, [api, endpoint]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
};

const EmptyCard = ({ title = 'Sin registros', children }) => (
  <Card>
    <CardContent className="p-8 text-center text-muted-foreground">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2">{children}</p>
    </CardContent>
  </Card>
);

export const GremialDashboardPage = () => {
  const { data, loading, error, reload } = useGremialApi('/gremial/dashboard', {});
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  const kpis = data?.kpis || {};
  return (
    <PageShell title="Resumen nacional gremial" subtitle="Control operativo de afiliación, renovaciones, oportunidades, licitaciones y alertas por delegación." action={<Button onClick={reload}>Actualizar</Button>}>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Afiliados', kpis.member_count || 0],
          ['Activos', kpis.active_members || 0],
          ['Prospectos abiertos', kpis.leads_open || 0],
          ['Cartera por cobrar', money(kpis.revenue_due || 0)],
          ['Renovaciones pendientes', kpis.memberships_due || 0],
          ['Oportunidades', kpis.opportunities || 0],
          ['Licitaciones', kpis.tenders || 0],
          ['Delegaciones', data?.delegations?.length || 0],
        ].map(([label, value]) => (
          <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Delegaciones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.delegations || []).map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.city}, {item.state}</p></div><Badge>{item.status || 'active'}</Badge></div>)}
            {!data?.delegations?.length && <p className="text-muted-foreground">Aún no hay delegaciones.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>AI Control Tower</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data?.recommendations || []).map((item) => <div key={item.id} className="rounded-xl border p-3"><div className="flex items-center justify-between"><p className="font-medium">{item.title}</p><Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>{item.priority}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 text-sm font-medium">{item.suggested_action}</p></div>)}
            {!data?.recommendations?.length && <p className="text-muted-foreground">Sin recomendaciones abiertas.</p>}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};

const SimpleListPage = ({ title, subtitle, endpoint, renderItem, emptyTitle }) => {
  const { data, loading, error, reload } = useGremialApi(endpoint, []);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return (
    <PageShell title={title} subtitle={subtitle} action={<Button onClick={reload}>Actualizar</Button>}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data || []).map(renderItem)}
      </div>
      {!data?.length && <EmptyCard title={emptyTitle}>Cuando existan datos aparecerán aquí.</EmptyCard>}
    </PageShell>
  );
};

export const GremialDelegationsPage = () => <SimpleListPage title="Delegaciones" subtitle="Operación territorial, presidentes locales y cobertura estatal." endpoint="/gremial/delegations" emptyTitle="Sin delegaciones" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.name}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{item.city}, {item.state}</p><p className="mt-2 text-sm">Presidencia: {item.president_name || 'Pendiente'}</p><Badge className="mt-3">{item.status || 'active'}</Badge></CardContent></Card>} />;

export const GremialMembersPage = () => <SimpleListPage title="Afiliados" subtitle="Padrón nacional/local de empresas afiliadas, score y expediente." endpoint="/gremial/members" emptyTitle="Sin afiliados" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.company_name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">{item.city}, {item.state}</p><div className="flex gap-2"><Badge>{item.member_status}</Badge><Badge variant="secondary">{item.membership_tier}</Badge></div><p className="text-sm">Expediente: {item.profile_completion || 0}% · Engagement: {item.engagement_score || 0}</p></CardContent></Card>} />;

export const GremialMembershipsPage = () => <SimpleListPage title="Renovaciones y membresías" subtitle="Cuotas, vencimientos y cartera por cobrar." endpoint="/gremial/memberships" emptyTitle="Sin membresías" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.plan_name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Afiliado: {item.member_id}</p><p>Saldo: <strong>{money(item.balance_due)}</strong></p><Badge variant={item.payment_status === 'overdue' ? 'destructive' : 'secondary'}>{item.payment_status}</Badge></CardContent></Card>} />;

export const GremialAffiliationPipelinePage = () => {
  const { data, loading, error, reload } = useGremialApi('/gremial/affiliation-leads', []);
  const grouped = useMemo(() => (data || []).reduce((acc, item) => ({ ...acc, [item.stage || 'nuevo']: [...(acc[item.stage || 'nuevo'] || []), item] }), {}), [data]);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  const stages = ['nuevo', 'contactado', 'requisitos_enviados', 'documentos_recibidos', 'convertido'];
  return <PageShell title="Pipeline de afiliación" subtitle="Prospectos, asignación a delegación y conversión a afiliado." action={<Button onClick={reload}>Actualizar</Button>}><div className="grid gap-4 lg:grid-cols-5">{stages.map((stage) => <Card key={stage}><CardHeader><CardTitle className="text-base capitalize">{stage.replaceAll('_', ' ')}</CardTitle></CardHeader><CardContent className="space-y-3">{(grouped[stage] || []).map((lead) => <div key={lead.id} className="rounded-xl border p-3"><p className="font-medium">{lead.company_name}</p><p className="text-sm text-muted-foreground">{lead.contact_name}</p><p className="text-xs text-muted-foreground">{lead.interest}</p></div>)}</CardContent></Card>)}</div></PageShell>;
};

export const GremialServicesPage = () => <SimpleListPage title="Servicios y beneficios" subtitle="Catálogo medible de servicios de valor para afiliados." endpoint="/gremial/services" emptyTitle="Sin servicios" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><Badge>{item.category}</Badge><p className="mt-3 text-sm text-muted-foreground">{item.description}</p></CardContent></Card>} />;

export const GremialOpportunitiesPage = () => <SimpleListPage title="Oportunidades privadas" subtitle="Marketplace interno de oportunidades comerciales para afiliados." endpoint="/gremial/opportunities" emptyTitle="Sin oportunidades" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.state} · {item.sector}</p><p className="mt-2">Presupuesto: {money(item.budget)}</p><Badge className="mt-3">{item.status}</Badge></CardContent></Card>} />;

export const GremialTendersPage = () => <SimpleListPage title="Licitaciones" subtitle="Seguimiento de licitaciones públicas por estado, dependencia y especialidad." endpoint="/gremial/tenders" emptyTitle="Sin licitaciones" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.dependency} · {item.state}</p><p className="mt-2">Monto estimado: {money(item.budget)}</p><Badge className="mt-3">{item.status}</Badge></CardContent></Card>} />;

export const GremialAnalyticsPage = () => <GremialDashboardPage />;
export const GremialAIControlTowerPage = () => <SimpleListPage title="AI Control Tower" subtitle="Recomendaciones accionables de riesgo, renovación, expediente y oportunidades." endpoint="/gremial/ai/recommendations" emptyTitle="Sin recomendaciones" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>{item.priority}</Badge><p className="mt-3 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 text-sm font-medium">{item.suggested_action}</p></CardContent></Card>} />;

export const GremialCoursesPage = () => <PageShell title="Capacitación" subtitle="Cursos, certificaciones y programas formativos gremiales."><EmptyCard title="Módulo conectado en siguiente iteración">La base gremial está lista; se puede conectar al motor de cursos COPIM o a `/api/gremial/courses`.</EmptyCard></PageShell>;
export const GremialEventsPage = () => <PageShell title="Eventos" subtitle="Eventos nacionales/locales, registro, check-in y networking."><EmptyCard title="Módulo conectado en siguiente iteración">La base gremial está lista; se puede conectar al motor de eventos COPIM o a `/api/gremial/events`.</EmptyCard></PageShell>;

export const GremialMemberHomePage = () => {
  const { data, loading, error } = useGremialApi('/gremial/dashboard', {});
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  const member = data?.member || {};
  const membership = data?.membership || {};
  return <PageShell title="Mi portal gremial" subtitle="Autoservicio de membresía, pagos, beneficios, licitaciones y oportunidades."><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>{member.company_name || 'Mi empresa'}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Expediente: {member.profile_completion || 0}%</p><p>Engagement: {member.engagement_score || 0}</p></CardContent></Card><Card><CardHeader><CardTitle>Mi membresía</CardTitle></CardHeader><CardContent><Badge>{membership.payment_status || 'sin estado'}</Badge><p className="mt-2">Saldo: {money(membership.balance_due)}</p></CardContent></Card><Card><CardHeader><CardTitle>Oportunidades</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data?.recommended_opportunities?.length || 0}</p><p className="text-sm text-muted-foreground">Recomendadas</p></CardContent></Card></div></PageShell>;
};
export const GremialMemberProfilePage = () => <GremialMemberHomePage />;
export const GremialMemberMembershipPage = () => <GremialMemberHomePage />;
export const GremialMemberPaymentsPage = () => <SimpleListPage title="Mis pagos" subtitle="Facturas y cuotas pendientes." endpoint="/gremial/memberships" emptyTitle="Sin pagos pendientes" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.plan_name}</CardTitle></CardHeader><CardContent><p>{money(item.balance_due)}</p><Badge>{item.payment_status}</Badge></CardContent></Card>} />;
export const GremialMemberDocumentsPage = () => <SimpleListPage title="Mi expediente" subtitle="Documentos fiscales, legales y técnicos." endpoint="/gremial/documents" emptyTitle="Sin documentos" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.document_type}</CardTitle></CardHeader><CardContent><Badge>{item.status}</Badge><p className="mt-2 text-sm text-muted-foreground">{item.file_url}</p></CardContent></Card>} />;
export const GremialMemberOpportunitiesPage = GremialOpportunitiesPage;
export const GremialMemberTendersPage = GremialTendersPage;
export const GremialMemberCoursesPage = GremialCoursesPage;
export const GremialMemberEventsPage = GremialEventsPage;

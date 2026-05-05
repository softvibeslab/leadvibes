import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, FileText, RefreshCw, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  CopimMemberIdentity,
  CopimEmptyState,
  CopimPageHeader,
  formatCopimCurrency,
  formatCopimDate,
  formatCopimDateTime,
} from '../components/copim/CopimModulePrimitives';
import { buildCopimPath } from '../lib/copimRouting';
import copimPoster from '../assets/copim-platform-poster.jpg';

const statusTone = {
  pending: 'bg-amber-100 text-amber-900',
  active: 'bg-emerald-100 text-emerald-900',
  due: 'bg-amber-100 text-amber-900',
  overdue: 'bg-rose-100 text-rose-900',
  public: 'bg-cyan-100 text-cyan-900',
  members: 'bg-slate-200 text-slate-900',
};

const overviewAssociationImages = [
  'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
];

const overviewEventImages = {
  networking: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
  capacitacion: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  certificacion: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  asamblea: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  webinar: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80',
  default: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
};

const dashboardMediaCards = [
  {
    id: 'institucional',
    title: 'Panorama institucional unificado',
    description: 'Una sola capa visual para capítulos, padrón, membresías, cobranza y agenda nacional.',
    badge: 'Visión ejecutiva',
    image: copimPoster,
    route: '/copim/associations',
    params: { status: 'active' },
  },
  {
    id: 'member-experience',
    title: 'Experiencia del socio más clara',
    description: 'Alta, aprobación, credencial, renovación y participación con una narrativa más simple.',
    badge: 'Portal y adopción',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    route: '/copim/members',
    params: { view: 'pipeline' },
  },
  {
    id: 'events-engine',
    title: 'Agenda y activación visibles',
    description: 'Capacidad, difusión, registros y check-ins en un formato más presentable para demo.',
    badge: 'Eventos y comunidad',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    route: '/copim/events',
    params: { future: true },
  },
];

const SHOW_OVERVIEW_STORY_SECTION = false;

export const CopimOverviewPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/copim/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading COPIM dashboard:', error);
      if (error.response?.status === 403) {
        toast.error('Tu sesión actual no tiene acceso al workspace administrativo de COPIM');
        navigate('/copim-demo', { replace: true });
        return;
      }
      toast.error('No se pudo cargar el dashboard COPIM');
    } finally {
      setLoading(false);
    }
  };

  const bootstrapDemo = async () => {
    setBootstrapping(true);
    try {
      await api.post('/copim/bootstrap-demo');
      toast.success('Datos demo cargados');
      await loadDashboard();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Necesitas un perfil institucional COPIM para sembrar este workspace');
        navigate('/copim-demo', { replace: true });
        return;
      }
      toast.error(error.response?.data?.detail || 'No se pudieron cargar los datos demo');
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-48 w-full rounded-[28px]" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-72 w-full rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <CopimEmptyState
          title="No pudimos cargar el resumen institucional"
          description="Vuelve a intentar o si quieres sembrar el workspace con datos de muestra para revisar el flujo completo."
          actionLabel="Cargar datos demo"
          onAction={bootstrapDemo}
        />
      </div>
    );
  }

  const stats = dashboard.stats || {};
  const openRoute = (pathname, params = {}) => navigate(buildCopimPath(pathname, params));
  const getAssociationPreviewImage = (association, index) => overviewAssociationImages[index % overviewAssociationImages.length];
  const getEventPreviewImage = (event) => overviewEventImages[event?.event_type] || overviewEventImages.default;

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        title="Resumen institucional COPIM"
        description="Vista ejecutiva para operar asociaciones, socios, membresías, facturación y eventos con datos capturables desde el primer día."
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
              <Users className="mr-2 h-4 w-4" />
              Aprobar socios
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => openRoute('/copim/invoices', { payment: 'pending' })}>
              <FileText className="mr-2 h-4 w-4" />
              Cobrar adeudos
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => openRoute('/copim/events', { future: true })}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Crear o revisar evento
            </Button>
            <Button className="rounded-full" onClick={bootstrapDemo} disabled={bootstrapping}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {bootstrapping ? 'Cargando...' : 'Recargar demo'}
            </Button>
          </>
        )}
        stats={[
          { label: 'Asociaciones activas', value: stats.associations_active || 0, helper: `${stats.associations_total || 0} registradas` },
          { label: 'Socios activos', value: stats.members_active || 0, helper: `${stats.members_pending || 0} pendientes` },
          { label: 'Renovaciones por atender', value: stats.memberships_due || 0, helper: 'Cobranza y recordatorios' },
          { label: 'Facturas abiertas', value: stats.invoices_open || 0, helper: `${stats.invoices_overdue || 0} vencidas` },
          { label: 'Eventos próximos', value: stats.events_upcoming || 0, helper: `${stats.event_registrations || 0} registros acumulados` },
        ]}
      />

      {SHOW_OVERVIEW_STORY_SECTION ? (
        <div className="space-y-5">
          <Card className="overflow-hidden border-border/70 bg-card/95">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="flex flex-col justify-between p-6">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-tight">Una cabina visual para vender mejor la operación COPIM</h2>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                      El dashboard ya no solo resume métricas: también presenta la historia del producto con focos visuales, acceso directo por caso y una lectura más clara para comité, presidencia y operación.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Capítulos</p>
                      <p className="mt-3 text-3xl font-semibold">{stats.associations_total || 0}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Narrativa de red institucional</p>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Socios</p>
                      <p className="mt-3 text-3xl font-semibold">{stats.members_active || 0}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Adopción y padrón visible</p>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Eventos</p>
                      <p className="mt-3 text-3xl font-semibold">{stats.events_upcoming || 0}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Activación medible</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button className="rounded-full" onClick={() => openRoute('/copim/associations', { status: 'active' })}>
                    Ver red institucional
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => openRoute('/copim/events', { future: true })}>
                    Ver agenda viva
                  </Button>
                </div>
              </div>

              <div className="relative min-h-[320px] overflow-hidden border-t border-border/70 lg:border-l lg:border-t-0">
                <img
                  src={copimPoster}
                  alt="Panorama COPIM x ROVI"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-900/35 to-cyan-950/68" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
                <div className="relative flex h-full flex-col justify-between p-6 text-white">
                  <div className="space-y-3">
                    <Badge className="w-fit bg-white/15 text-white backdrop-blur">
                      Plataforma institucional
                    </Badge>
                    <div>
                      <p className="text-2xl font-semibold">COPIM x ROVI</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                        Resumen visual, operación por capítulo y gestión del socio en una sola experiencia.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Cobranza visible</p>
                      <p className="mt-2 text-2xl font-semibold">{formatCopimCurrency(stats.invoices_overdue || 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Registros evento</p>
                      <p className="mt-2 text-2xl font-semibold">{stats.event_registrations || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4 px-1">
              {dashboardMediaCards.map((mediaCard) => (
                <button
                  key={mediaCard.id}
                  type="button"
                  onClick={() => openRoute(mediaCard.route, mediaCard.params)}
                  className="group relative min-h-[220px] min-w-[740px] overflow-hidden rounded-[30px] border border-border/70 bg-card/95 text-left transition hover:border-primary/30"
                >
                  <div className="grid min-h-[220px] gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative z-10 flex flex-col justify-between p-6">
                      <div className="space-y-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-200 backdrop-blur">
                          {mediaCard.badge}
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-white">{mediaCard.title}</p>
                          <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300">{mediaCard.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <span>Abrir módulo</span>
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>

                    <div className="relative min-h-[220px] overflow-hidden">
                      <img
                        src={mediaCard.image}
                        alt={mediaCard.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/38 to-transparent" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_32%)]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Cola operativa prioritaria
            </CardTitle>
            <CardDescription>La vista rápida para presidencia y operación antes de abrir cada módulo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => openRoute('/copim/associations', { status: 'onboarding' })}
              className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-left transition hover:border-primary/30 hover:bg-card"
            >
              <Building2 className="h-8 w-8 text-primary" />
              <p className="mt-4 font-semibold">Asociaciones</p>
              <p className="mt-2 text-sm text-muted-foreground">Control nacional, onboarding y expansión por estado.</p>
            </button>
            <button
              type="button"
              onClick={() => openRoute('/copim/memberships', { payment: 'due' })}
              className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-left transition hover:border-primary/30 hover:bg-card"
            >
              <WalletCards className="h-8 w-8 text-primary" />
              <p className="mt-4 font-semibold">Membresías</p>
              <p className="mt-2 text-sm text-muted-foreground">Renovaciones, pagos, recordatorios y valor visible al socio.</p>
            </button>
            <button
              type="button"
              onClick={() => openRoute('/copim/invoices', { payment: 'pending' })}
              className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-left transition hover:border-primary/30 hover:bg-card"
            >
              <FileText className="h-8 w-8 text-primary" />
              <p className="mt-4 font-semibold">Facturación</p>
              <p className="mt-2 text-sm text-muted-foreground">Emisión, envío, vencimiento y conciliación de facturas.</p>
            </button>
            <button
              type="button"
              onClick={() => openRoute('/copim/events', { future: true })}
              className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-left transition hover:border-primary/30 hover:bg-card"
            >
              <CalendarDays className="h-8 w-8 text-primary" />
              <p className="mt-4 font-semibold">Eventos</p>
              <p className="mt-2 text-sm text-muted-foreground">Registro, asistencia y check-in en una operación simple.</p>
            </button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>Asociaciones destacadas</CardTitle>
            <CardDescription>Las primeras entidades que deberían verse bien operadas durante el piloto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard.top_associations || []).map((association, index) => (
              <div
                key={association.id}
                onClick={() => openRoute('/copim/associations', { focus: association.id })}
                className="w-full cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-muted/20 text-left transition hover:border-primary/30 hover:bg-card"
              >
                <div className="grid gap-0 sm:grid-cols-[110px_1fr]">
                  <div className="relative min-h-[132px]">
                    <img
                      src={getAssociationPreviewImage(association, index)}
                      alt={association.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 to-cyan-950/55" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{association.name}</p>
                        <p className="text-sm text-muted-foreground">{association.state} · {association.city || 'Sin ciudad'}</p>
                      </div>
                      <Badge className={`capitalize ${statusTone[association.status] || 'bg-slate-200 text-slate-900'}`}>
                        {association.status}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Activos</p>
                        <p className="font-semibold">{association.active_members || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pendientes</p>
                        <p className="font-semibold">{association.pending_members || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Renovaciones</p>
                        <p className="font-semibold">{association.renewals_due || 0}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={(event) => {
                        event.stopPropagation();
                        openRoute('/copim/members', { association: association.id });
                      }}
                      >
                        Ver padrón
                      </Button>
                      <Button size="sm" variant="outline" onClick={(event) => {
                        event.stopPropagation();
                        openRoute('/copim/memberships', { association: association.id, payment: 'due' });
                      }}
                      >
                        Cobranza
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(event) => {
                        event.stopPropagation();
                        openRoute('/copim/events', { association: association.id, future: true });
                      }}
                      >
                        Agenda
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/95 xl:col-span-1">
          <CardHeader>
            <CardTitle>Socios pendientes</CardTitle>
            <CardDescription>La adopción empieza por hacer fácil la validación y alta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard.pending_members || []).length ? (
              dashboard.pending_members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => openRoute('/copim/members', { focus: member.id, association: member.association_id })}
                  className="w-full cursor-pointer rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <CopimMemberIdentity name={member.full_name} subtitle={member.association_name} />
                    <Badge className="bg-amber-100 text-amber-900">Pendiente</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{member.specialty || 'Sin especialidad'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{member.credential_status}</span>
                    <Button size="sm" variant="outline">
                      Revisar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <CopimEmptyState
                title="No hay socios pendientes"
                description="Cuando empiecen a llegar solicitudes verás aquí las primeras por aprobar."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 xl:col-span-1">
          <CardHeader>
            <CardTitle>Renovaciones críticas</CardTitle>
            <CardDescription>La vista prioritaria para cobranza, seguimiento y continuidad de membresías.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard.renewal_watchlist || []).map((membership) => (
              <button
                key={membership.id}
                type="button"
                onClick={() => openRoute('/copim/memberships', { focus: membership.id, association: membership.association_id })}
                className="w-full rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <CopimMemberIdentity name={membership.member_name} subtitle={membership.association_name} />
                  <Badge className={statusTone[membership.payment_status] || 'bg-slate-200 text-slate-900'}>
                    {membership.payment_status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatCopimDate(membership.renewal_date)}</span>
                  <span className="font-semibold">{formatCopimCurrency(membership.balance_due)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 xl:col-span-1">
          <CardHeader>
            <CardTitle>Facturas por cobrar</CardTitle>
            <CardDescription>Seguimiento documental y financiero antes del vencimiento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard.billing_watchlist || []).length ? (
              dashboard.billing_watchlist.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => openRoute('/copim/invoices', { focus: invoice.id, association: invoice.association_id })}
                  className="w-full rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <div className="mt-2">
                        <CopimMemberIdentity name={invoice.member_name} size="sm" />
                      </div>
                    </div>
                    <Badge className={statusTone[invoice.payment_status] || 'bg-slate-200 text-slate-900'}>
                      {invoice.payment_status}
                    </Badge>
                  </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatCopimDate(invoice.due_date)}</span>
                  <span className="font-semibold">{formatCopimCurrency(invoice.balance_due)}</span>
                </div>
                </button>
              ))
            ) : (
              <CopimEmptyState
                title="No hay facturas abiertas"
                description="Cuando la operación emita nuevas facturas aparecerán aquí las más urgentes."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 xl:col-span-1">
          <CardHeader>
            <CardTitle>Eventos próximos</CardTitle>
            <CardDescription>Registro y check-in conectados a la operación del socio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dashboard.upcoming_events || []).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => openRoute('/copim/events', { focus: event.id, association: event.association_id, future: true })}
                className="w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/20 text-left transition hover:border-primary/30 hover:bg-card"
              >
                <div className="grid gap-0 sm:grid-cols-[110px_1fr]">
                  <div className="relative min-h-[124px]">
                    <img
                      src={getEventPreviewImage(event)}
                      alt={event.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 to-cyan-950/55" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.association_name}</p>
                      </div>
                      <Badge className={statusTone[event.visibility] || 'bg-slate-200 text-slate-900'}>
                        {event.visibility}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{formatCopimDateTime(event.start_at)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.checked_in_count || 0} check-ins · {event.registered_count || 0} registros
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Qué módulos ya responden a la operación</CardTitle>
          <CardDescription>La comunidad e inteligencia quedan como fase siguiente; esta base ya captura data operativa real.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Necesidad operativa</TableHead>
                <TableHead>Resultado esperado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['Asociaciones', 'Administrar capítulos y expansión estatal', 'Control nacional y onboarding', '/copim/associations'],
                ['Socios', 'Alta sencilla, directorio y credencialización', 'Adopción y captura de data', '/copim/members'],
                ['Membresías', 'Cobranza, renovaciones y seguimiento', 'Visibilidad financiera operativa', '/copim/memberships'],
                ['Facturación', 'Emitir, enviar y conciliar cobros', 'Control documental y financiero visible', '/copim/invoices'],
                ['Eventos', 'Registro, asistencia y check-in', 'Participación medible y activación', '/copim/events'],
              ].map(([module, need, result, path]) => (
                <TableRow key={module} className="cursor-pointer" onClick={() => openRoute(path)}>
                  <TableCell className="font-medium">{module}</TableCell>
                  <TableCell>{need}</TableCell>
                  <TableCell className="flex items-center justify-between gap-3">
                    <span>{result}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

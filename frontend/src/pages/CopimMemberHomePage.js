import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, CreditCard, GraduationCap, IdCard, MessageSquareShare, PencilLine, Radio, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import {
  CopimMemberIdentity,
  CopimPageHeader,
  formatCopimCurrency,
  formatCopimDate,
  formatCopimDateTime,
} from '../components/copim/CopimModulePrimitives';

export const CopimMemberHomePage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPortalHome = async () => {
      try {
        const response = await api.get('/copim/member-portal/home');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading member portal home:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar tu portal');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPortalHome();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-72 w-full rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { member, association, current_membership: membership, pending_invoices: pendingInvoices = [], next_event: nextEvent, credential, stats } = data;
  const nextPendingInvoice = pendingInvoices[0];

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mi membresía COPIM"
        description="Un espacio simple para revisar tu estatus, pagar, registrarte a eventos, usar tu credencial y mantener tu perfil al día."
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/member/profile')}>
              <PencilLine className="mr-2 h-4 w-4" />
              Completar perfil
            </Button>
            <Button className="rounded-full" onClick={() => navigate('/copim/member/payments')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar ahora
            </Button>
          </>
        )}
        stats={[
          { label: 'Estatus', value: membership?.payment_status === 'active' ? 'Al corriente' : 'Por renovar', helper: membership?.plan_name || 'Sin plan asignado' },
          { label: 'Saldo pendiente', value: formatCopimCurrency(stats?.amount_due || 0), helper: pendingInvoices.length ? `${pendingInvoices.length} facturas abiertas` : 'Sin adeudos abiertos' },
          { label: 'Próximo evento', value: nextEvent ? formatCopimDate(nextEvent.start_at) : 'Sin agenda', helper: nextEvent?.title || 'Todavía no te registras' },
          { label: 'Credencial', value: credential?.credential_status === 'issued' ? 'Vigente' : 'Pendiente', helper: credential?.credential_id || 'Sin folio' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-border/70 bg-card/95">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <CopimMemberIdentity
                  name={member?.full_name}
                  subtitle={association?.name || 'Asociación COPIM'}
                  avatarUrl={member?.avatar_url}
                  size="lg"
                />
                <Badge className="rounded-full bg-emerald-100 text-emerald-900">
                  {member?.member_status === 'active' ? 'Activo' : member?.member_status || 'Pendiente'}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mi plan</p>
                  <p className="mt-3 text-xl font-semibold">{membership?.plan_name || 'Sin membresía activa'}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {membership?.renewal_date ? `Vence ${formatCopimDate(membership.renewal_date)}` : 'Aún no tienes vencimiento asignado'}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mi saldo</p>
                  <p className="mt-3 text-xl font-semibold">{formatCopimCurrency(stats?.amount_due || 0)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {nextPendingInvoice ? `Siguiente vencimiento ${formatCopimDate(nextPendingInvoice.due_date)}` : 'No tienes cobros pendientes'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full" onClick={() => navigate('/copim/member/events')}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Registrarme a evento
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/member/credential')}>
                  <IdCard className="mr-2 h-4 w-4" />
                  Ver credencial
                </Button>
              </div>
            </div>

            <div className="border-t border-border/70 bg-gradient-to-br from-slate-950 to-cyan-950 p-6 text-white lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
                    <Sparkles className="h-3.5 w-3.5" />
                    Beneficio activo
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">Tu membresía ya tiene vida operativa</h2>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    Consulta tu estatus, registra tu asistencia, comparte tu credencial y mantén tu perfil visible en el directorio profesional.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/60">Credencial</p>
                    <p className="mt-2 text-lg font-semibold">{credential?.credential_id || 'Pendiente'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/60">Próxima fecha</p>
                    <p className="mt-2 text-lg font-semibold">{nextEvent ? formatCopimDateTime(nextEvent.start_at) : 'Sin evento'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Membresía y beneficios</p>
                  <p className="text-sm text-muted-foreground">Plan, vigencia y renovaciones</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {membership?.benefits_summary || 'Activa tu perfil y mantén tu membresía al corriente para aprovechar directorio, eventos y acceso profesional.'}
              </p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate('/copim/member/membership')}>
                Ver mi membresía
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Credencial y visibilidad</p>
                  <p className="text-sm text-muted-foreground">QR, estatus y directorio</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {credential?.credential_status === 'issued'
                  ? 'Tu credencial ya está lista para autenticación, eventos y beneficios visibles dentro de COPIM.'
                  : 'Completa tu validación para emitir tu credencial digital y aparecer correctamente en el directorio.'}
              </p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate('/copim/member/credential')}>
                Abrir credencial
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Agenda y participación</p>
                  <p className="text-sm text-muted-foreground">Eventos, registro y check-in</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {nextEvent
                  ? `Tu próxima actividad es ${nextEvent.title} el ${formatCopimDateTime(nextEvent.start_at)}.`
                  : 'Todavía no tienes eventos registrados. Explora la agenda disponible y confirma tu asistencia.'}
              </p>
              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate('/copim/member/events')}>
                Ver agenda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {[
          {
            title: 'Mis campañas',
            helper: 'WhatsApp, email y SMS',
            icon: Radio,
            onClick: () => navigate('/copim/member/campaigns'),
          },
          {
            title: 'Mi inventario',
            helper: 'Propiedades y piezas visibles',
            icon: Building2,
            onClick: () => navigate('/copim/member/properties'),
          },
          {
            title: 'Mis cursos',
            helper: 'Progreso y certificados',
            icon: GraduationCap,
            onClick: () => navigate('/copim/member/courses'),
          },
          {
            title: 'Comunidad',
            helper: 'Canales y comentarios',
            icon: MessageSquareShare,
            onClick: () => navigate('/copim/member/community'),
          },
          {
            title: 'Mis módulos',
            helper: 'Capacidades activas y add-ons',
            icon: Sparkles,
            onClick: () => navigate('/copim/member/modules'),
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className="rounded-[28px] border border-border/70 bg-card/95 p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <div className="rounded-2xl bg-primary/10 p-3 text-primary w-fit">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.helper}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

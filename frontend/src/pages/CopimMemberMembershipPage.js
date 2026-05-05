import React, { useEffect, useState } from 'react';
import { BadgeCheck, CalendarClock, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CopimPageHeader, formatCopimCurrency, formatCopimDate } from '../components/copim/CopimModulePrimitives';

const paymentTone = {
  active: 'bg-emerald-100 text-emerald-900',
  due: 'bg-amber-100 text-amber-900',
  overdue: 'bg-rose-100 text-rose-900',
  cancelled: 'bg-slate-200 text-slate-900',
};

export const CopimMemberMembershipPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMembership = async () => {
      try {
        const response = await api.get('/copim/member-portal/membership');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading member membership:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar tu membresía');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMembership();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[420px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { current_membership: currentMembership, history = [] } = data;

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mi membresía"
        description="Consulta tu plan actual, beneficios vigentes y el historial básico de renovaciones para mantener tu membresía en orden."
        stats={[
          { label: 'Plan actual', value: currentMembership?.plan_name || 'Sin plan', helper: currentMembership?.billing_period || 'Sin periodo' },
          { label: 'Vencimiento', value: currentMembership?.renewal_date ? formatCopimDate(currentMembership.renewal_date) : 'Sin fecha', helper: 'Fecha de referencia actual' },
          { label: 'Estatus', value: currentMembership?.payment_status || 'Sin estatus', helper: currentMembership?.invoice_status || 'Sin factura' },
          { label: 'Saldo', value: formatCopimCurrency(currentMembership?.balance_due || 0), helper: 'Monto pendiente visible' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-primary/10 p-4 text-primary">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Plan vigente</p>
                <h2 className="mt-2 text-2xl font-semibold">{currentMembership?.plan_name || 'Sin membresía activa'}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className={`rounded-full capitalize ${paymentTone[currentMembership?.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                    {currentMembership?.payment_status || 'sin estatus'}
                  </Badge>
                  <Badge variant="outline" className="rounded-full capitalize">
                    {currentMembership?.billing_period || 'anual'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  Vigencia
                </div>
                <p className="mt-3 text-xl font-semibold">
                  {currentMembership?.renewal_date ? formatCopimDate(currentMembership.renewal_date) : 'Sin fecha'}
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  Monto actual
                </div>
                <p className="mt-3 text-xl font-semibold">{formatCopimCurrency(currentMembership?.plan_price || 0)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-slate-950 to-cyan-950 p-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/72">
                <Sparkles className="h-3.5 w-3.5" />
                Beneficios activos
              </div>
              <p className="mt-4 text-sm leading-7 text-white/75">
                {currentMembership?.benefits_summary || 'Directorio, eventos, credencial y operación institucional activa.'}
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Facturación
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {currentMembership?.invoice_status === 'issued'
                  ? 'Tu facturación ya está emitida para esta etapa.'
                  : currentMembership?.invoice_status === 'pending'
                    ? 'Hay facturación pendiente por emitir o confirmar.'
                    : 'Aún no tienes una factura ligada a esta membresía.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Historial de renovaciones</p>
              <h3 className="mt-2 text-xl font-semibold">Trazabilidad básica de tu membresía</h3>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Renovación</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length ? history.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">{membership.plan_name}</TableCell>
                      <TableCell>{formatCopimDate(membership.renewal_date)}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full capitalize ${paymentTone[membership.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                          {membership.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCopimCurrency(membership.balance_due || 0)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        Todavía no hay historial de membresías.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

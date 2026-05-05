import React, { useEffect, useState } from 'react';
import { CalendarClock, IdCard, QrCode, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CopimMemberIdentity, CopimPageHeader, formatCopimDate } from '../components/copim/CopimModulePrimitives';

export const CopimMemberCredentialPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCredential = async () => {
      try {
        const response = await api.get('/copim/member-portal/credential');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading member credential:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar tu credencial');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCredential();
    return () => {
      cancelled = true;
    };
  }, [api]);

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

  const { member, credential, current_membership: currentMembership } = data;

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mi credencial digital"
        description="Tu identificación operativa para validación, eventos y beneficios dentro de la red COPIM."
        stats={[
          { label: 'Folio', value: credential?.credential_id || 'Pendiente', helper: 'Identificador institucional' },
          { label: 'Estatus', value: credential?.credential_status === 'issued' ? 'Vigente' : 'Pendiente', helper: member?.member_status || 'pending' },
          { label: 'Vigencia', value: credential?.expires_at ? formatCopimDate(credential.expires_at) : 'Sin fecha', helper: currentMembership?.plan_name || 'Sin plan' },
          { label: 'Directorio', value: credential?.directory_visible ? 'Visible' : 'Privado', helper: 'Configuración actual' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/72">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Credencial COPIM
                </div>
                <h2 className="mt-4 text-2xl font-semibold">{credential?.credential_id || 'Pendiente de emisión'}</h2>
              </div>
              <Badge className="rounded-full bg-emerald-400/20 text-emerald-100">
                {credential?.credential_status === 'issued' ? 'Vigente' : 'Pendiente'}
              </Badge>
            </div>

            <CopimMemberIdentity
              name={member?.full_name}
              subtitle={member?.title || member?.specialty || 'Asociado COPIM'}
              avatarUrl={member?.avatar_url}
              size="lg"
              className="rounded-3xl border border-white/10 bg-white/10 p-4"
              textClassName="text-white"
              subtitleClassName="text-white/68"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <IdCard className="h-4 w-4" />
                  Estatus de membresía
                </div>
                <p className="mt-3 text-xl font-semibold">{currentMembership?.payment_status || 'Sin estatus'}</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CalendarClock className="h-4 w-4" />
                  Vigencia
                </div>
                <p className="mt-3 text-xl font-semibold">
                  {credential?.expires_at ? formatCopimDate(credential.expires_at) : 'Pendiente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4 text-primary" />
                Código QR
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-border/70 bg-white p-4">
                {credential?.qr_url ? (
                  <img src={credential.qr_url} alt="QR credencial COPIM" className="mx-auto h-56 w-56 rounded-2xl object-contain" />
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    QR pendiente
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Uso recomendado</p>
                <h3 className="mt-2 text-2xl font-semibold">Lista para validar tu acceso</h3>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Usa esta credencial para check-ins, validación interna, directorio y beneficios. Su vigencia sigue la operación de tu membresía.
              </p>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-medium">Asociado</p>
                  <p className="mt-2 text-muted-foreground">{member?.full_name}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-medium">Plan actual</p>
                  <p className="mt-2 text-muted-foreground">{currentMembership?.plan_name || 'Sin membresía activa'}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-medium">Visibilidad en directorio</p>
                  <p className="mt-2 text-muted-foreground">{credential?.directory_visible ? 'Visible para otros socios' : 'Oculta para otros socios'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

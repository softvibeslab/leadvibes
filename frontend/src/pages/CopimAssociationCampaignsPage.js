import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, MessageSquareShare, Radio, Send, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CopimPageHeader } from '../components/copim/CopimModulePrimitives';

const channelMeta = {
  WhatsApp: { icon: MessageSquareShare, tone: 'bg-emerald-100 text-emerald-900' },
  Email: { icon: Mail, tone: 'bg-cyan-100 text-cyan-900' },
  SMS: { icon: Smartphone, tone: 'bg-amber-100 text-amber-900' },
};

export const CopimAssociationCampaignsPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCampaigns = async () => {
      try {
        const response = await api.get('/copim/local-association/campaigns');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading local campaigns:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudieron cargar las campanas');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCampaigns();
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

  const campaigns = data.campaigns || [];
  const stats = data.stats || {};
  const association = data.association || {};

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Asociacion local"
        title="Campanas del capitulo"
        description={`Vista operativa de comunicacion para ${association.name || 'tu asociacion'} con foco en renovaciones, eventos y activacion semanal.`}
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
              Revisar socios objetivo
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/events')}>
              Abrir agenda
            </Button>
          </>
        )}
        stats={[
          { label: 'Campanas activas', value: stats.campaigns_total || 0, helper: 'WhatsApp, email y SMS' },
          { label: 'Mensajes enviados', value: stats.sent_total || 0, helper: 'Volumen de salida del capitulo' },
          { label: 'Respuestas visibles', value: stats.responses_total || 0, helper: 'Interes o confirmaciones' },
          { label: 'Canales activos', value: stats.active_channels || 0, helper: 'Difusion coordinada' },
        ]}
      />

      <div className="grid gap-5">
        {campaigns.map((campaign) => {
          const meta = channelMeta[campaign.channel] || { icon: Radio, tone: 'bg-slate-100 text-slate-900' };
          const Icon = meta.icon;
          return (
            <Card key={campaign.id} className="overflow-hidden border-border/70 bg-card/95">
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="border-b border-border/70 bg-gradient-to-br from-slate-950 to-cyan-950 p-6 text-white lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={`rounded-full ${meta.tone}`}>
                      <Icon className="mr-1.5 h-3.5 w-3.5" />
                      {campaign.channel}
                    </Badge>
                    <Badge className="rounded-full bg-white/10 text-white">{campaign.status || 'Activa'}</Badge>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{campaign.campaign_name}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/72">{campaign.goal}</p>
                  <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/60">Siguiente movimiento</p>
                    <p className="mt-2 text-sm leading-7 text-white/80">{campaign.next_action}</p>
                  </div>
                </div>

                <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Enviados</p>
                    <p className="mt-2 text-3xl font-semibold">{campaign.sent || 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Entregados / aperturas</p>
                    <p className="mt-2 text-3xl font-semibold">{campaign.delivered_rate || campaign.open_rate || 0}%</p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Respuestas</p>
                    <p className="mt-2 text-3xl font-semibold">{campaign.responses || 0}</p>
                  </div>
                  <div className="flex flex-col justify-between rounded-3xl border border-border/70 bg-background/80 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Accion rapida</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">Cruza esta campana con renovaciones y registros pendientes del capitulo.</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/copim/memberships')}>
                        Ver renovaciones
                      </Button>
                      <Button size="sm" className="rounded-full" onClick={() => navigate('/copim/events')}>
                        Abrir eventos
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Lectura operativa</CardTitle>
          <CardDescription>En esta fase la asociacion ya puede usar difusion como palanca de cobro, agenda y activacion sin meter automatizaciones pesadas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Send className="h-4 w-4" />
              <p className="font-medium text-foreground">Cobranza visible</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Reutiliza campanas para renovar membresias y bajar vencidos con menos friccion.</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-cyan-600">
              <Mail className="h-4 w-4" />
              <p className="font-medium text-foreground">Agenda activa</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Cada evento puede tener narrativa de difusion simple y facil de seguir por operacion local.</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Smartphone className="h-4 w-4" />
              <p className="font-medium text-foreground">Seguimiento semanal</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">La asociacion ve resultados por canal sin perder claridad ni inflar la experiencia.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

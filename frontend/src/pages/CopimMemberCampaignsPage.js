import React, { useEffect, useState } from 'react';
import { MessageSquareText, Radio, Send, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { CopimEmptyState, CopimPageHeader } from '../components/copim/CopimModulePrimitives';

const channelTone = {
  whatsapp: 'bg-emerald-100 text-emerald-900',
  email: 'bg-cyan-100 text-cyan-900',
  sms: 'bg-amber-100 text-amber-900',
};

export const CopimMemberCampaignsPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCampaigns = async () => {
      try {
        const response = await api.get('/copim/member-portal/campaigns');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading member campaigns:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudieron cargar tus campañas');
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
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const summary = data.summary || {};
  const campaigns = data.campaigns || [];

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mis campañas"
        description="Una vista simple para entender tus envíos, el canal que mejor responde y el seguimiento comercial que ya está en movimiento."
        stats={[
          { label: 'Activas', value: summary.active_count || 0, helper: 'Campañas visibles' },
          { label: 'Envíos', value: summary.total_sent || 0, helper: 'Difusión acumulada' },
          { label: 'Mejor canal', value: summary.best_channel || 'Sin canal', helper: 'Mayor respuesta visible' },
          { label: 'Respuesta', value: `${summary.response_rate || 0}%`, helper: 'Pulso comercial actual' },
        ]}
      />

      {campaigns.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden border-border/70 bg-card/95">
              <div className="border-b border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <Badge className={`rounded-full capitalize ${channelTone[campaign.channel] || 'bg-white/15 text-white'}`}>
                    {campaign.channel}
                  </Badge>
                  <div className="rounded-full border border-white/12 bg-white/10 p-2">
                    <Radio className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="mt-4 text-2xl font-semibold">{campaign.title}</h2>
                <p className="mt-2 text-sm text-white/72">{campaign.last_activity_label}</p>
              </div>

              <CardContent className="space-y-4 p-5">
                <p className="text-sm leading-7 text-muted-foreground">{campaign.description}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Send className="h-4 w-4" />
                      Enviados
                    </div>
                    <p className="mt-3 text-2xl font-semibold">{campaign.sent_count || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Respuesta
                    </div>
                    <p className="mt-3 text-2xl font-semibold">{campaign.response_count || campaign.confirmed_count || 0}</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  {campaign.delivered_rate ? <p>Entregados: {campaign.delivered_rate}%</p> : null}
                  {campaign.open_rate ? <p>Aperturas: {campaign.open_rate}%</p> : null}
                  {campaign.click_rate ? <p>Clicks: {campaign.click_rate}%</p> : null}
                  {campaign.confirmed_count ? <p>Confirmados: {campaign.confirmed_count}</p> : null}
                </div>

                <div className="rounded-3xl border border-border/70 bg-slate-950 p-4 text-sm text-white/75">
                  <div className="flex items-center gap-2 text-white">
                    <MessageSquareText className="h-4 w-4" />
                    Siguiente paso
                  </div>
                  <p className="mt-3">{campaign.cta_label || 'Abrir seguimiento comercial'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <CopimEmptyState
          icon={Radio}
          title="Aún no tienes campañas visibles"
          description="Cuando tu capa comercial empiece a operar, aquí verás tus envíos y su respuesta por canal."
        />
      )}
    </div>
  );
};

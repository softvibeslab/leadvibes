import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Presentation, Store, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { apiError, ErrorState, formatDate, getId, LoadingState, MenuVibesPage } from './shared';

const Metric = ({ label, value, icon: Icon, tone = 'text-primary bg-primary/10' }) => <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value ?? 0}</p></div><span className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></span></CardContent></Card>;

export const MenuVibesDashboardPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { setData((await api.get('/menuvibes/dashboard')).data); } catch (e) { setError(apiError(e, 'No se pudo cargar el resumen comercial.')); } }, [api]);
  useEffect(() => { load(); }, [load]);
  const recent = useMemo(() => data?.recent_prospects || data?.recent || [], [data]);
  if (!data && !error) return <MenuVibesPage title="Panel comercial"><LoadingState /></MenuVibesPage>;
  return <MenuVibesPage title="Panel comercial" description="Prioridades del equipo, seguimiento y avance de demos." action={<Button asChild><Link to="/menuvibes/prospects">Ver prospectos</Link></Button>}>
    {error ? <ErrorState message={error} onRetry={load} /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Prospectos totales" value={data.total_prospects ?? data.total ?? 0} icon={Store} />
        <Metric label="Sin siguiente acción" value={data.missing_follow_up ?? 0} icon={AlertTriangle} tone="text-amber-600 bg-amber-500/10" />
        <Metric label="Seguimientos vencidos" value={data.overdue_follow_up ?? 0} icon={CalendarClock} tone="text-red-600 bg-red-500/10" />
        <Metric label="Demos listas" value={data.demo_counts?.ready ?? data.demos_ready ?? 0} icon={Presentation} tone="text-emerald-600 bg-emerald-500/10" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Prospectos recientes</CardTitle></CardHeader><CardContent className="space-y-3">{recent.length ? recent.map((item) => <Link key={getId(item)} to={`/menuvibes/prospects/${getId(item)}`} className="flex items-center justify-between rounded-lg border p-3 transition hover:border-primary/50 hover:bg-muted/40"><div><p className="font-medium">{item.business_name}</p><p className="text-sm text-muted-foreground">{item.city || item.zone || 'Ubicación pendiente'} · {formatDate(item.created_at)}</p></div><Badge variant="secondary">{item.stage}</Badge></Link>) : <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay prospectos.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Avance por etapa</CardTitle></CardHeader><CardContent className="space-y-3">{Object.entries(data.stage_counts || {}).map(([stage, count]) => <div key={stage} className="flex items-center justify-between border-b pb-2 text-sm"><span className="capitalize">{stage.replaceAll('_', ' ')}</span><Badge variant="outline">{count}</Badge></div>)}{!Object.keys(data.stage_counts || {}).length && <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>}<div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />Los cierres ganados no generan alertas de seguimiento.</div></CardContent></Card>
      </div>
    </>}
  </MenuVibesPage>;
};

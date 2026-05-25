import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Loader2,
  MessageSquareText,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Upload,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';

const segmentLabels = {
  buy_sell: 'Compra/venta',
  women_family: 'Mujeres/familia',
  wellness: 'Bienestar',
  business: 'Negocios',
  expats_foodies: 'Expats/foodies',
  other: 'Otros',
};

const outreachLabels = {
  manual_permission: 'Manual permiso',
  semi_automated: 'Semi-automatizado',
  aggressive_controlled: 'Agresivo controlado',
};

const postStatusLabels = {
  draft: 'Borrador',
  approved: 'Aprobado',
  published_manual: 'Publicado manual',
  skipped: 'Omitido',
};

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const currency = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value || 0);

const number = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 0,
  }).format(value || 0);

const short = (value = '', max = 120) => {
  const text = String(value || '').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const StatCard = ({ icon: Icon, label, value, helper }) => (
  <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
    <CardContent className="flex min-h-[116px] items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-2xl font-semibold leading-tight text-foreground">{value}</p>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      </div>
    </CardContent>
  </Card>
);

const SegmentBadge = ({ segment }) => (
  <Badge variant="outline">{segmentLabels[segment] || segment || 'Sin segmento'}</Badge>
);

const MetricForm = ({ experiments, selectedExperimentId, setSelectedExperimentId, onSubmit, saving }) => {
  const [form, setForm] = useState({
    variant_key: 'A',
    replies: 0,
    clicks: 0,
    payments: 0,
    revenue_mxn: 0,
    refunds: 0,
    complaints: 0,
    notes: '',
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      replies: Number(form.replies) || 0,
      clicks: Number(form.clicks) || 0,
      payments: Number(form.payments) || 0,
      revenue_mxn: Number(form.revenue_mxn) || 0,
      refunds: Number(form.refunds) || 0,
      complaints: Number(form.complaints) || 0,
    });
  };

  return (
    <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
      <div className="xl:col-span-2">
        <Label>Experimento</Label>
        <Select value={selectedExperimentId} onValueChange={setSelectedExperimentId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona experimento" />
          </SelectTrigger>
          <SelectContent>
            {experiments.map((experiment) => (
              <SelectItem key={experiment.id} value={experiment.id}>{experiment.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Variante</Label>
        <Select value={form.variant_key} onValueChange={(value) => update('variant_key', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B">B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Revenue MXN</Label>
        <Input type="number" min="0" value={form.revenue_mxn} onChange={(event) => update('revenue_mxn', event.target.value)} />
      </div>
      {['replies', 'clicks', 'payments', 'refunds', 'complaints'].map((field) => (
        <div key={field}>
          <Label>{field}</Label>
          <Input type="number" min="0" value={form[field]} onChange={(event) => update(field, event.target.value)} />
        </div>
      ))}
      <div className="md:col-span-2 xl:col-span-4">
        <Label>Notas</Label>
        <Textarea rows={3} value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Qué pasó, grupo, aprendizaje, objeciones o siguiente prueba." />
      </div>
      <div className="md:col-span-2 xl:col-span-4">
        <Button type="submit" disabled={saving || !selectedExperimentId}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
          Registrar métrica
        </Button>
      </div>
    </form>
  );
};

export const VibeLabPage = () => {
  const { api } = useAuth();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState('');
  const [savingMetric, setSavingMetric] = useState(false);
  const [updatingPost, setUpdatingPost] = useState('');
  const [selectedExperimentId, setSelectedExperimentId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vibe-lab/dashboard');
      setDashboard(response.data);
      const experiments = response.data?.experiments || [];
      if (!selectedExperimentId && experiments.length) {
        setSelectedExperimentId(experiments[0].id);
      }
    } catch (error) {
      toast({
        title: 'No pude cargar VibeLab',
        description: error.response?.data?.detail || error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = dashboard?.summary || EMPTY_OBJECT;
  const groups = dashboard?.top_groups || EMPTY_ARRAY;
  const offers = dashboard?.offers || EMPTY_ARRAY;
  const experiments = dashboard?.experiments || EMPTY_ARRAY;
  const posts = dashboard?.posts || EMPTY_ARRAY;
  const metrics = dashboard?.metrics || EMPTY_OBJECT;

  const selectedExperiment = useMemo(
    () => experiments.find((experiment) => experiment.id === selectedExperimentId) || experiments[0],
    [experiments, selectedExperimentId]
  );

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const response = await api.post('/vibe-lab/seed-defaults');
      toast({ title: 'VibeLab listo', description: response.data?.message || 'Base sembrada.' });
      await loadDashboard();
    } catch (error) {
      toast({ title: 'Error al sembrar', description: error.response?.data?.detail || error.message, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  const importSuperlist = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await api.post('/vibe-lab/import-superlist', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: 'Superlist importada',
        description: `${number(response.data?.eligible || 0)} grupos elegibles, ${number(response.data?.excluded || 0)} excluidos.`,
      });
      await loadDashboard();
    } catch (error) {
      toast({ title: 'Error al importar', description: error.response?.data?.detail || error.message, variant: 'destructive' });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const generatePosts = async (experimentId) => {
    setGenerating(experimentId);
    try {
      const response = await api.post(`/vibe-lab/experiments/${experimentId}/generate-posts`);
      toast({ title: 'Borradores generados', description: `${number(response.data?.created || 0)} posts quedaron en cola de aprobación.` });
      await loadDashboard();
      setActiveTab('posts');
    } catch (error) {
      toast({ title: 'Error al generar posts', description: error.response?.data?.detail || error.message, variant: 'destructive' });
    } finally {
      setGenerating('');
    }
  };

  const updatePostStatus = async (postId, status) => {
    setUpdatingPost(postId);
    try {
      await api.put(`/vibe-lab/posts/${postId}/status`, null, { params: { status } });
      toast({ title: 'Post actualizado', description: postStatusLabels[status] || status });
      await loadDashboard();
    } catch (error) {
      toast({ title: 'Error al actualizar post', description: error.response?.data?.detail || error.message, variant: 'destructive' });
    } finally {
      setUpdatingPost('');
    }
  };

  const recordMetric = async (payload) => {
    setSavingMetric(true);
    try {
      await api.post('/vibe-lab/metrics', {
        ...payload,
        experiment_id: selectedExperimentId,
      });
      toast({ title: 'Métrica registrada', description: 'El experimento ya tiene nuevo aprendizaje.' });
      await loadDashboard();
    } catch (error) {
      toast({ title: 'Error al registrar métrica', description: error.response?.data?.detail || error.message, variant: 'destructive' });
    } finally {
      setSavingMetric(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-foreground">VibeLab</h1>
              <p className="text-sm text-muted-foreground">Modela ofertas, segmenta grupos, coordina agentes y mide pruebas A/B sin autoposting masivo.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={loadDashboard} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
          <Button variant="outline" onClick={seedDefaults} disabled={seeding}>
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Sembrar MVP
          </Button>
          <Label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar Superlist
            <Input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importSuperlist} disabled={importing} />
          </Label>
        </div>
      </div>

      {(dashboard?.seed_needed || dashboard?.import_needed) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {dashboard?.seed_needed ? 'Sembrar MVP crea ofertas, grupos prioritarios y experimentos base. ' : ''}
              {dashboard?.import_needed ? 'Importar la Superlist reemplaza los placeholders por grupos reales con score y exclusiones.' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gauge} label="Grupos elegibles" value={number(summary.eligible_groups || 0)} helper={`${number(summary.excluded_groups || 0)} excluidos por riesgo`} />
        <StatCard icon={WalletCards} label="Ofertas activas" value={number(summary.offers || 0)} helper="MVP digital de entrega inmediata" />
        <StatCard icon={FlaskConical} label="Experimentos" value={number(summary.experiments || 0)} helper={`${number(summary.draft_posts || 0)} posts pendientes`} />
        <StatCard icon={BarChart3} label="Revenue medido" value={currency(summary.revenue_mxn || 0)} helper={`${number(summary.payments || 0)} pagos registrados`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 md:w-fit md:grid-cols-5">
          <TabsTrigger value="overview">Mapa</TabsTrigger>
          <TabsTrigger value="offers">Ofertas</TabsTrigger>
          <TabsTrigger value="experiments">A/B</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Segmentos</CardTitle>
              <CardDescription>Distribución de grupos elegibles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dashboard?.segments || []).map((item) => (
                <div key={item.segment} className="rounded-lg border border-border/70 bg-background/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.label}</p>
                    <Badge variant="outline">{number(item.count)}</Badge>
                  </div>
                </div>
              ))}
              {!dashboard?.segments?.length && <p className="text-sm text-muted-foreground">Aún no hay segmentos. Siembra o importa la Superlist.</p>}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Grupos priorizados</CardTitle>
              <CardDescription>Score, segmento y propuesta sugerida por grupo.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Propuesta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell><SegmentBadge segment={group.segment} /></TableCell>
                      <TableCell>{group.platform}</TableCell>
                      <TableCell>{number(group.score)}</TableCell>
                      <TableCell className="max-w-[320px] text-sm text-muted-foreground">{short(group.proposed_value, 110)}</TableCell>
                    </TableRow>
                  ))}
                  {!groups.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Sin grupos todavía.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="grid gap-4 lg:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id} className="rounded-lg border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{offer.title}</CardTitle>
                  <SegmentBadge segment={offer.segment} />
                </div>
                <CardDescription>{offer.offer_type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{offer.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground">Precio</p>
                    <p className="font-semibold">{currency(offer.price_mxn)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground">Entrega</p>
                    <p className="font-semibold">{number(offer.delivery_minutes)} min</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">CTA</p>
                  <p className="mt-1 text-sm">{offer.cta}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Valor</p>
                  <p className="mt-1 text-sm">{offer.value_prop}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {!offers.length && <p className="text-sm text-muted-foreground">Sembrar MVP crea las 3 ofertas iniciales.</p>}
        </TabsContent>

        <TabsContent value="experiments" className="space-y-5">
          <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Experimentos A/B</CardTitle>
              <CardDescription>Cada experimento genera posts en borrador con aprobación humana obligatoria.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Experimento</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments.map((experiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell className="min-w-[240px]">
                        <p className="font-medium">{experiment.name}</p>
                        <p className="text-xs text-muted-foreground">{short(experiment.hypothesis, 90)}</p>
                      </TableCell>
                      <TableCell><SegmentBadge segment={experiment.segment} /></TableCell>
                      <TableCell>{outreachLabels[experiment.outreach_mode] || experiment.outreach_mode}</TableCell>
                      <TableCell>{number(experiment.audience_group_ids?.length || 0)}</TableCell>
                      <TableCell>{experiment.success_metric}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => generatePosts(experiment.id)} disabled={generating === experiment.id}>
                          {generating === experiment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                          Generar posts
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!experiments.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin experimentos.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedExperiment && (
            <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle>Variantes de {selectedExperiment.name}</CardTitle>
                <CardDescription>Copy listo para aprobación, ajuste o prueba manual.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {(selectedExperiment.variants || []).map((variant) => (
                  <div key={variant.key} className="rounded-lg border border-border/70 bg-background/45 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-semibold">Variante {variant.key}: {variant.name}</p>
                      <Badge variant="outline">{variant.cta}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{variant.copy}</p>
                    {variant.expected_signal && <p className="mt-3 text-xs text-muted-foreground">Señal esperada: {variant.expected_signal}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-5">
          <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Cola de posts</CardTitle>
              <CardDescription>No hay autoposting: todo queda en borrador, aprobación o publicado manual.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Riesgo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="min-w-[180px]">
                        <p className="font-medium">{post.metadata?.group_name || post.audience_group_id}</p>
                        <p className="text-xs text-muted-foreground">{post.metadata?.platform}</p>
                      </TableCell>
                      <TableCell>{post.variant_key}</TableCell>
                      <TableCell className="max-w-[360px] text-sm text-muted-foreground">{short(post.message, 180)}</TableCell>
                      <TableCell className="max-w-[240px] text-xs text-muted-foreground">{post.approval_warning}</TableCell>
                      <TableCell><Badge variant="outline">{postStatusLabels[post.status] || post.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => updatePostStatus(post.id, 'approved')} disabled={updatingPost === post.id || post.status !== 'draft'}>
                            {updatingPost === post.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Aprobar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updatePostStatus(post.id, 'published_manual')} disabled={updatingPost === post.id}>
                            <MessageSquareText className="mr-2 h-4 w-4" />
                            Manual
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!posts.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Genera posts desde un experimento.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Registrar aprendizaje</CardTitle>
              <CardDescription>Captura replies, clicks, pagos, revenue y quejas para decidir ganador.</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricForm
                experiments={experiments}
                selectedExperimentId={selectedExperimentId}
                setSelectedExperimentId={setSelectedExperimentId}
                onSubmit={recordMetric}
                saving={savingMetric}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>Lectura rápida del experimento seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedExperiment ? (
                <>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Experimento</p>
                    <p className="font-medium">{selectedExperiment.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Ganador</p>
                      <p className="text-xl font-semibold">{metrics[selectedExperiment.id]?.winner || 'Sin datos'}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Conversión</p>
                      <p className="text-xl font-semibold">{metrics[selectedExperiment.id]?.conversion_rate || 0}%</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Pagos</p>
                      <p className="text-xl font-semibold">{number(metrics[selectedExperiment.id]?.payments || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-xl font-semibold">{currency(metrics[selectedExperiment.id]?.revenue_mxn || 0)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/45 p-3">
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Variantes</p>
                    {Object.entries(metrics[selectedExperiment.id]?.variants || {}).map(([variant, values]) => (
                      <div key={variant} className="flex items-center justify-between gap-3 py-1 text-sm">
                        <span>Variante {variant}</span>
                        <span className="text-muted-foreground">{number(values.payments)} pagos · {currency(values.revenue_mxn)}</span>
                      </div>
                    ))}
                    {!Object.keys(metrics[selectedExperiment.id]?.variants || {}).length && (
                      <p className="text-sm text-muted-foreground">Sin métricas por variante.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona o crea un experimento.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="rounded-lg border border-border/70 bg-card/90 p-4 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Los agentes recomendados para operar este flujo son: VibeLab Orquestador, Audience Intel, Offer Architect, WhatsApp Copywriter,
            Fulfillment, A/B Analyst y Risk Guardian. Todos respetan aprobación humana antes de publicar.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Brain,
  Clock3,
  Cloud,
  Cpu,
  Database,
  FileText,
  Gauge,
  KeyRound,
  Loader2,
  PlugZap,
  Play,
  Save,
  Server,
  SlidersHorizontal,
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
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';

const currency = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value || 0);

const number = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 0,
  }).format(value || 0);

const toolLabels = {
  list_leads: 'Leads',
  lead_metrics: 'Metricas',
  marketplace_recommendations: 'Marketplace',
  copim_context: 'COPIM',
  rovi_internal_metrics: 'ROVI',
  write_actions: 'Escritura',
};

const providerPresets = [
  {
    id: 'chat.z',
    provider: 'chat.z',
    label: 'Chat.Z / GLM',
    badge: 'Cloud',
    icon: Cloud,
    defaultModel: 'glm-5',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    apiKeyEnv: 'ROVI_AI_API_KEY',
    description: 'Proveedor principal de ROVI para produccion y pruebas con token remoto.',
    helper: 'Requiere variable ROVI_AI_API_KEY en backend.',
  },
  {
    id: 'ollama',
    provider: 'ollama',
    label: 'Ollama local',
    badge: 'Local',
    icon: Server,
    defaultModel: 'qwen2.5:3b',
    baseUrl: 'http://host.docker.internal:11434',
    apiKeyEnv: '',
    description: 'Modelos locales sin costo por token, ideal para desarrollo y datos sensibles.',
    helper: 'En Docker usa host.docker.internal; sin Docker usa localhost.',
  },
  {
    id: 'openai_compatible',
    provider: 'openai_compatible',
    label: 'OpenAI compatible',
    badge: 'API',
    icon: PlugZap,
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    description: 'Cualquier API con formato /chat/completions compatible con OpenAI.',
    helper: 'Puedes cambiar URL, modelo y variable de key.',
  },
];

const modelOptionsByProvider = {
  'chat.z': ['glm-5', 'glm-4.5', 'glm-4.5-air', 'glm-4-plus'],
  ollama: ['qwen2.5:3b', 'llama3.2:latest', 'phi3:mini', 'llama3.1:8b', 'mistral:7b'],
  openai_compatible: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1'],
};

const getProviderPreset = (provider) =>
  providerPresets.find((preset) => preset.provider === provider) || providerPresets[0];

const getModelOptions = (provider) => modelOptionsByProvider[provider] || [];

const keyStatusLabel = (config) => {
  if (config?.api_key_required === false) return 'local';
  return config?.api_key_configured ? 'key ok' : 'sin key';
};

const StatCard = ({ icon: Icon, label, value, helper }) => (
  <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
    <CardContent className="flex min-h-[118px] items-center gap-4 p-5">
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

const RoleUsageRow = ({ item }) => (
  <div className="rounded-lg border border-border/70 bg-background/45 p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="font-medium">{item.role_scope?.replaceAll('_', ' ')}</p>
      <Badge variant="outline">{number(item.runs)} runs</Badge>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(6, item.tokens / 400))}%` }} />
    </div>
    <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{number(item.tokens)} tokens</span>
      <span>{currency(item.cost_mxn)}</span>
    </div>
  </div>
);

export const RoviAIControlTowerPage = () => {
  const { api } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importingGraph, setImportingGraph] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [roleScopes, setRoleScopes] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [form, setForm] = useState(null);
  const [knowledgeRole, setKnowledgeRole] = useState('global');
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeFile, setKnowledgeFile] = useState(null);
  const [graphImport, setGraphImport] = useState(null);
  const [activeTab, setActiveTab] = useState('tower');
  const [testMessage, setTestMessage] = useState('Analiza mis prioridades de hoy con el contexto disponible.');
  const [testResponse, setTestResponse] = useState(null);

  const selectedConfig = useMemo(
    () => configs.find((config) => config.id === selectedConfigId) || configs[0],
    [configs, selectedConfigId]
  );
  const activeProvider = getProviderPreset(form?.provider);
  const modelOptions = getModelOptions(form?.provider);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ai-control/dashboard');
      const payload = response.data || {};
      setDashboard(payload);
      setConfigs(payload.configs || []);
      setRoleScopes(payload.knowledge_scopes || payload.role_scopes || []);
      setGraphImport((payload.knowledge_files || []).find((file) => file.source_kind === 'graphify_rovi_workspace') || null);
      if (!selectedConfigId && payload.configs?.length) {
        setSelectedConfigId(payload.configs[0].id);
      }
    } catch (error) {
      toast({
        title: 'No pude cargar AI Control Tower',
        description: error.response?.data?.detail || 'Revisa permisos o sesion.',
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

  useEffect(() => {
    if (selectedConfig) {
      setForm({
        name: selectedConfig.name || '',
        description: selectedConfig.description || '',
        provider: selectedConfig.provider || 'chat.z',
        model: selectedConfig.model || 'glm-5',
        base_url: selectedConfig.base_url || '',
        api_key_env: selectedConfig.api_key_env || 'ROVI_AI_API_KEY',
        system_prompt: selectedConfig.system_prompt || '',
        temperature: selectedConfig.temperature ?? 0.25,
        max_output_tokens: selectedConfig.max_output_tokens || 900,
        monthly_budget_mxn: selectedConfig.monthly_budget_mxn || 2500,
        knowledge_enabled: selectedConfig.knowledge_enabled !== false,
        is_active: selectedConfig.is_active !== false,
        tools: selectedConfig.tools || {},
      });
    }
  }, [selectedConfig]);

  const updateTool = (tool, checked) => {
    setForm((current) => ({
      ...current,
      tools: {
        ...(current?.tools || {}),
        [tool]: checked,
      },
    }));
  };

  const applyProviderPreset = (preset) => {
    setForm((current) => ({
      ...current,
      provider: preset.provider,
      model: preset.defaultModel,
      base_url: preset.baseUrl,
      api_key_env: preset.apiKeyEnv,
    }));
  };

  const saveConfig = async () => {
    if (!selectedConfig || !form) return;
    setSaving(true);
    try {
      await api.put(`/ai-control/configs/${selectedConfig.id}`, {
        ...form,
        temperature: Number(form.temperature || 0),
        max_output_tokens: Number(form.max_output_tokens || 900),
        monthly_budget_mxn: Number(form.monthly_budget_mxn || 0),
      });
      toast({ title: 'Agente guardado', description: 'Prompt, modelo y permisos actualizados.' });
      await loadDashboard();
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error.response?.data?.detail || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadKnowledge = async (event) => {
    event.preventDefault();
    if (!knowledgeFile) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('role_scope', knowledgeRole);
      data.append('title', knowledgeTitle || knowledgeFile.name);
      data.append('description', '');
      data.append('file', knowledgeFile);
      await api.post('/ai-control/knowledge-files', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setKnowledgeFile(null);
      setKnowledgeTitle('');
      event.target.reset();
      toast({ title: 'Archivo indexado', description: 'La base de conocimiento ya puede usarlo.' });
      await loadDashboard();
    } catch (error) {
      toast({
        title: 'No se pudo subir',
        description: error.response?.data?.detail || 'Revisa el archivo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const importRoviWorkspaceGraph = async () => {
    setImportingGraph(true);
    try {
      const response = await api.post('/ai-control/knowledge/rovi-workspace/import');
      setGraphImport(response.data?.file || null);
      toast({
        title: 'Knowledge graph indexado',
        description: `${response.data?.node_count || 0} nodos y ${response.data?.chunk_count || 0} chunks para ROVI Internal.`,
      });
      await loadDashboard();
    } catch (error) {
      toast({
        title: 'No se pudo indexar Graphify',
        description: error.response?.data?.detail || 'Genera/actualiza graphify-out y vuelve a intentar.',
        variant: 'destructive',
      });
    } finally {
      setImportingGraph(false);
    }
  };

  const runTest = async () => {
    if (!selectedConfig || !testMessage.trim()) return;
    setTesting(true);
    setTestResponse(null);
    try {
      const response = await api.post('/ai-control/test-run', {
        role_scope: selectedConfig.role_scope,
        message: testMessage,
        include_context: true,
      });
      setTestResponse(response.data);
      await loadDashboard();
    } catch (error) {
      toast({
        title: 'No se pudo probar',
        description: error.response?.data?.detail || 'Revisa la configuracion del proveedor.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const totals = dashboard?.totals || {};
  const knowledgeFiles = dashboard?.knowledge_files || [];
  const recentRuns = dashboard?.recent_runs || [];

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1560px] space-y-8 px-5 py-7 pb-24 sm:px-7 sm:py-8 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-3">ROVI Internal Workspace</Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">AI Control Tower</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Configuracion central para agentes por rol, knowledge base, modelos y consumo operativo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="h-10 rounded-lg px-3" variant={selectedConfig?.api_key_configured ? 'secondary' : 'outline'}>
              {selectedConfig?.provider || 'chat.z'} · {selectedConfig?.model || 'glm-5'}
            </Badge>
            <Button onClick={loadDashboard} variant="outline" className="w-fit">
              Actualizar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted/70 p-1 sm:w-fit">
            <TabsTrigger value="tower" className="gap-2"><Gauge className="h-4 w-4" /> Torre</TabsTrigger>
            <TabsTrigger value="agents" className="gap-2"><Bot className="h-4 w-4" /> Agentes</TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2"><Database className="h-4 w-4" /> Base</TabsTrigger>
            <TabsTrigger value="testing" className="gap-2"><Play className="h-4 w-4" /> Prueba</TabsTrigger>
          </TabsList>

          <TabsContent value="tower" className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Activity} label="Runs" value={number(totals.runs)} helper={`${number(totals.errors)} errores registrados`} />
              <StatCard icon={Brain} label="Tokens" value={number(totals.total_tokens)} helper={`${number(totals.input_tokens)} in · ${number(totals.output_tokens)} out`} />
              <StatCard icon={WalletCards} label="Costo estimado" value={currency(totals.cost_mxn)} helper={`USD $${Number(totals.cost_usd || 0).toFixed(4)}`} />
              <StatCard icon={Clock3} label="Latencia promedio" value={`${number(totals.avg_latency_ms)} ms`} helper="Ultimos eventos medidos" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>Consumo por rol</CardTitle>
                  <CardDescription>Tokens, ejecuciones y costo acumulado.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {(dashboard?.by_role || []).length ? (
                    dashboard.by_role.map((item) => <RoleUsageRow key={item.role_scope} item={item} />)
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                      Sin ejecuciones todavia.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>Runs recientes</CardTitle>
                  <CardDescription>Auditoria rapida de prompts y respuestas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rol</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Latencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRuns.slice(0, 8).map((run) => (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">{run.role_scope?.replaceAll('_', ' ')}</TableCell>
                          <TableCell>{run.source}</TableCell>
                          <TableCell>
                            <Badge variant={run.success ? 'secondary' : 'destructive'}>{run.success ? 'ok' : 'error'}</Badge>
                          </TableCell>
                          <TableCell>{number(run.latency_ms)} ms</TableCell>
                        </TableRow>
                      ))}
                      {!recentRuns.length && (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sin actividad.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>Agentes por rol</CardTitle>
                <CardDescription>{configs.length} configuraciones activas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {configs.map((config) => (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setSelectedConfigId(config.id)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      selectedConfig?.id === config.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/70 bg-background/45 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{config.name}</p>
                      <Badge variant={config.api_key_configured ? 'secondary' : 'outline'}>
                        {keyStatusLabel(config)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{config.role_scope?.replaceAll('_', ' ')}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{config.provider} · {config.model}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {form && (
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>Prompt Studio</CardTitle>
                    <CardDescription>Version {selectedConfig?.version || 1} · {selectedConfig?.role_scope?.replaceAll('_', ' ')}</CardDescription>
                  </div>
                  <Button onClick={saveConfig} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.55fr)]">
                    <div>
                      <Label>Nombre del agente</Label>
                      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Conexion activa</p>
                          <p className="truncate text-xs text-muted-foreground">{form.provider} · {form.model}</p>
                        </div>
                        <Badge variant={activeProvider.provider === 'ollama' ? 'secondary' : 'outline'}>
                          {activeProvider.badge}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Label>Proveedor de IA</Label>
                        <p className="mt-1 text-sm text-muted-foreground">Elige un preset y ajusta solo lo necesario.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3">
                      {providerPresets.map((preset) => {
                        const Icon = preset.icon;
                        const selected = form.provider === preset.provider;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyProviderPreset(preset)}
                            className={`min-h-[172px] rounded-lg border p-4 text-left transition-colors ${
                              selected
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border/70 bg-background/45 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <Badge variant={selected ? 'secondary' : 'outline'}>{preset.badge}</Badge>
                            </div>
                            <p className="mt-4 font-semibold">{preset.label}</p>
                            <p className="mt-2 text-sm leading-5 text-muted-foreground">{preset.description}</p>
                            <p className="mt-3 text-xs text-muted-foreground">{preset.helper}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.65fr)]">
                    <div className="space-y-4 rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        <p className="font-medium">Modelo y conexion</p>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <Label>Modelo recomendado</Label>
                          <Select value={modelOptions.includes(form.model) ? form.model : 'custom'} onValueChange={(value) => value !== 'custom' && setForm({ ...form, model: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelOptions.map((model) => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))}
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Modelo final</Label>
                          <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder={activeProvider.defaultModel} />
                        </div>
                        <div className="lg:col-span-2">
                          <Label>Base URL</Label>
                          <Input value={form.base_url} onChange={(event) => setForm({ ...form, base_url: event.target.value })} />
                          {form.provider === 'ollama' && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Para Docker usa `http://host.docker.internal:11434`; para backend sin Docker usa `http://localhost:11434`.
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Proveedor tecnico</Label>
                          <Input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} />
                        </div>
                        <div>
                          <Label>Variable de API key</Label>
                          <div className="relative">
                            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" value={form.api_key_env} onChange={(event) => setForm({ ...form, api_key_env: event.target.value })} placeholder={form.provider === 'ollama' ? 'No requerida' : 'ROVI_AI_API_KEY'} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        <p className="font-medium">Comportamiento</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Temperatura</Label>
                          <Badge variant="outline">{Number(form.temperature || 0).toFixed(2)}</Badge>
                        </div>
                        <Slider
                          value={[Number(form.temperature || 0)]}
                          min={0}
                          max={1.5}
                          step={0.05}
                          onValueChange={([value]) => setForm({ ...form, temperature: value })}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Preciso</span>
                          <span>Creativo</span>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        <div>
                          <Label>Max output tokens</Label>
                          <Input type="number" min="128" value={form.max_output_tokens} onChange={(event) => setForm({ ...form, max_output_tokens: event.target.value })} />
                        </div>
                        <div>
                          <Label>Budget mensual MXN</Label>
                          <Input type="number" min="0" value={form.monthly_budget_mxn} onChange={(event) => setForm({ ...form, monthly_budget_mxn: event.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Prompt del sistema</Label>
                    <Textarea
                      className="mt-2 min-h-[240px] font-mono text-sm"
                      value={form.system_prompt}
                      onChange={(event) => setForm({ ...form, system_prompt: event.target.value })}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(toolLabels).map(([tool, label]) => (
                      <div key={tool} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/45 p-4">
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{tool}</p>
                        </div>
                        <Switch checked={!!form.tools?.[tool]} onCheckedChange={(checked) => updateTool(tool, checked)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-5">
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>Subir archivo</CardTitle>
                  <CardDescription>TXT, MD, CSV, JSON y PDF compatible con extractor instalado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5" onSubmit={uploadKnowledge}>
                    <div>
                      <Label>Rol</Label>
                      <Select value={knowledgeRole} onValueChange={setKnowledgeRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleScopes.map((role) => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Titulo</Label>
                      <Input value={knowledgeTitle} onChange={(event) => setKnowledgeTitle(event.target.value)} placeholder="Opcional" />
                    </div>
                    <div>
                      <Label>Archivo</Label>
                      <Input type="file" onChange={(event) => setKnowledgeFile(event.target.files?.[0] || null)} required />
                    </div>
                    <Button type="submit" disabled={uploading || !knowledgeFile}>
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Indexar
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>Knowledge Graph ROVI</CardTitle>
                  <CardDescription>Indexa Graphify solo para el workspace interno y agentes ROVI.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Scope</p>
                      <p className="font-semibold">rovi_internal</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Chunks</p>
                      <p className="font-semibold">{number(graphImport?.chunk_count || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Nodos</p>
                      <p className="font-semibold">{number(graphImport?.node_count || 0)}</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={importRoviWorkspaceGraph} disabled={importingGraph}>
                    {importingGraph ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    {graphImport ? 'Actualizar grafo ROVI' : 'Indexar grafo ROVI'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>Base de conocimiento</CardTitle>
                <CardDescription>{knowledgeFiles.length} archivos disponibles.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Chunks</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {knowledgeFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="min-w-0 truncate">{file.title || file.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{file.role_scope}</TableCell>
                        <TableCell>{number(file.chunk_count)}</TableCell>
                        <TableCell><Badge variant="outline">{file.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!knowledgeFiles.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sin archivos.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]">
            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>Probar agente</CardTitle>
                <CardDescription>{selectedConfig?.name || 'Selecciona una configuracion'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Agente</Label>
                  <Select value={selectedConfig?.id || ''} onValueChange={setSelectedConfigId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {configs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>{config.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mensaje</Label>
                  <Textarea className="min-h-[180px]" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} />
                </div>
                <Button onClick={runTest} disabled={testing || !selectedConfig}>
                  {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Ejecutar
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>Respuesta</CardTitle>
                <CardDescription>Incluye fuentes, uso y estado del proveedor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResponse ? (
                  <>
                    <div className="rounded-lg border border-border/70 bg-background/45 p-4 text-sm leading-6 whitespace-pre-wrap">
                      {testResponse.response}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Tokens</p>
                        <p className="font-semibold">{number(testResponse.usage?.total_tokens)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Costo</p>
                        <p className="font-semibold">{currency(testResponse.usage?.cost_mxn)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Estado</p>
                        <p className="font-semibold">{testResponse.success ? 'OK' : 'Error'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Ejecuta una prueba para ver la respuesta del agente.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

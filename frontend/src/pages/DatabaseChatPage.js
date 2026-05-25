import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileJson,
  GitBranch,
  LayoutDashboard,
  Loader2,
  Network,
  RefreshCw,
  Route,
  Send,
  Sparkles,
  Table2,
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

const strategyQueries = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard ejecutivo',
    query: 'Genera un dashboard accionable tipo Grafana con KPIs, ruta critica, grafos y plan de accion para el negocio ROVI.',
    description: 'Paneles listos para decision.',
    color: 'text-blue-500',
  },
  {
    icon: Target,
    label: 'Ruta critica',
    query: 'Cual es la ruta critica del negocio esta semana y que paneles necesito para monitorearla?',
    description: 'Cuellos de botella y responsables.',
    color: 'text-emerald-500',
  },
  {
    icon: Network,
    label: 'Mapa de conocimiento',
    query: 'Conecta CRM, marketplace, COPIM, agentes y documentos en un dashboard con grafo de conocimiento.',
    description: 'Graphify como capa de contexto.',
    color: 'text-violet-500',
  },
  {
    icon: GitBranch,
    label: 'Agentes por rol',
    query: 'Que dashboards y handoffs necesita cada agente especializado para ejecutar la estrategia por rol?',
    description: 'Transferencia operativa.',
    color: 'text-amber-500',
  },
];

const dataQueries = [
  {
    icon: TrendingUp,
    label: 'Top Leads',
    query: 'Top 10 leads by budget',
    description: 'Leads con mayor presupuesto.',
    color: 'text-emerald-500',
  },
  {
    icon: Users,
    label: 'Conteo',
    query: 'How many leads?',
    description: 'Total de leads en sistema.',
    color: 'text-blue-500',
  },
  {
    icon: BarChart3,
    label: 'Por estado',
    query: 'Leads by status',
    description: 'Leads agrupados por estado.',
    color: 'text-purple-500',
  },
  {
    icon: WalletCards,
    label: 'Alta prioridad',
    query: 'Show me high priority leads',
    description: 'Leads con prioridad alta.',
    color: 'text-orange-500',
  },
];

const formatNumber = (value = 0) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(Number(value || 0));

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatPanelValue = (value, valueFormat) => {
  if (valueFormat === 'currency') return formatCurrency(value);
  if (valueFormat === 'percent') return `${Number(value || 0).toFixed(1)}%`;
  return formatNumber(value);
};

const toneClass = {
  primary: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  danger: 'border-red-500/30 bg-red-500/10 text-red-100',
};

const panelTypeLabel = {
  stat: 'Stat',
  barchart: 'Bar',
  table: 'Table',
  'state-timeline': 'Timeline',
  nodeGraph: 'Graph',
  text: 'Text',
};

const getPanelRows = (panel) => {
  if (Array.isArray(panel?.data)) return panel.data;
  if (Array.isArray(panel?.data?.rows)) return panel.data.rows;
  return [];
};

const getPanelGridStyle = (panel) => {
  const gridPos = panel?.gridPos || {};
  const width = Math.max(4, Math.min(Number(gridPos.w || 8), 24));
  const height = Math.max(4, Number(gridPos.h || 6));
  return {
    gridColumn: `span ${width}`,
    gridRow: `span ${height}`,
    minHeight: `${height * 30}px`,
  };
};

const downloadJson = (dashboard) => {
  if (!dashboard) return;
  const blob = new Blob([JSON.stringify(dashboard, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${dashboard.uid || 'rovi-dashboard'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const KnowledgeGraph = ({ graph }) => {
  const nodes = (graph?.nodes || []).slice(0, 12);
  const links = graph?.links || [];
  const width = 420;
  const height = 260;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 92;
  const positions = nodes.reduce((acc, node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
    acc[node.id] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
    return acc;
  }, {});

  if (!nodes.length) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Sin nodos Graphify para esta pregunta.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[220px] w-full">
      {links.slice(0, 24).map((link, index) => {
        const source = positions[link.source];
        const target = positions[link.target];
        if (!source || !target) return null;
        return (
          <line
            key={`${link.source}-${link.target}-${index}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke="hsl(var(--border))"
            strokeWidth="1.2"
            opacity="0.7"
          />
        );
      })}
      {nodes.map((node, index) => {
        const point = positions[node.id];
        const label = String(node.label || '').replace(/\(\)/g, '').slice(0, 18);
        return (
          <g key={node.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === 0 ? 18 : 13}
              fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            <text
              x={point.x}
              y={point.y + 30}
              textAnchor="middle"
              className="fill-current text-[9px] text-muted-foreground"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const PanelChart = ({ data }) => {
  if (!data?.length) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Sin datos.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={46} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
          }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PanelTable = ({ rows }) => {
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set())
  ).slice(0, 4);

  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">Sin filas para mostrar.</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead className="sticky top-0 bg-card text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-border px-2 py-2 font-medium">
                {column.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row, index) => (
            <tr key={index} className="border-b border-border/50">
              {columns.map((column) => (
                <td key={column} className="max-w-[180px] px-2 py-2 align-top text-muted-foreground">
                  <span className="line-clamp-2">{String(row?.[column] ?? '')}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TimelinePanel = ({ rows }) => {
  if (!rows.length) return <div className="text-sm text-muted-foreground">Sin ruta critica.</div>;

  return (
    <div className="space-y-3 overflow-auto pr-1">
      {rows.slice(0, 6).map((item, index) => (
        <div key={`${item.step}-${index}`} className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{item.step || item.title}</p>
              {item.urgency && <Badge variant="outline">{item.urgency}</Badge>}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.why || item.next_step}</p>
            {item.metric && <p className="mt-1 text-xs text-primary">{item.metric}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardPanel = ({ panel, selected, onSelect }) => {
  const panelData = panel?.data || {};
  const rows = getPanelRows(panel);
  const panelStyle = getPanelGridStyle(panel);
  const type = panel?.type;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(panel)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSelect(panel);
      }}
      className={`flex min-w-0 flex-col rounded-lg border bg-card/90 p-3 shadow-sm transition-colors ${
        selected ? 'border-primary ring-1 ring-primary/40' : 'border-border/70 hover:border-primary/50'
      }`}
      style={panelStyle}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{panel.title}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{panel.description}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {panelTypeLabel[type] || type}
        </Badge>
      </div>

      <div className="min-h-0 flex-1">
        {type === 'stat' && (
          <div className={`flex h-full flex-col justify-between rounded-lg border p-4 ${toneClass[panelData.tone] || toneClass.primary}`}>
            <div className="text-xs opacity-80">{panel.description}</div>
            <div>
              <p className="text-3xl font-semibold">{formatPanelValue(panelData.value, panelData.format)}</p>
              <p className="mt-1 text-xs opacity-80">{panel.title}</p>
            </div>
          </div>
        )}
        {type === 'barchart' && <PanelChart data={Array.isArray(panelData) ? panelData : []} />}
        {type === 'table' && <PanelTable rows={rows} />}
        {type === 'state-timeline' && <TimelinePanel rows={rows} />}
        {type === 'nodeGraph' && <KnowledgeGraph graph={panelData} />}
        {type === 'text' && (
          <div className="h-full overflow-auto rounded-lg border border-border/60 bg-background/40 p-4">
            <p className="text-sm leading-6 text-muted-foreground">{panelData.executive_summary}</p>
            {panelData.graph_summary && (
              <div className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                {panelData.graph_summary.split('\n').slice(0, 5).map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardCanvas = ({ dashboard, loading, selectedPanelId, onSelectPanel, onCopyDashboard }) => {
  const panels = dashboard?.panels || [];

  if (!dashboard) {
    return (
      <div className="flex min-h-[620px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <LayoutDashboard className="h-8 w-8 text-primary" />}
        </div>
        <h3 className="text-xl font-semibold">Dashboard dinamico pendiente</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Genera un tablero estrategico con paneles, grid layout, KPIs, rutas criticas, tablas y grafo de conocimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70 bg-card/80 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Grafana-style JSON</Badge>
            <Badge variant="outline">{panels.length} paneles</Badge>
            <Badge variant="outline">{dashboard.refresh || 'manual'}</Badge>
          </div>
          <h2 className="mt-2 truncate text-xl font-semibold">{dashboard.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            UID {dashboard.uid} · {dashboard.time?.from} a {dashboard.time?.to}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onCopyDashboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadJson(dashboard)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div
          className="grid min-w-[980px] gap-3"
          style={{
            gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
            gridAutoRows: '30px',
          }}
        >
          {panels.map((panel) => (
            <DashboardPanel
              key={panel.id}
              panel={panel}
              selected={selectedPanelId === panel.id}
              onSelect={onSelectPanel}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DataResults = ({ results }) => {
  if (!results) return null;

  if (results.count !== undefined) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-2xl font-semibold">{formatNumber(results.count)}</p>
        <p className="text-xs text-muted-foreground">{results.description || 'Total encontrado'}</p>
      </div>
    );
  }

  if (Array.isArray(results)) {
    return (
      <div className="mt-3 space-y-2">
        <div className="text-sm text-muted-foreground">{results.length} resultados encontrados</div>
        {results.slice(0, 8).map((item, idx) => (
          <div key={idx} className="rounded-lg border border-border/70 bg-background/45 p-3">
            <p className="truncate text-sm font-medium">{item.name || item.group || `Resultado ${idx + 1}`}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {item.count !== undefined && <Badge variant="secondary">{formatNumber(item.count)}</Badge>}
              {item.email && <span>{item.email}</span>}
              {item.phone && <span>{item.phone}</span>}
              {item.budget_mxn && <span>{formatCurrency(item.budget_mxn)}</span>}
              {item.status && <Badge variant="outline">{item.status}</Badge>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const StrategyCards = ({ strategy }) => {
  if (!strategy) return null;

  const kpis = strategy.kpis || [];
  const criticalPath = strategy.critical_path || [];
  const actions = strategy.action_plan || [];

  return (
    <div className="space-y-3">
      {strategy.executive_summary && (
        <div className="rounded-lg border border-border/70 bg-background/45 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-primary" />
            Resumen ejecutivo
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{strategy.executive_summary}</p>
        </div>
      )}

      {!!kpis.length && (
        <div className="grid gap-2 sm:grid-cols-2">
          {kpis.slice(0, 4).map((kpi, index) => (
            <div key={`${kpi.label}-${index}`} className={`rounded-lg border p-3 ${toneClass[kpi.tone] || toneClass.primary}`}>
              <p className="text-xs opacity-80">{kpi.label}</p>
              <p className="mt-1 text-lg font-semibold">{formatPanelValue(kpi.value, kpi.format)}</p>
              <p className="mt-1 line-clamp-2 text-xs opacity-80">{kpi.description}</p>
            </div>
          ))}
        </div>
      )}

      {!!criticalPath.length && (
        <div className="rounded-lg border border-border/70 bg-background/45 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Route className="h-4 w-4 text-primary" />
            Ruta critica
          </div>
          <div className="space-y-2">
            {criticalPath.slice(0, 3).map((item, index) => (
              <div key={`${item.step}-${index}`} className="flex gap-2 rounded-md bg-muted/40 p-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{item.step}</p>
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!actions.length && (
        <div className="rounded-lg border border-border/70 bg-background/45 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-primary" />
            Acciones
          </div>
          <div className="space-y-2">
            {actions.slice(0, 3).map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-md bg-muted/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-xs font-medium">{action.title}</p>
                  {action.priority && <Badge variant="outline">{action.priority}</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{action.next_step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex justify-start">
      <div className="w-full max-w-[92%] space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
          <p className="text-sm leading-6">{message.content}</p>
          {message.dashboard && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{message.dashboard.panels?.length || 0} paneles</Badge>
              <Badge variant="outline">{message.dashboard.uid}</Badge>
            </div>
          )}
        </div>
        {message.strategy && <StrategyCards strategy={message.strategy} />}
        {message.results && <DataResults results={message.results} />}
        {message.source && (
          <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
            {message.source === 'strategy_playground' ? <Brain className="h-3 w-3" /> : <Database className="h-3 w-3" />}
            <span>{message.source === 'strategy_playground' ? 'Asistente estratega' : 'Consulta MongoDB'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const PanelInspector = ({ panel, dashboard }) => {
  if (!dashboard) {
    return (
      <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
        El inspector se activa al generar un dashboard.
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
        Selecciona un panel del canvas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/70 bg-background/45 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{panel.title}</p>
            <p className="text-xs text-muted-foreground">{panel.description}</p>
          </div>
          <Badge variant="secondary">{panelTypeLabel[panel.type] || panel.type}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">X</p>
          <p className="font-medium">{panel.gridPos?.x ?? 0}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">W</p>
          <p className="font-medium">{panel.gridPos?.w ?? 0}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <p className="text-muted-foreground">H</p>
          <p className="font-medium">{panel.gridPos?.h ?? 0}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border/70 bg-background/45 p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium">
          <FileJson className="h-4 w-4 text-primary" />
          Target
        </p>
        <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-[11px] text-muted-foreground">
          {JSON.stringify(panel.targets?.[0] || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const DatabaseChatPage = () => {
  const { api } = useAuth();
  const [mode, setMode] = useState('strategy');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestStrategy, setLatestStrategy] = useState(null);
  const [selectedPanelId, setSelectedPanelId] = useState(null);
  const messagesEndRef = useRef(null);

  const examples = mode === 'strategy' ? strategyQueries : dataQueries;
  const latestDashboard = latestStrategy?.dashboard || null;
  const selectedPanel = useMemo(
    () => (latestDashboard?.panels || []).find((panel) => panel.id === selectedPanelId),
    [latestDashboard, selectedPanelId]
  );

  const placeholder = mode === 'strategy'
    ? 'Describe el dashboard que necesitas: KPIs, ruta critica, fuentes, agentes, grafos...'
    : 'Consulta tus datos... ejemplo: Leads by status';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    if (latestDashboard?.panels?.length) {
      setSelectedPanelId(latestDashboard.panels[0].id);
    }
  }, [latestDashboard?.uid, latestDashboard?.panels]);

  const handleCopyDashboard = async () => {
    if (!latestDashboard) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestDashboard, null, 2));
      toast.success('Dashboard JSON copiado');
    } catch (error) {
      console.error('Could not copy dashboard JSON:', error);
      toast.error('No se pudo copiar el JSON');
    }
  };

  const handleSubmit = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text, mode }]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'strategy') {
        const response = await api.post('/strategy-playground/run', {
          question: text,
          include_context: true,
        });
        const strategy = response.data?.strategy;
        const dashboard = strategy?.dashboard;
        setLatestStrategy(strategy);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: dashboard
              ? `Dashboard generado: ${dashboard.panels?.length || 0} paneles listos para explorar.`
              : strategy?.answer || 'Analisis estrategico generado.',
            strategy,
            dashboard,
            source: 'strategy_playground',
          },
        ]);
        toast.success('Dashboard generado');
      } else {
        const response = await api.post('/database-chat', { query: text });
        if (response.data.success) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: response.data.message || 'Consulta ejecutada exitosamente',
              results: response.data.results,
              source: response.data.source || 'mongodb_fallback',
            },
          ]);
          toast.success('Consulta ejecutada');
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: response.data.message || 'No se pudo ejecutar la consulta',
              error: response.data.error,
            },
          ]);
          toast.error('No se pudo ejecutar');
        }
      }
    } catch (error) {
      console.error('Error executing dashboard query:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error al conectar con el servidor.',
          error: error.message,
        },
      ]);
      toast.error('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1800px] space-y-5 px-5 py-7 pb-24 sm:px-7 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-3">ROVI Strategy Dashboards</Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">Dashboard Builder IA</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Canvas dinamico para convertir preguntas estrategicas en paneles, grafos, tablas y acciones.
            </p>
          </div>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="h-auto rounded-lg bg-muted/70 p-1">
              <TabsTrigger value="strategy" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" /> Datos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-5 2xl:grid-cols-[300px_minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Prompts
                </CardTitle>
                <CardDescription>Plantillas para generar paneles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {examples.map((example, idx) => {
                  const Icon = example.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSubmit(example.query)}
                      disabled={loading}
                      className="group w-full rounded-lg p-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 h-5 w-5 ${example.color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{example.label}</p>
                          <p className="text-xs text-muted-foreground">{example.description}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-primary">{example.query}</p>
                        </div>
                        <ChevronRight className="mt-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Estado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modo</span>
                  <Badge variant="secondary">{mode === 'strategy' ? 'Dashboard' : 'Datos'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paneles</span>
                  <Badge variant="outline">{latestDashboard?.panels?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Graphify</span>
                  <Badge variant={latestStrategy?.knowledge_graph?.nodes?.length ? 'secondary' : 'outline'}>
                    {latestStrategy?.knowledge_graph?.nodes?.length ? 'activo' : 'pendiente'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    seguro
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <main className="min-w-0">
            {mode === 'strategy' ? (
              <DashboardCanvas
                dashboard={latestDashboard}
                loading={loading}
                selectedPanelId={selectedPanelId}
                onSelectPanel={(panel) => setSelectedPanelId(panel.id)}
                onCopyDashboard={handleCopyDashboard}
              />
            ) : (
              <div className="flex min-h-[620px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
                <Database className="mb-4 h-10 w-10 text-primary" />
                <h3 className="text-xl font-semibold">Modo datos</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Ejecuta consultas en el panel de conversacion y revisa los resultados estructurados.
                </p>
              </div>
            )}
          </main>

          <div className="space-y-4">
            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="h-4 w-4 text-primary" />
                      Agente
                    </CardTitle>
                    <CardDescription>Prompt y respuesta.</CardDescription>
                  </div>
                  {messages.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setMessages([])}>
                      Limpiar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <ScrollArea className="h-[360px] p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <Brain className="mb-3 h-8 w-8 text-primary" />
                    <p className="text-sm text-muted-foreground">Pide un dashboard o consulta datos.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)}
                    {loading && (
                      <div className="mb-4 flex justify-start">
                        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{mode === 'strategy' ? 'Generando dashboard...' : 'Procesando consulta...'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </ScrollArea>
              <Separator />
              <div className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={loading}
                    className="min-h-[52px] flex-1 resize-none"
                  />
                  <Button onClick={() => handleSubmit()} disabled={loading || !input.trim()} size="icon" className="h-[52px] shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Table2 className="h-4 w-4 text-primary" />
                  Inspector
                </CardTitle>
                <CardDescription>Panel seleccionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <PanelInspector panel={selectedPanel} dashboard={latestDashboard} />
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-4 w-4 text-primary" />
                  Modelo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>panels · gridPos · targets · fieldConfig · templating</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">schema {latestDashboard?.schemaVersion || 39}</Badge>
                  <Badge variant="outline">{latestDashboard?.style || 'dark'}</Badge>
                  <Badge variant="outline">{latestDashboard?.refresh || '5m'}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseChatPage;

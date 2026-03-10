import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, DollarSign, Eye, MousePointer,
  Users, Target, BarChart3, Calendar, Download, Filter,
  Facebook, Mail, MessageCircle, Phone, Search, Globe,
  Building2, Home, FileText, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const sourceConfig = {
  meta: { label: 'Meta Ads', icon: Facebook, color: '#1877F2' },
  google: { label: 'Google Ads', icon: Search, color: '#4285F4' },
  email: { label: 'Email', icon: Mail, color: '#0D9488' },
  sms: { label: 'SMS', icon: MessageCircle, color: '#22C55E' },
  call: { label: 'Llamadas', icon: Phone, color: '#F59E0B' },
};

const MetricCard = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }) => {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {prefix}{value?.toLocaleString() || 0}{suffix}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(change)}% vs mes anterior</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ label, value, icon: Icon, color = 'text-primary' }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
    <div className={`w-10 h-10 rounded-lg ${color.replace('text-', 'bg-').replace('primary', 'primary/10')} flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value?.toLocaleString() || 0}</p>
    </div>
  </div>
);

export const AnalyticsPage = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [sourceBreakdown, setSourceBreakdown] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedSource]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const [overviewRes, timelineRes] = await Promise.all([
        api.get('/analytics/overview', {
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }
        }),
        api.get('/analytics/timeline', {
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            granularity: dateRange === '7' ? 'daily' : 'daily'
          }
        })
      ]);

      setOverview(overviewRes.data);
      setTimeline(timelineRes.data.timeline || []);

      // Load source-specific data if selected
      if (selectedSource !== 'all') {
        const sourceRes = await api.get(`/analytics/by-source/${selectedSource}`, {
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          }
        });
        setSourceBreakdown(sourceRes.data);
      } else {
        setSourceBreakdown(null);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar analíticas');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const res = await api.get('/analytics/export', {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          format: 'csv'
        }
      });

      // Create download link
      const blob = new Blob([res.data.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Datos exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar datos');
    }
  };

  // Prepare chart data
  const chartData = timeline.map(t => ({
    date: format(new Date(t.date), 'dd/MM', { locale: es }),
    ...Object.entries(t).reduce((acc, [key, val]) => {
      if (key !== 'date' && typeof val === 'object') {
        return { ...acc, [key]: val.leads || 0 };
      }
      return acc;
    }, {})
  }));

  // Source breakdown data for pie chart
  const sourceData = overview?.leads_by_source
    ? Object.entries(overview.leads_by_source).map(([source, count]) => ({
        name: sourceConfig[source]?.label || source,
        value: count,
        color: sourceConfig[source]?.color || '#999'
      }))
    : [];

  // Spend by source data
  const spendData = overview?.spend_by_source
    ? Object.entries(overview.spend_by_source).map(([source, amount]) => ({
        name: sourceConfig[source]?.label || source,
        value: amount,
        color: sourceConfig[source]?.color || '#999'
      }))
    : [];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Analíticas</h1>
          <p className="text-sm text-muted-foreground">Métricas de campañas y rendimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Inversión Total"
          value={overview?.total_spend}
          prefix="$"
          suffix=" MXN"
          icon={DollarSign}
          change={5.2}
        />
        <MetricCard
          title="Impresiones"
          value={overview?.total_impressions}
          icon={Eye}
          change={12.5}
        />
        <MetricCard
          title="Clics"
          value={overview?.total_clicks}
          icon={MousePointer}
          change={8.3}
        />
        <MetricCard
          title="Leads Generados"
          value={overview?.total_leads}
          icon={Users}
          change={15.7}
        />
      </div>

      {/* Real Estate Specific Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Métricas de Bienes Raíces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Vistas de Propiedades"
              value={overview?.property_views}
              icon={Home}
              color="text-blue-500"
            />
            <StatCard
              label="Solicitudes de Visita"
              value={overview?.viewing_requests}
              icon={Calendar}
              color="text-purple-500"
            />
            <StatCard
              label="Contratos Firmados"
              value={overview?.brokerage_signed}
              icon={FileText}
              color="text-green-500"
            />
          </div>

          {/* Conversion Funnel */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">Embudo de Conversión</p>
            <div className="space-y-2">
              {[
                { label: 'Leads', value: overview?.total_leads || 0, total: overview?.total_leads || 1 },
                { label: 'Vistas de Propiedad', value: overview?.property_views || 0, total: overview?.total_leads || 1 },
                { label: 'Solicitudes de Visita', value: overview?.viewing_requests || 0, total: overview?.total_leads || 1 },
                { label: 'Contratos Firmados', value: overview?.brokerage_signed || 0, total: overview?.total_leads || 1 },
              ].map((step, i) => {
                const percent = (step.value / step.total * 100).toFixed(1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm w-32">{step.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm w-12 text-right">{step.value}</span>
                    <span className="text-xs text-muted-foreground w-12">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="email"
                  stackId="1"
                  stroke={sourceConfig.email.color}
                  fill={sourceConfig.email.color}
                  fillOpacity={0.6}
                  name="Email"
                />
                <Area
                  type="monotone"
                  dataKey="meta"
                  stackId="1"
                  stroke={sourceConfig.meta.color}
                  fill={sourceConfig.meta.color}
                  fillOpacity={0.6}
                  name="Meta"
                />
                <Area
                  type="monotone"
                  dataKey="google"
                  stackId="1"
                  stroke={sourceConfig.google.color}
                  fill={sourceConfig.google.color}
                  fillOpacity={0.6}
                  name="Google"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {sourceData.map((source, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="text-sm">{source.name}: {source.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spend by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Gasto por Fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value) => [`$${value?.toLocaleString()} MXN`, 'Gasto']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {spendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Costo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">CTR Promedio</p>
                <p className="text-2xl font-bold">{overview?.avg_ctr || 0}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">CPL Promedio</p>
                <p className="text-2xl font-bold">${(overview?.avg_cpl || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(overview?.spend_by_source || {}).map(([source, amount]) => {
                const leads = overview?.leads_by_source?.[source] || 0;
                const cpl = leads > 0 ? amount / leads : 0;
                const config = sourceConfig[source];
                const Icon = config?.icon || TrendingUp;
                return (
                  <div key={source} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: config?.color }} />
                      <span className="text-sm">{config?.label || source}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${cpl.toFixed(2)} por lead</p>
                      <p className="text-xs text-muted-foreground">{leads} leads</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Desglose por Fuente</span>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas las fuentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Llamadas</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Fuente</th>
                  <th className="text-right p-3 font-medium">Impresiones</th>
                  <th className="text-right p-3 font-medium">Clics</th>
                  <th className="text-right p-3 font-medium">CTR</th>
                  <th className="text-right p-3 font-medium">Leads</th>
                  <th className="text-right p-3 font-medium">Conversiones</th>
                  <th className="text-right p-3 font-medium">Gasto</th>
                  <th className="text-right p-3 font-medium">CPL</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(overview?.leads_by_source || {}).map((source) => {
                  const config = sourceConfig[source];
                  const Icon = config?.icon || TrendingUp;
                  const spend = overview?.spend_by_source?.[source] || 0;
                  const leads = overview?.leads_by_source?.[source] || 0;
                  const clicks = source === 'email' ? leads * 2 : leads * 8; // Mock data
                  const impressions = clicks * 20; // Mock data
                  const ctr = (clicks / impressions * 100).toFixed(2);
                  const cpl = leads > 0 ? (spend / leads).toFixed(2) : 0;

                  return (
                    <tr key={source} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: config?.color }} />
                          <span>{config?.label || source}</span>
                        </div>
                      </td>
                      <td className="text-right p-3">{impressions.toLocaleString()}</td>
                      <td className="text-right p-3">{clicks.toLocaleString()}</td>
                      <td className="text-right p-3">{ctr}%</td>
                      <td className="text-right p-3">{leads.toLocaleString()}</td>
                      <td className="text-right p-3">{Math.floor(leads * 0.3).toLocaleString()}</td>
                      <td className="text-right p-3">${spend.toLocaleString()} MXN</td>
                      <td className="text-right p-3 font-medium">${cpl}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

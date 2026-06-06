import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  Database,
  FileSearch,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Trash2,
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
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

const money = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const number = (value, digits = 0) => new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: digits,
}).format(Number(value || 0));

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const splitList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const joinList = (value) => Array.isArray(value) ? value.join(', ') : '';

const defaultCaseForm = {
  title: '',
  client_name: '',
  operation_type: 'both',
  property_type: 'apartment',
  zone: 'Tulum Centro',
  address: '',
  land_area_m2: 0,
  construction_area_m2: 0,
  bedrooms: 0,
  bathrooms: 0,
  parking_spaces: 0,
  age_years: 0,
  condition_score: 7,
  quality_score: 7,
  amenities_text: '',
  legal_status: 'clear_title',
  market_liquidity: 'medium',
  asking_price_mxn: 0,
  monthly_rent_mxn: 0,
  target_cap_rate: 0.085,
  occupancy_rate: 0.82,
  annual_expenses_mxn: 0,
  replacement_cost_per_m2: 16000,
  land_value_override_per_m2: '',
  regulation_id: '',
  notes: '',
  status: 'draft',
};

const defaultRegulationForm = {
  title: '',
  municipality: 'Tulum',
  zone: 'Tulum Centro',
  program_type: 'PDU',
  program_name: '',
  publication_date: '',
  source_url: '',
  source_confidence: 'pending',
  zoning_key: '',
  land_use: '',
  cos: '',
  cus: '',
  density_units_per_ha: '',
  max_height_m: '',
  max_levels: '',
  uga: '',
  ecological_policy: '',
  compatible_uses_text: '',
  restricted_uses_text: '',
  risk_flags_text: '',
  notes: '',
  status: 'active',
};

const defaultComparableForm = {
  title: '',
  operation_type: 'sale',
  property_type: 'apartment',
  zone: 'Tulum Centro',
  address: '',
  source_type: 'listing',
  source_url: '',
  transaction_date: '',
  price_mxn: 0,
  monthly_rent_mxn: 0,
  land_area_m2: 0,
  construction_area_m2: 0,
  bedrooms: 0,
  bathrooms: 0,
  age_years: 0,
  condition_score: 7,
  quality_score: 7,
  amenities_text: '',
  market_trend_monthly_pct: 0,
  notes: '',
};

const viewFromPath = (pathname) => {
  if (pathname.includes('/regulations')) return 'regulations';
  if (pathname.includes('/comparables')) return 'comparables';
  if (pathname.includes('/calculator')) return 'calculator';
  if (pathname.includes('/cases')) return 'cases';
  return 'dashboard';
};

const StatCard = ({ icon: Icon, label, value, helper }) => (
  <Card className="border-border/70 bg-card/95">
    <CardContent className="flex min-h-28 items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
        {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
      </div>
    </CardContent>
  </Card>
);

const InlineStat = ({ icon: Icon, label, value, helper }) => (
  <div className="flex min-h-28 items-center gap-4 rounded-lg border border-border/70 bg-muted/20 p-5">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  </div>
);

export const ValuationPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeView = viewFromPath(location.pathname);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [cases, setCases] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [comparables, setComparables] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseForm, setCaseForm] = useState(defaultCaseForm);
  const [regulationForm, setRegulationForm] = useState(defaultRegulationForm);
  const [comparableForm, setComparableForm] = useState(defaultComparableForm);
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [editingRegulationId, setEditingRegulationId] = useState(null);
  const [editingComparableId, setEditingComparableId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, casesRes, regsRes, compsRes, paramsRes] = await Promise.all([
        api.get('/valuations/dashboard'),
        api.get('/valuations/cases'),
        api.get('/valuations/regulations'),
        api.get('/valuations/comparables'),
        api.get('/valuations/parameters'),
      ]);
      setDashboard(dashboardRes.data);
      setCases(casesRes.data || []);
      setRegulations(regsRes.data || []);
      setComparables(compsRes.data || []);
      setParameters(paramsRes.data?.items || []);
      if (!selectedCase && casesRes.data?.[0]) {
        const detail = await api.get(`/valuations/cases/${casesRes.data[0].id}`);
        setSelectedCase(detail.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar valuacion');
    } finally {
      setLoading(false);
    }
  }, [api, selectedCase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSummary = dashboard?.summary || {};
  const chartData = useMemo(() => (dashboard?.zone_metrics || []).map((item) => ({
    zone: item.zone,
    venta: Math.round(item.sale_price_m2_mxn || 0),
    renta: Math.round(item.rent_m2_mxn || 0),
  })), [dashboard]);

  const buildCasePayload = () => ({
    ...caseForm,
    amenities: splitList(caseForm.amenities_text),
    land_area_m2: toNumber(caseForm.land_area_m2),
    construction_area_m2: toNumber(caseForm.construction_area_m2),
    bedrooms: toNumber(caseForm.bedrooms),
    bathrooms: toNumber(caseForm.bathrooms),
    parking_spaces: toNumber(caseForm.parking_spaces),
    age_years: toNumber(caseForm.age_years),
    condition_score: toNumber(caseForm.condition_score),
    quality_score: toNumber(caseForm.quality_score),
    asking_price_mxn: toNumber(caseForm.asking_price_mxn),
    monthly_rent_mxn: toNumber(caseForm.monthly_rent_mxn),
    target_cap_rate: toNumber(caseForm.target_cap_rate),
    occupancy_rate: toNumber(caseForm.occupancy_rate),
    annual_expenses_mxn: toNumber(caseForm.annual_expenses_mxn),
    replacement_cost_per_m2: toNumber(caseForm.replacement_cost_per_m2),
    land_value_override_per_m2: caseForm.land_value_override_per_m2 === '' ? null : toNumber(caseForm.land_value_override_per_m2),
    regulation_id: caseForm.regulation_id || null,
  });

  const buildRegulationPayload = () => ({
    ...regulationForm,
    compatible_uses: splitList(regulationForm.compatible_uses_text),
    restricted_uses: splitList(regulationForm.restricted_uses_text),
    risk_flags: splitList(regulationForm.risk_flags_text),
    cos: regulationForm.cos === '' ? null : toNumber(regulationForm.cos),
    cus: regulationForm.cus === '' ? null : toNumber(regulationForm.cus),
    density_units_per_ha: regulationForm.density_units_per_ha === '' ? null : toNumber(regulationForm.density_units_per_ha),
    max_height_m: regulationForm.max_height_m === '' ? null : toNumber(regulationForm.max_height_m),
    max_levels: regulationForm.max_levels === '' ? null : toNumber(regulationForm.max_levels),
  });

  const buildComparablePayload = () => ({
    ...comparableForm,
    amenities: splitList(comparableForm.amenities_text),
    price_mxn: toNumber(comparableForm.price_mxn),
    monthly_rent_mxn: toNumber(comparableForm.monthly_rent_mxn),
    land_area_m2: toNumber(comparableForm.land_area_m2),
    construction_area_m2: toNumber(comparableForm.construction_area_m2),
    bedrooms: toNumber(comparableForm.bedrooms),
    bathrooms: toNumber(comparableForm.bathrooms),
    age_years: toNumber(comparableForm.age_years),
    condition_score: toNumber(comparableForm.condition_score),
    quality_score: toNumber(comparableForm.quality_score),
    market_trend_monthly_pct: toNumber(comparableForm.market_trend_monthly_pct),
  });

  const resetForms = () => {
    setCaseForm(defaultCaseForm);
    setRegulationForm(defaultRegulationForm);
    setComparableForm(defaultComparableForm);
    setEditingCaseId(null);
    setEditingRegulationId(null);
    setEditingComparableId(null);
  };

  const submitCase = async () => {
    if (!caseForm.title.trim()) {
      toast.error('Agrega nombre del caso');
      return;
    }
    setSaving(true);
    try {
      const payload = buildCasePayload();
      const response = editingCaseId
        ? await api.put(`/valuations/cases/${editingCaseId}`, payload)
        : await api.post('/valuations/cases', payload);
      setSelectedCase(response.data);
      toast.success(editingCaseId ? 'Caso actualizado' : 'Caso creado');
      resetForms();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el caso');
    } finally {
      setSaving(false);
    }
  };

  const submitRegulation = async () => {
    if (!regulationForm.title.trim()) {
      toast.error('Agrega nombre de normativa');
      return;
    }
    setSaving(true);
    try {
      const payload = buildRegulationPayload();
      if (editingRegulationId) {
        await api.put(`/valuations/regulations/${editingRegulationId}`, payload);
      } else {
        await api.post('/valuations/regulations', payload);
      }
      toast.success(editingRegulationId ? 'Normativa actualizada' : 'Normativa creada');
      resetForms();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar normativa');
    } finally {
      setSaving(false);
    }
  };

  const submitComparable = async () => {
    if (!comparableForm.title.trim()) {
      toast.error('Agrega nombre del comparable');
      return;
    }
    setSaving(true);
    try {
      const payload = buildComparablePayload();
      if (editingComparableId) {
        await api.put(`/valuations/comparables/${editingComparableId}`, payload);
      } else {
        await api.post('/valuations/comparables', payload);
      }
      toast.success(editingComparableId ? 'Comparable actualizado' : 'Comparable creado');
      resetForms();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar comparable');
    } finally {
      setSaving(false);
    }
  };

  const selectCase = async (caseId) => {
    try {
      const response = await api.get(`/valuations/cases/${caseId}`);
      setSelectedCase(response.data);
      navigate('/valuations/calculator');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo abrir el caso');
    }
  };

  const calculateCase = async (caseId = selectedCase?.id) => {
    if (!caseId) return;
    setSaving(true);
    try {
      const response = await api.post(`/valuations/cases/${caseId}/calculate`);
      setSelectedCase(response.data);
      toast.success('Calculo actualizado');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo recalcular');
    } finally {
      setSaving(false);
    }
  };

  const seedDemo = async () => {
    setSaving(true);
    try {
      const response = await api.post('/valuations/seed-demo');
      toast.success(response.data?.message || 'Datos demo creados');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo crear demo');
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (type, id) => {
    setSaving(true);
    try {
      await api.delete(`/valuations/${type}/${id}`);
      toast.success('Registro eliminado');
      if (selectedCase?.id === id) setSelectedCase(null);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar');
    } finally {
      setSaving(false);
    }
  };

  const editCase = (item) => {
    setEditingCaseId(item.id);
    setCaseForm({
      ...defaultCaseForm,
      ...item,
      amenities_text: joinList(item.amenities),
      land_value_override_per_m2: item.land_value_override_per_m2 ?? '',
      regulation_id: item.regulation_id || '',
    });
    navigate('/valuations/cases');
  };

  const editRegulation = (item) => {
    setEditingRegulationId(item.id);
    setRegulationForm({
      ...defaultRegulationForm,
      ...item,
      compatible_uses_text: joinList(item.compatible_uses),
      restricted_uses_text: joinList(item.restricted_uses),
      risk_flags_text: joinList(item.risk_flags),
      cos: item.cos ?? '',
      cus: item.cus ?? '',
      density_units_per_ha: item.density_units_per_ha ?? '',
      max_height_m: item.max_height_m ?? '',
      max_levels: item.max_levels ?? '',
    });
    navigate('/valuations/regulations');
  };

  const editComparable = (item) => {
    setEditingComparableId(item.id);
    setComparableForm({
      ...defaultComparableForm,
      ...item,
      amenities_text: joinList(item.amenities),
    });
    navigate('/valuations/comparables');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Valuador Certificado</Badge>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">Avalúos, PDU / POEL y pricing dinámico</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Expedientes de valor con comparables, normativas, renta, riesgo y evidencia trazable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadData} disabled={saving}>
              <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
            </Button>
            <Button onClick={seedDemo} disabled={saving}>
              <Database className="mr-2 h-4 w-4" /> Demo
            </Button>
          </div>
        </header>

        <Tabs value={activeView} onValueChange={(value) => navigate(value === 'dashboard' ? '/valuations' : `/valuations/${value}`)}>
          <TabsList className="h-auto flex-wrap justify-start rounded-lg">
            <TabsTrigger value="dashboard">Torre</TabsTrigger>
            <TabsTrigger value="cases">Casos</TabsTrigger>
            <TabsTrigger value="regulations">PDU / POEL</TabsTrigger>
            <TabsTrigger value="comparables">Comparables</TabsTrigger>
            <TabsTrigger value="calculator">Calculadora</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeView === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={FileSearch} label="Casos activos" value={number(activeSummary.active_cases)} helper={`${number(activeSummary.cases_total)} historicos`} />
              <StatCard icon={BarChart3} label="Valor portafolio" value={money(activeSummary.portfolio_value_mxn)} helper="Último cálculo guardado" />
              <StatCard icon={CheckCircle2} label="Confianza media" value={`${number(activeSummary.avg_confidence_score, 1)}%`} helper={`${number(activeSummary.comparables_total)} comparables`} />
              <StatCard icon={AlertTriangle} label="Alertas normativas" value={number(activeSummary.normative_risk_flags)} helper={`${number(activeSummary.regulations_total)} fichas PDU/POEL`} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <Card className="border-border/70 bg-card/95">
                <CardHeader>
                  <CardTitle>Mercado por zona</CardTitle>
                  <CardDescription>Precio m2 y renta m2 desde comparables capturados.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={70} />
                      <Tooltip formatter={(value) => money(value)} />
                      <Bar dataKey="venta" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="renta" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95">
                <CardHeader>
                  <CardTitle>Últimos casos</CardTitle>
                  <CardDescription>Expedientes listos para recalcular.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dashboard?.latest_cases || []).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectCase(item.id)}
                      className="w-full rounded-lg border border-border/70 bg-muted/20 p-3 text-left transition hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.zone} · {item.property_type}</p>
                        </div>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium">{money(item.last_calculation?.estimated_value_mxn)}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'cases' && (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>{editingCaseId ? 'Editar caso' : 'Nuevo caso'}</CardTitle>
                <CardDescription>Venta, renta, ingresos y normativa vinculada.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Field label="Nombre"><Input value={caseForm.title} onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Cliente"><Input value={caseForm.client_name} onChange={(e) => setCaseForm({ ...caseForm, client_name: e.target.value })} /></Field>
                  <Field label="Zona"><Input value={caseForm.zone} onChange={(e) => setCaseForm({ ...caseForm, zone: e.target.value })} /></Field>
                  <SelectField label="Operacion" value={caseForm.operation_type} onChange={(value) => setCaseForm({ ...caseForm, operation_type: value })} options={['sale', 'rent', 'both']} />
                  <SelectField label="Tipo" value={caseForm.property_type} onChange={(value) => setCaseForm({ ...caseForm, property_type: value })} options={['apartment', 'house', 'land', 'commercial', 'hotel', 'mixed_use']} />
                  <Field label="Terreno m2"><Input type="number" value={caseForm.land_area_m2} onChange={(e) => setCaseForm({ ...caseForm, land_area_m2: e.target.value })} /></Field>
                  <Field label="Construccion m2"><Input type="number" value={caseForm.construction_area_m2} onChange={(e) => setCaseForm({ ...caseForm, construction_area_m2: e.target.value })} /></Field>
                  <Field label="Precio pedido"><Input type="number" value={caseForm.asking_price_mxn} onChange={(e) => setCaseForm({ ...caseForm, asking_price_mxn: e.target.value })} /></Field>
                  <Field label="Renta mensual"><Input type="number" value={caseForm.monthly_rent_mxn} onChange={(e) => setCaseForm({ ...caseForm, monthly_rent_mxn: e.target.value })} /></Field>
                  <Field label="Cap rate"><Input type="number" step="0.001" value={caseForm.target_cap_rate} onChange={(e) => setCaseForm({ ...caseForm, target_cap_rate: e.target.value })} /></Field>
                  <Field label="Ocupacion"><Input type="number" step="0.01" value={caseForm.occupancy_rate} onChange={(e) => setCaseForm({ ...caseForm, occupancy_rate: e.target.value })} /></Field>
                  <Field label="Condicion 1-10"><Input type="number" value={caseForm.condition_score} onChange={(e) => setCaseForm({ ...caseForm, condition_score: e.target.value })} /></Field>
                  <Field label="Calidad 1-10"><Input type="number" value={caseForm.quality_score} onChange={(e) => setCaseForm({ ...caseForm, quality_score: e.target.value })} /></Field>
                </div>
                <Field label="Normativa">
                  <Select value={caseForm.regulation_id || 'none'} onValueChange={(value) => setCaseForm({ ...caseForm, regulation_id: value === 'none' ? '' : value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin vincular</SelectItem>
                      {regulations.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Amenidades"><Input value={caseForm.amenities_text} onChange={(e) => setCaseForm({ ...caseForm, amenities_text: e.target.value })} placeholder="alberca, seguridad, terraza" /></Field>
                <Field label="Notas"><Textarea value={caseForm.notes} onChange={(e) => setCaseForm({ ...caseForm, notes: e.target.value })} /></Field>
                <div className="flex gap-2">
                  <Button onClick={submitCase} disabled={saving}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
                  <Button variant="outline" onClick={resetForms} disabled={saving}>Limpiar</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Casos</CardTitle>
                <CardDescription>{cases.length} expedientes capturados.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3">Caso</th>
                      <th>Zona</th>
                      <th>Valor</th>
                      <th>Confianza</th>
                      <th>Riesgo</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((item) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-3">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.property_type} · {item.operation_type}</p>
                        </td>
                        <td>{item.zone}</td>
                        <td>{money(item.last_calculation?.estimated_value_mxn)}</td>
                        <td>{item.last_calculation?.confidence_score || 0}%</td>
                        <td><Badge variant="outline">{item.last_calculation?.regulatory_risk_level || 'pending'}</Badge></td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => selectCase(item.id)}><Calculator className="mr-2 h-4 w-4" /> Calcular</Button>
                            <Button variant="outline" size="sm" onClick={() => editCase(item)}>Editar</Button>
                            <Button variant="ghost" size="icon" onClick={() => removeRecord('cases', item.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'regulations' && (
          <CrudPanel
            title={editingRegulationId ? 'Editar PDU / POEL' : 'Nueva normativa'}
            description="Fichas por zona, programa, uso, COS, CUS, densidad y riesgo."
            icon={Building2}
            form={(
              <div className="grid gap-4">
                <Field label="Nombre"><Input value={regulationForm.title} onChange={(e) => setRegulationForm({ ...regulationForm, title: e.target.value })} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Municipio"><Input value={regulationForm.municipality} onChange={(e) => setRegulationForm({ ...regulationForm, municipality: e.target.value })} /></Field>
                  <Field label="Zona"><Input value={regulationForm.zone} onChange={(e) => setRegulationForm({ ...regulationForm, zone: e.target.value })} /></Field>
                  <SelectField label="Tipo" value={regulationForm.program_type} onChange={(value) => setRegulationForm({ ...regulationForm, program_type: value })} options={['PDU', 'PMDU', 'PPDU', 'POEL', 'POETDUM', 'Reglamento']} />
                  <SelectField label="Fuente" value={regulationForm.source_confidence} onChange={(value) => setRegulationForm({ ...regulationForm, source_confidence: value })} options={['official', 'pending', 'user_provided']} />
                  <Field label="COS"><Input type="number" step="0.01" value={regulationForm.cos} onChange={(e) => setRegulationForm({ ...regulationForm, cos: e.target.value })} /></Field>
                  <Field label="CUS"><Input type="number" step="0.01" value={regulationForm.cus} onChange={(e) => setRegulationForm({ ...regulationForm, cus: e.target.value })} /></Field>
                  <Field label="Densidad/ha"><Input type="number" value={regulationForm.density_units_per_ha} onChange={(e) => setRegulationForm({ ...regulationForm, density_units_per_ha: e.target.value })} /></Field>
                  <Field label="Altura m"><Input type="number" value={regulationForm.max_height_m} onChange={(e) => setRegulationForm({ ...regulationForm, max_height_m: e.target.value })} /></Field>
                </div>
                <Field label="Programa"><Input value={regulationForm.program_name} onChange={(e) => setRegulationForm({ ...regulationForm, program_name: e.target.value })} /></Field>
                <Field label="Fuente URL"><Input value={regulationForm.source_url} onChange={(e) => setRegulationForm({ ...regulationForm, source_url: e.target.value })} /></Field>
                <Field label="Riesgos"><Input value={regulationForm.risk_flags_text} onChange={(e) => setRegulationForm({ ...regulationForm, risk_flags_text: e.target.value })} /></Field>
                <Button onClick={submitRegulation} disabled={saving}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
              </div>
            )}
            table={(
              <DataList
                items={regulations}
                columns={[
                  ['Normativa', (item) => <><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.program_type} · {item.program_name}</p></>],
                  ['Zona', (item) => item.zone],
                  ['COS/CUS', (item) => `${item.cos || '-'} / ${item.cus || '-'}`],
                  ['Riesgos', (item) => (item.risk_flags || []).length],
                  ['Fuente', (item) => <Badge variant="outline">{item.source_confidence}</Badge>],
                ]}
                onEdit={editRegulation}
                onDelete={(item) => removeRecord('regulations', item.id)}
              />
            )}
          />
        )}

        {activeView === 'comparables' && (
          <CrudPanel
            title={editingComparableId ? 'Editar comparable' : 'Nuevo comparable'}
            description="Ventas, rentas, fuentes y homologación."
            icon={BarChart3}
            form={(
              <div className="grid gap-4">
                <Field label="Nombre"><Input value={comparableForm.title} onChange={(e) => setComparableForm({ ...comparableForm, title: e.target.value })} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField label="Operacion" value={comparableForm.operation_type} onChange={(value) => setComparableForm({ ...comparableForm, operation_type: value })} options={['sale', 'rent']} />
                  <SelectField label="Tipo" value={comparableForm.property_type} onChange={(value) => setComparableForm({ ...comparableForm, property_type: value })} options={['apartment', 'house', 'land', 'commercial', 'hotel', 'mixed_use']} />
                  <Field label="Zona"><Input value={comparableForm.zone} onChange={(e) => setComparableForm({ ...comparableForm, zone: e.target.value })} /></Field>
                  <SelectField label="Fuente" value={comparableForm.source_type} onChange={(value) => setComparableForm({ ...comparableForm, source_type: value })} options={['listing', 'closed_transaction', 'appraisal', 'broker_input', 'official', 'manual']} />
                  <Field label="Precio venta"><Input type="number" value={comparableForm.price_mxn} onChange={(e) => setComparableForm({ ...comparableForm, price_mxn: e.target.value })} /></Field>
                  <Field label="Renta mensual"><Input type="number" value={comparableForm.monthly_rent_mxn} onChange={(e) => setComparableForm({ ...comparableForm, monthly_rent_mxn: e.target.value })} /></Field>
                  <Field label="Terreno m2"><Input type="number" value={comparableForm.land_area_m2} onChange={(e) => setComparableForm({ ...comparableForm, land_area_m2: e.target.value })} /></Field>
                  <Field label="Construccion m2"><Input type="number" value={comparableForm.construction_area_m2} onChange={(e) => setComparableForm({ ...comparableForm, construction_area_m2: e.target.value })} /></Field>
                  <Field label="Condicion"><Input type="number" value={comparableForm.condition_score} onChange={(e) => setComparableForm({ ...comparableForm, condition_score: e.target.value })} /></Field>
                  <Field label="Calidad"><Input type="number" value={comparableForm.quality_score} onChange={(e) => setComparableForm({ ...comparableForm, quality_score: e.target.value })} /></Field>
                </div>
                <Field label="Amenidades"><Input value={comparableForm.amenities_text} onChange={(e) => setComparableForm({ ...comparableForm, amenities_text: e.target.value })} /></Field>
                <Button onClick={submitComparable} disabled={saving}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
              </div>
            )}
            table={(
              <DataList
                items={comparables}
                columns={[
                  ['Comparable', (item) => <><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.property_type} · {item.source_type}</p></>],
                  ['Zona', (item) => item.zone],
                  ['Operacion', (item) => item.operation_type],
                  ['Venta', (item) => money(item.price_mxn)],
                  ['Renta', (item) => money(item.monthly_rent_mxn)],
                ]}
                onEdit={editComparable}
                onDelete={(item) => removeRecord('comparables', item.id)}
              />
            )}
          />
        )}

        {activeView === 'calculator' && (
          <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Casos</CardTitle>
                <CardDescription>Selecciona un expediente para recalcular.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {cases.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectCase(item.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${selectedCase?.id === item.id ? 'border-primary bg-primary/10' : 'border-border/70 bg-muted/20 hover:border-primary/50'}`}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.zone} · {money(item.last_calculation?.estimated_value_mxn)}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{selectedCase?.title || 'Calculadora'}</CardTitle>
                  <CardDescription>{selectedCase?.zone || 'Sin caso seleccionado'}</CardDescription>
                </div>
                <Button onClick={() => calculateCase()} disabled={!selectedCase || saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                  Recalcular
                </Button>
              </CardHeader>
              <CardContent>
                {selectedCase?.calculation ? (
                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <InlineStat icon={Scale} label="Valor base" value={money(selectedCase.calculation.estimated_value_mxn)} helper={`${money(selectedCase.calculation.low_value_mxn)} - ${money(selectedCase.calculation.high_value_mxn)}`} />
                      <InlineStat icon={Building2} label="Valor m2" value={money(selectedCase.calculation.value_per_m2_mxn)} helper={`${selectedCase.calculation.confidence_score}% confianza`} />
                      <InlineStat icon={Calculator} label="Renta sugerida" value={money(selectedCase.calculation.estimated_monthly_rent_mxn)} helper={`${selectedCase.calculation.gross_yield_pct}% yield bruto`} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <section className="rounded-lg border border-border/70 bg-muted/20 p-4">
                        <h3 className="font-semibold">Enfoques</h3>
                        <div className="mt-3 space-y-2">
                          {selectedCase.calculation.approaches.map((item) => (
                            <div key={item.name} className="flex items-center justify-between gap-3 rounded-md bg-background/70 p-3">
                              <span className="text-sm">{item.name}</span>
                              <span className="text-sm font-semibold">{money(item.value_mxn)}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section className="rounded-lg border border-border/70 bg-muted/20 p-4">
                        <h3 className="font-semibold">Riesgo normativo</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">{selectedCase.calculation.regulatory_score}% score</Badge>
                          <Badge variant="outline">{selectedCase.calculation.regulatory_risk_level}</Badge>
                          <Badge variant="outline">NOI {money(selectedCase.calculation.noi_mxn)}</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {selectedCase.calculation.regulatory_findings.map((item) => (
                            <p key={item} className="rounded-md bg-background/70 p-2 text-sm text-muted-foreground">{item}</p>
                          ))}
                        </div>
                      </section>
                    </div>

                    <section className="rounded-lg border border-border/70 bg-muted/20 p-4">
                      <h3 className="font-semibold">Siguientes acciones</h3>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {selectedCase.calculation.next_actions.map((item) => (
                          <p key={item} className="rounded-md bg-background/70 p-3 text-sm">{item}</p>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                    <Plus className="mr-2 h-4 w-4" /> Crea o selecciona un caso
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  </Field>
);

const CrudPanel = ({ title, description, icon: Icon, form, table }) => (
  <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
    <Card className="border-border/70 bg-card/95">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
    <Card className="border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Registros</CardTitle>
        <CardDescription>CRUD operativo del workspace activo.</CardDescription>
      </CardHeader>
      <CardContent>{table}</CardContent>
    </Card>
  </div>
);

const DataList = ({ items, columns, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px] text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          {columns.map(([label]) => <th key={label} className="py-3 pr-4">{label}</th>)}
          <th className="py-3 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-border/50">
            {columns.map(([label, render], index) => (
              <td key={`${item.id}-${label}`} className={`py-3 pr-4 ${index === 0 ? 'min-w-64' : ''}`}>{render(item)}</td>
            ))}
            <td className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>Editar</Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ValuationPage;

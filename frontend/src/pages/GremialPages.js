import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const money = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value || 0));
const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');
const dateToApi = (value) => (value ? `${value}T00:00:00Z` : undefined);

const PageShell = ({ title, subtitle, children, action }) => (
  <div className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">Rovi Gremial OS</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const LoadingState = () => <div className="rounded-2xl border bg-card p-8 text-muted-foreground">Cargando datos gremiales...</div>;
const ErrorState = ({ error }) => <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;

const useGremialApi = (endpoint, fallback = null) => {
  const { api } = useAuth();
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }, [api, endpoint]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
};

const EmptyCard = ({ title = 'Sin registros', children }) => (
  <Card>
    <CardContent className="p-8 text-center text-muted-foreground">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2">{children}</p>
    </CardContent>
  </Card>
);

const nativeInputClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

const Field = ({ field, value, onChange }) => {
  if (field.type === 'textarea') {
    return <Textarea value={value || ''} onChange={(e) => onChange(field.name, e.target.value)} placeholder={field.placeholder || field.label} />;
  }
  if (field.type === 'select') {
    return (
      <select className={nativeInputClass} value={value || ''} onChange={(e) => onChange(field.name, e.target.value)}>
        <option value="">Seleccionar</option>
        {(field.options || []).map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}
      </select>
    );
  }
  return <Input type={field.type || 'text'} value={value || ''} onChange={(e) => onChange(field.name, e.target.value)} placeholder={field.placeholder || field.label} />;
};

const FormDialog = ({ open, onOpenChange, title, description, fields, initialValues = {}, onSubmit, submitLabel = 'Guardar' }) => {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValues(initialValues || {});
      setError('');
    }
  }, [open, initialValues]);

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {error && <ErrorState error={error} />}
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className={field.type === 'textarea' ? 'space-y-1 md:col-span-2' : 'space-y-1'}>
                <span className="text-sm font-medium">{field.label}</span>
                <Field field={field} value={values[field.name]} onChange={setField} />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const cleanPayload = (values) => Object.fromEntries(
  Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const memberFields = [
  { name: 'company_name', label: 'Empresa' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'representative_name', label: 'Representante' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'rfc', label: 'RFC' },
  { name: 'state', label: 'Estado' },
  { name: 'city', label: 'Ciudad' },
  { name: 'sector', label: 'Sector' },
  { name: 'member_status', label: 'Estatus', type: 'select', options: ['pending', 'active', 'risk', 'inactive'] },
  { name: 'membership_tier', label: 'Nivel', type: 'select', options: ['base', 'premium', 'strategic'] },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

const delegationFields = [
  { name: 'name', label: 'Nombre' },
  { name: 'state', label: 'Estado' },
  { name: 'city', label: 'Ciudad' },
  { name: 'president_name', label: 'Presidente/a' },
  { name: 'admin_email', label: 'Email administrativo', type: 'email' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'status', label: 'Estatus', type: 'select', options: ['active', 'paused', 'inactive'] },
  { name: 'website', label: 'Website' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

const leadFields = [
  { name: 'company_name', label: 'Empresa' },
  { name: 'contact_name', label: 'Contacto' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'state', label: 'Estado' },
  { name: 'city', label: 'Ciudad' },
  { name: 'interest', label: 'Interés' },
  { name: 'source', label: 'Fuente' },
  { name: 'stage', label: 'Etapa', type: 'select', options: ['nuevo', 'contactado', 'requisitos_enviados', 'documentos_recibidos', 'convertido', 'perdido'] },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

const membershipFields = [
  { name: 'plan_name', label: 'Plan' },
  { name: 'plan_price', label: 'Precio', type: 'number' },
  { name: 'renewal_date', label: 'Fecha de renovación', type: 'date' },
  { name: 'payment_status', label: 'Pago', type: 'select', options: ['paid', 'due', 'overdue', 'waived'] },
  { name: 'balance_due', label: 'Saldo pendiente', type: 'number' },
  { name: 'benefits_summary', label: 'Beneficios / notas', type: 'textarea' },
];

const documentFields = [
  { name: 'document_type', label: 'Tipo de documento', type: 'select', options: ['constancia_fiscal', 'acta_constitutiva', 'identificacion', 'comprobante_domicilio', 'certificacion', 'otro'] },
  { name: 'file_url', label: 'URL del archivo' },
  { name: 'expires_at', label: 'Vence', type: 'date' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

const serviceFields = [
  { name: 'title', label: 'Servicio' },
  { name: 'category', label: 'Categoría', type: 'select', options: ['beneficio', 'consultoria', 'tramite', 'capacitacion', 'networking'] },
  { name: 'scope', label: 'Alcance', type: 'select', options: ['national', 'delegation'] },
  { name: 'status', label: 'Estatus', type: 'select', options: ['active', 'paused', 'archived'] },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

const opportunityFields = [
  { name: 'title', label: 'Título' },
  { name: 'opportunity_type', label: 'Tipo', type: 'select', options: ['private', 'public', 'partner'] },
  { name: 'state', label: 'Estado' },
  { name: 'sector', label: 'Sector' },
  { name: 'budget', label: 'Presupuesto', type: 'number' },
  { name: 'status', label: 'Estatus', type: 'select', options: ['draft', 'published', 'open', 'closed', 'archived'] },
  { name: 'closes_at', label: 'Cierra', type: 'date' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

const tenderFields = [
  ...opportunityFields,
  { name: 'dependency', label: 'Dependencia' },
  { name: 'tender_number', label: 'Número de licitación' },
  { name: 'published_at', label: 'Publicada', type: 'date' },
];

const isMemberPortalUser = (user) => user?.account_type === 'member_company' || String(user?.role || user?.active_role || '').startsWith('gremial_member');

const withDatePayload = (values, dateFields = []) => {
  const next = { ...values };
  dateFields.forEach((field) => { next[field] = dateToApi(next[field]); });
  return cleanPayload(next);
};

const RequestReviewPanel = ({ title, endpoint, statusEndpoint, itemIdField = 'id' }) => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi(endpoint, []);
  const setStatus = async (item, status) => {
    await api.post(`${statusEndpoint}/${item[itemIdField]}/status`, { status, notes: `Marcado como ${status} desde Gremial OS` });
    await reload();
  };
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && (data || []).slice(0, 8).map((item) => (
          <div key={item.id} className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center justify-between gap-3"><p className="font-medium">{item.member_id}</p><Badge>{item.status}</Badge></div>
            {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus(item, 'reviewing')}>Revisando</Button>
              <Button size="sm" onClick={() => setStatus(item, 'approved')}>Aprobar</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(item, 'rejected')}>Rechazar</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(item, 'completed')}>Completar</Button>
            </div>
          </div>
        ))}
        {!loading && !error && !(data || []).length && <p className="text-sm text-muted-foreground">Sin registros pendientes.</p>}
      </CardContent>
    </Card>
  );
};

const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const matchesQuery = (item, query, fields) => {
  const needle = normalizeText(query);
  if (!needle) return true;
  return fields.some((field) => normalizeText(item?.[field]).includes(needle));
};
const countBy = (items, field, value) => (items || []).filter((item) => item?.[field] === value).length;

const SearchToolbar = ({ query, onQueryChange, placeholder = 'Buscar por nombre, estado, sector o estatus...' }) => (
  <div className="rounded-2xl border bg-card p-3">
    <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} />
  </div>
);

const SummaryStrip = ({ items }) => (
  <div className="grid gap-3 md:grid-cols-4">
    {items.map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}
  </div>
);

const DemoReadyBanner = () => (
  <div className="rounded-3xl border bg-gradient-to-r from-red-50 to-background p-5">
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">Demo comercial lista</p>
        <h2 className="text-xl font-bold">CMIC / Cámara / Asociación en una sola operación</h2>
        <p className="text-sm text-muted-foreground">Afiliación, expedientes, renovaciones, beneficios, oportunidades, licitaciones y AI Control Tower conectados de punta a punta.</p>
      </div>
      <Badge>Fase 2 cerrada</Badge>
    </div>
  </div>
);

export const GremialDashboardPage = () => {
  const { data, loading, error, reload } = useGremialApi('/gremial/dashboard', {});
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  const kpis = data?.kpis || {};
  return (
    <PageShell title="Resumen nacional gremial" subtitle="Control operativo de afiliación, renovaciones, oportunidades, licitaciones y alertas por delegación." action={<Button onClick={reload}>Actualizar</Button>}>
      <DemoReadyBanner />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Afiliados', kpis.member_count || 0], ['Activos', kpis.active_members || 0], ['Prospectos abiertos', kpis.leads_open || 0], ['Cartera por cobrar', money(kpis.revenue_due || 0)],
          ['Renovaciones pendientes', kpis.memberships_due || 0], ['Oportunidades', kpis.opportunities || 0], ['Licitaciones', kpis.tenders || 0], ['Delegaciones', data?.delegations?.length || 0],
        ].map(([label, value]) => <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Delegaciones</CardTitle></CardHeader><CardContent className="space-y-3">{(data?.delegations || []).map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.city}, {item.state}</p></div><Badge>{item.status || 'active'}</Badge></div>)}{!data?.delegations?.length && <p className="text-muted-foreground">Aún no hay delegaciones.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>AI Control Tower</CardTitle></CardHeader><CardContent className="space-y-3">{(data?.recommendations || []).map((item) => <div key={item.id} className="rounded-xl border p-3"><div className="flex items-center justify-between"><p className="font-medium">{item.title}</p><Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>{item.priority}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 text-sm font-medium">{item.suggested_action}</p></div>)}{!data?.recommendations?.length && <p className="text-muted-foreground">Sin recomendaciones abiertas.</p>}</CardContent></Card>
      </div>
    </PageShell>
  );
};

export const GremialDelegationsPage = () => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi('/gremial/delegations', []);
  const [editing, setEditing] = useState(null);
  const save = async (values) => {
    const payload = cleanPayload(values);
    if (editing?.id) await api.put(`/gremial/delegations/${editing.id}`, payload); else await api.post('/gremial/delegations', payload);
    await reload();
  };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Delegaciones" subtitle="Operación territorial, presidentes locales y cobertura estatal." action={<Button onClick={() => setEditing({ status: 'active' })}>Nueva delegación</Button>}>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(data || []).map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-muted-foreground">{item.city}, {item.state}</p><p className="text-sm">Presidencia: {item.president_name || 'Pendiente'}</p><Badge>{item.status || 'active'}</Badge><Button className="w-full" variant="outline" onClick={() => setEditing(item)}>Editar</Button></CardContent></Card>)}</div>
    {!data?.length && <EmptyCard title="Sin delegaciones">Cuando existan datos aparecerán aquí.</EmptyCard>}
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar delegación' : 'Nueva delegación'} fields={delegationFields} initialValues={editing || { status: 'active' }} onSubmit={save} />
  </PageShell>;
};

const DocumentManager = ({ memberId, memberName, onClose }) => {
  const { api } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/gremial/members/${memberId}`);
      setDetail(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'No se pudo cargar el expediente');
    } finally {
      setLoading(false);
    }
  }, [api, memberId]);

  useEffect(() => { load(); }, [load]);

  const createDocument = async (values) => {
    const payload = cleanPayload({ ...values, expires_at: dateToApi(values.expires_at), status: 'submitted' });
    await api.post(`/gremial/members/${memberId}/documents`, payload);
    await load();
  };
  const approve = async (doc) => { await api.post(`/gremial/documents/${doc.id}/approve`); await load(); };
  const reject = async (doc) => { await api.post(`/gremial/documents/${doc.id}/reject`, { status: 'rejected', notes: 'Rechazado desde revisión de expediente' }); await load(); };

  return (
    <Dialog open={!!memberId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Expediente de {memberName || detail?.member?.company_name || 'afiliado'}</DialogTitle>
          <DialogDescription>Documentos, estatus y revisión administrativa.</DialogDescription>
        </DialogHeader>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {!loading && !error && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expediente</p><p className="text-2xl font-bold">{detail?.member?.profile_completion || 0}%</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Membresía</p><p className="font-semibold">{detail?.membership?.payment_status || 'Sin membresía'}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Documentos</p><p className="text-2xl font-bold">{detail?.documents?.length || 0}</p></CardContent></Card>
            </div>
            <div className="flex justify-end"><Button onClick={() => setAdding(true)}>Agregar documento</Button></div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {(detail?.documents || []).map((doc) => (
                <div key={doc.id} className="rounded-xl border p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{doc.document_type}</p>
                      <p className="text-sm text-muted-foreground break-all">{doc.file_url}</p>
                      {doc.review_notes && <p className="text-sm text-red-500">{doc.review_notes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={doc.status === 'rejected' ? 'destructive' : 'secondary'}>{doc.status}</Badge>
                      {doc.status !== 'approved' && <Button size="sm" onClick={() => approve(doc)}>Aprobar</Button>}
                      {doc.status !== 'rejected' && <Button size="sm" variant="outline" onClick={() => reject(doc)}>Rechazar</Button>}
                    </div>
                  </div>
                </div>
              ))}
              {!detail?.documents?.length && <EmptyCard title="Sin documentos">Agrega documentos del expediente para habilitar revisión.</EmptyCard>}
            </div>
          </div>
        )}
      </DialogContent>
      <FormDialog open={adding} onOpenChange={setAdding} title="Agregar documento" fields={documentFields} initialValues={{ document_type: 'constancia_fiscal' }} onSubmit={createDocument} />
    </Dialog>
  );
};

export const GremialMembersPage = () => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi('/gremial/members', []);
  const [editing, setEditing] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (data || []).filter((item) => matchesQuery(item, query, ['company_name', 'representative_name', 'state', 'city', 'sector', 'member_status', 'membership_tier'])), [data, query]);
  const save = async (values) => {
    const payload = cleanPayload(values);
    if (editing?.id) await api.put(`/gremial/members/${editing.id}`, payload); else await api.post('/gremial/members', payload);
    await reload();
  };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Afiliados" subtitle="Padrón nacional/local de empresas afiliadas, score y expediente." action={<Button onClick={() => setEditing({ member_status: 'pending', membership_tier: 'base' })}>Nuevo afiliado</Button>}>
    <SummaryStrip items={[["Total", data?.length || 0], ["Activos", countBy(data, 'member_status', 'active')], ["En riesgo", countBy(data, 'member_status', 'risk')], ["Vista", filtered.length]]} />
    <SearchToolbar query={query} onQueryChange={setQuery} placeholder="Buscar afiliado por empresa, representante, estado, sector o estatus..." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.company_name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">{item.city}, {item.state}</p><div className="flex gap-2"><Badge>{item.member_status}</Badge><Badge variant="secondary">{item.membership_tier}</Badge></div><p className="text-sm">Expediente: {item.profile_completion || 0}% · Engagement: {item.engagement_score || 0}</p><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button variant="outline" onClick={() => setReviewing(item)}>Expediente</Button></div></CardContent></Card>)}</div>
    {!filtered.length && <EmptyCard title="Sin afiliados">No hay resultados con ese filtro.</EmptyCard>}
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar afiliado' : 'Nuevo afiliado'} fields={memberFields} initialValues={editing || { member_status: 'pending', membership_tier: 'base' }} onSubmit={save} />
    {reviewing && <DocumentManager memberId={reviewing.id} memberName={reviewing.company_name} onClose={() => { setReviewing(null); reload(); }} />}
  </PageShell>;
};

export const GremialMembershipsPage = () => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi('/gremial/memberships', []);
  const [editing, setEditing] = useState(null);
  const editInitial = editing ? { ...editing, renewal_date: dateOnly(editing.renewal_date) } : null;
  const save = async (values) => {
    const payload = cleanPayload({ ...values, renewal_date: dateToApi(values.renewal_date) });
    await api.put(`/gremial/memberships/${editing.id}`, payload);
    await reload();
  };
  const markPaid = async (item) => { await api.post(`/gremial/memberships/${item.id}/mark-paid`); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Renovaciones y membresías" subtitle="Cuotas, vencimientos y cartera por cobrar." action={<Button onClick={reload}>Actualizar</Button>}>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(data || []).map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.plan_name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Afiliado: {item.member_id}</p><p>Vence: {dateOnly(item.renewal_date) || 'Sin fecha'}</p><p>Saldo: <strong>{money(item.balance_due)}</strong></p><Badge variant={item.payment_status === 'overdue' ? 'destructive' : 'secondary'}>{item.payment_status}</Badge><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button onClick={() => markPaid(item)} disabled={item.payment_status === 'paid'}>Marcar pagado</Button></div></CardContent></Card>)}</div>
    {!data?.length && <EmptyCard title="Sin membresías">Cuando existan datos aparecerán aquí.</EmptyCard>}
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title="Editar membresía" fields={membershipFields} initialValues={editInitial || {}} onSubmit={save} />
  </PageShell>;
};

export const GremialAffiliationPipelinePage = () => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi('/gremial/affiliation-leads', []);
  const [editing, setEditing] = useState(null);
  const stages = ['nuevo', 'contactado', 'requisitos_enviados', 'documentos_recibidos', 'convertido'];
  const grouped = useMemo(() => (data || []).reduce((acc, item) => ({ ...acc, [item.stage || 'nuevo']: [...(acc[item.stage || 'nuevo'] || []), item] }), {}), [data]);
  const save = async (values) => {
    const payload = cleanPayload(values);
    if (editing?.id) await api.put(`/gremial/affiliation-leads/${editing.id}`, payload); else await api.post('/gremial/affiliation-leads', payload);
    await reload();
  };
  const move = async (lead, stage) => { await api.patch(`/gremial/affiliation-leads/${lead.id}/stage`, { stage }); await reload(); };
  const convert = async (lead) => { await api.post(`/gremial/affiliation-leads/${lead.id}/convert`); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Pipeline de afiliación" subtitle="Prospectos, asignación a delegación y conversión a afiliado." action={<Button onClick={() => setEditing({ stage: 'nuevo', source: 'manual', interest: 'afiliacion' })}>Nuevo prospecto</Button>}>
    <div className="grid gap-4 lg:grid-cols-5">{stages.map((stage, index) => <Card key={stage}><CardHeader><CardTitle className="text-base capitalize">{stage.replaceAll('_', ' ')}</CardTitle></CardHeader><CardContent className="space-y-3">{(grouped[stage] || []).map((lead) => <div key={lead.id} className="rounded-xl border p-3 space-y-2"><p className="font-medium">{lead.company_name}</p><p className="text-sm text-muted-foreground">{lead.contact_name}</p><p className="text-xs text-muted-foreground">{lead.interest}</p><div className="grid gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(lead)}>Editar</Button>{index < stages.length - 1 && <Button size="sm" variant="outline" onClick={() => move(lead, stages[index + 1])}>Avanzar</Button>}{stage !== 'convertido' && <Button size="sm" onClick={() => convert(lead)}>Convertir</Button>}</div></div>)}</CardContent></Card>)}</div>
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar prospecto' : 'Nuevo prospecto'} fields={leadFields} initialValues={editing || { stage: 'nuevo', source: 'manual', interest: 'afiliacion' }} onSubmit={save} />
  </PageShell>;
};

const SimpleListPage = ({ title, subtitle, endpoint, renderItem, emptyTitle }) => {
  const { data, loading, error, reload } = useGremialApi(endpoint, []);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title={title} subtitle={subtitle} action={<Button onClick={reload}>Actualizar</Button>}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(data || []).map(renderItem)}</div>{!data?.length && <EmptyCard title={emptyTitle}>Cuando existan datos aparecerán aquí.</EmptyCard>}</PageShell>;
};

export const GremialServicesPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/services', []);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (data || []).filter((item) => matchesQuery(item, query, ['title', 'category', 'status', 'scope', 'description'])), [data, query]);
  const requestService = async (item) => {
    setMessage('');
    try {
      await api.post(`/gremial/services/${item.id}/request`, { notes: 'Solicitud enviada desde portal gremial' });
      setMessage(`Solicitud enviada: ${item.title}`);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'No se pudo enviar la solicitud');
    }
  };
  const save = async (values) => {
    const payload = cleanPayload(values);
    if (editing?.id) await api.put(`/gremial/services/${editing.id}`, payload); else await api.post('/gremial/services', payload);
    await reload();
  };
  const setServiceStatus = async (item, status) => { await api.post(`/gremial/services/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Servicios y beneficios" subtitle="Catálogo medible de servicios de valor para afiliados." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'active', scope: 'national', category: 'beneficio' })}>Nuevo servicio</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <SummaryStrip items={[["Total", data?.length || 0], ["Activos", countBy(data, 'status', 'active')], ["Pausados", countBy(data, 'status', 'paused')], ["Vista", filtered.length]]} />
    <SearchToolbar query={query} onQueryChange={setQuery} placeholder="Buscar servicio por nombre, categoría, estatus o descripción..." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Badge>{item.category}</Badge><Badge variant="secondary">{item.status}</Badge></div><p className="text-sm text-muted-foreground">{item.description}</p>{isMemberPortal ? <Button className="w-full" variant="outline" onClick={() => requestService(item)}>Solicitar servicio</Button> : <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button variant="outline" onClick={() => setServiceStatus(item, item.status === 'active' ? 'paused' : 'active')}>{item.status === 'active' ? 'Pausar' : 'Activar'}</Button><Button className="col-span-2" variant="outline" onClick={() => setServiceStatus(item, 'archived')}>Archivar</Button></div>}</CardContent></Card>)}</div>
    {!filtered.length && <EmptyCard title="Sin servicios">No hay resultados con ese filtro.</EmptyCard>}
    {!isMemberPortal && <RequestReviewPanel title="Solicitudes de servicios" endpoint="/gremial/service-requests" statusEndpoint="/gremial/service-requests" />}
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar servicio' : 'Nuevo servicio'} fields={serviceFields} initialValues={editing || { status: 'active', scope: 'national', category: 'beneficio' }} onSubmit={save} />
  </PageShell>;
};

export const GremialOpportunitiesPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/opportunities', []);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (data || []).filter((item) => matchesQuery(item, query, ['title', 'opportunity_type', 'state', 'sector', 'status', 'description'])), [data, query]);
  const editInitial = editing ? { ...editing, closes_at: dateOnly(editing.closes_at) } : null;
  const apply = async (item) => {
    setMessage('');
    try {
      await api.post(`/gremial/opportunities/${item.id}/apply`, { notes: 'Postulación enviada desde Rovi Gremial OS' });
      setMessage(`Postulación enviada: ${item.title}`);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'No se pudo postular');
    }
  };
  const save = async (values) => {
    const payload = withDatePayload(values, ['closes_at']);
    if (editing?.id) await api.put(`/gremial/opportunities/${editing.id}`, payload); else await api.post('/gremial/opportunities', payload);
    await reload();
  };
  const setOpportunityStatus = async (item, status) => { await api.post(`/gremial/opportunities/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Oportunidades privadas" subtitle="Marketplace interno de oportunidades comerciales para afiliados." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'draft', opportunity_type: 'private' })}>Nueva oportunidad</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <SummaryStrip items={[["Total", data?.length || 0], ["Publicadas", countBy(data, 'status', 'published')], ["Abiertas", countBy(data, 'status', 'open')], ["Vista", filtered.length]]} />
    <SearchToolbar query={query} onQueryChange={setQuery} placeholder="Buscar oportunidad por título, estado, sector o estatus..." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{item.state} · {item.sector}</p><p>Presupuesto: {money(item.budget)}</p><Badge>{item.status}</Badge>{isMemberPortal ? <Button className="w-full" variant="outline" onClick={() => apply(item)}>Postular</Button> : <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button variant="outline" onClick={() => setOpportunityStatus(item, 'published')}>Publicar</Button><Button variant="outline" onClick={() => setOpportunityStatus(item, 'closed')}>Cerrar</Button><Button variant="outline" onClick={() => setOpportunityStatus(item, 'archived')}>Archivar</Button></div>}</CardContent></Card>)}</div>
    {!filtered.length && <EmptyCard title="Sin oportunidades">No hay resultados con ese filtro.</EmptyCard>}
    {!isMemberPortal && <RequestReviewPanel title="Postulaciones a oportunidades" endpoint="/gremial/opportunity-applications" statusEndpoint="/gremial/opportunity-applications" />}
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar oportunidad' : 'Nueva oportunidad'} fields={opportunityFields} initialValues={editInitial || { status: 'draft', opportunity_type: 'private' }} onSubmit={save} />
  </PageShell>;
};

export const GremialTendersPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/tenders', []);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (data || []).filter((item) => matchesQuery(item, query, ['title', 'dependency', 'state', 'sector', 'status', 'tender_number', 'description'])), [data, query]);
  const editInitial = editing ? { ...editing, closes_at: dateOnly(editing.closes_at), published_at: dateOnly(editing.published_at) } : null;
  const apply = async (item) => {
    setMessage('');
    try {
      await api.post(`/gremial/tenders/${item.id}/apply`, { notes: 'Postulación a licitación enviada desde Rovi Gremial OS' });
      setMessage(`Postulación enviada: ${item.title}`);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'No se pudo postular');
    }
  };
  const save = async (values) => {
    const payload = withDatePayload(values, ['closes_at', 'published_at']);
    if (editing?.id) await api.put(`/gremial/tenders/${editing.id}`, payload); else await api.post('/gremial/tenders', payload);
    await reload();
  };
  const setTenderStatus = async (item, status) => { await api.post(`/gremial/tenders/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Licitaciones" subtitle="Seguimiento de licitaciones públicas por estado, dependencia y especialidad." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'draft', opportunity_type: 'public' })}>Nueva licitación</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <SummaryStrip items={[["Total", data?.length || 0], ["Publicadas", countBy(data, 'status', 'published')], ["Abiertas", countBy(data, 'status', 'open')], ["Vista", filtered.length]]} />
    <SearchToolbar query={query} onQueryChange={setQuery} placeholder="Buscar licitación por título, dependencia, estado, sector o número..." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{item.dependency} · {item.state}</p><p>Monto estimado: {money(item.budget)}</p><Badge>{item.status}</Badge>{isMemberPortal ? <Button className="w-full" variant="outline" onClick={() => apply(item)}>Postular a licitación</Button> : <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button variant="outline" onClick={() => setTenderStatus(item, 'published')}>Publicar</Button><Button variant="outline" onClick={() => setTenderStatus(item, 'closed')}>Cerrar</Button><Button variant="outline" onClick={() => setTenderStatus(item, 'archived')}>Archivar</Button></div>}</CardContent></Card>)}</div>
    {!filtered.length && <EmptyCard title="Sin licitaciones">No hay resultados con ese filtro.</EmptyCard>}
    {!isMemberPortal && <RequestReviewPanel title="Postulaciones a licitaciones" endpoint="/gremial/tender-applications" statusEndpoint="/gremial/tender-applications" />}
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar licitación' : 'Nueva licitación'} fields={tenderFields} initialValues={editInitial || { status: 'draft', opportunity_type: 'public' }} onSubmit={save} />
  </PageShell>;
};
export const GremialAnalyticsPage = () => <GremialDashboardPage />;
export const GremialAIControlTowerPage = () => <SimpleListPage title="AI Control Tower" subtitle="Recomendaciones accionables de riesgo, renovación, expediente y oportunidades." endpoint="/gremial/ai/recommendations" emptyTitle="Sin recomendaciones" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>{item.priority}</Badge><p className="mt-3 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 text-sm font-medium">{item.suggested_action}</p></CardContent></Card>} />;
export const GremialCoursesPage = () => <PageShell title="Capacitación" subtitle="Cursos, certificaciones y programas formativos gremiales."><EmptyCard title="Módulo conectado en siguiente iteración">La base gremial está lista; se puede conectar al motor de cursos COPIM o a `/api/gremial/courses`.</EmptyCard></PageShell>;
export const GremialEventsPage = () => <PageShell title="Eventos" subtitle="Eventos nacionales/locales, registro, check-in y networking."><EmptyCard title="Módulo conectado en siguiente iteración">La base gremial está lista; se puede conectar al motor de eventos COPIM o a `/api/gremial/events`.</EmptyCard></PageShell>;

export const GremialMemberHomePage = () => {
  const { data, loading, error } = useGremialApi('/gremial/dashboard', {});
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  const member = data?.member || {};
  const membership = data?.membership || {};
  return <PageShell title="Mi portal gremial" subtitle="Autoservicio de membresía, pagos, beneficios, licitaciones y oportunidades."><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>{member.company_name || 'Mi empresa'}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Expediente: {member.profile_completion || 0}%</p><p>Engagement: {member.engagement_score || 0}</p></CardContent></Card><Card><CardHeader><CardTitle>Mi membresía</CardTitle></CardHeader><CardContent><Badge>{membership.payment_status || 'sin estado'}</Badge><p className="mt-2">Saldo: {money(membership.balance_due)}</p></CardContent></Card><Card><CardHeader><CardTitle>Oportunidades</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data?.recommended_opportunities?.length || 0}</p><p className="text-sm text-muted-foreground">Recomendadas</p></CardContent></Card></div></PageShell>;
};
export const GremialMemberProfilePage = () => <GremialMemberHomePage />;
export const GremialMemberMembershipPage = () => <GremialMemberHomePage />;
export const GremialMemberPaymentsPage = () => <SimpleListPage title="Mis pagos" subtitle="Facturas y cuotas pendientes." endpoint="/gremial/memberships" emptyTitle="Sin pagos pendientes" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.plan_name}</CardTitle></CardHeader><CardContent><p>{money(item.balance_due)}</p><Badge>{item.payment_status}</Badge></CardContent></Card>} />;
export const GremialMemberDocumentsPage = () => {
  const { api } = useAuth();
  const { data: dashboard, loading: dashLoading, error: dashError } = useGremialApi('/gremial/dashboard', {});
  const { data, loading, error, reload } = useGremialApi('/gremial/documents', []);
  const [adding, setAdding] = useState(false);
  const memberId = dashboard?.member?.id;
  const upload = async (values) => {
    const payload = cleanPayload({ ...values, expires_at: dateToApi(values.expires_at), status: 'submitted' });
    await api.post(`/gremial/members/${memberId}/documents`, payload);
    await reload();
  };
  if (loading || dashLoading) return <LoadingState />;
  if (error || dashError) return <ErrorState error={error || dashError} />;
  return <PageShell title="Mi expediente" subtitle="Documentos fiscales, legales y técnicos." action={<Button onClick={() => setAdding(true)} disabled={!memberId}>Subir documento</Button>}>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(data || []).map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.document_type}</CardTitle></CardHeader><CardContent className="space-y-2"><Badge variant={item.status === 'rejected' ? 'destructive' : 'secondary'}>{item.status}</Badge><p className="text-sm text-muted-foreground break-all">{item.file_url}</p>{item.review_notes && <p className="text-sm text-red-500">{item.review_notes}</p>}</CardContent></Card>)}</div>
    {!data?.length && <EmptyCard title="Sin documentos">Sube documentos para completar el expediente.</EmptyCard>}
    <FormDialog open={adding} onOpenChange={setAdding} title="Subir documento" fields={documentFields} initialValues={{ document_type: 'constancia_fiscal' }} onSubmit={upload} />
  </PageShell>;
};
export const GremialMemberOpportunitiesPage = GremialOpportunitiesPage;
export const GremialMemberTendersPage = GremialTendersPage;
export const GremialMemberCoursesPage = GremialCoursesPage;
export const GremialMemberEventsPage = GremialEventsPage;

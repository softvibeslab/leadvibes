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

const useGremialPagedApi = (endpoint, params = {}) => {
  const { api } = useAuth();
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 60, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const serialized = JSON.stringify(params);
  const requestParams = useMemo(() => JSON.parse(serialized), [serialized]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(endpoint, { params: { ...requestParams, paginated: true } });
      const payload = response.data || {};
      setData(Array.isArray(payload) ? { items: payload, total: payload.length, page: 1, page_size: payload.length || 60, pages: 1 } : payload);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }, [api, endpoint, requestParams]);

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

const courseFields = [
  { name: 'title', label: 'Curso / certificación' },
  { name: 'category', label: 'Categoría', type: 'select', options: ['capacitacion', 'certificacion', 'seguridad', 'normatividad', 'finanzas', 'licitaciones'] },
  { name: 'modality', label: 'Modalidad', type: 'select', options: ['online', 'presencial', 'hibrido'] },
  { name: 'instructor', label: 'Instructor / aliado' },
  { name: 'state', label: 'Estado' },
  { name: 'starts_at', label: 'Inicia', type: 'date' },
  { name: 'ends_at', label: 'Termina', type: 'date' },
  { name: 'capacity', label: 'Cupo', type: 'number' },
  { name: 'price', label: 'Precio', type: 'number' },
  { name: 'status', label: 'Estatus', type: 'select', options: ['draft', 'published', 'open', 'closed', 'archived'] },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

const eventFields = [
  { name: 'title', label: 'Evento' },
  { name: 'event_type', label: 'Tipo', type: 'select', options: ['networking', 'asamblea', 'expo', 'webinar', 'foro', 'comite'] },
  { name: 'venue', label: 'Sede' },
  { name: 'state', label: 'Estado' },
  { name: 'starts_at', label: 'Inicia', type: 'date' },
  { name: 'ends_at', label: 'Termina', type: 'date' },
  { name: 'capacity', label: 'Cupo', type: 'number' },
  { name: 'price', label: 'Precio', type: 'number' },
  { name: 'status', label: 'Estatus', type: 'select', options: ['draft', 'published', 'open', 'closed', 'archived'] },
  { name: 'description', label: 'Descripción', type: 'textarea' },
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

const getItems = (payload) => Array.isArray(payload) ? payload : (payload?.items || []);

const uniqueOptions = (items, field) => Array.from(new Set((items || []).map((item) => item?.[field]).filter(Boolean))).sort();

const useClientExplorer = (items, searchFields, filterConfig = []) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const filtered = useMemo(() => (items || []).filter((item) => {
    const textMatch = matchesQuery(item, query, searchFields);
    const filterMatch = filterConfig.every((filter) => !filters[filter.field] || filters[filter.field] === 'all' || item?.[filter.field] === filters[filter.field]);
    return textMatch && filterMatch;
  }), [items, query, filters, searchFields, filterConfig]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  useEffect(() => { setPage(1); }, [query, filters, pageSize]);
  const setFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
  return { query, setQuery, filters, setFilter, filterConfig, page: safePage, setPage, pageSize, setPageSize, filtered, pageItems, pages };
};

const ExplorerToolbar = ({ query, onQueryChange, placeholder, filters = [], filterValues = {}, onFilterChange, total, visible, pageSize, onPageSizeChange }) => (
  <div className="rounded-2xl border bg-card p-3 space-y-3">
    <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
      <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{visible} de {total} registros</span>
        <select className={nativeInputClass} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[12, 24, 48, 60, 100].map((size) => <option key={size} value={size}>{size}/página</option>)}
        </select>
      </div>
    </div>
    {!!filters.length && <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-4">
      {filters.map((filter) => (
        <select key={filter.field} className={nativeInputClass} value={filterValues[filter.field] || 'all'} onChange={(event) => onFilterChange(filter.field, event.target.value)}>
          <option value="all">{filter.label}: todos</option>
          {(filter.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ))}
    </div>}
  </div>
);

const PaginationControls = ({ page, pages, onPage }) => (
  <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3 text-sm md:flex-row md:items-center md:justify-between">
    <span className="text-muted-foreground">Página {page} de {pages}</span>
    <div className="flex gap-2">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPage(1)}>Primera</Button>
      <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
      <Button variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente</Button>
      <Button variant="outline" disabled={page >= pages} onClick={() => onPage(pages)}>Última</Button>
    </div>
  </div>
);

const aiRecommendationsFor = (type, item = {}) => {
  const status = item.member_status || item.payment_status || item.status || item.stage;
  const recs = [];
  if (type === 'member') {
    if ((item.profile_completion || 0) < 80) recs.push('Solicitar expediente faltante antes de habilitar licitaciones o beneficios premium.');
    if (item.member_status === 'risk' || (item.engagement_score || 0) < 55) recs.push('Activar campaña de retención con llamada de delegación y paquete de valor usado.');
    recs.push(`Cruzar con oportunidades de ${item.sector || item.state || 'su sector'} y cursos próximos para aumentar engagement.`);
  } else if (type === 'delegation') {
    recs.push('Priorizar afiliación de empresas activas del estado y tablero semanal de renovaciones.');
    recs.push('Asignar responsable de comités, convenios y cartera para convertir la base territorial en acciones.');
  } else if (type === 'membership') {
    recs.push(status === 'overdue' ? 'Escalar cobranza hoy con recordatorio WhatsApp/email y promesa de pago.' : 'Preparar renovación con beneficios, eventos y oportunidades utilizados por el afiliado.');
  } else if (type === 'lead') {
    recs.push('Siguiente mejor acción: llamada consultiva, envío de requisitos y asignación automática por delegación.');
    recs.push('Si responde, convertir a afiliado y crear membresía anual con expediente inicial.');
  } else {
    recs.push('Medir interés por registros, postulaciones o solicitudes y promoverlo a afiliados compatibles.');
    recs.push('Publicar/activar sólo cuando tenga descripción, vigencia, alcance y llamada a la acción clara.');
  }
  return recs;
};

const DetailCardDialog = ({ open, onOpenChange, title, subtitle, item, fields = [], type = 'general', actions }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
      </DialogHeader>
      {item && <div className="space-y-4">
        <div className="rounded-2xl border bg-gradient-to-r from-red-50 to-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">Detalle ejecutivo</p>
          <h3 className="mt-1 text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {fields.map(([label, value]) => <div key={label} className="rounded-xl border p-3"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="font-medium break-words">{value || 'Pendiente'}</p></div>)}
        </div>
        <Card>
          <CardHeader><CardTitle>Recomendaciones IA</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {aiRecommendationsFor(type, item).map((rec) => <div key={rec} className="rounded-xl border bg-muted/30 p-3 text-sm">{rec}</div>)}
          </CardContent>
        </Card>
        {actions && <div className="grid gap-2 md:grid-cols-2">{actions}</div>}
      </div>}
    </DialogContent>
  </Dialog>
);

const CatalogExplorer = ({ items, searchFields, filters = [], placeholder, renderItem, emptyTitle, summary }) => {
  const explorer = useClientExplorer(items, searchFields, filters);
  return <>
    {summary ? <SummaryStrip items={summary(explorer)} /> : <SummaryStrip items={[["Total", items.length], ["Vista", explorer.filtered.length], ["Página", `${explorer.page}/${explorer.pages}`], ["Por página", explorer.pageSize]]} />}
    <ExplorerToolbar query={explorer.query} onQueryChange={explorer.setQuery} placeholder={placeholder} filters={explorer.filterConfig} filterValues={explorer.filters} onFilterChange={explorer.setFilter} total={items.length} visible={explorer.filtered.length} pageSize={explorer.pageSize} onPageSizeChange={explorer.setPageSize} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{explorer.pageItems.map(renderItem)}</div>
    {!explorer.filtered.length && <EmptyCard title={emptyTitle || 'Sin registros'}>No hay resultados con esos filtros.</EmptyCard>}
    <PaginationControls page={explorer.page} pages={explorer.pages} onPage={explorer.setPage} />
  </>;
};

const DemoReadyBanner = () => (
  <div className="rounded-3xl border bg-gradient-to-r from-red-50 to-background p-5">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-500">Demo ejecutiva CMIC lista</p>
          <h2 className="text-xl font-bold">Un sistema operativo para retener afiliados, generar ingresos y activar oportunidades</h2>
          <p className="text-sm text-muted-foreground">Afiliación, expedientes, renovaciones, cartera, capacitación, eventos, servicios, oportunidades, licitaciones y AI Control Tower conectados de punta a punta.</p>
        </div>
        <Badge>E2E listo para comité</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Retención', 'Detecta afiliados en riesgo y vencimientos antes de perder cuotas.'],
          ['Ingresos', 'Convierte renovaciones, cursos, eventos y servicios en cartera accionable.'],
          ['Valor al afiliado', 'Centraliza licitaciones, oportunidades y beneficios visibles para cada empresa.'],
          ['Gobernanza', 'Nacional, delegaciones y afiliados trabajan con permisos y datos trazables.'],
        ].map(([title, body]) => <div key={title} className="rounded-2xl border bg-background/70 p-3"><p className="font-semibold">{title}</p><p className="text-xs text-muted-foreground">{body}</p></div>)}
      </div>
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
          ['Renovaciones pendientes', kpis.memberships_due || 0], ['Oportunidades', kpis.opportunities || 0], ['Licitaciones', kpis.tenders || 0], ['Cursos', kpis.courses || 0], ['Eventos', kpis.events || 0], ['Delegaciones', data?.delegations?.length || 0],
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
  const [selected, setSelected] = useState(null);
  const items = getItems(data);
  const explorer = useClientExplorer(items, ['name', 'state', 'city', 'president_name', 'admin_email', 'notes'], [
    { field: 'status', label: 'Estatus', options: ['active', 'paused', 'inactive'] },
    { field: 'state', label: 'Estado', options: uniqueOptions(items, 'state') },
  ]);
  const save = async (values) => {
    const payload = cleanPayload(values);
    if (editing?.id) await api.put(`/gremial/delegations/${editing.id}`, payload); else await api.post('/gremial/delegations', payload);
    await reload();
  };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Delegaciones" subtitle="Operación territorial, presidentes locales, cobertura estatal e inteligencia por plaza." action={<Button onClick={() => setEditing({ status: 'active' })}>Nueva delegación</Button>}>
    <SummaryStrip items={[["Total", items.length], ["Activas", countBy(items, 'status', 'active')], ["Vista", explorer.filtered.length], ["Página", `${explorer.page}/${explorer.pages}`]]} />
    <ExplorerToolbar query={explorer.query} onQueryChange={explorer.setQuery} placeholder="Buscar delegación por nombre, estado, ciudad, presidencia o notas..." filters={explorer.filterConfig} filterValues={explorer.filters} onFilterChange={explorer.setFilter} total={items.length} visible={explorer.filtered.length} pageSize={explorer.pageSize} onPageSizeChange={explorer.setPageSize} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{explorer.pageItems.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-muted-foreground">{item.city}, {item.state}</p><p className="text-sm">Presidencia: {item.president_name || 'Pendiente'}</p><div className="flex flex-wrap gap-2"><Badge>{item.status || 'active'}</Badge><Badge variant="outline">{item.phone || 'Sin teléfono'}</Badge></div><div className="grid grid-cols-2 gap-2"><Button className="w-full" variant="outline" onClick={() => setSelected(item)}>Detalle</Button><Button className="w-full" variant="outline" onClick={() => setEditing(item)}>Editar</Button></div></CardContent></Card>)}</div>
    {!explorer.filtered.length && <EmptyCard title="Sin delegaciones">No hay resultados con esos filtros.</EmptyCard>}
    <PaginationControls page={explorer.page} pages={explorer.pages} onPage={explorer.setPage} />
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} type="delegation" item={selected} title={selected?.name || 'Delegación'} subtitle={`${selected?.city || ''}, ${selected?.state || ''}`} fields={selected ? [["Presidencia", selected.president_name], ["Email administrativo", selected.admin_email], ["Teléfono", selected.phone], ["Website", selected.website], ["Estatus", selected.status], ["Notas", selected.notes]] : []} actions={selected && <Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar delegación</Button>} />
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
  const [editing, setEditing] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [state, setState] = useState('all');
  const [tier, setTier] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(60);
  const params = { page, page_size: pageSize, q: query || undefined, status, state, tier };
  const { data, loading, error, reload } = useGremialPagedApi('/gremial/members', params);
  const items = getItems(data);
  const save = async (values) => {
    const payload = cleanPayload(values);
    if (editing?.id) await api.put(`/gremial/members/${editing.id}`, payload); else await api.post('/gremial/members', payload);
    await reload();
  };
  useEffect(() => { setPage(1); }, [query, status, state, tier, pageSize]);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Afiliados" subtitle="Padrón nacional/local de empresas afiliadas, score, expediente e inteligencia accionable." action={<Button onClick={() => setEditing({ member_status: 'pending', membership_tier: 'base' })}>Nuevo afiliado</Button>}>
    <SummaryStrip items={[["Total indexado", data?.total || 0], ["En esta página", items.length], ["Página", `${data?.page || page}/${data?.pages || 1}`], ["Búsqueda", query || 'Todas']]} />
    <ExplorerToolbar
      query={query}
      onQueryChange={setQuery}
      placeholder="Buscar por empresa, representante, RFC, estado, ciudad, sector, email o estatus..."
      total={data?.total || 0}
      visible={items.length}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      filterValues={{ status, state, tier }}
      onFilterChange={(field, value) => ({ status: setStatus, state: setState, tier: setTier }[field](value))}
      filters={[
        { field: 'status', label: 'Estatus', options: ['active', 'risk', 'pending', 'inactive'] },
        { field: 'state', label: 'Estado', options: uniqueOptions(items, 'state') },
        { field: 'tier', label: 'Nivel', options: ['base', 'premium', 'strategic'] },
      ]}
    />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card key={item.id} className="hover:shadow-md transition-shadow"><CardHeader><CardTitle>{item.company_name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">{item.city}, {item.state}</p><div className="flex flex-wrap gap-2"><Badge>{item.member_status}</Badge><Badge variant="secondary">{item.membership_tier}</Badge><Badge variant="outline">{item.sector || 'Sin sector'}</Badge></div><p className="text-sm">Expediente: {item.profile_completion || 0}% · Engagement: {item.engagement_score || 0}</p><div className="grid grid-cols-3 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button variant="outline" onClick={() => setReviewing(item)}>Expediente</Button></div></CardContent></Card>)}</div>
    {!items.length && <EmptyCard title="Sin afiliados">No hay resultados con esos filtros.</EmptyCard>}
    <PaginationControls page={data?.page || page} pages={data?.pages || 1} onPage={setPage} />
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} type="member" item={selected} title={selected?.company_name || 'Afiliado'} subtitle={`${selected?.city || ''}, ${selected?.state || ''}`} fields={selected ? [["Representante", selected.representative_name], ["Email", selected.email], ["RFC", selected.rfc], ["Sector", selected.sector], ["Estatus", selected.member_status], ["Nivel", selected.membership_tier], ["Expediente", `${selected.profile_completion || 0}%`], ["Engagement", selected.engagement_score || 0], ["Notas", selected.notes]] : []} actions={selected && <><Button variant="outline" onClick={() => { setEditing(selected); setSelected(null); }}>Editar afiliado</Button><Button onClick={() => { setReviewing(selected); setSelected(null); }}>Abrir expediente</Button></>} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar afiliado' : 'Nuevo afiliado'} fields={memberFields} initialValues={editing || { member_status: 'pending', membership_tier: 'base' }} onSubmit={save} />
    {reviewing && <DocumentManager memberId={reviewing.id} memberName={reviewing.company_name} onClose={() => { setReviewing(null); reload(); }} />}
  </PageShell>;
};

export const GremialMembershipsPage = () => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi('/gremial/memberships', []);
  const items = getItems(data);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const editInitial = editing ? { ...editing, renewal_date: dateOnly(editing.renewal_date) } : null;
  const save = async (values) => { const payload = cleanPayload({ ...values, renewal_date: dateToApi(values.renewal_date) }); await api.put(`/gremial/memberships/${editing.id}`, payload); await reload(); };
  const markPaid = async (item) => { await api.post(`/gremial/memberships/${item.id}/mark-paid`); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Renovaciones y membresías" subtitle="Cuotas, vencimientos, cartera por cobrar y recomendaciones de cobranza." action={<Button onClick={reload}>Actualizar</Button>}>
    <CatalogExplorer items={items} searchFields={['plan_name', 'member_id', 'payment_status', 'benefits_summary', 'notes']} filters={[{ field: 'payment_status', label: 'Pago', options: uniqueOptions(items, 'payment_status') }, { field: 'billing_period', label: 'Periodo', options: uniqueOptions(items, 'billing_period') }]} placeholder="Buscar por afiliado, plan, pago o beneficios..." emptyTitle="Sin membresías" summary={(ex) => [["Total", items.length], ["Pendientes", items.filter((i) => ['due','overdue'].includes(i.payment_status)).length], ["Cartera", money(items.reduce((s, i) => s + Number(i.balance_due || 0), 0))], ["Vista", ex.filtered.length]]} renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.plan_name}</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">Afiliado: {item.member_id}</p><p>Vence: {dateOnly(item.renewal_date) || 'Sin fecha'}</p><p>Saldo: <strong>{money(item.balance_due)}</strong></p><Badge variant={item.payment_status === 'overdue' ? 'destructive' : 'secondary'}>{item.payment_status}</Badge><div className="grid grid-cols-3 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button onClick={() => markPaid(item)} disabled={item.payment_status === 'paid'}>Pagado</Button></div></CardContent></Card>} />
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} type="membership" item={selected} title={selected?.plan_name || 'Membresía'} subtitle={`Afiliado ${selected?.member_id || ''}`} fields={selected ? [["Afiliado", selected.member_id], ["Delegación", selected.delegation_id], ["Renovación", dateOnly(selected.renewal_date)], ["Pago", selected.payment_status], ["Saldo", money(selected.balance_due)], ["Beneficios", selected.benefits_summary], ["Notas", selected.notes]] : []} actions={selected && <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar membresía</Button><Button variant="outline" onClick={() => markPaid(selected)} disabled={selected.payment_status === 'paid'}>Marcar pagado</Button></>} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title="Editar membresía" fields={membershipFields} initialValues={editInitial || {}} onSubmit={save} />
  </PageShell>;
};

export const GremialAffiliationPipelinePage = () => {
  const { api } = useAuth();
  const { data, loading, error, reload } = useGremialApi('/gremial/affiliation-leads', []);
  const items = getItems(data);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const stages = ['nuevo', 'contactado', 'requisitos_enviados', 'documentos_recibidos', 'convertido'];
  const filtered = useMemo(() => items.filter((item) => matchesQuery(item, query, ['company_name', 'contact_name', 'email', 'phone', 'state', 'city', 'interest', 'source', 'stage', 'notes'])), [items, query]);
  const grouped = useMemo(() => filtered.reduce((acc, item) => ({ ...acc, [item.stage || 'nuevo']: [...(acc[item.stage || 'nuevo'] || []), item] }), {}), [filtered]);
  const save = async (values) => { const payload = cleanPayload(values); if (editing?.id) await api.put(`/gremial/affiliation-leads/${editing.id}`, payload); else await api.post('/gremial/affiliation-leads', payload); await reload(); };
  const move = async (lead, stage) => { await api.patch(`/gremial/affiliation-leads/${lead.id}/stage`, { stage }); await reload(); };
  const convert = async (lead) => { await api.post(`/gremial/affiliation-leads/${lead.id}/convert`); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Pipeline de afiliación" subtitle="Prospectos, búsqueda, detalle ejecutivo y conversión a afiliado." action={<Button onClick={() => setEditing({ stage: 'nuevo', source: 'manual', interest: 'afiliacion' })}>Nuevo prospecto</Button>}>
    <SummaryStrip items={[["Total", items.length], ["Vista", filtered.length], ["Nuevos", countBy(items, 'stage', 'nuevo')], ["Convertidos", countBy(items, 'stage', 'convertido')]]} />
    <SearchToolbar query={query} onQueryChange={setQuery} placeholder="Buscar prospecto por empresa, contacto, estado, fuente, etapa o notas..." />
    <div className="grid gap-4 lg:grid-cols-5">{stages.map((stage, index) => <Card key={stage}><CardHeader><CardTitle className="text-base capitalize">{stage.replaceAll('_', ' ')} ({(grouped[stage] || []).length})</CardTitle></CardHeader><CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">{(grouped[stage] || []).slice(0, 100).map((lead) => <div key={lead.id} className="rounded-xl border p-3 space-y-2"><p className="font-medium">{lead.company_name}</p><p className="text-sm text-muted-foreground">{lead.contact_name}</p><p className="text-xs text-muted-foreground">{lead.interest}</p><div className="grid gap-2"><Button size="sm" variant="outline" onClick={() => setSelected(lead)}>Detalle IA</Button><Button size="sm" variant="outline" onClick={() => setEditing(lead)}>Editar</Button>{index < stages.length - 1 && <Button size="sm" variant="outline" onClick={() => move(lead, stages[index + 1])}>Avanzar</Button>}{stage !== 'convertido' && <Button size="sm" onClick={() => convert(lead)}>Convertir</Button>}</div></div>)}</CardContent></Card>)}</div>
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} type="lead" item={selected} title={selected?.company_name || 'Prospecto'} subtitle={selected?.contact_name} fields={selected ? [["Contacto", selected.contact_name], ["Email", selected.email], ["Teléfono", selected.phone], ["Estado", selected.state], ["Interés", selected.interest], ["Fuente", selected.source], ["Etapa", selected.stage], ["Notas", selected.notes]] : []} actions={selected && <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar prospecto</Button><Button variant="outline" onClick={() => convert(selected)}>Convertir a afiliado</Button></>} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar prospecto' : 'Nuevo prospecto'} fields={leadFields} initialValues={editing || { stage: 'nuevo', source: 'manual', interest: 'afiliacion' }} onSubmit={save} />
  </PageShell>;
};

const SimpleListPage = ({ title, subtitle, endpoint, renderItem, emptyTitle }) => {
  const { data, loading, error, reload } = useGremialApi(endpoint, []);
  const items = getItems(data);
  const [selected, setSelected] = useState(null);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title={title} subtitle={subtitle} action={<Button onClick={reload}>Actualizar</Button>}>
    <CatalogExplorer items={items} searchFields={['title', 'category', 'priority', 'explanation', 'suggested_action', 'status']} placeholder="Buscar por título, categoría, prioridad o recomendación..." emptyTitle={emptyTitle} renderItem={(item) => <div key={item.id} onClick={() => setSelected(item)}>{renderItem(item)}</div>} />
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} type="general" item={selected} title={selected?.title || title} subtitle={selected?.explanation} fields={selected ? [["Prioridad", selected.priority], ["Categoría", selected.category], ["Estatus", selected.status], ["Acción sugerida", selected.suggested_action], ["Afiliado", selected.member_id], ["Delegación", selected.delegation_id]] : []} />
  </PageShell>;
};

export const GremialServicesPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/services', []);
  const items = getItems(data);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const requestService = async (item) => { setMessage(''); try { await api.post(`/gremial/services/${item.id}/request`, { notes: 'Solicitud enviada desde portal gremial' }); setMessage(`Solicitud enviada: ${item.title}`); } catch (err) { setMessage(err.response?.data?.detail || 'No se pudo enviar la solicitud'); } };
  const save = async (values) => { const payload = cleanPayload(values); if (editing?.id) await api.put(`/gremial/services/${editing.id}`, payload); else await api.post('/gremial/services', payload); await reload(); };
  const setServiceStatus = async (item, status) => { await api.post(`/gremial/services/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Servicios y beneficios" subtitle="Catálogo medible de servicios de valor para afiliados." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'active', scope: 'national', category: 'beneficio' })}>Nuevo servicio</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <CatalogExplorer items={items} searchFields={['title', 'category', 'status', 'scope', 'description']} filters={[{ field: 'category', label: 'Categoría', options: uniqueOptions(items, 'category') }, { field: 'status', label: 'Estatus', options: uniqueOptions(items, 'status') }, { field: 'scope', label: 'Alcance', options: uniqueOptions(items, 'scope') }]} placeholder="Buscar servicio por nombre, categoría, estatus o descripción..." emptyTitle="Sin servicios" summary={(ex) => [["Total", items.length], ["Activos", countBy(items, 'status', 'active')], ["Vista", ex.filtered.length], ["Página", `${ex.page}/${ex.pages}`]]} renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Badge>{item.category}</Badge><Badge variant="secondary">{item.status}</Badge></div><p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>{isMemberPortal ? <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button><Button variant="outline" onClick={() => requestService(item)}>Solicitar</Button></div> : <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button><Button variant="outline" onClick={() => setEditing(item)}>Editar</Button><Button variant="outline" onClick={() => setServiceStatus(item, item.status === 'active' ? 'paused' : 'active')}>{item.status === 'active' ? 'Pausar' : 'Activar'}</Button><Button variant="outline" onClick={() => setServiceStatus(item, 'archived')}>Archivar</Button></div>}</CardContent></Card>} />
    {!isMemberPortal && <RequestReviewPanel title="Solicitudes de servicios" endpoint="/gremial/service-requests" statusEndpoint="/gremial/service-requests" />}
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} item={selected} title={selected?.title || 'Servicio'} subtitle={selected?.description} fields={selected ? [["Categoría", selected.category], ["Estatus", selected.status], ["Alcance", selected.scope], ["Tiers incluidos", (selected.included_tiers || []).join(', ')], ["Descripción", selected.description]] : []} actions={selected && (isMemberPortal ? <Button onClick={() => requestService(selected)}>Solicitar servicio</Button> : <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar</Button><Button variant="outline" onClick={() => setServiceStatus(selected, selected.status === 'active' ? 'paused' : 'active')}>Cambiar estatus</Button></>)} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar servicio' : 'Nuevo servicio'} fields={serviceFields} initialValues={editing || { status: 'active', scope: 'national', category: 'beneficio' }} onSubmit={save} />
  </PageShell>;
};

export const GremialOpportunitiesPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/opportunities', []);
  const items = getItems(data);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const editInitial = editing ? { ...editing, closes_at: dateOnly(editing.closes_at) } : null;
  const apply = async (item) => { setMessage(''); try { await api.post(`/gremial/opportunities/${item.id}/apply`, { notes: 'Postulación enviada desde Rovi Gremial OS' }); setMessage(`Postulación enviada: ${item.title}`); } catch (err) { setMessage(err.response?.data?.detail || 'No se pudo postular'); } };
  const save = async (values) => { const payload = withDatePayload(values, ['closes_at']); if (editing?.id) await api.put(`/gremial/opportunities/${editing.id}`, payload); else await api.post('/gremial/opportunities', payload); await reload(); };
  const setOpportunityStatus = async (item, status) => { await api.post(`/gremial/opportunities/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Oportunidades privadas" subtitle="Marketplace interno de oportunidades comerciales para afiliados." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'draft', opportunity_type: 'private' })}>Nueva oportunidad</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <CatalogExplorer items={items} searchFields={['title', 'opportunity_type', 'state', 'sector', 'status', 'description']} filters={[{ field: 'status', label: 'Estatus', options: uniqueOptions(items, 'status') }, { field: 'state', label: 'Estado', options: uniqueOptions(items, 'state') }, { field: 'sector', label: 'Sector', options: uniqueOptions(items, 'sector') }]} placeholder="Buscar oportunidad por título, estado, sector o estatus..." emptyTitle="Sin oportunidades" summary={(ex) => [["Total", items.length], ["Publicadas", countBy(items, 'status', 'published')], ["Vista", ex.filtered.length], ["Página", `${ex.page}/${ex.pages}`]]} renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{item.state} · {item.sector}</p><p>Presupuesto: {money(item.budget)}</p><Badge>{item.status}</Badge><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button>{isMemberPortal ? <Button variant="outline" onClick={() => apply(item)}>Postular</Button> : <Button variant="outline" onClick={() => setEditing(item)}>Editar</Button>}</div></CardContent></Card>} />
    {!isMemberPortal && <RequestReviewPanel title="Postulaciones a oportunidades" endpoint="/gremial/opportunity-applications" statusEndpoint="/gremial/opportunity-applications" />}
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} item={selected} title={selected?.title || 'Oportunidad'} subtitle={selected?.description} fields={selected ? [["Tipo", selected.opportunity_type], ["Estado", selected.state], ["Sector", selected.sector], ["Presupuesto", money(selected.budget)], ["Cierre", dateOnly(selected.closes_at)], ["Estatus", selected.status]] : []} actions={selected && (isMemberPortal ? <Button onClick={() => apply(selected)}>Postular</Button> : <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar</Button><Button variant="outline" onClick={() => setOpportunityStatus(selected, 'published')}>Publicar</Button><Button variant="outline" onClick={() => setOpportunityStatus(selected, 'closed')}>Cerrar</Button></>)} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar oportunidad' : 'Nueva oportunidad'} fields={opportunityFields} initialValues={editInitial || { status: 'draft', opportunity_type: 'private' }} onSubmit={save} />
  </PageShell>;
};

export const GremialTendersPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/tenders', []);
  const items = getItems(data);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const editInitial = editing ? { ...editing, closes_at: dateOnly(editing.closes_at), published_at: dateOnly(editing.published_at) } : null;
  const apply = async (item) => { setMessage(''); try { await api.post(`/gremial/tenders/${item.id}/apply`, { notes: 'Postulación a licitación enviada desde Rovi Gremial OS' }); setMessage(`Postulación enviada: ${item.title}`); } catch (err) { setMessage(err.response?.data?.detail || 'No se pudo postular'); } };
  const save = async (values) => { const payload = withDatePayload(values, ['closes_at', 'published_at']); if (editing?.id) await api.put(`/gremial/tenders/${editing.id}`, payload); else await api.post('/gremial/tenders', payload); await reload(); };
  const setTenderStatus = async (item, status) => { await api.post(`/gremial/tenders/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Licitaciones" subtitle="Seguimiento de licitaciones públicas por estado, dependencia y especialidad." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'draft', opportunity_type: 'public' })}>Nueva licitación</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <CatalogExplorer items={items} searchFields={['title', 'dependency', 'state', 'sector', 'status', 'tender_number', 'description']} filters={[{ field: 'status', label: 'Estatus', options: uniqueOptions(items, 'status') }, { field: 'state', label: 'Estado', options: uniqueOptions(items, 'state') }, { field: 'dependency', label: 'Dependencia', options: uniqueOptions(items, 'dependency') }]} placeholder="Buscar licitación por título, dependencia, estado, sector o número..." emptyTitle="Sin licitaciones" summary={(ex) => [["Total", items.length], ["Publicadas", countBy(items, 'status', 'published')], ["Vista", ex.filtered.length], ["Página", `${ex.page}/${ex.pages}`]]} renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{item.dependency} · {item.state}</p><p>Monto estimado: {money(item.budget)}</p><Badge>{item.status}</Badge><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button>{isMemberPortal ? <Button variant="outline" onClick={() => apply(item)}>Postular</Button> : <Button variant="outline" onClick={() => setEditing(item)}>Editar</Button>}</div></CardContent></Card>} />
    {!isMemberPortal && <RequestReviewPanel title="Postulaciones a licitaciones" endpoint="/gremial/tender-applications" statusEndpoint="/gremial/tender-applications" />}
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} item={selected} title={selected?.title || 'Licitación'} subtitle={selected?.description} fields={selected ? [["Dependencia", selected.dependency], ["Número", selected.tender_number], ["Estado", selected.state], ["Sector", selected.sector], ["Monto", money(selected.budget)], ["Publicada", dateOnly(selected.published_at)], ["Cierre", dateOnly(selected.closes_at)], ["Estatus", selected.status]] : []} actions={selected && (isMemberPortal ? <Button onClick={() => apply(selected)}>Postular</Button> : <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar</Button><Button variant="outline" onClick={() => setTenderStatus(selected, 'published')}>Publicar</Button><Button variant="outline" onClick={() => setTenderStatus(selected, 'closed')}>Cerrar</Button></>)} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar licitación' : 'Nueva licitación'} fields={tenderFields} initialValues={editInitial || { status: 'draft', opportunity_type: 'public' }} onSubmit={save} />
  </PageShell>;
};

export const GremialAnalyticsPage = () => <GremialDashboardPage />;
export const GremialAIControlTowerPage = () => <SimpleListPage title="AI Control Tower" subtitle="Recomendaciones accionables de riesgo, renovación, expediente y oportunidades." endpoint="/gremial/ai/recommendations" emptyTitle="Sin recomendaciones" renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>{item.priority}</Badge><p className="mt-3 text-sm text-muted-foreground">{item.explanation}</p><p className="mt-2 text-sm font-medium">{item.suggested_action}</p></CardContent></Card>} />;

export const GremialCoursesPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/courses', []);
  const items = getItems(data);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const editInitial = editing ? { ...editing, starts_at: dateOnly(editing.starts_at), ends_at: dateOnly(editing.ends_at) } : null;
  const register = async (item) => { setMessage(''); try { await api.post(`/gremial/courses/${item.id}/register`, { notes: 'Registro enviado desde portal gremial' }); setMessage(`Registro confirmado: ${item.title}`); } catch (err) { setMessage(err.response?.data?.detail || 'No se pudo registrar al curso'); } };
  const save = async (values) => { const payload = withDatePayload(values, ['starts_at', 'ends_at']); if (editing?.id) await api.put(`/gremial/courses/${editing.id}`, payload); else await api.post('/gremial/courses', payload); await reload(); };
  const setCourseStatus = async (item, status) => { await api.post(`/gremial/courses/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Capacitación y certificaciones" subtitle="Cursos ICIC/demo, certificaciones, normatividad y formación con trazabilidad." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'draft', category: 'capacitacion', modality: 'online', price: 0 })}>Nuevo curso</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <CatalogExplorer items={items} searchFields={['title', 'category', 'modality', 'instructor', 'state', 'status', 'description']} filters={[{ field: 'status', label: 'Estatus', options: uniqueOptions(items, 'status') }, { field: 'category', label: 'Categoría', options: uniqueOptions(items, 'category') }, { field: 'modality', label: 'Modalidad', options: uniqueOptions(items, 'modality') }]} placeholder="Buscar curso por título, categoría, modalidad, instructor o estado..." emptyTitle="Sin cursos" summary={(ex) => [["Total", items.length], ["Publicados", countBy(items, 'status', 'published')], ["Vista", ex.filtered.length], ["Página", `${ex.page}/${ex.pages}`]]} renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Badge>{item.category}</Badge><Badge variant="secondary">{item.modality}</Badge><Badge>{item.status}</Badge></div><p className="text-sm text-muted-foreground">{item.instructor || 'Instructor por asignar'} · {item.state || 'Nacional'}</p><p>Inicia: {dateOnly(item.starts_at) || 'Por definir'} · Cupo: {item.capacity || 'Abierto'}</p><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button>{isMemberPortal ? <Button variant="outline" onClick={() => register(item)}>Registrarme</Button> : <Button variant="outline" onClick={() => setEditing(item)}>Editar</Button>}</div></CardContent></Card>} />
    {!isMemberPortal && <RequestReviewPanel title="Registros a cursos" endpoint="/gremial/course-registrations" statusEndpoint="/gremial/course-registrations" />}
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} item={selected} title={selected?.title || 'Curso'} subtitle={selected?.description} fields={selected ? [["Categoría", selected.category], ["Modalidad", selected.modality], ["Instructor", selected.instructor], ["Estado", selected.state], ["Inicio", dateOnly(selected.starts_at)], ["Cupo", selected.capacity], ["Precio", money(selected.price)], ["Estatus", selected.status]] : []} actions={selected && (isMemberPortal ? <Button onClick={() => register(selected)}>Registrarme</Button> : <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar</Button><Button variant="outline" onClick={() => setCourseStatus(selected, 'published')}>Publicar</Button><Button variant="outline" onClick={() => setCourseStatus(selected, 'closed')}>Cerrar</Button></>)} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar curso' : 'Nuevo curso'} fields={courseFields} initialValues={editInitial || { status: 'draft', category: 'capacitacion', modality: 'online', price: 0 }} onSubmit={save} />
  </PageShell>;
};

export const GremialEventsPage = () => {
  const { api, user } = useAuth();
  const isMemberPortal = isMemberPortalUser(user);
  const { data, loading, error, reload } = useGremialApi('/gremial/events', []);
  const items = getItems(data);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const editInitial = editing ? { ...editing, starts_at: dateOnly(editing.starts_at), ends_at: dateOnly(editing.ends_at) } : null;
  const register = async (item) => { setMessage(''); try { await api.post(`/gremial/events/${item.id}/register`, { notes: 'Registro enviado desde portal gremial' }); setMessage(`Registro confirmado: ${item.title}`); } catch (err) { setMessage(err.response?.data?.detail || 'No se pudo registrar al evento'); } };
  const save = async (values) => { const payload = withDatePayload(values, ['starts_at', 'ends_at']); if (editing?.id) await api.put(`/gremial/events/${editing.id}`, payload); else await api.post('/gremial/events', payload); await reload(); };
  const setEventStatus = async (item, status) => { await api.post(`/gremial/events/${item.id}/status`, { status }); await reload(); };
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PageShell title="Eventos gremiales" subtitle="Asambleas, networking, foros, expos y comités con registro y seguimiento." action={isMemberPortal ? <Button onClick={reload}>Actualizar</Button> : <Button onClick={() => setEditing({ status: 'draft', event_type: 'networking', price: 0 })}>Nuevo evento</Button>}>
    {message && <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">{message}</div>}
    <CatalogExplorer items={items} searchFields={['title', 'event_type', 'venue', 'state', 'status', 'description']} filters={[{ field: 'status', label: 'Estatus', options: uniqueOptions(items, 'status') }, { field: 'event_type', label: 'Tipo', options: uniqueOptions(items, 'event_type') }, { field: 'state', label: 'Estado', options: uniqueOptions(items, 'state') }]} placeholder="Buscar evento por título, tipo, sede, estado o estatus..." emptyTitle="Sin eventos" summary={(ex) => [["Total", items.length], ["Publicados", countBy(items, 'status', 'published')], ["Vista", ex.filtered.length], ["Página", `${ex.page}/${ex.pages}`]]} renderItem={(item) => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Badge>{item.event_type}</Badge><Badge variant="secondary">{item.status}</Badge></div><p className="text-sm text-muted-foreground">{item.venue || 'Sede por confirmar'} · {item.state || 'Nacional'}</p><p>Fecha: {dateOnly(item.starts_at) || 'Por definir'} · Cupo: {item.capacity || 'Abierto'}</p><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setSelected(item)}>Detalle</Button>{isMemberPortal ? <Button variant="outline" onClick={() => register(item)}>Registrarme</Button> : <Button variant="outline" onClick={() => setEditing(item)}>Editar</Button>}</div></CardContent></Card>} />
    {!isMemberPortal && <RequestReviewPanel title="Registros a eventos" endpoint="/gremial/event-registrations" statusEndpoint="/gremial/event-registrations" />}
    <DetailCardDialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)} item={selected} title={selected?.title || 'Evento'} subtitle={selected?.description} fields={selected ? [["Tipo", selected.event_type], ["Sede", selected.venue], ["Estado", selected.state], ["Inicio", dateOnly(selected.starts_at)], ["Cupo", selected.capacity], ["Precio", money(selected.price)], ["Estatus", selected.status]] : []} actions={selected && (isMemberPortal ? <Button onClick={() => register(selected)}>Registrarme</Button> : <><Button onClick={() => { setEditing(selected); setSelected(null); }}>Editar</Button><Button variant="outline" onClick={() => setEventStatus(selected, 'published')}>Publicar</Button><Button variant="outline" onClick={() => setEventStatus(selected, 'closed')}>Cerrar</Button></>)} />
    <FormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title={editing?.id ? 'Editar evento' : 'Nuevo evento'} fields={eventFields} initialValues={editInitial || { status: 'draft', event_type: 'networking', price: 0 }} onSubmit={save} />
  </PageShell>;
};

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







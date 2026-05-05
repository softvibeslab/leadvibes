import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, Globe, Mail, MapPin, Pencil, Phone, Plus, ShieldCheck, Sparkles, Trash2, Users, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Skeleton,
} from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  CopimEmptyState,
  CopimMemberIdentity,
  CopimPageHeader,
  formatCopimCurrency,
  formatCopimDate,
} from '../components/copim/CopimModulePrimitives';
import { CopimAIAnalysisPanel } from '../components/copim/CopimAIAnalysisPanel';
import { buildCopimPath, mergeCopimSearchParams } from '../lib/copimRouting';

const EMPTY_FORM = {
  name: '',
  state: '',
  city: '',
  president_name: '',
  president_email: '',
  admin_name: '',
  admin_email: '',
  phone: '',
  status: 'active',
  member_goal: 0,
  coverage_zone: '',
  website: '',
  notes: '',
};

const statusTone = {
  active: 'bg-emerald-100 text-emerald-900',
  onboarding: 'bg-amber-100 text-amber-900',
  inactive: 'bg-slate-200 text-slate-900',
};

const healthTone = {
  excellent: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
  stable: 'bg-cyan-500/15 text-cyan-200 ring-cyan-500/30',
  watch: 'bg-amber-500/15 text-amber-100 ring-amber-500/30',
  risk: 'bg-rose-500/15 text-rose-100 ring-rose-500/30',
};

const associationHeroImages = [
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80',
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

export const CopimAssociationsPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [editingAssociation, setEditingAssociation] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const focusAssociationId = searchParams.get('focus');
  const openedFocusRef = useRef(null);

  const syncSearchParams = useCallback((updates, replace = true) => {
    const next = mergeCopimSearchParams(searchParams, updates);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace });
    }
  }, [searchParams, setSearchParams]);

  const getAssociationHealth = (association) => {
    let score = 45;

    if (association.status === 'active') score += 20;
    if ((association.pending_members || 0) === 0) score += 10;
    if ((association.renewals_due || 0) <= 2) score += 10;
    if ((association.revenue_due || 0) <= 2500) score += 10;
    if ((association.directory_visible_members || 0) >= Math.max(1, Math.round((association.active_members || 0) * 0.6))) score += 5;

    const normalizedScore = Math.max(0, Math.min(100, score));

    if (normalizedScore >= 85) {
      return { score: normalizedScore, label: 'Excelente', tone: 'excellent', helper: 'Operacion estable y expandible' };
    }
    if (normalizedScore >= 70) {
      return { score: normalizedScore, label: 'Estable', tone: 'stable', helper: 'Seguimiento ligero recomendado' };
    }
    if (normalizedScore >= 55) {
      return { score: normalizedScore, label: 'En observacion', tone: 'watch', helper: 'Conviene activar seguimiento' };
    }
    return { score: normalizedScore, label: 'En riesgo', tone: 'risk', helper: 'Requiere intervención prioritaria' };
  };

  useEffect(() => {
    let cancelled = false;

    const loadAssociations = async () => {
      try {
        const response = await api.get('/copim/associations', {
          params: {
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
          },
        });
        if (!cancelled) {
          setAssociations(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM associations:', error);
        if (!cancelled) {
          toast.error('No se pudieron cargar las asociaciones');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadAssociations();
    }, search ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [api, search, statusFilter]);

  useEffect(() => {
    syncSearchParams({
      search,
      status: statusFilter,
      focus: focusAssociationId,
    });
  }, [focusAssociationId, search, statusFilter, syncSearchParams]);

  useEffect(() => {
    if (!focusAssociationId || !associations.length || openedFocusRef.current === focusAssociationId) {
      return;
    }

    const focusedAssociation = associations.find((association) => association.id === focusAssociationId);
    if (!focusedAssociation) {
      return;
    }

    openedFocusRef.current = focusAssociationId;
    void openDetailSheet(focusedAssociation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associations, focusAssociationId]);

  const refreshAssociations = async () => {
    const response = await api.get('/copim/associations', {
      params: {
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      },
    });
    setAssociations(response.data || []);
  };

  const stats = useMemo(() => {
    const total = associations.length;
    const revenueDue = associations.reduce((sum, item) => sum + Number(item.revenue_due || 0), 0);
    return {
      total,
      active: associations.filter((item) => item.status === 'active').length,
      onboarding: associations.filter((item) => item.status === 'onboarding').length,
      members: associations.reduce((sum, item) => sum + (item.active_members || 0), 0),
      due: revenueDue,
    };
  }, [associations]);

  const openOperationalRoute = (pathname, params = {}) => {
    navigate(buildCopimPath(pathname, params));
  };

  const openCreateDialog = () => {
    setEditingAssociation(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (association) => {
    setEditingAssociation(association);
    setForm({
      name: association.name || '',
      state: association.state || '',
      city: association.city || '',
      president_name: association.president_name || '',
      president_email: association.president_email || '',
      admin_name: association.admin_name || '',
      admin_email: association.admin_email || '',
      phone: association.phone || '',
      status: association.status || 'active',
      member_goal: association.member_goal || 0,
      coverage_zone: association.coverage_zone || '',
      website: association.website || '',
      notes: association.notes || '',
    });
    setDialogOpen(true);
  };

  const openDetailSheet = useCallback(async (association) => {
    syncSearchParams({ focus: association.id });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/copim/associations/${association.id}/summary`);
      setSelectedSummary(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el detalle de la asociación');
    } finally {
      setDetailLoading(false);
    }
  }, [api, syncSearchParams]);

  const saveAssociation = async () => {
    if (!form.name.trim() || !form.state.trim()) {
      toast.error('Nombre y estado son obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (editingAssociation) {
        await api.put(`/copim/associations/${editingAssociation.id}`, form);
        toast.success('Asociación actualizada');
      } else {
        await api.post('/copim/associations', form);
        toast.success('Asociación creada');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingAssociation(null);
      await refreshAssociations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la asociación');
    } finally {
      setSaving(false);
    }
  };

  const deleteAssociation = async (association) => {
    if (!window.confirm(`¿Eliminar ${association.name}? Esto también borra sus socios, membresías y eventos.`)) {
      return;
    }

    try {
      await api.delete(`/copim/associations/${association.id}`);
      toast.success('Asociación eliminada');
      setSelectedSummary((current) => (current?.association?.id === association.id ? null : current));
      setDetailOpen((current) => (selectedSummary?.association?.id === association.id ? false : current));
      await refreshAssociations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar la asociación');
    }
  };

  const closeDetailDialog = (open) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedSummary(null);
      syncSearchParams({ focus: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <div className="grid gap-4 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-72 w-full rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        title="Módulo de asociaciones"
        description="Gestión nacional de capítulos con control operativo, seguimiento de crecimiento, cobranza visible y detalle por asociación."
        actions={(
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, estado o responsable"
              className="w-full min-w-[260px] xl:w-[320px]"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva asociación
            </Button>
          </>
        )}
        stats={[
          { label: 'Total', value: stats.total, helper: 'Capítulos registrados' },
          { label: 'Activas', value: stats.active, helper: 'Operando en la red' },
          { label: 'Onboarding', value: stats.onboarding, helper: 'Pendientes de habilitar' },
          { label: 'Cobranza visible', value: formatCopimCurrency(stats.due), helper: `${stats.members} socios activos monitoreados` },
        ]}
      />

      {!associations.length ? (
        <CopimEmptyState
          icon={Building2}
          title="Todavía no hay asociaciones"
          description="Empieza creando los primeros capítulos para habilitar el padrón, la cobranza y la agenda institucional."
          actionLabel="Crear asociación"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {associations.map((association, index) => {
            const progressValue = association.member_goal
              ? Math.min(Math.round(((association.active_members || 0) / association.member_goal) * 100), 100)
              : 0;
            const health = getAssociationHealth(association);
            const heroImage = associationHeroImages[index % associationHeroImages.length];

            return (
              <Card key={association.id} className={`overflow-hidden border-border/70 bg-card/95 transition hover:border-primary/30 ${focusAssociationId === association.id ? 'ring-2 ring-primary/40' : ''}`}>
                <div
                  className="relative h-44 border-b border-white/10 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(6, 95, 70, 0.58)), url(${heroImage})`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_42%)]" />
                  <div className="relative flex h-full flex-col justify-between p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70">
                          <Sparkles className="h-3.5 w-3.5" />
                          Capítulo institucional
                        </div>
                        <CardTitle className="text-2xl text-white">{association.name}</CardTitle>
                        <CardDescription className="text-white/75">
                          {association.state} · {association.city || 'Sin ciudad'}
                        </CardDescription>
                      </div>
                      <Badge className={`capitalize ${statusTone[association.status] || 'bg-slate-200 text-slate-900'}`}>
                        {association.status}
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/70">Salud operativa</p>
                        <div className="mt-1 flex items-center gap-3">
                          <p className="text-3xl font-semibold">{health.score}</p>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${healthTone[health.tone]}`}>
                            {health.label}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDetailSheet(association)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                      >
                        Abrir cockpit
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-4 p-5">
                  <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avance contra meta</span>
                      <span className="font-medium">{association.active_members || 0} / {association.member_goal || 0}</span>
                    </div>
                    <Progress className="mt-3" value={progressValue} />
                    <p className="mt-3 text-xs text-muted-foreground">{health.helper}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/30 px-3 py-3">
                      <p className="text-muted-foreground">Pendientes</p>
                      <p className="mt-2 text-2xl font-semibold">{association.pending_members || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 px-3 py-3">
                      <p className="text-muted-foreground">Renovaciones</p>
                      <p className="mt-2 text-2xl font-semibold">{association.renewals_due || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 px-3 py-3">
                      <p className="text-muted-foreground">Credenciales</p>
                      <p className="mt-2 text-2xl font-semibold">{association.credentials_issued || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 px-3 py-3">
                      <p className="text-muted-foreground">Cobranza</p>
                      <p className="mt-2 text-lg font-semibold">{formatCopimCurrency(association.revenue_due)}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/members', { association: association.id })}>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Padrón
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/memberships', { association: association.id, payment: 'due' })}>
                      <span className="flex items-center gap-2">
                        <WalletCards className="h-4 w-4" />
                        Cobranza
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/events', { association: association.id, future: true })}>
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Agenda
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/invoices', { association: association.id, payment: 'pending' })}>
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Facturas
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium">{association.president_name || 'Sin presidencia asignada'}</p>
                    <p className="text-muted-foreground">{association.president_email || 'Sin correo de presidencia'}</p>
                    {association.admin_name ? <p className="mt-2 font-medium">{association.admin_name}</p> : null}
                    {association.admin_email ? <p className="text-muted-foreground">{association.admin_email}</p> : null}
                    {association.phone ? <p className="mt-2 text-muted-foreground">{association.phone}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {association.coverage_zone ? <span className="rounded-full bg-muted px-3 py-1">{association.coverage_zone}</span> : null}
                    <span className="rounded-full bg-muted px-3 py-1">{association.directory_visible_members || 0} visibles en directorio</span>
                    <span className="rounded-full bg-muted px-3 py-1">{association.upcoming_events || 0} eventos próximos</span>
                    <span className="rounded-full bg-muted px-3 py-1">{association.credentials_issued || 0} credenciales activas</span>
                  </div>

                  {association.notes ? (
                    <p className="text-sm leading-6 text-muted-foreground">{association.notes}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDetailSheet(association)}>
                      Ver detalle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(association)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteAssociation(association)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingAssociation ? 'Editar asociación' : 'Nueva asociación'}</DialogTitle>
            <DialogDescription>
              Define la identidad del capítulo, los responsables operativos y la meta de crecimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estatus</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Presidencia</Label>
              <Input value={form.president_name} onChange={(event) => setForm((prev) => ({ ...prev, president_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email de presidencia</Label>
              <Input type="email" value={form.president_email} onChange={(event) => setForm((prev) => ({ ...prev, president_email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contacto administrativo</Label>
              <Input value={form.admin_name} onChange={(event) => setForm((prev) => ({ ...prev, admin_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email administrativo</Label>
              <Input type="email" value={form.admin_email} onChange={(event) => setForm((prev) => ({ ...prev, admin_email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Meta de socios</Label>
              <Input
                type="number"
                min={0}
                value={form.member_goal}
                onChange={(event) => setForm((prev) => ({ ...prev, member_goal: parseInt(event.target.value, 10) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Zona de cobertura</Label>
              <Input value={form.coverage_zone} onChange={(event) => setForm((prev) => ({ ...prev, coverage_zone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sitio web</Label>
              <Input value={form.website} onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveAssociation} disabled={saving}>
              {saving ? 'Guardando...' : editingAssociation ? 'Actualizar asociación' : 'Crear asociación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={closeDetailDialog}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-5xl">
          {detailLoading || !selectedSummary ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSummary.association?.name}</DialogTitle>
                <DialogDescription>
                  Detalle operativo del capítulo, con padrón, cobranza y agenda conectados.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Socios activos</p>
                      <p className="mt-3 text-3xl font-semibold">{selectedSummary.stats?.active_members || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pendientes</p>
                      <p className="mt-3 text-3xl font-semibold">{selectedSummary.stats?.pending_members || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Renovaciones</p>
                      <p className="mt-3 text-3xl font-semibold">{selectedSummary.stats?.renewals_due || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cobranza visible</p>
                      <p className="mt-3 text-2xl font-semibold">{formatCopimCurrency(selectedSummary.stats?.revenue_due || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Panorama</TabsTrigger>
                    <TabsTrigger value="members">Socios</TabsTrigger>
                    <TabsTrigger value="memberships">Membresías</TabsTrigger>
                    <TabsTrigger value="events">Eventos</TabsTrigger>
                    <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card className="border-border/70 bg-card/95">
                      <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{selectedSummary.association?.state} · {selectedSummary.association?.city || 'Sin ciudad'}</p>
                              <p className="text-muted-foreground">{selectedSummary.association?.coverage_zone || 'Sin zona definida'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 text-sm">
                            <Users className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{selectedSummary.association?.president_name || 'Sin presidencia'}</p>
                              <p className="text-muted-foreground">{selectedSummary.association?.admin_name || 'Sin operación asignada'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 text-sm">
                            <Mail className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                              <p>{selectedSummary.association?.president_email || 'Sin correo de presidencia'}</p>
                              <p className="text-muted-foreground">{selectedSummary.association?.admin_email || 'Sin correo administrativo'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 text-sm">
                            <Phone className="mt-0.5 h-4 w-4 text-primary" />
                            <p>{selectedSummary.association?.phone || 'Sin teléfono registrado'}</p>
                          </div>
                          <div className="flex items-start gap-3 text-sm">
                            <Globe className="mt-0.5 h-4 w-4 text-primary" />
                            <p>{selectedSummary.association?.website || 'Sin sitio web'}</p>
                          </div>
                        </div>

                        <div className="space-y-4 rounded-3xl border border-border/70 bg-muted/20 p-5">
                          <div>
                            <p className="text-sm text-muted-foreground">Meta institucional</p>
                            <p className="mt-1 text-2xl font-semibold">
                              {selectedSummary.association?.active_members || 0} / {selectedSummary.association?.member_goal || 0}
                            </p>
                          </div>
                          <Progress
                            value={selectedSummary.association?.member_goal
                              ? Math.min(Math.round(((selectedSummary.association?.active_members || 0) / selectedSummary.association.member_goal) * 100), 100)
                              : 0}
                          />
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl bg-background px-4 py-3">
                              <p className="text-muted-foreground">Directorio visible</p>
                              <p className="mt-1 text-xl font-semibold">{selectedSummary.stats?.directory_visible_members || 0}</p>
                            </div>
                            <div className="rounded-2xl bg-background px-4 py-3">
                              <p className="text-muted-foreground">Credenciales emitidas</p>
                              <p className="mt-1 text-xl font-semibold">{selectedSummary.stats?.credentials_issued || 0}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Gestión rápida</CardTitle>
                        <CardDescription>Abre la operación exacta de este capítulo sin volver al tablero general.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/members', { association: selectedSummary.association?.id })}>
                          Socios
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/memberships', { association: selectedSummary.association?.id, payment: 'due' })}>
                          Renovaciones
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/invoices', { association: selectedSummary.association?.id, payment: 'pending' })}>
                          Facturación
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="justify-between rounded-2xl" onClick={() => openOperationalRoute('/copim/events', { association: selectedSummary.association?.id, future: true })}>
                          Agenda
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>

                    {selectedSummary.association?.notes ? (
                      <Card className="border-border/70 bg-card/95">
                        <CardHeader>
                          <CardTitle>Notas operativas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.association.notes}</p>
                        </CardContent>
                      </Card>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="members">
                    <Card className="border-border/70 bg-card/95">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Socio</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead>Directorio</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {safeArray(selectedSummary.members).map((member) => (
                            <TableRow key={member.id} className="cursor-pointer" onClick={() => openOperationalRoute('/copim/members', { focus: member.id, association: selectedSummary.association?.id })}>
                              <TableCell>
                                <CopimMemberIdentity name={member.full_name} subtitle={member.email} />
                              </TableCell>
                              <TableCell className="capitalize">{member.member_status}</TableCell>
                              <TableCell>{member.specialty || 'Sin especialidad'}</TableCell>
                              <TableCell>{member.directory_visible ? 'Visible' : 'Privado'}</TableCell>
                              <TableCell>{formatCopimCurrency(member.amount_due)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="memberships">
                    <Card className="border-border/70 bg-card/95">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Socio</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Renovación</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {safeArray(selectedSummary.memberships).map((membership) => (
                            <TableRow key={membership.id} className="cursor-pointer" onClick={() => openOperationalRoute('/copim/memberships', { focus: membership.id, association: selectedSummary.association?.id })}>
                              <TableCell>
                                <CopimMemberIdentity name={membership.member_name} />
                              </TableCell>
                              <TableCell>{membership.plan_name}</TableCell>
                              <TableCell>{formatCopimDate(membership.renewal_date)}</TableCell>
                              <TableCell className="capitalize">{membership.payment_status}</TableCell>
                              <TableCell>{formatCopimCurrency(membership.balance_due)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="events">
                    <Card className="border-border/70 bg-card/95">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Formato</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Registros</TableHead>
                            <TableHead>Estatus</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {safeArray(selectedSummary.events).map((event) => (
                            <TableRow key={event.id} className="cursor-pointer" onClick={() => openOperationalRoute('/copim/events', { focus: event.id, association: selectedSummary.association?.id, future: true })}>
                              <TableCell className="font-medium">{event.title}</TableCell>
                              <TableCell className="capitalize">{event.event_format || 'presencial'}</TableCell>
                              <TableCell>{formatCopimDate(event.start_at)}</TableCell>
                              <TableCell>{event.registered_count || 0}</TableCell>
                              <TableCell className="capitalize">{event.status || 'published'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analysis">
                    <CopimAIAnalysisPanel
                      api={api}
                      entity={selectedSummary.association}
                      analysisPath={`/copim/associations/${selectedSummary.association?.id}/analyze`}
                      onAnalysisSaved={(payload) => {
                        setSelectedSummary((current) => (
                          current
                            ? {
                                ...current,
                                association: {
                                  ...current.association,
                                  ai_analysis: payload.ai_analysis,
                                  ai_last_analyzed_at: payload.ai_last_analyzed_at,
                                },
                              }
                            : current
                        ));
                      }}
                      emptyTitle="Todavía no hay análisis de la asociación"
                      emptyDescription="Ejecuta el análisis para obtener lectura institucional, alertas operativas y próximos pasos sugeridos."
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

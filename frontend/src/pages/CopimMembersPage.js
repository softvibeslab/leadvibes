import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, LayoutGrid, List, Mail, Pencil, Phone, Plus, ShieldCheck, Sparkles, Trash2, Upload, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Switch } from '../components/ui/switch';
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
  full_name: '',
  email: '',
  phone: '',
  association_id: '',
  title: '',
  city: '',
  specialty: '',
  company_name: '',
  join_date: '',
  member_status: 'pending',
  membership_tier: 'base',
  credential_status: 'pending',
  credential_id: '',
  directory_visible: true,
  amount_due: 0,
  notes: '',
};

const memberTone = {
  pending: 'bg-amber-100 text-amber-900',
  active: 'bg-emerald-100 text-emerald-900',
  suspended: 'bg-slate-200 text-slate-900',
};

const credentialTone = {
  pending: 'bg-amber-100 text-amber-900',
  issued: 'bg-cyan-100 text-cyan-900',
  blocked: 'bg-rose-100 text-rose-900',
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatMemberStatusLabel = (status) => ({
  active: 'Activo',
  pending: 'Pendiente',
  suspended: 'Suspendido',
}[status] || status || 'Sin estatus');

const formatCredentialStatusLabel = (status) => ({
  issued: 'Emitida',
  pending: 'Pendiente',
  blocked: 'Bloqueada',
}[status] || status || 'Sin credencial');

const formatMembershipTierLabel = (tier) => ({
  annual: 'Anual',
  monthly: 'Mensual',
  base: 'Base',
  pro: 'Pro',
  premium: 'Premium',
}[tier] || tier || 'Sin plan');

export const CopimMembersPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [associationFilter, setAssociationFilter] = useState(() => searchParams.get('association') || 'all');
  const [cityFilter, setCityFilter] = useState(() => searchParams.get('city') || 'all');
  const [specialtyFilter, setSpecialtyFilter] = useState(() => searchParams.get('specialty') || 'all');
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') === 'pipeline' ? 'pipeline' : 'table');
  const focusMemberId = searchParams.get('focus');
  const openedFocusRef = useRef(null);

  const syncSearchParams = (updates, replace = true) => {
    const next = mergeCopimSearchParams(searchParams, updates);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadAssociations = async () => {
      try {
        const response = await api.get('/copim/associations');
        if (!cancelled) {
          setAssociations(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM associations:', error);
      }
    };

    void loadAssociations();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    const loadMembers = async () => {
      try {
        const response = await api.get('/copim/members', {
          params: {
            search: search || undefined,
            member_status: statusFilter === 'all' ? undefined : statusFilter,
            association_id: associationFilter === 'all' ? undefined : associationFilter,
            city: cityFilter === 'all' ? undefined : cityFilter,
            specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
          },
        });
        if (!cancelled) {
          setMembers(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM members:', error);
        if (!cancelled) {
          toast.error('No se pudieron cargar los socios');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadMembers();
    }, search ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [api, search, statusFilter, associationFilter, cityFilter, specialtyFilter]);

  useEffect(() => {
    syncSearchParams({
      search,
      status: statusFilter,
      association: associationFilter,
      city: cityFilter,
      specialty: specialtyFilter,
      view: viewMode === 'pipeline' ? 'pipeline' : null,
      focus: focusMemberId,
    });
  }, [associationFilter, cityFilter, focusMemberId, search, specialtyFilter, statusFilter, viewMode]);

  const refreshMembers = async () => {
    const response = await api.get('/copim/members', {
      params: {
        search: search || undefined,
        member_status: statusFilter === 'all' ? undefined : statusFilter,
        association_id: associationFilter === 'all' ? undefined : associationFilter,
        city: cityFilter === 'all' ? undefined : cityFilter,
        specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
      },
    });
    setMembers(response.data || []);
  };

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((item) => item.member_status === 'active').length,
    pending: members.filter((item) => item.member_status === 'pending').length,
    credentials: members.filter((item) => item.credential_status === 'issued').length,
    portalEnabled: members.filter((item) => item.portal_access_enabled).length,
  }), [members]);

  const availableCities = useMemo(() => Array.from(new Set(members.map((member) => member.city).filter(Boolean))).sort(), [members]);
  const availableSpecialties = useMemo(() => Array.from(new Set(members.map((member) => member.specialty).filter(Boolean))).sort(), [members]);

  const kanbanColumns = useMemo(() => ([
    {
      id: 'pending',
      title: 'Por aprobar',
      description: 'Solicitudes nuevas y perfiles incompletos',
      items: members.filter((member) => member.member_status === 'pending'),
      tone: 'border-amber-500/30 bg-amber-500/10',
    },
    {
      id: 'active',
      title: 'Activos',
      description: 'Perfiles habilitados para directorio y beneficios',
      items: members.filter((member) => member.member_status === 'active'),
      tone: 'border-emerald-500/30 bg-emerald-500/10',
    },
    {
      id: 'suspended',
      title: 'Suspendidos',
      description: 'Casos a recuperar o regularizar',
      items: members.filter((member) => member.member_status === 'suspended'),
      tone: 'border-slate-500/30 bg-slate-500/10',
    },
  ]), [members]);

  useEffect(() => {
    if (!focusMemberId || !members.length || openedFocusRef.current === focusMemberId) {
      return;
    }

    const focusedMember = members.find((member) => member.id === focusMemberId);
    if (!focusedMember) {
      return;
    }

    openedFocusRef.current = focusMemberId;
    void openDetailSheet(focusedMember);
  }, [focusMemberId, members]);

  const openOperationalRoute = (pathname, params = {}) => {
    navigate(buildCopimPath(pathname, params));
  };

  const openCreateDialog = () => {
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (member) => {
    setEditingMember(member);
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      association_id: member.association_id || '',
      title: member.title || '',
      city: member.city || '',
      specialty: member.specialty || '',
      company_name: member.company_name || '',
      join_date: member.join_date ? member.join_date.slice(0, 10) : '',
      member_status: member.member_status || 'pending',
      membership_tier: member.membership_tier || 'base',
      credential_status: member.credential_status || 'pending',
      credential_id: member.credential_id || '',
      directory_visible: Boolean(member.directory_visible),
      amount_due: member.amount_due || 0,
      notes: member.notes || '',
    });
    setDialogOpen(true);
  };

  const openDetailSheet = async (member) => {
    syncSearchParams({ focus: member.id });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/copim/members/${member.id}/summary`);
      setSelectedSummary(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar la ficha del socio');
    } finally {
      setDetailLoading(false);
    }
  };

  const saveMember = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }

    const payload = {
      ...form,
      association_id: form.association_id || null,
      join_date: form.join_date ? new Date(`${form.join_date}T12:00:00`).toISOString() : null,
      credential_id: form.credential_id || null,
    };

    setSaving(true);
    try {
      if (editingMember) {
        await api.put(`/copim/members/${editingMember.id}`, payload);
        toast.success('Socio actualizado');
      } else {
        await api.post('/copim/members', payload);
        toast.success('Socio creado');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingMember(null);
      await refreshMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el socio');
    } finally {
      setSaving(false);
    }
  };

  const approveMember = async (member) => {
    try {
      await api.post(`/copim/members/${member.id}/approve`);
      toast.success('Socio aprobado');
      await refreshMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo aprobar el socio');
    }
  };

  const issueCredential = async (member) => {
    try {
      await api.post(`/copim/members/${member.id}/issue-credential`);
      toast.success('Credencial emitida');
      await refreshMembers();
      if (selectedSummary?.member?.id === member.id) {
        const response = await api.get(`/copim/members/${member.id}/summary`);
        setSelectedSummary(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo emitir la credencial');
    }
  };

  const requestInformation = async (member) => {
    const note = window.prompt('¿Qué información falta para validar este perfil?', member.requested_information || 'Completar documentos y datos del perfil.');
    if (note === null) {
      return;
    }
    try {
      await api.post(`/copim/members/${member.id}/request-info`, {
        requested_information: note,
        validation_notes: 'Seguimiento abierto por operación.',
      });
      toast.success('Solicitud de información enviada');
      await refreshMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar la solicitud');
    }
  };

  const rejectMember = async (member) => {
    const note = window.prompt('Motivo de rechazo o pausa del proceso', member.validation_notes || 'Solicitud detenida por validación.');
    if (note === null) {
      return;
    }
    try {
      await api.post(`/copim/members/${member.id}/reject`, {
        validation_notes: note,
      });
      toast.success('Solicitud rechazada');
      await refreshMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo rechazar el perfil');
    }
  };

  const provisionPortalAccess = async (member) => {
    try {
      const response = await api.post(`/copim/members/${member.id}/provision-portal-access`);
      const credentials = response.data?.credentials;
      if (credentials?.email && credentials?.temporary_password && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${credentials.email} / ${credentials.temporary_password}`);
      }
      toast.success(`Acceso portal listo${credentials?.email ? ` para ${credentials.email}` : ''}`);
      await refreshMembers();
      if (selectedSummary?.member?.id === member.id) {
        const summary = await api.get(`/copim/members/${member.id}/summary`);
        setSelectedSummary(summary.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo habilitar el acceso portal');
    }
  };

  const toggleMemberStatus = async (member) => {
    const nextStatus = member.member_status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.put(`/copim/members/${member.id}`, {
        member_status: nextStatus,
        directory_visible: nextStatus === 'suspended' ? false : member.directory_visible,
      });
      toast.success(nextStatus === 'active' ? 'Socio reactivado' : 'Socio suspendido');
      await refreshMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar el estatus');
    }
  };

  const deleteMember = async (member) => {
    if (!window.confirm(`¿Eliminar a ${member.full_name}? También se eliminarán sus membresías.`)) {
      return;
    }
    try {
      await api.delete(`/copim/members/${member.id}`);
      toast.success('Socio eliminado');
      setSelectedSummary((current) => (current?.member?.id === member.id ? null : current));
      setDetailOpen((current) => (selectedSummary?.member?.id === member.id ? false : current));
      await refreshMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el socio');
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
        <Skeleton className="h-[480px] w-full rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        title="Módulo de socios"
        description="Padrón operativo con validación, credencialización, visibilidad en directorio y ficha capturable sin fricción."
        actions={(
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo, empresa o credencial"
              className="w-full min-w-[280px] xl:w-[320px]"
            />
            <Select value={associationFilter} onValueChange={setAssociationFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las asociaciones</SelectItem>
                {associations.map((association) => (
                  <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {availableSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-full border border-border/70 bg-card p-1">
              <Button
                type="button"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-full"
                onClick={() => setViewMode('table')}
              >
                <List className="mr-2 h-4 w-4" />
                Lista
              </Button>
              <Button
                type="button"
                variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-full"
                onClick={() => setViewMode('pipeline')}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Pipeline
              </Button>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => openOperationalRoute('/copim/members/import', {
                association: associationFilter === 'all' ? null : associationFilter,
              })}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar socios
            </Button>
            <Button className="rounded-full" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo socio
            </Button>
          </>
        )}
        stats={[
          { label: 'Total', value: stats.total, helper: 'Perfiles capturados' },
          { label: 'Activos', value: stats.active, helper: 'Socios con acceso operativo' },
          { label: 'Pendientes', value: stats.pending, helper: 'Validación por atender' },
          { label: 'Credenciales emitidas', value: stats.credentials, helper: 'Listos para autenticación y beneficios' },
          { label: 'Portal activo', value: stats.portalEnabled, helper: 'Autoservicio habilitado' },
        ]}
      />

      {!members.length ? (
        <CopimEmptyState
          icon={Users}
          title="Todavía no hay socios"
          description="Crea el primer perfil para empezar a capturar directorio, estatus y credenciales."
          actionLabel="Crear socio"
          onAction={openCreateDialog}
        />
      ) : viewMode === 'pipeline' ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {kanbanColumns.map((column) => (
            <Card key={column.id} className={`border-border/70 bg-card/95 ${column.tone}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{column.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{column.description}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full bg-background/80">
                    {column.items.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {column.items.length ? column.items.map((member) => (
                  <div
                    key={member.id}
                    className={`rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm transition hover:border-primary/40 ${focusMemberId === member.id ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5" />
                          Portal del socio
                        </div>
                        <CopimMemberIdentity
                          name={member.full_name}
                          subtitle={member.association_name || 'Sin asociación'}
                          avatarUrl={member.avatar_url}
                          size="lg"
                        />
                      </div>
                      <Badge className={`capitalize ${memberTone[member.member_status] || 'bg-slate-200 text-slate-900'}`}>
                        {member.member_status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-3 py-1 capitalize">{member.membership_tier}</span>
                      <span className="rounded-full bg-muted px-3 py-1 capitalize">{member.credential_status}</span>
                      <span className="rounded-full bg-muted px-3 py-1">{member.directory_visible ? 'Directorio visible' : 'Directorio privado'}</span>
                      <span className="rounded-full bg-muted px-3 py-1">{formatCopimCurrency(member.amount_due)}</span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Completitud</span>
                        <span>{member.profile_completion || 0}%</span>
                      </div>
                      <Progress value={member.profile_completion || 0} />
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{member.company_name || 'Sin empresa'}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetailSheet(member)}>
                        Abrir ficha
                      </Button>
                      {member.member_status === 'pending' ? (
                        <Button size="sm" variant="outline" onClick={() => approveMember(member)}>
                          Aprobar
                        </Button>
                      ) : null}
                      {member.member_status === 'pending' ? (
                        <Button size="sm" variant="ghost" onClick={() => requestInformation(member)}>
                          Solicitar info
                        </Button>
                      ) : null}
                      {member.member_status === 'pending' ? (
                        <Button size="sm" variant="ghost" onClick={() => rejectMember(member)}>
                          Rechazar
                        </Button>
                      ) : null}
                      {!member.portal_access_enabled ? (
                        <Button size="sm" variant="ghost" onClick={() => provisionPortalAccess(member)}>
                          Activar portal
                        </Button>
                      ) : null}
                      {member.credential_status !== 'issued' ? (
                        <Button size="sm" variant="ghost" onClick={() => issueCredential(member)}>
                          Credencial
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )) : (
                  <CopimEmptyState
                    title={`No hay perfiles en ${column.title.toLowerCase()}`}
                    description="Cuando el flujo empiece a mover socios aparecerán aquí para seguimiento rápido."
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden border-border/70 bg-card/95">
          <div className="overflow-x-auto">
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[420px]">Socio</TableHead>
                  <TableHead className="w-[330px]">Estado operativo</TableHead>
                  <TableHead className="w-[170px]">Completitud</TableHead>
                  <TableHead className="w-[130px]">Saldo</TableHead>
                  <TableHead className="min-w-[420px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className={focusMemberId === member.id ? 'bg-primary/5' : ''}>
                    <TableCell className="align-top">
                      <div className="min-w-[360px] space-y-2 py-2">
                        <CopimMemberIdentity
                          name={member.full_name}
                          subtitle={member.email}
                          avatarUrl={member.avatar_url}
                          size="lg"
                          textClassName="max-w-[290px]"
                          subtitleClassName="text-sm"
                        />
                        <div className="ml-[60px] flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {member.company_name ? (
                            <span className="max-w-[180px] truncate">{member.company_name}</span>
                          ) : null}
                          {member.specialty ? (
                            <span className="max-w-[180px] truncate">{member.specialty}</span>
                          ) : null}
                          {member.city ? <span>{member.city}</span> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-2 py-2">
                        <div>
                          <p className="font-medium text-foreground">{member.association_name || 'Sin asociación'}</p>
                          <p className="text-xs text-muted-foreground">{member.city || 'Sin ciudad registrada'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={memberTone[member.member_status] || 'bg-slate-200 text-slate-900'}>
                            {formatMemberStatusLabel(member.member_status)}
                          </Badge>
                          <Badge className={credentialTone[member.credential_status] || 'bg-slate-200 text-slate-900'}>
                            {formatCredentialStatusLabel(member.credential_status)}
                          </Badge>
                          <Badge variant="outline">
                            {formatMembershipTierLabel(member.membership_tier)}
                          </Badge>
                          <Badge variant="outline">
                            {member.directory_visible ? 'Directorio visible' : 'Directorio privado'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[170px] align-top">
                      <div className="space-y-2 py-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{member.profile_completion || 0}%</span>
                        </div>
                        <Progress value={member.profile_completion || 0} />
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="py-2">{formatCopimCurrency(member.amount_due)}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="ml-auto flex max-w-[520px] flex-wrap justify-end gap-2 py-2">
                        <Button className="shrink-0" size="sm" variant="outline" onClick={() => openDetailSheet(member)}>
                          Ver ficha
                        </Button>
                        {member.member_status === 'pending' ? (
                          <Button className="shrink-0" size="sm" variant="outline" onClick={() => approveMember(member)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Aprobar
                          </Button>
                        ) : null}
                        {member.member_status === 'pending' ? (
                          <Button className="shrink-0" size="sm" variant="ghost" onClick={() => requestInformation(member)}>
                            Solicitar info
                          </Button>
                        ) : null}
                        {!member.portal_access_enabled ? (
                          <Button className="shrink-0" size="sm" variant="ghost" onClick={() => provisionPortalAccess(member)}>
                            Portal
                          </Button>
                        ) : null}
                        {member.credential_status !== 'issued' ? (
                          <Button className="shrink-0" size="sm" variant="outline" onClick={() => issueCredential(member)}>
                            <BadgeCheck className="mr-2 h-4 w-4" />
                            Credencial
                          </Button>
                        ) : null}
                        <Button className="shrink-0" size="sm" variant="outline" onClick={() => openEditDialog(member)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button className="shrink-0" size="sm" variant="ghost" onClick={() => toggleMemberStatus(member)}>
                          {member.member_status === 'suspended' ? 'Reactivar' : 'Suspender'}
                        </Button>
                        <Button className="shrink-0" size="sm" variant="ghost" onClick={() => deleteMember(member)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Editar socio' : 'Nuevo socio'}</DialogTitle>
            <DialogDescription>
              Captura la ficha operativa del socio con datos suficientes para directorio, cobro y credencialización.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Asociación</Label>
              <Select value={form.association_id || 'none'} onValueChange={(value) => setForm((prev) => ({ ...prev, association_id: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asociación</SelectItem>
                  {associations.map((association) => (
                    <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Especialidad</Label>
              <Input value={form.specialty} onChange={(event) => setForm((prev) => ({ ...prev, specialty: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input value={form.company_name} onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de alta</Label>
              <Input type="date" value={form.join_date} onChange={(event) => setForm((prev) => ({ ...prev, join_date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estatus del socio</Label>
              <Select value={form.member_status} onValueChange={(value) => setForm((prev) => ({ ...prev, member_status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tier de membresía</Label>
              <Select value={form.membership_tier} onValueChange={(value) => setForm((prev) => ({ ...prev, membership_tier: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estatus de credencial</Label>
              <Select value={form.credential_status} onValueChange={(value) => setForm((prev) => ({ ...prev, credential_status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="issued">Emitida</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID de credencial</Label>
              <Input value={form.credential_id} onChange={(event) => setForm((prev) => ({ ...prev, credential_id: event.target.value }))} placeholder="Se genera automáticamente si lo dejas vacío" />
            </div>
            <div className="space-y-2">
              <Label>Saldo pendiente</Label>
              <Input
                type="number"
                min={0}
                value={form.amount_due}
                onChange={(event) => setForm((prev) => ({ ...prev, amount_due: parseFloat(event.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 md:col-span-2">
              <div>
                <p className="font-medium">Visible en directorio</p>
                <p className="text-sm text-muted-foreground">Permite que el perfil aparezca en el macro directorio institucional.</p>
              </div>
              <Switch checked={form.directory_visible} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, directory_visible: checked }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMember} disabled={saving}>
              {saving ? 'Guardando...' : editingMember ? 'Actualizar socio' : 'Crear socio'}
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
                <DialogTitle asChild>
                  <div className="pr-8">
                    <CopimMemberIdentity
                      name={selectedSummary.member?.full_name}
                      subtitle={selectedSummary.member?.email || selectedSummary.member?.phone || selectedSummary.member?.association_name}
                      avatarUrl={selectedSummary.member?.avatar_url}
                      size="xl"
                      textClassName="space-y-1"
                      subtitleClassName="text-sm"
                    />
                  </div>
                </DialogTitle>
                <DialogDescription className="mt-2">
                  Ficha consolidada del socio con estado, credencial, saldo y membresías asociadas.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completitud</p>
                      <p className="mt-3 text-3xl font-semibold">{selectedSummary.stats?.profile_completion || 0}%</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo</p>
                      <p className="mt-3 text-2xl font-semibold">{formatCopimCurrency(selectedSummary.stats?.amount_due || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Directorio</p>
                      <p className="mt-3 text-xl font-semibold">{selectedSummary.stats?.directory_visible ? 'Visible' : 'Privado'}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credencial</p>
                      <p className="mt-3 text-xl font-semibold">{selectedSummary.member?.credential_id || 'Pendiente'}</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="profile" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                    <TabsTrigger value="review">Validación</TabsTrigger>
                    <TabsTrigger value="memberships">Membresías</TabsTrigger>
                    <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <CopimMemberIdentity
                            name={selectedSummary.member?.full_name}
                            subtitle={selectedSummary.member?.company_name || selectedSummary.member?.association_name}
                            avatarUrl={selectedSummary.member?.avatar_url}
                            size="2xl"
                          />
                          <div className="text-left sm:text-right">
                            <CardTitle>Perfil del socio</CardTitle>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {selectedSummary.member?.avatar_url ? 'Foto importada al perfil' : 'Sin foto importada'}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Asociación</p>
                            <p className="mt-1 font-semibold">{selectedSummary.member?.association_name}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Empresa</p>
                            <p className="mt-1 font-semibold">{selectedSummary.member?.company_name || 'Sin empresa'}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Especialidad</p>
                            <p className="mt-1 font-semibold">{selectedSummary.member?.specialty || 'Sin especialidad'}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Fecha de alta</p>
                            <p className="mt-1 font-semibold">{selectedSummary.member?.join_date ? formatCopimDate(selectedSummary.member.join_date) : 'Pendiente'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completitud del perfil</span>
                            <span className="font-medium">{selectedSummary.stats?.profile_completion || 0}%</span>
                          </div>
                          <Progress value={selectedSummary.stats?.profile_completion || 0} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSummary.member?.member_status === 'pending' ? (
                            <Button variant="outline" onClick={() => approveMember(selectedSummary.member)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Aprobar socio
                            </Button>
                          ) : null}
                          {selectedSummary.member?.member_status === 'pending' ? (
                            <Button variant="outline" onClick={() => requestInformation(selectedSummary.member)}>
                              Solicitar información
                            </Button>
                          ) : null}
                          {selectedSummary.member?.member_status === 'pending' ? (
                            <Button variant="outline" onClick={() => rejectMember(selectedSummary.member)}>
                              Rechazar
                            </Button>
                          ) : null}
                          {selectedSummary.member?.credential_status !== 'issued' ? (
                            <Button variant="outline" onClick={() => issueCredential(selectedSummary.member)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Emitir credencial
                            </Button>
                          ) : null}
                          {!selectedSummary.member?.portal_access_enabled ? (
                            <Button variant="outline" onClick={() => provisionPortalAccess(selectedSummary.member)}>
                              Activar portal
                            </Button>
                          ) : null}
                          <Button variant="outline" onClick={() => openOperationalRoute('/copim/memberships', { association: selectedSummary.member?.association_id })}>
                            Renovaciones
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => openOperationalRoute('/copim/invoices', { association: selectedSummary.member?.association_id, search: selectedSummary.member?.full_name })}>
                            Facturación
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                        {selectedSummary.member?.notes ? (
                          <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.member.notes}</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="review">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Onboarding y validación</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Estado de revisión</p>
                            <p className="mt-1 font-semibold capitalize">{selectedSummary.member?.review_state || 'submitted'}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Portal del asociado</p>
                            <p className="mt-1 font-semibold">{selectedSummary.member?.portal_access_enabled ? 'Activo' : 'Pendiente'}</p>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {Object.entries(selectedSummary.member?.validation_checklist || {}).map(([key, value]) => (
                            <div key={key} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                              <p className="text-sm text-muted-foreground">{key.replaceAll('_', ' ')}</p>
                              <p className="mt-1 font-semibold">{value ? 'Completo' : 'Pendiente'}</p>
                            </div>
                          ))}
                        </div>

                        {selectedSummary.member?.requested_information ? (
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                            <p className="text-sm font-medium text-amber-200">Información solicitada</p>
                            <p className="mt-2 text-sm text-amber-100/90">{selectedSummary.member.requested_information}</p>
                          </div>
                        ) : null}

                        {selectedSummary.member?.validation_notes ? (
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <p className="text-sm font-medium">Notas de operación</p>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedSummary.member.validation_notes}</p>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="memberships">
                    <Card className="border-border/70 bg-card/95">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plan</TableHead>
                            <TableHead>Renovación</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead>Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {safeArray(selectedSummary.memberships).map((membership) => (
                            <TableRow key={membership.id}>
                              <TableCell className="font-medium">{membership.plan_name}</TableCell>
                              <TableCell>{formatCopimDate(membership.renewal_date)}</TableCell>
                              <TableCell className="capitalize">{membership.payment_status}</TableCell>
                              <TableCell>{formatCopimCurrency(membership.balance_due)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analysis">
                    <CopimAIAnalysisPanel
                      api={api}
                      entity={selectedSummary.member}
                      analysisPath={`/copim/members/${selectedSummary.member?.id}/analyze`}
                      onAnalysisSaved={(payload) => {
                        setSelectedSummary((current) => (
                          current
                            ? {
                                ...current,
                                member: {
                                  ...current.member,
                                  ai_analysis: payload.ai_analysis,
                                  ai_last_analyzed_at: payload.ai_last_analyzed_at,
                                },
                              }
                            : current
                        ));
                      }}
                      emptyTitle="Todavía no hay análisis del socio"
                      emptyDescription="Ejecuta el análisis para detectar señales de activación, riesgo de renovación y acciones sugeridas."
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

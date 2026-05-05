import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellRing, CheckCircle2, FileText, Pencil, Plus, Send, Trash2, WalletCards, XCircle } from 'lucide-react';
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
import { mergeCopimSearchParams } from '../lib/copimRouting';

const EMPTY_FORM = {
  member_id: '',
  association_id: '',
  plan_name: 'Membresía Base',
  plan_price: 1800,
  billing_period: 'annual',
  renewal_date: '',
  payment_status: 'due',
  balance_due: 0,
  auto_renew: false,
  reminder_enabled: true,
  payment_method: 'transferencia',
  invoice_status: 'not_requested',
  paid_at: '',
  benefits_summary: '',
  notes: '',
};

const paymentTone = {
  active: 'bg-emerald-100 text-emerald-900',
  due: 'bg-amber-100 text-amber-900',
  overdue: 'bg-rose-100 text-rose-900',
  cancelled: 'bg-slate-200 text-slate-900',
};

const invoiceTone = {
  draft: 'bg-slate-200 text-slate-900',
  issued: 'bg-cyan-100 text-cyan-900',
  sent: 'bg-indigo-100 text-indigo-900',
  paid: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-900',
  pending: 'bg-amber-100 text-amber-900',
  not_requested: 'bg-slate-200 text-slate-900',
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

export const CopimMembershipsPage = () => {
  const { api } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [editingMembership, setEditingMembership] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [billingMembershipId, setBillingMembershipId] = useState(null);
  const [invoiceActionId, setInvoiceActionId] = useState(null);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get('payment') || 'all');
  const [associationFilter, setAssociationFilter] = useState(() => searchParams.get('association') || 'all');
  const focusMembershipId = searchParams.get('focus');
  const openedFocusRef = useRef(null);

  const syncSearchParams = (updates, replace = true) => {
    const next = mergeCopimSearchParams(searchParams, updates);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadRelatedData = async () => {
      try {
        const [membersResponse, associationsResponse] = await Promise.all([
          api.get('/copim/members'),
          api.get('/copim/associations'),
        ]);
        if (!cancelled) {
          setMembers(membersResponse.data || []);
          setAssociations(associationsResponse.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM related data:', error);
      }
    };

    void loadRelatedData();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    const loadMemberships = async () => {
      try {
        const response = await api.get('/copim/memberships', {
          params: {
            search: search || undefined,
            payment_status: paymentFilter === 'all' ? undefined : paymentFilter,
            association_id: associationFilter === 'all' ? undefined : associationFilter,
          },
        });
        if (!cancelled) {
          setMemberships(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM memberships:', error);
        if (!cancelled) {
          toast.error('No se pudieron cargar las membresías');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadMemberships();
    }, search ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [api, search, paymentFilter, associationFilter]);

  useEffect(() => {
    syncSearchParams({
      search,
      payment: paymentFilter,
      association: associationFilter,
      focus: focusMembershipId,
    });
  }, [associationFilter, focusMembershipId, paymentFilter, search]);

  const refreshMemberships = async () => {
    const response = await api.get('/copim/memberships', {
      params: {
        search: search || undefined,
        payment_status: paymentFilter === 'all' ? undefined : paymentFilter,
        association_id: associationFilter === 'all' ? undefined : associationFilter,
      },
    });
    setMemberships(response.data || []);
  };

  const refreshSelectedSummary = async (membershipId) => {
    const response = await api.get(`/copim/memberships/${membershipId}/summary`);
    setSelectedSummary(response.data);
  };

  const stats = useMemo(() => ({
    total: memberships.length,
    active: memberships.filter((item) => item.payment_status === 'active').length,
    due: memberships.filter((item) => item.payment_status === 'due').length,
    overdue: memberships.filter((item) => item.payment_status === 'overdue').length,
    revenueDue: memberships.reduce((sum, item) => sum + Number(item.balance_due || 0), 0),
  }), [memberships]);

  useEffect(() => {
    if (!focusMembershipId || !memberships.length || openedFocusRef.current === focusMembershipId) {
      return;
    }

    const focusedMembership = memberships.find((membership) => membership.id === focusMembershipId);
    if (!focusedMembership) {
      return;
    }

    openedFocusRef.current = focusMembershipId;
    void openDetailSheet(focusedMembership);
  }, [focusMembershipId, memberships]);

  const openCreateDialog = () => {
    setEditingMembership(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (membership) => {
    setEditingMembership(membership);
    setForm({
      member_id: membership.member_id || '',
      association_id: membership.association_id || '',
      plan_name: membership.plan_name || 'Membresía Base',
      plan_price: membership.plan_price || 0,
      billing_period: membership.billing_period || 'annual',
      renewal_date: membership.renewal_date ? membership.renewal_date.slice(0, 10) : '',
      payment_status: membership.payment_status || 'due',
      balance_due: membership.balance_due || 0,
      auto_renew: Boolean(membership.auto_renew),
      reminder_enabled: membership.reminder_enabled !== false,
      payment_method: membership.payment_method || 'transferencia',
      invoice_status: membership.invoice_status || 'not_requested',
      paid_at: membership.paid_at ? membership.paid_at.slice(0, 10) : '',
      benefits_summary: membership.benefits_summary || '',
      notes: membership.notes || '',
    });
    setDialogOpen(true);
  };

  const openDetailSheet = async (membership) => {
    syncSearchParams({ focus: membership.id });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/copim/memberships/${membership.id}/summary`);
      setSelectedSummary(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el detalle de la membresía');
    } finally {
      setDetailLoading(false);
    }
  };

  const onMemberChange = (memberId) => {
    const selectedMember = members.find((member) => member.id === memberId);
    setForm((prev) => ({
      ...prev,
      member_id: memberId,
      association_id: selectedMember?.association_id || prev.association_id,
    }));
  };

  const saveMembership = async () => {
    if (!form.member_id || !form.plan_name.trim() || !form.renewal_date) {
      toast.error('Socio, plan y fecha de renovación son obligatorios');
      return;
    }

    const payload = {
      ...form,
      association_id: form.association_id || null,
      renewal_date: new Date(`${form.renewal_date}T12:00:00`).toISOString(),
      paid_at: form.paid_at ? new Date(`${form.paid_at}T12:00:00`).toISOString() : null,
    };

    setSaving(true);
    try {
      if (editingMembership) {
        await api.put(`/copim/memberships/${editingMembership.id}`, payload);
        toast.success('Membresía actualizada');
      } else {
        await api.post('/copim/memberships', payload);
        toast.success('Membresía creada');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingMembership(null);
      await refreshMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la membresía');
    } finally {
      setSaving(false);
    }
  };

  const deleteMembership = async (membership) => {
    if (!window.confirm(`¿Eliminar la membresía de ${membership.member_name}?`)) {
      return;
    }
    try {
      await api.delete(`/copim/memberships/${membership.id}`);
      toast.success('Membresía eliminada');
      setSelectedSummary((current) => (current?.membership?.id === membership.id ? null : current));
      setDetailOpen((current) => (selectedSummary?.membership?.id === membership.id ? false : current));
      await refreshMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar la membresía');
    }
  };

  const sendReminder = async (membership) => {
    try {
      await api.post(`/copim/memberships/${membership.id}/send-reminder`);
      toast.success('Recordatorio enviado');
      await refreshMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo enviar el recordatorio');
    }
  };

  const createInvoice = async (membership) => {
    setBillingMembershipId(membership.id);
    try {
      const response = await api.post(`/copim/memberships/${membership.id}/invoice`);
      const created = Boolean(response.data?.created);
      toast.success(created ? 'Factura generada desde la membresía' : 'Ya existía una factura abierta para esta membresía');
      await refreshMemberships();
      if (selectedSummary?.membership?.id === membership.id) {
        await refreshSelectedSummary(membership.id);
      } else {
        await openDetailSheet(membership);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo generar la factura');
    } finally {
      setBillingMembershipId(null);
    }
  };

  const markPaid = async (membership) => {
    try {
      await api.post(`/copim/memberships/${membership.id}/mark-paid`);
      toast.success('Membresía marcada como pagada');
      await refreshMemberships();
      if (selectedSummary?.membership?.id === membership.id) {
        const response = await api.get(`/copim/memberships/${membership.id}/summary`);
        setSelectedSummary(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo marcar como pagada');
    }
  };

  const performInvoiceAction = async (invoice, action, successMessage) => {
    setInvoiceActionId(`${invoice.id}:${action}`);
    try {
      await api.post(`/copim/invoices/${invoice.id}/${action}`);
      toast.success(successMessage);
      await refreshMemberships();
      if (selectedSummary?.membership?.id) {
        await refreshSelectedSummary(selectedSummary.membership.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar la factura');
    } finally {
      setInvoiceActionId(null);
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
        title="Módulo de membresías"
        description="Cobranza, renovaciones, estatus de pago, facturación y recordatorios visibles en una sola vista operativa."
        actions={(
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por socio, asociación o plan"
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
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="due">Por vencer</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Button className="rounded-full" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva membresía
            </Button>
          </>
        )}
        stats={[
          { label: 'Total', value: stats.total, helper: 'Registros de membresía' },
          { label: 'Al corriente', value: stats.active, helper: 'Con renovación vigente' },
          { label: 'Por vencer', value: stats.due, helper: 'Pendientes de gestión' },
          { label: 'Cobranza visible', value: formatCopimCurrency(stats.revenueDue), helper: `${stats.overdue} vencidas acumuladas` },
        ]}
      />

      {!memberships.length ? (
        <CopimEmptyState
          icon={WalletCards}
          title="Todavía no hay membresías"
          description="Crea los primeros planes para activar renovaciones, cobro y seguimiento operativo."
          actionLabel="Crear membresía"
          onAction={openCreateDialog}
        />
      ) : (
        <Card className="border-border/70 bg-card/95">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Asociación</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Renovación</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Último recordatorio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.id} className={focusMembershipId === membership.id ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <CopimMemberIdentity name={membership.member_name} />
                  </TableCell>
                  <TableCell>{membership.association_name}</TableCell>
                  <TableCell>
                    <div>
                      <p>{membership.plan_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{membership.billing_period}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCopimDate(membership.renewal_date)}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${paymentTone[membership.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                      {membership.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCopimCurrency(membership.balance_due)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={`capitalize ${invoiceTone[membership.invoice_status] || 'bg-slate-200 text-slate-900'}`}>
                        {membership.invoice_status || 'not_requested'}
                      </Badge>
                      {membership.latest_invoice_number ? (
                        <p className="text-xs text-muted-foreground">
                          {membership.latest_invoice_number}
                          {membership.open_invoice_count ? ` · ${membership.open_invoice_count} abiertas` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin factura emitida</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{membership.last_reminder_at ? formatCopimDate(membership.last_reminder_at) : 'Sin enviar'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetailSheet(membership)}>
                        Ver detalle
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => createInvoice(membership)} disabled={billingMembershipId === membership.id}>
                        <FileText className="mr-2 h-4 w-4" />
                        {billingMembershipId === membership.id ? 'Facturando...' : 'Facturar'}
                      </Button>
                      {membership.payment_status !== 'active' ? (
                        <Button size="sm" variant="outline" onClick={() => markPaid(membership)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar pagada
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => sendReminder(membership)}>
                        <BellRing className="mr-2 h-4 w-4" />
                        Recordar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(membership)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMembership(membership)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingMembership ? 'Editar membresía' : 'Nueva membresía'}</DialogTitle>
            <DialogDescription>
              Configura el plan, la renovación, el método de pago y la trazabilidad administrativa.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Socio</Label>
              <Select value={form.member_id || 'none'} onValueChange={(value) => onMemberChange(value === 'none' ? '' : value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona un socio</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Plan</Label>
              <Input value={form.plan_name} onChange={(event) => setForm((prev) => ({ ...prev, plan_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input type="number" min={0} value={form.plan_price} onChange={(event) => setForm((prev) => ({ ...prev, plan_price: parseFloat(event.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={form.billing_period} onValueChange={(value) => setForm((prev) => ({ ...prev, billing_period: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Renovación</Label>
              <Input type="date" value={form.renewal_date} onChange={(event) => setForm((prev) => ({ ...prev, renewal_date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estatus de pago</Label>
              <Select value={form.payment_status} onValueChange={(value) => setForm((prev) => ({ ...prev, payment_status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="due">Por vencer</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Saldo pendiente</Label>
              <Input type="number" min={0} value={form.balance_due} onChange={(event) => setForm((prev) => ({ ...prev, balance_due: parseFloat(event.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={form.payment_method} onValueChange={(value) => setForm((prev) => ({ ...prev, payment_method: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="convenio">Convenio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estatus de factura</Label>
              <Select value={form.invoice_status} onValueChange={(value) => setForm((prev) => ({ ...prev, invoice_status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_requested">No solicitada</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="issued">Emitida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Último pago</Label>
              <Input type="date" value={form.paid_at} onChange={(event) => setForm((prev) => ({ ...prev, paid_at: event.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
              <div>
                <p className="font-medium">Auto-renovación</p>
                <p className="text-sm text-muted-foreground">Mantén marcada la renovación automática del plan.</p>
              </div>
              <Switch checked={form.auto_renew} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, auto_renew: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
              <div>
                <p className="font-medium">Recordatorios activos</p>
                <p className="text-sm text-muted-foreground">Permite disparar seguimientos de cobro desde la plataforma.</p>
              </div>
              <Switch checked={form.reminder_enabled} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, reminder_enabled: checked }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Beneficios</Label>
              <Textarea value={form.benefits_summary} onChange={(event) => setForm((prev) => ({ ...prev, benefits_summary: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMembership} disabled={saving}>
              {saving ? 'Guardando...' : editingMembership ? 'Actualizar membresía' : 'Crear membresía'}
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
                <DialogTitle>{selectedSummary.membership?.plan_name}</DialogTitle>
                <DialogDescription>
                  Detalle de renovación, cobro, beneficios y trazabilidad administrativa.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Socio</p>
                      <p className="mt-3 text-lg font-semibold">{selectedSummary.member?.full_name}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Renovación</p>
                      <p className="mt-3 text-lg font-semibold">{formatCopimDate(selectedSummary.membership?.renewal_date)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo</p>
                      <p className="mt-3 text-2xl font-semibold">{formatCopimCurrency(selectedSummary.membership?.balance_due || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Días para renovar</p>
                      <p className="mt-3 text-3xl font-semibold">{selectedSummary.membership?.days_to_renewal ?? 0}</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="billing">Facturación</TabsTrigger>
                    <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Resumen administrativo</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Asociación</p>
                          <p className="mt-1 font-semibold">{selectedSummary.association?.name || selectedSummary.membership?.association_name}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Método de pago</p>
                          <p className="mt-1 font-semibold capitalize">{selectedSummary.membership?.payment_method || 'Sin definir'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Factura</p>
                          <p className="mt-1 font-semibold capitalize">{selectedSummary.membership?.invoice_status || 'not_requested'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Último pago</p>
                          <p className="mt-1 font-semibold">{selectedSummary.membership?.paid_at ? formatCopimDate(selectedSummary.membership.paid_at) : 'Sin registrar'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Beneficios y notas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.membership?.benefits_summary || 'Sin beneficios capturados'}</p>
                        {selectedSummary.membership?.notes ? (
                          <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.membership.notes}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => createInvoice(selectedSummary.membership)} disabled={billingMembershipId === selectedSummary.membership?.id}>
                            <FileText className="mr-2 h-4 w-4" />
                            {billingMembershipId === selectedSummary.membership?.id ? 'Facturando...' : 'Generar factura'}
                          </Button>
                          {selectedSummary.membership?.payment_status !== 'active' ? (
                            <Button variant="outline" onClick={() => markPaid(selectedSummary.membership)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Marcar pagada
                            </Button>
                          ) : null}
                          <Button variant="outline" onClick={() => sendReminder(selectedSummary.membership)}>
                            <BellRing className="mr-2 h-4 w-4" />
                            Enviar recordatorio
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="billing" className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Card className="border-border/70 bg-muted/20">
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Facturas</p>
                          <p className="mt-3 text-3xl font-semibold">{selectedSummary.invoice_stats?.total || 0}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/70 bg-muted/20">
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Abiertas</p>
                          <p className="mt-3 text-3xl font-semibold">{selectedSummary.invoice_stats?.open || 0}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/70 bg-muted/20">
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pagadas</p>
                          <p className="mt-3 text-3xl font-semibold">{selectedSummary.invoice_stats?.paid || 0}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/70 bg-muted/20">
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cobranza visible</p>
                          <p className="mt-3 text-2xl font-semibold">{formatCopimCurrency(selectedSummary.invoice_stats?.balance_due || 0)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Facturación y cobranza</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => createInvoice(selectedSummary.membership)} disabled={billingMembershipId === selectedSummary.membership?.id}>
                            <FileText className="mr-2 h-4 w-4" />
                            {billingMembershipId === selectedSummary.membership?.id ? 'Facturando...' : 'Facturar esta membresía'}
                          </Button>
                          <Button variant="outline" onClick={() => sendReminder(selectedSummary.membership)}>
                            <BellRing className="mr-2 h-4 w-4" />
                            Recordar cobro
                          </Button>
                        </div>

                        {safeArray(selectedSummary.invoices).length ? (
                          <div className="space-y-3">
                            {safeArray(selectedSummary.invoices).map((invoice) => (
                              <div key={invoice.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                  <div>
                                    <p className="font-semibold">{invoice.invoice_number}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {invoice.concept} · vence {formatCopimDate(invoice.due_date)}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      {formatCopimCurrency(invoice.balance_due || invoice.total_amount || 0)} pendientes
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={`capitalize ${invoiceTone[invoice.invoice_status] || 'bg-slate-200 text-slate-900'}`}>
                                      {invoice.invoice_status}
                                    </Badge>
                                    <Badge className={`capitalize ${paymentTone[invoice.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                                      {invoice.payment_status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {invoice.invoice_status === 'draft' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => performInvoiceAction(invoice, 'issue', 'Factura emitida')}
                                      disabled={invoiceActionId === `${invoice.id}:issue`}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Emitir
                                    </Button>
                                  ) : null}
                                  {!['sent', 'paid', 'cancelled'].includes(invoice.invoice_status) ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => performInvoiceAction(invoice, 'send', 'Factura enviada')}
                                      disabled={invoiceActionId === `${invoice.id}:send`}
                                    >
                                      <Send className="mr-2 h-4 w-4" />
                                      Enviar
                                    </Button>
                                  ) : null}
                                  {invoice.payment_status !== 'paid' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => performInvoiceAction(invoice, 'mark-paid', 'Factura conciliada como pagada')}
                                      disabled={invoiceActionId === `${invoice.id}:mark-paid`}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Marcar pagada
                                    </Button>
                                  ) : null}
                                  {!['cancelled', 'paid'].includes(invoice.invoice_status) ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => performInvoiceAction(invoice, 'cancel', 'Factura cancelada')}
                                      disabled={invoiceActionId === `${invoice.id}:cancel`}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancelar
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                            Aún no hay facturas ligadas a esta membresía. Genera la primera para dejar visible la cobranza y la trazabilidad.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analysis">
                    <CopimAIAnalysisPanel
                      api={api}
                      entity={selectedSummary.membership}
                      analysisPath={`/copim/memberships/${selectedSummary.membership?.id}/analyze`}
                      onAnalysisSaved={(payload) => {
                        setSelectedSummary((current) => (
                          current
                            ? {
                                ...current,
                                membership: {
                                  ...current.membership,
                                  ai_analysis: payload.ai_analysis,
                                  ai_last_analyzed_at: payload.ai_last_analyzed_at,
                                },
                              }
                            : current
                        ));
                      }}
                      emptyTitle="Todavía no hay análisis de la membresía"
                      emptyDescription="Ejecuta el análisis para revisar riesgo de cobranza, urgencia de renovación y próximos movimientos sugeridos."
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

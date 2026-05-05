import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, FileText, Pencil, Plus, Send, Trash2, XCircle } from 'lucide-react';
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
import {
  Skeleton,
} from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  membership_id: '',
  member_id: '',
  association_id: '',
  invoice_number: '',
  concept: '',
  subtotal: 0,
  tax_amount: 0,
  total_amount: 0,
  balance_due: 0,
  currency: 'MXN',
  issue_date: '',
  due_date: '',
  invoice_status: 'draft',
  payment_status: 'pending',
  recipient_name: '',
  recipient_rfc: '',
  recipient_email: '',
  cfdi_use: 'G03',
  payment_method: 'transferencia',
  payment_reference: '',
  paid_at: '',
  notes: '',
};

const paymentTone = {
  pending: 'bg-amber-100 text-amber-900',
  paid: 'bg-emerald-100 text-emerald-900',
  overdue: 'bg-rose-100 text-rose-900',
  cancelled: 'bg-slate-200 text-slate-900',
};

const invoiceTone = {
  draft: 'bg-slate-200 text-slate-900',
  issued: 'bg-cyan-100 text-cyan-900',
  sent: 'bg-indigo-100 text-indigo-900',
  paid: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-900',
};

const toDateValue = (value) => (value ? value.slice(0, 10) : '');

export const CopimInvoicesPage = () => {
  const { api } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get('payment') || 'all');
  const [invoiceFilter, setInvoiceFilter] = useState(() => searchParams.get('invoice') || 'all');
  const [associationFilter, setAssociationFilter] = useState(() => searchParams.get('association') || 'all');
  const focusInvoiceId = searchParams.get('focus');
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
        const [membershipsResponse, membersResponse, associationsResponse] = await Promise.all([
          api.get('/copim/memberships'),
          api.get('/copim/members'),
          api.get('/copim/associations'),
        ]);
        if (!cancelled) {
          setMemberships(membershipsResponse.data || []);
          setMembers(membersResponse.data || []);
          setAssociations(associationsResponse.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM invoice dependencies:', error);
      }
    };

    void loadRelatedData();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      try {
        const response = await api.get('/copim/invoices', {
          params: {
            search: search || undefined,
            payment_status: paymentFilter === 'all' ? undefined : paymentFilter,
            invoice_status: invoiceFilter === 'all' ? undefined : invoiceFilter,
            association_id: associationFilter === 'all' ? undefined : associationFilter,
          },
        });
        if (!cancelled) {
          setInvoices(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM invoices:', error);
        if (!cancelled) {
          toast.error('No se pudieron cargar las facturas');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadInvoices();
    }, search ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [api, search, paymentFilter, invoiceFilter, associationFilter]);

  useEffect(() => {
    syncSearchParams({
      search,
      payment: paymentFilter,
      invoice: invoiceFilter,
      association: associationFilter,
      focus: focusInvoiceId,
    });
  }, [associationFilter, focusInvoiceId, invoiceFilter, paymentFilter, search]);

  const refreshInvoices = async () => {
    const response = await api.get('/copim/invoices', {
      params: {
        search: search || undefined,
        payment_status: paymentFilter === 'all' ? undefined : paymentFilter,
        invoice_status: invoiceFilter === 'all' ? undefined : invoiceFilter,
        association_id: associationFilter === 'all' ? undefined : associationFilter,
      },
    });
    setInvoices(response.data || []);
  };

  const refreshSelectedSummary = async (invoiceId) => {
    const response = await api.get(`/copim/invoices/${invoiceId}/summary`);
    setSelectedSummary(response.data);
  };

  const stats = useMemo(() => ({
    total: invoices.length,
    open: invoices.filter((item) => item.payment_status === 'pending').length,
    overdue: invoices.filter((item) => item.payment_status === 'overdue').length,
    paid: invoices.filter((item) => item.payment_status === 'paid').length,
    balanceDue: invoices.reduce((sum, item) => sum + Number(item.balance_due || 0), 0),
  }), [invoices]);

  useEffect(() => {
    if (!focusInvoiceId || !invoices.length || openedFocusRef.current === focusInvoiceId) {
      return;
    }

    const focusedInvoice = invoices.find((invoice) => invoice.id === focusInvoiceId);
    if (!focusedInvoice) {
      return;
    }

    openedFocusRef.current = focusInvoiceId;
    void openDetailDialog(focusedInvoice);
  }, [focusInvoiceId, invoices]);

  const openCreateDialog = () => {
    setEditingInvoice(null);
    setForm({
      ...EMPTY_FORM,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  };

  const openEditDialog = (invoice) => {
    setEditingInvoice(invoice);
    setForm({
      membership_id: invoice.membership_id || '',
      member_id: invoice.member_id || '',
      association_id: invoice.association_id || '',
      invoice_number: invoice.invoice_number || '',
      concept: invoice.concept || '',
      subtotal: invoice.subtotal || 0,
      tax_amount: invoice.tax_amount || 0,
      total_amount: invoice.total_amount || 0,
      balance_due: invoice.balance_due || 0,
      currency: invoice.currency || 'MXN',
      issue_date: toDateValue(invoice.issue_date),
      due_date: toDateValue(invoice.due_date),
      invoice_status: invoice.invoice_status || 'draft',
      payment_status: invoice.payment_status || 'pending',
      recipient_name: invoice.recipient_name || '',
      recipient_rfc: invoice.recipient_rfc || '',
      recipient_email: invoice.recipient_email || '',
      cfdi_use: invoice.cfdi_use || 'G03',
      payment_method: invoice.payment_method || 'transferencia',
      payment_reference: invoice.payment_reference || '',
      paid_at: toDateValue(invoice.paid_at),
      notes: invoice.notes || '',
    });
    setDialogOpen(true);
  };

  const openDetailDialog = async (invoice) => {
    syncSearchParams({ focus: invoice.id });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/copim/invoices/${invoice.id}/summary`);
      setSelectedSummary(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el detalle de la factura');
    } finally {
      setDetailLoading(false);
    }
  };

  const onMembershipChange = (membershipId) => {
    if (!membershipId || membershipId === '__none__') {
      setForm((prev) => ({ ...prev, membership_id: '' }));
      return;
    }

    const membership = memberships.find((item) => item.id === membershipId);
    const member = members.find((item) => item.id === membership?.member_id);
    setForm((prev) => ({
      ...prev,
      membership_id: membershipId,
      member_id: membership?.member_id || prev.member_id,
      association_id: membership?.association_id || prev.association_id,
      concept: prev.concept || `Facturacion de ${membership?.plan_name || 'membresia'}`,
      subtotal: membership?.plan_price ? Number((membership.plan_price / 1.16).toFixed(2)) : prev.subtotal,
      tax_amount: membership?.plan_price ? Number((membership.plan_price - (membership.plan_price / 1.16)).toFixed(2)) : prev.tax_amount,
      total_amount: membership?.plan_price || prev.total_amount,
      balance_due: membership?.balance_due ?? prev.balance_due,
      due_date: prev.due_date || toDateValue(membership?.renewal_date),
      payment_method: membership?.payment_method || prev.payment_method,
      recipient_name: prev.recipient_name || member?.full_name || '',
      recipient_email: prev.recipient_email || member?.email || '',
    }));
  };

  const onMemberChange = (memberId) => {
    const member = members.find((item) => item.id === memberId);
    setForm((prev) => ({
      ...prev,
      member_id: memberId,
      association_id: member?.association_id || prev.association_id,
      recipient_name: prev.recipient_name || member?.full_name || '',
      recipient_email: prev.recipient_email || member?.email || '',
    }));
  };

  const saveInvoice = async () => {
    if (!form.member_id || !form.concept.trim() || !form.issue_date || !form.due_date) {
      toast.error('Socio, concepto, emisión y vencimiento son obligatorios');
      return;
    }

    const totalAmount = Number(form.total_amount || 0) || Number(form.subtotal || 0) + Number(form.tax_amount || 0);
    const payload = {
      ...form,
      membership_id: form.membership_id || null,
      association_id: form.association_id || null,
      subtotal: Number(form.subtotal || 0),
      tax_amount: Number(form.tax_amount || 0),
      total_amount: totalAmount,
      balance_due: form.payment_status === 'paid' ? 0 : Number(form.balance_due || totalAmount),
      issue_date: new Date(`${form.issue_date}T12:00:00`).toISOString(),
      due_date: new Date(`${form.due_date}T12:00:00`).toISOString(),
      paid_at: form.paid_at ? new Date(`${form.paid_at}T12:00:00`).toISOString() : null,
      payment_reference: form.payment_reference || null,
      recipient_rfc: form.recipient_rfc || null,
    };

    setSaving(true);
    try {
      if (editingInvoice) {
        await api.put(`/copim/invoices/${editingInvoice.id}`, payload);
        toast.success('Factura actualizada');
      } else {
        await api.post('/copim/invoices', payload);
        toast.success('Factura creada');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingInvoice(null);
      await refreshInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la factura');
    } finally {
      setSaving(false);
    }
  };

  const deleteInvoice = async (invoice) => {
    if (!window.confirm(`¿Eliminar la factura ${invoice.invoice_number}?`)) {
      return;
    }
    try {
      await api.delete(`/copim/invoices/${invoice.id}`);
      toast.success('Factura eliminada');
      setSelectedSummary((current) => (current?.invoice?.id === invoice.id ? null : current));
      setDetailOpen((current) => (selectedSummary?.invoice?.id === invoice.id ? false : current));
      await refreshInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar la factura');
    }
  };

  const performInvoiceAction = async (invoice, action, successMessage) => {
    try {
      await api.post(`/copim/invoices/${invoice.id}/${action}`);
      toast.success(successMessage);
      await refreshInvoices();
      if (selectedSummary?.invoice?.id === invoice.id) {
        await refreshSelectedSummary(invoice.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar la factura');
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
            <Skeleton key={item} className="h-56 w-full rounded-[28px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        title="Facturación COPIM"
        description="Control operativo de facturas, emisión, envío, vencimientos y conciliación conectado a las membresías."
        actions={(
          <Button className="rounded-full" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        )}
        stats={[
          { label: 'Facturas abiertas', value: stats.open || 0, helper: `${stats.total || 0} registradas` },
          { label: 'Vencidas', value: stats.overdue || 0, helper: 'Seguimiento inmediato' },
          { label: 'Pagadas', value: stats.paid || 0, helper: 'Conciliadas en la operación' },
          { label: 'Saldo abierto', value: formatCopimCurrency(stats.balanceDue || 0), helper: 'Cobranza visible' },
        ]}
      />

      <Card className="border-border/70 bg-card/95">
        <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
          <Input
            placeholder="Buscar por folio, concepto, socio o RFC"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estatus de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pagos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estatus de factura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los documentos</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="issued">Emitida</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={associationFilter} onValueChange={setAssociationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Asociación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las asociaciones</SelectItem>
              {associations.map((association) => (
                <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={() => {
              setSearch('');
              setPaymentFilter('all');
              setInvoiceFilter('all');
              setAssociationFilter('all');
            }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {!invoices.length ? (
        <CopimEmptyState
          icon={FileText}
          title="Todavía no hay facturas"
          description="Empieza generando las primeras facturas para visibilizar emisión, envío y cobranza desde COPIM."
          actionLabel="Crear factura"
          onAction={openCreateDialog}
        />
      ) : (
        <Card className="border-border/70 bg-card/95">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Socio</TableHead>
                <TableHead>Asociación</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className={`cursor-pointer ${focusInvoiceId === invoice.id ? 'bg-primary/5' : ''}`} onClick={() => openDetailDialog(invoice)}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{invoice.concept}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CopimMemberIdentity name={invoice.member_name} />
                  </TableCell>
                  <TableCell>{invoice.association_name}</TableCell>
                  <TableCell>{formatCopimDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${invoiceTone[invoice.invoice_status] || 'bg-slate-200 text-slate-900'}`}>
                      {invoice.invoice_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${paymentTone[invoice.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                      {invoice.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCopimCurrency(invoice.total_amount)}</TableCell>
                  <TableCell>{formatCopimCurrency(invoice.balance_due)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={(event) => {
                        event.stopPropagation();
                        openEditDialog(invoice);
                      }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(event) => {
                        event.stopPropagation();
                        deleteInvoice(invoice);
                      }}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Editar factura' : 'Nueva factura'}</DialogTitle>
            <DialogDescription>
              Captura el expediente de facturación y mantenlo alineado con la membresía y la cobranza.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Membresía vinculada</Label>
              <Select value={form.membership_id || '__none__'} onValueChange={onMembershipChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una membresía" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin vincular</SelectItem>
                  {memberships.map((membership) => (
                    <SelectItem key={membership.id} value={membership.id}>
                      {membership.member_name} · {membership.plan_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Socio</Label>
              <Select value={form.member_id} onValueChange={onMemberChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un socio" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asociación</Label>
              <Select value={form.association_id || '__none__'} onValueChange={(value) => setForm((prev) => ({ ...prev, association_id: value === '__none__' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asociación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asociación</SelectItem>
                  {associations.map((association) => (
                    <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Folio / factura</Label>
              <Input value={form.invoice_number} onChange={(event) => setForm((prev) => ({ ...prev, invoice_number: event.target.value }))} placeholder="Se genera automáticamente si lo dejas vacío" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Concepto</Label>
              <Input value={form.concept} onChange={(event) => setForm((prev) => ({ ...prev, concept: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <Input type="number" value={form.subtotal} onChange={(event) => setForm((prev) => ({ ...prev, subtotal: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>IVA</Label>
              <Input type="number" value={form.tax_amount} onChange={(event) => setForm((prev) => ({ ...prev, tax_amount: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <Input type="number" value={form.total_amount} onChange={(event) => setForm((prev) => ({ ...prev, total_amount: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Saldo pendiente</Label>
              <Input type="number" value={form.balance_due} onChange={(event) => setForm((prev) => ({ ...prev, balance_due: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de emisión</Label>
              <Input type="date" value={form.issue_date} onChange={(event) => setForm((prev) => ({ ...prev, issue_date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={form.due_date} onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Estatus de factura</Label>
              <Select value={form.invoice_status} onValueChange={(value) => setForm((prev) => ({ ...prev, invoice_status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="issued">Emitida</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estatus de pago</Label>
              <Select value={form.payment_status} onValueChange={(value) => setForm((prev) => ({ ...prev, payment_status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre fiscal</Label>
              <Input value={form.recipient_name} onChange={(event) => setForm((prev) => ({ ...prev, recipient_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>RFC</Label>
              <Input value={form.recipient_rfc} onChange={(event) => setForm((prev) => ({ ...prev, recipient_rfc: event.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-2">
              <Label>Correo fiscal</Label>
              <Input value={form.recipient_email} onChange={(event) => setForm((prev) => ({ ...prev, recipient_email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Uso CFDI</Label>
              <Input value={form.cfdi_use} onChange={(event) => setForm((prev) => ({ ...prev, cfdi_use: event.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={form.payment_method} onValueChange={(value) => setForm((prev) => ({ ...prev, payment_method: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referencia de pago</Label>
              <Input value={form.payment_reference} onChange={(event) => setForm((prev) => ({ ...prev, payment_reference: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveInvoice} disabled={saving}>
              {saving ? 'Guardando...' : editingInvoice ? 'Actualizar factura' : 'Crear factura'}
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
                <DialogTitle>{selectedSummary.invoice?.invoice_number}</DialogTitle>
                <DialogDescription>
                  Detalle de emisión, cobro, estatus documental y conciliación de la factura.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</p>
                      <p className="mt-3 text-2xl font-semibold">{formatCopimCurrency(selectedSummary.invoice?.total_amount || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo</p>
                      <p className="mt-3 text-2xl font-semibold">{formatCopimCurrency(selectedSummary.invoice?.balance_due || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vencimiento</p>
                      <p className="mt-3 text-lg font-semibold">{formatCopimDate(selectedSummary.invoice?.due_date)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Días al vencimiento</p>
                      <p className="mt-3 text-3xl font-semibold">{selectedSummary.invoice?.days_to_due ?? 0}</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Resumen administrativo</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Socio</p>
                          <p className="mt-1 font-semibold">{selectedSummary.member?.full_name}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Asociación</p>
                          <p className="mt-1 font-semibold">{selectedSummary.association?.name || selectedSummary.invoice?.association_name}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Membresía</p>
                          <p className="mt-1 font-semibold">{selectedSummary.membership?.plan_name || selectedSummary.invoice?.membership_name}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Método de pago</p>
                          <p className="mt-1 font-semibold capitalize">{selectedSummary.invoice?.payment_method || 'Sin definir'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">RFC</p>
                          <p className="mt-1 font-semibold">{selectedSummary.invoice?.recipient_rfc || 'Sin RFC'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Correo fiscal</p>
                          <p className="mt-1 font-semibold">{selectedSummary.invoice?.recipient_email || 'Sin correo'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Estatus y acciones</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`capitalize ${invoiceTone[selectedSummary.invoice?.invoice_status] || 'bg-slate-200 text-slate-900'}`}>
                            Documento: {selectedSummary.invoice?.invoice_status}
                          </Badge>
                          <Badge className={`capitalize ${paymentTone[selectedSummary.invoice?.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                            Pago: {selectedSummary.invoice?.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.invoice?.concept}</p>
                        {selectedSummary.invoice?.notes ? (
                          <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.invoice.notes}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          {selectedSummary.invoice?.invoice_status === 'draft' ? (
                            <Button variant="outline" onClick={() => performInvoiceAction(selectedSummary.invoice, 'issue', 'Factura emitida')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Emitir
                            </Button>
                          ) : null}
                          {['issued', 'draft'].includes(selectedSummary.invoice?.invoice_status) ? (
                            <Button variant="outline" onClick={() => performInvoiceAction(selectedSummary.invoice, 'send', 'Factura enviada')}>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar
                            </Button>
                          ) : null}
                          {selectedSummary.invoice?.payment_status !== 'paid' ? (
                            <Button variant="outline" onClick={() => performInvoiceAction(selectedSummary.invoice, 'mark-paid', 'Factura conciliada como pagada')}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Marcar pagada
                            </Button>
                          ) : null}
                          {!['cancelled', 'paid'].includes(selectedSummary.invoice?.invoice_status) ? (
                            <Button variant="outline" onClick={() => performInvoiceAction(selectedSummary.invoice, 'cancel', 'Factura cancelada')}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analysis">
                    <CopimAIAnalysisPanel
                      api={api}
                      entity={selectedSummary.invoice}
                      analysisPath={`/copim/invoices/${selectedSummary.invoice?.id}/analyze`}
                      onAnalysisSaved={(payload) => {
                        setSelectedSummary((current) => (
                          current
                            ? {
                                ...current,
                                invoice: {
                                  ...current.invoice,
                                  ai_analysis: payload.ai_analysis,
                                  ai_last_analyzed_at: payload.ai_last_analyzed_at,
                                },
                              }
                            : current
                        ));
                      }}
                      emptyTitle="Todavía no hay análisis de la factura"
                      emptyDescription="Ejecuta el análisis para detectar prioridad de cobranza, fricción administrativa y siguiente acción sugerida."
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

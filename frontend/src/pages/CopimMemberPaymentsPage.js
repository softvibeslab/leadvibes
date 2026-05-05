import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Download, FileText, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CopimPageHeader, formatCopimCurrency, formatCopimDate } from '../components/copim/CopimModulePrimitives';

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

export const CopimMemberPaymentsPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const loadPayments = useCallback(async () => {
    try {
      const response = await api.get('/copim/member-portal/payments');
      setData(response.data);
    } catch (error) {
      console.error('Error loading member payments:', error);
      toast.error(error.response?.data?.detail || 'No se pudieron cargar tus pagos');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const handleDownload = (invoice) => {
    const body = [
      `Factura: ${invoice.invoice_number}`,
      `Concepto: ${invoice.concept}`,
      `Socio: ${invoice.member_name || invoice.recipient_name}`,
      `Monto total: ${formatCopimCurrency(invoice.total_amount)}`,
      `Saldo: ${formatCopimCurrency(invoice.balance_due)}`,
      `Estatus pago: ${invoice.payment_status}`,
      `Estatus factura: ${invoice.invoice_status}`,
      `Emisión: ${formatCopimDate(invoice.issue_date)}`,
      `Vencimiento: ${formatCopimDate(invoice.due_date)}`,
    ].join('\n');

    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${invoice.invoice_number || 'factura-copim'}.txt`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const handlePay = async (invoice) => {
    setPayingId(invoice.id);
    try {
      await api.post(`/copim/member-portal/payments/${invoice.id}/pay`);
      toast.success('Pago registrado en el portal');
      await loadPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar el pago');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { pending_invoices: pendingInvoices = [], payments = [], amount_due: amountDue = 0 } = data;

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mis pagos y facturas"
        description="Mantén tus adeudos visibles, revisa tu historial y descarga tu comprobante cuando lo necesites."
        stats={[
          { label: 'Saldo pendiente', value: formatCopimCurrency(amountDue), helper: 'Monto por regularizar' },
          { label: 'Facturas abiertas', value: pendingInvoices.length, helper: 'Pendientes y vencidas' },
          { label: 'Pagadas', value: payments.filter((invoice) => invoice.payment_status === 'paid').length, helper: 'Historial conciliado' },
          { label: 'Última factura', value: payments[0]?.invoice_number || 'Sin folio', helper: payments[0] ? formatCopimDate(payments[0].issue_date) : 'Sin emisión' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-primary/10 p-4 text-primary">
                <WalletCards className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Cobranza visible</p>
                <h2 className="mt-1 text-2xl font-semibold">Adeudos por atender</h2>
              </div>
            </div>

            <div className="space-y-3">
              {pendingInvoices.length ? pendingInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{invoice.concept}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invoice.invoice_number} · vence {formatCopimDate(invoice.due_date)}
                      </p>
                    </div>
                    <Badge className={`rounded-full capitalize ${paymentTone[invoice.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                      {invoice.payment_status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-semibold">{formatCopimCurrency(invoice.balance_due || invoice.total_amount || 0)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleDownload(invoice)}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                      <Button size="sm" className="rounded-full" onClick={() => handlePay(invoice)} disabled={payingId === invoice.id}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {payingId === invoice.id ? 'Procesando...' : 'Pagar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                  No tienes adeudos activos. Tu operación va al corriente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-cyan-500/10 p-4 text-cyan-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Historial</p>
                <h3 className="mt-1 text-2xl font-semibold">Pagos y facturas emitidas</h3>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length ? payments.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{invoice.concept}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCopimDate(invoice.issue_date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`rounded-full capitalize ${paymentTone[invoice.payment_status] || 'bg-slate-200 text-slate-900'}`}>
                            {invoice.payment_status}
                          </Badge>
                          <Badge variant="outline" className={`rounded-full capitalize ${invoiceTone[invoice.invoice_status] || ''}`}>
                            {invoice.invoice_status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatCopimCurrency(invoice.total_amount || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(invoice)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.payment_status !== 'paid' ? (
                            <Button size="sm" className="rounded-full" onClick={() => handlePay(invoice)} disabled={payingId === invoice.id}>
                              {payingId === invoice.id ? 'Procesando...' : 'Pagar'}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="rounded-full" disabled>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Pagada
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Aún no hay facturas para mostrar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

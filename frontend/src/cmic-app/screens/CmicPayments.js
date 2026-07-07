import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Card, Chip, CmicLoading, CmicEmpty, Icon, fmtCurrency, fmtDate, useMemberResource } from '../cmicAppKit';

const TONE = { paid: 'ok', pending: 'warn', due: 'warn', overdue: 'err', cancelled: 'default' };
const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'paid', label: 'Pagadas' },
  { key: 'overdue', label: 'Vencidas' },
];

export const CmicPayments = () => {
  const { api } = useAuth();
  const { data, loading, reload } = useMemberResource('/copim/member-portal/payments');
  const [filter, setFilter] = useState('all');
  const [payingId, setPayingId] = useState(null);

  if (loading) return <CmicLoading />;
  if (!data) return null;

  const { pending_invoices: pending = [], payments = [], amount_due: amountDue = 0 } = data;
  const all = [...pending, ...payments.filter((p) => !pending.some((q) => q.id === p.id))];
  const list = filter === 'all' ? all : all.filter((i) => i.payment_status === filter);

  const handlePay = async (invoice) => {
    setPayingId(invoice.id);
    try {
      await api.post(`/copim/member-portal/payments/${invoice.id}/pay`);
      toast.success('Pago registrado en el portal');
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar el pago');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="cmic-hero-navy">
        <p style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saldo total pendiente</p>
        <p style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>{fmtCurrency(amountDue)}</p>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
          {pending.length ? `${pending.length} factura(s) por pagar` : 'Estás al corriente'}
        </p>
      </div>

      <div className="cmic-chiprow">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`cmic-filter ${filter === f.key ? 'cmic-filter--active' : ''}`.trim()}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((invoice) => {
            const isPaid = invoice.payment_status === 'paid';
            return (
              <Card key={invoice.id} pad="sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600 }}>{invoice.concept || 'Factura CMIC'}</p>
                    <p className="cmic-caption">{invoice.invoice_number}</p>
                    <p className="cmic-caption" style={{ marginTop: 2 }}>
                      {invoice.issue_date ? `Emitida ${fmtDate(invoice.issue_date)}` : ''}
                      {invoice.due_date ? ` · Vence ${fmtDate(invoice.due_date)}` : ''}
                    </p>
                  </div>
                  <Chip tone={TONE[invoice.payment_status] || 'default'}>{invoice.payment_status}</Chip>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>{fmtCurrency(invoice.total_amount || invoice.balance_due || 0)}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isPaid ? (
                      <button
                        className="cmic-btn cmic-btn--primary cmic-btn--sm"
                        disabled={payingId === invoice.id}
                        onClick={() => handlePay(invoice)}
                      >
                        {payingId === invoice.id ? 'Procesando…' : 'Pagar'}
                      </button>
                    ) : (
                      <span className="cmic-chip cmic-chip--ok"><Icon name="check_circle" fill style={{ fontSize: 16 }} /> Pagada</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <CmicEmpty icon="receipt_long" title="Sin facturas en este filtro" description="No hay documentos que coincidan con el estado seleccionado." />
      )}

      <Card pad="sm">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="badge" style={{ color: 'var(--cmic-secondary)' }} />
          <div style={{ flex: 1 }}>
            <p className="cmic-caption">Datos de facturación (CFDI)</p>
            <p className="cmic-body">Configura tu RFC y uso de CFDI</p>
          </div>
          <Icon name="chevron_right" style={{ color: 'var(--cmic-on-surface-variant)' }} />
        </div>
      </Card>
    </div>
  );
};

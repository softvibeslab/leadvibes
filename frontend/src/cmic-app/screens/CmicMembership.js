import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Chip, CmicLoading, Icon, SectionLabel, fmtCurrency, fmtDate, useMemberResource } from '../cmicAppKit';

const STATUS_TONE = { active: 'ok', paid: 'ok', due: 'warn', pending: 'warn', overdue: 'err', cancelled: 'default' };

const BENEFITS = [
  'Acceso total a Cursos ICIC',
  'Credencial Digital Activa',
  'Directorio Nacional de Socios',
  'Invitaciones a Eventos Exclusivos',
  'Oportunidades de Obra Pública/Privada',
  'Asesoría Legal y Técnica',
];

export const CmicMembership = () => {
  const navigate = useNavigate();
  const { data, loading } = useMemberResource('/copim/member-portal/membership');

  if (loading) return <CmicLoading />;
  if (!data) return null;

  const { current_membership: m, history = [] } = data;
  const benefits = (m?.benefits_summary ? String(m.benefits_summary).split(/[;\n]/).map((s) => s.trim()).filter(Boolean) : null) || BENEFITS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero membresía */}
      <Card pad="md" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <Chip tone={STATUS_TONE[m?.payment_status] || 'default'} dot={m?.payment_status === 'active'}>
            {m?.payment_status === 'active' ? 'Activa' : m?.payment_status || 'Sin estatus'}
          </Chip>
        </div>
        <h2 className="cmic-h2" style={{ marginBottom: 4 }}>{m?.plan_name || 'Sin membresía activa'}</h2>
        <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--cmic-primary)' }}>
          {fmtCurrency(m?.plan_price || 0)}
          <span className="cmic-body cmic-muted" style={{ fontWeight: 400 }}> / {m?.billing_period || 'anual'}</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 16px' }}>
          <Icon name="event_repeat" style={{ fontSize: 16, color: 'var(--cmic-on-surface-variant)' }} />
          <p className="cmic-body cmic-muted">
            {m?.renewal_date ? `Próxima renovación: ${fmtDate(m.renewal_date)}` : 'Sin vencimiento asignado'}
          </p>
        </div>
        <button className="cmic-btn cmic-btn--primary" onClick={() => navigate('/cmic/app/payments')}>Renovar membresía</button>
      </Card>

      {/* Beneficios */}
      <div>
        <SectionLabel>Beneficios incluidos</SectionLabel>
        <div className="cmic-card cmic-card--pad-sm" style={{ padding: 0 }}>
          {benefits.map((b) => (
            <div key={b} className="cmic-list-item">
              <Icon name="check_circle" fill style={{ color: 'var(--cmic-tertiary)' }} />
              <p className="cmic-body">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Facturación */}
      <div>
        <SectionLabel>Detalles de facturación</SectionLabel>
        <Card pad="sm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="cmic-caption">Saldo pendiente</p>
              <p style={{ fontWeight: 600, color: Number(m?.balance_due) > 0 ? 'var(--cmic-warn)' : 'var(--cmic-tertiary)' }}>
                {fmtCurrency(m?.balance_due || 0)}
              </p>
            </div>
            <Icon name="receipt_long" style={{ color: 'var(--cmic-on-surface-variant)' }} />
          </div>
          <div className="cmic-divider" style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="cmic-caption">Estatus de factura</p>
              <p className="cmic-body" style={{ textTransform: 'capitalize' }}>{m?.invoice_status || 'sin factura'}</p>
            </div>
            <button className="cmic-btn cmic-btn--ghost cmic-btn--sm" onClick={() => navigate('/cmic/app/payments')}>Ver facturas</button>
          </div>
        </Card>
      </div>

      {/* Historial */}
      {history.length ? (
        <div>
          <SectionLabel>Historial</SectionLabel>
          <div className="cmic-card" style={{ padding: 0 }}>
            {history.map((h) => (
              <div key={h.id} className="cmic-list-item">
                <span className="cmic-quick__icon" style={{ marginBottom: 0 }}><Icon name="history" /></span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{h.plan_name}</p>
                  <p className="cmic-caption">Renovación {fmtDate(h.renewal_date)}</p>
                </div>
                <Chip tone={STATUS_TONE[h.payment_status] || 'default'}>{h.payment_status}</Chip>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

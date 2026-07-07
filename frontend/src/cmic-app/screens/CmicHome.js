import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Card, Chip, CmicLoading, Icon, fmtCurrency, fmtDate, fmtDateTime, useMemberResource } from '../cmicAppKit';

const QUICK = [
  { icon: 'payments', label: 'Pagos', helper: 'Facturas y CFDI', to: '/cmic/app/payments' },
  { icon: 'event', label: 'Eventos', helper: 'Agenda y registro', to: '/cmic/app/events' },
  { icon: 'engineering', label: 'Oportunidades', helper: 'Obra y licitaciones', to: '/cmic/app/opportunities' },
  { icon: 'groups', label: 'Directorio', helper: 'Red de socios', to: '/cmic/app/directory' },
  { icon: 'insights', label: 'Indicadores', helper: 'Inteligencia sectorial', to: '/cmic/app/indicators' },
  { icon: 'redeem', label: 'Recompensas', helper: 'Beneficios y cupones', to: '/cmic/app/more' },
];

export const CmicHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading } = useMemberResource('/copim/member-portal/home');

  if (loading) return <CmicLoading />;
  if (!data) return null;

  const {
    member,
    association,
    current_membership: membership,
    pending_invoices: pendingInvoices = [],
    next_event: nextEvent,
    credential,
    stats,
  } = data;

  const firstName = (member?.full_name || user?.name || 'Socio').split(' ')[0];
  const active = member?.member_status === 'active';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Identidad + estatus */}
      <Card pad="md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={member?.full_name} src={member?.avatar_url} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="cmic-caption">Hola, buen día</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--cmic-navy-deep)' }}>{firstName}</p>
            <p className="cmic-caption" style={{ marginTop: 2 }}>{association?.name || 'Delegación CMIC'}</p>
          </div>
          <Chip tone={active ? 'ok' : 'warn'} dot={active}>
            {active ? 'Afiliado activo' : member?.member_status || 'Pendiente'}
          </Chip>
        </div>
      </Card>

      {/* Resumen financiero / membresía */}
      <div className="cmic-hero-navy">
        <p style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mi plan</p>
        <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{membership?.plan_name || 'Sin membresía activa'}</p>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
          {membership?.renewal_date ? `Próxima renovación: ${fmtDate(membership.renewal_date)}` : 'Sin vencimiento asignado'}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="cmic-btn cmic-btn--primary" onClick={() => navigate('/cmic/app/payments')}>
            <Icon name="credit_card" style={{ fontSize: 18 }} />
            {Number(stats?.amount_due) > 0 ? `Pagar ${fmtCurrency(stats.amount_due)}` : 'Ver pagos'}
          </button>
        </div>
      </div>

      {/* Tarjetas de estado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card pad="sm">
          <p className="cmic-caption">Próximo evento</p>
          <p style={{ fontWeight: 600, marginTop: 4 }}>{nextEvent ? fmtDate(nextEvent.start_at) : 'Sin agenda'}</p>
          <p className="cmic-caption" style={{ marginTop: 2 }}>{nextEvent?.title || 'Aún sin registro'}</p>
        </Card>
        <Card pad="sm">
          <p className="cmic-caption">Credencial</p>
          <p style={{ fontWeight: 600, marginTop: 4, color: credential?.credential_status === 'issued' ? 'var(--cmic-tertiary)' : 'var(--cmic-warn)' }}>
            {credential?.credential_status === 'issued' ? 'Vigente' : 'Pendiente'}
          </p>
          <p className="cmic-caption" style={{ marginTop: 2 }}>{credential?.credential_id || 'Sin folio'}</p>
        </Card>
      </div>

      {nextEvent ? (
        <Card pad="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="cmic-quick__icon" style={{ marginBottom: 0 }}><Icon name="event_available" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600 }}>{nextEvent.title}</p>
              <p className="cmic-caption">{fmtDateTime(nextEvent.start_at)}</p>
            </div>
            <button className="cmic-btn cmic-btn--ghost cmic-btn--sm" onClick={() => navigate('/cmic/app/events')}>Ver</button>
          </div>
        </Card>
      ) : null}

      {/* Accesos rápidos */}
      <div>
        <p className="cmic-section-label">Accesos rápidos</p>
        <div className="cmic-quickgrid">
          {QUICK.map((q) => (
            <button key={q.label} className="cmic-quick" onClick={() => navigate(q.to)}>
              <span className="cmic-quick__icon"><Icon name={q.icon} /></span>
              <p style={{ fontWeight: 600 }}>{q.label}</p>
              <p className="cmic-caption" style={{ marginTop: 2 }}>{q.helper}</p>
            </button>
          ))}
        </div>
      </div>

      {pendingInvoices.length ? (
        <Card pad="sm" style={{ borderColor: 'var(--cmic-warn)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="warning" style={{ color: 'var(--cmic-warn)' }} fill />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600 }}>{pendingInvoices.length} factura(s) por pagar</p>
              <p className="cmic-caption">Saldo {fmtCurrency(stats?.amount_due || 0)}</p>
            </div>
            <button className="cmic-btn cmic-btn--ghost cmic-btn--sm" onClick={() => navigate('/cmic/app/payments')}>Pagar</button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

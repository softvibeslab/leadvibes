import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Icon } from '../cmicAppKit';

const GROUPS = [
  {
    label: 'Mi cuenta',
    items: [
      { icon: 'account_circle', label: 'Mi perfil', to: '/cmic/app/profile' },
      { icon: 'workspace_premium', label: 'Mi membresía', to: '/cmic/app/membership' },
      { icon: 'payments', label: 'Pagos y facturas', to: '/cmic/app/payments' },
      { icon: 'qr_code_2', label: 'Credencial digital', to: '/cmic/app/credential' },
    ],
  },
  {
    label: 'Comunidad y red',
    items: [
      { icon: 'groups', label: 'Directorio de socios', to: '/cmic/app/directory' },
      { icon: 'event', label: 'Eventos y comunicados', to: '/cmic/app/events' },
      { icon: 'school', label: 'Cursos ICIC', to: '/cmic/app/courses' },
    ],
  },
  {
    label: 'Oportunidades e inteligencia',
    items: [
      { icon: 'engineering', label: 'Oportunidades de obra', to: '/cmic/app/opportunities' },
      { icon: 'insights', label: 'Indicadores del sector', to: '/cmic/app/indicators' },
    ],
  },
];

export const CmicMore = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="cmic-section-label">{group.label}</p>
          <Card pad="none">
            {group.items.map((item) => (
              <button
                key={item.to}
                className="cmic-list-item"
                onClick={() => navigate(item.to)}
                style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span className="cmic-quick__icon" style={{ marginBottom: 0 }}><Icon name={item.icon} /></span>
                <span className="cmic-body" style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                <Icon name="chevron_right" style={{ color: 'var(--cmic-on-surface-variant)' }} />
              </button>
            ))}
          </Card>
        </div>
      ))}

      <p className="cmic-caption" style={{ textAlign: 'center', marginTop: 8 }}>CMIC Digital · Cámara Mexicana de la Industria de la Construcción</p>
    </div>
  );
};

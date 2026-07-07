import React, { useState } from 'react';
import { Card, Chip, Icon, SectionLabel, fmtCurrency } from '../cmicAppKit';

// NOTA: aún no existe endpoint /copim/member-portal/opportunities en el backend.
// Esta vista muestra datos de DEMOSTRACIÓN claramente etiquetados. Cuando se
// publique el endpoint, sustituir DEMO por useMemberResource('/copim/member-portal/opportunities').
const DEMO = {
  publica: [
    { id: 'p1', title: 'Construcción de Puente Vehicular "La Unidad"', entity: 'SCT', location: 'Monterrey, NL', amount: 45200000, deadline: 'Faltan 4 días', category: 'Infraestructura', status: 'ok' },
    { id: 'p2', title: 'Pavimentación Sector Sur', entity: 'Municipio de Puebla', location: 'Puebla, Pue', amount: 5400000, deadline: 'Cierra hoy 18:00', category: 'Obra civil', status: 'warn' },
    { id: 'p3', title: 'Mantenimiento de Red Hidráulica', entity: 'CONAGUA', location: 'CDMX', amount: 8900000, deadline: 'Faltan 9 días', category: 'Infraestructura', status: 'ok' },
  ],
  privada: [
    { id: 'pr1', title: 'Ampliación Planta Industrial Beta', entity: 'Grupo Industrial Norte', location: 'Querétaro, Qro', amount: 12800000, deadline: 'Faltan 6 días', category: 'Edificación', status: 'ok' },
    { id: 'pr2', title: 'Remodelación Centro Corporativo', entity: 'Inmobiliaria Premium', location: 'Guadalajara, Jal', amount: 22000000, deadline: 'Faltan 12 días', category: 'Edificación', status: 'ok' },
  ],
};

const TABS = [
  { key: 'publica', label: 'Obra pública' },
  { key: 'privada', label: 'Sector privado' },
];

export const CmicOpportunities = () => {
  const [tab, setTab] = useState('publica');
  const list = DEMO[tab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card pad="sm" style={{ borderColor: 'var(--cmic-warn)', background: 'var(--cmic-warn-container)' }}>
        <p className="cmic-body" style={{ color: 'var(--cmic-warn)', fontWeight: 600 }}>
          <Icon name="info" style={{ fontSize: 16 }} /> Vista previa con datos de ejemplo
        </p>
        <p className="cmic-caption" style={{ marginTop: 4 }}>
          El feed real de licitaciones se conectará al publicarse el endpoint de oportunidades.
        </p>
      </Card>

      <div className="cmic-chiprow">
        {TABS.map((t) => (
          <button key={t.key} className={`cmic-filter ${tab === t.key ? 'cmic-filter--active' : ''}`.trim()} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <SectionLabel>{list.length} oportunidades</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((o) => (
          <Card key={o.id} pad="sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <p style={{ fontWeight: 600, color: 'var(--cmic-navy-deep)', flex: 1 }}>{o.title}</p>
              <Chip tone={o.status}>{o.status === 'warn' ? 'Por vencer' : 'Abierta'}</Chip>
            </div>
            <p className="cmic-caption" style={{ marginTop: 6 }}><Icon name="account_balance" style={{ fontSize: 14 }} /> {o.entity}</p>
            <p className="cmic-caption"><Icon name="location_on" style={{ fontSize: 14 }} /> {o.location}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div>
                <p className="cmic-caption">Monto estimado</p>
                <p style={{ fontWeight: 700 }}>{fmtCurrency(o.amount)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Chip tone="navy">{o.category}</Chip>
                <p className="cmic-caption" style={{ marginTop: 4 }}>{o.deadline}</p>
              </div>
            </div>
            <button className="cmic-btn cmic-btn--primary cmic-btn--sm" style={{ marginTop: 12 }}>Ver bases</button>
          </Card>
        ))}
      </div>
    </div>
  );
};

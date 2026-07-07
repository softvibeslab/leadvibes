import React, { useState } from 'react';
import { Card, Icon, SectionLabel } from '../cmicAppKit';

// NOTA: aún no existe endpoint /copim/member-portal/indicators en el backend.
// Datos de DEMOSTRACIÓN claramente etiquetados; sustituir por el endpoint real cuando exista.
const KPIS = [
  { label: 'Valor de producción', value: '$45,200 M', delta: '+4.2%', up: true },
  { label: 'Empleo en construcción', value: '485 mil', delta: '-1.1%', up: false },
  { label: 'Inversión pública', value: '$12,800 M', delta: '+2.8%', up: true },
  { label: 'Confianza del sector', value: '52.4 pts', delta: 'Estable', up: true },
];

const REPORTS = [
  { label: 'Reporte CEICO Mensual', period: 'Mensual' },
  { label: 'Reporte CEESCO Trimestral', period: 'Trimestral' },
];

const PERIODS = ['Mensual', 'Trimestral', 'Anual'];

export const CmicIndicators = () => {
  const [period, setPeriod] = useState('Mensual');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card pad="sm" style={{ borderColor: 'var(--cmic-warn)', background: 'var(--cmic-warn-container)' }}>
        <p className="cmic-body" style={{ color: 'var(--cmic-warn)', fontWeight: 600 }}>
          <Icon name="info" style={{ fontSize: 16 }} /> Vista previa con datos de ejemplo
        </p>
        <p className="cmic-caption" style={{ marginTop: 4 }}>
          Los indicadores reales se conectarán al publicarse el endpoint de inteligencia sectorial.
        </p>
      </Card>

      <div className="cmic-chiprow">
        {PERIODS.map((p) => (
          <button key={p} className={`cmic-filter ${period === p ? 'cmic-filter--active' : ''}`.trim()} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {KPIS.map((k) => (
          <Card key={k.label} pad="sm">
            <p className="cmic-caption">{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--cmic-navy-deep)', marginTop: 4 }}>{k.value}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: k.up ? 'var(--cmic-tertiary)' : 'var(--cmic-error)', marginTop: 2 }}>
              <Icon name={k.up ? 'trending_up' : 'trending_down'} style={{ fontSize: 16 }} /> {k.delta}
            </p>
          </Card>
        ))}
      </div>

      <div>
        <SectionLabel>Reportes</SectionLabel>
        <Card pad="none">
          {REPORTS.map((r) => (
            <div key={r.label} className="cmic-list-item">
              <span className="cmic-quick__icon" style={{ marginBottom: 0 }}><Icon name="picture_as_pdf" /></span>
              <div style={{ flex: 1 }}>
                <p className="cmic-body" style={{ fontWeight: 500 }}>{r.label}</p>
                <p className="cmic-caption">{r.period}</p>
              </div>
              <button className="cmic-btn cmic-btn--ghost cmic-btn--sm"><Icon name="download" style={{ fontSize: 18 }} /></button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

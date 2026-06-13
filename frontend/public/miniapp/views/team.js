// Pantalla Equipo (solo agency_admin, spec §3.6): leaderboard + agency-executive
// + tareas vencidas del tenant. Oculta por UI para broker (gate backend pendiente, F8).

import { fetchLeaderboard, fetchAgencyExecutive, fetchTasks, isAdminRole } from '../api.js';
import { el, esc, fmtMoney, skeletonList, emptyState, errorBlock } from '../ui.js';

let container = null;
let ctx = null;

// Cifra compacta para las metric cards del resumen ejecutivo (wireframe §7.3: "$4.2M").
function fmtMoneyShort(n) {
  const num = Number(n);
  if (!n || Number.isNaN(num)) return '';
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toLocaleString('es-MX', { maximumFractionDigits: 1 })}M`;
  if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`;
  return fmtMoney(num);
}

export function render(node, context) {
  container = node;
  ctx = context;

  if (!isAdminRole()) {
    container.innerHTML = `<h1 class="screen-title">Equipo</h1>${emptyState('Tu rol no tiene acceso a este módulo.')}`;
    return;
  }

  container.innerHTML = `
    <h1 class="screen-title">Equipo</h1>
    <p class="screen-sub">Desempeño del mes y riesgos del día</p>
    <div class="section">
      <div class="section-head"><h2>Resumen ejecutivo</h2></div>
      <div id="teamOverview">${skeletonList(1)}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Leaderboard</h2></div>
      <div id="teamBoard">${skeletonList(3)}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Riesgos</h2></div>
      <div id="teamRisks">${skeletonList(1)}</div>
    </div>`;

  loadOverview(container.querySelector('#teamOverview'));
  loadLeaderboard(container.querySelector('#teamBoard'));
  loadRisks(container.querySelector('#teamRisks'));
}

async function loadOverview(box) {
  box.innerHTML = skeletonList(1);
  try {
    const data = await fetchAgencyExecutive();
    const o = data?.overview || {};
    box.innerHTML = `
      <div class="stat-grid">
        <div class="stat"><span class="msi fill accent" aria-hidden="true">person_search</span><b class="metric-num">${
          o.total_prospects ?? 0
        }</b><small>Prospectos</small></div>
        <div class="stat"><span class="msi fill accent" aria-hidden="true">task_alt</span><b class="metric-num">${
          o.qualified_leads ?? 0
        }</b><small>Calificados</small></div>
        <div class="stat"><span class="msi fill accent" aria-hidden="true">star</span><b class="metric-num">${
          o.opportunities ?? 0
        }</b><small>Oportunidades</small></div>
        <div class="stat"><span class="msi fill accent" aria-hidden="true">trending_up</span><b class="metric-num">${
          o.conversion_rate ?? 0
        }%</b><small>Conversión</small></div>
        <div class="stat"><span class="msi fill accent" aria-hidden="true">payments</span><b class="metric-num brand">${
          fmtMoneyShort(o.closed_revenue) || '$0'
        }</b><small>Cerrado</small></div>
        <div class="stat"><span class="msi fill accent" aria-hidden="true">speed</span><b class="metric-num">${
          o.sales_velocity_days ?? 0
        } d</b><small>Velocidad</small></div>
      </div>`;
  } catch (err) {
    box.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message);
    box.querySelector('[data-retry]')?.addEventListener('click', () => loadOverview(box));
  }
}

async function loadLeaderboard(box) {
  box.innerHTML = skeletonList(3);
  try {
    const rows = await fetchLeaderboard();
    if (!rows?.length) {
      box.innerHTML = emptyState('Aún no tienes equipo en este workspace. Invita brokers desde ROVI web.');
      return;
    }
    box.innerHTML = '';
    rows.forEach((b, i) => {
      const rank = b.rank || i + 1;
      box.append(
        el(`
        <article class="card rank-row ${rank <= 3 ? 'top' : ''}">
          <span class="rank-num">${rank}</span>
          <div class="rank-info">
            <b>${esc(b.broker_name || 'Broker')}</b>
            <small>${b.ventas ?? 0} ventas · ${b.apartados ?? 0} apartados · ${b.leads_asignados ?? 0} leads</small>
          </div>
          <span class="rank-points">${b.total_points ?? 0} pts</span>
        </article>`)
      );
    });
  } catch (err) {
    box.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message);
    box.querySelector('[data-retry]')?.addEventListener('click', () => loadLeaderboard(box));
  }
}

async function loadRisks(box) {
  box.innerHTML = skeletonList(1);
  try {
    const data = await fetchTasks('overdue');
    const overdue = data?.tasks || [];
    if (!overdue.length) {
      box.innerHTML = '<div class="empty">Sin tareas vencidas en el equipo. Buen ritmo.</div>';
      return;
    }
    box.innerHTML = '';
    box.append(el(`<div class="notice">${overdue.length} tarea(s) vencida(s) en el tenant.</div>`));
    for (const task of overdue.slice(0, 6)) {
      box.append(
        el(`<article class="card">
          <div class="card-head">
            <strong>${esc(task.title)}</strong>
            <span class="tag pr-alta">Vencida</span>
          </div>
          ${task.assigned_to_name ? `<p>Responsable: ${esc(task.assigned_to_name)}</p>` : ''}
        </article>`)
      );
    }
  } catch (err) {
    box.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message);
    box.querySelector('[data-retry]')?.addEventListener('click', () => loadRisks(box));
  }
}

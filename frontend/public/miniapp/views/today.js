// Pantalla "Hoy": leads calientes, tareas del día y próximas citas (spec §3.1).
// 3 fetches en paralelo con fallo parcial por sección.

import {
  fetchLeads,
  fetchTasks,
  fetchTodayEvents,
  updateTaskStatus,
  filterVisibleLeads,
  isAdminRole,
  getUser
} from '../api.js';
import { STATUS_LABELS } from '../constants.js';
import {
  el,
  esc,
  fmtMoney,
  fmtTime,
  timeAgo,
  firstName,
  skeletonList,
  emptyState,
  errorBlock,
  toast,
  haptic
} from '../ui.js';

let ctx = null;

export function render(container, context) {
  ctx = context;
  const user = getUser();
  container.innerHTML = `
    <h1 class="screen-title">Hola, ${esc(firstName(user?.name || '') || 'crack')}</h1>
    <p class="screen-sub">${isAdminRole() ? 'Command center de tu agencia' : 'Tu foco de hoy en ROVI'}</p>
    <div id="todayHero"></div>
    <div class="section">
      <div class="section-head"><h2>Leads calientes</h2></div>
      <div id="todayHot">${skeletonList(2)}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Tareas del día</h2></div>
      <div id="todayTasks">${skeletonList(2)}</div>
    </div>
    <div class="section">
      <div class="section-head"><h2>Próximas citas</h2></div>
      <div id="todayEvents">${skeletonList(1)}</div>
    </div>`;

  const fab = el('<button class="fab" aria-label="Hablar con el agente ROVI"><span aria-hidden="true">+</span></button>');
  fab.addEventListener('click', () => ctx.navigate('chat'));
  container.append(fab);

  loadHotLeads(container.querySelector('#todayHot'), container.querySelector('#todayHero'));
  loadTasks(container.querySelector('#todayTasks'));
  loadEvents(container.querySelector('#todayEvents'));
}

async function loadHotLeads(section, heroBox) {
  section.innerHTML = skeletonList(2);
  try {
    const data = await fetchLeads({
      priority: ['alta', 'urgente'],
      status: ['nuevo', 'contactado', 'calificacion'],
      sort_by: 'updated_at',
      page_size: 10
    });
    const hot = filterVisibleLeads(data.leads);
    renderHero(heroBox, hot, data.total);
    if (!hot.length) {
      section.innerHTML = emptyState('Sin leads calientes ahora. Revisa seguimientos pendientes.', 'Ir a Leads');
      section.querySelector('[data-empty-cta]')?.addEventListener('click', () => ctx.navigate('leads'));
      return;
    }
    section.innerHTML = '';
    for (const lead of hot.slice(0, 5)) {
      const card = el(`
        <article class="card tappable">
          <div class="card-head">
            <strong>${esc(lead.name)}</strong>
            <span class="tag pr-${esc(lead.priority || 'media')}">${esc(lead.priority || '')}</span>
          </div>
          <p>${esc(lead.property_interest || lead.preferred_zone || 'Sin interés registrado')}${
            lead.budget_mxn ? ` · ${fmtMoney(lead.budget_mxn)}` : ''
          }</p>
          <div class="meta">${esc(STATUS_LABELS[lead.status] || lead.status)} · ${esc(timeAgo(lead.updated_at))}</div>
        </article>`);
      card.addEventListener('click', () => ctx.navigate('leads', { leadId: lead.id }));
      section.append(card);
    }
  } catch (err) {
    renderSectionError(section, err, () => loadHotLeads(section, heroBox));
  }
}

function renderHero(heroBox, hotLeads, total) {
  if (!heroBox) return;
  if (isAdminRole()) {
    heroBox.innerHTML = `
      <div class="stat-grid cols-2" style="margin-bottom:10px">
        <div class="stat">
          <div class="stat-top"><span class="stat-ic msi fill" aria-hidden="true">person_search</span></div>
          <b class="metric-num">${total ?? hotLeads.length}</b>
          <small>Leads activos</small>
        </div>
        <div class="stat">
          <div class="stat-top"><span class="stat-ic msi fill" aria-hidden="true">trending_up</span></div>
          <b class="metric-num">${hotLeads.length}</b>
          <small>Pipeline caliente</small>
        </div>
      </div>
      <div class="card hero-card">
        <p class="eyebrow">Command center</p>
        <h3>${total ?? hotLeads.length} leads activos en pipeline caliente</h3>
        <p>Revisa el desempeño del equipo y los riesgos del día.</p>
        <div class="actions">
          <button class="btn btn-ghost" data-team>Ver equipo</button>
          <button class="btn btn-ghost" data-leads>Ver leads</button>
        </div>
      </div>`;
    heroBox.querySelector('[data-team]')?.addEventListener('click', () => ctx.navigate('team'));
    heroBox.querySelector('[data-leads]')?.addEventListener('click', () => ctx.navigate('leads'));
    return;
  }
  const top = hotLeads[0];
  if (!top) {
    heroBox.innerHTML = '';
    return;
  }
  heroBox.innerHTML = `
    <div class="card hero-card">
      <p class="eyebrow">Tu prioridad ahora</p>
      <h3>${esc(top.name)}</h3>
      <p>${esc(top.next_action || top.property_interest || 'Dale seguimiento hoy.')}</p>
      <div class="actions">
        <button class="btn btn-ghost" data-open>Abrir lead</button>
      </div>
    </div>`;
  heroBox.querySelector('[data-open]')?.addEventListener('click', () => ctx.navigate('leads', { leadId: top.id }));
}

async function loadTasks(section) {
  section.innerHTML = skeletonList(2);
  try {
    const [todayRes, overdueRes] = await Promise.all([fetchTasks('today'), fetchTasks('overdue')]);
    const todayTasks = todayRes?.tasks || [];
    const overdue = overdueRes?.tasks || [];
    section.innerHTML = '';
    if (overdue.length) {
      section.append(el(`<div class="notice">${overdue.length} tarea(s) vencida(s) sin cerrar.</div>`));
    }
    const all = [...overdue.map((t) => ({ ...t, _overdue: true })), ...todayTasks];
    if (!all.length) {
      section.innerHTML = emptyState('Día despejado. Sin tareas para hoy.', 'Crear tarea con el agente');
      section.querySelector('[data-empty-cta]')?.addEventListener('click', () =>
        ctx.navigate('chat', { draft: 'crea tarea para hoy: ' })
      );
      return;
    }
    for (const task of all.slice(0, 8)) {
      const card = el(`
        <article class="card task-row${task._overdue ? ' overdue' : ''}">
          <button class="task-check" data-done aria-label="Marcar hecha: ${esc(task.title)}"></button>
          <div class="task-body">
            <strong>${esc(task.title)}</strong>
            ${task.lead_name ? `<p>Lead: ${esc(task.lead_name)}</p>` : ''}
          </div>
          <span class="tag ${task._overdue ? 'overdue' : `pr-${esc(task.priority || 'media')}`}">${
            task._overdue ? 'Vencida' : esc(task.priority || 'media')
          }</span>
        </article>`);
      card.querySelector('[data-done]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          await updateTaskStatus(task.id, 'completada');
          haptic('success');
          card.remove();
          toast('Tarea completada', 'success');
        } catch (err) {
          btn.disabled = false;
          toast(err.message || 'No pude actualizar la tarea', 'error');
        }
      });
      section.append(card);
    }
  } catch (err) {
    renderSectionError(section, err, () => loadTasks(section));
  }
}

async function loadEvents(section) {
  section.innerHTML = skeletonList(1);
  try {
    const events = await fetchTodayEvents();
    if (!events?.length) {
      section.innerHTML = emptyState('Sin citas hoy.', 'Agendar seguimiento');
      section.querySelector('[data-empty-cta]')?.addEventListener('click', () => ctx.navigate('agenda'));
      return;
    }
    section.innerHTML = '';
    for (const ev of events) {
      const card = el(`
        <article class="card tappable">
          <div class="card-head">
            <strong><span class="msi sm accent" aria-hidden="true">schedule</span> ${esc(fmtTime(ev.start_time))} · ${esc(
              ev.title
            )}</strong>
            <span class="tag">${esc(ev.event_type || 'evento')}</span>
          </div>
          ${ev.lead?.name ? `<p>Con: ${esc(ev.lead.name)}</p>` : ''}
        </article>`);
      card.addEventListener('click', () => ctx.navigate('agenda'));
      section.append(card);
    }
  } catch (err) {
    renderSectionError(section, err, () => loadEvents(section));
  }
}

function renderSectionError(section, err, retry) {
  section.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message || 'Error al cargar');
  section.querySelector('[data-retry]')?.addEventListener('click', retry);
}

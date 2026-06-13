// Pantalla Agenda: eventos propios agrupados por día + "Preparar reunión"
// vía POST /api/ai-agent/run (spec §3.3 — no existe endpoint dedicado).

import { fetchEvents, runAgent } from '../api.js';
import { EVENT_TYPE_LABELS } from '../constants.js';
import {
  el,
  esc,
  fmtTime,
  fmtDay,
  fmtDateTime,
  skeletonList,
  emptyState,
  errorBlock,
  copyText,
  openSheet,
  haptic
} from '../ui.js';
import { loadPendingActions, actionCardEl, unavailableNotice } from '../actions.js';

const RANGE_DAYS = 14;
let ctx = null;
let container = null;

export function render(node, context) {
  container = node;
  ctx = context;
  container.innerHTML = `
    <h1 class="screen-title">Agenda</h1>
    <p class="screen-sub">Tus próximos ${RANGE_DAYS} días${ctxIsAdmin() ? ' (solo tu agenda en esta versión)' : ''}</p>
    <div id="agendaList">${skeletonList(3)}</div>`;
  loadAgenda();
}

function ctxIsAdmin() {
  return Boolean(ctx?.isAdmin);
}

async function loadAgenda() {
  const box = container.querySelector('#agendaList');
  box.innerHTML = skeletonList(3);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + RANGE_DAYS * 86400000);

  try {
    const events = await fetchEvents(start.toISOString(), end.toISOString());
    if (!events?.length) {
      box.innerHTML = emptyState('Sin citas en los próximos días.', 'Agendar con el agente');
      box.querySelector('[data-empty-cta]')?.addEventListener('click', () =>
        ctx.navigate('chat', { draft: 'agenda una cita: ' })
      );
      return;
    }
    box.innerHTML = '';
    const groups = new Map();
    for (const ev of events) {
      const key = new Date(ev.start_time).toDateString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(ev);
    }
    for (const [, dayEvents] of groups) {
      const group = el(
        `<div class="day-group"><h3><span class="msi sm accent" aria-hidden="true">calendar_today</span>${esc(
          fmtDay(dayEvents[0].start_time)
        )}</h3></div>`
      );
      for (const ev of dayEvents) {
        group.append(eventCardEl(ev));
      }
      box.append(group);
    }
  } catch (err) {
    box.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message || 'Error al cargar agenda');
    box.querySelector('[data-retry]')?.addEventListener('click', loadAgenda);
  }
}

function eventCardEl(ev) {
  const typeLabel = EVENT_TYPE_LABELS[ev.event_type] || ev.event_type || 'Evento';
  const card = el(`
    <article class="card">
      <div class="card-head">
        <strong><span class="msi sm accent" aria-hidden="true">schedule</span> ${esc(fmtTime(ev.start_time))} · ${esc(
          ev.title
        )}</strong>
        <span class="tag">${esc(typeLabel)}</span>
      </div>
      ${ev.lead?.name ? `<p>Con: ${esc(ev.lead.name)}${ev.lead.phone ? ` · ${esc(ev.lead.phone)}` : ''}</p>` : ''}
      ${ev.synced_to_google ? '<div class="meta"><span class="tag ok">Sincronizado con Google</span></div>' : ''}
      <div class="actions">
        <button class="btn btn-primary" data-prep>Preparar reunión</button>
      </div>
    </article>`);
  card.querySelector('[data-prep]').addEventListener('click', () => prepareMeeting(ev));
  return card;
}

async function prepareMeeting(ev) {
  haptic('medium');
  const content = el(
    `<div>
      <p class="screen-sub">El agente está armando el brief (puede tardar hasta 1 minuto)…</p>
      <div class="typing" style="padding:6px 0 14px"><i></i><i></i><i></i></div>
      <div class="skeleton sk-line"></div>
      <div class="skeleton sk-line"></div>
      <div class="skeleton sk-line short"></div>
    </div>`
  );
  const sheet = openSheet(content, { title: `Preparar: ${ev.title}` });

  const message =
    `prepara la reunión '${ev.title}' del ${fmtDateTime(ev.start_time)}` +
    (ev.lead?.name ? ` con el lead ${ev.lead.name}` : '');

  try {
    const res = await runAgent(message);
    const text = res?.response || 'El agente no devolvió contenido. Reintenta.';
    content.innerHTML = `
      <div class="draft-box" style="max-height:46dvh;overflow-y:auto">${esc(text)}</div>
      <div class="actions">
        <button class="btn btn-primary" data-copy>Copiar brief</button>
      </div>
      <div id="prepActions" style="margin-top:12px"></div>`;
    content.querySelector('[data-copy]').addEventListener('click', () => copyText(text, 'Brief copiado'));
    // Si el run dejó acciones pending_confirmation (p.ej. tarea de seguimiento), píntalas aquí.
    renderPrepActions(content.querySelector('#prepActions'));
  } catch (err) {
    content.innerHTML = `<div class="error-block">${
      err?.isNetwork ? 'El agente tardó demasiado. Reintenta.' : esc(err?.message || 'Error del agente')
    }<br /><button class="btn" data-retry>Reintentar</button></div>`;
    content.querySelector('[data-retry]').addEventListener('click', () => {
      sheet.close();
      prepareMeeting(ev);
    });
  }
}

async function renderPrepActions(box) {
  if (!box) return;
  const result = await loadPendingActions();
  if (result.unavailable) {
    box.append(unavailableNotice());
    return;
  }
  if (!result.ok || !result.actions.length) return;
  box.append(el('<div class="notice">El agente propuso acciones que requieren tu aprobación:</div>'));
  for (const action of result.actions) {
    box.append(actionCardEl(action));
  }
}

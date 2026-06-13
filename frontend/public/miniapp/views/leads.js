// Pantalla Leads: lista con búsqueda/filtro por status, detalle, cambio de
// status del pipeline y "Copiar mensaje WhatsApp" (spec §3.2).

import {
  fetchLeads,
  fetchLead,
  updateLead,
  runAgent,
  filterVisibleLeads,
  leadVisibleForUser,
  isAdminRole,
  getUser,
  getWorkspaceName,
  ApiError
} from '../api.js';
import { LEAD_STATUSES, STATUS_LABELS, FINAL_STATUSES } from '../constants.js';
import {
  el,
  esc,
  fmtMoney,
  fmtDateTime,
  timeAgo,
  firstName,
  skeletonList,
  emptyState,
  errorBlock,
  toast,
  haptic,
  copyText,
  openSheet,
  confirmDialog,
  pushBack,
  removeBack
} from '../ui.js';

const listState = { search: '', status: '', page: 1, items: [], total: 0, totalPages: 1, loading: false };
let container = null;
let ctx = null;
let backHandler = null;
let searchTimer = null;

export function render(node, context) {
  container = node;
  ctx = context;
  if (context?.params?.leadId) {
    renderDetail(context.params.leadId, { fromDeepLink: !context.params.fromList });
    return;
  }
  renderList();
}

// ---------- Lista ----------

function renderList() {
  clearDetailBack();
  container.innerHTML = `
    <h1 class="screen-title">Leads</h1>
    <div class="search-row">
      <input id="leadSearch" class="input" type="search" placeholder="Buscar por nombre, teléfono o zona" value="${esc(listState.search)}" />
    </div>
    <div class="chip-row" id="leadChips"></div>
    <div id="leadList" class="list"></div>
    <div id="leadMore"></div>`;

  const fab = el('<button class="fab" aria-label="Crear lead con el agente"><span aria-hidden="true">+</span></button>');
  fab.addEventListener('click', () =>
    ctx.navigate('chat', { draft: 'crea un lead: nombre, teléfono, zona y presupuesto → ' })
  );
  container.append(fab);

  const chips = container.querySelector('#leadChips');
  const allChip = el(`<button class="chip ${!listState.status ? 'active' : ''}">Todos</button>`);
  allChip.addEventListener('click', () => setStatusFilter(''));
  chips.append(allChip);
  for (const st of LEAD_STATUSES) {
    const chip = el(`<button class="chip ${listState.status === st.value ? 'active' : ''}">${esc(st.label)}</button>`);
    chip.addEventListener('click', () => setStatusFilter(st.value));
    chips.append(chip);
  }

  container.querySelector('#leadSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      listState.search = e.target.value.trim();
      listState.page = 1;
      loadLeads(false);
    }, 350);
  });

  loadLeads(false);
}

function setStatusFilter(status) {
  listState.status = status;
  listState.page = 1;
  haptic('light');
  renderList();
}

async function loadLeads(append) {
  if (listState.loading) return;
  listState.loading = true;
  const listEl = container.querySelector('#leadList');
  const moreEl = container.querySelector('#leadMore');
  if (!append) listEl.innerHTML = skeletonList(4);
  if (moreEl) moreEl.innerHTML = '';

  try {
    const data = await fetchLeads({
      search: listState.search,
      status: listState.status ? [listState.status] : [],
      page: listState.page,
      page_size: 20
    });
    // F4: el backend no excluye deleted; F3: scope broker espejo en cliente.
    const visible = filterVisibleLeads(data.leads);
    listState.items = append ? [...listState.items, ...visible] : visible;
    listState.total = data.total || 0;
    listState.totalPages = data.total_pages || 1;
    paintLeadList(listEl, moreEl);
  } catch (err) {
    listEl.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message || 'Error al cargar leads');
    listEl.querySelector('[data-retry]')?.addEventListener('click', () => loadLeads(false));
  } finally {
    listState.loading = false;
  }
}

function paintLeadList(listEl, moreEl) {
  if (!listState.items.length) {
    listEl.innerHTML = emptyState('No hay leads con esos filtros.', 'Crear lead con el agente');
    listEl.querySelector('[data-empty-cta]')?.addEventListener('click', () =>
      ctx.navigate('chat', { draft: 'crea un lead: nombre, teléfono, zona y presupuesto → ' })
    );
    return;
  }
  listEl.innerHTML = '';
  for (const lead of listState.items) {
    listEl.append(leadCardEl(lead));
  }
  if (listState.page < listState.totalPages) {
    moreEl.innerHTML = '<button class="btn btn-ghost btn-block" style="margin-top:10px">Cargar más</button>';
    moreEl.querySelector('button').addEventListener('click', () => {
      listState.page += 1;
      loadLeads(true);
    });
  } else {
    moreEl.innerHTML = '';
  }
}

function leadCardEl(lead) {
  const card = el(`
    <article class="card tappable">
      <div class="card-head">
        <strong style="font-size:16px">${esc(lead.name)}</strong>
        <span class="tag st-${esc(lead.status)}">${esc(STATUS_LABELS[lead.status] || lead.status)}</span>
      </div>
      <div class="lead-grid">
        <div>
          <small>Presupuesto</small>
          <span class="metric-num brand">${fmtMoney(lead.budget_mxn) || '—'}</span>
        </div>
        <div>
          <small>Interés</small>
          <span>${esc(lead.property_interest || lead.preferred_zone || '—')}</span>
        </div>
      </div>
      <div class="lead-foot">
        <span class="meta">${esc(lead.priority || '')} · ${esc(timeAgo(lead.updated_at || lead.created_at))}</span>
        <button class="btn btn-secondary" data-wa>Copiar WhatsApp</button>
      </div>
    </article>`);
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-wa]')) return;
    renderDetail(lead.id, { fromList: true });
  });
  card.querySelector('[data-wa]').addEventListener('click', () => {
    copyText(buildWhatsappMessage(lead), 'Mensaje de WhatsApp copiado');
  });
  return card;
}

// ---------- Detalle ----------

function clearDetailBack() {
  if (backHandler) {
    removeBack(backHandler);
    backHandler = null;
  }
}

async function renderDetail(leadId, { fromDeepLink = false } = {}) {
  clearDetailBack();
  backHandler = () => renderList();
  pushBack(backHandler);

  container.innerHTML = `
    <button class="btn btn-ghost" data-back style="margin-bottom:12px">&#8592; Leads</button>
    <div id="leadDetail">${skeletonList(3)}</div>`;
  container.querySelector('[data-back]').addEventListener('click', () => renderList());

  const box = container.querySelector('#leadDetail');
  let lead;
  try {
    lead = await fetchLead(leadId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      box.innerHTML = emptyState('Lead no encontrado (pudo ser eliminado).', 'Volver a la lista');
      box.querySelector('[data-empty-cta]')?.addEventListener('click', () => renderList());
    } else {
      box.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message);
      box.querySelector('[data-retry]')?.addEventListener('click', () => renderDetail(leadId, { fromDeepLink }));
    }
    return;
  }

  if (!isAdminRole() && !leadVisibleForUser(lead) && !fromDeepLink) {
    box.innerHTML = emptyState('Este lead no está asignado a ti.');
    return;
  }

  const canEdit = leadVisibleForUser(lead) || isAdminRole();
  const waAllowed = lead.phone && !lead.whatsapp_opt_out;

  box.innerHTML = `
    <article class="card">
      <div class="card-head">
        <strong style="font-size:18px">${esc(lead.name)}</strong>
        <button class="tag st-${esc(lead.status)}" id="statusChip" ${canEdit ? '' : 'disabled'}
          style="border:0;cursor:${canEdit ? 'pointer' : 'default'};min-height:32px">
          ${esc(STATUS_LABELS[lead.status] || lead.status)}${canEdit ? ' &#9662;' : ''}
        </button>
      </div>
      <div class="field-grid">
        <div><small>Teléfono</small><span>${esc(lead.phone || '—')}</span></div>
        <div><small>Email</small><span>${esc(lead.email || '—')}</span></div>
        <div><small>Prioridad</small><span>${esc(lead.priority || '—')}</span></div>
        <div><small>Fuente</small><span>${esc(lead.source || '—')}</span></div>
        <div><small>Presupuesto</small><span class="link">${fmtMoney(lead.budget_mxn) || '—'}</span></div>
        <div><small>Zona</small><span>${esc(lead.preferred_zone || '—')}</span></div>
        <div><small>Interés</small><span>${esc(lead.property_interest || '—')}</span></div>
        <div><small>Último contacto</small><span>${esc(fmtDateTime(lead.last_contact) || '—')}</span></div>
      </div>
      ${lead.next_action ? `<p style="margin-top:10px"><b>Siguiente acción:</b> ${esc(lead.next_action)}</p>` : ''}
      ${lead.notes ? `<p>${esc(lead.notes)}</p>` : ''}
      ${lead.assigned_broker?.name ? `<div class="meta">Asignado a: ${esc(lead.assigned_broker.name)}</div>` : ''}
      <div class="actions">
        <button class="btn btn-primary" data-wa-copy>Copiar WhatsApp</button>
        <button class="btn btn-accent" data-wa-agent>Mensaje con agente</button>
        ${waAllowed ? '<button class="btn btn-secondary" data-wa-open>Abrir WhatsApp</button>' : ''}
      </div>
    </article>
    <div class="section">
      <div class="section-head"><h2>Actividad reciente</h2></div>
      <div id="leadActivities"></div>
    </div>`;

  const statusChip = box.querySelector('#statusChip');
  if (canEdit) statusChip.addEventListener('click', () => openStatusSheet(lead, statusChip));

  box.querySelector('[data-wa-copy]').addEventListener('click', () => {
    copyText(buildWhatsappMessage(lead), 'Mensaje de WhatsApp copiado');
  });
  box.querySelector('[data-wa-agent]')?.addEventListener('click', () => generateAgentWhatsapp(lead));
  box.querySelector('[data-wa-open]')?.addEventListener('click', () => {
    haptic('light');
    const phone = String(lead.phone).replace(/[^\d+]/g, '').replace(/^\+/, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsappMessage(lead))}`;
    try {
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openLink) webApp.openLink(url);
      else window.open(url, '_blank');
    } catch {
      window.open(url, '_blank');
    }
  });

  const actBox = box.querySelector('#leadActivities');
  const activities = lead.activities || [];
  if (!activities.length) {
    actBox.innerHTML = '<div class="empty">Sin actividad registrada.</div>';
  } else {
    actBox.innerHTML = activities
      .slice(0, 10)
      .map(
        (a) => `<article class="card"><p style="margin:0">${esc(a.description || a.activity_type || 'Actividad')}</p>
          <div class="meta">${esc(fmtDateTime(a.created_at))}</div></article>`
      )
      .join('');
  }
}

// ---------- Cambio de status ----------

function openStatusSheet(lead, statusChip) {
  const content = el('<div></div>');
  for (const st of LEAD_STATUSES) {
    const current = st.value === lead.status;
    const btn = el(
      `<button class="btn option-btn ${current ? 'btn-secondary' : 'btn-ghost'}">
        <span>${esc(st.label)}</span>${current ? '<span class="tag ok">Actual</span>' : ''}
      </button>`
    );
    btn.addEventListener('click', () => sheet.close() || changeStatus(lead, st.value, statusChip));
    content.append(btn);
  }
  const sheet = openSheet(content, { title: 'Mover en el pipeline' });
}

async function changeStatus(lead, newStatus, statusChip) {
  if (newStatus === lead.status) return;
  if (FINAL_STATUSES.includes(newStatus)) {
    const ok = await confirmDialog(
      newStatus === 'venta' ? '¿Marcar este lead como VENTA? Es fin de pipeline.' : '¿Marcar este lead como PERDIDO?'
    );
    if (!ok) return;
  }
  const prev = lead.status;
  // Optimista
  lead.status = newStatus;
  statusChip.className = `tag st-${newStatus}`;
  statusChip.innerHTML = `${esc(STATUS_LABELS[newStatus])} &#9662;`;
  try {
    await updateLead(lead.id, { status: newStatus });
    haptic('success');
    toast(`Lead movido a ${STATUS_LABELS[newStatus]}`, 'success');
    const cached = listState.items.find((l) => l.id === lead.id);
    if (cached) cached.status = newStatus;
  } catch (err) {
    lead.status = prev;
    statusChip.className = `tag st-${prev}`;
    statusChip.innerHTML = `${esc(STATUS_LABELS[prev])} &#9662;`;
    if (err instanceof ApiError && err.status === 404) {
      toast('El lead ya no existe', 'error');
      renderList();
    } else {
      toast(err.message || 'No pude actualizar. Reintenta.', 'error');
    }
  }
}

// ---------- WhatsApp ----------

export function buildWhatsappMessage(lead) {
  const user = getUser();
  const ws = getWorkspaceName();
  const zona = lead.preferred_zone ? ` en ${lead.preferred_zone}` : '';
  const interes = lead.property_interest ? ` (${lead.property_interest})` : '';
  const budget = lead.budget_mxn ? ` dentro de tu presupuesto de ${fmtMoney(lead.budget_mxn)}` : '';
  return (
    `Hola ${firstName(lead.name)}, soy ${firstName(user?.name || '') || 'tu asesor'}${ws ? ` de ${ws}` : ' de ROVI'}. ` +
    `Te doy seguimiento a tu búsqueda${zona}${interes}. ` +
    `Tengo opciones que sí hacen match${budget}. ¿Sigue activa tu búsqueda para mandártelas hoy?`
  );
}

async function generateAgentWhatsapp(lead) {
  const content = el(
    `<div><div class="typing" style="padding:10px 0"><i></i><i></i><i></i></div>
      <p class="screen-sub">El agente está redactando el mensaje…</p></div>`
  );
  const sheet = openSheet(content, { title: 'Mensaje con agente' });
  try {
    const res = await runAgent(`prepara un mensaje corto de WhatsApp de seguimiento para el lead ${lead.name}`);
    const text = res?.response || buildWhatsappMessage(lead);
    content.innerHTML = `<div class="draft-box">${esc(text)}</div>
      <div class="actions"><button class="btn btn-primary btn-block" data-copy>Copiar mensaje</button></div>`;
    content.querySelector('[data-copy]').addEventListener('click', () => copyText(text, 'Mensaje copiado'));
  } catch (err) {
    content.innerHTML = `<div class="error-block">El agente no está disponible (${esc(err.message || 'error')}).
      Usa la plantilla rápida.</div>
      <div class="draft-box">${esc(buildWhatsappMessage(lead))}</div>
      <div class="actions"><button class="btn btn-primary btn-block" data-copy>Copiar plantilla</button></div>`;
    content.querySelector('[data-copy]').addEventListener('click', () =>
      copyText(buildWhatsappMessage(lead), 'Plantilla copiada')
    );
  }
}

// Pantalla Propiedades: inventario activo del tenant (solo lectura en MVP)
// + "Sugerir match" para un lead vía agente (spec §3.4, hallazgo F7).

import { fetchProducts, fetchLeads, runAgent, filterVisibleLeads } from '../api.js';
import { STATUS_LABELS } from '../constants.js';
import {
  el,
  esc,
  fmtMoney,
  skeletonList,
  emptyState,
  errorBlock,
  copyText,
  openSheet,
  haptic
} from '../ui.js';
import { loadPendingActions, actionCardEl, unavailableNotice } from '../actions.js';

let container = null;
let ctx = null;
let searchTimer = null;
let currentSearch = '';

export function render(node, context) {
  container = node;
  ctx = context;
  container.innerHTML = `
    <h1 class="screen-title">Propiedades</h1>
    <div class="search-row">
      <input id="propSearch" class="input" type="search" placeholder="Buscar por título, zona o nicho" value="${esc(currentSearch)}" />
    </div>
    <div id="propList" class="list">${skeletonList(3)}</div>`;

  const fab = el('<button class="fab" aria-label="Pedir propiedades al agente"><span aria-hidden="true">+</span></button>');
  fab.addEventListener('click', () => ctx.navigate('chat', { draft: 'busca propiedades: ' }));
  container.append(fab);

  container.querySelector('#propSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = e.target.value.trim();
      loadProperties();
    }, 350);
  });

  loadProperties();
}

async function loadProperties() {
  const box = container.querySelector('#propList');
  box.innerHTML = skeletonList(3);
  try {
    const products = await fetchProducts({ search: currentSearch });
    if (!products?.length) {
      box.innerHTML = emptyState(
        currentSearch ? 'Sin propiedades con esa búsqueda.' : 'Sin propiedades activas. Créalas desde ROVI web.'
      );
      return;
    }
    box.innerHTML = '';
    for (const p of products) {
      box.append(propertyCardEl(p));
    }
  } catch (err) {
    box.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message || 'Error al cargar inventario');
    box.querySelector('[data-retry]')?.addEventListener('click', loadProperties);
  }
}

function coverUrl(p) {
  const img = (p.images || [])[0];
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img.url || img.src || '';
}

function propMediaHtml(p, cover) {
  if (!cover) return '';
  return `<div class="prop-media">
      <img class="prop-cover" src="${esc(cover)}" alt="" loading="lazy" />
      <div class="prop-grad" aria-hidden="true"></div>
      ${p.operation_type ? `<span class="prop-badge">${esc(p.operation_type)}</span>` : ''}
      ${p.sku ? `<span class="prop-sku">SKU: ${esc(p.sku)}</span>` : ''}
    </div>`;
}

function propSpecsHtml(p) {
  const f = p.features || {};
  const specs = [];
  if (f.bedrooms != null) specs.push(['bed', `${f.bedrooms} rec`]);
  if (f.bathrooms != null) specs.push(['bathtub', `${f.bathrooms} baños`]);
  const m2 = f.construction_m2 ?? f.area_m2 ?? f.m2;
  if (m2 != null) specs.push(['straighten', `${m2} m²`]);
  if (!specs.length) return '';
  return `<div class="prop-specs">${specs
    .map(([icon, label]) => `<span><span class="msi accent" aria-hidden="true">${icon}</span>${esc(String(label))}</span>`)
    .join('')}</div>`;
}

function propertyCardEl(p) {
  const zone = p.location?.zone || p.location?.city || '';
  const cover = coverUrl(p);
  const card = el(`
    <article class="card prop-card tappable">
      ${propMediaHtml(p, cover)}
      <div class="prop-body">
        <div class="prop-title-row">
          <div>
            <strong>${esc(p.title || 'Propiedad')}</strong>
            ${
              zone || p.niche
                ? `<div class="prop-loc"><span class="msi sm accent" aria-hidden="true">location_on</span>${esc(zone)}${
                    zone && p.niche ? ' · ' : ''
                  }${esc(p.niche || '')}</div>`
                : ''
            }
          </div>
          <div class="prop-price">
            <span class="metric-num brand">${fmtMoney(p.price_mxn) || 'Por confirmar'}</span>
            ${p.price_mxn ? '<small>MXN</small>' : ''}
          </div>
        </div>
        ${!cover && p.operation_type ? `<div style="margin-top:8px"><span class="tag">${esc(p.operation_type)}</span></div>` : ''}
        ${propSpecsHtml(p)}
        <div class="actions">
          <button class="btn btn-secondary" data-match>Sugerir match</button>
        </div>
      </div>
    </article>`);
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-match]')) return;
    openDetailSheet(p);
  });
  card.querySelector('[data-match]').addEventListener('click', () => openLeadPicker(p));
  return card;
}

function openDetailSheet(p) {
  const zone = p.location?.zone || p.location?.city || '—';
  const features = p.features || {};
  const cover = coverUrl(p);
  const content = el(`
    <div>
      ${
        cover
          ? `<div class="prop-media" style="border-radius:var(--radius-sm);overflow:hidden;margin-bottom:10px">
              <img class="prop-cover" src="${esc(cover)}" alt="" style="margin:0;border-radius:0" />
              <div class="prop-grad" aria-hidden="true"></div>
              ${p.sku ? `<span class="prop-sku">SKU: ${esc(p.sku)}</span>` : ''}
            </div>`
          : ''
      }
      <div class="field-grid">
        <div><small>Precio</small><span>${fmtMoney(p.price_mxn) || '—'}</span></div>
        <div><small>Zona</small><span>${esc(zone)}</span></div>
        <div><small>Operación</small><span>${esc(p.operation_type || '—')}</span></div>
        <div><small>Nicho</small><span>${esc(p.niche || '—')}</span></div>
        <div><small>SKU</small><span>${esc(p.sku || '—')}</span></div>
        <div><small>Recámaras</small><span>${esc(String(features.bedrooms ?? '—'))}</span></div>
      </div>
      ${p.description ? `<p style="margin-top:12px;color:var(--muted)">${esc(p.description)}</p>` : ''}
      <div class="actions">
        <button class="btn btn-accent btn-block" data-match>Sugerir match para un lead</button>
      </div>
    </div>`);
  const sheet = openSheet(content, { title: p.title || 'Propiedad' });
  content.querySelector('[data-match]').addEventListener('click', () => {
    sheet.close();
    openLeadPicker(p);
  });
}

async function openLeadPicker(p) {
  haptic('light');
  const content = el(`<div>${skeletonList(3)}</div>`);
  const sheet = openSheet(content, { title: '¿Para qué lead?' });
  try {
    const data = await fetchLeads({ page_size: 50, sort_by: 'updated_at' });
    const leads = filterVisibleLeads(data.leads).filter((l) => !['venta', 'perdido'].includes(l.status));
    if (!leads.length) {
      content.innerHTML = emptyState('No tienes leads activos para hacer match.');
      return;
    }
    content.innerHTML = '';
    for (const lead of leads) {
      const btn = el(
        `<button class="btn btn-ghost option-btn">
          <span>${esc(lead.name)}<br /><small style="color:var(--faint)">${esc(
            STATUS_LABELS[lead.status] || lead.status
          )}${lead.budget_mxn ? ` · ${fmtMoney(lead.budget_mxn)}` : ''}${
            lead.preferred_zone ? ` · ${esc(lead.preferred_zone)}` : ''
          }</small></span>
          <span class="tag">Elegir</span>
        </button>`
      );
      btn.addEventListener('click', () => {
        sheet.close();
        suggestMatch(p, lead);
      });
      content.append(btn);
    }
  } catch (err) {
    content.innerHTML = errorBlock(err?.isNetwork ? 'Sin conexión con ROVI' : err?.message);
    content.querySelector('[data-retry]')?.addEventListener('click', () => {
      sheet.close();
      openLeadPicker(p);
    });
  }
}

async function suggestMatch(p, lead) {
  const content = el(
    `<div>
      <p class="screen-sub">El agente está evaluando el match (hasta 1 minuto)…</p>
      <div class="typing" style="padding:6px 0 14px"><i></i><i></i><i></i></div>
      <div class="skeleton sk-line"></div>
      <div class="skeleton sk-line short"></div>
    </div>`
  );
  const sheet = openSheet(content, { title: `Match: ${lead.name}` });

  const budget = lead.budget_mxn ? fmtMoney(lead.budget_mxn) : 'sin presupuesto registrado';
  const zone = lead.preferred_zone || 'sin zona definida';
  const message =
    `sugiere propiedades para el lead ${lead.name} (presupuesto ${budget}, zona ${zone}). ` +
    `Evalúa especialmente si la propiedad "${p.title}" (${fmtMoney(p.price_mxn) || 'precio por confirmar'}) ` +
    `hace match y propón un mensaje corto para enviárselo.`;

  try {
    const res = await runAgent(message);
    const text = res?.response || 'El agente no devolvió contenido. Reintenta.';
    content.innerHTML = `
      <div class="draft-box" style="max-height:46dvh;overflow-y:auto">${esc(text)}</div>
      <div class="actions"><button class="btn btn-primary btn-block" data-copy>Copiar sugerencia</button></div>
      <div id="matchActions" style="margin-top:12px"></div>`;
    content.querySelector('[data-copy]').addEventListener('click', () => copyText(text, 'Sugerencia copiada'));
    renderMatchActions(content.querySelector('#matchActions'));
  } catch (err) {
    content.innerHTML = `<div class="error-block">${
      err?.isNetwork ? 'El agente tardó demasiado. Reintenta.' : esc(err?.message || 'Error del agente')
    }<br /><button class="btn" data-retry>Reintentar</button></div>`;
    content.querySelector('[data-retry]').addEventListener('click', () => {
      sheet.close();
      suggestMatch(p, lead);
    });
  }
}

async function renderMatchActions(box) {
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

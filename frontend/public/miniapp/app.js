const tg = window.Telegram?.WebApp;
const CRM_GRAPHQL_ENDPOINT = '/crm-bridge/graphql';
const STORAGE_KEY = 'rovi-mini-crm-v2';
const SESSION_STORAGE_KEY = 'rovi-mini-crm-session-v1';

const leadSignals = ['busco', 'looking for', 'renta', 'rent', 'compra', 'buy', 'cliente', 'client', 'presupuesto', 'budget', 'recámaras', 'habitaciones', 'visita', 'urgente', 'entrada', 'mudanza'];
const inventorySignals = ['vendo', 'venta', 'for sale', 'listing', 'disponible', 'brokers', 'comisión', 'commission', 'amenidades', 'ficha'];
const discardSignals = ['plomero', 'electrician', 'carpintero', 'charity', 'legal', 'abogado'];

const demoProperties = [
  { id: 'DEMO-101', zone: 'Polanco', operation: 'renta', type: 'departamento', bedrooms: 2, budget: 45000, note: 'Demo: 2 recámaras, cerca de parques. Disponibilidad no confirmada.' },
  { id: 'DEMO-204', zone: 'Condesa', operation: 'renta', type: 'departamento', bedrooms: 1, budget: 32000, note: 'Demo: ideal ejecutivo. Precio/disponibilidad solo referencial.' },
  { id: 'DEMO-311', zone: 'Playa del Carmen', operation: 'venta', type: 'condo', bedrooms: 2, budget: 3800000, note: 'Demo: inventario local para probar match.' }
];

const state = loadState();
let crmSession = loadCrmSession();
let lastDraft = '';

safeTelegramInit();
document.addEventListener('DOMContentLoaded', () => {
  setupTelegram();
  setupTabs();
  setupCapture();
  setupFilters();
  setupCrm();
  setupMessages();
  setupMatch();
  setupTasks();
  render();
  bootstrapRoviSession().finally(checkCrmHealth);
});

function safeTelegramInit() {
  try {
    tg?.ready();
    tg?.expand();
    tg?.MainButton?.setText('Enviar borrador al bot');
  } catch (err) {
    console.info('[ROVI] Telegram SDK no disponible completo', err.message);
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      inbox: saved.inbox || seedInbox(),
      leads: saved.leads || seedInbox().filter((i) => i.stage !== 'inventario').map(toLead),
      tasks: saved.tasks || seedTasks(),
      selected: null
    };
  } catch {
    const inbox = seedInbox();
    return { inbox, leads: inbox.filter((i) => i.stage !== 'inventario').map(toLead), tasks: seedTasks(), selected: null };
  }
}

function loadCrmSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCrmSession(session) {
  crmSession = session;
  if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_STORAGE_KEY);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ inbox: state.inbox, leads: state.leads, tasks: state.tasks }));
}

function seedInbox() {
  return [
    classifyMessage('Demo: Cliente Ana busca renta en Polanco, 2 recámaras, presupuesto 45k, entrada en junio y quiere visitar esta semana.', 'telegram-demo'),
    classifyMessage('Demo: Broker publica departamento disponible en venta en Playa del Carmen, comisión compartida y ficha técnica por WhatsApp.', 'telegram-demo'),
    classifyMessage('Demo: Carlos pidió opciones en Condesa, presupuesto 32k, no respondió desde hace 2 días.', 'telegram-demo')
  ];
}

function seedTasks() {
  return [
    { id: makeId(), title: 'Dar follow-up a Ana', status: 'pendiente', priority: 'Alta', due: 'Hoy', source: 'Demo' },
    { id: makeId(), title: 'Confirmar si Carlos sigue buscando en Condesa', status: 'pendiente', priority: 'Media', due: 'Hoy', source: 'Demo' }
  ];
}

function setupTelegram() {
  const status = document.getElementById('tgStatus');
  if (!tg) {
    status.textContent = 'Vista web';
    return;
  }
  const user = tg.initDataUnsafe?.user;
  status.textContent = user?.first_name ? `Hola, ${user.first_name}` : 'Telegram activo';
}

function getTelegramStartParam() {
  return tg?.initDataUnsafe?.start_param
    || new URLSearchParams(window.location.search).get('startapp')
    || new URLSearchParams(window.location.search).get('code')
    || '';
}

async function bootstrapRoviSession() {
  const status = document.getElementById('crmStatus');
  if (!tg?.initData) {
    return;
  }
  try {
    const res = await fetch('/api/telegram-miniapp/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ init_data: tg.initData, start_param: getTelegramStartParam() })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const session = await res.json();
    if (session.status === 'active') {
      saveCrmSession(session);
      status.textContent = `ROVI vinculado · ${session.user?.name || session.user?.email} · ${session.active_workspace?.role || session.user?.role || 'broker'}`;
      return;
    }
    saveCrmSession(null);
    status.textContent = session.message || 'Telegram no está vinculado a una cuenta ROVI.';
    const startCode = session.start_code || getTelegramStartParam();
    if (startCode) {
      safeSendData({ type: 'rovi_device_link_start', code: startCode, telegramUser: tg.initDataUnsafe?.user, requiresContact: true });
    }
  } catch (err) {
    console.info('[ROVI] Sesión Telegram MiniApp no activa', err.message);
  }
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    'content-type': 'application/json'
  };
  if (crmSession?.access_token) {
    headers.Authorization = `Bearer ${crmSession.access_token}`;
  }
  return fetch(path, { ...options, headers });
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });
}

function activateTab(tab) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(`panel${capitalize(tab)}`).classList.add('active');
}

function setupCapture() {
  const text = document.getElementById('telegramText');
  document.getElementById('captureBtn').addEventListener('click', () => {
    const value = text.value.trim();
    if (!value) return notify('Pega primero el mensaje o descripción del archivo.');
    const item = classifyMessage(value, 'telegram-manual');
    state.inbox.unshift(item);
    if (['caliente', 'seguimiento'].includes(item.stage)) {
      state.leads.unshift(toLead(item));
      state.tasks.unshift({ id: makeId(), title: `Seguimiento: ${item.contact.name}`, status: 'pendiente', priority: item.priority, due: 'Hoy', source: item.id });
    }
    text.value = '';
    saveState();
    render();
    notify('Capturado y clasificado en MiniApp ROVI.');
  });
  document.getElementById('clearBtn').addEventListener('click', () => { text.value = ''; });
  document.getElementById('whatNowBtn').addEventListener('click', renderNextBestAction);
}

function setupFilters() {
  document.getElementById('searchInbox').addEventListener('input', renderInbox);
  document.getElementById('stageFilter').addEventListener('change', renderLeads);
}

function setupCrm() {
  document.getElementById('syncBtn').addEventListener('click', syncToBotForConfirmation);
  document.getElementById('crmSearchBtn').addEventListener('click', searchCrm);
}

function setupMessages() {
  document.getElementById('generateMessageBtn').addEventListener('click', () => {
    const type = document.getElementById('messageType').value;
    const context = document.getElementById('messageContext').value.trim() || 'tu búsqueda de propiedad';
    lastDraft = buildMessage(type, context);
    document.getElementById('messageOutput').textContent = lastDraft;
    navigator.clipboard?.writeText(lastDraft);
    notify('Mensaje generado y copiado.');
  });
  document.getElementById('copyMessageBtn').addEventListener('click', () => {
    const value = lastDraft || document.getElementById('messageOutput').textContent;
    navigator.clipboard?.writeText(value);
    notify('Mensaje copiado.');
  });
}

function setupMatch() {
  document.getElementById('matchBtn').addEventListener('click', () => {
    const q = document.getElementById('matchQuery').value.trim();
    renderMatches(q);
  });
}

function setupTasks() {
  document.getElementById('addTaskBtn').addEventListener('click', () => {
    state.tasks.unshift({ id: makeId(), title: 'Revisar lead nuevo y definir siguiente paso', status: 'pendiente', priority: 'Media', due: 'Hoy', source: 'Manual' });
    saveState();
    renderTasks();
    renderMetrics();
  });
}

function classifyMessage(text, source) {
  const haystack = text.toLowerCase();
  const hasLead = leadSignals.some((s) => haystack.includes(s));
  const hasInventory = inventorySignals.some((s) => haystack.includes(s));
  const hasDiscard = discardSignals.some((s) => haystack.includes(s));
  const contact = extractContact(text);
  let stage = 'nuevo';
  let priority = 'Por revisar';
  if (hasDiscard && !hasLead) { stage = 'descartado'; priority = 'Baja'; }
  else if (hasLead && !hasInventory) { stage = 'caliente'; priority = 'Alta'; }
  else if (hasLead && hasInventory) { stage = 'seguimiento'; priority = 'Media'; }
  else if (hasInventory) { stage = 'inventario'; priority = 'Media'; }
  return { id: makeId(), source, text, contact, stage, priority, synced: false, createdAt: new Date().toISOString(), nextAction: suggestNextAction(stage) };
}

function extractContact(text) {
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const name = text.match(/(?:cliente|contacto|nombre)[:\s]+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ ]{1,32})/)?.[1]?.trim()
    || text.match(/(?:Cliente|Contacto|Nombre)\s+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]{1,18})/)?.[1]?.trim();
  return { name: name || 'Contacto Telegram', phone: phone || '', email: email || '' };
}

function suggestNextAction(stage) {
  const map = {
    caliente: 'Contactar hoy, confirmar datos clave y proponer 1-3 opciones concretas.',
    seguimiento: 'Validar demanda vs inventario antes de crear lead definitivo.',
    inventario: 'Pedir ficha confirmada, precio y disponibilidad antes de compartir.',
    descartado: 'No priorizar; revisar manualmente si hay señal inmobiliaria real.',
    nuevo: 'Revisar y clasificar manualmente.'
  };
  return map[stage] || map.nuevo;
}

function toLead(item) {
  return { id: item.id, name: item.contact.name, stage: item.stage, priority: item.priority, source: item.source, summary: item.text.slice(0, 240), nextAction: item.nextAction, synced: false, createdAt: item.createdAt };
}

function render() {
  renderMetrics();
  renderInbox();
  renderLeads();
  renderTasks();
  renderNextBestAction();
}

function renderMetrics() {
  document.getElementById('mInbox').textContent = state.inbox.length;
  document.getElementById('mLeads').textContent = state.leads.length;
  document.getElementById('mHot').textContent = state.leads.filter((l) => l.stage === 'caliente').length;
  document.getElementById('mTasks').textContent = state.tasks.filter((t) => t.status !== 'hecho').length;
}

function renderNextBestAction() {
  const hot = state.leads.find((l) => l.stage === 'caliente');
  const task = state.tasks.find((t) => t.status !== 'hecho');
  const text = hot
    ? `1) Contacta a ${hot.name}. Motivo: lead caliente. Acción: ${hot.nextAction}`
    : task
      ? `1) ${task.title}. Prioridad: ${task.priority}. Vence: ${task.due}.`
      : 'Sin pendientes críticos. Captura nuevos mensajes o consulta CRM.';
  document.getElementById('nextBestAction').textContent = text;
}

function renderInbox() {
  const q = document.getElementById('searchInbox').value.toLowerCase();
  const data = state.inbox.filter((i) => i.text.toLowerCase().includes(q));
  const list = document.getElementById('inboxList');
  if (!data.length) return renderEmpty(list);
  list.innerHTML = data.map((item) => `
    <article class="item">
      <div class="item-head">
        <div><strong>${escapeHtml(item.contact.name)}</strong><span class="muted">${formatDate(item.createdAt)} · ${escapeHtml(item.source)}</span></div>
        <span class="tag ${item.stage}">${item.stage}</span>
      </div>
      <p>${escapeHtml(item.text)}</p>
      <p><b>Siguiente acción:</b> ${escapeHtml(item.nextAction)}</p>
      <div class="actions">
        <button class="secondary" onclick="promoteLead('${item.id}')">Crear lead</button>
        <button class="ghost" onclick="sendDraft('${item.id}')">Mensaje</button>
        <button class="ghost" onclick="prefillMatch('${item.id}')">Match</button>
      </div>
    </article>`).join('');
}

function renderLeads() {
  const filter = document.getElementById('stageFilter').value;
  const data = state.leads.filter((l) => !filter || l.stage === filter);
  const list = document.getElementById('leadList');
  if (!data.length) return renderEmpty(list);
  list.innerHTML = data.map((lead) => `
    <article class="item">
      <div class="item-head">
        <div><strong>${escapeHtml(lead.name)}</strong><span class="muted">${formatDate(lead.createdAt)} · ${escapeHtml(lead.source)}</span></div>
        <span class="tag ${lead.stage}">${lead.synced ? 'crm sync' : lead.stage}</span>
      </div>
      <p>${escapeHtml(lead.summary)}</p>
      <p><b>Próximo paso:</b> ${escapeHtml(lead.nextAction)}</p>
      <div class="actions">
        <button class="secondary" onclick="prepareCrmSync('${lead.id}')">Preparar CRM</button>
        <button class="ghost" onclick="sendDraft('${lead.id}')">WhatsApp</button>
      </div>
    </article>`).join('');
}

function renderTasks() {
  const list = document.getElementById('taskList');
  const tasks = state.tasks.filter((t) => t.status !== 'hecho');
  if (!tasks.length) return renderEmpty(list);
  list.innerHTML = tasks.map((task) => `
    <article class="item">
      <div class="item-head">
        <div><strong>${escapeHtml(task.title)}</strong><span class="muted">${escapeHtml(task.due)} · ${escapeHtml(task.source)}</span></div>
        <span class="tag ${task.priority === 'Alta' ? 'caliente' : 'seguimiento'}">${escapeHtml(task.priority)}</span>
      </div>
      <div class="actions"><button class="secondary" onclick="completeTask('${task.id}')">Marcar hecho</button></div>
    </article>`).join('');
}

function renderMatches(query) {
  const out = document.getElementById('matchResults');
  const q = query.toLowerCase();
  const scored = demoProperties.map((p) => {
    let score = 0;
    if (q.includes(p.zone.toLowerCase())) score += 40;
    if (q.includes(p.operation)) score += 25;
    if (q.includes(String(p.bedrooms))) score += 15;
    if (q.includes(p.type)) score += 10;
    return { ...p, score };
  }).sort((a, b) => b.score - a.score);
  const data = scored.filter((p) => p.score > 0).slice(0, 3);
  if (!query) out.innerHTML = '<div class="empty">Escribe criterios del lead para buscar match demo.</div>';
  else if (!data.length) renderEmpty(out);
  else out.innerHTML = data.map((p) => `
    <article class="item">
      <div class="item-head"><strong>${p.id} · ${escapeHtml(p.zone)}</strong><span class="tag caliente">${p.score}% match</span></div>
      <p>${escapeHtml(p.operation)} · ${escapeHtml(p.type)} · ${p.bedrooms} rec. · Referencia demo: ${p.budget.toLocaleString('es-MX')}</p>
      <p>${escapeHtml(p.note)}</p>
      <div class="actions"><button class="ghost" onclick="copyPropertyDraft('${p.id}')">Copiar mensaje</button></div>
    </article>`).join('');
}

function renderEmpty(node) { node.innerHTML = document.getElementById('emptyTemplate').innerHTML; }

window.promoteLead = function promoteLead(id) {
  const item = state.inbox.find((i) => i.id === id);
  if (!item || state.leads.some((l) => l.id === id)) return notify('Este lead ya existe en pipeline.');
  state.leads.unshift(toLead(item));
  saveState();
  render();
  notify('Lead creado en pipeline local.');
};

window.prepareCrmSync = function prepareCrmSync(id) {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead) return;
  const payload = { type: 'rovi_crm_create_lead_draft', requiresHumanConfirmation: true, lead };
  sendOrCopyPayload(payload, 'Borrador CRM preparado. Requiere confirmación humana.');
};

window.sendDraft = function sendDraft(id) {
  const item = state.inbox.find((i) => i.id === id) || state.leads.find((l) => l.id === id);
  if (!item) return;
  const base = item.summary || item.text;
  lastDraft = buildMessage('seguimiento', base);
  document.getElementById('messageOutput').textContent = lastDraft;
  document.getElementById('messageContext').value = base;
  activateTab('messages');
  navigator.clipboard?.writeText(lastDraft);
  if (tg) safeSendData({ type: 'draft_message', message: lastDraft, sourceId: id });
  notify('Mensaje generado y copiado como borrador.');
};

window.prefillMatch = function prefillMatch(id) {
  const item = state.inbox.find((i) => i.id === id);
  if (!item) return;
  document.getElementById('matchQuery').value = item.text;
  activateTab('properties');
  renderMatches(item.text);
};

window.completeTask = function completeTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (task) task.status = 'hecho';
  saveState();
  render();
};

window.copyPropertyDraft = function copyPropertyDraft(id) {
  const p = demoProperties.find((row) => row.id === id);
  const draft = `Tengo una opción que podría hacer match con lo que buscas (${p.zone}, ${p.operation}, ${p.bedrooms} recámaras). Antes de compartirte ficha completa, confirmo disponibilidad y datos actualizados. ¿Te interesa que la revise para ti?`;
  navigator.clipboard?.writeText(draft);
  notify('Mensaje de propiedad copiado.');
};

async function checkCrmHealth() {
  const status = document.getElementById('crmStatus');
  if (crmSession?.status === 'active') {
    status.textContent = `ROVI vinculado · ${crmSession.user?.name || crmSession.user?.email} · ${crmSession.active_workspace?.role || crmSession.user?.role || 'broker'}`;
    return;
  }
  try {
    const res = await fetch('/crm-bridge/health', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    status.textContent = `Conectado a ROVI CRM · lectura ${json.readOnlyMode ? 'segura' : 'con escrituras habilitadas'} · PII ${json.piiMasked ? 'enmascarado' : 'visible'}`;
  } catch {
    status.textContent = 'CRM bridge no activo. Modo local/borradores: no escribe al CRM ni confirma datos reales.';
  }
}

async function searchCrm() {
  const out = document.getElementById('crmResults');
  const query = document.getElementById('crmQuery').value.trim();
  out.innerHTML = '<div class="empty">Buscando...</div>';
  try {
    if (crmSession?.access_token) {
      const res = await apiFetch(`/api/leads?search=${encodeURIComponent(query)}&page_size=10`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const leads = json.leads || [];
      if (!leads.length) return renderEmpty(out);
      out.innerHTML = leads.map((lead) => `
        <article class="item">
          <div class="item-head"><strong>${escapeHtml(lead.name)}</strong><span class="tag ${lead.priority === 'alta' ? 'caliente' : 'seguimiento'}">${escapeHtml(lead.status || 'crm')}</span></div>
          <p>${escapeHtml(lead.property_interest || lead.raw_interest_text || lead.notes || 'Lead en ROVI CRM')}</p>
          <pre>${escapeHtml(JSON.stringify({ id: lead.id, phone: lead.phone, source: lead.source, next_action: lead.next_action }, null, 2))}</pre>
        </article>`).join('');
      return;
    }
    const res = await fetch(CRM_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query Leads($query:String){ leads(query:$query, limit:10){ id data } }', variables: { query } })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const leads = json.data?.leads || [];
    if (!leads.length) return renderEmpty(out);
    out.innerHTML = leads.map((row) => `<article class="item"><strong>${escapeHtml(row.id)}</strong><pre>${escapeHtml(JSON.stringify(row.data, null, 2))}</pre></article>`).join('');
  } catch (err) {
    out.innerHTML = `<div class="empty">No pude consultar ROVI CRM: ${escapeHtml(err.message)}. Falta proxy seguro /crm-bridge.</div>`;
  }
}

function syncToBotForConfirmation() {
  const payload = { type: 'rovi_crm_bulk_sync_draft', requiresHumanConfirmation: true, leads: state.leads.filter((l) => !l.synced), tasks: state.tasks.filter((t) => t.status !== 'hecho') };
  sendOrCopyPayload(payload, 'Borrador de sincronización preparado. No se escribió al CRM.');
}

function buildMessage(type, context) {
  const clean = context.replace(/\s+/g, ' ').trim();
  const templates = {
    primer_contacto: `Hola 👋 Soy del equipo ROVI. Vi tu mensaje sobre ${clean}. Para ayudarte mejor, ¿me confirmas zona, presupuesto y fecha ideal?`,
    seguimiento: `Hola 👋 Te doy seguimiento sobre ${clean}. Tengo presente tu búsqueda y quiero confirmar si sigue activa para pasarte opciones que sí hagan match.`,
    visita: `Hola 👋 Para avanzar con ${clean}, ¿te va bien confirmar la visita? Si me compartes horario ideal, reviso disponibilidad y te confirmo.`,
    reactivacion: `Hola 👋 No te quiero molestar; solo retomo tu búsqueda de ${clean}. Si todavía estás buscando, puedo ayudarte a filtrar opciones concretas.`,
    post_visita: `Hola 👋 Gracias por la visita. Sobre ${clean}, ¿qué te pareció? Si quieres, revisamos dudas y vemos el siguiente mejor paso.`
  };
  return templates[type] || templates.seguimiento;
}

function sendOrCopyPayload(payload, message) {
  safeSendData(payload);
  navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  notify(message);
}

function safeSendData(payload) {
  try { tg?.sendData?.(JSON.stringify(payload)); } catch (err) { console.info('[ROVI] sendData no disponible', err.message); }
}

function notify(message) {
  try { tg?.HapticFeedback?.impactOccurred('light'); } catch {}
  try {
    if (tg?.showPopup) return tg.showPopup({ title: 'ROVI MiniApp', message });
  } catch {}
  console.info(`[ROVI MiniApp] ${message}`);
}

function makeId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function formatDate(value) { return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }); }
function capitalize(value) { return `${value.charAt(0).toUpperCase()}${value.slice(1)}`; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }

const tg = window.Telegram?.WebApp;
const MINIAPP_API = '/api/miniapp';
const SESSION_STORAGE_KEY = 'rovi-mini-crm-session-v2';
const LOCAL_STORAGE_KEY = 'rovi-mini-local-leads-v1';

const stages = [
  { key: 'nuevo', label: 'Nuevo', color: '#3b82f6' },
  { key: 'contactado', label: 'Contactado', color: '#06b6d4' },
  { key: 'calificacion', label: 'Calificación', color: '#d97706' },
  { key: 'presentacion', label: 'Presentación', color: '#7c3aed' },
  { key: 'apartado', label: 'Apartado', color: '#f59e0b' },
  { key: 'venta', label: 'Venta', color: '#10b981' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444' }
];

const priorityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente'
};

let crmSession = loadSession();
let remote = {
  summary: null,
  leads: [],
  tasks: [],
  events: [],
  candidates: []
};
let localLeads = loadLocalLeads();
let currentView = 'Home';
let lastAnalysis = null;
let linkRequired = false;

safeTelegramInit();

document.addEventListener('DOMContentLoaded', () => {
  bindNavigation();
  bindActions();
  setupTelegramBadge();
  renderAll();
  bootstrapRoviSession().finally(refreshRemoteData);
});

function safeTelegramInit() {
  try {
    tg?.ready();
    tg?.expand();
    tg?.MainButton?.hide();
  } catch (err) {
    console.info('[ROVI MiniApp] Telegram SDK parcial', err.message);
  }
}

function setupTelegramBadge() {
  const status = byId('tgStatus');
  if (!tg) {
    status.textContent = 'Vista web';
    return;
  }
  const user = tg.initDataUnsafe?.user;
  status.textContent = user?.first_name ? user.first_name : 'Telegram';
}

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => activateView(button.dataset.view));
  });
  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => activateView(button.dataset.go));
  });
}

function bindActions() {
  byId('refreshBtn').addEventListener('click', refreshRemoteData);
  byId('refreshPipelineBtn').addEventListener('click', refreshRemoteData);
  byId('quickCaptureBtn').addEventListener('click', () => activateView('Capture'));
  byId('createLeadBtn').addEventListener('click', createLeadFromCapture);
  byId('analyzeBtn').addEventListener('click', analyzeCapture);
  byId('importBtn').addEventListener('click', importCandidates);
  byId('importCandidatesBtn').addEventListener('click', importCandidates);
  byId('addEventBtn').addEventListener('click', createQuickEvent);
  byId('calendarEventBtn').addEventListener('click', createQuickEvent);
  byId('searchLeads').addEventListener('input', renderLeads);
  byId('leadStatusFilter').addEventListener('change', renderLeads);
  byId('linkAccountForm').addEventListener('submit', linkRoviAccount);
}

function activateView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach((node) => {
    node.classList.toggle('active', node.id === `view${view}`);
  });
  document.querySelectorAll('.nav-item').forEach((node) => {
    node.classList.toggle('active', node.dataset.view === view);
  });
  if (view === 'Leads') renderLeads();
  if (view === 'Pipeline') renderPipeline();
  if (view === 'Calendar') renderCalendar();
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveSession(session) {
  crmSession = session;
  if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_STORAGE_KEY);
}

function loadLocalLeads() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || 'null');
    if (Array.isArray(saved)) return saved;
  } catch {}
  return [
    localLead('Ana busca renta en Playa del Carmen, 2 recámaras, presupuesto 45k, quiere visitar esta semana.', 'Ana'),
    localLead('Carlos pidió opciones en Condesa, presupuesto 32k, no respondió desde hace 2 días.', 'Carlos'),
    localLead('Broker comparte condo disponible en venta con comisión compartida.', 'Broker contacto', 'contactado')
  ];
}

function saveLocalLeads() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localLeads));
}

function localLead(text, name = 'Contacto MiniApp', status = 'nuevo') {
  const urgent = /urgente|hoy|visita|esta semana/i.test(text);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    phone: extractPhone(text),
    status,
    priority: urgent ? 'alta' : 'media',
    source: 'local',
    operation_type: /renta|rent|alquiler/i.test(text) ? 'rent' : 'sale',
    budget_mxn: extractBudget(text),
    raw_interest_text: text,
    notes: text,
    intent_score: urgent ? 84 : 62,
    next_action: urgent ? 'Contactar hoy y proponer opciones concretas.' : 'Confirmar datos clave y siguiente paso.',
    created_at: new Date().toISOString()
  };
}

function getTelegramStartParam() {
  return tg?.initDataUnsafe?.start_param
    || new URLSearchParams(window.location.search).get('startapp')
    || new URLSearchParams(window.location.search).get('code')
    || '';
}

async function bootstrapRoviSession() {
  if (!tg?.initData) {
    setLinkPanel(false);
    updateConnection('Modo local', 'Abre desde Telegram vinculado para conectar ROVI CRM.');
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
      saveSession(session);
      setLinkPanel(false);
      updateConnection('ROVI conectado', `${session.user?.name || session.user?.email} · ${session.active_workspace?.role || session.user?.role || 'broker'}`);
      return;
    }
    saveSession(null);
    setLinkPanel(session.status === 'link_required');
    updateConnection('Telegram sin vincular', session.message || 'Vincula tu cuenta ROVI desde Settings.');
    if (session.start_code || getTelegramStartParam()) {
      safeSendData({ type: 'rovi_device_link_start', code: session.start_code || getTelegramStartParam(), requiresContact: true });
    }
  } catch (err) {
    setLinkPanel(false);
    updateConnection('Sesión pendiente', `No pude iniciar sesión ROVI: ${err.message}`);
  }
}

async function linkRoviAccount(event) {
  event.preventDefault();
  if (!tg?.initData) {
    notify('Abre esta MiniApp desde Telegram para vincular la cuenta.');
    return;
  }
  const button = byId('linkAccountBtn');
  const help = byId('linkHelp');
  const payload = {
    init_data: tg.initData,
    start_param: getTelegramStartParam(),
    email: byId('linkEmail').value.trim(),
    password: byId('linkPassword').value
  };
  if (!payload.email || !payload.password) return notify('Ingresa email y password de ROVI.');
  button.disabled = true;
  button.textContent = 'Conectando...';
  help.textContent = 'Validando cuenta ROVI y vinculando Telegram.';
  try {
    const res = await fetch('/api/telegram-miniapp/link-with-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail || `HTTP ${res.status}`);
    saveSession(body);
    byId('linkPassword').value = '';
    setLinkPanel(false);
    updateConnection('ROVI conectado', `${body.user?.name || body.user?.email} · ${body.active_workspace?.role || body.user?.role || 'broker'}`);
    await refreshRemoteData();
    notify('Cuenta ROVI vinculada con Telegram.');
  } catch (err) {
    help.textContent = err.message || 'No pude conectar la cuenta. Revisa credenciales.';
    notify(help.textContent);
  } finally {
    button.disabled = false;
    button.textContent = 'Conectar cuenta';
  }
}

async function apiFetch(path, options = {}) {
  if (!crmSession?.access_token) throw new Error('Sin sesión ROVI activa');
  const headers = { ...(options.headers || {}), 'content-type': 'application/json' };
  headers.Authorization = `Bearer ${crmSession.access_token}`;
  const res = await fetch(`${MINIAPP_API}${path}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    if (path !== '/summary') saveSession(null);
    throw new Error('Sin permisos o sesión expirada');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function refreshRemoteData() {
  if (!crmSession?.access_token) {
    renderAll();
    return;
  }
  try {
    const [summary, leads, tasks, calendar] = await Promise.all([
      apiFetch('/summary'),
      apiFetch('/leads?page_size=80'),
      apiFetch('/tasks'),
      apiFetch('/calendar')
    ]);
    remote.summary = summary;
    remote.leads = leads.leads || [];
    remote.tasks = tasks.tasks || [];
    remote.events = calendar.events || [];
    updateConnection('ROVI conectado', `${summary.is_agency_user ? 'Inmobiliaria' : 'Broker'} · datos en vivo`);
  } catch (err) {
    updateConnection('Modo local', `No pude cargar ROVI CRM: ${err.message}`);
  }
  renderAll();
}

function renderAll() {
  renderStats();
  renderNowAction();
  renderPipelineSummary();
  renderPipeline();
  renderLeads();
  renderCalendar();
  renderCandidates();
}

function dataLeads() {
  return crmSession?.access_token && remote.leads.length ? remote.leads : localLeads;
}

function renderStats() {
  const leads = dataLeads();
  const metrics = remote.summary?.metrics;
  byId('statOpen').textContent = metrics?.open_leads ?? leads.filter((lead) => !['venta', 'perdido'].includes(lead.status)).length;
  byId('statHot').textContent = metrics?.hot_leads ?? leads.filter((lead) => ['alta', 'urgente'].includes(lead.priority)).length;
  byId('statTasks').textContent = metrics?.pending_tasks ?? remote.tasks.filter((task) => task.status !== 'done').length;
  byId('statToday').textContent = metrics?.today_events ?? eventsToday(remote.events).length;
}

function renderNowAction() {
  const leads = dataLeads();
  const hot = leads.find((lead) => ['urgente', 'alta'].includes(lead.priority));
  const task = remote.tasks.find((item) => item.status !== 'done');
  const event = nextEvent(remote.events);
  let text = 'Captura un lead o revisa el pipeline para priorizar.';
  if (hot) text = `${hot.name || 'Lead'}: ${hot.next_action || 'contactar y confirmar datos clave.'}`;
  else if (task) text = task.title;
  else if (event) text = `${event.title} · ${formatTime(event.start_time)}`;
  byId('nowAction').textContent = text;
}

function renderPipelineSummary() {
  const leads = dataLeads();
  const total = Math.max(leads.length, 1);
  const topStages = stages.slice(0, 6);
  byId('pipelineSummary').innerHTML = topStages.map((stage) => {
    const count = leads.filter((lead) => (lead.status || 'nuevo') === stage.key).length;
    const pct = Math.round((count / total) * 100);
    return `
      <article class="stage-tile">
        <b>${count}</b>
        <span>${escapeHtml(stage.label)}</span>
        <div class="stage-bar"><i style="--w:${pct}%;--stage:${stage.color}"></i></div>
      </article>`;
  }).join('');
}

function renderPipeline() {
  const leads = dataLeads();
  byId('pipelineBoard').innerHTML = stages.map((stage) => {
    const rows = leads.filter((lead) => (lead.status || 'nuevo') === stage.key);
    return `
      <section class="pipeline-column">
        <div class="column-head">
          <h3><i class="stage-dot" style="--stage:${stage.color}"></i>${escapeHtml(stage.label)}</h3>
          <span class="count-pill">${rows.length}</span>
        </div>
        <div class="stack-list">
          ${rows.length ? rows.map(renderLeadCard).join('') : `<div class="empty-state">Sin leads en ${escapeHtml(stage.label)}.</div>`}
        </div>
      </section>`;
  }).join('');
}

function renderLeads() {
  const q = byId('searchLeads').value.trim().toLowerCase();
  const filter = byId('leadStatusFilter').value;
  const leads = dataLeads().filter((lead) => {
    const haystack = `${lead.name || ''} ${lead.phone || ''} ${lead.preferred_zone || ''} ${lead.raw_interest_text || ''} ${lead.notes || ''}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!filter || lead.status === filter);
  });
  byId('leadsList').innerHTML = leads.length
    ? leads.map(renderLeadCard).join('')
    : '<div class="empty-state">No encontré leads con esos filtros.</div>';
}

function renderLeadCard(lead) {
  const stage = stages.find((item) => item.key === (lead.status || 'nuevo')) || stages[0];
  const priority = priorityLabels[lead.priority] || lead.priority || 'Media';
  const intent = lead.intent_score ?? 50;
  const summary = lead.raw_interest_text || lead.property_interest || lead.notes || 'Sin descripción registrada.';
  return `
    <article class="lead-card">
      <div class="lead-top">
        <div class="lead-person">
          <span class="avatar">${initials(lead.name)}</span>
          <div>
            <h3>${escapeHtml(lead.name || 'Lead sin nombre')}</h3>
            <p>${escapeHtml(lead.phone || lead.email || lead.source || 'Sin contacto')}</p>
          </div>
        </div>
        <span class="badge stage" style="color:${stage.color};background:${hexToSoft(stage.color)}">${escapeHtml(stage.label)}</span>
      </div>
      <p>${escapeHtml(summary).slice(0, 210)}</p>
      <div class="lead-meta">
        <span class="badge ${['Alta', 'Urgente'].includes(priority) ? 'hot' : ''}">${escapeHtml(priority)}</span>
        <span class="badge">${lead.operation_type === 'rent' ? 'Renta' : 'Venta'}</span>
        <span class="badge intent">${intent}% intención</span>
        ${lead.budget_mxn ? `<span class="badge">$${Number(lead.budget_mxn).toLocaleString('es-MX')}</span>` : ''}
      </div>
      <div class="lead-actions">
        <button onclick="advanceLead('${lead.id}')">Avanzar</button>
        <button onclick="createTask('${lead.id}')">Tarea</button>
        <button onclick="draftMessage('${lead.id}')">Mensaje</button>
      </div>
    </article>`;
}

function renderCalendar() {
  const events = [...remote.events].sort((a, b) => new Date(a.start_time || 0) - new Date(b.start_time || 0));
  const html = events.length
    ? events.map(renderEventCard).join('')
    : '<div class="empty-state">Tu agenda aparecerá aquí. Crea un seguimiento desde un lead.</div>';
  byId('calendarList').innerHTML = html;
  byId('homeAgendaList').innerHTML = events.slice(0, 3).length
    ? events.slice(0, 3).map(renderEventCard).join('')
    : '<div class="empty-state">Sin eventos próximos.</div>';
}

function renderEventCard(event) {
  return `
    <article class="event-card">
      <div class="event-time">${formatTime(event.start_time)}</div>
      <div>
        <h3>${escapeHtml(event.title || 'Evento')}</h3>
        <p>${escapeHtml(event.event_type || 'seguimiento')} · ${formatDate(event.start_time)}</p>
        ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}
      </div>
    </article>`;
}

function renderCandidates() {
  const rows = remote.candidates || [];
  byId('candidateList').innerHTML = rows.length
    ? rows.map((candidate) => `
      <article class="candidate-card">
        <div class="lead-top">
          <div>
            <h3>${escapeHtml(candidate.name || 'Candidato')}</h3>
            <p>${escapeHtml(candidate.source_file || 'leads/processed')}</p>
          </div>
          <button class="soft-btn" onclick="convertCandidate('${candidate.id}')">Convertir</button>
        </div>
        <p>${escapeHtml(candidate.raw_text || '').slice(0, 220)}</p>
      </article>`).join('')
    : '<div class="empty-state">Importa candidatos desde leads/processed para revisarlos aquí.</div>';
}

async function createLeadFromCapture() {
  const text = byId('captureText').value.trim();
  if (!text) return notify('Pega primero el texto del prospecto.');
  const name = extractName(text);
  const payload = {
    name,
    phone: extractPhone(text),
    raw_text: text,
    priority: /urgente|hoy|visita|esta semana/i.test(text) ? 'alta' : 'media',
    operation_type: /renta|rent|alquiler/i.test(text) ? 'rent' : 'sale'
  };
  if (crmSession?.access_token) {
    try {
      const created = await apiFetch('/leads', { method: 'POST', body: JSON.stringify(payload) });
      remote.leads.unshift(created.lead);
      byId('captureText').value = '';
      byId('analysisBox').textContent = 'Lead creado en ROVI CRM.';
      await refreshRemoteData();
      activateView('Leads');
      notify('Lead creado en ROVI.');
      return;
    } catch (err) {
      notify(`No pude crear en CRM: ${err.message}. Guardé localmente.`);
    }
  }
  localLeads.unshift(localLead(text, name));
  saveLocalLeads();
  byId('captureText').value = '';
  byId('analysisBox').textContent = 'Lead guardado localmente.';
  renderAll();
  activateView('Leads');
}

async function analyzeCapture() {
  const text = byId('captureText').value.trim();
  if (!text) return notify('Pega primero el texto a analizar.');
  if (!crmSession?.access_token) {
    lastAnalysis = localAnalysis(text);
    byId('analysisBox').textContent = formatAnalysis(lastAnalysis);
    return;
  }
  try {
    const res = await apiFetch('/hermes/classify', {
      method: 'POST',
      body: JSON.stringify({ text, action: 'classify' })
    });
    lastAnalysis = res.analysis;
    byId('analysisBox').textContent = formatAnalysis(lastAnalysis);
  } catch (err) {
    lastAnalysis = localAnalysis(text);
    byId('analysisBox').textContent = `${formatAnalysis(lastAnalysis)}\n\nFallback local: ${err.message}`;
  }
}

async function advanceLead(id) {
  const lead = dataLeads().find((item) => item.id === id);
  if (!lead) return;
  const index = Math.max(0, stages.findIndex((stage) => stage.key === (lead.status || 'nuevo')));
  const next = stages[Math.min(index + 1, stages.length - 2)].key;
  if (crmSession?.access_token && remote.leads.some((item) => item.id === id)) {
    try {
      await apiFetch(`/leads/${id}/stage`, { method: 'POST', body: JSON.stringify({ status: next }) });
      await refreshRemoteData();
      notify('Lead actualizado.');
      return;
    } catch (err) {
      return notify(`No pude avanzar: ${err.message}`);
    }
  }
  lead.status = next;
  saveLocalLeads();
  renderAll();
}

async function createTask(id) {
  const lead = dataLeads().find((item) => item.id === id);
  if (!lead) return;
  if (!crmSession?.access_token) return notify('Conecta ROVI para crear tareas reales.');
  try {
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ lead_id: id, title: `Seguimiento: ${lead.name}`, priority: lead.priority || 'media' })
    });
    await refreshRemoteData();
    notify('Tarea creada.');
  } catch (err) {
    notify(`No pude crear tarea: ${err.message}`);
  }
}

async function createQuickEvent() {
  if (!crmSession?.access_token) return notify('Conecta ROVI para crear eventos reales.');
  const lead = dataLeads()[0];
  const starts = new Date(Date.now() + 60 * 60 * 1000);
  try {
    await apiFetch('/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        title: lead ? `Seguimiento: ${lead.name}` : 'Seguimiento ROVI',
        event_type: 'seguimiento',
        starts_at: starts.toISOString(),
        lead_id: lead?.id || null
      })
    });
    await refreshRemoteData();
    activateView('Calendar');
    notify('Evento creado.');
  } catch (err) {
    notify(`No pude crear evento: ${err.message}`);
  }
}

function draftMessage(id) {
  const lead = dataLeads().find((item) => item.id === id);
  if (!lead) return;
  const text = `Hola ${firstName(lead.name)}, te doy seguimiento sobre tu búsqueda. Tengo presente ${lead.raw_interest_text || lead.property_interest || 'lo que necesitas'} y quiero confirmar si sigue activa para pasarte opciones concretas.`;
  navigator.clipboard?.writeText(text);
  safeSendData({ type: 'draft_message', lead_id: id, message: text });
  notify('Mensaje copiado.');
}

async function importCandidates() {
  if (!crmSession?.access_token) return notify('Conecta ROVI para importar candidatos.');
  try {
    await apiFetch('/lead-candidates/import-local?limit=100', { method: 'POST' });
    const res = await apiFetch('/lead-candidates?limit=20');
    remote.candidates = res.candidates || [];
    renderCandidates();
    activateView('Capture');
    notify('Candidatos importados.');
  } catch (err) {
    notify(`No pude importar candidatos: ${err.message}`);
  }
}

async function convertCandidate(id) {
  if (!crmSession?.access_token) return;
  try {
    const res = await apiFetch(`/lead-candidates/${id}/convert`, { method: 'POST' });
    remote.leads.unshift(res.lead);
    remote.candidates = remote.candidates.filter((item) => item.id !== id);
    await refreshRemoteData();
    activateView('Leads');
    notify('Candidato convertido.');
  } catch (err) {
    notify(`No pude convertir: ${err.message}`);
  }
}

function updateConnection(title, detail) {
  byId('syncTitle').textContent = title;
  byId('crmStatus').textContent = detail;
}

function setLinkPanel(visible) {
  linkRequired = Boolean(visible);
  byId('linkAccountPanel').classList.toggle('hidden', !linkRequired);
}

function notify(message) {
  try { tg?.HapticFeedback?.impactOccurred('light'); } catch {}
  try {
    if (tg?.showPopup) return tg.showPopup({ title: 'ROVI Leads', message });
  } catch {}
  console.info(`[ROVI Leads] ${message}`);
}

function safeSendData(payload) {
  try { tg?.sendData?.(JSON.stringify(payload)); } catch {}
}

function localAnalysis(text) {
  return {
    priority: /urgente|hoy|visita/i.test(text) ? 'alta' : 'media',
    intent_score: /urgente|hoy|visita/i.test(text) ? 84 : 62,
    operation_type: /renta|rent|alquiler/i.test(text) ? 'rent' : 'sale',
    next_action: 'Confirmar zona, presupuesto, fecha ideal y agendar seguimiento.',
    suggested_message: 'Hola, gracias por tu mensaje. Me confirmas zona, presupuesto y fecha ideal para ayudarte mejor?'
  };
}

function formatAnalysis(analysis) {
  return [
    `Prioridad: ${priorityLabels[analysis.priority] || analysis.priority}`,
    `Intención: ${analysis.intent_score}%`,
    `Operación: ${analysis.operation_type === 'rent' ? 'Renta' : 'Venta'}`,
    `Siguiente paso: ${analysis.next_action}`,
    `Mensaje: ${analysis.suggested_message}`
  ].join('\n');
}

function extractName(text) {
  const match = text.match(/(?:cliente|contacto|nombre)[:\s]+([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ ]{1,34})/);
  return match?.[1]?.trim() || 'Contacto MiniApp';
}

function extractPhone(text) {
  return text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || '';
}

function extractBudget(text) {
  const match = text.match(/(?:presupuesto|budget|\\$)\\s*[:$]?\\s*([\\d,.]+)/i);
  if (!match) return 0;
  return Number(String(match[1]).replace(/[,.]/g, '')) || 0;
}

function initials(name = '') {
  const parts = String(name || 'Lead').trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase() || 'L';
}

function firstName(name = '') {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function nextEvent(events) {
  const now = Date.now();
  return [...events].filter((event) => new Date(event.start_time).getTime() >= now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];
}

function eventsToday(events) {
  const today = new Date().toDateString();
  return events.filter((event) => new Date(event.start_time).toDateString() === today);
}

function formatTime(value) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function hexToSoft(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},.12)`;
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

window.advanceLead = advanceLead;
window.createTask = createTask;
window.draftMessage = draftMessage;
window.convertCandidate = convertCandidate;

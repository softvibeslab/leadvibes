// Sesión y acceso a la API REST de ROVI (/api/*).
// Reusa el patrón ya existente: POST /api/telegram-miniapp/session + Bearer token.

import { ADMIN_ROLES } from './constants.js';

export const tg = window.Telegram?.WebApp || null;
export const urlParams = new URLSearchParams(window.location.search);
export const MOCK = urlParams.get('mock') === '1';

export const TIMEOUTS = {
  default: 10000,
  agent: 60000,
  confirm: 15000,
  team: 15000
};

let session = null;
let sessionExpiredHandler = null;
let mockModulePromise = null;

function mockModule() {
  if (!mockModulePromise) mockModulePromise = import('./mock.js');
  return mockModulePromise;
}

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status; // 0 = red/timeout
    this.data = data;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export function getSession() {
  return session;
}

export function setSession(next) {
  session = next;
}

export function getUser() {
  return session?.user || null;
}

export function getUserId() {
  const u = getUser();
  return u?.id || u?.user_id || null;
}

export function getRole() {
  return (session?.active_workspace?.role || session?.user?.role || 'broker').toLowerCase();
}

export function isAdminRole() {
  return ADMIN_ROLES.includes(getRole());
}

export function getWorkspaceName() {
  return session?.active_workspace?.name || session?.active_workspace?.tenant_name || '';
}

export function setSessionExpiredHandler(fn) {
  sessionExpiredHandler = fn;
}

export function getStartParam() {
  return (
    tg?.initDataUnsafe?.start_param ||
    urlParams.get('startapp') ||
    urlParams.get('tgWebAppStartParam') ||
    urlParams.get('code') ||
    ''
  );
}

async function fetchWithTimeout(url, options = {}, timeout = TIMEOUTS.default) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Bootstrap de sesión. Resultados posibles:
 *  { status: 'active' } | { status: 'link_required', data } |
 *  { status: 'no_telegram' } | { status: 'offline' } |
 *  { status: 'auth_failed' } | { status: 'error', http }
 */
export async function bootstrapSession({ silent = false } = {}) {
  if (MOCK) {
    const mod = await mockModule();
    session = mod.mockSession();
    return { status: 'active' };
  }
  if (!tg?.initData) return { status: 'no_telegram' };

  let res;
  try {
    res = await fetchWithTimeout('/api/telegram-miniapp/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ init_data: tg.initData, start_param: getStartParam() || null })
    });
  } catch {
    return { status: 'offline' };
  }

  if (res.status === 401 && !silent) {
    // Reintento único tras ready() (initData puede re-firmarse al reabrir)
    try {
      tg.ready();
    } catch {}
    return bootstrapSession({ silent: true });
  }
  if (res.status === 401) return { status: 'auth_failed' };
  if (!res.ok) return { status: 'error', http: res.status };

  let data = null;
  try {
    data = await res.json();
  } catch {
    return { status: 'error', http: res.status };
  }

  if (data.status === 'active') {
    session = data;
    return { status: 'active' };
  }
  if (data.status === 'link_required') return { status: 'link_required', data };
  return { status: 'error', http: res.status };
}

async function tryRefreshToken() {
  if (!session?.refresh_token) return false;
  try {
    const res = await fetchWithTimeout('/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.access_token) return false;
    session = {
      ...session,
      access_token: data.access_token,
      refresh_token: data.refresh_token || session.refresh_token
    };
    return true;
  } catch {
    return false;
  }
}

async function recoverSession() {
  if (await tryRefreshToken()) return true;
  const boot = await bootstrapSession({ silent: true });
  return boot.status === 'active';
}

/**
 * Llamada autenticada a la API. Lanza ApiError (status 0 = red/timeout).
 */
export async function api(path, { method = 'GET', body, timeout, _retried = false } = {}) {
  if (MOCK) {
    const mod = await mockModule();
    return mod.mockApi(path, { method, body });
  }

  const headers = { 'content-type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  let res;
  try {
    res = await fetchWithTimeout(
      path,
      { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined },
      timeout || TIMEOUTS.default
    );
  } catch (err) {
    throw new ApiError(0, err?.name === 'AbortError' ? 'Tiempo de espera agotado' : 'Sin conexión con ROVI');
  }

  if (res.status === 401 && !_retried) {
    const recovered = await recoverSession();
    if (recovered) return api(path, { method, body, timeout, _retried: true });
    sessionExpiredHandler?.();
    throw new ApiError(401, 'Sesión expirada');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : null;
    throw new ApiError(res.status, detail || `HTTP ${res.status}`, data);
  }
  return data;
}

// ---------- Endpoints tipados ----------

export function fetchLeads(params = {}) {
  const qs = new URLSearchParams();
  const multi = { status: params.status, priority: params.priority };
  for (const [key, values] of Object.entries(multi)) {
    for (const v of [].concat(values || [])) if (v) qs.append(key, v);
  }
  if (params.search) qs.set('search', params.search);
  qs.set('sort_by', params.sort_by || 'updated_at');
  qs.set('sort_order', params.sort_order || 'desc');
  qs.set('page', String(params.page || 1));
  qs.set('page_size', String(params.page_size || 20));
  return api(`/api/leads?${qs.toString()}`);
}

export function fetchLead(id) {
  return api(`/api/leads/${encodeURIComponent(id)}`);
}

export function updateLead(id, body) {
  return api(`/api/leads/${encodeURIComponent(id)}`, { method: 'PUT', body });
}

export function fetchTasks(due) {
  const qs = due ? `?due=${encodeURIComponent(due)}` : '';
  return api(`/api/tasks${qs}`);
}

export function updateTaskStatus(id, status) {
  return api(`/api/tasks/${encodeURIComponent(id)}/status`, { method: 'PUT', body: { status } });
}

export function fetchTodayEvents() {
  return api('/api/calendar/today');
}

export function fetchEvents(startIso, endIso) {
  const qs = new URLSearchParams();
  if (startIso) qs.set('start_date', startIso);
  if (endIso) qs.set('end_date', endIso);
  return api(`/api/calendar/events?${qs.toString()}`);
}

export function fetchProducts(params = {}) {
  const qs = new URLSearchParams({ is_active: 'true' });
  if (params.search) qs.set('search', params.search);
  if (params.operation_type) qs.set('operation_type', params.operation_type);
  if (params.niche) qs.set('niche', params.niche);
  return api(`/api/products?${qs.toString()}`);
}

export function fetchProduct(id) {
  return api(`/api/products/${encodeURIComponent(id)}`);
}

export function fetchLeaderboard() {
  return api('/api/dashboard/leaderboard', { timeout: TIMEOUTS.team });
}

export function fetchAgencyExecutive() {
  return api('/api/dashboard/agency-executive', { timeout: TIMEOUTS.team });
}

export function runAgent(message) {
  return api('/api/ai-agent/run', {
    method: 'POST',
    body: { message, include_context: true },
    timeout: TIMEOUTS.agent
  });
}

// Endpoints de acciones de agente (en desarrollo paralelo — contrato spec §5.2).
export function fetchAgentActions() {
  return api('/api/telegram-miniapp/agent-actions?status=pending_confirmation');
}

export function confirmAgentAction(id) {
  return api(`/api/telegram-miniapp/agent-actions/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    body: {},
    timeout: TIMEOUTS.confirm
  });
}

export function cancelAgentAction(id) {
  return api(`/api/telegram-miniapp/agent-actions/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: {}
  });
}

// Scope espejo de agent_control.scoped_entity_query (mitigación F3 mientras
// la API REST no aplica scope broker en backend).
export function leadVisibleForUser(lead) {
  if (isAdminRole()) return true;
  const uid = getUserId();
  if (!uid) return false;
  return lead.assigned_broker_id === uid || lead.created_by === uid;
}

export function filterVisibleLeads(leads) {
  return (leads || []).filter((l) => !l.deleted && leadVisibleForUser(l));
}

// ROVI Telegram MiniApp — entrypoint.
// Bootstrap de sesión (POST /api/telegram-miniapp/session), tab bar, tema
// Telegram claro/oscuro, deep links (startapp=lead_<id>) y estados globales.

import {
  tg,
  MOCK,
  bootstrapSession,
  getUser,
  getRole,
  getWorkspaceName,
  getStartParam,
  isAdminRole,
  setSessionExpiredHandler
} from './api.js';
import { esc, haptic, clearBackStack, toast } from './ui.js';
import * as today from './views/today.js';
import * as leads from './views/leads.js';
import * as agenda from './views/agenda.js';
import * as properties from './views/properties.js';
import * as chat from './views/chat.js';
import * as team from './views/team.js';
import {
  renderOnboarding,
  renderNoTelegram,
  renderOffline,
  renderAuthFailed,
  renderSessionExpired,
  stopPolling
} from './views/onboarding.js';

const ICONS = {
  today:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  leads:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  agenda:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  props:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  chat:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  team:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21V10M12 21V3M16 21v-7"/><path d="M2 21h20"/></svg>'
};

const TABS = [
  { id: 'today', label: 'Hoy', icon: 'today', view: today },
  { id: 'leads', label: 'Leads', icon: 'leads', view: leads },
  { id: 'agenda', label: 'Agenda', icon: 'agenda', view: agenda },
  { id: 'props', label: 'Inmuebles', icon: 'props', view: properties },
  { id: 'chat', label: 'Agente', icon: 'chat', view: chat },
  { id: 'team', label: 'Equipo', icon: 'team', view: team, adminOnly: true }
];

const viewEl = document.getElementById('view');
const tabbarEl = document.getElementById('tabbar');
const topbarUserEl = document.getElementById('topbarUser');

let currentTab = null;
let sessionGone = false;

// ---------- Tema ----------

function applyTheme() {
  let scheme = 'light';
  try {
    // Override solo para desarrollo en modo mock: ?mock=1&theme=dark|light
    const forced = MOCK ? new URLSearchParams(window.location.search).get('theme') : null;
    scheme =
      forced === 'dark' || forced === 'light'
        ? forced
        : tg?.colorScheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch {}
  document.documentElement.dataset.theme = scheme;
  const bg = scheme === 'dark' ? '#0B1426' : '#F8FAFC';
  try {
    tg?.setHeaderColor?.(bg);
    tg?.setBackgroundColor?.(bg);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

// ---------- Navegación ----------

function visibleTabs() {
  return TABS.filter((t) => !t.adminOnly || isAdminRole());
}

function buildTabbar() {
  tabbarEl.innerHTML = '';
  for (const tab of visibleTabs()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.dataset.tab = tab.id;
    btn.innerHTML = `${ICONS[tab.icon] || ''}<span>${esc(tab.label)}</span>`;
    btn.addEventListener('click', () => {
      haptic('light');
      navigate(tab.id);
    });
    tabbarEl.append(btn);
  }
}

export function navigate(tabId, params = null) {
  const tab = visibleTabs().find((t) => t.id === tabId) || TABS[0];
  currentTab = tab.id;
  clearBackStack();
  tabbarEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab.id));
  viewEl.innerHTML = '';
  window.scrollTo(0, 0);
  tab.view.render(viewEl, { navigate, params, isAdmin: isAdminRole() });
}

// ---------- Estados globales ----------

function showTopbarUser() {
  const user = getUser();
  if (!user) {
    topbarUserEl.innerHTML = '';
    return;
  }
  const ws = getWorkspaceName();
  topbarUserEl.innerHTML = `<b>${esc(user.name || user.email || '')}</b>${esc(getRole())}${ws ? ` · ${esc(ws)}` : ''}${
    MOCK ? ' · MOCK' : ''
  }`;
}

function handleSessionExpired() {
  if (sessionGone) return;
  sessionGone = true;
  tabbarEl.innerHTML = '';
  clearBackStack();
  renderSessionExpired(viewEl);
}

// ---------- Deep links ----------

function handleDeepLink() {
  const param = getStartParam();
  if (!param) return false;
  const leadMatch = /^lead[_-](.+)$/.exec(param);
  if (leadMatch) {
    navigate('leads', { leadId: leadMatch[1] });
    return true;
  }
  return false;
}

// ---------- Init ----------

async function init() {
  applyTheme();
  try {
    tg?.ready();
    tg?.expand();
    tg?.onEvent?.('themeChanged', applyTheme);
    tg?.disableVerticalSwipes?.();
  } catch (err) {
    console.info('[ROVI] Telegram SDK parcial:', err?.message);
  }

  setSessionExpiredHandler(handleSessionExpired);

  const boot = await bootstrapSession();

  switch (boot.status) {
    case 'active': {
      sessionGone = false;
      stopPolling();
      showTopbarUser();
      buildTabbar();
      if (!handleDeepLink()) navigate('today');
      if (MOCK) toast('Modo mock activo: datos de prueba', 'info');
      break;
    }
    case 'link_required':
      tabbarEl.innerHTML = '';
      renderOnboarding(viewEl, boot.data, () => init());
      break;
    case 'no_telegram':
      tabbarEl.innerHTML = '';
      renderNoTelegram(viewEl);
      break;
    case 'offline':
      tabbarEl.innerHTML = '';
      renderOffline(viewEl, () => init());
      break;
    case 'auth_failed':
      tabbarEl.innerHTML = '';
      renderAuthFailed(viewEl);
      break;
    default:
      tabbarEl.innerHTML = '';
      renderOffline(viewEl, () => init());
  }
}

init();

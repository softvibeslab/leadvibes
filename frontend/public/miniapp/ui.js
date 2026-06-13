// Helpers de UI: DOM, formato, haptics, toasts, bottom sheets, BackButton.

import { tg } from './api.js';

// ---------- Formato ----------

export function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[c]);
}

export function fmtMoney(n) {
  const num = Number(n);
  if (!n || Number.isNaN(num)) return '';
  return `$${num.toLocaleString('es-MX')}`;
}

export function fmtDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

export function fmtTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDay(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Hoy';
  if (same(d, tomorrow)) return 'Mañana';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function timeAgo(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function firstName(name = '') {
  return String(name).trim().split(/\s+/)[0] || '';
}

// ---------- DOM ----------

export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function skeletonList(n = 3) {
  return Array.from({ length: n }, () => '<div class="skeleton sk-card"></div>').join('');
}

export function emptyState(message, ctaLabel) {
  return `<div class="empty">${esc(message)}${
    ctaLabel ? `<br /><button class="btn btn-secondary" data-empty-cta>${esc(ctaLabel)}</button>` : ''
  }</div>`;
}

export function errorBlock(message = 'Sin conexión con ROVI') {
  return `<div class="error-block">${esc(message)}<br /><button class="btn" data-retry>Reintentar</button></div>`;
}

// ---------- Haptics / toasts ----------

export function haptic(kind = 'light') {
  try {
    if (['success', 'error', 'warning'].includes(kind)) {
      tg?.HapticFeedback?.notificationOccurred(kind);
    } else {
      tg?.HapticFeedback?.impactOccurred(kind);
    }
  } catch {}
}

export function toast(message, type = 'info') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const node = el(`<div class="toast toast-${esc(type)}"></div>`);
  node.textContent = message;
  root.append(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, 2600);
  haptic(type === 'error' ? 'error' : type === 'success' ? 'success' : 'light');
}

export async function copyText(text, okMessage = 'Copiado al portapapeles') {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMessage, 'success');
    return true;
  } catch {
    // Fallback: mostrar el texto seleccionable
    const content = el(
      `<div><p class="screen-sub">No pude acceder al portapapeles. Copia el texto manualmente:</p>
        <textarea class="input" rows="6" readonly></textarea></div>`
    );
    content.querySelector('textarea').value = text;
    openSheet(content, { title: 'Copiar texto' });
    return false;
  }
}

// ---------- BackButton de Telegram ----------

const backStack = [];

function updateBackButton() {
  try {
    if (backStack.length) tg?.BackButton?.show();
    else tg?.BackButton?.hide();
  } catch {}
}

export function pushBack(handler) {
  backStack.push(handler);
  updateBackButton();
}

export function removeBack(handler) {
  const idx = backStack.lastIndexOf(handler);
  if (idx >= 0) backStack.splice(idx, 1);
  updateBackButton();
}

export function clearBackStack() {
  backStack.length = 0;
  updateBackButton();
}

try {
  tg?.BackButton?.onClick(() => {
    const handler = backStack[backStack.length - 1];
    if (handler) handler();
  });
} catch {}

// ---------- Bottom sheet ----------

export function openSheet(contentEl, { title = '', onClose } = {}) {
  const root = document.getElementById('sheetRoot');
  const wrap = el(
    `<div class="sheet-backdrop">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        ${title ? `<h3 class="sheet-title">${esc(title)}</h3>` : ''}
        <div class="sheet-body"></div>
      </div>
    </div>`
  );
  wrap.querySelector('.sheet-body').append(contentEl);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.remove();
    removeBack(close);
    onClose?.();
  };
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) close();
  });
  pushBack(close);
  root.append(wrap);
  haptic('light');
  return { close, el: wrap, body: wrap.querySelector('.sheet-body') };
}

export function confirmDialog(message) {
  return new Promise((resolve) => {
    try {
      if (tg?.showConfirm) {
        tg.showConfirm(message, (ok) => resolve(Boolean(ok)));
        return;
      }
    } catch {}
    resolve(window.confirm(message));
  });
}

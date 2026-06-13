// Pantalla Chat agente (Hermes embebido, spec §3.5).
// Transporte: POST /api/ai-agent/run. Historial efímero por sesión (decisión Q5).
// Acciones pending_confirmation: tarjetas Aprobar/Rechazar vía /api/telegram-miniapp/agent-actions*.

import { runAgent } from '../api.js';
import { el, esc, toast, haptic } from '../ui.js';
import { loadPendingActions, actionCardEl, unavailableNotice, agentActionsUnavailable } from '../actions.js';

// Historial efímero: vive mientras la MiniApp esté abierta.
const messages = [];
let unavailableNoticeShown = false;

let container = null;
let logEl = null;
let actionsEl = null;
let inputEl = null;
let sendBtn = null;
let busy = false;

export function render(node, context) {
  container = node;
  container.innerHTML = `
    <h1 class="screen-title"><span class="msi fill accent" aria-hidden="true">forum</span> Agente ROVI</h1>
    <p class="screen-sub">Pide leads, tareas, citas o propiedades. Las escrituras sensibles requieren tu aprobación.</p>
    <div id="chatActions"></div>
    <div class="chat-wrap">
      <div id="chatLog" class="chat-log"></div>
      <div class="chat-input-row">
        <input id="chatInput" class="input" type="text" placeholder="Escríbele al agente…" autocomplete="off" />
        <button id="chatSend" class="btn btn-primary">Enviar</button>
      </div>
    </div>`;

  logEl = container.querySelector('#chatLog');
  actionsEl = container.querySelector('#chatActions');
  inputEl = container.querySelector('#chatInput');
  sendBtn = container.querySelector('#chatSend');

  if (context?.params?.draft) {
    inputEl.value = context.params.draft;
    setTimeout(() => inputEl.focus(), 100);
  }

  if (!messages.length) {
    pushMessage('agent', 'Hola, soy tu agente ROVI. Puedo buscar leads, preparar reuniones, redactar mensajes de WhatsApp y proponer acciones en el CRM. ¿Qué necesitas?');
  } else {
    repaintLog();
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  refreshPendingActions();
}

function repaintLog() {
  logEl.innerHTML = '';
  for (const msg of messages) {
    logEl.append(bubbleEl(msg));
  }
  scrollToEnd();
}

function bubbleEl(msg) {
  const node = el(`<div class="bubble ${esc(msg.role)}"></div>`);
  node.textContent = msg.text;
  if (msg.chips?.length) {
    const chips = el('<div class="chips"></div>');
    for (const chip of msg.chips) {
      chips.append(el(`<span class="tag ok">${esc(chip)}</span>`));
    }
    node.append(chips);
  }
  return node;
}

function pushMessage(role, text, chips) {
  const msg = { role, text, chips };
  messages.push(msg);
  logEl?.append(bubbleEl(msg));
  scrollToEnd();
  return msg;
}

function scrollToEnd() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
}

async function send() {
  const text = inputEl.value.trim();
  if (!text || busy) return;
  busy = true;
  haptic('light');
  inputEl.value = '';
  sendBtn.disabled = true;
  pushMessage('user', text);

  const typing = el('<div class="bubble agent"><span class="typing"><i></i><i></i><i></i></span></div>');
  logEl.append(typing);
  scrollToEnd();

  try {
    const res = await runAgent(text);
    typing.remove();
    const chips = [];
    const executed = (res?.tools_executed || []).filter((t) => t.executed && (t.record_ids || []).length);
    if (executed.length) {
      const count = executed.reduce((acc, t) => acc + t.record_ids.length, 0);
      chips.push(`Guardado en ROVI (${count} registro${count === 1 ? '' : 's'})`);
    }
    pushMessage('agent', res?.response || 'No obtuve respuesta del agente. Reintenta.', chips);
  } catch (err) {
    typing.remove();
    pushMessage(
      'error',
      err?.isNetwork
        ? 'El agente tardó demasiado o no hay conexión. El resto de la MiniApp sigue funcionando.'
        : `Error del agente: ${err?.message || 'desconocido'}`
    );
    toast('El agente no está disponible', 'error');
  } finally {
    busy = false;
    sendBtn.disabled = false;
    // Re-pinta tarjetas pendientes: el run pudo dejar acciones pending_confirmation.
    refreshPendingActions();
  }
}

async function refreshPendingActions() {
  if (!actionsEl) return;
  if (agentActionsUnavailable()) {
    if (!unavailableNoticeShown) {
      actionsEl.innerHTML = '';
      actionsEl.append(unavailableNotice());
      unavailableNoticeShown = true;
    }
    return;
  }
  const result = await loadPendingActions();
  if (result.unavailable) {
    if (!unavailableNoticeShown) {
      actionsEl.innerHTML = '';
      actionsEl.append(unavailableNotice());
      unavailableNoticeShown = true;
    }
    return;
  }
  if (!result.ok) return;
  actionsEl.innerHTML = '';
  if (!result.actions.length) return;
  actionsEl.append(
    el(`<div class="notice">Tienes ${result.actions.length} acción(es) pendiente(s) de aprobar. Apruébalas aquí; las creadas en la MiniApp no se confirman por texto en el bot.</div>`)
  );
  for (const action of result.actions) {
    actionsEl.append(actionCardEl(action, () => refreshPendingActions()));
  }
}

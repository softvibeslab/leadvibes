// Tarjetas de acciones pending_confirmation del agente (cola compartida bot ↔ MiniApp).
// Contrato spec §5.2: GET /api/telegram-miniapp/agent-actions, POST .../confirm, POST .../cancel.
// Endpoints en desarrollo paralelo: ante 404/405 se degrada a "función no disponible aún".

import { fetchAgentActions, confirmAgentAction, cancelAgentAction, ApiError } from './api.js';
import { el, esc, fmtDateTime, toast, haptic } from './ui.js';

let actionsUnavailable = false;

export function agentActionsUnavailable() {
  return actionsUnavailable;
}

/**
 * Devuelve { ok, actions } | { ok:false, unavailable:true } | { ok:false, error }.
 */
export async function loadPendingActions() {
  if (actionsUnavailable) return { ok: false, unavailable: true };
  try {
    const data = await fetchAgentActions();
    return { ok: true, actions: data?.actions || [] };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      actionsUnavailable = true;
      return { ok: false, unavailable: true };
    }
    return { ok: false, error: err };
  }
}

export function unavailableNotice() {
  return el(
    `<div class="notice">Aprobar acciones desde la MiniApp aún no está disponible. ` +
      `Mientras tanto confírmalas respondiendo "sí" o "no" en el chat del bot.</div>`
  );
}

const TYPE_LABELS = {
  create_lead: 'Crear lead',
  update_lead: 'Actualizar lead',
  delete_lead: 'Eliminar lead',
  create_task: 'Crear tarea',
  update_task: 'Actualizar tarea',
  delete_task: 'Eliminar tarea',
  create_event: 'Crear evento',
  update_event: 'Actualizar evento',
  delete_event: 'Eliminar evento',
  create_property: 'Crear propiedad',
  update_property: 'Actualizar propiedad'
};

function actionTitle(action) {
  return TYPE_LABELS[action.type] || (action.type || 'Acción del agente').replaceAll('_', ' ');
}

function actionPreview(action) {
  if (action.preview) return action.preview;
  if (action.requested_text) return action.requested_text;
  try {
    return JSON.stringify(action.payload || {}, null, 2).slice(0, 400);
  } catch {
    return '';
  }
}

/**
 * Crea la tarjeta Aprobar/Rechazar de una acción pendiente.
 * onResolved(action, outcome) se llama tras resolverla ('executed' | 'cancelled').
 */
export function actionCardEl(action, onResolved) {
  const isDelete = String(action.type || '').startsWith('delete');
  const card = el(
    `<article class="card action-card">
      <div class="card-head">
        <strong>${esc(actionTitle(action))}</strong>
        <span class="tag ${isDelete ? 'pr-alta' : 'warn'}">Pendiente</span>
      </div>
      <div class="preview">${esc(actionPreview(action))}</div>
      <div class="meta">${action.expires_at ? `Expira: ${esc(fmtDateTime(action.expires_at))}` : ''}</div>
      <div class="actions">
        <button class="btn btn-primary" data-approve>Aprobar</button>
        <button class="btn btn-danger" data-reject>Rechazar</button>
      </div>
      <div class="resolved" hidden></div>
    </article>`
  );

  const approveBtn = card.querySelector('[data-approve]');
  const rejectBtn = card.querySelector('[data-reject]');
  const resolved = card.querySelector('.resolved');

  const setBusy = (busy) => {
    approveBtn.disabled = busy;
    rejectBtn.disabled = busy;
  };

  const finish = (text, ok, outcome) => {
    card.querySelector('.actions').remove();
    resolved.hidden = false;
    resolved.textContent = text;
    resolved.classList.add(ok ? 'ok' : 'bad');
    card.querySelector('.tag').textContent = ok ? 'Resuelta' : 'No ejecutada';
    onResolved?.(action, outcome);
  };

  approveBtn.addEventListener('click', async () => {
    haptic('medium');
    setBusy(true);
    approveBtn.textContent = 'Ejecutando…';
    try {
      const res = await confirmAgentAction(action.id);
      if (res?.ok && res?.executed) {
        finish(`Ejecutado. ${res.message || ''}`.trim(), true, 'executed');
        toast('Acción ejecutada y auditada en ROVI', 'success');
      } else {
        finish(res?.message || 'No se pudo ejecutar la acción.', false, 'failed');
        toast(res?.message || 'No se pudo ejecutar', 'error');
      }
    } catch (err) {
      setBusy(false);
      approveBtn.textContent = 'Aprobar';
      if (err instanceof ApiError && err.status === 409) {
        finish('El preview expiró (30 min) o ya fue resuelta. Vuelve a pedirla al agente.', false, 'expired');
      } else if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        actionsUnavailable = true;
        finish('Función no disponible aún. Confírmala desde el chat del bot.', false, 'unavailable');
      } else {
        toast(err.message || 'Error al confirmar', 'error');
      }
    }
  });

  rejectBtn.addEventListener('click', async () => {
    haptic('medium');
    setBusy(true);
    rejectBtn.textContent = 'Cancelando…';
    try {
      await cancelAgentAction(action.id);
      finish('Cancelado. No guardé cambios.', false, 'cancelled');
    } catch (err) {
      setBusy(false);
      rejectBtn.textContent = 'Rechazar';
      if (err instanceof ApiError && err.status === 409) {
        finish('La acción ya estaba resuelta o expirada.', false, 'expired');
      } else if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        actionsUnavailable = true;
        finish('Función no disponible aún. Cancélala desde el chat del bot.', false, 'unavailable');
      } else {
        toast(err.message || 'Error al cancelar', 'error');
      }
    }
  });

  return card;
}

/**
 * Pinta acciones pendientes dentro de un contenedor. Devuelve cuántas pintó.
 */
export async function renderPendingActionsInto(container, { showEmpty = false } = {}) {
  const result = await loadPendingActions();
  container.innerHTML = '';
  if (result.unavailable) {
    container.append(unavailableNotice());
    return 0;
  }
  if (!result.ok) return 0;
  if (!result.actions.length) {
    if (showEmpty) container.innerHTML = '<div class="empty">Sin acciones pendientes de aprobar.</div>';
    return 0;
  }
  for (const action of result.actions) {
    container.append(actionCardEl(action));
  }
  return result.actions.length;
}

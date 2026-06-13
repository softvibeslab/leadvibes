// Pantallas de arranque sin sesión activa (spec §6.2, §6.4):
// - link_required → onboarding de vinculación con polling.
// - no_telegram → mensaje "abre desde Telegram".
// - offline / error / sesión expirada.

import { tg, bootstrapSession, getStartParam } from '../api.js';
import { el, esc, toast } from '../ui.js';

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 24; // ~2 minutos

let pollTimer = null;

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function renderOnboarding(container, data, onLinked) {
  stopPolling();
  const startCode = data?.start_code || getStartParam();
  container.innerHTML = `
    <div class="onboard">
      <div class="onboard-dot" aria-hidden="true"></div>
      <h2>Tu Telegram aún no está vinculado a ROVI</h2>
      ${data?.message ? `<p class="screen-sub">${esc(data.message)}</p>` : ''}
      ${
        startCode
          ? `<p>Detecté tu código de vinculación:</p>
             <div class="code-pill">${esc(startCode)}</div>
             <button class="btn btn-primary btn-block" data-link>Vincular ahora</button>
             <p class="screen-sub" style="margin-top:10px">O mándale <b>/start ${esc(startCode)}</b> al bot de ROVI.</p>`
          : `<ol>
              <li>Entra a <b>ROVI web → Agentes IA</b>.</li>
              <li>Genera tu QR de vinculación.</li>
              <li>Escanéalo o abre el deep link para mandarle <b>/start</b> al bot.</li>
              <li>Comparte tu teléfono cuando el bot te lo pida.</li>
            </ol>`
      }
      <div class="notice" id="onbStatus" style="margin-top:16px">Esperando vinculación…</div>
      <button class="btn btn-secondary btn-block" data-check>Ya vinculé</button>
    </div>`;

  const statusEl = container.querySelector('#onbStatus');

  container.querySelector('[data-link]')?.addEventListener('click', () => {
    try {
      tg?.sendData?.(
        JSON.stringify({
          type: 'rovi_device_link_start',
          code: startCode,
          telegramUser: tg?.initDataUnsafe?.user,
          requiresContact: true
        })
      );
    } catch {
      toast('Mándale /start al bot para vincular', 'info');
    }
  });

  const check = async (manual = false) => {
    const boot = await bootstrapSession({ silent: true });
    if (boot.status === 'active') {
      stopPolling();
      onLinked();
      return true;
    }
    if (manual) toast('Aún no veo el vínculo activo. Completa el flujo en el chat del bot.', 'error');
    return false;
  };

  container.querySelector('[data-check]').addEventListener('click', () => check(true));

  let attempts = 0;
  pollTimer = setInterval(async () => {
    attempts += 1;
    if (attempts > POLL_MAX_ATTEMPTS) {
      stopPolling();
      statusEl.textContent = 'Dejé de buscar automáticamente. Cuando termines en el bot, toca "Ya vinculé".';
      return;
    }
    statusEl.textContent = `Esperando vinculación… (intento ${attempts}/${POLL_MAX_ATTEMPTS})`;
    await check(false);
  }, POLL_INTERVAL_MS);
}

export function renderNoTelegram(container) {
  container.innerHTML = `
    <div class="onboard">
      <div class="onboard-dot" aria-hidden="true"></div>
      <h2>Abre esta app desde Telegram</h2>
      <p class="screen-sub">La MiniApp de ROVI se autentica con tu cuenta de Telegram vinculada.
      Ábrela desde el menú del bot de ROVI.</p>
      <p class="screen-sub">Para desarrollo local puedes usar <b>?mock=1</b> en la URL.</p>
    </div>`;
}

export function renderOffline(container, onRetry) {
  container.innerHTML = `
    <div class="onboard">
      <div class="onboard-dot" aria-hidden="true"></div>
      <h2>Sin conexión con ROVI</h2>
      <p class="screen-sub">No pude contactar la API. Revisa tu conexión.</p>
      <button class="btn btn-primary btn-block" data-retry>Reintentar</button>
    </div>`;
  container.querySelector('[data-retry]').addEventListener('click', onRetry);
}

export function renderAuthFailed(container) {
  container.innerHTML = `
    <div class="onboard">
      <div class="onboard-dot" aria-hidden="true"></div>
      <h2>No pude validar tu sesión</h2>
      <p class="screen-sub">Cierra y vuelve a abrir la MiniApp desde el bot de ROVI.
      Si abriste desde un bot de equipo, usa el bot principal.</p>
    </div>`;
}

export function renderSessionExpired(container) {
  container.innerHTML = `
    <div class="onboard">
      <div class="onboard-dot" aria-hidden="true"></div>
      <h2>Sesión expirada</h2>
      <p class="screen-sub">Cierra y vuelve a abrir la MiniApp desde el bot de ROVI.</p>
    </div>`;
}

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSocket, useWebSocketEvent } from '../hooks/useWebSocket';

const getNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getImportCount = (data, key) => getNumber(data?.[key] ?? data?.[`${key}_count`]);

const formatCount = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

const buildImportSummary = (data = {}) => {
  const imported = getImportCount(data, 'imported');
  const skipped = getImportCount(data, 'skipped');
  const errors = getImportCount(data, 'errors') || getNumber(data?.error_count);
  const links = getNumber(data?.links_created);
  const chunks = [formatCount(imported, 'importado', 'importados')];

  if (skipped > 0) chunks.push(formatCount(skipped, 'duplicado omitido', 'duplicados omitidos'));
  if (errors > 0) chunks.push(formatCount(errors, 'error', 'errores'));
  if (links > 0) chunks.push(formatCount(links, 'vínculo creado', 'vínculos creados'));

  return chunks.join(' · ');
};

const getDuplicateCount = (data = {}) => {
  const explicitCount = getNumber(data.duplicates_found);
  const nestedCount = (data.duplicates || []).reduce((total, duplicate) => {
    return total + getNumber(duplicate?.count, 1);
  }, 0);

  return Math.max(explicitCount, nestedCount);
};

const getDuplicateSourceLabel = (source) => {
  if (source === 'import') return 'importación';
  if (source === 'manual_check') return 'revisión manual';
  return 'CRM';
};

const useDedupedRealtimeEvent = (eventType, callback) => {
  const lastKeyRef = useRef('');

  useWebSocketEvent(eventType, useCallback((message) => {
    const key = [
      message?.type,
      message?.data?.job_id,
      message?.metadata?.timestamp,
      JSON.stringify(message?.data || {}),
    ].join(':');

    if (lastKeyRef.current === key) {
      return;
    }

    lastKeyRef.current = key;
    callback(message);
  }, [callback]));
};

export const RealtimeNotifications = () => {
  useWebSocket();

  const handleImportCompleted = useCallback((message) => {
    const data = message?.data || {};
    const errors = getImportCount(data, 'errors') || getNumber(data?.error_count);
    const hasErrors = errors > 0 || data.status === 'failed';
    const notify = hasErrors ? toast.warning : toast.success;

    notify(hasErrors ? 'Importación completada con pendientes' : 'Importación terminada', {
      description: buildImportSummary(data),
      duration: hasErrors ? 8000 : 6000,
    });
  }, []);

  const handleDuplicatesDetected = useCallback((message) => {
    const data = message?.data || {};
    const count = getDuplicateCount(data);

    if (count <= 0) {
      return;
    }

    toast.warning('Duplicados detectados', {
      description: `${count} posible${count === 1 ? '' : 's'} duplicado${count === 1 ? '' : 's'} en ${getDuplicateSourceLabel(data.source)}.`,
      duration: 8000,
    });
  }, []);

  useDedupedRealtimeEvent('import_completed', handleImportCompleted);
  useDedupedRealtimeEvent('duplicates_detected', handleDuplicatesDetected);

  return null;
};

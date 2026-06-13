// Constantes del pipeline real (backend/models.py:14-27, 1202)

export const LEAD_STATUSES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'calificacion', label: 'Calificación' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'apartado', label: 'Apartado' },
  { value: 'venta', label: 'Venta' },
  { value: 'perdido', label: 'Perdido' }
];

export const STATUS_LABELS = Object.fromEntries(LEAD_STATUSES.map((s) => [s.value, s.label]));

export const FINAL_STATUSES = ['venta', 'perdido'];

export const LEAD_PRIORITIES = ['baja', 'media', 'alta', 'urgente'];

export const EVENT_TYPE_LABELS = {
  seguimiento: 'Seguimiento',
  llamada: 'Llamada',
  zoom: 'Zoom',
  visita: 'Visita',
  otro: 'Otro'
};

export const ADMIN_ROLES = ['admin', 'manager', 'owner', 'agency_admin'];

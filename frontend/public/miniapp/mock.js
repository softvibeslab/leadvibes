// Mock en memoria para desarrollo local (?mock=1).
// Permite smoke-testear las 6 pantallas sin backend ni Telegram.
// Rol simulable con ?role=agency_admin (default broker).

import { ApiError, urlParams } from './api.js';

const ROLE = (urlParams.get('role') || 'broker').toLowerCase();
const USER_ID = 'mock-user-1';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const nowOffset = (mins) => new Date(Date.now() + mins * 60000).toISOString();

export function mockSession() {
  return {
    status: 'active',
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    token_type: 'bearer',
    expires_in: 86400,
    user: { id: USER_ID, name: 'Roger Demo', email: 'demo@rovi.mx', role: ROLE },
    active_workspace: { tenant_id: 'tenant-mock', role: ROLE, name: 'Tulum Realty Demo' },
    available_workspaces: [],
    device_link: { id: 'link-mock', status: 'active' }
  };
}

// ---------- Datos ----------

const leads = [
  lead('l1', 'Ana Torres', 'nuevo', 'urgente', 5500000, 'Aldea Zama', 'Condo 2 rec con rooftop', '+529841112233'),
  lead('l2', 'Carlos Pérez', 'contactado', 'alta', 3800000, 'La Veleta', 'Estudio para inversión', '+529842223344'),
  lead('l3', 'María López', 'calificacion', 'alta', 7200000, 'Tankah', 'Villa 3 rec frente al mar', '+529843334455'),
  lead('l4', 'John Smith', 'presentacion', 'media', 4500000, 'Aldea Zama', 'Penthouse con piscina', '+15554443322'),
  lead('l5', 'Lucía Gómez', 'apartado', 'media', 2900000, 'Región 15', 'Lote residencial', '+529844445566'),
  lead('l6', 'Peter Müller', 'venta', 'baja', 6100000, 'Tulum Centro', 'Local comercial', '+491701234567'),
  lead('l7', 'Sofía Ramírez', 'perdido', 'baja', 2100000, 'La Veleta', 'Depto 1 rec', '+529845556677'),
  lead('l8', 'Diego Fernández', 'nuevo', 'alta', 8400000, 'Tankah', 'Villa de lujo llave en mano', '+529846667788')
];

function lead(id, name, status, priority, budget, zone, interest, phone) {
  return {
    id,
    name,
    status,
    priority,
    phone,
    email: `${id}@demo.mx`,
    source: 'instagram',
    budget_mxn: budget,
    preferred_zone: zone,
    property_interest: interest,
    notes: 'Lead demo generado por el mock local.',
    tags: ['mock'],
    intent_score: 72,
    next_action: 'Enviar opciones que hagan match y agendar visita.',
    whatsapp_opt_out: false,
    assigned_broker_id: USER_ID,
    created_by: USER_ID,
    deleted: false,
    interested_product_ids: [],
    created_at: nowOffset(-60 * 24 * 3),
    updated_at: nowOffset(-90),
    last_contact: nowOffset(-60 * 24)
  };
}

const tasks = [
  { id: 't1', title: 'Llamar a Ana Torres para confirmar visita', status: 'pendiente', priority: 'alta', due_date: nowOffset(120), lead_id: 'l1', lead_name: 'Ana Torres' },
  { id: 't2', title: 'Enviar comparativa de precios a Carlos', status: 'en_progreso', priority: 'media', due_date: nowOffset(300), lead_id: 'l2', lead_name: 'Carlos Pérez' },
  { id: 't3', title: 'Subir fotos nuevas de Villa Tankah', status: 'pendiente', priority: 'media', due_date: nowOffset(-60 * 26), lead_id: null }
];

const events = [
  { id: 'e1', title: 'Visita Villa Tankah', event_type: 'visita', start_time: nowOffset(180), end_time: nowOffset(240), lead_id: 'l3', lead: { name: 'María López', phone: '+529843334455' }, synced_to_google: true },
  { id: 'e2', title: 'Zoom con John — penthouse', event_type: 'zoom', start_time: nowOffset(60 * 26), end_time: nowOffset(60 * 27), lead_id: 'l4', lead: { name: 'John Smith', phone: '+15554443322' } },
  { id: 'e3', title: 'Seguimiento Lucía apartado', event_type: 'seguimiento', start_time: nowOffset(60 * 50), end_time: nowOffset(60 * 51), lead_id: 'l5', lead: { name: 'Lucía Gómez', phone: '+529844445566' } }
];

const products = [
  product('p1', 'Condo Selva Zama 2 rec', 5450000, 'Aldea Zama', 'venta', 'residencial'),
  product('p2', 'Villa Akumal Ocean View', 12800000, 'Akumal', 'venta', 'lujo'),
  product('p3', 'Estudio Veleta Garden', 2750000, 'La Veleta', 'venta', 'inversion'),
  product('p4', 'Penthouse Luum Zama', 7900000, 'Aldea Zama', 'venta', 'lujo')
];

function product(id, title, price, zone, operation, niche) {
  return {
    id,
    title,
    sku: id.toUpperCase(),
    niche,
    operation_type: operation,
    price_mxn: price,
    is_active: true,
    images: [],
    location: { zone },
    features: { bedrooms: 2, bathrooms: 2 },
    description: 'Propiedad demo del mock local. Precios y disponibilidad no reales.',
    created_at: nowOffset(-60 * 24 * 20)
  };
}

let pendingActions = [
  {
    id: 'telegram-action-mock-1',
    type: 'create_task',
    status: 'pending_confirmation',
    preview: 'Crear tarea: "Enviar brochure Villa Tankah a María López" · vence mañana 10:00',
    requested_text: 'crea tarea para enviar el brochure a María',
    payload: { title: 'Enviar brochure Villa Tankah a María López' },
    created_at: nowOffset(-10),
    expires_at: nowOffset(20)
  }
];

const leaderboard = [
  { broker_id: USER_ID, broker_name: 'Roger Demo', total_points: 480, ventas: 2, apartados: 3, leads_asignados: 14, llamadas: 32, presentaciones: 6, rank: 1, month_progress: 0.4 },
  { broker_id: 'u2', broker_name: 'Paula Rivera', total_points: 350, ventas: 1, apartados: 2, leads_asignados: 11, llamadas: 25, presentaciones: 4, rank: 2, month_progress: 0.4 },
  { broker_id: 'u3', broker_name: 'Luis Cano', total_points: 210, ventas: 0, apartados: 2, leads_asignados: 9, llamadas: 18, presentaciones: 3, rank: 3, month_progress: 0.4 }
];

const agencyExecutive = {
  overview: {
    total_prospects: 34,
    qualified_leads: 12,
    opportunities: 8,
    expected_revenue: 18500000,
    closed_revenue: 11900000,
    conversion_rate: 5.9,
    sales_velocity_days: 21.5
  },
  team_performance: [
    { broker_id: USER_ID, broker_name: 'Roger Demo', leads_assigned: 14, conversion_rate: 14.3, ventas: 2, apartados: 3, points: 480 },
    { broker_id: 'u2', broker_name: 'Paula Rivera', leads_assigned: 11, conversion_rate: 9.1, ventas: 1, apartados: 2, points: 350 },
    { broker_id: 'u3', broker_name: 'Luis Cano', leads_assigned: 9, conversion_rate: 0, ventas: 0, apartados: 2, points: 210 }
  ],
  marketing_roi: [],
  top_properties: [],
  timeline: []
};

// ---------- Router ----------

export async function mockApi(path, { method = 'GET', body } = {}) {
  await delay();
  const url = new URL(path, window.location.origin);
  const p = url.pathname;
  const q = url.searchParams;

  // Leads
  if (p === '/api/leads' && method === 'GET') {
    let rows = [...leads];
    const statuses = q.getAll('status');
    const priorities = q.getAll('priority');
    const search = (q.get('search') || '').toLowerCase();
    if (statuses.length) rows = rows.filter((l) => statuses.includes(l.status));
    if (priorities.length) rows = rows.filter((l) => priorities.includes(l.priority));
    if (search) {
      rows = rows.filter((l) =>
        [l.name, l.phone, l.email, l.preferred_zone, l.property_interest].join(' ').toLowerCase().includes(search)
      );
    }
    const pageSize = Number(q.get('page_size') || 20);
    const page = Number(q.get('page') || 1);
    const slice = rows.slice((page - 1) * pageSize, page * pageSize);
    return { leads: slice, total: rows.length, page, page_size: pageSize, total_pages: Math.max(1, Math.ceil(rows.length / pageSize)) };
  }
  let m = p.match(/^\/api\/leads\/([^/]+)$/);
  if (m && method === 'GET') {
    const found = leads.find((l) => l.id === m[1]);
    if (!found) throw new ApiError(404, 'Lead no encontrado');
    return { ...found, activities: [{ id: 'a1', activity_type: 'nota', description: 'Lead creado desde el mock.', created_at: found.created_at }], assigned_broker: { id: USER_ID, name: 'Roger Demo' } };
  }
  if (m && method === 'PUT') {
    const found = leads.find((l) => l.id === m[1]);
    if (!found) throw new ApiError(404, 'Lead no encontrado');
    Object.assign(found, body || {}, { updated_at: new Date().toISOString() });
    return { message: 'Lead actualizado' };
  }

  // Tasks
  if (p === '/api/tasks' && method === 'GET') {
    const due = q.get('due');
    let rows = [...tasks];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    if (due === 'today') rows = rows.filter((t) => t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) < tomorrow);
    if (due === 'overdue') rows = rows.filter((t) => t.due_date && new Date(t.due_date) < today && !['completada', 'cancelada'].includes(t.status));
    return { tasks: rows, summary: { today: 2, overdue: 1, upcoming: 1 } };
  }
  m = p.match(/^\/api\/tasks\/([^/]+)\/status$/);
  if (m && method === 'PUT') {
    const found = tasks.find((t) => t.id === m[1]);
    if (!found) throw new ApiError(404, 'Tarea no encontrada');
    found.status = body?.status || found.status;
    return { message: 'Estado actualizado', task: found };
  }

  // Calendar
  if (p === '/api/calendar/today') {
    const today = new Date().toDateString();
    return events.filter((e) => new Date(e.start_time).toDateString() === today);
  }
  if (p === '/api/calendar/events' && method === 'GET') return [...events];

  // Products
  if (p === '/api/products' && method === 'GET') {
    const search = (q.get('search') || '').toLowerCase();
    let rows = [...products];
    if (search) rows = rows.filter((pr) => [pr.title, pr.location?.zone, pr.niche].join(' ').toLowerCase().includes(search));
    return rows;
  }
  m = p.match(/^\/api\/products\/([^/]+)$/);
  if (m && method === 'GET') {
    const found = products.find((pr) => pr.id === m[1]);
    if (!found) throw new ApiError(404, 'Producto no encontrado');
    return found;
  }

  // Dashboard
  if (p === '/api/dashboard/leaderboard') return leaderboard;
  if (p === '/api/dashboard/agency-executive') return agencyExecutive;

  // Agente
  if (p === '/api/ai-agent/run' && method === 'POST') {
    await delay(900);
    const msg = (body?.message || '').toLowerCase();
    if (msg.includes('elimina') || msg.includes('borra')) {
      const action = {
        id: `telegram-action-mock-${Date.now()}`,
        type: 'delete_lead',
        status: 'pending_confirmation',
        preview: 'Eliminar lead: Sofía Ramírez (perdido). Esta acción requiere tu confirmación.',
        requested_text: body?.message || '',
        payload: { lead_id: 'l7' },
        created_at: new Date().toISOString(),
        expires_at: nowOffset(30)
      };
      pendingActions.push(action);
      return {
        success: true,
        run_id: `run-${Date.now()}`,
        response: 'Preparé la eliminación, pero necesito tu confirmación. Revisa la tarjeta pendiente y aprueba o rechaza.',
        tools_executed: [{ tool: 'eliminar_lead', ok: true, executed: false, record_ids: [] }]
      };
    }
    if (msg.includes('reunión') || msg.includes('reunion') || msg.includes('prepara')) {
      return {
        success: true,
        run_id: `run-${Date.now()}`,
        response:
          'Brief de reunión\n— Lead: María López · presupuesto $7,200,000 · zona Tankah · busca villa 3 rec frente al mar.\n\nPreguntas de descubrimiento\n1. ¿La compra es para uso propio, renta vacacional o mixto?\n2. ¿Qué tan flexible es el presupuesto si aparece algo llave en mano?\n3. ¿Para cuándo necesitan cerrar?\n\nObjeciones probables\n— Precio por m2 en Tankah vs Aldea Zama.\n\nPropiedades sugeridas\n— Villa Akumal Ocean View ($12.8M, fuera de presupuesto pero referencia)\n— Penthouse Luum Zama ($7.9M)\n\nMensaje de confirmación WhatsApp\nHola María, te confirmo nuestra visita de mañana. Llevo dos opciones que cumplen lo que buscas frente al mar. ¿Nos vemos a las 11:00 en el lobby?',
        tools_executed: [
          { tool: 'buscar_leads', ok: true, executed: null, record_ids: [] },
          { tool: 'buscar_propiedades', ok: true, executed: null, record_ids: [] }
        ]
      };
    }
    if (msg.includes('whatsapp') || msg.includes('mensaje')) {
      return {
        success: true,
        run_id: `run-${Date.now()}`,
        response: 'Hola Ana, soy Roger de Tulum Realty. Encontré un condo en Aldea Zama con rooftop que entra en tu presupuesto. ¿Te mando fotos y agendamos visita esta semana?',
        tools_executed: [{ tool: 'buscar_leads', ok: true, executed: null, record_ids: [] }]
      };
    }
    if (msg.includes('crea') || msg.includes('tarea')) {
      return {
        success: true,
        run_id: `run-${Date.now()}`,
        response: 'Listo, guardé la tarea en ROVI con vencimiento hoy.',
        tools_executed: [{ tool: 'crear_tarea', ok: true, executed: true, record_ids: ['task-mock-9'] }]
      };
    }
    return {
      success: true,
      run_id: `run-${Date.now()}`,
      response:
        'Soy tu agente ROVI (modo mock). Puedo buscar leads, propiedades y tareas, preparar reuniones y proponer acciones. Prueba: "prepara la reunión con María" o "elimina el lead perdido".',
      tools_executed: []
    };
  }

  // Acciones pendientes
  if (p === '/api/telegram-miniapp/agent-actions' && method === 'GET') {
    return { actions: pendingActions.filter((a) => a.status === 'pending_confirmation' && new Date(a.expires_at) > new Date()) };
  }
  m = p.match(/^\/api\/miniapp\/agent-actions\/([^/]+)\/confirm$/);
  if (m && method === 'POST') {
    const action = pendingActions.find((a) => a.id === m[1]);
    if (!action) throw new ApiError(404, 'Acción no encontrada');
    if (action.status !== 'pending_confirmation') throw new ApiError(409, 'La acción ya fue resuelta');
    action.status = 'executed';
    return { ok: true, executed: true, message: 'Acción ejecutada (mock).', record_ids: ['rec-mock-1'] };
  }
  m = p.match(/^\/api\/miniapp\/agent-actions\/([^/]+)\/cancel$/);
  if (m && method === 'POST') {
    const action = pendingActions.find((a) => a.id === m[1]);
    if (!action) throw new ApiError(404, 'Acción no encontrada');
    if (action.status !== 'pending_confirmation') throw new ApiError(409, 'La acción ya fue resuelta');
    action.status = 'cancelled';
    return { ok: true, status: 'cancelled' };
  }

  throw new ApiError(404, `Mock sin ruta: ${method} ${p}`);
}

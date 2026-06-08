const DEMO_SEED = "rovi-demo-2026";

const demoUsers = [
  {
    prefix: "broker-calendar",
    id: "df57a442-0558-4f5c-b362-f1acf749f63e",
    tenant_id: "tenant-df57a442",
    name: "Broker Demo",
  },
  {
    prefix: "agency-calendar",
    id: "b0291a7f-0eca-436e-af19-4eac2e7d2180",
    tenant_id: "tenant-b0291a7f",
    name: "Inmobiliaria Demo",
  },
];

const now = new Date();

function id(prefix, index) {
  return `${DEMO_SEED}-${prefix}-${String(index).padStart(3, "0")}`;
}

function dateAt(offsetDays, hour, minute = 0) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

function iso(offsetDays, hour, minute = 0) {
  return dateAt(offsetDays, hour, minute).toISOString();
}

function addMinutes(isoDate, minutes) {
  const date = new Date(isoDate);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function eventFor(user, lead, index, title, eventType, offsetDays, hour, duration, color, completed = false) {
  const start = iso(offsetDays, hour);
  return {
    id: id(user.prefix, index),
    user_id: user.id,
    tenant_id: user.tenant_id,
    title,
    description: `Evento demo para visualizar agenda, recordatorios y seguimientos de ${lead?.name || "prospecto"}.`,
    event_type: eventType,
    start_time: start,
    end_time: addMinutes(start, duration),
    lead_id: lead?.id || null,
    reminder_minutes: 30,
    color,
    completed,
    google_event_id: null,
    synced_from_google: false,
    last_synced_at: null,
    demo_seed: DEMO_SEED,
    created_at: iso(-7 + (index % 5), 14),
  };
}

async function seedUserCalendar(user) {
  const leads = await db.leads
    .find(
      { tenant_id: user.tenant_id, demo_seed: DEMO_SEED },
      { _id: 0, id: 1, name: 1, phone: 1, status: 1, property_interest: 1 },
    )
    .sort({ updated_at: -1 })
    .limit(12)
    .toArray();

  if (!leads.length) {
    throw new Error(`No demo leads found for ${user.tenant_id}`);
  }

  await db.calendar_events.deleteMany({
    user_id: user.id,
    tenant_id: user.tenant_id,
    demo_seed: DEMO_SEED,
  });

  const templates = [
    ["Llamada de primer contacto", "llamada", 0, 15, 45, "#0D9488", false],
    ["Visita presencial a propiedad", "visita", 0, 18, 90, "#D97706", false],
    ["Zoom con inversionista", "zoom", 1, 16, 60, "#2563EB", false],
    ["Seguimiento de apartado", "seguimiento", 2, 17, 45, "#7C3AED", false],
    ["Enviar comparativa de propiedades", "otro", 3, 14, 30, "#64748B", false],
    ["Revision documental", "seguimiento", 4, 18, 60, "#0D9488", false],
    ["Recorrido privado", "visita", 5, 15, 90, "#D97706", false],
    ["Llamada post-visita", "llamada", 6, 16, 45, "#0D9488", false],
    ["Cierre de propuesta", "zoom", 8, 17, 60, "#2563EB", false],
    ["Bloqueo para analisis de pipeline", "bloqueo", 9, 13, 60, "#475569", false],
    ["Seguimiento completado", "seguimiento", -1, 12, 45, "#22C55E", true],
    ["Visita completada", "visita", -2, 11, 90, "#22C55E", true],
  ];

  const docs = templates.map((template, index) => {
    const lead = leads[index % leads.length];
    const [baseTitle, eventType, offsetDays, hour, duration, color, completed] = template;
    return eventFor(
      user,
      lead,
      index,
      `${baseTitle} - ${lead.name}`,
      eventType,
      offsetDays,
      hour,
      duration,
      color,
      completed,
    );
  });

  await db.calendar_events.insertMany(docs);
  return docs.length;
}

async function main() {
  const summary = {};
  for (const user of demoUsers) {
    summary[user.tenant_id] = await seedUserCalendar(user);
  }
  print(JSON.stringify({ ok: true, demo_seed: DEMO_SEED, summary }, null, 2));
}

main();

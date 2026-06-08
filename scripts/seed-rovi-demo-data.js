const DEMO_SEED = "rovi-demo-2026";

const brokerUser = {
  id: "df57a442-0558-4f5c-b362-f1acf749f63e",
  tenant_id: "tenant-df57a442",
  name: "Broker Demo",
  email: "broker@rovicrm.com",
  account_type: "individual",
};

const agencyUser = {
  id: "b0291a7f-0eca-436e-af19-4eac2e7d2180",
  tenant_id: "tenant-b0291a7f",
  name: "Inmobiliaria Demo",
  email: "inmobiliaria@rovicrm.com",
  account_type: "agency",
};

const now = new Date();
const tenants = [brokerUser.tenant_id, agencyUser.tenant_id];
const cleanupCollections = [
  "leads",
  "products",
  "lead_product_interests",
  "activities",
  "point_ledger",
  "campaigns",
  "campaign_metrics",
  "call_records",
  "sms_records",
  "whatsapp_records",
  "email_records",
  "calendar_events",
  "email_templates",
  "goals",
  "tasks",
  "tenant_memberships",
  "users",
];

function id(prefix, index) {
  return `${DEMO_SEED}-${prefix}-${String(index).padStart(3, "0")}`;
}

function daysAgo(days, hour = 10) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function daysFromNow(days, hour = 16) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function money(value) {
  return Math.round(value * 100) / 100;
}

function makeImage(index, label) {
  const urls = [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
  ];
  return {
    id: id("image", index),
    url: urls[index % urls.length],
    filename: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`,
    alt: label,
    is_cover: true,
    order: 0,
    source: "url",
  };
}

function product(seedPrefix, index, tenant, owner, title, price, zone, operationType = "sale", extra = {}) {
  return {
    id: id(`${seedPrefix}-product`, index),
    tenant_id: tenant,
    created_by: owner.id,
    sku: `ROVI-${seedPrefix.toUpperCase()}-${String(index).padStart(3, "0")}`,
    title,
    description: `${title} en ${zone}, con amenidades premium, alta plusvalia y perfil ideal para clientes de inversion patrimonial.`,
    product_type: "real_estate",
    operation_type: operationType,
    niche: extra.niche || "Residencial premium",
    price_mxn: price,
    commission_percentage: extra.commission || 3,
    responsible_broker_id: extra.responsible?.id || owner.id,
    responsible_broker_name: extra.responsible?.name || owner.name,
    responsible_broker_email: extra.responsible?.email || owner.email,
    monthly_rent_mxn: operationType === "rent" || operationType === "both" ? money(price * 0.006) : null,
    nightly_rent_mxn: operationType === "rent" || operationType === "both" ? money(price * 0.00045) : null,
    rental_type: operationType === "rent" || operationType === "both" ? "short_term" : null,
    features: extra.features || ["Alberca", "Seguridad 24/7", "Terraza", "Amenidades wellness"],
    aliases: extra.aliases || [title, zone],
    keywords: ["tulum", "lujo", "inversion", zone.toLowerCase()],
    external_id: null,
    is_active: true,
    assigned_campaigns: [],
    assigned_brokers: [extra.responsible?.id || owner.id],
    images: [makeImage(index, title)],
    custom_fields_data: {
      zona: zone,
      recamaras: extra.bedrooms || 3,
      banos: extra.bathrooms || 3,
      m2: extra.area || 220,
      entrega: extra.delivery || "Entrega inmediata",
    },
    demo_seed: DEMO_SEED,
    created_at: daysAgo(120 - index * 5),
    updated_at: daysAgo(10 - (index % 6)),
  };
}

function lead(seedPrefix, index, tenant, owner, broker, productDoc, status, source, budget, createdDaysAgo) {
  const firstNames = ["Camila", "Santiago", "Mariana", "Diego", "Valeria", "Mateo", "Renata", "Andres", "Lucia", "Emiliano"];
  const lastNames = ["Rivera", "Castillo", "Montes", "Navarro", "Garcia", "Velasco", "Paredes", "Herrera", "Vega", "Salazar"];
  const name = `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`;
  const createdAt = daysAgo(createdDaysAgo, 9 + (index % 8));
  const updatedAt = status === "venta"
    ? daysAgo(index % 4, 12)
    : daysAgo(Math.max(0, createdDaysAgo - 8 - (index % 16)), 12);
  const contactedStatuses = ["contactado", "calificacion", "presentacion", "apartado", "venta", "perdido"];
  return {
    id: id(`${seedPrefix}-lead`, index),
    tenant_id: tenant,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}.${seedPrefix}${index}@demo.rovicrm.com`,
    phone: `+52984${String(5000000 + index * 137).slice(0, 7)}`,
    status,
    priority: index % 5 === 0 ? "alta" : index % 7 === 0 ? "baja" : "media",
    source,
    operation_type: productDoc.operation_type === "rent" ? "rent" : "sale",
    pipeline_type: "sales",
    budget_mxn: budget,
    monthly_budget_mxn: productDoc.operation_type === "rent" ? productDoc.monthly_rent_mxn : null,
    nightly_budget_mxn: productDoc.operation_type === "rent" ? productDoc.nightly_rent_mxn : null,
    preferred_zone: productDoc.custom_fields_data.zona,
    property_interest: productDoc.title,
    raw_interest_text: `Interesado en ${productDoc.title}`,
    interest_source: source,
    interested_product_ids: [productDoc.id],
    interested_products_snapshot: [{
      id: productDoc.id,
      title: productDoc.title,
      price_mxn: productDoc.price_mxn,
      responsible_broker_id: productDoc.responsible_broker_id,
    }],
    tags: ["demo", source.toLowerCase().replace(/\s+/g, "-"), status],
    notes: `Lead demo para visualizar pipeline, KPIs y seguimiento de ${productDoc.title}.`,
    assigned_broker_id: broker.id,
    created_by: owner.id,
    intent_score: Math.min(96, 42 + index * 3 + (status === "venta" ? 18 : 0)),
    ai_analysis: {
      sentiment: status === "perdido" ? "neutral" : "positivo",
      intent_score: Math.min(96, 42 + index * 3),
      recommended_action: status === "nuevo" ? "Primer contacto por WhatsApp" : "Seguimiento consultivo",
    },
    next_action: status === "nuevo" ? "Enviar brochure inicial" : status === "apartado" ? "Confirmar documentos" : "Dar seguimiento",
    last_contact: contactedStatuses.includes(status) ? updatedAt : null,
    demo_seed: DEMO_SEED,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function leadForDb(leadDoc) {
  return {
    ...leadDoc,
    created_at: leadDoc.created_at instanceof Date ? leadDoc.created_at.toISOString() : leadDoc.created_at,
    updated_at: leadDoc.updated_at instanceof Date ? leadDoc.updated_at.toISOString() : leadDoc.updated_at,
    last_contact: leadDoc.last_contact instanceof Date ? leadDoc.last_contact.toISOString() : leadDoc.last_contact,
  };
}

function interest(seedPrefix, index, tenant, owner, leadDoc, productDoc) {
  const statusMap = {
    nuevo: "nuevo_interes",
    contactado: "contactado",
    calificacion: "envio_info",
    presentacion: "visita_agendada",
    apartado: "negociacion",
    venta: "cerrado",
    perdido: "descartado",
  };
  return {
    id: id(`${seedPrefix}-interest`, index),
    tenant_id: tenant,
    product_tenant_id: tenant,
    lead_id: leadDoc.id,
    product_id: productDoc.id,
    interest_type: "principal",
    interest_status: statusMap[leadDoc.status] || "nuevo_interes",
    priority: leadDoc.priority,
    source: leadDoc.source,
    notes: `Interes demo vinculado a ${productDoc.title}.`,
    created_by: owner.id,
    demo_seed: DEMO_SEED,
    created_at: leadDoc.created_at,
    updated_at: leadDoc.updated_at,
  };
}

function activityAndPoints(seedPrefix, baseIndex, tenant, broker, leadDoc) {
  const templates = [
    ["llamada", "Llamada inicial registrada", 8],
    ["whatsapp", "Envio de brochure y disponibilidad", 5],
    ["email", "Correo con propuesta comparativa", 4],
    ["zoom", "Presentacion virtual de propiedad", 12],
    ["visita", "Visita a propiedad agendada/realizada", 18],
  ];
  const statusActivities = {
    nuevo: [0],
    contactado: [0, 1],
    calificacion: [0, 1, 2],
    presentacion: [0, 1, 2, 3],
    apartado: [0, 1, 3, 4, 5],
    venta: [0, 1, 2, 3, 4, 6],
    perdido: [0, 1],
  };
  const docs = [];
  const points = [];
  const indexes = statusActivities[leadDoc.status] || [0];
  indexes.forEach((item, offset) => {
    let type;
    let description;
    let earned;
    if (item === 5) {
      [type, description, earned] = ["apartado", "Apartado confirmado con documentacion", 25];
    } else if (item === 6) {
      [type, description, earned] = ["venta", "Venta cerrada y comision estimada", 40];
    } else {
      [type, description, earned] = templates[item];
    }
    const activityId = id(`${seedPrefix}-activity`, baseIndex + offset);
    const createdAt = daysAgo(Math.max(0, Math.floor((now - leadDoc.created_at) / 86400000) - offset * 2), 11 + offset);
    docs.push({
      id: activityId,
      tenant_id: tenant,
      lead_id: leadDoc.id,
      broker_id: broker.id,
      created_by: broker.id,
      activity_type: type,
      description,
      outcome: `${description} para ${leadDoc.name}.`,
      points_earned: earned,
      demo_seed: DEMO_SEED,
      created_at: createdAt,
    });
    points.push({
      id: id(`${seedPrefix}-points`, baseIndex + offset),
      tenant_id: tenant,
      broker_id: broker.id,
      lead_id: leadDoc.id,
      activity_id: activityId,
      activity_type: type,
      points: earned,
      description,
      demo_seed: DEMO_SEED,
      created_at: createdAt,
    });
  });
  return { activities: docs, points };
}

function campaign(seedPrefix, index, tenant, owner, type, name, leads) {
  const recipients = leads.length;
  const sent = Math.max(0, recipients - (index % 2));
  const delivered = Math.max(0, sent - 1);
  return {
    id: id(`${seedPrefix}-campaign`, index),
    user_id: owner.id,
    tenant_id: tenant,
    name,
    campaign_type: type,
    message_template: type !== "email" ? "Hola {{nombre}}, tenemos una propiedad ideal para tu perfil en Tulum." : null,
    email_subject: type === "email" ? "Propiedades premium seleccionadas para ti" : null,
    email_template_id: type === "email" ? id(`${seedPrefix}-template`, 0) : null,
    lead_ids: leads.map((item) => item.id),
    lead_filter: { demo: true },
    status: "completed",
    total_recipients: recipients,
    sent_count: sent,
    delivered_count: delivered,
    failed_count: recipients - delivered,
    variant_a_sent_count: sent,
    variant_b_sent_count: 0,
    demo_seed: DEMO_SEED,
    created_at: daysAgo(25 - index * 4),
    started_at: daysAgo(24 - index * 4),
    completed_at: daysAgo(23 - index * 4),
  };
}

function communicationRecords(seedPrefix, tenant, owner, campaigns, leads) {
  const calls = [];
  const sms = [];
  const whatsapp = [];
  const emails = [];
  leads.slice(0, 14).forEach((leadDoc, index) => {
    const campaignDoc = campaigns[index % campaigns.length];
    const createdAt = daysAgo(20 - (index % 18), 10 + (index % 6));
    calls.push({
      id: id(`${seedPrefix}-call`, index),
      user_id: owner.id,
      tenant_id: tenant,
      lead_id: leadDoc.id,
      lead_name: leadDoc.name,
      phone: leadDoc.phone,
      campaign_id: campaignDoc.id,
      status: index % 6 === 0 ? "no_answer" : "completed",
      duration_seconds: 85 + index * 17,
      transcript: `Conversacion demo con ${leadDoc.name} sobre ${leadDoc.property_interest}.`,
      summary: "Lead confirma interes y solicita informacion adicional.",
      demo_seed: DEMO_SEED,
      created_at: createdAt,
      completed_at: createdAt,
    });
    sms.push({
      id: id(`${seedPrefix}-sms`, index),
      user_id: owner.id,
      tenant_id: tenant,
      lead_id: leadDoc.id,
      lead_name: leadDoc.name,
      phone: leadDoc.phone,
      message: `Hola ${leadDoc.name}, te comparto detalles de ${leadDoc.property_interest}.`,
      campaign_id: campaignDoc.id,
      twilio_sid: `DEMO-SMS-${seedPrefix}-${index}`,
      status: index % 5 === 0 ? "failed" : "delivered",
      demo_seed: DEMO_SEED,
      created_at: createdAt,
      sent_at: createdAt,
      delivered_at: index % 5 === 0 ? null : createdAt,
    });
    whatsapp.push({
      id: id(`${seedPrefix}-wa`, index),
      user_id: owner.id,
      tenant_id: tenant,
      lead_id: leadDoc.id,
      lead_name: leadDoc.name,
      phone: leadDoc.phone,
      message: `Brochure demo de ${leadDoc.property_interest}`,
      campaign_id: campaignDoc.id,
      status: index % 3 === 0 ? "read" : "delivered",
      demo_seed: DEMO_SEED,
      created_at: createdAt,
      sent_at: createdAt,
      delivered_at: createdAt,
      read_at: index % 3 === 0 ? createdAt : null,
    });
    emails.push({
      id: id(`${seedPrefix}-email`, index),
      user_id: owner.id,
      tenant_id: tenant,
      lead_id: leadDoc.id,
      lead_name: leadDoc.name,
      email: leadDoc.email,
      subject: `Opciones premium: ${leadDoc.property_interest}`,
      html_content: `<p>Hola ${leadDoc.name}, aqui tienes una propuesta demo de ${leadDoc.property_interest}.</p>`,
      campaign_id: campaignDoc.id,
      status: index % 4 === 0 ? "clicked" : index % 3 === 0 ? "opened" : "delivered",
      demo_seed: DEMO_SEED,
      created_at: createdAt,
      sent_at: createdAt,
      delivered_at: createdAt,
      opened_at: index % 3 === 0 || index % 4 === 0 ? createdAt : null,
      clicked_at: index % 4 === 0 ? createdAt : null,
    });
  });
  return { calls, sms, whatsapp, emails };
}

function metrics(seedPrefix, tenant, owner, campaigns, brokers) {
  const sources = ["Meta Ads", "Google Ads", "Landing Rovi", "Referidos", "Email"];
  const docs = [];
  for (let day = 0; day < 30; day += 3) {
    sources.forEach((source, sourceIndex) => {
      const impressions = 1200 + day * 37 + sourceIndex * 420;
      const clicks = 55 + day * 2 + sourceIndex * 18;
      const leads = 3 + (day + sourceIndex) % 6;
      const spend = source === "Referidos" ? 0 : 850 + day * 45 + sourceIndex * 330;
      docs.push({
        id: id(`${seedPrefix}-metric`, docs.length),
        tenant_id: tenant,
        campaign_id: campaigns[sourceIndex % campaigns.length].id,
        source,
        date: daysAgo(day, 8),
        impressions,
        clicks,
        conversions: Math.max(1, Math.floor(leads / 3)),
        spend,
        leads,
        ctr: money((clicks / impressions) * 100),
        cpc: clicks ? money(spend / clicks) : 0,
        cpl: leads ? money(spend / leads) : 0,
        roas: spend ? money((leads * 275000) / spend) : 0,
        property_views: clicks * 3,
        viewing_requests: Math.max(1, Math.floor(leads / 2)),
        brokerage_signed: sourceIndex % 3 === 0 ? 1 : 0,
        assigned_to: brokers[sourceIndex % brokers.length].id,
        assignment_type: sourceIndex % 2 === 0 ? "round_robin" : "manual",
        assigned_by: owner.id,
        demo_seed: DEMO_SEED,
        created_at: daysAgo(day, 8),
      });
    });
  }
  return docs;
}

function calendarEvents(seedPrefix, tenant, owner, brokers, leads) {
  return leads.slice(0, 8).map((leadDoc, index) => {
    const broker = brokers[index % brokers.length];
    const start = daysFromNow(index - 2, 10 + (index % 5));
    const end = new Date(start);
    end.setUTCHours(start.getUTCHours() + 1);
    return {
      id: id(`${seedPrefix}-event`, index),
      user_id: broker.id,
      tenant_id: tenant,
      title: `${index % 2 === 0 ? "Visita" : "Seguimiento"} - ${leadDoc.name}`,
      description: `Evento demo para ${leadDoc.property_interest}.`,
      event_type: index % 2 === 0 ? "visita" : "seguimiento",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      lead_id: leadDoc.id,
      reminder_minutes: 30,
      color: index % 2 === 0 ? "#0D9488" : "#D97706",
      completed: index < 2,
      synced_from_google: false,
      demo_seed: DEMO_SEED,
      created_at: daysAgo(5 + index).toISOString(),
    };
  });
}

function emailTemplates(seedPrefix, tenant, owner) {
  return [
    {
      id: id(`${seedPrefix}-template`, 0),
      user_id: owner.id,
      tenant_id: tenant,
      name: "Brochure propiedad premium",
      category: "property_promo",
      subject: "Tu seleccion premium en Tulum, {{nombre}}",
      html_content: "<h1>{{propiedad}}</h1><p>Hola {{nombre}}, esta propiedad coincide con tu perfil de inversion.</p>",
      json_content: { blocks: [{ type: "heading", text: "{{propiedad}}" }, { type: "text", text: "Propuesta personalizada" }] },
      variables: ["nombre", "propiedad", "precio"],
      is_default: false,
      demo_seed: DEMO_SEED,
      created_at: daysAgo(42),
      updated_at: daysAgo(4),
    },
    {
      id: id(`${seedPrefix}-template`, 1),
      user_id: owner.id,
      tenant_id: tenant,
      name: "Seguimiento post visita",
      category: "follow_up",
      subject: "Resumen de tu visita a {{propiedad}}",
      html_content: "<p>Gracias por visitar {{propiedad}}. Te compartimos proximos pasos y documentos.</p>",
      json_content: { blocks: [{ type: "text", text: "Resumen de visita" }] },
      variables: ["nombre", "propiedad"],
      is_default: false,
      demo_seed: DEMO_SEED,
      created_at: daysAgo(35),
      updated_at: daysAgo(3),
    },
  ];
}

function tasks(seedPrefix, tenant, owner, brokers, leads) {
  const items = [
    ["Llamar lead de alto intento", "Confirmar presupuesto y fecha tentativa de visita.", "urgente", "pendiente", 0],
    ["Enviar comparativa de propiedades", "Preparar tres opciones por ROI y zona.", "alta", "en_progreso", 1],
    ["Actualizar expediente de apartado", "Validar identificacion, enganche y contrato.", "alta", "pendiente", 2],
    ["Seguimiento post visita", "Enviar resumen con amenities y plan de pago.", "media", "pendiente", 4],
    ["Cerrar feedback de lead perdido", "Registrar objecion principal para analytics.", "baja", "completada", -1],
  ];
  return items.map((item, index) => ({
    id: id(`${seedPrefix}-task`, index),
    tenant_id: tenant,
    created_by: owner.id,
    title: item[0],
    description: item[1],
    status: item[3],
    priority: item[2],
    due_date: daysFromNow(item[4], 15),
    assigned_to: brokers[index % brokers.length].id,
    lead_id: leads[index % leads.length].id,
    tags: ["demo", "seguimiento"],
    checklist: [
      { id: id(`${seedPrefix}-task-check`, index * 2), title: "Revisar historial del lead", completed: index > 1 },
      { id: id(`${seedPrefix}-task-check`, index * 2 + 1), title: "Registrar resultado", completed: item[3] === "completada" },
    ],
    comments: [],
    deleted: false,
    source: "preview_demo",
    demo_seed: DEMO_SEED,
    created_at: daysAgo(7 + index),
    updated_at: daysAgo(index),
    completed_at: item[3] === "completada" ? daysAgo(1) : null,
  }));
}

function goals(seedPrefix, tenant, users) {
  return users.map((user, index) => ({
    id: id(`${seedPrefix}-goal`, index),
    user_id: user.id,
    tenant_id: tenant,
    ventas_mes: index === 0 ? 6 : 3,
    ingresos_objetivo: index === 0 ? 45000000 : 22000000,
    leads_contactados: index === 0 ? 60 : 28,
    tasa_conversion: index === 0 ? 14 : 11,
    apartados_mes: index === 0 ? 8 : 4,
    periodo: "mensual",
    utilidades_actuales_mensuales: index === 0 ? 950000 : 320000,
    utilidades_meta_mensuales: index === 0 ? 1800000 : 700000,
    demo_seed: DEMO_SEED,
    created_at: daysAgo(31),
    updated_at: daysAgo(2),
  }));
}

function seedWorkspace(seedPrefix, owner, productSpecs, statusPlan, brokerTeam) {
  const products = productSpecs.map((spec, index) => product(seedPrefix, index, owner.tenant_id, owner, ...spec));
  const sources = ["Meta Ads", "Google Ads", "Landing Rovi", "Referidos", "Email", "WhatsApp"];
  const leads = statusPlan.map((status, index) => {
    const productDoc = products[index % products.length];
    const broker = brokerTeam[index % brokerTeam.length];
    return lead(seedPrefix, index, owner.tenant_id, owner, broker, productDoc, status, sources[index % sources.length], productDoc.price_mxn - (index % 4) * 250000, 75 - index * 2);
  });
  const interests = leads.map((leadDoc, index) => interest(seedPrefix, index, owner.tenant_id, owner, leadDoc, products[index % products.length]));
  const activities = [];
  const points = [];
  leads.forEach((leadDoc, index) => {
    const broker = brokerTeam.find((item) => item.id === leadDoc.assigned_broker_id) || owner;
    const result = activityAndPoints(seedPrefix, index * 10, owner.tenant_id, broker, leadDoc);
    activities.push(...result.activities);
    points.push(...result.points);
  });
  const campaigns = [
    campaign(seedPrefix, 0, owner.tenant_id, owner, "email", "Nurturing inversionistas Tulum", leads.slice(0, 12)),
    campaign(seedPrefix, 1, owner.tenant_id, owner, "whatsapp", "Seguimiento WhatsApp visitas", leads.slice(5, 18)),
    campaign(seedPrefix, 2, owner.tenant_id, owner, "sms", "Recordatorio agenda de visitas", leads.slice(9, 22)),
    campaign(seedPrefix, 3, owner.tenant_id, owner, "call", "Llamadas lead caliente", leads.slice(0, 8)),
  ];
  const comms = communicationRecords(seedPrefix, owner.tenant_id, owner, campaigns, leads);
  return {
    products,
    leads: leads.map(leadForDb),
    interests,
    activities,
    points,
    campaigns,
    metrics: metrics(seedPrefix, owner.tenant_id, owner, campaigns, brokerTeam),
    calls: comms.calls,
    sms: comms.sms,
    whatsapp: comms.whatsapp,
    emails: comms.emails,
    events: calendarEvents(seedPrefix, owner.tenant_id, owner, brokerTeam, leads),
    templates: emailTemplates(seedPrefix, owner.tenant_id, owner),
    tasks: tasks(seedPrefix, owner.tenant_id, owner, brokerTeam, leads),
    goals: goals(seedPrefix, owner.tenant_id, brokerTeam),
  };
}

const agencyTeam = [
  agencyUser,
  {
    id: id("agency-user", 1),
    tenant_id: agencyUser.tenant_id,
    name: "Ana Broker Demo",
    email: "ana.broker.demo@rovicrm.com",
    role: "broker",
    account_type: "agency",
  },
  {
    id: id("agency-user", 2),
    tenant_id: agencyUser.tenant_id,
    name: "Luis Broker Demo",
    email: "luis.broker.demo@rovicrm.com",
    role: "broker",
    account_type: "agency",
  },
];

const brokerDataset = seedWorkspace(
  "broker",
  brokerUser,
  [
    ["Villa Ikal Tulum", 14500000, "Aldea Zama", "sale", { bedrooms: 4, bathrooms: 4, area: 310, commission: 3.5 }],
    ["Penthouse Selva Mar", 9800000, "La Veleta", "sale", { bedrooms: 3, bathrooms: 3, area: 210, commission: 3 }],
    ["Casa Nido Bahia", 17800000, "Tankah", "both", { bedrooms: 5, bathrooms: 5, area: 420, commission: 4 }],
    ["Departamento Aura Garden", 6200000, "Region 15", "sale", { bedrooms: 2, bathrooms: 2, area: 145, commission: 3 }],
  ],
  ["nuevo", "nuevo", "nuevo", "nuevo", "nuevo", "contactado", "contactado", "contactado", "contactado", "contactado", "calificacion", "calificacion", "calificacion", "calificacion", "presentacion", "presentacion", "presentacion", "presentacion", "apartado", "apartado", "apartado", "venta", "venta", "perdido"],
  [brokerUser],
);

const agencyDataset = seedWorkspace(
  "agency",
  agencyUser,
  [
    ["Residencial Ceiba Prime", 11200000, "Aldea Zama", "sale", { responsible: agencyTeam[1], bedrooms: 3, bathrooms: 3, area: 240, commission: 3.2 }],
    ["Villa Marfil Beachfront", 28500000, "Tankah", "sale", { responsible: agencyTeam[2], bedrooms: 5, bathrooms: 5, area: 520, commission: 4 }],
    ["Loft Kaan Jungle", 5400000, "Region 15", "both", { responsible: agencyTeam[0], bedrooms: 1, bathrooms: 1, area: 90, commission: 3 }],
    ["Casa Coral Boutique", 18900000, "Holistika", "sale", { responsible: agencyTeam[1], bedrooms: 4, bathrooms: 4, area: 360, commission: 3.8 }],
    ["Condo Brisa Private", 7200000, "La Veleta", "sale", { responsible: agencyTeam[2], bedrooms: 2, bathrooms: 2, area: 135, commission: 3 }],
    ["Villa Cenote Reserve", 32500000, "Francisco Uh May", "sale", { responsible: agencyTeam[0], bedrooms: 6, bathrooms: 6, area: 690, commission: 4.5 }],
  ],
  ["nuevo", "nuevo", "nuevo", "nuevo", "nuevo", "nuevo", "nuevo", "nuevo", "contactado", "contactado", "contactado", "contactado", "contactado", "contactado", "contactado", "contactado", "calificacion", "calificacion", "calificacion", "calificacion", "calificacion", "calificacion", "presentacion", "presentacion", "presentacion", "presentacion", "presentacion", "presentacion", "apartado", "apartado", "apartado", "apartado", "apartado", "venta", "venta", "venta", "venta", "venta", "perdido", "perdido"],
  agencyTeam,
);

function flatten() {
  return {
    products: [...brokerDataset.products, ...agencyDataset.products],
    leads: [...brokerDataset.leads, ...agencyDataset.leads],
    lead_product_interests: [...brokerDataset.interests, ...agencyDataset.interests],
    activities: [...brokerDataset.activities, ...agencyDataset.activities],
    point_ledger: [...brokerDataset.points, ...agencyDataset.points],
    campaigns: [...brokerDataset.campaigns, ...agencyDataset.campaigns],
    campaign_metrics: [...brokerDataset.metrics, ...agencyDataset.metrics],
    call_records: [...brokerDataset.calls, ...agencyDataset.calls],
    sms_records: [...brokerDataset.sms, ...agencyDataset.sms],
    whatsapp_records: [...brokerDataset.whatsapp, ...agencyDataset.whatsapp],
    email_records: [...brokerDataset.emails, ...agencyDataset.emails],
    calendar_events: [...brokerDataset.events, ...agencyDataset.events],
    email_templates: [...brokerDataset.templates, ...agencyDataset.templates],
    tasks: [...brokerDataset.tasks, ...agencyDataset.tasks],
    goals: [...brokerDataset.goals, ...agencyDataset.goals],
  };
}

async function main() {
  const requiredUsers = await db.users.find({ id: { $in: [brokerUser.id, agencyUser.id] } }, { id: 1, email: 1 }).toArray();
  if (requiredUsers.length !== 2) {
    throw new Error(`Expected both demo users to exist, found ${requiredUsers.length}`);
  }

  for (const collection of cleanupCollections) {
    if (collection === "users") {
      await db[collection].deleteMany({ tenant_id: agencyUser.tenant_id, demo_seed: DEMO_SEED });
      continue;
    }
    if (collection === "tenant_memberships") {
      await db[collection].deleteMany({ tenant_id: agencyUser.tenant_id, demo_seed: DEMO_SEED });
      continue;
    }
    await db[collection].deleteMany({ tenant_id: { $in: tenants }, demo_seed: DEMO_SEED });
  }

  await db.users.updateMany(
    { id: { $in: [brokerUser.id, agencyUser.id] } },
    { $set: { onboarding_completed: true, is_active: true, updated_at: now } },
  );

  const extraAgencyUsers = agencyTeam.slice(1).map((user, index) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "broker",
    account_type: "agency",
    tenant_id: agencyUser.tenant_id,
    personal_tenant_id: `personal-${user.id.slice(0, 8)}`,
    password_hash: "demo-user-not-for-login",
    is_active: true,
    onboarding_completed: true,
    demo_seed: DEMO_SEED,
    created_at: daysAgo(80 - index * 4),
    updated_at: now,
  }));
  if (extraAgencyUsers.length) {
    await db.users.insertMany(extraAgencyUsers);
  }

  const memberships = agencyTeam.slice(1).map((user, index) => ({
    id: id("agency-membership", index + 1),
    tenant_id: agencyUser.tenant_id,
    user_id: user.id,
    role: "broker",
    status: "active",
    is_default: false,
    demo_seed: DEMO_SEED,
    created_at: daysAgo(80 - index * 4),
    updated_at: now,
  }));
  if (memberships.length) {
    await db.tenant_memberships.insertMany(memberships);
  }

  const data = flatten();
  for (const [collection, docs] of Object.entries(data)) {
    if (docs.length) {
      await db[collection].insertMany(docs);
    }
  }

  const summary = {};
  for (const tenantId of tenants) {
    summary[tenantId] = {};
    for (const collection of ["leads", "products", "activities", "point_ledger", "campaigns", "campaign_metrics", "tasks"]) {
      summary[tenantId][collection] = await db[collection].countDocuments({ tenant_id: tenantId, demo_seed: DEMO_SEED });
    }
  }
  print(JSON.stringify({ ok: true, demo_seed: DEMO_SEED, summary }, null, 2));
}

main();

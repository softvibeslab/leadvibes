import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  IdCard,
  LayoutDashboard,
  MessageSquareShare,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Waypoints,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const benchmarkCards = [
  {
    title: 'Membresía activa',
    label: 'Pilar comercial',
    highlight: 'Renovación, valor percibido y uso recurrente',
    bullets: [
      'Membresías, renovaciones y recordatorios automáticos.',
      'Directorios, tarjetas digitales y comunidad con app móvil.',
      'Buena lógica de CRM/contactos y pagos recurrentes.',
    ],
    caution: 'La membresía debe sentirse útil semana a semana y no solo administrativa.',
  },
  {
    title: 'Operación institucional',
    label: 'Pilar operativo',
    highlight: 'Afiliaciones, eventos, pagos y ejecución diaria',
    bullets: [
      'Flujo fuerte para afiliaciones, eventos y asistentes.',
      'Backoffice con check-in, afiliados, métodos de pago y micrositios.',
      'Se siente más cercano al tipo de operación de cámaras y asociaciones.',
    ],
    caution: 'La operación debe ser simple para administración y potente para consejo y presidencias.',
  },
  {
    title: 'Propuesta COPIM',
    label: 'Oportunidad estratégica',
    highlight: 'Gobierno institucional + comunidad + CRM base + IA opcional',
    bullets: [
      'Capa consejo nacional, capa asociación y capa socio en un solo producto.',
      'CRM base incluido como beneficio de membresía, no como venta separada.',
      'Upsells claros para IA, automatización, analytics y operación premium.',
    ],
    caution: 'La venta debe enfocarse en valor institucional, no en “otro CRM más”.',
  },
];

const moduleViews = [
  {
    value: 'asociaciones',
    label: 'Asociaciones',
    icon: Building2,
    tagline: 'El núcleo operativo para COPIM y sus asociaciones afiliadas.',
    insight: 'La plataforma centraliza control multi-asociación, validaciones y permisos por rol.',
    included: [
      'Alta y estatus de asociaciones',
      'Roles COPIM, presidencia, VP y administración',
      'Validación de nuevos socios',
      'Tablero institucional nacional',
    ],
    premium: [
      'Benchmarking por asociación',
      'Flujos avanzados de aprobación',
      'Auditoría y bitácora ejecutiva',
    ],
    cards: [
      {
        title: 'Control nacional COPIM',
        metric: '9 asociaciones activas',
        description: 'Vista consolidada del consejo con permisos, altas y validaciones pendientes.',
        lines: [
          'Solicitudes por revisar: 14',
          'Asociaciones con membresía al día: 8/9',
          'Publicaciones globales pendientes: 3',
        ],
      },
      {
        title: 'Cola de aprobación',
        metric: '6 urgentes hoy',
        description: 'Mockup del flujo Presidente / Admin / COPIM descrito en el mapeo del intranet.',
        lines: [
          '2 nuevas asociaciones',
          '3 socios por validar',
          '1 curso nacional por aprobar',
        ],
      },
      {
        title: 'Mapa de expansión',
        metric: '+500 inmobiliarias',
        description: 'Querétaro, Guadalajara, Mérida, Sonora, Morelia, Chihuahua y más.',
        lines: [
          'Consejo nacional con vista por estado',
          'KPI por asociación',
          'Salud de membresía y participación',
        ],
      },
    ],
  },
  {
    value: 'socios',
    label: 'Socios',
    icon: IdCard,
    tagline: 'Perfil profesional, membresía activa y directorio vivo.',
    insight: 'Aquí convergen el perfil profesional, el directorio inteligente y el valor de certificación COPIM.',
    included: [
      'Perfil profesional y expediente básico',
      'Certificación y estatus de membresía',
      'Directorio filtrable por asociación, ciudad y especialidad',
      'Tarjeta digital con QR y beneficios',
    ],
    premium: [
      'Reputación y scoring por participación',
      'Portafolio inmobiliario y reputación comercial',
      'Sincronización extendida con herramientas externas',
    ],
    cards: [
      {
        title: 'Ficha del asociado',
        metric: 'Membresía activa',
        description: 'Nombre, asociación, certificaciones, experiencia, visibilidad y beneficios activos.',
        lines: [
          'CIIB Querétaro · Broker residencial',
          'Certificación COPIM vigente',
          'Renovación en 42 días',
        ],
      },
      {
        title: 'Directorio inteligente',
        metric: 'Filtros por rol',
        description: 'Búsqueda por ciudad, segmento, certificación, antigüedad y tipo de socio.',
        lines: [
          'Especialidad: preventa',
          'Zona: Bajío',
          'Asociación: CIIB',
        ],
      },
      {
        title: 'Credencial + beneficios',
        metric: 'QR + wallet',
        description: 'Inspirado en tarjetas digitales y experiencia móvil de membresía.',
        lines: [
          'Acceso a eventos',
          'Validez de certificación',
          'CRM base desbloqueado',
        ],
      },
    ],
  },
  {
    value: 'eventos',
    label: 'Eventos',
    icon: CalendarDays,
    tagline: 'Capacitación, congresos, check-in y seguimiento post-evento.',
    insight: 'La operación de eventos debe ir acompañada de trazabilidad institucional y seguimiento del socio.',
    included: [
      'Calendario de eventos y capacitaciones',
      'RSVP, tickets o registro interno',
      'Check-in y asistencia',
      'Historial del socio por evento',
    ],
    premium: [
      'Plantillas por tipo de evento',
      'Lead capture para aliados y patrocinadores',
      'Workflows post-evento y campañas automáticas',
    ],
    cards: [
      {
        title: 'Agenda COPIM',
        metric: '4 eventos este mes',
        description: 'Congreso, fiscal, certificación y networking con vista mensual y por asociación.',
        lines: [
          'Congreso nacional · 17 mayo',
          'Taller fiscal · 22 mayo',
          'Sesión directiva · 28 mayo',
        ],
      },
      {
        title: 'Check-in en sitio',
        metric: '86% asistencia',
        description: 'Pantalla de check-in estilo evento/afiliación con validación de socio y QR.',
        lines: [
          'Pendientes de llegada: 21',
          'Invitados externos: 12',
          'Acreditaciones emitidas: 96',
        ],
      },
      {
        title: 'Seguimiento post-evento',
        metric: 'CRM base listo',
        description: 'Cada interacción alimenta notas, contactos, oportunidades y tareas del CRM básico.',
        lines: [
          'Interés en certificación',
          'Solicitud de alianza',
          'Seguimiento comercial al broker',
        ],
      },
    ],
  },
  {
    value: 'comunidad',
    label: 'Comunidad',
    icon: MessageSquareShare,
    tagline: 'Red profesional, visibilidad y comunicación entre asociaciones.',
    insight: 'La capa de comunidad y engagement es clave para elevar retención y participación real.',
    included: [
      'Feed institucional y por asociación',
      'Grupos y comités temáticos',
      'Anuncios, vacantes y oportunidades',
      'Networking entre socios',
    ],
    premium: [
      'Mensajería avanzada y matchmaking',
      'Círculos privados por liderazgo',
      'App móvil branded de la comunidad',
    ],
    cards: [
      {
        title: 'Feed COPIM',
        metric: '52 interacciones',
        description: 'Noticias, acuerdos, oportunidades, avisos de cursos y contenido de valor para socios.',
        lines: [
          'Anuncio nacional',
          'Publicación de CIIB',
          'Convocatoria a foro',
        ],
      },
      {
        title: 'Comités y networking',
        metric: '6 grupos activos',
        description: 'Legal, fiscal, certificación, alianzas, bolsa inmobiliaria y liderazgo regional.',
        lines: [
          'Grupo fiscal',
          'Comité de certificación',
          'Canal de oportunidades',
        ],
      },
      {
        title: 'Comunicación segmentada',
        metric: 'Por rol y región',
        description: 'Anuncios segmentados por asociación, estatus de membresía, interés o cargo.',
        lines: [
          'VP y presidencias',
          'Socios activos',
          'Prospectos por validar',
        ],
      },
    ],
  },
  {
    value: 'pagos',
    label: 'Pagos',
    icon: WalletCards,
    tagline: 'Membresías, renovaciones, cobranza y valor económico por socio.',
    insight: 'La membresía necesita una operación financiera simple, visible y fácil de seguir.',
    included: [
      'Cuotas, renovaciones y comprobantes',
      'Planes anual, semestral o corporativo',
      'Recordatorios y cortes administrativos',
      'Resumen financiero por asociación',
    ],
    premium: [
      'Cobranza automatizada',
      'Split o revenue share por asociación',
      'Facturación y conciliación avanzada',
    ],
    cards: [
      {
        title: 'Membresía activa + CRM base',
        metric: 'Bundle principal',
        description: 'La cuota del socio desbloquea la plataforma y también el ROVI CRM base como beneficio de pertenencia.',
        lines: [
          'Perfil y contactos',
          'Seguimiento de leads básico',
          'Historial de actividades',
        ],
      },
      {
        title: 'Renovaciones',
        metric: '87% retención',
        description: 'Cobro, vencimientos, renovaciones y alertas para equipos administrativos.',
        lines: [
          '27 renovaciones este mes',
          '9 pagos atrasados',
          '3 membresías corporativas',
        ],
      },
      {
        title: 'Valor por socio',
        metric: '3 niveles de upsell',
        description: 'Desde la membresía incluida hasta IA, automatización y analytics avanzados.',
        lines: [
          'Base incluida',
          'Pro individual',
          'Pro institucional',
        ],
      },
    ],
  },
  {
    value: 'inteligencia',
    label: 'Inteligencia',
    icon: Bot,
    tagline: 'Métricas nacionales, automatización e IA como capa premium.',
    insight: 'Aquí ROVI puede diferenciarse: no solo gestionar, sino convertir datos de membresía y comunidad en crecimiento.',
    included: [
      'KPIs institucionales',
      'Reportes por asociación y evento',
      'Actividad del socio y salud de membresía',
      'Exportes para presidencia y consejo',
    ],
    premium: [
      'Copiloto IA para seguimiento',
      'Resúmenes automáticos y alertas inteligentes',
      'Predicción de churn, scoring y recomendaciones',
    ],
    cards: [
      {
        title: 'Sala de control COPIM',
        metric: 'Vista nacional',
        description: 'Renovación, participación, certificaciones, eventos y crecimiento por asociación.',
        lines: [
          'Top 3 asociaciones por actividad',
          'Riesgo de baja por socio',
          'Cumplimiento de metas anuales',
        ],
      },
      {
        title: 'Asistente IA',
        metric: 'Add-on premium',
        description: 'Resumen de acuerdos, seguimiento sugerido y drafts para comunicación o cobranza.',
        lines: [
          'Resumen ejecutivo semanal',
          'Próximos cobros en riesgo',
          'Socios ideales para liderazgo',
        ],
      },
      {
        title: 'Motor de crecimiento',
        metric: 'Revenue expansion',
        description: 'Segmentos para upsell, activación de socios y campañas basadas en comportamiento.',
        lines: [
          'Upgrade a Broker Pro',
          'Activación de socios dormidos',
          'Campañas por certificación',
        ],
      },
    ],
  },
];

const roadmapPhases = [
  {
    phase: 'Fase 1',
    title: 'Fundación institucional',
    window: '6 a 8 semanas',
    bullets: [
      'Asociaciones, socios, roles y permisos',
      'Validación de altas y directorio profesional',
      'Membresía activa, calendario y documentos',
      'CRM base incluido por socio',
    ],
  },
  {
    phase: 'Fase 2',
    title: 'Comunidad y operación',
    window: '4 a 6 semanas',
    bullets: [
      'Eventos, RSVP, check-in y seguimiento',
      'Feed institucional, grupos y networking',
      'Comunicación segmentada y acuerdos',
      'Cobranza y renovaciones más automatizadas',
    ],
  },
  {
    phase: 'Fase 3',
    title: 'Inteligencia y expansión',
    window: '4 a 6 semanas',
    bullets: [
      'Dashboard nacional y benchmarking',
      'Automatizaciones por asociación',
      'IA opcional para seguimiento y resúmenes',
      'Modelo comercial expandible a nuevas asociaciones',
    ],
  },
];

const pricingLayers = [
  {
    title: 'Membresía COPIM + CRM Base',
    audience: 'Incluido para cada socio activo',
    theme: 'from-[#0f4c81] via-[#0a66b2] to-[#39a7ff]',
    bullets: [
      'Perfil profesional y directorio',
      'Eventos, calendario y documentos',
      'Seguimiento básico en CRM ROVI',
      'Historial de actividad y recordatorios',
    ],
    note: 'Este bundle hace que la membresía tenga valor tangible desde el día uno.',
  },
  {
    title: 'Broker Pro',
    audience: 'Add-on por usuario',
    theme: 'from-[#0f766e] via-[#10b981] to-[#5eead4]',
    bullets: [
      'Automatizaciones personales',
      'Embudo más avanzado',
      'Plantillas y secuencias',
      'IA opcional para seguimiento',
    ],
    note: 'Perfecto para socios que ya usan la membresía y quieren vender mejor.',
  },
  {
    title: 'Asociación Pro',
    audience: 'Add-on por asociación',
    theme: 'from-[#7c2d12] via-[#ea580c] to-[#fdba74]',
    bullets: [
      'Aprobaciones y validaciones avanzadas',
      'Cobranza, campañas y control administrativo',
      'Dashboards de su propia asociación',
      'Comunicación segmentada institucional',
    ],
    note: 'Monetiza a nivel capítulo o asociación, no solo a nivel individuo.',
  },
  {
    title: 'Consejo Intelligence',
    audience: 'Licencia premium COPIM',
    theme: 'from-[#3f3f46] via-[#111827] to-[#020617]',
    bullets: [
      'Métricas nacionales y benchmarking',
      'Alertas de salud de red',
      'Reportes ejecutivos y planeación',
      'Copiloto IA para presidencia',
    ],
    note: 'Convierte a COPIM en una organización data-driven, no solo administrativa.',
  },
];

const salesReasons = [
  'El CRM base deja de ser un producto aislado y se vuelve un beneficio directo de la membresía.',
  'Los add-ons crean expansión de ingresos sin encarecer la entrada al ecosistema.',
  'COPIM gana visibilidad nacional de su red y cada asociación conserva autonomía operativa.',
  'La IA se vende como capa premium de productividad, no como requisito para adoptar el sistema.',
];

const SectionHeader = ({ eyebrow, title, description }) => (
  <div className="max-w-3xl space-y-4">
    <div className="inline-flex items-center gap-2 rounded-full border border-[#0d5ea8]/20 bg-[#0d5ea8]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#0d5ea8]">
      <Sparkles className="h-3.5 w-3.5" />
      {eyebrow}
    </div>
    <div className="space-y-3">
      <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      <p className="text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
    </div>
  </div>
);

const MetricPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="mt-2 text-2xl font-bold text-white">{value}</div>
  </div>
);

export const CopimPresentationPage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_26%),linear-gradient(180deg,_#f8fbff_0%,_#eef5fb_44%,_#ffffff_100%)]">
      <Helmet>
        <title>ROVI para COPIM | Mockup de Membresías, Comunidad y CRM</title>
        <meta
          name="description"
          content="Mockup estratégico de ROVI para COPIM: membresías, asociaciones, comunidad, eventos, pagos y CRM base con upsells de IA."
        />
      </Helmet>

      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,47,73,0.96)_0%,rgba(10,102,178,0.92)_48%,rgba(15,118,110,0.82)_100%)]" />
        <div className="absolute -left-24 top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap gap-3">
                <Badge className="rounded-full bg-white/14 px-4 py-1 text-white hover:bg-white/14">
                  Mockup estratégico
                </Badge>
                <Badge className="rounded-full bg-amber-300/20 px-4 py-1 text-amber-100 hover:bg-amber-300/20">
                  Plataforma COPIM sobre ROVI
                </Badge>
              </div>

              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-100/80">
                  COPIM · Membresías · Comunidad · CRM
                </p>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                  El sistema que convierte la membresía de COPIM en una experiencia viva, medible y escalable.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-cyan-50/88">
                  Esta propuesta integra operación institucional, membresía activa, comunidad y CRM base para
                  crear un producto claro: ROVI como capa base y una plataforma propia para asociaciones, socios,
                  comunidad y crecimiento.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white px-6 text-slate-950 hover:bg-cyan-50"
                >
                  <a href="#modulos">
                    Ver módulos mockup
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="#negocio">Ver plan de negocio</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-cyan-300/40 bg-cyan-300/10 px-6 text-cyan-50 hover:bg-cyan-300/20 hover:text-white"
                >
                  <a href="/copim-demo">Abrir dashboard demo</a>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricPill icon={Building2} label="Red actual" value="9 asociaciones" />
                <MetricPill icon={Users} label="Cobertura" value="+500 inmobiliarias" />
                <MetricPill icon={BadgeCheck} label="Promesa" value="CRM base incluido" />
              </div>
            </div>

            <div className="rounded-[32px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-white/10 bg-slate-950/45 text-white shadow-none">
                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge className="rounded-full bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/20">
                        Consejo COPIM
                      </Badge>
                      <ShieldCheck className="h-5 w-5 text-cyan-200" />
                    </div>
                    <CardTitle className="text-xl">Sala de control nacional</CardTitle>
                    <CardDescription className="text-cyan-50/70">
                      Asociaciones, membresía, validaciones, actividades globales y métricas institucionales.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {[
                      ['Solicitudes nuevas', '14'],
                      ['Renovación promedio', '87%'],
                      ['Eventos activos', '4'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <span className="text-sm text-cyan-50/70">{label}</span>
                        <span className="text-lg font-semibold">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="space-y-4 rounded-[28px] border border-white/10 bg-white p-5 text-slate-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                        Experiencia socio
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">Credencial + perfil + CRM lite</h3>
                    </div>
                    <IdCard className="h-10 w-10 rounded-2xl bg-[#0d5ea8]/10 p-2 text-[#0d5ea8]" />
                  </div>
                  <div className="rounded-[24px] bg-slate-950 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/70">Yoselin Álvarez</p>
                        <p className="text-lg font-semibold">CIIB · Membresía activa</p>
                      </div>
                      <Badge className="rounded-full bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/20">
                        Certificada
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <p className="text-white/60">Beneficio desbloqueado</p>
                        <p className="mt-1 font-semibold">ROVI CRM Base</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <p className="text-white/60">Renovación</p>
                        <p className="mt-1 font-semibold">42 días</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Comunidad
                      </p>
                      <p className="mt-2 text-base font-semibold">Networking por asociación y comité</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Upgrades
                      </p>
                      <p className="mt-2 text-base font-semibold">IA, automatización y analytics premium</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Síntesis competitiva"
          title="Qué debemos copiar, qué debemos tropicalizar y dónde ROVI puede ganar."
          description="Membresías, pagos, directorios y eventos son el centro del producto. La oportunidad de COPIM es sumar gobierno institucional, comunidad real y un CRM base que incremente el valor percibido de la membresía."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {benchmarkCards.map((card) => (
            <Card
              key={card.title}
              className="border-slate-200/80 bg-white/85 shadow-xl shadow-slate-200/60 backdrop-blur"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full border-[#0d5ea8]/20 bg-[#0d5ea8]/5 text-[#0d5ea8]">
                    {card.label}
                  </Badge>
                  <Waypoints className="h-5 w-5 text-[#0d5ea8]" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-950">{card.title}</CardTitle>
                  <CardDescription className="mt-2 text-base leading-7 text-slate-600">
                    {card.highlight}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {card.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  {card.caution}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="modulos" className="border-y border-slate-200/80 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
          eyebrow="Mockup funcional"
          title="Los módulos que COPIM sí debería ver en el demo."
          description="Todos estos bloques están pensados como mockup, sin backend nuevo todavía, pero ya alineados a la operación que COPIM necesita demostrar."
          />

          <Tabs defaultValue="asociaciones" className="mt-10 space-y-8">
            <div className="overflow-x-auto pb-3">
              <TabsList className="h-auto min-w-max gap-2 rounded-[22px] bg-slate-950/5 p-2">
                {moduleViews.map((module) => {
                  const Icon = module.icon;
                  return (
                    <TabsTrigger
                      key={module.value}
                      value={module.value}
                      className="rounded-2xl px-4 py-3 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {module.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {moduleViews.map((module) => {
              const Icon = module.icon;
              return (
                <TabsContent key={module.value} value={module.value}>
                  <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#0d5ea8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0d5ea8]">
                            <Icon className="h-3.5 w-3.5" />
                            {module.label}
                          </div>
                          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                            {module.tagline}
                          </h3>
                        </div>
                      </div>

                      <p className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm leading-6 text-cyan-950">
                        {module.insight}
                      </p>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Incluido en MVP
                          </p>
                          {module.included.map((item) => (
                            <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                              <p className="text-sm leading-6 text-slate-700">{item}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Upsell / premium
                          </p>
                          {module.premium.map((item) => (
                            <div key={item} className="flex gap-3 rounded-2xl bg-amber-50 px-4 py-3">
                              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                              <p className="text-sm leading-6 text-amber-950">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {module.cards.map((card, index) => (
                        <Card
                          key={card.title}
                          className={`overflow-hidden border-slate-200 bg-white shadow-xl shadow-slate-100 ${
                            index === 0 ? 'md:col-span-2' : ''
                          }`}
                        >
                          <CardHeader className="space-y-4 bg-[linear-gradient(180deg,rgba(13,94,168,0.08)_0%,rgba(255,255,255,0)_100%)]">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-300 bg-white/80 text-slate-700"
                              >
                                Mockup de pantalla
                              </Badge>
                              <LayoutDashboard className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                              <CardTitle className="text-2xl text-slate-950">{card.title}</CardTitle>
                              <CardDescription className="text-base leading-7 text-slate-600">
                                {card.description}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="rounded-[26px] bg-slate-950 p-5 text-white">
                              <p className="text-xs uppercase tracking-[0.24em] text-white/50">Indicador clave</p>
                              <p className="mt-3 text-3xl font-semibold">{card.metric}</p>
                              <div className="mt-4 h-2 rounded-full bg-white/10">
                                <div className="h-2 w-2/3 rounded-full bg-cyan-300" />
                              </div>
                            </div>
                            <div className="space-y-3">
                              {card.lines.map((line) => (
                                <div
                                  key={line}
                                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                                >
                                  <span>{line}</span>
                                  <ArrowRight className="h-4 w-4 text-slate-400" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Roadmap sugerido"
          title="Cómo aterrizarlo sin intentar construir todo al mismo tiempo."
          description="La mejor venta para Mario es mostrar un camino claro: primero el sistema operativo de asociaciones, luego el engagement y después la inteligencia premium."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {roadmapPhases.map((phase) => (
            <Card key={phase.title} className="border-slate-200 bg-white shadow-xl shadow-slate-100">
              <CardHeader className="space-y-4">
                <Badge className="w-fit rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                  {phase.phase}
                </Badge>
                <div>
                  <CardTitle className="text-2xl text-slate-950">{phase.title}</CardTitle>
                  <CardDescription className="mt-2 text-base text-slate-600">{phase.window}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {phase.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0d5ea8]" />
                    <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="negocio" className="border-y border-slate-200/80 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Plan de negocio"
            title="La membresía debe vender el ecosistema; la IA debe expandir el ticket."
            description="La recomendación más fuerte es no vender ROVI solo como software. Para COPIM funciona mejor un modelo por capas: CRM base incluido en la membresía y add-ons premium para quien sí necesita más potencia."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {pricingLayers.map((layer) => (
              <div
                key={layer.title}
                className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-1 shadow-2xl shadow-black/20`}
              >
                <div className={`h-full rounded-[26px] bg-gradient-to-br ${layer.theme} p-[1px]`}>
                  <div className="flex h-full flex-col rounded-[25px] bg-slate-950/92 p-6">
                    <div className="space-y-4">
                      <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
                        {layer.audience}
                      </Badge>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{layer.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/72">{layer.note}</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {layer.bullets.map((bullet) => (
                        <div key={bullet} className="flex gap-3 rounded-2xl bg-white/6 px-4 py-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                          <p className="text-sm leading-6 text-white/88">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-8 rounded-[32px] border border-white/10 bg-white/5 p-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <CircleDollarSign className="h-3.5 w-3.5" />
                Por qué este modelo sí escala
              </div>
              <h3 className="text-3xl font-semibold text-white">
                El mejor bundle para COPIM no es “software”, es pertenencia con resultado.
              </h3>
              <p className="text-base leading-7 text-white/72">
                Cuando el CRM base viene incluido, la membresía deja de sentirse pasiva y empieza a generar uso
                semanal. La capa premium entonces se vuelve una mejora natural, no una venta forzada.
              </p>
            </div>

            <div className="grid gap-4">
              {salesReasons.map((reason) => (
                <div key={reason} className="flex gap-3 rounded-2xl bg-white/7 px-5 py-4">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <p className="text-sm leading-6 text-white/88">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Narrativa de venta"
          title="La idea que conviene presentar a Mario."
          description="No estamos proponiendo solo digitalizar una asociación. Estamos proponiendo una plataforma que ordena la operación de COPIM, fortalece la red entre asociaciones y convierte la membresía en una oferta con más valor para cada socio."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Network,
              title: 'Infraestructura nacional',
              text: 'COPIM obtiene una capa consejo nacional con control, validación y métricas multi-asociación.',
            },
            {
              icon: BriefcaseBusiness,
              title: 'Beneficio tangible para el socio',
              text: 'Cada miembro recibe perfil, eventos, comunidad y ROVI CRM base sin pagar una herramienta aparte.',
            },
            {
              icon: BarChart3,
              title: 'Crecimiento y monetización',
              text: 'Los add-ons de IA, automatización y analytics crean una escalera de valor clara para socios y asociaciones.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-slate-200 bg-white shadow-xl shadow-slate-100">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d5ea8]/10 text-[#0d5ea8]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl text-slate-950">{item.title}</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">{item.text}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_46%,#ecfeff_100%)] p-8 shadow-xl shadow-slate-100">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                Mockup listo para conversación comercial
              </Badge>
              <h3 className="text-3xl font-semibold text-slate-950">
                “Esta plataforma impulsa más conexión, más control, más valor y más COPIM.”
              </h3>
              <p className="text-base leading-7 text-slate-600">
                Ese mensaje ya existe en la propuesta visual de COPIM. La ventaja de este mockup es que ahora la
                promesa ya viene aterrizada a módulos, fases y un plan de negocio que sí puede crecer sobre ROVI.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800">
                  <a href="/copim-demo">
                    Ver demo navegable
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Membresías', 'Cuotas, renovaciones, beneficios, CRM base'],
                ['Comunidad', 'Networking, feed, grupos y comunicación'],
                ['Operación', 'Eventos, documentos, validaciones y permisos'],
                ['Inteligencia', 'Dashboards, IA y monetización premium'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Propuesta preparada para presentación comercial de COPIM sobre ROVI.</span>
          <span>Este entregable es mockup visual, no incorpora backend nuevo ni lógica de negocio real todavía.</span>
        </div>
      </section>
    </div>
  );
};

export default CopimPresentationPage;

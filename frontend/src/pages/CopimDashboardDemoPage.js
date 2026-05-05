import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BellRing,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileStack,
  Globe2,
  LayoutDashboard,
  MessageSquareShare,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useAuth } from '../context/AuthContext';
import copimPlatformPoster from '../assets/copim-platform-poster.jpg';

const roleConfigs = {
  copim: {
    label: 'Consejo COPIM',
    subtitle: 'Vista nacional con control institucional y decisiones de red.',
    summary: 'Supervisa asociaciones, valida altas, mide renovación y define prioridades nacionales.',
    pill: 'Modo Presidencia Nacional',
  },
  president: {
    label: 'Presidencia de Asociación',
    subtitle: 'Gobierno local con validaciones, comunicación y desempeño de socios.',
    summary: 'Aprueba ingresos, impulsa participación y cuida la salud de membresía de su capítulo.',
    pill: 'Modo Asociación Líder',
  },
  admin: {
    label: 'Administración Operativa',
    subtitle: 'Backoffice para socios, pagos, eventos y expedientes.',
    summary: 'Gestiona la operación diaria y convierte procesos manuales en flujos claros.',
    pill: 'Modo Operación',
  },
  member: {
    label: 'Socio Profesional',
    subtitle: 'Membresía activa con beneficios, comunidad y CRM base.',
    summary: 'Consulta eventos, usa su credencial, participa en comunidad y da seguimiento comercial.',
    pill: 'Modo Socio Activo',
  },
};

const associations = [
  { value: 'global', label: 'Vista nacional COPIM' },
  { value: 'ciib', label: 'CIIB Querétaro' },
  { value: 'pais', label: 'PAIS Guadalajara' },
  { value: 'inapim', label: 'INAPIM Mérida' },
  { value: 'pimac', label: 'PIMAC Morelia' },
];

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'associations', label: 'Asociaciones', icon: Building2 },
  { id: 'members', label: 'Socios', icon: Users },
  { id: 'memberships', label: 'Membresías', icon: WalletCards },
  { id: 'events', label: 'Eventos', icon: CalendarDays },
  { id: 'community', label: 'Comunidad', icon: MessageSquareShare },
  { id: 'intelligence', label: 'Inteligencia', icon: Bot },
];

const copimModuleRouteMap = {
  overview: 'dashboard',
  associations: 'associations',
  members: 'members',
  memberships: 'memberships',
  events: 'events',
  community: 'community',
  intelligence: 'intelligence',
};

const copimRouteModuleMap = Object.fromEntries(
  Object.entries(copimModuleRouteMap).map(([moduleId, routeSegment]) => [routeSegment, moduleId])
);

const pitchSequence = [
  {
    step: '01',
    title: 'Control nacional',
    body: 'Abrir con Consejo COPIM y mostrar visibilidad multi-asociación.',
  },
  {
    step: '02',
    title: 'Valor al socio',
    body: 'Enseñar membresía, credencial, directorio y CRM base incluido.',
  },
  {
    step: '03',
    title: 'Expansión premium',
    body: 'Cerrar con IA, automatización y monetización por capas.',
  },
];

const executiveWins = [
  'Más control institucional',
  'Más retención de membresía',
  'Más valor visible para el socio',
];

const defaultCopimViewByRole = {
  copim_admin: 'copim',
  copim_operator: 'admin',
  copim_member: 'member',
};

const associationCards = [
  {
    id: 'ciib',
    name: 'CIIB Querétaro',
    state: 'Querétaro',
    members: 124,
    growth: '+12%',
    renewal: 91,
    activity: 'Alta',
  },
  {
    id: 'pais',
    name: 'PAIS Guadalajara',
    state: 'Jalisco',
    members: 88,
    growth: '+7%',
    renewal: 84,
    activity: 'Media',
  },
  {
    id: 'inapim',
    name: 'INAPIM Mérida',
    state: 'Yucatán',
    members: 74,
    growth: '+9%',
    renewal: 89,
    activity: 'Alta',
  },
  {
    id: 'pimac',
    name: 'PIMAC Morelia',
    state: 'Michoacán',
    members: 61,
    growth: '+5%',
    renewal: 79,
    activity: 'En riesgo',
  },
];

const memberDirectory = [
  {
    id: 1,
    name: 'Yoselin Álvarez',
    association: 'CIIB Querétaro',
    specialty: 'Broker residencial',
    status: 'Activa',
    certification: 'COPIM C17',
  },
  {
    id: 2,
    name: 'Mario Palomares',
    association: 'CIIB Querétaro',
    specialty: 'Dirección institucional',
    status: 'Activa',
    certification: 'Consejo',
  },
  {
    id: 3,
    name: 'Roberto Sánchez',
    association: 'INAPIM Mérida',
    specialty: 'Desarrollo y alianzas',
    status: 'Renovación',
    certification: 'COPIM C17',
  },
  {
    id: 4,
    name: 'Viviana Ortega',
    association: 'PAIS Guadalajara',
    specialty: 'Marketing inmobiliario',
    status: 'Activa',
    certification: 'Instructora',
  },
];

const initialPendingMembers = [
  {
    id: 101,
    name: 'Fernanda Ruiz',
    association: 'CIIB Querétaro',
    role: 'Socia solicitante',
    note: 'Expediente completo. Solicita acceso a directorio y eventos.',
  },
  {
    id: 102,
    name: 'Carlos Méndez',
    association: 'INAPIM Mérida',
    role: 'Broker comercial',
    note: 'Pendiente validación de constancia fiscal y entrevista breve.',
  },
  {
    id: 103,
    name: 'Andrea Lugo',
    association: 'PAIS Guadalajara',
    role: 'Asesora inmobiliaria',
    note: 'Cumple experiencia y quiere certificación en la próxima generación.',
  },
];

const initialRenewals = [
  {
    id: 201,
    name: 'Jesús Montero',
    association: 'PIMAC Morelia',
    plan: 'Anual Pro',
    dueIn: '5 días',
    amount: '$3,900 MXN',
    status: 'Urgente',
    reminderSent: false,
  },
  {
    id: 202,
    name: 'Patricia Solís',
    association: 'CIIB Querétaro',
    plan: 'Membresía Base',
    dueIn: '12 días',
    amount: '$1,800 MXN',
    status: 'Seguimiento',
    reminderSent: true,
  },
  {
    id: 203,
    name: 'Luis Aguirre',
    association: 'INAPIM Mérida',
    plan: 'Anual Pro',
    dueIn: '18 días',
    amount: '$3,900 MXN',
    status: 'A tiempo',
    reminderSent: false,
  },
];

const initialEvents = [
  {
    id: 301,
    title: 'Congreso inmobiliario COPIM',
    date: '17 mayo',
    mode: 'Nacional',
    attendees: 126,
    checkedIn: 94,
    type: 'Congreso',
  },
  {
    id: 302,
    title: 'Sesión de acuerdos y comité fiscal',
    date: '22 mayo',
    mode: 'Virtual',
    attendees: 43,
    checkedIn: 21,
    type: 'Comité',
  },
  {
    id: 303,
    title: 'Certificación C17 - nueva generación',
    date: '28 mayo',
    mode: 'Querétaro',
    attendees: 38,
    checkedIn: 0,
    type: 'Capacitación',
  },
];

const communityFeed = [
  {
    id: 401,
    author: 'Comité Nacional',
    title: 'Nuevo acuerdo sobre directorio nacional',
    body: 'Se aprueba visibilidad por especialidad y estado para fortalecer referidos entre asociaciones.',
    tag: 'Acuerdo',
  },
  {
    id: 402,
    author: 'CIIB Querétaro',
    title: 'Convocatoria a networking con desarrolladores',
    body: 'Abrimos 30 lugares para socios con membresía activa y CRM base ya habilitado.',
    tag: 'Evento',
  },
  {
    id: 403,
    author: 'Mesa Fiscal',
    title: 'Resumen express de cambios fiscales',
    body: 'Se publica recurso descargable y webinar de seguimiento para socios certificados.',
    tag: 'Recurso',
  },
];

const aiInsights = [
  {
    id: 'a1',
    title: 'Renovación en riesgo',
    description: 'PIMAC Morelia cayó a 79% de renovación. Conviene activar campaña y llamada de presidencia esta semana.',
  },
  {
    id: 'a2',
    title: 'Upsell listo',
    description: '27 socios usan el CRM base cada semana. Son candidatos naturales para Broker Pro con automatizaciones.',
  },
  {
    id: 'a3',
    title: 'Actividad destacada',
    description: 'CIIB Querétaro concentra la mayor participación en eventos y comunidad. Puede servir como caso piloto.',
  },
];

const quickActions = [
  {
    id: 'approve',
    label: 'Aprobar siguiente socio',
    icon: UserCheck,
  },
  {
    id: 'renewal',
    label: 'Enviar recordatorio de renovación',
    icon: BellRing,
  },
  {
    id: 'checkin',
    label: 'Registrar check-in',
    icon: ScanLine,
  },
  {
    id: 'summary',
    label: 'Generar resumen IA',
    icon: Sparkles,
  },
];

const membershipPlans = [
  {
    title: 'Membresía COPIM + CRM Base',
    value: 'Incluida',
    description: 'Perfil, directorio, eventos, documentos y CRM base para cada socio activo.',
    accent: 'from-[#0f4c81] to-[#1f8ced]',
  },
  {
    title: 'Broker Pro',
    value: '$790 / mes',
    description: 'Automatizaciones, pipeline extendido y productividad comercial avanzada.',
    accent: 'from-[#0f766e] to-[#34d399]',
  },
  {
    title: 'Asociación Pro',
    value: '$5,900 / mes',
    description: 'Cobranza, campañas, dashboards propios y operación administrativa avanzada.',
    accent: 'from-[#b45309] to-[#f59e0b]',
  },
];

const statusStyles = {
  Activa: 'bg-emerald-100 text-emerald-900',
  Renovación: 'bg-amber-100 text-amber-900',
  Urgente: 'bg-rose-100 text-rose-900',
  Seguimiento: 'bg-sky-100 text-sky-900',
  'A tiempo': 'bg-emerald-100 text-emerald-900',
  Alta: 'bg-emerald-100 text-emerald-900',
  Media: 'bg-amber-100 text-amber-900',
  'En riesgo': 'bg-rose-100 text-rose-900',
};

const overviewCardsByRole = {
  copim: [
    { label: 'Asociaciones activas', value: '9', helper: '1 nueva en validación', icon: Building2 },
    { label: 'Renovación nacional', value: '87%', helper: 'Meta 90%', icon: BadgeCheck },
    { label: 'Eventos del mes', value: '4', helper: '126 asistentes confirmados', icon: CalendarClock },
    { label: 'Upsell potencial', value: '27', helper: 'Socios listos para Broker Pro', icon: TrendingUp },
  ],
  president: [
    { label: 'Socios activos', value: '124', helper: '14 en alta actividad', icon: Users },
    { label: 'Validaciones pendientes', value: '3', helper: '2 listas para aprobar', icon: UserCheck },
    { label: 'Renovación del capítulo', value: '91%', helper: 'Top de la red', icon: ShieldCheck },
    { label: 'Participación en eventos', value: '78%', helper: 'CIIB lidera este mes', icon: Target },
  ],
  admin: [
    { label: 'Tickets operativos', value: '18', helper: '9 documentos por revisar', icon: FileStack },
    { label: 'Cobros abiertos', value: '$9,600', helper: '2 urgentes esta semana', icon: CircleDollarSign },
    { label: 'Check-ins hoy', value: '21', helper: 'Evento virtual en curso', icon: ScanLine },
    { label: 'Mensajes segmentados', value: '3', helper: 'Campañas listas para enviar', icon: MessageSquareShare },
  ],
  member: [
    { label: 'Membresía', value: 'Activa', helper: 'Renueva en 42 días', icon: BadgeCheck },
    { label: 'CRM base', value: '4 leads', helper: '2 seguimientos hoy', icon: BriefcaseBusiness },
    { label: 'Eventos disponibles', value: '3', helper: '1 con cupo limitado', icon: CalendarDays },
    { label: 'Red de contactos', value: '58', helper: '12 perfiles nuevos este mes', icon: Globe2 },
  ],
};

const PanelHeader = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
    {action}
  </div>
);

const StatCard = ({ icon: Icon, label, value, helper }) => (
  <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/70">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="text-sm text-slate-500">{helper}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d5ea8]/10 text-[#0d5ea8]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CopimDashboardDemoPage = ({ workspaceMode = false, embeddedMode = false, initialModule = 'overview' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, setAppMode, user, isCopimAccount } = useAuth();
  const [selectedRole, setSelectedRole] = useState(
    defaultCopimViewByRole[user?.role] || 'copim'
  );
  const [selectedAssociation, setSelectedAssociation] = useState('global');
  const [selectedModule, setSelectedModule] = useState(initialModule);
  const [pendingMembers, setPendingMembers] = useState(initialPendingMembers);
  const [renewals, setRenewals] = useState(initialRenewals);
  const [events, setEvents] = useState(initialEvents);
  const [activityLog, setActivityLog] = useState(() => (
    embeddedMode
      ? [
          'Modulo COPIM activo dentro de ROVI CRM.',
          'La vista institucional quedo lista para operar asociaciones, socios y membresias.',
        ]
      : [
          'Demo listo: plataforma preparada para COPIM sobre ROVI.',
          'Se activó la vista nacional con CRM base incluido.',
        ]
  ));
  const [selectedDetail, setSelectedDetail] = useState(null);

  const roleConfig = roleConfigs[selectedRole];
  const statCards = overviewCardsByRole[selectedRole];
  const approvedToday = initialPendingMembers.length - pendingMembers.length;
  const remindersSent = renewals.filter((item) => item.reminderSent).length;
  const totalCheckIns = events.reduce((sum, event) => sum + event.checkedIn, 0);

  useEffect(() => {
    if (!workspaceMode) {
      setSelectedModule(initialModule);
      return;
    }

    const pathnameSegments = location.pathname.split('/').filter(Boolean);
    const routeSegment = pathnameSegments[pathnameSegments.length - 1] || 'dashboard';
    const nextModule = copimRouteModuleMap[routeSegment] || initialModule;
    setSelectedModule(nextModule);
  }, [initialModule, location.pathname, workspaceMode]);

  useEffect(() => {
    if (workspaceMode) {
      setAppMode('copim');
    }
  }, [setAppMode, workspaceMode]);

  const pushLog = (message) => {
    setActivityLog((current) => [message, ...current].slice(0, 8));
  };

  const handleModuleChange = (moduleId) => {
    setSelectedModule(moduleId);
    if (workspaceMode) {
      const routeSegment = copimModuleRouteMap[moduleId] || 'dashboard';
      navigate(`/copim/${routeSegment}`);
    }
  };

  const handleReturnToRovi = () => {
    setAppMode('rovi');
    navigate('/dashboard');
  };

  const approveNextMember = () => {
    if (!pendingMembers.length) {
      pushLog('No hay socios pendientes por aprobar en este momento.');
      return;
    }
    const [first, ...rest] = pendingMembers;
    setPendingMembers(rest);
    pushLog(`Se aprobó a ${first.name} para ${first.association}.`);
  };

  const sendRenewalReminder = () => {
    const target = renewals.find((item) => !item.reminderSent);
    if (!target) {
      pushLog('Todos los recordatorios de renovación ya fueron enviados.');
      return;
    }
    setRenewals((current) =>
      current.map((item) =>
        item.id === target.id ? { ...item, reminderSent: true, status: 'Seguimiento' } : item
      )
    );
    pushLog(`Se envió recordatorio de renovación a ${target.name}.`);
  };

  const registerCheckIn = () => {
    const target = events.find((item) => item.checkedIn < item.attendees);
    if (!target) {
      pushLog('Todos los asistentes ya fueron registrados.');
      return;
    }
    setEvents((current) =>
      current.map((item) =>
        item.id === target.id ? { ...item, checkedIn: item.checkedIn + 1 } : item
      )
    );
    pushLog(`Nuevo check-in registrado en "${target.title}".`);
  };

  const generateAISummary = () => {
    pushLog('IA: se generó un resumen ejecutivo con riesgo de renovación, top asociaciones y upsell sugerido.');
  };

  const handleQuickAction = (actionId) => {
    if (actionId === 'approve') approveNextMember();
    if (actionId === 'renewal') sendRenewalReminder();
    if (actionId === 'checkin') registerCheckIn();
    if (actionId === 'summary') generateAISummary();
  };

  const renderOverview = () => (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Resumen operativo"
            title={embeddedMode ? 'Resumen institucional de la red COPIM' : 'Lo que Mario debería ver en los primeros 60 segundos'}
            description={embeddedMode
              ? 'Una sola vista para gobierno institucional, membresias, comunidad, eventos y expansion comercial.'
              : 'Una sola vista que conecta gobierno institucional, membresía, comunidad, eventos y monetización.'}
            action={
              <Button
                className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
                onClick={() => setSelectedDetail('launch')}
              >
                {embeddedMode ? 'Ver flujo operativo' : 'Ver flujo de demo'}
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#0d5ea8_62%,#38bdf8_100%)] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">Membresía con valor real</p>
              <p className="mt-3 text-3xl font-semibold">CRM base incluido</p>
              <p className="mt-3 text-sm leading-6 text-cyan-50/85">
                Cada socio activo recibe directorio, eventos, documentos, comunidad y seguimiento comercial básico.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ingreso expandible</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">Upsells por capa</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Broker Pro, Asociación Pro y Council Intelligence permiten crecer el ticket sin romper la entrada.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Aprobaciones',
                value: `${pendingMembers.length} pendientes`,
                body: 'Flujo Consejo / Presidencia / Admin para altas y validaciones.',
              },
              {
                title: 'Renovaciones',
                value: `${remindersSent} recordatorios enviados`,
                body: 'Cobranza visible y segmentada por asociación.',
              },
              {
                title: 'Check-in',
                value: `${totalCheckIns} accesos`,
                body: 'Eventos y asistencia alimentan historial y CRM base.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow={embeddedMode ? 'Acciones operativas' : 'Acciones demo'}
            title={embeddedMode ? 'Acciones institucionales' : 'Botones con estado simulado'}
            description={embeddedMode
              ? 'Cada accion actualiza el tablero para simular operacion institucional dentro del CRM.'
              : 'Cada acción actualiza el tablero para que la presentación se sienta viva.'}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#0d5ea8]/30 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d5ea8]/10 text-[#0d5ea8]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950">{action.label}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              {embeddedMode ? 'Actividad reciente' : 'Bitácora en vivo'}
            </p>
            <ScrollArea className="mt-4 h-52 pr-3">
              <div className="space-y-3">
                {activityLog.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl bg-white/8 px-4 py-3 text-sm leading-6 text-white/86">
                    {item}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssociations = () => (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Red COPIM"
            title="Asociaciones afiliadas y salud institucional"
            description="Cada asociación tiene métricas, renovación, actividad y nivel de participación."
          />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {associationCards.map((association) => (
            <button
              key={association.id}
              type="button"
              onClick={() => {
                setSelectedAssociation(association.id);
                setSelectedDetail(association.id);
              }}
              className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-950">{association.name}</p>
                  <p className="text-sm text-slate-500">{association.state}</p>
                </div>
                <Badge className={`rounded-full ${statusStyles[association.activity] || 'bg-slate-100 text-slate-900'}`}>
                  {association.activity}
                </Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Socios</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{association.members}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Crecimiento</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{association.growth}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Renovación</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{association.renewal}%</p>
                </div>
              </div>
              <Progress value={association.renewal} className="mt-5 h-2.5 bg-slate-200" />
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Gobierno nacional"
            title="Qué puede controlar COPIM desde esta capa"
            description="Permisos, validaciones, actividad global, aprobaciones y expansión por estado."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            'Alta y estatus de asociaciones afiliadas.',
            'Aprobación de nuevos capítulos y publicación global.',
            'Métricas comparativas por asociación y crecimiento de red.',
            'Actividades nacionales, recursos compartidos y comunicación institucional.',
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0d5ea8]" />
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}

          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Expansión sugerida</p>
            <p className="mt-3 text-2xl font-semibold">Siguiente ciudad objetivo: Monterrey</p>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Por volumen del sector, alianzas posibles y similitud con asociaciones que ya operan bien en COPIM.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMembers = () => (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Directorio profesional"
            title="Socios con perfil, certificación y visibilidad"
            description="El directorio deja de ser estático: se vuelve filtro de valor, networking y reputación."
            action={
              <Button variant="outline" className="rounded-full border-slate-300" onClick={() => setSelectedDetail('member-card')}>
                Ver credencial
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Asociación</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Estatus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberDirectory.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-950">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.certification}</p>
                    </div>
                  </TableCell>
                  <TableCell>{member.association}</TableCell>
                  <TableCell>{member.specialty}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full ${statusStyles[member.status] || 'bg-slate-100 text-slate-900'}`}>
                      {member.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Validaciones"
            title="Cola de aprobación de nuevos socios"
            description="Flujo institucional de ingreso, revisión, validación y acceso."
            action={
              <Button className="rounded-full bg-[#0d5ea8] hover:bg-[#0b4d88]" onClick={approveNextMember}>
                Aprobar siguiente
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingMembers.length ? (
            pendingMembers.map((member) => (
              <div key={member.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-[#0d5ea8]/10 text-[#0d5ea8]">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-950">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.association}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{member.note}</p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-amber-100 text-amber-900 hover:bg-amber-100">
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-sm leading-6 text-emerald-900">
              Todas las solicitudes pendientes ya fueron atendidas en esta simulación.
            </div>
          )}

          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Progreso del día</p>
            <p className="mt-3 text-3xl font-semibold">{approvedToday} aprobados</p>
            <p className="mt-2 text-sm text-white/78">
              Cada aprobación habilita directorio, comunidad, eventos y CRM base para el nuevo socio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMemberships = () => (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Cobranza y membresía"
            title="Renovaciones, cuotas y paquetes comerciales"
            description="Aquí se vuelve tangible la estrategia: CRM base incluido y crecimiento por capas premium."
          />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {membershipPlans.map((plan) => (
            <div key={plan.title} className={`rounded-[28px] bg-gradient-to-br ${plan.accent} p-[1px]`}>
              <div className="flex h-full flex-col rounded-[27px] bg-slate-950 p-5 text-white">
                <p className="text-sm font-semibold">{plan.title}</p>
                <p className="mt-3 text-3xl font-semibold">{plan.value}</p>
                <p className="mt-4 text-sm leading-6 text-white/78">{plan.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Renovaciones"
            title="Seguimiento operativo de pagos"
            description="Inspirado en afiliaciones y pagos recurrentes: simple, visible y accionable."
            action={
              <Button variant="outline" className="rounded-full border-slate-300" onClick={sendRenewalReminder}>
                Enviar recordatorio
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {renewals.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.association}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.plan} · vence en {item.dueIn}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={`rounded-full ${statusStyles[item.status] || 'bg-slate-100 text-slate-900'}`}>
                    {item.status}
                  </Badge>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{item.amount}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {item.reminderSent ? 'Recordatorio enviado' : 'Pendiente de recordatorio'}
                </span>
                <span className="font-medium text-slate-700">{item.reminderSent ? 'Sí' : 'No'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderEvents = () => (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Agenda COPIM"
            title="Eventos, capacitación y sesiones"
            description="Calendario vivo para actividades nacionales, de asociación y de certificación."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{event.title}</p>
                  <p className="text-sm text-slate-500">{event.date} · {event.mode}</p>
                </div>
                <Badge className="rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                  {event.type}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Asistentes</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{event.attendees}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Check-in</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{event.checkedIn}</p>
                </div>
              </div>
              <Progress value={(event.checkedIn / event.attendees) * 100} className="mt-4 h-2.5 bg-slate-200" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Operación del evento"
            title="Check-in y seguimiento post-evento"
            description="La asistencia se refleja en historial del socio, engagement y oportunidades en CRM base."
            action={
              <Button className="rounded-full bg-[#0d5ea8] hover:bg-[#0b4d88]" onClick={registerCheckIn}>
                Registrar check-in
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[28px] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Impacto cruzado</p>
            <p className="mt-3 text-3xl font-semibold">Evento → Comunidad → CRM</p>
            <p className="mt-3 text-sm leading-6 text-white/78">
              Los asistentes pueden entrar a directorio, descargar recursos, recibir seguimiento y convertirse en upsell natural.
            </p>
          </div>

          {[
            'Check-in por QR y estado de membresía.',
            'Historial del socio por evento y certificación.',
            'Notas comerciales o institucionales para seguimiento.',
            'Activación de campañas post-evento y recursos compartidos.',
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0d5ea8]" />
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderCommunity = () => (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Feed institucional"
            title="Comunidad que genera participación y retención"
            description="No solo avisos. También comités, oportunidades, recursos y networking real."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {communityFeed.map((post) => (
            <div key={post.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{post.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{post.author}</p>
                </div>
                <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
                  {post.tag}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{post.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Comités y segmentos"
            title="Comunicación por rol, región o interés"
            description="La capa social se vuelve herramienta operativa y no solo un muro informativo."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: 'Mesa Fiscal',
              description: '34 socios activos · contenidos técnicos y alertas regulatorias.',
            },
            {
              title: 'Certificación C17',
              description: '28 prospectos · seguimiento a examen, recursos y sesiones.',
            },
            {
              title: 'Oportunidades y referidos',
              description: '62 socios · intercambio entre asociaciones con filtros por ciudad.',
            },
          ].map((group) => (
            <div key={group.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{group.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
            </div>
          ))}

          <div className="rounded-[28px] bg-[linear-gradient(135deg,#0d5ea8_0%,#38bdf8_100%)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">Resultado esperado</p>
            <p className="mt-3 text-2xl font-semibold">Más conexión, más valor, más permanencia</p>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Esta es la parte que hace que la membresía no se sienta administrativa sino viva.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntelligence = () => (
    <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Council Intelligence"
            title="La capa premium donde ROVI se diferencia"
            description="IA, resúmenes, riesgo de churn y recomendaciones comerciales o institucionales."
            action={
              <Button className="rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={generateAISummary}>
                Ejecutar IA demo
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {aiInsights.map((insight) => (
            <div key={insight.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d5ea8]/10 text-[#0d5ea8]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{insight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-100">
        <CardHeader>
          <PanelHeader
            eyebrow="Analytics ejecutivos"
            title="Métricas que sí cuentan la historia de la red"
            description="Participación, renovación, crecimiento, activación del CRM base y expansión por asociación."
          />
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            ['Renovación nacional', 87, 'Cerca de la meta institucional de 90%.'],
            ['Uso de CRM base entre socios activos', 64, 'Buen indicador para empujar Broker Pro.'],
            ['Participación en comunidad', 58, 'Todavía hay espacio para activar grupos regionales.'],
            ['Asistencia promedio a eventos', 74, 'El check-in y seguimiento ayudan a consolidar valor.'],
          ].map(([label, value, description]) => (
            <div key={label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-950">{label}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
                <p className="text-2xl font-semibold text-slate-950">{value}%</p>
              </div>
              <Progress value={value} className="mt-4 h-2.5 bg-slate-200" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderMainPanel = () => {
    if (selectedModule === 'associations') return renderAssociations();
    if (selectedModule === 'members') return renderMembers();
    if (selectedModule === 'memberships') return renderMemberships();
    if (selectedModule === 'events') return renderEvents();
    if (selectedModule === 'community') return renderCommunity();
    if (selectedModule === 'intelligence') return renderIntelligence();
    return renderOverview();
  };

  return (
    <div className={`${embeddedMode ? 'min-h-full' : 'min-h-screen'} bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_24%),linear-gradient(180deg,_#edf5fb_0%,_#f8fbff_20%,_#ffffff_100%)]`}>
      <Helmet>
        <title>{embeddedMode ? 'COPIM | ROVI CRM' : 'Demo ROVI para COPIM | Dashboard Ejecutivo'}</title>
        <meta
          name="description"
          content={embeddedMode
            ? 'Modulo institucional COPIM dentro de ROVI CRM con asociaciones, socios, membresias, comunidad y eventos.'
            : 'Dashboard demo de ROVI para COPIM con membresías, asociaciones, comunidad, eventos, pagos y CRM base.'}
        />
      </Helmet>

      <div className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        {workspaceMode && isAuthenticated && !embeddedMode && (
          <div className="mb-4 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/92 px-5 py-4 shadow-lg shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0d5ea8]/10 text-[#0d5ea8]">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Perfil activo</p>
                <p className="text-lg font-semibold text-slate-950">COPIM Institucional</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                Workspace protegido
              </Badge>
              <Button variant="outline" className="rounded-full border-slate-300" onClick={handleReturnToRovi}>
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Volver a ROVI CRM
              </Button>
            </div>
          </div>
        )}

        {!embeddedMode && (
          <div className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(120deg,#0f172a_0%,#0d5ea8_52%,#0f766e_100%)] shadow-2xl shadow-slate-200/80">
          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <Badge className="rounded-full bg-white/12 px-4 py-1 text-white hover:bg-white/12">
                  Demo interactivo
                </Badge>
                <Badge className="rounded-full bg-amber-300/20 px-4 py-1 text-amber-100 hover:bg-amber-300/20">
                  Plataforma COPIM sobre ROVI
                </Badge>
                <Badge className="rounded-full bg-cyan-300/16 px-4 py-1 text-cyan-100 hover:bg-cyan-300/16">
                  Listo para Mario
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
                  Consejo de Profesionales Inmobiliarios de México
                </p>
                <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Un dashboard que vende la visión de COPIM y un demo que deja tocar la funcionalidad.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/86">
                  Cambia de rol, cambia de asociación, aprueba socios, envía renovaciones, registra check-ins y muestra
                  cómo la membresía con CRM base incluido genera valor institucional y comercial.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {pitchSequence.map((item) => (
                  <div key={item.step} className="rounded-[24px] border border-white/12 bg-white/10 p-4 text-white backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">{item.step}</p>
                    <p className="mt-2 text-lg font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-cyan-50/82">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-white/10 p-3 shadow-2xl shadow-slate-950/20 backdrop-blur">
                <img
                  src={copimPlatformPoster}
                  alt="Propuesta estratégica para COPIM"
                  className="h-[320px] w-full rounded-[24px] object-cover object-top"
                />
                <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/12 bg-slate-950/70 p-4 text-white backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Pieza base de conversación</p>
                  <p className="mt-2 text-2xl font-semibold">Plataforma integral de gestión para asociaciones y socios</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {executiveWins.map((item) => (
                      <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-50/88">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Membresía', 'Base incluida'],
                  ['Expansión', 'Broker Pro + Asociación Pro'],
                  ['Diferencial', 'Inteligencia COPIM'],
                ].map(([title, value]) => (
                  <div key={title} className="rounded-[28px] border border-white/12 bg-white/10 p-5 text-white backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/65">{title}</p>
                    <p className="mt-3 text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {embeddedMode ? (
          <div className="space-y-6">
            <div className="rounded-[34px] border border-slate-200 bg-white/92 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                      Modulo institucional
                    </Badge>
                    <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
                      COPIM sobre ROVI CRM
                    </Badge>
                    {isCopimAccount && (
                      <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                        Rol COPIM activo
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Workspace institucional
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      COPIM dentro del CRM de ROVI
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      Operacion institucional para asociaciones, socios, membresias, eventos, comunidad e inteligencia ejecutiva.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:min-w-[420px]">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Rol activo</p>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfigs).map(([key, role]) => (
                          <SelectItem key={key} value={key}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Asociacion activa</p>
                    <Select value={selectedAssociation} onValueChange={setSelectedAssociation}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {associations.map((association) => (
                          <SelectItem key={association.value} value={association.value}>
                            {association.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                      {roleConfig.pill}
                    </Badge>
                    <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
                      {associations.find((item) => item.value === selectedAssociation)?.label}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      Modulo COPIM x ROVI
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Supervision institucional y operacion diaria dentro del mismo CRM.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Aprobados hoy</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{approvedToday}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recordatorios</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{remindersSent}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Check-ins</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{totalCheckIns}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-4">
                {statCards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>
            </div>

            {renderMainPanel()}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[34px] border border-slate-200 bg-white/92 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#0d5ea8_62%,#38bdf8_100%)] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/78">Vista activa</p>
                  <p className="mt-3 text-2xl font-semibold">{roleConfig.label}</p>
                </div>
                <ShieldCheck className="h-9 w-9 rounded-2xl bg-white/14 p-2" />
              </div>
              <p className="mt-4 text-sm leading-6 text-cyan-50/84">{roleConfig.subtitle}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Cambiar rol</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfigs).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Cambiar asociación</p>
                <Select value={selectedAssociation} onValueChange={setSelectedAssociation}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {associations.map((association) => (
                      <SelectItem key={association.value} value={association.value}>
                        {association.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = selectedModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModuleChange(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
                      active
                        ? 'bg-slate-950 text-white shadow-lg'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                    <ChevronRight className={`h-4 w-4 ${active ? 'text-white/70' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Narrativa</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{roleConfig.pill}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{roleConfig.summary}</p>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-[34px] border border-slate-200 bg-white/92 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-full bg-[#0d5ea8]/10 text-[#0d5ea8] hover:bg-[#0d5ea8]/10">
                      {roleConfig.pill}
                    </Badge>
                    <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
                      {associations.find((item) => item.value === selectedAssociation)?.label}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      Dashboard COPIM x ROVI
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Demo navegable de asociaciones, socios, membresías, eventos, comunidad e inteligencia ejecutiva.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Aprobados hoy</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{approvedToday}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recordatorios</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{remindersSent}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Check-ins</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{totalCheckIns}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-4">
                {statCards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>
            </div>

            {renderMainPanel()}
          </main>
        </div>
        )}
      </div>

      <Dialog open={Boolean(selectedDetail)} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="max-w-3xl rounded-[30px] border-slate-200 p-0">
          <div className="overflow-hidden rounded-[30px]">
            <div className="bg-[linear-gradient(120deg,#0f172a_0%,#0d5ea8_52%,#38bdf8_100%)] px-7 py-6 text-white">
              <DialogHeader className="space-y-3 text-left">
                <DialogTitle className="text-3xl font-semibold">
                  {selectedDetail === 'launch' && 'Flujo de demo sugerido'}
                  {selectedDetail === 'member-card' && 'Credencial digital del socio'}
                  {selectedDetail && associationCards.find((item) => item.id === selectedDetail)?.name}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-cyan-50/82">
                  {selectedDetail === 'launch' &&
                    'Este es el orden ideal para presentar el valor: consejo, asociación, socio, membresía, comunidad y capa premium.'}
                  {selectedDetail === 'member-card' &&
                    'Ejemplo de cómo se vería la experiencia de un socio activo con membresía, certificación y CRM base.'}
                  {selectedDetail && associationCards.find((item) => item.id === selectedDetail) &&
                    'Vista resumida de salud, crecimiento y renovación del capítulo dentro de la red COPIM.'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="bg-white px-7 py-6">
              {selectedDetail === 'launch' && (
                <div className="grid gap-4">
                  {pitchSequence.map((item) => (
                    <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-[#0d5ea8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#0d5ea8]">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {[
                    'Cambiar a una asociación como CIIB para mostrar operación local.',
                    'Entrar a Socios para demostrar credencial, directorio y beneficios.',
                    'Cerrar con Membresías, Comunidad e Inteligencia para justificar el ticket premium.',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {selectedDetail === 'member-card' && (
                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                    <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/60">Credencial digital</p>
                    <div className="mt-5 flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-white/12 text-lg text-white">YA</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xl font-semibold">Yoselin Álvarez</p>
                        <p className="text-sm text-white/70">CIIB Querétaro · Broker residencial</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl bg-white/8 px-4 py-3 text-sm">Membresía activa · Renueva en 42 días</div>
                      <div className="rounded-2xl bg-white/8 px-4 py-3 text-sm">Certificación COPIM C17 vigente</div>
                      <div className="rounded-2xl bg-white/8 px-4 py-3 text-sm">Beneficio desbloqueado: ROVI CRM Base</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      'Acceso a eventos y recursos.',
                      'Perfil visible en directorio nacional.',
                      'Networking con otras asociaciones.',
                      'Historial de actividades y seguimiento comercial.',
                    ].map((item) => (
                      <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0d5ea8]" />
                        <p className="text-sm leading-6 text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetail && associationCards.find((item) => item.id === selectedDetail) && (
                <div className="grid gap-4 md:grid-cols-3">
                  {(() => {
                    const association = associationCards.find((item) => item.id === selectedDetail);
                    return [
                      ['Socios', association.members],
                      ['Crecimiento', association.growth],
                      ['Renovación', `${association.renewal}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopimDashboardDemoPage;

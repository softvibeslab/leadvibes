import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  GripVertical,
  Home,
  ImagePlus,
  Zap,
  List,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Star,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  Users,
  WalletCards,
  XCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const currency = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value || 0);

const dateOnly = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value));
};

const toDateInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

const fromDateInput = (value) => {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toISOString();
};

const toDateTimeInput = (value) => {
  const date = toCalendarDate(value);
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const fromDateTimeInput = (value) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const toCalendarDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateKey = (value) => {
  const date = toCalendarDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

const calendarMonthTitle = (date) =>
  new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);

const calendarDateLabel = (date) =>
  new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);

const calendarTimeLabel = (value) => {
  const date = toCalendarDate(value);
  if (!date) return 'Sin hora';
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const buildMonthDays = (monthDate) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12, 0, 0, 0);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      key: dateKey(date),
      inMonth: date.getMonth() === monthDate.getMonth(),
      isToday: dateKey(date) === dateKey(new Date()),
    };
  });
};

const eachCalendarDate = (startValue, endValue, maxDays = 90) => {
  const startDate = toCalendarDate(startValue);
  const endDate = toCalendarDate(endValue) || startDate;
  if (!startDate || !endDate) return [];

  const cursor = startOfLocalDay(startDate <= endDate ? startDate : endDate);
  const finalDate = startOfLocalDay(startDate <= endDate ? endDate : startDate);
  const days = [];
  let guard = 0;

  while (cursor <= finalDate && guard < maxDays) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return days;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const NONE_VALUE = '__none__';

const splitList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (value) => Array.isArray(value) ? value.join(', ') : String(value || '');
const optionalSelectValue = (value) => value || NONE_VALUE;
const optionalSelectChange = (value) => (value === NONE_VALUE ? '' : value);

const statusLabels = {
  active: 'Activa',
  inactive: 'Inactivo',
  paused: 'Pausada',
  maintenance: 'Mantenimiento',
  archived: 'Archivada',
  blocked: 'Bloqueado',
  inquiry: 'Solicitud',
  reserved: 'Reservada',
  confirmed: 'Confirmada',
  checked_in: 'En estancia',
  checked_out: 'Checkout',
  cancelled: 'Cancelada',
  paid: 'Pagado',
  pending: 'Pendiente',
  partial: 'Parcial',
  collected: 'Cobrado',
  closed: 'Cerrado',
  todo: 'Pendiente',
  in_progress: 'En proceso',
  done: 'Terminada',
};

const taskTypeLabels = {
  cleaning: 'Limpieza',
  maintenance: 'Mantenimiento',
  inspection: 'Inspección',
  check_in: 'Check-in',
  check_out: 'Check-out',
  utilities: 'Servicios',
  owner: 'Propietario',
  other: 'Otro',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const scheduleTypeLabels = {
  one_time: 'Una vez',
  recurring: 'Periódica',
  event_based: 'Por evento',
};

const recurrenceLabels = {
  daily: 'Diaria',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  after_check_out: 'Después de checkout',
  before_check_in: 'Antes de check-in',
};

const expenseCategoryLabels = {
  cleaning: 'Limpieza',
  maintenance: 'Mantenimiento',
  utilities: 'Servicios',
  supplies: 'Insumos',
  commission: 'Comisión',
  taxes: 'Impuestos',
  owner_payment: 'Pago propietario',
  other: 'Otros',
};

const paymentMethodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  platform: 'Plataforma',
  other: 'Otro',
};

const integrationStatusLabels = {
  connected: 'Conectado demo',
  demo_available: 'Disponible demo',
  disconnected: 'Desconectado',
  error: 'Error',
};

const integrationHealthLabels = {
  healthy: 'Saludable',
  warning: 'Con avisos',
  not_connected: 'Sin conectar',
};

const rentalTypeLabels = {
  short_term: 'Corta estancia',
  mid_term: 'Media estancia',
  long_term: 'Larga estancia',
};

const operationTypeLabels = {
  rent: 'Renta',
  sale: 'Venta',
  both: 'Venta y renta',
};

const bookingCalendarTypeMeta = {
  check_in: { label: 'Entrada', className: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30' },
  stay: { label: 'Estancia', className: 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30' },
  check_out: { label: 'Salida', className: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30' },
};

const operationCalendarTypeMeta = {
  reserva: { label: 'Check-in', className: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30' },
  checkout: { label: 'Check-out', className: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30' },
  bloqueo: { label: 'Bloqueo', className: 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30' },
  limpieza: { label: 'Limpieza', className: 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30' },
  mantenimiento: { label: 'Mantenimiento', className: 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30' },
  tarea: { label: 'Tarea', className: 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-500/30' },
  otro: { label: 'Evento', className: 'bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/30' },
};

const EMPTY_PROPERTY = {
  title: '',
  owner_id: '',
  address: '',
  zone: '',
  operation_type: 'rent',
  rental_type: 'short_term',
  status: 'active',
  bedrooms: 1,
  bathrooms: 1,
  max_guests: 2,
  nightly_price_mxn: 0,
  monthly_price_mxn: 0,
  cleaning_fee_mxn: 0,
  deposit_mxn: 0,
  commission_rate: 0.2,
  platforms: '',
  amenities: '',
  images: [],
  notes: '',
};

const EMPTY_PIPELINE = {
  name: '',
  description: '',
  entity_type: 'booking',
  status: 'active',
  is_default: false,
};

const EMPTY_STAGE = {
  name: '',
  description: '',
  booking_status: 'reserved',
  color: '#0D9488',
  probability: 35,
  sort_order: 10,
  is_closing_stage: false,
  automation_notes: '',
};

const bookingStatusOptions = ['inquiry', 'reserved', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

const EMPTY_BOOKING = {
  property_id: '',
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  source: 'direct',
  check_in: '',
  check_out: '',
  guests_count: 1,
  status: 'reserved',
  total_amount_mxn: 0,
  paid_amount_mxn: 0,
  cleaning_fee_mxn: 0,
  deposit_mxn: 0,
  platform_fee_mxn: 0,
  notes: '',
};

const EMPTY_TASK = {
  property_id: '',
  booking_id: '',
  assigned_staff_id: '',
  task_type: 'cleaning',
  title: '',
  due_at: '',
  priority: 'medium',
  assigned_to: '',
  schedule_type: 'one_time',
  recurrence_rule: '',
  linked_event_type: '',
  next_due_at: '',
  status: 'todo',
  notes: '',
};

const EMPTY_STAFF = {
  name: '',
  email: '',
  phone: '',
  role: '',
  responsibilities: '',
  specialties: '',
  status: 'active',
  notes: '',
};

const EMPTY_EXPENSE = {
  property_id: '',
  booking_id: '',
  staff_id: '',
  category: 'maintenance',
  amount_mxn: 0,
  description: '',
  expense_date: '',
  vendor: '',
  payment_method: 'transfer',
  status: 'paid',
  receipt_url: '',
  notes: '',
};

const EMPTY_EXTERNAL_SALE = {
  property_id: '',
  booking_id: '',
  staff_id: '',
  guest_name: '',
  concept: '',
  amount_mxn: 0,
  sale_date: '',
  payment_method: 'transfer',
  status: 'collected',
  source: 'manual',
  notes: '',
};

const EMPTY_CASH_CLOSURE = {
  closure_date: '',
  responsible_staff_id: '',
  notes: '',
};

const EMPTY_CALENDAR_EVENT = {
  property_id: '',
  title: '',
  event_type: 'blocked',
  start_date: '',
  end_date: '',
  status: 'active',
  source: 'manual',
  notes: '',
};

const importTypeLabels = {
  properties: 'Propiedades',
  bookings: 'Reservas',
  calendar: 'Calendario',
  tasks: 'Tareas',
  financials: 'Finanzas',
};

const rentalImportFlows = [
  {
    id: 'properties',
    title: 'Importar Propiedades',
    description: 'Carga inventario operativo con tarifas, amenidades, canales e imágenes.',
    icon: Home,
    requiredHelp: 'Campo requerido: title',
  },
  {
    id: 'bookings',
    title: 'Importar Reservas',
    description: 'Crea reservas por huésped, fechas, pagos, comisiones y saldos.',
    icon: CalendarDays,
    requiredHelp: 'Campos requeridos: guest_name, check_in y check_out',
  },
  {
    id: 'calendar',
    title: 'Importar Calendario',
    description: 'Carga bloqueos, mantenimientos y eventos operativos por propiedad.',
    icon: CalendarDays,
    requiredHelp: 'Campos requeridos: event_type, start_date y end_date',
  },
  {
    id: 'tasks',
    title: 'Importar Tareas',
    description: 'Agenda limpiezas, inspecciones, mantenimientos y entregas.',
    icon: ClipboardList,
    requiredHelp: 'Campo requerido: title',
  },
  {
    id: 'financials',
    title: 'Importar Finanzas',
    description: 'Registra gastos, proveedores y movimientos para rentabilidad neta.',
    icon: WalletCards,
    requiredHelp: 'Campos requeridos: amount_mxn y description',
  },
];

const rentalImportSteps = [
  { id: 1, title: 'Subir Archivo', icon: Upload },
  { id: 2, title: 'Vista Previa', icon: FileSpreadsheet },
  { id: 3, title: 'Resultado', icon: CheckCircle2 },
];

const rentalModuleRoutes = {
  overview: '/rentals',
  properties: '/rentals/properties',
  bookings: '/rentals/bookings',
  calendar: '/rentals/calendar',
  tasks: '/rentals/tasks',
  staff: '/rentals/staff',
  financials: '/rentals/financials',
  integrations: '/rentals/integrations',
  import: '/rentals/import',
};

const rentalPageCopy = {
  overview: {
    title: 'Rentas HQ',
    description: 'Controla inventario, reservas, check-ins, tareas y rentabilidad para propiedades tipo Airbnb, renta temporal o renta mensual.',
  },
  properties: {
    title: 'Propiedades',
    description: 'Inventario operativo para renta corta, media o larga estancia.',
  },
  bookings: {
    title: 'Reservas',
    description: 'De solicitud a check-out con pagos, saldo y estado de estancia.',
  },
  calendar: {
    title: 'Calendario',
    description: 'Entradas, salidas y operación próxima por propiedad.',
  },
  tasks: {
    title: 'Tareas',
    description: 'Limpieza, mantenimiento, inspecciones y entregas.',
  },
  staff: {
    title: 'Staff',
    description: 'Responsables, cargos y responsabilidades de operación.',
  },
  financials: {
    title: 'Finanzas',
    description: 'Ingresos, cobros, gastos y rentabilidad estimada.',
  },
  integrations: {
    title: 'Integraciones demo',
    description: 'Conecta canales mock como Airbnb, Booking.com, Vrbo, Expedia, iCal y Google Calendar.',
  },
  import: {
    title: 'Importador',
    description: 'Carga propiedades, reservas, calendario, tareas y finanzas desde CSV/XLSX.',
  },
};

const resolveRentalModule = (pathname) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/rentals';
  const match = Object.entries(rentalModuleRoutes).find(([, route]) => route === normalizedPath);
  return match?.[0] || 'overview';
};

const StatCard = ({ icon: Icon, label, value, helper }) => (
  <Card className="rounded-lg border-border/70">
    <CardContent className="flex min-h-[116px] items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-2xl font-semibold leading-tight">{value}</p>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const PropertyViewToggle = ({ value, onChange }) => (
  <div className="inline-flex h-10 items-center rounded-lg border border-border/70 bg-muted/30 p-1">
    {[
      ['table', List, 'Tabla'],
      ['cards', Home, 'Tarjetas'],
      ['pipeline', ClipboardList, 'Pipeline'],
    ].map(([mode, Icon, label]) => (
      <button
        key={mode}
        type="button"
        aria-pressed={value === mode}
        onClick={() => onChange(mode)}
        className={`inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
          value === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    ))}
  </div>
);

const CalendarViewToggle = ({ value, onChange }) => (
  <div className="inline-flex h-10 items-center rounded-lg border border-border/70 bg-muted/30 p-1">
    {[
      ['list', List, 'Lista'],
      ['calendar', CalendarDays, 'Calendario'],
    ].map(([mode, Icon, label]) => (
      <button
        key={mode}
        type="button"
        onClick={() => onChange(mode)}
        className={`inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
          value === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    ))}
  </div>
);

const RentalPropertyKanbanCard = ({
  property,
  dragAttributes,
  dragListeners,
  dragRef,
  style,
  isDragging = false,
  isOverlay = false,
  onOpenDetail,
  onEdit,
}) => {
  const coverImage = (property.images || []).find((image) => image.is_cover) || property.images?.[0];
  const platforms = property.platforms || [];

  return (
    <div
      ref={dragRef}
      style={style}
      className={`rounded-lg border border-border/70 bg-card p-3 shadow-sm transition ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : 'hover:border-primary/50'
      } ${isOverlay ? 'w-[292px] shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...dragAttributes}
          {...dragListeners}
          aria-label={`Mover ${property.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="h-14 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
          {coverImage?.url ? (
            <img src={coverImage.url} alt={coverImage.alt || property.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Home className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{property.title}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{property.zone || property.address || 'Sin zona'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline">{statusLabels[property.status] || property.status}</Badge>
            <Badge variant="secondary">{property.bedrooms || 0} rec · {property.max_guests || 0} pax</Badge>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-border/60 p-2">
          <p className="text-muted-foreground">Noche</p>
          <p className="font-semibold">{currency(property.nightly_price_mxn)}</p>
        </div>
        <div className="rounded-md border border-border/60 p-2">
          <p className="text-muted-foreground">Mes</p>
          <p className="font-semibold">{currency(property.monthly_price_mxn)}</p>
        </div>
      </div>

      {platforms.length > 0 && (
        <p className="mt-2 truncate text-xs text-muted-foreground">Canales: {platforms.slice(0, 3).join(', ')}{platforms.length > 3 ? ` +${platforms.length - 3}` : ''}</p>
      )}

      {!isOverlay && (
        <div className="mt-3 flex justify-end gap-2 border-t border-border/70 pt-3">
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenDetail(property)}>
            <Brain className="mr-2 h-4 w-4" />
            Ficha
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(property)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      )}
    </div>
  );
};

const DraggableRentalPropertyCard = ({ property, stageId, onOpenDetail, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: property.id,
    data: {
      type: 'rental_property',
      stageId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <RentalPropertyKanbanCard
      property={property}
      dragAttributes={attributes}
      dragListeners={listeners}
      dragRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      onOpenDetail={onOpenDetail}
      onEdit={onEdit}
    />
  );
};

const RentalPropertyStageColumn = ({ stage, onOpenDetail, onEdit, onEditStage, onDeleteStage }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `property-stage-${stage.id}`,
    data: {
      type: 'rental_property_stage',
      stageId: stage.id,
    },
  });
  const properties = stage.properties || [];

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col rounded-lg border border-border/70 bg-background">
      <div className="border-b border-border/70 p-4" style={{ borderTop: `4px solid ${stage.color || '#0D9488'}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || '#0D9488' }} />
              <p className="truncate font-semibold">{stage.name}</p>
              {stage.is_closing_stage && <Badge variant="outline">Cierre</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {properties.length} propiedades · {stage.probability || 0}% avance
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditStage(stage)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDeleteStage(stage)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-border/60 p-2">
            <p className="text-muted-foreground">Potencial mensual</p>
            <p className="font-semibold">{currency(stage.monthly_potential_mxn || 0)}</p>
          </div>
          <div className="rounded-md border border-border/60 p-2">
            <p className="text-muted-foreground">Tarifa noche</p>
            <p className="font-semibold">{currency(stage.nightly_potential_mxn || 0)}</p>
          </div>
        </div>
        {stage.automation_notes && (
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{stage.automation_notes}</p>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-3 p-3 transition ${
          isOver ? 'bg-primary/10' : 'bg-muted/10'
        }`}
      >
        {properties.map((property) => (
          <DraggableRentalPropertyCard
            key={property.id}
            property={property}
            stageId={stage.id}
            onOpenDetail={onOpenDetail}
            onEdit={onEdit}
          />
        ))}
        {properties.length === 0 && (
          <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
            Arrastra propiedades aquí
          </div>
        )}
      </div>
    </div>
  );
};

const RentalMonthCalendar = ({
  title,
  description,
  monthDate,
  selectedDate,
  onMonthChange,
  onSelectedDateChange,
  events,
  renderEventChip,
  renderDayDetail,
  emptyMessage,
}) => {
  const days = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const selectedKey = dateKey(selectedDate);
  const eventsByDay = useMemo(() => {
    const grouped = new Map();
    events.forEach((event) => {
      const key = event.dayKey || dateKey(event.date || event.start_time || event.check_in);
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(event);
    });
    return grouped;
  }, [events]);
  const selectedEvents = eventsByDay.get(selectedKey) || [];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-lg border border-border/70 bg-card">
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => onMonthChange(addMonths(monthDate, -1))} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[190px] rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-center text-sm font-semibold capitalize">
              {calendarMonthTitle(monthDate)}
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => onMonthChange(addMonths(monthDate, 1))} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const today = new Date();
                onMonthChange(today);
                onSelectedDateChange(today);
              }}
            >
              Hoy
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[620px] p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((label) => (
                <div key={label} className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {label}
                </div>
              ))}
              {days.map((day) => {
                const dayEvents = eventsByDay.get(day.key) || [];
                const isSelected = day.key === selectedKey;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => onSelectedDateChange(day.date)}
                    className={`min-h-[118px] rounded-lg border p-2 text-left align-top transition ${
                      day.inMonth ? 'bg-background hover:bg-muted/30' : 'bg-muted/20 text-muted-foreground/60'
                    } ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border/70'} ${day.isToday ? 'shadow-[inset_0_0_0_1px_hsl(var(--primary))]' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        day.isToday ? 'bg-primary text-primary-foreground' : ''
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => renderEventChip(event))}
                      {dayEvents.length > 3 && (
                        <span className="block rounded-md border border-dashed border-border/70 px-2 py-1 text-[11px] text-muted-foreground">
                          +{dayEvents.length - 3} más
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold capitalize">{calendarDateLabel(selectedDate)}</h3>
            <p className="text-sm text-muted-foreground">{selectedEvents.length} evento{selectedEvents.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pr-1">
          {selectedEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : selectedEvents.map((event) => renderDayDetail(event))}
        </div>
      </div>
    </div>
  );
};

const buildBookingCalendarEvents = (bookings, propertyLookup) => (
  bookings.flatMap((booking) => {
    const checkInKey = dateKey(booking.check_in);
    const checkOutKey = dateKey(booking.check_out);
    const days = eachCalendarDate(booking.check_in, booking.check_out);
    const propertyTitle = booking.property?.title || propertyLookup[booking.property_id]?.title || 'Propiedad';

    return days.map((date) => {
      const key = dateKey(date);
      const eventType = key === checkInKey ? 'check_in' : key === checkOutKey ? 'check_out' : 'stay';
      return {
        id: `${booking.id}-${key}`,
        dayKey: key,
        date,
        eventType,
        booking,
        propertyTitle,
      };
    });
  })
);

const normalizeOperationCalendarEvents = (events) => (
  events.flatMap((event) => {
    const days = event.source_module === 'rental_calendar'
      ? eachCalendarDate(event.start_time, event.end_time, 60)
      : eachCalendarDate(event.start_time, event.start_time, 1);

    return days.map((date) => ({
      ...event,
      id: `${event.id}-${dateKey(date)}`,
      originalId: event.id,
      dayKey: dateKey(date),
      date,
      eventType: operationCalendarTypeMeta[event.event_type] ? event.event_type : 'otro',
    }));
  })
);

const BookingCalendarChip = ({ event }) => {
  const meta = bookingCalendarTypeMeta[event.eventType] || bookingCalendarTypeMeta.stay;
  return (
    <span className={`block truncate rounded-md border px-2 py-1 text-[11px] font-medium ${meta.className}`}>
      {meta.label} · {event.booking.guest_name || 'Huésped'}
    </span>
  );
};

const BookingCalendarDetail = ({ event, onEdit, onDelete, onStatusChange }) => {
  const booking = event.booking;
  const meta = bookingCalendarTypeMeta[event.eventType] || bookingCalendarTypeMeta.stay;
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
            <Badge variant="outline">{statusLabels[booking.status] || booking.status}</Badge>
          </div>
          <h4 className="mt-3 text-base font-semibold">{booking.guest_name || 'Huésped sin nombre'}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{event.propertyTitle} · {booking.source || 'directo'}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{currency(booking.total_amount_mxn)}</p>
          <p className="text-muted-foreground">Saldo {currency(booking.balance_due_mxn)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Entrada</p>
          <p className="font-medium">{dateOnly(booking.check_in)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Salida</p>
          <p className="font-medium">{dateOnly(booking.check_out)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Huéspedes</p>
          <p className="font-medium">{booking.guests_count || 1}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Noches</p>
          <p className="font-medium">{booking.nights || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pagado</p>
          <p className="font-medium">{currency(booking.paid_amount_mxn)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Limpieza / depósito</p>
          <p className="font-medium">{currency(booking.cleaning_fee_mxn)} · {currency(booking.deposit_mxn)}</p>
        </div>
      </div>

      {(booking.guest_email || booking.guest_phone || booking.notes) && (
        <div className="mt-4 space-y-1 border-t border-border/70 pt-3 text-sm text-muted-foreground">
          {booking.guest_email && <p>Email: {booking.guest_email}</p>}
          {booking.guest_phone && <p>Teléfono: {booking.guest_phone}</p>}
          {booking.notes && <p>Notas: {booking.notes}</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
        {(booking.status === 'confirmed' || booking.status === 'reserved') && (
          <Button type="button" size="sm" variant="outline" onClick={() => onStatusChange(booking.id, 'check-in')}>
            Check-in
          </Button>
        )}
        {booking.status === 'checked_in' && (
          <Button type="button" size="sm" variant="outline" onClick={() => onStatusChange(booking.id, 'check-out')}>
            Check-out
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(booking)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(booking)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </div>
    </div>
  );
};

const OperationCalendarChip = ({ event }) => {
  const meta = operationCalendarTypeMeta[event.eventType] || operationCalendarTypeMeta.otro;
  return (
    <span className={`block truncate rounded-md border px-2 py-1 text-[11px] font-medium ${meta.className}`}>
      {meta.label} · {event.title}
    </span>
  );
};

const OperationCalendarDetail = ({ event, onEdit, onDelete }) => {
  const meta = operationCalendarTypeMeta[event.eventType] || operationCalendarTypeMeta.otro;
  const booking = event.booking;
  const canManage = event.source_module === 'rental_calendar' && !event.read_only;
  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
            <Badge variant={event.completed ? 'secondary' : 'outline'}>{event.completed ? 'Completado' : 'Pendiente'}</Badge>
          </div>
          <h4 className="mt-3 text-base font-semibold">{event.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{event.property?.title || 'Propiedad'} · {calendarTimeLabel(event.start_time)}</p>
        </div>
        <Badge variant="outline">{event.source_module?.replace('rental_', '') || 'operación'}</Badge>
      </div>

      {event.description && (
        <p className="mt-3 rounded-lg bg-background/60 p-3 text-sm text-muted-foreground">{event.description}</p>
      )}

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Inicio</p>
          <p className="font-medium">{dateOnly(event.start_time)} · {calendarTimeLabel(event.start_time)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fin</p>
          <p className="font-medium">{dateOnly(event.end_time)} · {calendarTimeLabel(event.end_time)}</p>
        </div>
        {booking && (
          <>
            <div>
              <p className="text-muted-foreground">Reserva</p>
              <p className="font-medium">{booking.guest_name || 'Huésped'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Monto / saldo</p>
          <p className="font-medium">{currency(booking.total_amount_mxn)} · {currency(booking.balance_due_mxn)}</p>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <p className="text-xs text-muted-foreground">
          {canManage ? 'Evento operativo editable.' : 'Este registro se gestiona desde su módulo origen.'}
        </p>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onEdit(event)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(event)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const RentalsImportWizard = ({ api, onImported }) => {
  const [templates, setTemplates] = useState({});
  const [jobs, setJobs] = useState([]);
  const [importType, setImportType] = useState('properties');
  const [file, setFile] = useState(null);
  const [job, setJob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const loadImportMeta = useCallback(async () => {
    try {
      const [templatesRes, jobsRes] = await Promise.all([
        api.get('/rentals/import/templates'),
        api.get('/rentals/import/jobs'),
      ]);
      setTemplates(templatesRes.data || {});
      setJobs(jobsRes.data || []);
    } catch (error) {
      toast.error('No se pudo cargar el importador');
    }
  }, [api]);

  useEffect(() => {
    loadImportMeta();
  }, [loadImportMeta]);

  const selectedTemplate = templates[importType] || {};
  const selectedFlow = rentalImportFlows.find((flow) => flow.id === importType) || rentalImportFlows[0];
  const SelectedIcon = selectedFlow.icon;
  const currentStep = job?.result ? 3 : job ? 2 : 1;
  const isCompleted = String(job?.status || '').startsWith('completed');

  const handleImportTypeChange = (value) => {
    setImportType(value);
    setFile(null);
    setJob(null);
  };

  const acceptImportFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!/\.(csv|xlsx|xls)$/i.test(selectedFile.name || '')) {
      toast.error('Solo se aceptan archivos CSV o XLSX');
      return;
    }
    setFile(selectedFile);
    setJob(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    acceptImportFile(event.dataTransfer.files?.[0]);
  };

  const downloadTemplate = async (templateType = importType) => {
    try {
      const response = await api.get(`/rentals/import/templates/${templateType}.csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rovi_rentas_${templateType}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Plantilla descargada');
    } catch (error) {
      toast.error('No se pudo descargar la plantilla');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      toast.error('Selecciona un archivo CSV o XLSX');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const response = await api.post(`/rentals/import/upload?import_type=${importType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJob(response.data);
      toast.success('Archivo listo para revisión');
      loadImportMeta();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo procesar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const executeImport = async () => {
    if (!job?.id) return;
    setExecuting(true);
    try {
      const response = await api.post(`/rentals/import/execute/${job.id}`);
      setJob(response.data);
      toast.success('Importación ejecutada');
      loadImportMeta();
      onImported();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo ejecutar la importación');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Card className="rounded-lg border-border/70">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Importador de operación</CardTitle>
                <CardDescription>Elige el tipo de carga y revisa el archivo antes de crear registros.</CardDescription>
              </div>
              <div className="grid min-w-[280px] grid-cols-3 gap-2">
                {rentalImportSteps.map((step) => {
                  const StepIcon = step.icon;
                  const active = currentStep >= step.id;
                  return (
                    <div key={step.id} className="text-center">
                      <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full transition ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <p className={`mt-2 text-[11px] ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{step.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {rentalImportFlows.map((flow) => {
                const Icon = flow.icon;
                const active = flow.id === importType;
                return (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => handleImportTypeChange(flow.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      active ? 'border-primary bg-primary/10' : 'border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-muted/35'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <Badge variant={active ? 'default' : 'outline'}>CSV/XLSX</Badge>
                    </div>
                    <h3 className="text-sm font-semibold">{flow.title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{flow.description}</p>
                    <span className="mt-3 flex items-center text-xs font-medium text-primary">
                      Seleccionar <ArrowRight className="ml-1 h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/70">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SelectedIcon className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>{selectedFlow.title}</CardTitle>
                  <CardDescription>{selectedFlow.description}</CardDescription>
                </div>
              </div>
              <div className="w-full lg:w-[240px]">
                <Label>Módulo</Label>
                <Select value={importType} onValueChange={handleImportTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rentalImportFlows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>{importTypeLabels[flow.id]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-8 transition ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20 hover:bg-muted/35'
              } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(event) => acceptImportFile(event.target.files?.[0])}
              />
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{file?.name || 'Arrastra tu archivo aquí'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">CSV, XLSX o XLS para {importTypeLabels[importType].toLowerCase()}.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">CSV</Badge>
                  <Badge variant="secondary">XLSX</Badge>
                  <Badge variant="secondary">XLS</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" onClick={() => {
                setFile(null);
                setJob(null);
              }} disabled={!file && !job}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Reiniciar carga
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => downloadTemplate()}>
                  <Download className="mr-2 h-4 w-4" />
                  Plantilla
                </Button>
                <Button onClick={uploadFile} disabled={uploading || !file}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Previsualizar
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Validación del módulo</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedFlow.requiredHelp}. Para reservas, calendario, tareas y finanzas usa property_title o property_id existente.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/70">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Revisa filas válidas, errores y resultado antes de impactar la operación.</CardDescription>
            </div>
            {job && (
              <Badge variant={job.error_rows > 0 || job.result?.failed > 0 ? 'destructive' : 'default'}>
                {job.status || 'preview'}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {job ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard icon={FileSpreadsheet} label="Filas" value={job.total_rows || 0} />
                  <StatCard icon={CheckCircle2} label="Válidas" value={job.valid_rows || 0} />
                  <StatCard icon={XCircle} label="Con error" value={job.error_rows || 0} />
                  <StatCard icon={Upload} label="Módulo" value={importTypeLabels[job.import_type] || importTypeLabels[importType]} />
                </div>

                {job.result && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">Creados</p>
                      <p className="mt-1 text-2xl font-semibold">{job.result.created || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">Actualizados</p>
                      <p className="mt-1 text-2xl font-semibold">{job.result.updated || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm text-muted-foreground">Fallidos</p>
                      <p className="mt-1 text-2xl font-semibold">{job.result.failed || 0}</p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Errores</TableHead>
                        <TableHead>Datos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(job.preview_rows || []).map((row) => (
                        <TableRow key={row.row_number}>
                          <TableCell>{row.row_number}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === 'valid' ? 'default' : 'destructive'}>{row.status === 'valid' ? 'Válida' : 'Error'}</Badge>
                          </TableCell>
                          <TableCell className="min-w-[220px] text-sm text-muted-foreground">{row.errors?.join(', ') || '-'}</TableCell>
                          <TableCell className="max-w-[520px] truncate font-mono text-xs">{JSON.stringify(row.data)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={executeImport} disabled={executing || !job.id || isCompleted || (job.valid_rows || 0) === 0}>
                  {executing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isCompleted ? 'Importación ejecutada' : 'Ejecutar importación'}
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={FileSpreadsheet}
                title="Sube un archivo para comenzar"
                description="El preview detecta columnas, valida filas y muestra qué registros se pueden importar."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="rounded-lg border-border/70">
          <CardHeader>
            <CardTitle>Plantilla esperada</CardTitle>
            <CardDescription>{importTypeLabels[importType]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => downloadTemplate()}>
              <Download className="mr-2 h-4 w-4" />
              Descargar CSV
            </Button>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Columnas</p>
              <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-auto">
                {(selectedTemplate.fields || []).map((field) => (
                  <Badge key={field} variant={(selectedTemplate.required || []).includes(field) ? 'default' : 'secondary'}>
                    {field}
                  </Badge>
                ))}
              </div>
              {!selectedTemplate.fields?.length && (
                <p className="mt-2 text-sm text-muted-foreground">Cargando plantilla...</p>
              )}
            </div>
            {selectedTemplate.required?.length > 0 && (
              <p className="text-xs text-muted-foreground">Requeridos: {selectedTemplate.required.join(', ')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/70">
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Últimas importaciones del workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aún no hay importaciones.</p>
            ) : jobs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setImportType(item.import_type || 'properties');
                  setFile(null);
                  setJob(item);
                }}
                className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{item.filename}</p>
                  <Badge variant="outline">{importTypeLabels[item.import_type] || item.import_type}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.total_rows || 0} filas · {item.status}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const RentalsPage = () => {
  const { api } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [integrations, setIntegrations] = useState({ summary: {}, channels: [] });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [pipelineBoard, setPipelineBoard] = useState(null);
  const [activePropertyId, setActivePropertyId] = useState(null);
  const [propertiesView, setPropertiesView] = useState('table');
  const [bookingsView, setBookingsView] = useState('list');
  const [calendarView, setCalendarView] = useState('calendar');
  const [bookingsMonth, setBookingsMonth] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedBookingsDate, setSelectedBookingsDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [propertyDetailOpen, setPropertyDetailOpen] = useState(false);
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState(null);
  const [propertyAiAnalysis, setPropertyAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [calendarEventDialogOpen, setCalendarEventDialogOpen] = useState(false);
  const [editingCalendarEventId, setEditingCalendarEventId] = useState(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [externalSaleDialogOpen, setExternalSaleDialogOpen] = useState(false);
  const [editingExternalSaleId, setEditingExternalSaleId] = useState(null);
  const [cashClosureDialogOpen, setCashClosureDialogOpen] = useState(false);
  const [editingCashClosureId, setEditingCashClosureId] = useState(null);
  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [editingPipelineId, setEditingPipelineId] = useState(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState(null);
  const [integrationAction, setIntegrationAction] = useState(null);
  const [propertyForm, setPropertyForm] = useState(EMPTY_PROPERTY);
  const [pipelineForm, setPipelineForm] = useState(EMPTY_PIPELINE);
  const [stageForm, setStageForm] = useState(EMPTY_STAGE);
  const [bookingForm, setBookingForm] = useState(EMPTY_BOOKING);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [externalSaleForm, setExternalSaleForm] = useState(EMPTY_EXTERNAL_SALE);
  const [cashClosureForm, setCashClosureForm] = useState(EMPTY_CASH_CLOSURE);
  const [calendarEventForm, setCalendarEventForm] = useState(EMPTY_CALENDAR_EVENT);
  const activeTab = resolveRentalModule(location.pathname);
  const pageCopy = rentalPageCopy[activeTab] || rentalPageCopy.overview;

  const propertyKanbanSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const propertyLookup = useMemo(
    () => Object.fromEntries(properties.map((property) => [property.id, property])),
    [properties]
  );

  const staffLookup = useMemo(
    () => Object.fromEntries(staff.map((member) => [member.id, member])),
    [staff]
  );

  const bookingCalendarEvents = useMemo(
    () => buildBookingCalendarEvents(bookings, propertyLookup),
    [bookings, propertyLookup]
  );

  const operationCalendarEvents = useMemo(
    () => normalizeOperationCalendarEvents(calendarEvents),
    [calendarEvents]
  );

  const manualCalendarEvents = useMemo(
    () => calendarEvents.filter((event) => event.source_module === 'rental_calendar'),
    [calendarEvents]
  );

  const selectedPipeline = useMemo(
    () => pipelines.find((pipeline) => pipeline.id === selectedPipelineId) || pipelines.find((pipeline) => pipeline.is_default) || pipelines[0] || null,
    [pipelines, selectedPipelineId]
  );

  const pipelineStageIds = useMemo(
    () => new Set((pipelineBoard?.stages || []).map((stage) => stage.id)),
    [pipelineBoard]
  );

  const activeKanbanProperty = useMemo(() => {
    if (!activePropertyId) return null;
    for (const stage of pipelineBoard?.stages || []) {
      const found = (stage.properties || []).find((property) => property.id === activePropertyId);
      if (found) return found;
    }
    return properties.find((property) => property.id === activePropertyId) || null;
  }, [activePropertyId, pipelineBoard, properties]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, propertiesRes, bookingsRes, tasksRes, staffRes, financialsRes, integrationsRes, calendarEventsRes, pipelinesRes] = await Promise.all([
        api.get('/rentals/dashboard'),
        api.get('/rentals/properties'),
        api.get('/rentals/bookings'),
        api.get('/rentals/tasks'),
        api.get('/rentals/staff'),
        api.get('/rentals/financials'),
        api.get('/rentals/integrations'),
        api.get('/rentals/calendar/events'),
        api.get('/rentals/pipelines'),
      ]);
      const nextPipelines = pipelinesRes.data || [];
      setDashboard(dashboardRes.data);
      setProperties(propertiesRes.data || []);
      setBookings(bookingsRes.data || []);
      setTasks(tasksRes.data || []);
      setStaff(staffRes.data || []);
      setFinancials(financialsRes.data || null);
      setIntegrations(integrationsRes.data || { summary: {}, channels: [] });
      setCalendarEvents(calendarEventsRes.data || []);
      setPipelines(nextPipelines);
      setSelectedPipelineId((current) => {
        if (current && nextPipelines.some((pipeline) => pipeline.id === current)) {
          return current;
        }
        return nextPipelines.find((pipeline) => pipeline.is_default)?.id || nextPipelines[0]?.id || '';
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el módulo de rentas');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadPipelineBoard = useCallback(async () => {
    if (!selectedPipelineId) {
      setPipelineBoard(null);
      return;
    }
    try {
      const response = await api.get(`/rentals/pipelines/${selectedPipelineId}/board`);
      setPipelineBoard(response.data);
    } catch (error) {
      setPipelineBoard(null);
      toast.error(error.response?.data?.detail || 'No se pudo cargar el pipeline de reservas');
    }
  }, [api, selectedPipelineId]);

  useEffect(() => {
    loadPipelineBoard();
  }, [loadPipelineBoard]);

  const navigateToRentalModule = (moduleKey) => {
    navigate(rentalModuleRoutes[moduleKey] || rentalModuleRoutes.overview);
  };

  const openPropertyDialog = (property = null) => {
    if (property?.id) {
      setEditingPropertyId(property.id);
      setPropertyForm({
        ...EMPTY_PROPERTY,
        ...property,
        owner_id: property.owner_id || '',
        platforms: joinList(property.platforms),
        amenities: joinList(property.amenities),
        images: (property.images || []).map((image, index) => ({
          id: image.id || crypto.randomUUID(),
          filename: image.filename || `Imagen ${index + 1}`,
          alt: image.alt || property.title,
          source: image.source || 'saved',
          order: typeof image.order === 'number' ? image.order : index,
          is_cover: Boolean(image.is_cover || index === 0),
          ...image,
        })),
        notes: property.notes || '',
      });
    } else {
      setEditingPropertyId(null);
      setPropertyForm(EMPTY_PROPERTY);
    }
    setPropertyDialogOpen(true);
  };

  const openPipelineDialog = (pipeline = null) => {
    if (pipeline?.id) {
      setEditingPipelineId(pipeline.id);
      setPipelineForm({
        ...EMPTY_PIPELINE,
        ...pipeline,
        description: pipeline.description || '',
        entity_type: pipeline.entity_type || 'booking',
        status: pipeline.status || 'active',
        is_default: Boolean(pipeline.is_default),
      });
    } else {
      setEditingPipelineId(null);
      setPipelineForm({
        ...EMPTY_PIPELINE,
        name: 'Nuevo pipeline de reservas',
      });
    }
    setPipelineDialogOpen(true);
  };

  const openStageDialog = (stage = null) => {
    if (stage?.id) {
      setEditingStageId(stage.id);
      setStageForm({
        ...EMPTY_STAGE,
        ...stage,
        description: stage.description || '',
        booking_status: stage.booking_status || '',
        color: stage.color || '#0D9488',
        probability: typeof stage.probability === 'number' ? stage.probability : 0,
        sort_order: typeof stage.sort_order === 'number' ? stage.sort_order : 10,
        is_closing_stage: Boolean(stage.is_closing_stage),
        automation_notes: stage.automation_notes || '',
      });
    } else {
      const nextOrder = Math.max(0, ...((pipelineBoard?.stages || []).map((item) => Number(item.sort_order) || 0))) + 10;
      setEditingStageId(null);
      setStageForm({
        ...EMPTY_STAGE,
        name: 'Nuevo stage',
        sort_order: nextOrder,
      });
    }
    setStageDialogOpen(true);
  };

  const openBookingDialog = (booking = null) => {
    if (booking?.id) {
      setEditingBookingId(booking.id);
      setBookingForm({
        property_id: booking.property_id || '',
        guest_id: booking.guest_id || '',
        guest_name: booking.guest_name || '',
        guest_email: booking.guest_email || '',
        guest_phone: booking.guest_phone || '',
        source: booking.source || 'direct',
        check_in: toDateInput(booking.check_in),
        check_out: toDateInput(booking.check_out),
        guests_count: booking.guests_count || 1,
        status: booking.status || 'reserved',
        total_amount_mxn: booking.total_amount_mxn || 0,
        paid_amount_mxn: booking.paid_amount_mxn || 0,
        cleaning_fee_mxn: booking.cleaning_fee_mxn || 0,
        deposit_mxn: booking.deposit_mxn || 0,
        platform_fee_mxn: booking.platform_fee_mxn || 0,
        notes: booking.notes || '',
      });
    } else {
      setEditingBookingId(null);
      setBookingForm({
        ...EMPTY_BOOKING,
        property_id: properties[0]?.id || '',
      });
    }
    setBookingDialogOpen(true);
  };

  const openTaskDialog = (task = null) => {
    if (task?.id) {
      setEditingTaskId(task.id);
      setTaskForm({
        ...EMPTY_TASK,
        ...task,
        property_id: task.property_id || properties[0]?.id || '',
        booking_id: task.booking_id || '',
        assigned_staff_id: task.assigned_staff_id || '',
        assigned_to: task.assigned_to || task.staff?.name || '',
        due_at: toDateTimeInput(task.due_at),
        next_due_at: toDateTimeInput(task.next_due_at),
        notes: task.notes || '',
      });
    } else {
      setEditingTaskId(null);
      setTaskForm({
        ...EMPTY_TASK,
        property_id: properties[0]?.id || '',
      });
    }
    setTaskDialogOpen(true);
  };

  const openStaffDialog = (member = null) => {
    if (member?.id) {
      setEditingStaffId(member.id);
      setStaffForm({
        ...EMPTY_STAFF,
        ...member,
        responsibilities: joinList(member.responsibilities),
        specialties: joinList(member.specialties),
        notes: member.notes || '',
      });
    } else {
      setEditingStaffId(null);
      setStaffForm(EMPTY_STAFF);
    }
    setStaffDialogOpen(true);
  };

  const openExpenseDialog = (expense = null) => {
    if (expense?.id) {
      setEditingExpenseId(expense.id);
      setExpenseForm({
        ...EMPTY_EXPENSE,
        ...expense,
        property_id: expense.property_id || properties[0]?.id || '',
        booking_id: expense.booking_id || '',
        staff_id: expense.staff_id || '',
        expense_date: toDateInput(expense.expense_date),
        vendor: expense.vendor || '',
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || '',
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({
        ...EMPTY_EXPENSE,
        property_id: properties[0]?.id || '',
        expense_date: toDateInput(new Date()),
      });
    }
    setExpenseDialogOpen(true);
  };

  const openExternalSaleDialog = (sale = null) => {
    if (sale?.id) {
      setEditingExternalSaleId(sale.id);
      setExternalSaleForm({
        ...EMPTY_EXTERNAL_SALE,
        ...sale,
        property_id: sale.property_id || '',
        booking_id: sale.booking_id || '',
        staff_id: sale.staff_id || '',
        guest_name: sale.guest_name || '',
        sale_date: toDateInput(sale.sale_date),
        notes: sale.notes || '',
      });
    } else {
      setEditingExternalSaleId(null);
      setExternalSaleForm({
        ...EMPTY_EXTERNAL_SALE,
        property_id: properties[0]?.id || '',
        sale_date: toDateInput(new Date()),
      });
    }
    setExternalSaleDialogOpen(true);
  };

  const openCashClosureDialog = (closure = null) => {
    if (closure?.id) {
      setEditingCashClosureId(closure.id);
      setCashClosureForm({
        ...EMPTY_CASH_CLOSURE,
        ...closure,
        responsible_staff_id: closure.responsible_staff_id || '',
        closure_date: toDateInput(closure.closure_date),
        notes: closure.notes || '',
      });
    } else {
      setEditingCashClosureId(null);
      setCashClosureForm({
        ...EMPTY_CASH_CLOSURE,
        closure_date: toDateInput(new Date()),
      });
    }
    setCashClosureDialogOpen(true);
  };

  const openCalendarEventDialog = (event = null) => {
    if (event?.source_module === 'rental_calendar') {
      const sourceEvent = event.calendar_event || {};
      setEditingCalendarEventId(event.source_id || event.originalId || sourceEvent.id);
      setCalendarEventForm({
        property_id: sourceEvent.property_id || event.property?.id || properties[0]?.id || '',
        title: sourceEvent.title || event.title || '',
        event_type: sourceEvent.event_type || event.event_type || 'blocked',
        start_date: toDateTimeInput(sourceEvent.start_date || event.start_time),
        end_date: toDateTimeInput(sourceEvent.end_date || event.end_time || event.start_time),
        status: sourceEvent.status || (event.completed ? 'done' : 'active'),
        source: sourceEvent.source || 'manual',
        notes: sourceEvent.notes || event.description || '',
      });
    } else {
      const startDate = selectedCalendarDate || new Date();
      const endDate = addDays(startDate, 1);
      setEditingCalendarEventId(null);
      setCalendarEventForm({
        ...EMPTY_CALENDAR_EVENT,
        property_id: properties[0]?.id || '',
        start_date: toDateTimeInput(startDate),
        end_date: toDateTimeInput(endDate),
      });
    }
    setCalendarEventDialogOpen(true);
  };

  const updatePropertyForm = (key, value) => setPropertyForm((current) => ({ ...current, [key]: value }));
  const updatePipelineForm = (key, value) => setPipelineForm((current) => ({ ...current, [key]: value }));
  const updateStageForm = (key, value) => setStageForm((current) => ({ ...current, [key]: value }));
  const updateBookingForm = (key, value) => setBookingForm((current) => ({ ...current, [key]: value }));
  const updateTaskForm = (key, value) => setTaskForm((current) => ({ ...current, [key]: value }));
  const updateStaffForm = (key, value) => setStaffForm((current) => ({ ...current, [key]: value }));
  const updateExpenseForm = (key, value) => setExpenseForm((current) => ({ ...current, [key]: value }));
  const updateExternalSaleForm = (key, value) => setExternalSaleForm((current) => ({ ...current, [key]: value }));
  const updateCashClosureForm = (key, value) => setCashClosureForm((current) => ({ ...current, [key]: value }));
  const updateCalendarEventForm = (key, value) => setCalendarEventForm((current) => ({ ...current, [key]: value }));

  const handlePropertyImageSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const currentImages = propertyForm.images || [];
      const nextImages = await Promise.all(files.map(async (selectedFile, index) => ({
        id: crypto.randomUUID(),
        url: await readFileAsDataUrl(selectedFile),
        filename: selectedFile.name,
        alt: propertyForm.title || selectedFile.name,
        is_cover: currentImages.length === 0 && index === 0,
        order: currentImages.length + index,
        source: 'upload',
      })));

      setPropertyForm((current) => ({
        ...current,
        images: [...(current.images || []), ...nextImages],
      }));
      event.target.value = '';
    } catch (error) {
      toast.error('No se pudieron leer las imágenes seleccionadas');
    }
  };

  const removePropertyImage = (imageId) => {
    setPropertyForm((current) => {
      const nextImages = (current.images || []).filter((image) => image.id !== imageId);
      return {
        ...current,
        images: nextImages.map((image, index, array) => ({
          ...image,
          order: index,
          is_cover: array.some((candidate) => candidate.is_cover)
            ? image.is_cover
            : index === 0,
        })),
      };
    });
  };

  const setPropertyCoverImage = (imageId) => {
    setPropertyForm((current) => ({
      ...current,
      images: (current.images || []).map((image) => ({
        ...image,
        is_cover: image.id === imageId,
      })),
    }));
  };

  const saveProperty = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...propertyForm,
        owner_id: propertyForm.owner_id || null,
        bedrooms: Number(propertyForm.bedrooms) || 1,
        bathrooms: Number(propertyForm.bathrooms) || 1,
        max_guests: Number(propertyForm.max_guests) || 1,
        nightly_price_mxn: Number(propertyForm.nightly_price_mxn) || 0,
        monthly_price_mxn: Number(propertyForm.monthly_price_mxn) || 0,
        cleaning_fee_mxn: Number(propertyForm.cleaning_fee_mxn) || 0,
        deposit_mxn: Number(propertyForm.deposit_mxn) || 0,
        commission_rate: Number(propertyForm.commission_rate) || 0,
        platforms: splitList(propertyForm.platforms),
        amenities: splitList(propertyForm.amenities),
        images: (propertyForm.images || []).map((image, index) => ({
          ...image,
          order: index,
          is_cover: image.is_cover || (index === 0 && !(propertyForm.images || []).some((candidate) => candidate.is_cover)),
        })),
      };
      if (editingPropertyId) {
        await api.put(`/rentals/properties/${editingPropertyId}`, payload);
        toast.success('Propiedad actualizada');
      } else {
        await api.post('/rentals/properties', payload);
        toast.success('Propiedad creada');
      }
      setPropertyDialogOpen(false);
      setEditingPropertyId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la propiedad');
    } finally {
      setSaving(false);
    }
  };

  const deleteProperty = async (property) => {
    if (!property?.id) return;
    const confirmed = window.confirm(`¿Archivar "${property.title}"? La propiedad saldrá del inventario activo.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/properties/${property.id}`);
      toast.success('Propiedad archivada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo archivar la propiedad');
    }
  };

  const savePipeline = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...pipelineForm,
        description: pipelineForm.description || null,
        entity_type: pipelineForm.entity_type || 'booking',
        is_default: Boolean(pipelineForm.is_default),
      };
      if (editingPipelineId) {
        await api.put(`/rentals/pipelines/${editingPipelineId}`, payload);
        toast.success('Pipeline actualizado');
      } else {
        const response = await api.post('/rentals/pipelines', payload);
        toast.success('Pipeline creado');
        if (response.data?.id) {
          setSelectedPipelineId(response.data.id);
        }
      }
      setPipelineDialogOpen(false);
      setEditingPipelineId(null);
      await loadData();
      await loadPipelineBoard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el pipeline');
    } finally {
      setSaving(false);
    }
  };

  const deletePipeline = async (pipeline) => {
    if (!pipeline?.id) return;
    const confirmed = window.confirm(`¿Archivar el pipeline "${pipeline.name}"?`);
    if (!confirmed) return;
    try {
      await api.delete(`/rentals/pipelines/${pipeline.id}`);
      toast.success('Pipeline archivado');
      setSelectedPipelineId('');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo archivar el pipeline');
    }
  };

  const saveStage = async (event) => {
    event.preventDefault();
    if (!selectedPipelineId) {
      toast.error('Selecciona un pipeline');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...stageForm,
        description: stageForm.description || null,
        booking_status: stageForm.booking_status || null,
        probability: Number(stageForm.probability) || 0,
        sort_order: Number(stageForm.sort_order) || 10,
        is_closing_stage: Boolean(stageForm.is_closing_stage),
        automation_notes: stageForm.automation_notes || null,
      };
      if (editingStageId) {
        await api.put(`/rentals/pipeline-stages/${editingStageId}`, payload);
        toast.success('Stage actualizado');
      } else {
        await api.post(`/rentals/pipelines/${selectedPipelineId}/stages`, payload);
        toast.success('Stage creado');
      }
      setStageDialogOpen(false);
      setEditingStageId(null);
      await loadData();
      await loadPipelineBoard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el stage');
    } finally {
      setSaving(false);
    }
  };

  const deleteStage = async (stage) => {
    if (!stage?.id) return;
    const confirmed = window.confirm(`¿Eliminar el stage "${stage.name}"? Las reservas quedarán mapeadas por estado.`);
    if (!confirmed) return;
    try {
      await api.delete(`/rentals/pipeline-stages/${stage.id}`);
      toast.success('Stage eliminado');
      await loadData();
      await loadPipelineBoard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el stage');
    }
  };

  const findPropertyStageId = useCallback((propertyId) => {
    for (const stage of pipelineBoard?.stages || []) {
      if ((stage.properties || []).some((property) => property.id === propertyId)) {
        return stage.id;
      }
    }
    return null;
  }, [pipelineBoard]);

  const movePropertyInBoard = useCallback((propertyId, targetStageId) => {
    setPipelineBoard((current) => {
      if (!current?.stages?.length) return current;
      let movedProperty = null;
      const stagesWithoutProperty = current.stages.map((stage) => {
        const nextProperties = (stage.properties || []).filter((property) => {
          if (property.id === propertyId) {
            movedProperty = property;
            return false;
          }
          return true;
        });
        return {
          ...stage,
          properties: nextProperties,
          properties_count: nextProperties.length,
          nightly_potential_mxn: nextProperties.reduce((sum, property) => sum + Number(property.nightly_price_mxn || 0), 0),
          monthly_potential_mxn: nextProperties.reduce((sum, property) => sum + Number(property.monthly_price_mxn || 0), 0),
        };
      });

      if (!movedProperty) {
        movedProperty = properties.find((property) => property.id === propertyId);
      }
      if (!movedProperty) return current;

      const nextStages = stagesWithoutProperty.map((stage) => {
        if (stage.id !== targetStageId) return stage;
        const nextProperties = [
          {
            ...movedProperty,
            pipeline_id: selectedPipelineId,
            stage_id: targetStageId,
          },
          ...(stage.properties || []),
        ];
        return {
          ...stage,
          properties: nextProperties,
          properties_count: nextProperties.length,
          nightly_potential_mxn: nextProperties.reduce((sum, property) => sum + Number(property.nightly_price_mxn || 0), 0),
          monthly_potential_mxn: nextProperties.reduce((sum, property) => sum + Number(property.monthly_price_mxn || 0), 0),
        };
      });

      return {
        ...current,
        stages: nextStages,
        summary: {
          ...(current.summary || {}),
          properties_count: nextStages.reduce((sum, stage) => sum + Number(stage.properties_count || 0), 0),
          nightly_potential_mxn: nextStages.reduce((sum, stage) => sum + Number(stage.nightly_potential_mxn || 0), 0),
          monthly_potential_mxn: nextStages.reduce((sum, stage) => sum + Number(stage.monthly_potential_mxn || 0), 0),
        },
      };
    });

    setProperties((current) => current.map((property) => (
      property.id === propertyId
        ? { ...property, pipeline_id: selectedPipelineId, stage_id: targetStageId }
        : property
    )));
  }, [properties, selectedPipelineId]);

  const handlePropertyKanbanDragStart = (event) => {
    setActivePropertyId(event.active.id);
  };

  const handlePropertyKanbanDragEnd = async (event) => {
    const { active, over } = event;
    setActivePropertyId(null);
    if (!active?.id || !over || !selectedPipelineId) return;

    const targetStageId = over.data?.current?.stageId || String(over.id).replace('property-stage-', '');
    if (!targetStageId || !pipelineStageIds.has(targetStageId)) return;

    const propertyId = active.id;
    const sourceStageId = active.data?.current?.stageId || findPropertyStageId(propertyId);
    if (sourceStageId === targetStageId) return;

    movePropertyInBoard(propertyId, targetStageId);
    try {
      await api.put(`/rentals/properties/${propertyId}`, {
        pipeline_id: selectedPipelineId,
        stage_id: targetStageId,
      });
      const targetStage = (pipelineBoard?.stages || []).find((stage) => stage.id === targetStageId);
      toast.success(`Propiedad movida a ${targetStage?.name || 'stage seleccionado'}`);
      await loadData();
      await loadPipelineBoard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo mover la propiedad');
      await loadData();
      await loadPipelineBoard();
    }
  };

  const openPropertyDetail = async (property) => {
    if (!property?.id) return;
    setPropertyDetailOpen(true);
    setSelectedPropertyDetail(null);
    setPropertyAiAnalysis(null);
    try {
      const response = await api.get(`/rentals/properties/${property.id}/detail`);
      setSelectedPropertyDetail(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el detalle de la propiedad');
      setPropertyDetailOpen(false);
    }
  };

  const runPropertyAiAnalysis = async () => {
    const propertyId = selectedPropertyDetail?.property?.id;
    if (!propertyId) return;
    setAiLoading(true);
    try {
      const response = await api.post(`/rentals/properties/${propertyId}/ai-analysis`);
      setPropertyAiAnalysis(response.data);
      toast.success('Análisis IA actualizado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo generar el análisis IA');
    } finally {
      setAiLoading(false);
    }
  };

  const saveBooking = async (event) => {
    event.preventDefault();
    if (!bookingForm.property_id) {
      toast.error('Selecciona una propiedad');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...bookingForm,
        guest_id: bookingForm.guest_id || null,
        guest_email: bookingForm.guest_email || null,
        guest_phone: bookingForm.guest_phone || null,
        check_in: fromDateInput(bookingForm.check_in),
        check_out: fromDateInput(bookingForm.check_out),
        guests_count: Number(bookingForm.guests_count) || 1,
        total_amount_mxn: Number(bookingForm.total_amount_mxn) || 0,
        paid_amount_mxn: Number(bookingForm.paid_amount_mxn) || 0,
        cleaning_fee_mxn: Number(bookingForm.cleaning_fee_mxn) || 0,
        deposit_mxn: Number(bookingForm.deposit_mxn) || 0,
        platform_fee_mxn: Number(bookingForm.platform_fee_mxn) || 0,
      };
      if (editingBookingId) {
        await api.put(`/rentals/bookings/${editingBookingId}`, payload);
        toast.success('Reserva actualizada');
      } else {
        await api.post('/rentals/bookings', payload);
        toast.success('Reserva creada');
      }
      setBookingDialogOpen(false);
      setEditingBookingId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la reserva');
    } finally {
      setSaving(false);
    }
  };

  const deleteBooking = async (booking) => {
    if (!booking?.id) return;
    const confirmed = window.confirm(`¿Eliminar la reserva de ${booking.guest_name || 'este huésped'}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/bookings/${booking.id}`);
      toast.success('Reserva eliminada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar la reserva');
    }
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!taskForm.property_id) {
      toast.error('Selecciona una propiedad');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...taskForm,
        booking_id: taskForm.booking_id || null,
        assigned_staff_id: taskForm.assigned_staff_id || null,
        due_at: taskForm.due_at ? new Date(taskForm.due_at).toISOString() : null,
        next_due_at: taskForm.next_due_at ? new Date(taskForm.next_due_at).toISOString() : null,
        assigned_to: taskForm.assigned_to || null,
        recurrence_rule: taskForm.recurrence_rule || null,
        linked_event_type: taskForm.linked_event_type || null,
      };
      if (editingTaskId) {
        await api.put(`/rentals/tasks/${editingTaskId}`, payload);
        toast.success('Tarea actualizada');
      } else {
        await api.post('/rentals/tasks', payload);
        toast.success('Tarea creada');
      }
      setTaskDialogOpen(false);
      setEditingTaskId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (task) => {
    if (!task?.id) return;
    const confirmed = window.confirm(`¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/tasks/${task.id}`);
      toast.success('Tarea eliminada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar la tarea');
    }
  };

  const saveStaff = async (event) => {
    event.preventDefault();
    if (!staffForm.name.trim()) {
      toast.error('Agrega el nombre del responsable');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...staffForm,
        email: staffForm.email || null,
        phone: staffForm.phone || null,
        role: staffForm.role || null,
        responsibilities: splitList(staffForm.responsibilities),
        specialties: splitList(staffForm.specialties),
        notes: staffForm.notes || null,
      };
      if (editingStaffId) {
        await api.put(`/rentals/staff/${editingStaffId}`, payload);
        toast.success('Staff actualizado');
      } else {
        await api.post('/rentals/staff', payload);
        toast.success('Staff creado');
      }
      setStaffDialogOpen(false);
      setEditingStaffId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el staff');
    } finally {
      setSaving(false);
    }
  };

  const deleteStaff = async (member) => {
    if (!member?.id) return;
    const confirmed = window.confirm(`¿Desactivar a ${member.name}? Sus tareas quedarán sin responsable ligado.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/staff/${member.id}`);
      toast.success('Staff desactivado');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo desactivar el staff');
    }
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    if (!expenseForm.property_id) {
      toast.error('Selecciona una propiedad');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...expenseForm,
        booking_id: expenseForm.booking_id || null,
        staff_id: expenseForm.staff_id || null,
        amount_mxn: Number(expenseForm.amount_mxn) || 0,
        expense_date: fromDateInput(expenseForm.expense_date || toDateInput(new Date())),
        vendor: expenseForm.vendor || null,
        receipt_url: expenseForm.receipt_url || null,
        notes: expenseForm.notes || null,
      };
      if (editingExpenseId) {
        await api.put(`/rentals/expenses/${editingExpenseId}`, payload);
        toast.success('Gasto actualizado');
      } else {
        await api.post('/rentals/expenses', payload);
        toast.success('Gasto registrado');
      }
      setExpenseDialogOpen(false);
      setEditingExpenseId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expense) => {
    if (!expense?.id) return;
    const confirmed = window.confirm(`¿Eliminar el gasto "${expense.description}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/expenses/${expense.id}`);
      toast.success('Gasto eliminado');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el gasto');
    }
  };

  const saveExternalSale = async (event) => {
    event.preventDefault();
    if (!externalSaleForm.concept.trim()) {
      toast.error('Agrega el concepto del ingreso');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...externalSaleForm,
        property_id: externalSaleForm.property_id || null,
        booking_id: externalSaleForm.booking_id || null,
        staff_id: externalSaleForm.staff_id || null,
        guest_name: externalSaleForm.guest_name || null,
        amount_mxn: Number(externalSaleForm.amount_mxn) || 0,
        sale_date: fromDateInput(externalSaleForm.sale_date || toDateInput(new Date())),
        notes: externalSaleForm.notes || null,
      };
      if (editingExternalSaleId) {
        await api.put(`/rentals/external-sales/${editingExternalSaleId}`, payload);
        toast.success('Venta externa actualizada');
      } else {
        await api.post('/rentals/external-sales', payload);
        toast.success('Venta externa registrada');
      }
      setExternalSaleDialogOpen(false);
      setEditingExternalSaleId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la venta externa');
    } finally {
      setSaving(false);
    }
  };

  const deleteExternalSale = async (sale) => {
    if (!sale?.id) return;
    const confirmed = window.confirm(`¿Eliminar la venta "${sale.concept}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/external-sales/${sale.id}`);
      toast.success('Venta externa eliminada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar la venta externa');
    }
  };

  const saveCashClosure = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...cashClosureForm,
        closure_date: fromDateInput(cashClosureForm.closure_date || toDateInput(new Date())),
        responsible_staff_id: cashClosureForm.responsible_staff_id || null,
        notes: cashClosureForm.notes || null,
      };
      if (editingCashClosureId) {
        await api.put(`/rentals/cash-closures/${editingCashClosureId}`, payload);
        toast.success('Cierre actualizado');
      } else {
        await api.post('/rentals/cash-closures', payload);
        toast.success('Cierre de caja creado');
      }
      setCashClosureDialogOpen(false);
      setEditingCashClosureId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el cierre de caja');
    } finally {
      setSaving(false);
    }
  };

  const deleteCashClosure = async (closure) => {
    if (!closure?.id) return;
    const confirmed = window.confirm(`¿Eliminar el cierre del ${dateOnly(closure.closure_date)}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/cash-closures/${closure.id}`);
      toast.success('Cierre eliminado');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el cierre');
    }
  };

  const seedDemoData = async () => {
    setSaving(true);
    try {
      const response = await api.post('/rentals/seed-demo');
      toast.success(response.data?.message || 'Datos demo creados');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudieron crear datos demo');
    } finally {
      setSaving(false);
    }
  };

  const connectDemoIntegration = async (provider) => {
    setIntegrationAction(`${provider}:connect`);
    try {
      const response = await api.post(`/rentals/integrations/${provider}/connect-demo`);
      toast.success(response.data?.message || 'Integración demo conectada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo conectar la integración demo');
    } finally {
      setIntegrationAction(null);
    }
  };

  const syncDemoIntegration = async (provider) => {
    setIntegrationAction(`${provider}:sync`);
    try {
      const response = await api.post(`/rentals/integrations/${provider}/sync-demo`);
      const created = response.data?.created || {};
      toast.success(`${response.data?.message || 'Sincronización demo lista'}: ${created.bookings || 0} reservas, ${created.calendar_events || 0} bloqueos`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo sincronizar la integración demo');
    } finally {
      setIntegrationAction(null);
    }
  };

  const disconnectDemoIntegration = async (provider) => {
    setIntegrationAction(`${provider}:disconnect`);
    try {
      const response = await api.post(`/rentals/integrations/${provider}/disconnect-demo`);
      toast.success(response.data?.message || 'Integración demo desconectada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo desconectar la integración demo');
    } finally {
      setIntegrationAction(null);
    }
  };

  const updateBookingStatus = async (bookingId, action) => {
    try {
      await api.post(`/rentals/bookings/${bookingId}/${action}`);
      toast.success('Reserva actualizada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar la reserva');
    }
  };

  const saveCalendarEvent = async (event) => {
    event.preventDefault();
    if (!calendarEventForm.property_id) {
      toast.error('Selecciona una propiedad');
      return;
    }
    if (!calendarEventForm.start_date || !calendarEventForm.end_date) {
      toast.error('Selecciona inicio y fin del evento');
      return;
    }

    const startDate = new Date(calendarEventForm.start_date);
    const endDate = new Date(calendarEventForm.end_date);
    if (endDate < startDate) {
      toast.error('La fecha de fin debe ser posterior al inicio');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...calendarEventForm,
        title: calendarEventForm.title || null,
        notes: calendarEventForm.notes || null,
        start_date: fromDateTimeInput(calendarEventForm.start_date),
        end_date: fromDateTimeInput(calendarEventForm.end_date),
      };

      if (editingCalendarEventId) {
        await api.put(`/rentals/calendar/events/${editingCalendarEventId}`, payload);
        toast.success('Evento actualizado');
      } else {
        await api.post('/rentals/calendar/events', payload);
        toast.success('Evento creado');
      }
      setCalendarEventDialogOpen(false);
      setEditingCalendarEventId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el evento');
    } finally {
      setSaving(false);
    }
  };

  const deleteCalendarEvent = async (event) => {
    const eventId = event?.source_id || event?.originalId || event?.calendar_event?.id;
    if (!eventId) return;
    const confirmed = window.confirm(`¿Eliminar "${event.title || 'este evento'}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await api.delete(`/rentals/calendar/events/${eventId}`);
      toast.success('Evento eliminado');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el evento');
    }
  };

  const completeTask = async (taskId) => {
    try {
      await api.put(`/rentals/tasks/${taskId}`, { status: 'done' });
      toast.success('Tarea terminada');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar la tarea');
    }
  };

  const summary = dashboard?.summary || {};

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-6 sm:px-7 lg:px-10">
    <div className="mx-auto max-w-[1680px] space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card/50 p-5 sm:flex-row sm:items-end sm:justify-between lg:p-6">
        <div>
          <p className="text-sm font-medium text-primary">Rentas & Property Management</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-foreground">{pageCopy.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {pageCopy.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={() => navigateToRentalModule('import')}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={seedDemoData} disabled={saving}>
            <Sparkles className="mr-2 h-4 w-4" />
            Demo
          </Button>
          <Button onClick={openPropertyDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Propiedad
          </Button>
          <Button variant="secondary" onClick={() => openBookingDialog()} disabled={!properties.length}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Reserva
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Home} label="Propiedades activas" value={summary.properties_active || 0} helper={`${summary.properties_total || 0} en total`} />
        <StatCard icon={WalletCards} label="Ingresos del mes" value={currency(summary.monthly_revenue_mxn)} helper={`${currency(summary.monthly_net_mxn)} neto estimado`} />
        <StatCard icon={CalendarDays} label="Ocupación estimada" value={`${summary.occupancy_rate || 0}%`} helper={`${summary.bookings_month || 0} reservas del mes`} />
        <StatCard icon={ClipboardList} label="Tareas pendientes" value={summary.pending_tasks || 0} helper="Limpieza, mantenimiento y operación" />
      </div>

      <Tabs value={activeTab} onValueChange={navigateToRentalModule} className="space-y-4">
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['properties', Home, 'Propiedades', 'Inventario, fotos, canales y tarifas.'],
              ['bookings', CalendarDays, 'Reservas', 'Huéspedes, fechas, pagos y saldos.'],
              ['calendar', CalendarDays, 'Calendario', 'Entradas, salidas y bloqueos próximos.'],
              ['tasks', ClipboardList, 'Tareas', 'Limpieza, mantenimiento e inspecciones.'],
              ['staff', BriefcaseBusiness, 'Staff', 'Responsables y cargos de operación.'],
              ['financials', WalletCards, 'Finanzas', 'Revenue, cobros, gastos y neto.'],
              ['integrations', Zap, 'Integraciones', 'Airbnb, Booking, Vrbo, iCal y calendario en modo demo.'],
              ['import', Upload, 'Importador', 'CSV/XLSX para operación completa.'],
            ].map(([moduleKey, Icon, title, description]) => (
              <button
                key={moduleKey}
                type="button"
                onClick={() => navigateToRentalModule(moduleKey)}
                className="rounded-lg border bg-card p-5 text-left transition hover:border-primary/60 hover:bg-muted/30"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-4 block text-base font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Inventario de renta</CardTitle>
                <CardDescription>Propiedades operadas por noche, mes o contratos de administración.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <PropertyViewToggle value={propertiesView} onChange={setPropertiesView} />
                <Button onClick={openPropertyDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva propiedad
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {properties.length === 0 && propertiesView !== 'pipeline' ? (
                <EmptyState
                  icon={Home}
                  title="Sin propiedades cargadas"
                  description="Crea una propiedad manualmente o usa el importador para cargar inventario desde CSV/XLSX."
                  action={<Button onClick={() => navigateToRentalModule('import')}><Upload className="mr-2 h-4 w-4" />Importar propiedades</Button>}
                />
              ) : propertiesView === 'table' ? (
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="min-w-[1080px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Operación</TableHead>
                        <TableHead>Capacidad</TableHead>
                        <TableHead>Tarifas</TableHead>
                        <TableHead>Canales</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => {
                        const coverImage = (property.images || []).find((image) => image.is_cover) || property.images?.[0];
                        const platforms = property.platforms || [];
                        const amenities = property.amenities || [];
                        const commissionPercent = Math.round((Number(property.commission_rate) || 0) * 100);

                        return (
                          <TableRow key={property.id} className="align-top">
                            <TableCell>
                              <div className="flex min-w-[270px] items-center gap-3">
                                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                                  {coverImage?.url ? (
                                    <img src={coverImage.url} alt={coverImage.alt || property.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                      <Home className="h-5 w-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="max-w-[240px] truncate font-medium">{property.title}</p>
                                  <p className="max-w-[240px] truncate text-xs text-muted-foreground">{property.zone || property.address || 'Sin zona'}</p>
                                  {property.address && property.zone && (
                                    <p className="max-w-[240px] truncate text-xs text-muted-foreground">{property.address}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-[150px] flex-col items-start gap-2">
                                <Badge>{rentalTypeLabels[property.rental_type] || property.rental_type}</Badge>
                                <Badge variant="outline">{statusLabels[property.status] || property.status}</Badge>
                                <span className="text-xs text-muted-foreground">{operationTypeLabels[property.operation_type] || property.operation_type || 'Renta'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[130px] text-sm">
                                <p className="font-medium">{property.bedrooms || 0} rec · {property.bathrooms || 0} baños</p>
                                <p className="text-xs text-muted-foreground">{property.max_guests || 0} huéspedes máximos</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[170px] space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Noche:</span> <span className="font-semibold">{currency(property.nightly_price_mxn)}</span></p>
                                <p><span className="text-muted-foreground">Mes:</span> <span className="font-semibold">{currency(property.monthly_price_mxn)}</span></p>
                                <p className="text-xs text-muted-foreground">Limpieza {currency(property.cleaning_fee_mxn)} · Depósito {currency(property.deposit_mxn)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[180px]">
                                {platforms.length > 0 ? (
                                  <div className="flex max-w-[220px] flex-wrap gap-1.5">
                                    {platforms.slice(0, 3).map((platform) => (
                                      <Badge key={platform} variant="secondary">{platform}</Badge>
                                    ))}
                                    {platforms.length > 3 && <Badge variant="secondary">+{platforms.length - 3}</Badge>}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Sin canales</span>
                                )}
                                {amenities.length > 0 && (
                                  <p className="mt-2 max-w-[220px] truncate text-xs text-muted-foreground">
                                    {amenities.slice(0, 3).join(', ')}{amenities.length > 3 ? ` +${amenities.length - 3}` : ''}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[100px]">
                                <p className="text-base font-semibold">{commissionPercent}%</p>
                                <p className="text-xs text-muted-foreground">Sobre operación</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex min-w-[270px] flex-wrap justify-end gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => openPropertyDetail(property)}>
                                  <Brain className="mr-2 h-4 w-4" />
                                  Detalle
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => openPropertyDialog(property)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button type="button" size="sm" variant="destructive" onClick={() => deleteProperty(property)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Archivar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : propertiesView === 'cards' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => {
                  const coverImage = (property.images || []).find((image) => image.is_cover) || property.images?.[0];
                  return (
                  <Card key={property.id} className="overflow-hidden rounded-lg border-border/70 shadow-sm">
                    {coverImage?.url ? (
                      <div className="aspect-[16/9] bg-muted">
                        <img src={coverImage.url} alt={coverImage.alt || property.title} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-muted/30 text-muted-foreground">
                        <Home className="h-8 w-8" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{property.title}</CardTitle>
                          <CardDescription>{property.zone || property.address || 'Sin zona'}</CardDescription>
                        </div>
                        <Badge variant="outline">{statusLabels[property.status] || property.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{rentalTypeLabels[property.rental_type] || property.rental_type}</Badge>
                        <Badge variant="secondary">{property.bedrooms} rec · {property.bathrooms} baños · {property.max_guests} pax</Badge>
                        <Badge variant="outline">{operationTypeLabels[property.operation_type] || property.operation_type || 'Renta'}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground">Noche</p>
                          <p className="font-semibold">{currency(property.nightly_price_mxn)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mes</p>
                          <p className="font-semibold">{currency(property.monthly_price_mxn)}</p>
                        </div>
                      </div>
                      {property.platforms?.length > 0 && (
                        <p className="text-muted-foreground">Canales: {property.platforms.join(', ')}</p>
                      )}
                      {property.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.slice(0, 4).map((amenity) => (
                            <Badge key={amenity} variant="outline">{amenity}</Badge>
                          ))}
                          {property.amenities.length > 4 && <Badge variant="outline">+{property.amenities.length - 4}</Badge>}
                        </div>
                      )}
                      <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
                        <Button type="button" size="sm" variant="outline" onClick={() => openPropertyDetail(property)}>
                          <Brain className="mr-2 h-4 w-4" />
                          Detalle
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => openPropertyDialog(property)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => deleteProperty(property)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Archivar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
              ) : null}

              {propertiesView === 'pipeline' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Kanban de propiedades por pipeline</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Arrastra propiedades entre stages para reflejar si están en captación, configuración, publicación, operación o cierre.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select value={selectedPipelineId || undefined} onValueChange={setSelectedPipelineId}>
                      <SelectTrigger className="w-full sm:w-[260px]">
                        <SelectValue placeholder="Selecciona pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map((pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>{pipeline.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => openPipelineDialog(selectedPipeline)} disabled={!selectedPipeline}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Pipeline
                    </Button>
                    <Button type="button" variant="outline" onClick={() => openStageDialog()} disabled={!selectedPipelineId}>
                      <Plus className="mr-2 h-4 w-4" />
                      Stage
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Stages activos</p>
                    <p className="mt-1 text-2xl font-semibold">{pipelineBoard?.summary?.stages_count || selectedPipeline?.stages_count || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Propiedades en pipeline</p>
                    <p className="mt-1 text-2xl font-semibold">{pipelineBoard?.summary?.properties_count || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Potencial mensual</p>
                    <p className="mt-1 text-2xl font-semibold">{currency(pipelineBoard?.summary?.monthly_potential_mxn || 0)}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Reservas vinculadas</p>
                    <p className="mt-1 text-2xl font-semibold">{pipelineBoard?.summary?.bookings_count || 0}</p>
                  </div>
                </div>

                {!pipelineBoard ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border/70">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <DndContext
                    sensors={propertyKanbanSensors}
                    collisionDetection={closestCorners}
                    onDragStart={handlePropertyKanbanDragStart}
                    onDragEnd={handlePropertyKanbanDragEnd}
                  >
                    <div className="overflow-x-auto rounded-lg border border-border/70 bg-muted/10 p-3">
                      <div className="flex min-w-max gap-3 pb-2">
                        {(pipelineBoard.stages || []).map((stage) => (
                          <RentalPropertyStageColumn
                            key={stage.id}
                            stage={stage}
                            onOpenDetail={openPropertyDetail}
                            onEdit={openPropertyDialog}
                            onEditStage={openStageDialog}
                            onDeleteStage={deleteStage}
                          />
                        ))}
                      </div>
                    </div>

                    <DragOverlay>
                      {activeKanbanProperty ? (
                        <RentalPropertyKanbanCard property={activeKanbanProperty} isOverlay />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}

                <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <Button type="button" variant="outline" onClick={() => openPipelineDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo pipeline
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => deletePipeline(selectedPipeline)} disabled={!selectedPipeline || selectedPipeline.is_default}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Archivar pipeline
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Reservas</CardTitle>
                <CardDescription>De solicitud a check-out con pagos y saldo.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <CalendarViewToggle value={bookingsView} onChange={setBookingsView} />
              <Button onClick={() => openBookingDialog()} disabled={!properties.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva reserva
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Sin reservas todavía"
                  description="Importa reservas históricas o crea tu primera reserva cuando tengas una propiedad activa."
                  action={<Button variant="outline" onClick={() => navigateToRentalModule('import')}><Upload className="mr-2 h-4 w-4" />Importar reservas</Button>}
                />
              ) : bookingsView === 'calendar' ? (
                <RentalMonthCalendar
                  title="Calendario de reservas"
                  description="Visualiza entradas, noches ocupadas, salidas, pagos y saldo por día."
                  monthDate={bookingsMonth}
                  selectedDate={selectedBookingsDate}
                  onMonthChange={setBookingsMonth}
                  onSelectedDateChange={setSelectedBookingsDate}
                  events={bookingCalendarEvents}
                  renderEventChip={(event) => <BookingCalendarChip key={event.id} event={event} />}
                  renderDayDetail={(event) => (
                    <BookingCalendarDetail
                      key={event.id}
                      event={event}
                      onEdit={openBookingDialog}
                      onDelete={deleteBooking}
                      onStatusChange={updateBookingStatus}
                    />
                  )}
                  emptyMessage="No hay reservas para este día."
                />
              ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Huésped/Inquilino</TableHead>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Salida</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.source}</p>
                        </TableCell>
                        <TableCell>{booking.property?.title || propertyLookup[booking.property_id]?.title || '-'}</TableCell>
                        <TableCell>{dateOnly(booking.check_in)}</TableCell>
                        <TableCell>{dateOnly(booking.check_out)}</TableCell>
                        <TableCell><Badge variant="outline">{statusLabels[booking.status] || booking.status}</Badge></TableCell>
                        <TableCell>{currency(booking.total_amount_mxn)}</TableCell>
                        <TableCell>{currency(booking.balance_due_mxn)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {booking.status === 'confirmed' || booking.status === 'reserved' ? (
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'check-in')}>Check-in</Button>
                            ) : null}
                            {booking.status === 'checked_in' ? (
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'check-out')}>Check-out</Button>
                            ) : null}
                            <Button size="sm" variant="outline" onClick={() => openBookingDialog(booking)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteBooking(booking)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Calendario operativo</CardTitle>
                <CardDescription>Entradas, salidas, bloqueos, limpiezas, mantenimientos y tareas en una sola agenda.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <CalendarViewToggle value={calendarView} onChange={setCalendarView} />
                <Button onClick={() => openCalendarEventDialog()} disabled={!properties.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo evento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {calendarView === 'calendar' ? (
                <RentalMonthCalendar
                  title="Calendario de operación"
                  description="Cada día concentra reservas, bloqueos importados y tareas operativas."
                  monthDate={calendarMonth}
                  selectedDate={selectedCalendarDate}
                  onMonthChange={setCalendarMonth}
                  onSelectedDateChange={setSelectedCalendarDate}
                  events={operationCalendarEvents}
                  renderEventChip={(event) => <OperationCalendarChip key={event.id} event={event} />}
                  renderDayDetail={(event) => (
                    <OperationCalendarDetail
                      key={event.id}
                      event={event}
                      onEdit={openCalendarEventDialog}
                      onDelete={deleteCalendarEvent}
                    />
                  )}
                  emptyMessage="No hay eventos operativos para este día."
                />
              ) : (
                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-lg border border-border/70 p-4">
                    <div>
                      <h3 className="font-semibold">Próximas entradas</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Reservas que requieren preparación de check-in.</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(dashboard?.upcoming_check_ins || []).length === 0 ? (
                        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No hay entradas próximas.</p>
                      ) : (dashboard?.upcoming_check_ins || []).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.property?.title || '-'} · {dateOnly(booking.check_in)}</p>
                          </div>
                          <Badge>{statusLabels[booking.status] || booking.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <div>
                      <h3 className="font-semibold">Próximas salidas</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Check-outs y tareas posteriores.</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(dashboard?.upcoming_check_outs || []).length === 0 ? (
                        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No hay salidas próximas.</p>
                      ) : (dashboard?.upcoming_check_outs || []).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.property?.title || '-'} · {dateOnly(booking.check_out)}</p>
                          </div>
                          <Badge>{statusLabels[booking.status] || booking.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">Eventos operativos</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Bloqueos, limpiezas y mantenimientos creados en calendario.</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => openCalendarEventDialog()} disabled={!properties.length}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {manualCalendarEvents.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No hay eventos manuales.</p>
                      ) : manualCalendarEvents.slice(0, 8).map((event) => (
                        <div key={event.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {event.property?.title || 'Propiedad'} · {dateOnly(event.start_time)}
                              </p>
                            </div>
                            <Badge variant="outline">{operationCalendarTypeMeta[event.event_type]?.label || 'Evento'}</Badge>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => openCalendarEventDialog(event)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => deleteCalendarEvent(event)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Tareas operativas</CardTitle>
                <CardDescription>Limpieza, mantenimiento, inspecciones y entregas.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={seedDemoData} disabled={saving}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Demo
                </Button>
                <Button onClick={() => openTaskDialog()} disabled={!properties.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva tarea
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Sin tareas operativas"
                  description="Crea tareas manuales o importa limpiezas, mantenimientos e inspecciones desde tu operación actual."
                  action={<Button variant="outline" onClick={() => navigateToRentalModule('import')}><Upload className="mr-2 h-4 w-4" />Importar tareas</Button>}
                />
              ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge variant="outline">{statusLabels[task.status] || task.status}</Badge>
                        <Badge variant="secondary">{priorityLabels[task.priority] || task.priority || 'Media'}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {propertyLookup[task.property_id]?.title || task.property?.title || 'Propiedad'} · {taskTypeLabels[task.task_type] || task.task_type} · {task.due_at ? dateOnly(task.due_at) : 'Sin fecha'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Responsable: {task.staff?.name || staffLookup[task.assigned_staff_id]?.name || task.assigned_to || 'Sin asignar'} · {scheduleTypeLabels[task.schedule_type] || 'Una vez'}
                        {task.recurrence_rule ? ` · ${recurrenceLabels[task.recurrence_rule] || task.recurrence_rule}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {task.status !== 'done' && (
                        <Button size="sm" variant="outline" onClick={() => completeTask(task.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Terminar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openTaskDialog(task)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteTask(task)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Staff operativo</CardTitle>
                <CardDescription>Responsables por limpieza, mantenimiento, servicios, check-in y cierres.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={seedDemoData} disabled={saving}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Demo
                </Button>
                <Button onClick={() => openStaffDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <EmptyState
                  icon={BriefcaseBusiness}
                  title="Sin responsables cargados"
                  description="Crea staff para ligar tareas, gastos, ventas externas y cierres de caja a un responsable."
                  action={<Button onClick={() => openStaffDialog()}><Plus className="mr-2 h-4 w-4" />Crear staff</Button>}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {staff.map((member) => (
                    <Card key={member.id} className="rounded-lg border-border/70">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">{member.name}</CardTitle>
                            <CardDescription>{member.role || 'Responsable operativo'}</CardDescription>
                          </div>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {statusLabels[member.status] || member.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {(member.phone || member.email) && (
                          <div className="space-y-1 text-muted-foreground">
                            {member.phone && <p>{member.phone}</p>}
                            {member.email && <p>{member.email}</p>}
                          </div>
                        )}
                        {member.responsibilities?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {member.responsibilities.map((responsibility) => (
                              <Badge key={responsibility} variant="outline">{responsibility}</Badge>
                            ))}
                          </div>
                        )}
                        {member.notes && <p className="rounded-lg bg-muted/30 p-3 text-muted-foreground">{member.notes}</p>}
                        <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
                          <Button size="sm" variant="outline" onClick={() => openStaffDialog(member)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteStaff(member)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desactivar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">Control financiero</h3>
                <p className="mt-1 text-sm text-muted-foreground">Registra gastos, ventas externas y cierres diarios sin salir del rol Rentals.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openCashClosureDialog()}>
                  <Banknote className="mr-2 h-4 w-4" />
                  Cierre de caja
                </Button>
                <Button variant="outline" onClick={() => openExternalSaleDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Venta externa
                </Button>
                <Button onClick={() => openExpenseDialog()} disabled={!properties.length}>
                  <Receipt className="mr-2 h-4 w-4" />
                  Nuevo gasto
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={WalletCards} label="Revenue histórico" value={currency(financials?.revenue_mxn)} helper={`${currency(financials?.external_sales_mxn)} ventas externas`} />
              <StatCard icon={Receipt} label="Cobrado" value={currency(financials?.paid_mxn)} helper={`${currency(financials?.balance_due_mxn)} por cobrar`} />
              <StatCard icon={Banknote} label="Mes actual" value={currency(financials?.month?.revenue_mxn)} helper={`${financials?.month?.sales_count || 0} ventas/reservas`} />
              <StatCard icon={Home} label="Neto estimado" value={currency(financials?.net_mxn)} helper={`${currency(financials?.expenses_mxn)} en gastos`} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Gastos</CardTitle>
                  <CardDescription>Limpieza, mantenimiento, luz, insumos, comisiones y proveedores.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!financials?.expenses?.length ? (
                    <EmptyState
                      icon={Receipt}
                      title="Sin gastos registrados"
                      description="Agrega gastos manuales o usa el importador para traer histórico."
                      action={<Button variant="outline" onClick={() => navigateToRentalModule('import')}><Upload className="mr-2 h-4 w-4" />Importar finanzas</Button>}
                    />
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Propiedad</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(financials?.expenses || []).map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>
                                <p className="font-medium">{expense.description}</p>
                                <p className="text-xs text-muted-foreground">{expense.vendor || paymentMethodLabels[expense.payment_method] || expense.payment_method}</p>
                              </TableCell>
                              <TableCell>{expense.property?.title || propertyLookup[expense.property_id]?.title || '-'}</TableCell>
                              <TableCell>{dateOnly(expense.expense_date)}</TableCell>
                              <TableCell><Badge variant="outline">{expenseCategoryLabels[expense.category] || expense.category}</Badge></TableCell>
                              <TableCell>{expense.staff?.name || staffLookup[expense.staff_id]?.name || '-'}</TableCell>
                              <TableCell className="text-right font-semibold">{currency(expense.amount_mxn)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openExpenseDialog(expense)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteExpense(expense)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Mes actual</CardTitle>
                    <CardDescription>Ventas, gasto por categoría y utilidad.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground">Reservas</p>
                        <p className="mt-1 text-lg font-semibold">{currency(financials?.month?.booking_revenue_mxn)}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground">Ventas externas</p>
                        <p className="mt-1 text-lg font-semibold">{currency(financials?.month?.external_sales_mxn)}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground">Gastos</p>
                        <p className="mt-1 text-lg font-semibold">{currency(financials?.month?.expenses_mxn)}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground">Ticket prom.</p>
                        <p className="mt-1 text-lg font-semibold">{currency(financials?.month?.ticket_average_mxn)}</p>
                      </div>
                    </div>
                    {Object.entries(financials?.month?.expense_categories || {}).length > 0 && (
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">Gasto por categoría</p>
                        <div className="mt-3 space-y-2">
                          {Object.entries(financials?.month?.expense_categories || {}).map(([category, amount]) => (
                            <div key={category} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{expenseCategoryLabels[category] || category}</span>
                              <span className="font-medium">{currency(amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader>
                    <CardTitle>Rentabilidad por propiedad</CardTitle>
                    <CardDescription>Ingresos menos gastos acumulados.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(financials?.month?.property_profitability || []).length === 0 ? (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sin movimientos por propiedad.</p>
                    ) : (financials?.month?.property_profitability || []).slice(0, 6).map((item) => (
                      <div key={item.property_id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{item.property_title || 'Propiedad'}</p>
                          <Badge variant={item.net_mxn >= 0 ? 'default' : 'destructive'}>{currency(item.net_mxn)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Ingresos {currency(item.revenue_mxn)} · Gastos {currency(item.expenses_mxn)}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Ventas externas</CardTitle>
                  <CardDescription>Late check-out, tours, extras, limpieza extra y servicios vendidos fuera de reserva.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(financials?.external_sales || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aún no hay ventas externas.</p>
                  ) : (
                    <div className="space-y-3">
                      {(financials?.external_sales || []).map((sale) => (
                        <div key={sale.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{sale.concept}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {sale.property?.title || propertyLookup[sale.property_id]?.title || 'Sin propiedad'} · {sale.guest_name || 'Sin huésped'} · {dateOnly(sale.sale_date)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">Responsable: {sale.staff?.name || staffLookup[sale.staff_id]?.name || '-'}</p>
                            </div>
                            <Badge>{currency(sale.amount_mxn)}</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openExternalSaleDialog(sale)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteExternalSale(sale)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle>Cierres de caja</CardTitle>
                  <CardDescription>Snapshot diario de cobros, ventas externas, gastos pagados y neto.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(financials?.cash_closures || []).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Crea tu primer cierre para congelar el resumen del día.</p>
                  ) : (
                    <div className="space-y-3">
                      {(financials?.cash_closures || []).map((closure) => (
                        <div key={closure.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{dateOnly(closure.closure_date)}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Responsable: {closure.staff?.name || staffLookup[closure.responsible_staff_id]?.name || 'Sin responsable'}
                              </p>
                            </div>
                            <Badge variant={closure.net_mxn >= 0 ? 'default' : 'destructive'}>{currency(closure.net_mxn)}</Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>Cobros {currency(closure.bookings_collected_mxn)}</span>
                            <span>Extras {currency(closure.external_sales_mxn)}</span>
                            <span>Gastos {currency(closure.expenses_paid_mxn)}</span>
                            <span>Por cobrar {currency(closure.balance_due_mxn)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openCashClosureDialog(closure)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteCashClosure(closure)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Zap} label="Canales demo" value={integrations?.summary?.channels_total || 0} helper="Airbnb, Booking, Vrbo y más" />
              <StatCard icon={CheckCircle2} label="Conectados" value={integrations?.summary?.connected || 0} helper={`${integrations?.summary?.pending || 0} pendientes`} />
              <StatCard icon={CalendarDays} label="Reservas sincronizadas" value={integrations?.summary?.bookings_imported || 0} helper={`${integrations?.summary?.calendar_blocks || 0} bloqueos`} />
              <StatCard icon={WalletCards} label="Payouts demo" value={integrations?.summary?.payouts_reconciled || 0} helper="Conciliación simulada" />
            </div>

            <Card className="rounded-lg border-border/70">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Channel manager demo</CardTitle>
                  <CardDescription>Mockups de integración para validar experiencia antes de conectar APIs reales.</CardDescription>
                </div>
                <Badge variant="outline">Modo demo · sin credenciales reales</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-2">
                  {(integrations?.channels || []).map((channel) => {
                    const connected = channel.status === 'connected';
                    const syncLoading = integrationAction === `${channel.provider}:sync`;
                    const connectLoading = integrationAction === `${channel.provider}:connect`;
                    const disconnectLoading = integrationAction === `${channel.provider}:disconnect`;
                    const metrics = channel.metrics || {};
                    return (
                      <Card key={channel.provider} className="rounded-lg border-border/70">
                        <CardHeader>
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                              {channel.logo_text}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-lg">{channel.name}</CardTitle>
                                <Badge variant={connected ? 'default' : 'secondary'}>{integrationStatusLabels[channel.status] || channel.status}</Badge>
                              </div>
                              <CardDescription className="mt-1">{channel.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {(channel.capabilities || []).map((capability) => (
                              <Badge key={capability} variant="outline">{capability}</Badge>
                            ))}
                          </div>

                          <div className="grid gap-3 text-sm sm:grid-cols-3">
                            <div className="rounded-lg border p-3">
                              <p className="text-muted-foreground">Propiedades</p>
                              <p className="mt-1 font-semibold">{metrics.properties_mapped || 0}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-muted-foreground">Reservas</p>
                              <p className="mt-1 font-semibold">{metrics.bookings_imported || 0}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-muted-foreground">Bloqueos</p>
                              <p className="mt-1 font-semibold">{metrics.calendar_blocks || 0}</p>
                            </div>
                          </div>

                          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-medium">Estado técnico</span>
                              <Badge variant="outline">{integrationHealthLabels[channel.health] || channel.health}</Badge>
                            </div>
                            <p className="mt-2 text-muted-foreground">{channel.demo_notes}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Última sync: {channel.last_sync_at ? dateOnly(channel.last_sync_at) : 'Aún sin sincronizar'} · Webhook: {channel.webhook_status || 'mock_ready'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {(channel.setup_checklist || []).map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-sm">
                                {item.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                                <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
                            {!connected ? (
                              <Button type="button" variant="outline" onClick={() => connectDemoIntegration(channel.provider)} disabled={Boolean(integrationAction)}>
                                {connectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                Conectar demo
                              </Button>
                            ) : (
                              <Button type="button" variant="outline" onClick={() => disconnectDemoIntegration(channel.provider)} disabled={Boolean(integrationAction)}>
                                {disconnectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Desconectar
                              </Button>
                            )}
                            <Button type="button" onClick={() => syncDemoIntegration(channel.provider)} disabled={Boolean(integrationAction)}>
                              {syncLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                              Sincronizar demo
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import">
          <RentalsImportWizard api={api} onImported={loadData} />
        </TabsContent>
      </Tabs>
    </div>

      <Dialog open={propertyDialogOpen} onOpenChange={(open) => {
        setPropertyDialogOpen(open);
        if (!open) setEditingPropertyId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPropertyId ? 'Editar propiedad de renta' : 'Nueva propiedad de renta'}</DialogTitle>
            <DialogDescription>{editingPropertyId ? 'Actualiza inventario, fotos, tarifas y amenidades.' : 'Registra una unidad para renta corta, media o larga estancia.'}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveProperty}>
            <div className="md:col-span-2">
              <Label>Nombre</Label>
              <Input required value={propertyForm.title} onChange={(event) => updatePropertyForm('title', event.target.value)} />
            </div>
            <div>
              <Label>Tipo de operación</Label>
              <Select value={propertyForm.operation_type} onValueChange={(value) => updatePropertyForm('operation_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Renta</SelectItem>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="both">Venta y renta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de renta</Label>
              <Select value={propertyForm.rental_type} onValueChange={(value) => updatePropertyForm('rental_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">Corta estancia</SelectItem>
                  <SelectItem value="mid_term">Media estancia</SelectItem>
                  <SelectItem value="long_term">Larga estancia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zona</Label>
              <Input value={propertyForm.zone} onChange={(event) => updatePropertyForm('zone', event.target.value)} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={propertyForm.address} onChange={(event) => updatePropertyForm('address', event.target.value)} />
            </div>
            <div>
              <Label>Recámaras</Label>
              <Input type="number" min="0" value={propertyForm.bedrooms} onChange={(event) => updatePropertyForm('bedrooms', event.target.value)} />
            </div>
            <div>
              <Label>Baños</Label>
              <Input type="number" min="0" step="0.5" value={propertyForm.bathrooms} onChange={(event) => updatePropertyForm('bathrooms', event.target.value)} />
            </div>
            <div>
              <Label>Máx. huéspedes</Label>
              <Input type="number" min="1" value={propertyForm.max_guests} onChange={(event) => updatePropertyForm('max_guests', event.target.value)} />
            </div>
            <div>
              <Label>Precio por noche</Label>
              <Input type="number" min="0" value={propertyForm.nightly_price_mxn} onChange={(event) => updatePropertyForm('nightly_price_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Precio mensual</Label>
              <Input type="number" min="0" value={propertyForm.monthly_price_mxn} onChange={(event) => updatePropertyForm('monthly_price_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Limpieza</Label>
              <Input type="number" min="0" value={propertyForm.cleaning_fee_mxn} onChange={(event) => updatePropertyForm('cleaning_fee_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Depósito</Label>
              <Input type="number" min="0" value={propertyForm.deposit_mxn} onChange={(event) => updatePropertyForm('deposit_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Comisión</Label>
              <Input type="number" min="0" max="1" step="0.01" value={propertyForm.commission_rate} onChange={(event) => updatePropertyForm('commission_rate', event.target.value)} />
            </div>
            <div>
              <Label>Canales</Label>
              <Input value={propertyForm.platforms} onChange={(event) => updatePropertyForm('platforms', event.target.value)} placeholder="Airbnb, VRBO, Directo" />
            </div>
            <div className="md:col-span-2">
              <Label>Amenidades</Label>
              <Input value={propertyForm.amenities} onChange={(event) => updatePropertyForm('amenities', event.target.value)} placeholder="Alberca, WiFi, estacionamiento" />
            </div>
            <div className="md:col-span-2 space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Imágenes de la propiedad</h3>
                  <p className="text-sm text-muted-foreground">Usa el mismo flujo visual de propiedades: portada, secundarias y previsualización.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border/70 px-3 py-2 text-sm font-medium hover:bg-muted/40">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Agregar imágenes
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePropertyImageSelection} />
                </label>
              </div>

              {(propertyForm.images || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  Aún no has agregado imágenes.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {(propertyForm.images || []).map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-lg border border-border/70 bg-card">
                      <div className="relative aspect-[4/3] bg-muted">
                        <img src={image.url} alt={image.alt || propertyForm.title} className="h-full w-full object-cover" />
                        <div className="absolute right-2 top-2 flex gap-2">
                          <Button type="button" size="icon" variant="secondary" className="h-8 w-8" onClick={() => setPropertyCoverImage(image.id)}>
                            <Star className={`h-4 w-4 ${image.is_cover ? 'fill-current text-amber-300' : ''}`} />
                          </Button>
                          <Button type="button" size="icon" variant="destructive" className="h-8 w-8" onClick={() => removePropertyImage(image.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 p-3">
                        <p className="truncate text-sm font-medium">{image.filename || 'Imagen'}</p>
                        <Badge variant={image.is_cover ? 'default' : 'secondary'}>
                          {image.is_cover ? 'Portada' : 'Secundaria'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={propertyForm.notes} onChange={(event) => updatePropertyForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setPropertyDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingPropertyId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pipelineDialogOpen} onOpenChange={(open) => {
        setPipelineDialogOpen(open);
        if (!open) setEditingPipelineId(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPipelineId ? 'Editar pipeline' : 'Nuevo pipeline'}</DialogTitle>
            <DialogDescription>Define el flujo operativo para reservas, administración o futuros procesos de rentas.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={savePipeline}>
            <div className="md:col-span-2">
              <Label>Nombre</Label>
              <Input required value={pipelineForm.name} onChange={(event) => updatePipelineForm('name', event.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={pipelineForm.entity_type} onValueChange={(value) => updatePipelineForm('entity_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking">Reservas</SelectItem>
                  <SelectItem value="property">Propiedades</SelectItem>
                  <SelectItem value="operations">Operación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estatus</Label>
              <Select value={pipelineForm.status} onValueChange={(value) => updatePipelineForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border/70 p-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(pipelineForm.is_default)}
                onChange={(event) => updatePipelineForm('is_default', event.target.checked)}
              />
              Usar como pipeline principal para reservas
            </label>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={3} value={pipelineForm.description} onChange={(event) => updatePipelineForm('description', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setPipelineDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingPipelineId ? 'Actualizar' : 'Crear pipeline'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={stageDialogOpen} onOpenChange={(open) => {
        setStageDialogOpen(open);
        if (!open) setEditingStageId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStageId ? 'Editar stage' : 'Nuevo stage'}</DialogTitle>
            <DialogDescription>Mapea cada stage con un estado de reserva para alimentar el tablero automáticamente.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveStage}>
            <div>
              <Label>Nombre</Label>
              <Input required value={stageForm.name} onChange={(event) => updateStageForm('name', event.target.value)} />
            </div>
            <div>
              <Label>Estado de reserva ligado</Label>
              <Select value={optionalSelectValue(stageForm.booking_status)} onValueChange={(value) => updateStageForm('booking_status', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin estado automático</SelectItem>
                  {bookingStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{statusLabels[status] || status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <Input type="color" className="h-10 w-14 p-1" value={stageForm.color} onChange={(event) => updateStageForm('color', event.target.value)} />
                <Input value={stageForm.color} onChange={(event) => updateStageForm('color', event.target.value)} />
              </div>
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" min="0" value={stageForm.sort_order} onChange={(event) => updateStageForm('sort_order', event.target.value)} />
            </div>
            <div>
              <Label>Probabilidad / avance %</Label>
              <Input type="number" min="0" max="100" value={stageForm.probability} onChange={(event) => updateStageForm('probability', event.target.value)} />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border/70 p-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(stageForm.is_closing_stage)}
                onChange={(event) => updateStageForm('is_closing_stage', event.target.checked)}
              />
              Stage de cierre
            </label>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={3} value={stageForm.description} onChange={(event) => updateStageForm('description', event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Acción sugerida / automatización</Label>
              <Textarea rows={3} value={stageForm.automation_notes} onChange={(event) => updateStageForm('automation_notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setStageDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingStageId ? 'Actualizar' : 'Crear stage'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={propertyDetailOpen} onOpenChange={setPropertyDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPropertyDetail?.property?.title || 'Detalle de propiedad'}</DialogTitle>
            <DialogDescription>Amenidades, métricas, operación ligada y análisis IA para optimizar renta.</DialogDescription>
          </DialogHeader>
          {!selectedPropertyDetail ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="overflow-hidden rounded-lg border border-border/70">
                  {((selectedPropertyDetail.property.images || []).find((image) => image.is_cover) || selectedPropertyDetail.property.images?.[0])?.url ? (
                    <img
                      src={((selectedPropertyDetail.property.images || []).find((image) => image.is_cover) || selectedPropertyDetail.property.images?.[0]).url}
                      alt={selectedPropertyDetail.property.title}
                      className="h-full max-h-[420px] min-h-[280px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex min-h-[280px] items-center justify-center bg-muted/30 text-muted-foreground">
                      <Home className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <Card className="rounded-lg border-border/70">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle>{selectedPropertyDetail.property.title}</CardTitle>
                          <CardDescription>{selectedPropertyDetail.property.address || selectedPropertyDetail.property.zone || 'Sin dirección'}</CardDescription>
                        </div>
                        <Badge variant="outline">{statusLabels[selectedPropertyDetail.property.status] || selectedPropertyDetail.property.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                      <div><p className="text-muted-foreground">Noche</p><p className="font-semibold">{currency(selectedPropertyDetail.property.nightly_price_mxn)}</p></div>
                      <div><p className="text-muted-foreground">Mes</p><p className="font-semibold">{currency(selectedPropertyDetail.property.monthly_price_mxn)}</p></div>
                      <div><p className="text-muted-foreground">Capacidad</p><p className="font-semibold">{selectedPropertyDetail.property.bedrooms} rec · {selectedPropertyDetail.property.bathrooms} baños · {selectedPropertyDetail.property.max_guests} pax</p></div>
                      <div><p className="text-muted-foreground">Comisión</p><p className="font-semibold">{Math.round((selectedPropertyDetail.property.commission_rate || 0) * 100)}%</p></div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg border-border/70">
                    <CardHeader>
                      <CardTitle className="text-base">Amenidades y canales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(selectedPropertyDetail.property.amenities || []).length === 0 ? (
                          <Badge variant="outline">Sin amenidades</Badge>
                        ) : selectedPropertyDetail.property.amenities.map((amenity) => (
                          <Badge key={amenity} variant="outline">{amenity}</Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedPropertyDetail.property.platforms || []).length === 0 ? (
                          <Badge variant="secondary">Sin canales</Badge>
                        ) : selectedPropertyDetail.property.platforms.map((platform) => (
                          <Badge key={platform} variant="secondary">{platform}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={CalendarDays} label="Reservas" value={selectedPropertyDetail.stats?.bookings_count || 0} helper={`${selectedPropertyDetail.stats?.nights_booked || 0} noches`} />
                <StatCard icon={WalletCards} label="Ingresos" value={currency(selectedPropertyDetail.stats?.revenue_mxn)} helper={`${currency(selectedPropertyDetail.stats?.paid_mxn)} cobrado`} />
                <StatCard icon={Receipt} label="Gastos" value={currency(selectedPropertyDetail.stats?.expenses_mxn)} />
                <StatCard icon={Sparkles} label="Neto" value={currency(selectedPropertyDetail.stats?.net_mxn)} />
              </div>

              <Card className="rounded-lg border-border/70">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Análisis IA de optimización</CardTitle>
                    <CardDescription>Recomendaciones heurísticas sobre tarifa, contenido, amenidades y operación.</CardDescription>
                  </div>
                  <Button type="button" onClick={runPropertyAiAnalysis} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    Analizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {!propertyAiAnalysis ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Ejecuta el análisis para recibir acciones de mejora de precio, amenities, fotos y operación.</p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Score de oportunidad</p>
                        <p className="mt-2 text-4xl font-semibold">{propertyAiAnalysis.score || 0}/100</p>
                        <p className="mt-3 text-sm text-muted-foreground">{propertyAiAnalysis.summary}</p>
                      </div>
                      <div className="space-y-3">
                        {propertyAiAnalysis.suggested_nightly_price_mxn > 0 && (
                          <div className="rounded-lg border p-3 text-sm">
                            <p className="font-medium">Tarifa sugerida por noche</p>
                            <p className="mt-1 text-muted-foreground">{currency(propertyAiAnalysis.suggested_nightly_price_mxn)}</p>
                          </div>
                        )}
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border p-3">
                            <p className="text-sm font-medium">Recomendaciones</p>
                            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                              {(propertyAiAnalysis.recommendations || []).map((item) => <li key={item}>- {item}</li>)}
                            </ul>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-sm font-medium">Riesgos y faltantes</p>
                            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                              {[...(propertyAiAnalysis.risk_flags || []), ...(propertyAiAnalysis.missing_amenities || []).map((item) => `Falta amenidad: ${item}`)].map((item) => <li key={item}>- {item}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card className="rounded-lg border-border/70">
                  <CardHeader><CardTitle className="text-base">Reservas recientes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(selectedPropertyDetail.bookings || []).slice(0, 5).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin reservas.</p>
                    ) : selectedPropertyDetail.bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{booking.guest_name}</p>
                        <p className="text-muted-foreground">{dateOnly(booking.check_in)} - {dateOnly(booking.check_out)} · {currency(booking.total_amount_mxn)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="rounded-lg border-border/70">
                  <CardHeader><CardTitle className="text-base">Tareas ligadas</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(selectedPropertyDetail.tasks || []).slice(0, 5).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin tareas.</p>
                    ) : selectedPropertyDetail.tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-muted-foreground">{taskTypeLabels[task.task_type] || task.task_type} · {statusLabels[task.status] || task.status}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="rounded-lg border-border/70">
                  <CardHeader><CardTitle className="text-base">Finanzas ligadas</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(selectedPropertyDetail.expenses || []).slice(0, 3).map((expense) => (
                      <div key={expense.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-muted-foreground">Gasto · {currency(expense.amount_mxn)}</p>
                      </div>
                    ))}
                    {(selectedPropertyDetail.external_sales || []).slice(0, 3).map((sale) => (
                      <div key={sale.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{sale.concept}</p>
                        <p className="text-muted-foreground">Venta externa · {currency(sale.amount_mxn)}</p>
                      </div>
                    ))}
                    {(selectedPropertyDetail.expenses || []).length === 0 && (selectedPropertyDetail.external_sales || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">Sin movimientos financieros.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={bookingDialogOpen} onOpenChange={(open) => {
        setBookingDialogOpen(open);
        if (!open) setEditingBookingId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBookingId ? 'Editar reserva' : 'Nueva reserva'}</DialogTitle>
            <DialogDescription>{editingBookingId ? 'Actualiza fechas, huésped, estado y pagos.' : 'Convierte una solicitud en reserva y controla pagos.'}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveBooking}>
            <div className="md:col-span-2">
              <Label>Propiedad</Label>
              <Select value={bookingForm.property_id} onValueChange={(value) => updateBookingForm('property_id', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona propiedad" /></SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Huésped/Inquilino</Label>
              <Input required value={bookingForm.guest_name} onChange={(event) => updateBookingForm('guest_name', event.target.value)} />
            </div>
            <div>
              <Label>Fuente</Label>
              <Input value={bookingForm.source} onChange={(event) => updateBookingForm('source', event.target.value)} placeholder="Airbnb, Booking, Directo" />
            </div>
            <div>
              <Label>Entrada</Label>
              <Input required type="date" value={toDateInput(bookingForm.check_in)} onChange={(event) => updateBookingForm('check_in', event.target.value)} />
            </div>
            <div>
              <Label>Salida</Label>
              <Input required type="date" value={toDateInput(bookingForm.check_out)} onChange={(event) => updateBookingForm('check_out', event.target.value)} />
            </div>
            <div>
              <Label>Personas</Label>
              <Input type="number" min="1" value={bookingForm.guests_count} onChange={(event) => updateBookingForm('guests_count', event.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={bookingForm.status} onValueChange={(value) => updateBookingForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">Solicitud</SelectItem>
                  <SelectItem value="reserved">Reservada</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="checked_in">En estancia</SelectItem>
                  <SelectItem value="checked_out">Checkout</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total</Label>
              <Input type="number" min="0" value={bookingForm.total_amount_mxn} onChange={(event) => updateBookingForm('total_amount_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Pagado</Label>
              <Input type="number" min="0" value={bookingForm.paid_amount_mxn} onChange={(event) => updateBookingForm('paid_amount_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Limpieza</Label>
              <Input type="number" min="0" value={bookingForm.cleaning_fee_mxn} onChange={(event) => updateBookingForm('cleaning_fee_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Depósito</Label>
              <Input type="number" min="0" value={bookingForm.deposit_mxn} onChange={(event) => updateBookingForm('deposit_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Comisión plataforma</Label>
              <Input type="number" min="0" value={bookingForm.platform_fee_mxn} onChange={(event) => updateBookingForm('platform_fee_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={bookingForm.guest_email} onChange={(event) => updateBookingForm('guest_email', event.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={bookingForm.guest_phone} onChange={(event) => updateBookingForm('guest_phone', event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={bookingForm.notes} onChange={(event) => updateBookingForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingBookingId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={calendarEventDialogOpen} onOpenChange={(open) => {
        setCalendarEventDialogOpen(open);
        if (!open) setEditingCalendarEventId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCalendarEventId ? 'Editar evento operativo' : 'Nuevo evento operativo'}</DialogTitle>
            <DialogDescription>
              {editingCalendarEventId ? 'Actualiza bloqueos, mantenimientos o notas del calendario.' : 'Crea bloqueos, mantenimientos, limpiezas o recordatorios para una propiedad.'}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveCalendarEvent}>
            <div className="md:col-span-2">
              <Label>Propiedad</Label>
              <Select value={calendarEventForm.property_id} onValueChange={(value) => updateCalendarEventForm('property_id', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona propiedad" /></SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Título</Label>
              <Input value={calendarEventForm.title} onChange={(event) => updateCalendarEventForm('title', event.target.value)} placeholder="Ej. Bloqueo propietario / mantenimiento alberca" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={calendarEventForm.event_type} onValueChange={(value) => updateCalendarEventForm('event_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocked">Bloqueo</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                  <SelectItem value="task">Tarea</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={calendarEventForm.status} onValueChange={(value) => updateCalendarEventForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="done">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inicio</Label>
              <Input required type="datetime-local" value={calendarEventForm.start_date} onChange={(event) => updateCalendarEventForm('start_date', event.target.value)} />
            </div>
            <div>
              <Label>Fin</Label>
              <Input required type="datetime-local" value={calendarEventForm.end_date} onChange={(event) => updateCalendarEventForm('end_date', event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Origen</Label>
              <Input value={calendarEventForm.source} onChange={(event) => updateCalendarEventForm('source', event.target.value)} placeholder="manual, owner, mantenimiento, canal" />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={calendarEventForm.notes} onChange={(event) => updateCalendarEventForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setCalendarEventDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingCalendarEventId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={staffDialogOpen} onOpenChange={(open) => {
        setStaffDialogOpen(open);
        if (!open) setEditingStaffId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaffId ? 'Editar staff' : 'Nuevo staff'}</DialogTitle>
            <DialogDescription>Identifica responsables y especialidades para ligar tareas, gastos y cierres.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveStaff}>
            <div>
              <Label>Nombre</Label>
              <Input required value={staffForm.name} onChange={(event) => updateStaffForm('name', event.target.value)} />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input value={staffForm.role} onChange={(event) => updateStaffForm('role', event.target.value)} placeholder="Limpieza, mantenimiento, administración" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={staffForm.phone} onChange={(event) => updateStaffForm('phone', event.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={staffForm.email} onChange={(event) => updateStaffForm('email', event.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={staffForm.status} onValueChange={(value) => updateStaffForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Especialidades</Label>
              <Input value={staffForm.specialties} onChange={(event) => updateStaffForm('specialties', event.target.value)} placeholder="cleaning, maintenance, finance" />
            </div>
            <div className="md:col-span-2">
              <Label>Responsabilidades</Label>
              <Input value={staffForm.responsibilities} onChange={(event) => updateStaffForm('responsibilities', event.target.value)} placeholder="Limpieza checkout, pagar luz, reparación AC" />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={staffForm.notes} onChange={(event) => updateStaffForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setStaffDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingStaffId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
        setExpenseDialogOpen(open);
        if (!open) setEditingExpenseId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpenseId ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
            <DialogDescription>Registra pagos de limpieza, servicios, mantenimiento, insumos o proveedores.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveExpense}>
            <div className="md:col-span-2">
              <Label>Propiedad</Label>
              <Select value={expenseForm.property_id} onValueChange={(value) => updateExpenseForm('property_id', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona propiedad" /></SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Input required value={expenseForm.description} onChange={(event) => updateExpenseForm('description', event.target.value)} placeholder="Pago de luz, limpieza checkout, reparación..." />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={expenseForm.category} onValueChange={(value) => updateExpenseForm('category', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" min="0" step="0.01" value={expenseForm.amount_mxn} onChange={(event) => updateExpenseForm('amount_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={expenseForm.expense_date} onChange={(event) => updateExpenseForm('expense_date', event.target.value)} />
            </div>
            <div>
              <Label>Responsable</Label>
              <Select value={optionalSelectValue(expenseForm.staff_id)} onValueChange={(value) => updateExpenseForm('staff_id', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin responsable</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proveedor</Label>
              <Input value={expenseForm.vendor} onChange={(event) => updateExpenseForm('vendor', event.target.value)} />
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={expenseForm.payment_method} onValueChange={(value) => updateExpenseForm('payment_method', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={expenseForm.status} onValueChange={(value) => updateExpenseForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>URL recibo</Label>
              <Input value={expenseForm.receipt_url} onChange={(event) => updateExpenseForm('receipt_url', event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={expenseForm.notes} onChange={(event) => updateExpenseForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingExpenseId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={externalSaleDialogOpen} onOpenChange={(open) => {
        setExternalSaleDialogOpen(open);
        if (!open) setEditingExternalSaleId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExternalSaleId ? 'Editar venta externa' : 'Nueva venta externa'}</DialogTitle>
            <DialogDescription>Registra extras como late check-out, tours, transporte, amenidades o servicios.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveExternalSale}>
            <div className="md:col-span-2">
              <Label>Concepto</Label>
              <Input required value={externalSaleForm.concept} onChange={(event) => updateExternalSaleForm('concept', event.target.value)} placeholder="Late check-out, tour, limpieza extra..." />
            </div>
            <div>
              <Label>Propiedad</Label>
              <Select value={optionalSelectValue(externalSaleForm.property_id)} onValueChange={(value) => updateExternalSaleForm('property_id', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin propiedad</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reserva</Label>
              <Select value={optionalSelectValue(externalSaleForm.booking_id)} onValueChange={(value) => updateExternalSaleForm('booking_id', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin reserva</SelectItem>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>{booking.guest_name} · {propertyLookup[booking.property_id]?.title || 'Propiedad'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Huésped</Label>
              <Input value={externalSaleForm.guest_name} onChange={(event) => updateExternalSaleForm('guest_name', event.target.value)} />
            </div>
            <div>
              <Label>Responsable</Label>
              <Select value={optionalSelectValue(externalSaleForm.staff_id)} onValueChange={(value) => updateExternalSaleForm('staff_id', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin responsable</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" min="0" step="0.01" value={externalSaleForm.amount_mxn} onChange={(event) => updateExternalSaleForm('amount_mxn', event.target.value)} />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={externalSaleForm.sale_date} onChange={(event) => updateExternalSaleForm('sale_date', event.target.value)} />
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={externalSaleForm.payment_method} onValueChange={(value) => updateExternalSaleForm('payment_method', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={externalSaleForm.status} onValueChange={(value) => updateExternalSaleForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="collected">Cobrado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Origen</Label>
              <Input value={externalSaleForm.source} onChange={(event) => updateExternalSaleForm('source', event.target.value)} placeholder="manual, Airbnb, guest, concierge" />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={externalSaleForm.notes} onChange={(event) => updateExternalSaleForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setExternalSaleDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingExternalSaleId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cashClosureDialogOpen} onOpenChange={(open) => {
        setCashClosureDialogOpen(open);
        if (!open) setEditingCashClosureId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCashClosureId ? 'Editar cierre de caja' : 'Nuevo cierre de caja'}</DialogTitle>
            <DialogDescription>El cierre crea un snapshot diario de cobros, extras, gastos y neto.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveCashClosure}>
            <div>
              <Label>Fecha de cierre</Label>
              <Input type="date" value={cashClosureForm.closure_date} onChange={(event) => updateCashClosureForm('closure_date', event.target.value)} disabled={Boolean(editingCashClosureId)} />
            </div>
            <div>
              <Label>Responsable</Label>
              <Select value={optionalSelectValue(cashClosureForm.responsible_staff_id)} onValueChange={(value) => updateCashClosureForm('responsible_staff_id', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin responsable</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingCashClosureId && (
              <div>
                <Label>Estado</Label>
                <Select value={cashClosureForm.status || 'closed'} onValueChange={(value) => updateCashClosureForm('status', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Cerrado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Notas</Label>
              <Textarea rows={3} value={cashClosureForm.notes} onChange={(event) => updateCashClosureForm('notes', event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCashClosureDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingCashClosureId ? 'Actualizar' : 'Crear cierre'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={(open) => {
        setTaskDialogOpen(open);
        if (!open) setEditingTaskId(null);
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTaskId ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
            <DialogDescription>Crea pendientes de limpieza, mantenimiento, pagos, inspecciones o tareas periódicas.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveTask}>
            <div className="md:col-span-2">
              <Label>Propiedad</Label>
              <Select value={taskForm.property_id} onValueChange={(value) => updateTaskForm('property_id', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona propiedad" /></SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Título</Label>
              <Input required value={taskForm.title} onChange={(event) => updateTaskForm('title', event.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={taskForm.task_type} onValueChange={(value) => updateTaskForm('task_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                  <SelectItem value="check_in">Check-in</SelectItem>
                  <SelectItem value="check_out">Check-out</SelectItem>
                  <SelectItem value="utilities">Servicios</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={taskForm.priority} onValueChange={(value) => updateTaskForm('priority', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsable</Label>
              <Select
                value={optionalSelectValue(taskForm.assigned_staff_id)}
                onValueChange={(value) => {
                  const staffId = optionalSelectChange(value);
                  setTaskForm((current) => ({
                    ...current,
                    assigned_staff_id: staffId,
                    assigned_to: staffId ? staffLookup[staffId]?.name || current.assigned_to : '',
                  }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin responsable</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asignado a texto</Label>
              <Input value={taskForm.assigned_to} onChange={(event) => updateTaskForm('assigned_to', event.target.value)} placeholder="Nombre libre si no está en staff" />
            </div>
            <div>
              <Label>Reserva ligada</Label>
              <Select value={optionalSelectValue(taskForm.booking_id)} onValueChange={(value) => updateTaskForm('booking_id', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin reserva</SelectItem>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>{booking.guest_name} · {propertyLookup[booking.property_id]?.title || 'Propiedad'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha límite</Label>
              <Input type="datetime-local" value={taskForm.due_at} onChange={(event) => updateTaskForm('due_at', event.target.value)} />
            </div>
            <div>
              <Label>Programación</Label>
              <Select value={taskForm.schedule_type} onValueChange={(value) => updateTaskForm('schedule_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(scheduleTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recurrencia / evento</Label>
              <Select value={optionalSelectValue(taskForm.recurrence_rule)} onValueChange={(value) => updateTaskForm('recurrence_rule', optionalSelectChange(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin recurrencia</SelectItem>
                  {Object.entries(recurrenceLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Siguiente ejecución</Label>
              <Input type="datetime-local" value={taskForm.next_due_at} onChange={(event) => updateTaskForm('next_due_at', event.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={taskForm.status} onValueChange={(value) => updateTaskForm('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En proceso</SelectItem>
                  <SelectItem value="done">Terminada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={taskForm.notes} onChange={(event) => updateTaskForm('notes', event.target.value)} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingTaskId ? 'Actualizar' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

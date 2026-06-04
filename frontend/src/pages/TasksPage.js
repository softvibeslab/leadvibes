import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  GripVertical,
  Link2,
  ListChecks,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

const STATUSES = [
  { value: 'pendiente', label: 'Pendiente', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { value: 'en_progreso', label: 'En progreso', color: 'border-cyan-300 bg-cyan-50 text-cyan-700' },
  { value: 'en_espera', label: 'En espera', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'completada', label: 'Completada', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'cancelada', label: 'Cancelada', color: 'border-rose-300 bg-rose-50 text-rose-700' },
];

const PRIORITIES = [
  { value: 'baja', label: 'Baja', className: 'bg-slate-100 text-slate-700' },
  { value: 'media', label: 'Media', className: 'bg-blue-100 text-blue-700' },
  { value: 'alta', label: 'Alta', className: 'bg-orange-100 text-orange-700' },
  { value: 'urgente', label: 'Urgente', className: 'bg-red-100 text-red-700' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pendiente',
  priority: 'media',
  due_date: '',
  assigned_to: '',
  lead_id: '',
  tags: '',
  checklist_text: '',
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const isOverdue = (task) => {
  if (!task?.due_date || ['completada', 'cancelada'].includes(task.status)) return false;
  const due = new Date(task.due_date);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const priorityMeta = (priority) => PRIORITIES.find((item) => item.value === priority) || PRIORITIES[1];
const statusMeta = (status) => STATUSES.find((item) => item.value === status) || STATUSES[0];

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const fromDateInput = (value) => {
  if (!value) return null;
  return new Date(`${value}T12:00:00.000Z`).toISOString();
};

const initials = (name) => String(name || 'U')
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

const DroppableColumn = ({ status, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[540px] flex-col rounded-lg border bg-muted/20 ${isOver ? 'ring-2 ring-primary/40' : ''}`}
    >
      {children}
    </div>
  );
};

const TaskCard = ({ task, onOpen, dragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const completedItems = (task.checklist || []).filter((item) => item.completed).length;
  const totalItems = (task.checklist || []).length;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={() => onOpen(task)}
      className={`w-full rounded-lg border bg-card p-3 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md ${
        isDragging || dragging ? 'opacity-60' : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{task.title}</p>
          {task.lead?.name && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {task.lead.name}
            </p>
          )}
        </div>
        <span
          {...attributes}
          {...listeners}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Mover tarea"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      {task.description && (
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={priorityMeta(task.priority).className}>{priorityMeta(task.priority).label}</Badge>
        <Badge variant={isOverdue(task) ? 'destructive' : 'secondary'} className="gap-1">
          <CalendarDays className="h-3 w-3" />
          {formatDate(task.due_date)}
        </Badge>
        {totalItems > 0 && (
          <Badge variant="outline" className="gap-1">
            <ListChecks className="h-3 w-3" />
            {completedItems}/{totalItems}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <UserCircle className="h-3.5 w-3.5" />
          {task.assigned_user?.name || 'Sin responsable'}
        </span>
        {(task.comments || []).length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {task.comments.length}
          </span>
        )}
      </div>
    </button>
  );
};

const Metric = ({ label, value, icon: Icon }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
      <div className="rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);

export const TasksPage = () => {
  const { api, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({});
  const [brokers, setBrokers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [activeTask, setActiveTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [comment, setComment] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeWorkspaceRole = user?.active_workspace?.role || user?.role || 'broker';
  const canSeeTeam = ['owner', 'admin', 'manager'].includes(activeWorkspaceRole);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (assigneeFilter !== 'all') params.assigned_to = assigneeFilter;
      if (dueFilter !== 'all') params.due = dueFilter;
      const response = await api.get('/tasks', { params });
      setTasks(response.data.tasks || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  }, [api, assigneeFilter, dueFilter, priorityFilter, search, statusFilter]);

  const loadLookups = useCallback(async () => {
    try {
      const [brokersResponse, leadsResponse] = await Promise.all([
        api.get('/brokers').catch(() => ({ data: [] })),
        api.get('/leads', { params: { page_size: 200 } }).catch(() => ({ data: { leads: [] } })),
      ]);
      setBrokers(brokersResponse.data || []);
      setLeads(leadsResponse.data?.leads || []);
    } catch (error) {
      console.error('Error loading task lookups:', error);
    }
  }, [api]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    const timer = window.setTimeout(loadTasks, 250);
    return () => window.clearTimeout(timer);
  }, [loadTasks]);

  const groupedTasks = useMemo(() => (
    STATUSES.reduce((acc, status) => {
      acc[status.value] = tasks.filter((task) => task.status === status.value);
      return acc;
    }, {})
  ), [tasks]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ ...EMPTY_FORM, assigned_to: user?.id || '' });
    setComment('');
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pendiente',
      priority: task.priority || 'media',
      due_date: toDateInput(task.due_date),
      assigned_to: task.assigned_to || '',
      lead_id: task.lead_id || '',
      tags: (task.tags || []).join(', '),
      checklist_text: (task.checklist || []).map((item) => `${item.completed ? '[x]' : '[ ]'} ${item.title}`).join('\n'),
    });
    setComment('');
  };

  const closeDialog = () => {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setComment('');
  };

  const buildPayload = () => {
    const checklist = form.checklist_text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        title: line.replace(/^\[(x| )\]\s*/i, '').trim(),
        completed: /^\[x\]/i.test(line),
      }))
      .filter((item) => item.title);

    return {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      due_date: fromDateInput(form.due_date),
      assigned_to: form.assigned_to || null,
      lead_id: form.lead_id || null,
      tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
      checklist,
    };
  };

  const saveTask = async () => {
    if (!form.title.trim()) {
      toast.error('La tarea necesita un titulo');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingTask) {
        const response = await api.put(`/tasks/${editingTask.id}`, payload);
        setEditingTask(response.data.task);
        toast.success('Tarea actualizada');
      } else {
        const response = await api.post('/tasks', payload);
        setEditingTask(response.data.task);
        toast.success('Tarea creada');
      }
      await loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.detail || 'No se pudo guardar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!editingTask) return;
    setSaving(true);
    try {
      await api.delete(`/tasks/${editingTask.id}`);
      toast.success('Tarea eliminada');
      closeDialog();
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('No se pudo eliminar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!editingTask || !comment.trim()) return;
    setSaving(true);
    try {
      const response = await api.post(`/tasks/${editingTask.id}/comments`, { body: comment.trim() });
      setEditingTask(response.data.task);
      setComment('');
      await loadTasks();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('No se pudo agregar el comentario');
    } finally {
      setSaving(false);
    }
  };

  const seedDemo = async () => {
    setSaving(true);
    try {
      const response = await api.post('/tasks/seed-demo');
      toast.success(response.data.message || 'Tareas demo listas');
      await loadTasks();
    } catch (error) {
      console.error('Error seeding tasks:', error);
      toast.error('No se pudieron crear las tareas demo');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (event) => {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const taskId = event.active.id;
    const targetStatus = event.over?.id;
    const task = tasks.find((item) => item.id === taskId);
    setActiveTask(null);
    if (!task || !targetStatus || task.status === targetStatus) return;

    setTasks((current) => current.map((item) => (
      item.id === taskId ? { ...item, status: targetStatus } : item
    )));
    try {
      await api.put(`/tasks/${taskId}/status`, { status: targetStatus });
      await loadTasks();
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('No se pudo mover la tarea');
      await loadTasks();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
          <p className="text-sm text-muted-foreground">
            Seguimientos, responsables y pendientes conectados al pipeline comercial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={seedDemo} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
            Demo
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva tarea
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total" value={summary.total || 0} icon={ListChecks} />
        <Metric label="Abiertas" value={summary.open || 0} icon={Circle} />
        <Metric label="Hoy" value={summary.due_today || 0} icon={Clock} />
        <Metric label="Vencidas" value={summary.overdue || 0} icon={CalendarDays} />
        <Metric label="Urgentes" value={summary.urgent || 0} icon={Filter} />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, descripcion o tag"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUSES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              {PRIORITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dueFilter} onValueChange={setDueFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
              <SelectItem value="upcoming">Proximas</SelectItem>
            </SelectContent>
          </Select>
          {canSeeTeam && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="md:col-span-2 xl:col-span-1">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el equipo</SelectItem>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Tablero</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {loading ? (
            <div className="flex h-80 items-center justify-center rounded-lg border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid gap-3 xl:grid-cols-5">
                {STATUSES.map((status) => (
                  <DroppableColumn key={status.value} status={status}>
                    <div className={`m-3 rounded-md border px-3 py-2 ${status.color}`}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">{status.label}</h2>
                        <Badge variant="secondary">{groupedTasks[status.value]?.length || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3 pt-0">
                      {(groupedTasks[status.value] || []).map((task) => (
                        <TaskCard key={task.id} task={task} onOpen={openEdit} />
                      ))}
                    </div>
                  </DroppableColumn>
                ))}
              </div>
              <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} onOpen={() => {}} dragging /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lista de tareas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No hay tareas con estos filtros.
                </div>
              ) : tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openEdit(task)}
                  className="grid w-full gap-3 rounded-lg border p-3 text-left transition hover:border-primary/50 md:grid-cols-[1fr_150px_150px_160px]"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{task.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{task.description || task.lead?.name || 'Sin descripcion'}</p>
                  </div>
                  <Badge variant="outline" className="w-fit">{statusMeta(task.status).label}</Badge>
                  <Badge className={`w-fit ${priorityMeta(task.priority).className}`}>{priorityMeta(task.priority).label}</Badge>
                  <span className={`text-sm ${isOverdue(task) ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                    {formatDate(task.due_date)}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(editingTask) || form !== EMPTY_FORM} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Titulo</Label>
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descripcion</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha limite</Label>
              <Input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={form.assigned_to || 'none'} onValueChange={(value) => setForm({ ...form, assigned_to: value === 'none' ? '' : value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin responsable</SelectItem>
                  {brokers.map((broker) => <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead relacionado</Label>
              <Select value={form.lead_id || 'none'} onValueChange={(value) => setForm({ ...form, lead_id: value === 'none' ? '' : value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin lead</SelectItem>
                  {leads.map((lead) => <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                placeholder="llamada, visita, cierre"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Checklist</Label>
              <Textarea
                value={form.checklist_text}
                onChange={(event) => setForm({ ...form, checklist_text: event.target.value })}
                rows={4}
                placeholder="[ ] Revisar contexto&#10;[x] Confirmar presupuesto"
              />
            </div>
          </div>

          {editingTask && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" />
                Comentarios
              </div>
              <div className="space-y-2">
                {(editingTask.comments || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin comentarios todavia.</p>
                ) : editingTask.comments.map((item) => (
                  <div key={item.id} className="rounded-md bg-background p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-medium">{item.user_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                    <p className="text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Agregar comentario" />
                <Button type="button" variant="outline" onClick={addComment} disabled={saving || !comment.trim()}>
                  Enviar
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {editingTask ? (
              <Button type="button" variant="destructive" onClick={deleteTask} disabled={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="button" onClick={saveTask} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

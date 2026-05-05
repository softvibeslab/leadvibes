import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck2, CalendarDays, MapPin, Pencil, Plus, RadioTower, Sparkles, TicketPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Skeleton,
} from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import {
  CopimEmptyState,
  CopimPageHeader,
  formatCopimDateTime,
  formatCopimPercent,
  toDateTimeLocalValue,
} from '../components/copim/CopimModulePrimitives';
import { CopimAIAnalysisPanel } from '../components/copim/CopimAIAnalysisPanel';
import { mergeCopimSearchParams } from '../lib/copimRouting';

const EMPTY_FORM = {
  title: '',
  association_id: '',
  event_type: 'networking',
  event_format: 'presencial',
  venue: '',
  visibility: 'members',
  status: 'published',
  registration_open: true,
  speaker_name: '',
  start_at: '',
  end_at: '',
  capacity: 0,
  registered_count: 0,
  checked_in_count: 0,
  description: '',
};

const visibilityTone = {
  public: 'bg-cyan-100 text-cyan-900',
  members: 'bg-slate-200 text-slate-900',
  association: 'bg-indigo-100 text-indigo-900',
};

const statusTone = {
  draft: 'bg-amber-100 text-amber-900',
  published: 'bg-emerald-100 text-emerald-900',
  completed: 'bg-slate-200 text-slate-900',
  cancelled: 'bg-rose-100 text-rose-900',
};

const eventHeroImages = {
  networking: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
  capacitacion: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
  certificacion: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  asamblea: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
  webinar: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1400&q=80',
  default: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80',
};

export const CopimEventsPage = () => {
  const { api } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [associationFilter, setAssociationFilter] = useState(() => searchParams.get('association') || 'all');
  const [futureOnly, setFutureOnly] = useState(() => searchParams.get('future') === 'true');
  const focusEventId = searchParams.get('focus');
  const openedFocusRef = useRef(null);

  const syncSearchParams = (updates, replace = true) => {
    const next = mergeCopimSearchParams(searchParams, updates);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadAssociations = async () => {
      try {
        const response = await api.get('/copim/associations');
        if (!cancelled) {
          setAssociations(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM associations:', error);
      }
    };

    void loadAssociations();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const response = await api.get('/copim/events', {
          params: {
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            association_id: associationFilter === 'all' ? undefined : associationFilter,
            future_only: futureOnly || undefined,
          },
        });
        if (!cancelled) {
          setEvents(response.data || []);
        }
      } catch (error) {
        console.error('Error loading COPIM events:', error);
        if (!cancelled) {
          toast.error('No se pudieron cargar los eventos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadEvents();
    }, search ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [api, search, statusFilter, associationFilter, futureOnly]);

  useEffect(() => {
    syncSearchParams({
      search,
      status: statusFilter,
      association: associationFilter,
      future: futureOnly ? 'true' : null,
      focus: focusEventId,
    });
  }, [associationFilter, focusEventId, futureOnly, search, statusFilter]);

  const refreshEvents = async () => {
    const response = await api.get('/copim/events', {
      params: {
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        association_id: associationFilter === 'all' ? undefined : associationFilter,
        future_only: futureOnly || undefined,
      },
    });
    setEvents(response.data || []);
  };

  const stats = useMemo(() => ({
    total: events.length,
    registrations: events.reduce((sum, item) => sum + (item.registered_count || 0), 0),
    checkins: events.reduce((sum, item) => sum + (item.checked_in_count || 0), 0),
    upcoming: events.filter((item) => new Date(item.start_at) > new Date() && item.status !== 'completed').length,
  }), [events]);

  const getEventHeroImage = (event) => eventHeroImages[event.event_type] || eventHeroImages.default;

  useEffect(() => {
    if (!focusEventId || !events.length || openedFocusRef.current === focusEventId) {
      return;
    }

    const focusedEvent = events.find((event) => event.id === focusEventId);
    if (!focusedEvent) {
      return;
    }

    openedFocusRef.current = focusEventId;
    void openDetailSheet(focusedEvent);
  }, [events, focusEventId]);

  const openCreateDialog = () => {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      association_id: event.association_id || '',
      event_type: event.event_type || 'networking',
      event_format: event.event_format || 'presencial',
      venue: event.venue || '',
      visibility: event.visibility || 'members',
      status: event.status || 'published',
      registration_open: event.registration_open !== false,
      speaker_name: event.speaker_name || '',
      start_at: toDateTimeLocalValue(event.start_at),
      end_at: toDateTimeLocalValue(event.end_at),
      capacity: event.capacity || 0,
      registered_count: event.registered_count || 0,
      checked_in_count: event.checked_in_count || 0,
      description: event.description || '',
    });
    setDialogOpen(true);
  };

  const openDetailSheet = async (event) => {
    syncSearchParams({ focus: event.id });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/copim/events/${event.id}/summary`);
      setSelectedSummary(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el evento');
    } finally {
      setDetailLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!form.title.trim() || !form.start_at) {
      toast.error('Título y fecha de inicio son obligatorios');
      return;
    }

    const payload = {
      ...form,
      association_id: form.association_id || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
    };

    setSaving(true);
    try {
      if (editingEvent) {
        await api.put(`/copim/events/${editingEvent.id}`, payload);
        toast.success('Evento actualizado');
      } else {
        await api.post('/copim/events', payload);
        toast.success('Evento creado');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingEvent(null);
      await refreshEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el evento');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`¿Eliminar el evento "${event.title}"?`)) {
      return;
    }
    try {
      await api.delete(`/copim/events/${event.id}`);
      toast.success('Evento eliminado');
      setSelectedSummary((current) => (current?.event?.id === event.id ? null : current));
      setDetailOpen((current) => (selectedSummary?.event?.id === event.id ? false : current));
      await refreshEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el evento');
    }
  };

  const registerAttendance = async (event) => {
    try {
      await api.post(`/copim/events/${event.id}/register`);
      toast.success('Registro sumado al evento');
      await refreshEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar asistencia');
    }
  };

  const registerCheckIn = async (event) => {
    try {
      await api.post(`/copim/events/${event.id}/check-in`);
      toast.success('Check-in registrado');
      await refreshEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar el check-in');
    }
  };

  const publishEvent = async (event) => {
    try {
      await api.post(`/copim/events/${event.id}/publish`);
      toast.success('Evento publicado');
      await refreshEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo publicar el evento');
    }
  };

  const completeEvent = async (event) => {
    try {
      await api.post(`/copim/events/${event.id}/complete`);
      toast.success('Evento marcado como completado');
      await refreshEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo completar el evento');
    }
  };

  const closeDetailDialog = (open) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedSummary(null);
      syncSearchParams({ focus: null });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[480px] w-full rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        title="Módulo de eventos"
        description="Agenda institucional con estados de publicación, registro, capacidad, asistencia y seguimiento de participación."
        actions={(
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por evento, sede o speaker"
              className="w-full min-w-[280px] xl:w-[320px]"
            />
            <Select value={associationFilter} onValueChange={setAssociationFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las asociaciones</SelectItem>
                {associations.map((association) => (
                  <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 rounded-full border border-border/70 px-4 py-2">
              <span className="text-sm text-muted-foreground">Solo próximos</span>
              <Switch checked={futureOnly} onCheckedChange={setFutureOnly} />
            </div>
            <Button className="rounded-full" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo evento
            </Button>
          </>
        )}
        stats={[
          { label: 'Eventos', value: stats.total, helper: 'Agenda institucional' },
          { label: 'Próximos', value: stats.upcoming, helper: 'Pendientes por ejecutar' },
          { label: 'Registros', value: stats.registrations, helper: 'Interés capturado' },
          { label: 'Check-ins', value: stats.checkins, helper: 'Asistencia efectiva' },
        ]}
      />

      {!events.length ? (
        <CopimEmptyState
          icon={CalendarDays}
          title="Todavía no hay eventos"
          description="Calendariza asambleas, capacitaciones o networking para empezar a medir participación real."
          actionLabel="Crear evento"
          onAction={openCreateDialog}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className={`overflow-hidden border-border/70 bg-card/95 transition hover:border-primary/30 ${focusEventId === event.id ? 'ring-2 ring-primary/40' : ''}`}>
              <div
                className="relative h-44 border-b border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(14, 116, 144, 0.58)), url(${getEventHeroImage(event)})`,
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_42%)]" />
                <div className="relative flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/70">
                        <Sparkles className="h-3.5 w-3.5" />
                        Evento institucional
                      </div>
                      <p className="mt-2 text-xl font-semibold">{event.title}</p>
                      <p className="text-sm text-white/75">{event.association_name || 'Vista nacional'}</p>
                    </div>
                    <Badge className={`capitalize ${statusTone[event.status] || 'bg-slate-200 text-slate-900'}`}>
                      {event.status || 'published'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/70 capitalize">{event.event_type}</p>
                      <p className="text-sm text-white/90">{formatCopimDateTime(event.start_at)}</p>
                    </div>
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => openDetailSheet(event)}>
                      Ver detalle
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-muted/30 px-3 py-3">
                    <p className="text-muted-foreground">Formato</p>
                    <p className="mt-2 font-semibold capitalize">{event.event_format || 'presencial'}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/30 px-3 py-3">
                    <p className="text-muted-foreground">Visibilidad</p>
                    <Badge className={`mt-2 capitalize ${visibilityTone[event.visibility] || 'bg-slate-200 text-slate-900'}`}>
                      {event.visibility}
                    </Badge>
                  </div>
                  <div className="rounded-2xl bg-muted/30 px-3 py-3">
                    <p className="text-muted-foreground">Registros</p>
                    <p className="mt-2 text-2xl font-semibold">{event.registered_count || 0}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/30 px-3 py-3">
                    <p className="text-muted-foreground">Check-ins</p>
                    <p className="mt-2 text-2xl font-semibold">{event.checked_in_count || 0}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ocupación</span>
                    <span>{formatCopimPercent(event.occupancy_rate)} · {event.registered_count || 0}{event.capacity ? ` / ${event.capacity}` : ''}</span>
                  </div>
                  <Progress className="mt-3" value={event.occupancy_rate || 0} />
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-3 py-1">{event.registration_open ? 'Registro abierto' : 'Registro cerrado'}</span>
                    <span className="rounded-full bg-muted px-3 py-1">{event.capacity ? `${event.capacity} lugares` : 'Capacidad libre'}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue || 'Sede por confirmar'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.speaker_name || 'Responsable por asignar'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.status === 'draft' ? (
                    <Button size="sm" variant="outline" onClick={() => publishEvent(event)}>
                      <RadioTower className="mr-2 h-4 w-4" />
                      Publicar
                    </Button>
                  ) : null}
                  {event.status === 'published' ? (
                    <Button size="sm" variant="outline" onClick={() => completeEvent(event)}>
                      Completar
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => registerAttendance(event)} disabled={event.registration_open === false || event.status !== 'published'}>
                    <TicketPlus className="mr-2 h-4 w-4" />
                    Registrar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => registerCheckIn(event)} disabled={event.status === 'cancelled'}>
                    <CalendarCheck2 className="mr-2 h-4 w-4" />
                    Check-in
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(event)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteEvent(event)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
            <DialogDescription>
              Configura el ciclo completo del evento: publicación, formato, registro y asistencia.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Asociación</Label>
              <Select value={form.association_id || 'none'} onValueChange={(value) => setForm((prev) => ({ ...prev, association_id: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Vista nacional</SelectItem>
                  {associations.map((association) => (
                    <SelectItem key={association.id} value={association.id}>{association.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.event_type} onValueChange={(value) => setForm((prev) => ({ ...prev, event_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="capacitacion">Capacitación</SelectItem>
                  <SelectItem value="certificacion">Certificación</SelectItem>
                  <SelectItem value="asamblea">Asamblea</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={form.event_format} onValueChange={(value) => setForm((prev) => ({ ...prev, event_format: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibilidad</Label>
              <Select value={form.visibility} onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">Socios</SelectItem>
                  <SelectItem value="association">Solo asociación</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estatus</Label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Speaker o responsable</Label>
              <Input value={form.speaker_name} onChange={(event) => setForm((prev) => ({ ...prev, speaker_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sede</Label>
              <Input value={form.venue} onChange={(event) => setForm((prev) => ({ ...prev, venue: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input type="datetime-local" value={form.start_at} onChange={(event) => setForm((prev) => ({ ...prev, start_at: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input type="datetime-local" value={form.end_at} onChange={(event) => setForm((prev) => ({ ...prev, end_at: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input type="number" min={0} value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: parseInt(event.target.value, 10) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Registros iniciales</Label>
              <Input type="number" min={0} value={form.registered_count} onChange={(event) => setForm((prev) => ({ ...prev, registered_count: parseInt(event.target.value, 10) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Check-ins iniciales</Label>
              <Input type="number" min={0} value={form.checked_in_count} onChange={(event) => setForm((prev) => ({ ...prev, checked_in_count: parseInt(event.target.value, 10) || 0 }))} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
              <div>
                <p className="font-medium">Registro abierto</p>
                <p className="text-sm text-muted-foreground">Permite seguir sumando registros desde la plataforma.</p>
              </div>
              <Switch checked={form.registration_open} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, registration_open: checked }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveEvent} disabled={saving}>
              {saving ? 'Guardando...' : editingEvent ? 'Actualizar evento' : 'Crear evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={closeDetailDialog}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-5xl">
          {detailLoading || !selectedSummary ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSummary.event?.title}</DialogTitle>
                <DialogDescription>
                  Seguimiento de publicación, ocupación, asistencia y visibilidad del evento.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ocupación</p>
                      <p className="mt-3 text-3xl font-semibold">{formatCopimPercent(selectedSummary.event?.occupancy_rate || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Attendance</p>
                      <p className="mt-3 text-3xl font-semibold">{formatCopimPercent(selectedSummary.event?.attendance_rate || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Registros</p>
                      <p className="mt-3 text-2xl font-semibold">{selectedSummary.event?.registered_count || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-muted/20">
                    <CardContent className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Espacios</p>
                      <p className="mt-3 text-2xl font-semibold">{selectedSummary.event?.available_slots ?? 'Libre'}</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="attendees">Asistentes</TabsTrigger>
                    <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Resumen operativo</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Asociación</p>
                          <p className="mt-1 font-semibold">{selectedSummary.association?.name || selectedSummary.event?.association_name}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Formato</p>
                          <p className="mt-1 font-semibold capitalize">{selectedSummary.event?.event_format || 'presencial'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Speaker</p>
                          <p className="mt-1 font-semibold">{selectedSummary.event?.speaker_name || 'Sin asignar'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Fecha</p>
                          <p className="mt-1 font-semibold">{formatCopimDateTime(selectedSummary.event?.start_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Sede</p>
                          <p className="mt-1 font-semibold">{selectedSummary.event?.venue || 'Sin sede'}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">Registro</p>
                          <p className="mt-1 font-semibold">{selectedSummary.event?.registration_open ? 'Abierto' : 'Cerrado'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Capacidad y participación</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ocupación</span>
                            <span className="font-medium">{selectedSummary.event?.registered_count || 0} / {selectedSummary.event?.capacity || 'Libre'}</span>
                          </div>
                          <Progress value={selectedSummary.event?.occupancy_rate || 0} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Asistencia</span>
                            <span className="font-medium">{selectedSummary.event?.checked_in_count || 0} check-ins</span>
                          </div>
                          <Progress value={selectedSummary.event?.attendance_rate || 0} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSummary.event?.status === 'draft' ? (
                            <Button variant="outline" onClick={() => publishEvent(selectedSummary.event)}>
                              <RadioTower className="mr-2 h-4 w-4" />
                              Publicar
                            </Button>
                          ) : null}
                          {selectedSummary.event?.status === 'published' ? (
                            <Button variant="outline" onClick={() => completeEvent(selectedSummary.event)}>
                              Completar evento
                            </Button>
                          ) : null}
                          <Button variant="outline" onClick={() => registerAttendance(selectedSummary.event)}>
                            <TicketPlus className="mr-2 h-4 w-4" />
                            Registrar asistencia
                          </Button>
                          <Button variant="outline" onClick={() => registerCheckIn(selectedSummary.event)}>
                            <CalendarCheck2 className="mr-2 h-4 w-4" />
                            Registrar check-in
                          </Button>
                        </div>
                        {selectedSummary.event?.description ? (
                          <p className="text-sm leading-7 text-muted-foreground">{selectedSummary.event.description}</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="attendees">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Lista de asistentes registrados</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Array.isArray(selectedSummary.attendees) && selectedSummary.attendees.length ? selectedSummary.attendees.map((attendee) => (
                          <div key={attendee.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="font-semibold">{attendee.member_name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {attendee.member_email || 'Sin correo'} · {attendee.member_city || 'Sin ciudad'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">{attendee.member_specialty || 'Sin especialidad visible'}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`rounded-full capitalize ${attendee.registration_status === 'checked_in' ? 'bg-emerald-100 text-emerald-900' : 'bg-cyan-100 text-cyan-900'}`}>
                                  {attendee.registration_status === 'checked_in' ? 'Check-in realizado' : 'Registrado'}
                                </Badge>
                                {attendee.qr_url ? (
                                  <a
                                    href={attendee.qr_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted"
                                  >
                                    Ver QR
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                            Todavía no hay asistentes vinculados con detalle individual. Los nuevos registros desde el portal ya se irán listando aquí.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analysis">
                    <CopimAIAnalysisPanel
                      api={api}
                      entity={selectedSummary.event}
                      analysisPath={`/copim/events/${selectedSummary.event?.id}/analyze`}
                      onAnalysisSaved={(payload) => {
                        setSelectedSummary((current) => (
                          current
                            ? {
                                ...current,
                                event: {
                                  ...current.event,
                                  ai_analysis: payload.ai_analysis,
                                  ai_last_analyzed_at: payload.ai_last_analyzed_at,
                                },
                              }
                            : current
                        ));
                      }}
                      emptyTitle="Todavía no hay análisis del evento"
                      emptyDescription="Ejecuta el análisis para detectar riesgo de ocupación, engagement y acciones de difusión sugeridas."
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

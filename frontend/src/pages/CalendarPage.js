import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon, Plus, Clock, Phone, Video, MapPin, User,
  ChevronLeft, ChevronRight, Check, Trash2, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar } from '../components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const eventTypeConfig = {
  seguimiento: { label: 'Seguimiento', icon: Phone, color: 'bg-blue-500' },
  llamada: { label: 'Llamada', icon: Phone, color: 'bg-cyan-500' },
  zoom: { label: 'Zoom', icon: Video, color: 'bg-purple-500' },
  visita: { label: 'Visita', icon: MapPin, color: 'bg-[#4D7C0F]' },
  otro: { label: 'Otro', icon: CalendarIcon, color: 'bg-gray-500' },
};

const EventCard = ({ event, onComplete, onDelete }) => {
  const config = eventTypeConfig[event.event_type] || eventTypeConfig.otro;
  const Icon = config.icon;
  const eventTime = new Date(event.start_time);

  return (
    <div className={`p-3 rounded-lg border ${event.completed ? 'bg-muted/50 opacity-60' : 'bg-card'} group`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={`font-medium text-sm ${event.completed ? 'line-through' : ''}`}>
                {event.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {format(eventTime, 'HH:mm', { locale: es })} hrs
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!event.completed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onComplete(event.id)}
                >
                  <Check className="w-4 h-4 text-[#10B981]" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onDelete(event.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
          )}
          {event.lead && (
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <User className="w-3 h-3" />
              <span>{event.lead.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NewEventModal = ({ isOpen, onClose, onCreated, api, selectedDate, leads }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'seguimiento',
    start_time: '',
    lead_id: '',
    reminder_minutes: 30,
  });

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd'T'HH:mm");
      setForm((prev) => ({ ...prev, start_time: dateStr }));
    }
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        lead_id: form.lead_id || null,
      };
      await api.post('/calendar/events', eventData);
      toast.success('Evento creado');
      onCreated();
      onClose();
      setForm({
        title: '',
        description: '',
        event_type: 'seguimiento',
        start_time: '',
        lead_id: '',
        reminder_minutes: 30,
      });
    } catch (error) {
      toast.error('Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Evento</DialogTitle>
          <DialogDescription>Agenda una actividad en tu calendario</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Llamada con Ricardo"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora *</Label>
              <Input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lead asociado</Label>
            <Select value={form.lead_id || "none"} onValueChange={(v) => setForm({ ...form, lead_id: v === "none" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar lead (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin lead</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notas adicionales..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CalendarPage = () => {
  const { api } = useAuth();
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const [eventsRes, leadsRes] = await Promise.all([
        api.get(`/calendar/events?start_date=${start}&end_date=${end}`),
        api.get('/leads'),
      ]);
      setEvents(eventsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteEvent = async (eventId) => {
    try {
      await api.put(`/calendar/events/${eventId}?completed=true`);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, completed: true } : e))
      );
      toast.success('Evento completado');
    } catch (error) {
      toast.error('Error al completar evento');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/calendar/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Evento eliminado');
    } catch (error) {
      toast.error('Error al eliminar evento');
    }
  };

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get day names
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Calculate starting day offset
  const startDayOffset = startOfMonth(currentMonth).getDay();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" data-testid="calendar-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Calendario</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona tus actividades y seguimientos</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="rounded-full w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Evento
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-[300px] sm:h-[400px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-[300px] sm:h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="capitalize text-base sm:text-lg">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </CardTitle>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => {
                      setCurrentMonth(new Date());
                      setSelectedDate(new Date());
                    }}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days */}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-start transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isTodayDate
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isSelected ? '' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white' : eventTypeConfig[event.event_type]?.color || 'bg-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Events */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {selectedDateEvents.length} eventos programados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <ScrollArea className="h-[250px] sm:h-[400px] pr-4">
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onComplete={handleCompleteEvent}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm">No hay eventos para este día</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => setShowNewModal(true)}
                    >
                      Crear evento
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Upcoming */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97706]" />
            Próximos Eventos de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {getEventsForDate(new Date())
              .filter((e) => !e.completed)
              .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
              .slice(0, 5)
              .map((event) => {
                const config = eventTypeConfig[event.event_type] || eventTypeConfig.otro;
                const Icon = config.icon;
                return (
                  <div
                    key={event.id}
                    className="flex-shrink-0 w-56 sm:w-64 p-3 sm:p-4 rounded-xl bg-muted/50 border"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.start_time), 'HH:mm')} hrs
                        </p>
                      </div>
                    </div>
                    {event.lead && (
                      <Badge variant="secondary" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        {event.lead.name}
                      </Badge>
                    )}
                  </div>
                );
              })}
            {getEventsForDate(new Date()).filter((e) => !e.completed).length === 0 && (
              <p className="text-muted-foreground text-sm py-4">No hay eventos pendientes para hoy</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Event Modal */}
      <NewEventModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={loadData}
        api={api}
        selectedDate={selectedDate}
        leads={leads}
      />
    </div>
  );
};

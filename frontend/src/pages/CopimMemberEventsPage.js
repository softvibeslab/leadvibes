import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CalendarDays, MapPin, QrCode, TicketPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CopimPageHeader, formatCopimDateTime, formatCopimPercent } from '../components/copim/CopimModulePrimitives';

const eventHeroImages = {
  networking: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
  capacitacion: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
  certificacion: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  asamblea: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
  webinar: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1400&q=80',
  default: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80',
};

const statusTone = {
  registered: 'bg-cyan-100 text-cyan-900',
  checked_in: 'bg-emerald-100 text-emerald-900',
};

export const CopimMemberEventsPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workingEventId, setWorkingEventId] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      const response = await api.get('/copim/member-portal/events');
      setData(response.data);
    } catch (error) {
      console.error('Error loading member events:', error);
      toast.error(error.response?.data?.detail || 'No se pudieron cargar tus eventos');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(data?.events) ? data.events : [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return list;
    }
    return list.filter((event) => (
      [event.title, event.association_name, event.venue, event.speaker_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    ));
  }, [data?.events, search]);

  const registrations = Array.isArray(data?.registrations) ? data.registrations : [];

  const handleRegister = async (eventId) => {
    setWorkingEventId(eventId);
    try {
      await api.post(`/copim/member-portal/events/${eventId}/register`);
      toast.success('Registro confirmado');
      await loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar al evento');
    } finally {
      setWorkingEventId(null);
    }
  };

  const handleCheckIn = async (eventId) => {
    setWorkingEventId(eventId);
    try {
      await api.post(`/copim/member-portal/events/${eventId}/check-in`);
      toast.success('Check-in registrado');
      await loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar el check-in');
    } finally {
      setWorkingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Eventos y agenda"
        description="Explora la agenda institucional, regístrate sin fricción y conserva visible tu historial de participación."
        actions={(
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por evento, asociación o sede"
            className="w-full min-w-[280px] xl:w-[320px]"
          />
        )}
        stats={[
          { label: 'Disponibles', value: filteredEvents.length, helper: 'Agenda visible para tu rol' },
          { label: 'Registrados', value: registrations.length, helper: 'Confirmaciones creadas' },
          { label: 'Check-ins', value: registrations.filter((item) => item.registration_status === 'checked_in').length, helper: 'Asistencia registrada' },
          { label: 'Próximo', value: data?.next_event ? formatCopimDateTime(data.next_event.start_at) : 'Sin agenda', helper: data?.next_event?.title || 'Regístrate a un evento' },
        ]}
      />

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList className="rounded-full">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="historial">Mis registros</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="grid gap-4 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden border-border/70 bg-card/95">
              <div
                className="relative h-44 border-b border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(14, 116, 144, 0.58)), url(${eventHeroImages[event.event_type] || eventHeroImages.default})`,
                }}
              >
                <div className="relative flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-white/72">{event.association_name || 'COPIM'}</p>
                      <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
                    </div>
                    {event.member_registered ? (
                      <Badge className={`rounded-full capitalize ${statusTone[event.member_checkin_status] || 'bg-cyan-100 text-cyan-900'}`}>
                        {event.member_checkin_status === 'checked_in' ? 'Check-in' : 'Registrado'}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-white/84">{formatCopimDateTime(event.start_at)}</p>
                </div>
              </div>

              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-muted/30 px-3 py-3">
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="mt-2 font-semibold capitalize">{event.event_type}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/30 px-3 py-3">
                    <p className="text-muted-foreground">Ocupación</p>
                    <p className="mt-2 font-semibold">{formatCopimPercent(event.occupancy_rate || 0)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.venue || 'Sede por confirmar'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.registered_count || 0} registros · {event.checked_in_count || 0} check-ins</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!event.member_registered ? (
                    <Button className="rounded-full" size="sm" onClick={() => handleRegister(event.id)} disabled={workingEventId === event.id || event.registration_open === false || event.status !== 'published'}>
                      <TicketPlus className="mr-2 h-4 w-4" />
                      {workingEventId === event.id ? 'Procesando...' : 'Registrarme'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      size="sm"
                      onClick={() => handleCheckIn(event.id)}
                      disabled={workingEventId === event.id || event.member_checkin_status === 'checked_in' || event.status === 'cancelled'}
                    >
                      <CalendarCheck2 className="mr-2 h-4 w-4" />
                      {event.member_checkin_status === 'checked_in' ? 'Check-in realizado' : 'Registrar check-in'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="historial">
          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-4 p-6">
              {registrations.length ? registrations.map((registration) => (
                <div key={registration.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">{registration.event?.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCopimDateTime(registration.event?.start_at)} · {registration.event?.association_name || 'COPIM'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`rounded-full capitalize ${statusTone[registration.registration_status] || 'bg-cyan-100 text-cyan-900'}`}>
                        {registration.registration_status}
                      </Badge>
                      {registration.qr_url ? (
                        <a href={registration.qr_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted">
                          <QrCode className="h-4 w-4" />
                          Ver QR
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                  Todavía no tienes registros guardados. Elige un evento desde la agenda y confirma tu asistencia.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

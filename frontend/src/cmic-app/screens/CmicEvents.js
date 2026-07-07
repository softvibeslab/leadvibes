import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Card, Chip, CmicLoading, CmicEmpty, Icon, fmtDateTime, useMemberResource } from '../cmicAppKit';

const TABS = [
  { key: 'agenda', label: 'Eventos' },
  { key: 'mine', label: 'Mis registros' },
];

export const CmicEvents = () => {
  const { api } = useAuth();
  const { data, loading, reload } = useMemberResource('/copim/member-portal/events');
  const [tab, setTab] = useState('agenda');
  const [working, setWorking] = useState(null);

  if (loading) return <CmicLoading />;
  if (!data) return null;

  const events = Array.isArray(data.events) ? data.events : [];
  const registrations = Array.isArray(data.registrations) ? data.registrations : [];

  const act = async (eventId, kind) => {
    setWorking(eventId);
    try {
      await api.post(`/copim/member-portal/events/${eventId}/${kind}`);
      toast.success(kind === 'register' ? 'Registro confirmado' : 'Check-in registrado');
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo completar la acción');
    } finally {
      setWorking(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="cmic-chiprow">
        {TABS.map((t) => (
          <button key={t.key} className={`cmic-filter ${tab === t.key ? 'cmic-filter--active' : ''}`.trim()} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'agenda' ? (
        events.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev) => (
              <Card key={ev.id} pad="sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p className="cmic-caption" style={{ textTransform: 'uppercase' }}>{ev.event_type || 'Evento'}</p>
                    <p style={{ fontWeight: 600, color: 'var(--cmic-navy-deep)' }}>{ev.title}</p>
                  </div>
                  {ev.member_registered ? (
                    <Chip tone={ev.member_checkin_status === 'checked_in' ? 'ok' : 'navy'}>
                      {ev.member_checkin_status === 'checked_in' ? 'Check-in' : 'Inscrito'}
                    </Chip>
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  <span className="cmic-caption"><Icon name="schedule" style={{ fontSize: 14 }} /> {fmtDateTime(ev.start_at)}</span>
                  <span className="cmic-caption"><Icon name="location_on" style={{ fontSize: 14 }} /> {ev.venue || 'Sede por confirmar'}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  {!ev.member_registered ? (
                    <button className="cmic-btn cmic-btn--primary cmic-btn--sm" disabled={working === ev.id || ev.status !== 'published'} onClick={() => act(ev.id, 'register')}>
                      {working === ev.id ? 'Procesando…' : 'Registrarme'}
                    </button>
                  ) : ev.member_checkin_status !== 'checked_in' ? (
                    <button className="cmic-btn cmic-btn--outline cmic-btn--sm" disabled={working === ev.id} onClick={() => act(ev.id, 'check-in')}>
                      {working === ev.id ? 'Procesando…' : 'Registrar check-in'}
                    </button>
                  ) : (
                    <span className="cmic-chip cmic-chip--ok"><Icon name="check_circle" fill style={{ fontSize: 16 }} /> Asistencia confirmada</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <CmicEmpty icon="event" title="Sin eventos disponibles" description="Cuando tu delegación publique eventos aparecerán aquí." />
        )
      ) : (
        registrations.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {registrations.map((r) => (
              <Card key={r.id} pad="sm">
                <p style={{ fontWeight: 600 }}>{r.event?.title}</p>
                <p className="cmic-caption" style={{ marginTop: 4 }}>{fmtDateTime(r.event?.start_at)} · {r.event?.association_name || 'CMIC'}</p>
                <div style={{ marginTop: 8 }}>
                  <Chip tone={r.registration_status === 'checked_in' ? 'ok' : 'navy'}>{r.registration_status}</Chip>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <CmicEmpty icon="confirmation_number" title="Sin registros aún" description="Regístrate a un evento desde la agenda para verlo aquí." />
        )
      )}
    </div>
  );
};

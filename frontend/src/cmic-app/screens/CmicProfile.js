import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Card, Chip, CmicLoading, Icon, SectionLabel } from '../cmicAppKit';

const EMPTY = {
  full_name: '', phone: '', title: '', city: '', specialty: '', company_name: '', bio: '', directory_visible: true,
};

const Field = ({ label, value, onChange, placeholder, multiline }) => (
  <label style={{ display: 'block' }}>
    <span className="cmic-caption" style={{ display: 'block', marginBottom: 4 }}>{label}</span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid var(--cmic-outline)', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid var(--cmic-outline)', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
      />
    )}
  </label>
);

export const CmicProfile = () => {
  const { api, user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get('/copim/member-portal/profile');
      const member = response.data?.member || {};
      setData(response.data);
      setForm({
        full_name: member.full_name || '',
        phone: member.phone || '',
        title: member.title || '',
        city: member.city || '',
        specialty: member.specialty || '',
        company_name: member.company_name || '',
        bio: member.bio || '',
        directory_visible: member.directory_visible !== false,
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key) => (val) => setForm((c) => ({ ...c, [key]: val }));

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Tu nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await api.put('/copim/member-portal/profile', form);
      toast.success('Perfil actualizado');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar tu perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CmicLoading />;

  const member = data?.member || {};
  const association = data?.association;
  const completion = data?.stats?.profile_completion || 0;
  const active = member.member_status === 'active';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card pad="md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={form.full_name || member.full_name} src={member.avatar_url} size={60} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--cmic-navy-deep)' }}>{form.full_name || 'Mi perfil'}</p>
            <p className="cmic-caption">{form.title || 'Asociado CMIC'} · {association?.name || 'CMIC'}</p>
            <div style={{ marginTop: 6 }}><Chip tone={active ? 'ok' : 'warn'} dot={active}>{active ? 'Afiliado activo' : member.member_status || 'Pendiente'}</Chip></div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="cmic-caption">Completitud del perfil</span>
            <span className="cmic-caption">{completion}%</span>
          </div>
          <div className="cmic-progress" style={{ marginTop: 6 }}><div className="cmic-progress__fill" style={{ width: `${completion}%` }} /></div>
        </div>
      </Card>

      <div>
        <SectionLabel>Datos profesionales</SectionLabel>
        <Card pad="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nombre completo" value={form.full_name} onChange={set('full_name')} />
            <Field label="Correo" value={member.email || ''} onChange={() => {}} placeholder="Gestionado por tu cuenta" />
            <Field label="Teléfono" value={form.phone} onChange={set('phone')} />
            <Field label="Título profesional" value={form.title} onChange={set('title')} />
            <Field label="Especialidad" value={form.specialty} onChange={set('specialty')} />
            <Field label="Ciudad" value={form.city} onChange={set('city')} />
            <Field label="Empresa" value={form.company_name} onChange={set('company_name')} />
            <Field label="Biografía" value={form.bio} onChange={set('bio')} multiline placeholder="Resume tu experiencia y especialidad." />
          </div>
        </Card>
      </div>

      <Card pad="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600 }}>Visible en directorio</p>
            <p className="cmic-caption">Permite que otros socios encuentren tu perfil.</p>
          </div>
          <button
            onClick={() => set('directory_visible')(!form.directory_visible)}
            aria-label="Alternar visibilidad"
            style={{
              width: 46, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
              background: form.directory_visible ? 'var(--cmic-primary)' : 'var(--cmic-surface-container-highest)',
              transition: 'background 0.15s ease',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: form.directory_visible ? 23 : 3, width: 20, height: 20,
              borderRadius: 999, background: '#fff', transition: 'left 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </Card>

      <button className="cmic-btn cmic-btn--primary" disabled={saving} onClick={handleSave}>
        <Icon name="save" style={{ fontSize: 18 }} /> {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>

      <button className="cmic-btn cmic-btn--outline" onClick={() => { logout?.(); }}>
        <Icon name="logout" style={{ fontSize: 18 }} /> Cerrar sesión
      </button>

      <p className="cmic-caption" style={{ textAlign: 'center' }}>{user?.email}</p>
    </div>
  );
};

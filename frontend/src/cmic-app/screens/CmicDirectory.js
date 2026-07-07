import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Card, Chip, CmicLoading, CmicEmpty, Icon } from '../cmicAppKit';

export const CmicDirectory = () => {
  const { api } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get('/copim/member-portal/directory', {
          params: { search: search || undefined },
        });
        if (!cancelled) setMembers(response.data || []);
      } catch (error) {
        if (!cancelled) toast.error(error.response?.data?.detail || 'No se pudo cargar el directorio');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const id = window.setTimeout(load, search ? 200 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [api, search]);

  const count = useMemo(() => members.length, [members]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="cmic-card cmic-card--pad-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="search" style={{ color: 'var(--cmic-on-surface-variant)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa o especialidad"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--cmic-on-surface)' }}
        />
      </div>

      <p className="cmic-caption">{count} socio(s) afiliado(s)</p>

      {loading ? (
        <CmicLoading lines={4} />
      ) : members.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.map((m) => (
            <Card key={m.id} pad="sm">
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar name={m.full_name} src={m.avatar_url} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontWeight: 600, color: 'var(--cmic-navy-deep)' }}>{m.full_name}</p>
                    {m.membership_tier ? <Icon name="verified" fill style={{ fontSize: 16, color: 'var(--cmic-tertiary)' }} /> : null}
                  </div>
                  <p className="cmic-caption">{m.title || 'Profesional CMIC'}</p>
                  <p className="cmic-caption"><Icon name="business" style={{ fontSize: 13 }} /> {m.company_name || 'Empresa no visible'}</p>
                  <p className="cmic-caption"><Icon name="location_on" style={{ fontSize: 13 }} /> {m.city || 'Sin ciudad'}</p>
                  {m.specialty ? <div style={{ marginTop: 6 }}><Chip tone="navy">{m.specialty}</Chip></div> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <CmicEmpty icon="groups" title="Sin resultados" description="Ajusta tu búsqueda para encontrar más socios visibles." />
      )}
    </div>
  );
};

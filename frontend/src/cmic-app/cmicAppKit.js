import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// Icono Material Symbols (misma familia que usan los diseños de Stitch).
export const Icon = ({ name, className = '', fill = false, style }) => (
  <span className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`.trim()} style={style}>
    {name}
  </span>
);

export const Avatar = ({ name = '', size = 44, src }) => {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || 'CM';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="cmic-avatar"
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    );
  }
  return (
    <span className="cmic-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
};

export const Chip = ({ children, tone = 'default', dot = false }) => {
  const toneClass = {
    default: '',
    ok: 'cmic-chip--ok',
    warn: 'cmic-chip--warn',
    err: 'cmic-chip--err',
    navy: 'cmic-chip--navy',
  }[tone] || '';
  return (
    <span className={`cmic-chip ${toneClass}`.trim()}>
      {dot ? <span className="cmic-chip__dot" /> : null}
      {children}
    </span>
  );
};

export const SectionLabel = ({ children }) => <p className="cmic-section-label">{children}</p>;

export const Card = ({ children, pad = 'md', className = '', ...rest }) => {
  const padClass = pad === 'sm' ? 'cmic-card--pad-sm' : pad === 'none' ? '' : 'cmic-card--pad';
  return (
    <div className={`cmic-card ${padClass} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
};

export const CmicLoading = ({ lines = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="cmic-skel" style={{ height: 120 }} />
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="cmic-skel" style={{ height: 72 }} />
    ))}
  </div>
);

export const CmicEmpty = ({ icon = 'inbox', title, description }) => (
  <div className="cmic-card cmic-card--pad" style={{ textAlign: 'center', borderStyle: 'dashed' }}>
    <span
      className="cmic-quick__icon"
      style={{ margin: '0 auto 12px', display: 'inline-flex' }}
    >
      <Icon name={icon} />
    </span>
    <p className="cmic-h2" style={{ marginBottom: 6 }}>{title}</p>
    {description ? <p className="cmic-body cmic-muted">{description}</p> : null}
  </div>
);

// Formatters compartidos con el resto del módulo CMIC.
export const fmtCurrency = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );

export const fmtDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Hook de carga de datos del portal del socio, replicando el patrón
 * useEffect + cancelled + toast usado en las páginas CopimMember*.
 */
export const useMemberResource = (path, { auto = true } = {}) => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(path);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const detail = err.response?.data?.detail || 'No se pudo cargar la información';
      setError(detail);
      toast.error(detail);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, path]);

  useEffect(() => {
    if (!auto) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get(path);
        if (!cancelled) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const detail = err.response?.data?.detail || 'No se pudo cargar la información';
          setError(detail);
          toast.error(detail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, path, auto]);

  return { data, loading, error, reload, setData };
};

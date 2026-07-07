import React from 'react';
import { Avatar, Card, Chip, CmicLoading, Icon, fmtDate, useMemberResource } from '../cmicAppKit';

export const CmicCredential = () => {
  const { data, loading } = useMemberResource('/copim/member-portal/credential');

  if (loading) return <CmicLoading />;
  if (!data) return null;

  const { member, credential, current_membership: membership } = data;
  const issued = credential?.credential_status === 'issued';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tarjeta credencial */}
      <div className="cmic-hero-navy" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="cmic-chip" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            <Icon name="verified_user" fill style={{ fontSize: 16 }} /> Credencial CMIC
          </div>
          <Chip tone={issued ? 'ok' : 'warn'}>{issued ? 'Vigente' : 'Pendiente'}</Chip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
          <Avatar name={member?.full_name} src={member?.avatar_url} size={56} />
          <div>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{member?.full_name || 'Socio CMIC'}</p>
            <p style={{ fontSize: 13, opacity: 0.8 }}>{member?.title || member?.specialty || 'Asociado CMIC'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>Folio</p>
            <p style={{ fontWeight: 600, marginTop: 4 }}>{credential?.credential_id || 'Pendiente'}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>Vigencia</p>
            <p style={{ fontWeight: 600, marginTop: 4 }}>{credential?.expires_at ? fmtDate(credential.expires_at) : 'Sin fecha'}</p>
          </div>
        </div>
      </div>

      {/* QR */}
      <Card pad="md" style={{ textAlign: 'center' }}>
        <p className="cmic-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="qr_code_2" style={{ color: 'var(--cmic-primary)' }} /> Código QR
        </p>
        <div style={{ display: 'inline-flex', padding: 16, background: '#fff', border: '1px solid var(--cmic-card-border)', borderRadius: 12, marginTop: 8 }}>
          {credential?.qr_url ? (
            <img src={credential.qr_url} alt="QR credencial CMIC" style={{ width: 200, height: 200, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cmic-on-surface-variant)' }}>
              <Icon name="qr_code_2" style={{ fontSize: 96, opacity: 0.3 }} />
            </div>
          )}
        </div>
        <p className="cmic-body cmic-muted" style={{ marginTop: 12 }}>
          Presenta este código para validación, check-in en eventos y beneficios dentro de la red CMIC.
        </p>
      </Card>

      {/* Datos */}
      <Card pad="none">
        <div className="cmic-list-item">
          <Icon name="badge" style={{ color: 'var(--cmic-secondary)' }} />
          <div style={{ flex: 1 }}><p className="cmic-caption">Plan actual</p><p className="cmic-body">{membership?.plan_name || 'Sin membresía'}</p></div>
        </div>
        <div className="cmic-list-item">
          <Icon name="how_to_reg" style={{ color: 'var(--cmic-secondary)' }} />
          <div style={{ flex: 1 }}><p className="cmic-caption">Estatus de membresía</p><p className="cmic-body" style={{ textTransform: 'capitalize' }}>{membership?.payment_status || 'Sin estatus'}</p></div>
        </div>
        <div className="cmic-list-item">
          <Icon name="visibility" style={{ color: 'var(--cmic-secondary)' }} />
          <div style={{ flex: 1 }}><p className="cmic-caption">Directorio</p><p className="cmic-body">{credential?.directory_visible ? 'Visible para otros socios' : 'Oculta'}</p></div>
        </div>
      </Card>
    </div>
  );
};

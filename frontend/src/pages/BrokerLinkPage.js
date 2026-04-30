import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Loader2, Link2, Building2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const BrokerLinkPage = () => {
  const navigate = useNavigate();
  const { api, isAuthenticated, switchWorkspace, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [pairing, setPairing] = useState(null);

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    const loadPairing = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/brokers/pairing/by-token/${token}`);
        setPairing(res.data);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'No se pudo validar el código QR');
      } finally {
        setLoading(false);
      }
    };
    loadPairing();
  }, [api, token]);

  const handleLoginRedirect = () => {
    navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };

  const handleConfirm = async () => {
    if (!token) return;
    setConfirming(true);
    try {
      const res = await api.post('/brokers/pairing/confirm', { token });
      toast.success('Broker vinculado correctamente');
      if (res.data?.tenant_id) {
        await switchWorkspace(res.data.tenant_id);
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo confirmar el vínculo');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl border-border/70 bg-card/95">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Link2 className="h-6 w-6" />
          </div>
          <CardTitle>Vincular broker a inmobiliaria</CardTitle>
          <CardDescription>
            Confirma el acceso a este workspace desde tu cuenta actual.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {!token && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Falta el token del código QR.
            </div>
          )}

          {pairing && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{pairing.tenant_name || 'Inmobiliaria'}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">{pairing.tenant_type || 'agency'}</Badge>
                    <Badge variant="outline" className="capitalize">{pairing.invited_role || 'broker'}</Badge>
                    <Badge variant={pairing.status === 'pending' ? 'default' : 'secondary'}>{pairing.status}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pairing?.status === 'confirmed' && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Este código ya fue usado y la vinculación quedó confirmada.
            </div>
          )}

          {pairing?.status === 'expired' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Este código QR expiró. Pide a la inmobiliaria que genere uno nuevo.
            </div>
          )}

          {pairing?.status === 'cancelled' && (
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              La inmobiliaria canceló esta solicitud de vinculación.
            </div>
          )}

          {!isAuthenticated ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Necesitas iniciar sesión para confirmar este vínculo.
              </div>
              <Button className="w-full" onClick={handleLoginRedirect}>
                Iniciar sesión para continuar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Vas a vincular la cuenta <span className="font-medium text-foreground">{user?.email}</span> con este workspace.
              </div>
              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={!pairing || pairing.status !== 'pending' || confirming}
              >
                {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirmar vínculo
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4" />
              <p>Este acceso se aplica al workspace de la inmobiliaria. Tu cuenta personal sigue existiendo como workspace independiente.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Webhook,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.openwa?.message) return detail.openwa.message;
  if (detail?.openwa?.error) return detail.openwa.error;
  if (error?.message) return error.message;
  return fallback;
};

const statusTone = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (['ready', 'connected', 'authenticated'].includes(normalized)) {
    return 'bg-emerald-500/12 text-emerald-700 border-emerald-500/30';
  }
  if (['qr_ready', 'created', 'initializing', 'starting'].includes(normalized)) {
    return 'bg-amber-500/12 text-amber-700 border-amber-500/30';
  }
  if (['failed', 'disconnected', 'stopped'].includes(normalized)) {
    return 'bg-destructive/10 text-destructive border-destructive/25';
  }
  return 'bg-muted text-muted-foreground border-border';
};

const displayStatus = (status) => status || 'sin estado';

export const WhatsAppOpenWAPage = () => {
  const { api, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [health, setHealth] = useState(null);
  const [qr, setQr] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [chatId, setChatId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [busy, setBusy] = useState('');

  const selectedSession = useMemo(
    () => sessions.find((session) => session.openwa_session_id === selectedSessionId),
    [selectedSessionId, sessions]
  );

  const loadSessions = useCallback(async () => {
    const response = await api.get('/whatsapp/openwa/sessions');
    const nextSessions = response.data?.sessions || [];
    setSessions(nextSessions);
    setSelectedSessionId((current) => current || nextSessions[0]?.openwa_session_id || '');
  }, [api]);

  const checkHealth = useCallback(async () => {
    const response = await api.get('/whatsapp/openwa/health');
    setHealth(response.data);
  }, [api]);

  const refreshAll = useCallback(async () => {
    setBusy('refresh');
    try {
      await Promise.all([
        loadSessions().catch((error) => {
          toast.error(getErrorMessage(error, 'No se pudieron cargar las sesiones'));
        }),
        checkHealth().catch((error) => {
          setHealth({ error: getErrorMessage(error, 'OpenWA no responde') });
        }),
      ]);
    } finally {
      setBusy('');
    }
  }, [checkHealth, loadSessions]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const createSession = async () => {
    setBusy('create');
    try {
      const response = await api.post('/whatsapp/openwa/sessions', {
        name: sessionName || undefined,
        auto_start: true,
      });
      const sessionId = response.data?.openwa_session_id;
      toast.success('Sesión creada. Escanea el QR cuando esté listo.');
      setSessionName('');
      await loadSessions();
      if (sessionId) {
        setSelectedSessionId(sessionId);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo crear la sesión'));
    } finally {
      setBusy('');
    }
  };

  const loadQr = async () => {
    if (!selectedSessionId) return;
    setBusy('qr');
    try {
      const response = await api.get(`/whatsapp/openwa/sessions/${selectedSessionId}/qr`);
      setQr(response.data);
      toast.success('QR actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'El QR aún no está disponible'));
      setQr(null);
    } finally {
      setBusy('');
    }
  };

  const syncStatus = async () => {
    if (!selectedSessionId) return;
    setBusy('status');
    try {
      await api.get(`/whatsapp/openwa/sessions/${selectedSessionId}/status`);
      await loadSessions();
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo sincronizar el estado'));
    } finally {
      setBusy('');
    }
  };

  const startSession = async () => {
    if (!selectedSessionId) return;
    setBusy('start');
    try {
      await api.post(`/whatsapp/openwa/sessions/${selectedSessionId}/start`);
      await loadSessions();
      toast.success('Sesión iniciando');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo iniciar la sesión'));
    } finally {
      setBusy('');
    }
  };

  const stopSession = async () => {
    if (!selectedSessionId) return;
    setBusy('stop');
    try {
      await api.post(`/whatsapp/openwa/sessions/${selectedSessionId}/stop`);
      await loadSessions();
      toast.success('Sesión detenida');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo detener la sesión'));
    } finally {
      setBusy('');
    }
  };

  const sendText = async () => {
    if (!selectedSessionId || !chatId.trim() || !messageText.trim()) return;
    setBusy('send');
    try {
      await api.post(`/whatsapp/openwa/sessions/${selectedSessionId}/send-text`, {
        chat_id: chatId.trim(),
        text: messageText.trim(),
      });
      setMessageText('');
      toast.success('Mensaje enviado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo enviar el mensaje'));
    } finally {
      setBusy('');
    }
  };

  const registerWebhook = async () => {
    if (!selectedSessionId || !webhookUrl.trim()) return;
    setBusy('webhook');
    try {
      await api.post(`/whatsapp/openwa/sessions/${selectedSessionId}/webhooks`, {
        url: webhookUrl.trim(),
        events: ['message', 'message_ack', 'session_status'],
      });
      toast.success('Webhook registrado');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo registrar el webhook'));
    } finally {
      setBusy('');
    }
  };

  const healthOk = health?.openwa?.status === 'ok';

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              OpenWA Gateway
            </Badge>
            <Badge variant="outline" className={healthOk ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-700'}>
              {healthOk ? 'Gateway online' : 'Revisar conexión'}
            </Badge>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            WhatsApp conectado a Rovi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Vincula el WhatsApp del broker por QR, valida el estado de la sesión y prueba mensajes antes de desplegar el módulo completo de inbox e inteligencia.
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll} disabled={busy === 'refresh'}>
          {busy === 'refresh' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Modo de prueba local</AlertTitle>
        <AlertDescription>
          Mantén la IA en modo asistido. Los chats personales o familiares deben quedar excluidos por defecto hasta que el broker autorice su uso dentro del CRM.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Sesiones del broker
                  </CardTitle>
                  <CardDescription>
                    Cada sesión queda ligada al usuario y tenant actual.
                  </CardDescription>
                </div>
                <Badge variant="outline">{sessions.length} sesión(es)</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={sessionName}
                  onChange={(event) => setSessionName(event.target.value)}
                  placeholder={`rovi-${user?.name || 'broker'}`}
                  aria-label="Nombre de sesión"
                />
                <Button onClick={createSession} disabled={busy === 'create'}>
                  {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  Crear sesión
                </Button>
              </div>

              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Aún no hay sesiones vinculadas en Rovi para este usuario.
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isSelected = session.openwa_session_id === selectedSessionId;
                    return (
                      <button
                        key={session.openwa_session_id}
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(session.openwa_session_id);
                          setQr(null);
                        }}
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          isSelected
                            ? 'border-primary/45 bg-primary/10 shadow-sm'
                            : 'border-border bg-background/40 hover:border-primary/25 hover:bg-accent/10'
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {session.name || session.openwa_session_id}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {session.openwa_session_id}
                            </p>
                          </div>
                          <Badge variant="outline" className={statusTone(session.status)}>
                            {displayStatus(session.status)}
                          </Badge>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Prueba de envío
              </CardTitle>
              <CardDescription>
                Úsalo solo con chats existentes durante el piloto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chat o teléfono</Label>
                <Input
                  value={chatId}
                  onChange={(event) => setChatId(event.target.value)}
                  placeholder="+52 984 000 0000 o 5219840000000@c.us"
                  disabled={!selectedSessionId}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Escribe un mensaje corto de prueba"
                  className="min-h-28 resize-none"
                  disabled={!selectedSessionId}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={sendText}
                  disabled={!selectedSessionId || !chatId.trim() || !messageText.trim() || busy === 'send'}
                >
                  {busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5 text-primary" />
                QR y estado
              </CardTitle>
              <CardDescription>
                Escanea desde WhatsApp Web en el teléfono del broker.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSession ? (
                <div className="rounded-lg border border-border bg-background/45 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{selectedSession.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{selectedSession.phone || 'Sin teléfono confirmado'}</p>
                    </div>
                    <Badge variant="outline" className={statusTone(selectedSession.status)}>
                      {displayStatus(selectedSession.status)}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Selecciona o crea una sesión para ver el QR.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={syncStatus} disabled={!selectedSessionId || busy === 'status'}>
                  {busy === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Estado
                </Button>
                <Button variant="outline" onClick={loadQr} disabled={!selectedSessionId || busy === 'qr'}>
                  {busy === 'qr' ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  QR
                </Button>
                <Button variant="outline" onClick={startSession} disabled={!selectedSessionId || busy === 'start'}>
                  <CheckCircle2 className="h-4 w-4" />
                  Iniciar
                </Button>
                <Button variant="outline" onClick={stopSession} disabled={!selectedSessionId || busy === 'stop'}>
                  <XCircle className="h-4 w-4" />
                  Detener
                </Button>
              </div>

              <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-muted/25 p-4">
                {qr?.qrCode ? (
                  <img src={qr.qrCode} alt="QR de vinculación WhatsApp" className="h-64 w-64 rounded-md bg-white p-2" />
                ) : (
                  <div className="max-w-xs text-center">
                    <QrCode className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium text-foreground">QR pendiente</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Si la sesión ya está conectada, OpenWA puede no regresar QR.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Webhook className="h-5 w-5 text-primary" />
                Webhook inbound
              </CardTitle>
              <CardDescription>
                Registra un túnel público hacia tu backend local para recibir mensajes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL pública del webhook</Label>
                <Input
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://tu-tunel/api/whatsapp/openwa/webhook"
                  disabled={!selectedSessionId}
                />
              </div>
              <Button
                variant="outline"
                onClick={registerWebhook}
                disabled={!selectedSessionId || !webhookUrl.trim() || busy === 'webhook'}
                className="w-full"
              >
                {busy === 'webhook' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                Registrar webhook
              </Button>
              <Alert className="border-border bg-background/45">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Antes de producción</AlertTitle>
                <AlertDescription>
                  Rota la API key de OpenWA, protege el dashboard del puerto 2886 y usa una red Docker interna entre Rovi y OpenWA.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppOpenWAPage;

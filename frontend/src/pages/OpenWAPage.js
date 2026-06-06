import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  RefreshCw,
  Save,
  Send,
  Server,
  Shield,
  Smartphone,
  Webhook,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const defaultConfig = {
  tenant_id: '',
  openwa_base_url: '',
  openwa_api_key: '',
  openwa_session_id: 'default',
  openwa_webhook_secret: '',
  openwa_enabled: false,
  openwa_last_connection_state: null,
  openwa_last_tested_at: null,
  webhook_url: null,
};

const formatDate = (value) => {
  if (!value) return 'Sin registro';
  try {
    return new Date(value).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
};

const createSecret = () => {
  const values = new Uint8Array(24);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
};

export const OpenWAPage = () => {
  const { api } = useAuth();
  const [config, setConfig] = useState(defaultConfig);
  const [stats, setStats] = useState({ total: 0, inbound: 0, outbound: 0 });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [testMessage, setTestMessage] = useState({
    phone_number: '',
    message: 'Hola, esta es una prueba desde Rovi OpenWA.',
  });

  const fallbackWebhookUrl = useMemo(() => {
    if (!config.tenant_id) return '';
    return `${window.location.origin}/api/webhooks/openwa/${config.tenant_id}`;
  }, [config.tenant_id]);

  const webhookUrl = config.webhook_url || fallbackWebhookUrl;
  const normalizedConnectionState = String(config.openwa_last_connection_state || '').trim().toUpperCase();
  const isConnected = normalizedConnectionState === 'CONNECTED';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/openwa/dashboard');
      setConfig({ ...defaultConfig, ...(response.data.config || {}) });
      setStats(response.data.stats || { total: 0, inbound: 0, outbound: 0 });
      setRecords(response.data.recent_records || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar OpenWA');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await api.put('/openwa/settings', {
        openwa_base_url: config.openwa_base_url,
        openwa_api_key: config.openwa_api_key,
        openwa_session_id: config.openwa_session_id || 'default',
        openwa_webhook_secret: config.openwa_webhook_secret,
        openwa_enabled: config.openwa_enabled,
      });
      setConfig((prev) => ({ ...prev, ...(response.data.config || {}) }));
      toast.success('OpenWA actualizado');
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar OpenWA');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await api.post('/openwa/test-connection');
      toast.success(response.data.message || 'OpenWA conectado');
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'OpenWA no respondió');
    } finally {
      setTesting(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.phone_number.trim() || !testMessage.message.trim()) {
      toast.error('Completa teléfono y mensaje');
      return;
    }
    setSending(true);
    try {
      await api.post('/openwa/send-test', testMessage);
      toast.success('Mensaje enviado');
      setTestMessage((prev) => ({ ...prev, message: '' }));
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const copyValue = async (value, label) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OpenWA</h1>
              <p className="text-sm text-muted-foreground">Gestión de WhatsApp Web para este workspace</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboard}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Canal</p>
              <p className="text-xl font-semibold">{config.openwa_enabled ? 'Activo' : 'Pausado'}</p>
            </div>
            {config.openwa_enabled ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-muted-foreground" />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Sesión</p>
              <p className="text-xl font-semibold">{isConnected ? 'Conectada' : config.openwa_last_connection_state || 'Sin prueba'}</p>
            </div>
            <Smartphone className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Entrantes</p>
              <p className="text-xl font-semibold">{stats.inbound}</p>
            </div>
            <Activity className="h-6 w-6 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Salientes</p>
              <p className="text-xl font-semibold">{stats.outbound}</p>
            </div>
            <Send className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4" />
                Configuración
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="openwa-enabled" className="text-sm">Activo</Label>
                <Switch
                  id="openwa-enabled"
                  checked={config.openwa_enabled}
                  onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, openwa_enabled: checked }))}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>URL base</Label>
                <Input
                  value={config.openwa_base_url}
                  onChange={(event) => setConfig((prev) => ({ ...prev, openwa_base_url: event.target.value }))}
                  placeholder="http://openwa:8080"
                />
              </div>
              <div className="space-y-2">
                <Label>Sesión</Label>
                <Input
                  value={config.openwa_session_id}
                  onChange={(event) => setConfig((prev) => ({ ...prev, openwa_session_id: event.target.value }))}
                  placeholder="default"
                />
              </div>
              <div className="space-y-2">
                <Label>API key</Label>
                <Input
                  type="password"
                  value={config.openwa_api_key}
                  onChange={(event) => setConfig((prev) => ({ ...prev, openwa_api_key: event.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Webhook secret</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfig((prev) => ({ ...prev, openwa_webhook_secret: createSecret() }))}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Generar
                  </Button>
                </div>
                <Input
                  type="password"
                  value={config.openwa_webhook_secret}
                  onChange={(event) => setConfig((prev) => ({ ...prev, openwa_webhook_secret: event.target.value }))}
                  placeholder="Secreto para webhooks"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Webhook className="h-4 w-4" />
                  Webhook
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => copyValue(webhookUrl, 'Webhook')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>
              <code className="block break-all rounded-md bg-background px-3 py-2 text-xs text-muted-foreground">
                {webhookUrl || 'Configura PUBLIC_API_BASE_URL para publicar webhooks'}
              </code>
            </div>

            <Button variant="outline" onClick={testConnection} disabled={testing || !config.openwa_base_url}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Probar conexión
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4" />
                Prueba de envío
              </CardTitle>
              <Badge variant={config.openwa_enabled ? 'default' : 'secondary'}>
                {config.openwa_enabled ? 'Disponible' : 'Pausado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={testMessage.phone_number}
                onChange={(event) => setTestMessage((prev) => ({ ...prev, phone_number: event.target.value }))}
                placeholder="+5219840000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensaje</Label>
              <Textarea
                value={testMessage.message}
                onChange={(event) => setTestMessage((prev) => ({ ...prev, message: event.target.value }))}
                rows={5}
              />
            </div>
            <Button className="w-full" onClick={sendTestMessage} disabled={sending || !config.openwa_enabled}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar prueba
            </Button>
            <p className="text-xs text-muted-foreground">
              Última prueba: {formatDate(config.openwa_last_tested_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos mensajes OpenWA</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Sin mensajes OpenWA
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(record.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={record.direction === 'inbound' ? 'secondary' : 'outline'}>
                        {record.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.lead_name || record.lead_id}</TableCell>
                    <TableCell className="whitespace-nowrap">{record.phone_number}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{record.message}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'failed' ? 'destructive' : 'secondary'}>{record.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

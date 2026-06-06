import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { 
  Settings, User, Target, Moon, Sun, Save, Loader2, 
  Phone, MessageSquare, CheckCircle, XCircle, Eye, EyeOff,
  TestTube, Zap, Mail, Calendar, ExternalLink, Unlink,
  Smartphone, QrCode, Copy, RefreshCw, Bot, Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const integrationDocs = {
  twilioConsole: 'https://console.twilio.com',
  twilioCredentials: 'https://www.twilio.com/docs/twilio-cli/general-usage/profiles',
  twilioPhoneNumbers: 'https://www.twilio.com/docs/phone-numbers',
  twilioWhatsappSandbox: 'https://www.twilio.com/docs/whatsapp/sandbox',
  twilioWhatsappSelfSignup: 'https://www.twilio.com/docs/whatsapp/self-sign-up',
  sendgridApi: 'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/api-getting-started',
  sendgridSingleSender: 'https://www.twilio.com/docs/sendgrid/ui/sending-email/sender-verification',
  sendgridDomainAuth: 'https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication',
  sendgridConsoleApiKeys: 'https://app.sendgrid.com/settings/api_keys',
  sendgridConsoleSenderAuth: 'https://app.sendgrid.com/settings/sender_auth',
  vapiDashboard: 'https://dashboard.vapi.ai',
  vapiApiKey: 'https://docs.vapi.ai/chat/quickstart',
  vapiAssistants: 'https://docs.vapi.ai/assistants/quickstart',
  vapiPhoneNumbers: 'https://docs.vapi.ai/phone-calling',
};

const DocLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
  >
    {children}
    <ExternalLink className="w-3 h-3" />
  </a>
);

export const SettingsPage = () => {
  const { api, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [testingVapi, setTestingVapi] = useState(false);
  const [testingTwilio, setTestingTwilio] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [deviceLinks, setDeviceLinks] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [creatingQr, setCreatingQr] = useState(false);
  const [qrSession, setQrSession] = useState(null);
  const [deviceProfileName, setDeviceProfileName] = useState('');
  const [telegramProfiles, setTelegramProfiles] = useState([]);
  const [telegramAgentsLoading, setTelegramAgentsLoading] = useState(false);
  const [savingTelegramProfile, setSavingTelegramProfile] = useState(null);
  const [linkingTelegramProfile, setLinkingTelegramProfile] = useState(null);
  const [settingTelegramWebhook, setSettingTelegramWebhook] = useState(null);
  const [testingTelegramProfile, setTestingTelegramProfile] = useState(null);
  const [telegramLinkResults, setTelegramLinkResults] = useState({});
  
  const [goals, setGoals] = useState({
    ventas_mes: 5,
    ingresos_objetivo: 500000,
    leads_contactados: 50,
    tasa_conversion: 10,
    apartados_mes: 10,
    periodo: 'mensual',
  });

  const [integrations, setIntegrations] = useState({
    vapi_api_key: '',
    vapi_phone_number_id: '',
    vapi_assistant_id: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    twilio_whatsapp_number: '',
    sendgrid_api_key: '',
    sendgrid_sender_email: '',
    sendgrid_sender_name: '',
    google_client_id: '',
    google_client_secret: '',
    google_calendar_email: null,
    vapi_enabled: false,
    twilio_enabled: false,
    twilio_whatsapp_enabled: false,
    sendgrid_enabled: false,
    google_calendar_enabled: false
  });

  useEffect(() => {
    loadGoals();
    loadIntegrations();
    loadDeviceLinks();
    loadTelegramAgentProfiles();
    const requestedTab = searchParams.get('tab');
    if (['integrations', 'devices', 'telegram-agents'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
    
    // Check for Google OAuth callback
    const googleConnected = searchParams.get('google_connected');
    const googleEmail = searchParams.get('email');
    const error = searchParams.get('error');
    
    if (googleConnected === 'true') {
      toast.success(`Google Calendar conectado: ${googleEmail}`);
      loadIntegrations();
    }
    if (error) {
      toast.error(`Error al conectar Google: ${error}`);
    }
  }, [searchParams]);

  const loadGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadIntegrations = async () => {
    try {
      const res = await api.get('/settings/integrations');
      setIntegrations(res.data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  };

  const loadDeviceLinks = async () => {
    setDevicesLoading(true);
    try {
      const res = await api.get('/device-links');
      setDeviceLinks(res.data.links || []);
    } catch (error) {
      console.error('Error loading device links:', error);
    } finally {
      setDevicesLoading(false);
    }
  };

  const loadTelegramAgentProfiles = async () => {
    setTelegramAgentsLoading(true);
    try {
      const res = await api.get('/telegram-agents/profiles');
      setTelegramProfiles(res.data.profiles || []);
    } catch (error) {
      console.error('Error loading Telegram agent profiles:', error);
    } finally {
      setTelegramAgentsLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    setLoading(true);
    try {
      await api.post('/goals', goals);
      toast.success('Metas actualizadas');
    } catch (error) {
      toast.error('Error al guardar metas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.put('/settings/integrations', integrations);
      toast.success('Integraciones actualizadas');
      setIntegrations(prev => ({
        ...prev,
        vapi_enabled: res.data.vapi_enabled,
        twilio_enabled: res.data.twilio_enabled,
        twilio_whatsapp_enabled: res.data.twilio_whatsapp_enabled,
        sendgrid_enabled: res.data.sendgrid_enabled
      }));
      loadIntegrations();
    } catch (error) {
      toast.error('Error al guardar integraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleTestVapi = async () => {
    setTestingVapi(true);
    try {
      await api.post('/settings/integrations/test-vapi');
      toast.success('Conexión VAPI exitosa');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error de conexión VAPI');
    } finally {
      setTestingVapi(false);
    }
  };

  const handleTestTwilio = async () => {
    setTestingTwilio(true);
    try {
      const res = await api.post('/settings/integrations/test-twilio');
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error de conexión Twilio');
    } finally {
      setTestingTwilio(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    try {
      const res = await api.post('/settings/integrations/test-whatsapp');
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error de conexión WhatsApp');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleTestSendgrid = async () => {
    setTestingSendgrid(true);
    try {
      const res = await api.post('/settings/integrations/test-sendgrid');
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error de conexión SendGrid');
    } finally {
      setTestingSendgrid(false);
    }
  };

  const handleConnectGoogle = async () => {
    // First save credentials if changed
    if (integrations.google_client_id && integrations.google_client_secret && 
        !integrations.google_client_id.includes('••••')) {
      await handleSaveIntegrations();
    }
    
    setConnectingGoogle(true);
    try {
      const res = await api.get('/oauth/google/login');
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al conectar Google Calendar');
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await api.post('/oauth/google/disconnect');
      setIntegrations(prev => ({
        ...prev,
        google_calendar_enabled: false,
        google_calendar_email: null
      }));
      toast.success('Google Calendar desconectado');
    } catch (error) {
      toast.error('Error al desconectar');
    }
  };

  const openCampaignActivationGuide = () => {
    window.open('/campaign-activation-dashboard.html', '_blank', 'noopener,noreferrer');
  };

  const handleCreateTelegramQr = async () => {
    setCreatingQr(true);
    try {
      const res = await api.post('/device-links/telegram/qr-session', {
        hermes_profile_name: deviceProfileName,
        ttl_minutes: 10,
      });
      setQrSession(res.data);
      toast.success('QR de vinculación generado');
      loadDeviceLinks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude crear el QR de vinculación');
    } finally {
      setCreatingQr(false);
    }
  };

  const handleRevokeDeviceLink = async (linkId) => {
    try {
      await api.post(`/device-links/${linkId}/revoke`);
      toast.success('Dispositivo desvinculado');
      if (qrSession?.id === linkId) setQrSession(null);
      loadDeviceLinks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude desvincular el dispositivo');
    }
  };

  const updateTelegramProfile = (profileId, patch) => {
    setTelegramProfiles((current) => current.map((profile) => (
      profile.id === profileId ? { ...profile, ...patch } : profile
    )));
  };

  const saveTelegramProfile = async (profile) => {
    setSavingTelegramProfile(profile.id);
    try {
      const res = await api.put(`/telegram-agents/profiles/${profile.id}`, {
        role_scope: profile.role_scope,
        name: profile.name,
        description: profile.description,
        system_prompt: profile.system_prompt,
        bot_username: profile.bot_username,
        telegram_bot_token: profile.telegram_bot_token_input || '',
        is_active: profile.is_active,
      });
      setTelegramProfiles((current) => current.map((item) => (
        item.id === profile.id ? res.data.profile : item
      )));
      toast.success('Agente Telegram guardado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude guardar el agente Telegram');
    } finally {
      setSavingTelegramProfile(null);
    }
  };

  const createTelegramAgentLink = async (profile) => {
    setLinkingTelegramProfile(profile.id);
    try {
      const res = await api.post(`/telegram-agents/profiles/${profile.id}/link-code`, { ttl_minutes: 30 });
      setTelegramLinkResults((current) => ({ ...current, [profile.id]: res.data }));
      toast.success('Link de Telegram generado');
      loadTelegramAgentProfiles();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude generar el link');
    } finally {
      setLinkingTelegramProfile(null);
    }
  };

  const setTelegramWebhook = async (profile) => {
    const defaultBaseUrl = window.location.origin.startsWith('http://localhost')
      ? 'https://dev.rovicrm.com'
      : window.location.origin;
    const publicBaseUrl = window.prompt('URL pública HTTPS del entorno para Telegram', defaultBaseUrl);
    if (!publicBaseUrl) return;
    setSettingTelegramWebhook(profile.id);
    try {
      const res = await api.post(`/telegram-agents/profiles/${profile.id}/set-webhook`, {
        public_base_url: publicBaseUrl,
      });
      toast.success('Webhook de Telegram configurado');
      updateTelegramProfile(profile.id, { telegram_webhook_url: res.data.webhook_url });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude configurar el webhook');
    } finally {
      setSettingTelegramWebhook(null);
    }
  };

  const testTelegramAgent = async (profile) => {
    const chatId = window.prompt('Chat ID de Telegram opcional. Déjalo vacío para usar el último vínculo activo.', '');
    if (chatId === null) return;
    setTestingTelegramProfile(profile.id);
    try {
      await api.post(`/telegram-agents/profiles/${profile.id}/test-message`, {
        chat_id: chatId,
        message: `Prueba desde ROVI: ${profile.name} está conectado.`,
      });
      toast.success('Mensaje de prueba enviado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude enviar el mensaje de prueba');
    } finally {
      setTestingTelegramProfile(null);
    }
  };

  const copyToClipboard = async (value, message = 'Copiado') => {
    try {
      await navigator.clipboard?.writeText(value);
      toast.success(message);
    } catch {
      toast.error('No pude copiar al portapapeles');
    }
  };

  const getDeviceStatusBadge = (status) => {
    const active = status === 'active';
    const warning = ['pending', 'awaiting_contact', 'pending_email_confirmation'].includes(status);
    return (
      <Badge variant={active ? 'default' : 'secondary'} className={warning ? 'border-amber-500/30 text-amber-600' : ''}>
        {active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
        {status || 'pending'}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Personaliza tu experiencia e integraciones</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Dispositivos</span>
          </TabsTrigger>
          <TabsTrigger value="telegram-agents" className="gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Agentes Telegram</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Integraciones</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Profile */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Perfil</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Tu información de cuenta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Nombre</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Rol</Label>
                  <Input value={user?.role || ''} disabled className="capitalize" />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-accent" />}
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Apariencia</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Personaliza el tema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Modo Oscuro</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Cambia entre tema claro y oscuro
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                    data-testid="theme-switch"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Metas y KPIs</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Define tus objetivos mensuales</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Ventas por mes</Label>
                    <Input
                      type="number"
                      value={goals.ventas_mes}
                      onChange={(e) => setGoals({ ...goals, ventas_mes: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Apartados por mes</Label>
                    <Input
                      type="number"
                      value={goals.apartados_mes}
                      onChange={(e) => setGoals({ ...goals, apartados_mes: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Leads a contactar</Label>
                    <Input
                      type="number"
                      value={goals.leads_contactados}
                      onChange={(e) => setGoals({ ...goals, leads_contactados: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Ingresos objetivo (MXN)</Label>
                    <Input
                      type="number"
                      value={goals.ingresos_objetivo}
                      onChange={(e) => setGoals({ ...goals, ingresos_objetivo: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={50000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Tasa de conversión objetivo (%)</Label>
                    <Input
                      type="number"
                      value={goals.tasa_conversion}
                      onChange={(e) => setGoals({ ...goals, tasa_conversion: parseFloat(e.target.value) || 0 })}
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveGoals} disabled={loading} className="rounded-full w-full sm:w-auto">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Metas
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Connected Devices */}
        <TabsContent value="devices" className="space-y-4 sm:space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Vincular Telegram con Hermes</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Genera un QR para conectar este usuario ROVI con un profile Hermes y activar su agente por rol.
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={loadDeviceLinks} disabled={devicesLoading} className="rounded-full">
                  {devicesLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm">Profile Hermes opcional</Label>
                        <Input
                          value={deviceProfileName}
                          onChange={(e) => setDeviceProfileName(e.target.value)}
                          placeholder="rovi-broker-carlos"
                        />
                        <p className="text-xs text-muted-foreground">
                          Si lo dejas vacío, ROVI crea un nombre seguro basado en tu rol y cuenta.
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Validación</p>
                        <p>El bot Hermes debe pedir compartir contacto en Telegram. ROVI activa el profile solo si el teléfono coincide con tu cuenta.</p>
                      </div>
                    </div>
                    <Button onClick={handleCreateTelegramQr} disabled={creatingQr} className="rounded-full w-full sm:w-auto">
                      {creatingQr ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                      Generar QR Telegram
                    </Button>
                  </div>

                  {qrSession && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">QR listo para Telegram</p>
                          <p className="text-xs text-muted-foreground">
                            Expira: {qrSession.expires_at ? new Date(qrSession.expires_at).toLocaleString('es-MX') : '10 minutos'}
                          </p>
                        </div>
                        {getDeviceStatusBadge(qrSession.status)}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-[180px,1fr] sm:items-center">
                        <div className="rounded-xl bg-white p-3">
                          <img src={qrSession.qr_url} alt="QR para vincular Telegram" className="w-full h-auto" />
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Escanea el QR desde Telegram o abre el link para iniciar el bot Hermes con el código de vínculo.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(qrSession.telegram_deep_link, 'Link de Telegram copiado')}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar link
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(qrSession.code, 'Código copiado')}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar código
                            </Button>
                          </div>
                          <code className="block rounded-lg bg-muted p-2 text-xs break-all">{qrSession.telegram_deep_link}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">Cuenta activa</CardTitle>
                    <CardDescription className="text-xs">Datos usados para validar el dispositivo.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{user?.email || 'Sin email'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{user?.phone || 'Sin teléfono registrado'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rol</p>
                      <p className="font-medium">{user?.active_workspace?.role || user?.role || 'broker'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Dispositivos vinculados</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Profiles Hermes y sesiones Telegram asociadas a tu workspace activo.</CardDescription>
                </div>
                {devicesLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {deviceLinks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Aún no hay dispositivos vinculados.
                </div>
              ) : (
                <div className="space-y-3">
                  {deviceLinks.map((link) => (
                    <div key={link.id} className="rounded-2xl border border-border/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{link.hermes_profile_name || 'Profile Hermes pendiente'}</p>
                            {getDeviceStatusBadge(link.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {link.channel} · {link.role_scope || link.role} · {link.link_method} · creado {link.created_at ? new Date(link.created_at).toLocaleString('es-MX') : ''}
                          </p>
                          {link.telegram?.username && (
                            <p className="text-xs text-muted-foreground">Telegram: @{link.telegram.username}</p>
                          )}
                          {link.hermes_profile?.profile_dir && (
                            <code className="block rounded bg-muted p-2 text-xs break-all">{link.hermes_profile.profile_dir}</code>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleRevokeDeviceLink(link.id)} className="text-red-500 hover:text-red-600">
                          <Unlink className="w-4 h-4 mr-2" />
                          Revocar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Agents */}
        <TabsContent value="telegram-agents" className="space-y-4 sm:space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Agentes por rol en Telegram</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Configura un bot y un perfil de comportamiento separado para broker o inmobiliaria según tu workspace activo.
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={loadTelegramAgentProfiles} disabled={telegramAgentsLoading} className="rounded-full">
                  {telegramAgentsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Actualizar
                </Button>
              </div>
            </CardHeader>
          </Card>

          {telegramProfiles.length === 0 && !telegramAgentsLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No hay perfiles Telegram para este rol.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {telegramProfiles.map((profile) => {
                const linkResult = telegramLinkResults[profile.id];
                const roleLabel = profile.role_scope === 'agency_admin' ? 'Inmobiliaria' : 'Broker';
                return (
                  <Card key={profile.id}>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base sm:text-lg">{profile.name}</CardTitle>
                            <Badge variant="secondary">{roleLabel}</Badge>
                            <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                              {profile.is_active ? 'Activo' : 'Pausado'}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs sm:text-sm mt-1">
                            {profile.description || 'Perfil operativo conectado a Telegram.'}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => createTelegramAgentLink(profile)} disabled={linkingTelegramProfile === profile.id}>
                            {linkingTelegramProfile === profile.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                            Link
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setTelegramWebhook(profile)} disabled={settingTelegramWebhook === profile.id || !profile.has_bot_token}>
                            {settingTelegramWebhook === profile.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                            Webhook
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => testTelegramAgent(profile)} disabled={testingTelegramProfile === profile.id || !profile.has_bot_token}>
                            {testingTelegramProfile === profile.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Probar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Nombre del perfil</Label>
                          <Input
                            value={profile.name || ''}
                            onChange={(e) => updateTelegramProfile(profile.id, { name: e.target.value })}
                            placeholder="Agente Broker ROVI"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Usuario del bot</Label>
                          <Input
                            value={profile.bot_username || ''}
                            onChange={(e) => updateTelegramProfile(profile.id, { bot_username: e.target.value })}
                            placeholder="@RoviBrokerBot"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm">Descripción interna</Label>
                          <Input
                            value={profile.description || ''}
                            onChange={(e) => updateTelegramProfile(profile.id, { description: e.target.value })}
                            placeholder="Qué hace este agente y para quién responde"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm">Token del bot</Label>
                          <Input
                            type="password"
                            value={profile.telegram_bot_token_input || ''}
                            onChange={(e) => updateTelegramProfile(profile.id, { telegram_bot_token_input: e.target.value })}
                            placeholder={profile.has_bot_token ? `Guardado ${profile.telegram_bot_token_masked}` : 'Pega aquí el token de BotFather'}
                          />
                          <p className="text-xs text-muted-foreground">
                            {profile.has_bot_token ? 'El token ya está guardado. Escribe uno nuevo solo si quieres reemplazarlo.' : 'Crea un bot en BotFather y pega el token para activar webhook y mensajes.'}
                          </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm">Profile prompt</Label>
                          <Textarea
                            rows={6}
                            value={profile.system_prompt || ''}
                            onChange={(e) => updateTelegramProfile(profile.id, { system_prompt: e.target.value })}
                            placeholder="Define personalidad, permisos y enfoque del agente"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{profile.active_links_count || 0} chats activos</span>
                          <span>{profile.pending_links_count || 0} links pendientes</span>
                          {profile.telegram_webhook_url && <span>Webhook configurado</span>}
                        </div>
                        <Button onClick={() => saveTelegramProfile(profile)} disabled={savingTelegramProfile === profile.id} className="rounded-full w-full sm:w-auto">
                          {savingTelegramProfile === profile.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Guardar agente
                        </Button>
                      </div>

                      {profile.telegram_webhook_url && (
                        <code className="block rounded-lg bg-muted p-2 text-xs break-all">{profile.telegram_webhook_url}</code>
                      )}

                      {linkResult && (
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium text-sm">Link de vinculación listo</p>
                              <p className="text-xs text-muted-foreground">
                                Expira: {linkResult.expires_at ? new Date(linkResult.expires_at).toLocaleString('es-MX') : '30 minutos'}
                              </p>
                            </div>
                            <Badge variant="secondary">{linkResult.status}</Badge>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-[150px,1fr] sm:items-center">
                            <div className="rounded-xl bg-white p-3">
                              <img src={linkResult.qr_url} alt="QR para agente Telegram" className="w-full h-auto" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(linkResult.telegram_deep_link, 'Link del agente copiado')}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar link
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(linkResult.code, 'Código del agente copiado')}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar código
                                </Button>
                              </div>
                              <code className="block rounded-lg bg-muted p-2 text-xs break-all">{linkResult.telegram_deep_link}</code>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4 sm:space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Guía interactiva de activación de campañas</p>
                <p className="text-sm text-muted-foreground">
                  Abre el dashboard HTML con checklist, comandos y paso a paso para dejar SendGrid, Twilio y WhatsApp listos.
                </p>
              </div>
              <Button variant="outline" onClick={openCampaignActivationGuide} className="rounded-full w-full sm:w-auto">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir guía
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* VAPI */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">VAPI</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Llamadas con IA</CardDescription>
                    </div>
                  </div>
                  <Badge variant={integrations.vapi_enabled ? "default" : "secondary"}>
                    {integrations.vapi_enabled ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Activo</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Inactivo</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2">
                  <p className="text-sm font-medium">Dónde sacar estos datos</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      <strong>API Key:</strong> entra a <DocLink href={integrationDocs.vapiDashboard}>dashboard.vapi.ai</DocLink>, abre tu perfil y entra a
                      {' '}<span className="font-medium text-foreground">Vapi API Keys</span>. La guía oficial lo muestra aquí:{' '}
                      <DocLink href={integrationDocs.vapiApiKey}>API key en quickstart</DocLink>.
                    </p>
                    <p>
                      <strong>Assistant ID:</strong> crea o abre tu asistente en <DocLink href={integrationDocs.vapiAssistants}>Assistants quickstart</DocLink>,
                      publícalo y copia el ID desde el detalle o la URL del asistente.
                    </p>
                    <p>
                      <strong>Phone Number ID:</strong> en <DocLink href={integrationDocs.vapiPhoneNumbers}>Phone Calling</DocLink> crea un número gratis en EE. UU.
                      o importa uno desde Twilio y copia el ID del número en su detalle.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">API Key</Label>
                  <div className="relative">
                    <Input
                      type={showVapiKey ? "text" : "password"}
                      value={integrations.vapi_api_key}
                      onChange={(e) => setIntegrations({ ...integrations, vapi_api_key: e.target.value })}
                      placeholder="vapi_xxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowVapiKey(!showVapiKey)}
                    >
                      {showVapiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Phone Number ID</Label>
                  <Input
                    value={integrations.vapi_phone_number_id}
                    onChange={(e) => setIntegrations({ ...integrations, vapi_phone_number_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Assistant ID</Label>
                  <Input
                    value={integrations.vapi_assistant_id}
                    onChange={(e) => setIntegrations({ ...integrations, vapi_assistant_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestVapi}
                  disabled={testingVapi || !integrations.vapi_api_key}
                  className="w-full"
                >
                  {testingVapi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Probar Conexión
                </Button>
              </CardContent>
            </Card>

            {/* Twilio */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Twilio</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">SMS + WhatsApp</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integrations.twilio_enabled ? "default" : "secondary"}>
                      {integrations.twilio_enabled ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> SMS</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> SMS</>
                      )}
                    </Badge>
                    <Badge variant={integrations.twilio_whatsapp_enabled ? "default" : "secondary"}>
                      {integrations.twilio_whatsapp_enabled ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> WhatsApp</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> WhatsApp</>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2">
                  <p className="text-sm font-medium">Dónde sacar estos datos</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      <strong>Account SID y Auth Token:</strong> están en la primera pantalla de <DocLink href={integrationDocs.twilioConsole}>Twilio Console</DocLink>,
                      dentro de <span className="font-medium text-foreground">Account Info</span>. Referencia oficial:{' '}
                      <DocLink href={integrationDocs.twilioCredentials}>Account SID / Auth Token</DocLink>.
                    </p>
                    <p>
                      <strong>Número SMS:</strong> consíguelo comprando o administrando un número con capacidad SMS desde la consola. Guía oficial:{' '}
                      <DocLink href={integrationDocs.twilioPhoneNumbers}>Phone Numbers</DocLink>.
                    </p>
                    <p>
                      <strong>Número WhatsApp:</strong> para pruebas rápidas usa el Sandbox; para producción registra un sender propio con Self Sign-up.
                      {' '}<DocLink href={integrationDocs.twilioWhatsappSandbox}>Sandbox</DocLink>
                      {' · '}
                      <DocLink href={integrationDocs.twilioWhatsappSelfSignup}>Self Sign-up</DocLink>
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Account SID</Label>
                  <Input
                    value={integrations.twilio_account_sid}
                    onChange={(e) => setIntegrations({ ...integrations, twilio_account_sid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Debe empezar con <code>AC</code>. Si empieza con <code>SK</code>, eso es una API Key SID y no va en este campo.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Auth Token</Label>
                  <div className="relative">
                    <Input
                      type={showTwilioToken ? "text" : "password"}
                      value={integrations.twilio_auth_token}
                      onChange={(e) => setIntegrations({ ...integrations, twilio_auth_token: e.target.value })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowTwilioToken(!showTwilioToken)}
                    >
                      {showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usa el <strong>Auth Token</strong> del proyecto en Twilio Console. No pegues aquí una API Key SID.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Número de Teléfono</Label>
                  <Input
                    value={integrations.twilio_phone_number}
                    onChange={(e) => setIntegrations({ ...integrations, twilio_phone_number: e.target.value })}
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa un número Twilio con capacidad SMS. Si tu país exige verificación o bundle regulatorio, complétalo antes de enviar.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Número de WhatsApp en Twilio</Label>
                  <Input
                    value={integrations.twilio_whatsapp_number}
                    onChange={(e) => setIntegrations({ ...integrations, twilio_whatsapp_number: e.target.value })}
                    placeholder="whatsapp:+14155238886 o +521..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa el sender aprobado por Twilio para WhatsApp. Puedes pegarlo con o sin prefijo <code>whatsapp:</code>.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTestTwilio}
                    disabled={testingTwilio || !integrations.twilio_account_sid}
                    className="w-full"
                  >
                    {testingTwilio ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                    Probar SMS/Twilio
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTestWhatsApp}
                    disabled={testingWhatsApp || !integrations.twilio_account_sid || !integrations.twilio_whatsapp_number}
                    className="w-full"
                  >
                    {testingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    Probar WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SendGrid */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">SendGrid</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Email Marketing</CardDescription>
                    </div>
                  </div>
                  <Badge variant={integrations.sendgrid_enabled ? "default" : "secondary"}>
                    {integrations.sendgrid_enabled ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Activo</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Inactivo</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 space-y-2 mb-4">
                  <p className="text-sm font-medium">Dónde sacar estos datos</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      <strong>API Key:</strong> en el panel de SendGrid entra a <span className="font-medium text-foreground">Settings → API Keys</span> y crea una key de envío.
                      Guía oficial:{' '}
                      <DocLink href={integrationDocs.sendgridApi}>API getting started</DocLink>
                      {' · '}
                      <DocLink href={integrationDocs.sendgridConsoleApiKeys}>Abrir API Keys</DocLink>
                    </p>
                    <p>
                      <strong>Email remitente:</strong> para pruebas usa Single Sender Verification; para producción conviene Domain Authentication.
                      {' '}<DocLink href={integrationDocs.sendgridSingleSender}>Single Sender</DocLink>
                      {' · '}
                      <DocLink href={integrationDocs.sendgridDomainAuth}>Domain Authentication</DocLink>
                    </p>
                    <p>
                      <strong>Nombre remitente:</strong> es el nombre visible para el destinatario. Usa tu marca o equipo comercial.
                      {' '}<DocLink href={integrationDocs.sendgridConsoleSenderAuth}>Sender Authentication</DocLink>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">API Key</Label>
                    <div className="relative">
                      <Input
                        type={showSendgridKey ? "text" : "password"}
                        value={integrations.sendgrid_api_key}
                        onChange={(e) => setIntegrations({ ...integrations, sendgrid_api_key: e.target.value })}
                        placeholder="SG.xxxxxxxxxxxx"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowSendgridKey(!showSendgridKey)}
                      >
                        {showSendgridKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Email Remitente</Label>
                    <Input
                      type="email"
                      value={integrations.sendgrid_sender_email}
                      onChange={(e) => setIntegrations({ ...integrations, sendgrid_sender_email: e.target.value })}
                      placeholder="ventas@tudominio.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Nombre Remitente</Label>
                    <Input
                      value={integrations.sendgrid_sender_name}
                      onChange={(e) => setIntegrations({ ...integrations, sendgrid_sender_name: e.target.value })}
                      placeholder="Rovi"
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestSendgrid}
                  disabled={testingSendgrid || !integrations.sendgrid_api_key}
                  className="w-full mt-4"
                >
                  {testingSendgrid ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Probar Conexión
                </Button>
              </CardContent>
            </Card>

            {/* Google Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">Google Calendar</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Sincroniza tu calendario</CardDescription>
                    </div>
                  </div>
                  <Badge variant={integrations.google_calendar_enabled ? "default" : "secondary"}>
                    {integrations.google_calendar_enabled ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Conectado</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> No conectado</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {integrations.google_calendar_enabled ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Conectado a Google Calendar</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cuenta: {integrations.google_calendar_email}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDisconnectGoogle}
                      className="w-full text-red-500 hover:text-red-600"
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Desconectar Google Calendar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Conecta tu cuenta de Google para sincronizar eventos entre Rovi y Google Calendar.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Client ID</Label>
                        <Input
                          value={integrations.google_client_id}
                          onChange={(e) => setIntegrations({ ...integrations, google_client_id: e.target.value })}
                          placeholder="xxxxx.apps.googleusercontent.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Client Secret</Label>
                        <div className="relative">
                          <Input
                            type={showGoogleSecret ? "text" : "password"}
                            value={integrations.google_client_secret}
                            onChange={(e) => setIntegrations({ ...integrations, google_client_secret: e.target.value })}
                            placeholder="GOCSPX-xxxxxxxxxxxx"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                          >
                            {showGoogleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      <p className="font-medium mb-1">¿Cómo obtener las credenciales?</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Ve a <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                        <li>Crea un proyecto o selecciona uno existente</li>
                        <li>Habilita la API de Google Calendar</li>
                        <li>Crea credenciales OAuth 2.0</li>
                        <li>Agrega el URI de redirección: <code className="bg-muted p-1 rounded">{window.location.origin}/api/oauth/google/callback</code></li>
                      </ol>
                    </div>
                    <Button 
                      onClick={handleConnectGoogle}
                      disabled={connectingGoogle || !integrations.google_client_id || !integrations.google_client_secret}
                      className="w-full"
                    >
                      {connectingGoogle ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Conectar con Google
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm sm:text-base">Guardar Configuración de Integraciones</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Las credenciales se guardan de forma segura
                  </p>
                </div>
                <Button onClick={handleSaveIntegrations} disabled={loading} className="rounded-full w-full sm:w-auto">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Integraciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

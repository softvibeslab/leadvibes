import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { 
  Settings, User, Target, Moon, Sun, Save, Loader2, 
  Phone, MessageSquare, CheckCircle, XCircle, Eye, EyeOff,
  TestTube, Zap, Mail, Calendar, ExternalLink, Unlink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { api, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [testingVapi, setTestingVapi] = useState(false);
  const [testingTwilio, setTestingTwilio] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [showVapiKey, setShowVapiKey] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  
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
    sendgrid_api_key: '',
    sendgrid_sender_email: '',
    sendgrid_sender_name: '',
    google_client_id: '',
    google_client_secret: '',
    google_calendar_email: null,
    vapi_enabled: false,
    twilio_enabled: false,
    sendgrid_enabled: false,
    google_calendar_enabled: false
  });

  useEffect(() => {
    loadGoals();
    loadIntegrations();
    
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Personaliza tu experiencia e integraciones</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
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

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4 sm:space-y-6">
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
                      <CardDescription className="text-xs sm:text-sm">SMS Masivos</CardDescription>
                    </div>
                  </div>
                  <Badge variant={integrations.twilio_enabled ? "default" : "secondary"}>
                    {integrations.twilio_enabled ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Activo</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Inactivo</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Account SID</Label>
                  <Input
                    value={integrations.twilio_account_sid}
                    onChange={(e) => setIntegrations({ ...integrations, twilio_account_sid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
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
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Número de Teléfono</Label>
                  <Input
                    value={integrations.twilio_phone_number}
                    onChange={(e) => setIntegrations({ ...integrations, twilio_phone_number: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestTwilio}
                  disabled={testingTwilio || !integrations.twilio_account_sid}
                  className="w-full"
                >
                  {testingTwilio ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Probar Conexión
                </Button>
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

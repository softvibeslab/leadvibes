import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FolderKanban,
  KeyRound,
  Link2,
  ListChecks,
  Loader2,
  MessageCircle,
  Package,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (error?.message) return error.message;
  return fallback;
};

const statusConfig = {
  pending: {
    label: 'Esperando escaneo',
    tone: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
    icon: Clock3,
  },
  scanned: {
    label: 'Telegram detectado',
    tone: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
    icon: Smartphone,
  },
  contact_verified: {
    label: 'Contacto validado',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    icon: ShieldCheck,
  },
  active: {
    label: 'Conectado',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expirado',
    tone: 'border-muted bg-muted text-muted-foreground',
    icon: XCircle,
  },
  revoked: {
    label: 'Revocado',
    tone: 'border-destructive/30 bg-destructive/10 text-destructive',
    icon: XCircle,
  },
};

const getStatusConfig = (status) => statusConfig[status] || {
  label: status || 'Sin estado',
  tone: 'border-border bg-muted text-muted-foreground',
  icon: Clock3,
};

const formatDateTime = (value) => {
  if (!value) return 'Pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pendiente';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const roleCopy = {
  broker: {
    label: 'Broker',
    profile: 'rovi-broker',
    scope: 'Leads, tareas y eventos del usuario activo',
  },
  agency_admin: {
    label: 'Administrador de inmobiliaria',
    profile: 'rovi-agency-admin',
    scope: 'Leads, tareas, eventos y propiedades del tenant',
  },
  manager: {
    label: 'Manager',
    profile: 'rovi-manager',
    scope: 'Datos del equipo asignado',
  },
};

const permissionGroups = [
  {
    title: 'Gestión diaria',
    items: [
      { icon: FolderKanban, label: 'Leads', value: 'Consultar, crear y actualizar con confirmación' },
      { icon: ListChecks, label: 'Tareas', value: 'Crear seguimiento, cambiar estado y reasignar según rol' },
      { icon: CalendarDays, label: 'Eventos', value: 'Agendar visitas, llamadas y recordatorios' },
      { icon: Package, label: 'Propiedades', value: 'Consultar inventario y actualizar campos permitidos' },
    ],
  },
  {
    title: 'Acciones protegidas',
    items: [
      { icon: ShieldCheck, label: 'Importaciones', value: 'Preview obligatorio antes de guardar' },
      { icon: KeyRound, label: 'Cambios masivos', value: 'Requieren aprobación explícita del usuario' },
    ],
  },
];

const importExamples = [
  { entity: 'Leads', sample: 'Juan Perez, 984 000 0000, busca penthouse en Tulum, presupuesto 8M' },
  { entity: 'Tareas', sample: 'Llamar a Ana mañana 10am; enviar ficha de Casa Selva a Luis' },
  { entity: 'Eventos', sample: 'Visita con Carlos el viernes a las 17:00 en Region 15' },
  { entity: 'Propiedades', sample: 'Casa 3 recamaras, Aldea Zama, 220 m2, $9,500,000 MXN' },
];

export const AIAgentsPage = () => {
  const { api, user } = useAuth();
  const [links, setLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('connection');
  const [busy, setBusy] = useState('');
  const [profileName, setProfileName] = useState('');
  const [importText, setImportText] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('leads');

  const activeWorkspace = user?.active_workspace;
  const roleScope = useMemo(() => {
    if (activeWorkspace?.role && ['admin', 'owner'].includes(activeWorkspace.role)) return 'agency_admin';
    if (user?.account_type === 'agency') return 'agency_admin';
    return activeWorkspace?.role === 'manager' ? 'manager' : 'broker';
  }, [activeWorkspace?.role, user?.account_type]);
  const role = roleCopy[roleScope] || roleCopy.broker;

  const latestLink = useMemo(() => {
    const active = links.find((link) => link.status === 'active');
    return active || links.find((link) => ['pending', 'scanned', 'contact_verified'].includes(link.status)) || links[0] || null;
  }, [links]);

  const loadLinks = useCallback(async () => {
    const response = await api.get('/device-links');
    setLinks(response.data?.links || []);
  }, [api]);

  useEffect(() => {
    void loadLinks().catch((error) => {
      toast.error(getErrorMessage(error, 'No se pudieron cargar las conexiones de agentes'));
    });
  }, [loadLinks]);

  useEffect(() => {
    const hasPendingLink = links.some((link) => ['pending', 'scanned', 'contact_verified'].includes(link.status));
    if (!hasPendingLink) return undefined;
    const timer = window.setInterval(() => {
      void loadLinks().catch(() => {});
    }, 2500);
    return () => window.clearInterval(timer);
  }, [links, loadLinks]);

  const createQrSession = async () => {
    setBusy('create-link');
    try {
      const response = await api.post('/device-links/telegram/qr-session', {
        hermes_profile_name: profileName || undefined,
        ttl_minutes: 10,
      });
      toast.success('QR generado para Telegram');
      setProfileName('');
      setLinks((current) => [response.data, ...current.filter((link) => link.id !== response.data.id)]);
      setActiveTab('connection');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo generar el QR'));
    } finally {
      setBusy('');
    }
  };

  const revokeLink = async (linkId) => {
    setBusy(`revoke-${linkId}`);
    try {
      await api.post(`/device-links/${linkId}/revoke`);
      toast.success('Conexión revocada');
      await loadLinks();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo revocar la conexión'));
    } finally {
      setBusy('');
    }
  };

  const openTelegram = () => {
    if (latestLink?.telegram_deep_link) {
      window.open(latestLink.telegram_deep_link, '_blank', 'noopener,noreferrer');
    }
  };

  const previewImport = () => {
    if (!importText.trim()) {
      toast.error('Agrega información para generar un preview');
      return;
    }
    toast.info('Preview conversacional listo para conectar con Agent Tools');
  };

  const StatusIcon = getStatusConfig(latestLink?.status).icon;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Agentes IA</h1>
                <p className="text-sm text-muted-foreground">
                  {role.label} · {activeWorkspace?.name || user?.name || 'Workspace activo'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadLinks()} disabled={busy === 'refresh'}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={createQrSession} disabled={busy === 'create-link'}>
              {busy === 'create-link' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
              Generar QR
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Agente Rovi</CardTitle>
                  <CardDescription>{role.scope}</CardDescription>
                </div>
                <Badge className={getStatusConfig(latestLink?.status).tone}>
                  <StatusIcon className="mr-1 h-3.5 w-3.5" />
                  {getStatusConfig(latestLink?.status).label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connection">Conexión</TabsTrigger>
                  <TabsTrigger value="permissions">Permisos</TabsTrigger>
                  <TabsTrigger value="imports">Importar</TabsTrigger>
                </TabsList>

                <TabsContent value="connection" className="mt-6">
                  <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex aspect-square items-center justify-center rounded-md border bg-background">
                        {latestLink?.qr_url ? (
                          <img
                            src={latestLink.qr_url}
                            alt="QR para vincular Telegram"
                            className="h-full w-full rounded-md object-contain p-4"
                          />
                        ) : (
                          <QrCode className="h-24 w-24 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={openTelegram} disabled={!latestLink?.telegram_deep_link}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Telegram
                        </Button>
                        <Button onClick={createQrSession} disabled={busy === 'create-link'}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Nuevo
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Código</p>
                          <p className="mt-2 font-mono text-2xl font-semibold tracking-wide">{latestLink?.code || 'Sin QR'}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Expira</p>
                          <p className="mt-2 text-sm font-medium">{formatDateTime(latestLink?.expires_at)}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          <p className="font-medium">Perfil Hermes</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <div>
                            <Label htmlFor="profile-name">Nombre de perfil</Label>
                            <Input
                              id="profile-name"
                              value={profileName}
                              onChange={(event) => setProfileName(event.target.value)}
                              placeholder={`${role.profile}-${user?.email?.split('@')[0] || 'usuario'}`}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button variant="outline" onClick={createQrSession} disabled={busy === 'create-link'}>
                              Guardar QR
                            </Button>
                          </div>
                        </div>
                        {latestLink?.hermes_profile_name && (
                          <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                            {latestLink.hermes_profile_name}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-4">
                        {['pending', 'scanned', 'contact_verified', 'active'].map((status) => {
                          const config = getStatusConfig(status);
                          const Icon = config.icon;
                          const isReached = status === latestLink?.status || latestLink?.status === 'active';
                          return (
                            <div key={status} className={`rounded-lg border p-3 ${isReached ? 'border-primary/30 bg-primary/5' : 'bg-muted/20'}`}>
                              <Icon className={`mb-2 h-4 w-4 ${isReached ? 'text-primary' : 'text-muted-foreground'}`} />
                              <p className="text-xs font-medium">{config.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="mt-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {permissionGroups.map((group) => (
                      <Card key={group.title}>
                        <CardHeader>
                          <CardTitle className="text-base">{group.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {group.items.map((item) => (
                            <div key={item.label} className="flex gap-3 rounded-lg border p-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="imports" className="mt-6">
                  <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="import-text">Información para importar</Label>
                        <Textarea
                          id="import-text"
                          value={importText}
                          onChange={(event) => setImportText(event.target.value)}
                          placeholder="Pega una lista, notas de WhatsApp, filas de Excel o texto libre."
                          className="min-h-48"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <Input
                          value={selectedEntity}
                          onChange={(event) => setSelectedEntity(event.target.value)}
                          placeholder="leads, tasks, events, properties"
                        />
                        <Button onClick={previewImport}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Generar preview
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {importExamples.map((item) => (
                        <button
                          type="button"
                          key={item.entity}
                          onClick={() => {
                            setSelectedEntity(item.entity.toLowerCase());
                            setImportText(item.sample);
                          }}
                          className="w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <p className="text-sm font-medium">{item.entity}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.sample}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conexiones</CardTitle>
                <CardDescription>{links.length} registros activos o recientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {links.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Sin conexiones todavía</p>
                  </div>
                ) : (
                  links.slice(0, 5).map((link) => {
                    const config = getStatusConfig(link.status);
                    const Icon = config.icon;
                    return (
                      <div key={link.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{link.hermes_profile_name || link.code}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(link.created_at)}</p>
                          </div>
                          <Badge className={config.tone}>
                            <Icon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        {link.status !== 'revoked' && (
                          <>
                            <Separator className="my-3" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-full text-destructive hover:text-destructive"
                              onClick={() => revokeLink(link.id)}
                              disabled={busy === `revoke-${link.id}`}
                            >
                              Revocar
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <p>El backend aplica tenant, usuario, rol y scopes antes de ejecutar acciones.</p>
                </div>
                <div className="flex gap-3">
                  <KeyRound className="mt-0.5 h-4 w-4 text-primary" />
                  <p>El perfil Hermes usa token revocable; no guarda contraseña del usuario.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Importaciones y cambios masivos quedan pendientes de confirmación.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

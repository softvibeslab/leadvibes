import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users, Phone, Video, ShoppingCart, Bookmark, Trophy, TrendingUp,
  Mail, MapPin, BarChart3, Plus, Pencil, Link2, UserX, UserCheck, ShieldAlert, Copy, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'broker',
  is_active: true,
};

const PAIRING_ROLE_OPTIONS = [
  { value: 'broker', label: 'Broker' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const buildPairingBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_PUBLIC_APP_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname, port, origin } = window.location;
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  if (isLocalHost) {
    return `http://${hostname}${port ? `:${port}` : ''}`;
  }

  if (protocol === 'https:' || protocol === 'http:') {
    return origin.replace(/\/$/, '');
  }

  return `https://${hostname}${port ? `:${port}` : ''}`;
};

const BrokerCard = ({ broker, onOpen, onEdit, onToggle, onUnlink, rank }) => {
  const medalTone = rank === 1 ? 'text-yellow-500 bg-yellow-500/10' : rank === 2 ? 'text-slate-400 bg-slate-400/10' : rank === 3 ? 'text-orange-400 bg-orange-400/10' : 'text-muted-foreground bg-muted/50';

  return (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={broker.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {broker.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {rank <= 3 && (
              <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ${medalTone}`}>
                <Trophy className="h-3 w-3" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="truncate font-semibold">{broker.name}</h3>
                <p className="truncate text-sm text-muted-foreground">{broker.email}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onOpen(broker)}>
                Ver
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={broker.membership_status === 'suspended' || !broker.is_active ? 'secondary' : 'default'}>
                {broker.membership_status === 'suspended' || !broker.is_active ? 'Suspendido' : 'Activo'}
              </Badge>
              <Badge variant="outline" className="capitalize">{broker.workspace_role || broker.role}</Badge>
              {broker.linked_via && <Badge variant="outline">{broker.linked_via}</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{broker.total_points || 0}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{broker.leads_asignados || 0}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{rank || '-'}</p>
            <p className="text-xs text-muted-foreground">Ranking</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(broker)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggle(broker)}>
            {broker.membership_status === 'suspended' || !broker.is_active ? <UserCheck className="mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
            {broker.membership_status === 'suspended' || !broker.is_active ? 'Activar' : 'Suspender'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onUnlink(broker)}>
            <UserX className="mr-2 h-4 w-4" />
            Desvincular
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BrokerFormDialog = ({ open, onOpenChange, form, setForm, onSave, saving, editing }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{editing ? 'Editar broker' : 'Nuevo broker'}</DialogTitle>
        <DialogDescription>
          {editing ? 'Actualiza el perfil y el rol del broker en tu inmobiliaria.' : 'Crea o vincula un broker directamente desde el roster.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" disabled={editing} value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Rol en inmobiliaria</Label>
          <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="broker">Broker</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
          <div>
            <p className="font-medium">Broker activo</p>
            <p className="text-sm text-muted-foreground">Controla si participa en el roster y operaciones del workspace.</p>
          </div>
          <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Guardando...' : editing ? 'Actualizar broker' : 'Crear broker'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const BrokerDetailModal = ({ broker, isOpen, onClose, stats }) => {
  if (!broker) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={broker.avatar_url} />
              <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                {broker.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{broker.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <Mail className="h-3 w-3" /> {broker.email}
                {broker.phone && (
                  <>
                    <span className="mx-1">•</span>
                    <Phone className="h-3 w-3" /> {broker.phone}
                  </>
                )}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={broker.membership_status === 'suspended' || !broker.is_active ? 'secondary' : 'default'}>
                  {broker.membership_status === 'suspended' || !broker.is_active ? 'Suspendido' : 'Activo'}
                </Badge>
                <Badge variant="outline" className="capitalize">{broker.workspace_role || broker.role}</Badge>
                {broker.joined_at && <Badge variant="outline">Desde {new Date(broker.joined_at).toLocaleDateString()}</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-4 text-center"><Trophy className="mx-auto mb-2 h-6 w-6 text-primary" /><p className="text-2xl font-bold">{stats?.total_points || 0}</p><p className="text-xs text-muted-foreground">Puntos Totales</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><ShoppingCart className="mx-auto mb-2 h-6 w-6 text-emerald-500" /><p className="text-2xl font-bold">{stats?.ventas || 0}</p><p className="text-xs text-muted-foreground">Ventas</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Bookmark className="mx-auto mb-2 h-6 w-6 text-orange-500" /><p className="text-2xl font-bold">{stats?.apartados || 0}</p><p className="text-xs text-muted-foreground">Apartados</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Users className="mx-auto mb-2 h-6 w-6 text-cyan-500" /><p className="text-2xl font-bold">{stats?.leads_total || 0}</p><p className="text-xs text-muted-foreground">Leads Totales</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4" /> Desglose de Actividades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Llamadas</span></div><Badge variant="secondary">{stats?.llamadas || 0}</Badge></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Video className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Presentaciones Zoom</span></div><Badge variant="secondary">{stats?.zooms || 0}</Badge></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Visitas</span></div><Badge variant="secondary">{stats?.visitas || 0}</Badge></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4" /> Rendimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Conversión de leads</span>
                  <span className="font-medium">{stats?.leads_total > 0 ? Math.round((stats?.ventas / stats?.leads_total) * 100) : 0}%</span>
                </div>
                <Progress value={stats?.leads_total > 0 ? (stats?.ventas / stats?.leads_total) * 100 : 0} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Meta de puntos mensual</span>
                  <span className="font-medium">{Math.min(100, Math.round(((stats?.total_points || 0) / 100) * 100))}%</span>
                </div>
                <Progress value={Math.min(100, ((stats?.total_points || 0) / 100) * 100)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PairingQrDialog = ({ open, onOpenChange, session, loading, selectedRole, onRoleChange, onCreate, onRefresh, onCancel }) => {
  const pairingBaseUrl = buildPairingBaseUrl();
  const pairingUrl = session?.pairing_path ? `${pairingBaseUrl}${session.pairing_path}` : '';
  const qrUrl = pairingUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pairingUrl)}` : '';

  const copyLink = async () => {
    if (!pairingUrl) return;
    await navigator.clipboard.writeText(pairingUrl);
    toast.success('Enlace copiado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular broker por QR</DialogTitle>
          <DialogDescription>
            El broker escanea este QR, inicia sesión y confirma el vínculo con tu inmobiliaria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Rol del broker al vincularse</Label>
              <Select value={selectedRole} onValueChange={onRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAIRING_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onCreate} disabled={loading}>
              <Link2 className="mr-2 h-4 w-4" />
              {loading ? 'Generando...' : session ? 'Regenerar QR' : 'Generar QR'}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                Generando QR...
              </div>
            ) : qrUrl ? (
              <img src={qrUrl} alt="QR para vincular broker" className="h-[280px] w-[280px] rounded-2xl border border-border/70 bg-white p-3" />
            ) : (
              <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                No se pudo generar el QR
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant={session?.status === 'confirmed' ? 'default' : session?.status === 'expired' ? 'secondary' : 'outline'}>
                {session?.status || 'pending'}
              </Badge>
              {session?.invited_role && <Badge variant="outline" className="capitalize">{session.invited_role}</Badge>}
            </div>
          </div>

          {pairingUrl && (
            <Card className="border-border/70 bg-muted/20">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium">Enlace alterno</p>
                <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground break-all">
                  {pairingUrl}
                </div>
                {pairingBaseUrl.includes('localhost') && (
                  <p className="text-xs text-muted-foreground">
                    En local el QR usa `http://localhost`. Funciona en esta misma maquina; para escanearlo desde otro dispositivo necesitaremos una URL publica o de red.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar enlace
                  </Button>
                  <Button variant="outline" onClick={onRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar estado
                  </Button>
                  {session?.status === 'pending' && (
                    <Button variant="ghost" onClick={onCancel}>
                      Cancelar QR
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {session?.status === 'confirmed' && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              El broker ya confirmó el vínculo. Puedes cerrar esta ventana y ver el roster actualizado.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PairingSessionsPanel = ({ sessions, loading, onOpenSession, onRefreshSession, onCancelSession }) => (
  <Card className="border-border/70 bg-card/95">
    <CardHeader className="pb-4">
      <CardTitle className="text-lg">Sesiones de Vinculación</CardTitle>
      <CardDescription>
        Da seguimiento a los QR generados y detecta cuáles siguen pendientes, expiraron o ya quedaron confirmados.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
          Todavía no has generado sesiones QR en este workspace.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">QR para {session.invited_role}</p>
                  <p className="text-xs text-muted-foreground">
                    Creado {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={session.status === 'confirmed' ? 'default' : session.status === 'expired' || session.status === 'cancelled' ? 'secondary' : 'outline'}>
                  {session.status}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Expira: {session.expires_at ? new Date(session.expires_at).toLocaleString() : 'N/D'}</p>
                {session.confirmed_user && (
                  <p>
                    Confirmado por: <span className="text-foreground">{session.confirmed_user.name || session.confirmed_user.email}</span>
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpenSession(session)}>
                  Abrir QR
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRefreshSession(session.id, true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refrescar
                </Button>
                {session.status === 'pending' && (
                  <Button size="sm" variant="ghost" onClick={() => onCancelSession(session.id)}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export const BrokersPage = () => {
  const { api, isAgency, user } = useAuth();
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [brokerStats, setBrokerStats] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false);
  const [pairingSession, setPairingSession] = useState(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingRole, setPairingRole] = useState('broker');
  const [pairingSessions, setPairingSessions] = useState([]);
  const [pairingSessionsLoading, setPairingSessionsLoading] = useState(true);

  useEffect(() => {
    if (!isAgency) {
      setLoading(false);
      setPairingSessionsLoading(false);
      return;
    }
    loadBrokers();
    loadPairingSessions();
  }, [isAgency]);

  useEffect(() => {
    if (!pairingDialogOpen || !pairingSession?.id || pairingSession?.status !== 'pending') return undefined;
    const intervalId = window.setInterval(() => {
      refreshPairingSession(pairingSession.id, false);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [pairingDialogOpen, pairingSession?.id, pairingSession?.status]);

  const activeCount = useMemo(
    () => brokers.filter((broker) => broker.membership_status !== 'suspended' && broker.is_active).length,
    [brokers]
  );

  const loadBrokers = async () => {
    try {
      const res = await api.get('/brokers');
      setBrokers(res.data || []);
    } catch (error) {
      console.error('Error loading brokers:', error);
      toast.error('No se pudieron cargar los brokers');
    } finally {
      setLoading(false);
    }
  };

  const loadPairingSessions = async () => {
    try {
      const res = await api.get('/brokers/pairing-sessions');
      setPairingSessions(res.data || []);
    } catch (error) {
      console.error('Error loading pairing sessions:', error);
      toast.error('No se pudieron cargar las sesiones QR');
    } finally {
      setPairingSessionsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingBroker(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (broker) => {
    setEditingBroker(broker);
    setForm({
      name: broker.name || '',
      email: broker.email || '',
      phone: broker.phone || '',
      role: broker.workspace_role || broker.role || 'broker',
      is_active: broker.membership_status !== 'suspended' && Boolean(broker.is_active),
    });
    setDialogOpen(true);
  };

  const saveBroker = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!form.email.trim()) {
      toast.error('El email es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingBroker) {
        await api.put(`/brokers/${editingBroker.id}`, {
          name: form.name,
          phone: form.phone,
          role: form.role,
          is_active: form.is_active,
        });
        toast.success('Broker actualizado');
      } else {
        await api.post('/brokers', form);
        toast.success('Broker creado y vinculado');
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingBroker(null);
      await loadBrokers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el broker');
    } finally {
      setSaving(false);
    }
  };

  const openBrokerDetail = async (broker) => {
    setSelectedBroker(broker);
    try {
      const res = await api.get(`/brokers/${broker.id}`);
      setSelectedBroker(res.data);
      setBrokerStats(res.data.stats);
    } catch (error) {
      console.error('Error loading broker stats:', error);
      toast.error('No se pudieron cargar las métricas del broker');
    }
  };

  const toggleBroker = async (broker) => {
    try {
      if (broker.membership_status === 'suspended' || !broker.is_active) {
        await api.post(`/brokers/${broker.id}/activate`);
        toast.success('Broker activado');
      } else {
        await api.post(`/brokers/${broker.id}/deactivate`);
        toast.success('Broker suspendido');
      }
      await loadBrokers();
      if (selectedBroker?.id === broker.id) {
        setSelectedBroker(null);
        setBrokerStats(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar el broker');
    }
  };

  const unlinkBroker = async (broker) => {
    if (!window.confirm(`¿Desvincular a ${broker.name} de esta inmobiliaria?`)) return;
    try {
      await api.post(`/brokers/${broker.id}/unlink`);
      toast.success('Broker desvinculado');
      await loadBrokers();
      if (selectedBroker?.id === broker.id) {
        setSelectedBroker(null);
        setBrokerStats(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo desvincular el broker');
    }
  };

  const refreshPairingSession = async (sessionId = pairingSession?.id, showToast = false) => {
    if (!sessionId) return;
    try {
      const res = await api.get(`/brokers/pairing-sessions/${sessionId}`);
      setPairingSession(res.data);
      if (showToast) {
        toast.success('Estado del QR actualizado');
      }
      if (res.data?.status === 'confirmed') {
        await loadBrokers();
      }
      await loadPairingSessions();
    } catch (error) {
      if (showToast) {
        toast.error(error.response?.data?.detail || 'No se pudo actualizar la sesión QR');
      }
    }
  };

  const startPairingSession = async () => {
    setPairingLoading(true);
    try {
      const res = await api.post('/brokers/pairing-sessions', {
        tenant_id: user?.active_workspace?.tenant_id || user?.tenant_id,
        invited_role: pairingRole,
        expires_in_minutes: 10,
      });
      setPairingSession(res.data);
      setPairingDialogOpen(true);
      await loadPairingSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo generar el QR de vinculación');
    } finally {
      setPairingLoading(false);
    }
  };

  const cancelPairingSession = async (sessionId = pairingSession?.id) => {
    if (!sessionId) return;
    try {
      await api.post(`/brokers/pairing-sessions/${sessionId}/cancel`);
      toast.success('Sesión QR cancelada');
      setPairingSession((prev) => (prev?.id === sessionId ? { ...prev, status: 'cancelled' } : prev));
      await loadPairingSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cancelar la sesión QR');
    }
  };

  const openPairingSession = (session) => {
    setPairingRole(session.invited_role || 'broker');
    setPairingSession(session);
    setPairingDialogOpen(true);
  };

  if (!isAgency) {
    return (
      <div className="p-8">
        <Card className="border-dashed border-border/70">
          <CardContent className="py-16 text-center">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Módulo disponible solo para inmobiliarias</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu cuenta actual es <span className="font-medium">{user?.account_type || 'individual'}</span>. El roster de brokers se habilita en workspaces tipo agencia.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8" data-testid="brokers-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-['Outfit'] text-3xl font-bold">Equipo de Brokers</h1>
          <p className="text-muted-foreground">{brokers.length} brokers vinculados a esta inmobiliaria · {activeCount} activos</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => {
            setPairingSession(null);
            setPairingDialogOpen(true);
          }}>
            <Link2 className="mr-2 h-4 w-4" />
            Vincular por QR
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo broker
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-44 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {brokers.map((broker, idx) => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              rank={idx + 1}
              onOpen={openBrokerDetail}
              onEdit={openEditDialog}
              onToggle={toggleBroker}
              onUnlink={unlinkBroker}
            />
          ))}
          {brokers.length === 0 && (
            <div className="col-span-full">
              <Card className="border-dashed border-border/70">
                <CardContent className="py-14 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Todavía no hay brokers vinculados a este workspace.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <PairingSessionsPanel
        sessions={pairingSessions}
        loading={pairingSessionsLoading}
        onOpenSession={openPairingSession}
        onRefreshSession={refreshPairingSession}
        onCancelSession={cancelPairingSession}
      />

      <BrokerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={saveBroker}
        saving={saving}
        editing={Boolean(editingBroker)}
      />

      <BrokerDetailModal
        broker={selectedBroker}
        isOpen={Boolean(selectedBroker)}
        onClose={() => {
          setSelectedBroker(null);
          setBrokerStats(null);
        }}
        stats={brokerStats}
      />

      <PairingQrDialog
        open={pairingDialogOpen}
        onOpenChange={(open) => {
          setPairingDialogOpen(open);
          if (!open) {
            setPairingSession(null);
          }
        }}
        session={pairingSession}
        loading={pairingLoading}
        selectedRole={pairingRole}
        onRoleChange={setPairingRole}
        onCreate={startPairingSession}
        onRefresh={() => refreshPairingSession(pairingSession?.id, true)}
        onCancel={cancelPairingSession}
      />
    </div>
  );
};

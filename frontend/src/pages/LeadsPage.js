import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search, Plus, Phone, MessageCircle, Mail, Video, MapPin, Filter,
  ChevronDown, MoreHorizontal, Sparkles, Loader2, X, DollarSign,
  TrendingUp, Calendar, User, Edit, Bookmark, ShoppingCart
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const statusConfig = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-500', textColor: 'text-blue-500' },
  contactado: { label: 'Contactado', color: 'bg-cyan-500', textColor: 'text-cyan-500' },
  calificacion: { label: 'Calificación', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  presentacion: { label: 'Presentación', color: 'bg-purple-500', textColor: 'text-purple-500' },
  apartado: { label: 'Apartado', color: 'bg-orange-500', textColor: 'text-orange-500' },
  venta: { label: 'Venta', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  perdido: { label: 'Perdido', color: 'bg-gray-500', textColor: 'text-gray-500' },
};

const priorityConfig = {
  baja: { label: 'Baja', color: 'bg-gray-400' },
  media: { label: 'Media', color: 'bg-yellow-400' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

const LeadCard = ({ lead, onClick }) => {
  const status = statusConfig[lead.status] || statusConfig.nuevo;
  const priority = priorityConfig[lead.priority] || priorityConfig.media;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
      onClick={() => onClick(lead)}
      data-testid={`lead-card-${lead.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {lead.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                {lead.name}
              </h4>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${priority.color}`} title={priority.label} />
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span>${lead.budget_mxn?.toLocaleString()} MXN</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{lead.property_interest || 'Sin especificar'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`${status.textColor} text-xs`}>
            {status.label}
          </Badge>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium">{lead.intent_score}%</span>
          </div>
        </div>

        {lead.intent_score >= 80 && (
          <Progress value={lead.intent_score} className="h-1 mt-3" />
        )}
      </CardContent>
    </Card>
  );
};

const LeadDetailModal = ({ lead, isOpen, onClose, onUpdate, api }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [script, setScript] = useState('');
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ type: 'llamada', description: '', outcome: '' });
  const [addingActivity, setAddingActivity] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      loadActivities();
    }
  }, [lead, isOpen]);

  const loadActivities = async () => {
    try {
      const res = await api.get(`/activities?lead_id=${lead.id}&limit=20`);
      setActivities(res.data);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/leads/${lead.id}/analyze`);
      toast.success('Análisis completado');
      onUpdate({ ...lead, ai_analysis: res.data, intent_score: res.data.intent_score });
    } catch (error) {
      toast.error('Error al analizar');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateScript = async (type = 'apertura') => {
    setGeneratingScript(true);
    try {
      const res = await api.post(`/leads/${lead.id}/generate-script?script_type=${type}`);
      setScript(res.data.script);
      setActiveTab('script');
    } catch (error) {
      toast.error('Error al generar script');
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/leads/${lead.id}`, { status: newStatus });
      toast.success('Estado actualizado');
      onUpdate({ ...lead, status: newStatus });
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.description) return;
    setAddingActivity(true);
    try {
      const res = await api.post('/activities', {
        lead_id: lead.id,
        activity_type: newActivity.type,
        description: newActivity.description,
        outcome: newActivity.outcome,
      });
      toast.success(`Actividad registrada (+${res.data.points_earned} pts)`);
      setNewActivity({ type: 'llamada', description: '', outcome: '' });
      loadActivities();
    } catch (error) {
      toast.error('Error al registrar actividad');
    } finally {
      setAddingActivity(false);
    }
  };

  if (!lead) return null;

  const status = statusConfig[lead.status];
  const analysis = lead.ai_analysis;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {lead.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{lead.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {lead.phone}
                  {lead.email && (
                    <>
                      <span className="mx-1">•</span>
                      <Mail className="w-3 h-3" /> {lead.email}
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${status?.color} text-white`}>{status?.label}</Badge>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium text-primary">{lead.intent_score}%</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="info" className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presupuesto</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">${lead.budget_mxn?.toLocaleString()} MXN</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fuente</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span>{lead.source}</span>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Interés en propiedad</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span>{lead.property_interest || 'Sin especificar'}</span>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notas</Label>
                  <div className="p-3 bg-muted/50 rounded-lg min-h-[80px]">
                    <span className="text-sm">{lead.notes || 'Sin notas'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cambiar estado</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={lead.status === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(key)}
                      className="rounded-full"
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4 pr-4">
              {/* Add activity form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Registrar Actividad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llamada">Llamada</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="nota">Nota</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Descripción..."
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  />
                  <Input
                    placeholder="Resultado (opcional)"
                    value={newActivity.outcome}
                    onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                  />
                  <Button onClick={handleAddActivity} disabled={addingActivity || !newActivity.description} className="w-full rounded-full">
                    {addingActivity ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Registrar
                  </Button>
                </CardContent>
              </Card>

              {/* Activity history */}
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {activity.activity_type === 'llamada' && <Phone className="w-4 h-4 text-primary" />}
                      {activity.activity_type === 'whatsapp' && <MessageCircle className="w-4 h-4 text-primary" />}
                      {activity.activity_type === 'email' && <Mail className="w-4 h-4 text-primary" />}
                      {activity.activity_type === 'zoom' && <Video className="w-4 h-4 text-primary" />}
                      {activity.activity_type === 'visita' && <MapPin className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{activity.activity_type}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      {activity.outcome && (
                        <p className="text-xs text-muted-foreground mt-1">Resultado: {activity.outcome}</p>
                      )}
                    </div>
                    {activity.points_earned > 0 && (
                      <Badge variant="secondary">+{activity.points_earned}</Badge>
                    )}
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay actividades registradas</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 pr-4">
              <Button onClick={handleAnalyze} disabled={analyzing} className="w-full rounded-full">
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Analizar con IA
              </Button>

              {analysis && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Intención de compra</span>
                        <Badge className={analysis.intent_score >= 70 ? 'bg-emerald-500' : analysis.intent_score >= 40 ? 'bg-yellow-500' : 'bg-gray-500'}>
                          {analysis.intent_score}%
                        </Badge>
                      </div>
                      <Progress value={analysis.intent_score} />
                      <div>
                        <span className="text-sm font-medium">Sentimiento:</span>
                        <Badge variant="outline" className="ml-2 capitalize">{analysis.sentiment}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Puntos Clave</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.key_points?.map((point, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Próxima Acción Recomendada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{analysis.next_action}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!analysis && !analyzing && (
                <p className="text-center text-muted-foreground py-8">
                  Haz clic en "Analizar con IA" para obtener insights
                </p>
              )}
            </TabsContent>

            <TabsContent value="script" className="space-y-4 pr-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleGenerateScript('apertura')} disabled={generatingScript} className="rounded-full">
                  Apertura
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerateScript('seguimiento')} disabled={generatingScript} className="rounded-full">
                  Seguimiento
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerateScript('cierre')} disabled={generatingScript} className="rounded-full">
                  Cierre
                </Button>
              </div>

              {generatingScript && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {script && !generatingScript && (
                <Card>
                  <CardContent className="pt-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{script}</pre>
                  </CardContent>
                </Card>
              )}

              {!script && !generatingScript && (
                <p className="text-center text-muted-foreground py-8">
                  Genera un script personalizado para este lead
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 rounded-full" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="w-4 h-4 mr-2" /> Llamar
              </a>
            </Button>
            <Button variant="outline" className="flex-1 rounded-full" asChild>
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </a>
            </Button>
            {lead.email && (
              <Button variant="outline" className="flex-1 rounded-full" asChild>
                <a href={`mailto:${lead.email}`}>
                  <Mail className="w-4 h-4 mr-2" /> Email
                </a>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const NewLeadModal = ({ isOpen, onClose, onCreated, api }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'web',
    budget_mxn: 0,
    property_interest: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', form);
      toast.success('Lead creado exitosamente');
      onCreated();
      onClose();
      setForm({
        name: '',
        phone: '',
        email: '',
        source: 'web',
        budget_mxn: 0,
        property_interest: '',
        notes: '',
      });
    } catch (error) {
      toast.error('Error al crear lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Lead</DialogTitle>
          <DialogDescription>Agrega un nuevo prospecto al sistema</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                data-testid="new-lead-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                data-testid="new-lead-phone"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuente</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="Referido">Referido</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Presupuesto (MXN)</Label>
              <Input
                type="number"
                value={form.budget_mxn}
                onChange={(e) => setForm({ ...form, budget_mxn: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Interés en propiedad</Label>
              <Input
                value={form.property_interest}
                onChange={(e) => setForm({ ...form, property_interest: e.target.value })}
                placeholder="Ej: Lote en Aldea Zamá"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full" data-testid="new-lead-submit">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const LeadsPage = () => {
  const { api } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [statusFilter, priorityFilter]);

  const loadLeads = async () => {
    try {
      let url = '/leads?';
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      if (priorityFilter !== 'all') url += `priority=${priorityFilter}&`;
      const res = await api.get(url);
      setLeads(res.data);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone?.includes(search) ||
    lead.email?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedLeads = {
    nuevo: filteredLeads.filter((l) => l.status === 'nuevo'),
    contactado: filteredLeads.filter((l) => l.status === 'contactado'),
    calificacion: filteredLeads.filter((l) => l.status === 'calificacion'),
    presentacion: filteredLeads.filter((l) => l.status === 'presentacion'),
    apartado: filteredLeads.filter((l) => l.status === 'apartado'),
    venta: filteredLeads.filter((l) => l.status === 'venta'),
  };

  const handleLeadUpdate = (updatedLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setSelectedLead(updatedLead);
  };

  return (
    <div className="p-8 space-y-6" data-testid="leads-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Leads</h1>
          <p className="text-muted-foreground">{leads.length} prospectos en el sistema</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="rounded-full" data-testid="new-lead-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="leads-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Object.entries(groupedLeads).map(([status, statusLeads]) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusConfig[status]?.color}`} />
                  <h3 className="font-medium text-sm">{statusConfig[status]?.label}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{statusLeads.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3 pr-2">
                  {statusLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onClick={setSelectedLead} />
                  ))}
                  {statusLeads.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">Sin leads</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
        api={api}
      />

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={loadLeads}
        api={api}
      />
    </div>
  );
};

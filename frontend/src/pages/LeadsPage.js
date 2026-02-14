import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search, Plus, Phone, MessageCircle, Mail, Video, MapPin,
  Sparkles, Loader2, DollarSign, TrendingUp, GripVertical
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
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
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const statusConfig = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-500', textColor: 'text-blue-500', bgLight: 'bg-blue-500/10' },
  contactado: { label: 'Contactado', color: 'bg-cyan-500', textColor: 'text-cyan-500', bgLight: 'bg-cyan-500/10' },
  calificacion: { label: 'Calificación', color: 'bg-amber-500', textColor: 'text-amber-500', bgLight: 'bg-amber-500/10' },
  presentacion: { label: 'Presentación', color: 'bg-purple-500', textColor: 'text-purple-500', bgLight: 'bg-purple-500/10' },
  apartado: { label: 'Apartado', color: 'bg-[#D97706]', textColor: 'text-[#D97706]', bgLight: 'bg-[#D97706]/10' },
  venta: { label: 'Venta', color: 'bg-[#10B981]', textColor: 'text-[#10B981]', bgLight: 'bg-[#10B981]/10' },
};

const priorityConfig = {
  baja: { label: 'Baja', color: 'bg-gray-400' },
  media: { label: 'Media', color: 'bg-amber-400' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
};

// Sortable Lead Card Component
const SortableLeadCard = ({ lead, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = statusConfig[lead.status] || statusConfig.nuevo;
  const priority = priorityConfig[lead.priority] || priorityConfig.media;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group bg-card ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}`}
      data-testid={`lead-card-${lead.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {lead.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div onClick={() => onClick(lead)} className="cursor-pointer">
              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                {lead.name}
              </h4>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${priority.color}`} title={priority.label} />
        </div>

        <div className="space-y-2 mb-3" onClick={() => onClick(lead)}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span>${lead.budget_mxn?.toLocaleString()} MXN</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{lead.property_interest || 'Sin especificar'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between" onClick={() => onClick(lead)}>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className={`text-xs font-medium ${lead.intent_score >= 70 ? 'text-[#10B981]' : lead.intent_score >= 40 ? 'text-[#D97706]' : 'text-muted-foreground'}`}>
              {lead.intent_score}%
            </span>
          </div>
        </div>

        {lead.intent_score >= 70 && (
          <Progress value={lead.intent_score} className="h-1 mt-3" />
        )}
      </CardContent>
    </Card>
  );
};

// Simple Lead Card for DragOverlay
const LeadCardOverlay = ({ lead }) => {
  const priority = priorityConfig[lead.priority] || priorityConfig.media;

  return (
    <Card className="cursor-grabbing shadow-2xl ring-2 ring-primary bg-card w-full max-w-[280px]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-primary" />
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {lead.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm text-primary">{lead.name}</h4>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${priority.color}`} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span>${lead.budget_mxn?.toLocaleString()} MXN</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Droppable Column Component
const DroppableColumn = ({ status, leads, onLeadClick, children }) => {
  const config = statusConfig[status];
  
  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          <h3 className="font-medium text-sm">{config.label}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
      </div>
      <div className={`flex-1 rounded-xl p-2 ${config.bgLight} min-h-[200px]`}>
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {leads.map((lead) => (
              <SortableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
            ))}
            {leads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Arrastra leads aquí
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
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
              <Card>
                <CardContent className="pt-4 space-y-3">
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
                    Registrar Actividad
                  </Button>
                </CardContent>
              </Card>

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
                      <Badge variant="secondary" className="text-[#D97706]">+{activity.points_earned}</Badge>
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
                        <Badge className={analysis.intent_score >= 70 ? 'bg-[#10B981]' : analysis.intent_score >= 40 ? 'bg-[#D97706]' : 'bg-gray-500'}>
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
                    <CardContent className="pt-4">
                      <h4 className="text-sm font-medium mb-2">Puntos Clave</h4>
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
                    <CardContent className="pt-4">
                      <h4 className="text-sm font-medium mb-2">Próxima Acción</h4>
                      <p className="text-sm">{analysis.next_action}</p>
                    </CardContent>
                  </Card>
                </div>
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
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await api.get('/leads');
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

  const findLeadById = (id) => leads.find((lead) => lead.id === id);

  const findColumnByLeadId = (id) => {
    for (const [status, statusLeads] of Object.entries(groupedLeads)) {
      if (statusLeads.some((lead) => lead.id === id)) {
        return status;
      }
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id;
    const overId = over.id;

    // Find the source column
    const sourceColumn = findColumnByLeadId(activeLeadId);
    
    // Determine target column
    let targetColumn = null;
    
    // Check if dropped over another lead
    const overLead = findLeadById(overId);
    if (overLead) {
      targetColumn = overLead.status;
    } else {
      // Dropped on column itself
      targetColumn = overId;
    }

    // If valid target column and different from source
    if (targetColumn && statusConfig[targetColumn] && sourceColumn !== targetColumn) {
      // Optimistically update UI
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === activeLeadId ? { ...lead, status: targetColumn } : lead
        )
      );

      // Update in backend
      try {
        await api.put(`/leads/${activeLeadId}`, { status: targetColumn });
        toast.success(`Lead movido a ${statusConfig[targetColumn].label}`);
      } catch (error) {
        // Revert on error
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === activeLeadId ? { ...lead, status: sourceColumn } : lead
          )
        );
        toast.error('Error al mover lead');
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeLeadId = active.id;
    const overId = over.id;

    const sourceColumn = findColumnByLeadId(activeLeadId);
    
    // Determine if over a column or another lead
    let targetColumn = null;
    const overLead = findLeadById(overId);
    if (overLead) {
      targetColumn = overLead.status;
    } else if (statusConfig[overId]) {
      targetColumn = overId;
    }

    // If moving to different column, update immediately for visual feedback
    if (targetColumn && sourceColumn !== targetColumn) {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === activeLeadId ? { ...lead, status: targetColumn } : lead
        )
      );
    }
  };

  const activeLead = activeId ? findLeadById(activeId) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 h-full flex flex-col" data-testid="leads-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Pipeline de Leads</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{leads.length} prospectos • Arrastra para cambiar estado</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="rounded-full w-full sm:w-auto" data-testid="new-lead-btn">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Lead
        </Button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="leads-search"
          />
        </div>
      </div>

      {/* Kanban with Drag & Drop */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 flex-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-28 sm:h-32 w-full" />
              <Skeleton className="h-28 sm:h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="flex gap-3 sm:gap-4 min-w-max h-full pb-4">
              {Object.entries(groupedLeads).map(([status, statusLeads]) => (
                <DroppableColumn
                  key={status}
                  status={status}
                  leads={statusLeads}
                  onLeadClick={setSelectedLead}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
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

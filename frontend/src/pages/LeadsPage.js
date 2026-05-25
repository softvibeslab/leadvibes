import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles, Loader2, DollarSign, TrendingUp, GripVertical,
  LayoutGrid, Table2, X, ArrowUpDown, ArrowUp, ArrowDown, Filter, Settings2, Edit, Trash2, Tag
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
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from 'sonner';
import { DuplicateDetectionModal } from '../components/DuplicateDetectionModal';

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

const sourceConfig = {
  web: { label: 'Web', color: 'bg-blue-400' },
  'Facebook Ads': { label: 'Facebook', color: 'bg-indigo-500' },
  'Instagram': { label: 'Instagram', color: 'bg-pink-500' },
  'Google Ads': { label: 'Google', color: 'bg-green-500' },
  'Referido': { label: 'Referido', color: 'bg-purple-500' },
  'WhatsApp': { label: 'WhatsApp', color: 'bg-emerald-500' },
};

const operationConfig = {
  sale: { label: 'Venta', color: 'bg-emerald-500' },
  rent: { label: 'Renta', color: 'bg-cyan-500' },
  both: { label: 'Venta/Renta', color: 'bg-amber-500' },
};

const normalizeLeadCustomFieldValue = (field, value) => {
  if (field.field_type === 'number') {
    return Number(value || 0);
  }
  if (field.field_type === 'boolean') {
    return Boolean(value);
  }
  if (field.field_type === 'multi_select') {
    return Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  }
  return value;
};

const prettifyLeadCustomFieldValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return value || 'Sin valor';
};

const normalizeLeadTagsInput = (value) => Array.from(
  new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  )
);

const matchesLeadCustomFieldFilter = (field, leadValue, filterValue) => {
  if (filterValue === undefined || filterValue === null || filterValue === '') {
    return true;
  }

  if (field.field_type === 'boolean') {
    if (filterValue === 'all') return true;
    return Boolean(leadValue) === (filterValue === 'true');
  }

  if (Array.isArray(leadValue)) {
    const normalizedFilter = String(filterValue).trim().toLowerCase();
    return leadValue.some((item) => String(item).toLowerCase().includes(normalizedFilter));
  }

  return String(leadValue ?? '').toLowerCase().includes(String(filterValue).trim().toLowerCase());
};

const EMPTY_CUSTOM_FIELD = {
  label: '',
  key: '',
  entity_type: 'leads',
  field_type: 'text',
  options: [],
  required: false,
  is_active: true,
  show_in_table: false,
  show_in_card: false,
  show_in_filters: false,
  sort_order: 0,
};

// Filter Bubble Component
const FilterBubble = ({ label, isActive, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
      isActive
        ? `${color || 'bg-primary'} text-white shadow-md`
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`}
  >
    {label}
  </button>
);

// Active Filter Tag
const ActiveFilterTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
    {label}
    <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5">
      <X className="w-3 h-3" />
    </button>
  </span>
);

// Table View Component
const LeadsTableView = ({ leads, onLeadClick, onStatusChange, sortConfig, onSort, customFields = [] }) => {
  const visibleCustomFields = customFields.filter((field) => field.show_in_table).slice(0, 3);

  const SortableHeader = ({ column, label }) => {
    const isActive = sortConfig.key === column;
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => onSort(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortConfig.direction === 'asc' ? 
              <ArrowUp className="w-3 h-3" /> : 
              <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <SortableHeader column="name" label="Nombre" />
              <SortableHeader column="phone" label="Teléfono" />
              <SortableHeader column="status" label="Estado" />
              <SortableHeader column="priority" label="Prioridad" />
              <SortableHeader column="operation_type" label="Operación" />
              <SortableHeader column="source" label="Fuente" />
              <SortableHeader column="budget_mxn" label="Presupuesto" />
              {visibleCustomFields.map((field) => (
                <TableHead key={field.id}>{field.label}</TableHead>
              ))}
              <SortableHeader column="intent_score" label="Intención" />
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const status = statusConfig[lead.status] || statusConfig.nuevo;
              const priority = priorityConfig[lead.priority] || priorityConfig.media;
              const source = sourceConfig[lead.source] || { label: lead.source, color: 'bg-gray-400' };
              const operation = operationConfig[lead.operation_type || 'sale'] || operationConfig.sale;
              
              return (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onLeadClick(lead)}
                  data-testid={`table-row-${lead.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {lead.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                        {Array.isArray(lead.tags) && lead.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lead.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.phone}</TableCell>
                  <TableCell>
                    <Badge className={`${status.color} text-white text-xs`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                      <span className="text-xs">{priority.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {operation.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {source.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    ${lead.budget_mxn?.toLocaleString()}
                  </TableCell>
                  {visibleCustomFields.map((field) => (
                    <TableCell key={field.id} className="text-sm">
                      {prettifyLeadCustomFieldValue(lead.custom_fields_data?.[field.key])}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={lead.intent_score} className="w-16 h-1.5" />
                      <span className={`text-xs font-medium ${
                        lead.intent_score >= 70 ? 'text-[#10B981]' : 
                        lead.intent_score >= 40 ? 'text-[#D97706]' : 'text-muted-foreground'
                      }`}>
                        {lead.intent_score}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`tel:${lead.phone}`}>
                          <Phone className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8 + visibleCustomFields.length} className="text-center py-8 text-muted-foreground">
                  No se encontraron leads con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
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
  const operation = operationConfig[lead.operation_type || 'sale'] || operationConfig.sale;

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
          <Badge variant="outline" className="w-fit text-[10px]">
            {operation.label}
          </Badge>
          {Array.isArray(lead.tags) && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
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

const LeadDetailModal = ({ lead, isOpen, onClose, onUpdate, api, customFields = [] }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [script, setScript] = useState('');
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [savingInterest, setSavingInterest] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: 'llamada', description: '', outcome: '' });
  const [addingActivity, setAddingActivity] = useState(false);
  const [interestForm, setInterestForm] = useState({
    product_id: 'none',
    interest_type: 'principal',
    interest_status: 'nuevo_interes',
    priority: 'media',
    notes: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (lead && isOpen) {
      loadActivities();
      loadProducts();
      loadInterests();
      setTagInput(Array.isArray(lead.tags) ? lead.tags.join(', ') : '');
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

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading products for lead interests:', error);
    }
  };

  const loadInterests = async () => {
    setLoadingInterests(true);
    try {
      const res = await api.get(`/leads/${lead.id}/interests`);
      setInterests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('No se pudieron cargar los productos de interés');
    } finally {
      setLoadingInterests(false);
    }
  };

  const refreshLeadDetails = async () => {
    try {
      const res = await api.get(`/leads/${lead.id}`);
      onUpdate(res.data);
    } catch (error) {
      console.error('Error refreshing lead details:', error);
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

  const handleCreateInterest = async () => {
    if (!interestForm.product_id || interestForm.product_id === 'none') {
      toast.error('Selecciona un producto o servicio');
      return;
    }

    setSavingInterest(true);
    try {
      await api.post('/lead-product-interests', {
        lead_id: lead.id,
        product_id: interestForm.product_id,
        interest_type: interestForm.interest_type,
        interest_status: interestForm.interest_status,
        priority: interestForm.priority,
        source: 'manual',
        notes: interestForm.notes || null,
      });
      toast.success('Producto vinculado al lead');
      setInterestForm({
        product_id: 'none',
        interest_type: 'principal',
        interest_status: 'nuevo_interes',
        priority: 'media',
        notes: '',
      });
      await Promise.all([loadInterests(), refreshLeadDetails()]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo vincular el producto');
    } finally {
      setSavingInterest(false);
    }
  };

  const handleUpdateInterest = async (interestId, payload) => {
    try {
      await api.put(`/lead-product-interests/${interestId}`, payload);
      await Promise.all([loadInterests(), refreshLeadDetails()]);
      toast.success('Interés actualizado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar el interés');
    }
  };

  const handleDeleteInterest = async (interestId) => {
    if (!window.confirm('¿Desvincular este producto del lead?')) return;
    try {
      await api.delete(`/lead-product-interests/${interestId}`);
      await Promise.all([loadInterests(), refreshLeadDetails()]);
      toast.success('Interés eliminado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el interés');
    }
  };

  const handleSaveTags = async () => {
    setSavingTags(true);
    try {
      await api.put(`/leads/${lead.id}`, { tags: normalizeLeadTagsInput(tagInput) });
      await refreshLeadDetails();
      toast.success('Tags actualizados');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudieron actualizar los tags');
    } finally {
      setSavingTags(false);
    }
  };

  const handleTogglePreference = async (field, value) => {
    try {
      await api.put(`/leads/${lead.id}`, { [field]: value });
      await refreshLeadDetails();
      toast.success('Preferencia de contacto actualizada');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar la preferencia');
    }
  };

  if (!lead) return null;

  const status = statusConfig[lead.status];
  const analysis = lead.ai_analysis;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl min-h-0 flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col overflow-hidden px-6">
          <TabsList className="mt-4 grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="analysis">Análisis IA</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
          </TabsList>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
            <TabsContent value="info" className="space-y-4 pb-6 pr-2">
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
                <div className="space-y-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags del lead</Label>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={handleSaveTags} disabled={savingTags}>
                      {savingTags ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
                      Guardar tags
                    </Button>
                  </div>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Ej: inversionista, open house, seguimiento caliente"
                  />
                  {Array.isArray(lead.tags) && lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Separa múltiples tags con comas. Los podrás usar después para segmentar campañas.
                  </p>
                </div>
                <div className="space-y-3 col-span-2">
                  <Label>Preferencias de contacto</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { key: 'email_opt_out', label: 'Bloquear email' },
                      { key: 'sms_opt_out', label: 'Bloquear SMS' },
                      { key: 'whatsapp_opt_out', label: 'Bloquear WhatsApp' },
                      { key: 'call_opt_out', label: 'Bloquear llamadas' },
                    ].map((preference) => (
                      <div key={preference.key} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{preference.label}</p>
                          <p className="text-xs text-muted-foreground">Excluir este canal del envío de campañas</p>
                        </div>
                        <Switch
                          checked={Boolean(lead[preference.key])}
                          onCheckedChange={(checked) => handleTogglePreference(preference.key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Propiedades / productos de interés</Label>
                    <Badge variant="outline">{interests.length}</Badge>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
                    {loadingInterests ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : interests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aún no hay productos vinculados a este lead.</p>
                    ) : (
                      interests.map((interest) => (
                        <div key={interest.id} className="rounded-xl border border-border/70 bg-card/70 p-3 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{interest.product?.title || 'Producto sin título'}</p>
                              <p className="text-xs text-muted-foreground">
                                {interest.product?.sku || 'Sin SKU'} • {interest.product?.niche || 'Sin nicho'}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteInterest(interest.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="mb-2 block">Tipo</Label>
                              <Select
                                value={interest.interest_type}
                                onValueChange={(value) => handleUpdateInterest(interest.id, { interest_type: value })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="principal">Principal</SelectItem>
                                  <SelectItem value="secundario">Secundario</SelectItem>
                                  <SelectItem value="upsell">Upsell</SelectItem>
                                  <SelectItem value="cross_sell">Cross sell</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-2 block">Estado</Label>
                              <Select
                                value={interest.interest_status}
                                onValueChange={(value) => handleUpdateInterest(interest.id, { interest_status: value })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nuevo_interes">Nuevo interés</SelectItem>
                                  <SelectItem value="contactado">Contactado</SelectItem>
                                  <SelectItem value="envio_info">Envío info</SelectItem>
                                  <SelectItem value="visita_agendada">Visita agendada</SelectItem>
                                  <SelectItem value="negociacion">Negociación</SelectItem>
                                  <SelectItem value="descartado">Descartado</SelectItem>
                                  <SelectItem value="cerrado">Cerrado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-2 block">Prioridad</Label>
                              <Select
                                value={interest.priority}
                                onValueChange={(value) => handleUpdateInterest(interest.id, { priority: value })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="baja">Baja</SelectItem>
                                  <SelectItem value="media">Media</SelectItem>
                                  <SelectItem value="alta">Alta</SelectItem>
                                  <SelectItem value="urgente">Urgente</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {interest.notes && (
                            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                              {interest.notes}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-lg border border-dashed border-border/70 p-4 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">Vincular nuevo producto o servicio</p>
                        <p className="text-xs text-muted-foreground">Selecciona el producto y guarda el vínculo desde aquí mismo.</p>
                      </div>
                      <Button onClick={handleCreateInterest} disabled={savingInterest} className="rounded-full sm:self-start">
                        {savingInterest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Guardar vínculo
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <Label className="mb-2 block">Producto</Label>
                        <Select
                          value={interestForm.product_id}
                          onValueChange={(value) => setInterestForm((prev) => ({ ...prev, product_id: value }))}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecciona un producto</SelectItem>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.title} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Tipo</Label>
                        <Select
                          value={interestForm.interest_type}
                          onValueChange={(value) => setInterestForm((prev) => ({ ...prev, interest_type: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="secundario">Secundario</SelectItem>
                            <SelectItem value="upsell">Upsell</SelectItem>
                            <SelectItem value="cross_sell">Cross sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Estado</Label>
                        <Select
                          value={interestForm.interest_status}
                          onValueChange={(value) => setInterestForm((prev) => ({ ...prev, interest_status: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevo_interes">Nuevo interés</SelectItem>
                            <SelectItem value="contactado">Contactado</SelectItem>
                            <SelectItem value="envio_info">Envío info</SelectItem>
                            <SelectItem value="visita_agendada">Visita agendada</SelectItem>
                            <SelectItem value="negociacion">Negociación</SelectItem>
                            <SelectItem value="descartado">Descartado</SelectItem>
                            <SelectItem value="cerrado">Cerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Prioridad</Label>
                        <Select
                          value={interestForm.priority}
                          onValueChange={(value) => setInterestForm((prev) => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="mb-2 block">Notas del interés</Label>
                        <Textarea
                          value={interestForm.notes}
                          onChange={(event) => setInterestForm((prev) => ({ ...prev, notes: event.target.value }))}
                          placeholder="Ej: pidió financiamiento o quiere visita este fin de semana"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notas</Label>
                  <div className="p-3 bg-muted/50 rounded-lg min-h-[80px]">
                    <span className="text-sm">{lead.notes || 'Sin notas'}</span>
                  </div>
                </div>
                {customFields.length > 0 && (
                  <div className="space-y-3 col-span-2">
                    <Label>Campos personalizados</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {customFields.map((field) => (
                        <div key={field.id} className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">{field.label}</p>
                          <p className="text-sm font-medium">
                            {prettifyLeadCustomFieldValue(lead.custom_fields_data?.[field.key])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            <TabsContent value="activities" className="space-y-4 pb-6 pr-2">
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

            <TabsContent value="analysis" className="space-y-4 pb-6 pr-2">
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

            <TabsContent value="script" className="space-y-4 pb-6 pr-2">
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
          </div>
        </Tabs>

        <DialogFooter className="mt-0 border-t px-6 py-4">
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

const NewLeadModal = ({ isOpen, onClose, onCreated, api, customFields = [] }) => {
  const [loading, setLoading] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [leadDataToCheck, setLeadDataToCheck] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'web',
    operation_type: 'sale',
    pipeline_type: 'sales',
    rental_intent: '',
    budget_mxn: 0,
    monthly_budget_mxn: 0,
    nightly_budget_mxn: 0,
    desired_check_in: '',
    desired_check_out: '',
    guests_count: 1,
    preferred_zone: '',
    property_interest: '',
    tags: [],
    email_opt_out: false,
    sms_opt_out: false,
    whatsapp_opt_out: false,
    call_opt_out: false,
    notes: '',
    custom_fields_data: {},
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/leads', form);
      toast.success('Lead creado exitosamente');
      onCreated();
      handleClose();
    } catch (error) {
      toast.error('Error al crear lead');
    } finally {
      setLoading(false);
    }
  };

  const handleBeforeCreate = async (leadData) => {
    setLoading(true);
    const payload = {
      ...leadData,
      desired_check_in: leadData.desired_check_in ? new Date(`${leadData.desired_check_in}T12:00:00`).toISOString() : null,
      desired_check_out: leadData.desired_check_out ? new Date(`${leadData.desired_check_out}T12:00:00`).toISOString() : null,
      monthly_budget_mxn: Number(leadData.monthly_budget_mxn) || null,
      nightly_budget_mxn: Number(leadData.nightly_budget_mxn) || null,
      guests_count: Number(leadData.guests_count) || null,
      rental_intent: leadData.rental_intent || null,
      preferred_zone: leadData.preferred_zone || null,
    };
    try {
      // Verificar duplicados antes de crear
      const response = await api.post('/leads/check-duplicates', payload);
      const duplicates = response.data;

      if (duplicates.duplicates_found > 0) {
        // Mostrar modal de duplicados
        setLeadDataToCheck(payload);
        setShowDuplicateModal(true);
      } else {
        // No hay duplicados, crear directamente
        await api.post('/leads', payload);
        toast.success('Lead creado exitosamente');
        onCreated();
        handleClose();
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // Si falla la verificación, crear de todos modos
      await api.post('/leads', payload);
      toast.success('Lead creado exitosamente');
      onCreated();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setForm({
      name: '',
      phone: '',
      email: '',
      source: 'web',
      operation_type: 'sale',
      pipeline_type: 'sales',
      rental_intent: '',
      budget_mxn: 0,
      monthly_budget_mxn: 0,
      nightly_budget_mxn: 0,
      desired_check_in: '',
      desired_check_out: '',
      guests_count: 1,
      preferred_zone: '',
      property_interest: '',
      tags: [],
      email_opt_out: false,
      sms_opt_out: false,
      whatsapp_opt_out: false,
      call_opt_out: false,
      notes: '',
      custom_fields_data: {},
    });
    setTagInput('');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Lead</DialogTitle>
            <DialogDescription>Agrega un nuevo prospecto al sistema</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleBeforeCreate(form);
          }} className="space-y-4">
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
                <Label>Operación</Label>
                <Select
                  value={form.operation_type}
                  onValueChange={(v) => setForm({
                    ...form,
                    operation_type: v,
                    pipeline_type: v === 'rent' ? 'rentals_guest' : 'sales',
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Venta</SelectItem>
                    <SelectItem value="rent">Renta</SelectItem>
                    <SelectItem value="both">Venta y renta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Intención de renta</Label>
                <Select value={form.rental_intent || 'none'} onValueChange={(v) => setForm({ ...form, rental_intent: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No aplica</SelectItem>
                    <SelectItem value="guest_short_term">Huésped corta estancia</SelectItem>
                    <SelectItem value="tenant_long_term">Inquilino largo plazo</SelectItem>
                    <SelectItem value="owner_wants_management">Propietario busca administración</SelectItem>
                    <SelectItem value="investor_airbnb">Inversionista Airbnb</SelectItem>
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
            {(form.operation_type === 'rent' || form.operation_type === 'both') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presupuesto mensual</Label>
                  <Input
                    type="number"
                    value={form.monthly_budget_mxn}
                    onChange={(e) => setForm({ ...form, monthly_budget_mxn: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Presupuesto por noche</Label>
                  <Input
                    type="number"
                    value={form.nightly_budget_mxn}
                    onChange={(e) => setForm({ ...form, nightly_budget_mxn: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-in deseado</Label>
                  <Input
                    type="date"
                    value={form.desired_check_in}
                    onChange={(e) => setForm({ ...form, desired_check_in: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out deseado</Label>
                  <Input
                    type="date"
                    value={form.desired_check_out}
                    onChange={(e) => setForm({ ...form, desired_check_out: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Huéspedes</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.guests_count}
                    onChange={(e) => setForm({ ...form, guests_count: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zona preferida</Label>
                  <Input
                    value={form.preferred_zone}
                    onChange={(e) => setForm({ ...form, preferred_zone: e.target.value })}
                    placeholder="Ej: La Veleta"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setForm((prev) => ({ ...prev, tags: normalizeLeadTagsInput(e.target.value) }));
                }}
                placeholder="Ej: inversionista, open house, seguimiento"
              />
              <p className="text-xs text-muted-foreground">
                Separa tags con comas para poder segmentar campañas después.
              </p>
            </div>
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
              <div>
                <h4 className="font-medium">Preferencias de contacto</h4>
                <p className="text-sm text-muted-foreground">Marca solo los canales que este lead no desea recibir.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { key: 'email_opt_out', label: 'No email' },
                  { key: 'sms_opt_out', label: 'No SMS' },
                  { key: 'whatsapp_opt_out', label: 'No WhatsApp' },
                  { key: 'call_opt_out', label: 'No llamadas' },
                ].map((preference) => (
                  <div key={preference.key} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                    <span className="text-sm">{preference.label}</span>
                    <Switch
                      checked={Boolean(form[preference.key])}
                      onCheckedChange={(checked) => setForm((prev) => ({ ...prev, [preference.key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>
            {customFields.length > 0 && (
              <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
                <div>
                  <h4 className="font-medium">Campos personalizados</h4>
                  <p className="text-sm text-muted-foreground">Completa información adicional del lead si aplica.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>{field.label}</Label>
                      {field.field_type === 'textarea' ? (
                        <Textarea
                          value={form.custom_fields_data?.[field.key] || ''}
                          onChange={(e) => setForm((prev) => ({
                            ...prev,
                            custom_fields_data: {
                              ...prev.custom_fields_data,
                              [field.key]: e.target.value,
                            },
                          }))}
                        />
                      ) : field.field_type === 'select' ? (
                        <Select
                          value={form.custom_fields_data?.[field.key] || 'none'}
                          onValueChange={(value) => setForm((prev) => ({
                            ...prev,
                            custom_fields_data: {
                              ...prev.custom_fields_data,
                              [field.key]: value === 'none' ? '' : value,
                            },
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar opción" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin valor</SelectItem>
                            {(field.options || []).map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.field_type === 'boolean' ? (
                        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                          <span className="text-sm text-muted-foreground">Activar valor</span>
                          <Switch
                            checked={Boolean(form.custom_fields_data?.[field.key])}
                            onCheckedChange={(checked) => setForm((prev) => ({
                              ...prev,
                              custom_fields_data: {
                                ...prev.custom_fields_data,
                                [field.key]: checked,
                              },
                            }))}
                          />
                        </div>
                      ) : (
                        <Input
                          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                          value={form.custom_fields_data?.[field.key] || ''}
                          onChange={(e) => setForm((prev) => ({
                            ...prev,
                            custom_fields_data: {
                              ...prev.custom_fields_data,
                              [field.key]: normalizeLeadCustomFieldValue(field, e.target.value),
                            },
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} className="rounded-full">
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

      {/* Duplicate Detection Modal */}
      <DuplicateDetectionModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setLeadDataToCheck(null);
        }}
        leadData={leadDataToCheck}
        onConfirm={async (finalLeadData) => {
          setLoading(true);
          try {
            await api.post('/leads', finalLeadData);
            toast.success('Lead creado exitosamente');
            onCreated();
            handleClose();
          } catch (error) {
            toast.error('Error al crear lead');
          } finally {
            setLoading(false);
            setShowDuplicateModal(false);
            setLeadDataToCheck(null);
          }
        }}
        onMergeSuggestion={async (duplicate) => {
          // TODO: Implement merge logic
          toast.info('Fusión de leads no implementada aún');
        }}
      />
    </>
  );
};

export const LeadsPage = () => {
  const { api } = useAuth();
  const [leads, setLeads] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [customFieldManagerOpen, setCustomFieldManagerOpen] = useState(false);
  const [editingCustomField, setEditingCustomField] = useState(null);
  const [customFieldForm, setCustomFieldForm] = useState(EMPTY_CUSTOM_FIELD);
  const [savingCustomField, setSavingCustomField] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  // View toggle state
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  
  // Filter states
  const [statusFilters, setStatusFilters] = useState([]);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [sourceFilters, setSourceFilters] = useState([]);
  const [customFieldFilters, setCustomFieldFilters] = useState({});
  
  // Sort state for table view
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

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
    loadCustomFields();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await api.get('/leads?page_size=1000');
      setLeads(Array.isArray(res.data) ? res.data : (res.data?.leads || []));
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFields = async () => {
    try {
      const res = await api.get('/custom-fields?entity_type=leads');
      setCustomFields(Array.isArray(res.data) ? res.data.filter((field) => field.is_active) : []);
    } catch (error) {
      console.error('Error loading lead custom fields:', error);
    }
  };
  
  // Toggle filter helper
  const toggleFilter = (filterArray, setFilterArray, value) => {
    if (filterArray.includes(value)) {
      setFilterArray(filterArray.filter(f => f !== value));
    } else {
      setFilterArray([...filterArray, value]);
    }
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setSourceFilters([]);
    setCustomFieldFilters({});
    setSearch('');
  };
  
  // Get unique sources from leads
  const uniqueSources = useMemo(() => {
    const sources = [...new Set(leads.map(l => l.source).filter(Boolean))];
    return sources;
  }, [leads]);

  const filterableCustomFields = useMemo(
    () => customFields.filter((field) => field.show_in_filters),
    [customFields]
  );
  
  // Handle sort for table
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Apply all filters
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    // Text search
    if (search) {
      result = result.filter((lead) =>
        lead.name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search) ||
        lead.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilters.length > 0) {
      result = result.filter(lead => statusFilters.includes(lead.status));
    }
    
    // Priority filter
    if (priorityFilters.length > 0) {
      result = result.filter(lead => priorityFilters.includes(lead.priority));
    }
    
    // Source filter
    if (sourceFilters.length > 0) {
      result = result.filter(lead => sourceFilters.includes(lead.source));
    }

    if (filterableCustomFields.length > 0) {
      result = result.filter((lead) => (
        filterableCustomFields.every((field) => (
          matchesLeadCustomFieldFilter(field, lead.custom_fields_data?.[field.key], customFieldFilters[field.key])
        ))
      ));
    }
    
    return result;
  }, [customFieldFilters, filterableCustomFields, leads, search, sourceFilters, statusFilters, priorityFilters]);
  
  // Sorted leads for table view
  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle null/undefined
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      
      // Numeric sort for budget and intent_score
      if (sortConfig.key === 'budget_mxn' || sortConfig.key === 'intent_score') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredLeads, sortConfig]);
  
  // Check if any filters are active
  const hasActiveFilters = statusFilters.length > 0 || priorityFilters.length > 0 || sourceFilters.length > 0 || Object.values(customFieldFilters).some(Boolean) || search;

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
  const visibleLeadTableFields = useMemo(
    () => customFields.filter((field) => field.show_in_table).slice(0, 3),
    [customFields]
  );

  const openCustomFieldManager = () => {
    setEditingCustomField(null);
    setCustomFieldForm(EMPTY_CUSTOM_FIELD);
    setCustomFieldManagerOpen(true);
  };

  const resetCustomFieldEditor = () => {
    setEditingCustomField(null);
    setCustomFieldForm(EMPTY_CUSTOM_FIELD);
  };

  const editCustomField = (field) => {
    setEditingCustomField(field);
    setCustomFieldForm({
      label: field.label,
      key: field.key,
      entity_type: 'leads',
      field_type: field.field_type,
      options: field.options || [],
      required: field.required ?? false,
      is_active: field.is_active ?? true,
      show_in_table: field.show_in_table ?? false,
      show_in_card: field.show_in_card ?? false,
      show_in_filters: field.show_in_filters ?? false,
      sort_order: field.sort_order ?? 0,
    });
    setCustomFieldManagerOpen(true);
  };

  const saveCustomField = async () => {
    if (!customFieldForm.label.trim()) {
      toast.error('El label es requerido');
      return;
    }

    const payload = {
      ...customFieldForm,
      key: customFieldForm.key.trim() || customFieldForm.label,
      entity_type: 'leads',
    };

    setSavingCustomField(true);
    try {
      if (editingCustomField) {
        await api.put(`/custom-fields/${editingCustomField.id}`, payload);
        toast.success('Campo de lead actualizado');
      } else {
        await api.post('/custom-fields', payload);
        toast.success('Campo de lead creado');
      }
      await loadCustomFields();
      resetCustomFieldEditor();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el campo');
    } finally {
      setSavingCustomField(false);
    }
  };

  const deleteCustomField = async (fieldId) => {
    if (!window.confirm('¿Eliminar este campo personalizado de leads?')) return;
    try {
      await api.delete(`/custom-fields/${fieldId}`);
      toast.success('Campo eliminado');
      await loadCustomFields();
      if (editingCustomField?.id === fieldId) {
        resetCustomFieldEditor();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el campo');
    }
  };

  const moveCustomField = async (field, direction) => {
    const currentIndex = customFields.findIndex((item) => item.id === field.id);
    const swapIndex = currentIndex + direction;
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= customFields.length) return;

    const swapField = customFields[swapIndex];
    try {
      await Promise.all([
        api.put(`/custom-fields/${field.id}`, { sort_order: swapField.sort_order ?? swapIndex }),
        api.put(`/custom-fields/${swapField.id}`, { sort_order: field.sort_order ?? currentIndex }),
      ]);
      await loadCustomFields();
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo reordenar el campo');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 h-full flex flex-col" data-testid="leads-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Pipeline de Leads</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {filteredLeads.length} de {leads.length} prospectos
            {viewMode === 'kanban' && ' • Arrastra para cambiar estado'}
            {viewMode === 'table' && visibleLeadTableFields.length > 0 && ` • ${visibleLeadTableFields.length} campos personalizados visibles`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-md h-8 px-3"
              data-testid="view-kanban-btn"
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-md h-8 px-3"
              data-testid="view-table-btn"
            >
              <Table2 className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Tabla</span>
            </Button>
          </div>
          <Button variant="outline" onClick={openCustomFieldManager} className="rounded-full">
            <Settings2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Campos</span>
          </Button>
          <Button onClick={() => setShowNewModal(true)} className="rounded-full" data-testid="new-lead-btn">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Lead</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="leads-search"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
        
        {/* Filter Bubbles */}
        <div className="space-y-2">
          {/* Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3" /> Estado:
            </span>
            {Object.entries(statusConfig).map(([key, config]) => (
              <FilterBubble
                key={key}
                label={config.label}
                isActive={statusFilters.includes(key)}
                onClick={() => toggleFilter(statusFilters, setStatusFilters, key)}
                color={config.color}
              />
            ))}
          </div>
          
          {/* Priority Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Prioridad:</span>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <FilterBubble
                key={key}
                label={config.label}
                isActive={priorityFilters.includes(key)}
                onClick={() => toggleFilter(priorityFilters, setPriorityFilters, key)}
                color={config.color}
              />
            ))}
          </div>
          
          {/* Source Filters */}
          {uniqueSources.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Fuente:</span>
              {uniqueSources.map((source) => {
                const config = sourceConfig[source] || { label: source, color: 'bg-gray-400' };
                return (
                  <FilterBubble
                    key={source}
                    label={config.label}
                    isActive={sourceFilters.includes(source)}
                    onClick={() => toggleFilter(sourceFilters, setSourceFilters, source)}
                    color={config.color}
                  />
                );
              })}
            </div>
          )}

          {filterableCustomFields.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">Campos personalizados:</span>
                <Badge variant="outline">{filterableCustomFields.length}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {filterableCustomFields.map((field) => {
                  const filterValue = customFieldFilters[field.key] ?? '';

                  if (field.field_type === 'select') {
                    return (
                      <div key={field.id}>
                        <Label className="mb-2 block text-xs">{field.label}</Label>
                        <Select
                          value={filterValue || 'all'}
                          onValueChange={(value) => setCustomFieldFilters((prev) => ({
                            ...prev,
                            [field.key]: value === 'all' ? '' : value,
                          }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {(field.options || []).map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  if (field.field_type === 'boolean') {
                    return (
                      <div key={field.id}>
                        <Label className="mb-2 block text-xs">{field.label}</Label>
                        <Select
                          value={filterValue || 'all'}
                          onValueChange={(value) => setCustomFieldFilters((prev) => ({
                            ...prev,
                            [field.key]: value,
                          }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="true">Sí</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  return (
                    <div key={field.id}>
                      <Label className="mb-2 block text-xs">{field.label}</Label>
                      <Input
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                        value={filterValue}
                        placeholder="Filtrar..."
                        onChange={(event) => setCustomFieldFilters((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-muted-foreground">Filtros activos:</span>
            {statusFilters.map(s => (
              <ActiveFilterTag 
                key={`status-${s}`} 
                label={statusConfig[s]?.label} 
                onRemove={() => toggleFilter(statusFilters, setStatusFilters, s)} 
              />
            ))}
            {priorityFilters.map(p => (
              <ActiveFilterTag 
                key={`priority-${p}`} 
                label={priorityConfig[p]?.label} 
                onRemove={() => toggleFilter(priorityFilters, setPriorityFilters, p)} 
              />
            ))}
            {sourceFilters.map(s => (
              <ActiveFilterTag 
                key={`source-${s}`} 
                label={sourceConfig[s]?.label || s} 
                onRemove={() => toggleFilter(sourceFilters, setSourceFilters, s)} 
              />
            ))}
            {filterableCustomFields.map((field) => (
              customFieldFilters[field.key] ? (
                <ActiveFilterTag
                  key={`custom-${field.key}`}
                  label={`${field.label}: ${customFieldFilters[field.key] === 'true' ? 'Sí' : customFieldFilters[field.key] === 'false' ? 'No' : customFieldFilters[field.key]}`}
                  onRemove={() => setCustomFieldFilters((prev) => ({ ...prev, [field.key]: '' }))}
                />
              ) : null
            ))}
          </div>
        )}
      </div>

      {/* Content */}
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
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
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
      ) : (
        /* Table View */
        <div className="flex-1 overflow-auto">
          <LeadsTableView
            leads={sortedLeads}
            onLeadClick={setSelectedLead}
            onStatusChange={handleLeadUpdate}
            sortConfig={sortConfig}
            onSort={handleSort}
            customFields={customFields}
          />
        </div>
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
        api={api}
        customFields={customFields}
      />

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={loadLeads}
        api={api}
        customFields={customFields}
      />

      <Dialog open={customFieldManagerOpen} onOpenChange={setCustomFieldManagerOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-5xl min-h-0 flex-col overflow-hidden p-0">
          <DialogHeader className="border-b px-6 pb-4 pt-6">
            <DialogTitle>Campos personalizados de Leads</DialogTitle>
            <DialogDescription>Administra los datos extra del pipeline sin salir del módulo.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
          <div className="grid min-w-[920px] gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campos definidos</CardTitle>
                <CardDescription>{customFields.length} campos activos para leads.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {customFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no hay campos personalizados de leads.</p>
                ) : (
                  customFields.map((field) => (
                    <div key={field.id} className="flex items-start justify-between rounded-xl border border-border/70 p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{field.label}</p>
                          <Badge variant="outline">{field.field_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">key: {field.key}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {field.show_in_card && <span>Visible en ficha</span>}
                          {field.show_in_table && <span>Visible en tabla</span>}
                          {field.show_in_filters && <span>Marcado para filtros</span>}
                          {field.required && <span>Requerido</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => moveCustomField(field, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => moveCustomField(field, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => editCustomField(field)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCustomField(field.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{editingCustomField ? 'Editar campo' : 'Nuevo campo'}</CardTitle>
                <CardDescription>Define el tipo y dónde se ve dentro del pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Label</Label>
                    <Input value={customFieldForm.label} onChange={(event) => setCustomFieldForm((prev) => ({ ...prev, label: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Key</Label>
                    <Input value={customFieldForm.key} onChange={(event) => setCustomFieldForm((prev) => ({ ...prev, key: event.target.value }))} placeholder="se autogenera si lo dejas vacío" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={customFieldForm.field_type} onValueChange={(value) => setCustomFieldForm((prev) => ({ ...prev, field_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Texto largo</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="multi_select">Multi select</SelectItem>
                        <SelectItem value="boolean">Booleano</SelectItem>
                        <SelectItem value="date">Fecha</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Orden</Label>
                    <Input type="number" value={customFieldForm.sort_order} onChange={(event) => setCustomFieldForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))} />
                  </div>
                </div>

                {(customFieldForm.field_type === 'select' || customFieldForm.field_type === 'multi_select') && (
                  <div>
                    <Label>Opciones (coma)</Label>
                    <Input
                      value={customFieldForm.options.join(', ')}
                      onChange={(event) => setCustomFieldForm((prev) => ({
                        ...prev,
                        options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      }))}
                    />
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  {[
                    ['required', 'Campo requerido'],
                    ['is_active', 'Campo activo'],
                    ['show_in_table', 'Mostrar en tabla'],
                    ['show_in_card', 'Mostrar en ficha'],
                    ['show_in_filters', 'Mostrar en filtros'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={Boolean(customFieldForm[key])}
                        onCheckedChange={(checked) => setCustomFieldForm((prev) => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={resetCustomFieldEditor}>Limpiar</Button>
                  <Button onClick={saveCustomField} disabled={savingCustomField}>
                    {savingCustomField && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCustomField ? 'Actualizar' : 'Crear campo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

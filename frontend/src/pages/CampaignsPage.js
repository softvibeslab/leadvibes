import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Phone, MessageSquare, Plus, Play, Pause, CheckCircle, Clock,
  Users, Send, Loader2, PhoneCall, MessageCircle, BarChart3,
  Brain, TrendingUp, AlertCircle, Filter, Search, X, Eye, Mail, MailOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Status config
const campaignStatusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-500', icon: Clock },
  scheduled: { label: 'Programada', color: 'bg-blue-500', icon: Clock },
  running: { label: 'En Curso', color: 'bg-amber-500', icon: Play },
  completed: { label: 'Completada', color: 'bg-green-500', icon: CheckCircle },
  paused: { label: 'Pausada', color: 'bg-orange-500', icon: Pause },
  failed: { label: 'Fallida', color: 'bg-red-500', icon: AlertCircle },
};

const sentimentConfig = {
  positivo: { label: 'Positivo', color: 'text-green-500', bg: 'bg-green-500/10' },
  neutral: { label: 'Neutral', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  negativo: { label: 'Negativo', color: 'text-red-500', bg: 'bg-red-500/10' },
};

// Campaign Card Component
const CampaignCard = ({ campaign, onStart, onViewDetails }) => {
  const status = campaignStatusConfig[campaign.status] || campaignStatusConfig.draft;
  const StatusIcon = status.icon;
  const progress = campaign.total_recipients > 0 
    ? (campaign.sent_count / campaign.total_recipients) * 100 
    : 0;

  const getTypeIcon = () => {
    switch(campaign.campaign_type) {
      case 'call': return <Phone className="w-4 h-4 text-blue-500" />;
      case 'sms': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'email': return <Mail className="w-4 h-4 text-purple-500" />;
      default: return <Send className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <h3 className="font-medium text-sm truncate">{campaign.name}</h3>
          </div>
          <Badge className={`${status.color} text-white text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{campaign.sent_count} / {campaign.total_recipients} enviados</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(campaign.created_at), "d MMM yyyy", { locale: es })}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onViewDetails(campaign)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {campaign.status === 'draft' && (
              <Button 
                size="sm"
                onClick={() => onStart(campaign.id)}
                className="h-7"
              >
                <Play className="w-3 h-3 mr-1" /> Iniciar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Call Record Card
const CallRecordCard = ({ record, onAnalyze }) => {
  const statusColors = {
    queued: 'bg-gray-400',
    ringing: 'bg-blue-400',
    in_progress: 'bg-amber-400',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    no_answer: 'bg-orange-400',
    busy: 'bg-purple-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${statusColors[record.status] || 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{record.lead_name || 'Lead'}</p>
        <p className="text-xs text-muted-foreground">{record.phone_number}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground capitalize">{record.status}</p>
        {record.duration_seconds && (
          <p className="text-xs font-medium">{Math.round(record.duration_seconds)}s</p>
        )}
      </div>
      {record.status === 'completed' && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAnalyze(record)}>
          <Brain className="w-4 h-4 text-primary" />
        </Button>
      )}
    </div>
  );
};

// SMS Record Card
const SMSRecordCard = ({ record }) => {
  const statusColors = {
    queued: 'bg-gray-400',
    sent: 'bg-blue-400',
    delivered: 'bg-green-500',
    failed: 'bg-red-500',
    undelivered: 'bg-orange-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${statusColors[record.status] || 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{record.lead_name || 'Lead'}</p>
        <p className="text-xs text-muted-foreground truncate">{record.message}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground capitalize">{record.status}</p>
        {record.sent_at && (
          <p className="text-xs">{format(new Date(record.sent_at), "HH:mm")}</p>
        )}
      </div>
    </div>
  );
};

// Email Record Card
const EmailRecordCard = ({ record }) => {
  const statusColors = {
    queued: 'bg-gray-400',
    sent: 'bg-blue-400',
    delivered: 'bg-green-500',
    opened: 'bg-purple-500',
    clicked: 'bg-primary',
    bounced: 'bg-orange-400',
    failed: 'bg-red-500',
  };

  const statusLabels = {
    queued: 'En cola',
    sent: 'Enviado',
    delivered: 'Entregado',
    opened: 'Abierto',
    clicked: 'Click',
    bounced: 'Rebotado',
    failed: 'Fallido',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${statusColors[record.status] || 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{record.lead_name || 'Lead'}</p>
        <p className="text-xs text-muted-foreground truncate">{record.subject}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {record.status === 'opened' && <MailOpen className="w-3 h-3 text-purple-500" />}
          <span>{statusLabels[record.status] || record.status}</span>
        </div>
        {record.sent_at && (
          <p className="text-xs">{format(new Date(record.sent_at), "d MMM HH:mm", { locale: es })}</p>
        )}
      </div>
    </div>
  );
};

// Analysis Modal (DEMO)
const AnalysisModal = ({ isOpen, onClose, analysis }) => {
  if (!analysis) return null;
  
  const sentiment = sentimentConfig[analysis.sentiment] || sentimentConfig.neutral;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Análisis de Conversación
          </DialogTitle>
          <DialogDescription>
            Análisis AI de la llamada con {analysis.lead_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sentiment & Score */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sentimiento:</span>
              <Badge className={sentiment.bg}>
                <span className={sentiment.color}>{sentiment.label}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Confianza:</span>
              <span className="font-bold text-primary">{Math.round(analysis.confidence_score * 100)}%</span>
            </div>
          </div>
          
          {/* Intent */}
          <div>
            <Label className="text-xs text-muted-foreground">Intención Detectada</Label>
            <p className="font-medium capitalize">{analysis.intent_detected}</p>
          </div>
          
          {/* Key Topics */}
          <div>
            <Label className="text-xs text-muted-foreground">Temas Clave</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {analysis.key_topics.map((topic, idx) => (
                <Badge key={idx} variant="outline" className="text-xs capitalize">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Action Items */}
          <div>
            <Label className="text-xs text-muted-foreground">Acciones Recomendadas</Label>
            <ul className="mt-1 space-y-1">
              {analysis.action_items.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Follow-up */}
          {analysis.follow_up_recommended && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <TrendingUp className="w-4 h-4" />
                Seguimiento Recomendado
              </div>
              {analysis.follow_up_reason && (
                <p className="text-xs text-muted-foreground mt-1">{analysis.follow_up_reason}</p>
              )}
            </div>
          )}
          
          <Badge variant="secondary" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            DEMO - Datos de ejemplo
          </Badge>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// New Campaign Modal
const NewCampaignModal = ({ isOpen, onClose, onCreated, api, leads }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    campaign_type: 'call',
    message_template: '',
    email_subject: '',
    lead_ids: [],
    use_filter: false,
    filter_status: [],
    filter_priority: []
  });

  const statusOptions = ['nuevo', 'contactado', 'calificacion', 'presentacion'];
  const priorityOptions = ['baja', 'media', 'alta', 'urgente'];

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Ingresa un nombre para la campaña');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        campaign_type: form.campaign_type,
        message_template: form.message_template,
        email_subject: form.email_subject,
        lead_ids: form.use_filter ? [] : form.lead_ids,
        lead_filter: form.use_filter ? {
          status: form.filter_status.length > 0 ? form.filter_status : undefined,
          priority: form.filter_priority.length > 0 ? form.filter_priority : undefined
        } : undefined
      };
      
      await api.post('/campaigns', payload);
      toast.success('Campaña creada');
      onCreated();
      onClose();
      setForm({
        name: '',
        campaign_type: 'call',
        message_template: '',
        email_subject: '',
        lead_ids: [],
        use_filter: false,
        filter_status: [],
        filter_priority: []
      });
    } catch (error) {
      toast.error('Error al crear campaña');
    } finally {
      setLoading(false);
    }
  };

  const toggleLeadSelection = (leadId) => {
    setForm(prev => ({
      ...prev,
      lead_ids: prev.lead_ids.includes(leadId)
        ? prev.lead_ids.filter(id => id !== leadId)
        : [...prev.lead_ids, leadId]
    }));
  };

  const toggleFilter = (type, value) => {
    const key = type === 'status' ? 'filter_status' : 'filter_priority';
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Campaña</DialogTitle>
          <DialogDescription>
            Crea una campaña de llamadas o SMS masivos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Campaña</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Seguimiento leads nuevos"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tipo de Campaña</Label>
            <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Llamadas (VAPI)
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> SMS (Twilio)
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email (SendGrid)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {form.campaign_type === 'sms' && (
            <div className="space-y-2">
              <Label>Plantilla del Mensaje</Label>
              <Textarea
                value={form.message_template}
                onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                placeholder="Hola {nombre}, te contactamos de LeadVibes..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Usa {'{nombre}'} para personalizar con el nombre del lead
              </p>
            </div>
          )}
          
          {form.campaign_type === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Asunto del Email</Label>
                <Input
                  value={form.email_subject}
                  onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                  placeholder="¡Hola {nombre}! Tenemos una propiedad perfecta para ti"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenido HTML</Label>
                <Textarea
                  value={form.message_template}
                  onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                  placeholder={`<h1>Hola {nombre}</h1>\n<p>Te presentamos las mejores opciones...</p>\n<a href="#">Ver propiedades</a>`}
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Usa {'{nombre}'} para personalizar. Soporta HTML completo.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.use_filter}
                onCheckedChange={(checked) => setForm({ ...form, use_filter: checked })}
              />
              <Label className="cursor-pointer">Usar filtros en lugar de selección manual</Label>
            </div>
          </div>
          
          {form.use_filter ? (
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <div>
                <Label className="text-xs">Filtrar por Estado</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {statusOptions.map(status => (
                    <Badge
                      key={status}
                      variant={form.filter_status.includes(status) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleFilter('status', status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Filtrar por Prioridad</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {priorityOptions.map(priority => (
                    <Badge
                      key={priority}
                      variant={form.filter_priority.includes(priority) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleFilter('priority', priority)}
                    >
                      {priority}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Seleccionar Leads ({form.lead_ids.length} seleccionados)</Label>
              <ScrollArea className="h-48 rounded-lg border p-2">
                <div className="space-y-1">
                  {leads.map(lead => (
                    <div
                      key={lead.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        form.lead_ids.includes(lead.id) ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleLeadSelection(lead.id)}
                    >
                      <Checkbox checked={form.lead_ids.includes(lead.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear Campaña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export const CampaignsPage = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [callRecords, setCallRecords] = useState([]);
  const [smsRecords, setSmsRecords] = useState([]);
  const [emailRecords, setEmailRecords] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState({ vapi: false, twilio: false, sendgrid: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, callsRes, smsRes, emailsRes, leadsRes, analyticsRes, settingsRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/calls'),
        api.get('/sms'),
        api.get('/emails'),
        api.get('/leads'),
        api.get('/analytics/communications'),
        api.get('/settings/integrations')
      ]);
      setCampaigns(campaignsRes.data);
      setCallRecords(callsRes.data);
      setSmsRecords(smsRes.data);
      setEmailRecords(emailsRes.data);
      setLeads(leadsRes.data);
      setAnalytics(analyticsRes.data);
      setIntegrationStatus({
        vapi: settingsRes.data.vapi_enabled,
        twilio: settingsRes.data.twilio_enabled,
        sendgrid: settingsRes.data.sendgrid_enabled
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId) => {
    try {
      const res = await api.post(`/campaigns/${campaignId}/start`);
      toast.success(`Campaña iniciada: ${res.data.success} enviados, ${res.data.failed} fallidos`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar campaña');
    }
  };

  const handleAnalyzeCall = async (record) => {
    try {
      const res = await api.get(`/calls/${record.id}/analysis`);
      setSelectedAnalysis(res.data);
      setShowAnalysisModal(true);
    } catch (error) {
      toast.error('Error al obtener análisis');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" data-testid="campaigns-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Campañas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Llamadas masivas y SMS con IA</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Nueva Campaña
        </Button>
      </div>

      {/* Integration Status Warning */}
      {(!integrationStatus.vapi || !integrationStatus.twilio || !integrationStatus.sendgrid) && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Configuración pendiente</p>
              <p className="text-xs text-muted-foreground">
                {!integrationStatus.vapi && 'VAPI no configurado. '}
                {!integrationStatus.twilio && 'Twilio no configurado. '}
                {!integrationStatus.sendgrid && 'SendGrid no configurado. '}
                Ve a Configuración {'>'} Integraciones para activar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.calls?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Llamadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.sms?.total || 0}</p>
                <p className="text-xs text-muted-foreground">SMS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.emails?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MailOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.emails?.open_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Tasa Apertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.campaigns?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Campañas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="campaigns" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Campañas</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Llamadas</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onStart={handleStartCampaign}
                  onViewDetails={(c) => console.log('View details', c)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No hay campañas creadas</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setShowNewModal(true)}
                >
                  Crear primera campaña
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calls Tab */}
        <TabsContent value="calls">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                Historial de Llamadas
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Llamadas realizadas con VAPI AI
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {callRecords.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {callRecords.map(record => (
                      <CallRecordCard 
                        key={record.id} 
                        record={record} 
                        onAnalyze={handleAnalyzeCall}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Phone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">No hay llamadas registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                Historial de SMS
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Mensajes enviados con Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {smsRecords.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {smsRecords.map(record => (
                      <SMSRecordCard key={record.id} record={record} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">No hay SMS registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-500" />
                Historial de Emails
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Emails enviados con SendGrid • {analytics?.emails?.open_rate || 0}% tasa de apertura
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {emailRecords.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {emailRecords.map(record => (
                      <EmailRecordCard key={record.id} record={record} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">No hay emails registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewCampaignModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={loadData}
        api={api}
        leads={leads}
      />
      
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysis={selectedAnalysis}
      />
    </div>
  );
};

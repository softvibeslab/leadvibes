import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Phone, MessageSquare, Plus, Play, Pause, CheckCircle, Clock,
  Users, Send, Loader2, PhoneCall, MessageCircle,
  Brain, TrendingUp, AlertCircle, Filter, Search, Eye, Mail, MailOpen,
  Grid3x3, Sparkles, ArrowRight, Settings2, Rocket, SlidersHorizontal,
  BadgeCheck, Layers3, Target, BookmarkPlus, Bookmark, Tag, Trash2
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
import { EmailTemplateCard } from '../components/email/EmailTemplateCard';
import { EmailTemplatePreviewDialog } from '../components/email/EmailTemplatePreview';

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

const campaignChannelMeta = {
  email: {
    label: 'Email masivo',
    icon: Mail,
    accent: 'text-purple-500',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/10',
  },
  sms: {
    label: 'SMS',
    icon: MessageSquare,
    accent: 'text-green-500',
    border: 'border-green-500/20',
    bg: 'bg-green-500/10',
  },
  call: {
    label: 'Llamadas IA',
    icon: PhoneCall,
    accent: 'text-blue-500',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/10',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    accent: 'text-emerald-500',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10',
  },
};

const hasLeadEmail = (lead) => Boolean(String(lead?.email || '').trim());
const hasLeadPhone = (lead) => Boolean(String(lead?.phone || '').trim());
const hasLeadInterest = (lead) => {
  const propertyInterest = String(lead?.property_interest || '').trim();
  return Boolean(propertyInterest) || Array.isArray(lead?.interested_product_ids) && lead.interested_product_ids.length > 0;
};

const leadTags = (lead) => Array.isArray(lead?.tags) ? lead.tags.filter(Boolean) : [];
const formatTagLabel = (tag) => String(tag || '').trim().replace(/[-_]+/g, ' ');
const leadAllowsCampaignChannel = (lead, campaignType) => {
  if (campaignType === 'email') return !lead?.email_opt_out;
  if (campaignType === 'sms') return !lead?.sms_opt_out;
  if (campaignType === 'whatsapp') return !lead?.whatsapp_opt_out;
  if (campaignType === 'call') return !lead?.call_opt_out;
  return true;
};

const matchesAudienceFilter = (lead, filter = {}, campaignType = null) => {
  const selectedStatuses = Array.isArray(filter.status) ? filter.status.filter(Boolean) : [];
  const selectedPriorities = Array.isArray(filter.priority) ? filter.priority.filter(Boolean) : [];
  const selectedSources = Array.isArray(filter.source) ? filter.source.filter(Boolean) : [];
  const selectedTags = Array.isArray(filter.tags) ? filter.tags.filter(Boolean) : [];

  if (selectedStatuses.length > 0 && !selectedStatuses.includes(lead.status)) return false;
  if (selectedPriorities.length > 0 && !selectedPriorities.includes(lead.priority)) return false;
  if (selectedSources.length > 0 && !selectedSources.includes(lead.source)) return false;
  if (selectedTags.length > 0 && !leadTags(lead).some((tag) => selectedTags.includes(tag))) return false;

  if (filter.require_email && !hasLeadEmail(lead)) return false;
  if (filter.require_phone && !hasLeadPhone(lead)) return false;
  if (filter.has_product_interest === true && !hasLeadInterest(lead)) return false;
  if (filter.has_product_interest === false && hasLeadInterest(lead)) return false;

  if (!leadAllowsCampaignChannel(lead, campaignType)) return false;
  if (campaignType === 'email' && !hasLeadEmail(lead)) return false;
  if ((campaignType === 'sms' || campaignType === 'call' || campaignType === 'whatsapp') && !hasLeadPhone(lead)) return false;

  return true;
};

const countAudience = (leads = [], filter = {}, campaignType = null) =>
  leads.filter((lead) => matchesAudienceFilter(lead, filter, campaignType)).length;

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
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-emerald-500" />;
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
          <div className="flex flex-wrap gap-2">
            {campaign.saved_segment_id && (
              <Badge variant="outline" className="text-[10px]">
                Segmento guardado
              </Badge>
            )}
            {campaign.ab_test_enabled && (
              <Badge variant="outline" className="text-[10px]">
                A/B test
              </Badge>
            )}
          </div>
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

const WhatsAppRecordCard = ({ record }) => {
  const statusColors = {
    queued: 'bg-gray-400',
    sent: 'bg-emerald-400',
    delivered: 'bg-green-500',
    read: 'bg-teal-500',
    failed: 'bg-red-500',
    undelivered: 'bg-orange-400',
  };

  const statusLabels = {
    queued: 'En cola',
    sent: 'Enviado',
    delivered: 'Entregado',
    read: 'Leído',
    failed: 'Fallido',
    undelivered: 'No entregado',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full ${statusColors[record.status] || 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{record.lead_name || 'Lead'}</p>
        <p className="text-xs text-muted-foreground truncate">{record.message}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground capitalize">{statusLabels[record.status] || record.status}</p>
        {record.sent_at && (
          <p className="text-xs">{format(new Date(record.sent_at), "d MMM HH:mm", { locale: es })}</p>
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
const NewCampaignModal = ({
  isOpen,
  onClose,
  onCreated,
  api,
  leads,
  emailTemplates,
  initialConfig = null,
  savedSegments = [],
  onSegmentsChanged,
  availableSources = [],
  integrationStatus = { vapi: false, twilio: false, sendgrid: false, whatsapp: false }
}) => {
  const buildInitialForm = (seed = {}) => ({
    name: seed.name || '',
    campaign_type: seed.campaign_type || 'email',
    message_template: seed.message_template || '',
    email_subject: seed.email_subject || '',
    email_template_id: seed.email_template_id || 'custom',
    saved_segment_id: seed.saved_segment_id || null,
    ab_test_enabled: Boolean(seed.ab_test_enabled),
    ab_test_name: seed.ab_test_name || '',
    ab_test_split_percentage: seed.ab_test_split_percentage || 50,
    variant_b_message_template: seed.variant_b_message_template || '',
    variant_b_email_subject: seed.variant_b_email_subject || '',
    lead_ids: Array.isArray(seed.lead_ids) ? seed.lead_ids : [],
    use_filter: Boolean(seed.use_filter),
    filter_status: Array.isArray(seed.filter_status) ? seed.filter_status : [],
    filter_priority: Array.isArray(seed.filter_priority) ? seed.filter_priority : [],
    filter_source: Array.isArray(seed.filter_source) ? seed.filter_source : [],
    filter_tags: Array.isArray(seed.filter_tags) ? seed.filter_tags : [],
    require_email: seed.require_email ?? false,
    require_phone: seed.require_phone ?? false,
    has_product_interest: Boolean(seed.has_product_interest),
  });

  const [loading, setLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [form, setForm] = useState(buildInitialForm(initialConfig || {}));
  const [showSaveSegmentDialog, setShowSaveSegmentDialog] = useState(false);
  const [savingSegment, setSavingSegment] = useState(false);
  const [segmentDraft, setSegmentDraft] = useState({
    name: '',
    description: '',
    color: 'blue',
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm(initialConfig || {}));
    setLeadSearch('');
    setShowSaveSegmentDialog(false);
    setSavingSegment(false);
    setSegmentDraft({
      name: initialConfig?.name ? `${initialConfig.name} · segmento` : '',
      description: '',
      color: 'blue',
    });
  }, [isOpen, initialConfig]);

  const statusOptions = Array.from(new Set(['nuevo', 'contactado', 'calificacion', 'presentacion', ...leads.map((lead) => lead.status).filter(Boolean)]));
  const priorityOptions = Array.from(new Set(['baja', 'media', 'alta', 'urgente', ...leads.map((lead) => lead.priority).filter(Boolean)]));
  const availableTags = Array.from(new Set(leads.flatMap((lead) => leadTags(lead)))).sort();
  const selectedTemplate = emailTemplates.find((template) => template.id === form.email_template_id);
  const selectedSavedSegment = savedSegments.find((segment) => segment.id === form.saved_segment_id);

  const currentLeadFilter = {
    status: form.filter_status,
    priority: form.filter_priority,
    source: form.filter_source,
    tags: form.filter_tags,
    require_email: form.require_email,
    require_phone: form.require_phone,
    has_product_interest: form.has_product_interest ? true : undefined,
  };

  const filteredAudienceCount = countAudience(leads, currentLeadFilter, form.campaign_type);
  const searchValue = leadSearch.trim().toLowerCase();
  const visibleLeads = leads.filter((lead) => {
    if (!searchValue) return true;
    return [
      lead.name,
      lead.email,
      lead.phone,
      lead.source,
      lead.property_interest,
      leadTags(lead).join(' '),
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
  });

  const readyChannelMap = {
    email: integrationStatus.sendgrid,
    sms: integrationStatus.twilio,
    whatsapp: integrationStatus.whatsapp,
    call: integrationStatus.vapi,
  };

  const quickSegments = [
    {
      id: 'new-leads',
      label: 'Nuevos por contactar',
      description: 'Alta velocidad para primeros toques.',
      patch: {
        use_filter: true,
        filter_status: ['nuevo', 'contactado'],
        filter_priority: [],
        filter_source: [],
        filter_tags: [],
        require_email: form.campaign_type === 'email',
        require_phone: form.campaign_type !== 'email',
        has_product_interest: undefined,
      },
    },
    {
      id: 'hot-buyers',
      label: 'Alta intención',
      description: 'Prioridad alta con interés activo.',
      patch: {
        use_filter: true,
        filter_status: [],
        filter_priority: ['alta', 'urgente'],
        filter_source: [],
        filter_tags: [],
        require_email: false,
        require_phone: true,
        has_product_interest: true,
      },
    },
    {
      id: 'email-ready',
      label: 'Listos para email',
      description: 'Base limpia con correo disponible.',
      patch: {
        use_filter: true,
        filter_status: [],
        filter_priority: [],
        filter_source: [],
        filter_tags: [],
        require_email: true,
        require_phone: false,
        has_product_interest: undefined,
      },
    },
    {
      id: 'product-interest',
      label: 'Con interés en producto',
      description: 'Perfectos para follow-up o promoción.',
      patch: {
        use_filter: true,
        filter_status: [],
        filter_priority: [],
        filter_source: [],
        filter_tags: [],
        require_email: form.campaign_type === 'email',
        require_phone: form.campaign_type !== 'email',
        has_product_interest: true,
      },
    },
  ];

  const activeAudienceCount = form.use_filter ? filteredAudienceCount : form.lead_ids.length;

  const toggleLeadSelection = (leadId) => {
    setForm((prev) => ({
      ...prev,
      lead_ids: prev.lead_ids.includes(leadId)
        ? prev.lead_ids.filter((id) => id !== leadId)
        : [...prev.lead_ids, leadId]
    }));
  };

  const toggleFilterValue = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value]
    }));
  };

  const selectVisibleLeads = () => {
    setForm((prev) => ({
      ...prev,
      lead_ids: Array.from(new Set([...prev.lead_ids, ...visibleLeads.map((lead) => lead.id)]))
    }));
  };

  const clearVisibleLeads = () => {
    const visibleIds = new Set(visibleLeads.map((lead) => lead.id));
    setForm((prev) => ({
      ...prev,
      lead_ids: prev.lead_ids.filter((id) => !visibleIds.has(id))
    }));
  };

  const applyQuickSegment = (segment) => {
    setForm((prev) => ({
      ...prev,
      ...segment.patch,
      use_filter: true,
      lead_ids: [],
    }));
  };

  const applySavedSegment = (segment) => {
    const filter = segment?.lead_filter || {};
    setForm((prev) => ({
      ...prev,
      saved_segment_id: segment?.id || null,
      campaign_type: segment?.campaign_type || prev.campaign_type,
      use_filter: true,
      lead_ids: [],
      filter_status: Array.isArray(filter.status) ? filter.status : [],
      filter_priority: Array.isArray(filter.priority) ? filter.priority : [],
      filter_source: Array.isArray(filter.source) ? filter.source : [],
      filter_tags: Array.isArray(filter.tags) ? filter.tags : [],
      require_email: Boolean(filter.require_email),
      require_phone: Boolean(filter.require_phone),
      has_product_interest: filter.has_product_interest === true,
    }));
  };

  const openSaveSegmentDialog = () => {
    if (!form.use_filter) {
      toast.error('Activa el modo segmento para guardar filtros reutilizables');
      return;
    }
    setSegmentDraft({
      name: form.name ? `${form.name} · segmento` : '',
      description: '',
      color: 'blue',
    });
    setShowSaveSegmentDialog(true);
  };

  const handleSaveSegment = async () => {
    if (!segmentDraft.name.trim()) {
      toast.error('Ponle nombre al segmento');
      return;
    }

    setSavingSegment(true);
    try {
      await api.post('/campaign-segments', {
        name: segmentDraft.name.trim(),
        description: segmentDraft.description.trim() || undefined,
        color: segmentDraft.color,
        campaign_type: form.campaign_type,
        lead_filter: currentLeadFilter,
      });
      toast.success('Segmento guardado');
      setShowSaveSegmentDialog(false);
      onSegmentsChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el segmento');
    } finally {
      setSavingSegment(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Ingresa un nombre para la campaña');
      return;
    }

    if ((form.campaign_type === 'sms' || form.campaign_type === 'whatsapp') && !form.message_template.trim()) {
      toast.error(`Agrega el mensaje base para la campaña ${form.campaign_type === 'whatsapp' ? 'WhatsApp' : 'SMS'}`);
      return;
    }

    if (form.campaign_type === 'email' && form.email_template_id === 'custom') {
      if (!form.email_subject.trim()) {
        toast.error('Agrega un asunto para el email');
        return;
      }
      if (!form.message_template.trim()) {
        toast.error('Agrega el contenido del email');
        return;
      }
    }

    if (form.ab_test_enabled && form.campaign_type !== 'call') {
      if ((form.campaign_type === 'sms' || form.campaign_type === 'whatsapp') && !form.variant_b_message_template.trim()) {
        toast.error('Agrega la variante B del mensaje para el test A/B');
        return;
      }
      if (form.campaign_type === 'email' && !form.variant_b_email_subject.trim() && !form.variant_b_message_template.trim()) {
        toast.error('Agrega al menos asunto o contenido variante B para el test A/B');
        return;
      }
    }

    if (form.use_filter && filteredAudienceCount === 0) {
      toast.error('El segmento actual no tiene leads válidos para este canal');
      return;
    }

    if (!form.use_filter && form.lead_ids.length === 0) {
      toast.error('Selecciona al menos un lead o usa un segmento');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        campaign_type: form.campaign_type,
        message_template: form.message_template,
        email_subject: form.email_subject,
        email_template_id: form.campaign_type === 'email' && form.email_template_id !== 'custom' ? form.email_template_id : undefined,
        saved_segment_id: form.use_filter ? form.saved_segment_id || undefined : undefined,
        ab_test_enabled: form.ab_test_enabled && form.campaign_type !== 'call',
        ab_test_name: form.ab_test_enabled ? (form.ab_test_name || `${form.name.trim()} · A/B`) : undefined,
        ab_test_split_percentage: form.ab_test_enabled ? Number(form.ab_test_split_percentage) || 50 : undefined,
        variant_b_message_template: form.ab_test_enabled ? form.variant_b_message_template : undefined,
        variant_b_email_subject: form.ab_test_enabled ? form.variant_b_email_subject : undefined,
        lead_ids: form.use_filter ? [] : form.lead_ids,
        lead_filter: form.use_filter ? {
          status: form.filter_status.length > 0 ? form.filter_status : undefined,
          priority: form.filter_priority.length > 0 ? form.filter_priority : undefined,
          source: form.filter_source.length > 0 ? form.filter_source : undefined,
          tags: form.filter_tags.length > 0 ? form.filter_tags : undefined,
          require_email: form.require_email || undefined,
          require_phone: form.require_phone || undefined,
          has_product_interest: form.has_product_interest || undefined,
        } : undefined
      };

      await api.post('/campaigns', payload);
      toast.success('Campaña creada');
      onCreated();
      onClose();
      setForm(buildInitialForm({}));
      setLeadSearch('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear campaña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[92vh] max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Compositor de campañas
          </DialogTitle>
          <DialogDescription>
            Define el canal, personaliza el mensaje y construye la audiencia con conteo en vivo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-2">
                <Label>Nombre de la campaña</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Reactivación compradores alta prioridad"
                />
                <p className="text-xs text-muted-foreground">
                  Usa nombres que te ayuden a ubicar el objetivo, canal y segmento.
                </p>
              </div>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Audiencia estimada</p>
                      <p className="mt-2 text-3xl font-semibold">{activeAudienceCount}</p>
                    </div>
                    <Badge className="rounded-full bg-primary px-3 py-1 text-white">
                      {form.use_filter ? 'Segmento dinámico' : 'Selección manual'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {form.use_filter
                      ? 'Se actualiza con cada filtro y respeta si el lead tiene email o teléfono para el canal elegido.'
                      : 'Cuenta solo los leads seleccionados manualmente para esta campaña.'}
                  </p>
                  {selectedSavedSegment && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                      <Bookmark className="w-3.5 h-3.5" />
                      Segmento vinculado: {selectedSavedSegment.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers3 className="w-4 h-4 text-primary" />
                <Label>Canal de salida</Label>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {['email', 'sms', 'whatsapp', 'call'].map((channelKey) => {
                  const channel = campaignChannelMeta[channelKey];
                  const Icon = channel.icon;
                  const isSelected = form.campaign_type === channelKey;
                  const isReady = readyChannelMap[channelKey];
                  const readinessLabel = isReady ? 'Listo para enviar' : 'Falta configurar';

                  return (
                    <button
                    key={channelKey}
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      campaign_type: channelKey,
                      require_email: channelKey === 'email',
                      require_phone: channelKey !== 'email',
                    }))}
                      className={`rounded-2xl border p-4 text-left transition-all ${isSelected ? `${channel.border} ${channel.bg}` : 'border-border hover:border-primary/30 hover:bg-muted/40'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${channel.bg}`}>
                          <Icon className={`w-5 h-5 ${channel.accent}`} />
                        </div>
                        <Badge variant={isReady ? 'default' : 'outline'} className="rounded-full">
                          {isReady ? 'Activo' : 'Configurar'}
                        </Badge>
                      </div>
                      <p className="mt-4 font-medium">{channel.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {channelKey === 'email' && 'Ideal para newsletters, propiedades destacadas y nurturing.'}
                        {channelKey === 'sms' && 'Mejor para seguimiento rápido, recordatorios y reactivación.'}
                        {channelKey === 'whatsapp' && 'Perfecto para follow-up cálido, ubicación, brochure y respuesta rápida del lead.'}
                        {channelKey === 'call' && 'Perfecto para contacto de alta intención y pre-calificación con IA.'}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">{readinessLabel}</p>
                    </button>
                  );
                })}
              </div>
              {!readyChannelMap[form.campaign_type] && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
                  Este canal aún no está listo para envío real. Puedes guardar la campaña como borrador y terminar la configuración en Integraciones.
                </div>
              )}
            </div>

            {(form.campaign_type === 'sms' || form.campaign_type === 'whatsapp') && (
              <div className="space-y-2">
                <Label>Plantilla del mensaje</Label>
                <Textarea
                  value={form.message_template}
                  onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                  placeholder={form.campaign_type === 'whatsapp'
                    ? "Hola {nombre}, te comparto la selección y ubicación de las opciones que mejor encajan con tu interés. ¿Quieres que te envíe el brochure?"
                    : "Hola {nombre}, te comparto opciones nuevas que encajan con tu interés actual..."}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Usa {'{nombre}'} para personalizar y mantén mensajes cortos, accionables y con una sola llamada a la acción.
                </p>
              </div>
            )}

            {form.campaign_type !== 'call' && (
              <Card className="border-border/70">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">Test A/B</p>
                      <p className="text-sm text-muted-foreground">Compara dos versiones del mensaje para medir mejor respuesta por segmento.</p>
                    </div>
                    <Button
                      type="button"
                      variant={form.ab_test_enabled ? 'default' : 'outline'}
                      className="rounded-full"
                      onClick={() => setForm((prev) => ({ ...prev, ab_test_enabled: !prev.ab_test_enabled }))}
                    >
                      {form.ab_test_enabled ? 'A/B activo' : 'Activar A/B'}
                    </Button>
                  </div>

                  {form.ab_test_enabled && (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombre del experimento</Label>
                        <Input
                          value={form.ab_test_name}
                          onChange={(e) => setForm((prev) => ({ ...prev, ab_test_name: e.target.value }))}
                          placeholder="Ej: CTA brochure vs visita"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Distribución a variante B (%)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          value={form.ab_test_split_percentage}
                          onChange={(e) => setForm((prev) => ({ ...prev, ab_test_split_percentage: Number(e.target.value) || 50 }))}
                        />
                      </div>

                      {form.campaign_type === 'email' && (
                        <>
                          <div className="space-y-2">
                            <Label>Asunto variante B</Label>
                            <Input
                              value={form.variant_b_email_subject}
                              onChange={(e) => setForm((prev) => ({ ...prev, variant_b_email_subject: e.target.value }))}
                              placeholder="Ej: {nombre}, encontré una opción más alineada contigo"
                            />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Contenido variante B</Label>
                            <Textarea
                              value={form.variant_b_message_template}
                              onChange={(e) => setForm((prev) => ({ ...prev, variant_b_message_template: e.target.value }))}
                              placeholder="<p>Hola {nombre}, te comparto una alternativa con mayor plusvalía...</p>"
                              rows={5}
                              className="font-mono text-xs"
                            />
                          </div>
                        </>
                      )}

                      {(form.campaign_type === 'sms' || form.campaign_type === 'whatsapp') && (
                        <div className="space-y-2 lg:col-span-2">
                          <Label>Mensaje variante B</Label>
                          <Textarea
                            value={form.variant_b_message_template}
                            onChange={(e) => setForm((prev) => ({ ...prev, variant_b_message_template: e.target.value }))}
                            placeholder={form.campaign_type === 'whatsapp'
                              ? 'Hola {nombre}, te puedo enviar el brochure y opciones de visita por aquí mismo.'
                              : 'Hola {nombre}, tengo una actualización puntual sobre tu búsqueda. ¿Te la comparto?'}
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {form.campaign_type === 'call' && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4">
                  <p className="font-medium">Campaña de llamadas asistidas por IA</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    VAPI usará el asistente configurado para llamar a cada lead del segmento. Recomendado para leads de alta intención y seguimiento de citas.
                  </p>
                </CardContent>
              </Card>
            )}

            {form.campaign_type === 'email' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Plantilla base de email</Label>
                  <Select
                    value={form.email_template_id}
                    onValueChange={(value) => {
                      const template = emailTemplates.find((item) => item.id === value);
                      setForm((prev) => ({
                        ...prev,
                        email_template_id: value,
                        email_subject: template?.subject || '',
                        message_template: template?.html_content || ''
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla o crea una personalizada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Personalizada</SelectItem>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.subject}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {emailTemplates.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Aún no tienes plantillas. Cárgalas desde la biblioteca o crea una desde el editor de email.
                    </p>
                  )}
                </div>

                {form.email_template_id === 'custom' ? (
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-2">
                      <Label>Asunto</Label>
                      <Input
                        value={form.email_subject}
                        onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                        placeholder="Hola {{nombre}}, encontramos opciones para ti"
                      />
                      <p className="text-xs text-muted-foreground">
                        Mantén el asunto breve y usa variables como {'{{nombre}}'}, {'{{propiedad}}'} o {'{{precio}}'}.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>HTML del mensaje</Label>
                      <Textarea
                        value={form.message_template}
                        onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                        placeholder={`<h1>Hola {{nombre}}</h1>\n<p>Te compartimos propiedades destacadas...</p>`}
                        rows={7}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                ) : selectedTemplate ? (
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{selectedTemplate.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedTemplate.subject}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, email_template_id: 'custom', email_subject: '', message_template: '' })}
                        >
                          Cambiar
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedTemplate.variables || []).slice(0, 6).map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {'{{' + variable + '}}'}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            <div className="space-y-4 rounded-2xl border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <p className="font-medium">Audiencia</p>
                      </div>
                  <p className="text-sm text-muted-foreground">
                    Segmenta por estado, prioridad, fuente y readiness del canal, o elige leads manualmente.
                  </p>
                </div>
                <div className="flex rounded-full border p-1">
                  <Button
                    type="button"
                    variant={form.use_filter ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setForm({ ...form, use_filter: true })}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Segmento
                  </Button>
                  <Button
                    type="button"
                    variant={!form.use_filter ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setForm({ ...form, use_filter: false })}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manual
                  </Button>
                </div>
              </div>

              {form.use_filter ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">Convierte este filtro en un segmento reutilizable</p>
                      <p className="text-sm text-muted-foreground">Guárdalo una vez y úsalo en campañas futuras sin reconstruir reglas.</p>
                    </div>
                    <Button type="button" variant="outline" className="rounded-full" onClick={openSaveSegmentDialog}>
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Guardar segmento
                    </Button>
                  </div>

                  {savedSegments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Segmentos guardados</Label>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {savedSegments.map((segment) => (
                          <button
                            key={segment.id}
                            type="button"
                            onClick={() => applySavedSegment(segment)}
                            className="rounded-2xl border p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-primary" />
                                <span className="font-medium">{segment.name}</span>
                              </div>
                              <Badge className="rounded-full bg-primary px-3 py-1 text-white">{segment.last_estimated_count || 0}</Badge>
                            </div>
                            {segment.description && (
                              <p className="mt-2 text-sm text-muted-foreground">{segment.description}</p>
                            )}
                            <p className="mt-3 text-xs text-muted-foreground">
                              {segment.campaign_type ? `Recomendado para ${campaignChannelMeta[segment.campaign_type]?.label || segment.campaign_type}` : 'Segmento reusable'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {quickSegments.map((segment) => (
                      <button
                        key={segment.id}
                        type="button"
                        onClick={() => applyQuickSegment(segment)}
                        className="rounded-2xl border p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                      >
                        <p className="font-medium">{segment.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{segment.description}</p>
                        <p className="mt-3 text-xs text-primary">
                          {countAudience(leads, segment.patch, form.campaign_type)} leads potenciales
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Estado del lead</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {statusOptions.map((status) => (
                          <Badge
                            key={status}
                            variant={form.filter_status.includes(status) ? 'default' : 'outline'}
                            className="cursor-pointer capitalize"
                            onClick={() => toggleFilterValue('filter_status', status)}
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Prioridad</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {priorityOptions.map((priority) => (
                          <Badge
                            key={priority}
                            variant={form.filter_priority.includes(priority) ? 'default' : 'outline'}
                            className="cursor-pointer capitalize"
                            onClick={() => toggleFilterValue('filter_priority', priority)}
                          >
                            {priority}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {availableSources.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Fuente</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {availableSources.map((source) => (
                            <Badge
                              key={source}
                              variant={form.filter_source.includes(source) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleFilterValue('filter_source', source)}
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableTags.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Tags del lead</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {availableTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={form.filter_tags.includes(tag) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleFilterValue('filter_tags', tag)}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {formatTagLabel(tag)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs text-muted-foreground">Condiciones de contacto</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={form.require_email ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setForm({ ...form, require_email: !form.require_email })}
                        >
                          Con email
                        </Button>
                        <Button
                          type="button"
                          variant={form.require_phone ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setForm({ ...form, require_phone: !form.require_phone })}
                        >
                          Con teléfono
                        </Button>
                        <Button
                          type="button"
                          variant={form.has_product_interest ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setForm({ ...form, has_product_interest: !form.has_product_interest })}
                        >
                          Interés en producto
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder="Buscar por nombre, email, teléfono o fuente"
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectVisibleLeads}>
                        Seleccionar visibles
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={clearVisibleLeads}>
                        Limpiar visibles
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-72 rounded-2xl border">
                    <div className="space-y-1 p-2">
                      {visibleLeads.map((lead) => {
                        const requiresEmail = form.campaign_type === 'email' && !hasLeadEmail(lead);
                        const requiresPhone = (form.campaign_type === 'sms' || form.campaign_type === 'call' || form.campaign_type === 'whatsapp') && !hasLeadPhone(lead);

                        return (
                          <div
                            key={lead.id}
                            className={`rounded-xl border px-3 py-3 transition-colors ${form.lead_ids.includes(lead.id) ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                            onClick={() => toggleLeadSelection(lead.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox checked={form.lead_ids.includes(lead.id)} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium">{lead.name}</p>
                                  {lead.priority && (
                                    <Badge variant="outline" className="capitalize">{lead.priority}</Badge>
                                  )}
                                  {lead.status && (
                                    <Badge variant="secondary" className="capitalize">{lead.status}</Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {lead.email || 'Sin email'} • {lead.phone || 'Sin teléfono'} • {lead.source || 'Sin fuente'}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {hasLeadInterest(lead) && <Badge variant="outline">Interés activo</Badge>}
                                  {leadTags(lead).slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary">{formatTagLabel(tag)}</Badge>
                                  ))}
                                  {!leadAllowsCampaignChannel(lead, form.campaign_type) && (
                                    <Badge variant="outline" className="border-red-500/30 text-red-500">
                                      Opt-out {campaignChannelMeta[form.campaign_type]?.label || form.campaign_type}
                                    </Badge>
                                  )}
                                  {requiresEmail && <Badge variant="outline" className="border-amber-500/30 text-amber-500">Falta email</Badge>}
                                  {requiresPhone && <Badge variant="outline" className="border-amber-500/30 text-amber-500">Falta teléfono</Badge>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {visibleLeads.length === 0 && (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No se encontraron leads con esa búsqueda.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {activeAudienceCount > 0 ? `${activeAudienceCount} leads listos para esta campaña` : 'Aún no hay audiencia seleccionada'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Guardar campaña
              </Button>
            </div>
          </div>
        </DialogFooter>

        <Dialog open={showSaveSegmentDialog} onOpenChange={setShowSaveSegmentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Guardar segmento</DialogTitle>
              <DialogDescription>
                Guarda este set de filtros para volver a usarlo en futuras campañas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del segmento</Label>
                <Input
                  value={segmentDraft.name}
                  onChange={(e) => setSegmentDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Inversionistas alta intención"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={segmentDraft.description}
                  onChange={(e) => setSegmentDraft((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Qué contiene este segmento y cuándo conviene usarlo"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={segmentDraft.color}
                  onValueChange={(value) => setSegmentDraft((prev) => ({ ...prev, color: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="emerald">Verde</SelectItem>
                    <SelectItem value="violet">Violeta</SelectItem>
                    <SelectItem value="amber">Ámbar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveSegmentDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveSegment} disabled={savingSegment}>
                {savingSegment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
                Guardar segmento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export const CampaignsPage = () => {
  const { api, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [callRecords, setCallRecords] = useState([]);
  const [smsRecords, setSmsRecords] = useState([]);
  const [whatsappRecords, setWhatsappRecords] = useState([]);
  const [emailRecords, setEmailRecords] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [savedSegments, setSavedSegments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState({ vapi: false, twilio: false, whatsapp: false, sendgrid: false });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [newCampaignSeed, setNewCampaignSeed] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, callsRes, smsRes, whatsappRes, emailsRes, templatesRes, leadsRes, analyticsRes, settingsRes, segmentsRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/calls'),
        api.get('/sms'),
        api.get('/whatsapp'),
        api.get('/emails'),
        api.get('/email-templates'),
        api.get('/leads?page_size=1000'),
        api.get('/analytics/communications'),
        api.get('/settings/integrations'),
        api.get('/campaign-segments')
      ]);
      setCampaigns(campaignsRes.data);
      setCallRecords(callsRes.data);
      setSmsRecords(smsRes.data);
      setWhatsappRecords(whatsappRes.data);
      setEmailRecords(emailsRes.data);
      setEmailTemplates(templatesRes.data || []);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.leads || []));
      setAnalytics(analyticsRes.data);
      setSavedSegments(Array.isArray(segmentsRes.data) ? segmentsRes.data : []);
      setIntegrationStatus({
        vapi: settingsRes.data.vapi_enabled,
        twilio: settingsRes.data.twilio_enabled,
        whatsapp: settingsRes.data.twilio_whatsapp_enabled,
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

  // Email Template handlers
  const handleDuplicateTemplate = async (template) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copia)`,
        subject: template.subject,
        html_content: template.html_content,
        json_content: template.json_content,
        variables: template.variables,
        category: template.category,
      };
      await api.post('/email-templates', newTemplate);
      toast.success('Plantilla duplicada');
      loadData();
    } catch (error) {
      toast.error('Error al duplicar plantilla');
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`¿Eliminar la plantilla "${template.name}"?`)) return;
    try {
      await api.delete(`/email-templates/${template.id}`);
      toast.success('Plantilla eliminada');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar plantilla');
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleSeedTemplates = async () => {
    try {
      const res = await api.post('/email-templates/seed');
      toast.success(`${res.data.created} plantillas creadas`);
      loadData();
    } catch (error) {
      toast.error('Error al crear plantillas predefinidas');
    }
  };

  // Filter templates
  const filteredTemplates = emailTemplates.filter(template => {
    const matchesCategory = templateCategoryFilter === 'all' || template.category === templateCategoryFilter;
    const matchesSearch = templateSearch === '' ||
      template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.subject.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Template categories
  const templateCategories = [
    { value: 'all', label: 'Todas', icon: Grid3x3 },
    { value: 'open_house', label: 'Open House', icon: Mail },
    { value: 'property_promo', label: 'Promoción', icon: Sparkles },
    { value: 'follow_up', label: 'Seguimiento', icon: MessageCircle },
    { value: 'market_update', label: 'Mercado', icon: TrendingUp },
    { value: 'buyer_nurturing', label: 'Compradores', icon: Users },
    { value: 'seller_nurturing', label: 'Vendedores', icon: Send },
  ];

  const availableSources = Array.from(new Set(leads.map((lead) => lead.source).filter(Boolean)));
  const readyChannelsCount = [integrationStatus.sendgrid, integrationStatus.twilio, integrationStatus.whatsapp, integrationStatus.vapi].filter(Boolean).length;
  const audienceSegments = [
    {
      id: 'segment-new',
      title: 'Nuevos por contactar',
      subtitle: 'Primer toque y activación inicial',
      count: countAudience(leads, { status: ['nuevo', 'contactado'], require_phone: true }, 'sms'),
      seed: {
        name: 'Primer contacto leads nuevos',
        campaign_type: 'sms',
        message_template: 'Hola {nombre}, te contacto de Rovi para compartirte opciones que encajan con tu interés. ¿Te puedo enviar una selección hoy?',
        use_filter: true,
        filter_status: ['nuevo', 'contactado'],
        filter_tags: [],
        require_phone: true,
      },
    },
    {
      id: 'segment-hot',
      title: 'Alta intención',
      subtitle: 'Leads con prioridad alta y teléfono',
      count: countAudience(leads, { priority: ['alta', 'urgente'], require_phone: true, has_product_interest: true }, 'call'),
      seed: {
        name: 'Llamada leads alta intención',
        campaign_type: 'call',
        use_filter: true,
        filter_priority: ['alta', 'urgente'],
        filter_tags: [],
        require_phone: true,
        has_product_interest: true,
      },
    },
    {
      id: 'segment-email',
      title: 'Listos para email',
      subtitle: 'Base limpia para newsletters y promociones',
      count: countAudience(leads, { require_email: true }, 'email'),
      seed: {
        name: 'Boletín base de oportunidades',
        campaign_type: 'email',
        use_filter: true,
        filter_tags: [],
        require_email: true,
      },
    },
    {
      id: 'segment-interest',
      title: 'Interés en producto',
      subtitle: 'Seguimiento o promociones específicas',
      count: countAudience(leads, { has_product_interest: true, require_email: true }, 'email'),
      seed: {
        name: 'Seguimiento por interés en producto',
        campaign_type: 'email',
        use_filter: true,
        filter_tags: [],
        require_email: true,
        has_product_interest: true,
      },
    },
  ];

  const campaignPlaybooks = [
    {
      id: 'playbook-email-open-house',
      title: 'Open House por Email',
      description: 'Invitación visual con plantilla, asunto optimizado y CTA a visita.',
      channel: 'email',
      available: integrationStatus.sendgrid,
      statusLabel: integrationStatus.sendgrid ? 'Activo' : 'Configurar SendGrid',
      actionLabel: 'Usar playbook',
      seed: {
        name: 'Invitación Open House',
        campaign_type: 'email',
        use_filter: true,
        require_email: true,
        has_product_interest: true,
      },
    },
    {
      id: 'playbook-sms-follow-up',
      title: 'Seguimiento rápido por SMS',
      description: 'Ideal para leads nuevos o sin respuesta después de una visita.',
      channel: 'sms',
      available: integrationStatus.twilio,
      statusLabel: integrationStatus.twilio ? 'Activo' : 'Configurar Twilio',
      actionLabel: 'Lanzar flujo',
      seed: {
        name: 'Seguimiento rápido SMS',
        campaign_type: 'sms',
        message_template: 'Hola {nombre}, te escribo para retomar tu interés y enviarte opciones actualizadas. ¿Te las comparto hoy?',
        use_filter: true,
        filter_status: ['nuevo', 'contactado'],
        require_phone: true,
      },
    },
    {
      id: 'playbook-call-hot',
      title: 'Llamada IA para hot leads',
      description: 'Campaña de contacto inmediato para leads con mayor intención.',
      channel: 'call',
      available: integrationStatus.vapi,
      statusLabel: integrationStatus.vapi ? 'Activo' : 'Configurar VAPI',
      actionLabel: 'Preparar campaña',
      seed: {
        name: 'Llamada IA a leads calientes',
        campaign_type: 'call',
        use_filter: true,
        filter_priority: ['alta', 'urgente'],
        require_phone: true,
        has_product_interest: true,
      },
    },
    {
      id: 'playbook-whatsapp',
      title: 'WhatsApp post-visita',
      description: 'Recomendado para cerrar follow-up con material, ubicación y siguiente paso.',
      channel: 'whatsapp',
      available: integrationStatus.whatsapp,
      statusLabel: integrationStatus.whatsapp ? 'Activo' : 'Configurar WhatsApp',
      actionLabel: integrationStatus.whatsapp ? 'Abrir flujo' : 'Configurar canal',
      seed: {
        name: 'WhatsApp post-visita',
        campaign_type: 'whatsapp',
        message_template: 'Hola {nombre}, te comparto la información y siguiente paso de la propiedad que revisamos. ¿Te la envío por aquí?',
        use_filter: true,
        filter_tags: [],
        require_phone: true,
        has_product_interest: true,
      },
    },
  ];

  const goToIntegrations = () => navigate('/settings?tab=integrations');
  const goToEmailTemplates = () => navigate('/email-templates/new');
  const openActivationGuide = () => window.open('/campaign-activation-dashboard.html', '_blank', 'noopener,noreferrer');
  const openCampaignComposer = (seed = null) => {
    setNewCampaignSeed(seed);
    setShowNewModal(true);
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
          <p className="text-sm sm:text-base text-muted-foreground">Diseña, segmenta y ejecuta campañas por email, SMS, llamadas y WhatsApp desde una sola vista.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openActivationGuide} className="rounded-full">
            <Rocket className="w-4 h-4 mr-2" /> Guía de activación
          </Button>
          <Button onClick={() => openCampaignComposer()} className="rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Nueva Campaña
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge className="rounded-full bg-primary px-3 py-1 text-white">Campaign Studio</Badge>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Empieza por la plantilla, no por el formulario</h2>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Usa playbooks por canal, arranca desde audiencias sugeridas y valida la preparación de tus integraciones sin salir del módulo.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={openActivationGuide} className="rounded-full">
                    Ver dashboard de setup <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-primary" /> {readyChannelsCount}/4 canales operativos</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> {leads.length} leads disponibles</div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {emailTemplates.length} plantillas de email</div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[260px]">
              <Button onClick={goToIntegrations} variant="outline" className="justify-between">
                Configurar canales
                <Settings2 className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => openCampaignComposer()} className="justify-between">
                Crear campaña desde cero
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
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
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.whatsapp?.total || 0}</p>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
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
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
          <TabsTrigger value="templates" className="gap-2">
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </TabsTrigger>
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
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
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
                  onClick={() => openCampaignComposer()}
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

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                Historial de WhatsApp
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Mensajes enviados con Twilio WhatsApp • {analytics?.whatsapp?.read_rate || 0}% lectura estimada
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {whatsappRecords.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {whatsappRecords.map((record) => (
                      <WhatsAppRecordCard key={record.id} record={record} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">No hay mensajes de WhatsApp registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-500" />
                    Historial de Emails
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Emails enviados con SendGrid • {analytics?.emails?.open_rate || 0}% tasa de apertura
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToEmailTemplates}
                  data-testid="create-template-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Plantilla
                </Button>
              </div>
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
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={goToEmailTemplates}
                  >
                    Crear tu primera plantilla de email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="p-5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers3 className="w-5 h-5 text-primary" />
                    Playbooks por canal
                  </CardTitle>
                  <CardDescription>
                    Arranca con campañas pensadas para el flujo real del CRM: invitación, reactivación, follow-up y contacto de alta intención.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 pt-0 md:grid-cols-2">
                  {campaignPlaybooks.map((playbook) => {
                    const channel = campaignChannelMeta[playbook.channel];
                    const Icon = channel.icon;

                    return (
                      <div key={playbook.id} className="rounded-2xl border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${channel.bg}`}>
                            <Icon className={`w-5 h-5 ${channel.accent}`} />
                          </div>
                          <Badge variant={playbook.available ? 'default' : 'outline'} className="rounded-full">
                            {playbook.statusLabel}
                          </Badge>
                        </div>
                        <p className="mt-4 font-medium">{playbook.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{playbook.description}</p>
                        <Button
                          variant={playbook.available ? 'default' : 'outline'}
                          className="mt-4 w-full justify-between"
                          onClick={() => playbook.available ? openCampaignComposer(playbook.seed) : goToIntegrations()}
                        >
                          {playbook.actionLabel}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="w-5 h-5 text-primary" />
                    Segmentos guardados y audiencias sugeridas
                  </CardTitle>
                  <CardDescription>
                    Guarda segmentos reutilizables y combina audiencias sugeridas para lanzar campañas sin reconstruir reglas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 pt-0">
                  {savedSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="rounded-2xl border p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <button type="button" onClick={() => openCampaignComposer({
                        name: segment.name,
                        campaign_type: segment.campaign_type || 'email',
                        use_filter: true,
                        filter_status: segment.lead_filter?.status || [],
                        filter_priority: segment.lead_filter?.priority || [],
                        filter_source: segment.lead_filter?.source || [],
                        filter_tags: segment.lead_filter?.tags || [],
                        require_email: Boolean(segment.lead_filter?.require_email),
                        require_phone: Boolean(segment.lead_filter?.require_phone),
                        has_product_interest: Boolean(segment.lead_filter?.has_product_interest),
                      })} className="w-full text-left">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{segment.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{segment.description || 'Segmento guardado listo para reusar.'}</p>
                          </div>
                          <Badge className="rounded-full bg-primary px-3 py-1 text-white">{segment.last_estimated_count || 0}</Badge>
                        </div>
                      </button>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{segment.campaign_type ? `Canal sugerido: ${campaignChannelMeta[segment.campaign_type]?.label || segment.campaign_type}` : 'Reusable en cualquier canal'}</span>
                          {segment.campaign_count > 0 && <span>• {segment.campaign_count} campañas</span>}
                          {segment.total_sent_count > 0 && <span>• {segment.total_sent_count} envíos</span>}
                          {segment.total_opened_count > 0 && <span>• {segment.total_opened_count} aperturas</span>}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              await api.delete(`/campaign-segments/${segment.id}`);
                              toast.success('Segmento eliminado');
                              loadData();
                            } catch (error) {
                              toast.error(error.response?.data?.detail || 'No se pudo eliminar el segmento');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {audienceSegments.map((segment) => (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => openCampaignComposer(segment.seed)}
                      className="rounded-2xl border p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{segment.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{segment.subtitle}</p>
                        </div>
                        <Badge className="rounded-full bg-primary px-3 py-1 text-white">{segment.count}</Badge>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70">
              <CardHeader className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="w-5 h-5 text-purple-500" />
                      Plantillas de email
                    </CardTitle>
                    <CardDescription>
                      Gestiona creativos, duplicados, previews y plantillas base para tus campañas masivas.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {emailTemplates.length === 0 && (
                      <Button variant="outline" size="sm" onClick={handleSeedTemplates}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Cargar plantillas base
                      </Button>
                    )}
                    <Button size="sm" onClick={goToEmailTemplates}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva plantilla
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar plantillas..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {templateCategories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Button
                          key={cat.value}
                          variant={templateCategoryFilter === cat.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTemplateCategoryFilter(cat.value)}
                          className="whitespace-nowrap"
                        >
                          <Icon className="w-4 h-4 mr-1" />
                          {cat.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTemplates.map((template) => (
                      <EmailTemplateCard
                        key={template.id}
                        template={template}
                        onDuplicate={handleDuplicateTemplate}
                        onDelete={handleDeleteTemplate}
                        onPreview={handlePreviewTemplate}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        {emailTemplates.length === 0
                          ? 'No hay plantillas creadas. Carga las plantillas base o crea una nueva.'
                          : 'No se encontraron plantillas con los filtros seleccionados.'}
                      </p>
                      {emailTemplates.length === 0 && (
                        <div className="flex justify-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={handleSeedTemplates}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Cargar plantillas base
                          </Button>
                          <Button onClick={goToEmailTemplates}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear plantilla
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewCampaignModal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false);
          setNewCampaignSeed(null);
        }}
        onCreated={loadData}
        api={api}
        leads={leads}
        emailTemplates={emailTemplates}
        initialConfig={newCampaignSeed}
        savedSegments={savedSegments}
        onSegmentsChanged={loadData}
        availableSources={availableSources}
        integrationStatus={integrationStatus}
      />

      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysis={selectedAnalysis}
      />

      <EmailTemplatePreviewDialog
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={selectedTemplate}
        token={token}
      />
    </div>
  );
};

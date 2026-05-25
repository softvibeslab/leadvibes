import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Filter,
  LayoutGrid,
  LineChart,
  Mail,
  Megaphone,
  MessageSquare,
  Pause,
  PhoneCall,
  Play,
  Plus,
  RefreshCw,
  Search,
  Table2,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { getEffectiveRole } from '../lib/copimAccess';

const currency = (value = 0) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const number = (value = 0) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 }).format(Number(value || 0));

const stageLabels = {
  prospecto: 'Prospecto',
  contactado: 'Contactado',
  discovery_call: 'Discovery',
  demo_agendada: 'Demo agendada',
  demo_completada: 'Demo completada',
  propuesta_enviada: 'Propuesta',
  negociacion: 'Negociacion',
  contrato_cerrado: 'Contrato',
  onboarding: 'Onboarding',
  active_user: 'Cliente activo',
  perdido: 'Perdido',
};

const roleLabels = {
  rovi_admin: 'Admin',
  rovi_sales: 'Sales',
  rovi_marketing: 'Marketing',
  rovi_customer_success: 'Customer Success',
  rovi_ops: 'Ops',
};

const campaignStatus = {
  draft: { label: 'Borrador', color: 'bg-slate-500', icon: CalendarClock },
  scheduled: { label: 'Programada', color: 'bg-blue-500', icon: CalendarClock },
  running: { label: 'En curso', color: 'bg-amber-500', icon: Play },
  paused: { label: 'Pausada', color: 'bg-orange-500', icon: Pause },
  completed: { label: 'Completada', color: 'bg-emerald-500', icon: CheckCircle2 },
  failed: { label: 'Fallida', color: 'bg-red-500', icon: Target },
};

const campaignTypes = {
  email: { label: 'Email', icon: Mail, color: 'text-purple-500' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-500' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-500' },
  call: { label: 'Llamada', icon: PhoneCall, color: 'text-blue-500' },
  ads: { label: 'Ads', icon: Megaphone, color: 'text-amber-500' },
  webinar: { label: 'Webinar', icon: Users, color: 'text-cyan-500' },
  referral: { label: 'Referido', icon: ArrowRight, color: 'text-teal-500' },
};

const roleCopy = {
  rovi_admin: {
    title: 'Revenue HQ',
    subtitle: 'Vista ejecutiva para MRR, pipeline, fuentes, equipos y crecimiento interno de ROVI.',
  },
  rovi_sales: {
    title: 'Sales Desk',
    subtitle: 'Prioriza demos, propuestas y negociaciones con inmobiliarias listas para comprar.',
  },
  rovi_marketing: {
    title: 'Marketing Demand',
    subtitle: 'Mide generacion de demanda, MQLs, fuentes y handoff hacia Sales.',
  },
  rovi_customer_success: {
    title: 'Customer Success',
    subtitle: 'Control de onboarding, adopcion y riesgos tempranos de churn.',
  },
  rovi_ops: {
    title: 'Revenue Ops',
    subtitle: 'Operaciones, automatizaciones, calidad de datos e integraciones comerciales.',
  },
};

const emptyProspectForm = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  source: 'manual',
  company_size: 'small',
  broker_count: 5,
  business_type: 'agency',
  current_crm: 'excel',
  monthly_budget_mxn: 7999,
  expected_mrr_mxn: 7999,
  recommended_plan: 'standard',
  stage: 'prospecto',
  assigned_to: '',
  urgency: '30_days',
  pain_points: '',
  next_action: 'Agendar discovery call',
};

const emptyPlanForm = {
  tier: 'standard',
  name: '',
  price_mxn: 7999,
  billing_cycle: 'monthly',
  ideal_for: '',
  max_brokers: 10,
  features: '',
  is_active: true,
};

const emptyCampaignForm = {
  name: '',
  campaign_type: 'email',
  status: 'draft',
  objective: '',
  segment: 'Inmobiliarias',
  source: 'manual',
  owner_role: 'rovi_marketing',
  owner_user_id: '',
  budget_mxn: 0,
  target_mql: 0,
  target_sql: 0,
  total_recipients: 0,
  sent_count: 0,
  open_count: 0,
  click_count: 0,
  reply_count: 0,
  demo_count: 0,
  expected_mrr_mxn: 0,
  notes: '',
};

const emptyTeamForm = {
  name: '',
  email: '',
  role: 'rovi_sales',
  department: 'sales',
  phone: '',
  password: 'demo123',
  is_active: true,
};

const normalizeListInput = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const listToInput = (value) => (Array.isArray(value) ? value.join(', ') : '');

const prospectToForm = (prospect = {}) => ({
  ...emptyProspectForm,
  ...prospect,
  assigned_to: prospect.assigned_to || '',
  pain_points: listToInput(prospect.pain_points),
});

const planToForm = (plan = {}) => ({
  ...emptyPlanForm,
  ...plan,
  max_brokers: plan.max_brokers ?? '',
  features: listToInput(plan.features),
});

const campaignToForm = (campaign = {}) => ({
  ...emptyCampaignForm,
  ...campaign,
  owner_user_id: campaign.owner_user_id || '',
  notes: campaign.notes || '',
});

const teamToForm = (member = {}) => ({
  ...emptyTeamForm,
  ...member,
  phone: member.phone || '',
  password: '',
});

const MetricCard = ({ icon: Icon, label, value, helper, tone = 'primary' }) => {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-500',
  }[tone];

  return (
    <Card className="h-full rounded-lg border-border/70 bg-card/85 shadow-sm">
      <CardContent className="flex min-h-[112px] items-center gap-4 p-5 sm:p-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-none text-foreground">{value}</p>
          {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }) => {
  const config = campaignStatus[status] || campaignStatus.draft;
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} text-white`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const ModuleToolbar = ({
  search,
  onSearchChange,
  children,
  viewMode,
  onViewModeChange,
  onCreate,
  createLabel,
}) => (
  <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/85 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nombre, fuente, responsable..."
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {onViewModeChange && (
        <div className="flex rounded-lg border border-border bg-background p-1">
          <Button size="sm" variant={viewMode === 'cards' ? 'secondary' : 'ghost'} onClick={() => onViewModeChange('cards')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={viewMode === 'table' ? 'secondary' : 'ghost'} onClick={() => onViewModeChange('table')}>
            <Table2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      {onCreate && (
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {createLabel}
        </Button>
      )}
    </div>
  </div>
);

const StagePill = ({ stage, count, max, onClick, active }) => {
  const width = max ? Math.max(8, Math.round((count / max) * 100)) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        active ? 'border-primary bg-primary/10' : 'border-border/70 bg-background/45 hover:bg-muted/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{stageLabels[stage] || stage}</span>
        <Badge variant="outline">{count}</Badge>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </button>
  );
};

const ProspectCard = ({ prospect, onEdit, onDelete, onAdvance }) => (
  <Card className="h-full rounded-lg border-border/70 bg-card/85 shadow-sm">
    <CardContent className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{prospect.company_name}</p>
          <p className="text-sm text-muted-foreground">{prospect.contact_name} · {prospect.source}</p>
        </div>
        <Badge className="bg-primary text-primary-foreground">{prospect.score_label}</Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Score</p>
          <p className="font-semibold">{prospect.score}/100</p>
        </div>
        <div>
          <p className="text-muted-foreground">MRR</p>
          <p className="font-semibold">{currency(prospect.expected_mrr_mxn)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Plan</p>
          <p className="font-semibold capitalize">{prospect.recommended_plan}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(prospect.pain_points || []).slice(0, 3).map((pain) => (
          <Badge key={pain} variant="secondary">{pain}</Badge>
        ))}
      </div>

      <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
        {prospect.next_action || prospect.last_activity || 'Sin siguiente accion registrada'}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline">{stageLabels[prospect.stage] || prospect.stage}</Badge>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onAdvance(prospect)}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Avanzar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(prospect)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(prospect)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CampaignCard = ({ campaign, onEdit, onDelete, onStart, onPause }) => {
  const type = campaignTypes[campaign.campaign_type] || campaignTypes.email;
  const TypeIcon = type.icon;
  const progress = campaign.total_recipients ? Math.min(100, (campaign.sent_count / campaign.total_recipients) * 100) : 0;

  return (
    <Card className="h-full rounded-lg border-border/70 bg-card/85 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TypeIcon className={`h-5 w-5 ${type.color}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{campaign.name}</p>
              <p className="text-sm text-muted-foreground">{type.label} · {campaign.segment}</p>
            </div>
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.objective || campaign.notes}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{number(campaign.sent_count)} / {number(campaign.total_recipients)} enviados</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-xs text-muted-foreground">Replies</p>
            <p className="font-semibold">{number(campaign.reply_count)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-xs text-muted-foreground">Demos</p>
            <p className="font-semibold">{number(campaign.demo_count)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-xs text-muted-foreground">ROI MRR</p>
            <p className="font-semibold">{campaign.roi_mrr || 0}x</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline">{currency(campaign.expected_mrr_mxn)} esperado</Badge>
          <div className="flex gap-1">
            {campaign.status !== 'running' ? (
              <Button size="sm" variant="outline" onClick={() => onStart(campaign)}>
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => onPause(campaign)}>
                <Pause className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onEdit(campaign)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(campaign)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const RoviInternalWorkspacePage = ({ view = 'dashboard' }) => {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('all');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('all');
  const [teamRoleFilter, setTeamRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [prospectDialog, setProspectDialog] = useState(false);
  const [planDialog, setPlanDialog] = useState(false);
  const [campaignDialog, setCampaignDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [prospectForm, setProspectForm] = useState(emptyProspectForm);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [campaignForm, setCampaignForm] = useState(emptyCampaignForm);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);

  const effectiveRole = getEffectiveRole(user);
  const header = roleCopy[effectiveRole] || roleCopy.rovi_admin;
  const metrics = dashboard?.metrics || {};
  const stages = dashboard?.stage_counts?.map((item) => item.stage) || Object.keys(stageLabels);
  const maxStageCount = Math.max(...(dashboard?.stage_counts || []).map((item) => item.count), 1);
  const canAdmin = ['rovi_admin', 'rovi_ops'].includes(effectiveRole);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const [dashboardRes, prospectsRes, plansRes, campaignsRes, teamRes] = await Promise.all([
        api.get('/rovi-internal/dashboard'),
        api.get('/rovi-internal/prospects'),
        api.get('/rovi-internal/service-plans'),
        api.get('/rovi-internal/campaigns'),
        api.get('/rovi-internal/team'),
      ]);
      setDashboard(dashboardRes.data);
      setProspects(prospectsRes.data?.prospects || []);
      setPlans(plansRes.data?.plans || []);
      setCampaigns(campaignsRes.data?.campaigns || []);
      setTeam(teamRes.data?.team || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No pude cargar ROVI Internal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProspects = useMemo(() => {
    const term = search.toLowerCase().trim();
    return prospects.filter((prospect) => {
      const matchesStage = stageFilter === 'all' || prospect.stage === stageFilter;
      const haystack = `${prospect.company_name} ${prospect.contact_name} ${prospect.email} ${prospect.source} ${prospect.next_action}`.toLowerCase();
      return matchesStage && (!term || haystack.includes(term));
    });
  }, [prospects, search, stageFilter]);

  const filteredCampaigns = useMemo(() => {
    const term = search.toLowerCase().trim();
    return campaigns.filter((campaign) => {
      const matchesStatus = campaignStatusFilter === 'all' || campaign.status === campaignStatusFilter;
      const matchesType = campaignTypeFilter === 'all' || campaign.campaign_type === campaignTypeFilter;
      const haystack = `${campaign.name} ${campaign.segment} ${campaign.objective} ${campaign.source}`.toLowerCase();
      return matchesStatus && matchesType && (!term || haystack.includes(term));
    });
  }, [campaigns, campaignStatusFilter, campaignTypeFilter, search]);

  const filteredPlans = useMemo(() => {
    const term = search.toLowerCase().trim();
    return plans.filter((plan) => {
      const haystack = `${plan.name} ${plan.tier} ${plan.ideal_for} ${(plan.features || []).join(' ')}`.toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [plans, search]);

  const filteredTeam = useMemo(() => {
    const term = search.toLowerCase().trim();
    return team.filter((member) => {
      const matchesRole = teamRoleFilter === 'all' || member.role === teamRoleFilter;
      const haystack = `${member.name} ${member.email} ${member.role} ${member.department}`.toLowerCase();
      return matchesRole && (!term || haystack.includes(term));
    });
  }, [search, team, teamRoleFilter]);

  const resetDialogs = () => {
    setEditingProspect(null);
    setEditingPlan(null);
    setEditingCampaign(null);
    setEditingTeamMember(null);
    setProspectForm(emptyProspectForm);
    setPlanForm(emptyPlanForm);
    setCampaignForm(emptyCampaignForm);
    setTeamForm(emptyTeamForm);
  };

  const openProspectDialog = (prospect = null) => {
    setEditingProspect(prospect);
    setProspectForm(prospect ? prospectToForm(prospect) : emptyProspectForm);
    setProspectDialog(true);
  };

  const openPlanDialog = (plan = null) => {
    setEditingPlan(plan);
    setPlanForm(plan ? planToForm(plan) : emptyPlanForm);
    setPlanDialog(true);
  };

  const openCampaignDialog = (campaign = null) => {
    setEditingCampaign(campaign);
    setCampaignForm(campaign ? campaignToForm(campaign) : emptyCampaignForm);
    setCampaignDialog(true);
  };

  const openTeamDialog = (member = null) => {
    setEditingTeamMember(member);
    setTeamForm(member ? teamToForm(member) : emptyTeamForm);
    setTeamDialog(true);
  };

  const handleProspectSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...prospectForm,
        broker_count: Number(prospectForm.broker_count || 1),
        monthly_budget_mxn: Number(prospectForm.monthly_budget_mxn || 0),
        expected_mrr_mxn: Number(prospectForm.expected_mrr_mxn || 0),
        assigned_to: prospectForm.assigned_to || null,
        pain_points: normalizeListInput(prospectForm.pain_points),
      };
      if (editingProspect) {
        await api.put(`/rovi-internal/prospects/${editingProspect.id}`, payload);
        toast.success('Prospecto actualizado');
      } else {
        await api.post('/rovi-internal/prospects', payload);
        toast.success('Prospecto creado');
      }
      setProspectDialog(false);
      resetDialogs();
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el prospecto');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...planForm,
        price_mxn: Number(planForm.price_mxn || 0),
        max_brokers: planForm.max_brokers === '' ? null : Number(planForm.max_brokers || 0),
        features: normalizeListInput(planForm.features),
        is_active: Boolean(planForm.is_active),
      };
      if (editingPlan) {
        await api.put(`/rovi-internal/service-plans/${editingPlan.id}`, payload);
        toast.success('Plan actualizado');
      } else {
        await api.post('/rovi-internal/service-plans', payload);
        toast.success('Plan creado');
      }
      setPlanDialog(false);
      resetDialogs();
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el plan');
    } finally {
      setSaving(false);
    }
  };

  const handleCampaignSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...campaignForm,
        owner_user_id: campaignForm.owner_user_id || null,
        budget_mxn: Number(campaignForm.budget_mxn || 0),
        target_mql: Number(campaignForm.target_mql || 0),
        target_sql: Number(campaignForm.target_sql || 0),
        total_recipients: Number(campaignForm.total_recipients || 0),
        sent_count: Number(campaignForm.sent_count || 0),
        open_count: Number(campaignForm.open_count || 0),
        click_count: Number(campaignForm.click_count || 0),
        reply_count: Number(campaignForm.reply_count || 0),
        demo_count: Number(campaignForm.demo_count || 0),
        expected_mrr_mxn: Number(campaignForm.expected_mrr_mxn || 0),
      };
      if (editingCampaign) {
        await api.put(`/rovi-internal/campaigns/${editingCampaign.id}`, payload);
        toast.success('Campana actualizada');
      } else {
        await api.post('/rovi-internal/campaigns', payload);
        toast.success('Campana creada');
      }
      setCampaignDialog(false);
      resetDialogs();
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar la campana');
    } finally {
      setSaving(false);
    }
  };

  const handleTeamSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...teamForm, is_active: Boolean(teamForm.is_active) };
      if (editingTeamMember) {
        if (!payload.password) delete payload.password;
        delete payload.email;
        await api.put(`/rovi-internal/team/${editingTeamMember.id}`, payload);
        toast.success('Miembro actualizado');
      } else {
        await api.post('/rovi-internal/team', payload);
        toast.success('Miembro creado');
      }
      setTeamDialog(false);
      resetDialogs();
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el miembro');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntity = async (kind, item) => {
    const labels = {
      prospect: ['prospecto', `/rovi-internal/prospects/${item.id}`],
      plan: ['plan', `/rovi-internal/service-plans/${item.id}`],
      campaign: ['campana', `/rovi-internal/campaigns/${item.id}`],
      team: ['miembro', `/rovi-internal/team/${item.id}`],
    };
    const [label, endpoint] = labels[kind];
    const confirmed = window.confirm(`Eliminar ${label}: ${item.company_name || item.name || item.email}?`);
    if (!confirmed) return;
    try {
      await api.delete(endpoint);
      toast.success(`${label} eliminado`);
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || `No se pudo eliminar ${label}`);
    }
  };

  const advanceProspect = async (prospect) => {
    const currentIndex = stages.indexOf(prospect.stage);
    const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)] || prospect.stage;
    if (nextStage === prospect.stage) return;
    try {
      await api.put(`/rovi-internal/prospects/${prospect.id}`, {
        stage: nextStage,
        last_activity: `Movido a ${stageLabels[nextStage] || nextStage}`,
      });
      toast.success(`${prospect.company_name} avanzo a ${stageLabels[nextStage] || nextStage}`);
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo avanzar');
    }
  };

  const startCampaign = async (campaign) => {
    try {
      await api.post(`/rovi-internal/campaigns/${campaign.id}/start`);
      toast.success('Campana iniciada');
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo iniciar la campana');
    }
  };

  const pauseCampaign = async (campaign) => {
    try {
      await api.post(`/rovi-internal/campaigns/${campaign.id}/pause`);
      toast.success('Campana pausada');
      await loadWorkspace();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo pausar la campana');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-5 py-7 pb-24 sm:px-7 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-3">ROVI Internal Workspace</Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">{header.title}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{header.subtitle}</p>
          </div>
          <Button onClick={loadWorkspace} variant="outline" className="w-fit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {view === 'dashboard' && (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={CircleDollarSign} label="MRR cerrado" value={currency(metrics.closed_mrr_mxn)} helper="Contratos, onboarding y activos" tone="success" />
              <MetricCard icon={LineChart} label="MRR ponderado" value={currency(metrics.weighted_mrr_mxn)} helper="Pipeline por probabilidad" />
              <MetricCard icon={Target} label="SQL activos" value={metrics.sql_count || 0} helper={`${metrics.mql_count || 0} MQLs totales`} tone="warning" />
              <MetricCard icon={Megaphone} label="Campanas activas" value={metrics.campaigns_running || 0} helper={`${metrics.campaign_roi_mrr || 0}x ROI MRR estimado`} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Pipeline SaaS</CardTitle>
                  <CardDescription>Venta B2B de suscripciones ROVI CRM.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {(dashboard?.stage_counts || []).map((item) => (
                    <StagePill key={item.stage} stage={item.stage} count={item.count} max={maxStageCount} />
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Top fuentes</CardTitle>
                  <CardDescription>Ordenado por MRR ponderado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dashboard?.source_stats || []).slice(0, 5).map((source) => (
                    <div key={source.source} className="rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{source.source}</p>
                        <Badge variant="secondary">{source.count}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{currency(source.weighted_mrr_mxn)} ponderado</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Prospectos calientes</CardTitle>
                  <CardDescription>Prioridad por fit, presupuesto, urgencia y dolor operativo.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {(dashboard?.hot_prospects || []).slice(0, 4).map((prospect) => (
                    <ProspectCard key={prospect.id} prospect={prospect} onEdit={openProspectDialog} onDelete={(item) => deleteEntity('prospect', item)} onAdvance={advanceProspect} />
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle>Campanas con impacto</CardTitle>
                  <CardDescription>Demanda activa conectada al pipeline interno.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {(dashboard?.top_campaigns || []).slice(0, 4).map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onEdit={openCampaignDialog}
                      onDelete={(item) => deleteEntity('campaign', item)}
                      onStart={startCampaign}
                      onPause={pauseCampaign}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {view === 'prospects' && (
          <>
            <ModuleToolbar
              search={search}
              onSearchChange={setSearch}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onCreate={() => openProspectDialog()}
              createLabel="Nuevo prospecto"
            >
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-52">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las etapas</SelectItem>
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModuleToolbar>

            {viewMode === 'cards' ? (
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredProspects.map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} onEdit={openProspectDialog} onDelete={(item) => deleteEntity('prospect', item)} onAdvance={advanceProspect} />
                ))}
              </div>
            ) : (
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Fuente</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>MRR</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspects.map((prospect) => (
                        <TableRow key={prospect.id}>
                          <TableCell>
                            <p className="font-medium">{prospect.company_name}</p>
                            <p className="text-xs text-muted-foreground">{prospect.contact_name} · {prospect.email}</p>
                          </TableCell>
                          <TableCell><Badge variant="outline">{stageLabels[prospect.stage] || prospect.stage}</Badge></TableCell>
                          <TableCell>{prospect.source}</TableCell>
                          <TableCell>{prospect.score}/100</TableCell>
                          <TableCell>{currency(prospect.expected_mrr_mxn)}</TableCell>
                          <TableCell className="capitalize">{prospect.recommended_plan}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openProspectDialog(prospect)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteEntity('prospect', prospect)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {view === 'plans' && (
          <>
            <ModuleToolbar search={search} onSearchChange={setSearch} onCreate={canAdmin ? () => openPlanDialog() : null} createLabel="Nuevo plan" />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.ideal_for}</CardDescription>
                      </div>
                      <Badge variant={plan.is_active ? 'secondary' : 'outline'}>{plan.is_active ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-3xl font-semibold">{plan.price_mxn ? currency(plan.price_mxn) : 'Cotizacion'}</p>
                    <div className="space-y-2">
                      {(plan.features || []).map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    {canAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openPlanDialog(plan)}><Edit className="mr-2 h-4 w-4" />Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteEntity('plan', plan)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {view === 'campaigns' && (
          <>
            <ModuleToolbar
              search={search}
              onSearchChange={setSearch}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onCreate={() => openCampaignDialog()}
              createLabel="Nueva campana"
            >
              <Select value={campaignStatusFilter} onValueChange={setCampaignStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(campaignStatus).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={campaignTypeFilter} onValueChange={setCampaignTypeFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  {Object.entries(campaignTypes).map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModuleToolbar>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Megaphone} label="Campanas" value={campaigns.length} helper={`${dashboard?.campaign_summary?.active_campaigns || 0} activas`} />
              <MetricCard icon={CircleDollarSign} label="Budget" value={currency(dashboard?.campaign_summary?.total_budget_mxn)} helper="Inversion planeada" />
              <MetricCard icon={Target} label="Demos" value={number(dashboard?.campaign_summary?.total_demos)} helper={`${dashboard?.campaign_summary?.reply_rate || 0}% reply rate`} tone="warning" />
              <MetricCard icon={LineChart} label="MRR esperado" value={currency(dashboard?.campaign_summary?.expected_mrr_mxn)} helper={`${dashboard?.campaign_summary?.roi_mrr || 0}x ROI MRR`} tone="success" />
            </div>

            {viewMode === 'cards' ? (
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} onEdit={openCampaignDialog} onDelete={(item) => deleteEntity('campaign', item)} onStart={startCampaign} onPause={pauseCampaign} />
                ))}
              </div>
            ) : (
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campana</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Segmento</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>MRR esperado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">{campaign.objective}</p>
                          </TableCell>
                          <TableCell><StatusBadge status={campaign.status} /></TableCell>
                          <TableCell>{campaignTypes[campaign.campaign_type]?.label || campaign.campaign_type}</TableCell>
                          <TableCell>{campaign.segment}</TableCell>
                          <TableCell>{currency(campaign.budget_mxn)}</TableCell>
                          <TableCell>{currency(campaign.expected_mrr_mxn)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openCampaignDialog(campaign)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteEntity('campaign', campaign)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {view === 'analytics' && (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={BriefcaseBusiness} label="Pipeline value" value={currency(metrics.pipeline_value_mxn)} helper="MRR potencial abierto" />
              <MetricCard icon={BarChart3} label="Conversion rate" value={`${metrics.conversion_rate || 0}%`} helper="Cerrados sobre total de prospectos" />
              <MetricCard icon={Megaphone} label="Budget campanas" value={currency(metrics.campaign_budget_mxn)} helper={`${metrics.campaign_roi_mrr || 0}x ROI MRR`} />
              <MetricCard icon={Users} label="Equipo activo" value={metrics.active_team || 0} helper={`${metrics.active_plans || 0} planes activos`} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>ROI por fuente</CardTitle>
                  <CardDescription>Base para decisiones de pauta, partnerships y referrals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(dashboard?.source_stats || []).map((source) => (
                    <div key={source.source} className="rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{source.source}</p>
                        <Badge variant="outline">{source.count} prospectos</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <p className="text-muted-foreground">MRR cerrado: <span className="text-foreground">{currency(source.closed_mrr_mxn)}</span></p>
                        <p className="text-muted-foreground">MRR ponderado: <span className="text-foreground">{currency(source.weighted_mrr_mxn)}</span></p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle>Performance de campanas</CardTitle>
                  <CardDescription>Comparativo de canales, demos y MRR esperado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-lg border border-border/70 bg-background/45 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaignTypes[campaign.campaign_type]?.label || campaign.campaign_type} · {campaign.segment}</p>
                        </div>
                        <Badge variant="secondary">{campaign.roi_mrr || 0}x</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-lg bg-muted/40 p-2"><p className="text-xs text-muted-foreground">Replies</p><p className="font-semibold">{campaign.reply_count}</p></div>
                        <div className="rounded-lg bg-muted/40 p-2"><p className="text-xs text-muted-foreground">Demos</p><p className="font-semibold">{campaign.demo_count}</p></div>
                        <div className="rounded-lg bg-muted/40 p-2"><p className="text-xs text-muted-foreground">MRR</p><p className="font-semibold">{currency(campaign.expected_mrr_mxn)}</p></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {view === 'team' && (
          <>
            <ModuleToolbar search={search} onSearchChange={setSearch} onCreate={canAdmin ? () => openTeamDialog() : null} createLabel="Nuevo miembro">
              <Select value={teamRoleFilter} onValueChange={setTeamRoleFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ModuleToolbar>

            <Card className="rounded-lg border-border/70 bg-card/85 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeam.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{roleLabels[member.role] || member.role}</Badge></TableCell>
                        <TableCell>{member.department || 'Sin area'}</TableCell>
                        <TableCell><Badge variant={member.is_active ? 'secondary' : 'outline'}>{member.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                        <TableCell className="text-right">
                          {canAdmin && <Button size="sm" variant="ghost" onClick={() => openTeamDialog(member)}><Edit className="h-4 w-4" /></Button>}
                          {canAdmin && <Button size="sm" variant="ghost" onClick={() => deleteEntity('team', member)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={prospectDialog} onOpenChange={(open) => { setProspectDialog(open); if (!open) resetDialogs(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProspect ? 'Editar prospecto SaaS' : 'Nuevo prospecto SaaS'}</DialogTitle>
            <DialogDescription>Gestiona el pipeline interno con el mismo flujo operativo de Leads.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleProspectSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Empresa"><Input value={prospectForm.company_name} onChange={(e) => setProspectForm({ ...prospectForm, company_name: e.target.value })} required /></Field>
              <Field label="Contacto"><Input value={prospectForm.contact_name} onChange={(e) => setProspectForm({ ...prospectForm, contact_name: e.target.value })} required /></Field>
              <Field label="Email"><Input value={prospectForm.email || ''} onChange={(e) => setProspectForm({ ...prospectForm, email: e.target.value })} /></Field>
              <Field label="Telefono"><Input value={prospectForm.phone || ''} onChange={(e) => setProspectForm({ ...prospectForm, phone: e.target.value })} /></Field>
              <Field label="Fuente"><Input value={prospectForm.source} onChange={(e) => setProspectForm({ ...prospectForm, source: e.target.value })} /></Field>
              <Field label="Etapa">
                <Select value={prospectForm.stage} onValueChange={(value) => setProspectForm({ ...prospectForm, stage: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Brokers"><Input type="number" min="1" value={prospectForm.broker_count} onChange={(e) => setProspectForm({ ...prospectForm, broker_count: e.target.value })} /></Field>
              <Field label="Budget mensual"><Input type="number" min="0" value={prospectForm.monthly_budget_mxn} onChange={(e) => setProspectForm({ ...prospectForm, monthly_budget_mxn: e.target.value })} /></Field>
              <Field label="MRR esperado"><Input type="number" min="0" value={prospectForm.expected_mrr_mxn} onChange={(e) => setProspectForm({ ...prospectForm, expected_mrr_mxn: e.target.value })} /></Field>
              <Field label="Plan recomendado">
                <Select value={prospectForm.recommended_plan || 'standard'} onValueChange={(value) => setProspectForm({ ...prospectForm, recommended_plan: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Pain points"><Textarea value={prospectForm.pain_points} onChange={(e) => setProspectForm({ ...prospectForm, pain_points: e.target.value })} placeholder="Separados por coma" /></Field>
            <Field label="Siguiente accion"><Textarea value={prospectForm.next_action || ''} onChange={(e) => setProspectForm({ ...prospectForm, next_action: e.target.value })} /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProspectDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar prospecto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialog} onOpenChange={(open) => { setPlanDialog(open); if (!open) resetDialogs(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar plan ROVI' : 'Nuevo plan ROVI'}</DialogTitle>
            <DialogDescription>Administra tiers, precios y features comerciales.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handlePlanSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tier"><Input value={planForm.tier} onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })} required /></Field>
              <Field label="Nombre"><Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} required /></Field>
              <Field label="Precio MXN"><Input type="number" value={planForm.price_mxn} onChange={(e) => setPlanForm({ ...planForm, price_mxn: e.target.value })} /></Field>
              <Field label="Max brokers"><Input type="number" value={planForm.max_brokers} onChange={(e) => setPlanForm({ ...planForm, max_brokers: e.target.value })} /></Field>
            </div>
            <Field label="Ideal para"><Textarea value={planForm.ideal_for} onChange={(e) => setPlanForm({ ...planForm, ideal_for: e.target.value })} required /></Field>
            <Field label="Features"><Textarea value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} placeholder="Separadas por coma" /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlanDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar plan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={campaignDialog} onOpenChange={(open) => { setCampaignDialog(open); if (!open) resetDialogs(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editar campana ROVI' : 'Nueva campana ROVI'}</DialogTitle>
            <DialogDescription>Campanas internas con gestion similar al modulo de Campanas.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleCampaignSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre"><Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} required /></Field>
              <Field label="Canal">
                <Select value={campaignForm.campaign_type} onValueChange={(value) => setCampaignForm({ ...campaignForm, campaign_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(campaignTypes).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado">
                <Select value={campaignForm.status} onValueChange={(value) => setCampaignForm({ ...campaignForm, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(campaignStatus).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Segmento"><Input value={campaignForm.segment} onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })} /></Field>
              <Field label="Budget"><Input type="number" value={campaignForm.budget_mxn} onChange={(e) => setCampaignForm({ ...campaignForm, budget_mxn: e.target.value })} /></Field>
              <Field label="MRR esperado"><Input type="number" value={campaignForm.expected_mrr_mxn} onChange={(e) => setCampaignForm({ ...campaignForm, expected_mrr_mxn: e.target.value })} /></Field>
              <Field label="Recipients"><Input type="number" value={campaignForm.total_recipients} onChange={(e) => setCampaignForm({ ...campaignForm, total_recipients: e.target.value })} /></Field>
              <Field label="Enviados"><Input type="number" value={campaignForm.sent_count} onChange={(e) => setCampaignForm({ ...campaignForm, sent_count: e.target.value })} /></Field>
              <Field label="Replies"><Input type="number" value={campaignForm.reply_count} onChange={(e) => setCampaignForm({ ...campaignForm, reply_count: e.target.value })} /></Field>
              <Field label="Demos"><Input type="number" value={campaignForm.demo_count} onChange={(e) => setCampaignForm({ ...campaignForm, demo_count: e.target.value })} /></Field>
            </div>
            <Field label="Objetivo"><Textarea value={campaignForm.objective} onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })} /></Field>
            <Field label="Notas"><Textarea value={campaignForm.notes || ''} onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })} /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCampaignDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar campana'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={teamDialog} onOpenChange={(open) => { setTeamDialog(open); if (!open) resetDialogs(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTeamMember ? 'Editar miembro interno' : 'Nuevo miembro interno'}</DialogTitle>
            <DialogDescription>Administra usuarios del workspace ROVI.</DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleTeamSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre"><Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required /></Field>
              <Field label="Email"><Input value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} required disabled={Boolean(editingTeamMember)} /></Field>
              <Field label="Rol">
                <Select value={teamForm.role} onValueChange={(value) => setTeamForm({ ...teamForm, role: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Departamento"><Input value={teamForm.department || ''} onChange={(e) => setTeamForm({ ...teamForm, department: e.target.value })} /></Field>
              <Field label="Telefono"><Input value={teamForm.phone || ''} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} /></Field>
              <Field label={editingTeamMember ? 'Nueva password opcional' : 'Password inicial'}><Input value={teamForm.password || ''} onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })} /></Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTeamDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar miembro'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

export default RoviInternalWorkspacePage;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, Circle, AlertTriangle, Clock, Rocket,
  TrendingUp, Target, Calendar, Users, DollarSign,
  Layers, Zap, Settings, BarChart3, Package,
  ChevronRight, ChevronDown, Info, Loader2, Sparkles,
  BookOpen, LineChart, Radio, Wrench, Mail, Phone,
  MessageSquare, FileText, Database, Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';

// Icon mapping for modules
const MODULE_ICONS = {
  auth: Settings,
  dashboard: BarChart3,
  leads_pipeline: Users,
  import_leads: Package,
  calendar: Calendar,
  gamification: Trophy,
  scripts: FileText,
  database_chat: MessageSquare,
  campaigns: Radio,
  email_templates: Mail,
  analytics: LineChart,
  encuentra_leads: Search,
  products: Box,
  automations: Zap,
  brokers: Users,
  settings: Settings,
  landing_page: Rocket
};

// Category colors
const CATEGORY_COLORS = {
  core: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  sales: 'bg-green-500/10 text-green-500 border-green-500/20',
  marketing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  productivity: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  engagement: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  ai: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  analytics: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  automation: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  team: 'bg-teal-500/10 text-teal-500 border-teal-500/20'
};

// Status configuration
const STATUS_CONFIG = {
  production_ready: {
    label: 'Production Ready',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    icon: CheckCircle2,
    bgLight: 'bg-green-500/10'
  },
  completed: {
    label: 'Completado',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    icon: CheckCircle2,
    bgLight: 'bg-blue-500/10'
  },
  in_progress: {
    label: 'En Progreso',
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
    icon: Loader2,
    bgLight: 'bg-amber-500/10'
  },
  testing: {
    label: 'En Testing',
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
    icon: AlertTriangle,
    bgLight: 'bg-purple-500/10'
  },
  not_started: {
    label: 'No Iniciado',
    color: 'bg-gray-400',
    textColor: 'text-gray-400',
    icon: Circle,
    bgLight: 'bg-gray-500/10'
  }
};

// Tier configuration
const TIER_CONFIG = {
  essential: {
    name: 'MVP Esencial',
    description: 'Para brokers individuales beginner',
    price: '$49/mes',
    color: 'bg-blue-500',
    icon: Rocket
  },
  standard: {
    name: 'MVP Estándar',
    description: 'Para brokers individuales experimentados',
    price: '$99/mes',
    color: 'bg-green-500',
    icon: TrendingUp
  },
  professional: {
    name: 'MVP Profesional',
    description: 'Para pequeñas agencias (2-5 brokers)',
    price: '$299/mes',
    color: 'bg-purple-500',
    icon: Target
  },
  enterprise: {
    name: 'MVP Enterprise',
    description: 'Para agencias grandes (6+ brokers)',
    price: '$599/mes',
    color: 'bg-amber-500',
    icon: Sparkles
  }
};

export const ModuleTrackerPage = () => {
  const { api, isIndividual } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState({});
  const [mvpConfig, setMvpConfig] = useState(null);
  const [recommendedTier, setRecommendedTier] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [productionStatus, setProductionStatus] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // MVP Calculator state
  const [requirements, setRequirements] = useState({
    team_size: 1,
    leads_per_month: 50,
    need_campaigns: false,
    need_automation: false,
    budget: 5000
  });
  const [calculatedMVP, setCalculatedMVP] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modulesRes, mvpRes, tierRes, roadmapRes, statusRes] = await Promise.all([
        api.get('/modules'),
        api.get('/mvp/config'),
        api.get('/mvp/recommended'),
        api.get('/roadmap'),
        api.get('/status/production')
      ]);

      setModules(modulesRes.data.modules);
      setMvpConfig(mvpRes.data.tiers);
      setRecommendedTier(tierRes.data);
      setRoadmap(roadmapRes.data);
      setProductionStatus(statusRes.data);
    } catch (error) {
      console.error('Error loading module tracker:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateMVP = async () => {
    try {
      const res = await api.post('/mvp/calculate', requirements);
      setCalculatedMVP(res.data);
      toast.success('MVP calculado correctamente');
    } catch (error) {
      toast.error('Error calculando MVP');
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getModuleStatus = (module) => {
    const completion = module.completion || 0;
    if (completion >= 100) return 'production_ready';
    if (completion >= 90) return 'completed';
    if (completion > 0) return 'in_progress';
    return 'not_started';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats
  const allModules = Object.values(modules);
  const avgCompletion = allModules.reduce((sum, m) => sum + (m.completion || 0), 0) / allModules.length;
  const productionReady = allModules.filter(m => m.completion >= 90).length;
  const inProgress = allModules.filter(m => m.completion > 0 && m.completion < 90).length;
  const notStarted = allModules.filter(m => m.completion === 0).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Dashboard de Implementación</h1>
          <p className="text-muted-foreground">Seguimiento del desarrollo del CRM y plan de producción</p>
        </div>
        {recommendedTier && (
          <Badge className={`${TIER_CONFIG[recommendedTier.recommended_tier]?.color} text-white text-sm px-4 py-2`}>
            {TIER_CONFIG[recommendedTier.recommended_tier]?.name}
          </Badge>
        )}
      </div>

      {/* Production Status Banner */}
      {productionStatus && (
        <Card className={`${productionStatus.ready_for_production ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {productionStatus.ready_for_production ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-amber-500" />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {productionStatus.ready_for_production ? '¡Listo para Producción!' : 'En Desarrollo'}
                  </h3>
                  <p className="text-muted-foreground">
                    {productionStatus.ready_for_production
                      ? 'El sistema está listo para el lanzamiento MVP'
                      : `${productionStatus.estimated_days_to_launch} días estimados para producción`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{productionStatus.overall_completion.toFixed(0)}%</div>
                <p className="text-sm text-muted-foreground">Completado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Módulos</p>
                <p className="text-2xl font-bold">{allModules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Production Ready</p>
                <p className="text-2xl font-bold">{productionReady}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">{inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
                <Circle className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No Iniciados</p>
                <p className="text-2xl font-bold">{notStarted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="mvp">MVP Calculator</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap 4 Semanas</TabsTrigger>
          <TabsTrigger value="tiers">Configuración MVP</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Módulos</CardTitle>
              <CardDescription>Progreso de implementación de cada módulo del CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {Object.values(modules).map((module) => {
                    const ModuleIcon = MODULE_ICONS[module.id] || Layers;
                    const status = getModuleStatus(module);
                    const statusConfig = STATUS_CONFIG[status];
                    const StatusIcon = statusConfig.icon;
                    const isExpanded = expandedModules[module.id];

                    return (
                      <div key={module.id} className="border rounded-xl overflow-hidden">
                        <div
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg ${CATEGORY_COLORS[module.category]?.split(' ')[0] || 'bg-gray-500/10'} flex items-center justify-center flex-shrink-0`}>
                              <ModuleIcon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{module.name}</h4>
                                <Badge className={`${statusConfig.bgLight} ${statusConfig.textColor} text-xs`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">{module.completion || 0}%</p>
                                <p className="text-xs text-muted-foreground">{module.estimated_hours}h estimadas</p>
                              </div>
                              <Progress value={module.completion || 0} className="w-20" />
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t bg-muted/30 p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Categoría</p>
                                <Badge className="mt-1" variant="outline">{module.category}</Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Probado</p>
                                <p className="font-medium">{module.tested ? '✅ Sí' : '⚠️ No'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Notas</p>
                                <p className="text-xs mt-1">{module.notes || 'Sin notas'}</p>
                              </div>
                            </div>

                            {module.backend_endpoints && (
                              <div>
                                <p className="text-sm font-medium mb-2">Endpoints Backend</p>
                                <div className="space-y-1">
                                  {module.backend_endpoints.slice(0, 3).map((endpoint, idx) => (
                                    <code key={idx} className="block text-xs bg-background px-2 py-1 rounded">
                                      {endpoint}
                                    </code>
                                  ))}
                                  {module.backend_endpoints.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{module.backend_endpoints.length - 3} más endpoints
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {module.dependencies && module.dependencies.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Dependencias</p>
                                <div className="flex gap-2 flex-wrap">
                                  {module.dependencies.map((dep) => (
                                    <Badge key={dep} variant="secondary" className="text-xs">
                                      {modules[dep]?.name || dep}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MVP Calculator Tab */}
        <TabsContent value="mvp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MVP Calculator</CardTitle>
              <CardDescription>Calcula el MVP ideal según tus necesidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tamaño del Equipo</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={requirements.team_size}
                      onChange={(e) => setRequirements({ ...requirements, team_size: parseInt(e.target.value) })}
                      className="w-full mt-2"
                    />
                    <p className="text-sm text-muted-foreground">{requirements.team_size} brokers</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Leads por Mes</label>
                    <input
                      type="number"
                      value={requirements.leads_per_month}
                      onChange={(e) => setRequirements({ ...requirements, leads_per_month: parseInt(e.target.value) })}
                      className="w-full mt-2 border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={requirements.need_campaigns}
                        onChange={(e) => setRequirements({ ...requirements, need_campaigns: e.target.checked })}
                      />
                      <span className="text-sm">Necesito campañas masivas</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={requirements.need_automation}
                        onChange={(e) => setRequirements({ ...requirements, need_automation: e.target.checked })}
                      />
                      <span className="text-sm">Necesito automatizaciones avanzadas</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button onClick={calculateMVP} className="w-full" size="lg">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Calcular MVP Recomendado
                  </Button>

                  {calculatedMVP && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">MVP Recomendado</p>
                            <p className="text-xl font-bold">{TIER_CONFIG[calculatedMVP.recommended_tier]?.name}</p>
                          </div>
                          <Badge className={`${TIER_CONFIG[calculatedMVP.recommended_tier]?.color} text-white`}>
                            {calculatedMVP.tier_config.price_point}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Progreso Actual</p>
                          <Progress value={calculatedMVP.completion_percentage} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Horas Restantes</p>
                            <p className="font-medium">~{calculatedMVP.estimated_hours_remaining}h</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Semanas Estimadas</p>
                            <p className="font-medium">~{calculatedMVP.estimated_weeks} semanas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan de Implementación - 4 Semanas</CardTitle>
              <CardDescription>Ruta óptima para llevar el CRM a producción</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {Object.entries(roadmap || {}).map(([weekKey, week]) => (
                    <Card key={weekKey} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{week.name}</CardTitle>
                            <CardDescription>{week.focus}</CardDescription>
                          </div>
                          <Badge variant="outline">{week.hours} horas</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Módulos</p>
                          <div className="flex gap-2 flex-wrap">
                            {week.modules?.map((mod) => (
                              <Badge key={mod} variant="secondary" className="text-xs">
                                {modules[mod]?.name || mod}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Tareas</p>
                          <ul className="space-y-1">
                            {week.tasks?.map((task, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">Entregables</p>
                          <ul className="space-y-1">
                            {week.deliverables?.map ( (deliverable, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(TIER_CONFIG).map(([tier, config]) => {
              const tierData = mvpConfig?.[tier];
              const tierModules = tierData?.modules || [];
              const completion = tierModules.reduce((sum, m) => sum + (modules[m]?.completion || 0), 0) / tierModules.length;
              const TierIcon = config.icon;

              return (
                <Card key={tier} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center`}>
                          <TierIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${config.color} text-white`}>
                        {config.price}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progreso</span>
                        <span className="font-medium">{completion.toFixed(0)}%</span>
                      </div>
                      <Progress value={completion} />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Módulos Incluidos ({tierModules.length})</p>
                      <ScrollArea className="h-32">
                        <div className="space-y-1">
                          {tierModules.map((modId) => {
                            const mod = modules[modId];
                            if (!mod) return null;
                            const ModIcon = MODULE_ICONS[modId] || Layers;
                            return (
                              <div key={modId} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50">
                                <ModIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1">{mod.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {mod.completion || 0}%
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    <Button variant="outline" className="w-full">
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Detail Dialog */}
      <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedModule?.name}</DialogTitle>
            <DialogDescription>{selectedModule?.description}</DialogDescription>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4">
              {/* Module details */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

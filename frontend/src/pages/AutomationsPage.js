import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap, Play, Pause, Trash2, Edit, Plus, Loader2, Settings,
  TestTube, Clock, CheckCircle, XCircle, AlertCircle, Sparkles,
  Users, TrendingUp, Megaphone, Calendar, RefreshCw, ChevronRight,
  Save, Eye, Copy, Webhook, Workflow, MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
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
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const categoryConfig = {
  lead_generation: {
    label: 'Generación de Leads',
    icon: Users,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  sales: {
    label: 'Ventas',
    icon: TrendingUp,
    color: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  promotion: {
    label: 'Promoción',
    icon: Megaphone,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  custom: {
    label: 'Personalizado',
    icon: Settings,
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
};

const statusConfig = {
  active: { label: 'Activo', color: 'bg-green-500', icon: CheckCircle },
  inactive: { label: 'Inactivo', color: 'bg-gray-500', icon: XCircle },
  running: { label: 'Ejecutando', color: 'bg-blue-500', icon: Loader2 },
  error: { label: 'Error', color: 'bg-red-500', icon: AlertCircle }
};

// Workflow Card Component
const WorkflowCard = ({ workflow, onToggle, onEdit, onTest, onDelete, onView }) => {
  const category = categoryConfig[workflow.category] || categoryConfig.custom;
  const CategoryIcon = category.icon;
  const status = workflow.is_active ? 'active' : 'inactive';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{workflow.name}</h3>
              <p className="text-xs text-muted-foreground">{category.label}</p>
            </div>
          </div>
          <Badge className={`${statusInfo.color} text-white text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {workflow.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {workflow.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>{workflow.total_runs || 0} ejecuciones</span>
          </div>
          {workflow.last_run && (
            <span>Última: {new Date(workflow.last_run).toLocaleDateString()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={workflow.is_active ? "outline" : "default"}
              onClick={() => onToggle(workflow)}
            >
              {workflow.is_active ? (
                <><Pause className="w-3 h-3 mr-1" /> Pausar</>
              ) : (
                <><Play className="w-3 h-3 mr-1" /> Activar</>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onTest(workflow)}>
              <TestTube className="w-3 h-3 mr-1" /> Probar
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(workflow)}>
                <Eye className="w-4 h-4 mr-2" /> Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(workflow)}>
                <Edit className="w-4 h-4 mr-2" /> Configurar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(workflow)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

// Configuration Modal
const ConfigModal = ({ isOpen, onClose, workflow, onSave, token }) => {
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState(null);
  const [values, setValues] = useState({});

  useEffect(() => {
    if (workflow) {
      setValues(workflow.config_values || {});
      // Load variables schema
      loadVariables();
    }
  }, [workflow]);

  const loadVariables = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/automations/workflows/${workflow.id}/variables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSchema(data);
      }
    } catch (error) {
      console.error('Error loading variables:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/automations/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          category: workflow.category,
          config_values: values
        })
      });
      toast.success('Configuración guardada');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (variable) => {
    const value = values[variable.name] !== undefined ? values[variable.name] : variable.default;

    switch (variable.type) {
      case 'text':
      case 'email':
        return (
          <Input
            value={value || ''}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            placeholder={variable.default}
            type={variable.type === 'email' ? 'email' : 'text'}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => setValues({ ...values, [variable.name]: parseInt(e.target.value) || 0 })}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => setValues({ ...values, [variable.name]: checked })}
            />
            <span className="text-sm text-muted-foreground">
              {value ? 'Sí' : 'No'}
            </span>
          </div>
        );

      case 'select':
        return (
          <Select
            value={value || variable.default}
            onValueChange={(val) => setValues({ ...values, [variable.name]: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            rows={3}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
          />
        );
    }
  };

  if (!workflow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurar Workflow
          </DialogTitle>
          <DialogDescription>
            {workflow.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {schema?.variables ? (
              schema.variables.map((variable, idx) => (
                <div key={idx} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {variable.label}
                    {variable.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderField(variable)}
                  {variable.description && (
                    <p className="text-xs text-muted-foreground">{variable.description}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay variables configurables</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Test Result Modal
const TestResultModal = ({ isOpen, onClose, result }) => {
  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            Resultado de la Prueba
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Prueba completada exitosamente</span>
            </div>
            <p className="text-sm text-muted-foreground">
              El workflow se ejecutó correctamente.
            </p>
          </div>

          <div>
            <Label>Execution ID</Label>
            <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{result.execution_id}</p>
          </div>

          <div>
            <Label>Resultado</Label>
            <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export const AutomationsPage = () => {
  const { api, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTestResult, setShowTestResult] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/automations/workflows');
      setWorkflows(res.data || []);
    } catch (error) {
      toast.error('Error al cargar workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (workflow) => {
    try {
      const endpoint = workflow.is_active ? 'deactivate' : 'activate';
      await api.post(`/automations/workflows/${workflow.id}/${endpoint}`);
      toast.success(`Workflow ${workflow.is_active ? 'desactivado' : 'activado'}`);
      loadWorkflows();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleTest = async (workflow) => {
    try {
      const res = await api.post(`/automations/workflows/${workflow.id}/test`);
      setTestResult(res.data);
      setShowTestResult(true);
      toast.success('Prueba completada');
    } catch (error) {
      toast.error('Error al ejecutar prueba');
    }
  };

  const handleDelete = async (workflow) => {
    if (!confirm(`¿Eliminar el workflow "${workflow.name}"?`)) return;
    try {
      await api.delete(`/automations/workflows/${workflow.id}`);
      toast.success('Workflow eliminado');
      loadWorkflows();
    } catch (error) {
      toast.error('Error al eliminar workflow');
    }
  };

  const handleSeedTemplates = async () => {
    try {
      const res = await api.post('/automations/seed');
      toast.success(`${res.data.created} plantillas creadas`);
      loadWorkflows();
    } catch (error) {
      toast.error('Error al crear plantillas');
    }
  };

  const filteredWorkflows = categoryFilter === 'all'
    ? workflows
    : workflows.filter(w => w.category === categoryFilter);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Automatizaciones</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] flex items-center gap-2">
            <Zap className="text-primary" />
            Automatizaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus workflows de n8n para automatizar procesos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {workflows.length === 0 && (
            <Button variant="outline" onClick={handleSeedTemplates}>
              <Sparkles className="w-4 h-4 mr-2" />
              Cargar Plantillas
            </Button>
          )}
          <Button onClick={() => {/* TODO: Open visual editor */}}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Workflow
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Webhook className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Integración con n8n</p>
            <p className="text-sm text-muted-foreground">
              Los workflows se ejecutan en n8n. Activa, configura y prueba tus automatizaciones desde aquí.
              Configura tu webhook URL en configuración para conectar con tu instancia de n8n.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="lead_generation">Leads</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="promotion">Promoción</TabsTrigger>
          <TabsTrigger value="custom">Personalizados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Workflows Grid */}
      {filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onToggle={handleToggle}
              onEdit={(w) => {
                setSelectedWorkflow(w);
                setShowConfigModal(true);
              }}
              onTest={handleTest}
              onDelete={handleDelete}
              onView={(w) => {/* TODO: Show details */}}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Workflow className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay workflows configurados</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {workflows.length === 0
                ? 'Carga las plantillas predefinidas o crea tu primera automatización.'
                : 'No hay workflows en esta categoría.'}
            </p>
            {workflows.length === 0 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleSeedTemplates}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Cargar Plantillas
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Workflow
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showConfigModal && (
        <ConfigModal
          isOpen={showConfigModal}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedWorkflow(null);
          }}
          workflow={selectedWorkflow}
          onSave={loadWorkflows}
          token={token}
        />
      )}

      {showTestResult && (
        <TestResultModal
          isOpen={showTestResult}
          onClose={() => setShowTestResult(false)}
          result={testResult}
        />
      )}
    </div>
  );
};

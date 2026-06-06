import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Target, TrendingUp, Users, DollarSign, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { resolveAuthenticatedHome } from '../lib/copimAccess';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea.jsx';
import { toast } from 'sonner';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { api, updateUser, user, setAppMode } = useAuth();
  const isCopim = user?.account_type === 'copim';
  const isSalesOnboarding = ['individual', 'agency'].includes(user?.account_type);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState({
    ventas_mes: 5,
    ingresos_objetivo: 500000,
    leads_contactados: 50,
    tasa_conversion: 10,
    apartados_mes: 10,
    periodo: 'mensual',
    utilidades_actuales_mensuales: 0,
    utilidades_meta_mensuales: 0
  });
  const [aiProfile, setAiProfile] = useState({
    experience: '',
    style: '',
    property_types: '',
    focus_zones: '',
    goals: ''
  });
  const [institutionalProfile, setInstitutionalProfile] = useState({
    institution_name: user?.name || 'COPIM',
    coverage_scope: 'nacional',
    target_associations: 4,
    active_members_goal: 250,
    primary_focus: 'membresias, eventos y directorio',
    success_metric: 'renovacion y activacion institucional'
  });

  const totalSteps = isCopim ? 3 : isSalesOnboarding ? 1 : 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isCopim) {
        await api.post('/auth/complete-onboarding', {
          context: 'copim_institucional',
          metadata: institutionalProfile
        });
      } else if (isSalesOnboarding) {
        const salesGoals = {
          ...goals,
          periodo: 'mensual',
          ingresos_objetivo: Number(goals.utilidades_meta_mensuales) || 0,
          utilidades_actuales_mensuales: Number(goals.utilidades_actuales_mensuales) || 0,
          utilidades_meta_mensuales: Number(goals.utilidades_meta_mensuales) || 0
        };

        await api.post('/goals', salesGoals);
        await api.post('/seed');
      } else {
        // Save goals
        await api.post('/goals', goals);

        // Save AI profile
        if (aiProfile.experience || aiProfile.style) {
          await api.post('/user/ai-profile', {
            experience: aiProfile.experience || 'Broker inmobiliario',
            style: aiProfile.style || 'Profesional y amigable',
            property_types: aiProfile.property_types ? aiProfile.property_types.split(',').map(s => s.trim()) : ['Lotes', 'Casas'],
            focus_zones: aiProfile.focus_zones ? aiProfile.focus_zones.split(',').map(s => s.trim()) : ['Tulum'],
            goals: aiProfile.goals || `${goals.ventas_mes} ventas mensuales de $${(goals.ingresos_objetivo / 1000000).toFixed(1)}M MXN`
          });
        }

        // Seed demo data
        await api.post('/seed');
      }

      toast.success(isCopim
        ? 'COPIM institucional activado dentro de ROVI.'
        : '¡Configuración completada! Tu asistente IA está personalizado.');
      const nextUser = { ...user, onboarding_completed: true };
      updateUser(nextUser);
      setAppMode(nextUser.account_type === 'copim' ? 'copim' : 'rovi');
      navigate(resolveAuthenticatedHome(nextUser, nextUser.account_type === 'copim' ? 'copim' : 'rovi'));
    } catch (error) {
      toast.error('Error al guardar configuración');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="onboarding-page">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-['Outfit']">Rovi CRM</h1>
          </div>
          <p className="text-muted-foreground">
            {isCopim
              ? 'Configuremos tu workspace institucional para operar COPIM dentro de ROVI.'
              : isSalesOnboarding
                ? 'Define tu punto de partida y tu meta mensual.'
              : 'Configuremos tus metas para maximizar tu éxito'}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Paso {step} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <Card className="shadow-xl">
          {step === 1 && isCopim && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Configuración Institucional</CardTitle>
                    <CardDescription>Define el alcance inicial del módulo COPIM</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Nombre institucional</Label>
                  <Input
                    value={institutionalProfile.institution_name}
                    onChange={(e) => setInstitutionalProfile({ ...institutionalProfile, institution_name: e.target.value })}
                    data-testid="copim-institution-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alcance operativo</Label>
                    <Select
                      value={institutionalProfile.coverage_scope}
                      onValueChange={(value) => setInstitutionalProfile({ ...institutionalProfile, coverage_scope: value })}
                    >
                      <SelectTrigger data-testid="copim-coverage-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nacional">Nacional</SelectItem>
                        <SelectItem value="regional">Regional</SelectItem>
                        <SelectItem value="asociacion">Asociación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asociaciones objetivo</Label>
                    <Input
                      type="number"
                      min={1}
                      value={institutionalProfile.target_associations}
                      onChange={(e) => setInstitutionalProfile({
                        ...institutionalProfile,
                        target_associations: parseInt(e.target.value, 10) || 1
                      })}
                      data-testid="copim-target-associations"
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && isSalesOnboarding && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Utilidades mensuales</CardTitle>
                    <CardDescription>Cuéntanos tu utilidad actual y la meta que quieres alcanzar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Define tus utilidades mensuales actualmente.</Label>
                  <Input
                    type="number"
                    value={goals.utilidades_actuales_mensuales}
                    onChange={(e) => setGoals({
                      ...goals,
                      utilidades_actuales_mensuales: parseFloat(e.target.value) || 0
                    })}
                    min={0}
                    step={5000}
                    inputMode="decimal"
                    placeholder="Ej. 80000"
                    data-testid="goal-utilidades-actuales"
                  />
                  <p className="text-xs text-muted-foreground">Monto mensual aproximado en MXN.</p>
                </div>
                <div className="space-y-2">
                  <Label>Define las utilidades metas mensuales</Label>
                  <Input
                    type="number"
                    value={goals.utilidades_meta_mensuales}
                    onChange={(e) => setGoals({
                      ...goals,
                      utilidades_meta_mensuales: parseFloat(e.target.value) || 0
                    })}
                    min={0}
                    step={5000}
                    inputMode="decimal"
                    placeholder="Ej. 150000"
                    data-testid="goal-utilidades-meta"
                  />
                  <p className="text-xs text-muted-foreground">La meta de utilidad mensual que quieres lograr.</p>
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && !isCopim && !isSalesOnboarding && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Metas de Ventas</CardTitle>
                    <CardDescription>Define tus objetivos mensuales</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ventas por mes</Label>
                    <Input
                      type="number"
                      value={goals.ventas_mes}
                      onChange={(e) => setGoals({ ...goals, ventas_mes: parseInt(e.target.value) || 0 })}
                      min={1}
                      data-testid="goal-ventas"
                    />
                    <p className="text-xs text-muted-foreground">Número de ventas cerradas</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Apartados por mes</Label>
                    <Input
                      type="number"
                      value={goals.apartados_mes}
                      onChange={(e) => setGoals({ ...goals, apartados_mes: parseInt(e.target.value) || 0 })}
                      min={1}
                      data-testid="goal-apartados"
                    />
                    <p className="text-xs text-muted-foreground">Propiedades apartadas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Periodo de medición</Label>
                  <Select 
                    value={goals.periodo} 
                    onValueChange={(value) => setGoals({ ...goals, periodo: value })}
                  >
                    <SelectTrigger data-testid="goal-periodo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && isCopim && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Prioridades del Piloto</CardTitle>
                    <CardDescription>Enfoca la operación que Mario necesita ver primero</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meta de socios activos</Label>
                    <Input
                      type="number"
                      min={1}
                      value={institutionalProfile.active_members_goal}
                      onChange={(e) => setInstitutionalProfile({
                        ...institutionalProfile,
                        active_members_goal: parseInt(e.target.value, 10) || 1
                      })}
                      data-testid="copim-active-members-goal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Métrica de éxito principal</Label>
                    <Input
                      value={institutionalProfile.success_metric}
                      onChange={(e) => setInstitutionalProfile({ ...institutionalProfile, success_metric: e.target.value })}
                      data-testid="copim-success-metric"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Foco inicial del módulo</Label>
                  <Input
                    value={institutionalProfile.primary_focus}
                    onChange={(e) => setInstitutionalProfile({ ...institutionalProfile, primary_focus: e.target.value })}
                    data-testid="copim-primary-focus"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ejemplo: membresías, eventos, directorio, renovaciones y comunidad.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && !isCopim && !isSalesOnboarding && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Objetivos de Ingresos</CardTitle>
                    <CardDescription>¿Cuánto quieres generar?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Ingresos objetivo (MXN)</Label>
                  <Input
                    type="number"
                    value={goals.ingresos_objetivo}
                    onChange={(e) => setGoals({ ...goals, ingresos_objetivo: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={50000}
                    data-testid="goal-ingresos"
                  />
                  <p className="text-xs text-muted-foreground">
                    Equivale a ~{Math.ceil(goals.ingresos_objetivo / 2500000)} ventas promedio
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Tasa de conversión objetivo (%)</Label>
                  <Input
                    type="number"
                    value={goals.tasa_conversion}
                    onChange={(e) => setGoals({ ...goals, tasa_conversion: parseFloat(e.target.value) || 0 })}
                    min={1}
                    max={100}
                    data-testid="goal-conversion"
                  />
                  <p className="text-xs text-muted-foreground">Porcentaje de leads que cierran</p>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && isCopim && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle>Resumen del Workspace COPIM</CardTitle>
                    <CardDescription>Confirma la base institucional que quedará activa</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Resumen de activación
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Institución</p>
                      <p className="font-medium">{institutionalProfile.institution_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cobertura</p>
                      <p className="font-medium">{institutionalProfile.coverage_scope}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Asociaciones objetivo</p>
                      <p className="font-medium">{institutionalProfile.target_associations}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Socios activos meta</p>
                      <p className="font-medium">{institutionalProfile.active_members_goal}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary">
                    Este perfil entrará directo al módulo COPIM con foco en asociaciones, socios, membresías, eventos y comunidad.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && !isCopim && !isSalesOnboarding && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle>Actividad de Leads</CardTitle>
                    <CardDescription>¿Cuántos contactos planeas hacer?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Leads a contactar por mes</Label>
                  <Input
                    type="number"
                    value={goals.leads_contactados}
                    onChange={(e) => setGoals({ ...goals, leads_contactados: parseInt(e.target.value) || 0 })}
                    min={1}
                    data-testid="goal-leads"
                  />
                  <p className="text-xs text-muted-foreground">
                    ~{Math.ceil(goals.leads_contactados / 22)} contactos por día laboral
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Resumen de Metas
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ventas/mes</p>
                      <p className="font-medium">{goals.ventas_mes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Apartados/mes</p>
                      <p className="font-medium">{goals.apartados_mes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ingresos objetivo</p>
                      <p className="font-medium">${goals.ingresos_objetivo.toLocaleString()} MXN</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tasa conversión</p>
                      <p className="font-medium">{goals.tasa_conversion}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && !isCopim && !isSalesOnboarding && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Personaliza tu Asistente IA</CardTitle>
                    <CardDescription>3 preguntas para conocer tu estilo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>1. ¿Cuántos años de experiencia tienes vendiendo propiedades?</Label>
                  <Input
                    placeholder="Ej: 3 años vendiendo lotes en Tulum..."
                    value={aiProfile.experience}
                    onChange={(e) => setAiProfile({ ...aiProfile, experience: e.target.value })}
                    data-testid="ai-experience"
                  />
                  <p className="text-xs text-muted-foreground">Opcional: Esto ayuda al asistente a adaptarse a tu nivel</p>
                </div>

                <div className="space-y-2">
                  <Label>2. ¿Cómo describirías tu estilo de comunicación con clientes?</Label>
                  <Input
                    placeholder="Ej: Directo y amigable, uso ejemplos de Tulum..."
                    value={aiProfile.style}
                    onChange={(e) => setAiProfile({ ...aiProfile, style: e.target.value })}
                    data-testid="ai-style"
                  />
                  <p className="text-xs text-muted-foreground">Opcional: El asistente usará tu estilo en las respuestas</p>
                </div>

                <div className="space-y-2">
                  <Label>3. ¿Qué tipo de propiedades vendes y en qué zonas?</Label>
                  <Input
                    placeholder="Ej: Lotes en Tulum Centro y La Veleta..."
                    value={`${aiProfile.property_types}${aiProfile.focus_zones ? ' en ' + aiProfile.focus_zones : ''}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parts = value.split(' en ');
                      setAiProfile({
                        ...aiProfile,
                        property_types: parts[0] || '',
                        focus_zones: parts[1] || ''
                      });
                    }}
                    data-testid="ai-properties"
                  />
                  <p className="text-xs text-muted-foreground">Formato: "Tipo de propiedades en Zonas"</p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary">
                    ✨ Tu asistente IA usará esta información para darte respuestas personalizadas, consejos adaptados a tu experiencia y scripts con tu estilo.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between p-6 pt-0">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 1}
              className="rounded-full"
            >
              Anterior
            </Button>
            {step < totalSteps ? (
              <Button onClick={handleNext} className="rounded-full" data-testid="onboarding-next">
                Siguiente
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="rounded-full"
                data-testid="onboarding-finish"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isCopim ? 'Activar modulo COPIM' : 'Comenzar'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

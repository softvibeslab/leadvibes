import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Target, TrendingUp, Users, DollarSign, CheckCircle, Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea.jsx';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { api, updateUser, user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState({
    ventas_mes: 5,
    ingresos_objetivo: 500000,
    leads_contactados: 50,
    tasa_conversion: 10,
    apartados_mes: 10,
    periodo: 'mensual',
    // Nuevos campos
    contactos_base_datos: 100,
    nivel_expertise: 3,
    necesidades_diarias: [],
    requiere_canalizacion: false,
    integraciones_activas: [],
    kpis_personalizados: {}
  });
  const [aiProfile, setAiProfile] = useState({
    experience: '',
    style: '',
    property_types: '',
    focus_zones: '',
    goals: ''
  });

  const totalSteps = 6;  // Aumentado de 4 a 6
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
      // Save goals with all new fields
      await api.post('/user/onboarding-complete', goals, {
        headers: { 'Content-Type': 'application/json' }
      });

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

      toast.success('¡Configuración completada! Tu asistente IA está personalizado.');
      updateUser({ ...user, onboarding_completed: true });
      navigate('/dashboard');
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
          <p className="text-muted-foreground">Configuremos tus metas para maximizar tu éxito</p>
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
          {step === 1 && (
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

          {step === 2 && (
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

          {step === 3 && (
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

          {step === 4 && (
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

          {step === 5 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Expertise y Configuración</CardTitle>
                    <CardDescription>Ayúdanos a entender tu nivel y necesidades</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tamaño de tu base de contactos</Label>
                  <Input
                    type="number"
                    value={goals.contactos_base_datos}
                    onChange={(e) => setGoals({ ...goals, contactos_base_datos: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground">¿Cuántos contactos tienes en total?</p>
                </div>

                <div className="space-y-2">
                  <Label>Nivel de expertise en atención completa al cliente (1-5)</Label>
                  <Select
                    value={goals.nivel_expertise.toString()}
                    onValueChange={(v) => setGoals({ ...goals, nivel_expertise: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Principiante</SelectItem>
                      <SelectItem value="2">2 - Básico</SelectItem>
                      <SelectItem value="3">3 - Intermedio</SelectItem>
                      <SelectItem value="4">4 - Avanzado</SelectItem>
                      <SelectItem value="5">5 - Experto</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Desde la consulta hasta el cierre</p>
                </div>

                <div className="space-y-2">
                  <Label>¿En qué áreas necesitas mejorar? (Selecciona todas las aplicables)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cierre', 'Seguimiento', 'Calificación', 'Presentación', 'Negociación', 'Prospectación'].map((area) => (
                      <div key={area} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          id={`area-${area}`}
                          checked={goals.necesidades_diarias.includes(area.toLowerCase())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGoals({
                                ...goals,
                                necesidades_diarias: [...goals.necesidades_diarias, area.toLowerCase()]
                              });
                            } else {
                              setGoals({
                                ...goals,
                                necesidades_diarias: goals.necesidades_diarias.filter(a => a !== area.toLowerCase())
                              });
                            }
                          }}
                        />
                        <label htmlFor={`area-${area}`} className="text-sm cursor-pointer flex-1">
                          {area}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Checkbox
                    id="canalizacion"
                    checked={goals.requiere_canalizacion}
                    onCheckedChange={(checked) => setGoals({ ...goals, requiere_canalizacion: checked })}
                  />
                  <label htmlFor="canalizacion" className="text-sm cursor-pointer flex-1">
                    Requiero canalización con mi líder directo para mayor aprendizaje
                  </label>
                </div>
              </CardContent>
            </>
          )}

          {step === 6 && (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>Integraciones y KPIs</CardTitle>
                    <CardDescription>Configura tus integraciones y métricas personalizadas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Integraciones a conectar</Label>
                  <p className="text-xs text-muted-foreground mb-3">Selecciona las integraciones que deseas usar</p>
                  <div className="space-y-2">
                    {[
                      { key: 'vapi', label: 'VAPI (Llamadas IA)', icon: '📞' },
                      { key: 'twilio', label: 'Twilio (SMS)', icon: '💬' },
                      { key: 'sendgrid', label: 'SendGrid (Email)', icon: '📧' },
                      { key: 'google_calendar', label: 'Google Calendar', icon: '📅' }
                    ].map((integration) => (
                      <div key={integration.key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          id={`integration-${integration.key}`}
                          checked={goals.integraciones_activas.includes(integration.key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGoals({
                                ...goals,
                                integraciones_activas: [...goals.integraciones_activas, integration.key]
                              });
                            } else {
                              setGoals({
                                ...goals,
                                integraciones_activas: goals.integraciones_activas.filter(i => i !== integration.key)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`integration-${integration.key}`} className="text-sm cursor-pointer flex-1 flex items-center gap-2">
                          <span>{integration.icon}</span>
                          <span>{integration.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>KPIs Personalizados (Opcional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Puedes configurar KPIs personalizados más adelante en Configuración
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm text-amber-700">
                      💡 Los KPIs que configuraste en los pasos anteriores serán tus metas principales.
                      Podrás ajustarlas y agregar métricas personalizadas en cualquier momento desde tu dashboard.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Resumen de Configuración
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ventas/mes</p>
                      <p className="font-medium">{goals.ventas_mes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ingresos objetivo</p>
                      <p className="font-medium">${goals.ingresos_objetivo.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Base de contactos</p>
                      <p className="font-medium">{goals.contactos_base_datos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nivel expertise</p>
                      <p className="font-medium">{goals.nivel_expertise}/5</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Integraciones</p>
                      <p className="font-medium">{goals.integraciones_activas.length} seleccionadas</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Áreas a mejorar</p>
                      <p className="font-medium">{goals.necesidades_diarias.length} seleccionadas</p>
                    </div>
                  </div>
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
                Comenzar
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

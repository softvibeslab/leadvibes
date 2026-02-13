import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, User, Target, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { api, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState({
    ventas_mes: 5,
    ingresos_objetivo: 500000,
    leads_contactados: 50,
    tasa_conversion: 10,
    apartados_mes: 10,
    periodo: 'mensual',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const handleSaveGoals = async () => {
    setLoading(true);
    try {
      await api.post('/goals', goals);
      toast.success('Metas actualizadas');
    } catch (error) {
      toast.error('Error al guardar metas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Outfit']">Configuración</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Tu información de cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={user?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Input value={user?.role || ''} disabled className="capitalize" />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-accent" />}
              </div>
              <div>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>Personaliza el tema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo Oscuro</p>
                <p className="text-sm text-muted-foreground">
                  Cambia entre tema claro y oscuro
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                data-testid="theme-switch"
              />
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle>Metas y KPIs</CardTitle>
                <CardDescription>Define tus objetivos mensuales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ventas por mes</Label>
                <Input
                  type="number"
                  value={goals.ventas_mes}
                  onChange={(e) => setGoals({ ...goals, ventas_mes: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Apartados por mes</Label>
                <Input
                  type="number"
                  value={goals.apartados_mes}
                  onChange={(e) => setGoals({ ...goals, apartados_mes: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Leads a contactar</Label>
                <Input
                  type="number"
                  value={goals.leads_contactados}
                  onChange={(e) => setGoals({ ...goals, leads_contactados: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ingresos objetivo (MXN)</Label>
                <Input
                  type="number"
                  value={goals.ingresos_objetivo}
                  onChange={(e) => setGoals({ ...goals, ingresos_objetivo: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={50000}
                />
              </div>
              <div className="space-y-2">
                <Label>Tasa de conversión objetivo (%)</Label>
                <Input
                  type="number"
                  value={goals.tasa_conversion}
                  onChange={(e) => setGoals({ ...goals, tasa_conversion: parseFloat(e.target.value) || 0 })}
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <Separator />
            <Button onClick={handleSaveGoals} disabled={loading} className="rounded-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Metas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

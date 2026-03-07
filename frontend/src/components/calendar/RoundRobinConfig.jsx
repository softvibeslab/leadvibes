import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, RefreshCw, Settings, Check, X, Loader2, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

export const RoundRobinConfig = ({ isOpen, onClose, brokers }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    is_active: true,
    active_brokers: [],
    reset_frequency: 'daily'
  });

  useEffect(() => {
    if (isOpen) loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await api.get('/calendar/round-robin/config');
      setConfig({
        is_active: res.data.is_active ?? true,
        active_brokers: res.data.active_brokers ?? [],
        reset_frequency: res.data.reset_frequency ?? 'daily'
      });
    } catch (error) {
      console.error('Error loading Round Robin config:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/calendar/round-robin/config', config);
      toast.success('Configuración de Round Robin actualizada');
      onClose();
    } catch (error) {
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCounts = async () => {
    setLoading(true);
    try {
      await api.put('/calendar/round-robin/config', { ...config, reset_counts: true });
      toast.success('Contadores reiniciados');
      loadConfig();
    } catch (error) {
      toast.error('Error al reiniciar contadores');
    } finally {
      setLoading(false);
    }
  };

  const toggleBroker = (brokerId) => {
    setConfig(prev => ({
      ...prev,
      active_brokers: prev.active_brokers.includes(brokerId)
        ? prev.active_brokers.filter(id => id !== brokerId)
        : [...prev.active_brokers, brokerId]
    }));
  };

  const assignmentCounts = { 'Broker A': 5, 'Broker B': 3, 'Broker C': 7 }; // Mock data

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Configuración de Round Robin
          </DialogTitle>
          <DialogDescription>
            Configura la rotación automática de asignaciones a brokers
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Info Card */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Round Robin asigna automáticamente leads y eventos a los brokers de forma rotativa.
                Los brokers con menos asignaciones tienen prioridad.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label>Activar Round Robin</Label>
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
            </div>

            {/* Brokers Selection */}
            <div className="space-y-2">
              <Label>Brokers Participantes</Label>
              <div className="space-y-2">
                {brokers.map((broker) => {
                  const isActive = config.active_brokers.includes(broker.id);
                  const count = assignmentCounts[broker.name] || 0;

                  return (
                    <div
                      key={broker.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isActive ? 'bg-primary/5 border-primary/30' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{broker.name}</p>
                          <p className="text-xs text-muted-foreground">{broker.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">
                            {count} asignaciones
                          </Badge>
                        )}
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleBroker(broker.id)}
                        />
                      </div>
                    </div>
                  );
                })}
                {brokers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay brokers disponibles
                  </p>
                )}
              </div>
            </div>

            {/* Reset Frequency */}
            <div className="space-y-2">
              <Label>Frecuencia de Reinicio</Label>
              <Select
                value={config.reset_frequency}
                onValueChange={(value) => setConfig({ ...config, reset_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Los contadores de asignación se reinician según esta frecuencia para mantener el equilibrio.
              </p>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCounts}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reiniciar Contadores
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AssignmentSelector = ({ brokers, onAssign, api, eventId }) => {
  const [loading, setLoading] = useState(false);
  const [assignmentType, setAssignmentType] = useState('manual');
  const [selectedBroker, setSelectedBroker] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const res = await api.post('/calendar/assign', {
        event_id: eventId,
        assignment_type: assignmentType,
        assigned_to: assignmentType === 'manual' ? selectedBroker : undefined
      });

      toast.success(`Asignado a ${res.data.broker?.name || 'broker'}`);
      onAssign(res.data);
    } catch (error) {
      toast.error('Error al asignar evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type Selection */}
      <div className="space-y-2">
        <Label>Tipo de Asignación</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={assignmentType === 'manual' ? 'default' : 'outline'}
            onClick={() => setAssignmentType('manual')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Manual
          </Button>
          <Button
            type="button"
            variant={assignmentType === 'round_robin' ? 'default' : 'outline'}
            onClick={() => setAssignmentType('round_robin')}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Round Robin
          </Button>
        </div>
      </div>

      {/* Manual Assignment */}
      {assignmentType === 'manual' && (
        <div className="space-y-2">
          <Label>Seleccionar Broker</Label>
          <Select value={selectedBroker} onValueChange={setSelectedBroker}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un broker" />
            </SelectTrigger>
            <SelectContent>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.id}>
                  {broker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Round Robin Info */}
      {assignmentType === 'round_robin' && (
        <div className="space-y-2">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 mb-1">
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Round Robin</span>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Se asignará automáticamente al siguiente broker en la rotación.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(true)}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Round Robin
          </Button>
        </div>
      )}

      {/* Assign Button */}
      <Button
        onClick={handleAssign}
        disabled={loading || (assignmentType === 'manual' && !selectedBroker)}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        Asignar
      </Button>

      {/* Round Robin Config Modal */}
      {showConfig && (
        <RoundRobinConfig
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          brokers={brokers}
        />
      )}
    </div>
  );
};

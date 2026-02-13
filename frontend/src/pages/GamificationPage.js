import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Crown, Medal, Edit, Plus, Loader2, Star, Phone, MessageCircle, Mail, Video, MapPin, Bookmark, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { toast } from 'sonner';

const iconMap = {
  phone: Phone,
  'message-circle': MessageCircle,
  mail: Mail,
  video: Video,
  'map-pin': MapPin,
  bookmark: Bookmark,
  trophy: Trophy,
  users: Users,
  star: Star,
};

const LeaderboardItem = ({ broker, rank }) => {
  const getMedalStyle = () => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', icon: 'text-yellow-500', ring: 'ring-yellow-400/50' };
    if (rank === 2) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-500', icon: 'text-gray-400', ring: 'ring-gray-400/50' };
    if (rank === 3) return { bg: 'bg-gradient-to-r from-orange-400 to-orange-600', icon: 'text-orange-400', ring: 'ring-orange-400/50' };
    return { bg: 'bg-muted', icon: 'text-muted-foreground', ring: '' };
  };

  const style = getMedalStyle();

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${rank <= 3 ? 'bg-muted/50 ring-2 ' + style.ring : 'hover:bg-muted/30'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rank <= 3 ? style.bg : 'bg-muted'}`}>
        {rank <= 3 ? (
          <Crown className={`w-5 h-5 ${rank <= 3 ? 'text-white' : style.icon}`} />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{rank}</span>
        )}
      </div>
      <Avatar className="w-12 h-12 ring-2 ring-background">
        <AvatarImage src={broker.avatar_url} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
          {broker.broker_name?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{broker.broker_name}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{broker.ventas} ventas</span>
          <span>•</span>
          <span>{broker.apartados} apartados</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-primary">{broker.total_points}</p>
        <p className="text-xs text-muted-foreground">puntos</p>
      </div>
    </div>
  );
};

const RuleCard = ({ rule, onEdit }) => {
  const Icon = iconMap[rule.icon] || Trophy;

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-semibold capitalize">{rule.action}</p>
          <p className="text-sm text-muted-foreground">{rule.description}</p>
        </div>
        <Badge className="bg-primary text-primary-foreground text-lg px-4 py-1">
          +{rule.points}
        </Badge>
        <Button variant="ghost" size="icon" onClick={() => onEdit(rule)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

const RuleModal = ({ rule, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    action: '',
    points: 1,
    description: '',
    icon: 'star',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule) {
      setForm({
        action: rule.action,
        points: rule.points,
        description: rule.description,
        icon: rule.icon || 'star',
      });
    } else {
      setForm({
        action: '',
        points: 1,
        description: '',
        icon: 'star',
      });
    }
  }, [rule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      toast.error('Error al guardar regla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? 'Editar Regla' : 'Nueva Regla'}</DialogTitle>
          <DialogDescription>Define los puntos para cada acción</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Acción</Label>
            <Input
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value })}
              placeholder="Ej: llamada, visita, venta"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Puntos</Label>
              <Input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ícono</Label>
              <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="message-circle">Mensaje</SelectItem>
                  <SelectItem value="mail">Email</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="map-pin">Ubicación</SelectItem>
                  <SelectItem value="bookmark">Apartado</SelectItem>
                  <SelectItem value="trophy">Trofeo</SelectItem>
                  <SelectItem value="users">Usuarios</SelectItem>
                  <SelectItem value="star">Estrella</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción de la regla"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const GamificationPage = () => {
  const { api } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [rules, setRules] = useState([]);
  const [pointLedger, setPointLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRule, setEditRule] = useState(null);
  const [showRuleModal, setShowRuleModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leaderRes, rulesRes, pointsRes] = await Promise.all([
        api.get('/dashboard/leaderboard'),
        api.get('/gamification/rules'),
        api.get('/gamification/points?limit=50'),
      ]);
      setLeaderboard(leaderRes.data);
      setRules(rulesRes.data);
      setPointLedger(pointsRes.data);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (formData) => {
    await api.post('/gamification/rules', formData);
    toast.success('Regla guardada');
    loadData();
  };

  const totalPointsThisMonth = pointLedger.reduce((acc, p) => acc + p.points, 0);

  return (
    <div className="p-8 space-y-6" data-testid="gamification-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Gamificación</h1>
          <p className="text-muted-foreground">Sistema de puntos y rankings</p>
        </div>
        <Button onClick={() => { setEditRule(null); setShowRuleModal(true); }} className="rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Nueva Regla
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <Card className="lg:row-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Leaderboard Mensual</CardTitle>
                  <CardDescription>Top performers por puntos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {leaderboard.map((broker, idx) => (
                    <LeaderboardItem key={broker.broker_id} broker={broker} rank={idx + 1} />
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay datos de leaderboard
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Reglas de Puntuación</CardTitle>
                  <CardDescription>Puntos por cada acción</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      onEdit={(r) => { setEditRule(r); setShowRuleModal(true); }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Points */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Puntos Recientes</CardTitle>
                    <CardDescription>Últimas acciones registradas</CardDescription>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary">
                  {totalPointsThisMonth} pts totales
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {pointLedger.slice(0, 15).map((point) => (
                    <div key={point.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize text-xs">
                          {point.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {point.description}
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500">
                        +{point.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rule Modal */}
      <RuleModal
        rule={editRule}
        isOpen={showRuleModal}
        onClose={() => { setShowRuleModal(false); setEditRule(null); }}
        onSave={handleSaveRule}
      />
    </div>
  );
};

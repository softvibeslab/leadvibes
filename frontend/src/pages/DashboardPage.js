import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, TrendingUp, Users, Bookmark, ShoppingCart, Activity,
  Crown, Medal, Phone, Video, MessageCircle, Mail, MapPin, Loader2,
  X, Calendar, DollarSign, Target, Star, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const activityIcons = {
  llamada: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  zoom: Video,
  visita: MapPin,
  apartado: Bookmark,
  venta: ShoppingCart,
  nota: Activity,
};

// Clickable Stat Card
const StatCard = ({ title, value, goal, icon: Icon, color, progress, onClick, clickable = true }) => (
  <Card 
    className={`relative overflow-hidden group hover:shadow-lg transition-all ${clickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    onClick={clickable ? onClick : undefined}
  >
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-bold font-['Outfit']">{value}</h3>
            {goal && (
              <span className="text-xs sm:text-sm text-muted-foreground">/ {goal}</span>
            )}
          </div>
          {progress !== undefined && (
            <Progress value={Math.min(progress, 100)} className="h-1.5 w-full sm:w-24" />
          )}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
      {progress !== undefined && (
        <p className={`text-xs mt-2 ${progress >= 100 ? 'text-primary' : 'text-muted-foreground'}`}>
          {progress >= 100 ? '¡Meta alcanzada!' : `${Math.round(progress)}% completado`}
        </p>
      )}
      {clickable && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </CardContent>
  </Card>
);

// KPI Detail Modal
const KPIDetailModal = ({ isOpen, onClose, type, data, stats }) => {
  if (!type) return null;

  const getModalContent = () => {
    switch (type) {
      case 'puntos':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{stats?.total_points || 0}</p>
                  <p className="text-xs text-muted-foreground">Puntos Totales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{stats?.points_goal || 350}</p>
                  <p className="text-xs text-muted-foreground">Meta Mensual</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Desglose de Puntos
              </h4>
              <div className="space-y-2">
                {data?.points_breakdown?.length > 0 ? (
                  data.points_breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${item.color || 'bg-primary'} flex items-center justify-center`}>
                          {React.createElement(activityIcons[item.type] || Activity, { className: "w-4 h-4 text-white" })}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{item.type}</p>
                          <p className="text-xs text-muted-foreground">{item.count} acciones</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-bold">+{item.points} pts</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay datos de puntos este mes</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'apartados':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-secondary">{stats?.apartados || 0}</p>
                  <p className="text-xs text-muted-foreground">Apartados Este Mes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{stats?.apartados_goal || 10}</p>
                  <p className="text-xs text-muted-foreground">Meta Mensual</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-secondary" />
                Apartados Recientes
              </h4>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {data?.apartados_list?.length > 0 ? (
                    data.apartados_list.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-secondary/20 text-secondary">
                              {item.lead_name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{item.lead_name}</p>
                            <p className="text-xs text-muted-foreground">{item.property || 'Propiedad'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-secondary">${item.amount?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.date ? format(new Date(item.date), "d MMM", { locale: es }) : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay apartados este mes</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        );

      case 'ventas':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{stats?.ventas || 0}</p>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{stats?.ventas_goal || 5}</p>
                  <p className="text-xs text-muted-foreground">Meta</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-lg font-bold text-green-500">${(data?.ventas_total || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total MXN</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-accent" />
                Ventas Cerradas
              </h4>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {data?.ventas_list?.length > 0 ? (
                    data.ventas_list.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.lead_name}</p>
                            <p className="text-xs text-muted-foreground">{item.property || 'Propiedad'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-500">${item.amount?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.date ? format(new Date(item.date), "d MMM yyyy", { locale: es }) : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay ventas cerradas este mes</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        );

      case 'brokers':
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-500">{stats?.brokers_activos || 0}</p>
                <p className="text-xs text-muted-foreground">Brokers Activos</p>
              </CardContent>
            </Card>
            
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Rendimiento del Equipo
              </h4>
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {data?.brokers_list?.length > 0 ? (
                    data.brokers_list.map((broker, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={broker.avatar} />
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-500">
                              {broker.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{broker.name}</p>
                            <p className="text-xs text-muted-foreground">{broker.leads_count || 0} leads activos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-primary text-white">{broker.points || 0} pts</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{broker.ventas || 0} ventas</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay datos de brokers</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        );

      default:
        return <p>Sin datos disponibles</p>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'puntos': return 'Desglose de Puntos';
      case 'apartados': return 'Detalle de Apartados';
      case 'ventas': return 'Detalle de Ventas';
      case 'brokers': return 'Equipo de Brokers';
      default: return 'Detalle';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'puntos': return 'Resumen de puntos ganados este mes';
      case 'apartados': return 'Propiedades apartadas este mes';
      case 'ventas': return 'Ventas cerradas y comisiones';
      case 'brokers': return 'Rendimiento del equipo';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'puntos' && <Trophy className="w-5 h-5 text-primary" />}
            {type === 'apartados' && <Bookmark className="w-5 h-5 text-secondary" />}
            {type === 'ventas' && <ShoppingCart className="w-5 h-5 text-accent" />}
            {type === 'brokers' && <Users className="w-5 h-5 text-emerald-500" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        {getModalContent()}
      </DialogContent>
    </Dialog>
  );
};

const LeaderboardItem = ({ broker, rank }) => {
  const getMedalColor = () => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  const getMedalIcon = () => {
    if (rank <= 3) return Crown;
    return Medal;
  };

  const MedalIcon = getMedalIcon();

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
      rank <= 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getMedalColor()}`}>
        {rank <= 3 ? (
          <MedalIcon className="w-5 h-5" />
        ) : (
          <span className="text-sm font-medium">{rank}</span>
        )}
      </div>
      <Avatar className="w-10 h-10">
        <AvatarImage src={broker.avatar_url} />
        <AvatarFallback className="bg-primary/20 text-primary">
          {broker.broker_name?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{broker.broker_name}</p>
        <p className="text-xs text-muted-foreground">{broker.ventas} ventas</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">{broker.total_points}</p>
        <p className="text-xs text-muted-foreground">puntos</p>
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const Icon = activityIcons[activity.activity_type] || Activity;
  
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.broker_name}</span>
          {' '}{activity.activity_type === 'llamada' && 'llamó a'}
          {activity.activity_type === 'whatsapp' && 'envió WhatsApp a'}
          {activity.activity_type === 'email' && 'envió email a'}
          {activity.activity_type === 'zoom' && 'presentó por Zoom a'}
          {activity.activity_type === 'visita' && 'visitó con'}
          {activity.activity_type === 'apartado' && 'apartó con'}
          {activity.activity_type === 'venta' && 'cerró venta con'}{' '}
          <span className="font-medium">{activity.lead_name}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activity.outcome || activity.description}
        </p>
      </div>
      {activity.points_earned > 0 && (
        <Badge variant="secondary" className="flex-shrink-0">
          +{activity.points_earned} pts
        </Badge>
      )}
    </div>
  );
};

const GamificationRule = ({ rule }) => {
  const icons = {
    phone: Phone,
    'message-circle': MessageCircle,
    mail: Mail,
    video: Video,
    'map-pin': MapPin,
    bookmark: Bookmark,
    trophy: Trophy,
    users: Users,
    star: Trophy,
  };
  const Icon = icons[rule.icon] || Trophy;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium capitalize">{rule.action}</p>
        <p className="text-xs text-muted-foreground">{rule.description}</p>
      </div>
      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
        +{rule.points} pts
      </Badge>
    </div>
  );
};

export const DashboardPage = () => {
  const { api, isIndividual } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // KPI Modal state
  const [kpiModal, setKpiModal] = useState({ open: false, type: null, data: null });
  const [loadingKpi, setLoadingKpi] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const requests = [
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity?limit=10'),
        api.get('/gamification/rules'),
      ];
      
      // Only load leaderboard for agency users
      if (!isIndividual) {
        requests.push(api.get('/dashboard/leaderboard'));
      }
      
      const results = await Promise.all(requests);
      setStats(results[0].data);
      setActivities(results[1].data);
      setRules(results[2].data);
      if (!isIndividual && results[3]) {
        setLeaderboard(results[3].data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiClick = async (type) => {
    setLoadingKpi(true);
    try {
      const res = await api.get(`/dashboard/kpi-detail/${type}`);
      setKpiModal({ open: true, type, data: res.data });
    } catch (error) {
      console.error('Error loading KPI detail:', error);
      // Show modal with empty data if endpoint doesn't exist yet
      setKpiModal({ open: true, type, data: {} });
    } finally {
      setLoadingKpi(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-16 sm:h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit']">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Tu resumen de rendimiento • Click en las tarjetas para ver detalles</p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isIndividual ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-4 lg:gap-6`}>
        <StatCard
          title="Puntos del Mes"
          value={stats?.total_points || 0}
          goal={stats?.points_goal}
          icon={Trophy}
          color="bg-primary"
          progress={stats?.points_progress}
          onClick={() => handleKpiClick('puntos')}
        />
        <StatCard
          title="Apartados"
          value={stats?.apartados || 0}
          goal={stats?.apartados_goal}
          icon={Bookmark}
          color="bg-secondary"
          progress={(stats?.apartados / stats?.apartados_goal) * 100}
          onClick={() => handleKpiClick('apartados')}
        />
        <StatCard
          title="Ventas Cerradas"
          value={stats?.ventas || 0}
          goal={stats?.ventas_goal}
          icon={ShoppingCart}
          color="bg-accent"
          progress={(stats?.ventas / stats?.ventas_goal) * 100}
          onClick={() => handleKpiClick('ventas')}
        />
        {!isIndividual && (
          <StatCard
            title="Brokers Activos"
            value={stats?.brokers_activos || 0}
            icon={Users}
            color="bg-emerald-600"
            onClick={() => handleKpiClick('brokers')}
          />
        )}
      </div>

      {/* Main Content */}
      <div className={`grid grid-cols-1 ${isIndividual ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
        {/* Leaderboard - Only for Agency */}
        {!isIndividual && (
          <Card className="lg:col-span-1">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                Leaderboard Mensual
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Top brokers por puntos</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <ScrollArea className="h-[280px] sm:h-[320px] pr-4">
                <div className="space-y-2">
                  {leaderboard.map((broker, idx) => (
                    <LeaderboardItem key={broker.broker_id} broker={broker} rank={idx + 1} />
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No hay datos de leaderboard
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isIndividual ? 'Tus últimas acciones' : 'Últimas acciones del equipo'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <ScrollArea className="h-[280px] sm:h-[320px] pr-4">
              <div className="divide-y divide-border">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
                {activities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Gamification Rules */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              Sistema de Puntos
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gana puntos por cada acción</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <ScrollArea className="h-[280px] sm:h-[320px] pr-4">
              <div className="space-y-1">
                {rules.map((rule) => (
                  <GamificationRule key={rule.id} rule={rule} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate & Goals Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Tasa de Conversión</CardTitle>
            <CardDescription>Leads que se convierten en ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="8"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-primary stroke-current"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${(stats?.conversion_rate || 0) * 3.52} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{stats?.conversion_rate || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Leads</CardTitle>
            <CardDescription>Estado actual del pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Leads Nuevos</span>
                <Badge variant="outline">{stats?.leads_nuevos || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">En Proceso</span>
                <Badge variant="outline">{(stats?.apartados || 0) + (stats?.leads_nuevos || 0)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ventas Cerradas</span>
                <Badge className="bg-primary">{stats?.ventas || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Detail Modal */}
      <KPIDetailModal
        isOpen={kpiModal.open}
        onClose={() => setKpiModal({ open: false, type: null, data: null })}
        type={kpiModal.type}
        data={kpiModal.data}
        stats={stats}
      />
    </div>
  );
};

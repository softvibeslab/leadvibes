import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, TrendingUp, Users, Bookmark, ShoppingCart, Activity,
  Crown, Medal, Phone, Video, MessageCircle, Mail, MapPin, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';

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

const StatCard = ({ title, value, goal, icon: Icon, color, progress }) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
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
    </CardContent>
  </Card>
);

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

  if (loading) {
    return (
      <div className="p-8 space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Outfit']">Dashboard</h1>
        <p className="text-muted-foreground">Tu resumen de rendimiento</p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isIndividual ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6`}>
        <StatCard
          title="Puntos del Mes"
          value={stats?.total_points || 0}
          goal={stats?.points_goal}
          icon={Trophy}
          color="bg-primary"
          progress={stats?.points_progress}
        />
        <StatCard
          title="Apartados"
          value={stats?.apartados || 0}
          goal={stats?.apartados_goal}
          icon={Bookmark}
          color="bg-secondary"
          progress={(stats?.apartados / stats?.apartados_goal) * 100}
        />
        <StatCard
          title="Ventas Cerradas"
          value={stats?.ventas || 0}
          goal={stats?.ventas_goal}
          icon={ShoppingCart}
          color="bg-accent"
          progress={(stats?.ventas / stats?.ventas_goal) * 100}
        />
        {!isIndividual && (
          <StatCard
            title="Brokers Activos"
            value={stats?.brokers_activos || 0}
            icon={Users}
            color="bg-emerald-600"
          />
        )}
      </div>

      {/* Main Content */}
      <div className={`grid grid-cols-1 ${isIndividual ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        {/* Leaderboard - Only for Agency */}
        {!isIndividual && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Leaderboard Mensual
              </CardTitle>
              <CardDescription>Top brokers por puntos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-2">
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
        )}

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              {isIndividual ? 'Tus últimas acciones' : 'Últimas acciones del equipo'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="divide-y divide-border">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
                {activities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Gamification Rules */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Sistema de Puntos
            </CardTitle>
            <CardDescription>Gana puntos por cada acción</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
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
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users, Phone, Video, ShoppingCart, Bookmark, Trophy, TrendingUp,
  Mail, MapPin, Star, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const BrokerCard = ({ broker, onClick, rank }) => {
  const getMedalColor = () => {
    if (rank === 1) return 'text-yellow-500 bg-yellow-500/10';
    if (rank === 2) return 'text-gray-400 bg-gray-400/10';
    if (rank === 3) return 'text-orange-400 bg-orange-400/10';
    return 'text-muted-foreground bg-muted/50';
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
      onClick={() => onClick(broker)}
      data-testid={`broker-card-${broker.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={broker.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {broker.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {rank <= 3 && (
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getMedalColor()} flex items-center justify-center`}>
                <Trophy className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
              {broker.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{broker.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={broker.is_active ? 'default' : 'secondary'} className="text-xs">
                {broker.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">{broker.role}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{broker.total_points || 0}</p>
            <p className="text-xs text-muted-foreground">Puntos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{broker.leads_asignados || 0}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{rank || '-'}</p>
            <p className="text-xs text-muted-foreground">Ranking</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BrokerDetailModal = ({ broker, isOpen, onClose, stats }) => {
  if (!broker) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={broker.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {broker.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{broker.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> {broker.email}
                {broker.phone && (
                  <>
                    <span className="mx-1">•</span>
                    <Phone className="w-3 h-3" /> {broker.phone}
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats?.total_points || 0}</p>
                <p className="text-xs text-muted-foreground">Puntos Totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold">{stats?.ventas || 0}</p>
                <p className="text-xs text-muted-foreground">Ventas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Bookmark className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">{stats?.apartados || 0}</p>
                <p className="text-xs text-muted-foreground">Apartados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
                <p className="text-2xl font-bold">{stats?.leads_total || 0}</p>
                <p className="text-xs text-muted-foreground">Leads Totales</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Desglose de Actividades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Llamadas</span>
                </div>
                <Badge variant="secondary">{stats?.llamadas || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Presentaciones Zoom</span>
                </div>
                <Badge variant="secondary">{stats?.zooms || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Visitas</span>
                </div>
                <Badge variant="secondary">{stats?.visitas || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Conversión de leads</span>
                    <span className="font-medium">
                      {stats?.leads_total > 0
                        ? Math.round((stats?.ventas / stats?.leads_total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={
                      stats?.leads_total > 0
                        ? (stats?.ventas / stats?.leads_total) * 100
                        : 0
                    }
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Meta de puntos mensual</span>
                    <span className="font-medium">{Math.min(100, Math.round((stats?.total_points / 100) * 100))}%</span>
                  </div>
                  <Progress value={Math.min(100, (stats?.total_points / 100) * 100)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const BrokersPage = () => {
  const { api } = useAuth();
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [brokerStats, setBrokerStats] = useState(null);

  useEffect(() => {
    loadBrokers();
  }, []);

  const loadBrokers = async () => {
    try {
      const res = await api.get('/brokers');
      // Sort by points
      const sorted = res.data.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      setBrokers(sorted);
    } catch (error) {
      console.error('Error loading brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrokerClick = async (broker) => {
    setSelectedBroker(broker);
    try {
      const res = await api.get(`/brokers/${broker.id}`);
      setBrokerStats(res.data.stats);
    } catch (error) {
      console.error('Error loading broker stats:', error);
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="brokers-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-['Outfit']">Equipo de Ventas</h1>
        <p className="text-muted-foreground">{brokers.length} brokers en el sistema</p>
      </div>

      {/* Brokers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brokers.map((broker, idx) => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              onClick={handleBrokerClick}
              rank={idx + 1}
            />
          ))}
          {brokers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay brokers registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Broker Detail Modal */}
      <BrokerDetailModal
        broker={selectedBroker}
        isOpen={!!selectedBroker}
        onClose={() => {
          setSelectedBroker(null);
          setBrokerStats(null);
        }}
        stats={brokerStats}
      />
    </div>
  );
};

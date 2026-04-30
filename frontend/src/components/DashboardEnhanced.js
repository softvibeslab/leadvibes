/**
 * DashboardEnhanced Components - ROVI CRM
 * Componentes para el dashboard mejorado de Semana 2
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import {
  TrendingUp, TrendingDown, Minus,
  Users, ShoppingCart, Bookmark,
  BarChart3, PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Gráfico de ventas por mes (barras horizontales)
 */
export const TrendsChart = ({ data = [], months = 6, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ventas Últimos {months} Meses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ventas Últimos {months} Meses</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos suficientes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxVentas = Math.max(...data.map(d => d.ventas || 0), 1);
  const maxMonto = Math.max(...data.map(d => d.monto || 0), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Ventas Últimos {months} Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {data.map((item, idx) => {
            const ventas = item.ventas || 0;
            const monto = item.monto || 0;
            const ventasPercentage = (ventas / maxVentas) * 100;
            const montoFormateado = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              minimumFractionDigits: 0
            }).format(monto);

            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.mes}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{ventas} ventas</span>
                    <span className="text-xs text-muted-foreground">({montoFormateado})</span>
                  </div>
                </div>
                <Progress value={ventasPercentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Funnel de conversión con rates
 */
export const ConversionFunnel = ({ data = {}, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline de Conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { key: 'nuevo', label: 'Nuevos', color: 'bg-blue-500', description: 'Leads nuevos' },
    { key: 'contactado', label: 'Contactados', color: 'bg-green-500', description: 'Contacto inicial' },
    { key: 'calificacion', label: 'Calificación', color: 'bg-yellow-500', description: 'En evaluación' },
    { key: 'presentacion', label: 'Presentación', color: 'bg-orange-500', description: 'Propiedades mostradas' },
    { key: 'apartado', label: 'Apartados', color: 'bg-purple-500', description: 'Depósito pagado' },
    { key: 'venta', label: 'Ventas', color: 'bg-red-500', description: 'Cierre exitoso' }
  ];

  const maxValue = Math.max(...stages.map(s => data[s.key] || 0), 1);

  // Calcular tasa de conversión global
  const primeros = data['nuevo'] || 0;
  const ultimos = data['venta'] || 0;
  const conversionGlobal = primeros > 0 ? ((ultimos / primeros) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Pipeline de Conversión
          </div>
          <Badge variant="outline" className="text-xs">
            {conversionGlobal}% conversión global
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const value = data[stage.key] || 0;
            const percentage = (value / maxValue) * 100;
            const prevStage = stages[idx - 1];
            const prevValue = prevStage ? (data[prevStage.key] || 0) : value;
            const conversionRate = prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : 100;

            return (
              <div key={stage.key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{value}</span>
                    {idx > 0 && (
                      <Badge
                        variant={conversionRate >= 20 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {conversionRate}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="relative h-6 bg-muted rounded overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {idx === stages.length - 1 && value > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stage.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Leads por fuente (pie chart simplificado)
 */
export const LeadsBySource = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads por Fuente</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads por Fuente</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

  // Ordenar por count descendente
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Top 5 fuentes
  const topSources = sortedData.slice(0, 5);
  const otros = sortedData.slice(5).reduce((sum, item) => sum + item.count, 0);

  if (otros > 0) {
    topSources.push({ fuente: 'Otros', count: otros });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Leads por Fuente
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {topSources.map((item, idx) => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            const colors = [
              'bg-blue-500', 'bg-green-500', 'bg-purple-500',
              'bg-orange-500', 'bg-pink-500', 'bg-gray-500'
            ];

            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}
                    />
                    <span className="text-sm font-medium truncate">{item.fuente}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{item.count}</span>
                    <Badge variant="outline" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={parseFloat(percentage)} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Card de comparativa mes actual vs anterior
 */
export const ComparisonCard = ({ data = {}, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativa Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.mes_actual) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Este Mes vs Mes Anterior</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { key: 'ventas', label: 'Ventas', icon: ShoppingCart, color: 'text-green-600' },
    { key: 'apartados', label: 'Apartados', icon: Bookmark, color: 'text-blue-600' },
    { key: 'leads_nuevos', label: 'Leads Nuevos', icon: Users, color: 'text-purple-600' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Este Mes vs Mes Anterior</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, idx) => {
          const actual = data.mes_actual?.[metric.key] || 0;
          const anterior = data.mes_anterior?.[metric.key] || 0;
          const cambio = data.cambio_porcentual?.[metric.key] || '0%';
          const esPositivo = cambio.startsWith('+');
          const Icon = metric.icon;

          return (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${esPositivo ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {anterior} → {actual}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={esPositivo ? "default" : "destructive"}
                  className="mb-1"
                >
                  {cambio}
                </Badge>
                <div className="flex items-center justify-end">
                  {esPositivo ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : cambio === '0%' ? (
                    <Minus className="w-4 h-4 text-gray-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

/**
 * Top Brokers List
 */
export const TopBrokersList = ({ metric = 'ventas', limit = 5, data = [], loading = false }) => {
  const { api } = useAuth();
  const [topBrokers, setTopBrokers] = useState(data);
  const [loadingData, setLoadingData] = useState(loading);

  useEffect(() => {
    if (!data || data.length === 0) {
      fetchTopBrokers();
    }
  }, [metric, limit]);

  const fetchTopBrokers = async () => {
    setLoadingData(true);
    try {
      const response = await api.get(`/dashboard/top-brokers?metric=${metric}&limit=${limit}`);
      setTopBrokers(response.data.top_brokers || []);
    } catch (error) {
      console.error('Error fetching top brokers:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top {metric}s</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!topBrokers || topBrokers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top {metric}s</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Top {metric}s
          </div>
          <Badge variant="outline">{limit} brokers</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topBrokers.map((broker, idx) => (
            <div
              key={broker.broker_id || idx}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{broker.broker_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {broker.metric_value} {metric}
                  </p>
                </div>
              </div>
              <Badge
                variant={idx === 0 ? "default" : idx === 1 ? "secondary" : "outline"}
                className="hidden sm:inline-flex"
              >
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

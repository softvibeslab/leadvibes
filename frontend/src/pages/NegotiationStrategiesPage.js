import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Handshake,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Star,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Shield,
  Zap,
  Building2,
  Users,
  Lightbulb,
  Download,
  FileText,
  Calculator
} from 'lucide-react';

const strategies = [
  {
    id: 1,
    name: 'Alianza Estratégica (Joint Venture)',
    icon: <Handshake className="w-6 h-6" />,
    investment: 10000,
    equity: '5%',
    revenueShare: '0%',
    resources: ['Desarrollo completo', 'Soporte continuo', 'Nuevas features'],
    roiMonths: '18-24',
    risk: 'Medio',
    riskScore: 3,
    riskColor: 'bg-yellow-500',
    pros: ['Mayor control del proyecto', 'Participación en utilidades', 'Influencia en roadmap'],
    cons: ['Requiere inversión moderada', 'ROI a más largo plazo', 'Responsabilidad compartida'],
    idealFor: ['Empresas con presupuesto moderado', 'Buscan control estratégico', 'Visión a largo plazo'],
    annualCost: 10000,
    equityValue: 5000, // 5% de $100k valoración estimada
    setupTime: '2-3 meses',
    monthlyMaintenance: 500,
  },
  {
    id: 2,
    name: 'Licenciamiento Modelo SaaS',
    icon: <Building2 className="w-6 h-6" />,
    investment: 5000,
    equity: '0%',
    revenueShare: '0%',
    resources: ['Setup inicial', 'Documentación', 'Soporte limitado'],
    roiMonths: '6-9',
    risk: 'Bajo',
    riskScore: 2,
    riskColor: 'bg-green-500',
    pros: ['Inversión mínima', 'Sin ceder equity', 'Implementación rápida'],
    cons: ['Menor control del producto', 'Dependencia de terceros', 'Soporte limitado'],
    idealFor: ['Startups con poco capital', 'Prueba de concepto rápido', 'Baja tolerancia al riesgo'],
    annualCost: 5000,
    equityValue: 0,
    setupTime: '2-4 semanas',
    monthlyMaintenance: 0,
  },
  {
    id: 3,
    name: 'Modelo Freemium + Enterprise',
    icon: <Zap className="w-6 h-6" />,
    investment: 20000,
    equity: '2%',
    revenueShare: '10%',
    resources: ['Marketing agresivo', 'Features enterprise', 'Soporte premium'],
    roiMonths: '12-18',
    risk: 'Alto',
    riskScore: 4,
    riskColor: 'bg-orange-500',
    pros: ['Alto potencial de crecimiento', 'Revenue share adicional', 'Modelo escalable'],
    cons: ['Inversión elevada', 'Ejecución compleja', 'Alta competencia'],
    idealFor: ['Empresas con capital', 'Buscan escala rápida', 'Modelo de negocio validado'],
    annualCost: 20000,
    equityValue: 2000,
    setupTime: '3-4 meses',
    monthlyMaintenance: 1500,
  },
  {
    id: 4,
    name: 'Buyout Completo',
    icon: <Building2 className="w-6 h-6" />,
    investment: 75000,
    equity: '100%',
    revenueShare: '0%',
    resources: ['Transición completa', 'IP transfer', 'Training equipo'],
    roiMonths: 'Inmediato',
    risk: 'Muy Alto',
    riskScore: 5,
    riskColor: 'bg-red-500',
    pros: ['Control total', 'IP exclusiva', 'Sin dependencias'],
    cons: ['Inversión muy alta', 'Integración compleja', 'Retención de talento'],
    idealFor: ['Grandes empresas', 'Consolidación de mercado', 'Eliminación de competencia'],
    annualCost: 75000,
    equityValue: 100000,
    setupTime: '6-12 meses',
    monthlyMaintenance: 5000,
  },
  {
    id: 5,
    name: 'Partner Program (Revenue Share)',
    icon: <Users className="w-6 h-6" />,
    investment: 2000,
    equity: '0%',
    revenueShare: '0%',
    resources: ['Marketing compartido', 'Soporte básico', 'Comisiones'],
    roiMonths: '3-6',
    risk: 'Muy Bajo',
    riskScore: 1,
    riskColor: 'bg-emerald-500',
    pros: ['Inversión mínima', 'Sin riesgo de equity', 'Flexibilidad total'],
    cons: ['Menor margen', 'Sin control estratégico', 'Competencia directa'],
    idealFor: ['Prueba de mercado', 'Empresas individuales', 'Bajo presupuesto'],
    annualCost: 2000,
    equityValue: 0,
    setupTime: '1-2 semanas',
    monthlyMaintenance: 0,
  },
];

const riskLabels = {
  1: 'Muy Bajo',
  2: 'Bajo',
  3: 'Medio',
  4: 'Alto',
  5: 'Muy Alto',
};

const getRiskColor = (score) => {
  const colors = {
    1: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    2: 'text-green-600 bg-green-50 border-green-200',
    3: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    4: 'text-orange-600 bg-orange-50 border-orange-200',
    5: 'text-red-600 bg-red-50 border-red-200',
  };
  return colors[score];
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const calculateOverallScore = (strategy, weights) => {
  const normalizedInvestment = Math.max(0, 100 - (strategy.investment / 75000) * 100);
  const normalizedROI = Math.max(0, 100 - (parseInt(strategy.roiMonths.split('-')[1] || strategy.roiMonths) / 36) * 100);
  const normalizedRisk = Math.max(0, 100 - ((strategy.riskScore - 1) / 4) * 100);
  const normalizedEquity = Math.max(0, 100 - (parseFloat(strategy.equity) / 100) * 100);

  return (
    normalizedInvestment * weights.investment +
    normalizedROI * weights.roi +
    normalizedRisk * weights.risk +
    normalizedEquity * weights.equity
  );
};

export function NegotiationStrategiesPage() {
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [weights, setWeights] = useState({
    investment: 0.25,
    roi: 0.35,
    risk: 0.25,
    equity: 0.15,
  });
  const [activeView, setActiveView] = useState('overview');

  const toggleStrategy = (id) => {
    setSelectedStrategies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sortedByScore = [...strategies].sort((a, b) => {
    const scoreA = calculateOverallScore(a, weights);
    const scoreB = calculateOverallScore(b, weights);
    return scoreB - scoreA;
  });

  const sortedByROI = [...strategies].sort((a, b) => {
    const monthsA = parseInt(a.roiMonths.split('-')[0] || a.roiMonths);
    const monthsB = parseInt(b.roiMonths.split('-')[0] || b.roiMonths);
    return monthsA - monthsB;
  });

  const sortedByInvestment = [...strategies].sort((a, b) => a.investment - b.investment);

  const comparisonData = selectedStrategies.length >= 2
    ? strategies.filter((s) => selectedStrategies.includes(s.id))
    : [];

  const bestROI = sortedByROI[0];
  const lowestInvestment = sortedByInvestment[0];
  const lowestRisk = [...strategies].sort((a, b) => a.riskScore - b.riskScore)[0];
  const bestOverall = sortedByScore[0];

  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      weights,
      rankings: sortedByScore.map((s, i) => ({
        rank: i + 1,
        name: s.name,
        score: calculateOverallScore(s, weights).toFixed(2),
        investment: s.investment,
        roi: s.roiMonths,
        risk: s.risk,
      })),
      recommendations: {
        bestOverall: bestOverall.name,
        fastestROI: bestROI.name,
        lowestRisk: lowestRisk.name,
        lowestInvestment: lowestInvestment.name,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rovi-negotiation-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Handshake className="w-10 h-10 text-teal-600" />
              Estrategias de Negociación
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Análisis comparativo de estrategias para ROVI CRM
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Reporte
            </Button>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
              <FileText className="w-4 h-4" />
              Generar PDF
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                ROI Más Rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{bestROI.roiMonths}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{bestROI.name}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Menor Inversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${lowestInvestment.investment.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{lowestInvestment.name}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Menor Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{lowestRisk.risk}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{lowestRisk.name}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Mejor General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                {bestOverall.name.split(' ').slice(0, 2).join(' ')}...
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Score: {calculateOverallScore(bestOverall, weights).toFixed(0)}/100</div>
            </CardContent>
          </Card>
        </div>

        {/* Weight Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-600" />
              Calculadora de Pesos
            </CardTitle>
            <CardDescription>
              Ajusta la importancia de cada factor según tus prioridades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Inversión</label>
                  <span className="text-sm text-slate-600">{Math.round(weights.investment * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.investment * 100}
                  onChange={(e) => setWeights({ ...weights, investment: e.target.value / 100 })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">ROI</label>
                  <span className="text-sm text-slate-600">{Math.round(weights.roi * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.roi * 100}
                  onChange={(e) => setWeights({ ...weights, roi: e.target.value / 100 })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Riesgo</label>
                  <span className="text-sm text-slate-600">{Math.round(weights.risk * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.risk * 100}
                  onChange={(e) => setWeights({ ...weights, risk: e.target.value / 100 })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Equity</label>
                  <span className="text-sm text-slate-600">{Math.round(weights.equity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.equity * 100}
                  onChange={(e) => setWeights({ ...weights, equity: e.target.value / 100 })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="detailed">Detallado</TabsTrigger>
            <TabsTrigger value="comparison">Comparar</TabsTrigger>
            <TabsTrigger value="report">Informe</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy) => {
                const score = calculateOverallScore(strategy, weights);
                const isSelected = selectedStrategies.includes(strategy.id);

                return (
                  <Card
                    key={strategy.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-teal-500 shadow-lg' : ''
                    }`}
                    onClick={() => toggleStrategy(strategy.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400">
                            {strategy.icon}
                          </div>
                          <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Score</span>
                        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score.toFixed(0)}/100
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="text-slate-600 dark:text-slate-400">Inversión</span>
                          <span className="font-semibold">${strategy.investment.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-600 dark:text-slate-400">Equity</span>
                          <span className="font-semibold">{strategy.equity}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-600 dark:text-slate-400">ROI</span>
                          <span className="font-semibold">{strategy.roiMonths} meses</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-600 dark:text-slate-400">Riesgo</span>
                          <Badge className={getRiskColor(strategy.riskScore)}>
                            {strategy.risk}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Detailed Tab */}
          <TabsContent value="detailed" className="space-y-6">
            {sortedByScore.map((strategy, index) => {
              const score = calculateOverallScore(strategy, weights);

              return (
                <Card key={strategy.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{strategy.name}</h3>
                          <p className="text-white/80">Score: {score.toFixed(0)}/100</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">${strategy.investment.toLocaleString()}</div>
                        <div className="text-white/80">Inversión inicial</div>
                      </div>
                    </div>
                    <Progress value={score} className="mt-4 h-2 bg-white/30" />
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <DollarSign className="w-5 h-5 text-teal-600 mb-2" />
                        <div className="text-sm text-slate-600 dark:text-slate-400">Inversión</div>
                        <div className="text-xl font-bold">${strategy.investment.toLocaleString()}</div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                        <div className="text-sm text-slate-600 dark:text-slate-400">ROI esperado</div>
                        <div className="text-xl font-bold">{strategy.roiMonths} meses</div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <Building2 className="w-5 h-5 text-blue-600 mb-2" />
                        <div className="text-sm text-slate-600 dark:text-slate-400">Equity</div>
                        <div className="text-xl font-bold">{strategy.equity}</div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
                        <div className="text-sm text-slate-600 dark:text-slate-400">Nivel de Riesgo</div>
                        <Badge className={getRiskColor(strategy.riskScore)}>{strategy.risk}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Ventajas
                        </h4>
                        <ul className="space-y-2">
                          {strategy.pros.map((pro, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">•</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          Contras
                        </h4>
                        <ul className="space-y-2">
                          {strategy.cons.map((con, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                          <Target className="w-4 h-4" />
                          Ideal Para
                        </h4>
                        <ul className="space-y-2">
                          {strategy.idealFor.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        Recursos Incluidos
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {strategy.resources.map((resource, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        Setup: {strategy.setupTime}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <BarChart3 className="w-4 h-4" />
                        Mantenimiento mensual: ${strategy.monthlyMaintenance}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <PieChart className="w-4 h-4" />
                        Revenue Share: {strategy.revenueShare}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            {selectedStrategies.length < 2 ? (
              <Card className="p-12 text-center">
                <PieChart className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Selecciona estrategias para comparar</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Haz clic en al menos 2 estrategias en la vista de Resumen para compararlas
                </p>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Tabla Comparativa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Métrica</TableHead>
                            {comparisonData.map((s) => (
                              <TableHead key={s.id} className="text-center">
                                {s.name.split(' ').slice(0, 2).join(' ')}...
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Inversión</TableCell>
                            {comparisonData.map((s) => (
                              <TableCell key={s.id} className="text-center">
                                ${s.investment.toLocaleString()}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Equity</TableCell>
                            {comparisonData.map((s) => (
                              <TableCell key={s.id} className="text-center">
                                {s.equity}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">ROI</TableCell>
                            {comparisonData.map((s) => (
                              <TableCell key={s.id} className="text-center">
                                {s.roiMonths} meses
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Riesgo</TableCell>
                            {comparisonData.map((s) => (
                              <TableCell key={s.id} className="text-center">
                                <Badge className={getRiskColor(s.riskScore)}>{s.risk}</Badge>
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Score</TableCell>
                            {comparisonData.map((s) => (
                              <TableCell key={s.id} className="text-center font-bold">
                                {calculateOverallScore(s, weights).toFixed(0)}/100
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {comparisonData.map((strategy) => (
                    <Card key={strategy.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{strategy.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Score Total</span>
                            <span className="font-bold">{calculateOverallScore(strategy, weights).toFixed(0)}%</span>
                          </div>
                          <Progress value={calculateOverallScore(strategy, weights)} className="h-2" />
                        </div>
                        <div className="pt-2 border-t grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Setup:</span>
                            <div className="font-medium">{strategy.setupTime}</div>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Mensual:</span>
                            <div className="font-medium">${strategy.monthlyMaintenance}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                    Ranking de Estrategias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedByScore.map((strategy, index) => {
                      const score = calculateOverallScore(strategy, weights);
                      const isTop3 = index < 3;

                      return (
                        <div
                          key={strategy.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isTop3
                              ? 'border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                isTop3
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{strategy.name}</div>
                              <Progress value={score} className="h-1.5 mt-1" />
                            </div>
                            <div className="text-lg font-bold">{score.toFixed(0)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-800 dark:text-emerald-400">Mejor Opción General</h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-1">
                          {bestOverall.name}
                        </p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-2">
                          Score: {calculateOverallScore(bestOverall, weights).toFixed(0)}/100 - Balance óptimo
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-400">ROI Más Rápido</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                          {bestROI.name}
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-2">
                          Recupera inversión en {bestROI.roiMonths} meses
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">Menor Riesgo</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                          {lowestRisk.name}
                        </p>
                        <p className="text-xs text-yellow-600/70 dark:text-yellow-500/70 mt-2">
                          Ideal para prueba de concepto
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800 dark:text-purple-400">Menor Inversión</h4>
                        <p className="text-sm text-purple-700 dark:text-purple-500 mt-1">
                          {lowestInvestment.name}
                        </p>
                        <p className="text-xs text-purple-600/70 dark:text-purple-500/70 mt-2">
                          Solo ${lowestInvestment.investment.toLocaleString()} inicial
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Matriz de Decisión</CardTitle>
                <CardDescription>
                  Visualización bidimensional de las estrategias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Riesgo vs ROI</h4>
                    <div className="h-64 relative bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <div className="absolute bottom-4 left-4 text-xs text-slate-500">Bajo riesgo</div>
                      <div className="absolute top-4 left-4 text-xs text-slate-500">Alto riesgo</div>
                      <div className="absolute bottom-4 right-4 text-xs text-slate-500">ROI rápido</div>
                      <div className="absolute top-4 right-4 text-xs text-slate-500">ROI lento</div>
                      {strategies.map((s) => {
                        const x = ((parseInt(s.roiMonths.split('-')[1] || s.roiMonths) - 3) / 33) * 80 + 10;
                        const y = ((s.riskScore - 1) / 4) * 80 + 10;
                        const score = calculateOverallScore(s, weights);

                        return (
                          <div
                            key={s.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${x}%`, bottom: `${y}%` }}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-125 transition-transform ${
                                score >= 70
                                  ? 'bg-teal-500'
                                  : score >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                            >
                              {s.id}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                              {s.name.split(' ').slice(0, 2).join(' ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Inversión vs Valor</h4>
                    <div className="h-64 relative bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <div className="absolute bottom-4 left-4 text-xs text-slate-500">Baja inversión</div>
                      <div className="absolute top-4 left-4 text-xs text-slate-500">Alta inversión</div>
                      <div className="absolute bottom-4 right-4 text-xs text-slate-500">Alto valor</div>
                      <div className="absolute top-4 right-4 text-xs text-slate-500">Bajo valor</div>
                      {strategies.map((s) => {
                        const x = ((s.investment - 2000) / 73000) * 80 + 10;
                        const score = calculateOverallScore(s, weights);
                        const y = score * 0.8 + 10;

                        return (
                          <div
                            key={s.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${x}%`, bottom: `${y}%` }}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:scale-125 transition-transform ${
                                score >= 70
                                  ? 'bg-teal-500'
                                  : score >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                            >
                              {s.id}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                              {s.name.split(' ').slice(0, 2).join(' ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
                  {strategies.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {s.id}. {s.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

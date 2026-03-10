import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Target, Calculator } from 'lucide-react';

export const ROICalculatorSection = () => {
  const [leadsPerMonth, setLeadsPerMonth] = useState(100);
  const [brokersCount, setBrokersCount] = useState(5);
  const [avgTicket, setAvgTicket] = useState(5000000);
  const [currentConversion, setCurrentConversion] = useState(5);

  // Calculations
  const currentRevenue = leadsPerMonth * (currentConversion / 100) * avgTicket;
  const projectedConversion = currentConversion * 1.35; // 35% improvement
  const projectedRevenue = leadsPerMonth * (projectedConversion / 100) * avgTicket;
  const additionalRevenue = projectedRevenue - currentRevenue;
  const additionalSales = leadsPerMonth * ((projectedConversion - currentConversion) / 100);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-MX').format(value);
  };

  return (
    <section id="roi" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            CALCULADORA DE ROI
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Calcula tu potencial de
            <span className="text-primary"> crecimiento</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre cunto podras ganar con Rovi CRM. Nuestros clientes ven un aumento promedio del 35% en conversin.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Calculator Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 border border-border"
          >
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center mr-4">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Tus Datos Actuales</h3>
                <p className="text-muted-foreground text-sm">Ajusta los valores segn tu situacin</p>
              </div>
            </div>

            {/* Leads per Month */}
            <div className="mb-8">
              <label className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  Leads por mes
                </span>
                <span className="text-2xl font-bold text-primary">{formatNumber(leadsPerMonth)}</span>
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={leadsPerMonth}
                onChange={(e) => setLeadsPerMonth(parseInt(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10</span>
                <span>1,000</span>
              </div>
            </div>

            {/* Brokers Count */}
            <div className="mb-8">
              <label className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center">
                  <Target className="w-4 h-4 mr-2 text-primary" />
                  Nmero de brokers
                </span>
                <span className="text-2xl font-bold text-primary">{brokersCount}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={brokersCount}
                onChange={(e) => setBrokersCount(parseInt(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            {/* Average Ticket */}
            <div className="mb-8">
              <label className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-primary" />
                  Ticket promedio (MXN)
                </span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(avgTicket)}</span>
              </label>
              <input
                type="range"
                min="500000"
                max="50000000"
                step="500000"
                value={avgTicket}
                onChange={(e) => setAvgTicket(parseInt(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$500K</span>
                <span>$50M</span>
              </div>
            </div>

            {/* Current Conversion */}
            <div className="mb-6">
              <label className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                  Conversin actual
                </span>
                <span className="text-2xl font-bold text-primary">{currentConversion}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={currentConversion}
                onChange={(e) => setCurrentConversion(parseFloat(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1%</span>
                <span>20%</span>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-primary/20 to-teal-600/20 rounded-3xl p-8 border-2 border-primary/30">
              <div className="text-center mb-6">
                <div className="text-sm text-muted-foreground mb-2">Ingresos Adicionales Proyectados</div>
                <motion.div
                  key={additionalRevenue}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold text-primary"
                >
                  {formatCurrency(additionalRevenue)}
                </motion.div>
                <div className="text-sm text-muted-foreground mt-2">por mes</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-500">{formatNumber(additionalSales)}</div>
                  <div className="text-xs text-muted-foreground">Ventas adicionales/mes</div>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-500">{formatNumber(additionalSales * 12)}</div>
                  <div className="text-xs text-muted-foreground">Ventas adicionales/ao</div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="bg-card rounded-3xl p-6 border border-border">
              <h4 className="font-bold mb-4">Comparativa Anual</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Sin Rovi</span>
                    <span className="font-bold">{formatCurrency(currentRevenue * 12)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground/50 rounded-full"
                      style={{ width: '50%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-primary font-semibold">Con Rovi (+35%)</span>
                    <span className="font-bold text-primary">{formatCurrency(projectedRevenue * 12)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '67.5%' }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="h-full bg-gradient-to-r from-primary to-teal-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Per Broker */}
            <div className="bg-card rounded-3xl p-6 border border-border">
              <h4 className="font-bold mb-4">Por Broker</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <div className="text-xs text-muted-foreground mb-1">Ingreso adicional mensual</div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(additionalRevenue / brokersCount)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <div className="text-xs text-muted-foreground mb-1">Ventas adicionales/mes</div>
                  <div className="text-lg font-bold text-primary">
                    {(additionalSales / brokersCount).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href="#demo-request"
              className="block bg-gradient-to-r from-primary to-teal-600 text-white text-center py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition transform hover:scale-105"
            >
              Logra Estos Resultados
            </a>
          </motion.div>
        </div>

        {/* Trust Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            * Basado en el promedio real de nuestros clientes. Los resultados pueden variar segn el mercado y la implementacin.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

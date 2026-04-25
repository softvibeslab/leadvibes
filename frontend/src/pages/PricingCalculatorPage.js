import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Database,
  DollarSign,
  MessageCircle,
  MessageSquare,
  Phone,
  Users,
  WandSparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const CONTACT_PRESETS = [100, 200, 300, 400, 1000];
const SCRAPING_PRESETS = [100, 200, 300, 400, 1000, 2000, 3000, 4000, 5000];

const TEAM_PRESETS = {
  broker: {
    label: 'Broker individual',
    teamSize: 1,
    contacts: 100,
    roviLicense: 149,
    touches: {
      whatsapp_service: 2,
      whatsapp_template: 1,
      sms: 0.5,
      calls: 0.35,
      avg_call_minutes: 2.5,
      emails: 2
    },
    ai: {
      queries_per_broker: 80,
      avg_input_tokens: 1500,
      avg_output_tokens: 500
    }
  },
  team5: {
    label: 'Desarrolladora con 5 brokers',
    teamSize: 5,
    contacts: 400,
    roviLicense: 449,
    touches: {
      whatsapp_service: 2,
      whatsapp_template: 2,
      sms: 1,
      calls: 0.5,
      avg_call_minutes: 3,
      emails: 3
    },
    ai: {
      queries_per_broker: 120,
      avg_input_tokens: 1800,
      avg_output_tokens: 650
    }
  },
  team10: {
    label: 'Desarrolladora con 10 brokers',
    teamSize: 10,
    contacts: 1000,
    roviLicense: 899,
    touches: {
      whatsapp_service: 3,
      whatsapp_template: 2,
      sms: 1,
      calls: 0.75,
      avg_call_minutes: 3.5,
      emails: 4
    },
    ai: {
      queries_per_broker: 150,
      avg_input_tokens: 1800,
      avg_output_tokens: 700
    }
  }
};

const DEFAULT_FIXED_COSTS = {
  rovi_license: 299,
  vps_hostinger: 9.99,
  mongodb: 30,
  github_team: 4,
  domain_ssl: 2,
  respond_io_plan: 159,
  apify_plan: 29,
  apify_actor_rental: 0,
  sendgrid_plan: 19.95,
  twilio_number: 6.5,
  misc_tools: 0
};

const DEFAULT_USAGE_RATES = {
  whatsapp_respond_io_service_per_message: 0,
  whatsapp_respond_io_template_per_message: 0,
  whatsapp_meta_template_per_message: 0.0034,
  whatsapp_meta_service_conversation: 0,
  sms_per_segment: 0.1819,
  vapi_platform_per_minute: 0.05,
  twilio_voice_per_minute: 0.016,
  stt_per_minute: 0.01,
  llm_voice_per_minute: 0.02,
  tts_per_minute: 0.04,
  email_per_message: 0,
  openai_input_per_million: 0.75,
  openai_output_per_million: 4.5
};

const DEFAULT_SCRAPING_RATES = {
  apify_compute_unit_rate: 0.2,
  apify_proxy_gb_rate: 8,
  apify_avg_cu_per_1000_leads: 1.5,
  apify_proxy_gb_per_1000_leads: 0.15,
  apify_extra_cost_per_1000_leads: 0
};

const DEFAULT_TOUCHES = TEAM_PRESETS.broker.touches;
const DEFAULT_AI_USAGE = TEAM_PRESETS.broker.ai;

const sourceNotes = [
  'respond.io cobra la plataforma por plan y Meta cobra el uso de WhatsApp aparte; por eso están separados.',
  'Desde el 1 de julio de 2025, WhatsApp cobra plantillas por mensaje; utility dentro de 24h puede ser gratis.',
  'Las conversaciones de servicio y los free entry points pueden cambiar el costo real de WhatsApp, por eso el campo queda editable.',
  'Twilio SMS México: el cobro es por segmento.',
  'Vapi: fee de plataforma por minuto; STT, LLM, TTS y telefonía se suman aparte.',
  'OpenAI: default con GPT-5.4 mini para mantener el costo del agente bajo.',
  'Apify depende mucho del actor, filtros y proxies usados; por eso también queda editable con supuestos por 1,000 leads.',
  'Todos los valores son editables para que cierres con números reales de cada cliente.'
];

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(Number.isFinite(value) ? value : 0);
}

function sumValues(values) {
  return Object.values(values).reduce((acc, value) => acc + Number(value || 0), 0);
}

export const PricingCalculatorPage = () => {
  const [teamSize, setTeamSize] = useState(1);
  const [contacts, setContacts] = useState(100);
  const [marginPercent, setMarginPercent] = useState(60);
  const [fixedCosts, setFixedCosts] = useState(DEFAULT_FIXED_COSTS);
  const [rates, setRates] = useState(DEFAULT_USAGE_RATES);
  const [scrapingRates, setScrapingRates] = useState(DEFAULT_SCRAPING_RATES);
  const [touches, setTouches] = useState(DEFAULT_TOUCHES);
  const [aiUsage, setAiUsage] = useState(DEFAULT_AI_USAGE);

  const voiceMinuteCost = useMemo(
    () =>
      Number(rates.vapi_platform_per_minute || 0) +
      Number(rates.twilio_voice_per_minute || 0) +
      Number(rates.stt_per_minute || 0) +
      Number(rates.llm_voice_per_minute || 0) +
      Number(rates.tts_per_minute || 0),
    [rates]
  );

  const calculateScenario = (contactCount) => {
    const whatsappServiceMessages = contactCount * Number(touches.whatsapp_service || 0);
    const whatsappTemplateMessages = contactCount * Number(touches.whatsapp_template || 0);
    const whatsappServiceConversations = contactCount * Number(touches.whatsapp_service || 0);
    const smsSegments = contactCount * Number(touches.sms || 0);
    const calls = contactCount * Number(touches.calls || 0);
    const callMinutes = calls * Number(touches.avg_call_minutes || 0);
    const emails = contactCount * Number(touches.emails || 0);

    const whatsappServiceCost =
      whatsappServiceMessages * Number(rates.whatsapp_respond_io_service_per_message || 0) +
      whatsappServiceConversations * Number(rates.whatsapp_meta_service_conversation || 0);
    const whatsappTemplateCost =
      whatsappTemplateMessages *
      (Number(rates.whatsapp_respond_io_template_per_message || 0) +
        Number(rates.whatsapp_meta_template_per_message || 0));
    const smsCost = smsSegments * Number(rates.sms_per_segment || 0);
    const voiceCost = callMinutes * voiceMinuteCost;
    const emailCost = emails * Number(rates.email_per_message || 0);

    const totalQueries = Number(teamSize || 0) * Number(aiUsage.queries_per_broker || 0);
    const totalInputTokens = totalQueries * Number(aiUsage.avg_input_tokens || 0);
    const totalOutputTokens = totalQueries * Number(aiUsage.avg_output_tokens || 0);
    const aiCost =
      (totalInputTokens / 1000000) * Number(rates.openai_input_per_million || 0) +
      (totalOutputTokens / 1000000) * Number(rates.openai_output_per_million || 0);

    const fixedTotal = sumValues(fixedCosts);
    const variableTotal =
      whatsappServiceCost +
      whatsappTemplateCost +
      smsCost +
      voiceCost +
      emailCost +
      aiCost;
    const total = fixedTotal + variableTotal;

    return {
      contacts: contactCount,
      teamSize: Number(teamSize || 0),
      calls,
      callMinutes,
      fixedTotal,
      variableTotal,
      total,
      costPerBroker: teamSize ? total / teamSize : 0,
      variableCostPerContact: contactCount ? variableTotal / contactCount : 0,
      totalCostPerContact: contactCount ? total / contactCount : 0,
      contactsPerBroker: teamSize ? contactCount / teamSize : 0,
      channels: {
        whatsappServiceMessages,
        whatsappTemplateMessages,
        whatsappServiceConversations,
        smsSegments,
        emails,
        totalQueries,
        totalInputTokens,
        totalOutputTokens
      },
      costs: {
        whatsappServiceCost,
        whatsappTemplateCost,
        smsCost,
        voiceCost,
        emailCost,
        aiCost
      }
    };
  };

  const calculateScrapingScenario = (leadCount) => {
    const blocksOf1000 = leadCount / 1000;
    const computeCost =
      blocksOf1000 *
      Number(scrapingRates.apify_avg_cu_per_1000_leads || 0) *
      Number(scrapingRates.apify_compute_unit_rate || 0);
    const proxyCost =
      blocksOf1000 *
      Number(scrapingRates.apify_proxy_gb_per_1000_leads || 0) *
      Number(scrapingRates.apify_proxy_gb_rate || 0);
    const extraVariableCost =
      blocksOf1000 * Number(scrapingRates.apify_extra_cost_per_1000_leads || 0);
    const fixedApifyCost =
      Number(fixedCosts.apify_plan || 0) + Number(fixedCosts.apify_actor_rental || 0);
    const variableTotal = computeCost + proxyCost + extraVariableCost;
    const total = fixedApifyCost + variableTotal;

    return {
      leads: leadCount,
      fixedApifyCost,
      variableTotal,
      total,
      computeCost,
      proxyCost,
      extraVariableCost,
      costPerLead: leadCount ? total / leadCount : 0,
      variableCostPerLead: leadCount ? variableTotal / leadCount : 0
    };
  };

  const currentScenario = useMemo(
    () => calculateScenario(Number(contacts || 0)),
    [contacts, fixedCosts, rates, touches, aiUsage, teamSize, voiceMinuteCost]
  );

  const currentScrapingScenario = useMemo(
    () => calculateScrapingScenario(Number(contacts || 0)),
    [contacts, fixedCosts, scrapingRates]
  );

  const volumeMatrix = useMemo(
    () => CONTACT_PRESETS.map((value) => calculateScenario(value)),
    [fixedCosts, rates, touches, aiUsage, teamSize, voiceMinuteCost]
  );

  const scrapingMatrix = useMemo(
    () => SCRAPING_PRESETS.map((value) => calculateScrapingScenario(value)),
    [fixedCosts, scrapingRates]
  );

  const combinedCommercialView = useMemo(() => {
    const acquisitionCost = currentScrapingScenario.total;
    const operatingCost = currentScenario.total;
    const totalCost = acquisitionCost + operatingCost;
    const marginMultiplier = 1 + Number(marginPercent || 0) / 100;
    const suggestedPrice = totalCost * marginMultiplier;
    const grossMarginAmount = suggestedPrice - totalCost;

    return {
      acquisitionCost,
      operatingCost,
      totalCost,
      suggestedPrice,
      grossMarginAmount,
      suggestedPerBroker: teamSize ? suggestedPrice / teamSize : 0,
      suggestedPerContact: contacts ? suggestedPrice / contacts : 0,
      acquisitionPerLead: contacts ? acquisitionCost / contacts : 0,
      operatingPerLead: contacts ? operatingCost / contacts : 0
    };
  }, [currentScenario, currentScrapingScenario, marginPercent, teamSize, contacts]);

  const packagedPlans = useMemo(() => {
    return Object.entries(TEAM_PRESETS).map(([key, preset]) => {
      const operating = calculateScenario(preset.contacts);
      const scraping = calculateScrapingScenario(preset.contacts);
      const totalCost = operating.total + scraping.total;
      const license = preset.roviLicense;
      const marginAmount = license - totalCost;
      const marginPct = totalCost ? (marginAmount / totalCost) * 100 : 0;

      return {
        key,
        label: preset.label,
        teamSize: preset.teamSize,
        contacts: preset.contacts,
        operatingCost: operating.total,
        scrapingCost: scraping.total,
        totalCost,
        license,
        marginAmount,
        marginPct,
        pricePerBroker: preset.teamSize ? license / preset.teamSize : 0
      };
    });
  }, [fixedCosts, rates, scrapingRates, touches, aiUsage, voiceMinuteCost]);

  const applyTeamPreset = (presetKey) => {
    const preset = TEAM_PRESETS[presetKey];
    setTeamSize(preset.teamSize);
    setContacts(preset.contacts);
    setFixedCosts((current) => ({
      ...current,
      rovi_license: preset.roviLicense
    }));
    setTouches(preset.touches);
    setAiUsage(preset.ai);
  };

  const handleNumericChange = (setter, key) => (event) => {
    const value = event.target.value;
    setter((current) => ({
      ...current,
      [key]: value === '' ? '' : Number(value)
    }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(245,245,244,0.98))]">
      <header className="border-b border-border/70 backdrop-blur-sm bg-background/85 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-lg">Calculadora de Costos Rovi</div>
              <div className="text-sm text-muted-foreground">Broker individual y equipos de 5 a 10 brokers</div>
            </div>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-teal-500/20 shadow-xl">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge className="bg-teal-600 hover:bg-teal-600">Pricing operativo</Badge>
                <Badge variant="outline">Verificado el 23 de abril de 2026</Badge>
              </div>
              <CardTitle className="text-3xl leading-tight">Calcula el costo real por contacto, por broker y por canal</CardTitle>
              <CardDescription className="text-base">
                Ajusta costos fijos, costos variables y toques por lead para cotizar Rovi con números operativos, no con promedios vagos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => applyTeamPreset('broker')} variant="outline">Broker individual</Button>
                <Button onClick={() => applyTeamPreset('team5')} variant="outline">Equipo de 5 brokers</Button>
                <Button onClick={() => applyTeamPreset('team10')} variant="outline">Equipo de 10 brokers</Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo total mensual</div>
                  <div className="text-3xl font-semibold">{formatMoney(currentScenario.total)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Fijo {formatMoney(currentScenario.fixedTotal)} + variable {formatMoney(currentScenario.variableTotal)}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo por broker</div>
                  <div className="text-3xl font-semibold">{formatMoney(currentScenario.costPerBroker)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {formatNumber(currentScenario.contactsPerBroker)} contactos por broker
                  </div>
                </div>
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo variable por contacto</div>
                  <div className="text-3xl font-semibold">{formatMoney(currentScenario.variableCostPerContact)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Ideal para ver costo puro de operación por lead tocado
                  </div>
                </div>
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo total por contacto</div>
                  <div className="text-3xl font-semibold">{formatMoney(currentScenario.totalCostPerContact)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Ya incluye infraestructura, mensajería, voz y uso del agente
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WandSparkles className="w-5 h-5 text-amber-600" />
                Supuestos editables
              </CardTitle>
              <CardDescription>
                Los defaults son conservadores y están pensados para México con Twilio + Vapi + OpenAI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {sourceNotes.map((note) => (
                <div key={note} className="rounded-xl border bg-muted/40 px-4 py-3">
                  {note}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-emerald-500/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Vista comercial</CardTitle>
              <CardDescription>
                Une adquisición de base + operación mensual y calcula el precio sugerido de venta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Adquisición base</div>
                  <div className="text-2xl font-semibold">{formatMoney(combinedCommercialView.acquisitionCost)}</div>
                  <div className="text-sm text-muted-foreground mt-2">Apify</div>
                </div>
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Operación</div>
                  <div className="text-2xl font-semibold">{formatMoney(combinedCommercialView.operatingCost)}</div>
                  <div className="text-sm text-muted-foreground mt-2">Mensajería, voz e IA</div>
                </div>
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo integral</div>
                  <div className="text-2xl font-semibold">{formatMoney(combinedCommercialView.totalCost)}</div>
                  <div className="text-sm text-muted-foreground mt-2">Base + operación</div>
                </div>
                <div className="rounded-2xl border bg-emerald-50 border-emerald-200 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Precio sugerido</div>
                  <div className="text-2xl font-semibold text-emerald-700">{formatMoney(combinedCommercialView.suggestedPrice)}</div>
                  <div className="text-sm text-muted-foreground mt-2">Con margen objetivo</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Margen objetivo %</Label>
                  <Input type="number" min="0" step="1" value={marginPercent} onChange={(e) => setMarginPercent(Number(e.target.value || 0))} />
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Margen bruto</div>
                  <div className="text-xl font-semibold">{formatMoney(combinedCommercialView.grossMarginAmount)}</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Precio sugerido / broker</div>
                  <div className="text-xl font-semibold">{formatMoney(combinedCommercialView.suggestedPerBroker)}</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Precio sugerido / contacto</div>
                  <div className="text-xl font-semibold">{formatMoney(combinedCommercialView.suggestedPerContact)}</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">CAC por lead scrapeado</div>
                  <div className="text-xl font-semibold">{formatMoney(combinedCommercialView.acquisitionPerLead)}</div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="text-sm text-muted-foreground">Costo operativo por contacto</div>
                  <div className="text-xl font-semibold">{formatMoney(combinedCommercialView.operatingPerLead)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Planes empaquetados Rovi</CardTitle>
              <CardDescription>
                Referencia rápida para vender broker individual, desarrolladora de 5 brokers y desarrolladora de 10 brokers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {packagedPlans.map((plan) => (
                <div key={plan.key} className="rounded-2xl border px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-semibold">{plan.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(plan.contacts, 0)} contactos · {plan.teamSize} brokers
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Badge variant="outline">Costo real {formatMoney(plan.totalCost)}</Badge>
                      <Badge className="bg-primary hover:bg-primary">Precio plan {formatMoney(plan.license)}</Badge>
                      <Badge variant="outline">Por broker {formatMoney(plan.pricePerBroker)}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4 mt-4 text-sm">
                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="text-muted-foreground">Scraping</div>
                      <div className="font-semibold">{formatMoney(plan.scrapingCost)}</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="text-muted-foreground">Operación</div>
                      <div className="font-semibold">{formatMoney(plan.operatingCost)}</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="text-muted-foreground">Margen bruto</div>
                      <div className="font-semibold">{formatMoney(plan.marginAmount)}</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="text-muted-foreground">Margen %</div>
                      <div className="font-semibold">{formatNumber(plan.marginPct)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Escenario comercial</CardTitle>
              <CardDescription>Define el tamaño del equipo, la base y los toques promedio por contacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="team-size">Número de brokers</Label>
                  <Input id="team-size" type="number" min="1" max="10" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value || 0))} />
                </div>
                <div>
                  <Label htmlFor="contacts">Contactos trabajados al mes</Label>
                  <Input id="contacts" type="number" min="1" value={contacts} onChange={(e) => setContacts(Number(e.target.value || 0))} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {CONTACT_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant={Number(contacts) === preset ? 'default' : 'outline'}
                    onClick={() => setContacts(preset)}
                  >
                    {preset} contactos
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>WhatsApp dentro de ventana</Label>
                  <Input type="number" min="0" step="0.1" value={touches.whatsapp_service} onChange={handleNumericChange(setTouches, 'whatsapp_service')} />
                </div>
                <div>
                  <Label>WhatsApp plantilla</Label>
                  <Input type="number" min="0" step="0.1" value={touches.whatsapp_template} onChange={handleNumericChange(setTouches, 'whatsapp_template')} />
                </div>
                <div>
                  <Label>SMS por contacto</Label>
                  <Input type="number" min="0" step="0.1" value={touches.sms} onChange={handleNumericChange(setTouches, 'sms')} />
                </div>
                <div>
                  <Label>Llamadas por contacto</Label>
                  <Input type="number" min="0" step="0.05" value={touches.calls} onChange={handleNumericChange(setTouches, 'calls')} />
                </div>
                <div>
                  <Label>Minutos promedio por llamada</Label>
                  <Input type="number" min="0" step="0.1" value={touches.avg_call_minutes} onChange={handleNumericChange(setTouches, 'avg_call_minutes')} />
                </div>
                <div>
                  <Label>Emails por contacto</Label>
                  <Input type="number" min="0" step="0.1" value={touches.emails} onChange={handleNumericChange(setTouches, 'emails')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Uso del agente digital</CardTitle>
              <CardDescription>Esto modela cuánto consulta el agente la base de datos y cuánto gasta en IA de texto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Consultas IA por broker</Label>
                  <Input type="number" min="0" step="1" value={aiUsage.queries_per_broker} onChange={handleNumericChange(setAiUsage, 'queries_per_broker')} />
                </div>
                <div>
                  <Label>Tokens input por consulta</Label>
                  <Input type="number" min="0" step="100" value={aiUsage.avg_input_tokens} onChange={handleNumericChange(setAiUsage, 'avg_input_tokens')} />
                </div>
                <div>
                  <Label>Tokens output por consulta</Label>
                  <Input type="number" min="0" step="100" value={aiUsage.avg_output_tokens} onChange={handleNumericChange(setAiUsage, 'avg_output_tokens')} />
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Consultas mensuales del agente</span>
                  <span className="font-medium">{formatNumber(currentScenario.channels.totalQueries)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tokens input mensuales</span>
                  <span className="font-medium">{formatNumber(currentScenario.channels.totalInputTokens, 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tokens output mensuales</span>
                  <span className="font-medium">{formatNumber(currentScenario.channels.totalOutputTokens, 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Costo IA texto</span>
                  <span className="font-medium">{formatMoney(currentScenario.costs.aiCost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Costos fijos mensuales</CardTitle>
              <CardDescription>Infraestructura y herramientas base que necesitas para operar Rovi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Licencia Rovi</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.rovi_license} onChange={handleNumericChange(setFixedCosts, 'rovi_license')} />
              </div>
              <div>
                <Label>VPS / Hostinger</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.vps_hostinger} onChange={handleNumericChange(setFixedCosts, 'vps_hostinger')} />
              </div>
              <div>
                <Label>MongoDB</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.mongodb} onChange={handleNumericChange(setFixedCosts, 'mongodb')} />
              </div>
              <div>
                <Label>GitHub Team</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.github_team} onChange={handleNumericChange(setFixedCosts, 'github_team')} />
              </div>
              <div>
                <Label>Dominio / SSL / DNS</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.domain_ssl} onChange={handleNumericChange(setFixedCosts, 'domain_ssl')} />
              </div>
              <div>
                <Label>Plan Apify</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.apify_plan} onChange={handleNumericChange(setFixedCosts, 'apify_plan')} />
              </div>
              <div>
                <Label>Actor rental Apify</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.apify_actor_rental} onChange={handleNumericChange(setFixedCosts, 'apify_actor_rental')} />
              </div>
              <div>
                <Label>Plan respond.io</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.respond_io_plan} onChange={handleNumericChange(setFixedCosts, 'respond_io_plan')} />
              </div>
              <div>
                <Label>Plan SendGrid</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.sendgrid_plan} onChange={handleNumericChange(setFixedCosts, 'sendgrid_plan')} />
              </div>
              <div>
                <Label>Número Twilio</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.twilio_number} onChange={handleNumericChange(setFixedCosts, 'twilio_number')} />
              </div>
              <div>
                <Label>Otros tools</Label>
                <Input type="number" min="0" step="0.01" value={fixedCosts.misc_tools} onChange={handleNumericChange(setFixedCosts, 'misc_tools')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Tarifas variables por canal</CardTitle>
              <CardDescription>Puedes cambiarlas por país, proveedor o negociación enterprise.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>respond.io servicio por mensaje</Label>
                <Input type="number" min="0" step="0.0001" value={rates.whatsapp_respond_io_service_per_message} onChange={handleNumericChange(setRates, 'whatsapp_respond_io_service_per_message')} />
              </div>
              <div>
                <Label>respond.io plantilla por mensaje</Label>
                <Input type="number" min="0" step="0.0001" value={rates.whatsapp_respond_io_template_per_message} onChange={handleNumericChange(setRates, 'whatsapp_respond_io_template_per_message')} />
              </div>
              <div>
                <Label>Meta plantilla por mensaje</Label>
                <Input type="number" min="0" step="0.0001" value={rates.whatsapp_meta_template_per_message} onChange={handleNumericChange(setRates, 'whatsapp_meta_template_per_message')} />
              </div>
              <div>
                <Label>Meta servicio por conversación</Label>
                <Input type="number" min="0" step="0.0001" value={rates.whatsapp_meta_service_conversation} onChange={handleNumericChange(setRates, 'whatsapp_meta_service_conversation')} />
              </div>
              <div>
                <Label>SMS por segmento</Label>
                <Input type="number" min="0" step="0.0001" value={rates.sms_per_segment} onChange={handleNumericChange(setRates, 'sms_per_segment')} />
              </div>
              <div>
                <Label>Email por mensaje</Label>
                <Input type="number" min="0" step="0.0001" value={rates.email_per_message} onChange={handleNumericChange(setRates, 'email_per_message')} />
              </div>
              <div>
                <Label>Vapi plataforma por minuto</Label>
                <Input type="number" min="0" step="0.0001" value={rates.vapi_platform_per_minute} onChange={handleNumericChange(setRates, 'vapi_platform_per_minute')} />
              </div>
              <div>
                <Label>Twilio voz por minuto</Label>
                <Input type="number" min="0" step="0.0001" value={rates.twilio_voice_per_minute} onChange={handleNumericChange(setRates, 'twilio_voice_per_minute')} />
              </div>
              <div>
                <Label>STT por minuto</Label>
                <Input type="number" min="0" step="0.0001" value={rates.stt_per_minute} onChange={handleNumericChange(setRates, 'stt_per_minute')} />
              </div>
              <div>
                <Label>LLM voz por minuto</Label>
                <Input type="number" min="0" step="0.0001" value={rates.llm_voice_per_minute} onChange={handleNumericChange(setRates, 'llm_voice_per_minute')} />
              </div>
              <div>
                <Label>TTS por minuto</Label>
                <Input type="number" min="0" step="0.0001" value={rates.tts_per_minute} onChange={handleNumericChange(setRates, 'tts_per_minute')} />
              </div>
              <div>
                <Label>OpenAI input por 1M tokens</Label>
                <Input type="number" min="0" step="0.01" value={rates.openai_input_per_million} onChange={handleNumericChange(setRates, 'openai_input_per_million')} />
              </div>
              <div>
                <Label>OpenAI output por 1M tokens</Label>
                <Input type="number" min="0" step="0.01" value={rates.openai_output_per_million} onChange={handleNumericChange(setRates, 'openai_output_per_million')} />
              </div>
              <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between">
                <span className="text-sm font-medium">Costo total voz por minuto</span>
                <span className="text-lg font-semibold">{formatMoney(voiceMinuteCost)}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Scraping con Apify</CardTitle>
              <CardDescription>Modela el costo de construir la base filtrada antes de tocarla con campañas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>CU rate Apify</Label>
                  <Input type="number" min="0" step="0.01" value={scrapingRates.apify_compute_unit_rate} onChange={handleNumericChange(setScrapingRates, 'apify_compute_unit_rate')} />
                </div>
                <div>
                  <Label>Proxy residencial por GB</Label>
                  <Input type="number" min="0" step="0.01" value={scrapingRates.apify_proxy_gb_rate} onChange={handleNumericChange(setScrapingRates, 'apify_proxy_gb_rate')} />
                </div>
                <div>
                  <Label>CU por 1,000 leads</Label>
                  <Input type="number" min="0" step="0.1" value={scrapingRates.apify_avg_cu_per_1000_leads} onChange={handleNumericChange(setScrapingRates, 'apify_avg_cu_per_1000_leads')} />
                </div>
                <div>
                  <Label>GB proxy por 1,000 leads</Label>
                  <Input type="number" min="0" step="0.01" value={scrapingRates.apify_proxy_gb_per_1000_leads} onChange={handleNumericChange(setScrapingRates, 'apify_proxy_gb_per_1000_leads')} />
                </div>
                <div>
                  <Label>Extra por 1,000 leads</Label>
                  <Input type="number" min="0" step="0.01" value={scrapingRates.apify_extra_cost_per_1000_leads} onChange={handleNumericChange(setScrapingRates, 'apify_extra_cost_per_1000_leads')} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo Apify actual</div>
                  <div className="text-3xl font-semibold">{formatMoney(currentScrapingScenario.total)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Fijo {formatMoney(currentScrapingScenario.fixedApifyCost)} + variable {formatMoney(currentScrapingScenario.variableTotal)}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white/80 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Costo por lead scrapeado</div>
                  <div className="text-3xl font-semibold">{formatMoney(currentScrapingScenario.costPerLead)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Sobre una base de {formatNumber(contacts, 0)} leads filtrados
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Compute Apify</span>
                  <span className="font-medium">{formatMoney(currentScrapingScenario.computeCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Proxies</span>
                  <span className="font-medium">{formatMoney(currentScrapingScenario.proxyCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Extras variables</span>
                  <span className="font-medium">{formatMoney(currentScrapingScenario.extraVariableCost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matriz Apify por volumen</CardTitle>
              <CardDescription>Bases filtradas de 100 a 5000 leads para prospección.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-3 pr-4">Leads</th>
                      <th className="text-left font-medium py-3 pr-4">Variable</th>
                      <th className="text-left font-medium py-3 pr-4">Total Apify</th>
                      <th className="text-left font-medium py-3">Costo / lead</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapingMatrix.map((scenario) => (
                      <tr
                        key={scenario.leads}
                        className={`border-b last:border-0 ${scenario.leads === Number(contacts) ? 'bg-primary/5' : ''}`}
                      >
                        <td className="py-3 pr-4 font-medium">{formatNumber(scenario.leads, 0)}</td>
                        <td className="py-3 pr-4">{formatMoney(scenario.variableTotal)}</td>
                        <td className="py-3 pr-4">{formatMoney(scenario.total)}</td>
                        <td className="py-3">{formatMoney(scenario.costPerLead)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Desglose del escenario actual</CardTitle>
              <CardDescription>Así se reparte el gasto mensual con {formatNumber(currentScenario.contacts, 0)} contactos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: 'Scraping Apify de la base',
                  icon: Database,
                  volume: `${formatNumber(contacts, 0)} leads filtrados`,
                  cost: currentScrapingScenario.total
                },
                {
                  label: 'WhatsApp dentro de ventana',
                  icon: MessageCircle,
                  volume: `${formatNumber(currentScenario.channels.whatsappServiceMessages)} mensajes / ${formatNumber(currentScenario.channels.whatsappServiceConversations)} conversaciones`,
                  cost: currentScenario.costs.whatsappServiceCost
                },
                {
                  label: 'WhatsApp plantilla',
                  icon: MessageCircle,
                  volume: `${formatNumber(currentScenario.channels.whatsappTemplateMessages)} mensajes`,
                  cost: currentScenario.costs.whatsappTemplateCost
                },
                {
                  label: 'SMS',
                  icon: MessageSquare,
                  volume: `${formatNumber(currentScenario.channels.smsSegments)} segmentos`,
                  cost: currentScenario.costs.smsCost
                },
                {
                  label: 'Llamadas con agente Vapi',
                  icon: Phone,
                  volume: `${formatNumber(currentScenario.callMinutes)} min`,
                  cost: currentScenario.costs.voiceCost
                },
                {
                  label: 'Emails',
                  icon: Database,
                  volume: `${formatNumber(currentScenario.channels.emails)} envíos`,
                  cost: currentScenario.costs.emailCost
                },
                {
                  label: 'Agente IA y consultas a la base',
                  icon: WandSparkles,
                  volume: `${formatNumber(currentScenario.channels.totalQueries)} consultas`,
                  cost: currentScenario.costs.aiCost
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">{item.volume}</div>
                      </div>
                    </div>
                    <div className="text-right font-semibold">{formatMoney(item.cost)}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matriz de costos por volumen</CardTitle>
              <CardDescription>Usa esta tabla para cotizar operación de la base una vez ya scrapeada.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-3 pr-4">Contactos</th>
                      <th className="text-left font-medium py-3 pr-4">Variable</th>
                      <th className="text-left font-medium py-3 pr-4">Total</th>
                      <th className="text-left font-medium py-3 pr-4">Total / contacto</th>
                      <th className="text-left font-medium py-3">Total / broker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumeMatrix.map((scenario) => (
                      <tr
                        key={scenario.contacts}
                        className={`border-b last:border-0 ${scenario.contacts === Number(contacts) ? 'bg-primary/5' : ''}`}
                      >
                        <td className="py-3 pr-4 font-medium">{formatNumber(scenario.contacts, 0)}</td>
                        <td className="py-3 pr-4">{formatMoney(scenario.variableTotal)}</td>
                        <td className="py-3 pr-4">{formatMoney(scenario.total)}</td>
                        <td className="py-3 pr-4">{formatMoney(scenario.totalCostPerContact)}</td>
                        <td className="py-3">{formatMoney(scenario.costPerBroker)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default PricingCalculatorPage;

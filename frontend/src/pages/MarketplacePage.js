import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  FileText,
  Filter,
  Landmark,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import {
  getEffectiveRole,
  isCopimLocalAssociationUser,
  isCopimMemberUser,
  isCopimNationalUser,
} from '../lib/copimAccess';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0);

const listingTypeLabels = {
  digital_artifact: 'Producto digital',
  professional_service: 'Servicio Gig',
  agent_skill: 'Agent Skill',
  integration: 'Integracion',
};

const listingIcons = {
  digital_artifact: FileText,
  professional_service: BriefcaseBusiness,
  agent_skill: Bot,
  integration: Wand2,
};

const rolePlaybooks = {
  council: {
    label: 'Consejo COPIM',
    headline: 'Controla la aduana del ecosistema',
    description: 'Curaduria nacional, tiers, comisiones para COPIM y Skills certificadas para elevar el estándar profesional.',
    metrics: ['10% comision asociacion', 'Tiers Pro/Premium', 'Skills certificadas'],
  },
  association: {
    label: 'Asociacion',
    headline: 'Monetiza servicios locales para socios',
    description: 'Paquetes de cursos, proveedores certificados, campañas y productos digitales con revenue share por comunidad.',
    metrics: ['Servicios locales', 'Comision por comunidad', 'Cursos premium'],
  },
  member: {
    label: 'Miembro COPIM',
    headline: 'Compra herramientas para vender mejor',
    description: 'Contratos, guiones, cursos, plantillas, servicios y Skills para instalar en tu asistente IA.',
    metrics: ['Comprar y aprender', 'Instalar Skills', 'Contratar expertos'],
  },
  agency: {
    label: 'Inmobiliaria',
    headline: 'Activa capacidades comerciales sin desarrollos',
    description: 'Automatizaciones, reportes, campañas premium, integraciones y servicios de marketing listos para tu equipo.',
    metrics: ['Campanas premium', 'Gigs de marketing', 'IA para equipos'],
  },
  broker: {
    label: 'Broker',
    headline: 'Delegar, automatizar y cerrar mas',
    description: 'Compra playbooks, contrata landing pages y equipa tu agente IA con Skills especializadas.',
    metrics: ['Scripts de venta', 'Landing pages', 'Calificacion IA'],
  },
};

const demoListings = [
  {
    id: 'demo-contract-pack',
    listing_type: 'digital_artifact',
    title: 'Pack Contratos y Promesas COPIM',
    subtitle: 'Plantillas listas para operaciones inmobiliarias',
    description: 'Contratos, checklist documental y guiones de cierre para brokers que necesitan estandarizar procesos.',
    category: 'legal',
    tags: ['contratos', 'copim', 'cierre'],
    price_mxn: 1490,
    creator_user_id: 'demo',
    status: 'published',
    sales_count: 38,
    minimum_tier: 'basic',
  },
  {
    id: 'demo-landing-page',
    listing_type: 'professional_service',
    title: 'Landing Page para Desarrollo',
    subtitle: 'Servicio Gig con entrega en 7 dias',
    description: 'Pagina de captacion con copy, formulario y conexion a ROVI CRM para preventas o inventario premium.',
    category: 'marketing',
    tags: ['landing', 'ads', 'desarrollos'],
    price_mxn: 15900,
    creator_user_id: 'demo',
    status: 'published',
    sales_count: 12,
    minimum_tier: 'basic',
    professional_service: {
      packages: [{ name: 'Base', price_mxn: 15900, delivery_days: 7, revisions: 1 }],
    },
  },
  {
    id: 'demo-riviera-skill',
    listing_type: 'agent_skill',
    title: 'Skill Analista Riviera Maya',
    subtitle: 'Diagnostico comercial para leads de alto valor',
    description: 'Instala conocimiento procedimental en tu agente IA para priorizar leads, detectar objeciones y recomendar seguimiento.',
    category: 'ai',
    tags: ['skill', 'tulum', 'inversionistas'],
    price_mxn: 1490,
    creator_user_id: 'demo',
    status: 'published',
    sales_count: 21,
    minimum_tier: 'basic',
    agent_skill: {
      skill_slug: 'analista-mercado-inmobiliario-riviera-maya',
      required_mcp_tools: ['rovi.list_leads', 'rovi.retrieve_lead_summary', 'rovi.qualify_lead'],
    },
  },
  {
    id: 'demo-meta-leads',
    listing_type: 'integration',
    title: 'Meta Lead Ads Connector',
    subtitle: 'Importacion automatica de leads',
    description: 'Conecta formularios de Meta con ROVI para disparar asignacion, scoring y seguimiento automatico.',
    category: 'integrations',
    tags: ['meta', 'leads', 'automatizacion'],
    price_mxn: 799,
    creator_user_id: 'rovi',
    status: 'published',
    sales_count: 44,
    minimum_tier: 'pro',
  },
  {
    id: 'demo-whatsapp-pack',
    listing_type: 'digital_artifact',
    title: 'Pack WhatsApp Broker Pro',
    subtitle: 'Mensajes para primer contacto y reactivacion',
    description: 'Secuencias listas para recuperar leads frios, confirmar citas y mover prospectos al cierre.',
    category: 'sales',
    tags: ['whatsapp', 'scripts', 'seguimiento'],
    price_mxn: 690,
    creator_user_id: 'demo',
    status: 'published',
    sales_count: 64,
    minimum_tier: 'basic',
  },
  {
    id: 'demo-fideicomiso-skill',
    listing_type: 'agent_skill',
    title: 'Skill Fideicomisos Riviera Maya',
    subtitle: 'Objeciones legales para compradores extranjeros',
    description: 'Habilidad IA para explicar fideicomiso, zona restringida, certidumbre juridica y pasos de compra.',
    category: 'ai',
    tags: ['fideicomiso', 'extranjeros', 'legal'],
    price_mxn: 2490,
    creator_user_id: 'demo',
    status: 'published',
    sales_count: 9,
    minimum_tier: 'premium',
    agent_skill: {
      skill_slug: 'especialista-fideicomisos-riviera-maya',
      required_mcp_tools: ['rovi.retrieve_lead_summary'],
    },
  },
];

const createEmptyListingForm = () => ({
  listing_type: 'digital_artifact',
  title: '',
  description: '',
  category: 'sales',
  price_mxn: 0,
  minimum_tier: 'basic',
});

export const MarketplacePage = () => {
  const { api, user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  const [marketplaceMe, setMarketplaceMe] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(createEmptyListingForm);
  const [busyListingId, setBusyListingId] = useState(null);

  const roleContext = useMemo(() => {
    if (isCopimMemberUser(user)) return rolePlaybooks.member;
    if (isCopimLocalAssociationUser(user)) return rolePlaybooks.association;
    if (isCopimNationalUser(user)) return rolePlaybooks.council;
    if (user?.account_type === 'agency') return rolePlaybooks.agency;
    return rolePlaybooks.broker;
  }, [user]);

  const isCopimRoute = location.pathname.startsWith('/copim');
  const effectiveRole = getEffectiveRole(user);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const [summaryResponse, meResponse, tiersResponse, listingsResponse, transactionsResponse] = await Promise.all([
        api.get('/marketplace/strategy-summary'),
        api.get('/marketplace/me'),
        api.get('/marketplace/tiers'),
        api.get('/marketplace/listings', { params: { include_mine: true } }),
        api.get('/marketplace/transactions'),
      ]);
      setStrategy(summaryResponse.data);
      setMarketplaceMe(meResponse.data);
      setTiers(tiersResponse.data?.tiers || []);
      const apiListings = listingsResponse.data?.listings || [];
      setListings(apiListings.length ? apiListings : demoListings);
      setTransactions(transactionsResponse.data?.transactions || []);
    } catch (error) {
      console.error('Error loading marketplace:', error);
      setListings(demoListings);
      setStrategy({
        positioning: 'ROVI Marketplace convierte COPIM en una economia digital soberana para productos, servicios y Agent Skills.',
        revenue_streams: ['suscripciones por tiers', 'comision tripartita por venta', 'servicios en escrow', 'Agent Skills'],
      });
      setMarketplaceMe({
        tier: { code: effectiveRole?.includes('copim') ? 'premium' : 'pro', name: effectiveRole?.includes('copim') ? 'Premium' : 'Pro' },
        seller_limits: { active_listings_count: 0, max_active_digital_artifacts: 10, max_active_services: 3, max_active_agent_skills: 2 },
      });
      setTiers([]);
      toast({
        title: 'Marketplace en modo demo',
        description: 'No se pudo leer el backend; se muestran datos de demostracion.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesType = typeFilter === 'all' || listing.listing_type === typeFilter;
      if (!matchesType) return false;
      if (!normalized) return true;
      return [listing.title, listing.subtitle, listing.description, listing.category, ...(listing.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [listings, query, typeFilter]);

  const summaryStats = useMemo(() => {
    const grossPotential = listings.reduce((sum, listing) => sum + Number(listing.price_mxn || 0) * Math.max(1, Number(listing.sales_count || 0)), 0);
    return [
      { label: 'Items visibles', value: listings.length, icon: Store },
      { label: 'Agent Skills', value: listings.filter((item) => item.listing_type === 'agent_skill').length, icon: Bot },
      { label: 'GMV potencial', value: formatCurrency(grossPotential), icon: CreditCard },
      { label: 'Comision COPIM 10%', value: formatCurrency(grossPotential * 0.1), icon: Landmark },
    ];
  }, [listings]);

  const submitListing = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      price_mxn: Number(form.price_mxn || 0),
      tags: [form.category, form.listing_type].filter(Boolean),
    };

    if (payload.listing_type === 'digital_artifact') {
      payload.digital_artifact = { artifact_type: payload.category || 'template', file_urls: [] };
    }
    if (payload.listing_type === 'professional_service') {
      payload.professional_service = {
        service_category: payload.category || 'marketing',
        packages: [{ name: 'Base', price_mxn: payload.price_mxn, delivery_days: 7, revisions: 1 }],
      };
    }
    if (payload.listing_type === 'agent_skill') {
      payload.agent_skill = {
        skill_slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        required_mcp_tools: ['rovi.list_leads', 'rovi.retrieve_lead_summary'],
      };
    }

    setCreating(true);
    try {
      const response = await api.post('/marketplace/listings', payload);
      const created = response.data?.listing;
      if (created?.id) {
        await api.post(`/marketplace/listings/${created.id}/publish`);
      }
      setForm(createEmptyListingForm());
      toast({ title: 'Listing publicado', description: 'Tu producto ya aparece en el Marketplace.' });
      await loadMarketplace();
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: 'No se pudo publicar',
        description: error.response?.data?.detail || 'Revisa tu tier o intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const purchaseListing = async (listing) => {
    setBusyListingId(listing.id);
    try {
      if (String(listing.id).startsWith('demo-')) {
        setTransactions((current) => [
          {
            id: `demo-tx-${Date.now()}`,
            listing_id: listing.id,
            listing_type: listing.listing_type,
            gross_amount_mxn: listing.price_mxn,
            status: listing.listing_type === 'professional_service' ? 'in_escrow' : 'paid',
            created_at: new Date().toISOString(),
            commission_splits: [
              { recipient_type: 'creator', amount_mxn: listing.price_mxn * 0.75 },
              { recipient_type: 'association', amount_mxn: listing.price_mxn * 0.1 },
              { recipient_type: 'platform', amount_mxn: listing.price_mxn * 0.15 },
            ],
          },
          ...current,
        ]);
      } else {
        await api.post('/marketplace/purchase', { listing_id: listing.id, payment_provider: 'manual' });
        await loadMarketplace();
      }
      toast({
        title: listing.listing_type === 'professional_service' ? 'Servicio contratado' : 'Compra registrada',
        description: 'Se genero la transaccion y el split de comisiones.',
      });
    } catch (error) {
      console.error('Error purchasing listing:', error);
      toast({
        title: 'No se pudo comprar',
        description: error.response?.data?.detail || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setBusyListingId(null);
    }
  };

  const installSkill = async (listing) => {
    setBusyListingId(listing.id);
    try {
      if (!String(listing.id).startsWith('demo-')) {
        await api.post(`/marketplace/agent-skills/${listing.id}/install`);
      }
      toast({
        title: 'Skill instalada',
        description: 'Tu agente IA puede usar esta habilidad con las herramientas MCP del CRM.',
      });
    } catch (error) {
      console.error('Error installing skill:', error);
      toast({
        title: 'No se pudo instalar',
        description: error.response?.data?.detail || 'Compra la Skill o intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setBusyListingId(null);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">Marketplace B2B</Badge>
                <Badge variant="secondary">{roleContext.label}</Badge>
                <Badge variant="outline">{isCopimRoute ? 'COPIM' : 'ROVI CRM'}</Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground lg:text-4xl">
                ROVI Marketplace
              </h1>
              <p className="mt-2 max-w-3xl text-base text-muted-foreground">
                {roleContext.headline}. {roleContext.description}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 lg:w-80">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Tier activo</p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{marketplaceMe?.tier?.name || marketplaceMe?.tier?.code || 'Pro'}</p>
                  <p className="text-xs text-muted-foreground">Limites y comisiones segun membresia</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:inline-grid md:w-auto md:grid-cols-5">
            <TabsTrigger value="catalog">Catalogo</TabsTrigger>
            <TabsTrigger value="sell">Publicar</TabsTrigger>
            <TabsTrigger value="skills">Agent Skills</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Catalogo de capacidades
                  </CardTitle>
                  <CardDescription>
                    Compra productos digitales, contrata expertos, instala Skills o activa integraciones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar contratos, Skills, landing pages..." />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="md:w-64">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="digital_artifact">Productos digitales</SelectItem>
                        <SelectItem value="professional_service">Servicios Gig</SelectItem>
                        <SelectItem value="agent_skill">Agent Skills</SelectItem>
                        <SelectItem value="integration">Integraciones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Playbook por rol</CardTitle>
                  <CardDescription>{roleContext.label}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roleContext.metrics.map((metric) => (
                    <div key={metric} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-lg bg-muted" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => {
                  const Icon = listingIcons[listing.listing_type] || Store;
                  return (
                    <Card key={listing.id} className="overflow-hidden">
                      <CardHeader className="border-b border-border bg-muted/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg leading-tight">{listing.title}</CardTitle>
                              <CardDescription className="mt-1">{listing.subtitle || listingTypeLabels[listing.listing_type]}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline">{listing.minimum_tier || 'basic'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-5">
                        <p className="min-h-[60px] text-sm leading-6 text-muted-foreground">{listing.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{listingTypeLabels[listing.listing_type] || listing.listing_type}</Badge>
                          <Badge variant="outline">{listing.category}</Badge>
                          {(listing.tags || []).slice(0, 2).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Precio</p>
                            <p className="text-xl font-bold">{formatCurrency(listing.price_mxn)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Ventas</p>
                            <p className="font-semibold">{listing.sales_count || 0}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" disabled={busyListingId === listing.id} onClick={() => purchaseListing(listing)}>
                            <ShoppingBag className="h-4 w-4" />
                            Comprar
                          </Button>
                          {listing.listing_type === 'agent_skill' && (
                            <Button variant="outline" disabled={busyListingId === listing.id} onClick={() => installSkill(listing)}>
                              <Bot className="h-4 w-4" />
                              Instalar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sell">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Publicar en Marketplace
                  </CardTitle>
                  <CardDescription>
                    Los tiers Pro, Premium y Partner pueden monetizar conocimiento, servicios y habilidades de IA.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={submitListing}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={form.listing_type} onValueChange={(value) => setForm((current) => ({ ...current, listing_type: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="digital_artifact">Producto digital</SelectItem>
                            <SelectItem value="professional_service">Servicio Gig</SelectItem>
                            <SelectItem value="agent_skill">Agent Skill</SelectItem>
                            <SelectItem value="integration">Integracion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sales">Ventas</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="ai">IA</SelectItem>
                            <SelectItem value="integrations">Integraciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Titulo</Label>
                      <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ej. Skill Calificador de Leads de Alto Valor" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripcion</Label>
                      <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Explica el resultado que obtiene el comprador." required />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Precio MXN</Label>
                        <Input type="number" min="0" value={form.price_mxn} onChange={(event) => setForm((current) => ({ ...current, price_mxn: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tier minimo</Label>
                        <Select value={form.minimum_tier} onValueChange={(value) => setForm((current) => ({ ...current, minimum_tier: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" disabled={creating}>
                      <Plus className="h-4 w-4" />
                      {creating ? 'Publicando...' : 'Publicar listing'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Limites del vendedor</CardTitle>
                  <CardDescription>Controlados por tier y membresia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Listings activos</span><strong>{marketplaceMe?.seller_limits?.active_listings_count ?? 0}</strong></div>
                  <div className="flex justify-between"><span>Productos digitales</span><strong>{marketplaceMe?.seller_limits?.max_active_digital_artifacts ?? 0}</strong></div>
                  <div className="flex justify-between"><span>Servicios</span><strong>{marketplaceMe?.seller_limits?.max_active_services ?? 0}</strong></div>
                  <div className="flex justify-between"><span>Agent Skills</span><strong>{marketplaceMe?.seller_limits?.max_active_agent_skills ?? 0}</strong></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-4 md:grid-cols-2">
                {filteredListings.filter((listing) => listing.listing_type === 'agent_skill').map((listing) => (
                  <Card key={listing.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        {listing.title}
                      </CardTitle>
                      <CardDescription>{listing.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{listing.description}</p>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">MCP requerido</p>
                        <p className="mt-1 text-muted-foreground">
                          {(listing.agent_skill?.required_mcp_tools || ['rovi.list_leads', 'rovi.retrieve_lead_summary']).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <strong>{formatCurrency(listing.price_mxn)}</strong>
                        <Button onClick={() => installSkill(listing)} disabled={busyListingId === listing.id}>
                          <Sparkles className="h-4 w-4" />
                          Instalar Skill
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Orquestacion IA + MCP</CardTitle>
                  <CardDescription>El agente compra conocimiento y usa herramientas seguras del CRM.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {['Descubre Skill por descripcion', 'Carga SKILL.md al activarse', 'Usa rovi.list_leads y rovi.qualify_lead', 'Entrega diagnostico comercial accionable'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tiers">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(tiers.length ? tiers : [
                { code: 'basic', name: 'Basic', monthly_price_mxn: 0, can_sell: false, features: ['Comprar productos', 'Instalar Skills compradas'] },
                { code: 'pro', name: 'Pro', monthly_price_mxn: 799, can_sell: true, features: ['Publicar 10 productos', '3 servicios', '2 Agent Skills'] },
                { code: 'premium', name: 'Premium', monthly_price_mxn: 1999, can_sell: true, features: ['50 productos', '15 servicios', '10 Agent Skills'] },
                { code: 'partner', name: 'Partner', monthly_price_mxn: 4999, can_sell: true, features: ['Proveedor certificado', '50 servicios', 'Directorio B2B'] },
              ]).map((tier) => (
                <Card key={tier.code || tier.id}>
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription>{tier.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-2xl font-bold">{formatCurrency(tier.monthly_price_mxn)}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                    <Badge variant={tier.can_sell ? 'default' : 'secondary'}>{tier.can_sell ? 'Puede vender' : 'Solo compra'}</Badge>
                    <div className="space-y-2">
                      {(tier.features || []).map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transacciones y comisiones</CardTitle>
                <CardDescription>Vista de compras, escrow y splits creador/asociacion/ROVI.</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-medium">Aun no hay transacciones</p>
                    <p className="text-sm text-muted-foreground">Compra un item demo para ver el split de comisiones.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold">{listingTypeLabels[transaction.listing_type] || transaction.listing_type}</p>
                            <p className="text-sm text-muted-foreground">{transaction.status} · {new Date(transaction.created_at).toLocaleDateString('es-MX')}</p>
                          </div>
                          <p className="text-lg font-bold">{formatCurrency(transaction.gross_amount_mxn)}</p>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-3">
                          {(transaction.commission_splits || []).map((split) => (
                            <div key={`${transaction.id}-${split.recipient_type}`} className="rounded-md bg-muted/40 p-3 text-sm">
                              <p className="text-muted-foreground">{split.recipient_type}</p>
                              <p className="font-semibold">{formatCurrency(split.amount_mxn)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {strategy && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Narrativa de cierre</CardTitle>
              <CardDescription>{strategy.positioning}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {(strategy.revenue_streams || []).map((stream) => (
                <div key={stream} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <Sparkles className="mb-2 h-4 w-4 text-primary" />
                  {stream}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

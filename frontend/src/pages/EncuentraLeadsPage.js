import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Search, Loader2, Sparkles, Save, CheckCircle, XCircle, Clock } from 'lucide-react';

const CANALES = [
  { value: 'linkedin', label: 'LinkedIn Profiles' },
  { value: 'meta', label: 'Meta/Facebook Pages' }
];

const TEMPLATES_BUSQUEDA = [
  {
    nombre: 'Desarrollos Inmobiliarios Riviera Maya',
    canal: 'linkedin',
    keywords: 'real estate developer, real estate investor, propiedades, inversión inmobiliaria',
    ubicacion: 'Mexico, Cancun, Playa del Carmen, Tulum',
    rol: 'CEO, Founder, Owner, Developer'
  },
  {
    nombre: 'Restaurantes en Tulum',
    canal: 'linkedin',
    keywords: 'restaurante, restaurant owner, chef, food business',
    ubicacion: 'Tulum, Mexico',
    rol: 'Owner, Manager, Chef'
  },
  {
    nombre: 'Agentes Inmobiliarios',
    canal: 'linkedin',
    keywords: 'real estate agent, broker, inmobiliaria',
    ubicacion: 'Mexico',
    rol: 'Realtor, Agent, Broker'
  }
];

export const EncuentraLeadsPage = () => {
  const { api } = useAuth();
  const [step, setStep] = useState('config'); // config | running | results
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Configuración
  const [config, setConfig] = useState({
    canal: 'linkedin',
    keywords: '',
    ubicacion: '',
    rol: ''
  });

  const [polling, setPolling] = useState(false);

  // Aplicar template
  const applyTemplate = (template) => {
    setSelectedTemplate(template.nombre);
    setConfig({
      canal: template.canal,
      keywords: template.keywords,
      ubicacion: template.ubicacion,
      rol: template.rol
    });
  };

  // Iniciar búsqueda
  const startSearch = async () => {
    if (!config.keywords.trim()) {
      toast.error('Ingresa palabras clave para la búsqueda');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/scraper/run', {
        actor_id: config.canal === 'linkedin' ? 'apify/linkedin-profile-scraper' : 'apify/facebook-pages-scraper',
        search: config.keywords,
        location: config.ubicacion,
        jobTitle: config.rol
      });

      setCurrentJob(response.data);
      setStep('running');
      startPolling(response.data.job_id);
      toast.success('Búsqueda iniciada');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar búsqueda');
    } finally {
      setLoading(false);
    }
  };

  // Polling del job
  const startPolling = (jobId) => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const statusRes = await api.get(`/scraper/jobs/${jobId}`);
        const job = statusRes.data;

        if (job.status === 'completed') {
          clearInterval(interval);
          setPolling(false);
          fetchResults(jobId);
          setStep('results');
          toast.success('Búsqueda completada');
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          toast.error(job.error_message || 'Error en la búsqueda');
        }
      } catch (error) {
        clearInterval(interval);
        setPolling(false);
        toast.error('Error verificando estado');
      }
    }, 5000);
  };

  // Obtener resultados
  const fetchResults = async (jobId) => {
    try {
      const res = await api.get(`/scraper/jobs/${jobId}/results`);
      setResults(res.data);
    } catch (error) {
      toast.error('Error obteniendo resultados');
    }
  };

  // Guardar lead en pipeline
  const saveLead = async (scrapedLead) => {
    try {
      await api.post(`/scraper/leads/${scrapedLead.id}/save`);
      setResults(results.map(r =>
        r.id === scrapedLead.id ? { ...r, saved_to_pipeline: true } : r
      ));
      toast.success('Lead guardado en pipeline');
    } catch (error) {
      toast.error('Error guardando lead');
    }
  };

  // Renderizar configuración
  const renderConfig = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Configura tu búsqueda</h2>
        <p className="text-muted-foreground">Busca prospectos en LinkedIn o Meta y analiza su potencial con IA</p>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Alta Conversión</CardTitle>
          <CardDescription>Usa búsquedas probadas para el mercado inmobiliario</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES_BUSQUEDA.map((template) => (
            <Button
              key={template.nombre}
              variant={selectedTemplate === template.nombre ? 'default' : 'outline'}
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => applyTemplate(template)}
            >
              <span className="font-semibold">{template.nombre}</span>
              <span className="text-xs text-muted-foreground mt-1">{template.canal}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Canal</Label>
            <Select value={config.canal} onValueChange={(v) => setConfig({ ...config, canal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CANALES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Palabras Clave</Label>
            <Input
              placeholder="ej: real estate, developer, inversionista"
              value={config.keywords}
              onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
            />
          </div>

          <div>
            <Label>Ubicación</Label>
            <Input
              placeholder="ej: Tulum, Mexico"
              value={config.ubicacion}
              onChange={(e) => setConfig({ ...config, ubicacion: e.target.value })}
            />
          </div>

          <div>
            <Label>Rol / Puesto</Label>
            <Input
              placeholder="ej: CEO, Owner, Developer"
              value={config.rol}
              onChange={(e) => setConfig({ ...config, rol: e.target.value })}
            />
          </div>

          <Button onClick={startSearch} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Iniciar Búsqueda
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Renderizar ejecutándose
  const renderRunning = () => (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
      <div>
        <h2 className="text-2xl font-bold">Buscando prospectos...</h2>
        <p className="text-muted-foreground">Esto puede tomar unos minutos</p>
      </div>
    </div>
  );

  // Renderizar resultados
  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resultados Encontrados</h2>
          <p className="text-muted-foreground">{results.length} prospectos analizados</p>
        </div>
        <Button variant="outline" onClick={() => setStep('config')}>
          Nueva Búsqueda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((lead) => (
          <Card key={lead.id} className={lead.saved_to_pipeline ? 'border-green-500' : ''}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  {lead.photo_url ? (
                    <img src={lead.photo_url} alt={lead.name} />
                  ) : (
                    <AvatarFallback>{lead.name?.charAt(0) || '?'}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{lead.name || 'Sin nombre'}</CardTitle>
                  {lead.position && <p className="text-sm text-muted-foreground truncate">{lead.position}</p>}
                  {lead.company && <p className="text-sm text-muted-foreground truncate">{lead.company}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Score de potencial */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Potencial</span>
                <Badge variant={lead.potential_score >= 70 ? 'default' : lead.potential_score >= 50 ? 'secondary' : 'outline'}>
                  {lead.potential_score}/100
                </Badge>
              </div>

              {lead.potential_reason && (
                <p className="text-sm text-muted-foreground">{lead.potential_reason}</p>
              )}

              <div className="flex gap-2 flex-wrap">
                {lead.email && <span className="text-xs bg-muted px-2 py-1 rounded">{lead.email}</span>}
                {lead.phone && <span className="text-xs bg-muted px-2 py-1 rounded">{lead.phone}</span>}
              </div>

              <Button
                onClick={() => saveLead(lead)}
                disabled={lead.saved_to_pipeline}
                className="w-full"
              >
                {lead.saved_to_pipeline ? (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Guardado</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Guardar en Pipeline</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {step === 'config' && renderConfig()}
      {step === 'running' && renderRunning()}
      {step === 'results' && renderResults()}
    </div>
  );
};

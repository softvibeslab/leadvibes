import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, Filter, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { CopimPageHeader } from '../components/copim/CopimModulePrimitives';

export const CopimAssociationPropertiesPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const loadProperties = async () => {
      try {
        const response = await api.get('/copim/local-association/properties');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading local inventory:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar el inventario');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProperties();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const filteredProperties = useMemo(() => {
    const rows = data?.properties || [];
    return rows.filter((item) => {
      const matchesSearch = !search || [item.title, item.city, item.specialty, item.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-80 w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = data.stats || {};
  const association = data.association || {};

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Asociacion local"
        title="Inventario y oportunidades"
        description={`Vista editorial para ${association.name || 'el capitulo'} con inventario referencial, oportunidades visibles y lectura rapida de lo que se puede difundir.`}
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/campaigns')}>
              Abrir campanas
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
              Ver socios visibles
            </Button>
          </>
        )}
        stats={[
          { label: 'Inventario visible', value: stats.properties_total || 0, helper: 'Items compartidos en red local' },
          { label: 'Vistas acumuladas', value: stats.views_total || 0, helper: 'Interes aproximado del mes' },
          { label: 'Activos', value: stats.active_total || 0, helper: 'Listos para difusion' },
        ]}
      />

      <Card className="border-border/70 bg-card/95">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-3xl border border-border/70 bg-muted/20 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ciudad, tipo o especialidad"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'activa', 'publicada', 'en difusión'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setStatusFilter(status)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {status === 'all' ? 'Todos' : status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden border-border/70 bg-card/95">
            <div className="relative h-52 overflow-hidden">
              <img src={property.image_url} alt={property.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent" />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                <Badge className="rounded-full bg-white/12 text-white backdrop-blur">{property.type}</Badge>
                <Badge className="rounded-full bg-slate-950/55 text-white">{property.status}</Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-lg font-semibold text-white">{property.title}</p>
                <p className="mt-1 text-sm text-white/74">{property.city} · {property.price_label}</p>
              </div>
            </div>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm leading-7 text-muted-foreground">{property.summary}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vistas</p>
                  <p className="mt-2 text-xl font-semibold">{property.views}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Especialidad</p>
                  <p className="mt-2 text-sm font-medium">{property.specialty}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Red local</p>
                  <p className="mt-2 text-sm font-medium">{association.city || association.state}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/campaigns')}>
                  Difundir
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/members')}>
                  Ver socios
                </Button>
                <Button className="rounded-full" onClick={() => navigate('/copim/events')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Cruzar con agenda
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filteredProperties.length ? (
        <Card className="border-dashed border-border/70 bg-card/70">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="text-lg font-semibold">No encontramos oportunidades con ese filtro</p>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Ajusta la busqueda o cambia de estatus para volver a una lectura operativa mas amplia del inventario del capitulo.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/95">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-4 w-4" />
              <p className="font-medium text-foreground">Inventario vivo</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">La asociacion local puede usar esta vista para visibilizar oportunidades sin convertir el MVP en CRM pesado.</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-cyan-600">
              <Search className="h-4 w-4" />
              <p className="font-medium text-foreground">Lectura clara</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Filtros minimos y cards visuales para revisar rapido que puede difundirse o compartir con la red.</p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Eye className="h-4 w-4" />
              <p className="font-medium text-foreground">Conector comercial</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">El siguiente paso natural es conectarlo con campañas y eventos del capitulo, sin salir del flujo COPIM.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

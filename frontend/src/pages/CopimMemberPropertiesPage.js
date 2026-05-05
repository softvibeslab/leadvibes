import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Eye, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { CopimEmptyState, CopimPageHeader } from '../components/copim/CopimModulePrimitives';

const statusTone = {
  active: 'bg-emerald-100 text-emerald-900',
  featured: 'bg-cyan-100 text-cyan-900',
  new: 'bg-amber-100 text-amber-900',
};

export const CopimMemberPropertiesPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProperties = async () => {
      try {
        const response = await api.get('/copim/member-portal/properties');
        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Error loading member properties:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar tu inventario');
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

  const properties = useMemo(() => {
    const list = data?.properties || [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return list;
    }
    return list.filter((property) => (
      [property.title, property.type, property.location, property.summary]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    ));
  }, [data?.properties, search]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const summary = data.summary || {};

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mi inventario"
        description="Una lectura clara de tu catálogo visible para compartir contexto comercial, ubicación, ticket y tipo de oportunidad."
        actions={(
          <div className="relative w-full min-w-[280px] xl:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por zona, tipo o título"
              className="pl-9"
            />
          </div>
        )}
        stats={[
          { label: 'Activas', value: summary.active_count || 0, helper: 'Piezas visibles' },
          { label: 'Vistas', value: summary.views_this_month || 0, helper: 'Actividad del mes' },
          { label: 'Destacadas', value: summary.featured_count || 0, helper: 'Con mayor visibilidad' },
          { label: 'Filtro', value: properties.length, helper: 'Resultados mostrados' },
        ]}
      />

      {properties.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden border-border/70 bg-card/95">
              <div
                className="h-48 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.72)), url(${property.image_url})`,
                }}
              />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{property.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{property.type}</p>
                  </div>
                  <Badge className={`rounded-full capitalize ${statusTone[property.status] || 'bg-slate-100 text-slate-900'}`}>
                    {property.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{(property.specs || []).join(' · ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{property.views_this_month || 0} vistas este mes</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Precio</p>
                  <p className="mt-2 text-2xl font-semibold">{property.price_label}</p>
                </div>

                <p className="text-sm leading-7 text-muted-foreground">{property.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <CopimEmptyState
          icon={Building2}
          title="No encontramos propiedades con ese filtro"
          description="Ajusta tu búsqueda para volver a ver tu inventario personal y sus piezas destacadas."
        />
      )}
    </div>
  );
};

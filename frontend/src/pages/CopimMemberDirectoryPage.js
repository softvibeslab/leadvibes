import React, { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Search, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { CopimMemberIdentity, CopimPageHeader } from '../components/copim/CopimModulePrimitives';

export const CopimMemberDirectoryPage = () => {
  const { api } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      try {
        const response = await api.get('/copim/member-portal/directory', {
          params: {
            search: search || undefined,
            city: cityFilter === 'all' ? undefined : cityFilter,
            specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
          },
        });
        if (!cancelled) {
          setMembers(response.data || []);
        }
      } catch (error) {
        console.error('Error loading member directory:', error);
        if (!cancelled) {
          toast.error(error.response?.data?.detail || 'No se pudo cargar el directorio');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadDirectory();
    }, search ? 180 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [api, cityFilter, search, specialtyFilter]);

  const cities = useMemo(() => Array.from(new Set(members.map((member) => member.city).filter(Boolean))).sort(), [members]);
  const specialties = useMemo(() => Array.from(new Set(members.map((member) => member.specialty).filter(Boolean))).sort(), [members]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Directorio de socios"
        description="Encuentra perfiles visibles dentro de la red con una búsqueda ligera por ciudad, especialidad o empresa."
        actions={(
          <>
            <div className="relative w-full min-w-[280px] xl:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, ciudad o empresa" className="pl-9" />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        stats={[
          { label: 'Perfiles visibles', value: members.length, helper: 'Directorio filtrado y activo' },
          { label: 'Ciudades', value: cities.length, helper: 'Cobertura visible' },
          { label: 'Especialidades', value: specialties.length, helper: 'Verticales profesionales' },
          { label: 'Red activa', value: 'COPIM', helper: 'Conexiones institucionales' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="border-border/70 bg-card/95">
            <CardContent className="space-y-4 p-5">
              <CopimMemberIdentity
                name={member.full_name}
                subtitle={member.association_name || 'Asociado COPIM'}
                avatarUrl={member.avatar_url}
                size="lg"
              />

              <div className="flex flex-wrap gap-2">
                {member.specialty ? (
                  <Badge variant="outline" className="rounded-full">
                    {member.specialty}
                  </Badge>
                ) : null}
                {member.membership_tier ? (
                  <Badge className="rounded-full capitalize bg-primary/10 text-primary">
                    {member.membership_tier}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{member.city || 'Sin ciudad visible'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{member.company_name || 'Sin empresa visible'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span>{member.title || 'Perfil profesional COPIM'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!members.length ? (
          <Card className="border-border/70 bg-card/95 xl:col-span-3">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No encontramos perfiles con esos filtros. Ajusta ciudad o especialidad para ver más socios visibles.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Globe,
  MapPin,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import {
  CopimMemberIdentity,
  CopimPageHeader,
  formatCopimCurrency,
  formatCopimDateTime,
  getCopimAvatarDataUri,
} from '../components/copim/CopimModulePrimitives';
import { buildCopimPath } from '../lib/copimRouting';

const associationCover = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80';

const createEmptyForm = () => ({
  name: '',
  tagline: '',
  bio: '',
  mission: '',
  vision: '',
  coverage_zone: '',
  website: '',
  phone: '',
});

export const CopimAssociationProfilePage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const syncForm = (association) => {
    setForm({
      name: association?.name || '',
      tagline: association?.tagline || '',
      bio: association?.bio || '',
      mission: association?.mission || '',
      vision: association?.vision || '',
      coverage_zone: association?.coverage_zone || '',
      website: association?.website || '',
      phone: association?.phone || '',
    });
  };

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get('/copim/local-association/profile');
      setData(response.data);
      syncForm(response.data?.association);
    } catch (error) {
      console.error('Error loading local association profile:', error);
      toast.error(error.response?.data?.detail || 'No se pudo cargar la vista de asociacion');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!data?.association?.id) {
      return;
    }
    setSaving(true);
    try {
      await api.put(`/copim/associations/${data.association.id}`, form);
      toast.success('Perfil institucional actualizado');
      setEditOpen(false);
      await loadProfile();
    } catch (error) {
      console.error('Error updating local association profile:', error);
      toast.error(error.response?.data?.detail || 'No se pudo actualizar la asociacion');
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-44 w-full rounded-[28px]" />
        <Skeleton className="h-96 w-full rounded-[28px]" />
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-72 w-full rounded-[28px]" />
          <Skeleton className="h-72 w-full rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const association = data.association || {};
  const stats = data.stats || {};
  const upcomingEvents = data.upcoming_events || [];
  const featuredMembers = data.featured_members || [];
  const renewalWatchlist = data.renewal_watchlist || [];
  const otherAssociations = data.other_associations || [];
  const modulePreview = data.module_preview || {};
  const campaignPreview = data.campaign_preview || [];
  const propertyPreview = data.property_preview || [];
  const coursePreview = data.course_preview || [];
  const logoUrl = association.logo_url || getCopimAvatarDataUri(association.name);

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Asociacion local"
        title={association.name || 'Workspace del capitulo'}
        description={association.tagline || 'Cabina operativa para padrón, renovaciones, cobros, agenda y activacion del capitulo.'}
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={() => navigate(buildCopimPath('/copim/members', { member_status: 'pending' }))}>
              <Users className="mr-2 h-4 w-4" />
              Aprobar socios
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate(buildCopimPath('/copim/members', { directory_visible: true }))}>
              Abrir directorio
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate(buildCopimPath('/copim/invoices', { payment: 'pending' }))}>
              <WalletCards className="mr-2 h-4 w-4" />
              Cobrar pendientes
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/events')}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Abrir agenda
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => scrollToSection('copim-network-section')}>
              Ver otras asociaciones
            </Button>
            <Button className="rounded-full" onClick={() => setEditOpen(true)}>
              <PencilLine className="mr-2 h-4 w-4" />
              Editar perfil
            </Button>
          </>
        )}
        stats={[
          { label: 'Socios activos', value: stats.active_members || 0, helper: `${stats.pending_members || 0} por aprobar` },
          { label: 'Renovaciones', value: stats.renewals_due || 0, helper: 'Socios por cobrar o regularizar' },
          { label: 'Cobranza visible', value: formatCopimCurrency(stats.revenue_due || 0), helper: 'Saldo operativo del capitulo' },
          { label: 'Agenda del capitulo', value: association.annual_events_count || upcomingEvents.length || 0, helper: `${stats.upcoming_events || 0} eventos por venir` },
          { label: 'Scoring nacional', value: association.national_score || 0, helper: association.national_badge || 'Capitulo en seguimiento' },
        ]}
      />

      <Card className="overflow-hidden border-border/70 bg-card/95">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <img src={logoUrl} alt={association.name} className="h-20 w-20 rounded-[24px] border border-border/70 object-cover shadow-sm" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-semibold tracking-tight">{association.name}</h2>
                    <Badge className="rounded-full bg-emerald-100 text-emerald-900">
                      {association.status === 'active' ? 'Activa' : association.status || 'Onboarding'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{association.tagline || 'Capitulo afiliado a COPIM'}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{association.coverage_zone || 'Cobertura institucional'}</p>
                <p className="mt-1">{association.city || association.state || 'Sin ciudad'} · Meta {association.member_goal || 0} socios</p>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {association.bio || 'La asociacion concentra operacion, validacion, membresias, directorio y agenda en una sola experiencia para el equipo local.'}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mision</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{association.mission || 'Profesionalizar, ordenar y acelerar la operacion del capitulo.'}</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Vision</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{association.vision || 'Volver la membresia visible, activa y mas valiosa para el socio.'}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{association.city || 'Sin ciudad'} · {association.state || 'Sin estado'}</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="truncate text-sm">{association.website || 'Sin sitio publico'}</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{association.phone || 'Sin telefono operativo'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden border-t border-border/70 lg:border-l lg:border-t-0">
            <img src={associationCover} alt="Cabina institucional" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/55 to-cyan-950/80" />
            <div className="relative flex h-full flex-col justify-between p-6 text-white">
              <div className="space-y-3">
                <Badge className="w-fit rounded-full bg-white/12 text-white backdrop-blur">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Perfil institucional vivo
                </Badge>
                <h3 className="text-2xl font-semibold">La asociacion opera y vende mejor cuando la membresia se siente activa</h3>
                <p className="max-w-md text-sm leading-7 text-white/74">
                  Esta vista mezcla identidad del capitulo con pendientes operativos para que presidencia y administracion sepan que mover primero.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Cursos activos</p>
                  <p className="mt-2 text-2xl font-semibold">{association.active_courses_count || coursePreview.length || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Modulos premium</p>
                  <p className="mt-2 text-2xl font-semibold">{modulePreview.stats?.premium_members || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card id="copim-network-section" className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
              <CardTitle>Directiva y reconocimientos</CardTitle>
              <CardDescription>Lo institucional y lo operativo conviven en la misma cabina local.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {(association.leadership_team || []).map((leader) => (
                  <div key={`${leader.name}-${leader.role}`} className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                    <CopimMemberIdentity
                      name={leader.name}
                      subtitle={`${leader.role || 'Equipo'} · ${leader.period || 'Actual'}`}
                      avatarUrl={leader.avatar_url}
                    />
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{leader.highlight || 'Coordina la operacion del capitulo.'}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(association.achievements || []).map((achievement) => (
                  <div key={`${achievement.label}-${achievement.detail}`} className="rounded-3xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="font-medium text-foreground">{achievement.label}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{achievement.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Agenda y casos a mover</CardTitle>
                  <CardDescription>Eventos proximos y renovaciones visibles desde el perfil local.</CardDescription>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/events')}>
                  Ver agenda completa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3">
                {upcomingEvents.length ? upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatCopimDateTime(event.start_at)} · {event.venue || 'Sin sede'}</p>
                      </div>
                      <Badge className="rounded-full bg-cyan-100 text-cyan-900">{event.status || 'Publicado'}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{event.registered_count || 0} registrados</span>
                      <Button variant="ghost" size="sm" className="rounded-full px-2" onClick={() => navigate(buildCopimPath('/copim/events', { focus: event.id }))}>
                        Abrir
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-3xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                    No hay eventos cargados para esta asociacion.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {renewalWatchlist.length ? renewalWatchlist.map((membership) => (
                  <div key={membership.id} className="rounded-3xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{membership.member_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{membership.plan_name} · vence {membership.renewal_date ? new Date(membership.renewal_date).toLocaleDateString('es-MX') : 'sin fecha'}</p>
                      </div>
                      <Badge className="rounded-full bg-amber-100 text-amber-900">{membership.payment_status || 'Pendiente'}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatCopimCurrency(membership.balance_due || 0)} pendientes</span>
                      <Button variant="ghost" size="sm" className="rounded-full px-2" onClick={() => navigate(buildCopimPath('/copim/memberships', { focus: membership.id }))}>
                        Cobrar
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-3xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                    No hay renovaciones prioritarias para este capitulo.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
              <CardTitle>Asociaciones visibles en la red</CardTitle>
              <CardDescription>Referencia rapida de otros capitulos sin romper el foco local.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {otherAssociations.map((item) => (
                <div key={item.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.city || item.state} · score {item.national_score || 0}</p>
                    </div>
                    <Badge className="rounded-full bg-slate-100 text-slate-900">{item.national_badge || 'Visible'}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
              <CardTitle>Socios destacados del capitulo</CardTitle>
              <CardDescription>Vista rapida del padrón visible y sus perfiles con mayor valor operativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredMembers.map((member) => (
                <div key={member.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <CopimMemberIdentity
                    name={member.full_name}
                    subtitle={`${member.specialty || 'Sin especialidad'} · ${member.city || 'Sin ciudad'}`}
                    avatarUrl={member.avatar_url}
                    size="lg"
                  />
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{member.directory_visible ? 'Visible en directorio' : 'No visible en directorio'}</span>
                    <Button variant="ghost" size="sm" className="rounded-full px-2" onClick={() => navigate(buildCopimPath('/copim/members', { focus: member.id }))}>
                      Abrir ficha
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
              <CardTitle>Modulos listos para activar valor</CardTitle>
              <CardDescription>Un vistazo rapido a monetizacion, campañas e inventario del capitulo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Campanas</p>
                  <p className="mt-2 text-2xl font-semibold">{campaignPreview.length}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Inventario</p>
                  <p className="mt-2 text-2xl font-semibold">{propertyPreview.length}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Revenue share</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCopimCurrency(modulePreview.stats?.revenue_share_mxn || 0)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/campaigns')}>Abrir campanas</Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/properties')}>Abrir inventario</Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/copim/association/modules')}>Ver revenue share</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar perfil institucional</DialogTitle>
            <DialogDescription>
              Ajusta los datos visibles del capitulo sin salir del workspace operativo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nombre</p>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Tagline</p>
              <Input value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium">Bio</p>
              <Textarea rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Mision</p>
              <Textarea rows={4} value={form.mission} onChange={(event) => setForm((current) => ({ ...current, mission: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Vision</p>
              <Textarea rows={4} value={form.vision} onChange={(event) => setForm((current) => ({ ...current, vision: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Cobertura</p>
              <Input value={form.coverage_zone} onChange={(event) => setForm((current) => ({ ...current, coverage_zone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Telefono</p>
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium">Sitio web</p>
              <Input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button className="rounded-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

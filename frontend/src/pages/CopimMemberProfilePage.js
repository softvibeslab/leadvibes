import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Building2,
  Download,
  Globe,
  Languages,
  Mail,
  MapPin,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { CopimMemberIdentity, CopimPageHeader } from '../components/copim/CopimModulePrimitives';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  title: '',
  city: '',
  specialty: '',
  company_name: '',
  avatar_url: '',
  bio: '',
  certifications: '',
  directory_visible: true,
};

const downloadProfileSummary = (member, story, association) => {
  const lines = [
    member?.full_name || 'Perfil COPIM',
    story?.professional_headline || member?.title || '',
    story?.location_label || member?.city || '',
    '',
    'Sobre mi',
    ...(story?.about_paragraphs || []),
    '',
    'Especialidades',
    ...(story?.specialties || []),
    '',
    'Certificaciones',
    ...(story?.certifications || member?.certifications || []),
    '',
    'Asociacion',
    association?.name || 'COPIM',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${(member?.full_name || 'perfil-copim').replace(/\s+/g, '-').toLowerCase()}.txt`;
  link.click();
  URL.revokeObjectURL(href);
};

export const CopimMemberProfilePage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get('/copim/member-portal/profile');
      const nextData = response.data;
      setData(nextData);
      const member = nextData?.member || {};
      setForm({
        full_name: member.full_name || '',
        phone: member.phone || '',
        title: member.title || '',
        city: member.city || '',
        specialty: member.specialty || '',
        company_name: member.company_name || '',
        avatar_url: member.avatar_url || '',
        bio: member.bio || '',
        certifications: Array.isArray(member.certifications) ? member.certifications.join(', ') : '',
        directory_visible: member.directory_visible !== false,
      });
    } catch (error) {
      console.error('Error loading member profile:', error);
      toast.error(error.response?.data?.detail || 'No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const profileCompletion = useMemo(() => data?.stats?.profile_completion || 0, [data]);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Tu nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      await api.put('/copim/member-portal/profile', {
        ...form,
        avatar_url: form.avatar_url || null,
        certifications: form.certifications
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success('Perfil actualizado');
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar tu perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareLabel = `${form.full_name || data?.member?.full_name || 'Perfil COPIM'} · ${data?.profile_story?.professional_headline || ''}`;
    try {
      await navigator.clipboard.writeText(shareLabel.trim());
      toast.success('Resumen de perfil copiado');
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('No se pudo copiar el resumen del perfil');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[760px] w-full rounded-[28px]" />
      </div>
    );
  }

  const member = data?.member || {};
  const association = data?.association;
  const story = data?.profile_story || {};
  const metrics = story.metrics || {};

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Mi perfil profesional"
        description="Una ficha viva para visibilidad, networking y reputación dentro de COPIM, sin perder una edición simple del perfil base."
        actions={(
          <>
            <Button variant="outline" className="rounded-full" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir perfil
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => downloadProfileSummary(member, story, association)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar perfil
            </Button>
            <Button className="rounded-full" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </>
        )}
        stats={[
          { label: 'Completitud', value: `${profileCompletion}%`, helper: 'Perfil visible y capturable' },
          { label: 'Puntos', value: metrics.points || 0, helper: 'Actividad y reputación' },
          { label: 'Conexiones', value: metrics.connections || 0, helper: 'Red profesional visible' },
          { label: 'Ranking', value: metrics.ranking || 'Sin ranking', helper: association?.name || 'COPIM' },
        ]}
      />

      <Card className="overflow-hidden border-border/70 bg-card/95">
        <div
          className="relative min-h-[320px] border-b border-border/70 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.45), rgba(14, 116, 144, 0.68)), url(${story.cover_image_url})`,
          }}
        >
          <div className="flex h-full min-h-[320px] flex-col justify-end p-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-white/12 text-white">{association?.name || 'COPIM'}</Badge>
              <Badge className="rounded-full bg-white/12 text-white">{member.membership_tier || 'base'}</Badge>
              <Badge className="rounded-full bg-white/12 text-white">{member.member_status || 'pending'}</Badge>
            </div>
            <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-4">
                <CopimMemberIdentity
                  name={form.full_name || member.full_name}
                  subtitle={story.professional_headline || form.title || member.title}
                  avatarUrl={form.avatar_url || member.avatar_url}
                  size="lg"
                  className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm"
                  textClassName="text-white"
                  subtitleClassName="text-white/70"
                />
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {story.location_label || 'Sin ubicación'}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {form.company_name || member.company_name || 'Empresa no visible'}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                </div>
              </div>

              <div className="grid min-w-full gap-3 sm:grid-cols-2 xl:min-w-[460px] xl:grid-cols-3">
                <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Recomendaciones</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.recommendations || 0}</p>
                </div>
                <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Cursos</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.courses || 0}</p>
                </div>
                <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Visibilidad</p>
                  <p className="mt-2 text-2xl font-semibold">{form.directory_visible ? 'Activa' : 'Privada'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Sobre mí</p>
                <h2 className="mt-2 text-2xl font-semibold">Narrativa profesional visible</h2>
              </div>
              <div className="space-y-4 text-sm leading-8 text-muted-foreground">
                {(story.about_paragraphs || []).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(story.specialties || []).map((item) => (
                  <Badge key={item} variant="outline" className="rounded-full">
                    {item}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Languages className="h-4 w-4 text-primary" />
                    Idiomas
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{(story.languages || []).join(' · ') || 'Sin idiomas cargados'}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Experiencia
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{story.years_experience || 0} años en operación profesional</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Experiencia</p>
                <h2 className="mt-2 text-2xl font-semibold">Trayectoria y participación</h2>
              </div>
              <div className="space-y-4">
                {(story.experience_items || []).map((item) => (
                  <div key={`${item.company}-${item.role}`} className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.role}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.company}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">{item.period}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.highlight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Educación y certificaciones</p>
                <h2 className="mt-2 text-2xl font-semibold">Base formativa</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(story.education_items || []).map((item) => (
                  <div key={`${item.title}-${item.period}`} className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.institution}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.period}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {(story.certifications || []).map((item) => (
                  <Badge key={item} className="rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Portafolio</p>
                <h2 className="mt-2 text-2xl font-semibold">Inventario destacado</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(story.portfolio_items || []).map((item) => (
                  <div key={item.id || item.title} className="overflow-hidden rounded-[26px] border border-border/70 bg-background/80">
                    <div
                      className="h-36 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.72)), url(${item.image_url})`,
                      }}
                    />
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.type}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                      <p className="text-sm text-muted-foreground">{(item.specs || []).join(' · ')}</p>
                      <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-3 text-sm font-medium">
                        {item.price_label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Testimonios</p>
                <h2 className="mt-2 text-2xl font-semibold">Percepción y confianza</h2>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {(story.testimonials || []).map((item) => (
                  <div key={`${item.name}-${item.date_label}`} className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.role}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: item.rating || 5 }).map((_, index) => (
                          <Star key={`${item.name}-${index}`} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.content}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.date_label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Logros y visibilidad</p>
                <h2 className="mt-2 text-2xl font-semibold">Qué hace fuerte tu perfil</h2>
              </div>
              <div className="space-y-4">
                {(story.recognitions || []).map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Award className="h-4 w-4 text-primary" />
                      {item.label}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Configuración básica</p>
                <h2 className="mt-2 text-2xl font-semibold">Editar datos visibles</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Título profesional</Label>
                  <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Especialidad</Label>
                  <Input value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input value={form.company_name} onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto o avatar (URL)</Label>
                <div className="relative">
                  <Input value={form.avatar_url} onChange={(event) => setForm((current) => ({ ...current, avatar_url: event.target.value }))} />
                  <Globe className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificaciones</Label>
                <Input
                  value={form.certifications}
                  onChange={(event) => setForm((current) => ({ ...current, certifications: event.target.value }))}
                  placeholder="Ej. Certificación COPIM, Taller comercial, Reputación digital"
                />
              </div>

              <div className="space-y-2">
                <Label>Resumen profesional</Label>
                <Textarea
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  rows={6}
                  placeholder="Resume cómo colaboras, qué especialidad te define y qué quieres que vea la red."
                />
              </div>

              <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Mostrarme en directorio</p>
                    <p className="mt-1 text-sm text-muted-foreground">Permite que otros socios encuentren tu perfil profesional y tu especialidad.</p>
                  </div>
                  <Switch
                    checked={form.directory_visible}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, directory_visible: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

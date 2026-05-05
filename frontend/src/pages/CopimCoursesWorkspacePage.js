import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  BookOpen,
  Clock3,
  Copy,
  Eye,
  FileUp,
  GraduationCap,
  Layers3,
  Pencil,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { isCopimLocalAssociationUser } from '../lib/copimAccess';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { CopimPageHeader, formatCopimCurrency } from '../components/copim/CopimModulePrimitives';

const COURSE_STATUS_LABELS = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
};

const COURSE_STATUS_TONES = {
  draft: 'bg-amber-100 text-amber-900',
  published: 'bg-emerald-100 text-emerald-900',
  archived: 'bg-slate-200 text-slate-900',
};

const PRICING_TONES = {
  free: 'bg-cyan-100 text-cyan-900',
  premium: 'bg-fuchsia-100 text-fuchsia-900',
};

const WORKSPACE_TONES = {
  Nacional: 'bg-primary/10 text-primary',
  'Asociación': 'bg-emerald-100 text-emerald-900',
};

const emptyLesson = () => ({
  id: undefined,
  title: '',
  description: '',
  duration_minutes: 12,
  lesson_type: 'video',
  video_source: 'youtube',
  video_url: '',
  transcript: '',
  subtitle_text: '',
  notes: '',
  is_preview: false,
  resources: [],
});

const emptyModule = () => ({
  id: undefined,
  title: '',
  description: '',
  lessons: [emptyLesson()],
});

const emptyInstructor = () => ({
  id: undefined,
  name: '',
  role: '',
  bio: '',
  avatar_url: '',
});

const createEmptyCourseForm = (scope = 'national') => ({
  scope,
  title: '',
  subtitle: '',
  summary: '',
  description: '',
  category: 'Capacitacion',
  modality: 'Video on demand',
  audience: 'socios',
  visibility: 'members',
  status: 'draft',
  cover_image_url: '',
  hero_image_url: '',
  pricing_type: 'free',
  price_amount: 0,
  marketplace_enabled: false,
  certificate_enabled: false,
  certificate_title: '',
  tags_text: '',
  learning_objectives_text: '',
  onboarding_notes: '',
  estimated_minutes: 0,
  language: 'es-MX',
  instructors: [emptyInstructor()],
  modules: [emptyModule()],
  materials: [],
});

const toTextList = (value) => (Array.isArray(value) ? value.join('\n') : '');

const normalizeCourseForForm = (course, fallbackScope = 'national') => ({
  scope: course?.scope || fallbackScope,
  title: course?.title || '',
  subtitle: course?.subtitle || '',
  summary: course?.summary || '',
  description: course?.description || '',
  category: course?.category || 'Capacitacion',
  modality: course?.modality || 'Video on demand',
  audience: course?.audience || 'socios',
  visibility: course?.visibility || 'members',
  status: course?.status || 'draft',
  cover_image_url: course?.cover_image_url || '',
  hero_image_url: course?.hero_image_url || '',
  pricing_type: course?.pricing_type || 'free',
  price_amount: Number(course?.price_amount || 0),
  marketplace_enabled: Boolean(course?.marketplace_enabled),
  certificate_enabled: Boolean(course?.certificate_enabled),
  certificate_title: course?.certificate_title || '',
  tags_text: Array.isArray(course?.tags) ? course.tags.join(', ') : '',
  learning_objectives_text: toTextList(course?.learning_objectives),
  onboarding_notes: course?.onboarding_notes || '',
  estimated_minutes: Number(course?.estimated_minutes || 0),
  language: course?.language || 'es-MX',
  instructors: Array.isArray(course?.instructors) && course.instructors.length ? course.instructors : [emptyInstructor()],
  modules: Array.isArray(course?.modules) && course.modules.length ? course.modules : [emptyModule()],
  materials: Array.isArray(course?.materials) ? course.materials : [],
});

const formToPayload = (form) => ({
  scope: form.scope,
  title: form.title.trim(),
  subtitle: form.subtitle.trim() || null,
  summary: form.summary.trim() || null,
  description: form.description.trim() || null,
  category: form.category,
  modality: form.modality,
  audience: form.audience,
  visibility: form.visibility,
  status: form.status,
  cover_image_url: form.cover_image_url.trim() || null,
  hero_image_url: form.hero_image_url.trim() || null,
  pricing_type: form.pricing_type,
  price_amount: Number(form.price_amount || 0),
  marketplace_enabled: Boolean(form.marketplace_enabled),
  certificate_enabled: Boolean(form.certificate_enabled),
  certificate_title: form.certificate_title.trim() || null,
  tags: form.tags_text.split(',').map((item) => item.trim()).filter(Boolean),
  learning_objectives: form.learning_objectives_text.split('\n').map((item) => item.trim()).filter(Boolean),
  onboarding_notes: form.onboarding_notes.trim() || null,
  estimated_minutes: Number(form.estimated_minutes || 0),
  language: form.language || 'es-MX',
  instructors: form.instructors
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name.trim(),
      role: item.role?.trim() || null,
      bio: item.bio?.trim() || null,
      avatar_url: item.avatar_url?.trim() || null,
    })),
  modules: form.modules
    .filter((module) => module.title?.trim())
    .map((module) => ({
      title: module.title.trim(),
      description: module.description?.trim() || null,
      lessons: (module.lessons || [])
        .filter((lesson) => lesson.title?.trim())
        .map((lesson) => ({
          title: lesson.title.trim(),
          description: lesson.description?.trim() || null,
          duration_minutes: Number(lesson.duration_minutes || 0),
          lesson_type: lesson.lesson_type,
          video_source: lesson.video_source || null,
          video_url: lesson.video_url?.trim() || null,
          transcript: lesson.transcript?.trim() || null,
          subtitle_text: lesson.subtitle_text?.trim() || null,
          notes: lesson.notes?.trim() || null,
          is_preview: Boolean(lesson.is_preview),
          resources: Array.isArray(lesson.resources) ? lesson.resources : [],
        })),
    })),
  materials: Array.isArray(form.materials) ? form.materials : [],
});

const formatDurationLabel = (minutes) => {
  const total = Number(minutes || 0);
  if (!total) return 'Sin duración';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const getYouTubeEmbedUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`;
    }
    if (url.hostname.includes('youtube.com')) {
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
};

const COURSE_WIZARD_STEPS = [
  {
    label: 'Base',
    description: 'Define nombre, promesa y visuales principales del curso.',
    helper: 'Piensa en esto como la ficha comercial y académica que verá primero el socio.',
    bullets: ['Título claro', 'Resumen corto', 'Categoría y modalidad', 'Cover y hero'],
    icon: BookOpen,
  },
  {
    label: 'Audiencia',
    description: 'Aterriza para quién es, cómo se publica y cómo se monetiza.',
    helper: 'Aquí decides si el curso vive como catálogo interno, premium o visible al marketplace.',
    bullets: ['Audiencia', 'Visibilidad', 'Pricing', 'Objetivos de aprendizaje'],
    icon: Users,
  },
  {
    label: 'Contenido',
    description: 'Construye la experiencia de aprendizaje con módulos y lecciones.',
    helper: 'Carga la estructura antes de entrar a detalles finos. El copiloto te puede dar el primer borrador.',
    bullets: ['Módulos', 'Lecciones', 'Duración', 'Transcript y subtítulos'],
    icon: Layers3,
  },
  {
    label: 'Certificación',
    description: 'Completa autores, guía interna y reglas de certificación.',
    helper: 'Esta capa ayuda a operación a publicar con confianza y mantener credibilidad institucional.',
    bullets: ['Certificado', 'Notas internas', 'Instructores', 'Bio visible'],
    icon: ShieldCheck,
  },
  {
    label: 'Revisión',
    description: 'Valida que el curso esté listo para publicar o salir a marketplace.',
    helper: 'Antes de guardar, revisa que la promesa, el contenido y el pricing estén alineados.',
    bullets: ['Checklist', 'Cantidad de módulos', 'Pricing', 'Scope'],
    icon: Rocket,
  },
];

const stepLabels = COURSE_WIZARD_STEPS.map((step) => step.label);

const CourseWizardDialog = ({
  open,
  onOpenChange,
  onSave,
  onGenerateAI,
  form,
  setForm,
  saving,
  generating,
  isLocalWorkspace,
  editingCourse,
}) => {
  const [step, setStep] = useState(0);
  const [copilotPrompt, setCopilotPrompt] = useState('');

  useEffect(() => {
    if (open) {
      setStep(0);
      setCopilotPrompt('');
    }
  }, [open, editingCourse?.id]);

  const canAdvance = form.title.trim().length > 0;
  const totalLessons = form.modules.reduce((acc, item) => acc + (item.lessons?.length || 0), 0);
  const currentStepMeta = COURSE_WIZARD_STEPS[step];
  const CurrentStepIcon = currentStepMeta.icon;
  const progressPercent = Math.round(((step + 1) / COURSE_WIZARD_STEPS.length) * 100);
  const checklist = [
    { label: 'Título del curso', complete: form.title.trim().length > 0 },
    { label: 'Resumen corto', complete: form.summary.trim().length > 0 },
    { label: 'Objetivos de aprendizaje', complete: form.learning_objectives_text.trim().length > 0 },
    { label: 'Módulos con contenido', complete: form.modules.some((module) => module.title?.trim()) },
    { label: 'Instructor visible', complete: form.instructors.some((instructor) => instructor.name?.trim()) },
    { label: 'Pricing claro', complete: form.pricing_type === 'free' || Number(form.price_amount) > 0 },
  ];
  const completedChecklistCount = checklist.filter((item) => item.complete).length;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateInstructor = (index, field, value) => {
    setForm((current) => ({
      ...current,
      instructors: current.instructors.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addInstructor = () => {
    setForm((current) => ({ ...current, instructors: [...current.instructors, emptyInstructor()] }));
  };

  const removeInstructor = (index) => {
    setForm((current) => ({
      ...current,
      instructors: current.instructors.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateModule = (moduleIndex, field, value) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.map((item, itemIndex) => (
        itemIndex === moduleIndex ? { ...item, [field]: value } : item
      )),
    }));
  };

  const updateLesson = (moduleIndex, lessonIndex, field, value) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.map((module, currentModuleIndex) => (
        currentModuleIndex !== moduleIndex
          ? module
          : {
              ...module,
              lessons: module.lessons.map((lesson, currentLessonIndex) => (
                currentLessonIndex === lessonIndex ? { ...lesson, [field]: value } : lesson
              )),
            }
      )),
    }));
  };

  const addModule = () => {
    setForm((current) => ({ ...current, modules: [...current.modules, emptyModule()] }));
  };

  const removeModule = (moduleIndex) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.filter((_, itemIndex) => itemIndex !== moduleIndex),
    }));
  };

  const addLesson = (moduleIndex) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.map((module, itemIndex) => (
        itemIndex === moduleIndex
          ? { ...module, lessons: [...module.lessons, emptyLesson()] }
          : module
      )),
    }));
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.map((module, currentModuleIndex) => (
        currentModuleIndex !== moduleIndex
          ? module
          : {
              ...module,
              lessons: module.lessons.filter((_, currentLessonIndex) => currentLessonIndex !== lessonIndex),
            }
      )),
    }));
  };

  const handleGenerate = async () => {
    const aiDraft = await onGenerateAI({
      title: form.title,
      category: form.category,
      audience: form.audience,
      prompt: copilotPrompt,
      material_titles: (form.materials || []).map((item) => item.title),
      material_text: form.description,
    });
    if (!aiDraft) return;
    setForm((current) => ({
      ...current,
      summary: current.summary || aiDraft.summary || '',
      description: current.description || aiDraft.description || '',
      learning_objectives_text: aiDraft.learning_objectives?.join('\n') || current.learning_objectives_text,
      modules: aiDraft.modules?.length ? aiDraft.modules : current.modules,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(94vh,920px)] w-[min(1120px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-[30px] border-border/70 bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-5 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="space-y-2">
              <DialogTitle>{editingCourse ? 'Editar curso' : 'Nuevo curso'}</DialogTitle>
              <DialogDescription>
                Flujo guiado para crear cursos institucionales simples, visibles y listos para marketplace o trazabilidad interna.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Progreso</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Paso {step + 1} de {COURSE_WIZARD_STEPS.length}</p>
              </div>
              <div className="w-28 shrink-0 space-y-2">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-right text-xs text-muted-foreground">{progressPercent}% completado</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-border/70 px-5 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COURSE_WIZARD_STEPS.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <Button
                  key={item.label}
                  type="button"
                  variant={index === step ? 'default' : 'outline'}
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setStep(index)}
                >
                  <StepIcon className="mr-2 h-4 w-4" />
                  {index + 1}. {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex min-h-0 flex-col">
              <div className="shrink-0 border-b border-border/70 bg-background/30 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CurrentStepIcon className="h-4 w-4 text-primary" />
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Paso actual</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{currentStepMeta.label}</h3>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{currentStepMeta.helper}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                    <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Módulos</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{form.modules.length}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Lecciones</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{totalLessons}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Checklist</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{completedChecklistCount}/{checklist.length}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {currentStepMeta.bullets.map((item) => (
                    <Badge key={item} variant="outline" className="rounded-full border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                      {item}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Ruta de creación</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {currentStepMeta.description}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Checklist rápido</p>
                        <p className="mt-2 text-sm text-muted-foreground">{completedChecklistCount} de {checklist.length} puntos cubiertos</p>
                      </div>
                      <Badge className="rounded-full bg-primary/10 text-primary">
                        {progressPercent}% listo
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-6 pb-6">
                  {step === 0 ? (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <Card className="border-border/70 bg-card/95">
                        <CardHeader>
                          <CardTitle className="text-lg">Identidad del curso</CardTitle>
                          <CardDescription>Define cómo se presenta este curso en catálogo, seguimiento y marketplace.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Título del curso</Label>
                            <Input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Ej. Onboarding COPIM" />
                          </div>
                          <div className="space-y-2">
                            <Label>Subtítulo</Label>
                            <Input value={form.subtitle} onChange={(event) => updateField('subtitle', event.target.value)} placeholder="Promesa corta del curso" />
                          </div>
                          <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select value={form.category} onValueChange={(value) => updateField('category', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Capacitacion">Capacitación</SelectItem>
                                <SelectItem value="Onboarding">Onboarding</SelectItem>
                                <SelectItem value="Certificacion">Certificación</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Modalidad</Label>
                            <Select value={form.modality} onValueChange={(value) => updateField('modality', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Video on demand">Video on demand</SelectItem>
                                <SelectItem value="Blended">Blended</SelectItem>
                                <SelectItem value="Live cohort">Live cohort</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Resumen corto</Label>
                            <Textarea rows={3} value={form.summary} onChange={(event) => updateField('summary', event.target.value)} placeholder="Qué resuelve este curso y por qué existe." />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Descripción larga</Label>
                            <Textarea rows={6} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Narrativa del curso, beneficios y forma de consumo." />
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-5">
                        <Card className="border-border/70 bg-card/95">
                          <CardHeader>
                            <CardTitle className="text-lg">Visuales</CardTitle>
                            <CardDescription>Usa una cover limpia y un hero más editorial para dar contexto al curso.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Imagen cover</Label>
                              <Input value={form.cover_image_url} onChange={(event) => updateField('cover_image_url', event.target.value)} placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                              <Label>Imagen hero</Label>
                              <Input value={form.hero_image_url} onChange={(event) => updateField('hero_image_url', event.target.value)} placeholder="https://..." />
                            </div>

                            <div className="grid gap-3">
                              <div
                                className="relative overflow-hidden rounded-[22px] border border-border/70 bg-muted/20 p-4"
                                style={form.cover_image_url ? { backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.7), rgba(8,145,178,0.3)), url(${form.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                              >
                                <div className="rounded-2xl bg-background/70 px-3 py-2 backdrop-blur">
                                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview cover</p>
                                  <p className="mt-1 text-sm font-medium text-foreground">{form.title || 'Sin título todavía'}</p>
                                </div>
                              </div>
                              <div
                                className="relative overflow-hidden rounded-[22px] border border-border/70 bg-muted/20 p-4"
                                style={form.hero_image_url ? { backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.75), rgba(13,148,136,0.32)), url(${form.hero_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                              >
                                <div className="rounded-2xl bg-background/70 px-3 py-2 backdrop-blur">
                                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview hero</p>
                                  <p className="mt-1 text-sm text-foreground">{form.summary || 'Aquí verás el tono narrativo del curso.'}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-border/70 bg-primary/5">
                          <CardContent className="p-5">
                            <p className="font-medium text-foreground">Tip práctico</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              Si este curso se va a vender o asignar rápido, procura que el resumen corto explique el beneficio en menos de 2 líneas y que el hero contextualice el caso de uso.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <Card className="border-border/70 bg-card/95">
                        <CardHeader>
                          <CardTitle className="text-lg">Distribución y acceso</CardTitle>
                          <CardDescription>Define para quién es el curso y cómo se habilita en el ecosistema COPIM.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Audiencia</Label>
                            <Select value={form.audience} onValueChange={(value) => updateField('audience', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="socios">Socios</SelectItem>
                                <SelectItem value="staff">Staff / operación</SelectItem>
                                <SelectItem value="public">Público</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Visibilidad</Label>
                            <Select value={form.visibility} onValueChange={(value) => updateField('visibility', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="members">Miembros</SelectItem>
                                <SelectItem value="association">Asociación</SelectItem>
                                <SelectItem value="public">Público</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {!isLocalWorkspace ? (
                            <div className="space-y-2">
                              <Label>Scope</Label>
                              <Select value={form.scope} onValueChange={(value) => updateField('scope', value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="national">Nacional</SelectItem>
                                  <SelectItem value="association">Asociación</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : null}
                          <div className="space-y-2">
                            <Label>Estatus</Label>
                            <Select value={form.status} onValueChange={(value) => updateField('status', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Borrador</SelectItem>
                                <SelectItem value="published">Publicado</SelectItem>
                                <SelectItem value="archived">Archivado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Pricing</Label>
                            <Select value={form.pricing_type} onValueChange={(value) => updateField('pricing_type', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Gratis</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Precio</Label>
                            <Input type="number" min="0" value={form.price_amount} onChange={(event) => updateField('price_amount', event.target.value)} />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Tags</Label>
                            <Input value={form.tags_text} onChange={(event) => updateField('tags_text', event.target.value)} placeholder="onboarding, ética, pricing" />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <Label>Objetivos de aprendizaje</Label>
                            <Textarea rows={5} value={form.learning_objectives_text} onChange={(event) => updateField('learning_objectives_text', event.target.value)} placeholder="Un objetivo por línea" />
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-5">
                        <Card className="border-border/70 bg-card/95">
                          <CardHeader>
                            <CardTitle className="text-lg">Monetización</CardTitle>
                            <CardDescription>Activa esta capa cuando quieras que el curso aparezca como catálogo premium o gratuito para socios.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
                              <div>
                                <p className="font-medium">Marketplace y monetización</p>
                                <p className="mt-1 text-sm text-muted-foreground">Visible en catálogo y listo para inscripción o compra.</p>
                              </div>
                              <Switch checked={form.marketplace_enabled} onCheckedChange={(checked) => updateField('marketplace_enabled', checked)} />
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-border/70 bg-muted/20">
                          <CardContent className="space-y-3 p-5">
                            <p className="font-medium text-foreground">Cómo usar este paso</p>
                            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                              <li>Usa `Miembros` si el curso es parte de la membresía.</li>
                              <li>Usa `Público` solo cuando quieras atraer leads o visibilidad externa.</li>
                              <li>Si el curso es premium, define precio y activa marketplace desde aquí.</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-5">
                      <Card className="border-border/70 bg-muted/20">
                        <CardHeader>
                          <CardTitle className="text-lg">Copiloto IA del curso</CardTitle>
                          <CardDescription>Pega contexto, notas o apoyos y deja que el copiloto te sugiera la estructura inicial del curso.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Textarea rows={4} value={copilotPrompt} onChange={(event) => setCopilotPrompt(event.target.value)} placeholder="Ej. Quiero un curso corto para nuevos socios sobre onboarding, directorio, credencial y eventos..." />
                          <div className="flex flex-wrap gap-3">
                            <Button type="button" className="rounded-full" onClick={handleGenerate} disabled={!form.title.trim() || generating}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              {generating ? 'Generando...' : 'Sugerir estructura'}
                            </Button>
                            <Button type="button" variant="outline" className="rounded-full" onClick={addModule}>
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar módulo
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        {form.modules.map((module, moduleIndex) => (
                          <Card key={`module-${moduleIndex}`} className="border-border/70 bg-card/95">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2 flex-1">
                                  <Label>Módulo {moduleIndex + 1}</Label>
                                  <Input value={module.title} onChange={(event) => updateModule(moduleIndex, 'title', event.target.value)} placeholder="Título del módulo" />
                                  <Textarea rows={2} value={module.description || ''} onChange={(event) => updateModule(moduleIndex, 'description', event.target.value)} placeholder="Qué cubre este módulo" />
                                </div>
                                {form.modules.length > 1 ? (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeModule(moduleIndex)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div key={`lesson-${moduleIndex}-${lessonIndex}`} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="grid flex-1 gap-3 lg:grid-cols-2">
                                      <div className="space-y-2 lg:col-span-2">
                                        <Label>Lección {lessonIndex + 1}</Label>
                                        <Input value={lesson.title} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'title', event.target.value)} placeholder="Título de la lección" />
                                      </div>
                                      <div className="space-y-2 lg:col-span-2">
                                        <Textarea rows={2} value={lesson.description || ''} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'description', event.target.value)} placeholder="Qué aprende el socio en esta lección" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Duración (min)</Label>
                                        <Input type="number" min="0" value={lesson.duration_minutes} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'duration_minutes', event.target.value)} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select value={lesson.lesson_type} onValueChange={(value) => updateLesson(moduleIndex, lessonIndex, 'lesson_type', value)}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="document">Documento</SelectItem>
                                            <SelectItem value="live">Live</SelectItem>
                                            <SelectItem value="quiz">Quiz</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Fuente de video</Label>
                                        <Select value={lesson.video_source || 'youtube'} onValueChange={(value) => updateLesson(moduleIndex, lessonIndex, 'video_source', value)}>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                            <SelectItem value="external">URL externa</SelectItem>
                                            <SelectItem value="upload">Video cargado</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>URL de video</Label>
                                        <Input value={lesson.video_url || ''} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'video_url', event.target.value)} placeholder="https://youtube.com/..." />
                                      </div>
                                      <div className="space-y-2 lg:col-span-2">
                                        <Label>Transcript</Label>
                                        <Textarea rows={3} value={lesson.transcript || ''} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'transcript', event.target.value)} placeholder="Transcripción o resumen largo de la lección" />
                                      </div>
                                      <div className="space-y-2 lg:col-span-2">
                                        <Label>Subtítulos</Label>
                                        <Textarea rows={3} value={lesson.subtitle_text || ''} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'subtitle_text', event.target.value)} placeholder="Texto de subtítulos o captions" />
                                      </div>
                                      <div className="space-y-2 lg:col-span-2">
                                        <Label>Notas / CTA</Label>
                                        <Textarea rows={2} value={lesson.notes || ''} onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'notes', event.target.value)} placeholder="Checklist, CTA o tarea breve" />
                                      </div>
                                    </div>
                                    {module.lessons.length > 1 ? (
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLesson(moduleIndex, lessonIndex)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                              <Button type="button" variant="outline" className="rounded-full" onClick={() => addLesson(moduleIndex)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar lección
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-6">
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-5">
                          <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                              <CardTitle className="text-lg">Certificación y gobierno del curso</CardTitle>
                              <CardDescription>Activa la certificación cuando el curso forme parte del valor formal de membresía o formación.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 lg:col-span-2">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <p className="font-medium">Certificación</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Muestra certificado y badge cuando el socio complete el curso.</p>
                                  </div>
                                  <Switch checked={form.certificate_enabled} onCheckedChange={(checked) => updateField('certificate_enabled', checked)} />
                                </div>
                                {form.certificate_enabled ? (
                                  <div className="mt-4 space-y-2">
                                    <Label>Título del certificado</Label>
                                    <Input value={form.certificate_title} onChange={(event) => updateField('certificate_title', event.target.value)} placeholder="Ej. COPIM Certifica · Valoración" />
                                  </div>
                                ) : null}
                              </div>
                              <div className="space-y-2 lg:col-span-2">
                                <Label>Notas de onboarding / guía interna</Label>
                                <Textarea rows={6} value={form.onboarding_notes} onChange={(event) => updateField('onboarding_notes', event.target.value)} placeholder="Qué debe revisar operación antes de publicar este curso." />
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-border/70 bg-card/95">
                            <CardHeader>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <CardTitle className="text-lg">Instructores</CardTitle>
                                  <CardDescription>Autores visibles en catálogo, player y certificados.</CardDescription>
                                </div>
                                <Button type="button" variant="outline" className="rounded-full" onClick={addInstructor}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Agregar instructor
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {form.instructors.map((instructor, index) => (
                                <div key={`instructor-${index}`} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                                  <div className="grid gap-3 lg:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Nombre</Label>
                                      <Input value={instructor.name || ''} onChange={(event) => updateInstructor(index, 'name', event.target.value)} placeholder="Nombre visible" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Rol</Label>
                                      <Input value={instructor.role || ''} onChange={(event) => updateInstructor(index, 'role', event.target.value)} placeholder="Mentor, profesor, coordinación..." />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                      <Label>Bio</Label>
                                      <Textarea rows={2} value={instructor.bio || ''} onChange={(event) => updateInstructor(index, 'bio', event.target.value)} placeholder="Qué credibilidad o experiencia aporta." />
                                    </div>
                                  </div>
                                  {form.instructors.length > 1 ? (
                                    <div className="mt-3">
                                      <Button type="button" variant="ghost" size="sm" onClick={() => removeInstructor(index)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Quitar
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>

                        <Card className="border-border/70 bg-primary/5">
                          <CardHeader>
                            <CardTitle className="text-lg">Antes de publicar</CardTitle>
                            <CardDescription>Usa esta columna como control operativo para no dejar cabos sueltos.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                              <p className="text-sm font-medium text-foreground">Validación sugerida</p>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Revisa que el instructor tenga bio visible, que el curso tenga subtítulos básicos y que el certificado solo se active cuando el contenido ya esté estable.
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                              <p className="text-sm font-medium text-foreground">Notas internas</p>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Usa este bloque para checklist editorial, QA operativo o aprobaciones antes de sacar el curso a socios o marketplace.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="space-y-5">
                      <Card className="border-border/70 bg-card/95">
                        <CardHeader>
                          <CardTitle>{form.title || 'Curso sin título'}</CardTitle>
                          <CardDescription>{form.summary || 'Agrega un resumen para validar la promesa del curso.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`rounded-full ${COURSE_STATUS_TONES[form.status] || 'bg-slate-200 text-slate-900'}`}>{COURSE_STATUS_LABELS[form.status] || form.status}</Badge>
                              <Badge className={`rounded-full ${PRICING_TONES[form.pricing_type] || 'bg-slate-200 text-slate-900'}`}>{form.pricing_type === 'premium' ? 'Premium' : 'Gratis'}</Badge>
                              <Badge className={`rounded-full ${WORKSPACE_TONES[form.scope === 'association' ? 'Asociación' : 'Nacional']}`}>{form.scope === 'association' ? 'Asociación' : 'Nacional'}</Badge>
                            </div>
                            <p className="text-sm leading-7 text-muted-foreground">{form.description || 'Sin descripción larga todavía.'}</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Módulos</p>
                                <p className="mt-2 text-2xl font-semibold">{form.modules.length}</p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Lecciones</p>
                                <p className="mt-2 text-2xl font-semibold">{totalLessons}</p>
                              </div>
                              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Precio</p>
                                <p className="mt-2 text-2xl font-semibold">{form.pricing_type === 'premium' ? formatCopimCurrency(form.price_amount) : 'Gratis'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-3xl border border-border/70 bg-muted/20 p-5">
                            <p className="font-medium">Checklist de publicación</p>
                            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                              {checklist.map((item) => (
                                <li key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-2">
                                  <span>{item.label}</span>
                                  <Badge className={`rounded-full ${item.complete ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                                    {item.complete ? 'OK' : 'Pendiente'}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 bg-card/95 px-5 py-4 sm:px-6">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
            >
              Atrás
            </Button>
            <div className="flex gap-3">
              {step < stepLabels.length - 1 ? (
                <Button type="button" className="rounded-full" onClick={() => setStep((current) => Math.min(current + 1, stepLabels.length - 1))} disabled={!canAdvance}>
                  Siguiente
                </Button>
              ) : (
                <Button type="button" className="rounded-full" onClick={onSave} disabled={!canAdvance || saving}>
                  <Rocket className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : editingCourse ? 'Actualizar curso' : 'Crear curso'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CourseDetailDialog = ({
  open,
  onOpenChange,
  detail,
  onEdit,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onUploadMaterials,
  workingAction,
}) => {
  const [materialType, setMaterialType] = useState('file');
  const [lessonId, setLessonId] = useState('none');

  useEffect(() => {
    if (!open) {
      setMaterialType('file');
      setLessonId('none');
    }
  }, [open]);

  if (!detail?.course) {
    return null;
  }

  const course = detail.course;
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const lessons = modules.flatMap((module) => (module.lessons || []).map((lesson) => ({
    ...lesson,
    module_title: module.title,
  })));
  const materials = Array.isArray(course.materials) ? course.materials : [];
  const enrollments = Array.isArray(detail.enrollments) ? detail.enrollments : [];

  const handleUploadChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }
    await onUploadMaterials(files, materialType, lessonId === 'none' ? null : lessonId);
    event.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(94vh,940px)] w-[min(1240px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-[28px] border-border/70 bg-card p-0">
        <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-5 sm:px-6">
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>{course.summary || 'Curso institucional dentro de COPIM x ROVI.'}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-5 py-5 sm:px-6">
          <div className="space-y-5 pb-6 pr-2 sm:pr-4">
            <div
              className="relative overflow-hidden rounded-[28px] border border-white/10 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(8, 145, 178, 0.55)), url(${course.hero_image_url || course.cover_image_url})`,
              }}
            >
              <div className="space-y-5 p-5 text-white sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className={`rounded-full ${COURSE_STATUS_TONES[course.status] || 'bg-white/10 text-white'}`}>{COURSE_STATUS_LABELS[course.status] || course.status}</Badge>
                  <Badge className={`rounded-full ${PRICING_TONES[course.pricing_type] || 'bg-white/10 text-white'}`}>{course.pricing_type === 'premium' ? 'Premium' : 'Gratis'}</Badge>
                  <Badge className={`rounded-full ${WORKSPACE_TONES[course.scope_label] || 'bg-white/10 text-white'}`}>{course.scope_label}</Badge>
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <h2 className="text-3xl font-semibold sm:text-4xl">{course.title}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">{course.description || course.summary}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/60">Inscritos</p>
                      <p className="mt-2 text-2xl font-semibold">{course.enrollment_count || 0}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/60">Completados</p>
                      <p className="mt-2 text-2xl font-semibold">{course.completion_count || 0}</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/60">Progreso medio</p>
                      <p className="mt-2 text-2xl font-semibold">{course.average_progress || 0}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button variant="secondary" className="rounded-full" onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="secondary" className="rounded-full" onClick={onDuplicate} disabled={workingAction === 'duplicate'}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </Button>
                  {course.status !== 'published' ? (
                    <Button variant="secondary" className="rounded-full" onClick={onPublish} disabled={workingAction === 'publish'}>
                      <Rocket className="mr-2 h-4 w-4" />
                      Publicar
                    </Button>
                  ) : (
                    <Button variant="secondary" className="rounded-full" onClick={onArchive} disabled={workingAction === 'archive'}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archivar
                    </Button>
                  )}
                  <Button variant="destructive" className="rounded-full" onClick={onDelete} disabled={workingAction === 'delete'}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/30 p-1">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="materials">Materiales</TabsTrigger>
                <TabsTrigger value="analytics">Analítica</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <Card className="border-border/70 bg-card/95">
                    <CardHeader>
                      <CardTitle>Objetivos de aprendizaje</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(course.learning_objectives || []).length ? (
                        (course.learning_objectives || []).map((objective) => (
                          <div key={objective} className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            {objective}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                          Agrega objetivos para que el curso tenga una promesa más clara.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-card/95">
                    <CardHeader>
                      <CardTitle>Ficha rápida</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between"><span>Modalidad</span><span className="font-medium text-foreground">{course.modality}</span></div>
                      <div className="flex items-center justify-between"><span>Audiencia</span><span className="font-medium text-foreground">{course.audience}</span></div>
                      <div className="flex items-center justify-between"><span>Duración</span><span className="font-medium text-foreground">{formatDurationLabel(course.estimated_minutes)}</span></div>
                      <div className="flex items-center justify-between"><span>Marketplace</span><span className="font-medium text-foreground">{course.marketplace_enabled ? 'Activo' : 'Interno'}</span></div>
                      <div className="flex items-center justify-between"><span>Certificado</span><span className="font-medium text-foreground">{course.certificate_enabled ? 'Sí' : 'No'}</span></div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card className="border-border/70 bg-card/95">
                    <CardHeader>
                      <CardTitle>Estructura del curso</CardTitle>
                      <CardDescription>{course.module_count || 0} módulos · {course.lesson_count || 0} lecciones</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {modules.map((module) => (
                        <div key={module.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <p className="font-semibold">{module.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                          <div className="mt-4 space-y-3">
                            {(module.lessons || []).map((lesson) => (
                              <div key={lesson.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{lesson.title}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{lesson.description || 'Sin descripción'}</p>
                                  </div>
                                  {lesson.is_preview ? <Badge className="rounded-full bg-primary/10 text-primary">Preview</Badge> : null}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>{lesson.lesson_type}</span>
                                  <span>{formatDurationLabel(lesson.duration_minutes)}</span>
                                  <span>{lesson.video_source || 'sin fuente'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-card/95">
                    <CardHeader>
                      <CardTitle>Preview del consumo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {lessons[0]?.video_url ? (
                        getYouTubeEmbedUrl(lessons[0].video_url) ? (
                          <div className="aspect-video overflow-hidden rounded-3xl border border-border/70">
                            <iframe
                              src={getYouTubeEmbedUrl(lessons[0].video_url)}
                              title={lessons[0].title}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <video src={lessons[0].video_url} controls className="aspect-video w-full rounded-3xl border border-border/70 bg-black" />
                        )
                      ) : (
                        <div className="flex aspect-video items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                          La primera lección todavía no tiene video.
                        </div>
                      )}
                      <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                        <p className="font-medium">Subtítulos / transcript</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {lessons[0]?.subtitle_text || lessons[0]?.transcript || 'Carga o redacta subtítulos para acercar la experiencia a Loom/Skool.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                <Card className="border-border/70 bg-card/95">
                  <CardHeader>
                    <CardTitle>Biblioteca del curso</CardTitle>
                    <CardDescription>Sube materiales, PDFs, videos cortos o recursos de apoyo y asígnalos a una lección cuando haga sentido.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 xl:grid-cols-[180px_220px_1fr]">
                      <Select value={materialType} onValueChange={setMaterialType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">Archivo</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="slide">Presentación</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={lessonId} onValueChange={setLessonId}>
                        <SelectTrigger><SelectValue placeholder="Asignar a lección" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Solo biblioteca</SelectItem>
                          {lessons.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              {lesson.module_title} · {lesson.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        Subir material
                        <input type="file" className="hidden" multiple onChange={handleUploadChange} />
                      </label>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {materials.length ? materials.map((material) => (
                        <div key={material.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{material.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{material.material_type} · {material.size_label || 'Material digital'}</p>
                            </div>
                            <Badge className="rounded-full bg-primary/10 text-primary">{material.material_type}</Badge>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-muted-foreground">{material.summary || 'Material de apoyo del curso.'}</p>
                        </div>
                      )) : (
                        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground lg:col-span-2">
                          Todavía no hay materiales cargados.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card className="border-border/70 bg-card/95">
                    <CardContent className="p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Inscritos</p>
                      <p className="mt-3 text-3xl font-semibold">{course.enrollment_count || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-card/95">
                    <CardContent className="p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Completados</p>
                      <p className="mt-3 text-3xl font-semibold">{course.completion_count || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/70 bg-card/95">
                    <CardContent className="p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Revenue premium</p>
                      <p className="mt-3 text-3xl font-semibold">{formatCopimCurrency(course.premium_revenue || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/70 bg-card/95">
                  <CardHeader>
                    <CardTitle>Trazabilidad de inscritos</CardTitle>
                    <CardDescription>Vista operativa de avance por persona.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {enrollments.length ? enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="font-semibold">{enrollment.member_name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{enrollment.member_email}</p>
                          </div>
                          <div className="w-full max-w-xs space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{enrollment.status}</span>
                              <span className="font-medium">{enrollment.progress_percent || 0}%</span>
                            </div>
                            <Progress value={enrollment.progress_percent || 0} className="h-2.5" />
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                        Todavía no hay inscripciones visibles para este curso.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const CopimCoursesWorkspacePage = () => {
  const { api, user } = useAuth();
  const isLocalWorkspace = isCopimLocalAssociationUser(user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(createEmptyCourseForm(isLocalWorkspace ? 'association' : 'national'));
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [workingAction, setWorkingAction] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      const response = await api.get('/copim/courses');
      setData(response.data);
    } catch (error) {
      console.error('Error loading copim courses:', error);
      toast.error(error.response?.data?.detail || 'No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const loadDetail = useCallback(async (courseId) => {
    try {
      const response = await api.get(`/copim/courses/${courseId}`);
      setDetail(response.data);
      setActiveCourseId(courseId);
      setDetailOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el detalle del curso');
    }
  }, [api]);

  const filteredCourses = useMemo(() => {
    const courses = Array.isArray(data?.courses) ? data.courses : [];
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (statusFilter !== 'all' && course.status !== statusFilter) {
        return false;
      }
      if (pricingFilter !== 'all' && course.pricing_type !== pricingFilter) {
        return false;
      }
      if (!term) return true;
      return [course.title, course.summary, course.category, course.association_name, course.scope_label]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [data?.courses, pricingFilter, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setForm(createEmptyCourseForm(isLocalWorkspace ? 'association' : 'national'));
    setDialogOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setForm(normalizeCourseForForm(course, isLocalWorkspace ? 'association' : 'national'));
    setDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!form.title.trim()) {
      toast.error('El título del curso es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editingCourse?.id) {
        await api.put(`/copim/courses/${editingCourse.id}`, payload);
        toast.success('Curso actualizado');
      } else {
        await api.post('/copim/courses', payload);
        toast.success('Curso creado');
      }
      setDialogOpen(false);
      setEditingCourse(null);
      await loadCourses();
      if (activeCourseId) {
        await loadDetail(activeCourseId);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.detail || 'No se pudo guardar el curso');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async (payload) => {
    setGenerating(true);
    try {
      const response = await api.post('/copim/courses/ai-draft', payload);
      toast.success('Estructura sugerida lista');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo generar la estructura con IA');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const runCourseAction = async (courseId, action) => {
    setWorkingAction(action);
    try {
      if (action === 'delete') {
        await api.delete(`/copim/courses/${courseId}`);
      } else if (action === 'duplicate') {
        await api.post(`/copim/courses/${courseId}/duplicate`);
      } else if (action === 'publish') {
        await api.post(`/copim/courses/${courseId}/publish`);
      } else if (action === 'archive') {
        await api.post(`/copim/courses/${courseId}/archive`);
      }
      toast.success('Acción aplicada');
      await loadCourses();
      if (action === 'delete') {
        setDetailOpen(false);
        setDetail(null);
        setActiveCourseId(null);
      } else if (activeCourseId) {
        await loadDetail(activeCourseId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo completar la acción');
    } finally {
      setWorkingAction(null);
    }
  };

  const handleUploadMaterials = async (files, materialType, lessonId) => {
    if (!activeCourseId) {
      return;
    }
    setWorkingAction('upload');
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('material_type', materialType);
      if (lessonId) {
        formData.append('lesson_id', lessonId);
      }
      await api.post(`/copim/courses/${activeCourseId}/materials/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Materiales cargados');
      await loadCourses();
      await loadDetail(activeCourseId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudieron cargar los materiales');
    } finally {
      setWorkingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[720px] w-full rounded-[28px]" />
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow={isLocalWorkspace ? 'Asociación local' : 'COPIM Nacional'}
        title={isLocalWorkspace ? 'Academia del capítulo' : 'Academia COPIM'}
        description={isLocalWorkspace
          ? 'Gestiona la oferta formativa local, publica rutas para tus socios y controla avance, certificación y monetización en una sola cabina.'
          : 'Administra el catálogo nacional, estructura cursos premium, acelera creación con IA y mide adopción por asociación y por curso.'}
        actions={(
          <>
            <div className="flex min-w-[260px] items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por curso, categoría o asociación"
              />
            </div>
            <Button variant="outline" className="rounded-full" onClick={() => setViewMode((current) => current === 'cards' ? 'table' : 'cards')}>
              <Layers3 className="mr-2 h-4 w-4" />
              {viewMode === 'cards' ? 'Vista tabla' : 'Vista cards'}
            </Button>
            <Button className="rounded-full" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo curso
            </Button>
          </>
        )}
        stats={[
          { label: 'Cursos totales', value: stats.total_courses || 0, helper: `${stats.draft_courses || 0} borradores` },
          { label: 'Publicados', value: stats.published_courses || 0, helper: 'Listos para consumo' },
          { label: 'Premium', value: stats.premium_courses || 0, helper: formatCopimCurrency(stats.premium_revenue || 0) },
          { label: 'Inscripciones', value: stats.enrollments || 0, helper: `${stats.completions || 0} completados` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[220px_220px_1fr]">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Filtra por estatus" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estatus</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="archived">Archivados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pricingFilter} onValueChange={setPricingFilter}>
          <SelectTrigger><SelectValue placeholder="Filtra por pricing" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los modelos</SelectItem>
            <SelectItem value="free">Gratis</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-3xl border border-border/70 bg-card/95 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredCourses.length}</span> cursos visibles en esta vista. Usa el copiloto IA para acelerar outline, onboarding y materiales sin salir del CRM.
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden border-border/70 bg-card/95">
              <div
                className="relative h-48 border-b border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(13, 148, 136, 0.44)), url(${course.hero_image_url || course.cover_image_url})`,
                }}
              >
                <div className="flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`rounded-full ${COURSE_STATUS_TONES[course.status] || 'bg-white/10 text-white'}`}>
                      {COURSE_STATUS_LABELS[course.status] || course.status}
                    </Badge>
                    <Badge className={`rounded-full ${PRICING_TONES[course.pricing_type] || 'bg-white/10 text-white'}`}>
                      {course.pricing_type === 'premium' ? 'Premium' : 'Gratis'}
                    </Badge>
                    <Badge className={`rounded-full ${WORKSPACE_TONES[course.scope_label] || 'bg-white/10 text-white'}`}>
                      {course.scope_label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/70">{course.category}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{course.title}</h2>
                    <p className="mt-2 text-sm text-white/74">{course.association_name || 'Catálogo institucional COPIM'}</p>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4 p-5">
                <p className="text-sm leading-7 text-muted-foreground">{course.summary || 'Curso listo para estructurarse dentro del CRM.'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Lecciones
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{course.lesson_count || 0}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{course.module_count || 0} módulos</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      Duración
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{formatDurationLabel(course.estimated_minutes)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{course.modality}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inscritos</p>
                    <p className="mt-2 text-xl font-semibold">{course.enrollment_count || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Completados</p>
                    <p className="mt-2 text-xl font-semibold">{course.completion_count || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Premium</p>
                    <p className="mt-2 text-xl font-semibold">{course.pricing_type === 'premium' ? formatCopimCurrency(course.price_amount) : 'Gratis'}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Progreso medio de alumnos</span>
                    <span className="font-medium">{course.average_progress || 0}%</span>
                  </div>
                  <Progress value={course.average_progress || 0} className="mt-3 h-2.5" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => loadDetail(course.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalle
                  </Button>
                  {course.can_edit ? (
                    <Button variant="outline" className="rounded-full" onClick={() => handleOpenEdit(course)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  ) : null}
                  {course.status !== 'published' && course.can_edit ? (
                    <Button variant="outline" className="rounded-full" onClick={() => runCourseAction(course.id, 'publish')}>
                      <Rocket className="mr-2 h-4 w-4" />
                      Publicar
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/70 bg-card/95">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Inscritos</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.category} · {course.association_name || 'Nacional'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full ${COURSE_STATUS_TONES[course.status] || 'bg-slate-200 text-slate-900'}`}>
                        {COURSE_STATUS_LABELS[course.status] || course.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.scope_label}</TableCell>
                    <TableCell>{course.pricing_type === 'premium' ? formatCopimCurrency(course.price_amount) : 'Gratis'}</TableCell>
                    <TableCell>{course.enrollment_count || 0}</TableCell>
                    <TableCell>{course.average_progress || 0}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => loadDetail(course.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {course.can_edit ? (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(course)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!filteredCourses.length ? (
        <Card className="border-border/70 bg-card/95">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-lg font-semibold">Todavía no hay cursos para este filtro</p>
              <p className="mt-2 text-sm text-muted-foreground">Crea un curso nuevo o ajusta la búsqueda para volver al catálogo completo.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-3 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary w-fit"><Sparkles className="h-5 w-5" /></div>
            <p className="font-semibold">Copiloto IA</p>
            <p className="text-sm leading-7 text-muted-foreground">Genera outline, objetivos y módulos base a partir de notas, materiales y contexto del curso.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-3 p-5">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-500 w-fit"><Upload className="h-5 w-5" /></div>
            <p className="font-semibold">Materiales vivos</p>
            <p className="text-sm leading-7 text-muted-foreground">Soporta PDFs, videos, links y cargables para que cada curso se vea útil desde la primera demo.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-3 p-5">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500 w-fit"><Users className="h-5 w-5" /></div>
            <p className="font-semibold">Trazabilidad</p>
            <p className="text-sm leading-7 text-muted-foreground">Cada curso ya expone inscritos, avance y cierres para operación nacional o del capítulo.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/95">
          <CardContent className="space-y-3 p-5">
            <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-500 w-fit"><WalletCards className="h-5 w-5" /></div>
            <p className="font-semibold">Marketplace</p>
            <p className="text-sm leading-7 text-muted-foreground">Cursos premium y gratuitos conviven en el catálogo con pricing visible y base para monetización.</p>
          </CardContent>
        </Card>
      </div>

      <CourseWizardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveCourse}
        onGenerateAI={handleGenerateAI}
        form={form}
        setForm={setForm}
        saving={saving}
        generating={generating}
        isLocalWorkspace={isLocalWorkspace}
        editingCourse={editingCourse}
      />

      <CourseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        detail={detail}
        onEdit={() => {
          if (!detail?.course) return;
          setDetailOpen(false);
          handleOpenEdit(detail.course);
        }}
        onPublish={() => runCourseAction(activeCourseId, 'publish')}
        onArchive={() => runCourseAction(activeCourseId, 'archive')}
        onDuplicate={() => runCourseAction(activeCourseId, 'duplicate')}
        onDelete={() => runCourseAction(activeCourseId, 'delete')}
        onUploadMaterials={handleUploadMaterials}
        workingAction={workingAction}
      />
    </div>
  );
};

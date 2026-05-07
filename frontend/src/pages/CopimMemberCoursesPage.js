import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Clock3,
  CreditCard,
  Download,
  GraduationCap,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CopimPageHeader, formatCopimCurrency } from '../components/copim/CopimModulePrimitives';

const statusTone = {
  available: 'bg-cyan-100 text-cyan-900',
  enrolled: 'bg-primary/10 text-primary',
  in_progress: 'bg-amber-100 text-amber-900',
  completed: 'bg-emerald-100 text-emerald-900',
  locked: 'bg-slate-200 text-slate-900',
};

const pricingTone = {
  free: 'bg-cyan-100 text-cyan-900',
  premium: 'bg-fuchsia-100 text-fuchsia-900',
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

const downloadCertificateSummary = (course) => {
  const lines = [
    `Certificado COPIM`,
    `Curso: ${course.title}`,
    `Estatus: ${course.status}`,
    `Progreso final: ${course.progress || 0}%`,
    `Certificado: ${course.certificate_title || 'Curso completado'}`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${(course.title || 'certificado-copim').replace(/\s+/g, '-').toLowerCase()}.txt`;
  link.click();
  URL.revokeObjectURL(href);
};

export const CopimMemberCoursesPage = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [workingAction, setWorkingAction] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      const response = await api.get('/copim/member-portal/courses');
      setData(response.data);
    } catch (error) {
      console.error('Error loading member courses:', error);
      toast.error(error.response?.data?.detail || 'No se pudieron cargar tus cursos');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadDetail = useCallback(async (courseId) => {
    try {
      const response = await api.get(`/copim/member-portal/courses/${courseId}`);
      setDetail(response.data);
      setActiveCourseId(courseId);
      const lessons = (response.data?.course?.modules || []).flatMap((module) => module.lessons || []);
      setSelectedLessonId(response.data?.course?.next_lesson_id || lessons[0]?.id || null);
      setDetailOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo cargar el detalle del curso');
    }
  }, [api]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const enrolled = Array.isArray(data?.courses) ? data.courses : [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return enrolled;
    }
    return enrolled.filter((course) => (
      [course.title, course.summary, course.category, course.association_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    ));
  }, [data?.courses, search]);

  const filteredMarketplace = useMemo(() => {
    const list = Array.isArray(data?.marketplace_courses) ? data.marketplace_courses : [];
    const term = search.trim().toLowerCase();
    return list.filter((course) => {
      if (!term) return true;
      return [course.title, course.summary, course.category, course.association_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [data?.marketplace_courses, search]);

  const certificates = Array.isArray(data?.certificates) ? data.certificates : [];

  const handleEnroll = async (courseId) => {
    setWorkingAction(`enroll-${courseId}`);
    try {
      await api.post(`/copim/member-portal/courses/${courseId}/enroll`);
      toast.success('Te inscribiste al curso');
      await loadCourses();
      await loadDetail(courseId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo completar la inscripción');
    } finally {
      setWorkingAction(null);
    }
  };

  const handlePurchase = async (courseId) => {
    setWorkingAction(`purchase-${courseId}`);
    try {
      await api.post(`/copim/member-portal/courses/${courseId}/purchase`);
      toast.success('Acceso premium desbloqueado');
      await loadCourses();
      await loadDetail(courseId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar la compra');
    } finally {
      setWorkingAction(null);
    }
  };

  const handleCompleteLesson = async (courseId, lessonId) => {
    setWorkingAction(`lesson-${lessonId}`);
    try {
      await api.post(`/copim/member-portal/courses/${courseId}/lessons/${lessonId}/progress`, {
        lesson_id: lessonId,
        mark_completed: true,
      });
      toast.success('Lección marcada como completada');
      await loadCourses();
      await loadDetail(courseId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo registrar el avance');
    } finally {
      setWorkingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-40 w-full rounded-[28px]" />
        <Skeleton className="h-[620px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const summary = data.summary || {};
  const selectedCourse = detail?.course || null;
  const allLessons = selectedCourse ? (selectedCourse.modules || []).flatMap((module) => (module.lessons || []).map((lesson) => ({
    ...lesson,
    module_title: module.title,
  }))) : [];
  const selectedLesson = allLessons.find((lesson) => lesson.id === selectedLessonId) || allLessons[0] || null;
  const canConsumeSelectedCourse = selectedCourse && (
    selectedCourse.pricing_type !== 'premium' || selectedCourse.is_purchased || selectedCourse.is_enrolled
  );
  const lessonCompleted = Boolean(selectedCourse?.completed_lesson_ids?.includes(selectedLesson?.id));
  const embedUrl = selectedLesson?.video_url ? getYouTubeEmbedUrl(selectedLesson.video_url) : null;

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        eyebrow="Portal del asociado"
        title="Academia y marketplace"
        description="Consume tus rutas formativas, sigue tu trazabilidad, compra cursos premium y mantén visibles tus certificados dentro de COPIM."
        actions={(
          <div className="flex min-w-[280px] items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cursos, categorías o asociación"
            />
          </div>
        )}
        stats={[
          { label: 'Completados', value: summary.completed_courses || 0, helper: 'Cursos cerrados' },
          { label: 'En progreso', value: summary.in_progress_courses || 0, helper: 'Rutas activas' },
          { label: 'Promedio', value: `${summary.average_progress || 0}%`, helper: 'Pulso formativo' },
          { label: 'Premium', value: summary.purchased_courses || 0, helper: `${summary.certifications || 0} certificados` },
        ]}
      />

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Mi ruta</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="grid gap-5 xl:grid-cols-3">
          {filteredCourses.length ? filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden border-border/70 bg-card/95">
              <div
                className="relative h-44 border-b border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(8, 145, 178, 0.48)), url(${course.hero_image_url || course.cover_image_url})`,
                }}
              >
                <div className="flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`rounded-full capitalize ${statusTone[course.status] || 'bg-white/10 text-white'}`}>
                      {course.status}
                    </Badge>
                    <Badge className={`rounded-full ${pricingTone[course.pricing_type] || 'bg-white/10 text-white'}`}>
                      {course.pricing_type === 'premium' ? 'Premium' : 'Gratis'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/72">{course.category}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{course.title}</h2>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4 p-5">
                <p className="text-sm leading-7 text-muted-foreground">{course.summary}</p>
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PlayCircle className="h-4 w-4" />
                      Progreso
                    </div>
                    <span className="font-medium text-foreground">{course.progress || 0}%</span>
                  </div>
                  <Progress value={course.progress || 0} className="mt-3 h-2.5" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {course.modules_completed || 0} de {course.modules_total || 0} lecciones · {course.next_lesson_title || 'Listo para continuar'}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      Duración
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{course.estimated_minutes || 0} min</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {course.certificate_earned ? <Award className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                      Certificado
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {course.certificate_earned ? 'Obtenido' : 'En proceso'}
                    </p>
                  </div>
                </div>
                <Button className="w-full rounded-full" onClick={() => loadDetail(course.id)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Abrir curso
                </Button>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-border/70 bg-card/95 xl:col-span-3">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-lg font-semibold">Todavía no tienes cursos inscritos</p>
                  <p className="mt-2 text-sm text-muted-foreground">Explora el marketplace y activa tu primera ruta formativa.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="grid gap-5 xl:grid-cols-3">
          {filteredMarketplace.length ? filteredMarketplace.map((course) => (
            <Card key={course.id} className="overflow-hidden border-border/70 bg-card/95">
              <div
                className="relative h-44 border-b border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(13, 148, 136, 0.44)), url(${course.hero_image_url || course.cover_image_url})`,
                }}
              >
                <div className="flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`rounded-full ${pricingTone[course.pricing_type] || 'bg-white/10 text-white'}`}>
                      {course.pricing_type === 'premium' ? 'Premium' : 'Gratis'}
                    </Badge>
                    {course.is_purchased ? <Badge className="rounded-full bg-emerald-100 text-emerald-900">Comprado</Badge> : null}
                    {course.is_enrolled ? <Badge className="rounded-full bg-primary/10 text-white">Inscrito</Badge> : null}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/72">{course.category}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{course.title}</h2>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-4 p-5">
                <p className="text-sm leading-7 text-muted-foreground">{course.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Formato</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{course.modality}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Precio</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {course.pricing_type === 'premium' ? formatCopimCurrency(course.price_amount || 0) : 'Gratis'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => loadDetail(course.id)}>
                    Ver detalle
                  </Button>
                  {!course.is_enrolled && course.pricing_type === 'free' ? (
                    <Button className="rounded-full" onClick={() => handleEnroll(course.id)} disabled={workingAction === `enroll-${course.id}`}>
                      {workingAction === `enroll-${course.id}` ? 'Procesando...' : 'Inscribirme'}
                    </Button>
                  ) : null}
                  {!course.is_purchased && course.pricing_type === 'premium' ? (
                    <Button className="rounded-full" onClick={() => handlePurchase(course.id)} disabled={workingAction === `purchase-${course.id}`}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {workingAction === `purchase-${course.id}` ? 'Procesando...' : 'Comprar acceso'}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-border/70 bg-card/95 xl:col-span-3">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-lg font-semibold">No encontramos cursos para esa búsqueda</p>
                  <p className="mt-2 text-sm text-muted-foreground">Ajusta el buscador para volver al marketplace completo.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="grid gap-5 xl:grid-cols-3">
          {certificates.length ? certificates.map((course) => (
            <Card key={course.id} className="border-border/70 bg-card/95">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{course.certificate_title || 'Certificado COPIM'}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">{course.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Progreso final</p>
                    <p className="mt-2 text-xl font-semibold">{course.progress || 100}%</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Duración</p>
                    <p className="mt-2 text-xl font-semibold">{course.estimated_minutes || 0} min</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-full" onClick={() => downloadCertificateSummary(course)}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar constancia
                </Button>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-border/70 bg-card/95 xl:col-span-3">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-lg font-semibold">Todavía no tienes certificados visibles</p>
                  <p className="mt-2 text-sm text-muted-foreground">Completa tus rutas activas para emitir las primeras constancias dentro de COPIM.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex h-[min(94vh,940px)] w-[min(1380px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-[28px] border-border/70 bg-card p-0">
          <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-5 sm:px-6">
            <DialogTitle>{selectedCourse?.title || 'Curso COPIM'}</DialogTitle>
            <DialogDescription>{selectedCourse?.summary || 'Ruta formativa dentro de COPIM.'}</DialogDescription>
          </DialogHeader>

          {selectedCourse ? (
            <ScrollArea className="min-h-0 flex-1 px-5 py-5 sm:px-6">
              <div className="space-y-5 pb-6 pr-2 sm:pr-4">
                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.18fr)_360px]">
                  <div className="space-y-4">
                    {canConsumeSelectedCourse && selectedLesson?.video_url ? (
                      embedUrl ? (
                        <div className="aspect-video overflow-hidden rounded-[28px] border border-border/70 bg-black">
                          <iframe
                            src={embedUrl}
                            title={selectedLesson.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <video src={selectedLesson.video_url} controls className="aspect-video w-full rounded-[28px] border border-border/70 bg-black" />
                      )
                    ) : (
                      <div
                        className="flex aspect-video items-end rounded-[28px] border border-white/10 bg-cover bg-center p-5 text-white sm:p-6"
                        style={{
                          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(8, 145, 178, 0.52)), url(${selectedCourse.hero_image_url || selectedCourse.cover_image_url})`,
                        }}
                      >
                        <div>
                          <Badge className={`rounded-full ${pricingTone[selectedCourse.pricing_type] || 'bg-white/10 text-white'}`}>
                            {selectedCourse.pricing_type === 'premium' ? 'Premium' : 'Gratis'}
                          </Badge>
                          <h3 className="mt-4 text-3xl font-semibold sm:text-4xl">{selectedCourse.title}</h3>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">{selectedCourse.description || selectedCourse.summary}</p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-[28px] border border-border/70 bg-card/95 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`rounded-full capitalize ${statusTone[selectedCourse.status] || 'bg-slate-200 text-slate-900'}`}>
                          {selectedCourse.status}
                        </Badge>
                        <Badge className={`rounded-full ${pricingTone[selectedCourse.pricing_type] || 'bg-slate-200 text-slate-900'}`}>
                          {selectedCourse.pricing_type === 'premium' ? 'Premium' : 'Gratis'}
                        </Badge>
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold">{selectedLesson?.title || selectedCourse.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {selectedLesson?.description || selectedCourse.summary}
                      </p>

                      {!canConsumeSelectedCourse ? (
                        <div className="mt-5 rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm text-fuchsia-900">
                          Este curso premium necesita compra para desbloquear reproductor, progreso y certificado.
                          <div className="mt-3">
                            <Button className="rounded-full" onClick={() => handlePurchase(selectedCourse.id)} disabled={workingAction === `purchase-${selectedCourse.id}`}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              {workingAction === `purchase-${selectedCourse.id}` ? 'Procesando...' : `Comprar por ${formatCopimCurrency(selectedCourse.price_amount || 0)}`}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 flex flex-wrap gap-3">
                          {!selectedCourse.is_enrolled && selectedCourse.pricing_type === 'free' ? (
                            <Button className="rounded-full" onClick={() => handleEnroll(selectedCourse.id)} disabled={workingAction === `enroll-${selectedCourse.id}`}>
                              {workingAction === `enroll-${selectedCourse.id}` ? 'Procesando...' : 'Inscribirme al curso'}
                            </Button>
                          ) : null}
                          {selectedLesson ? (
                            <Button
                              variant="outline"
                              className="rounded-full"
                              onClick={() => handleCompleteLesson(selectedCourse.id, selectedLesson.id)}
                              disabled={lessonCompleted || workingAction === `lesson-${selectedLesson.id}` || !selectedCourse.is_enrolled}
                            >
                              {lessonCompleted ? 'Lección completada' : workingAction === `lesson-${selectedLesson.id}` ? 'Guardando...' : 'Marcar como completada'}
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <Tabs defaultValue="transcript" className="space-y-4">
                      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/30 p-1">
                        <TabsTrigger value="transcript">Transcript</TabsTrigger>
                        <TabsTrigger value="captions">Subtítulos</TabsTrigger>
                        <TabsTrigger value="resources">Recursos</TabsTrigger>
                      </TabsList>
                      <TabsContent value="transcript">
                        <Card className="border-border/70 bg-card/95">
                          <CardContent className="p-5 text-sm leading-7 text-muted-foreground">
                            {selectedLesson?.transcript || 'Esta lección todavía no tiene transcript visible.'}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="captions">
                        <Card className="border-border/70 bg-card/95">
                          <CardContent className="p-5 text-sm leading-7 text-muted-foreground">
                            {selectedLesson?.subtitle_text || 'Todavía no se han cargado subtítulos para esta lección.'}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="resources">
                        <Card className="border-border/70 bg-card/95">
                          <CardContent className="space-y-3 p-5">
                            {(selectedLesson?.resources || selectedCourse.materials || []).length ? (
                              (selectedLesson?.resources || selectedCourse.materials || []).map((resource) => (
                                <div key={resource.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                                  <p className="font-medium">{resource.title}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{resource.material_type} · {resource.summary || 'Recurso complementario'}</p>
                                  {resource.url ? (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                      Abrir recurso
                                    </a>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                Esta lección todavía no tiene materiales descargables.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Tu progreso</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Avance general</span>
                            <span className="font-medium">{selectedCourse.progress || 0}%</span>
                          </div>
                          <Progress value={selectedCourse.progress || 0} className="mt-3 h-2.5" />
                          <p className="mt-3 text-sm text-muted-foreground">
                            {selectedCourse.modules_completed || 0} de {selectedCourse.modules_total || 0} lecciones cerradas
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Duración</p>
                            <p className="mt-2 text-xl font-semibold">{selectedCourse.estimated_minutes || 0} min</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Certificado</p>
                            <p className="mt-2 text-xl font-semibold">{selectedCourse.certificate_earned ? 'Listo' : 'En proceso'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/95">
                      <CardHeader>
                        <CardTitle>Contexto del curso</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modalidad</p>
                          <p className="mt-2 text-base font-semibold">{selectedCourse.delivery_mode || 'Video on demand'}</p>
                        </div>
                        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Audiencia</p>
                          <p className="mt-2 text-base font-semibold">{selectedCourse.audience || 'Socios activos COPIM'}</p>
                        </div>
                        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Certificación</p>
                          <p className="mt-2 text-base font-semibold">{selectedCourse.certificate_title || 'Constancia institucional COPIM'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="border-border/70 bg-card/95">
                  <CardHeader>
                    <CardTitle>Módulos y lecciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(selectedCourse.modules || []).map((module) => (
                      <div key={module.id} className="rounded-3xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold">{module.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                          </div>
                          <Badge className="w-fit rounded-full bg-background/80 text-foreground">
                            {(module.lessons || []).length} lecciones
                          </Badge>
                        </div>
                        <div className="mt-4 grid gap-3 xl:grid-cols-2">
                          {(module.lessons || []).map((lesson) => {
                            const isActive = selectedLessonId === lesson.id;
                            const isDone = Boolean(selectedCourse.completed_lesson_ids?.includes(lesson.id));
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                  isActive
                                    ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary))]'
                                    : 'border-border/70 bg-background/80 hover:bg-muted'
                                }`}
                                onClick={() => setSelectedLessonId(lesson.id)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-medium">{lesson.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{lesson.duration_minutes || 0} min · {lesson.lesson_type}</p>
                                  </div>
                                  {isDone ? (
                                    <Badge className="rounded-full bg-emerald-100 text-emerald-900">OK</Badge>
                                  ) : lesson.is_preview ? (
                                    <Badge className="rounded-full bg-primary/10 text-primary">Preview</Badge>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

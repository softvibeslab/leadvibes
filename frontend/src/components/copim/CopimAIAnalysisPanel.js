import React, { useState } from 'react';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { formatCopimDateTime } from './CopimModulePrimitives';

const statusTone = {
  bajo: 'bg-emerald-100 text-emerald-900',
  media: 'bg-amber-100 text-amber-900',
  alto: 'bg-rose-100 text-rose-900',
  critica: 'bg-rose-200 text-rose-950',
  fuerte: 'bg-emerald-100 text-emerald-900',
  moderado: 'bg-amber-100 text-amber-900',
  debil: 'bg-rose-100 text-rose-900',
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

export const CopimAIAnalysisPanel = ({
  api,
  entity,
  analysisPath,
  onAnalysisSaved,
  emptyTitle = 'Todavía no hay análisis',
  emptyDescription = 'Corre el análisis para obtener lectura ejecutiva y próximos pasos accionables.',
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const analysis = entity?.ai_analysis;
  const analyzedAt = entity?.ai_last_analyzed_at;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post(analysisPath);
      onAnalysisSaved?.(response.data);
      toast.success('Análisis IA actualizado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo ejecutar el análisis IA');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Análisis IA
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Lectura ejecutiva del registro, con señales de riesgo, oportunidades y acciones sugeridas.
            </p>
            {analyzedAt ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Último análisis: {formatCopimDateTime(analyzedAt)}
              </p>
            ) : null}
          </div>

          <Button onClick={handleAnalyze} disabled={analyzing} className="rounded-full">
            {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {analysis ? 'Reanalizar con IA' : 'Analizar con IA'}
          </Button>
        </CardHeader>
      </Card>

      {!analysis ? (
        <Card className="border-border/70 bg-muted/10">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-foreground">{emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>{analysis.score_label || 'Score general'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-semibold">{analysis.score || 0}</span>
                  <Badge className={`capitalize ${statusTone[analysis.status_value] || 'bg-slate-200 text-slate-900'}`}>
                    {(analysis.status_label || 'Estado')}: {analysis.status_value || 'medio'}
                  </Badge>
                </div>
                <Progress value={analysis.score || 0} />
                <p className="text-sm leading-7 text-muted-foreground">{analysis.executive_summary}</p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Próximos pasos sugeridos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {safeArray(analysis.recommended_actions).map((action) => (
                    <li key={action} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle>Puntos clave</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {safeArray(analysis.key_points).map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Mensaje sugerido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                  {analysis.suggested_message || 'La IA no generó un mensaje sugerido en este momento.'}
                </div>
              </CardContent>
            </Card>
          </div>

          {safeArray(analysis.detail_sections).length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {safeArray(analysis.detail_sections).map((section) => (
                <Card key={section.title} className="border-border/70 bg-card/95">
                  <CardHeader>
                    <CardTitle>{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {safeArray(section.items).map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                          <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

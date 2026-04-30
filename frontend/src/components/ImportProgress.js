/**
 * ImportProgress - ROVI CRM
 * Indicador de progreso en tiempo real para importación de leads
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ImportProgress = ({ jobId, onComplete, onCancel }) => {
  const [progress, setProgress] = useState(null);
  const [polling, setPolling] = useState(true);
  const { api } = useAuth();

  useEffect(() => {
    if (!jobId) return;

    const poll = setInterval(async () => {
      try {
        const response = await api.get(`/import/jobs/${jobId}`);
        const job = response.data;

        setProgress(job);

        // Si el job terminó, detener polling
        if (job.status === 'completed' || job.status === 'partial' || job.status === 'failed') {
          setPolling(false);
          clearInterval(poll);

          if (onComplete) {
            onComplete(job);
          }
        }
      } catch (error) {
        console.error('Error polling import:', error);
        setPolling(false);
        clearInterval(poll);

        // Mostrar error de polling
        setProgress({
          status: 'failed',
          error: 'Error al verificar estado del job'
        });
      }
    }, 2000); // Poll cada 2 segundos

    return () => clearInterval(poll);
  }, [jobId, onComplete]);

  // Mostrar skeleton mientras se carga el primer estado
  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Importando Leads...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'partial':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary">Procesando...</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completado</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falló</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const percentage = progress.total_rows > 0
    ? Math.min(100, Math.round((progress.imported_count / progress.total_rows) * 100))
    : 0;

  const duration = progress.completed_at || progress.started_at
    ? 'Completado'
    : 'En progreso...';

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            {progress.status === 'processing' && (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            {progress.status === 'completed' && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {progress.status === 'partial' && (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            {progress.status === 'failed' && (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            Importación de Leads
          </div>
          {getStatusBadge(progress.status)}
        </CardTitle>
        {progress.filename && (
          <p className="text-sm text-muted-foreground mt-1">
            Archivo: {progress.filename}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progreso</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{progress.imported_count || 0} / {progress.total_rows || 0}</span>
              <span className="font-semibold text-lg">{percentage}%</span>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-xs text-muted-foreground">{duration}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-3xl font-bold text-green-600">
              {progress.imported_count || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Importados</p>
            {progress.imported_count > 0 && (
              <CheckCircle className="w-4 h-4 mx-auto mt-2 text-green-600" />
            )}
          </div>

          <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-3xl font-bold text-yellow-600">
              {progress.skipped_count || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Duplicados</p>
            {progress.skipped_count > 0 && (
              <AlertCircle className="w-4 h-4 mx-auto mt-2 text-yellow-600" />
            )}
          </div>

          <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-3xl font-bold text-red-600">
              {progress.error_count || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Errores</p>
            {progress.error_count > 0 && (
              <XCircle className="w-4 h-4 mx-auto mt-2 text-red-600" />
            )}
          </div>
        </div>

        {/* Status Messages */}
        {progress.status === 'processing' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Procesando filas... por favor espera.</span>
          </div>
        )}

        {progress.status === 'completed' && (
          <div className="flex items-center gap-2 text-sm text-green-700 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">¡Importación completada exitosamente!</span>
          </div>
        )}

        {progress.status === 'partial' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-yellow-700 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Importación completada con advertencias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.imported_count} leads importados, {progress.skipped_count} duplicados omitidos, {progress.error_count} errores
            </p>
          </div>
        )}

        {progress.status === 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-red-700 p-3 bg-red-50 rounded-lg">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">La importación falló</span>
            </div>
            {progress.error && (
              <p className="text-xs text-red-600">{progress.error}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {progress.status === 'processing' && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Implement cancel functionality
                onCancel && onCancel();
              }}
            >
              Cancelar
            </Button>
          )}

          {progress.status !== 'processing' && (
            <Button onClick={() => {
              if (onComplete) {
                onComplete(progress);
              }
            }}>
              Cerrar
            </Button>
          )}
        </div>

        {/* Error Details (si hay errores) */}
        {progress.error_count > 0 && progress.errors && progress.errors.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Ver detalles de errores ({progress.errors.length})
            </summary>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {progress.errors.map((error, idx) => (
                <div key={idx} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Fila {error.row}:</span>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {error.errors?.map((err, errIdx) => (
                      <li key={errIdx} className="text-red-700">
                        • {err}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Compact Import Progress (versión pequeña para mostrar en modal)
 */
export const ImportProgressCompact = ({ jobId, onComplete }) => {
  const [progress, setProgress] = useState(null);
  const { api } = useAuth();

  useEffect(() => {
    if (!jobId) return;

    const poll = setInterval(async () => {
      try {
        const response = await api.get(`/import/jobs/${jobId}`);
        const job = response.data;

        setProgress(job);

        if (job.status === 'completed' || job.status === 'partial' || job.status === 'failed') {
          clearInterval(poll);
          if (onComplete) {
            onComplete(job);
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
        clearInterval(poll);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [jobId, onComplete]);

  if (!progress) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Iniciando...</span>
      </div>
    );
  }

  const percentage = progress.total_rows > 0
    ? Math.round((progress.imported_count / progress.total_rows) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {progress.status === 'processing' ? 'Importando...' : 'Estado'}
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="font-semibold text-green-600">{progress.imported_count}</span>
          <span className="text-muted-foreground">Importados</span>
        </div>
        <div>
          <span className="font-semibold text-yellow-600">{progress.skipped_count}</span>
          <span className="text-muted-foreground">Duplicados</span>
        </div>
        <div>
          <span className="font-semibold text-red-600">{progress.error_count}</span>
          <span className="text-muted-foreground">Errores</span>
        </div>
      </div>
    </div>
  );
};

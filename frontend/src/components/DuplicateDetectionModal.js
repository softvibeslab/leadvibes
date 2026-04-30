/**
 * DuplicateDetectionModal - ROVI CRM
 * Modal para mostrar duplicados encontrados y opciones de fusión
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from './ui/skeleton';

export const DuplicateDetectionModal = ({
  isOpen,
  onClose,
  leadData,
  onConfirm,
  onMergeSuggestion
}) => {
  const [duplicates, setDuplicates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  const [mergeSuggestions, setMergeSuggestions] = useState(null);
  const { api } = useAuth();

  useEffect(() => {
    if (isOpen && leadData) {
      checkDuplicates();
    } else {
      // Reset state cuando se cierra
      setDuplicates(null);
      setSelectedDuplicate(null);
      setMergeSuggestions(null);
      setError(null);
    }
  }, [isOpen, leadData]);

  if (!isOpen || !leadData) {
    return null;
  }

  const checkDuplicates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/leads/check-duplicates', leadData);
      setDuplicates(response.data);
    } catch (err) {
      console.error('Error checking duplicates:', err);
      setError('Error al verificar duplicados. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMergeSuggestions = async (duplicate) => {
    setSelectedDuplicate(duplicate);

    if (!mergeSuggestions) {
      try {
        // Usar el ID del lead actual y el duplicado
        const leadIdActual = 'temp-' + Date.now(); // ID temporal
        const response = await api.post('/leads/merge-suggestions', {
          lead_id_1: leadIdActual,
          lead_id_2: duplicate.lead_id
        });
        setMergeSuggestions(response.data.suggestions || []);
      } catch (err) {
        console.error('Error getting merge suggestions:', err);
        setMergeSuggestions([
          'Combinar información de ambos leads',
          'Mantener el lead más reciente',
          'Verificar información de contacto duplicada'
        ]);
      }
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 95) {
      return <Badge variant="destructive">Muy Alta</Badge>;
    } else if (confidence >= 80) {
      return <Badge variant="default">Alta</Badge>;
    } else if (confidence >= 60) {
      return <Badge variant="secondary">Media</Badge>;
    } else {
      return <Badge variant="outline">Baja</Badge>;
    }
  };

  const getReasonIcon = (reason) => {
    if (reason.includes('email_exact')) {
      return <Copy className="w-4 h-4" />;
    } else if (reason.includes('phone_exact')) {
      return <Copy className="w-4 h-4" />;
    } else {
      return <Eye className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verificando Duplicados...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => checkDuplicates()}>
                Reintentar
              </Button>
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Caso 1: No hay duplicados
  if (!loading && duplicates && duplicates.duplicates_found === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              ¡No Hay Duplicados!
            </DialogTitle>
            <DialogDescription>
              No se encontraron leads duplicados. Es seguro crear este lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-800">
                  ✅ Este lead es único en tu base de datos
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => onConfirm && onConfirm(leadData)}>
                Confirmar Creación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Caso 2: Hay duplicados
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl min-h-0 flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Duplicados Encontrados ({duplicates.duplicates_found})
          </DialogTitle>
          <DialogDescription>
            Se encontraron leads que podrían ser duplicados del que intentas crear.
            Revisa la información antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
          <div className="space-y-4">
          {duplicates.duplicates.map((duplicate, idx) => (
            <Card key={duplicate.lead_id || idx} className="p-4 border-orange-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{duplicate.name}</h4>
                    {getConfidenceBadge(duplicate.confidence)}
                  </div>

                  {/* Info principal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Email:</span>
                      <span className="font-medium">{duplicate.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Teléfono:</span>
                      <span className="font-medium">{duplicate.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Razón */}
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      {getReasonIcon(duplicate.reason)}
                      <span className="font-medium">Razón:</span>
                    </div>
                    <p className="text-sm">{duplicate.reason_display}</p>
                  </div>

                  {/* Detalles de similitud */}
                  {(duplicate.name_similarity !== undefined ||
                   duplicate.phone_similar ||
                   duplicate.email_similar) && (
                    <div className="flex gap-2 text-xs">
                      {duplicate.name_similarity !== undefined && (
                        <Badge variant="outline">
                          Nombre: {duplicate.name_similarity}%
                        </Badge>
                      )}
                      {duplicate.phone_similar && (
                        <Badge variant="outline">
                          Teléfono: Similar
                        </Badge>
                      )}
                      {duplicate.email_similar && (
                        <Badge variant="outline">
                          Email: Similar
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Sugerencias de fusión */}
                  {selectedDuplicate?.lead_id === duplicate.lead_id && mergeSuggestions && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Sugerencias de Fusión:
                      </h5>
                      <ul className="text-xs space-y-1">
                        {mergeSuggestions.map((suggestion, sidx) => (
                          <li key={sidx} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewMergeSuggestions(duplicate)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Fusión
                  </Button>
                  {selectedDuplicate?.lead_id === duplicate.lead_id && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (onMergeSuggestion) {
                          onMergeSuggestion(duplicate);
                        }
                      }}
                    >
                      Fusionar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          </div>
        </div>

        {/* Advertencia */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Recomendación:</p>
                <p>
                  Si la coincidencia es mayor al 90%, es probable que sea el mismo lead.
                  Considera fusionar la información o actualizar el lead existente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDuplicate(null);
              setMergeSuggestions(null);
            }}
          >
            Limpiar selección
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => onConfirm && onConfirm(leadData)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Crear de Todos Modos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * HOC para envolver componentes que necesitan detección de duplicados
 */
export const withDuplicateDetection = (WrappedComponent) => {
  return (props) => {
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [leadDataToCheck, setLeadDataToCheck] = useState(null);

    const handleBeforeCreate = (leadData) => {
      setLeadDataToCheck(leadData);
      setShowDuplicateModal(true);
    };

    const handleConfirmCreate = async (finalLeadData) => {
      setShowDuplicateModal(false);
      // Llamar a la función original del componente envuelto
      if (props.onCreate) {
        await props.onCreate(finalLeadData);
      }
    };

    return (
      <>
        <WrappedComponent
          {...props}
          onBeforeCreate={handleBeforeCreate}
        />
        <DuplicateDetectionModal
          isOpen={showDuplicateModal}
          onClose={() => {
            setShowDuplicateModal(false);
            setLeadDataToCheck(null);
          }}
          leadData={leadDataToCheck}
          onConfirm={handleConfirmCreate}
        />
      </>
    );
  };
};

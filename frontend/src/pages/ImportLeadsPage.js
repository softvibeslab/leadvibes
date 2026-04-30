import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle,
  Loader2, MapPin, CheckCircle2, XCircle, Users, FileWarning, X, Download, Package, Link2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert';
import { toast } from 'sonner';
import { ImportPreviewTable } from '../components/ImportPreviewTable';
import { ImportProgress } from '../components/ImportProgress';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, title: 'Subir Archivo', icon: Upload },
  { id: 2, title: 'Mapear Columnas', icon: MapPin },
  { id: 3, title: 'Vista Previa', icon: FileSpreadsheet },
  { id: 4, title: 'Resultado', icon: Check },
];

const IMPORT_TEMPLATES = [
  {
    title: 'Plantilla Leads',
    description: 'CSV para importar prospectos con campos base del pipeline.',
    href: '/plantilla_importador_leads.csv',
    badge: 'CSV',
  },
  {
    title: 'Plantilla Productos',
    description: 'CSV para cargar productos y servicios con SKU, alias y keywords.',
    href: '/plantilla_importador_productos.csv',
    badge: 'CSV',
  },
  {
    title: 'Plantilla Combinada',
    description: 'Excel con hojas de Productos, Leads e Instrucciones para vincular intereses.',
    href: '/plantilla_importador_combinada.xlsx',
    badge: 'XLSX',
  },
];

const IMPORT_FLOWS = [
  {
    id: 'leads',
    title: 'Importar Leads',
    description: 'Carga prospectos desde CSV o Excel y envíalos directo al pipeline.',
    icon: Users,
    badge: 'Disponible',
    badgeVariant: 'default',
    templateHref: '/plantilla_importador_leads.csv',
    templateLabel: 'Descargar plantilla de leads',
    enabled: true,
  },
  {
    id: 'products',
    title: 'Importar Productos',
    description: 'Prepara tu catálogo con SKU, alias, keywords y precios para futuras vinculaciones.',
    icon: Package,
    badge: 'Disponible',
    badgeVariant: 'default',
    templateHref: '/plantilla_importador_productos.csv',
    templateLabel: 'Descargar plantilla de productos',
    enabled: true,
  },
  {
    id: 'combined',
    title: 'Importar Leads + Productos',
    description: 'Usa una plantilla combinada para relacionar leads con el producto que les interesa.',
    icon: Link2,
    badge: 'Disponible',
    badgeVariant: 'default',
    templateHref: '/plantilla_importador_combinada.xlsx',
    templateLabel: 'Descargar plantilla combinada',
    enabled: true,
  },
];

const LEAD_FIELD_CONFIG = {
  name: { label: 'Nombre', required: true, type: 'string' },
  email: { label: 'Email', required: false, type: 'email' },
  phone: { label: 'Teléfono', required: true, type: 'phone' },
  source: { label: 'Fuente', required: false, type: 'string' },
  status: { label: 'Estado', required: false, type: 'select' },
  priority: { label: 'Prioridad', required: false, type: 'select' },
  budget_mxn: { label: 'Presupuesto (MXN)', required: false, type: 'number' },
  property_interest: { label: 'Interés Propiedad', required: false, type: 'string' },
  location_preference: { label: 'Ubicación Preferida', required: false, type: 'string' },
  notes: { label: 'Notas', required: false, type: 'text' },
  company: { label: 'Empresa', required: false, type: 'string' },
  position: { label: 'Puesto', required: false, type: 'string' },
};

const PRODUCT_FIELD_CONFIG = {
  sku: { label: 'SKU', required: true, type: 'string' },
  title: { label: 'Título', required: true, type: 'string' },
  description: { label: 'Descripción', required: false, type: 'text' },
  product_type: { label: 'Tipo de Producto', required: true, type: 'select' },
  niche: { label: 'Nicho', required: false, type: 'string' },
  price_mxn: { label: 'Precio (MXN)', required: false, type: 'number' },
  image_urls: { label: 'Image URLs', required: false, type: 'list' },
  aliases: { label: 'Alias', required: false, type: 'list' },
  keywords: { label: 'Keywords', required: false, type: 'list' },
  external_id: { label: 'ID Externo', required: false, type: 'string' },
  is_active: { label: 'Activo', required: false, type: 'boolean' },
};

const COMBINED_LEAD_FIELD_CONFIG = {
  ...LEAD_FIELD_CONFIG,
  raw_interest_text: { label: 'Interés Texto', required: false, type: 'string' },
  product_sku: { label: 'Producto SKU', required: false, type: 'string' },
  product_title: { label: 'Producto Título', required: false, type: 'string' },
};

const normalizeImportResult = (result) => {
  if (!result) return null;

  const normalizedErrors = Array.isArray(result.errors)
    ? result.errors
    : result.error_details ?? result.errors_list ?? result.result_errors ?? [];

  return {
    ...result,
    imported_count: result.imported_count ?? result.imported ?? 0,
    skipped_count: result.skipped_count ?? result.skipped ?? 0,
    error_count: result.error_count ?? result.errors ?? 0,
    errors: normalizedErrors,
  };
};

export const ImportLeadsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selectedFlow, setSelectedFlow] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Step 1: Upload state
  const [uploadResult, setUploadResult] = useState(null);
  
  // Step 2: Mapping state
  const [columnMappings, setColumnMappings] = useState({});
  const [combinedLeadMappings, setCombinedLeadMappings] = useState({});
  const [combinedProductMappings, setCombinedProductMappings] = useState({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [duplicateField, setDuplicateField] = useState('email');
  
  // Step 3: Preview state
  const [previewData, setPreviewData] = useState(null);
  
  // Step 4: Import result state
  const [importResult, setImportResult] = useState(null);
  const [importJobId, setImportJobId] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const activeFlow = IMPORT_FLOWS.find((flow) => flow.id === selectedFlow);

  const resetLeadImportState = () => {
    setCurrentStep(1);
    setLoading(false);
    setDragActive(false);
    setUploadResult(null);
    setColumnMappings({});
    setCombinedLeadMappings({});
    setCombinedProductMappings({});
    setSkipDuplicates(true);
    setDuplicateField('email');
    setPreviewData(null);
    setImportResult(null);
    setImportJobId(null);
    setShowProgressModal(false);
  };

  const handleSelectFlow = (flowId) => {
    resetLeadImportState();
    setSelectedFlow(flowId);
  };

  const handleBackToSelector = () => {
    resetLeadImportState();
    setSelectedFlow(null);
  };

  const flowLabels = {
    leads: {
      uploadTitle: 'Subir archivo de leads',
      uploadDescription: 'Soportamos archivos CSV y Excel (.xlsx) para prospectos y contactos.',
      previewAction: 'Importar leads',
      resultSuccess: 'Se importaron los leads exitosamente',
      resultError: 'No se pudieron importar los leads',
      resultNavigateLabel: 'Ver mis leads',
      resultNavigateTo: '/leads',
      requiredHelp: 'Campos requeridos: Nombre y Teléfono',
    },
    products: {
      uploadTitle: 'Subir archivo de productos',
      uploadDescription: 'Carga tu catálogo desde CSV o Excel con SKU, título, tipo y precio.',
      previewAction: 'Importar productos',
      resultSuccess: 'Se importaron los productos exitosamente',
      resultError: 'No se pudieron importar los productos',
      resultNavigateLabel: 'Ver catálogo',
      resultNavigateTo: '/products',
      requiredHelp: 'Campos requeridos: SKU y Título',
    },
    combined: {
      uploadTitle: 'Subir archivo combinado',
      uploadDescription: 'Usa un Excel con hojas de Productos y Leads para crear relaciones automáticas.',
      previewAction: 'Importar combinado',
      resultSuccess: 'Se importaron leads, productos y vínculos correctamente',
      resultError: 'No se pudo completar la importación combinada',
      resultNavigateLabel: 'Ver pipeline',
      resultNavigateTo: '/leads',
      requiredHelp: 'En Leads: Nombre y Teléfono. En Productos: SKU y Título.',
    },
  };

  const currentFlowLabels = flowLabels[selectedFlow] || flowLabels.leads;

  // Handle file drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    const validTypes = selectedFlow === 'combined' ? ['.xlsx', '.xls'] : ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    
    if (!validTypes.some(type => fileName.endsWith(type))) {
      toast.error(selectedFlow === 'combined'
        ? 'La importación combinada requiere un archivo Excel (.xlsx)'
        : 'Formato no soportado. Use CSV o Excel (.xlsx)');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadEndpoint = selectedFlow === 'products'
        ? '/api/import/products/upload'
        : selectedFlow === 'combined'
          ? '/api/import/combined/upload'
          : '/api/import/upload';

      const response = await fetch(`${API_URL}${uploadEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al subir archivo');
      }
      
      const result = await response.json();
      setUploadResult(result);
      
      if (selectedFlow === 'combined') {
        setCombinedLeadMappings(result.leads_mapping_suggestions || {});
        setCombinedProductMappings(result.products_mapping_suggestions || {});
      } else if (result.mapping_suggestions) {
        setColumnMappings(result.mapping_suggestions);
      }
      
      if (selectedFlow === 'combined') {
        toast.success(`Archivo cargado: ${result.products_total_rows} productos y ${result.leads_total_rows} leads encontrados`);
      } else {
        toast.success(`Archivo cargado: ${result.total_rows} filas encontradas`);
      }
      setCurrentStep(2);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFlow, token]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle mapping change
  const handleMappingChange = (targetField, sourceColumn) => {
    setColumnMappings(prev => {
      const newMappings = { ...prev };
      
      // Remove any existing mapping for this target field
      Object.keys(newMappings).forEach(key => {
        if (newMappings[key] === sourceColumn && key !== targetField) {
          delete newMappings[key];
        }
      });
      
      if (sourceColumn === 'none') {
        delete newMappings[targetField];
      } else {
        newMappings[targetField] = sourceColumn;
      }
      
      return newMappings;
    });
  };

  const handleCombinedMappingChange = (scope, targetField, sourceColumn) => {
    const setScopeMappings = scope === 'products' ? setCombinedProductMappings : setCombinedLeadMappings;

    setScopeMappings((prev) => {
      const nextMappings = { ...prev };

      Object.keys(nextMappings).forEach((key) => {
        if (nextMappings[key] === sourceColumn && key !== targetField) {
          delete nextMappings[key];
        }
      });

      if (sourceColumn === 'none') {
        delete nextMappings[targetField];
      } else {
        nextMappings[targetField] = sourceColumn;
      }

      return nextMappings;
    });
  };

  // Generate preview
  const handlePreview = async () => {
    if (selectedFlow === 'combined') {
      if (!combinedLeadMappings.name || !combinedLeadMappings.phone) {
        toast.error('Debe mapear al menos Nombre y Teléfono en la hoja de leads');
        return;
      }
      if (!combinedProductMappings.sku || !combinedProductMappings.title) {
        toast.error('Debe mapear al menos SKU y Título en la hoja de productos');
        return;
      }
    } else if (selectedFlow === 'products') {
      if (!columnMappings.sku || !columnMappings.title) {
        toast.error('Debe mapear al menos SKU y Título');
        return;
      }
    } else if (!columnMappings.name || !columnMappings.phone) {
      toast.error('Debe mapear al menos Nombre y Teléfono');
      return;
    }
    
    setLoading(true);
    
    try {
      const buildMappingArray = (mappings) => Object.entries(mappings).map(([target, source]) => ({
        source_column: source,
        target_field: target,
      }));

      const endpoint = selectedFlow === 'products'
        ? '/api/import/products/preview'
        : selectedFlow === 'combined'
          ? '/api/import/combined/preview'
          : '/api/import/preview';

      const body = selectedFlow === 'combined'
        ? {
            job_id: uploadResult.job_id,
            leads_mapping: buildMappingArray(combinedLeadMappings),
            products_mapping: buildMappingArray(combinedProductMappings),
            skip_duplicates: skipDuplicates,
            duplicate_field: duplicateField,
          }
        : {
            job_id: uploadResult.job_id,
            mapping: buildMappingArray(columnMappings),
            skip_duplicates: skipDuplicates,
            duplicate_field: duplicateField,
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al generar vista previa');
      }
      
      const result = await response.json();
      setPreviewData(result);
      setCurrentStep(3);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute import
  const handleImport = async () => {
    setLoading(true);

    try {
      const buildMappingArray = (mappings) => Object.entries(mappings).map(([target, source]) => ({
        source_column: source,
        target_field: target,
      }));

      const endpoint = selectedFlow === 'products'
        ? '/api/import/products/execute'
        : selectedFlow === 'combined'
          ? '/api/import/combined/execute'
          : '/api/import/execute';

      const body = selectedFlow === 'combined'
        ? {
            job_id: uploadResult.job_id,
            leads_mapping: buildMappingArray(combinedLeadMappings),
            products_mapping: buildMappingArray(combinedProductMappings),
            skip_duplicates: skipDuplicates,
            duplicate_field: duplicateField,
          }
        : {
            job_id: uploadResult.job_id,
            mapping: buildMappingArray(columnMappings),
            skip_duplicates: skipDuplicates,
            duplicate_field: duplicateField,
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al importar leads');
      }

      const responseData = await response.json();
      const result = selectedFlow === 'combined'
        ? responseData
        : normalizeImportResult(responseData);

      // Mostrar modal de progreso en tiempo real
      if (result.job_id) {
        setImportJobId(result.job_id);
        setShowProgressModal(true);
      } else {
        // Fallback: mostrar resultado directo si no hay job_id
        setImportResult(result);
        setCurrentStep(4);

        if (result.imported_count > 0) {
          toast.success(`${result.imported_count} leads importados exitosamente`);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler para cuando se completa el job
  const handleImportComplete = (result) => {
    const normalizedResult = normalizeImportResult(result);
    setImportResult(normalizedResult);
    setShowProgressModal(false);
    setCurrentStep(4);

    if (normalizedResult.imported_count > 0) {
      toast.success(`${normalizedResult.imported_count} leads importados exitosamente`);
    }
  };

  // Reset wizard
  const handleReset = () => {
    resetLeadImportState();
  };

  const renderTemplatesGrid = () => (
    <div className="grid gap-3 md:grid-cols-3">
      {IMPORT_TEMPLATES.map((template) => (
        <button
          key={template.href}
          type="button"
          onClick={() => window.open(template.href, '_blank')}
          className="rounded-xl border border-border/70 bg-card/80 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-medium text-foreground">{template.title}</span>
            <Badge variant="secondary">{template.badge}</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {template.description}
          </p>
        </button>
      ))}
    </div>
  );

  const renderFlowSelector = () => (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Selecciona qué quieres importar</CardTitle>
        <CardDescription>
          Usa el mismo módulo para cargar leads, preparar productos y dejar lista la importación combinada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {IMPORT_FLOWS.map((flow) => {
            const Icon = flow.icon;
            return (
              <button
                key={flow.id}
                type="button"
                onClick={() => handleSelectFlow(flow.id)}
                className="rounded-2xl border border-border/70 bg-muted/20 p-5 text-left transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge variant={flow.badgeVariant}>{flow.badge}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{flow.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {flow.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm text-primary">
                  <span>{flow.enabled ? 'Abrir flujo' : 'Ver detalle'}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Plantillas disponibles</h4>
          </div>
          {renderTemplatesGrid()}
        </div>
      </CardContent>
    </Card>
  );

  const renderUpcomingFlow = () => {
    if (!activeFlow || activeFlow.enabled) return null;

    const Icon = activeFlow.icon;

    return (
      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{activeFlow.title}</CardTitle>
              <CardDescription>{activeFlow.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Flujo en preparación</AlertTitle>
            <AlertDescription>
              La interfaz del nuevo Importador ya está lista y la plantilla también. El siguiente paso es conectar la lógica backend específica para este modo.
            </AlertDescription>
          </Alert>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
            <h4 className="mb-3 font-medium">Qué ya puedes hacer</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Descargar la plantilla correcta y compartirla con tu equipo.</p>
              <p>Definir columnas estándar para SKU, alias, keywords o relación producto-lead.</p>
              <p>Preparar datos consistentes antes de conectar la importación automática.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => window.open(activeFlow.templateHref, '_blank')}>
              <Download className="mr-2 h-4 w-4" />
              {activeFlow.templateLabel}
            </Button>
            <Button variant="outline" onClick={handleBackToSelector}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cambiar tipo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 1: Upload
  const renderUploadStep = () => (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              {currentFlowLabels.uploadTitle}
            </CardTitle>
            <CardDescription className="mt-1">
              {currentFlowLabels.uploadDescription}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Plantillas disponibles</h4>
          </div>
          {renderTemplatesGrid()}
        </div>

        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 transition-all
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${loading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-testid="drop-zone"
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
            data-testid="file-input"
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            {loading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            )}
            <h3 className="text-lg font-semibold mb-2">
              {loading ? 'Procesando archivo...' : 'Arrastra tu archivo aquí'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary">CSV</Badge>
              <Badge variant="secondary">XLSX</Badge>
              <Badge variant="secondary">XLS</Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Consejos para una importación exitosa
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>La primera fila debe contener los nombres de las columnas</li>
            <li>{currentFlowLabels.requiredHelp}</li>
            <li>Formatos CSV y Excel son compatibles con el Importador.</li>
            <li>Descarga la plantilla correcta antes de pedir archivos a tu equipo.</li>
            {selectedFlow !== 'products' && (
              <li>Los duplicados se detectan automáticamente por email o teléfono.</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Mapping
  const renderMappingStep = () => {
    if (!uploadResult) return null;
    const singleFlowFieldConfig = selectedFlow === 'products'
      ? PRODUCT_FIELD_CONFIG
      : LEAD_FIELD_CONFIG;
    const combinedLeadFieldConfig = uploadResult.leads_available_fields || COMBINED_LEAD_FIELD_CONFIG;
    const combinedProductFieldConfig = uploadResult.products_available_fields || PRODUCT_FIELD_CONFIG;
    const mappingFields = selectedFlow === 'products'
      ? uploadResult.available_fields || PRODUCT_FIELD_CONFIG
      : uploadResult.available_fields || singleFlowFieldConfig;
    const safeSingleFlowMappings = Object.fromEntries(
      Object.entries(columnMappings).filter(([field]) => Object.prototype.hasOwnProperty.call(mappingFields, field))
    );

    const renderSourcePreview = (title, headers, sampleRows) => (
      sampleRows && sampleRows.length > 0 ? (
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">{title}</h4>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.slice(0, 6).map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                  {headers.length > 6 && (
                    <TableHead className="text-center">...</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleRows.slice(0, 3).map((row, i) => (
                  <TableRow key={i}>
                    {headers.slice(0, 6).map((header) => (
                      <TableCell key={header} className="max-w-[150px] truncate">
                        {row[header] || '-'}
                      </TableCell>
                    ))}
                    {headers.length > 6 && (
                      <TableCell className="text-center text-muted-foreground">...</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null
    );

    const renderMappingCard = ({ title, description, availableFields, sourceHeaders, mappings, onMappingChange, dataTestIdPrefix }) => {
      const mappedColumns = new Set(Object.values(mappings));

      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Campos requeridos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(availableFields)
                  .filter(([, config]) => config.required)
                  .map(([field, config]) => (
                    <div key={field} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        {config.label}
                        <Badge variant="destructive" className="text-[10px]">Requerido</Badge>
                      </Label>
                      <Select
                        value={mappings[field] || 'none'}
                        onValueChange={(value) => onMappingChange(field, value)}
                      >
                        <SelectTrigger data-testid={`${dataTestIdPrefix}-${field}`}>
                          <SelectValue placeholder="Seleccionar columna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No mapear --</SelectItem>
                          {sourceHeaders.map((header) => (
                            <SelectItem
                              key={header}
                              value={header}
                              disabled={mappedColumns.has(header) && mappings[field] !== header}
                            >
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Campos opcionales
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(availableFields)
                  .filter(([, config]) => !config.required)
                  .map(([field, config]) => (
                    <div key={field} className="space-y-2">
                      <Label>{config.label}</Label>
                      <Select
                        value={mappings[field] || 'none'}
                        onValueChange={(value) => onMappingChange(field, value)}
                      >
                        <SelectTrigger data-testid={`${dataTestIdPrefix}-${field}`}>
                          <SelectValue placeholder="Seleccionar columna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No mapear --</SelectItem>
                          {sourceHeaders.map((header) => (
                            <SelectItem
                              key={header}
                              value={header}
                              disabled={mappedColumns.has(header) && mappings[field] !== header}
                            >
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    };

    const disablePreview = selectedFlow === 'products'
      ? loading || !columnMappings.sku || !columnMappings.title
      : selectedFlow === 'combined'
        ? loading || !combinedLeadMappings.name || !combinedLeadMappings.phone || !combinedProductMappings.sku || !combinedProductMappings.title
        : loading || !columnMappings.name || !columnMappings.phone;

    return (
      <div className="space-y-6">
        {selectedFlow === 'combined' ? (
          <>
            {renderMappingCard({
              title: 'Mapeo de productos',
              description: `Archivo: ${uploadResult.filename} (${uploadResult.products_total_rows} productos detectados)`,
              availableFields: combinedProductFieldConfig,
              sourceHeaders: uploadResult.products_headers || [],
              mappings: combinedProductMappings,
              onMappingChange: (field, value) => handleCombinedMappingChange('products', field, value),
              dataTestIdPrefix: 'mapping-products',
            })}

            {renderSourcePreview(
              'Vista previa original de productos',
              uploadResult.products_headers || [],
              uploadResult.products_sample_data || []
            )}

            {renderMappingCard({
              title: 'Mapeo de leads',
              description: `Archivo: ${uploadResult.filename} (${uploadResult.leads_total_rows} leads detectados)`,
              availableFields: combinedLeadFieldConfig,
              sourceHeaders: uploadResult.leads_headers || [],
              mappings: combinedLeadMappings,
              onMappingChange: (field, value) => handleCombinedMappingChange('leads', field, value),
              dataTestIdPrefix: 'mapping-leads',
            })}

            <Card>
              <CardContent className="pt-6">
                <div className="pt-0">
                  <h4 className="font-medium mb-3">Manejo de duplicados en leads</h4>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skip-duplicates"
                        checked={skipDuplicates}
                        onCheckedChange={setSkipDuplicates}
                      />
                      <Label htmlFor="skip-duplicates" className="text-sm">
                        Omitir leads duplicados
                      </Label>
                    </div>
                    {skipDuplicates && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">Detectar por:</Label>
                        <Select value={duplicateField} onValueChange={setDuplicateField}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Teléfono</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {renderSourcePreview(
              'Vista previa original de leads',
              uploadResult.leads_headers || [],
              uploadResult.leads_sample_data || []
            )}
          </>
        ) : (
          <>
            {renderMappingCard({
              title: 'Mapear columnas',
              description: `Archivo: ${uploadResult.filename} (${uploadResult.total_rows} filas)`,
              availableFields: mappingFields,
              sourceHeaders: uploadResult.headers || [],
              mappings: safeSingleFlowMappings,
              onMappingChange: handleMappingChange,
              dataTestIdPrefix: 'mapping',
            })}

            {selectedFlow !== 'products' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="pt-0">
                    <h4 className="font-medium mb-3">Manejo de duplicados</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skip-duplicates"
                          checked={skipDuplicates}
                          onCheckedChange={setSkipDuplicates}
                          data-testid="skip-duplicates-checkbox"
                        />
                        <Label htmlFor="skip-duplicates" className="text-sm">
                          Omitir leads duplicados
                        </Label>
                      </div>
                      {skipDuplicates && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">Detectar por:</Label>
                          <Select value={duplicateField} onValueChange={setDuplicateField}>
                            <SelectTrigger className="w-32" data-testid="duplicate-field-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Teléfono</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {renderSourcePreview(
              'Vista previa de datos originales',
              uploadResult.headers || [],
              uploadResult.sample_data || []
            )}
          </>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset} data-testid="back-to-upload-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cambiar archivo
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleBackToSelector}>
              Cambiar tipo
            </Button>
            <Button
              onClick={handlePreview}
              disabled={disablePreview}
              data-testid="preview-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Vista previa
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Preview
  const renderPreviewStep = () => {
    if (!previewData) return null;

    if (selectedFlow === 'combined') {
      const productsPreviewData = {
        preview_rows: previewData.products_preview_rows,
        total_rows: previewData.products_total_rows,
        valid_rows: previewData.products_valid_rows,
        error_rows: previewData.products_error_rows,
      };
      const leadsPreviewData = {
        preview_rows: previewData.leads_preview_rows,
        total_rows: previewData.leads_total_rows,
        valid_rows: previewData.leads_valid_rows,
        error_rows: previewData.leads_error_rows,
      };

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-primary">{previewData.total_rows}</div><p className="text-sm text-muted-foreground">Total filas</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-500">{previewData.products_valid_rows}</div><p className="text-sm text-muted-foreground">Productos válidos</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-500">{previewData.leads_valid_rows}</div><p className="text-sm text-muted-foreground">Leads válidos</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-violet-500">{previewData.link_matches}</div><p className="text-sm text-muted-foreground">Vínculos listos</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-500">{previewData.link_warnings}</div><p className="text-sm text-muted-foreground">Sin match auto</p></CardContent></Card>
          </div>

          {previewData.link_warnings > 0 && (
            <Alert>
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Hay leads sin producto vinculado automáticamente</AlertTitle>
              <AlertDescription>
                Esos leads sí se pueden importar. Se conservará su interés en texto y podrás vincularlos después manualmente.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="mb-3 text-lg font-semibold">Vista previa de productos</h3>
              <ImportPreviewTable
                previewData={productsPreviewData}
                mapping={Object.entries(combinedProductMappings).map(([target, source]) => ({
                  source_column: source,
                  target_field: target,
                }))}
                showAllRows={false}
              />
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Vista previa de leads y vínculos</h3>
              <ImportPreviewTable
                previewData={leadsPreviewData}
                mapping={Object.entries(combinedLeadMappings).map(([target, source]) => ({
                  source_column: source,
                  target_field: target,
                }))}
                showAllRows={false}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="back-to-mapping-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ajustar mapeo
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleBackToSelector}>
                Cambiar tipo
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || (previewData.products_valid_rows === 0 && previewData.leads_valid_rows === 0)}
                data-testid="import-btn"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Importar combinado
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const activeMappings = columnMappings;
    const actionLabel = selectedFlow === 'products'
      ? `Importar ${Math.max(previewData.total_rows - previewData.error_rows - previewData.duplicates_found, 0)} productos`
      : `Importar ${Math.max(previewData.total_rows - previewData.duplicates_found - previewData.error_rows, 0)} leads`;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{previewData.total_rows}</div>
              <p className="text-sm text-muted-foreground">Total filas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{previewData.valid_rows}</div>
              <p className="text-sm text-muted-foreground">Filas válidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-500">{previewData.duplicates_found}</div>
              <p className="text-sm text-muted-foreground">Duplicados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{previewData.error_rows}</div>
              <p className="text-sm text-muted-foreground">Con errores</p>
            </CardContent>
          </Card>
        </div>

        {previewData.duplicates_found > 0 && (
          <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Duplicados detectados</AlertTitle>
            <AlertDescription>
              {selectedFlow === 'products'
                ? `Se encontraron ${previewData.duplicates_found} productos que ya existen en tu catálogo.`
                : `Se encontraron ${previewData.duplicates_found} leads que ya existen en tu base de datos.`}
              {skipDuplicates && selectedFlow !== 'products' && ' Serán omitidos durante la importación.'}
              {previewData.duplicate_values && previewData.duplicate_values.length > 0 && (
                <span className="block mt-1 text-xs">
                  Ejemplos: {previewData.duplicate_values.join(', ')}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <ImportPreviewTable
          previewData={previewData}
          mapping={Object.entries(activeMappings).map(([target, source]) => ({
            source_column: source,
            target_field: target,
          }))}
          showAllRows={false}
        />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="back-to-mapping-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ajustar mapeo
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleBackToSelector}>
              Cambiar tipo
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || previewData.valid_rows === 0}
              data-testid="import-btn"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : selectedFlow === 'products' ? (
                <Package className="w-4 h-4 mr-2" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              {actionLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Result
  const renderResultStep = () => {
    if (!importResult) return null;

    if (selectedFlow === 'combined') {
      const isSuccess = importResult.imported_count > 0;
      const hasErrors = importResult.error_count > 0;

      return (
        <div className="space-y-6">
          <Card className={isSuccess ? 'border-green-500/50' : 'border-red-500/50'}>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className={`w-16 h-16 ${isSuccess ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {isSuccess ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
                </div>
                <h2 className="text-2xl font-bold mb-2">{isSuccess ? 'Importación combinada completada' : 'Importación combinada fallida'}</h2>
                <p className="text-muted-foreground">
                  {isSuccess ? currentFlowLabels.resultSuccess : currentFlowLabels.resultError}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 py-6 border-t">
                <div className="text-center"><div className="text-3xl font-bold text-blue-500">{importResult.products_imported_count || 0}</div><p className="text-sm text-muted-foreground">Productos</p></div>
                <div className="text-center"><div className="text-3xl font-bold text-green-500">{importResult.leads_imported_count || 0}</div><p className="text-sm text-muted-foreground">Leads</p></div>
                <div className="text-center"><div className="text-3xl font-bold text-violet-500">{importResult.links_created || 0}</div><p className="text-sm text-muted-foreground">Vínculos</p></div>
                <div className="text-center"><div className="text-3xl font-bold text-amber-500">{importResult.skipped_count || 0}</div><p className="text-sm text-muted-foreground">Omitidos</p></div>
                <div className="text-center"><div className="text-3xl font-bold text-red-500">{importResult.error_count || 0}</div><p className="text-sm text-muted-foreground">Errores</p></div>
              </div>

              {hasErrors && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                  <h4 className="mb-2 font-medium text-red-700 dark:text-red-400">Detalles de errores</h4>
                  <div className="space-y-2 text-sm">
                    {(importResult.errors?.products || []).slice(0, 5).map((err, i) => (
                      <p key={`product-${i}`} className="text-red-600 dark:text-red-400">Producto fila {err.row}: {err.errors.join(', ')}</p>
                    ))}
                    {(importResult.errors?.leads || []).slice(0, 5).map((err, i) => (
                      <p key={`lead-${i}`} className="text-red-600 dark:text-red-400">Lead fila {err.row}: {err.errors.join(', ')}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleReset} data-testid="import-again-btn">
              <Upload className="w-4 h-4 mr-2" />
              Importar otro archivo
            </Button>
            <Button onClick={() => navigate(currentFlowLabels.resultNavigateTo)} data-testid="go-to-leads-btn">
              <Users className="w-4 h-4 mr-2" />
              {currentFlowLabels.resultNavigateLabel}
            </Button>
          </div>
        </div>
      );
    }

    const normalizedResult = normalizeImportResult(importResult);
    const isSuccess = normalizedResult.imported_count > 0;
    const hasErrors = normalizedResult.error_count > 0;

    return (
      <div className="space-y-6">
        <Card className={isSuccess ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              {isSuccess ? (
                <>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Importación completada</h2>
                  <p className="text-muted-foreground">
                    {currentFlowLabels.resultSuccess}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Importación fallida</h2>
                  <p className="text-muted-foreground">
                    {currentFlowLabels.resultError}
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{normalizedResult.imported_count}</div>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">{normalizedResult.skipped_count}</div>
                <p className="text-sm text-muted-foreground">Omitidos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{normalizedResult.error_count}</div>
                <p className="text-sm text-muted-foreground">Errores</p>
              </div>
            </div>

            {hasErrors && normalizedResult.errors && normalizedResult.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Detalles de errores:</h4>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {normalizedResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-red-600 dark:text-red-400">
                      Fila {err.row}: {err.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleReset} data-testid="import-again-btn">
            <Upload className="w-4 h-4 mr-2" />
            Importar otro archivo
          </Button>
          <Button onClick={() => navigate(currentFlowLabels.resultNavigateTo)} data-testid="go-to-leads-btn">
            {selectedFlow === 'products' ? <Package className="w-4 h-4 mr-2" /> : <Users className="w-4 h-4 mr-2" />}
            {currentFlowLabels.resultNavigateLabel}
          </Button>
        </div>
      </div>
    );
  };

  // Modal de progreso de importación
  if (showProgressModal && importJobId) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full">
          <ImportProgress
            jobId={importJobId}
            onComplete={handleImportComplete}
            onCancel={() => {
              setShowProgressModal(false);
              toast.info('Importación cancelada por el usuario');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Importador</h1>
              <p className="text-muted-foreground mt-1">
                Centraliza la carga de leads, productos y relaciones entre ambos desde un solo módulo.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/leads')}
              data-testid="close-import-btn"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {selectedFlow && (
            <div className="relative">
              <div className="flex items-center justify-between">
                {STEPS.map((step) => (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all
                        ${currentStep >= step.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'}
                      `}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`
                      text-xs mt-2 text-center hidden sm:block
                      ${currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}
                    `}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Step content */}
        <div className="pb-8">
          {!selectedFlow && renderFlowSelector()}
          {selectedFlow && currentStep === 1 && renderUploadStep()}
          {selectedFlow && currentStep === 2 && renderMappingStep()}
          {selectedFlow && currentStep === 3 && renderPreviewStep()}
          {selectedFlow && currentStep === 4 && renderResultStep()}
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsPage;

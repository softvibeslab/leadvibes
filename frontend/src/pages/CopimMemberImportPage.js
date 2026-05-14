import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileArchive,
  FileSpreadsheet,
  Images,
  Loader2,
  MapPinned,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { CopimMemberIdentity, CopimPageHeader, formatCopimCurrency } from '../components/copim/CopimModulePrimitives';
import { buildCopimPath } from '../lib/copimRouting';

const NONE_VALUE = '__none__';

const STEPS = [
  { id: 1, title: 'Carga', icon: Upload },
  { id: 2, title: 'Mapeo', icon: MapPinned },
  { id: 3, title: 'Vista previa', icon: FileSpreadsheet },
  { id: 4, title: 'Resultado', icon: CheckCircle2 },
];

const mergeStrategies = [
  {
    value: 'smart_merge',
    label: 'Actualizar duplicados',
    description: 'Crea socios nuevos y actualiza los existentes por correo, telefono o ID CIIB.',
  },
  {
    value: 'create_only',
    label: 'Solo crear nuevos',
    description: 'Omite registros que ya existen para evitar cambios accidentales.',
  },
];

const memberStatusOptions = [
  { value: 'source', label: 'Detectar por archivo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Activo' },
  { value: 'suspended', label: 'Suspendido' },
];

const actionLabels = {
  create: 'Crear',
  update: 'Actualizar',
  skip_duplicate: 'Duplicado',
  error: 'Error',
};

const actionTone = {
  create: 'bg-emerald-100 text-emerald-900',
  update: 'bg-cyan-100 text-cyan-900',
  skip_duplicate: 'bg-amber-100 text-amber-900',
  error: 'bg-rose-100 text-rose-900',
};

const buildRequestMapping = (columnMappings) => (
  Object.entries(columnMappings)
    .filter(([, sourceColumn]) => sourceColumn && sourceColumn !== NONE_VALUE)
    .map(([target_field, source_column]) => ({ target_field, source_column }))
);

const normalizeFields = (fields) => (
  Object.entries(fields || {}).map(([key, value]) => ({
    key,
    label: value?.label || key,
    required: Boolean(value?.required),
    type: value?.type || 'string',
  }))
);

export const CopimMemberImportPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [associations, setAssociations] = useState([]);
  const [fields, setFields] = useState({});
  const [associationId, setAssociationId] = useState(() => searchParams.get('association') || '');
  const [dataFiles, setDataFiles] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('smart_merge');
  const [createMemberships, setCreateMemberships] = useState(true);
  const [defaultMemberStatus, setDefaultMemberStatus] = useState('source');
  const [uploadResult, setUploadResult] = useState(null);
  const [columnMappings, setColumnMappings] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const fieldEntries = useMemo(
    () => normalizeFields(uploadResult?.available_fields || fields),
    [fields, uploadResult],
  );
  const requiredFields = useMemo(
    () => fieldEntries.filter((field) => field.required),
    [fieldEntries],
  );
  const headers = uploadResult?.headers || [];
  const stats = previewData?.stats || {};
  const selectedStrategy = mergeStrategies.find((strategy) => strategy.value === mergeStrategy);

  useEffect(() => {
    let cancelled = false;

    const loadSetup = async () => {
      try {
        const [associationResponse, fieldsResponse] = await Promise.all([
          api.get('/copim/associations'),
          api.get('/copim/import/members/fields'),
        ]);
        if (cancelled) return;

        const nextAssociations = associationResponse.data || [];
        setAssociations(nextAssociations);
        setFields(fieldsResponse.data?.fields || {});

        if (!associationId && nextAssociations.length === 1) {
          setAssociationId(nextAssociations[0].id);
        }
      } catch (error) {
        console.error('Error loading COPIM import setup:', error);
        if (!cancelled) {
          toast.error('No se pudo cargar la configuracion de importacion');
        }
      }
    };

    void loadSetup();

    return () => {
      cancelled = true;
    };
  }, [api, associationId]);

  const applySuggestions = (suggestions = {}, availableFields = {}) => {
    const nextMappings = {};
    Object.keys(availableFields || {}).forEach((fieldKey) => {
      nextMappings[fieldKey] = suggestions[fieldKey] || NONE_VALUE;
    });
    setColumnMappings(nextMappings);
  };

  const handleUpload = async () => {
    if (!associationId) {
      toast.error('Selecciona la asociacion destino');
      return;
    }
    if (!dataFiles.length) {
      toast.error('Agrega al menos un archivo CSV o Excel');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      dataFiles.forEach((file) => formData.append('data_files', file));
      mediaFiles.forEach((file) => formData.append('media_files', file));
      formData.append('association_id', associationId);
      formData.append('merge_strategy', mergeStrategy);
      formData.append('create_memberships', createMemberships ? 'true' : 'false');
      formData.append('default_member_status', defaultMemberStatus);

      const response = await api.post('/copim/import/members/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(response.data);
      applySuggestions(response.data?.mapping_suggestions, response.data?.available_fields);
      setPreviewData(null);
      setImportResult(null);
      setCurrentStep(2);
      toast.success('Archivos cargados. Revisa el mapeo antes de importar.');
    } catch (error) {
      console.error('Error uploading COPIM members:', error);
      toast.error(error.response?.data?.detail || 'No se pudo cargar la importacion');
    } finally {
      setLoading(false);
    }
  };

  const validateMapping = () => {
    const mappedFields = new Set(
      buildRequestMapping(columnMappings).map((item) => item.target_field),
    );
    const missing = requiredFields.filter((field) => !mappedFields.has(field.key));
    if (missing.length) {
      toast.error(`Falta mapear: ${missing.map((field) => field.label).join(', ')}`);
      return false;
    }
    return true;
  };

  const buildImportPayload = () => ({
    job_id: uploadResult?.job_id,
    mapping: buildRequestMapping(columnMappings),
    merge_strategy: mergeStrategy,
    create_memberships: createMemberships,
    default_member_status: defaultMemberStatus,
  });

  const handlePreview = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    try {
      const response = await api.post('/copim/import/members/preview', buildImportPayload());
      setPreviewData(response.data);
      setCurrentStep(3);
      toast.success('Vista previa lista');
    } catch (error) {
      console.error('Error previewing COPIM members:', error);
      toast.error(error.response?.data?.detail || 'No se pudo generar la vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    try {
      const response = await api.post('/copim/import/members/execute', buildImportPayload());
      setImportResult(response.data);
      setCurrentStep(4);
      toast.success('Importacion de socios completada');
    } catch (error) {
      console.error('Error executing COPIM member import:', error);
      toast.error(error.response?.data?.detail || 'No se pudo ejecutar la importacion');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setDataFiles([]);
    setMediaFiles([]);
    setUploadResult(null);
    setColumnMappings({});
    setPreviewData(null);
    setImportResult(null);
  };

  const goToMembers = () => {
    navigate(buildCopimPath('/copim/members', {
      association: associationId || null,
    }));
  };

  const renderStepper = () => (
    <div className="grid gap-3 md:grid-cols-4">
      {STEPS.map((step) => {
        const Icon = step.icon;
        const active = currentStep === step.id;
        const complete = currentStep > step.id;
        return (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              active
                ? 'border-primary bg-primary/10 text-primary'
                : complete
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                  : 'border-border/70 bg-card text-muted-foreground'
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Paso {step.id}</p>
              <p className="text-xs">{step.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderUploadStep = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Archivos de socios
          </CardTitle>
          <CardDescription>
            Puedes subir la base organizada, formularios CSV o varios archivos a la vez. El importador unifica filas y conserva el origen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Asociacion destino</Label>
              <Select value={associationId || NONE_VALUE} onValueChange={(value) => setAssociationId(value === NONE_VALUE ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona CIIB" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Seleccionar asociacion</SelectItem>
                  {associations.map((association) => (
                    <SelectItem key={association.id} value={association.id}>
                      {association.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estrategia de duplicados</Label>
              <Select value={mergeStrategy} onValueChange={setMergeStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mergeStrategies.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value}>{strategy.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{selectedStrategy?.description}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-1 h-5 w-5 text-primary" />
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">CSV / Excel</p>
                    <p className="text-sm text-muted-foreground">Acepta .csv, .xlsx y .xls.</p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={(event) => setDataFiles(Array.from(event.target.files || []))}
                  />
                  {dataFiles.length ? (
                    <div className="space-y-2 text-sm">
                      {dataFiles.map((file) => (
                        <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                          <span className="truncate">{file.name}</span>
                          <Badge variant="secondary">{Math.ceil(file.size / 1024)} KB</Badge>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5">
              <div className="flex items-start gap-3">
                <Images className="mt-1 h-5 w-5 text-primary" />
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Fotos, logos o ZIP</p>
                    <p className="text-sm text-muted-foreground">Opcional. Las imagenes se vinculan por nombre de archivo.</p>
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept=".zip,.jpg,.jpeg,.png,.webp,.svg"
                    onChange={(event) => setMediaFiles(Array.from(event.target.files || []))}
                  />
                  {mediaFiles.length ? (
                    <div className="space-y-2 text-sm">
                      {mediaFiles.slice(0, 5).map((file) => (
                        <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
                          <span className="truncate">{file.name}</span>
                          <Badge variant="secondary">{Math.ceil(file.size / 1024)} KB</Badge>
                        </div>
                      ))}
                      {mediaFiles.length > 5 ? <p className="text-xs text-muted-foreground">+{mediaFiles.length - 5} archivos mas</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
              <div>
                <p className="font-semibold">Crear membresias</p>
                <p className="text-sm text-muted-foreground">Genera el registro financiero si el archivo trae tipo de membresia.</p>
              </div>
              <Switch checked={createMemberships} onCheckedChange={setCreateMemberships} />
            </div>
            <div className="space-y-2">
              <Label>Estatus por defecto</Label>
              <Select value={defaultMemberStatus} onValueChange={setDefaultMemberStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {memberStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={goToMembers}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a socios
            </Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Cargar y mapear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Reglas del importador
          </CardTitle>
          <CardDescription>Preparado para la base CIIB y formularios de registro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border/70 p-4">
            <p className="font-medium text-foreground">Deduplicacion</p>
            <p>Compara correo, telefono e ID CIIB para crear o actualizar sin duplicar socios.</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="font-medium text-foreground">Fotos y logos</p>
            <p>Busca coincidencias exactas y aproximadas entre columnas de foto/logo y nombres de archivo.</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="font-medium text-foreground">Perfil enriquecido</p>
            <p>Guarda redes, licencia, giro, motivaciones, retos y expectativas como metadata del socio.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMappingStep = () => (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Mapeo de columnas</CardTitle>
        <CardDescription>
          Confirma que cada campo del CRM apunte a la columna correcta. Los requeridos deben quedar mapeados antes de la vista previa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Filas detectadas</p>
            <p className="mt-2 text-2xl font-semibold">{uploadResult?.total_rows || 0}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Columnas</p>
            <p className="mt-2 text-2xl font-semibold">{headers.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Imagenes</p>
            <p className="mt-2 text-2xl font-semibold">{uploadResult?.media_summary?.image_files || 0}</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm text-muted-foreground">Archivos fuente</p>
            <p className="mt-2 text-2xl font-semibold">{uploadResult?.parsed_files?.length || 0}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {fieldEntries.map((field) => (
            <div key={field.key} className="rounded-xl border border-border/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground">{field.key} · {field.type}</p>
                </div>
                {field.required ? <Badge>Requerido</Badge> : <Badge variant="secondary">Opcional</Badge>}
              </div>
              <Select
                value={columnMappings[field.key] || NONE_VALUE}
                onValueChange={(value) => setColumnMappings((current) => ({ ...current, [field.key]: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin mapear" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin mapear</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={`${field.key}-${header}`} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {uploadResult?.sample_data?.length ? (
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.slice(0, 6).map((header) => <TableHead key={header}>{header}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadResult.sample_data.slice(0, 3).map((row, index) => (
                  <TableRow key={`sample-${index}`}>
                    {headers.slice(0, 6).map((header) => (
                      <TableCell key={`${index}-${header}`} className="max-w-[220px] truncate text-sm">
                        {row[header] || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cambiar archivos
          </Button>
          <Button onClick={handlePreview} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Generar vista previa
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Crear</p><p className="mt-2 text-3xl font-semibold">{stats.create_count || 0}</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Actualizar</p><p className="mt-2 text-3xl font-semibold">{stats.update_count || 0}</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Omitir</p><p className="mt-2 text-3xl font-semibold">{stats.skipped_count || 0}</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Media</p><p className="mt-2 text-3xl font-semibold">{stats.media_linked_count || 0}</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Errores</p><p className="mt-2 text-3xl font-semibold">{stats.error_count || 0}</p></CardContent></Card>
      </div>

      {previewData?.errors?.length ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hay filas con errores</AlertTitle>
          <AlertDescription>
            Revisa nombre/correo y vuelve al mapeo si una columna quedo incorrecta.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Vista previa de importacion</CardTitle>
          <CardDescription>Primeras filas procesadas con accion estimada, datos clave y media encontrada.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Accion</TableHead>
                  <TableHead>Socio</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Membresia</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(previewData?.preview_rows || []).map((row) => (
                  <TableRow key={`preview-${row.row_number}`}>
                    <TableCell>
                      <Badge className={actionTone[row.action] || ''}>{actionLabels[row.action] || row.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <CopimMemberIdentity
                        name={row.data?.full_name || 'Sin nombre'}
                        subtitle={row.data?.email || row.data?.phone}
                        size="sm"
                      />
                      {row.errors?.length ? <p className="mt-2 text-xs text-rose-500">{row.errors.join(', ')}</p> : null}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{row.data?.company_name || 'Sin empresa'}</p>
                      <p className="text-xs text-muted-foreground">{row.data?.city || 'Sin ciudad'}</p>
                    </TableCell>
                    <TableCell>
                      <p>{row.data?.membership_plan || 'Sin plan'}</p>
                      <p className="text-xs text-muted-foreground">{formatCopimCurrency(row.data?.membership_price)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {row.media?.avatar ? <Badge variant="secondary">Foto</Badge> : null}
                        {row.media?.company_logo ? <Badge variant="secondary">Logo</Badge> : null}
                        {!row.media?.avatar && !row.media?.company_logo ? <span className="text-xs text-muted-foreground">Sin match</span> : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate text-sm">{row.source?.file || 'Archivo'}</p>
                      <p className="text-xs text-muted-foreground">Fila {row.source?.row || row.row_number}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ajustar mapeo
            </Button>
            <Button onClick={handleExecute} disabled={loading || stats.error_count === stats.total_rows}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
              Importar socios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResultStep = () => {
    const totalProcessed = (importResult?.imported_count || 0) + (importResult?.updated_count || 0) + (importResult?.skipped_count || 0) + (importResult?.error_count || 0);
    const successRate = totalProcessed ? Math.round((((importResult?.imported_count || 0) + (importResult?.updated_count || 0)) / totalProcessed) * 100) : 0;

    return (
      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Importacion completada
            </CardTitle>
            <CardDescription>{importResult?.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Registros creados o actualizados</span>
                <span>{successRate}%</span>
              </div>
              <Progress value={successRate} />
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-xl border border-border/70 p-4"><p className="text-sm text-muted-foreground">Creados</p><p className="mt-2 text-3xl font-semibold">{importResult?.imported_count || 0}</p></div>
              <div className="rounded-xl border border-border/70 p-4"><p className="text-sm text-muted-foreground">Actualizados</p><p className="mt-2 text-3xl font-semibold">{importResult?.updated_count || 0}</p></div>
              <div className="rounded-xl border border-border/70 p-4"><p className="text-sm text-muted-foreground">Membresias</p><p className="mt-2 text-3xl font-semibold">{importResult?.membership_created_count || 0}</p></div>
              <div className="rounded-xl border border-border/70 p-4"><p className="text-sm text-muted-foreground">Media</p><p className="mt-2 text-3xl font-semibold">{importResult?.media_linked_count || 0}</p></div>
              <div className="rounded-xl border border-border/70 p-4"><p className="text-sm text-muted-foreground">Omitidos</p><p className="mt-2 text-3xl font-semibold">{importResult?.skipped_count || 0}</p></div>
            </div>
            {importResult?.error_details?.length ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errores al importar</AlertTitle>
                <AlertDescription>
                  {importResult.error_details.slice(0, 3).map((error) => `Fila ${error.row}: ${error.errors?.join(', ')}`).join(' · ')}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={resetFlow}>
                <FileArchive className="mr-2 h-4 w-4" />
                Nueva importacion
              </Button>
              <Button onClick={goToMembers}>
                <Users className="mr-2 h-4 w-4" />
                Ver socios importados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <CopimPageHeader
        title="Importacion masiva de socios CIIB"
        description="Carga la base de socios, vincula fotos/logos y crea membresias para operar el padron COPIM sin captura manual."
        actions={(
          <Button variant="outline" className="rounded-full" onClick={goToMembers}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Socios
          </Button>
        )}
        stats={[
          { label: 'Datos', value: dataFiles.length || '0', helper: 'CSV/XLSX seleccionados' },
          { label: 'Media', value: mediaFiles.length || '0', helper: 'Fotos/logos o ZIP' },
          { label: 'Filas', value: uploadResult?.total_rows || '0', helper: 'Registros detectados' },
          { label: 'Match media', value: previewData?.stats?.media_linked_count || '0', helper: 'Coincidencias en previa' },
        ]}
      />

      {renderStepper()}

      {currentStep === 1 ? renderUploadStep() : null}
      {currentStep === 2 ? renderMappingStep() : null}
      {currentStep === 3 ? renderPreviewStep() : null}
      {currentStep === 4 ? renderResultStep() : null}
    </div>
  );
};

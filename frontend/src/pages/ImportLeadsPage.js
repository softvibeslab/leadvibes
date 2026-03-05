import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertCircle,
  Loader2, MapPin, CheckCircle2, XCircle, Users, FileWarning, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
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

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, title: 'Subir Archivo', icon: Upload },
  { id: 2, title: 'Mapear Columnas', icon: MapPin },
  { id: 3, title: 'Vista Previa', icon: FileSpreadsheet },
  { id: 4, title: 'Resultado', icon: Check },
];

export const ImportLeadsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Step 1: Upload state
  const [uploadResult, setUploadResult] = useState(null);
  
  // Step 2: Mapping state
  const [columnMappings, setColumnMappings] = useState({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [duplicateField, setDuplicateField] = useState('email');
  
  // Step 3: Preview state
  const [previewData, setPreviewData] = useState(null);
  
  // Step 4: Import result state
  const [importResult, setImportResult] = useState(null);

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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    
    if (!validTypes.some(type => fileName.endsWith(type))) {
      toast.error('Formato no soportado. Use CSV o Excel (.xlsx)');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/import/upload`, {
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
      
      // Auto-set mapping suggestions
      if (result.mapping_suggestions) {
        setColumnMappings(result.mapping_suggestions);
      }
      
      toast.success(`Archivo cargado: ${result.total_rows} filas encontradas`);
      setCurrentStep(2);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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

  // Generate preview
  const handlePreview = async () => {
    if (!columnMappings.name || !columnMappings.phone) {
      toast.error('Debe mapear al menos Nombre y Teléfono');
      return;
    }
    
    setLoading(true);
    
    try {
      const mappingArray = Object.entries(columnMappings).map(([target, source]) => ({
        source_column: source,
        target_field: target,
      }));
      
      const response = await fetch(`${API_URL}/api/import/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: uploadResult.job_id,
          mapping: mappingArray,
          skip_duplicates: skipDuplicates,
          duplicate_field: duplicateField,
        }),
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
      const mappingArray = Object.entries(columnMappings).map(([target, source]) => ({
        source_column: source,
        target_field: target,
      }));
      
      const response = await fetch(`${API_URL}/api/import/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: uploadResult.job_id,
          mapping: mappingArray,
          skip_duplicates: skipDuplicates,
          duplicate_field: duplicateField,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al importar leads');
      }
      
      const result = await response.json();
      setImportResult(result);
      setCurrentStep(4);
      
      if (result.imported_count > 0) {
        toast.success(`${result.imported_count} leads importados exitosamente`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset wizard
  const handleReset = () => {
    setCurrentStep(1);
    setUploadResult(null);
    setColumnMappings({});
    setPreviewData(null);
    setImportResult(null);
  };

  // Step 1: Upload
  const renderUploadStep = () => (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Subir archivo de leads
        </CardTitle>
        <CardDescription>
          Soportamos archivos CSV y Excel (.xlsx). El archivo debe tener una fila de encabezados.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <li>Campos requeridos: Nombre y Teléfono</li>
            <li>Formatos de exportación de GHL, HubSpot, Pipedrive son compatibles</li>
            <li>Los duplicados se detectan automáticamente por email o teléfono</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Mapping
  const renderMappingStep = () => {
    if (!uploadResult) return null;
    
    const availableFields = uploadResult.available_fields || {};
    const sourceHeaders = uploadResult.headers || [];
    
    // Get already mapped columns
    const mappedColumns = new Set(Object.values(columnMappings));
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Mapear columnas
            </CardTitle>
            <CardDescription>
              Archivo: <span className="font-medium">{uploadResult.filename}</span> ({uploadResult.total_rows} filas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required fields */}
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
                        value={columnMappings[field] || 'none'}
                        onValueChange={(value) => handleMappingChange(field, value)}
                      >
                        <SelectTrigger data-testid={`mapping-${field}`}>
                          <SelectValue placeholder="Seleccionar columna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No mapear --</SelectItem>
                          {sourceHeaders.map((header) => (
                            <SelectItem 
                              key={header} 
                              value={header}
                              disabled={mappedColumns.has(header) && columnMappings[field] !== header}
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
            
            {/* Optional fields */}
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
                        value={columnMappings[field] || 'none'}
                        onValueChange={(value) => handleMappingChange(field, value)}
                      >
                        <SelectTrigger data-testid={`mapping-${field}`}>
                          <SelectValue placeholder="Seleccionar columna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No mapear --</SelectItem>
                          {sourceHeaders.map((header) => (
                            <SelectItem 
                              key={header} 
                              value={header}
                              disabled={mappedColumns.has(header) && columnMappings[field] !== header}
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
            
            {/* Duplicate settings */}
            <div className="pt-4 border-t">
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
            
            {/* Sample data preview */}
            {uploadResult.sample_data && uploadResult.sample_data.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Vista previa de datos originales</h4>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {sourceHeaders.slice(0, 6).map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                        {sourceHeaders.length > 6 && (
                          <TableHead className="text-center">...</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResult.sample_data.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {sourceHeaders.slice(0, 6).map((header) => (
                            <TableCell key={header} className="max-w-[150px] truncate">
                              {row[header] || '-'}
                            </TableCell>
                          ))}
                          {sourceHeaders.length > 6 && (
                            <TableCell className="text-center text-muted-foreground">...</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset} data-testid="back-to-upload-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cambiar archivo
          </Button>
          <Button 
            onClick={handlePreview} 
            disabled={loading || !columnMappings.name || !columnMappings.phone}
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
    );
  };

  // Step 3: Preview
  const renderPreviewStep = () => {
    if (!previewData) return null;
    
    return (
      <div className="space-y-6">
        {/* Summary cards */}
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
        
        {/* Warnings */}
        {previewData.duplicates_found > 0 && (
          <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Duplicados detectados</AlertTitle>
            <AlertDescription>
              Se encontraron {previewData.duplicates_found} leads que ya existen en tu base de datos.
              {skipDuplicates && ' Serán omitidos durante la importación.'}
              {previewData.duplicate_values && previewData.duplicate_values.length > 0 && (
                <span className="block mt-1 text-xs">
                  Ejemplos: {previewData.duplicate_values.join(', ')}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Preview table */}
        <Card>
          <CardHeader>
            <CardTitle>Vista previa de leads a importar</CardTitle>
            <CardDescription>
              Mostrando las primeras {previewData.preview_rows?.length || 0} filas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead className="w-24">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.preview_rows?.map((row) => (
                    <TableRow key={row.row_number} className={!row.valid ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                      <TableCell className="font-mono text-xs">{row.row_number}</TableCell>
                      <TableCell className="font-medium">{row.data.name || '-'}</TableCell>
                      <TableCell>{row.data.phone || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{row.data.email || '-'}</TableCell>
                      <TableCell>{row.data.source || 'importado'}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Errors list */}
            {previewData.errors && previewData.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Errores encontrados:</h4>
                <ul className="text-sm space-y-1">
                  {previewData.errors.slice(0, 5).map((err, i) => (
                    <li key={i} className="text-red-600 dark:text-red-400">
                      Fila {err.row}: {err.errors.join(', ')}
                    </li>
                  ))}
                  {previewData.errors.length > 5 && (
                    <li className="text-muted-foreground">
                      ... y {previewData.errors.length - 5} errores más
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="back-to-mapping-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ajustar mapeo
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={loading || previewData.valid_rows === 0}
            data-testid="import-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Importar {previewData.total_rows - previewData.duplicates_found - previewData.error_rows} leads
          </Button>
        </div>
      </div>
    );
  };

  // Step 4: Result
  const renderResultStep = () => {
    if (!importResult) return null;
    
    const isSuccess = importResult.imported_count > 0;
    const hasErrors = importResult.error_count > 0;
    
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
                    Se importaron {importResult.imported_count} leads exitosamente
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Importación fallida</h2>
                  <p className="text-muted-foreground">
                    No se pudieron importar los leads
                  </p>
                </>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{importResult.imported_count}</div>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">{importResult.skipped_count}</div>
                <p className="text-sm text-muted-foreground">Omitidos (duplicados)</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{importResult.error_count}</div>
                <p className="text-sm text-muted-foreground">Errores</p>
              </div>
            </div>
            
            {/* Error details */}
            {hasErrors && importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Detalles de errores:</h4>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-red-600 dark:text-red-400">
                      Fila {err.row}: {err.errors.join(', ')}
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li className="text-muted-foreground">
                      ... y {importResult.errors.length - 10} errores más
                    </li>
                  )}
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
          <Button onClick={() => navigate('/leads')} data-testid="go-to-leads-btn">
            <Users className="w-4 h-4 mr-2" />
            Ver mis leads
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Importar Leads</h1>
              <p className="text-muted-foreground mt-1">
                Importa leads desde archivos CSV o Excel
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
          
          {/* Progress steps */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
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
            {/* Progress bar */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Step content */}
        <div className="pb-8">
          {currentStep === 1 && renderUploadStep()}
          {currentStep === 2 && renderMappingStep()}
          {currentStep === 3 && renderPreviewStep()}
          {currentStep === 4 && renderResultStep()}
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsPage;

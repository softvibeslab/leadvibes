/**
 * ImportPreviewTable - ROVI CRM
 * Tabla mejorada para preview de importación de leads
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const priorityStyles = {
  baja: 'bg-slate-500',
  media: 'bg-amber-500',
  alta: 'bg-orange-500',
  urgente: 'bg-red-500',
};

const statusStyles = {
  nuevo: 'bg-blue-500',
  contactado: 'bg-cyan-500',
  calificacion: 'bg-violet-500',
  presentacion: 'bg-indigo-500',
  apartado: 'bg-amber-500',
  venta: 'bg-emerald-500',
  perdido: 'bg-rose-500',
};

/**
 * Tabla de preview para mostrar filas antes de importar
 */
export const ImportPreviewTable = ({
  previewData,
  mapping = [],
  showAllRows = false,
  onToggleShowAll
}) => {
  if (!previewData || !previewData.preview_rows) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No hay datos para previsualizar</p>
        </CardContent>
      </Card>
    );
  }

  const { preview_rows, total_rows, valid_rows, error_rows } = previewData;

  // Filtrar filas a mostrar
  const rowsToShow = showAllRows
    ? preview_rows
    : preview_rows.slice(0, 10); // Solo primeras 10 filas por defecto
  const tableMinWidth = Math.max(1180, 80 + mapping.length * 220);

  const renderCellValue = (row, targetField, value) => {
    const isEmpty = !value || value === '';

    if (isEmpty) {
      return <span className="italic text-slate-500">-</span>;
    }

    if (targetField === 'name') {
      const initials = String(value)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'LD';

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{value}</p>
            {row.data.email && (
              <p className="truncate text-xs text-slate-400">{row.data.email}</p>
            )}
          </div>
        </div>
      );
    }

    if (targetField === 'email') {
      return <span className="block max-w-[220px] truncate text-sm text-slate-300">{value}</span>;
    }

    if (targetField === 'phone') {
      return <span className="text-sm font-medium text-slate-100">{value}</span>;
    }

    if (targetField === 'status') {
      return (
        <Badge className={`${statusStyles[String(value).toLowerCase()] || 'bg-slate-600'} text-white`}>
          {value}
        </Badge>
      );
    }

    if (targetField === 'priority') {
      return (
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${priorityStyles[String(value).toLowerCase()] || 'bg-slate-500'}`} />
          <span className="text-xs font-medium capitalize text-slate-200">{value}</span>
        </div>
      );
    }

    if (targetField === 'source') {
      return (
        <Badge variant="outline" className="max-w-[220px] truncate border-slate-700 bg-slate-900/60 text-slate-300">
          {value}
        </Badge>
      );
    }

    return (
      <span className="block max-w-[220px] truncate text-sm text-slate-100" title={String(value)}>
        {value}
      </span>
    );
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card/95 backdrop-blur-sm">
      <div className="border-b border-border/80 bg-card/80 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Vista Previa de Importación</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Revisa los datos antes de confirmar la importación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {valid_rows} válidos
            </Badge>
            {error_rows > 0 && (
              <Badge variant="destructive" className="text-sm">
                {error_rows} con errores
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[500px] w-full bg-slate-950/20">
        <Table
          className="table-fixed bg-transparent text-foreground"
          style={{ minWidth: `${tableMinWidth}px` }}
        >
          <TableHeader className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/90">
            <TableRow className="border-border/70 bg-slate-900/85 hover:bg-slate-900/85">
              <TableHead className="w-16 text-center text-[11px] uppercase tracking-[0.24em] text-slate-400">#</TableHead>
              {mapping.map((col, idx) => (
                <TableHead key={idx} className={col.target_field === 'name' ? 'w-[260px] text-slate-200' : 'w-[170px] text-slate-200'}>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                      {col.target_field}
                    </span>
                    <Badge variant="outline" className="border-slate-600 bg-slate-800/80 text-[11px] text-slate-300">
                      {col.source_column}
                    </Badge>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-36 text-center text-[11px] uppercase tracking-[0.24em] text-slate-400">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsToShow.map((row, idx) => (
              <TableRow
                key={row.row_number}
                className={
                  row.valid
                    ? idx % 2 === 0
                      ? 'border-border/60 bg-slate-950/35 text-slate-100 hover:bg-slate-800/55'
                      : 'border-border/60 bg-slate-900/15 text-slate-100 hover:bg-slate-800/45'
                    : idx % 2 === 0
                      ? 'border-red-500/25 bg-red-950/30 text-slate-100 hover:bg-red-950/40'
                      : 'border-red-500/20 bg-red-950/20 text-slate-100 hover:bg-red-950/35'
                }
              >
                <TableCell className="text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-sm font-semibold text-slate-200 shadow-sm">
                    {row.row_number}
                  </div>
                </TableCell>
                {mapping.map((col, colIdx) => {
                  const value = row.data[col.target_field];
                  const isEmpty = !value || value === '';

                  return (
                    <TableCell key={colIdx} className="py-4">
                      {renderCellValue(row, col.target_field, value, isEmpty)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  {row.valid ? (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 bg-green-500/15 px-3 py-1 text-green-300"
                    >
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Válido
                      </div>
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="px-3 py-1 text-xs shadow-sm shadow-red-950/40">
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Error
                      </div>
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Footer con stats y acción */}
      <div className="border-t border-border/80 bg-slate-900/55 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Mostrando {showAllRows ? total_rows : `${Math.min(10, total_rows)} de ${total_rows}`} filas
          </div>

          {total_rows > 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleShowAll && onToggleShowAll()}
            >
              {showAllRows ? 'Mostrar menos' : 'Ver todas'}
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-100">{total_rows}</p>
            <p className="text-xs text-slate-400">Total Filas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{valid_rows}</p>
            <p className="text-xs text-slate-400">Válidas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{error_rows}</p>
            <p className="text-xs text-slate-400">Con Errores</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">
              {valid_rows > 0 ? ((valid_rows / total_rows) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-slate-400">Tasa Éxito</p>
          </div>
        </div>

        {/* Error Summary (si hay errores) */}
        {error_rows > 0 && (
          <details className="mt-4 overflow-hidden rounded-xl border border-red-500/20 bg-red-950/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-red-100 transition-colors hover:bg-red-950/20">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="font-semibold">Revisar filas con errores</p>
                  <p className="text-xs text-red-200/70">
                    {error_rows} filas necesitan corrección antes de importar
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-red-500/30 bg-red-950/40 text-red-100">
                {error_rows} errores
              </Badge>
            </summary>
            <div className="max-h-56 space-y-3 overflow-y-auto border-t border-red-500/15 px-4 py-4">
              {preview_rows
                .filter(row => !row.valid)
                .slice(0, 10) // Solo primeros 10 errores
                .map((row, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-red-500/20 bg-slate-950/60 p-3 text-xs text-red-50 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
                        Fila {row.row_number}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Error de validación
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {row.errors.map((err, errIdx) => (
                        <li key={errIdx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              {error_rows > 10 && (
                <p className="pt-2 text-center text-xs text-slate-400">
                  ... y {error_rows - 10} errores más
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
};

/**
 * Tabla simplificada de mapping de columnas
 */
export const ColumnMappingTable = ({
  headers = [],
  availableFields = [],
  mapping = [],
  onMappingChange
}) => {
  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Mapeo de Columnas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Asigna cada columna del archivo a un campo de lead
        </p>
      </div>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Columna del Archivo</TableHead>
              <TableHead>Campos de Lead</TableHead>
              <TableHead className="w-24">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header, idx) => {
              const mappedField = mapping.find(m => m.source_column === header);
              const isMapped = !!mappedField;
              const isRequired = ['name', 'phone'].includes(mappedField?.target_field);

              return (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    {header || `Columna ${idx + 1}`}
                  </TableCell>
                  <TableCell>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={mappedField?.target_field || ''}
                      onChange={(e) => {
                        const newMapping = mapping.filter(m => m.source_column !== header);
                        newMapping.push({
                          source_column: header,
                          target_field: e.target.value
                        });
                        if (onMappingChange) {
                          onMappingChange(newMapping);
                        }
                      }}
                    >
                      <option value="">-- Seleccionar campo --</option>
                      {availableFields.map((field, fIdx) => (
                        <option
                          key={fIdx}
                          value={field.name}
                          disabled={field.disabled}
                        >
                          {field.label} {field.required && ' *'}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-center">
                    {isMapped ? (
                      <Badge
                        variant={isRequired ? "default" : "secondary"}
                        className={isRequired ? "bg-blue-600" : ""}
                      >
                        {isRequired ? 'Requerido' : 'Opcional'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sin mapear
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
};

/**
 * Componente para mostrar duplicados encontrados durante import
 */
export const ImportDuplicatesPreview = ({
  duplicates = [],
  onAction
}) => {
  if (!duplicates || duplicates.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg text-orange-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Duplicados Encontrados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {duplicates.length} leads podrían ser duplicados de existentes
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {duplicates.map((dup, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-orange-50 border border-orange-200 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{dup.name}</h4>
                  <Badge
                    variant={dup.confidence >= 90 ? "destructive" : "secondary"}
                  >
                    {dup.confidence}% coincidencia
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Email:</span>
                    <span className="ml-2">{dup.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Teléfono:</span>
                    <span className="ml-2">{dup.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Razón: </span>
                  <span className="ml-1 font-medium">{dup.reason_display}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction && onAction('ignore', dup)}
                >
                  Ignorar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction && onAction('merge', dup)}
                >
                  Fusionar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

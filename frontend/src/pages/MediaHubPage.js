import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  AudioLines,
  Download,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  Image,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  UploadCloud,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';

const fileTypeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'image', label: 'Imagenes' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audios' },
  { value: 'document', label: 'Documentos' },
  { value: 'spreadsheet', label: 'Hojas de calculo' },
  { value: 'archive', label: 'Carpetas/ZIP' },
  { value: 'file', label: 'Otros' },
];

const sourceOptions = [
  { value: 'all', label: 'Todos los origenes' },
  { value: 'manual', label: 'Manual' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'import', label: 'Importaciones' },
  { value: 'agent', label: 'Agente' },
  { value: 'drive', label: 'Google Drive' },
  { value: 'link', label: 'Links' },
];

const statusOptions = [
  { value: 'active', label: 'Activos' },
  { value: 'needs_review', label: 'Pendientes' },
  { value: 'mapped', label: 'Mapeados' },
  { value: 'archived', label: 'Archivados' },
];

const fileTypeConfig = {
  image: { label: 'Imagen', icon: Image, className: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20' },
  video: { label: 'Video', icon: Video, className: 'bg-violet-500/10 text-violet-700 border-violet-500/20' },
  audio: { label: 'Audio', icon: AudioLines, className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  document: { label: 'Documento', icon: FileText, className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  spreadsheet: { label: 'Tabla', icon: FileText, className: 'bg-lime-500/10 text-lime-700 border-lime-500/20' },
  archive: { label: 'Archivo', icon: FolderOpen, className: 'bg-slate-500/10 text-slate-700 border-slate-500/20' },
  file: { label: 'Archivo', icon: FileText, className: 'bg-slate-500/10 text-slate-700 border-slate-500/20' },
};

const statusConfig = {
  active: { label: 'Activo', className: 'border-slate-500/20 bg-slate-500/10 text-slate-700' },
  needs_review: { label: 'Por mapear', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  mapped: { label: 'Mapeado', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
  archived: { label: 'Archivado', className: 'border-rose-500/20 bg-rose-500/10 text-rose-700' },
};

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const MediaHubPage = () => {
  const { api } = useAuth();
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('all');
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('active');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [busy, setBusy] = useState('');

  const loadMedia = useCallback(async () => {
    setBusy('loading');
    try {
      const params = {
        ...(query.trim() ? { q: query.trim() } : {}),
        ...(fileType !== 'all' ? { file_type: fileType } : {}),
        ...(source !== 'all' ? { source } : {}),
        ...(status ? { status } : {}),
        ...(unassignedOnly ? { unassigned: true } : {}),
      };
      const [assetsResponse, statsResponse] = await Promise.all([
        api.get('/media', { params }),
        api.get('/media/stats'),
      ]);
      setAssets(assetsResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (error) {
      const detail = error?.response?.data?.detail || 'No se pudo cargar Media Hub';
      toast.error(detail);
    } finally {
      setBusy('');
    }
  }, [api, fileType, query, source, status, unassignedOnly]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const totals = useMemo(() => ({
    total: stats?.total || 0,
    unassigned: stats?.unassigned || 0,
    needsReview: stats?.needs_review || 0,
    storage: stats?.provider || 'local',
  }), [stats]);

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      fileInputRef.current?.click();
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('source', 'manual');

    setBusy('uploading');
    try {
      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${response.data?.assets?.length || selectedFiles.length} archivo(s) cargados`);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadMedia();
    } catch (error) {
      const detail = error?.response?.data?.detail || 'No se pudieron cargar los archivos';
      toast.error(detail);
    } finally {
      setBusy('');
    }
  };

  const archiveAsset = async (asset) => {
    setBusy(asset.id);
    try {
      await api.delete(`/media/${asset.id}`);
      toast.success('Archivo archivado');
      await loadMedia();
    } catch (error) {
      const detail = error?.response?.data?.detail || 'No se pudo archivar el archivo';
      toast.error(detail);
    } finally {
      setBusy('');
    }
  };

  const openPreview = (asset) => {
    const url = asset.preview_url || asset.url || `/api/media/${asset.id}/preview`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cyan-50/30 to-background p-4 md:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Media Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Biblioteca comercial de fotos, documentos, audios, videos y links listos para mapear al CRM.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadMedia} disabled={busy === 'loading'}>
              {busy === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualizar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Elegir archivos
            </Button>
            <Button onClick={handleUpload} disabled={busy === 'uploading'}>
              {busy === 'uploading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {selectedFiles.length ? `Subir ${selectedFiles.length}` : 'Subir manual'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total activo</CardDescription>
              <CardTitle className="text-3xl">{totals.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Por mapear</CardDescription>
              <CardTitle className="text-3xl">{totals.needsReview}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sin entidad</CardDescription>
              <CardTitle className="text-3xl">{totals.unassigned}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Storage</CardDescription>
              <CardTitle className="text-2xl capitalize">{totals.storage}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="rounded-xl border bg-card/80 p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre, tag, resumen o contexto"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fileTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Origen</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant={unassignedOnly ? 'default' : 'outline'}
                className="w-full md:w-auto"
                onClick={() => setUnassignedOnly((value) => !value)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Sin entidad
              </Button>
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-900">
            <strong>{selectedFiles.length} archivo(s) listos:</strong>{' '}
            {selectedFiles.slice(0, 4).map((file) => file.name).join(', ')}
            {selectedFiles.length > 4 ? '...' : ''}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {assets.map((asset) => {
            const config = fileTypeConfig[asset.file_type] || fileTypeConfig.file;
            const StatusBadge = statusConfig[asset.status] || statusConfig.active;
            const Icon = config.icon;
            const isImage = asset.file_type === 'image' && (asset.preview_url || asset.url);

            return (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video bg-muted/70">
                  {isImage ? (
                    <img
                      src={asset.preview_url || asset.url}
                      alt={asset.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{asset.original_filename || asset.filename}</CardTitle>
                      <CardDescription>{formatDate(asset.created_at)} · {formatBytes(asset.size_bytes)}</CardDescription>
                    </div>
                    <Badge variant="outline" className={StatusBadge.className}>{StatusBadge.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={config.className}>{config.label}</Badge>
                    <Badge variant="outline" className="capitalize">{asset.source || 'manual'}</Badge>
                    {asset.linked_entities?.length ? (
                      <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
                        {asset.linked_entities.length} vinculo(s)
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sin vincular</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {(asset.tags || []).slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => openPreview(asset)}>
                      <Eye className="mr-1 h-4 w-4" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(asset.url || `/api/media/${asset.id}/preview`, '_blank', 'noopener,noreferrer')}>
                      <Download className="mr-1 h-4 w-4" />
                      Abrir
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => archiveAsset(asset)} disabled={busy === asset.id}>
                      {busy === asset.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Archive className="mr-1 h-4 w-4" />}
                      Archivar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!assets.length && busy !== 'loading' && (
          <div className="rounded-xl border bg-card/80 p-10 text-center">
            <Link2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold">Todavia no hay multimedia en esta vista</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Sube fotos de propiedades, capturas de leads, audios de seguimiento o documentos comerciales. El siguiente paso sera mapearlos con IA a leads, propiedades, tareas o eventos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

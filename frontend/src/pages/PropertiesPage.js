import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building, MapPin, DollarSign, Plus, Grid3x3, Table2,
  Share2, Download, Upload, Search, Filter, Edit, Eye, Trash2,
  Loader2, CheckCircle, X
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx';
import { toast } from 'sonner';

export const PropertiesPage = () => {
  const { api } = useAuth();
  const [view, setView] = useState('table');  // 'table' or 'grid'
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    property_type: '',
    min_price: '',
    max_price: '',
    ubicacion: ''
  });

  // Modal states
  const [createModal, setCreateModal] = useState({ open: false, data: null });
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [viewModal, setViewModal] = useState({ open: false, data: null });
  const [shareModal, setShareModal] = useState({ open: false, propertyIds: [] });
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    loadProperties();
    loadLeads();
  }, [filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.min_price) params.min_price = parseFloat(filters.min_price);
      if (filters.max_price) params.max_price = parseFloat(filters.max_price);
      if (filters.ubicacion) params.ubicacion = filters.ubicacion;

      const response = await api.get('/properties', { params });
      setProperties(response.data);
    } catch (error) {
      toast.error('Error al cargar propiedades');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      console.error('Error loading leads:', error);
    }
  };

  const handleBulkShare = async (medium) => {
    if (selectedProperties.length === 0) {
      toast.error('Selecciona al menos una propiedad');
      return;
    }

    setShareModal({
      open: true,
      propertyIds: selectedProperties,
      medium,
      selectedLeads: [],
      onSubmit: async (leadIds) => {
        try {
          await api.post('/properties/bulk-share', {
            property_ids: selectedProperties,
            medium,
            lead_ids: leadIds
          });
          toast.success(`Enviando ${selectedProperties.length} propiedades por ${medium}`);
          setShareModal({ open: false, propertyIds: [] });
          setSelectedProperties([]);
        } catch (error) {
          toast.error('Error al enviar propiedades');
          console.error(error);
        }
      }
    });
  };

  const handleExportTemplate = async () => {
    try {
      const response = await api.get('/properties/export-template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'properties_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Plantilla descargada exitosamente');
    } catch (error) {
      toast.error('Error al descargar plantilla');
      console.error(error);
    }
  };

  const handleImport = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/properties/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Importación completada: ${response.data.imported_count} propiedades`);
      loadProperties();
    } catch (error) {
      toast.error('Error al importar propiedades');
      console.error(error);
    }
  };

  const handleCreateProperty = async (propertyData) => {
    try {
      await api.post('/properties', propertyData);
      toast.success('Propiedad creada exitosamente');
      setCreateModal({ open: false, data: null });
      loadProperties();
    } catch (error) {
      toast.error('Error al crear propiedad');
      console.error(error);
    }
  };

  const handleUpdateProperty = async (propertyId, propertyData) => {
    try {
      await api.put(`/properties/${propertyId}`, propertyData);
      toast.success('Propiedad actualizada exitosamente');
      setEditModal({ open: false, data: null });
      loadProperties();
    } catch (error) {
      toast.error('Error al actualizar propiedad');
      console.error(error);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return;

    try {
      await api.delete(`/properties/${propertyId}`);
      toast.success('Propiedad eliminada exitosamente');
      loadProperties();
    } catch (error) {
      toast.error('Error al eliminar propiedad');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Inventario de Propiedades</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de inmuebles</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            onClick={() => setView('table')}
          >
            <Table2 className="w-4 h-4 mr-2" />
            Tabla
          </Button>
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            onClick={() => setView('grid')}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button variant="outline" onClick={handleExportTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Plantilla
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file').click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) handleImport(e.target.files[0]);
            }}
          />
          <Button onClick={() => setCreateModal({ open: true, data: null })}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Propiedad
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <Select
            value={filters.property_type}
            onValueChange={(v) => setFilters({ ...filters, property_type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="venta">Venta</SelectItem>
              <SelectItem value="renta">Renta</SelectItem>
              <SelectItem value="subarrendamiento">Subarrendamiento</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Precio mín"
            type="number"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
          />
          <Input
            placeholder="Precio máx"
            type="number"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
          />
          <Input
            placeholder="Ubicación"
            value={filters.ubicacion}
            onChange={(e) => setFilters({ ...filters, ubicacion: e.target.value })}
          />
        </div>
      </Card>

      {/* Acciones masivas */}
      {selectedProperties.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="font-medium">{selectedProperties.length} propiedades seleccionadas</span>
            <div className="flex gap-2">
              <Button onClick={() => handleBulkShare('email')}>
                <Share2 className="w-4 h-4 mr-2" />
                Enviar por Correo
              </Button>
              <Button onClick={() => handleBulkShare('whatsapp')}>
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Vista Tabla */}
      {view === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProperties.length === properties.length && properties.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedProperties(checked ? properties.map(p => p.id) : []);
                    }}
                  />
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProperties([...selectedProperties, property.id]);
                        } else {
                          setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{property.sku}</TableCell>
                  <TableCell className="font-medium">{property.titulo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{property.property_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.ubicacion}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${property.precio_mxn?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setViewModal({ open: true, data: property })}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditModal({ open: true, data: property })}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteProperty(property.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Vista Grid */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative">
                {property.imagenes && property.imagenes.length > 0 ? (
                  <img src={property.imagenes[0]} alt={property.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2">{property.property_type}</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{property.titulo}</h3>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {property.ubicacion}
                </p>
                <p className="text-lg font-bold text-primary">
                  ${property.precio_mxn?.toLocaleString() || 0}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-muted-foreground font-mono">{property.sku}</span>
                  <div className="flex gap-2">
                    <Checkbox
                      checked={selectedProperties.includes(property.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProperties([...selectedProperties, property.id]);
                        } else {
                          setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <PropertyModal
        open={createModal.open || editModal.open}
        onClose={() => {
          setCreateModal({ open: false, data: null });
          setEditModal({ open: false, data: null });
        }}
        onSubmit={createModal.open ? handleCreateProperty : handleUpdateProperty}
        property={editModal.data || createModal.data}
        isEdit={!!editModal.data}
      />

      {/* Modal Ver */}
      <PropertyViewModal
        open={viewModal.open}
        onClose={() => setViewModal({ open: false, data: null })}
        property={viewModal.data}
      />

      {/* Modal Compartir */}
      <ShareModal
        open={shareModal.open}
        onClose={() => setShareModal({ open: false, propertyIds: [] })}
        propertyIds={shareModal.propertyIds}
        leads={leads}
        onSubmit={shareModal.onSubmit}
      />
    </div>
  );
};

// Modal Crear/Editar Propiedad
const PropertyModal = ({ open, onClose, onSubmit, property, isEdit }) => {
  const [formData, setFormData] = useState(property || {
    sku: '',
    titulo: '',
    descripcion: '',
    property_type: 'venta',
    precio_mxn: '',
    ubicacion: '',
    lat: 20.21,
    lng: -87.47,
    metros_cuadrados: '',
    recamaras: '',
    banos: '',
    estacionamiento: '',
    imagenes: [''],
    caracteristicas: {}
  });

  useEffect(() => {
    if (property) {
      setFormData(property);
    }
  }, [property]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar campos custom máximo 3
    const customFields = Object.keys(formData.caracteristicas || {}).filter(
      key => formData.caracteristicas[key]
    );

    if (customFields.length > 3) {
      toast.error('Máximo 3 campos personalizados permitidos');
      return;
    }

    const data = {
      ...formData,
      precio_mxn: parseFloat(formData.precio_mxn) || 0,
      lat: parseFloat(formData.lat) || 0,
      lng: parseFloat(formData.lng) || 0,
      metros_cuadrados: parseFloat(formData.metros_cuadrados) || null,
      recamaras: parseInt(formData.recamaras) || null,
      banos: parseInt(formData.banos) || null,
      estacionamiento: parseInt(formData.estacionamiento) || null,
      imagenes: formData.imagenes.filter(url => url.trim() !== '')
    };

    if (isEdit) {
      onSubmit(property.id, data);
    } else {
      onSubmit(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}</DialogTitle>
          <DialogDescription>
            Completa los datos de la propiedad. Campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROP-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.property_type}
                onValueChange={(v) => setFormData({ ...formData, property_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="renta">Renta</SelectItem>
                  <SelectItem value="subarrendamiento">Subarrendamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Lote en La Veleta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción detallada de la propiedad..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio MXN *</Label>
              <Input
                type="number"
                value={formData.precio_mxn}
                onChange={(e) => setFormData({ ...formData, precio_mxn: e.target.value })}
                placeholder="2500000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación *</Label>
              <Input
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="La Veleta, Tulum"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitud</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitud</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>m²</Label>
              <Input
                type="number"
                value={formData.metros_cuadrados}
                onChange={(e) => setFormData({ ...formData, metros_cuadrados: e.target.value })}
                placeholder="400"
              />
            </div>
            <div className="space-y-2">
              <Label>Recamaras</Label>
              <Input
                type="number"
                value={formData.recamaras}
                onChange={(e) => setFormData({ ...formData, recamaras: e.target.value })}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <Label>Baños</Label>
              <Input
                type="number"
                value={formData.banos}
                onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label>Estac.</Label>
              <Input
                type="number"
                value={formData.estacionamiento}
                onChange={(e) => setFormData({ ...formData, estacionamiento: e.target.value })}
                placeholder="2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL de Imagen</Label>
            <Input
              value={formData.imagenes[0] || ''}
              onChange={(e) => setFormData({ ...formData, imagenes: [e.target.value] })}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Campos Personalizados (máx 3)</Label>
            <div className="space-y-2">
              {['campo1', 'campo2', 'campo3'].map((campo, idx) => (
                <div key={campo} className="flex gap-2">
                  <Input
                    placeholder={`Nombre del campo ${idx + 1}`}
                    onChange={(e) => {
                      const keys = Object.keys(formData.caracteristicas || {});
                      const newKey = e.target.value;
                      const newCaracteristicas = { ...formData.caracteristicas };
                      if (keys[idx]) {
                        const value = newCaracteristicas[keys[idx]];
                        delete newCaracteristicas[keys[idx]];
                        if (newKey) newCaracteristicas[newKey] = value;
                      }
                      setFormData({ ...formData, caracteristicas: newCaracteristicas });
                    }}
                  />
                  <Input
                    placeholder="Valor"
                    value={Object.values(formData.caracteristicas || {})[idx] || ''}
                    onChange={(e) => {
                      const keys = Object.keys(formData.caracteristicas || {});
                      const newCaracteristicas = { ...formData.caracteristicas };
                      if (keys[idx]) {
                        newCaracteristicas[keys[idx]] = e.target.value;
                        setFormData({ ...formData, caracteristicas: newCaracteristicas });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEdit ? 'Actualizar' : 'Crear'} Propiedad</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Modal Ver Propiedad
const PropertyViewModal = ({ open, onClose, property }) => {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{property.titulo}</DialogTitle>
          <DialogDescription>SKU: {property.sku}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {property.imagenes && property.imagenes.length > 0 && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img src={property.imagenes[0]} alt={property.titulo} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge>{property.property_type}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="text-lg font-bold text-primary">${property.precio_mxn?.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Ubicación</p>
            <p className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {property.ubicacion}
            </p>
          </div>

          {property.descripcion && (
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p>{property.descripcion}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            {property.metros_cuadrados && (
              <div>
                <p className="text-sm text-muted-foreground">m²</p>
                <p className="font-medium">{property.metros_cuadrados}</p>
              </div>
            )}
            {property.recamaras && (
              <div>
                <p className="text-sm text-muted-foreground">Recamaras</p>
                <p className="font-medium">{property.recamaras}</p>
              </div>
            )}
            {property.banos && (
              <div>
                <p className="text-sm text-muted-foreground">Baños</p>
                <p className="font-medium">{property.banos}</p>
              </div>
            )}
            {property.estacionamiento && (
              <div>
                <p className="text-sm text-muted-foreground">Estac.</p>
                <p className="font-medium">{property.estacionamiento}</p>
              </div>
            )}
          </div>

          {property.caracteristicas && Object.keys(property.caracteristicas).length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Características Adicionales</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(property.caracteristicas).map(([key, value]) => (
                  <div key={key} className="p-2 bg-muted rounded">
                    <p className="text-xs font-medium">{key}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Modal Compartir
const ShareModal = ({ open, onClose, propertyIds, leads, onSubmit }) => {
  const [selectedLeads, setSelectedLeads] = useState([]);

  const handleShare = () => {
    if (selectedLeads.length === 0) {
      toast.error('Selecciona al menos un lead');
      return;
    }
    onSubmit(selectedLeads);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir Propiedades</DialogTitle>
          <DialogDescription>
            Selecciona los leads a quienes enviar las {propertyIds.length} propiedades
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => {
                  if (selectedLeads.includes(lead.id)) {
                    setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                  } else {
                    setSelectedLeads([...selectedLeads, lead.id]);
                  }
                }}
              >
                <Checkbox checked={selectedLeads.includes(lead.id)} />
                <span>{lead.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">{lead.email || lead.phone}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleShare}>Enviar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

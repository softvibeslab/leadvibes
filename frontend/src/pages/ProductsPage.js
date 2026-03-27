import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Sparkles, Loader2 } from 'lucide-react';

const PRODUCT_TYPES = [
  { value: 'real_estate', label: 'Bienes Raíces' },
  { value: 'software', label: 'Software / IA' },
  { value: 'digital', label: 'Producto Digital' },
  { value: 'service', label: 'Servicio' }
];

const NICHOS = {
  real_estate: ['Residencial', 'Comercial', 'VIP', 'Plusvalía', 'Inversionistas'],
  software: ['Agentes IA', 'Automatización', 'CRM', 'Integraciones'],
  digital: ['Cursos', 'Mentorías', 'Infoproductos', 'Memberships'],
  service: ['Consultoría', 'Implementación', 'Soporte', 'Mantenimiento']
};

export const ProductsPage = () => {
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [templates, setTemplates] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_type: 'real_estate',
    niche: '',
    price_mxn: 0,
    features: [],
    is_active: true
  });

  const [saving, setSaving] = useState(false);

  // Cargar productos
  useEffect(() => {
    fetchProducts();
    fetchTemplates();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/products/templates/niche');
      setTemplates(res.data);
    } catch (error) {
      console.error('Error cargando templates');
    }
  };

  // Aplicar template de nicho
  const applyTemplate = async () => {
    if (!formData.product_type || !templates[formData.product_type]) return;

    const template = templates[formData.product_type];
    setFormData({
      ...formData,
      description: template.description,
      features: template.features
    });
    toast.success('Template aplicado');
  };

  // Guardar producto
  const saveProduct = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Editar producto
  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      product_type: product.product_type,
      niche: product.niche,
      price_mxn: product.price_mxn,
      features: product.features || [],
      is_active: product.is_active
    });
    setDialogOpen(true);
  };

  // Eliminar producto
  const deleteProduct = async (productId) => {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      product_type: 'real_estate',
      niche: '',
      price_mxn: 0,
      features: [],
      is_active: true
    });
  };

  // Renderizar tabla
  const renderTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Productos y Servicios</CardTitle>
            <CardDescription>Gestiona tu catálogo de productos</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.product_type}</Badge>
                </TableCell>
                <TableCell>{product.niche || '-'}</TableCell>
                <TableCell>${product.price_mxn?.toLocaleString() || '0'}</TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => editProduct(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteProduct(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // Renderizar dialog
  const renderDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            Configura los detalles de tu producto o servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Producto</Label>
              <Select
                value={formData.product_type}
                onValueChange={(v) => setFormData({ ...formData, product_type: v, niche: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nicho</Label>
              <Select
                value={formData.niche}
                onValueChange={(v) => setFormData({ ...formData, niche: v })}
                disabled={!formData.product_type}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona tipo primero" /></SelectTrigger>
                <SelectContent>
                  {NICHOS[formData.product_type]?.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ej: Lote Residencial en La Veleta"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Descripción</Label>
              <Button size="sm" variant="outline" onClick={applyTemplate} disabled={!formData.product_type}>
                <Sparkles className="mr-2 h-4 w-4" /> Aplicar Template
              </Button>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu producto o servicio..."
              rows={5}
            />
          </div>

          <div>
            <Label>Precio (MXN)</Label>
            <Input
              type="number"
              value={formData.price_mxn}
              onChange={(e) => setFormData({ ...formData, price_mxn: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label>Características (separadas por coma)</Label>
            <Input
              value={formData.features.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                features: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              placeholder="ej: Ubicación premium, Plusvalía alta, Amenidades completas"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Producto Activo</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={saveProduct} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingProduct ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {renderTable()}
      {renderDialog()}
    </div>
  );
};

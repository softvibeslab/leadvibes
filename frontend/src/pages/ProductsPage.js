import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import {
  Plus, Edit, Trash2, Package, Sparkles, Loader2, Grid3X3, List, Search, SlidersHorizontal,
  ImagePlus, X, Star, Settings2, ArrowUp, ArrowDown, UserCircle, FolderOpen, CheckCircle2
} from 'lucide-react';

const PRODUCT_TYPES = [
  { value: 'real_estate', label: 'Bienes Raíces' },
  { value: 'software', label: 'Software / IA' },
  { value: 'digital', label: 'Activo Digital' },
  { value: 'service', label: 'Servicio' }
];

const OPERATION_TYPES = [
  { value: 'sale', label: 'Venta' },
  { value: 'rent', label: 'Renta' },
  { value: 'both', label: 'Venta y renta' },
];

const NICHOS = {
  real_estate: ['Residencial', 'Comercial', 'VIP', 'Plusvalía', 'Inversionistas'],
  software: ['Agentes IA', 'Automatización', 'CRM', 'Integraciones'],
  digital: ['Cursos', 'Mentorías', 'Recursos digitales', 'Memberships'],
  service: ['Consultoría', 'Implementación', 'Soporte', 'Mantenimiento']
};

const EMPTY_PRODUCT = {
  sku: '',
  title: '',
  description: '',
  product_type: 'real_estate',
  operation_type: 'sale',
  niche: '',
  price_mxn: 0,
  commission_percentage: 0,
  responsible_broker_id: '',
  responsible_broker_name: '',
  responsible_broker_email: '',
  monthly_rent_mxn: 0,
  nightly_rent_mxn: 0,
  rental_type: '',
  features: [],
  aliases: [],
  keywords: [],
  external_id: '',
  is_active: true,
  images: [],
  custom_fields_data: {},
};

const EMPTY_CUSTOM_FIELD = {
  label: '',
  key: '',
  entity_type: 'products',
  field_type: 'text',
  options: [],
  required: false,
  is_active: true,
  show_in_table: false,
  show_in_card: false,
  show_in_filters: false,
  sort_order: 0,
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const prettifyFieldValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return value || '-';
};

const normalizeCustomFieldValue = (field, value) => {
  if (field.field_type === 'number') {
    return Number(value || 0);
  }
  if (field.field_type === 'boolean') {
    return Boolean(value);
  }
  if (field.field_type === 'multi_select') {
    return Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  }
  return value;
};

const matchesCustomFieldFilter = (field, productValue, filterValue) => {
  if (filterValue === undefined || filterValue === null || filterValue === '') {
    return true;
  }

  if (field.field_type === 'boolean') {
    if (filterValue === 'all') return true;
    return Boolean(productValue) === (filterValue === 'true');
  }

  if (field.field_type === 'number') {
    return String(productValue ?? '').includes(String(filterValue).trim());
  }

  if (Array.isArray(productValue)) {
    const normalizedFilter = String(filterValue).trim().toLowerCase();
    return productValue.some((item) => String(item).toLowerCase().includes(normalizedFilter));
  }

  return String(productValue ?? '').toLowerCase().includes(String(filterValue).trim().toLowerCase());
};

const formatCommissionPercentage = (value) => {
  const commission = Number(value || 0);
  if (!commission) return 'No definida';
  return `${commission.toLocaleString('es-MX', { maximumFractionDigits: 2 })}%`;
};

const calculateEstimatedCommission = (product) => {
  const price = Number(product.price_mxn || 0);
  const commission = Number(product.commission_percentage || 0);
  if (!price || !commission) return 0;
  return price * (commission / 100);
};

export const ProductsPage = () => {
  const { api, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [responsibleOptions, setResponsibleOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [templates, setTemplates] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('products_view_mode') || 'grid');
  const [filters, setFilters] = useState({
    search: '',
    productType: 'all',
    niche: 'all',
    status: 'all',
    hasImages: 'all',
    sortBy: 'updated_desc',
    customFieldFilters: {},
  });
  const [formData, setFormData] = useState(EMPTY_PRODUCT);
  const [customFields, setCustomFields] = useState({ products: [], leads: [] });
  const [customFieldManagerOpen, setCustomFieldManagerOpen] = useState(false);
  const [customFieldEntityType, setCustomFieldEntityType] = useState('products');
  const [editingCustomField, setEditingCustomField] = useState(null);
  const [customFieldForm, setCustomFieldForm] = useState(EMPTY_CUSTOM_FIELD);
  const [savingCustomField, setSavingCustomField] = useState(false);
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [selectedProductForInterest, setSelectedProductForInterest] = useState(null);
  const [productInterests, setProductInterests] = useState([]);
  const [leadOptions, setLeadOptions] = useState([]);
  const [loadingProductInterests, setLoadingProductInterests] = useState(false);
  const [savingProductInterest, setSavingProductInterest] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [loadingMediaAssets, setLoadingMediaAssets] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [productInterestForm, setProductInterestForm] = useState({
    lead_id: 'none',
    interest_type: 'principal',
    interest_status: 'nuevo_interes',
    priority: 'media',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchResponsibleOptions();
    fetchTemplates();
    fetchAllCustomFields();
  }, []);

  useEffect(() => {
    localStorage.setItem('products_view_mode', viewMode);
  }, [viewMode]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error) {
      toast.error('Error cargando propiedades');
    } finally {
      setLoading(false);
    }
  };

  const normalizeResponsibleOption = (broker) => ({
    id: broker.id,
    name: broker.name || broker.email || 'Responsable',
    email: broker.email || '',
    role: broker.workspace_role || broker.role || 'broker',
  });

  const fetchResponsibleOptions = async () => {
    const currentUserOption = user?.id ? normalizeResponsibleOption(user) : null;
    const role = user?.active_workspace?.role || user?.role;

    if (user?.account_type === 'individual' || role === 'broker') {
      setResponsibleOptions(currentUserOption ? [currentUserOption] : []);
      return;
    }

    try {
      const res = await api.get('/brokers');
      const options = (Array.isArray(res.data) ? res.data : [])
        .filter((broker) => broker?.id && broker?.is_active !== false)
        .map(normalizeResponsibleOption);
      const combined = currentUserOption ? [currentUserOption, ...options] : options;
      const unique = Array.from(new Map(combined.map((option) => [option.id, option])).values());
      setResponsibleOptions(unique);
    } catch (error) {
      setResponsibleOptions(currentUserOption ? [currentUserOption] : []);
    }
  };

  const handleResponsibleChange = (responsibleId) => {
    const option = responsibleOptions.find((candidate) => candidate.id === responsibleId);
    setFormData((prev) => ({
      ...prev,
      responsible_broker_id: option?.id || '',
      responsible_broker_name: option?.name || '',
      responsible_broker_email: option?.email || '',
    }));
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/products/templates/niche');
      setTemplates(res.data);
    } catch (error) {
      console.error('Error cargando templates');
    }
  };

  const fetchCustomFields = async (entityType) => {
    const res = await api.get(`/custom-fields?entity_type=${entityType}`);
    return res.data;
  };

  const fetchAllCustomFields = async () => {
    try {
      const [productFields, leadFields] = await Promise.all([
        fetchCustomFields('products'),
        fetchCustomFields('leads'),
      ]);
      setCustomFields({
        products: productFields,
        leads: leadFields,
      });
    } catch (error) {
      toast.error('No se pudieron cargar los campos personalizados');
    }
  };

  const fetchLeadOptions = async () => {
    try {
      const res = await api.get('/leads');
      setLeadOptions(Array.isArray(res.data) ? res.data : (res.data?.leads || []));
    } catch (error) {
      toast.error('No se pudieron cargar los leads');
    }
  };

  const productCustomFields = useMemo(
    () => customFields.products.filter((field) => field.is_active),
    [customFields.products]
  );

  const visibleCardFields = useMemo(
    () => productCustomFields.filter((field) => field.show_in_card),
    [productCustomFields]
  );

  const visibleTableFields = useMemo(
    () => productCustomFields.filter((field) => field.show_in_table).slice(0, 3),
    [productCustomFields]
  );

  const filterableCustomFields = useMemo(
    () => productCustomFields.filter((field) => field.show_in_filters),
    [productCustomFields]
  );

  const filteredProducts = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (filters.productType !== 'all' && product.product_type !== filters.productType) return false;
      if (filters.niche !== 'all' && product.niche !== filters.niche) return false;
      if (filters.status !== 'all') {
        const shouldBeActive = filters.status === 'active';
        if (Boolean(product.is_active) !== shouldBeActive) return false;
      }
      if (filters.hasImages !== 'all') {
        const hasImages = (product.images || []).length > 0;
        if (filters.hasImages === 'with' && !hasImages) return false;
        if (filters.hasImages === 'without' && hasImages) return false;
      }
      if (searchTerm) {
        const haystack = [
          product.sku,
          product.title,
          product.description,
          ...(product.aliases || []),
          ...(product.keywords || []),
        ].join(' ').toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }

      for (const field of filterableCustomFields) {
        const filterValue = filters.customFieldFilters?.[field.key];
        const productValue = product.custom_fields_data?.[field.key];
        if (!matchesCustomFieldFilter(field, productValue, filterValue)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered];
    switch (filters.sortBy) {
      case 'title_asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price_mxn || 0) - (a.price_mxn || 0));
        break;
      case 'price_asc':
        sorted.sort((a, b) => (a.price_mxn || 0) - (b.price_mxn || 0));
        break;
      case 'updated_asc':
        sorted.sort((a, b) => new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at));
        break;
      case 'updated_desc':
      default:
        sorted.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
        break;
    }
    return sorted;
  }, [filterableCustomFields, filters, products]);

  const nicheOptions = useMemo(() => {
    const set = new Set(products.map((product) => product.niche).filter(Boolean));
    return Array.from(set);
  }, [products]);

  const resetForm = () => {
    setEditingProduct(null);
    setFormData(EMPTY_PRODUCT);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const applyTemplate = () => {
    if (!formData.product_type || !templates[formData.product_type]) return;
    const template = templates[formData.product_type];
    setFormData((prev) => ({
      ...prev,
      description: template.description,
      features: template.features,
    }));
    toast.success('Template aplicado');
  };

  const handleImageSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const nextImages = await Promise.all(files.map(async (file, index) => ({
        id: crypto.randomUUID(),
        url: await readFileAsDataUrl(file),
        filename: file.name,
        alt: formData.title || file.name,
        is_cover: formData.images.length === 0 && index === 0,
        order: formData.images.length + index,
        source: 'upload',
      })));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...nextImages],
      }));
    } catch (error) {
      toast.error('No se pudieron leer las imágenes seleccionadas');
    }
  };

  const fetchMediaAssets = async () => {
    setLoadingMediaAssets(true);
    try {
      const params = {
        file_type: 'image',
        limit: 120,
        ...(mediaSearch.trim() ? { q: mediaSearch.trim() } : {}),
      };
      const res = await api.get('/media', { params });
      setMediaAssets(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('No se pudo cargar Media Hub');
    } finally {
      setLoadingMediaAssets(false);
    }
  };

  const openMediaPicker = async () => {
    setMediaPickerOpen(true);
    await fetchMediaAssets();
  };

  const addMediaHubImage = (asset) => {
    const imageUrl = asset.preview_url || asset.url;
    if (!imageUrl) {
      toast.error('Este asset no tiene una URL disponible para usarlo como imagen');
      return;
    }
    if (formData.images.some((image) => image.media_asset_id === asset.id || image.url === imageUrl)) {
      toast.info('Esta imagen ya está agregada a la propiedad');
      return;
    }
    const nextImage = {
      id: crypto.randomUUID(),
      url: imageUrl,
      filename: asset.original_filename || asset.filename || 'Imagen de Media Hub',
      alt: formData.title || asset.original_filename || asset.filename || 'Imagen de propiedad',
      is_cover: formData.images.length === 0,
      order: formData.images.length,
      source: 'media_hub',
      media_asset_id: asset.id,
    };
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, nextImage],
    }));
    toast.success('Imagen agregada desde Media Hub');
  };

  const removeImage = (imageId) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((image) => image.id !== imageId);
      return {
        ...prev,
        images: nextImages.map((image, index) => ({
          ...image,
          order: index,
          is_cover: index === 0 ? image.is_cover || !nextImages.some((candidate) => candidate.is_cover && candidate.id !== image.id) : image.is_cover,
        })).map((image, index, array) => ({
          ...image,
          is_cover: array.some((candidate) => candidate.is_cover) ? image.is_cover : index === 0,
        })),
      };
    });
  };

  const setCoverImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((image) => ({
        ...image,
        is_cover: image.id === imageId,
      })),
    }));
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      title: product.title || '',
      description: product.description || '',
      product_type: product.product_type || 'real_estate',
      operation_type: product.operation_type || 'sale',
      niche: product.niche || '',
      price_mxn: product.price_mxn || 0,
      commission_percentage: product.commission_percentage || 0,
      responsible_broker_id: product.responsible_broker_id || '',
      responsible_broker_name: product.responsible_broker_name || '',
      responsible_broker_email: product.responsible_broker_email || '',
      monthly_rent_mxn: product.monthly_rent_mxn || 0,
      nightly_rent_mxn: product.nightly_rent_mxn || 0,
      rental_type: product.rental_type || '',
      features: product.features || [],
      aliases: product.aliases || [],
      keywords: product.keywords || [],
      external_id: product.external_id || '',
      is_active: product.is_active ?? true,
      images: product.images || [],
      custom_fields_data: product.custom_fields_data || {},
    });
    setDialogOpen(true);
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('¿Eliminar esta propiedad?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Propiedad eliminada');
      fetchProducts();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const saveProduct = async () => {
    if (!formData.sku.trim()) {
      toast.error('El SKU es requerido');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    const payload = {
      ...formData,
      commission_percentage: Math.max(0, Number(formData.commission_percentage || 0)),
      responsible_broker_id: formData.responsible_broker_id || null,
      responsible_broker_name: formData.responsible_broker_name || null,
      responsible_broker_email: formData.responsible_broker_email || null,
      aliases: formData.aliases,
      keywords: formData.keywords,
      features: formData.features,
      images: formData.images.map((image, index) => ({
        ...image,
        order: index,
        is_cover: image.is_cover || (index === 0 && !formData.images.some((candidate) => candidate.is_cover)),
      })),
    };

    setSaving(true);
    try {
      let savedProductId = editingProduct?.id;
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success('Propiedad actualizada');
      } else {
        const created = await api.post('/products', payload);
        savedProductId = created.data?.id;
        toast.success('Propiedad creada');
      }
      const mediaImageIds = Array.from(new Set(
        formData.images
          .map((image) => image.media_asset_id)
          .filter(Boolean)
      ));
      if (savedProductId && mediaImageIds.length) {
        await Promise.allSettled(mediaImageIds.map((mediaId) => api.put(`/media/${mediaId}/link`, {
          entity_type: 'property',
          entity_id: savedProductId,
          confidence: 1,
          reason: 'Imagen seleccionada desde el formulario de propiedades',
        })));
      }
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const openInterestDialog = async (product) => {
    setSelectedProductForInterest(product);
    setInterestDialogOpen(true);
    setProductInterestForm({
      lead_id: 'none',
      interest_type: 'principal',
      interest_status: 'nuevo_interes',
      priority: 'media',
      notes: '',
    });
    setLoadingProductInterests(true);
    try {
      const [interestsRes] = await Promise.all([
        api.get(`/products/${product.id}/interests`),
        leadOptions.length === 0 ? fetchLeadOptions() : Promise.resolve(),
      ]);
      setProductInterests(Array.isArray(interestsRes.data) ? interestsRes.data : []);
    } catch (error) {
      toast.error('No se pudieron cargar los leads interesados');
    } finally {
      setLoadingProductInterests(false);
    }
  };

  const reloadProductInterests = async () => {
    if (!selectedProductForInterest) return;
    const res = await api.get(`/products/${selectedProductForInterest.id}/interests`);
    setProductInterests(Array.isArray(res.data) ? res.data : []);
  };

  const createProductInterest = async () => {
    if (!selectedProductForInterest || !productInterestForm.lead_id || productInterestForm.lead_id === 'none') {
      toast.error('Selecciona un lead');
      return;
    }

    setSavingProductInterest(true);
    try {
      await api.post('/lead-product-interests', {
        lead_id: productInterestForm.lead_id,
        product_id: selectedProductForInterest.id,
        interest_type: productInterestForm.interest_type,
        interest_status: productInterestForm.interest_status,
        priority: productInterestForm.priority,
        source: 'manual',
        notes: productInterestForm.notes || null,
      });
      await reloadProductInterests();
      setProductInterestForm({
        lead_id: 'none',
        interest_type: 'principal',
        interest_status: 'nuevo_interes',
        priority: 'media',
        notes: '',
      });
      toast.success('Lead vinculado a la propiedad');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo vincular el lead');
    } finally {
      setSavingProductInterest(false);
    }
  };

  const updateProductInterest = async (interestId, payload) => {
    try {
      await api.put(`/lead-product-interests/${interestId}`, payload);
      await reloadProductInterests();
      toast.success('Interés actualizado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo actualizar el interés');
    }
  };

  const deleteProductInterest = async (interestId) => {
    if (!window.confirm('¿Desvincular este lead de la propiedad?')) return;
    try {
      await api.delete(`/lead-product-interests/${interestId}`);
      await reloadProductInterests();
      toast.success('Interés eliminado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el interés');
    }
  };

  const openCustomFieldManager = () => {
    setEditingCustomField(null);
    setCustomFieldForm(EMPTY_CUSTOM_FIELD);
    setCustomFieldManagerOpen(true);
  };

  const editCustomField = (field) => {
    setEditingCustomField(field);
    setCustomFieldForm({
      label: field.label,
      key: field.key,
      entity_type: field.entity_type,
      field_type: field.field_type,
      options: field.options || [],
      required: field.required ?? false,
      is_active: field.is_active ?? true,
      show_in_table: field.show_in_table ?? false,
      show_in_card: field.show_in_card ?? false,
      show_in_filters: field.show_in_filters ?? false,
      sort_order: field.sort_order ?? 0,
    });
  };

  const resetCustomFieldEditor = () => {
    setEditingCustomField(null);
    setCustomFieldForm((prev) => ({
      ...EMPTY_CUSTOM_FIELD,
      entity_type: prev.entity_type || customFieldEntityType,
    }));
  };

  const saveCustomField = async () => {
    if (!customFieldForm.label.trim()) {
      toast.error('El label es requerido');
      return;
    }

    const payload = {
      ...customFieldForm,
      key: customFieldForm.key.trim() || customFieldForm.label,
      options: customFieldForm.options,
      entity_type: customFieldEntityType,
    };

    setSavingCustomField(true);
    try {
      if (editingCustomField) {
        await api.put(`/custom-fields/${editingCustomField.id}`, payload);
        toast.success('Campo personalizado actualizado');
      } else {
        await api.post('/custom-fields', payload);
        toast.success('Campo personalizado creado');
      }
      await fetchAllCustomFields();
      resetCustomFieldEditor();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo guardar el campo personalizado');
    } finally {
      setSavingCustomField(false);
    }
  };

  const deleteCustomField = async (fieldId) => {
    if (!window.confirm('¿Eliminar este campo personalizado?')) return;
    try {
      await api.delete(`/custom-fields/${fieldId}`);
      toast.success('Campo personalizado eliminado');
      await fetchAllCustomFields();
      if (editingCustomField?.id === fieldId) {
        resetCustomFieldEditor();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo eliminar el campo personalizado');
    }
  };

  const moveCustomField = async (field, direction) => {
    const fieldsForEntity = customFields[customFieldEntityType] || [];
    const currentIndex = fieldsForEntity.findIndex((item) => item.id === field.id);
    const swapIndex = currentIndex + direction;
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= fieldsForEntity.length) return;

    const swapField = fieldsForEntity[swapIndex];
    try {
      await Promise.all([
        api.put(`/custom-fields/${field.id}`, { sort_order: swapField.sort_order ?? swapIndex }),
        api.put(`/custom-fields/${swapField.id}`, { sort_order: field.sort_order ?? currentIndex }),
      ]);
      await fetchAllCustomFields();
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo reordenar el campo personalizado');
    }
  };

  const renderCustomFieldInput = (field) => {
    const value = formData.custom_fields_data?.[field.key];

    if (field.field_type === 'textarea') {
      return (
        <Textarea
          value={value || ''}
          onChange={(event) => setFormData((prev) => ({
            ...prev,
            custom_fields_data: {
              ...prev.custom_fields_data,
              [field.key]: event.target.value,
            },
          }))}
          rows={3}
        />
      );
    }

    if (field.field_type === 'select') {
      return (
        <Select
          value={value || 'none'}
          onValueChange={(nextValue) => setFormData((prev) => ({
            ...prev,
            custom_fields_data: {
              ...prev.custom_fields_data,
              [field.key]: nextValue === 'none' ? '' : nextValue,
            },
          }))}
        >
          <SelectTrigger><SelectValue placeholder="Seleccionar opción" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin valor</SelectItem>
            {(field.options || []).map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.field_type === 'boolean') {
      return (
        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
          <span className="text-sm text-muted-foreground">Activar valor</span>
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => setFormData((prev) => ({
              ...prev,
              custom_fields_data: {
                ...prev.custom_fields_data,
                [field.key]: checked,
              },
            }))}
          />
        </div>
      );
    }

    return (
      <Input
        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
        value={field.field_type === 'number' && value === 0 ? 0 : value || ''}
        onChange={(event) => setFormData((prev) => ({
          ...prev,
          custom_fields_data: {
            ...prev.custom_fields_data,
            [field.key]: normalizeCustomFieldValue(field, event.target.value),
          },
        }))}
      />
    );
  };

  const renderToolbar = () => (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Propiedades</h2>
          <p className="text-sm text-muted-foreground">Gestiona tu catálogo con imágenes, filtros y vistas tipo catálogo o tabla.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-border/70 bg-muted/30 p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
            >
              <List className="mr-2 h-4 w-4" />
              Tabla
            </Button>
          </div>

          <Button variant="outline" onClick={openCustomFieldManager}>
            <Settings2 className="mr-2 h-4 w-4" />
            Campos personalizados
          </Button>

          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva propiedad
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFilters = () => (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h3 className="font-medium">Filtros útiles</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <Label className="mb-2 block">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                className="pl-9"
                placeholder="SKU, título, alias o keywords"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Tipo</Label>
            <Select value={filters.productType} onValueChange={(value) => setFilters((prev) => ({ ...prev, productType: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Nicho</Label>
            <Select value={filters.niche} onValueChange={(value) => setFilters((prev) => ({ ...prev, niche: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {nicheOptions.map((niche) => (
                  <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Estado</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Imágenes</Label>
            <Select value={filters.hasImages} onValueChange={(value) => setFilters((prev) => ({ ...prev, hasImages: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with">Con imágenes</SelectItem>
                <SelectItem value="without">Sin imágenes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Orden</Label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Más recientes</SelectItem>
                <SelectItem value="updated_asc">Más antiguos</SelectItem>
                <SelectItem value="title_asc">Título A-Z</SelectItem>
                <SelectItem value="price_desc">Precio mayor</SelectItem>
                <SelectItem value="price_asc">Precio menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filterableCustomFields.length > 0 && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Filtros personalizados</p>
                <p className="text-sm text-muted-foreground">Refina el catálogo con campos dinámicos del negocio.</p>
              </div>
              <Badge variant="outline">{filterableCustomFields.length}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filterableCustomFields.map((field) => {
                const filterValue = filters.customFieldFilters?.[field.key] ?? '';

                if (field.field_type === 'select') {
                  return (
                    <div key={field.id}>
                      <Label className="mb-2 block">{field.label}</Label>
                      <Select
                        value={filterValue || 'all'}
                        onValueChange={(value) => setFilters((prev) => ({
                          ...prev,
                          customFieldFilters: {
                            ...prev.customFieldFilters,
                            [field.key]: value === 'all' ? '' : value,
                          },
                        }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {(field.options || []).map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (field.field_type === 'boolean') {
                  return (
                    <div key={field.id}>
                      <Label className="mb-2 block">{field.label}</Label>
                      <Select
                        value={filterValue || 'all'}
                        onValueChange={(value) => setFilters((prev) => ({
                          ...prev,
                          customFieldFilters: {
                            ...prev.customFieldFilters,
                            [field.key]: value,
                          },
                        }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="true">Sí</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                return (
                  <div key={field.id}>
                    <Label className="mb-2 block">{field.label}</Label>
                    <Input
                      type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                      value={filterValue}
                      placeholder={field.field_type === 'multi_select' ? 'Buscar valor...' : 'Filtrar...'}
                      onChange={(event) => setFilters((prev) => ({
                        ...prev,
                        customFieldFilters: {
                          ...prev.customFieldFilters,
                          [field.key]: event.target.value,
                        },
                      }))}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredProducts.length} propiedades encontradas</span>
          <Button variant="ghost" size="sm" onClick={() => setFilters({
            search: '',
            productType: 'all',
            niche: 'all',
            status: 'all',
            hasImages: 'all',
            sortBy: 'updated_desc',
            customFieldFilters: {},
          })}>
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredProducts.map((product) => {
        const coverImage = (product.images || []).find((image) => image.is_cover) || product.images?.[0];
        return (
          <Card key={product.id} className="overflow-hidden border-border/70 bg-card/95">
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-900/70">
              {coverImage ? (
                <img
                  src={coverImage.url}
                  alt={coverImage.alt || product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <Package className="h-10 w-10" />
                </div>
              )}
              <div className="absolute left-3 top-3 flex gap-2">
                <Badge variant="secondary">{product.sku}</Badge>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>

            <CardContent className="space-y-4 p-5">
              <div>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">{product.niche || 'Sin nicho'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{PRODUCT_TYPES.find((type) => type.value === product.product_type)?.label || product.product_type}</Badge>
                    <Badge variant="secondary">{OPERATION_TYPES.find((type) => type.value === (product.operation_type || 'sale'))?.label || 'Venta'}</Badge>
                  </div>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {product.description || 'Sin descripción'}
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <p className="truncate font-medium">
                      {product.responsible_broker_name || 'Sin asignar'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={Number(product.commission_percentage || 0) > 0 ? 'default' : 'secondary'}>
                    Comisión: {formatCommissionPercentage(product.commission_percentage)}
                  </Badge>
                  {calculateEstimatedCommission(product) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Estimada: ${calculateEstimatedCommission(product).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Precio</p>
                  <p className="font-medium">${Number(product.price_mxn || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Renta</p>
                  <p className="font-medium">${Number(product.nightly_rent_mxn || product.monthly_rent_mxn || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Comisión</p>
                  <p className="font-medium">{formatCommissionPercentage(product.commission_percentage)}</p>
                </div>
              </div>

              {visibleCardFields.length > 0 && (
                <div className="space-y-2">
                  {visibleCardFields.map((field) => (
                    <div key={field.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className="max-w-[60%] text-right font-medium">{prettifyFieldValue(product.custom_fields_data?.[field.key])}</span>
                    </div>
                  ))}
                </div>
              )}

              {(product.aliases || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.aliases.slice(0, 3).map((alias) => (
                    <Badge key={alias} variant="outline">{alias}</Badge>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => openInterestDialog(product)}>
                  Leads
                </Button>
                <Button size="sm" variant="outline" onClick={() => editProduct(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteProduct(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Operación</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Comisión</TableHead>
              {visibleTableFields.map((field) => (
                <TableHead key={field.id}>{field.label}</TableHead>
              ))}
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const coverImage = (product.images || []).find((image) => image.is_cover) || product.images?.[0];
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-14 w-20 overflow-hidden rounded-lg border border-border/60 bg-slate-900/70">
                      {coverImage ? (
                        <img src={coverImage.url} alt={product.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-500">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{PRODUCT_TYPES.find((type) => type.value === product.product_type)?.label || product.product_type}</TableCell>
                  <TableCell>{OPERATION_TYPES.find((type) => type.value === (product.operation_type || 'sale'))?.label || 'Venta'}</TableCell>
                  <TableCell>{product.niche || '-'}</TableCell>
                  <TableCell>
                    <div className="max-w-[180px]">
                      <p className="truncate font-medium">{product.responsible_broker_name || 'Sin asignar'}</p>
                      {product.responsible_broker_email && (
                        <p className="truncate text-xs text-muted-foreground">{product.responsible_broker_email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${Number(product.price_mxn || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={Number(product.commission_percentage || 0) > 0 ? 'default' : 'secondary'}>
                        {formatCommissionPercentage(product.commission_percentage)}
                      </Badge>
                      {calculateEstimatedCommission(product) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ${calculateEstimatedCommission(product).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  {visibleTableFields.map((field) => (
                    <TableCell key={field.id}>{prettifyFieldValue(product.custom_fields_data?.[field.key])}</TableCell>
                  ))}
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openInterestDialog(product)}>
                        Leads
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => editProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <Card className="border-dashed border-border/70 bg-card/95">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No hay propiedades con esos filtros</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ajusta tus filtros o crea una propiedad nueva para empezar a construir el catálogo.
        </p>
        <Button className="mt-5" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Crear propiedad
        </Button>
      </CardContent>
    </Card>
  );

  const renderMediaPickerDialog = () => (
    <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
      <DialogContent className="flex max-h-[86vh] max-w-5xl min-h-0 flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>Elegir imágenes de Media Hub</DialogTitle>
          <DialogDescription>
            Selecciona fotos, screenshots o renders ya guardados para usarlos en esta propiedad.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-6 py-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={mediaSearch}
                onChange={(event) => setMediaSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') fetchMediaAssets();
                }}
                placeholder="Buscar por nombre, tag o contexto"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchMediaAssets} disabled={loadingMediaAssets}>
              {loadingMediaAssets ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loadingMediaAssets ? (
            <div className="flex min-h-56 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando Media Hub...
            </div>
          ) : mediaAssets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
              No encontré imágenes en Media Hub para esta búsqueda.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {mediaAssets.map((asset) => {
                const selected = formData.images.some((image) => image.media_asset_id === asset.id || image.url === (asset.preview_url || asset.url));
                return (
                  <div key={asset.id} className="overflow-hidden rounded-xl border border-border/70 bg-card">
                    <div className="relative aspect-[4/3] bg-slate-900/70">
                      {(asset.preview_url || asset.url) ? (
                        <img
                          src={asset.preview_url || asset.url}
                          alt={asset.original_filename || asset.filename}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Sin preview
                        </div>
                      )}
                      {selected && (
                        <div className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-xs font-medium text-white">
                          Agregada
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-3">
                      <div>
                        <p className="truncate text-sm font-medium">{asset.original_filename || asset.filename}</p>
                        <p className="text-xs text-muted-foreground">{asset.source || 'media'} · {asset.status || 'activo'}</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        variant={selected ? 'outline' : 'default'}
                        onClick={() => addMediaHubImage(asset)}
                        disabled={selected}
                      >
                        {selected ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                        {selected ? 'Ya agregada' : 'Agregar a propiedad'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => setMediaPickerOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderProductDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl min-h-0 flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>{editingProduct ? 'Editar Propiedad' : 'Nueva Propiedad'}</DialogTitle>
          <DialogDescription>Construye un catálogo más visual, con imágenes y campos dinámicos.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>SKU</Label>
              <Input value={formData.sku} onChange={(event) => setFormData((prev) => ({ ...prev, sku: event.target.value }))} placeholder="ej: LOT-001" />
            </div>
            <div>
              <Label>Tipo de Propiedad</Label>
              <Select value={formData.product_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, product_type: value, niche: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nicho</Label>
              <Select value={formData.niche || 'none'} onValueChange={(value) => setFormData((prev) => ({ ...prev, niche: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona un nicho" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin nicho</SelectItem>
                  {(NICHOS[formData.product_type] || []).map((niche) => (
                    <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Título</Label>
              <Input value={formData.title} onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))} placeholder="ej: Lote Residencial Aldea Zama" />
            </div>
            <div>
              <Label>Operación</Label>
              <Select value={formData.operation_type || 'sale'} onValueChange={(value) => setFormData((prev) => ({ ...prev, operation_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Precio (MXN)</Label>
              <Input type="number" value={formData.price_mxn} onChange={(event) => setFormData((prev) => ({ ...prev, price_mxn: Number(event.target.value || 0) }))} />
            </div>
            <div>
              <Label>Responsable</Label>
              <Select
                value={formData.responsible_broker_id || 'none'}
                onValueChange={(value) => handleResponsibleChange(value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin responsable</SelectItem>
                  {responsibleOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}{option.email ? ` · ${option.email}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Broker o admin que dará seguimiento comercial a esta propiedad.
              </p>
            </div>
            <div>
              <Label>Comisión para agente (%)</Label>
              <Input
                type="number"
                value={formData.commission_percentage}
                onChange={(event) => setFormData((prev) => ({ ...prev, commission_percentage: Number(event.target.value || 0) }))}
                min={0}
                max={100}
                step={0.1}
                data-testid="product-commission-percentage"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Se muestra junto a la descripción para priorizar unidades de mayor utilidad.
              </p>
            </div>
          </div>

          {(formData.operation_type === 'rent' || formData.operation_type === 'both') && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Tipo de renta</Label>
                <Select value={formData.rental_type || 'short_term'} onValueChange={(value) => setFormData((prev) => ({ ...prev, rental_type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Corta estancia</SelectItem>
                    <SelectItem value="mid_term">Media estancia</SelectItem>
                    <SelectItem value="long_term">Larga estancia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Renta mensual</Label>
                <Input type="number" value={formData.monthly_rent_mxn} onChange={(event) => setFormData((prev) => ({ ...prev, monthly_rent_mxn: Number(event.target.value || 0) }))} />
              </div>
              <div>
                <Label>Renta por noche</Label>
                <Input type="number" value={formData.nightly_rent_mxn} onChange={(event) => setFormData((prev) => ({ ...prev, nightly_rent_mxn: Number(event.target.value || 0) }))} />
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Descripción</Label>
              <Button size="sm" variant="outline" onClick={applyTemplate} disabled={!formData.product_type}>
                <Sparkles className="mr-2 h-4 w-4" />
                Aplicar template
              </Button>
            </div>
            <Textarea value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} rows={5} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Alias (coma)</Label>
              <Input value={formData.aliases.join(', ')} onChange={(event) => setFormData((prev) => ({ ...prev, aliases: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
            </div>
            <div>
              <Label>Keywords (coma)</Label>
              <Input value={formData.keywords.join(', ')} onChange={(event) => setFormData((prev) => ({ ...prev, keywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
            </div>
            <div>
              <Label>Características (coma)</Label>
              <Input value={formData.features.join(', ')} onChange={(event) => setFormData((prev) => ({ ...prev, features: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>ID Externo</Label>
              <Input value={formData.external_id} onChange={(event) => setFormData((prev) => ({ ...prev, external_id: event.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
              <div>
                <p className="font-medium">Propiedad activa</p>
                <p className="text-sm text-muted-foreground">Controla si se muestra como parte del catálogo vigente.</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))} />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Imágenes de la propiedad</h3>
                <p className="text-sm text-muted-foreground">Sube imágenes o elige assets existentes desde Media Hub.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={openMediaPicker}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Elegir de Media Hub
                </Button>
                <label className="inline-flex cursor-pointer items-center rounded-md border border-border/70 px-3 py-2 text-sm font-medium hover:bg-muted/40">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Subir local
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelection} />
                </label>
              </div>
            </div>

            {formData.images.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                Aún no has agregado imágenes.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {formData.images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-xl border border-border/70 bg-card">
                    <div className="relative aspect-[4/3] bg-slate-900/70">
                      <img src={image.url} alt={image.alt || formData.title} className="h-full w-full object-cover" />
                      <div className="absolute right-2 top-2 flex gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setCoverImage(image.id)}>
                          <Star className={`h-4 w-4 ${image.is_cover ? 'fill-current text-amber-300' : ''}`} />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => removeImage(image.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 p-3">
                      <p className="truncate text-sm font-medium">{image.filename || 'Imagen'}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={image.is_cover ? 'default' : 'secondary'}>
                          {image.is_cover ? 'Portada' : 'Secundaria'}
                        </Badge>
                        {image.source === 'media_hub' && (
                          <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/10 text-cyan-700">
                            Media Hub
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {productCustomFields.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div>
                <h3 className="font-semibold">Campos personalizados</h3>
                <p className="text-sm text-muted-foreground">Aplica datos extra a la propiedad sin tocar el esquema base.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {productCustomFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>{field.label}</Label>
                    {renderCustomFieldInput(field)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="mt-0 border-t px-6 py-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={saveProduct} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingProduct ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderCustomFieldsManager = () => {
    const fieldsForEntity = customFields[customFieldEntityType] || [];

    return (
      <Dialog open={customFieldManagerOpen} onOpenChange={setCustomFieldManagerOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-6xl min-h-0 flex-col overflow-hidden p-0">
          <DialogHeader className="border-b px-6 pb-4 pt-6">
            <DialogTitle>Campos personalizados</DialogTitle>
            <DialogDescription>Administra definiciones para leads y propiedades desde un solo lugar.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
          <div className="grid min-w-[960px] gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="inline-flex rounded-xl border border-border/70 bg-muted/30 p-1">
                <Button
                  size="sm"
                  variant={customFieldEntityType === 'products' ? 'default' : 'ghost'}
                  onClick={() => {
                    setCustomFieldEntityType('products');
                    resetCustomFieldEditor();
                  }}
                >
                  Propiedades
                </Button>
                <Button
                  size="sm"
                  variant={customFieldEntityType === 'leads' ? 'default' : 'ghost'}
                  onClick={() => {
                    setCustomFieldEntityType('leads');
                    resetCustomFieldEditor();
                  }}
                >
                  Leads
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campos definidos</CardTitle>
                  <CardDescription>{fieldsForEntity.length} campos configurados para {customFieldEntityType}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fieldsForEntity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no hay campos para esta entidad.</p>
                  ) : (
                    fieldsForEntity.map((field) => (
                      <div key={field.id} className="flex items-start justify-between rounded-xl border border-border/70 p-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{field.label}</p>
                            <Badge variant="outline">{field.field_type}</Badge>
                            {!field.is_active && <Badge variant="secondary">Inactivo</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">key: {field.key}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {field.show_in_card && <span>Visible en card</span>}
                            {field.show_in_table && <span>Visible en tabla</span>}
                            {field.show_in_filters && <span>Filtrable</span>}
                            {field.required && <span>Requerido</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => moveCustomField(field, -1)}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => moveCustomField(field, 1)}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => editCustomField(field)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteCustomField(field.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{editingCustomField ? 'Editar campo' : 'Nuevo campo'}</CardTitle>
                <CardDescription>Configura cómo se verá y dónde se mostrará.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Label</Label>
                    <Input value={customFieldForm.label} onChange={(event) => setCustomFieldForm((prev) => ({ ...prev, label: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Key</Label>
                    <Input value={customFieldForm.key} onChange={(event) => setCustomFieldForm((prev) => ({ ...prev, key: event.target.value }))} placeholder="se autogenera si lo dejas vacío" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={customFieldForm.field_type} onValueChange={(value) => setCustomFieldForm((prev) => ({ ...prev, field_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Texto largo</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="multi_select">Multi select</SelectItem>
                        <SelectItem value="boolean">Booleano</SelectItem>
                        <SelectItem value="date">Fecha</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Orden</Label>
                    <Input type="number" value={customFieldForm.sort_order} onChange={(event) => setCustomFieldForm((prev) => ({ ...prev, sort_order: Number(event.target.value || 0) }))} />
                  </div>
                </div>

                {(customFieldForm.field_type === 'select' || customFieldForm.field_type === 'multi_select') && (
                  <div>
                    <Label>Opciones (coma)</Label>
                    <Input
                      value={customFieldForm.options.join(', ')}
                      onChange={(event) => setCustomFieldForm((prev) => ({
                        ...prev,
                        options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      }))}
                    />
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  {[
                    ['required', 'Campo requerido'],
                    ['is_active', 'Campo activo'],
                    ['show_in_table', 'Mostrar en tabla'],
                    ['show_in_card', 'Mostrar en card'],
                    ['show_in_filters', 'Mostrar en filtros'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={Boolean(customFieldForm[key])}
                        onCheckedChange={(checked) => setCustomFieldForm((prev) => ({ ...prev, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={resetCustomFieldEditor}>Limpiar</Button>
                  <Button onClick={saveCustomField} disabled={savingCustomField}>
                    {savingCustomField && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCustomField ? 'Actualizar' : 'Crear campo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderProductInterestsDialog = () => (
    <Dialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl min-h-0 flex-col overflow-hidden p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>Leads interesados</DialogTitle>
          <DialogDescription>
            {selectedProductForInterest ? `Gestiona el interés sobre ${selectedProductForInterest.title}.` : 'Gestiona leads interesados por propiedad.'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-dashed border-border/70 p-4 space-y-3">
            <p className="text-sm font-medium">Vincular lead a esta propiedad</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="mb-2 block">Lead</Label>
                <Select
                  value={productInterestForm.lead_id}
                  onValueChange={(value) => setProductInterestForm((prev) => ({ ...prev, lead_id: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona un lead" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecciona un lead</SelectItem>
                    {leadOptions.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} ({lead.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Tipo</Label>
                <Select value={productInterestForm.interest_type} onValueChange={(value) => setProductInterestForm((prev) => ({ ...prev, interest_type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="secundario">Secundario</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                    <SelectItem value="cross_sell">Cross sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Estado</Label>
                <Select value={productInterestForm.interest_status} onValueChange={(value) => setProductInterestForm((prev) => ({ ...prev, interest_status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo_interes">Nuevo interés</SelectItem>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="envio_info">Envío info</SelectItem>
                    <SelectItem value="visita_agendada">Visita agendada</SelectItem>
                    <SelectItem value="negociacion">Negociación</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Prioridad</Label>
                <Select value={productInterestForm.priority} onValueChange={(value) => setProductInterestForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Notas</Label>
                <Textarea
                  value={productInterestForm.notes}
                  onChange={(event) => setProductInterestForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Ej: pidió brochure o está interesado en financiamiento"
                />
              </div>
            </div>
            <Button onClick={createProductInterest} disabled={savingProductInterest}>
              {savingProductInterest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vincular lead
            </Button>
          </div>

          <div className="space-y-3">
            {loadingProductInterests ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : productInterests.length === 0 ? (
              <Card className="border-dashed border-border/70">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Todavía no hay leads vinculados a esta propiedad.
                </CardContent>
              </Card>
            ) : (
              productInterests.map((interest) => (
                <Card key={interest.id} className="border-border/70 bg-card/95">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{interest.lead?.name || 'Lead sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{interest.lead?.phone || 'Sin teléfono'}{interest.lead?.email ? ` • ${interest.lead.email}` : ''}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteProductInterest(interest.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <Label className="mb-2 block">Tipo</Label>
                        <Select value={interest.interest_type} onValueChange={(value) => updateProductInterest(interest.id, { interest_type: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="secundario">Secundario</SelectItem>
                            <SelectItem value="upsell">Upsell</SelectItem>
                            <SelectItem value="cross_sell">Cross sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Estado</Label>
                        <Select value={interest.interest_status} onValueChange={(value) => updateProductInterest(interest.id, { interest_status: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevo_interes">Nuevo interés</SelectItem>
                            <SelectItem value="contactado">Contactado</SelectItem>
                            <SelectItem value="envio_info">Envío info</SelectItem>
                            <SelectItem value="visita_agendada">Visita agendada</SelectItem>
                            <SelectItem value="negociacion">Negociación</SelectItem>
                            <SelectItem value="descartado">Descartado</SelectItem>
                            <SelectItem value="cerrado">Cerrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Prioridad</Label>
                        <Select value={interest.priority} onValueChange={(value) => updateProductInterest(interest.id, { priority: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {interest.notes && (
                      <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                        {interest.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {renderToolbar()}
      {renderFilters()}
      {filteredProducts.length === 0 ? renderEmptyState() : viewMode === 'grid' ? renderGridView() : renderTableView()}
      {renderProductDialog()}
      {renderMediaPickerDialog()}
      {renderCustomFieldsManager()}
      {renderProductInterestsDialog()}
    </div>
  );
};

export default ProductsPage;

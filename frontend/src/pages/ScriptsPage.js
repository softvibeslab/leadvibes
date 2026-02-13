import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Search, Copy, Loader2, Tag, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const categoryConfig = {
  apertura: { label: 'Apertura', color: 'bg-blue-500' },
  seguimiento: { label: 'Seguimiento', color: 'bg-cyan-500' },
  presentacion: { label: 'Presentación', color: 'bg-purple-500' },
  cierre: { label: 'Cierre', color: 'bg-emerald-500' },
  'post-venta': { label: 'Post-Venta', color: 'bg-orange-500' },
  objeciones: { label: 'Objeciones', color: 'bg-red-500' },
};

const ScriptCard = ({ script, onClick }) => {
  const category = categoryConfig[script.category] || categoryConfig.apertura;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(script.content);
    toast.success('Script copiado al portapapeles');
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
      onClick={() => onClick(script)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${category.color}`} />
            <Badge variant="secondary" className="text-xs">{category.label}</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
          {script.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {script.content.slice(0, 150)}...
        </p>
        {script.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {script.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ScriptDetailModal = ({ script, isOpen, onClose }) => {
  if (!script) return null;

  const category = categoryConfig[script.category];

  const handleCopy = () => {
    navigator.clipboard.writeText(script.content);
    toast.success('Script copiado al portapapeles');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${category?.color}`} />
            <Badge variant="secondary">{category?.label}</Badge>
          </div>
          <DialogTitle className="text-xl">{script.title}</DialogTitle>
          <DialogDescription>
            {script.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="mr-1">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <pre className="whitespace-pre-wrap text-sm font-sans">{script.content}</pre>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cerrar
          </Button>
          <Button onClick={handleCopy} className="rounded-full">
            <Copy className="w-4 h-4 mr-2" /> Copiar Script
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const NewScriptModal = ({ isOpen, onClose, onCreated, api }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'apertura',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput && !form.tags.includes(tagInput)) {
      setForm({ ...form, tags: [...form.tags, tagInput] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/scripts', form);
      toast.success('Script creado exitosamente');
      onCreated();
      onClose();
      setForm({
        title: '',
        category: 'apertura',
        content: '',
        tags: [],
      });
    } catch (error) {
      toast.error('Error al crear script');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo Script de Ventas</DialogTitle>
          <DialogDescription>Crea un script para tu biblioteca</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Apertura para inversionistas"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contenido del Script</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Escribe tu script aquí..."
              className="min-h-[200px]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Agregar tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {form.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Script
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ScriptsPage = () => {
  const { api } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedScript, setSelectedScript] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadScripts();
  }, [categoryFilter]);

  const loadScripts = async () => {
    try {
      let url = '/scripts';
      if (categoryFilter !== 'all') url += `?category=${categoryFilter}`;
      const res = await api.get(url);
      setScripts(res.data);
    } catch (error) {
      console.error('Error loading scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScripts = scripts.filter((script) =>
    script.title?.toLowerCase().includes(search.toLowerCase()) ||
    script.content?.toLowerCase().includes(search.toLowerCase()) ||
    script.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6" data-testid="scripts-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-['Outfit']">Scripts de Ventas</h1>
          <p className="text-muted-foreground">{scripts.length} scripts en tu biblioteca</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Script
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar scripts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key}>{config.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Scripts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map((script) => (
            <ScriptCard key={script.id} script={script} onClick={setSelectedScript} />
          ))}
          {filteredScripts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay scripts disponibles</p>
              <Button variant="link" onClick={() => setShowNewModal(true)}>
                Crear tu primer script
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Script Detail Modal */}
      <ScriptDetailModal
        script={selectedScript}
        isOpen={!!selectedScript}
        onClose={() => setSelectedScript(null)}
      />

      {/* New Script Modal */}
      <NewScriptModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={loadScripts}
        api={api}
      />
    </div>
  );
};

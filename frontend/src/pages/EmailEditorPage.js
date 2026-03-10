import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Save, Eye, Code, Loader2, Type, Image, Link2,
  Square, Columns, Minus, Trash2, MoveUp, MoveDown, Copy,
  Palette, AlignLeft, AlignCenter, AlignRight, Plus, Undo, Redo, Mail,
  Building2, Share2, GripVertical, Home, MapPin, DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Block types for the email editor
const BLOCK_TYPES = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'image', label: 'Imagen', icon: Image },
  { type: 'button', label: 'Botón', icon: Square },
  { type: 'divider', label: 'Divisor', icon: Minus },
  { type: 'spacer', label: 'Espaciado', icon: GripVertical },
  { type: 'propertyCard', label: 'Propiedad', icon: Building2 },
  { type: 'socialLinks', label: 'Social', icon: Share2 },
  { type: 'columns', label: 'Columnas', icon: Columns },
];

// Default block content
const DEFAULT_BLOCKS = {
  text: {
    type: 'text',
    content: 'Escribe tu texto aquí...',
    style: {
      fontSize: 16,
      color: '#333333',
      textAlign: 'left',
      fontWeight: 'normal',
      padding: 16,
    }
  },
  image: {
    type: 'image',
    src: '',
    alt: 'Imagen',
    style: {
      width: '100%',
      maxWidth: 600,
      textAlign: 'center',
      padding: 16,
    }
  },
  button: {
    type: 'button',
    text: 'Click aquí',
    url: '#',
    style: {
      backgroundColor: '#0D9488',
      color: '#ffffff',
      fontSize: 16,
      padding: '12px 24px',
      borderRadius: 8,
      textAlign: 'center',
    }
  },
  divider: {
    type: 'divider',
    style: {
      borderColor: '#e5e7eb',
      borderWidth: 1,
      margin: '16px 0',
    }
  },
  spacer: {
    type: 'spacer',
    style: {
      height: 20,
    }
  },
  propertyCard: {
    type: 'propertyCard',
    propertyTitle: 'Nombre de la Propiedad',
    propertyPrice: '$1,000,000 MXN',
    propertyAddress: 'Dirección de la propiedad',
    propertyImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600',
    propertyLink: '#',
    showPrice: true,
    showAddress: true,
    style: {
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 16,
    }
  },
  socialLinks: {
    type: 'socialLinks',
    platforms: [
      { name: 'facebook', url: '', icon: 'f' },
      { name: 'instagram', url: '', icon: '@' },
      { name: 'linkedin', url: '', icon: 'in' },
      { name: 'whatsapp', url: '', icon: 'wa' },
    ],
    style: {
      alignment: 'center',
      iconSize: 32,
      iconColor: '#0D9488',
    }
  },
  columns: {
    type: 'columns',
    columns: [
      { blocks: [] },
      { blocks: [] },
    ],
    style: {
      gap: 16,
      padding: 16,
    }
  },
};

export const EmailEditorPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !templateId || templateId === 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Template state
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    blocks: [],
    backgroundColor: '#ffffff',
    contentWidth: 600,
  });

  useEffect(() => {
    if (!isNew) {
      loadTemplate();
    } else {
      // Check if duplicating
      const duplicateFrom = searchParams.get('duplicate');
      if (duplicateFrom) {
        loadTemplate(duplicateFrom, true);
      }
    }
  }, [templateId]);

  const loadTemplate = async (id = templateId, isDuplicate = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplate({
          name: isDuplicate ? `${data.name} (Copia)` : data.name,
          subject: data.subject,
          blocks: data.json_content?.blocks || [],
          backgroundColor: data.json_content?.backgroundColor || '#ffffff',
          contentWidth: data.json_content?.contentWidth || 600,
        });
      }
    } catch (error) {
      toast.error('Error al cargar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = useCallback((newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newBlocks));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(prev => ({
        ...prev,
        blocks: JSON.parse(history[historyIndex - 1])
      }));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(prev => ({
        ...prev,
        blocks: JSON.parse(history[historyIndex + 1])
      }));
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_BLOCKS[type])),
      id: `block-${Date.now()}`
    };
    const newBlocks = [...template.blocks, newBlock];
    setTemplate(prev => ({ ...prev, blocks: newBlocks }));
    saveHistory(newBlocks);
    setSelectedBlockIndex(newBlocks.length - 1);
  };

  const updateBlock = (index, updates) => {
    const newBlocks = [...template.blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setTemplate(prev => ({ ...prev, blocks: newBlocks }));
  };

  const deleteBlock = (index) => {
    const newBlocks = template.blocks.filter((_, i) => i !== index);
    setTemplate(prev => ({ ...prev, blocks: newBlocks }));
    saveHistory(newBlocks);
    setSelectedBlockIndex(null);
  };

  const moveBlock = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.blocks.length) return;
    
    const newBlocks = [...template.blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setTemplate(prev => ({ ...prev, blocks: newBlocks }));
    saveHistory(newBlocks);
    setSelectedBlockIndex(newIndex);
  };

  const duplicateBlock = (index) => {
    const newBlock = {
      ...JSON.parse(JSON.stringify(template.blocks[index])),
      id: `block-${Date.now()}`
    };
    const newBlocks = [...template.blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setTemplate(prev => ({ ...prev, blocks: newBlocks }));
    saveHistory(newBlocks);
    setSelectedBlockIndex(index + 1);
  };

  const generateHTML = () => {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${template.backgroundColor};">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" style="width:${template.contentWidth}px;max-width:100%;border-collapse:collapse;background-color:#ffffff;">
`;

    template.blocks.forEach(block => {
      html += generateBlockHTML(block);
    });

    html += `
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    return html;
  };

  const generateBlockHTML = (block) => {
    switch (block.type) {
      case 'text':
        return `
          <tr>
            <td style="padding:${block.style.padding}px;font-size:${block.style.fontSize}px;color:${block.style.color};text-align:${block.style.textAlign};font-weight:${block.style.fontWeight};">
              ${block.content}
            </td>
          </tr>`;
      case 'image':
        return block.src ? `
          <tr>
            <td style="padding:${block.style.padding}px;text-align:${block.style.textAlign};">
              <img src="${block.src}" alt="${block.alt}" style="max-width:100%;width:${block.style.width};" />
            </td>
          </tr>` : '';
      case 'button':
        return `
          <tr>
            <td style="padding:16px;text-align:${block.style.textAlign};">
              <a href="${block.url}" style="display:inline-block;background-color:${block.style.backgroundColor};color:${block.style.color};font-size:${block.style.fontSize}px;padding:${block.style.padding};border-radius:${block.style.borderRadius}px;text-decoration:none;">
                ${block.text}
              </a>
            </td>
          </tr>`;
      case 'divider':
        return `
          <tr>
            <td style="padding:${block.style.margin};">
              <hr style="border:0;border-top:${block.style.borderWidth}px solid ${block.style.borderColor};" />
            </td>
          </tr>`;
      case 'spacer':
        return `
          <tr>
            <td style="height:${block.style.height}px;font-size:1px;line-height:1px;">
              &nbsp;
            </td>
          </tr>`;
      case 'propertyCard':
        return `
          <tr>
            <td style="padding:${block.style.padding}px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;background-color:${block.style.backgroundColor};border-radius:${block.style.borderRadius}px;overflow:hidden;">
                ${block.propertyImage ? `
                <tr>
                  <td style="padding:0;">
                    <img src="${block.propertyImage}" alt="${block.propertyTitle}" style="width:100%;display:block;" />
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:16px;">
                    <h3 style="margin:0 0 8px;font-size:20px;color:#333;">${block.propertyTitle}</h3>
                    ${block.showPrice ? `<p style="margin:0 0 8px;font-size:24px;font-weight:bold;color:#0D9488;">${block.propertyPrice}</p>` : ''}
                    ${block.showAddress ? `<p style="margin:0 0 16px;font-size:14px;color:#666;">📍 ${block.propertyAddress}</p>` : ''}
                    ${block.propertyLink ? `<a href="${block.propertyLink}" style="display:inline-block;background-color:#0D9488;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:14px;">Ver Propiedad</a>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      case 'socialLinks':
        const alignMap = { left: 'left', center: 'center', right: 'right' };
        return `
          <tr>
            <td style="padding:16px;text-align:${alignMap[block.style.alignment] || 'center'};">
              <table role="presentation" style="display:inline-table;border-collapse:collapse;">
                <tr>
                  ${block.platforms.map(p => p.url ? `
                    <td style="padding:0 8px 0 0;">
                      <a href="${p.url}" style="display:inline-block;width:${block.style.iconSize}px;height:${block.style.iconSize}px;background-color:${block.style.iconColor};color:#fff;text-decoration:none;border-radius:50%;text-align:center;line-height:${block.style.iconSize}px;font-size:${block.style.iconSize * 0.5}px;font-weight:bold;">
                        ${p.icon}
                      </a>
                    </td>
                  ` : '').join('')}
                </tr>
              </table>
            </td>
          </tr>`;
      default:
        return '';
    }
  };

  const handleSave = async () => {
    if (!template.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!template.subject.trim()) {
      toast.error('El asunto es requerido');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: template.name,
        subject: template.subject,
        html_content: generateHTML(),
        json_content: {
          blocks: template.blocks,
          backgroundColor: template.backgroundColor,
          contentWidth: template.contentWidth,
        },
        variables: extractVariables(template.blocks),
      };

      const url = isNew 
        ? `${API_URL}/api/email-templates`
        : `${API_URL}/api/email-templates/${templateId}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Plantilla guardada');
        if (isNew) {
          const data = await response.json();
          navigate(`/email-templates/${data.id}`);
        }
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const extractVariables = (blocks) => {
    const vars = new Set();
    const regexDouble = /\{\{(\w+)\}\}/g;
    const regexSingle = /\{(\w+)\}/g;

    const extractFromText = (text, regex) => {
      let match;
      // Reset regex state
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        vars.add(match[1]);
      }
    };

    blocks.forEach(block => {
      // Extract from various block properties
      const textFields = [
        block.content,
        block.text,
        block.propertyTitle,
        block.propertyPrice,
        block.propertyAddress,
        block.subject,
      ];

      textFields.forEach(text => {
        if (text && typeof text === 'string') {
          extractFromText(text, regexDouble);
          extractFromText(text, regexSingle);
        }
      });
    });

    return Array.from(vars);
  };

  const selectedBlock = selectedBlockIndex !== null ? template.blocks[selectedBlockIndex] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <Input
              value={template.name}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre de la plantilla"
              className="text-lg font-semibold h-8 border-0 p-0 focus-visible:ring-0"
              data-testid="template-name-input"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={handleSave} disabled={saving} data-testid="save-template-btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Types */}
        <aside className="w-20 border-r bg-card p-2 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center mb-2">Bloques</p>
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="ghost"
              className="flex flex-col h-auto py-3 px-2"
              onClick={() => addBlock(type)}
              data-testid={`add-${type}-block`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px]">{label}</span>
            </Button>
          ))}
        </aside>

        {/* Main Content - Preview */}
        <main className="flex-1 overflow-auto p-4 bg-muted/30">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 max-w-md">
                <Label className="text-xs text-muted-foreground">Asunto del email</Label>
                <Input
                  value={template.subject}
                  onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Asunto del email..."
                  className="mt-1"
                  data-testid="template-subject-input"
                />
              </div>
              <TabsList>
                <TabsTrigger value="editor" className="gap-2">
                  <Eye className="w-4 h-4" /> Editor
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-2">
                  <Code className="w-4 h-4" /> HTML
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="flex-1 overflow-auto">
              <div 
                className="mx-auto shadow-lg rounded-lg overflow-hidden"
                style={{ 
                  maxWidth: template.contentWidth,
                  backgroundColor: template.backgroundColor 
                }}
              >
                {template.blocks.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Comienza a diseñar tu email</p>
                    <p className="text-sm">Arrastra bloques desde la izquierda</p>
                  </div>
                ) : (
                  template.blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className={`relative group cursor-pointer transition-all ${
                        selectedBlockIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      onClick={() => setSelectedBlockIndex(index)}
                    >
                      {/* Block toolbar */}
                      <div className={`absolute -top-8 right-0 bg-background shadow rounded-lg flex items-center gap-1 p-1 z-10 transition-opacity ${
                        selectedBlockIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }}>
                          <MoveUp className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }}>
                          <MoveDown className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateBlock(index); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteBlock(index); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Block content */}
                      <BlockPreview block={block} />
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 overflow-auto">
              <pre className="bg-card p-4 rounded-lg text-xs overflow-auto h-full">
                <code>{generateHTML()}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar - Block Settings */}
        <aside className="w-72 border-l bg-card p-4 overflow-auto">
          {selectedBlock ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Configuración</h3>
                <Badge variant="secondary" className="text-xs">
                  {BLOCK_TYPES.find(b => b.type === selectedBlock.type)?.label}
                </Badge>
              </div>
              <Separator />
              
              <BlockSettings
                block={selectedBlock}
                onChange={(updates) => updateBlock(selectedBlockIndex, updates)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Configuración General</h3>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Color de fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={template.backgroundColor}
                      onChange={(e) => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={template.backgroundColor}
                      onChange={(e) => setTemplate(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Ancho del contenido</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[template.contentWidth]}
                      onValueChange={([v]) => setTemplate(prev => ({ ...prev, contentWidth: v }))}
                      min={400}
                      max={800}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{template.contentWidth}px</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Usa variables como <code className="bg-muted px-1 rounded">{'{{nombre}}'}</code> o <code className="bg-muted px-1 rounded">{'{{propiedad}}'}</code> para personalizar.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

// Block Preview Component
const BlockPreview = ({ block }) => {
  switch (block.type) {
    case 'text':
      return (
        <div
          style={{
            padding: block.style.padding,
            fontSize: block.style.fontSize,
            color: block.style.color,
            textAlign: block.style.textAlign,
            fontWeight: block.style.fontWeight,
          }}
          dangerouslySetInnerHTML={{ __html: block.content.replace(/\n/g, '<br/>') }}
        />
      );
    case 'image':
      return (
        <div style={{ padding: block.style.padding, textAlign: block.style.textAlign }}>
          {block.src ? (
            <img src={block.src} alt={block.alt} style={{ maxWidth: '100%', width: block.style.width }} />
          ) : (
            <div className="bg-muted h-32 flex items-center justify-center rounded">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
      );
    case 'button':
      return (
        <div style={{ padding: 16, textAlign: block.style.textAlign }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: block.style.backgroundColor,
              color: block.style.color,
              fontSize: block.style.fontSize,
              padding: block.style.padding,
              borderRadius: block.style.borderRadius,
            }}
          >
            {block.text}
          </span>
        </div>
      );
    case 'divider':
      return (
        <div style={{ margin: block.style.margin, padding: '0 16px' }}>
          <hr style={{ border: 0, borderTop: `${block.style.borderWidth}px solid ${block.style.borderColor}` }} />
        </div>
      );
    case 'spacer':
      return (
        <div style={{ height: block.style.height, backgroundColor: 'rgba(0,0,0,0.02)' }}>
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      );
    case 'propertyCard':
      return (
        <div style={{ padding: block.style.padding }}>
          <div style={{
            backgroundColor: block.style.backgroundColor,
            borderRadius: block.style.borderRadius,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            {block.propertyImage && (
              <img
                src={block.propertyImage}
                alt={block.propertyTitle}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
            )}
            <div style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                {block.propertyTitle}
              </h3>
              {block.showPrice && (
                <p style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 'bold', color: '#0D9488' }}>
                  <DollarSign className="w-4 h-4 inline" />
                  {block.propertyPrice}
                </p>
              )}
              {block.showAddress && (
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#666' }}>
                  <MapPin className="w-3 h-3 inline" />
                  {block.propertyAddress}
                </p>
              )}
              {block.propertyLink && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#0D9488',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}>
                    Ver Propiedad
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    case 'socialLinks':
      return (
        <div style={{ padding: '16px', textAlign: block.style.alignment }}>
          <div className="flex justify-center gap-3">
            {block.platforms.map((p, i) => (
              p.url ? (
                <div
                  key={i}
                  style={{
                    width: block.style.iconSize + 'px',
                    height: block.style.iconSize + 'px',
                    backgroundColor: block.style.iconColor,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: block.style.iconSize * 0.4 + 'px',
                  }}
                >
                  {p.icon}
                </div>
              ) : null
            ))}
            {block.platforms.filter(p => p.url).length === 0 && (
              <span className="text-xs text-muted-foreground">Configura tus redes sociales</span>
            )}
          </div>
        </div>
      );
    default:
      return null;
  }
};

// Block Settings Component
const BlockSettings = ({ block, onChange }) => {
  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Contenido</Label>
            <Textarea
              value={block.content}
              onChange={(e) => onChange({ content: e.target.value })}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Tamaño de fuente</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[block.style.fontSize]}
                onValueChange={([v]) => onChange({ style: { ...block.style, fontSize: v } })}
                min={10}
                max={48}
                step={1}
              />
              <span className="text-sm w-10">{block.style.fontSize}px</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Color del texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.style.color}
                onChange={(e) => onChange({ style: { ...block.style, color: e.target.value } })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={block.style.color}
                onChange={(e) => onChange({ style: { ...block.style, color: e.target.value } })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Alineación</Label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(align => (
                <Button
                  key={align}
                  variant={block.style.textAlign === align ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange({ style: { ...block.style, textAlign: align } })}
                >
                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Peso de fuente</Label>
            <Select
              value={block.style.fontWeight}
              onValueChange={(v) => onChange({ style: { ...block.style, fontWeight: v } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Negrita</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
      
    case 'image':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">URL de la imagen</Label>
            <Input
              value={block.src}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Texto alternativo</Label>
            <Input
              value={block.alt}
              onChange={(e) => onChange({ alt: e.target.value })}
              placeholder="Descripción de la imagen"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Alineación</Label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(align => (
                <Button
                  key={align}
                  variant={block.style.textAlign === align ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange({ style: { ...block.style, textAlign: align } })}
                >
                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
      
    case 'button':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Texto del botón</Label>
            <Input
              value={block.text}
              onChange={(e) => onChange({ text: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">URL del enlace</Label>
            <Input
              value={block.url}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Color de fondo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.style.backgroundColor}
                onChange={(e) => onChange({ style: { ...block.style, backgroundColor: e.target.value } })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={block.style.backgroundColor}
                onChange={(e) => onChange({ style: { ...block.style, backgroundColor: e.target.value } })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Color del texto</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.style.color}
                onChange={(e) => onChange({ style: { ...block.style, color: e.target.value } })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={block.style.color}
                onChange={(e) => onChange({ style: { ...block.style, color: e.target.value } })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Bordes redondeados</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[block.style.borderRadius]}
                onValueChange={([v]) => onChange({ style: { ...block.style, borderRadius: v } })}
                min={0}
                max={24}
                step={1}
              />
              <span className="text-sm w-10">{block.style.borderRadius}px</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Alineación</Label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(align => (
                <Button
                  key={align}
                  variant={block.style.textAlign === align ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange({ style: { ...block.style, textAlign: align } })}
                >
                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
      
    case 'divider':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Color de la línea</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.style.borderColor}
                onChange={(e) => onChange({ style: { ...block.style, borderColor: e.target.value } })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={block.style.borderColor}
                onChange={(e) => onChange({ style: { ...block.style, borderColor: e.target.value } })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Grosor</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[block.style.borderWidth]}
                onValueChange={([v]) => onChange({ style: { ...block.style, borderWidth: v } })}
                min={1}
                max={5}
                step={1}
              />
              <span className="text-sm w-10">{block.style.borderWidth}px</span>
            </div>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Altura del espacio</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[block.style.height]}
                onValueChange={([v]) => onChange({ style: { ...block.style, height: v } })}
                min={5}
                max={100}
                step={5}
              />
              <span className="text-sm w-10">{block.style.height}px</span>
            </div>
          </div>
        </div>
      );

    case 'propertyCard':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Título de la propiedad</Label>
            <Input
              value={block.propertyTitle}
              onChange={(e) => onChange({ propertyTitle: e.target.value })}
              placeholder="Ej: Residencial Santa Fe"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Precio</Label>
            <Input
              value={block.propertyPrice}
              onChange={(e) => onChange({ propertyPrice: e.target.value })}
              placeholder="$1,000,000 MXN"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={block.showPrice}
              onCheckedChange={(checked) => onChange({ showPrice: checked })}
              id="show-price"
            />
            <Label htmlFor="show-price" className="text-sm">Mostrar precio</Label>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Dirección</Label>
            <Input
              value={block.propertyAddress}
              onChange={(e) => onChange({ propertyAddress: e.target.value })}
              placeholder="Av. Principal #123"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={block.showAddress}
              onCheckedChange={(checked) => onChange({ showAddress: checked })}
              id="show-address"
            />
            <Label htmlFor="show-address" className="text-sm">Mostrar dirección</Label>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">URL de imagen</Label>
            <Input
              value={block.propertyImage}
              onChange={(e) => onChange({ propertyImage: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Enlace de la propiedad</Label>
            <Input
              value={block.propertyLink}
              onChange={(e) => onChange({ propertyLink: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Color de fondo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.style.backgroundColor}
                onChange={(e) => onChange({ style: { ...block.style, backgroundColor: e.target.value } })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={block.style.backgroundColor}
                onChange={(e) => onChange({ style: { ...block.style, backgroundColor: e.target.value } })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      );

    case 'socialLinks':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Alineación</Label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(align => (
                <Button
                  key={align}
                  variant={block.style.alignment === align ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange({ style: { ...block.style, alignment: align } })}
                >
                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Tamaño de iconos</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[block.style.iconSize]}
                onValueChange={([v]) => onChange({ style: { ...block.style, iconSize: v } })}
                min={20}
                max={48}
                step={2}
              />
              <span className="text-sm w-10">{block.style.iconSize}px</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Color de iconos</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={block.style.iconColor}
                onChange={(e) => onChange({ style: { ...block.style, iconColor: e.target.value } })}
                className="w-12 h-10 p-1"
              />
              <Input
                value={block.style.iconColor}
                onChange={(e) => onChange({ style: { ...block.style, iconColor: e.target.value } })}
                className="flex-1"
              />
            </div>
          </div>
          <Separator />
          <Label className="text-sm">Redes Sociales</Label>
          {block.platforms.map((platform, idx) => (
            <div key={idx} className="space-y-2">
              <Label className="text-xs capitalize">{platform.name}</Label>
              <Input
                value={platform.url}
                onChange={(e) => {
                  const newPlatforms = [...block.platforms];
                  newPlatforms[idx].url = e.target.value;
                  onChange({ platforms: newPlatforms });
                }}
                placeholder={`URL de ${platform.name}`}
              />
            </div>
          ))}
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">Sin configuración disponible</p>;
  }
};

export default EmailEditorPage;

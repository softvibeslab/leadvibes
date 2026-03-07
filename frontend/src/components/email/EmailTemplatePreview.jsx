import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const EmailTemplatePreviewDialog = ({ isOpen, onClose, template, token }) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('desktop');

  // Default preview data for real estate
  const defaultPreviewVars = {
    nombre: 'Juan Pérez',
    propiedad: 'Residencial Santa Fe',
    property_address: 'Av. Presidente Masaryk 101, Polanco',
    property_price: '$5,500,000 MXN',
    property_image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600',
    broker_name: 'Tu Agente',
    broker_signature: 'Tu Agente<br/>Rovi Real Estate<br/>+52 55 1234 5678',
    company_name: 'Rovi Real Estate',
    client_name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+52 55 9876 5432'
  };

  // Extract variables from template
  const variables = template?.variables || [];

  useEffect(() => {
    if (isOpen && template) {
      loadPreview();
    }
  }, [isOpen, template]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultPreviewVars),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        throw new Error('Error loading preview');
      }
    } catch (error) {
      toast.error('Error al cargar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Ingresa un email de prueba');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates/send-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          recipient_email: testEmail,
          preview_data: defaultPreviewVars,
        }),
      });

      if (response.ok) {
        toast.success('Email de prueba enviado');
      } else {
        throw new Error('Error sending test email');
      }
    } catch (error) {
      toast.error('Error al enviar email de prueba');
    } finally {
      setSending(false);
    }
  };

  const renderPreviewFrame = (scale = 1) => {
    const iframeWidth = scale === 1 ? '100%' : '375px'; // Desktop vs Mobile

    return (
      <div
        className="flex justify-center bg-muted/30 rounded-lg p-4"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
      >
        <div
          className="bg-white shadow-lg rounded overflow-auto transition-all"
          style={{ width: iframeWidth, maxWidth: '600px', minHeight: '400px' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe
              srcDoc={previewData?.html_content}
              title="Email Preview"
              className="w-full border-0"
              style={{ minHeight: '400px', height: 'auto' }}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    );
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-5xl ${isFullscreen ? 'h-screen w-screen max-w-none rounded-none' : ''}`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {template.name}
            </DialogTitle>
            <DialogDescription>
              {template.subject}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Variables Info */}
        {variables.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground">Variables usadas:</Label>
            {variables.map((variable, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {'{{' + variable + '}}'}
              </Badge>
            ))}
          </div>
        )}

        {/* Tabs for Desktop/Mobile preview */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={activeTab === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('desktop')}
          >
            Desktop
          </Button>
          <Button
            variant={activeTab === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('mobile')}
          >
            Mobile
          </Button>
        </div>

        {/* Preview */}
        <ScrollArea className="flex-1">
          {activeTab === 'desktop' ? renderPreviewFrame(1) : renderPreviewFrame(0.6)}
        </ScrollArea>

        {/* Send Test Email */}
        <div className="flex items-center gap-2 p-4 border-t">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Email de prueba</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tu@email.com"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSendTest} disabled={sending} className="mt-4">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Prueba
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, X, Sparkles, Loader2, BarChart3, Pencil, CalendarPlus, Mail, Phone, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

const cardToneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-900',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  slate: 'border-slate-200 bg-slate-50 text-slate-900',
  purple: 'border-purple-200 bg-purple-50 text-purple-900',
};

const extractMetricCards = (content = '') => {
  const cards = [];
  const lines = content.split('\n');
  const metricPattern = /^[\s*\-•]*\**([^:*\n]+?)\**:\s*([0-9][0-9.,]*)\s*(?:leads?)?/i;

  lines.forEach((line) => {
    const match = line.match(metricPattern);
    if (!match) return;
    const label = match[1].replace(/\*/g, '').trim();
    const value = Number(match[2].replace(/[,.]/g, ''));
    if (!label || Number.isNaN(value)) return;
    cards.push({ label, value, tone: cards.length % 2 === 0 ? 'blue' : 'emerald' });
  });

  return cards.slice(0, 6);
};

const renderInlineMarkdown = (text = '') => {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-background/70 px-1 py-0.5 text-[0.8em]">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-primary">{link[1]}</a>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const MarkdownText = ({ content = '' }) => {
  const lines = String(content).split('\n');
  const blocks = [];
  let bullets = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-2 ml-4 list-disc space-y-1">
        {bullets.map((bullet, index) => (
          <li key={index}>{renderInlineMarkdown(bullet)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*•+]\s+(.+)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }

    flushBullets();

    if (!trimmed) {
      blocks.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const sizeClass = heading[1].length === 1 ? 'text-base' : 'text-sm';
      blocks.push(
        <p key={index} className={`${sizeClass} font-semibold mt-2`}>
          {renderInlineMarkdown(heading[2])}
        </p>
      );
      return;
    }

    blocks.push(
      <p key={index} className="leading-relaxed">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushBullets();
  return <div className="space-y-1">{blocks}</div>;
};

const LeadInsightCards = ({ cards = [], onCardClick, disabled = false }) => {
  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {cards.map((card, index) => {
        const query = card.query || `Detalle de leads ${card.label}`;
        return (
          <button
            type="button"
            key={`${card.label}-${index}`}
            onClick={() => onCardClick?.(query)}
            disabled={disabled}
            title="Ver detalle"
            className={`rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${cardToneClasses[card.tone] || cardToneClasses.blue}`}
          >
            <div className="flex items-center gap-2 text-xs font-medium opacity-80">
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{card.label}</span>
            </div>
            <div className={`${['lead', 'flow_step', 'flow_artifact', 'pipeline_badge'].includes(card.type) ? 'text-base' : 'text-2xl'} mt-1 font-bold leading-tight`}>
              {card.value}
            </div>
            {card.subtitle && (
              <div className="mt-1 line-clamp-2 text-[11px] font-medium opacity-80">
                {card.subtitle}
              </div>
            )}
            {card.meta && (
              <div className="mt-1 text-[10px] uppercase tracking-wide opacity-60">
                {card.meta}
              </div>
            )}
            <div className="mt-1 text-[10px] font-medium opacity-70">
              {card.type === 'flow_step' ? 'Click para ejecutar/ver detalle' : card.type === 'flow_artifact' ? 'Click para abrir detalle' : card.type === 'pipeline_badge' ? 'Click para conectar flujo' : card.type === 'lead' ? 'Click para ficha completa' : 'Click para detalle'}
            </div>
          </button>
        );
      })}
    </div>
  );
};

const actionIconFor = (label = '') => {
  const normalized = label.toLowerCase();
  if (normalized.includes('reunión') || normalized.includes('agendar')) return CalendarPlus;
  if (normalized.includes('email')) return Mail;
  if (normalized.includes('sms') || normalized.includes('whatsapp')) return MessageCircle;
  if (normalized.includes('llamada')) return Phone;
  if (normalized.includes('activo') || normalized.includes('embudo')) return Layers;
  return Pencil;
};

const MessageActionTags = ({ actions = [], onActionPrompt, onApiAction, disabled = false }) => {
  if (!actions.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((action, index) => {
        const Icon = actionIconFor(action.label || '');
        if (action.type === 'whatsapp_link' && action.url) {
          return (
            <a
              key={`${action.label}-${index}`}
              href={action.url}
              target="_blank"
              rel="noreferrer"
              title="Abrir WhatsApp con mensaje listo"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label || 'Enviar'}
            </a>
          );
        }

        if (action.type === 'api_post' && action.endpoint) {
          return (
            <button
              type="button"
              key={`${action.label}-${index}`}
              onClick={() => onApiAction?.(action)}
              disabled={disabled}
              title="Crear acción en Rovi"
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label || 'Crear'}
            </button>
          );
        }

        if (action.type === 'chat_prompt' && action.query) {
          return (
            <button
              type="button"
              key={`${action.label}-${index}`}
              onClick={() => onActionPrompt?.(action.query)}
              disabled={disabled}
              title="Pedir ajuste al asistente"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label || 'Modificar'}
            </button>
          );
        }

        return null;
      })}
    </div>
  );
};

export const AIChat = () => {
  const { api } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await api.get('/chat/history?limit=30');
      setMessages(response.data);
      setHistoryLoaded(true);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [api]);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      loadHistory();
    }
  }, [isOpen, historyLoaded, loadHistory]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const submitMessage = async (text) => {
    const content = text?.trim();
    if (!content || loading) return;

    const userMessage = { role: 'user', content, id: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { content });
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: response.data.content,
        id: response.data.id,
        cards: response.data.cards || [],
        lead_summary: response.data.lead_summary,
        lead_items: response.data.lead_items || [],
        actions: response.data.actions || [],
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
        id: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runApiAction = async (action) => {
    if (!action?.endpoint || loading) return;
    setLoading(true);
    try {
      const response = await api.post(action.endpoint, action.payload || {});
      const data = response.data || {};
      const createdParts = [
        data.email_template_id ? `Activo: ${data.email_template_id}` : null,
        data.campaign_id ? `Campaña: ${data.campaign_id}` : null,
        data.workflow_id ? `Pipeline: ${data.workflow_id}` : null,
        data.id ? `ID: ${data.id}` : null,
      ].filter(Boolean);
      const stepText = Array.isArray(data.steps) && data.steps.length
        ? `\n\nSiguiente flujo:\n${data.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}`
        : '';
      const detail = createdParts.length ? `\n\n${createdParts.join('\n')}` : '';
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `${data.message || action.success_message || 'Acción creada correctamente.'}${detail}${stepText}`,
        id: Date.now(),
        cards: data.cards || [],
        actions: data.actions || [],
      }]);
    } catch (error) {
      console.error('Error running action:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: error.response?.data?.detail || 'No pude crear la acción. Revisa que el módulo esté activo e intenta de nuevo.',
        id: Date.now(),
        cards: [],
        actions: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  const quickPrompts = [
    '¿Cómo va mi meta de ventas?',
    '¿Qué lead debo contactar primero?',
    'Dame un tip de ventas',
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${isOpen ? 'hidden' : ''}`}
        data-testid="ai-chat-toggle"
      >
        <div className="absolute inset-0 rounded-full bg-primary animate-pulse-ring opacity-0 group-hover:opacity-100" />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div 
          className="fixed bottom-20 right-6 z-50 w-96 h-[32rem] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-slide-in"
          data-testid="ai-chat-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente IA</h3>
                <p className="text-xs opacity-80">Rovi CRM</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-white/20"
              data-testid="ai-chat-close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto text-primary/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  ¡Hola! Soy tu asistente de ventas. ¿En qué puedo ayudarte?
                </p>
                <div className="space-y-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="block w-full text-left px-3 py-2 text-xs bg-muted/50 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {messages.map((msg) => {
                const metricCards = msg.role === 'assistant'
                  ? (msg.cards?.length ? msg.cards : extractMetricCards(msg.content))
                  : [];
                return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Sparkles className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'px-4 py-2.5 rounded-2xl text-sm bg-primary text-primary-foreground rounded-br-md'
                        : 'space-y-2'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <MarkdownText content={msg.content} />
                    ) : (
                      <>
                        <div className="px-4 py-2.5 rounded-2xl text-sm bg-muted text-foreground rounded-bl-md">
                          <MarkdownText content={msg.content} />
                        </div>
                        <LeadInsightCards cards={metricCards} onCardClick={submitMessage} disabled={loading} />
                        <MessageActionTags actions={msg.actions || []} onActionPrompt={submitMessage} onApiAction={runApiAction} disabled={loading} />
                      </>
                    )}
                  </div>
                </div>
              );})}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 rounded-full bg-muted/50"
                disabled={loading}
                data-testid="ai-chat-input"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                className="rounded-full"
                data-testid="ai-chat-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

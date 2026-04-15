import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageCircle, Mail, Send, Bot, Filter, Search, Clock,
  CheckCircle, AlertCircle, ArrowRight, Phone, Loader2, Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useInboxWebSocket } from '../components/InboxWebSocket';

export const InboxPage = () => {
  const { api, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');  // 'all', 'unanswered'
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadConversations();
    loadAIInsights();
  }, [filter]);

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = useCallback((eventType, data) => {
    switch (eventType) {
      case 'message.received':
      case 'message.sent':
        // Actualizar conversaciones si es un mensaje nuevo
        if (eventType === 'message.received' || data.direction === 'outbound') {
          loadConversations();
        }

        // Si es el chat actual, agregar mensaje
        if (selectedConversation && data.lead_id === selectedConversation.id) {
          setMessages(prev => [...prev, data]);
        }

        // Si es un mensaje enviado y tenemos un chat seleccionado, actualizar estado
        if (eventType === 'message.sent' && selectedConversation) {
          // Actualizar contador de mensajes
          setConversations(prev =>
            prev.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, message_count: conv.message_count + 1 }
                : conv
            )
          );
        }
        break;

      case 'message.read':
        // Actualizar estado de lectura en mensajes
        if (selectedConversation) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.message_id ? { ...msg, read: true } : msg
            )
          );
        }
        break;

      default:
        console.log('Evento WebSocket no manejado:', eventType);
    }
  }, [selectedConversation]);

  // Conectar WebSocket
  const { isConnected } = useInboxWebSocket(
    user?.token,
    handleWebSocketMessage,
    () => setWsConnected(true),
    () => setWsConnected(false)
  );

  const loadConversations = async () => {
    try {
      const params = { filter_type: filter };
      const response = await api.get('/inbox/conversations', { params });
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      const response = await api.get('/inbox/ai-insights');
      setAiInsights(response.data);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const response = await api.get(`/inbox/conversations/${conversation.id}/messages`);
      setMessages(response.data);
    } catch (error) {
      toast.error('Error al cargar mensajes');
      console.error(error);
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      await api.post(`/inbox/conversations/${selectedConversation.id}/messages`, {
        content,
        channel: selectedConversation.channel
      });

      // Recargar mensajes
      const response = await api.get(`/inbox/conversations/${selectedConversation.id}/messages`);
      setMessages(response.data);

      toast.success('Mensaje enviado');
    } catch (error) {
      toast.error('Error al enviar mensaje');
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp': return MessageCircle;
      case 'email': return Mail;
      case 'telegram': return Send;
      default: return MessageCircle;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'whatsapp': return 'text-green-500';
      case 'email': return 'text-purple-500';
      case 'telegram': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const unansweredCount = conversations.filter(c => c.is_unanswered).length;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit']">Inbox Omnicanal</h1>
            <p className="text-sm text-muted-foreground">
              Todas tus conversaciones en un solo lugar
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Indicador de conexión WebSocket */}
            <div className={`flex items-center gap-1 text-xs ${
              wsConnected ? 'text-green-500' : 'text-gray-400'
            }`}>
              <Wifi className="w-3 h-3" />
              <span>{wsConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>

            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todas
              <Badge className="ml-2" variant="secondary">{conversations.length}</Badge>
            </Button>
            <Button
              variant={filter === 'unanswered' ? 'default' : 'outline'}
              onClick={() => setFilter('unanswered')}
            >
              No Contestado
              {unansweredCount > 0 && (
                <Badge className="ml-2 bg-red-500">{unansweredCount}</Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Conversaciones */}
        <div className="w-2/3 flex">
          {/* Lista de conversaciones */}
          {!selectedConversation && (
            <div className="w-full">
              <Card className="h-full rounded-none border-0 border-r">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Conversaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-180px)]">
                    {conversations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay conversaciones</p>
                      </div>
                    ) : (
                      conversations.map((conv) => {
                        const ChannelIcon = getChannelIcon(conv.channel);
                        return (
                          <div
                            key={conv.id}
                            className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedConversation?.id === conv.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => selectConversation(conv)}
                          >
                            <div className="flex items-start gap-3">
                              {conv.is_unanswered && (
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                              )}
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {conv.lead_name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium truncate">{conv.lead_name}</p>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {formatDistanceToNow(new Date(conv.last_message_at), { locale: es, addSuffix: true })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ChannelIcon className={`w-3 h-3 ${getChannelColor(conv.channel)}`} />
                                  <Badge variant="outline" className="text-xs">
                                    {conv.channel}
                                  </Badge>
                                  {conv.is_unanswered && (
                                    <Badge variant="destructive" className="text-xs">
                                      No contestado
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {conv.message_count} mensajes
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chat actual */}
          {selectedConversation && (
            <div className="w-full flex flex-col">
              {/* Chat header */}
              <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedConversation.lead_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-medium">{selectedConversation.lead_name}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {(() => {
                          const ChannelIcon = getChannelIcon(selectedConversation.channel);
                          return <ChannelIcon className={`w-3 h-3 ${getChannelColor(selectedConversation.channel)}`} />;
                        })()}
                        {selectedConversation.channel} • {selectedConversation.message_count} mensajes
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedConversation.is_unanswered && (
                      <Badge variant="destructive">No contestado</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No hay mensajes aún</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        message.direction === 'outbound'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(message.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="border-t bg-card p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Escribe un mensaje..."]');
                      if (input) {
                        sendMessage(input.value);
                        input.value = '';
                      }
                    }}
                    disabled={sendingMessage}
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho - IA */}
        <div className="w-1/3 border-l bg-card">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-primary" />
                Panel IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {aiInsights ? (
                <>
                  {/* Top leads */}
                  {aiInsights.top_leads && aiInsights.top_leads.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Top Leads Hoy
                      </h4>
                      <div className="space-y-2">
                        {aiInsights.top_leads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg cursor-pointer hover:bg-green-500/20 transition-colors"
                            onClick={() => {
                              const conv = conversations.find(c => c.id === lead.id);
                              if (conv) selectConversation(conv);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{lead.name}</span>
                              <Badge className="bg-green-500">
                                {lead.intent_score}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prioridades */}
                  {aiInsights.priorities && aiInsights.priorities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Prioridad
                      </h4>
                      <div className="space-y-2">
                        {aiInsights.priorities.map((priority) => (
                          <div
                            key={priority.id}
                            className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer hover:bg-amber-500/20 transition-colors"
                            onClick={() => {
                              const conv = conversations.find(c => c.id === priority.id);
                              if (conv) selectConversation(conv);
                            }}
                          >
                            <p className="text-sm font-medium">{priority.lead_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{priority.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sugerencias */}
                  {aiInsights.suggestions && aiInsights.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Sugerencias</h4>
                      <div className="space-y-2">
                        {aiInsights.suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              suggestion.type === 'urgent'
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-primary/10 border-primary/20'
                            }`}
                          >
                            <p className="text-sm">{suggestion.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Cargando insights de IA...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

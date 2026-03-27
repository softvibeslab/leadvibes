import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  Send,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

const exampleQueries = [
  {
    icon: TrendingUp,
    label: 'Top Leads',
    query: 'Top 10 leads by budget',
    description: 'Leads con mayor presupuesto',
    color: 'text-emerald-500'
  },
  {
    icon: Users,
    label: 'Conteo',
    query: 'How many leads?',
    description: 'Total de leads en sistema',
    color: 'text-blue-500'
  },
  {
    icon: BarChart3,
    label: 'Por Estado',
    query: 'Leads by status',
    description: 'Leads agrupados por estado',
    color: 'text-purple-500'
  },
  {
    icon: DollarSign,
    label: 'Alta Prioridad',
    query: 'Show me high priority leads',
    description: 'Leads con prioridad alta',
    color: 'text-orange-500'
  }
];

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  const renderResults = (results) => {
    if (!results) return null;

    // Count result
    if (results.count !== undefined) {
      return (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{results.count}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {results.description}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Total encontrado
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Array results (top leads, all leads, etc)
    if (Array.isArray(results)) {
      return (
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{results.length} resultados encontrados</span>
          </div>
          {results.slice(0, 10).map((item, idx) => (
            <Card key={idx} className="p-3 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {item.name && (
                    <p className="font-medium text-sm truncate">{item.name}</p>
                  )}
                  {item.group && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.group}</Badge>
                      <span className="text-2xl font-bold text-primary">{item.count}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {item.email && <span>📧 {item.email}</span>}
                    {item.phone && <span>📞 {item.phone}</span>}
                    {item.budget_mxn && (
                      <span>💰 ${item.budget_mxn.toLocaleString()} MXN</span>
                    )}
                    {item.status && (
                      <Badge variant="outline" className="text-xs">{item.status}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {results.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              Mostrando primeros 10 de {results.length} resultados
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] space-y-2">
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2">
          <p className="text-sm">{message.content}</p>
        </div>
        {message.results && (
          <div className="ml-2">
            {renderResults(message.results)}
          </div>
        )}
        {message.source && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            {message.source === 'mongodb_fallback' ? (
              <>
                <Database className="w-3 h-3" />
                <span>Consulta ejecutada en MongoDB</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>AI for Database</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const DatabaseChatPage = () => {
  const { api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    // Add user message
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/database-chat', { query: text });

      if (response.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.message || 'Consulta ejecutada exitosamente',
          results: response.data.results,
          source: response.data.source || 'mongodb_fallback'
        }]);
        toast.success('Consulta ejecutada correctamente');
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.message || 'No se pudo ejecutar la consulta',
          error: response.data.error,
          suggestions: response.data.suggestions
        }]);
        toast.error('Error en la consulta');
      }
    } catch (error) {
      console.error('Error executing query:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error al conectar con el servidor',
        error: error.message
      }]);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Chat de Base de Datos</h1>
              <p className="text-sm text-muted-foreground">
                Consulta tus datos en lenguaje natural
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="w-3 h-3 mr-1" />
              IA + MongoDB
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Example Queries */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Consultas Ejemplo
                </CardTitle>
                <CardDescription>
Haz clic para ejecutar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exampleQueries.map((example, idx) => {
                  const Icon = example.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(example.query)}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${example.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{example.label}</p>
                          <p className="text-xs text-muted-foreground">{example.description}</p>
                          <p className="text-xs text-primary mt-1 italic truncate">
                            "{example.query}"
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Consejos</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>💬 <strong>Español e inglés:</strong> Puedes preguntar en cualquiera de los dos idiomas</p>
                <p>🔍 <strong>Sé específico:</strong> "Top 5 leads by budget" es mejor que "Show leads"</p>
                <p>📊 <strong>Agrupaciones:</strong> Usa "by" para agrupar (ej: "Leads by status")</p>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Conversación</CardTitle>
                    <CardDescription>
                      Historial de consultas
                    </CardDescription>
                  </div>
                  {messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessages([])}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </CardHeader>

              <Separator />

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-4">
                      <Database className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Chat de Base de Datos
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Haz preguntas en lenguaje natural sobre tus leads, ventas y métricas.
                      <br /><br />
                      Prueba con: <em>"How many leads?"</em> o <em>"Top 5 leads by budget"</em>
                    </p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    {messages.map((msg, idx) => (
                      <ChatMessage key={idx} message={msg} />
                    ))}
                    {loading && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Procesando consulta...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Input */}
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu consulta... (ej: Top 10 leads by budget)"
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={loading || !input.trim()}
                    size="icon"
                    className="shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Presiona Enter para enviar • Shift + Enter para nueva línea
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseChatPage;

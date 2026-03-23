import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Send, User } from 'lucide-react';

export const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hola! Bienvenido a Rovi CRM. En qu puedo ayudarte hoy?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickActions = [
    'Quiero una demo',
    'Precios y planes',
    'Integraciones',
    'Hablar con ventas'
  ];

  const handleSend = (text) => {
    const messageToSend = text || inputValue;
    if (!messageToSend.trim()) return;

    setMessages(prev => [...prev, { from: 'user', text: messageToSend }]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      let response = '';
      if (messageToSend.toLowerCase().includes('demo')) {
        response = 'Excelente! Puedes agendar tu demo gratis aqu: /demo-request Tambin puedes completar el formulario abajo en esta pgina.';
      } else if (messageToSend.toLowerCase().includes('precio') || messageToSend.toLowerCase().includes('plan')) {
        response = 'Tenemos planes desde $1,490 MXN/mes para brokers independientes. Agencias desde $4,990 MXN/mes. Todos incluyen 14 das de prueba gratis!';
      } else if (messageToSend.toLowerCase().includes('integraci')) {
        response = 'Nos integramos con Google Calendar, SendGrid, Twilio, VAPI, WhatsApp, Meta Ads y ms. Puedes ver todas en la seccin Integraciones.';
      } else if (messageToSend.toLowerCase().includes('ventas') || messageToSend.toLowerCase().includes('hablar')) {
        response = 'Un especialista de ventas te contactar en menos de 24 horas. Puedes tambin escribirnos a hola@rovicrm.com';
      } else {
        response = 'Gracias por tu mensaje! Un especialista te responder pronto. Mientras tanto, puedes agendar una demo gratis en el enlace de abajo.';
      }
      setMessages(prev => [...prev, { from: 'bot', text: response }]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    handleSend(action);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-teal-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition"
        >
          <MessageCircle className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
            1
          </div>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-teal-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">Soporte Rovi</div>
                    <div className="text-xs text-white/80 flex items-center">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></span>
                      Online ahora
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-white/20 rounded transition"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.from === 'bot' && (
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-teal-600 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        msg.from === 'user'
                          ? 'bg-gradient-to-r from-primary to-teal-600 text-white'
                          : 'bg-white text-foreground border border-border'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      {msg.from === 'user' && (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions */}
                {messages.length <= 1 && (
                  <div className="px-4 py-2 border-t border-border bg-card">
                    <div className="text-xs text-muted-foreground mb-2">Preguntas frecuentes:</div>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickAction(action)}
                          className="text-xs bg-muted hover:bg-muted/70 px-3 py-1.5 rounded-full transition"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border bg-card">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="bg-gradient-to-r from-primary to-teal-600 text-white p-2 rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Powered by */}
                <div className="px-4 py-2 bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    Powered by Rovi CRM • <a href="#demo-request" className="text-primary hover:underline">Agenda una demo</a>
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook personalizado para conectar al WebSocket del Inbox
 * Maneja reconexión automática, heartbeat y recepción de mensajes
 */
export const useInboxWebSocket = (token, onMessage, onConnect, onDisconnect) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isManualClose = useRef(false);

  const connect = useCallback(() => {
    if (!token) return;

    try {
      // Construir URL del WebSocket
      const wsUrl = `${process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws') || 'ws://localhost:8000'}/ws/inbox?token=${token}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket conectado');
        isManualClose.current = false;

        // Iniciar heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 30 segundos

        if (onConnect) onConnect();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Manejar diferentes tipos de mensajes
          switch (data.type) {
            case 'connection.established':
              console.log('Conexión WebSocket establecida:', data.data);
              break;

            case 'message.received':
              // Nuevo mensaje recibido
              if (onMessage) {
                onMessage('message.received', data.data);
              }

              // Mostrar notificación toast
              toast.success('Nuevo mensaje recibido', {
                description: `${data.data.lead_name}: ${data.data.content?.substring(0, 50)}...`,
                duration: 5000
              });
              break;

            case 'message.sent':
              // Mensaje enviado confirmación
              if (onMessage) {
                onMessage('message.sent', data.data);
              }
              break;

            case 'message.read':
              // Mensaje leído
              if (onMessage) {
                onMessage('message.read', data.data);
              }
              break;

            case 'pong':
              // Heartbeat response - no action needed
              break;

            default:
              console.log('Mensaje WebSocket no manejado:', data.type);
          }
        } catch (error) {
          console.error('Error al parsear mensaje WebSocket:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Error en WebSocket:', error);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason);

        // Limpiar heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (onDisconnect) onDisconnect();

        // Reconexión automática si no es cierre manual
        if (!isManualClose.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Intentando reconectar WebSocket...');
            connect();
          }, 5000); // Reintentar después de 5 segundos
        }
      };

    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
    }
  }, [token, onMessage, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    isManualClose.current = true;

    // Limpiar timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Cerrar conexión
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket no está conectado');
      return false;
    }
  }, []);

  // Efecto de montaje/desmontaje
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    sendMessage,
    disconnect,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};
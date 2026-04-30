/**
 * useWebSocket Hook - ROVI CRM
 * Hook personalizado para conexión WebSocket con auto-reconexión
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connecting, connected, disconnected, error
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const { token } = useAuth();

  const connect = useCallback(() => {
    try {
      const tokenFromStorage = token || localStorage.getItem('leadvibes_token') || localStorage.getItem('token');
      if (!tokenFromStorage) {
        console.log('No token available, skipping WebSocket connection');
        return;
      }

      if (socketRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socketRef.current.readyState)) {
        return;
      }

      setConnectionStatus('connecting');

      // Construir URL WebSocket
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const wsUrl = backendUrl.replace('http', 'ws').replace('https', 'wss') + '/api/ws/dashboard?token=' + tokenFromStorage;

      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');

        // Limpiar timeout de reconexión si existe
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);
          setLastMessage(message);

          // Emitir evento personalizado para que componentes escuchen
          window.dispatchEvent(new CustomEvent('ws-message', {
            detail: message
          }));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        if (socketRef.current === ws) {
          socketRef.current = null;
          setSocket(null);
        }

        if (!shouldReconnectRef.current) {
          console.log('🔌 WebSocket closed');
          setConnectionStatus('disconnected');
          return;
        }

        console.log('🔌 WebSocket closed, attempting reconnect in 5s...');
        setConnectionStatus('disconnected');

        // Reconectar después de 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      setSocket(ws);
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [token]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket...');
    shouldReconnectRef.current = false;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setSocket(null);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(payload);
      console.log('📤 WebSocket sent:', message);
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message);
    }
  }, [socket]);

  // Conectar al montar
  useEffect(() => {
    if (!token) {
      disconnect();
      return;
    }

    shouldReconnectRef.current = true;
    connect();

    // Cleanup al desmontar
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Ping para mantener conexión viva
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const pingInterval = setInterval(() => {
        sendMessage('ping');
      }, 30000); // Ping cada 30 segundos

      return () => clearInterval(pingInterval);
    }
  }, [connectionStatus, sendMessage]);

  return {
    socket,
    connectionStatus,
    lastMessage,
    sendMessage,
    isConnected: connectionStatus === 'connected'
  };
};

/**
 * Hook para escuchar eventos WebSocket específicos
 * @param {string} eventType - Tipo de evento a escuchar (lead_created, metrics_updated, etc.)
 * @param {Function} callback - Función a ejecutar cuando llegue el evento
 */
export const useWebSocketEvent = (eventType, callback) => {
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      const message = event.detail;
      if (message && message.type === eventType) {
        callback(message);
      }
    };

    window.addEventListener('ws-message', handleWebSocketMessage);

    return () => {
      window.removeEventListener('ws-message', handleWebSocketMessage);
    };
  }, [eventType, callback]);
};

/**
 * Hook para obtener datos en tiempo real del dashboard
 */
export const useDashboardRealTime = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Escuchar actualizaciones de métricas
  useWebSocketEvent('metrics_updated', (message) => {
    if (message.data) {
      console.log('📊 Metrics updated:', message.data);
      setStats(message.data);
      setLastUpdate(new Date());
    }
  });

  // Escuchar cambios en leaderboard
  useWebSocketEvent('leaderboard_changed', (message) => {
    if (message.data) {
      console.log('🏆 Leaderboard changed:', message.data);
      setLeaderboard(message.data);
      setLastUpdate(new Date());
    }
  });

  // Escuchar nuevos leads
  useWebSocketEvent('lead_created', (message) => {
    console.log('👤 New lead created:', message.data);
    // Podríamos refrescar stats automáticamente
    setLastUpdate(new Date());
  });

  return {
    stats,
    leaderboard,
    lastUpdate,
    isRealTime: true
  };
};

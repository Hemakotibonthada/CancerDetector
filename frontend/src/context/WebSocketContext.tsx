// ============================================================================
// WebSocket Context - Real-time communication management
// ============================================================================
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

// ============================================================================
// CONTEXT
// ============================================================================
interface WebSocketContextType {
  status: WebSocketStatus;
  connect: (url?: string) => void;
  disconnect: () => void;
  send: (type: string, payload: any) => void;
  subscribe: (type: string, handler: MessageHandler) => () => void;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  status: 'disconnected',
  connect: () => {},
  disconnect: () => {},
  send: () => {},
  subscribe: () => () => {},
  lastMessage: null,
  reconnectAttempts: 0,
  isConnected: false,
});

export const useWebSocketContext = () => useContext(WebSocketContext);

// ============================================================================
// PROVIDER
// ============================================================================
interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url: defaultUrl = `ws://${window.location.hostname}:8000/ws`,
  autoConnect = false,
  maxReconnectAttempts = 5,
  reconnectInterval = 3000,
  heartbeatInterval = 30000,
}) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const urlRef = useRef(defaultUrl);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', payload: {}, timestamp: Date.now() }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus('error');
      return;
    }

    setStatus('reconnecting');
    const delay = reconnectInterval * Math.pow(1.5, reconnectAttempts);
    reconnectTimerRef.current = setTimeout(() => {
      setReconnectAttempts((prev) => prev + 1);
      connect(urlRef.current);
    }, delay);
  }, [reconnectAttempts, maxReconnectAttempts, reconnectInterval]);

  const connect = useCallback((url?: string) => {
    const wsUrl = url || urlRef.current;
    urlRef.current = wsUrl;

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
        startHeartbeat();

        // Send auth token
        const token = localStorage.getItem('token');
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            payload: { token },
            timestamp: Date.now(),
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Dispatch to type-specific handlers
          const typeHandlers = handlersRef.current.get(message.type);
          if (typeHandlers) {
            typeHandlers.forEach((handler) => handler(message));
          }

          // Dispatch to wildcard handlers
          const wildcardHandlers = handlersRef.current.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach((handler) => handler(message));
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

        // Auto-reconnect if not intentional close
        if (!event.wasClean) {
          scheduleReconnect();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      scheduleReconnect();
    }
  }, [startHeartbeat, scheduleReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }

    setStatus('disconnected');
    setReconnectAttempts(0);
  }, []);

  const send = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', type);
    }
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(type);
        }
      }
    };
  }, []);

  // Auto-connect when enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect, connect]);

  return (
    <WebSocketContext.Provider
      value={{
        status,
        connect,
        disconnect,
        send,
        subscribe,
        lastMessage,
        reconnectAttempts,
        isConnected: status === 'connected',
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;

// ============================================================================
// WebSocket Service - Real-time communication with backend
// ============================================================================

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  debug: boolean;
}

const DEFAULT_CONFIG: WebSocketConfig = {
  url: `ws://${window.location.hostname}:8000/ws`,
  reconnectAttempts: 10,
  reconnectInterval: 2000,
  heartbeatInterval: 25000,
  messageQueueSize: 100,
  debug: false,
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectCount: number = 0;
  private messageQueue: any[] = [];
  private isIntentionalClose: boolean = false;
  private _isConnected: boolean = false;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  connect(url?: string): void {
    if (url) this.config.url = url;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.isIntentionalClose = false;

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.reconnectCount = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
        this.connectionHandlers.forEach((h) => h());
        if (this.config.debug) console.log('[WS] Connected');

        // Authenticate
        const token = localStorage.getItem('token');
        if (token) {
          this.send('auth', { token });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (type === 'pong') return;

          // Dispatch to type-specific handlers
          this.handlers.get(type)?.forEach((h) => h(payload));
          // Dispatch to wildcard handlers
          this.handlers.get('*')?.forEach((h) => h(data));

          if (this.config.debug) console.log('[WS] Message:', type, payload);
        } catch (err) {
          if (this.config.debug) console.error('[WS] Parse error:', err);
        }
      };

      this.ws.onclose = (event) => {
        this._isConnected = false;
        this.stopHeartbeat();
        this.disconnectionHandlers.forEach((h) => h());

        if (!this.isIntentionalClose && !event.wasClean) {
          this.scheduleReconnect();
        }
        if (this.config.debug) console.log('[WS] Disconnected', event.code, event.reason);
      };

      this.ws.onerror = (event) => {
        this.errorHandlers.forEach((h) => h(event));
        if (this.config.debug) console.error('[WS] Error:', event);
      };
    } catch (err) {
      if (this.config.debug) console.error('[WS] Connection error:', err);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this._isConnected = false;
    this.reconnectCount = 0;
  }

  send(type: string, payload: any = {}): void {
    const message = JSON.stringify({
      type,
      payload,
      timestamp: Date.now(),
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.enqueueMessage(message);
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: MessageHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // Specialized channels
  subscribeToVitals(patientId: string, handler: MessageHandler): () => void {
    this.send('subscribe', { channel: `vitals:${patientId}` });
    return this.on(`vitals:${patientId}`, handler);
  }

  subscribeToAlerts(handler: MessageHandler): () => void {
    this.send('subscribe', { channel: 'alerts' });
    return this.on('alert', handler);
  }

  subscribeToNotifications(userId: string, handler: MessageHandler): () => void {
    this.send('subscribe', { channel: `notifications:${userId}` });
    return this.on('notification', handler);
  }

  subscribeToChat(roomId: string, handler: MessageHandler): () => void {
    this.send('subscribe', { channel: `chat:${roomId}` });
    return this.on(`chat:${roomId}`, handler);
  }

  sendChatMessage(roomId: string, content: string, attachments?: any[]): void {
    this.send('chat_message', { roomId, content, attachments });
  }

  joinRoom(roomId: string): void {
    this.send('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.send('leave_room', { roomId });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      if (this.config.debug) console.log('[WS] Max reconnect attempts reached');
      return;
    }

    const delay = this.config.reconnectInterval * Math.pow(1.5, this.reconnectCount);
    this.reconnectCount++;

    if (this.config.debug) console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);

    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private enqueueMessage(message: string): void {
    this.messageQueue.push(message);
    if (this.messageQueue.length > this.config.messageQueueSize) {
      this.messageQueue.shift();
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) this.ws.send(message);
    }
  }

  destroy(): void {
    this.disconnect();
    this.handlers.clear();
    this.connectionHandlers.clear();
    this.disconnectionHandlers.clear();
    this.errorHandlers.clear();
    this.messageQueue = [];
  }
}

// Singleton instance
export const wsService = new WebSocketService();
export default WebSocketService;

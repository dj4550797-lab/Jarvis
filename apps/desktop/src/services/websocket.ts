type MessageHandler = (data: { event: string; data?: unknown }) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: number | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        // Send initial ping to keep-alive
        this.socket?.send(JSON.stringify({ action: 'ping' }));
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.handlers.forEach((h) => h(parsed));
        } catch {
          // ignore non-json messages
        }
      };

      this.socket.onclose = () => {
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.socket?.close();
    this.socket = null;
  }
}

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.host;
export const wsClient = new WebSocketClient(`${wsProtocol}//${wsHost}/ws/events`);

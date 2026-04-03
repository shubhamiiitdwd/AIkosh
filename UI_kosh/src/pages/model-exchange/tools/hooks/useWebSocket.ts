import { useEffect, useRef, useState, useCallback } from 'react';

export interface WsMessage {
  status: string;
  progress: number;
  stage: string;
  message: string;
  timestamp: string;
}

export function useTrainingWebSocket(url: string | null) {
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!url) return;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
        setLastMessage(msg);
      } catch { /* ignore parse errors */ }
    };
  }, [url]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, lastMessage, connected, clearMessages };
}

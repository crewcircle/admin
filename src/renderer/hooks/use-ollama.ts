import { useCallback, useEffect, useState } from 'react';
import type { OllamaStatus } from './types';

export function useOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(() => {
    setLoading(true);
    window.adminAPI
      .invoke<OllamaStatus>('ollama:status')
      .then((s) => {
        setStatus(s);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ running: false, model: null, availableModels: [], error: 'Failed to check' });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [check]);

  return { status, loading, refetch: check };
}

export function useOllamaChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(
    async (prompt: string, contextData?: Record<string, unknown>) => {
      setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
      setLoading(true);

      try {
        const channel = contextData ? 'ollama:queryWithContext' : 'ollama:query';
        const input = contextData ? { prompt, contextData } : { prompt };
        const response = await window.copilotAPI.invoke<string>(channel, input);
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${String(err)}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, loading, send, clear };
}

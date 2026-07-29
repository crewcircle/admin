import { useCallback, useEffect, useState } from 'react';

/** Generic IPC invoke hook — returns a stable callback for the given channel. */
export function useIpc<T>(channel: string) {
  const invoke = useCallback(
    (input?: unknown) => {
      return window.adminAPI.invoke<T>(channel, input);
    },
    [channel]
  );
  return invoke;
}

/** Hook that fetches data via IPC on mount and returns data + loading state. */
export function useIpcData<T>(
  channel: string,
  input?: unknown
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inputKey = JSON.stringify(input ?? null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    window.adminAPI
      .invoke<T>(channel, input)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [channel, inputKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/** Hook that listens for IPC push events on a channel. */
export function useIpcEvent<T extends unknown[]>(
  channel: string,
  handler: (...args: T) => void
) {
  useEffect(() => {
    const unsubscribe = window.adminAPI.on(channel, (...args: unknown[]) => {
      handler(...(args as T));
    });
    return unsubscribe;
  }, [channel, handler]);
}

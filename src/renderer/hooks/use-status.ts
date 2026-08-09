import { useCallback, useEffect, useState } from 'react';
import type { ServiceStatus } from './types';

export interface ServiceWithStatus {
  id: string;
  name: string;
  category: 'app' | 'infra' | 'saas';
  url: string;
  checkUrl?: string;
  status: ServiceStatus | null;
}

/**
 * Live service status: initial snapshot via `status:getAll`, then merges
 * `status:update` push events from the main-process poller.
 */
export function useServiceStatus(): {
  services: ServiceWithStatus[];
  loading: boolean;
  error: string | null;
  checkNow: (id: string) => void;
} {
  const [services, setServices] = useState<ServiceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.adminAPI
      .invoke<ServiceWithStatus[]>('status:getAll')
      .then((all) => {
        setServices(all);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });

    const unsubscribe = window.adminAPI.on('status:update', (...args: unknown[]) => {
      const update = args[0] as ServiceStatus;
      setServices((prev) =>
        prev.map((s) => (s.id === update.id ? { ...s, status: update } : s))
      );
    });
    return unsubscribe;
  }, []);

  const checkNow = useCallback((id: string) => {
    window.adminAPI
      .invoke<ServiceStatus | null>('status:checkNow', { id })
      .then((r) => {
        if (r) {
          setServices((prev) => prev.map((s) => (s.id === r.id ? { ...s, status: r } : s)));
        }
      })
      .catch(() => {});
  }, []);

  return { services, loading, error, checkNow };
}

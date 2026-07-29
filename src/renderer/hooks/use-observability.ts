import { useIpcData } from './use-ipc';
import type { SentryAggregate, UptimeCheckResults } from './types';

export function useSentry() {
  return useIpcData<SentryAggregate>('sentry:getAggregate');
}

export function useUptime() {
  return useIpcData<UptimeCheckResults>('uptime:runChecks');
}

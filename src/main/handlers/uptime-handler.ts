import { ipcMain } from 'electron';

interface UptimeResult {
  url: string;
  status: number | null;
  latency_ms: number;
  ok: boolean;
}

interface UptimeCheckResults {
  results: UptimeResult[];
}

export function registerUptimeHandlers(): void {
  ipcMain.handle('uptime:runChecks', async () => {
    // Discover URLs from env-style keys in credentials or hardcoded list
    const urls: string[] = [];

    // Look for UPTIME_URL_* pattern in process.env and credential store
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('UPTIME_URL_')) {
        const val = process.env[key];
        if (val) urls.push(val);
      }
    }

    if (urls.length === 0) {
      // Default: check crewcircle website
      urls.push('https://crewcircle.com.au');
    }

    const results: UptimeResult[] = await Promise.all(
      urls.map(async (url) => {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return {
            url,
            status: res.status,
            latency_ms: Date.now() - start,
            ok: res.ok,
          };
        } catch {
          return {
            url,
            status: null,
            latency_ms: Date.now() - start,
            ok: false,
          };
        }
      })
    );

    return { results } satisfies UptimeCheckResults;
  });
}

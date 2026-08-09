import { BrowserWindow, ipcMain } from 'electron';
import { SERVICES, type ServiceDescriptor } from '../config/services';

export interface ServiceStatus {
  id: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  checkedAt: number;
  failures: number;
  detail?: string;
}

export interface ServiceWithStatus extends ServiceDescriptor {
  status: ServiceStatus | null;
}

const POLL_INTERVAL_MS = 60_000;
const TIMEOUT_MS = 10_000;
const MAX_BACKOFF = 4;

/**
 * Live status poller (worldmonitor smart-poll pattern):
 * - per-service timers with staggered starts
 * - exponential backoff on consecutive failures (capped at 4x)
 * - pushes `status:update` events to the renderer on every result
 */
class StatusService {
  private window: BrowserWindow | null = null;
  private results = new Map<string, ServiceStatus>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private started = false;

  setWindow(win: BrowserWindow): void {
    this.window = win;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    SERVICES.forEach((svc, i) => {
      this.timers.set(svc.id, setTimeout(() => void this.run(svc), 500 + i * 150));
    });
  }

  stop(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.started = false;
  }

  getAll(): ServiceWithStatus[] {
    return SERVICES.map((s) => ({ ...s, status: this.results.get(s.id) ?? null }));
  }

  registerIpc(): void {
    ipcMain.handle('status:getAll', () => this.getAll());
    ipcMain.handle('status:checkNow', async (_e, input: { id: string }) => {
      const svc = SERVICES.find((s) => s.id === input.id);
      if (!svc) return null;
      return this.check(svc);
    });
  }

  private async run(svc: ServiceDescriptor): Promise<void> {
    const result = await this.check(svc);
    const backoff = Math.min(MAX_BACKOFF, 2 ** result.failures);
    this.timers.set(svc.id, setTimeout(() => void this.run(svc), POLL_INTERVAL_MS * backoff));
  }

  private async check(svc: ServiceDescriptor): Promise<ServiceStatus> {
    const url = svc.checkUrl ?? svc.url;
    const start = Date.now();
    const prev = this.results.get(svc.id);
    let result: ServiceStatus;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      result = {
        id: svc.id,
        ok: res.ok,
        statusCode: res.status,
        latencyMs: Date.now() - start,
        checkedAt: Date.now(),
        failures: res.ok ? 0 : (prev?.failures ?? 0) + 1,
      };
    } catch (e) {
      result = {
        id: svc.id,
        ok: false,
        statusCode: null,
        latencyMs: Date.now() - start,
        checkedAt: Date.now(),
        failures: (prev?.failures ?? 0) + 1,
        detail: e instanceof Error ? e.message : String(e),
      };
    }
    this.results.set(svc.id, result);
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('status:update', result);
    }
    return result;
  }
}

export const statusService = new StatusService();

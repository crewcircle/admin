import { ipcMain, BrowserView, BrowserWindow, session } from 'electron';

export interface SaaSConfig {
  id: string;
  name: string;
  url: string;
}

const PROVIDERS: SaaSConfig[] = [
  { id: 'supabase', name: 'Supabase', url: 'https://app.supabase.com' },
  { id: 'sentry', name: 'Sentry', url: 'https://crewcircle.sentry.io' },
  { id: 'cloudflare', name: 'Cloudflare', url: 'https://dash.cloudflare.com' },
  { id: 'digitalocean', name: 'DigitalOcean', url: 'https://cloud.digitalocean.com' },
  { id: 'vercel', name: 'Vercel', url: 'https://vercel.com/dashboard' },
  { id: 'doppler', name: 'Doppler', url: 'https://dashboard.doppler.com' },
  { id: 'anthropic', name: 'Anthropic Console', url: 'https://console.anthropic.com' },
  { id: 'openai', name: 'OpenAI Console', url: 'https://platform.openai.com' },
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/orgs/crewcircle' },
];

class BrowserViewManager {
  private views = new Map<string, BrowserView>();
  private parentWindow: BrowserWindow | null = null;
  private boundsResolver: (() => Electron.Rectangle) | null = null;

  /** Called once from main/index.ts to set the parent window for all BrowserViews. */
  setWindow(window: BrowserWindow): void {
    this.parentWindow = window;

    // Keep BrowserViews sized to the content area
    window.on('resize', () => {
      for (const [, view] of this.views) {
        view.setBounds(this.getContentBounds());
      }
    });
  }

  /** Set a function that resolves bounds for the content area (below top tabs). */
  setBoundsResolver(resolver: () => Electron.Rectangle): void {
    this.boundsResolver = resolver;
  }

  private getContentBounds(): Electron.Rectangle {
    if (this.boundsResolver) return this.boundsResolver();
    if (!this.parentWindow) return { x: 0, y: 0, width: 800, height: 600 };

    const bounds = this.parentWindow.getBounds();
    const [width, height] = this.parentWindow.getContentSize();
    return { x: 0, y: 50, width, height: height - 50 }; // Rough: 50px below header
  }

  createForProvider(
    providerId: string,
    url?: string
  ): BrowserView | null {
    if (!this.parentWindow) {
      console.warn('browser-view-manager: no parent window set');
      return null;
    }

    // Return existing if already created
    const existing = this.views.get(providerId);
    if (existing) return existing;

    const view = new BrowserView({
      webPreferences: {
        partition: `persist:${providerId}`,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.parentWindow.addBrowserView(view);
    view.setBounds(this.getContentBounds());
    view.setAutoResize({ width: true, height: true });

    const targetUrl = url ?? this.getProvider(providerId)?.url;
    if (targetUrl) {
      view.webContents.loadURL(targetUrl);
    }

    this.views.set(providerId, view);
    return view;
  }

  show(providerId: string): void {
    const view = this.views.get(providerId);
    if (!view) return;

    // Hide all others, show this one
    for (const [id, v] of this.views) {
      if (id === providerId) {
        v.setBounds(this.getContentBounds());
      } else {
        v.setBounds({ x: -10000, y: -10000, width: 1, height: 1 });
      }
    }
  }

  hide(providerId: string): void {
    const view = this.views.get(providerId);
    if (view) {
      view.setBounds({ x: -10000, y: -10000, width: 1, height: 1 });
    }
  }

  get(providerId: string): BrowserView | undefined {
    return this.views.get(providerId);
  }

  getProviders(): SaaSConfig[] {
    return PROVIDERS;
  }

  getProvider(providerId: string): SaaSConfig | undefined {
    return PROVIDERS.find((p) => p.id === providerId);
  }

  destroy(providerId: string): void {
    const view = this.views.get(providerId);
    if (view && this.parentWindow) {
      this.parentWindow.removeBrowserView(view);
      view.webContents.close();
      this.views.delete(providerId);
    }
  }

  destroyAll(): void {
    if (!this.parentWindow) return;
    for (const [id] of this.views) {
      this.destroy(id);
    }
  }

  /** Check if a provider's session partition still has cookies (signals logged-in state). */
  async isSessionActive(providerId: string): Promise<boolean> {
    try {
      const ses = session.fromPartition(`persist:${providerId}`);
      const cookies = await ses.cookies.get({});
      return cookies.length > 0;
    } catch {
      return false;
    }
  }
}

export const browserViewManager = new BrowserViewManager();

/** Register IPC channels for SaaS BrowserView management. */
export function registerSaaSHandlers(): void {
  ipcMain.handle('saas:openView', async (_event, input: { provider: string }) => {
    const view = browserViewManager.createForProvider(input.provider);
    if (!view) return { success: false };

    browserViewManager.show(input.provider);
    return { success: true };
  });

  ipcMain.handle('saas:closeView', async (_event, input: { provider: string }) => {
    browserViewManager.hide(input.provider);
    return { success: true };
  });

  ipcMain.handle('saas:listProviders', async () => {
    return browserViewManager.getProviders();
  });

  ipcMain.handle('saas:isSessionActive', async (_event, input: { provider: string }) => {
    return browserViewManager.isSessionActive(input.provider);
  });
}

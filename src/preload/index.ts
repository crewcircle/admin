import { contextBridge, ipcRenderer } from 'electron';

// ---------------------------------------------------------------------------
// Read-only channels exposed to the Copilot chat component.
// The copilot must NEVER have access to provision, credentials, or SaaS management.
// ---------------------------------------------------------------------------
const COPILOT_READONLY_CHANNELS = new Set([
  'registry:getProjects',
  'registry:getProject',
  'github:getRepo',
  'costs:getDashboard',
  'costs:getLLMSummary',
  'costs:getFixedSummary',
  'sentry:getAggregate',
  'uptime:runChecks',
  'status:getAll',
  'social:list',
  'insights:list',
  'providers:doBalance',
  'providers:vercelUsage',
  'providers:anthropicUsage',
  'ollama:query',
  'ollama:queryWithContext',
  'ollama:status',
]);

// ---------------------------------------------------------------------------
// Full admin API surface — exposed to main UI tabs.
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('adminAPI', {
  invoke: <T>(channel: string, input?: unknown): Promise<T> =>
    ipcRenderer.invoke(channel, input),

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
});

// ---------------------------------------------------------------------------
// Read-only copilot API surface.
// Any channel NOT in COPILOT_READONLY_CHANNELS throws BEFORE reaching main.
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('copilotAPI', {
  invoke: <T>(channel: string, input?: unknown): Promise<T> => {
    if (!COPILOT_READONLY_CHANNELS.has(channel)) {
      throw new Error(`Copilot denied access to channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, input);
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (!COPILOT_READONLY_CHANNELS.has(channel)) {
      throw new Error(`Copilot denied access to channel: ${channel}`);
    }
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
});

// ---------------------------------------------------------------------------
// Electron shell API — navigation events from main process.
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('electronAPI', {
  onNavigate: (callback: (path: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) =>
      callback(path);
    ipcRenderer.on('navigate', handler);
    return () => {
      ipcRenderer.removeListener('navigate', handler);
    };
  },
});

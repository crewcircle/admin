export {};

declare global {
  interface Window {
    adminAPI: {
      invoke: <T>(channel: string, input?: unknown) => Promise<T>;
      on: (channel: string, cb: (...args: unknown[]) => void) => () => void;
    };
    copilotAPI: {
      invoke: <T>(channel: string, input?: unknown) => Promise<T>;
      on: (channel: string, cb: (...args: unknown[]) => void) => () => void;
    };
    electronAPI: {
      onNavigate: (callback: (path: string) => void) => () => void;
    };
  }
}

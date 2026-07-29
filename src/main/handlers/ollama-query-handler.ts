import { ipcMain } from 'electron';
import { ollamaManager } from '../ollama-manager';

export function registerOllamaQueryHandlers(): void {
  ipcMain.handle('ollama:status', async () => {
    return ollamaManager.checkStatus();
  });

  ipcMain.handle(
    'ollama:query',
    async (_event, input: { prompt: string }) => {
      try {
        const status = await ollamaManager.checkStatus();
        if (!status.running) {
          return 'Ollama is not running. Please install Ollama and try again.';
        }

        const response = await ollamaManager.chat(input.prompt);
        return response;
      } catch (err) {
        console.error('ollama:query error:', err);
        return `Error: ${String(err)}`;
      }
    }
  );

  ipcMain.handle(
    'ollama:queryWithContext',
    async (
      _event,
      input: { prompt: string; contextData: Record<string, unknown> }
    ) => {
      try {
        const status = await ollamaManager.checkStatus();
        if (!status.running) {
          return 'Ollama is not running. Please install Ollama and try again.';
        }

        const response = await ollamaManager.chat(
          input.prompt,
          input.contextData
        );
        return response;
      } catch (err) {
        console.error('ollama:queryWithContext error:', err);
        return `Error: ${String(err)}`;
      }
    }
  );

  ipcMain.handle('ollama:ensureModel', async () => {
    try {
      await ollamaManager.ensureModel();
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}

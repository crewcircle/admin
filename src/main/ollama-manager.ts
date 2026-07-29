import { spawn, type ChildProcess } from 'child_process';
import http from 'http';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2:3b';

interface OllamaStatus {
  running: boolean;
  model: string | null;
  availableModels: string[];
  error?: string;
}

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT =
  'You are the CrewCircle admin copilot. You have access to the current state of all CrewCircle projects and SaaS services. Answer concisely using the data provided. When the user asks to open a dashboard, tell them which SaaS tab to use.';

class OllamaManager {
  private currentModel: string = DEFAULT_MODEL;
  private serverProcess: ChildProcess | null = null;

  async checkStatus(): Promise<OllamaStatus> {
    try {
      const models = await this.httpGet<{ models: Array<{ name: string }> }>(
        '/api/tags'
      );
      const loaded = await this.httpGet<{ models: Array<{ name: string }> }>(
        '/api/ps'
      );

      return {
        running: true,
        model: loaded.models?.[0]?.name ?? null,
        availableModels: (models.models ?? []).map((m) => m.name),
      };
    } catch {
      return {
        running: false,
        model: null,
        availableModels: [],
        error: 'Ollama not running or not reachable at localhost:11434',
      };
    }
  }

  async ensureRunning(): Promise<OllamaStatus> {
    // 1. Check if already running
    const status = await this.checkStatus();
    if (status.running) return status;

    // 2. Try to spawn
    try {
      this.serverProcess = spawn('ollama', ['serve'], {
        stdio: 'ignore',
        detached: false,
      });

      // Swallow spawn errors (e.g. ollama binary not installed) so they don't
      // become uncaught exceptions in the main process. The port wait below
      // will simply time out and report Ollama as unavailable.
      this.serverProcess.on('error', (err) => {
        console.warn('Ollama spawn error (ollama likely not installed):', err.message);
      });

      // 3. Wait for port 11434 to become available
      const ready = await this.waitForPort(11434, 15000);
      if (!ready) {
        this.serverProcess.kill();
        this.serverProcess = null;
        return {
          running: false,
          model: null,
          availableModels: [],
          error: 'Ollama started but did not become ready within 15 seconds',
        };
      }

      // 4. Re-check status
      return await this.checkStatus();
    } catch (err) {
      return {
        running: false,
        model: null,
        availableModels: [],
        error: `Ollama not installed or failed to start: ${String(err)}`,
      };
    }
  }

  async ensureModel(model: string = DEFAULT_MODEL): Promise<void> {
    // Check if model is already available
    const status = await this.checkStatus();
    if (!status.running) {
      throw new Error('Ollama not running — cannot pull model');
    }

    if (status.availableModels.includes(model)) {
      this.currentModel = model;
      return;
    }

    // Pull the model (long-running — spawn as child process and wait)
    await new Promise<void>((resolve, reject) => {
      const pull = spawn('ollama', ['pull', model], {
        stdio: 'pipe',
      });

      let stderr = '';

      pull.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pull.on('close', (code) => {
        if (code === 0) {
          this.currentModel = model;
          resolve();
        } else {
          reject(new Error(`ollama pull ${model} exited with code ${code}: ${stderr}`));
        }
      });

      pull.on('error', (err) => {
        reject(new Error(`Failed to spawn ollama pull: ${err.message}`));
      });
    });
  }

  async chat(
    prompt: string,
    contextData?: Record<string, unknown>
  ): Promise<string> {
    // Format context as structured text
    let systemContent = SYSTEM_PROMPT;
    if (contextData && Object.keys(contextData).length > 0) {
      systemContent +=
        '\n\nHere is the current admin app data:\n\n' +
        formatContext(contextData);
    }

    const messages: OllamaChatMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: prompt },
    ];

    const response = await this.httpPost<{
      message?: { content: string };
      response?: string;
    }>('/api/chat', {
      model: this.currentModel,
      stream: false,
      messages,
      options: {
        temperature: 0.7,
      },
    });

    return response.message?.content ?? response.response ?? '';
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  private async waitForPort(
    port: number,
    timeoutMs: number
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        await this.httpGet('/api/tags');
        return true;
      } catch {
        await sleep(500);
      }
    }
    return false;
  }

  private httpGet<T>(path: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = http.get(`${OLLAMA_BASE_URL}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(`Failed to parse JSON: ${data.slice(0, 200)}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  private httpPost<T>(path: string, body: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      const req = http.request(
        `${OLLAMA_BASE_URL}${path}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (
              res.statusCode &&
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              try {
                resolve(JSON.parse(data));
              } catch {
                reject(new Error(`Failed to parse JSON: ${data.slice(0, 200)}`));
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.setTimeout(120000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.write(postData);
      req.end();
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatContext(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.projects) {
    parts.push(`## Projects\n${JSON.stringify(data.projects, null, 2)}`);
  }
  if (data.costs) {
    parts.push(`## Costs\n${JSON.stringify(data.costs, null, 2)}`);
  }
  if (data.sentry) {
    parts.push(`## Sentry Errors\n${JSON.stringify(data.sentry, null, 2)}`);
  }
  if (data.uptime) {
    parts.push(`## Uptime\n${JSON.stringify(data.uptime, null, 2)}`);
  }
  if (data.providers) {
    parts.push(`## Providers\n${JSON.stringify(data.providers, null, 2)}`);
  }

  if (parts.length === 0) {
    parts.push(JSON.stringify(data, null, 2));
  }

  return parts.join('\n\n');
}

export const ollamaManager = new OllamaManager();

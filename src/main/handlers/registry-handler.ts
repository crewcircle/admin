import { ipcMain } from 'electron';
import { credentialManager } from '../credential-manager';
import fs from 'fs';
import path from 'path';

interface Project {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  status: 'active' | 'killed';
  created_at: string;
  killed_at?: string;
}

interface Registry {
  projects: Project[];
}

function resolveRegistryPath(): string {
  const configured = credentialManager.get('registry_path');
  if (configured && fs.existsSync(configured)) return configured;

  // Fallback: user data directory
  const userDataPath = path.join(require('electron').app.getPath('userData'), 'registry.json');
  if (fs.existsSync(userDataPath)) return userDataPath;

  return userDataPath; // Return path to create later
}

function readRegistry(): Registry {
  const registryPath = resolveRegistryPath();
  try {
    const raw = fs.readFileSync(registryPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { projects: parsed.projects ?? [] };
  } catch {
    return { projects: [] };
  }
}

export function registerRegistryHandlers(): void {
  ipcMain.handle('registry:getProjects', async () => {
    const registry = readRegistry();
    return registry.projects;
  });

  ipcMain.handle('registry:getProject', async (_event, input: { id: string }) => {
    const registry = readRegistry();
    return registry.projects.find((p) => p.id === input.id) ?? null;
  });
}

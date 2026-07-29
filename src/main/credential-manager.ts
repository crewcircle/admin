import { safeStorage, app } from 'electron';
import path from 'path';
import fs from 'fs';

interface CredentialStore {
  github_token?: string;
  github_username?: string;
  sentry_token?: string;
  sentry_org?: string;
  do_token?: string;
  vercel_token?: string;
  vercel_team_id?: string;
  cloudflare_token?: string;
  doppler_token?: string;
  anthropic_api_key?: string;
  openai_api_key?: string;
  openrouter_api_key?: string;
  local_user_id?: string;
  registry_path?: string;
  [key: string]: string | undefined;
}

class CredentialManager {
  private store: CredentialStore = {};
  private filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'credentials.enc');
  }

  async init(): Promise<boolean> {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('safeStorage not available — credentials stored in plaintext');
      const loaded = this.loadPlaintext();
      this.warnEmptyKeys();
      return loaded;
    }
    const loaded = this.loadEncrypted();
    this.warnEmptyKeys();
    return loaded;
  }

  private warnEmptyKeys(): void {
    const emptyKeys = Object.entries(this.store)
      .filter(([, v]) => v === '')
      .map(([k]) => k);
    if (emptyKeys.length > 0) {
      console.warn(
        `Credential store has empty values for keys: ${emptyKeys.join(', ')}. ` +
        'Re-run the setup wizard to populate them.'
      );
    }
  }

  private loadEncrypted(): boolean {
    try {
      if (!fs.existsSync(this.filePath)) return false;
      const encrypted = fs.readFileSync(this.filePath);
      const decrypted = safeStorage.decryptString(encrypted);
      this.store = JSON.parse(decrypted);
      return Object.keys(this.store).length > 0;
    } catch {
      return false;
    }
  }

  private loadPlaintext(): boolean {
    try {
      const plainPath = this.filePath.replace('.enc', '.json');
      if (!fs.existsSync(plainPath)) return false;
      const raw = fs.readFileSync(plainPath, 'utf-8');
      this.store = JSON.parse(raw);
      return Object.keys(this.store).length > 0;
    } catch {
      return false;
    }
  }

  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.store)) {
      if (value !== undefined) result[key] = value;
    }
    return result;
  }

  get(key: string): string | undefined {
    return this.store[key];
  }

  async set(key: string, value: string): Promise<void> {
    this.store[key] = value;
    await this.persist();
  }

  /** Synchronous variant for use during startup / before async context is available. */
  setSync(key: string, value: string): void {
    this.store[key] = value;
    this.persistSync();
  }

  has(key: string): boolean {
    return this.store[key] !== undefined && this.store[key] !== '';
  }

  hasAll(requiredKeys: string[]): boolean {
    return requiredKeys.every((k) => this.has(k));
  }

  private async persist(): Promise<void> {
    this.persistSync();
  }

  private persistSync(): void {
    const json = JSON.stringify(this.store, null, 2);
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(json);
      fs.writeFileSync(this.filePath, encrypted);
    } else {
      const plainPath = this.filePath.replace('.enc', '.json');
      fs.writeFileSync(plainPath, json);
    }
  }
}

export const credentialManager = new CredentialManager();

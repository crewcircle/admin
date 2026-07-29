import { ipcMain } from 'electron';
import { credentialManager } from './credential-manager';

interface SetupStatus {
  configured: string[];
  remaining: string[];
  isComplete: boolean;
}

const REQUIRED_KEYS = [
  'github_token',
  'github_username',
  'sentry_token',
  'sentry_org',
  'do_token',
  'vercel_token',
  'vercel_team_id',
  'cloudflare_token',
  'doppler_token',
  'anthropic_api_key',
  'openai_api_key',
  'openrouter_api_key',
];

const KEY_LABELS: Record<string, string> = {
  github_token: 'GitHub Token',
  github_username: 'GitHub Username',
  sentry_token: 'Sentry Auth Token',
  sentry_org: 'Sentry Organization Slug',
  do_token: 'DigitalOcean API Token',
  vercel_token: 'Vercel Access Token',
  vercel_team_id: 'Vercel Team ID',
  cloudflare_token: 'Cloudflare API Token',
  doppler_token: 'Doppler Service Token',
  anthropic_api_key: 'Anthropic API Key',
  openai_api_key: 'OpenAI API Key',
  openrouter_api_key: 'OpenRouter API Key',
};

export function registerSetupWizardHandlers(): void {
  ipcMain.handle('setup:getStatus', async () => {
    const configured: string[] = [];
    const remaining: string[] = [];

    for (const key of REQUIRED_KEYS) {
      if (credentialManager.has(key)) {
        configured.push(key);
      } else {
        remaining.push(key);
      }
    }

    return {
      configured,
      remaining,
      isComplete: remaining.length === 0,
    } satisfies SetupStatus;
  });

  ipcMain.handle(
    'setup:saveCredential',
    async (_event, input: { key: string; value: string }) => {
      await credentialManager.set(input.key, input.value);
      return { success: true };
    }
  );

  ipcMain.handle('setup:skipAll', async () => {
    // Set placeholder values so the app can run without credentials
    const placeholders: Record<string, string> = {
      github_token: 'placeholder',
      github_username: 'placeholder',
      sentry_token: 'placeholder',
      sentry_org: 'crewcircle',
      do_token: 'placeholder',
      vercel_token: 'placeholder',
      vercel_team_id: 'placeholder',
      cloudflare_token: 'placeholder',
      doppler_token: 'placeholder',
      anthropic_api_key: 'placeholder',
      openai_api_key: 'placeholder',
      openrouter_api_key: 'placeholder',
    };

    for (const [key, value] of Object.entries(placeholders)) {
      await credentialManager.set(key, value);
    }

    return { success: true };
  });

  ipcMain.handle('setup:getKeyLabels', async () => {
    return KEY_LABELS;
  });
}

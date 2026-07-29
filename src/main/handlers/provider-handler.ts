import { ipcMain } from 'electron';
import { credentialManager } from '../credential-manager';

export function registerProviderHandlers(): void {
  // DigitalOcean balance
  ipcMain.handle('providers:doBalance', async () => {
    const token = credentialManager.get('do_token');
    if (!token || token === 'placeholder') {
      return { balance: null, error: 'No DigitalOcean token configured' };
    }
    try {
      const res = await fetch(
        'https://api.digitalocean.com/v2/customers/my/balance',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return { balance: null, error: `HTTP ${res.status}` };
      const data = await res.json();
      return { balance: data, error: null };
    } catch (err) {
      return { balance: null, error: String(err) };
    }
  });

  // Vercel usage
  ipcMain.handle('providers:vercelUsage', async () => {
    const token = credentialManager.get('vercel_token');
    const teamId = credentialManager.get('vercel_team_id');
    if (!token || token === 'placeholder') {
      return { usage: null, error: 'No Vercel token configured' };
    }
    try {
      const params = teamId ? `?teamId=${teamId}` : '';
      const res = await fetch(`https://api.vercel.com/v2/usage${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { usage: null, error: `HTTP ${res.status}` };
      const data = await res.json();
      return { usage: data, error: null };
    } catch (err) {
      return { usage: null, error: String(err) };
    }
  });

  // Anthropic usage (stub — no public usage API)
  ipcMain.handle('providers:anthropicUsage', async () => {
    return {
      usage: null,
      error: 'Anthropic usage API not yet available — use console.anthropic.com',
    };
  });
}

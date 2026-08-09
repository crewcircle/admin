import { ipcMain } from 'electron';
import { credentialManager } from './credential-manager';
import { registerRegistryHandlers } from './handlers/registry-handler';
import { registerGithubHandlers } from './handlers/github-handler';
import { registerCostsHandlers } from './handlers/costs-handler';
import { registerSentryHandlers } from './handlers/sentry-handler';
import { registerUptimeHandlers } from './handlers/uptime-handler';
import { registerProviderHandlers } from './handlers/provider-handler';
import { registerProvisionHandlers } from './handlers/provision-handler';
import { registerCIScaffoldHandlers } from './handlers/ci-scaffold-handler';
import { registerOllamaQueryHandlers } from './handlers/ollama-query-handler';
import { registerSocialHandlers } from './handlers/social-handler';
import { registerInsightsHandlers } from './handlers/insights-handler';
import { statusService } from './services/status-service';
import { registerSetupWizardHandlers } from './setup-wizard';
import { registerSaaSHandlers } from './browser-view-manager';

export function registerIpcHandlers(): void {
  // Domain handlers
  registerRegistryHandlers();
  registerGithubHandlers();
  registerCostsHandlers();
  registerSentryHandlers();
  registerUptimeHandlers();
  registerProviderHandlers();
  registerProvisionHandlers();
  registerCIScaffoldHandlers();
  registerOllamaQueryHandlers();
  registerSocialHandlers();
  registerInsightsHandlers();
  statusService.registerIpc();

  // Credential management
  ipcMain.handle('credentials:getAll', async () => {
    return credentialManager.getAll();
  });

  ipcMain.handle(
    'credentials:set',
    async (_event, input: { key: string; value: string }) => {
      await credentialManager.set(input.key, input.value);
    }
  );

  ipcMain.handle(
    'credentials:hasAll',
    async (_event, input: string[]) => {
      return credentialManager.hasAll(input);
    }
  );

  // Setup wizard
  registerSetupWizardHandlers();

  // SaaS BrowserViews
  registerSaaSHandlers();
}

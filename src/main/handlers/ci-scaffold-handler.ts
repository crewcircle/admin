import { ipcMain } from 'electron';
import { credentialManager } from '../credential-manager';

export function registerCIScaffoldHandlers(): void {
  ipcMain.handle(
    'ci-scaffold:pushWorkflow',
    async (_event, input: { repo: string }) => {
      const token = credentialManager.get('github_token');
      if (!token || token === 'placeholder') {
        return { success: false, error: 'No GitHub token configured' };
      }

      // Stub: actual CI template pushing is a future feature
      // In the v1 app, ci-scaffold.ts pushes a workflow file to a repo via GitHub API.
      // For v2 Electron, this is deferred until the provision script execution is wired.
      console.log(`ci-scaffold:pushWorkflow requested for ${input.repo} — stub, not executing`);
      return {
        success: false,
        error: 'CI scaffold execution not yet implemented in Electron admin',
      };
    }
  );
}

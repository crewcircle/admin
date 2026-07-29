import { ipcMain } from 'electron';
import { getDB } from '../db/database';
import { getLocalUserId } from '../local-user';

function generateJobId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ProvisionConfig {
  projectId: string;
  name?: string;
  description?: string;
  priceCents?: number;
}

export function registerProvisionHandlers(): void {
  ipcMain.handle(
    'provision:startJob',
    async (_event, input: ProvisionConfig) => {
      const db = getDB();
      const jobId = generateJobId();
      const userId = getLocalUserId();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO provisioning_jobs (id, project_id, job_type, status, created_by, config, created_at)
         VALUES (?, ?, 'provision', 'pending', ?, ?, ?)`
      ).run(jobId, input.projectId, userId, JSON.stringify(input), now);

      return { jobId };
    }
  );

  ipcMain.handle(
    'provision:startDeprovision',
    async (_event, input: { projectId: string }) => {
      const db = getDB();
      const jobId = generateJobId();
      const userId = getLocalUserId();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO provisioning_jobs (id, project_id, job_type, status, created_by, config, created_at)
         VALUES (?, ?, 'deprovision', 'pending', ?, ?, ?)`
      ).run(jobId, input.projectId, userId, JSON.stringify(input), now);

      return { jobId };
    }
  );

  ipcMain.handle(
    'provision:getJobStatus',
    async (_event, input: { jobId: string }) => {
      const db = getDB();
      const job = db
        .prepare(`SELECT * FROM provisioning_jobs WHERE id = ?`)
        .get(input.jobId) as Record<string, unknown> | undefined;

      return job ?? null;
    }
  );
}

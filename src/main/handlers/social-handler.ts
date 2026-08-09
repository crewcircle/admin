import { ipcMain } from 'electron';
import { getDB } from '../db/database';
import type { SocialCampaign } from '../db/types';

const PLATFORMS = [
  'linkedin',
  'twitter',
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'other',
] as const;

const STATUSES = ['draft', 'active', 'paused', 'ended'] as const;

interface CreateCampaignInput {
  name: string;
  platform?: string;
  status?: string;
  budget_cents?: number;
  currency?: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

interface UpdateCampaignInput {
  id: number;
  name?: string;
  platform?: string;
  status?: string;
  budget_cents?: number;
  spend_cents?: number;
  start_date?: string | null;
  end_date?: string | null;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  notes?: string | null;
}

function validPlatform(p: string): p is SocialCampaign['platform'] {
  return (PLATFORMS as readonly string[]).includes(p);
}

function validStatus(s: string): s is SocialCampaign['status'] {
  return (STATUSES as readonly string[]).includes(s);
}

export function registerSocialHandlers(): void {
  ipcMain.handle('social:list', async () => {
    const db = getDB();
    return db
      .prepare(`SELECT * FROM social_campaigns ORDER BY updated_at DESC`)
      .all() as SocialCampaign[];
  });

  ipcMain.handle(
    'social:create',
    async (_event, input: CreateCampaignInput) => {
      if (!input?.name?.trim()) {
        throw new Error('Campaign name is required');
      }
      const db = getDB();
      const platform =
        input.platform && validPlatform(input.platform) ? input.platform : 'other';
      const status =
        input.status && validStatus(input.status) ? input.status : 'draft';

      const result = db
        .prepare(
          `INSERT INTO social_campaigns
             (name, platform, status, budget_cents, currency, start_date, end_date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.name.trim(),
          platform,
          status,
          Math.max(0, Math.round(input.budget_cents ?? 0)),
          input.currency || 'AUD',
          input.start_date ?? null,
          input.end_date ?? null,
          input.notes ?? null
        );

      return db
        .prepare(`SELECT * FROM social_campaigns WHERE id = ?`)
        .get(result.lastInsertRowid) as SocialCampaign;
    }
  );

  ipcMain.handle(
    'social:update',
    async (_event, input: UpdateCampaignInput) => {
      if (!input?.id) {
        throw new Error('Campaign id is required');
      }
      const db = getDB();
      const existing = db
        .prepare(`SELECT * FROM social_campaigns WHERE id = ?`)
        .get(input.id) as SocialCampaign | undefined;
      if (!existing) {
        throw new Error(`Campaign ${input.id} not found`);
      }

      const merged: SocialCampaign = {
        ...existing,
        name: input.name?.trim() || existing.name,
        platform:
          input.platform && validPlatform(input.platform)
            ? input.platform
            : existing.platform,
        status:
          input.status && validStatus(input.status)
            ? input.status
            : existing.status,
        budget_cents:
          input.budget_cents !== undefined
            ? Math.max(0, Math.round(input.budget_cents))
            : existing.budget_cents,
        spend_cents:
          input.spend_cents !== undefined
            ? Math.max(0, Math.round(input.spend_cents))
            : existing.spend_cents,
        start_date:
          input.start_date !== undefined ? input.start_date : existing.start_date,
        end_date: input.end_date !== undefined ? input.end_date : existing.end_date,
        impressions:
          input.impressions !== undefined
            ? Math.max(0, Math.round(input.impressions))
            : existing.impressions,
        clicks:
          input.clicks !== undefined
            ? Math.max(0, Math.round(input.clicks))
            : existing.clicks,
        conversions:
          input.conversions !== undefined
            ? Math.max(0, Math.round(input.conversions))
            : existing.conversions,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      };

      db.prepare(
        `UPDATE social_campaigns SET
           name = ?, platform = ?, status = ?, budget_cents = ?, spend_cents = ?,
           start_date = ?, end_date = ?, impressions = ?, clicks = ?,
           conversions = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(
        merged.name,
        merged.platform,
        merged.status,
        merged.budget_cents,
        merged.spend_cents,
        merged.start_date,
        merged.end_date,
        merged.impressions,
        merged.clicks,
        merged.conversions,
        merged.notes,
        input.id
      );

      return db
        .prepare(`SELECT * FROM social_campaigns WHERE id = ?`)
        .get(input.id) as SocialCampaign;
    }
  );

  ipcMain.handle('social:delete', async (_event, input: { id: number }) => {
    if (!input?.id) {
      throw new Error('Campaign id is required');
    }
    const db = getDB();
    db.prepare(`DELETE FROM social_campaigns WHERE id = ?`).run(input.id);
    return { success: true };
  });
}

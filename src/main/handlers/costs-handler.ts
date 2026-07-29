import { ipcMain } from 'electron';
import { getDB } from '../db/database';
import type {
  LLMCostSummary,
  FixedCostSummary,
  FixedCost,
  CostDashboardData,
} from '../db/types';

function getLLMSummary(days: number): LLMCostSummary {
  const db = getDB();
  const since = new Date();
  since.setDate(since.getDate() - days);
  // Format as SQLite-compatible datetime for correct string comparison:
  // ISO "2026-07-29T00:00:00.000Z" vs SQLite "2026-07-29 12:34:56"
  // differ in sort order (space=0x20, T=0x54), so normalise to SQL format.
  const sinceStr = since.toISOString().replace('T', ' ').slice(0, 19);

  const rows = db
    .prepare(
      `SELECT * FROM llm_usage_logs WHERE recorded_at >= ? ORDER BY recorded_at DESC`
    )
    .all(sinceStr) as Array<{
      model: string;
      app: string;
      cost_usd: number | null;
      recorded_at: string;
    }>;

  const total_usd = rows.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);

  // By model
  const modelMap = new Map<string, { cost_usd: number; calls: number }>();
  for (const r of rows) {
    const entry = modelMap.get(r.model) ?? { cost_usd: 0, calls: 0 };
    entry.cost_usd += r.cost_usd ?? 0;
    entry.calls += 1;
    modelMap.set(r.model, entry);
  }

  // By app
  const appMap = new Map<string, { cost_usd: number; calls: number }>();
  for (const r of rows) {
    const app = r.app || 'unknown';
    const entry = appMap.get(app) ?? { cost_usd: 0, calls: 0 };
    entry.cost_usd += r.cost_usd ?? 0;
    entry.calls += 1;
    appMap.set(app, entry);
  }

  // Daily
  const dailyMap = new Map<string, number>();
  for (const r of rows) {
    const date = r.recorded_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + (r.cost_usd ?? 0));
  }

  const now = new Date();
  const daily: { date: string; cost_usd: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({ date: key, cost_usd: dailyMap.get(key) ?? 0 });
  }

  return {
    total_usd,
    by_model: Array.from(modelMap.entries()).map(([model, v]) => ({
      model,
      cost_usd: v.cost_usd,
      calls: v.calls,
    })),
    by_app: Array.from(appMap.entries()).map(([app, v]) => ({
      app,
      cost_usd: v.cost_usd,
      calls: v.calls,
    })),
    daily,
  };
}

function getFixedSummary(): FixedCostSummary {
  const db = getDB();
  const rows = db
    .prepare(`SELECT * FROM fixed_costs WHERE active = 1`)
    .all() as FixedCost[];

  let total_monthly_aud = 0;
  const categories = new Map<string, number>();

  for (const f of rows) {
    let monthlyAmount = f.amount_cents / 100;
    if (f.frequency === 'annual') monthlyAmount /= 12;
    if (f.frequency === 'one_time') monthlyAmount = 0;

    // Approximate USD→AUD conversion if needed
    const audAmount =
      f.currency === 'USD' ? monthlyAmount * 1.5 : monthlyAmount;

    total_monthly_aud += audAmount;
    const existing = categories.get(f.category) ?? 0;
    categories.set(f.category, existing + audAmount);
  }

  return {
    total_monthly_aud,
    by_category: Array.from(categories.entries()).map(([category, total_aud]) => ({
      category,
      total_aud,
    })),
  };
}

export function registerCostsHandlers(): void {
  ipcMain.handle(
    'costs:getDashboard',
    async (_event, input?: { days?: number }) => {
      const days = input?.days ?? 30;
      const llm = getLLMSummary(days);
      const fixed = getFixedSummary();

      const db = getDB();
      const fixedItems = db
        .prepare(`SELECT * FROM fixed_costs WHERE active = 1 ORDER BY category, name`)
        .all() as FixedCost[];

      return {
        llm,
        fixed,
        fixed_items: fixedItems,
        summary: {
          total_monthly_aud_estimate:
            fixed.total_monthly_aud + (llm.total_usd * 1.5),
          llm_monthly_usd: llm.total_usd,
          fixed_monthly_aud: fixed.total_monthly_aud,
        },
      } satisfies CostDashboardData;
    }
  );

  ipcMain.handle(
    'costs:getLLMSummary',
    async (_event, input?: { days?: number }) => {
      return getLLMSummary(input?.days ?? 30);
    }
  );

  ipcMain.handle('costs:getFixedSummary', async () => {
    return getFixedSummary();
  });
}

/**
 * Seed script for the CrewCircle Admin Electron app.
 * Populates the local SQLite database (admin.db) with sample data.
 *
 * Usage: npx ts-node scripts/seed-data.ts
 *   or:   npm run seed
 *
 * The database file is created in the current directory unless
 * CREWCIRCLE_DATA_DIR env var is set.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const DATA_DIR = process.env.CREWCIRCLE_DATA_DIR || process.cwd();
const DB_PATH = path.join(DATA_DIR, 'admin.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create schema if not exists
const schemaPath = path.join(__dirname, '..', 'src', 'main', 'db', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  db.exec(fs.readFileSync(schemaPath, 'utf-8'));
} else {
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app TEXT, feature TEXT, model TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0,
      cost_usd REAL, recorded_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS fixed_costs (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      category TEXT DEFAULT 'infrastructure',
      amount_cents INTEGER NOT NULL, currency TEXT DEFAULT 'AUD',
      frequency TEXT DEFAULT 'monthly',
      provider TEXT, notes TEXT, active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// Clear existing data
db.exec('DELETE FROM llm_usage_logs');
db.exec('DELETE FROM fixed_costs');

// Seed LLM usage logs (last 30 days)
const insertLog = db.prepare(
  `INSERT INTO llm_usage_logs (app, feature, model, input_tokens, output_tokens, cost_usd, recorded_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const apps = ['smartGL', 'taxflow-ai', 'localmate', 'AUrate', 'CardSnap', 'crewRoster'];
const models: Array<{ name: string; inputPrice: number; outputPrice: number }> = [
  { name: 'claude-sonnet-4-20250514', inputPrice: 3.0, outputPrice: 15.0 },
  { name: 'claude-haiku-3-5', inputPrice: 0.8, outputPrice: 4.0 },
  { name: 'gpt-4o', inputPrice: 2.5, outputPrice: 10.0 },
];

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const insertMany = db.transaction(() => {
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(now - daysAgo * dayMs);
    const entriesToday = 3 + Math.floor(Math.random() * 15); // 3-17 entries per day

    for (let e = 0; e < entriesToday; e++) {
      const app = apps[Math.floor(Math.random() * apps.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const inputTokens = 200 + Math.floor(Math.random() * 5000);
      const outputTokens = 50 + Math.floor(Math.random() * 2000);
      const costUsd =
        (inputTokens / 1_000_000) * model.inputPrice +
        (outputTokens / 1_000_000) * model.outputPrice;

      const hour = 8 + Math.floor(Math.random() * 14);
      const minute = Math.floor(Math.random() * 60);
      date.setHours(hour, minute, 0, 0);

      insertLog.run(
        app,
        'chat',
        model.name,
        inputTokens,
        outputTokens,
        Math.round(costUsd * 10000) / 10000, // Round to 4 decimals
        date.toISOString()
      );
    }
  }
});

insertMany();
console.log(`Seeded ${db.prepare('SELECT COUNT(*) as c FROM llm_usage_logs').get()} LLM usage logs`);

// Seed fixed costs
const insertFixed = db.prepare(
  `INSERT INTO fixed_costs (id, name, category, amount_cents, currency, frequency, provider, notes, active)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
);

const fixedCostsSeed = [
  { name: 'DO Droplet', category: 'infrastructure', amount_cents: 4800, currency: 'USD', frequency: 'monthly', provider: 'DigitalOcean', notes: 'Primary compute droplet' },
  { name: 'Vercel Pro', category: 'infrastructure', amount_cents: 2000, currency: 'USD', frequency: 'monthly', provider: 'Vercel', notes: 'Frontend hosting' },
  { name: 'Supabase Pro', category: 'infrastructure', amount_cents: 2500, currency: 'USD', frequency: 'monthly', provider: 'Supabase', notes: 'Managed Postgres + Auth' },
  { name: 'Doppler', category: 'saas', amount_cents: 500, currency: 'USD', frequency: 'monthly', provider: 'Doppler', notes: 'Secret management' },
  { name: 'Sentry Team', category: 'saas', amount_cents: 2600, currency: 'USD', frequency: 'monthly', provider: 'Sentry', notes: 'Error monitoring' },
  { name: 'Cloudflare Domains', category: 'infrastructure', amount_cents: 1500, currency: 'USD', frequency: 'annual', provider: 'Cloudflare', notes: 'Domain registration + DNS' },
  { name: 'Anthropic API', category: 'saas', amount_cents: 0, currency: 'USD', frequency: 'monthly', provider: 'Anthropic', notes: 'Pay-as-you-go; tracked separately' },
];

for (const item of fixedCostsSeed) {
  insertFixed.run(
    randomUUID(),
    item.name,
    item.category,
    item.amount_cents,
    item.currency,
    item.frequency,
    item.provider,
    item.notes
  );
}

console.log(`Seeded ${fixedCostsSeed.length} fixed costs`);
console.log(`Database seeded at: ${DB_PATH}`);

db.close();

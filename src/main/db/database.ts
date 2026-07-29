import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'admin.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const fallbackSchemaPath = path.join(app.getAppPath(), 'src/main/db/schema.sql');

  let schemaSQL: string;
  if (fs.existsSync(schemaPath)) {
    schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
  } else if (fs.existsSync(fallbackSchemaPath)) {
    schemaSQL = fs.readFileSync(fallbackSchemaPath, 'utf-8');
  } else {
    // Inline schema as fallback for packaged app
    schemaSQL = `
      CREATE TABLE IF NOT EXISTS llm_usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app TEXT, feature TEXT, model TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0,
        cost_usd REAL, recorded_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_app ON llm_usage_logs(app);
      CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_model ON llm_usage_logs(model);
      CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_recorded_at ON llm_usage_logs(recorded_at);

      CREATE TABLE IF NOT EXISTS fixed_costs (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        category TEXT DEFAULT 'infrastructure' CHECK(category IN ('infrastructure','saas','personnel','other')),
        amount_cents INTEGER NOT NULL, currency TEXT DEFAULT 'AUD',
        frequency TEXT DEFAULT 'monthly' CHECK(frequency IN ('monthly','annual','one_time')),
        provider TEXT, notes TEXT, active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_fixed_costs_category ON fixed_costs(category);
      CREATE INDEX IF NOT EXISTS idx_fixed_costs_active ON fixed_costs(active);

      CREATE TABLE IF NOT EXISTS provisioning_jobs (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL,
        job_type TEXT NOT NULL CHECK(job_type IN ('provision','deprovision')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed')),
        created_by TEXT, started_at TEXT, completed_at TEXT,
        output_log TEXT DEFAULT '', error_message TEXT,
        config TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_project_id ON provisioning_jobs(project_id);
      CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_status ON provisioning_jobs(status);
    `;
  }

  db.exec(schemaSQL);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

-- CrewCircle Admin App — Local SQLite Schema
-- Mirrors v1 Supabase tables, adapted for SQLite

CREATE TABLE IF NOT EXISTS llm_usage_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    app             TEXT,
    feature         TEXT,
    model           TEXT NOT NULL,
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    cost_usd        REAL,
    recorded_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_app ON llm_usage_logs (app);
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_model ON llm_usage_logs (model);
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_recorded_at ON llm_usage_logs (recorded_at);

CREATE TABLE IF NOT EXISTS fixed_costs (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'infrastructure'
                    CHECK (category IN ('infrastructure', 'saas', 'personnel', 'other')),
    amount_cents    INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'AUD',
    frequency       TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (frequency IN ('monthly', 'annual', 'one_time')),
    provider        TEXT,
    notes           TEXT,
    active          INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fixed_costs_category ON fixed_costs (category);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_active ON fixed_costs (active);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_provider ON fixed_costs (provider);

CREATE TABLE IF NOT EXISTS provisioning_jobs (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL,
    job_type        TEXT NOT NULL CHECK (job_type IN ('provision', 'deprovision')),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_by      TEXT,
    started_at      TEXT,
    completed_at    TEXT,
    output_log      TEXT DEFAULT '',
    error_message   TEXT,
    config          TEXT NOT NULL DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_project_id ON provisioning_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_status ON provisioning_jobs (status);
CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_created_at ON provisioning_jobs (created_at);

CREATE TABLE IF NOT EXISTS social_campaigns (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    platform        TEXT NOT NULL DEFAULT 'other'
                    CHECK (platform IN ('linkedin', 'twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'other')),
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'ended')),
    budget_cents    INTEGER NOT NULL DEFAULT 0,
    spend_cents     INTEGER NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'AUD',
    start_date      TEXT,
    end_date        TEXT,
    impressions     INTEGER NOT NULL DEFAULT 0,
    clicks          INTEGER NOT NULL DEFAULT 0,
    conversions     INTEGER NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_status ON social_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_platform ON social_campaigns (platform);

CREATE TABLE IF NOT EXISTS insights (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source          TEXT NOT NULL DEFAULT 'manual',
    input_excerpt   TEXT NOT NULL DEFAULT '',
    summary         TEXT NOT NULL DEFAULT '',
    issues          TEXT NOT NULL DEFAULT '[]',
    suggestions     TEXT NOT NULL DEFAULT '[]',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights (created_at);

// Shared types mirroring src/main/db/types.ts and handler responses

export interface Project {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  status: 'active' | 'killed';
  created_at: string;
  killed_at?: string;
}

export interface GitHubRepo {
  stars: number;
  forks: number;
  open_issues: number;
  default_branch: string;
  last_push: string;
  language: string;
}

export interface LLMByModel {
  model: string;
  cost_usd: number;
  calls: number;
}

export interface LLMByApp {
  app: string;
  cost_usd: number;
  calls: number;
}

export interface LLMDaily {
  date: string;
  cost_usd: number;
}

export interface LLMCostSummary {
  total_usd: number;
  by_model: LLMByModel[];
  by_app: LLMByApp[];
  daily: LLMDaily[];
}

export interface FixedCostByCategory {
  category: string;
  total_aud: number;
}

export interface FixedCostSummary {
  total_monthly_aud: number;
  by_category: FixedCostByCategory[];
}

export interface FixedCost {
  id: string;
  name: string;
  category: string;
  amount_cents: number;
  currency: string;
  frequency: string;
  provider: string | null;
  notes: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface CostDashboardData {
  llm: LLMCostSummary;
  fixed: FixedCostSummary;
  fixed_items: FixedCost[];
  summary: {
    total_monthly_aud_estimate: number;
    llm_monthly_usd: number;
    fixed_monthly_aud: number;
  };
}

export interface SentryAggregate {
  total_unresolved: number;
  total_24h: number;
  total_7d: number;
  by_project: { project: string; count: number }[];
  recent_issues: {
    title: string;
    project: string;
    level: string;
    first_seen: string;
    last_seen: string;
    count: string;
    permalink: string;
  }[];
}

export interface UptimeResult {
  url: string;
  status: number | null;
  latency_ms: number;
  ok: boolean;
}

export interface UptimeCheckResults {
  results: UptimeResult[];
}

export interface OllamaStatus {
  running: boolean;
  model: string | null;
  availableModels: string[];
  error?: string;
}

export interface ProvisioningJob {
  id: string;
  project_id: string;
  job_type: string;
  status: string;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  output_log: string;
  error_message: string | null;
  config: string;
  created_at: string;
}

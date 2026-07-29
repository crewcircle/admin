export interface LLMUsageLog {
  id: number;
  app: string | null;
  feature: string | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  recorded_at: string;
}

export interface FixedCost {
  id: string;
  name: string;
  category: 'infrastructure' | 'saas' | 'personnel' | 'other';
  amount_cents: number;
  currency: string;
  frequency: 'monthly' | 'annual' | 'one_time';
  provider: string | null;
  notes: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface ProvisioningJob {
  id: string;
  project_id: string;
  job_type: 'provision' | 'deprovision';
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  output_log: string;
  error_message: string | null;
  config: string;
  created_at: string;
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

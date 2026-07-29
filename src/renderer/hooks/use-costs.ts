import { useIpcData } from './use-ipc';
import type { CostDashboardData, LLMCostSummary, FixedCostSummary } from './types';

export function useCostDashboard(days = 30) {
  return useIpcData<CostDashboardData>('costs:getDashboard', { days });
}

export function useLLMSummary(days = 30) {
  return useIpcData<LLMCostSummary>('costs:getLLMSummary', { days });
}

export function useFixedSummary() {
  return useIpcData<FixedCostSummary>('costs:getFixedSummary');
}

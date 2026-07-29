import { useCostDashboard } from '../../hooks/use-costs';
import type { FixedCost } from '../../hooks/types';
import { ErrorBanner } from '../shared/error-banner';

export function CostsPage() {
  const { data, loading, error } = useCostDashboard();

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#e4e4ed] mb-6">Costs</h1>
        <p className="text-[#8888a0]">Loading...</p>
      </div>
    );
  }

  const llm = data?.llm;
  const fixed = data?.fixed;
  const fixedItems = data?.fixed_items ?? [];
  const summary = data?.summary;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#e4e4ed]">Costs</h1>

      {error && <ErrorBanner message={error} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <CostCard
          label="Total Monthly (est. AUD)"
          value={`A$${(summary?.total_monthly_aud_estimate ?? 0).toFixed(0)}`}
          color="text-[#f59e0b]"
        />
        <CostCard
          label="LLM Spend (30d USD)"
          value={`$${(llm?.total_usd ?? 0).toFixed(2)}`}
          color="text-[#6366f1]"
        />
        <CostCard
          label="Fixed Costs (monthly AUD)"
          value={`A$${(fixed?.total_monthly_aud ?? 0).toFixed(0)}`}
          color="text-[#22c55e]"
        />
      </div>

      {/* LLM Costs — By Model */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          LLM Costs by Model (30d)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
              <th className="pb-2 font-medium">Model</th>
              <th className="pb-2 font-medium text-right">Calls</th>
              <th className="pb-2 font-medium text-right">Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {(llm?.by_model ?? []).map((m) => (
              <tr key={m.model} className="border-b border-[#1a1a24]">
                <td className="py-2 text-[#e4e4ed]">{m.model}</td>
                <td className="py-2 text-[#e4e4ed] text-right">{m.calls}</td>
                <td className="py-2 text-[#e4e4ed] text-right">${m.cost_usd.toFixed(4)}</td>
              </tr>
            ))}
            {(!llm?.by_model || llm.by_model.length === 0) && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-[#8888a0]">
                  No LLM usage data yet. Seed the database to populate this table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LLM Costs — By App */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          LLM Costs by App (30d)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
              <th className="pb-2 font-medium">App</th>
              <th className="pb-2 font-medium text-right">Calls</th>
              <th className="pb-2 font-medium text-right">Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            {(llm?.by_app ?? []).map((a) => (
              <tr key={a.app} className="border-b border-[#1a1a24]">
                <td className="py-2 text-[#e4e4ed]">{a.app}</td>
                <td className="py-2 text-[#e4e4ed] text-right">{a.calls}</td>
                <td className="py-2 text-[#e4e4ed] text-right">${a.cost_usd.toFixed(4)}</td>
              </tr>
            ))}
            {(!llm?.by_app || llm.by_app.length === 0) && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-[#8888a0]">
                  No per-app data. Seed llm_usage_logs with app values to see the breakdown.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LLM Daily Trend */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          LLM Cost Trend (Daily)
        </h2>
        <div className="flex items-end gap-1 h-32">
          {llm?.daily.map((d) => {
            const maxVal = Math.max(...llm.daily.map((x) => x.cost_usd), 1);
            const height = `${(d.cost_usd / maxVal) * 100}%`;
            return (
              <div
                key={d.date}
                className="flex-1 relative group"
                style={{ height }}
              >
                <div className="absolute inset-x-0 bottom-0 bg-[#6366f1] rounded-t-sm min-h-[2px]" style={{ height }} />
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1a1a24] text-[#e4e4ed] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.date}: ${d.cost_usd.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Costs */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          Fixed Costs
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium text-right">Amount</th>
              <th className="pb-2 font-medium">Frequency</th>
              <th className="pb-2 font-medium">Provider</th>
            </tr>
          </thead>
          <tbody>
            {fixedItems.map((item: FixedCost) => (
              <tr key={item.id} className="border-b border-[#1a1a24]">
                <td className="py-2 text-[#e4e4ed]">{item.name}</td>
                <td className="py-2 text-[#8888a0]">{item.category}</td>
                <td className="py-2 text-[#e4e4ed] text-right">
                  {item.currency} ${(item.amount_cents / 100).toFixed(2)}
                </td>
                <td className="py-2 text-[#8888a0]">{item.frequency}</td>
                <td className="py-2 text-[#8888a0]">{item.provider ?? '—'}</td>
              </tr>
            ))}
            {fixedItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-[#8888a0]">
                  No active fixed costs. Seed the database to populate this table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CostCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
      <p className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

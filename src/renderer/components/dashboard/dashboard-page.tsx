import { useProjects } from '../../hooks/use-projects';
import { useCostDashboard } from '../../hooks/use-costs';
import { useSentry } from '../../hooks/use-observability';
import { ErrorBanner } from '../shared/error-banner';
import { StatCard } from '../shared/stat-card';

export function DashboardPage() {
  const { data: projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { data: costs, loading: costsLoading, error: costsError } = useCostDashboard();
  const { data: sentry, loading: sentryLoading, error: sentryError } = useSentry();

  const hasError = projectsError || costsError || sentryError;

  const activeCount = projects?.filter((p) => p.status === 'active').length ?? 0;
  const killedCount = projects?.filter((p) => p.status === 'killed').length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#e4e4ed]">Dashboard</h1>

      {hasError && (
        <ErrorBanner
          message={
            projectsError || costsError || sentryError || 'Failed to load dashboard data'
          }
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={projectsLoading ? '—' : String(activeCount)}
          color="text-[#22c55e]"
          size="lg"
        />
        <StatCard
          label="Archived"
          value={projectsLoading ? '—' : String(killedCount)}
          color="text-[#8888a0]"
          size="lg"
        />
        <StatCard
          label="Monthly Cost (est. AUD)"
          value={costsLoading ? '—' : `A$${(costs?.summary.total_monthly_aud_estimate ?? 0).toFixed(0)}`}
          color="text-[#f59e0b]"
          size="lg"
        />
        <StatCard
          label="Sentry Unresolved"
          value={sentryLoading ? '—' : String(sentry?.total_unresolved ?? 0)}
          color="text-[#ef4444]"
          size="lg"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-sm text-[#8888a0] mb-2">LLM Spend (30d)</h3>
          <p className="text-2xl font-semibold text-[#e4e4ed]">
            {costsLoading ? '—' : `$${(costs?.llm.total_usd ?? 0).toFixed(2)} USD`}
          </p>
        </div>
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-sm text-[#8888a0] mb-2">Fixed Costs (monthly)</h3>
          <p className="text-2xl font-semibold text-[#e4e4ed]">
            {costsLoading ? '—' : `A$${(costs?.fixed.total_monthly_aud ?? 0).toFixed(0)}`}
          </p>
        </div>
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-sm text-[#8888a0] mb-2">Sentry (last 24h)</h3>
          <p className="text-2xl font-semibold text-[#e4e4ed]">
            {sentryLoading ? '—' : String(sentry?.total_24h ?? 0)}
          </p>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">Projects</h2>
        {projectsLoading ? (
          <p className="text-sm text-[#8888a0]">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(projects ?? []).map((p) => (
                <tr key={p.id} className="border-b border-[#1a1a24] hover:bg-[#1a1a24]">
                  <td className="py-2 text-[#e4e4ed]">{p.name}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        p.status === 'active'
                          ? 'bg-[#22c55e]/20 text-[#22c55e]'
                          : 'bg-[#8888a0]/20 text-[#8888a0]'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 text-[#e4e4ed]">
                    ${((p.price_cents ?? 0) / 100).toFixed(2)}
                  </td>
                  <td className="py-2 text-[#8888a0]">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {(!projects || projects.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-[#8888a0]">
                    No projects found. Add a registry.json to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// StatCard is imported from ../shared/stat-card.tsx

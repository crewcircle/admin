import { useSentry, useUptime } from '../../hooks/use-observability';
import { useLLMSummary } from '../../hooks/use-costs';
import { useState } from 'react';
import { ErrorBanner } from '../shared/error-banner';

export function ObservabilityPage() {
  const { data: sentry, loading: sentryLoading, error: sentryError } = useSentry();
  const { data: uptime, loading: uptimeLoading, error: uptimeError } = useUptime();
  const { data: llm, loading: llmLoading, error: llmError } = useLLMSummary(30);

  const hasError = sentryError || uptimeError || llmError;
  const [selectedApp, setSelectedApp] = useState<string>('all');

  const apps = llm?.by_app ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#e4e4ed]">Observability</h1>

      {hasError && (
        <ErrorBanner
          message={sentryError || uptimeError || llmError || 'Failed to load observability data'}
        />
      )}

      {/* Sentry Section */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          Sentry Issues
        </h2>
        {sentryLoading ? (
          <p className="text-[#8888a0] text-sm">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <StatBadge label="Unresolved" value={sentry?.total_unresolved ?? 0} color="text-[#ef4444]" />
              <StatBadge label="Last 24h" value={sentry?.total_24h ?? 0} color="text-[#f59e0b]" />
              <StatBadge label="Last 7d" value={sentry?.total_7d ?? 0} color="text-[#f59e0b]" />
            </div>

            {/* By project */}
            {(sentry?.by_project?.length ?? 0) > 0 && (
              <div className="mb-4">
                <h3 className="text-xs text-[#8888a0] mb-2 uppercase tracking-wider">By Project</h3>
                <div className="flex flex-wrap gap-2">
                  {sentry!.by_project.map((p) => (
                    <span
                      key={p.project}
                      className="px-2 py-1 bg-[#1a1a24] rounded text-sm text-[#e4e4ed]"
                    >
                      {p.project}: {p.count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent issues */}
            {(sentry?.recent_issues?.length ?? 0) > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Project</th>
                    <th className="pb-2 font-medium">Level</th>
                    <th className="pb-2 font-medium">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {sentry!.recent_issues.slice(0, 20).map((issue, i) => (
                    <tr key={i} className="border-b border-[#1a1a24]">
                      <td className="py-2 text-[#e4e4ed] max-w-xs truncate">
                        {issue.title}
                      </td>
                      <td className="py-2 text-[#8888a0]">{issue.project}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            issue.level === 'error'
                              ? 'bg-[#ef4444]/20 text-[#ef4444]'
                              : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          }`}
                        >
                          {issue.level}
                        </span>
                      </td>
                      <td className="py-2 text-[#8888a0]">{issue.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* LLM Usage Trends */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          LLM Usage Trends (30d)
        </h2>
        {llmLoading ? (
          <p className="text-[#8888a0] text-sm">Loading...</p>
        ) : (
          <>
            {/* App selector */}
            {apps.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSelectedApp('all')}
                  className={`px-3 py-1 text-xs rounded ${
                    selectedApp === 'all'
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#1a1a24] text-[#8888a0] hover:text-[#e4e4ed]'
                  }`}
                >
                  All
                </button>
                {apps.map((a) => (
                  <button
                    key={a.app}
                    onClick={() => setSelectedApp(a.app)}
                    className={`px-3 py-1 text-xs rounded ${
                      selectedApp === a.app
                        ? 'bg-[#6366f1] text-white'
                        : 'bg-[#1a1a24] text-[#8888a0] hover:text-[#e4e4ed]'
                    }`}
                  >
                    {a.app} (${a.cost_usd.toFixed(2)})
                  </button>
                ))}
              </div>
            )}

            {/* Daily trend bar chart */}
            <div className="flex items-end gap-1 h-32">
              {llm?.daily.map((d) => {
                const maxVal = Math.max(...llm.daily.map((x) => x.cost_usd), 0.001);
                const height = `${(d.cost_usd / maxVal) * 100}%`;
                return (
                  <div key={d.date} className="flex-1 relative group" style={{ height }}>
                    <div
                      className="absolute inset-x-0 bottom-0 bg-[#818cf8] rounded-t-sm min-h-[2px]"
                      style={{ height }}
                    />
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1a1a24] text-[#e4e4ed] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.date}: ${d.cost_usd.toFixed(4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Uptime Status */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          Uptime Status
        </h2>
        {uptimeLoading ? (
          <p className="text-[#8888a0] text-sm">Checking...</p>
        ) : (
          <div className="space-y-2">
            {(uptime?.results ?? []).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#1a1a24] rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      r.ok ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                    }`}
                  />
                  <span className="text-sm text-[#e4e4ed]">{r.url}</span>
                </div>
                <div className="text-sm text-[#8888a0]">
                  {r.status ?? '—'} · {r.latency_ms}ms
                </div>
              </div>
            ))}
            {(!uptime?.results || uptime.results.length === 0) && (
              <p className="text-sm text-[#8888a0]">No URLs configured for uptime checking.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[#1a1a24] rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#8888a0] mt-1">{label}</p>
    </div>
  );
}

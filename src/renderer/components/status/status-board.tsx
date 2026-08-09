import { useEffect, useState } from 'react';
import { useServiceStatus, type ServiceWithStatus } from '../../hooks/use-status';

const CATEGORY_ORDER: Record<ServiceWithStatus['category'], number> = { app: 0, infra: 1, saas: 2 };
const CATEGORY_LABEL: Record<ServiceWithStatus['category'], string> = {
  app: 'CrewCircle Apps',
  infra: 'Infrastructure',
  saas: 'SaaS Subscriptions',
};

function timeAgo(ts: number, now: number): string {
  if (!ts) return 'never';
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

/**
 * Live status board (worldmonitor pattern): severity dots, latency,
 * freshness badges — answers "what's working and what needs attention".
 */
export function StatusBoard() {
  const { services, loading, error, checkNow } = useServiceStatus();
  const [now, setNow] = useState(Date.now());

  // Tick so freshness labels stay current.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <p className="text-sm text-[#8888a0]">Checking services...</p>;
  if (error) return <p className="text-sm text-[#ef4444]">{error}</p>;

  const down = services.filter((s) => s.status && !s.status.ok);
  const groups = (['app', 'infra', 'saas'] as const).map((cat) => ({
    cat,
    items: services
      .filter((s) => s.category === cat)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {down.length > 0 && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/40 rounded-lg px-4 py-2 text-sm text-[#ef4444]">
          {down.length} service{down.length > 1 ? 's' : ''} need{down.length === 1 ? 's' : ''} attention:{' '}
          {down.map((s) => s.name).join(', ')}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.cat}>
          <h3 className="text-xs text-[#8888a0] mb-2 uppercase tracking-wider">
            {CATEGORY_LABEL[g.cat]}
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {g.items.map((s) => (
              <ServiceTile key={s.id} service={s} now={now} onRecheck={checkNow} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceTile({
  service,
  now,
  onRecheck,
}: {
  service: ServiceWithStatus;
  now: number;
  onRecheck: (id: string) => void;
}) {
  const st = service.status;
  const state = !st ? 'unknown' : st.ok ? 'up' : 'down';

  const dotClass =
    state === 'up'
      ? 'bg-[#22c55e]'
      : state === 'down'
        ? 'bg-[#ef4444] animate-pulse'
        : 'bg-[#8888a0]';

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-3 flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full flex-none ${dotClass}`} title={st?.detail} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#e4e4ed] truncate">{service.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#8888a0] border border-[#2a2a3a] rounded-full px-1.5 py-0.5">
            {CATEGORY_ORDER[service.category] === 0 ? 'app' : service.category}
          </span>
        </div>
        <div className="text-xs text-[#8888a0] mt-0.5">
          {!st && 'checking…'}
          {st && (
            <>
              {st.ok ? `${st.latencyMs}ms` : (st.statusCode ? `HTTP ${st.statusCode}` : 'unreachable')}
              {' · checked '}{timeAgo(st.checkedAt, now)}
              {st.failures > 0 && !st.ok && ` · ${st.failures} failure${st.failures > 1 ? 's' : ''}`}
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onRecheck(service.id)}
        className="text-[#8888a0] hover:text-[#e4e4ed] text-xs px-2 py-1 rounded hover:bg-[#2a2a3a]"
        title="Re-check now"
      >
        ↻
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useIpc, useIpcData } from '../../hooks/use-ipc';
import type { SocialCampaign } from '../../hooks/types';
import { ErrorBanner } from '../shared/error-banner';
import { StatCard } from '../shared/stat-card';
import { useToast } from '../shared/toast';

const PLATFORMS = ['linkedin', 'twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'other'];
const STATUSES = ['draft', 'active', 'paused', 'ended'];

const STATUS_COLORS: Record<string, string> = {
  active: 'text-[#22c55e]',
  draft: 'text-[#8888a0]',
  paused: 'text-[#f59e0b]',
  ended: 'text-[#6366f1]',
};

const STATUS_BG: Record<string, string> = {
  active: 'bg-[#22c55e]/10',
  draft: 'bg-transparent',
  paused: 'bg-[#f59e0b]/10',
  ended: 'bg-[#6366f1]/10',
};

const inputCls =
  'bg-[#1a1a24] border border-[#2a2a3a] rounded-md px-3 py-1.5 text-sm text-[#e4e4ed] placeholder-[#55556a] focus:outline-none focus:border-[#6366f1]';

function fmtCents(cents: number, currency: string): string {
  return `${currency === 'AUD' ? 'A$' : '$'}${(cents / 100).toFixed(2)}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function SocialPage() {
  const { data: campaigns, loading, error, refetch } = useIpcData<SocialCampaign[]>('social:list');
  const createCampaign = useIpc<SocialCampaign>('social:create');
  const updateCampaign = useIpc<SocialCampaign>('social:update');
  const deleteCampaign = useIpc<{ success: boolean }>('social:delete');
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const items = campaigns ?? [];
  const active = items.filter((c) => c.status === 'active');
  const totalSpend = items.reduce((s, c) => s + c.spend_cents, 0);
  const totalConversions = items.reduce((s, c) => s + c.conversions, 0);
  const totalImpressions = items.reduce((s, c) => s + c.impressions, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createCampaign({
        name: name.trim(),
        platform,
        budget_cents: Math.round(parseFloat(budget || '0') * 100),
        start_date: startDate || null,
        end_date: endDate || null,
      });
      toast('Campaign created', 'success');
      setName('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      refetch();
    } catch (err) {
      setFormError(String(err));
      toast('Failed to create campaign', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleFieldUpdate(id: number, field: string, value: unknown) {
    try {
      await updateCampaign({ id, [field]: value });
      refetch();
    } catch (err) {
      console.error('update failed', err);
      toast('Update failed', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this campaign?')) return;
    try {
      await deleteCampaign({ id });
      toast('Campaign deleted', 'success');
      refetch();
    } catch (err) {
      console.error('delete failed', err);
      toast('Delete failed', 'error');
    }
  }

  async function handleSeedDemo() {
    const demo = [
      { name: 'Q1 Launch', platform: 'linkedin', status: 'active', budget_cents: 50000, spend_cents: 12500, impressions: 42000, clicks: 840, conversions: 42, start_date: '2025-01-15', end_date: '2025-03-15' },
      { name: 'Twitter Thread Series', platform: 'twitter', status: 'active', budget_cents: 10000, spend_cents: 3200, impressions: 18500, clicks: 1120, conversions: 28, start_date: '2025-02-01', end_date: '2025-02-28' },
      { name: 'Instagram Reels', platform: 'instagram', status: 'paused', budget_cents: 25000, spend_cents: 8900, impressions: 31200, clicks: 560, conversions: 15, start_date: '2025-01-20', end_date: '2025-03-20' },
      { name: 'YouTube Deep Dive', platform: 'youtube', status: 'draft', budget_cents: 75000, spend_cents: 0, impressions: 0, clicks: 0, conversions: 0, start_date: '2025-03-01', end_date: '2025-04-30' },
    ];
    try {
      for (const d of demo) {
        await createCampaign(d);
      }
      toast('Demo campaigns seeded', 'success');
      refetch();
    } catch (err) {
      toast('Seed failed', 'error');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#e4e4ed]">Social Campaigns</h1>
        <span className="text-xs text-[#55556a]">
          {items.length} campaign{items.length !== 1 ? 's' : ''} · {active.length} active
        </span>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Campaigns" value={String(active.length)} color="text-[#22c55e]" />
        <StatCard label="Total Spend" value={fmtCents(totalSpend, 'AUD')} color="text-[#f59e0b]" />
        <StatCard label="Impressions" value={fmtNum(totalImpressions)} color="text-[#6366f1]" />
        <StatCard label="Conversions" value={fmtNum(totalConversions)} color="text-[#e4e4ed]" />
      </div>

      {/* Add campaign */}
      <form
        onSubmit={handleCreate}
        className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4 space-y-3"
      >
        <h2 className="text-sm font-medium text-[#8888a0] uppercase tracking-wider">
          New Campaign
        </h2>
        {formError && <ErrorBanner message={formError} />}
        <div className="flex flex-wrap gap-3">
          <input
            className={`${inputCls} flex-1 min-w-48`}
            placeholder="Campaign name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <input
            className={`${inputCls} w-32`}
            placeholder="Budget (AUD)"
            type="number"
            min="0"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <input
            className={inputCls}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start date"
          />
          <input
            className={inputCls}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End date"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 text-sm rounded-md bg-[#6366f1] text-white hover:bg-[#5558e6] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Adding…' : 'Add Campaign'}
          </button>
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={saving}
            className="px-4 py-1.5 text-sm rounded-md bg-[#2a2a3a] text-[#8888a0] hover:bg-[#3a3a4a] disabled:opacity-50 transition-colors"
          >
            Seed Demo Data
          </button>
        </div>
      </form>

      {/* Campaign table */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4 overflow-x-auto">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          Campaigns
        </h2>
        {loading ? (
          <p className="text-[#8888a0] text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Platform</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Budget</th>
                <th className="pb-2 font-medium text-right">Spend</th>
                <th className="pb-2 font-medium text-right">Impressions</th>
                <th className="pb-2 font-medium text-right">Clicks</th>
                <th className="pb-2 font-medium text-right">Conv.</th>
                <th className="pb-2 font-medium text-right">CTR</th>
                <th className="pb-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  onUpdate={handleFieldUpdate}
                  onDelete={handleDelete}
                />
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#8888a0]">
                    No campaigns yet. Add one above to start tracking.
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

function CampaignRow({
  campaign: c,
  onUpdate,
  onDelete,
}: {
  campaign: SocialCampaign;
  onUpdate: (id: number, field: string, value: unknown) => void;
  onDelete: (id: number) => void;
}) {
  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';

  return (
    <tr className="border-b border-[#1a1a24] hover:bg-[#1a1a24]/50 transition-colors">
      <td className="py-2 text-[#e4e4ed] pr-4 font-medium">{c.name}</td>
      <td className="py-2 text-[#8888a0] pr-4 capitalize">{c.platform}</td>
      <td className="py-2 pr-4">
        <select
          value={c.status}
          onChange={(e) => onUpdate(c.id, 'status', e.target.value)}
          className={`bg-transparent text-sm ${STATUS_COLORS[c.status] ?? 'text-[#e4e4ed]'} focus:outline-none cursor-pointer px-2 py-1 rounded ${STATUS_BG[c.status] ?? ''}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-[#1a1a24] text-[#e4e4ed] capitalize">
              {s}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 text-[#e4e4ed] text-right pr-4">{fmtCents(c.budget_cents, c.currency)}</td>
      <td className="py-2 text-right pr-4">
        <MetricInput
          value={c.spend_cents / 100}
          onCommit={(v) => onUpdate(c.id, 'spend_cents', Math.round(v * 100))}
          label="AUD"
        />
      </td>
      <td className="py-2 text-right pr-4">
        <MetricInput value={c.impressions} onCommit={(v) => onUpdate(c.id, 'impressions', v)} />
      </td>
      <td className="py-2 text-right pr-4">
        <MetricInput value={c.clicks} onCommit={(v) => onUpdate(c.id, 'clicks', v)} />
      </td>
      <td className="py-2 text-right pr-4">
        <MetricInput value={c.conversions} onCommit={(v) => onUpdate(c.id, 'conversions', v)} />
      </td>
      <td className="py-2 text-[#8888a0] text-right pr-4 font-mono">{ctr}%</td>
      <td className="py-2 text-right">
        <button
          onClick={() => onDelete(c.id)}
          className="text-[#8888a0] hover:text-[#ef4444] transition-colors text-xs opacity-0 group-hover:opacity-100"
          title="Delete campaign"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

function MetricInput({
  value,
  onCommit,
  label,
}: {
  value: number;
  onCommit: (v: number) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="text-[#e4e4ed] hover:text-[#818cf8] transition-colors group"
        title="Click to edit"
      >
        {Number.isInteger(value) ? fmtNum(value) : value.toFixed(2)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="number"
        min="0"
        step="any"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const v = parseFloat(draft);
          if (!Number.isNaN(v) && v >= 0 && v !== value) onCommit(v);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-24 bg-[#1a1a24] border border-[#6366f1] rounded px-1 py-0.5 text-sm text-[#e4e4ed] text-right focus:outline-none"
      />
      {label && <span className="text-xs text-[#55556a]">{label}</span>}
    </div>
  );
}

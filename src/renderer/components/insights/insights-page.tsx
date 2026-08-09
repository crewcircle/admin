import { useState } from 'react';
import { useIpc, useIpcData } from '../../hooks/use-ipc';
import type {
  Insight,
  InsightAnalyzeResponse,
  InsightAnalysisResult,
  OllamaStatus,
} from '../../hooks/types';
import { ErrorBanner } from '../shared/error-banner';
import { useToast } from '../shared/toast';

const inputCls =
  'bg-[#1a1a24] border border-[#2a2a3a] rounded-md px-3 py-1.5 text-sm text-[#e4e4ed] placeholder-[#55556a] focus:outline-none focus:border-[#6366f1]';

function parseList(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function InsightsPage() {
  const { data: history, loading, error, refetch } = useIpcData<Insight[]>('insights:list');
  const { data: ollamaStatus } = useIpcData<OllamaStatus>('ollama:status');
  const analyze = useIpc<InsightAnalyzeResponse>('insights:analyze');
  const deleteInsight = useIpc<{ success: boolean }>('insights:delete');
  const { toast } = useToast();

  const [logs, setLogs] = useState('');
  const [source, setSource] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<InsightAnalysisResult | null>(null);

  const ollamaReady = ollamaStatus?.running ?? false;

  async function handleAnalyze() {
    if (!logs.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setResult(null);
    try {
      const res = await analyze({ logs, source: source || 'manual' });
      if (res.success && res.result) {
        setResult(res.result);
        setLogs('');
        toast('Analysis complete', 'success');
        refetch();
      } else {
        setAnalyzeError(res.error ?? 'Analysis failed');
        toast('Analysis failed: ' + (res.error ?? 'Unknown error'), 'error');
      }
    } catch (err) {
      setAnalyzeError(String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteInsight({ id });
      toast('Analysis deleted', 'success');
      refetch();
    } catch (err) {
      console.error('delete failed', err);
      toast('Delete failed', 'error');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-[#e4e4ed]">Log Insights</h1>
        <span
          className={`flex items-center gap-1.5 text-xs ${
            ollamaReady ? 'text-[#22c55e]' : 'text-[#ef4444]'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              ollamaReady ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
            }`}
          />
          {ollamaReady
            ? `Local LLM ready${ollamaStatus?.model ? ` (${ollamaStatus.model})` : ''}`
            : 'Ollama offline'}
        </span>
      </div>

      {error && <ErrorBanner message={error} />}

      <p className="text-sm text-[#8888a0] -mt-3">
        Paste application logs, error reports or user feedback. The local LLM extracts
        issues and product suggestions — nothing leaves this machine.
      </p>

      {/* Input */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4 space-y-3">
        <div className="flex gap-3">
          <input
            className={`${inputCls} w-64`}
            placeholder="Source (e.g. cardsnap, sentry)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
        <textarea
          className={`${inputCls} w-full h-40 font-mono text-xs resize-y`}
          placeholder="Paste logs or feedback here…"
          value={logs}
          onChange={(e) => setLogs(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !logs.trim() || !ollamaReady}
            className="px-4 py-1.5 text-sm rounded-md bg-[#6366f1] text-white hover:bg-[#5558e6] disabled:opacity-50 transition-colors"
          >
            {analyzing ? 'Analysing…' : 'Analyse with local LLM'}
          </button>
          {!ollamaReady && (
            <span className="text-xs text-[#8888a0]">
              Start Ollama (<code className="text-[#818cf8]">ollama serve</code>) to enable analysis.
            </span>
          )}
        </div>
        {analyzeError && <ErrorBanner message={analyzeError} />}
      </div>

      {/* Latest result */}
      {result && <AnalysisCard result={result} title="Latest Analysis" />}

      {/* History */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
        <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
          Past Analyses
        </h2>
        {loading ? (
          <p className="text-[#8888a0] text-sm">Loading...</p>
        ) : (history ?? []).length === 0 ? (
          <p className="text-[#8888a0] text-sm">No analyses yet.</p>
        ) : (
          <div className="space-y-3">
            {(history ?? []).map((insight) => (
              <HistoryItem key={insight.id} insight={insight} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisCard({
  result,
  title,
}: {
  result: InsightAnalysisResult;
  title: string;
}) {
  const { toast } = useToast();

  function formatForCopy(r: InsightAnalysisResult): string {
    return `${r.summary}\n\nIssues:\n${r.issues.map((i) => `- ${i}`).join('\n')}\n\nSuggestions:\n${r.suggestions.map((s) => `- ${s}`).join('\n')}`;
  }

  return (
    <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[#8888a0] uppercase tracking-wider">{title}</h2>
        <button
          onClick={() => {
            navigator.clipboard.writeText(formatForCopy(result));
            toast('Copied to clipboard', 'success');
          }}
          className="px-3 py-1 text-xs rounded-md bg-[#2a2a3a] text-[#8888a0] hover:bg-[#3a3a4a] transition-colors"
          title="Copy analysis"
        >
          Copy
        </button>
      </div>
      {result.summary && (
        <p className="text-sm text-[#e4e4ed] leading-relaxed">{result.summary}</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-medium text-[#ef4444] uppercase tracking-wider mb-2">
            Issues ({result.issues.length})
          </h3>
          {result.issues.length === 0 ? (
            <p className="text-sm text-[#8888a0]">No issues found.</p>
          ) : (
            <ul className="space-y-1.5">
              {result.issues.map((issue, i) => (
                <li key={i} className="text-sm text-[#e4e4ed] flex gap-2">
                  <span className="text-[#ef4444] shrink-0">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-xs font-medium text-[#22c55e] uppercase tracking-wider mb-2">
            Suggestions ({result.suggestions.length})
          </h3>
          {result.suggestions.length === 0 ? (
            <p className="text-sm text-[#8888a0]">No suggestions.</p>
          ) : (
            <ul className="space-y-1.5">
              {result.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-[#e4e4ed] flex gap-2">
                  <span className="text-[#22c55e] shrink-0">→</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryItem({
  insight,
  onDelete,
}: {
  insight: Insight;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const issues = parseList(insight.issues);
  const suggestions = parseList(insight.suggestions);

  return (
    <div className="border border-[#2a2a3a] rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#1a1a24] transition-colors rounded-lg"
      >
        <span className="text-xs text-[#6366f1] shrink-0 w-20 truncate">{insight.source}</span>
        <span className="text-sm text-[#e4e4ed] flex-1 truncate">
          {insight.summary || insight.input_excerpt}
        </span>
        <span className="text-xs text-[#8888a0] shrink-0">
          {issues.length} issues · {suggestions.length} sugg.
        </span>
        <span className="text-xs text-[#55556a] shrink-0">
          {insight.created_at.slice(0, 16)}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#2a2a3a] space-y-3">
          <AnalysisCard result={{ summary: insight.summary, issues, suggestions }} title="Detail" />
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(insight.id)}
              className="text-xs text-[#8888a0] hover:text-[#ef4444] transition-colors"
            >
              Delete this analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

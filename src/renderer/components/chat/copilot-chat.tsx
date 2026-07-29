import { useState, useRef, useEffect } from 'react';
import { useOllamaStatus, useOllamaChat } from '../../hooks/use-ollama';
import { useProjects } from '../../hooks/use-projects';
import { useCostDashboard } from '../../hooks/use-costs';
import { useSentry } from '../../hooks/use-observability';

const SUGGESTED_QUERIES = [
  'Total spend this month?',
  'LLM costs by app?',
  'Which project has most errors?',
  'Uptime status?',
  'How many active projects?',
];

export function CopilotChat() {
  const { status } = useOllamaStatus();
  const { messages, loading, send, clear } = useOllamaChat();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Gather context data for the LLM
  const { data: projects } = useProjects();
  const { data: costs } = useCostDashboard();
  const { data: sentry } = useSentry();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Gather context for rich LLM queries
    const contextData: Record<string, unknown> = {};
    if (projects) contextData.projects = projects;
    if (costs?.summary) contextData.costs = costs.summary;
    if (sentry) {
      contextData.sentry = {
        total_unresolved: sentry.total_unresolved,
        by_project: sentry.by_project,
      };
    }

    send(trimmed, contextData);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#e4e4ed]">Copilot</h2>
          <span
            className={`w-2 h-2 rounded-full ${
              status?.running ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
            }`}
            title={status?.running ? 'Ollama running' : (status?.error ?? 'Ollama not running')}
          />
        </div>
        <button
          onClick={clear}
          className="text-xs text-[#8888a0] hover:text-[#e4e4ed]"
        >
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#8888a0] mb-4">
              {status?.running
                ? 'Ask me anything about your projects, costs, or errors.'
                : 'Ollama is not running. Install Ollama to use the copilot.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-[#1a1a24] text-[#8888a0] hover:text-[#e4e4ed] hover:bg-[#2a2a3a] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#1a1a24] text-[#e4e4ed] border border-[#2a2a3a]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#8888a0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#8888a0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#8888a0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2a2a3a] shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status?.running
                ? 'Ask about projects, costs, errors...'
                : 'Ollama not running...'
            }
            disabled={!status?.running}
            className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-[#e4e4ed] placeholder-[#8888a0] focus:outline-none focus:border-[#6366f1] disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim() || !status?.running}
            className="px-4 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#818cf8] disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

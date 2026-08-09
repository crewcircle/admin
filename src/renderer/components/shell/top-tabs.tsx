import { NavLink } from 'react-router';
import { useState, useRef, useEffect } from 'react';

const TABS = [
  { path: '/', label: 'Dashboard' },
  { path: '/projects', label: 'Projects' },
  { path: '/costs', label: 'Costs' },
  { path: '/observability', label: 'Observability' },
  { path: '/social', label: 'Social' },
  { path: '/insights', label: 'Insights' },
  { path: '/architecture', label: 'Architecture' },
  { path: '/copilot', label: 'Copilot' },
];

const SAAS_PROVIDERS = [
  { id: 'supabase', name: 'Supabase' },
  { id: 'sentry', name: 'Sentry' },
  { id: 'cloudflare', name: 'Cloudflare' },
  { id: 'digitalocean', name: 'DigitalOcean' },
  { id: 'vercel', name: 'Vercel' },
  { id: 'doppler', name: 'Doppler' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'github', name: 'GitHub' },
];

export function TopTabs() {
  const [saasOpen, setSaasOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSaasOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="flex items-center h-12 px-4 bg-[#111118] border-b border-[#2a2a3a] shrink-0 select-none">
      <div className="text-sm font-semibold text-[#818cf8] mr-6">CrewCircle Admin</div>
      <nav className="flex items-center gap-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-[#1a1a24] text-[#e4e4ed]'
                  : 'text-[#8888a0] hover:text-[#e4e4ed] hover:bg-[#1a1a24]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}

        {/* SaaS dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSaasOpen(!saasOpen)}
            className="px-3 py-1.5 text-sm rounded-md text-[#8888a0] hover:text-[#e4e4ed] hover:bg-[#1a1a24] transition-colors flex items-center gap-1"
          >
            SaaS
            <svg className={`w-3 h-3 transition-transform ${saasOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {saasOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg shadow-xl z-50 py-1">
              {SAAS_PROVIDERS.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/saas/${p.id}`}
                  onClick={() => setSaasOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${
                      isActive
                        ? 'bg-[#6366f1]/20 text-[#818cf8]'
                        : 'text-[#e4e4ed] hover:bg-[#2a2a3a]'
                    }`
                  }
                >
                  {p.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

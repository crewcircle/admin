import { Link } from 'react-router';

const PROJECTS = [
  'CardSnap',
  'crewRoster',
  'smartGL',
  'taxflow-ai',
  'localmate',
  'AUrate',
];

const SAAS = [
  { id: 'supabase', name: 'Supabase' },
  { id: 'sentry', name: 'Sentry' },
  { id: 'cloudflare', name: 'Cloudflare' },
  { id: 'digitalocean', name: 'DO' },
  { id: 'vercel', name: 'Vercel' },
  { id: 'doppler', name: 'Doppler' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'github', name: 'GitHub' },
];

// Rough mapping: which SaaS each project uses
const MAPPING: Record<string, Set<string>> = {
  CardSnap: new Set(['supabase', 'sentry', 'cloudflare', 'vercel', 'doppler', 'anthropic', 'github']),
  crewRoster: new Set(['supabase', 'sentry', 'cloudflare', 'vercel', 'doppler', 'anthropic', 'github']),
  smartGL: new Set(['supabase', 'sentry', 'cloudflare', 'digitalocean', 'vercel', 'doppler', 'anthropic', 'github']),
  'taxflow-ai': new Set(['supabase', 'sentry', 'cloudflare', 'vercel', 'doppler', 'anthropic', 'github']),
  localmate: new Set(['supabase', 'sentry', 'cloudflare', 'vercel', 'doppler', 'anthropic', 'github']),
  AUrate: new Set(['supabase', 'sentry', 'cloudflare', 'vercel', 'doppler', 'anthropic', 'github']),
};

export function ArchitectureViz() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#e4e4ed]">Architecture</h1>

      <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a3a]">
              <th className="p-3 text-left text-[#8888a0] font-medium">Project</th>
              {SAAS.map((s) => (
                <th key={s.id} className="p-3 text-center text-[#8888a0] font-medium w-16">
                  <Link
                    to={`/saas/${s.id}`}
                    className="hover:text-[#818cf8] transition-colors"
                  >
                    {s.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((project) => (
              <tr
                key={project}
                className="border-b border-[#1a1a24] hover:bg-[#1a1a24]"
              >
                <td className="p-3 text-[#e4e4ed] font-medium">
                  <Link
                    to={`/projects/${project}`}
                    className="hover:text-[#818cf8] transition-colors"
                  >
                    {project}
                  </Link>
                </td>
                {SAAS.map((s) => (
                  <td key={s.id} className="p-3 text-center">
                    {MAPPING[project]?.has(s.id) ? (
                      <span className="text-[#22c55e] text-lg">✓</span>
                    ) : (
                      <span className="text-[#2a2a3a]">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#8888a0]">
        Matrix showing which SaaS providers each project uses. Click a project
        or provider name to navigate to its detail page.
      </p>
    </div>
  );
}

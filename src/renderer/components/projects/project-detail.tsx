import { useParams, Link } from 'react-router';
import { useProject, useGitHubRepo } from '../../hooks/use-projects';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, loading } = useProject(id ?? '');
  const { data: github } = useGitHubRepo(id ?? '');

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-[#8888a0]">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#e4e4ed] mb-4">
          Project Not Found
        </h1>
        <Link to="/projects" className="text-[#818cf8] hover:underline text-sm">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="text-[#8888a0] hover:text-[#e4e4ed] text-sm"
        >
          ← Projects
        </Link>
        <h1 className="text-xl font-semibold text-[#e4e4ed]">{project.name}</h1>
        <span
          className={`px-2 py-0.5 rounded-full text-xs ${
            project.status === 'active'
              ? 'bg-[#22c55e]/20 text-[#22c55e]'
              : 'bg-[#8888a0]/20 text-[#8888a0]'
          }`}
        >
          {project.status}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">
            Description
          </h3>
          <p className="text-sm text-[#e4e4ed]">
            {project.description || 'No description'}
          </p>
        </div>
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">
            Price
          </h3>
          <p className="text-sm text-[#e4e4ed]">
            ${((project.price_cents ?? 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">
            Created
          </h3>
          <p className="text-sm text-[#e4e4ed]">
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h3 className="text-xs text-[#8888a0] uppercase tracking-wider mb-1">
            Last Push
          </h3>
          <p className="text-sm text-[#e4e4ed]">
            {github?.last_push
              ? new Date(github.last_push).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {/* GitHub Stats */}
      {github && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[#8888a0] mb-3 uppercase tracking-wider">
            GitHub Stats
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <Stat label="Stars" value={github.stars} />
            <Stat label="Forks" value={github.forks} />
            <Stat label="Open Issues" value={github.open_issues} />
            <Stat label="Language" value={github.language} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to={`/saas/github`}
          className="px-3 py-1.5 text-sm rounded-md bg-[#1a1a24] text-[#e4e4ed] border border-[#2a2a3a] hover:bg-[#2a2a3a]"
        >
          View on GitHub
        </Link>
        <Link
          to={`/saas/supabase`}
          className="px-3 py-1.5 text-sm rounded-md bg-[#1a1a24] text-[#e4e4ed] border border-[#2a2a3a] hover:bg-[#2a2a3a]"
        >
          Open Supabase
        </Link>
        {project.status === 'active' && (
          <button
            onClick={() => {
              window.adminAPI
                .invoke('provision:startDeprovision', { projectId: project.id })
                .then(() => {
                  // Navigate back to projects list after initiating deprovision
                  window.location.hash = '#/projects';
                })
                .catch((err: Error) =>
                  console.error('Deprovision failed:', err)
                );
            }}
            className="px-3 py-1.5 text-sm rounded-md bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444]/30"
          >
            Deprovision
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-[#e4e4ed]">{value}</p>
      <p className="text-xs text-[#8888a0] mt-1">{label}</p>
    </div>
  );
}

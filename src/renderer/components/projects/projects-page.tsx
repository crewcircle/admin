import { Link } from 'react-router';
import { useProjects } from '../../hooks/use-projects';
import { ErrorBanner } from '../shared/error-banner';

export function ProjectsPage() {
  const { data: projects, loading, error } = useProjects();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#e4e4ed]">Projects</h1>
        <Link
          to="/projects/new"
          className="px-3 py-1.5 text-sm rounded-md bg-[#6366f1] text-white hover:bg-[#818cf8] transition-colors"
        >
          + New Project
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <p className="text-[#8888a0]">Loading...</p>
      ) : (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3a] text-[#8888a0] text-left">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Price</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {(projects ?? []).map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#1a1a24] hover:bg-[#1a1a24]"
                >
                  <td className="p-3">
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-[#818cf8] hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.description && (
                      <p className="text-xs text-[#8888a0] mt-0.5 truncate max-w-xs">
                        {p.description}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
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
                  <td className="p-3 text-right text-[#e4e4ed]">
                    ${((p.price_cents ?? 0) / 100).toFixed(2)}
                  </td>
                  <td className="p-3 text-[#8888a0]">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/saas/github`}
                        className="text-xs text-[#8888a0] hover:text-[#818cf8]"
                      >
                        GitHub
                      </Link>
                      <Link
                        to={`/saas/supabase`}
                        className="text-xs text-[#8888a0] hover:text-[#818cf8]"
                      >
                        Supabase
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {(!projects || projects.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#8888a0]">
                    No projects found. Add a registry.json file to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

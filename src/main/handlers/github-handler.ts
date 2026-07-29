import { ipcMain } from 'electron';
import { credentialManager } from '../credential-manager';

interface GitHubRepo {
  stars: number;
  forks: number;
  open_issues: number;
  default_branch: string;
  last_push: string;
  language: string;
}

// Simple in-memory TTL cache (no Next.js cache)
const cache = new Map<string, { data: GitHubRepo; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function registerGithubHandlers(): void {
  ipcMain.handle('github:getRepo', async (_event, input: { repo: string }) => {
    const token = credentialManager.get('github_token');
    if (!token || token === 'placeholder') {
      console.warn('github:getRepo — no GitHub token configured');
      return null;
    }

    const cacheKey = input.repo;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await fetch(
        `https://api.github.com/repos/crewcircle/${input.repo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'CrewCircle-Admin',
          },
        }
      );

      if (!res.ok) {
        console.warn(`github:getRepo — ${input.repo} returned ${res.status}`);
        return null;
      }

      const json = await res.json();
      const result: GitHubRepo = {
        stars: json.stargazers_count ?? 0,
        forks: json.forks_count ?? 0,
        open_issues: json.open_issues_count ?? 0,
        default_branch: json.default_branch ?? 'main',
        last_push: json.pushed_at ?? '',
        language: json.language ?? 'Unknown',
      };

      cache.set(cacheKey, { data: result, ts: Date.now() });
      return result;
    } catch (err) {
      console.error('github:getRepo error:', err);
      return null;
    }
  });
}

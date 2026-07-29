import { ipcMain } from 'electron';
import { credentialManager } from '../credential-manager';

interface SentryAggregate {
  total_unresolved: number;
  total_24h: number;
  total_7d: number;
  by_project: { project: string; count: number }[];
  recent_issues: {
    title: string;
    project: string;
    level: string;
    first_seen: string;
    last_seen: string;
    count: string;
    permalink: string;
  }[];
}

export function registerSentryHandlers(): void {
  ipcMain.handle('sentry:getAggregate', async () => {
    const token = credentialManager.get('sentry_token');
    const org = credentialManager.get('sentry_org') || 'crewcircle';

    if (!token || token === 'placeholder') {
      console.warn('sentry:getAggregate — no Sentry token configured');
      return {
        total_unresolved: 0,
        total_24h: 0,
        total_7d: 0,
        by_project: [],
        recent_issues: [],
      } satisfies SentryAggregate;
    }

    try {
      // Fetch unresolved issues
      const res = await fetch(
        `https://sentry.io/api/0/organizations/${org}/issues/?query=is:unresolved&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        console.warn(`sentry:getAggregate — API returned ${res.status}`);
        return {
          total_unresolved: 0,
          total_24h: 0,
          total_7d: 0,
          by_project: [],
          recent_issues: [],
        } satisfies SentryAggregate;
      }

      const issues: Array<{
        title: string;
        project: { name: string };
        level: string;
        firstSeen: string;
        lastSeen: string;
        count: string;
        permalink: string;
      }> = await res.json();

      // By project breakdown
      const projectMap = new Map<string, number>();
      for (const issue of issues) {
        const name = issue.project?.name ?? 'unknown';
        projectMap.set(name, (projectMap.get(name) ?? 0) + 1);
      }

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      return {
        total_unresolved: issues.length,
        total_24h: issues.filter(
          (i) => now - new Date(i.lastSeen).getTime() < dayMs
        ).length,
        total_7d: issues.filter(
          (i) => now - new Date(i.lastSeen).getTime() < 7 * dayMs
        ).length,
        by_project: Array.from(projectMap.entries()).map(
          ([project, count]) => ({ project, count })
        ),
        recent_issues: issues.slice(0, 20).map((i) => ({
          title: i.title,
          project: i.project?.name ?? 'unknown',
          level: i.level,
          first_seen: i.firstSeen,
          last_seen: i.lastSeen,
          count: i.count,
          permalink: i.permalink,
        })),
      } satisfies SentryAggregate;
    } catch (err) {
      console.error('sentry:getAggregate error:', err);
      return {
        total_unresolved: 0,
        total_24h: 0,
        total_7d: 0,
        by_project: [],
        recent_issues: [],
      } satisfies SentryAggregate;
    }
  });
}

import { useIpcData } from './use-ipc';
import type { Project, GitHubRepo } from './types';

export function useProjects() {
  return useIpcData<Project[]>('registry:getProjects');
}

export function useProject(id: string) {
  return useIpcData<Project | null>('registry:getProject', { id });
}

export function useGitHubRepo(repo: string) {
  return useIpcData<GitHubRepo | null>('github:getRepo', { repo });
}

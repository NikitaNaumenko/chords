// Песни из папки songs/ в корне репозитория попадают в сборку как строки.
const files = import.meta.glob('/songs/*.cho', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

export interface RepoFile {
  id: string
  fileName: string
  text: string
}

export const REPO_PREFIX = 'repo:'

export function slugFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.cho$/i, '')
}

export const repoFiles: RepoFile[] = Object.entries(files)
  .map(([path, text]) => ({ id: REPO_PREFIX + slugFromPath(path), fileName: slugFromPath(path), text }))
  .sort((a, b) => a.fileName.localeCompare(b.fileName, 'ru'))

export const isRepoId = (id: string) => id.startsWith(REPO_PREFIX)

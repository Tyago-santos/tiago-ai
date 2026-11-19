export interface RepoSummary {
  name: string;
  description: string;
  url: string;
  language: string;
  topics: string[];
  stars: number;
  updatedAt: string;
}

const LIST_TTL_MS = 10 * 60 * 1000;
const README_TTL_MS = 24 * 60 * 60 * 1000;

let listCache: { data: RepoSummary[]; loadedAt: number } | null = null;
const readmeCache = new Map<string, { data: string; loadedAt: number }>();

/** Limpa os caches (usado nos testes). */
export function clearGithubCache(): void {
  listCache = null;
  readmeCache.clear();
}

function githubUser(): string {
  return process.env.GITHUB_USER || 'Tyago-santos';
}

function headers(accept = 'application/vnd.github+json'): Record<string, string> {
  const result: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'tiago-ai',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    result.Authorization = `Bearer ${token}`;
  }
  return result;
}

/**
 * Lista os repositórios públicos do perfil (sem forks), com cache em memória.
 * Sem token a API do GitHub permite 60 consultas/hora; com GITHUB_TOKEN, 5.000/hora.
 */
export async function listRepositories(): Promise<RepoSummary[]> {
  if (listCache && Date.now() - listCache.loadedAt < LIST_TTL_MS) {
    return listCache.data;
  }

  const url = `https://api.github.com/users/${githubUser()}/repos?per_page=100&sort=updated&type=owner`;
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error(`GitHub API falhou com status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    name?: string;
    description?: string | null;
    html_url?: string;
    language?: string | null;
    topics?: string[];
    stargazers_count?: number;
    pushed_at?: string;
    fork?: boolean;
  }>;

  const repos: RepoSummary[] = payload
    .filter((repo) => !repo.fork && repo.name)
    .map((repo) => ({
      name: repo.name ?? '',
      description: repo.description ?? '',
      url: repo.html_url ?? '',
      language: repo.language ?? '',
      topics: repo.topics ?? [],
      stars: repo.stargazers_count ?? 0,
      updatedAt: repo.pushed_at ?? '',
    }));

  listCache = { data: repos, loadedAt: Date.now() };
  return repos;
}

/** Baixa o README bruto (Markdown) de um repositório. Retorna '' se não existir. */
export async function getReadme(repo: string): Promise<string> {
  const key = repo.toLowerCase();
  const cached = readmeCache.get(key);
  if (cached && Date.now() - cached.loadedAt < README_TTL_MS) {
    return cached.data;
  }

  const url = `https://api.github.com/repos/${githubUser()}/${repo}/readme`;
  const response = await fetch(url, { headers: headers('application/vnd.github.raw+json') });

  if (response.status === 404) {
    readmeCache.set(key, { data: '', loadedAt: Date.now() });
    return '';
  }
  if (!response.ok) {
    throw new Error(`GitHub API falhou com status ${response.status}`);
  }

  const text = await response.text();
  readmeCache.set(key, { data: text, loadedAt: Date.now() });
  return text;
}

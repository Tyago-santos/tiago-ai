import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listRepositories, getReadme, clearGithubCache } from '../services/github';

const fetchMock = vi.fn();

const REPOS_PAYLOAD = [
  {
    name: 'ia_study',
    description: 'Plataforma de estudos com IA',
    html_url: 'https://github.com/Tyago-santos/ia_study',
    language: 'TypeScript',
    topics: ['ai', 'study'],
    stargazers_count: 5,
    pushed_at: '2026-11-01T00:00:00Z',
    fork: false,
  },
  {
    name: 'some-fork',
    description: 'fork',
    html_url: 'https://github.com/Tyago-santos/some-fork',
    language: 'JavaScript',
    topics: [],
    stargazers_count: 0,
    pushed_at: '2026-01-01T00:00:00Z',
    fork: true,
  },
];

beforeEach(() => {
  clearGithubCache();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  delete process.env.GITHUB_TOKEN;
  process.env.GITHUB_USER = 'Tyago-santos';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_USER;
});

describe('cliente da API do GitHub', () => {
  it('lista os repositórios públicos mapeando os campos úteis', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => REPOS_PAYLOAD });

    const repos = await listRepositories();

    expect(fetchMock.mock.calls[0][0]).toContain('api.github.com/users/Tyago-santos/repos');
    expect(repos).toHaveLength(1);
    expect(repos[0]).toMatchObject({
      name: 'ia_study',
      description: 'Plataforma de estudos com IA',
      url: 'https://github.com/Tyago-santos/ia_study',
      language: 'TypeScript',
      stars: 5,
    });
  });

  it('envia o token como Authorization quando GITHUB_TOKEN existe', async () => {
    process.env.GITHUB_TOKEN = 'token-secreto';
    fetchMock.mockResolvedValue({ ok: true, json: async () => REPOS_PAYLOAD });

    await listRepositories();

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-secreto');
  });

  it('cacheia a lista (não refaz a chamada em sequência)', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => REPOS_PAYLOAD });

    await listRepositories();
    await listRepositories();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lança erro claro quando a API do GitHub falha (ex.: rate limit)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });

    await expect(listRepositories()).rejects.toThrow(/GitHub/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('baixa o README bruto de um repositório', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => '# Projeto\n\nConteúdo do README' });

    const readme = await getReadme('ia_study');

    expect(readme).toContain('# Projeto');
    expect(fetchMock.mock.calls[0][0]).toContain('/repos/Tyago-santos/ia_study/readme');
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Accept).toContain('raw');
  });

  it('cacheia o README baixado', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => '# X' });

    await getReadme('ia_study');
    await getReadme('ia_study');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retorna string vazia quando o repositório não tem README (404)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    await expect(getReadme('sem-readme')).resolves.toBe('');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

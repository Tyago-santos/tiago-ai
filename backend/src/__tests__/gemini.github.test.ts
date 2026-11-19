import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models: { generateContent: (args: unknown) => Promise<unknown> };
    constructor() {
      this.models = { generateContent: (args: unknown) => generateContentMock(args) };
    }
  },
}));

const githubMock = vi.hoisted(() => ({
  listRepositories: vi.fn(),
  getReadme: vi.fn(),
}));

vi.mock('../services/github', () => githubMock);

vi.mock('../services/knowledge', () => ({
  loadKnowledgeBase: vi.fn(async () => '# BASE DE CONHECIMENTO'),
}));

import { generateReply } from '../services/gemini';

const savedEnv = { ...process.env };

function lastSystemInstruction(): string {
  const call = generateContentMock.mock.calls.at(-1)?.[0] as
    | { config?: { systemInstruction?: string } }
    | undefined;
  return call?.config?.systemInstruction ?? '';
}

beforeEach(() => {
  generateContentMock.mockReset();
  githubMock.listRepositories.mockReset();
  githubMock.getReadme.mockReset();
  process.env.GEMINI_API_KEY = 'chave-1';
  delete process.env.GEMINI_API_KEY_FALLBACKS;
  process.env.GEMINI_MODEL = 'gemini-test';
  githubMock.listRepositories.mockResolvedValue([
    { name: 'ia_study', description: 'Estudos com IA', url: 'https://github.com/Tyago-santos/ia_study', language: 'TypeScript', topics: [], stars: 1, updatedAt: '' },
    { name: 'report_city', description: 'Problemas urbanos', url: 'https://github.com/Tyago-santos/report_city', language: 'TypeScript', topics: [], stars: 2, updatedAt: '' },
  ]);
  githubMock.getReadme.mockResolvedValue('# README do projeto\nConteúdo real do repositório.');
  generateContentMock.mockResolvedValue({ text: 'Resposta ok' });
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('acesso ao GitHub como contexto da IA', () => {
  it('inclui o índice dos repositórios no contexto', async () => {
    await generateReply({ message: 'Quais projetos você tem?', history: [] });

    const instruction = lastSystemInstruction();
    expect(instruction).toContain('ia_study');
    expect(instruction).toContain('report_city');
    expect(instruction).toContain('https://github.com/Tyago-santos/ia_study');
  });

  it('busca o README do repositório citado na pergunta', async () => {
    await generateReply({ message: 'Me explica o projeto report_city', history: [] });

    expect(githubMock.getReadme).toHaveBeenCalledWith('report_city');
    expect(lastSystemInstruction()).toContain('README do projeto');
    expect(lastSystemInstruction()).toContain('Conteúdo real do repositório');
  });

  it('reconhece o nome amigável do projeto (com espaços no lugar de - _ .)', async () => {
    await generateReply({ message: 'O que foi o Report City?', history: [] });

    expect(githubMock.getReadme).toHaveBeenCalledWith('report_city');
  });

  it('NÃO busca README quando a pergunta não cita repositório', async () => {
    await generateReply({ message: 'Quem é Tiago Santos?', history: [] });

    expect(githubMock.getReadme).not.toHaveBeenCalled();
  });

  it('limita a busca a 2 repositórios por mensagem', async () => {
    await generateReply({
      message: 'Compare ia_study, report_city e o projeto que não existe_xyz',
      history: [],
    });

    expect(githubMock.getReadme).toHaveBeenCalledTimes(2);
  });

  it('responde mesmo quando a API do GitHub está fora do ar', async () => {
    githubMock.listRepositories.mockRejectedValueOnce(new Error('GitHub 403'));

    const reply = await generateReply({ message: 'oi', history: [] });

    expect(reply).toBe('Resposta ok');
    expect(lastSystemInstruction()).not.toContain('REPOSITÓRIOS');
  });

  it('trunca READMEs gigantes para não estourar o contexto', async () => {
    githubMock.getReadme.mockResolvedValue('x'.repeat(50_000));

    await generateReply({ message: 'fale do report_city', history: [] });

    expect(lastSystemInstruction().length).toBeLessThan(30_000);
  });
});

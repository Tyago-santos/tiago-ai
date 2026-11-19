import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const harness = vi.hoisted(() => ({
  usedKeys: [] as string[],
}));

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models: { generateContent: (args: unknown) => Promise<unknown> };
    constructor(options: { apiKey?: string }) {
      this.models = {
        generateContent: (args: unknown) => {
          harness.usedKeys.push(String(options.apiKey));
          return generateContentMock(args);
        },
      };
    }
  },
}));

vi.mock('../services/knowledge', () => ({
  loadKnowledgeBase: vi.fn(async () => '# BASE DE CONHECIMENTO'),
}));

import { generateReply, resolveApiKeys, resetKeyRotation } from '../services/gemini';

const savedEnv = { ...process.env };

function setKeys(primary: string, fallbacks = '') {
  process.env.GEMINI_API_KEY = primary;
  process.env.GEMINI_API_KEY_FALLBACKS = fallbacks;
}

beforeEach(() => {
  harness.usedKeys.length = 0;
  generateContentMock.mockReset();
  resetKeyRotation();
  process.env.GEMINI_MODEL = 'gemini-test';
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('chaves da API — rotação', () => {
  it('resolve a chave principal e as fallbacks (separadas por vírgula ou espaço)', () => {
    setKeys('chave-1', 'chave-2, chave-3');
    expect(resolveApiKeys()).toEqual(['chave-1', 'chave-2', 'chave-3']);
  });

  it('remove chaves duplicadas e vazias', () => {
    setKeys('chave-1', 'chave-1,, ,chave-2');
    expect(resolveApiKeys()).toEqual(['chave-1', 'chave-2']);
  });

  it('lança erro claro quando nenhuma chave está configurada', async () => {
    setKeys('');
    await expect(generateReply({ message: 'oi', history: [] })).rejects.toThrow(
      'GEMINI_API_KEY não configurada',
    );
  });

  it('usa a chave principal quando ela responde normalmente', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentMock.mockResolvedValue({ text: 'Olá!' });

    const reply = await generateReply({ message: 'oi', history: [] });

    expect(reply).toBe('Olá!');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(harness.usedKeys).toEqual(['chave-1']);
  });

  it('passa para a próxima chave quando a atual atinge a cota (429)', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentMock
      .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED: You exceeded your current quota'))
      .mockResolvedValueOnce({ text: 'Resposta da chave 2' });

    const reply = await generateReply({ message: 'oi', history: [] });

    expect(reply).toBe('Resposta da chave 2');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(harness.usedKeys).toEqual(['chave-1', 'chave-2']);
  });

  it('esgota todas as chaves e propaga o erro de cota quando nenhuma funciona', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentMock.mockRejectedValue(new Error('429 quota exceeded'));

    await expect(generateReply({ message: 'oi', history: [] })).rejects.toThrow('429 quota exceeded');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(harness.usedKeys).toEqual(['chave-1', 'chave-2']);
  });

  it('NÃO troca de chave em erro que não é de cota', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentMock.mockRejectedValue(new Error('INVALID_ARGUMENT: conteúdo inválido'));

    await expect(generateReply({ message: 'oi', history: [] })).rejects.toThrow('INVALID_ARGUMENT');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(harness.usedKeys).toEqual(['chave-1']);
  });

  it('distribui as chamadas entre as chaves (round-robin)', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentMock.mockResolvedValue({ text: 'ok' });

    await generateReply({ message: 'oi', history: [] });
    await generateReply({ message: 'oi', history: [] });
    await generateReply({ message: 'oi', history: [] });

    expect(harness.usedKeys).toEqual(['chave-1', 'chave-2', 'chave-1']);
  });
});

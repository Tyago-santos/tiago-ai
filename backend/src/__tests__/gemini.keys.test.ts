import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const harness = vi.hoisted(() => ({
  usedKeys: [] as string[],
}));

const generateContentMock = vi.fn();
const generateContentStreamMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models: {
      generateContent: (args: unknown) => Promise<unknown>;
      generateContentStream: (args: unknown) => Promise<unknown>;
    };
    constructor(options: { apiKey?: string }) {
      this.models = {
        generateContent: (args: unknown) => {
          harness.usedKeys.push(String(options.apiKey));
          return generateContentMock(args);
        },
        generateContentStream: (args: unknown) => {
          harness.usedKeys.push(String(options.apiKey));
          return generateContentStreamMock(args);
        },
      };
    }
  },
}));

vi.mock('../services/knowledge', () => ({
  loadKnowledgeBase: vi.fn(async () => '# BASE DE CONHECIMENTO'),
}));

import { generateReply, streamReply, resolveApiKeys, resetKeyRotation } from '../services/gemini';

const savedEnv = { ...process.env };

function makeStream(texts: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of texts) yield { text };
    },
  };
}

function setKeys(primary: string, fallbacks = '') {
  process.env.GEMINI_API_KEY = primary;
  process.env.GEMINI_API_KEY_FALLBACKS = fallbacks;
}

beforeEach(() => {
  harness.usedKeys.length = 0;
  generateContentMock.mockReset();
  generateContentStreamMock.mockReset();
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

describe('streamReply — resposta em streaming', () => {
  it('reparte a resposta em pedaços', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentStreamMock.mockResolvedValue(makeStream(['Olá', ' mundo']));

    const pieces: string[] = [];
    for await (const piece of streamReply({ message: 'oi', history: [] })) {
      pieces.push(piece);
    }

    expect(pieces).toEqual(['Olá', ' mundo']);
  });

  it('troca de chave no 429 antes de emitir qualquer pedaço', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentStreamMock
      .mockRejectedValueOnce(new Error('429 quota exceeded'))
      .mockResolvedValueOnce(makeStream(['ok']));

    const pieces: string[] = [];
    for await (const piece of streamReply({ message: 'oi', history: [] })) {
      pieces.push(piece);
    }

    expect(pieces).toEqual(['ok']);
    expect(harness.usedKeys).toEqual(['chave-1', 'chave-2']);
  });

  it('propaga o erro de cota quando todas as chaves falham', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentStreamMock.mockRejectedValue(new Error('429 quota'));

    await expect(
      (async () => {
        for await (const _piece of streamReply({ message: 'oi', history: [] })) {
          // consome o stream
        }
      })(),
    ).rejects.toThrow('429 quota');
    expect(harness.usedKeys).toEqual(['chave-1', 'chave-2']);
  });

  it('NÃO troca de chave depois que já começou a emitir', async () => {
    setKeys('chave-1', 'chave-2');
    generateContentStreamMock.mockImplementationOnce(() => ({
      async *[Symbol.asyncIterator]() {
        yield { text: 'parcial' };
        throw new Error('429 quota no meio do stream');
      },
    }));

    await expect(
      (async () => {
        for await (const _piece of streamReply({ message: 'oi', history: [] })) {
          // consome até falhar
        }
      })(),
    ).rejects.toThrow('429 quota no meio');
    expect(generateContentStreamMock).toHaveBeenCalledTimes(1);
  });
});

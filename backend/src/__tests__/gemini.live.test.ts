import { describe, it, expect } from 'vitest';
import 'dotenv/config';
import { generateReply } from '../services/gemini';

/**
 * Repete a chamada quando a própria Gemini está instável (503 / demanda alta).
 * Este teste valida a INTEGRAÇÃO com a API — não a disponibilidade da Google.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const transient =
        message.includes('503') ||
        message.includes('UNAVAILABLE') ||
        message.includes('high demand') ||
        message.includes('overloaded');
      if (!transient || attempt === attempts - 1) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2_000 * (attempt + 1)));
    }
  }
  throw lastError;
}

// Só roda quando GEMINI_API_KEY estiver configurada (nunca committada).
describe.runIf(Boolean(process.env.GEMINI_API_KEY))('integração real com a Gemini API', () => {
  it(
    'responde uma pergunta sobre o perfil com base no conhecimento',
    async () => {
      const reply = await withRetry(() =>
        generateReply({
          message: 'Quem é Tiago Santos e quais projetos ele desenvolveu?',
          history: [],
        }),
      );
      expect(reply.length).toBeGreaterThan(30);
      expect(reply.toLowerCase()).toContain('tiago');
      expect(reply).toContain('github.com/Tyago-santos');
    },
    120_000,
  );

  it('recusa responder assunto fora do perfil', async () => {
    const reply = await withRetry(() =>
      generateReply({
        message: 'Me dê a receita de um bolo de chocolate',
        history: [],
      }),
    );
    expect(reply.toLowerCase()).toMatch(/tiago|perfil|projeto/);
  }, 120_000);
});

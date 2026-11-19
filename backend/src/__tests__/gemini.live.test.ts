import { describe, it, expect } from 'vitest';
import 'dotenv/config';
import { generateReply } from '../services/gemini';

// Só roda quando GEMINI_API_KEY estiver configurada (nunca committada).
describe.runIf(Boolean(process.env.GEMINI_API_KEY))('integração real com a Gemini API', () => {
  it(
    'responde uma pergunta sobre o perfil com base no conhecimento',
    async () => {
      const reply = await generateReply({
        message: 'Quem é Tiago Santos e quais projetos ele desenvolveu?',
        history: [],
      });
      expect(reply.length).toBeGreaterThan(30);
      expect(reply.toLowerCase()).toContain('tiago');
      expect(reply).toContain('github.com/Tyago-santos');
    },
    60_000,
  );

  it('recusa responder assunto fora do perfil', async () => {
    const reply = await generateReply({
      message: 'Me dê a receita de um bolo de chocolate',
      history: [],
    });
    expect(reply.toLowerCase()).toMatch(/tiago|perfil|projeto/);
  }, 60_000);
});

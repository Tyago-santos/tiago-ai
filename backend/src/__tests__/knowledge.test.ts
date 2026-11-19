import { describe, it, expect } from 'vitest';
import { loadKnowledgeBase } from '../services/knowledge';

describe('base de conhecimento em Markdown', () => {
  it('carrega as informações verificadas do perfil', async () => {
    const kb = await loadKnowledgeBase();
    expect(kb).toContain('Tiago Santos');
    expect(kb).toContain('Vittal Web');
    expect(kb.toLowerCase()).toContain('polearn');
    expect(kb.toLowerCase()).toContain('react');
    expect(kb).toContain('github.com/Tyago-santos');
  });

  it('não vaza arquivos internos do servidor', async () => {
    const kb = await loadKnowledgeBase();
    expect(kb).not.toContain('GEMINI_API_KEY');
    expect(kb).not.toContain('process.env');
  });
});

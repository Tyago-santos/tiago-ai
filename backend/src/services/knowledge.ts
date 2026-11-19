import { promises as fs } from 'fs';
import path from 'path';

const FILES = ['profile.md', 'projects.md', 'skills.md', 'experience.md'] as const;
const TTL_MS = 5 * 60 * 1000;

interface Cache {
  value: string;
  loadedAt: number;
}

let cache: Cache | null = null;

export function knowledgeDir(): string {
  return process.env.KNOWLEDGE_DIR || path.join(__dirname, '..', 'data');
}

/**
 * Lê a base de conhecimento (Markdown) e devolve um único contexto.
 * Os arquivos vivem apenas no servidor; nada é exposto por HTTP.
 */
export async function loadKnowledgeBase(): Promise<string> {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) {
    return cache.value;
  }

  const dir = knowledgeDir();
  const parts: string[] = [];

  for (const file of FILES) {
    const content = await fs.readFile(path.join(dir, file), 'utf8');
    parts.push(`### ${file.replace(/\.md$/, '')}\n${content.trim()}`);
  }

  const value = parts.join('\n\n');
  cache = { value, loadedAt: Date.now() };
  return value;
}

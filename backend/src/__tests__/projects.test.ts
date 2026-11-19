import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseProjectsIndex, filterProjects, type LocalProject } from '../services/projects';

const markdown = readFileSync(path.join(__dirname, '../data/projects.md'), 'utf8');

describe('índice local de projetos (projects.md)', () => {
  const projects = parseProjectsIndex(markdown);

  it('extrai todos os projetos do arquivo', () => {
    expect(projects.length).toBeGreaterThanOrEqual(10);
  });

  it('captura nome, descrição, stack e repositório', () => {
    const gnosis = projects.find((p) => p.name.includes('Gnosis IA'));
    expect(gnosis).toBeTruthy();
    expect(gnosis?.repo).toBe('https://github.com/Tyago-santos/ia_study');
    expect(gnosis?.description.toLowerCase()).toContain('estudos');
    expect(gnosis?.stack.toLowerCase()).toContain('node.js');
    expect(gnosis?.demo).toBe('https://ia-study-wheat.vercel.app');
  });

  it('suporta projetos com dois repositórios (LMA)', () => {
    const lma = projects.find((p) => p.name.includes('LMA'));
    expect(lma?.repo).toContain('project_lma');
    expect(lma?.extraRepos.length).toBeGreaterThanOrEqual(1);
  });

  it('filtra por tecnologia/tema sem retornar itens fora do assunto', () => {
    const react = filterProjects(projects, 'react');
    expect(react.length).toBeGreaterThan(0);
    expect(react.every((p) => matchesReact(p))).toBe(true);

    const nada = filterProjects(projects, 'xyz-inexistente');
    expect(nada).toEqual([]);
  });
});

function matchesReact(p: LocalProject): boolean {
  return `${p.name} ${p.description} ${p.stack}`.toLowerCase().includes('react');
}

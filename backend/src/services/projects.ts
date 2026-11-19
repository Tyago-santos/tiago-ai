export interface LocalProject {
  name: string;
  description: string;
  stack: string;
  repo: string;
  demo?: string;
  extraRepos: string[];
}

/**
 * Converte o projects.md em um índice estruturado.
 * Cada projeto vem no formato:
 *   ## N. Nome
 *   - **Campo:** valor
 */
export function parseProjectsIndex(markdown: string): LocalProject[] {
  const sections = markdown.split(/\n## /).slice(1);

  return sections
    .map((section) => {
      const [titleLine = '', ...bodyLines] = section.split('\n');
      const name = titleLine.replace(/^\d+\.\s*/, '').trim();

      const fields = new Map<string, string>();
      for (const line of bodyLines) {
        const match = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
        if (match) {
          fields.set(match[1].trim().toLowerCase(), match[2].trim());
        }
      }

      const repoField = fields.get('repositório') || fields.get('repositórios') || '';
      const urls = repoField.match(/https?:\/\/[^\s)]+/g) ?? [];
      const demoField = fields.get('demo') || fields.get('chat') || '';
      const demo = demoField.match(/https?:\/\/\S+/)?.[0];

      return {
        name,
        description: fields.get('o que é') ?? '',
        stack: fields.get('stack') ?? '',
        repo: urls[0] ?? '',
        demo,
        extraRepos: urls.slice(1),
      };
    })
    .filter((project) => project.name && project.repo);
}

/** Busca simples por nome, descrição e stack (case-insensitive). */
export function filterProjects(projects: LocalProject[], query: string): LocalProject[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return projects.filter((project) =>
    `${project.name} ${project.description} ${project.stack}`.toLowerCase().includes(term),
  );
}

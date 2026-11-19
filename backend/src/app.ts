import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ZodError, z } from 'zod';
import { createRateLimiter } from './services/rateLimit';
import { generateReply } from './services/gemini';
import { listRepositories } from './services/github';
import { parseProjectsIndex, filterProjects } from './services/projects';
import { knowledgeDir } from './services/knowledge';

const chatBodySchema = z.object({
  message: z.string().trim().min(1, 'Mensagem não pode ficar vazia').max(2000, 'Mensagem muito longa'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .max(10, 'Histórico muito longo')
    .optional()
    .default([]),
});

export interface AppOptions {
  rateLimit?: { limit: number; windowMs: number };
}

const SUGGESTIONS = [
  'Quem é Tiago Santos?',
  'Quais projetos ele já desenvolveu?',
  'Quais tecnologias ele domina?',
  'Qual a experiência dele com IA?',
  'Como entro em contato com ele?',
];

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || 'https://tyago-santos.github.io,http://localhost:5173';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  const allowedOrigins = parseAllowedOrigins();
  const rateLimit = createRateLimiter(
    options.rateLimit ?? {
      limit: Number(process.env.RATE_LIMIT_MAX || 12),
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    },
  );

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '32kb' }));
  app.use(
    cors({
      origin(origin, callback) {
        // requisições sem Origin (curl, testes de servidor) passam
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      maxAge: 600,
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/api/suggestions', (_req, res) => {
    res.status(200).json({ suggestions: SUGGESTIONS });
  });

  // Índice de projetos: GitHub ao vivo, com fallback para o projects.md local
  app.get('/api/projects', async (req, res) => {
    const tech = String(req.query.tech ?? '').trim().toLowerCase();

    try {
      const repos = await listRepositories();
      const projects = tech
        ? repos.filter((repo) =>
            `${repo.name} ${repo.description} ${repo.language} ${repo.topics.join(' ')}`
              .toLowerCase()
              .includes(tech),
          )
        : repos;
      res.status(200).json({ source: 'github', projects });
      return;
    } catch (error) {
      console.error(
        '[tiago-ai] índice do GitHub indisponível, usando o local:',
        error instanceof Error ? error.message : error,
      );
    }

    try {
      const markdown = await fs.readFile(path.join(knowledgeDir(), 'projects.md'), 'utf8');
      const local = parseProjectsIndex(markdown);
      const projects = tech ? filterProjects(local, tech) : local;
      res.status(200).json({ source: 'local', projects });
    } catch {
      res.status(503).json({ error: 'Não foi possível carregar os projetos agora.' });
    }
  });

  app.post('/api/chat', async (req, res, next) => {
    try {
      const key = req.ip || 'desconhecido';
      const limit = rateLimit(key);
      if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfterSeconds));
        res.status(429).json({ error: 'Muitas requisições. Aguarde um pouco e tente novamente.' });
        return;
      }

      const body = chatBodySchema.parse(req.body);
      const reply = await generateReply({ message: body.message, history: body.history });
      res.status(200).json({ reply });
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Recurso não encontrado' });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: 'JSON inválido' });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos' });
      return;
    }
    // nunca expor detalhes internos ao visitante
    console.error('[tiago-ai] erro na API:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'Não foi possível responder agora. Tente novamente em instantes.' });
  });

  return app;
}

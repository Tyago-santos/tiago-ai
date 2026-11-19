# 🤖 Tiago AI — Meu Assistente Virtual

Assistente de Inteligência Artificial integrado ao [perfil do GitHub de Tiago Santos](https://github.com/Tyago-santos).
O visitante conversa sobre os projetos, tecnologias e experiência dele e recebe os links dos repositórios.

- 💬 **Chat:** https://tyago-santos.github.io/tiago-ai/
- 🌐 **Perfil:** https://github.com/Tyago-santos

## Estrutura

```text
tiago-ai/
├── frontend/            # React + TypeScript + Tailwind (GitHub Pages)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
│
├── backend/             # Node.js + Express + Gemini API (Render)
│   └── src/
│       ├── routes/      # (rotas montadas em app.ts)
│       ├── services/    # gemini, knowledge, rateLimit
│       ├── data/        # base de conhecimento em Markdown
│       └── __tests__/
│
├── render.yaml          # blueprint de deploy na Render
└── README.md
```

## Funcionalidades

- Responde perguntas sobre o perfil profissional, projetos, tecnologias e experiência.
- Explica cada projeto (objetivo, funcionalidades, stack e link do repositório).
- Base de conhecimento em arquivos Markdown (`profile.md`, `projects.md`, `skills.md`, `experience.md`).
- Validação de mensagens, rate limit por IP, CORS restrito e tratamento de erros.
- Chave da Gemini API somente no backend — nunca no navegador.

## Rodando localmente

```bash
# Backend
cd backend
cp .env.example .env      # preencha GEMINI_API_KEY
npm install
npm test                  # suíte completa
npm run dev               # http://localhost:3001

# Frontend
cd ../frontend
npm install
VITE_API_URL=http://localhost:3001 npm run dev   # http://localhost:5173/tiago-ai/
```

## Variáveis de ambiente (backend)

| Variável | Descrição | Padrão |
|---|---|---|
| `GEMINI_API_KEY` | chave da API Gemini (obrigatória em produção) | — |
| `GEMINI_API_KEY_FALLBACKS` | chaves extras separadas por vírgula; o backend rotaciona quando uma atinge a cota diária | — |
| `GEMINI_MODEL` | modelo usado | `gemini-3.5-flash-lite` |
| `PORT` | porta do servidor | `3001` |
| `ALLOWED_ORIGINS` | origens liberadas no CORS | `https://tyago-santos.github.io` |
| `RATE_LIMIT_MAX` | requisições por janela | `12` |
| `RATE_LIMIT_WINDOW_MS` | janela do rate limit (ms) | `60000` |

## Deploy

- **Frontend:** GitHub Pages — workflow `.github/workflows/deploy.yml` (build + testes + publicação automática no push em `main`).
- **Backend:** Render — blueprint `render.yaml`; defina o segredo `GEMINI_API_KEY` no painel da Render.

## Segurança

- Chave da API nunca é exposta ao cliente.
- Mensagens validadas com Zod (tamanho e histórico).
- Rate limit por IP em memória.
- A base de conhecimento não é servida por HTTP.
- Erros internos não são retornados ao visitante.

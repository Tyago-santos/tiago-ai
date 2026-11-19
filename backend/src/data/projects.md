# Projetos de Tiago Santos

Cada projeto abaixo tem: objetivo, funcionalidades, tecnologias e link.

---

## 1. Gnosis IA (ia_study)
- **Repositório:** https://github.com/Tyago-santos/ia_study
- **Demo:** https://ia-study-wheat.vercel.app
- **O que é:** plataforma de estudos com Inteligência Artificial. O usuário envia o conteúdo que quer estudar e a IA gera materiais de estudo a partir dele.
- **Stack:** Node.js, PostgreSQL, React e React Native (aplicação web + mobile), TypeScript.
- **Status:** em evolução.

## 2. Polearn
- **Repositório:** https://github.com/Tyago-santos/polearn
- **Demo:** https://polearn.onrender.com
- **O que é:** app web para aprender diversos idiomas de forma prática e intuitiva, com questões geradas por Inteligência Artificial. O objetivo é ajudar pessoas a estudar idiomas com consistência, transformando o estudo em uma rotina leve de leitura e escrita.
- **Funcionalidades:** atividades práticas de leitura e escrita, questões geradas por IA, evolução contínua no dia a dia.
- **Stack:** React 19, TypeScript, Vite, TanStack Router, Tailwind CSS 4, Lucide React, ESLint.

## 3. Connect Dev
- **Repositório:** https://github.com/Tyago-santos/connect-dev
- **Demo:** https://connect-dev-lm7e.onrender.com
- **O que é:** rede social de estudos para desenvolvedores, construída em Node.js/Express com views server-side Mustache.
- **Funcionalidades:** cadastro/login com sessão e hash de senha (bcryptjs); perfil com edição de dados, avatar e capa enviados ao Supabase Storage; feed de posts com curtidas e comentários; seguir/seguindo e pesquisa de usuários; flash messages de feedback.
- **Arquitetura:** camadas Controller → Service → Repository → banco de dados; views Mustache com partials; sessão com express-session (store MySQL ou Postgres); segurança com Helmet e validação com Zod.
- **Stack:** Node.js, Express, TypeScript, Mustache, MySQL/PostgreSQL, Supabase Storage.

## 4. Promise
- **Repositório:** https://github.com/Tyago-santos/promise
- **Demo:** https://promise-8s8f.onrender.com
- **O que é:** web app de relacionamento para fazer novas amizades e conhecer pessoas dentro de uma comunidade com valores cristãos.
- **Funcionalidades:** criação e gerenciamento de perfil; explorar e conhecer novas pessoas; interface moderna e responsiva; upload e compressão de imagens de perfil; chat em tempo real (Socket.IO); navegação fluida e otimizada.
- **Arquitetura:** monorepo com backend (API REST) e frontend (SPA) separados, cada um com seu próprio package.json; infra com Docker Compose e pnpm.
- **Stack:** Front: React, TypeScript, Vite, TanStack Router/Query, Tailwind CSS 4, React Hook Form, Zustand, Swiper. Back: Node.js + Express, Prisma ORM + PostgreSQL, Socket.IO, JWT + bcrypt, Zod, Multer.

## 5. Pergunta da Igreja SUD (projeto-quiz-sud)
- **Repositório:** https://github.com/Tyago-santos/projeto-quiz-sud
- **Demo:** https://projeto-quiz-sud.vercel.app
- **O que é:** plataforma interativa de quizzes com IA (Google Gemini) para aprender sobre as escrituras sagradas. A IA gera perguntas dinâmicas e o usuário testa seu conhecimento por categoria, com pontuação e ranking.
- **Funcionalidades:** autenticação com Firebase; categorias de estudo (Livro de Mórmon, Doutrina e Convênios, Pérola de Grande Valor, Velho e Novo Testamento); geração automática de perguntas com 4 alternativas; feedback imediato; estatísticas e rankings por tema.
- **Stack:** Next.js 14 (App Router), React 18, Tailwind CSS, Context API, Redux, Firebase Auth, Firestore, Google Gemini API, Zod.

## 6. Quiz AI (quiz_agent)
- **Repositório:** https://github.com/Tyago-santos/quiz_agent
- **Demo:** https://quiz-agent-brown.vercel.app
- **O que é:** aplicação full-stack que usa Google Gemini via LangGraph para classificar e responder perguntas escolares como um professor especialista. O usuário faz uma pergunta, a IA classifica a matéria (matemática, português, história ou geografia) e responde no papel de um professor da disciplina.
- **Funcionalidades:** autenticação JWT (registro/login); agente inteligente que classifica em 4 matérias; proteção de rotas; histórico de perguntas e respostas persistido no PostgreSQL; tratamento amigável de erros (429 e 503).
- **Stack:** Backend Python 3.12 com FastAPI, LangChain, LangGraph, Gemini 2.5-flash, SQLAlchemy e PostgreSQL; frontend Next.js 16 + React 19 + TypeScript + Tailwind 4 com Vitest/Testing Library; infra com Docker Compose e deploy na Render (Blueprint).

## 7. Report City
- **Repositório:** https://github.com/Tyago-santos/report_city
- **Backend:** https://github.com/Tyago-santos/report_city-backend
- **O que é:** plataforma colaborativa para reportar e acompanhar problemas urbanos (buracos, iluminação quebrada, lixo, alagamentos, semáforos com defeito). Foi a atividade extensionista da faculdade.
- **Funcionalidades:** criar reportes com foto, localização e descrição; feed de reportes da cidade; curtir, descurtir e comentar; seguir a resolução de um reporte; autenticação com validação de formulários.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI, Lucide, React Hook Form, Zod; testes com Vitest e Testing Library; Docker e GitHub Actions (CI/CD).

## 8. Dev Canil
- **Repositório:** https://github.com/Tyago-santos/dev-canil
- **O que é:** sistema web monolítico de gerenciamento e adoção de animais de estimação.
- **Funcionalidades:** listagem de pets disponíveis para adoção; cadastro e autenticação de usuários; formulário de adoção; upload de imagens dos pets; busca de animais; área restrita para usuários autenticados.
- **Stack:** Node.js, Express, TypeScript, MySQL (mysql2), Mustache, bcrypt, helmet, express-session, zod, multer.

## 9. LMA — Acompanhamento de Pessoas (project_lma + lma-mobile)
- **Repositórios:** https://github.com/Tyago-santos/project_lma (web) e https://github.com/Tyago-santos/lma-mobile (mobile)
- **O que é:** sistema para relatar e acompanhar o progresso das pessoas atendidas pelos missionários da Igreja de Jesus Cristo dos Santos dos Últimos Dias.
- **Funcionalidades:** visualizar evolução pessoal; acompanhar metas e planos; conferir desempenho semanal; organizar por unidade da igreja; monitorar o trabalho dos missionários em tempo real; app mobile (Expo) para inserir planos e metas durante visitas, sincronizando com a web.
- **Stack:** Web: React + Vite, Styled-components, Redux Toolkit, React Router. Mobile: React Native com Expo, Redux Toolkit, React Router. Banco: Firebase.

## 10. Portfólio pessoal (portfolio)
- **Repositório:** https://github.com/Tyago-santos/portfolio
- **Demo:** https://portfolio-tiago-kjf4.onrender.com
- **O que é:** site pessoal de página única escrito à mão em HTML, CSS e JavaScript — sem framework, sem build e sem CDN em runtime. Apresenta quem ele é, o que constrói e os projetos publicados com link ao vivo e repositório.
- **Direção visual:** sistema editorial com base clara (#f9f9f7) alternando com faixas escuras (#0a0a0c), tipografia grande, seções numeradas, granulado sutil, marquee e faixa de stack com rolagem horizontal. Fontes Space Grotesk, Inter e JetBrains Mono self-hosted.
- **Movimento:** animações progressivas desligadas em prefers-reduced-motion, parallax, revelação por recorte, preloader da primeira visita — tudo em JS vanilla com requestAnimationFrame.
- **Testes:** suíte de integridade, estrutura, conteúdo e movimento em Node.js puro (node --test), sem dependências.

## 11. Tiago AI (este chat)
- **Repositório:** https://github.com/Tyago-santos/tiago-ai
- **Chat:** https://tyago-santos.github.io/tiago-ai/
- **O que é:** assistente virtual que responde sobre o perfil, projetos e experiência de Tiago Santos. Frontend em React + TypeScript + Tailwind publicado no GitHub Pages; backend em Node.js + Express com Gemini API hospedado na Render; base de conhecimento em arquivos Markdown.

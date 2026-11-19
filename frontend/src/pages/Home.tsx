import { Link } from 'react-router-dom';
import { TiagoAiCard } from '../components/TiagoAiCard';

const TYPING_BANNER =
  'https://readme-typing-svg.herokuapp.com/?color=00ff00&size=28&center=true&vCenter=true&width=600&lines=Olá+👋,+eu+sou+Tiago+Santos;Desenvolvedor+Full+Stack+e+IA;Pergunte+ao+Tiago+AI+sobre+meus+projetos🚀';

const AVATAR = 'https://avatars.githubusercontent.com/u/222115985?v=4';

const PROFILE_BADGES = [
  {
    alt: 'LinkedIn',
    href: 'https://www.linkedin.com/in/tiago-santos-b10165376/',
    src: 'https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white',
  },
  {
    alt: 'Portfólio',
    href: 'https://portfolio-tiago-kjf4.onrender.com',
    src: 'https://img.shields.io/badge/Portfólio-000000?style=for-the-badge&logo=vercel&logoColor=white',
  },
  {
    alt: 'Localização',
    href: null,
    src: 'https://img.shields.io/badge/📍-Vitória%20da%20Conquista%20%E2%80%93%20BA-2ea44f?style=for-the-badge',
  },
];

const TECH_BADGES = [
  {
    alt: 'Gemini API',
    src: 'https://img.shields.io/badge/Gemini_API-0D1117?style=for-the-badge&logo=googlegemini&logoColor=4285F4',
  },
  {
    alt: 'React',
    src: 'https://img.shields.io/badge/React-0D1117?style=for-the-badge&logo=react&logoColor=61DAFB',
  },
  {
    alt: 'Node.js',
    src: 'https://img.shields.io/badge/Node.js-0D1117?style=for-the-badge&logo=nodedotjs&logoColor=339933',
  },
  {
    alt: 'Render',
    src: 'https://img.shields.io/badge/Render-0D1117?style=for-the-badge&logo=render&logoColor=white',
  },
  {
    alt: 'GitHub Pages',
    src: 'https://img.shields.io/badge/GitHub_Pages-0D1117?style=for-the-badge&logo=githubpages&logoColor=white',
  },
];

export default function Home() {
  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-surface/60 px-4 py-3">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <img src={AVATAR} alt="Tiago Santos" className="h-7 w-7 rounded-full border border-line" />
          <span className="text-sm font-semibold text-heading">Tiago Santos</span>
          <span className="text-sm text-muted">@Tyago-santos</span>
          <a
            href="https://github.com/Tyago-santos"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs text-muted transition hover:text-accent-blue"
          >
            Ver perfil no GitHub →
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="flex justify-center">
          <img src={TYPING_BANNER} alt="Tiago Santos — Desenvolvedor Full Stack e IA" className="max-w-full" />
        </div>

        <section className="mt-8 flex flex-col items-center gap-4 border-b border-line pb-8 sm:flex-row sm:items-center">
          <img
            src={AVATAR}
            alt="Avatar de Tiago Santos"
            className="h-24 w-24 rounded-full border-2 border-accent-green"
          />
          <div>
            <h2 className="text-2xl font-bold text-heading">Tiago Santos</h2>
            <p className="text-sm text-muted">Desenvolvedor Full Stack &amp; IA · Sistemas de Informação – UNEX</p>
            <p className="mt-1 text-sm text-muted">Vitória da Conquista – BA</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROFILE_BADGES.map((badge) =>
                badge.href ? (
                  <a key={badge.alt} href={badge.href} target="_blank" rel="noreferrer">
                    <img src={badge.src} alt={badge.alt} height={28} loading="lazy" />
                  </a>
                ) : (
                  <img key={badge.alt} src={badge.src} alt={badge.alt} height={28} loading="lazy" />
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-heading">🤖 Tiago AI</h1>
            <p className="mt-1 text-lg font-semibold text-accent-green">Meu Assistente Virtual</p>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              Pergunte sobre meus <strong className="text-heading">projetos</strong>,{' '}
              <strong className="text-heading">tecnologias</strong> e{' '}
              <strong className="text-heading">experiência</strong>. Eu respondo com base no meu perfil e
              trago os links dos repositórios.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-green px-5 py-3 text-sm font-semibold text-canvas transition hover:brightness-110"
              >
                💬 Conversar agora
              </Link>
              <a
                href="https://github.com/Tyago-santos?tab=repositories"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-semibold text-heading transition hover:border-accent-blue"
              >
                📂 Ver repositórios
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {TECH_BADGES.map((badge) => (
                <img key={badge.alt} src={badge.src} alt={badge.alt} height={28} loading="lazy" />
              ))}
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <TiagoAiCard />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        ⭐ <strong className="text-heading">Obrigado por visitar meu perfil</strong> ⭐
        <br />
        <span>Feito com 💚 por Tiago Santos</span>
      </footer>
    </div>
  );
}

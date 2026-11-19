import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChatInput } from '../components/ChatInput';
import { ChatMessage, type Message } from '../components/ChatMessage';
import { SuggestionChips } from '../components/SuggestionChips';
import { fetchSuggestions, sendChat, type ChatTurn } from '../services/api';

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `msg-${idCounter}`;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSuggestions()
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) return;

    const history: ChatTurn[] = messages.slice(-6).map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      content: item.content,
    }));

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: message }]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const reply = await sendChat(message, history);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível responder agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-line bg-surface/60 px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <img
            src="https://avatars.githubusercontent.com/u/222115985?v=4"
            alt="Tiago Santos"
            className="h-7 w-7 rounded-full border border-line"
          />
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-heading">Tiago Santos</span>
            <span className="block text-xs text-muted">@Tyago-santos</span>
          </div>
          <Link to="/" className="ml-auto text-sm text-muted transition hover:text-accent-blue">
            ← Início
          </Link>
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-green" aria-hidden="true" />
            online
          </span>
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-2xl items-center justify-between">
          <h1 className="text-base font-bold text-heading">🤖 Tiago AI — Converse comigo</h1>
          <a
            href="https://github.com/Tyago-santos"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted transition hover:text-accent-blue"
          >
            Ver perfil no GitHub →
          </a>
        </div>
      </header>

      <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
              Pergunte sobre os projetos, tecnologias e a experiência de Tiago Santos. Exemplo:{' '}
              <span className="text-accent-blue">“Quais projetos ele desenvolveu com IA?”</span>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {loading && (
            <div role="status" className="text-sm text-muted">
              Tiago AI está digitando
              <span className="animate-pulse">…</span>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-[#f85149]/40 bg-[#f85149]/10 px-3 py-2 text-sm text-[#ff7b72]">
              {error}
            </div>
          )}

          {messages.length === 0 && !loading && (
            <SuggestionChips suggestions={suggestions} onSelect={setInput} />
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-line px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={loading} />
          <p className="mt-2 text-center text-[11px] text-muted">
            <kbd className="rounded border border-line bg-subtle px-1 py-0.5 text-[10px]">Enter</kbd> envia ·{' '}
            <kbd className="rounded border border-line bg-subtle px-1 py-0.5 text-[10px]">Shift</kbd>+
            <kbd className="rounded border border-line bg-subtle px-1 py-0.5 text-[10px]">Enter</kbd> quebra linha
          </p>
          <p className="mt-1 text-center text-[11px] text-muted">
            As respostas usam a base pública do perfil de Tiago Santos.
          </p>
        </div>
      </footer>
    </div>
  );
}

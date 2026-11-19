export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export async function sendChat(message: string, history: ChatTurn[]): Promise<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const data = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível responder agora. Tente novamente em instantes.');
  }

  return data.reply ?? '';
}

/**
 * Envia a pergunta e recebe a resposta em pedaços (SSE).
 * onDelta é chamado a cada pedaço com o texto acumulado até o momento.
 */
export async function sendChatStream(
  message: string,
  history: ChatTurn[],
  onDelta: (fullText: string) => void,
): Promise<string> {
  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'Não foi possível responder agora. Tente novamente em instantes.');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Não foi possível responder agora. Tente novamente em instantes.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const line = event.split('\n').find((part) => part.startsWith('data:'));
      if (!line) continue;

      const payload = JSON.parse(line.slice(5).trim()) as {
        delta?: string;
        error?: string;
        done?: boolean;
      };

      if (payload.error) {
        throw new Error(payload.error);
      }
      if (payload.delta) {
        fullText += payload.delta;
        onDelta(fullText);
      }
    }
  }

  return fullText;
}

export async function fetchSuggestions(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/suggestions`);
  const data = (await response.json().catch(() => ({}))) as { suggestions?: unknown };
  return Array.isArray(data.suggestions) ? (data.suggestions as string[]) : [];
}

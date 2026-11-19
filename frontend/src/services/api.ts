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

export async function fetchSuggestions(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/suggestions`);
  const data = (await response.json().catch(() => ({}))) as { suggestions?: unknown };
  return Array.isArray(data.suggestions) ? (data.suggestions as string[]) : [];
}

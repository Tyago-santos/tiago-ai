import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

const fetchMock = vi.fn();

function jsonResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => data } as Response;
}

async function openChat(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('link', { name: /conversar agora/i }));
}

beforeEach(() => {
  window.location.hash = '';
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/suggestions')) {
      return jsonResponse({ suggestions: ['Quem é Tiago Santos?', 'Quais projetos ele fez?'] });
    }
    return jsonResponse({ reply: 'Resposta padrão de teste.' });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tiago AI — chat', () => {
  it('envia a pergunta e exibe a resposta do assistente', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const input = screen.getByPlaceholderText(/sua pergunta/i);
    await user.type(input, 'Quem é você?');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/Resposta padrão de teste\./)).toBeTruthy();
    expect(screen.getByText('Quem é você?')).toBeTruthy();
  });

  it('mostra estado de carregamento enquanto espera a IA', async () => {
    const user = userEvent.setup();
    let resolveChat: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/suggestions')) {
        return Promise.resolve(jsonResponse({ suggestions: ['sugestão'] }));
      }
      return new Promise<Response>((resolve) => {
        resolveChat = resolve;
      });
    });

    await openChat(user);
    await user.type(screen.getByPlaceholderText(/sua pergunta/i), 'oi');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(screen.getByText(/digitando/i)).toBeTruthy();

    resolveChat?.(jsonResponse({ reply: 'Olá! Eu sou o Tiago AI.' }));
    expect(await screen.findByText(/Olá! Eu sou o Tiago AI\./)).toBeTruthy();
  });

  it('exibe mensagem de erro quando a API falha', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/suggestions')) {
        return jsonResponse({ suggestions: ['sugestão'] });
      }
      return jsonResponse({ error: 'Não foi possível responder agora. Tente novamente em instantes.' }, false, 503);
    });

    await openChat(user);
    await user.type(screen.getByPlaceholderText(/sua pergunta/i), 'oi');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(await screen.findByText(/não foi possível responder/i)).toBeTruthy();
  });

  it('mantém o botão de envio desabilitado com a entrada vazia', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const button = screen.getByRole('button', { name: /enviar/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    await user.type(screen.getByPlaceholderText(/sua pergunta/i), '   ');
    expect((screen.getByRole('button', { name: /enviar/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('sugere perguntas e preenche a entrada ao clicar', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const chip = await screen.findByRole('button', { name: /quem é tiago santos/i });
    await user.click(chip);
    expect((screen.getByPlaceholderText(/sua pergunta/i) as HTMLTextAreaElement).value).toContain(
      'Quem é Tiago Santos?',
    );
  });
});

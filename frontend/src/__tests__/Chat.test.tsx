import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

  it('envia com Enter e apenas quebra linha com Shift+Enter', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const input = screen.getByPlaceholderText(/sua pergunta/i) as HTMLTextAreaElement;

    await user.type(input, 'oi{enter}');
    expect(await screen.findByText('oi')).toBeTruthy();
    expect(input.value).toBe('');

    await user.type(input, 'linha um{shift>}{enter}{/shift}linha dois');
    expect(input.value).toContain('\n');
    // a mensagem não foi para a conversa (fica só na caixa de entrada)
    expect(within(screen.getByRole('main')).queryByText(/linha um/)).toBeNull();
  });

  it('mantém o botão de envio desabilitado com a entrada vazia', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const button = screen.getByRole('button', { name: /enviar/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    await user.type(screen.getByPlaceholderText(/sua pergunta/i), '   ');
    expect((screen.getByRole('button', { name: /enviar/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('formata a resposta em Markdown (negrito, lista e link clicável)', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/suggestions')) {
        return jsonResponse({ suggestions: ['sugestão'] });
      }
      return jsonResponse({
        reply:
          'Tiago tem vários projetos que usam Node.js:\n\n' +
          '*   **Gnosis IA (ia_study)**: plataforma de estudos com IA. Repositório: https://github.com/Tyago-santos/ia_study\n' +
          '*   **Connect Dev**: rede social de estudos.',
      });
    });

    await openChat(user);
    await user.type(screen.getByPlaceholderText(/sua pergunta/i), 'Quais projetos usam Node.js?');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    // negrito renderizado como <strong>, não como texto "**"
    expect(await screen.findByText('Gnosis IA (ia_study)', { selector: 'strong' })).toBeTruthy();
    // lista renderizada como <ul>/<li>
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
    // link clicável e aberto em nova aba
    const link = screen.getByRole('link', { name: /github\.com\/Tyago-santos\/ia_study/i });
    expect(link.getAttribute('href')).toContain('https://github.com/Tyago-santos/ia_study');
    expect(link.getAttribute('target')).toBe('_blank');
    // a sintaxe crua do Markdown não aparece para o visitante
    expect(document.body.textContent).not.toContain('**');
    expect(document.body.textContent).not.toContain('*   ');
  });

  it('mantém o scroll apenas na área de mensagens, sem rolar a página inteira', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const main = screen.getByRole('main');
    expect(main.className).toContain('overflow-y-auto');

    const root = main.parentElement as HTMLElement;
    expect(root.className).toContain('overflow-hidden');
    expect(root.className).toContain('h-dvh');
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

const fetchMock = vi.fn();

function jsonResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => data } as Response;
}

function sseResponse(events: unknown[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function sseFromStream(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function createOpenStream(): {
  stream: ReadableStream<Uint8Array>;
  controller: () => ReadableStreamDefaultController<Uint8Array> | undefined;
} {
  let ctrl: ReadableStreamDefaultController<Uint8Array> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      ctrl = controller;
    },
  });
  return { stream, controller: () => ctrl };
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
    return sseResponse([{ delta: 'Resposta padrão de teste.' }, { done: true }]);
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
    const open = createOpenStream();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/suggestions')) {
        return Promise.resolve(jsonResponse({ suggestions: ['sugestão'] }));
      }
      return Promise.resolve(sseFromStream(open.stream));
    });

    await openChat(user);
    await user.type(screen.getByPlaceholderText(/sua pergunta/i), 'oi');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    expect(screen.getByText(/digitando/i)).toBeTruthy();

    open.controller()?.enqueue(new TextEncoder().encode('data: {"delta":"Olá! Eu sou o Tiago AI."}\n\n'));
    open.controller()?.close();
    expect(await screen.findByText(/Olá! Eu sou o Tiago AI\./)).toBeTruthy();
  });

  it('mostra a resposta progressivamente, antes do stream terminar', async () => {
    const user = userEvent.setup();
    const open = createOpenStream();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/suggestions')) {
        return Promise.resolve(jsonResponse({ suggestions: ['sugestão'] }));
      }
      return Promise.resolve(sseFromStream(open.stream));
    });

    await openChat(user);
    await user.type(screen.getByPlaceholderText(/sua pergunta/i), 'oi');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    const encoder = new TextEncoder();
    open.controller()?.enqueue(encoder.encode('data: {"delta":"Resposta parcial"}\n\n'));

    // o texto parcial aparece com o stream ainda aberto
    expect(await screen.findByText(/Resposta parcial/)).toBeTruthy();
    expect(screen.queryByText(/e final/)).toBeNull();

    open.controller()?.enqueue(encoder.encode('data: {"delta":" e final"}\n\n'));
    open.controller()?.close();

    expect(await screen.findByText(/Resposta parcial e final/)).toBeTruthy();
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
      return sseResponse([
        {
          delta:
            'Tiago tem vários projetos que usam Node.js:\n\n' +
            '*   **Gnosis IA (ia_study)**: plataforma de estudos com IA. Repositório: https://github.com/Tyago-santos/ia_study\n' +
            '*   **Connect Dev**: rede social de estudos.',
        },
        { done: true },
      ]);
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

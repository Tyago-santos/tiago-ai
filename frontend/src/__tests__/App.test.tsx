import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Tiago AI — apresentação', () => {
  it('apresenta o assistente e o CTA para o chat', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /tiago ai/i })).toBeTruthy();
    expect(screen.getByText(/assistente virtual/i)).toBeTruthy();
    const cta = screen.getByRole('link', { name: /conversar agora/i });
    expect(cta.getAttribute('href')).toBe('#/chat');
  });

  it('exibe as tecnologias usadas no assistente', () => {
    render(<App />);
    expect(screen.getByAltText(/gemini/i)).toBeTruthy();
    expect(screen.getByAltText(/react/i)).toBeTruthy();
    expect(screen.getByAltText(/node\.js/i)).toBeTruthy();
  });

  it('navega para o chat ao clicar no CTA', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: /conversar agora/i }));
    expect(await screen.findByRole('heading', { name: /converse comigo/i })).toBeTruthy();
  });
});

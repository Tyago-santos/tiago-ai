import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from '../services/rateLimit';

describe('rate limit em memória', () => {
  it('permite as primeiras requisições dentro da janela', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(limiter('ip-1').allowed).toBe(true);
    expect(limiter('ip-1').allowed).toBe(true);
    expect(limiter('ip-1').allowed).toBe(true);
  });

  it('bloqueia acima do limite informando retryAfter', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter('ip-2');
    limiter('ip-2');
    const third = limiter('ip-2');
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('não mistura contadores de IPs diferentes', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter('ip-a').allowed).toBe(true);
    expect(limiter('ip-b').allowed).toBe(true);
    expect(limiter('ip-a').allowed).toBe(false);
  });

  it('libera a cota após a janela expirar', () => {
    vi.useFakeTimers();
    try {
      const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
      expect(limiter('ip-c').allowed).toBe(true);
      expect(limiter('ip-c').allowed).toBe(false);
      vi.advanceTimersByTime(1_001);
      expect(limiter('ip-c').allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

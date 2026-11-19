export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Contador por chave em memória (janela fixa).
 * Suficiente para o MVP: sem dependências externas e com estado por instância.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  return (key: string): RateLimitResult => {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      if (buckets.size > 1_000) {
        for (const [k, b] of buckets) {
          if (b.resetAt <= now) buckets.delete(k);
        }
      }
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

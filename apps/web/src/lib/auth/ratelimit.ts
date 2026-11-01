const buckets = new Map<string, { n: number; reset: number }>();
/** Límite en memoria (una sola instancia). true = permitido. */
export function allow(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
  return ++b.n <= max;
}
export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';

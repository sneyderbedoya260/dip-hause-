import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { authTokens } from '@/db/schema';

const h = (t: string) => createHash('sha256').update(t).digest('hex');
/** Crea un token de un solo uso (se guarda solo su hash). Invalida los anteriores del usuario. */
export async function createResetToken(userId: string, ttlMs: number) {
  const token = randomBytes(32).toString('base64url');
  await db.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.type, 'reset'), isNull(authTokens.usedAt)));
  await db.insert(authTokens).values({ userId, type: 'reset', tokenHash: h(token), expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}
export async function consumeResetToken(token: string) {
  const [t] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, h(token)), eq(authTokens.type, 'reset')));
  if (!t || t.usedAt || t.expiresAt.getTime() < Date.now()) return null;
  const used = await db.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.id, t.id), isNull(authTokens.usedAt))).returning({ id: authTokens.id });
  return used.length ? t.userId : null; // la condición isNull evita usarlo dos veces en paralelo
}

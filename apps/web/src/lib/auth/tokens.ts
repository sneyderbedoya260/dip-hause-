import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { authTokens } from '@/db/schema';

type TokenType = 'reset' | 'verify' | 'mfa';
const h = (t: string) => createHash('sha256').update(t).digest('hex');
/** Crea un token de un solo uso (se guarda solo su hash). Invalida los anteriores del mismo tipo y usuario. */
export async function createToken(userId: string, type: TokenType, ttlMs: number) {
  const token = randomBytes(32).toString('base64url');
  await db.delete(authTokens).where(and(eq(authTokens.userId, userId), eq(authTokens.type, type), isNull(authTokens.usedAt)));
  await db.insert(authTokens).values({ userId, type, tokenHash: h(token), expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}
export const createResetToken = (userId: string, ttlMs: number) => createToken(userId, 'reset', ttlMs);
/** Consume el token (una sola vez). Devuelve el id del usuario o null. */
export async function consumeToken(token: string, type: TokenType) {
  const [t] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, h(token)), eq(authTokens.type, type)));
  if (!t || t.usedAt || t.expiresAt.getTime() < Date.now()) return null;
  const used = await db.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.id, t.id), isNull(authTokens.usedAt))).returning({ id: authTokens.id });
  return used.length ? t.userId : null;
}
export const consumeResetToken = (token: string) => consumeToken(token, 'reset');
/** Para el 2.º paso del login: mira el token sin consumirlo y cuenta el intento (máx. 5). */
export async function peekToken(token: string, type: TokenType) {
  const [t] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, h(token)), eq(authTokens.type, type)));
  if (!t || t.usedAt || t.expiresAt.getTime() < Date.now() || t.attempts >= 5) return null;
  await db.update(authTokens).set({ attempts: sql`${authTokens.attempts} + 1` }).where(eq(authTokens.id, t.id));
  return t;
}
export const burnToken = (id: string) => db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, id));

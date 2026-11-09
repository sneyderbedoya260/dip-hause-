import { createHash, randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { clientIp } from './ratelimit';

export type Audience = 'staff' | 'customer';
export type Role = 'admin' | 'employee' | 'customer';
export type AuthUser = { id: string; email: string; name: string; phone: string; role: Role; emailVerified: boolean; totpEnabled: boolean };

const prod = process.env.NODE_ENV === 'production';
// Personal: sesión corta (4 h sin actividad, 12 h máx). Clientes: 14 días / 90 días.
const CFG = { staff: { idle: 4 * 3600e3, abs: 12 * 3600e3 }, customer: { idle: 14 * 86400e3, abs: 90 * 86400e3 } };
export const cookieName = (a: Audience) => `${prod ? '__Host-' : ''}${a === 'staff' ? 'dh_s' : 'dh_c'}`;
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export async function createSession(userId: string, aud: Audience, req: Request) {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  await db.insert(sessions).values({
    id: hashToken(token), userId, audience: aud, createdAt: new Date(now), lastSeenAt: new Date(now),
    expiresAt: new Date(now + CFG[aud].idle), absoluteExpiresAt: new Date(now + CFG[aud].abs),
    ip: clientIp(req), userAgent: (req.headers.get('user-agent') ?? '').slice(0, 200),
  });
  return token;
}
export function setSessionCookie(res: NextResponse, aud: Audience, token: string) {
  res.cookies.set(cookieName(aud), token, { httpOnly: true, secure: prod, sameSite: aud === 'staff' ? 'strict' : 'lax', path: '/', maxAge: CFG[aud].abs / 1000 });
}
export const clearSessionCookie = (res: NextResponse, aud: Audience) => res.cookies.set(cookieName(aud), '', { httpOnly: true, secure: prod, path: '/', maxAge: 0 });

export async function resolveSession(token: string, aud?: Audience): Promise<{ user: AuthUser; audience: Audience } | null> {
  const [row] = await db.select({ s: sessions, u: users }).from(sessions).innerJoin(users, eq(users.id, sessions.userId)).where(eq(sessions.id, hashToken(token)));
  if (!row) return null;
  const now = Date.now(), { s, u } = row;
  if (s.expiresAt.getTime() < now || s.absoluteExpiresAt.getTime() < now) { await db.delete(sessions).where(eq(sessions.id, s.id)); return null; }
  if ((aud && s.audience !== aud) || !u.active) return null;
  if ((s.audience === 'staff') === (u.role === 'customer')) return null; // el rol debe coincidir con el tipo de sesión
  if (now - s.lastSeenAt.getTime() > 5 * 60e3)
    await db.update(sessions).set({ lastSeenAt: new Date(now), expiresAt: new Date(Math.min(now + CFG[s.audience].idle, s.absoluteExpiresAt.getTime())) }).where(eq(sessions.id, s.id));
  return { user: { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, emailVerified: !!u.emailVerifiedAt, totpEnabled: !!u.totpEnabledAt }, audience: s.audience };
}
export const revokeSession = (token: string) => db.delete(sessions).where(eq(sessions.id, hashToken(token)));
/** Cierra todas las sesiones de un usuario (cambio de clave, desactivación). `except` conserva la actual. */
export const revokeUserSessions = (userId: string, exceptToken?: string) =>
  db.delete(sessions).where(exceptToken ? and(eq(sessions.userId, userId), ne(sessions.id, hashToken(exceptToken))) : eq(sessions.userId, userId));

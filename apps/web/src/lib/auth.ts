import { SignJWT, jwtVerify } from 'jose';
import { fail } from './http';

const key = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me');
export const COOKIE = 'dh_admin';

export const signAdmin = () => new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key());

/** Acepta `Authorization: Bearer <token>` (app móvil) o la cookie httpOnly (web). */
export async function requireAdmin(req: Request) {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const cookie = req.headers.get('cookie')?.match(new RegExp(`${COOKIE}=([^;]+)`))?.[1];
  const token = bearer || cookie;
  if (!token) throw fail('No autorizado', 401);
  try { await jwtVerify(token, key()); } catch { throw fail('Sesión inválida', 401); }
}

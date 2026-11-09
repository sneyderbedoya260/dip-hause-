import { cookies } from 'next/headers';
import { fail } from '@/lib/http';
import { Audience, AuthUser, Role, cookieName, resolveSession } from './session';

/** Defensa CSRF para peticiones con cookie: el origen debe ser el de la app. */
export function checkOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const origin = req.headers.get('origin');
  const allowed = new URL(process.env.APP_URL ?? 'http://localhost:3000').origin;
  if (origin) { if (origin !== allowed && !(process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin))) throw fail('Origen no permitido', 403); return; }
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') throw fail('Origen no permitido', 403);
}

const cookieOf = (req: Request, name: string) => req.headers.get('cookie')?.split(/;\s*/).find(c => c.startsWith(name + '='))?.slice(name.length + 1);

export type Auth = { user: AuthUser; audience: Audience; via: 'cookie' | 'bearer'; token: string };
/** Acepta cookie (web) o `Authorization: Bearer` (app móvil). */
export async function getAuth(req: Request): Promise<Auth | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)/i)?.[1];
  const tries: [string | undefined, Audience | undefined, 'cookie' | 'bearer'][] = [
    [cookieOf(req, cookieName('staff')), 'staff', 'cookie'], [cookieOf(req, cookieName('customer')), 'customer', 'cookie'], [bearer, undefined, 'bearer'],
  ];
  for (const [token, aud, via] of tries) {
    if (!token) continue;
    const r = await resolveSession(token, aud);
    if (r) return { ...r, via, token };
  }
  return null;
}
export const REQUIRE_2FA = () => process.env.REQUIRE_2FA === 'true';
export async function requireRole(req: Request, roles: Role[], opts: { allowNoMfa?: boolean } = {}) {
  const a = await getAuth(req);
  if (!a) throw fail('No autorizado', 401);
  if (!roles.includes(a.user.role)) throw fail('Sin permiso', 403);
  if (a.audience === 'staff' && REQUIRE_2FA() && !a.user.totpEnabled && !opts.allowNoMfa) throw Response.json({ error: 'Debes activar la verificación en dos pasos para usar el panel', code: 'MFA_SETUP_REQUIRED' }, { status: 403 });
  if (a.via === 'cookie') checkOrigin(req);
  return a;
}
/** Para páginas del servidor (redirigir si no hay sesión). */
export async function serverUser(aud: Audience) {
  const t = cookies().get(cookieName(aud))?.value;
  return t ? (await resolveSession(t, aud))?.user ?? null : null;
}

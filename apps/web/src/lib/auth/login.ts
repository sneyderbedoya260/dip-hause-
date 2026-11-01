import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { LoginInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { fail } from '@/lib/http';
import { checkOrigin } from './guard';
import { fakeVerify, verifyPassword } from './password';
import { allow, clientIp } from './ratelimit';
import { Audience, createSession, setSessionCookie } from './session';

const GENERIC = 'Correo o contraseña incorrectos';
const MAX_FAILS = 5;

/** Inicio de sesión. Los clientes y el personal tienen endpoints, cookies y sesiones separadas. */
export async function loginFlow(req: Request, aud: Audience) {
  checkOrigin(req);
  const ip = clientIp(req);
  if (!allow(`login:ip:${ip}`, 30, 15 * 60e3)) return fail('Demasiados intentos. Espera unos minutos.', 429);
  const { email, password } = LoginInput.parse(await req.json());
  if (!allow(`login:${aud}:${email}`, 8, 15 * 60e3)) return fail('Demasiados intentos. Espera unos minutos.', 429);

  const [u] = await db.select().from(users).where(eq(users.email, email));
  const roleOk = !!u && (aud === 'staff' ? u.role !== 'customer' : u.role === 'customer');
  const locked = !!u?.lockedUntil && u.lockedUntil.getTime() > Date.now();
  let ok = false;
  if (u && roleOk && u.active && !locked) ok = await verifyPassword(password, u.passwordHash);
  else await fakeVerify(password); // mismo tiempo de respuesta exista o no la cuenta

  if (!ok) {
    if (u && roleOk && !locked) {
      const fails = u.failedLogins + 1;
      // 5 fallos → bloqueo de 15 min; se duplica por cada 5 fallos adicionales (tope 24 h)
      const lockMs = fails % MAX_FAILS === 0 ? Math.min(15 * 60e3 * 2 ** (fails / MAX_FAILS - 1), 24 * 3600e3) : 0;
      await db.update(users).set({ failedLogins: fails, lockedUntil: lockMs ? new Date(Date.now() + lockMs) : null }).where(eq(users.id, u.id));
    }
    return fail(GENERIC, 401); // misma respuesta para: no existe, rol equivocado, clave mala, bloqueada, inactiva
  }
  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, u.id));
  const token = await createSession(u.id, aud, req); // token nuevo en cada login
  const mobile = req.headers.get('x-client') === 'mobile';
  const res = NextResponse.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role }, ...(mobile ? { token } : {}) });
  if (!mobile) setSessionCookie(res, aud, token);
  return res;
}

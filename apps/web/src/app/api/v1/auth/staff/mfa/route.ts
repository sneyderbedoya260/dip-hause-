import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { MfaInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { checkOrigin } from '@/lib/auth/guard';
import { decrypt } from '@/lib/auth/crypto';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { burnToken, peekToken } from '@/lib/auth/tokens';
import { hashRecovery, matchTotp } from '@/lib/auth/totp';
import { fail, handle } from '@/lib/http';

/** 2.º paso del login del personal: código de la app autenticadora (o un código de respaldo). */
export const POST = (req: Request) => handle(async () => {
  checkOrigin(req);
  if (!allow(`mfa:${clientIp(req)}`, 20, 15 * 60e3)) return fail('Demasiados intentos. Espera unos minutos.', 429);
  const { mfaToken, code } = MfaInput.parse(await req.json());
  const t = await peekToken(mfaToken, 'mfa'); // cada intento cuenta; a los 5 el paso expira
  if (!t) return fail('La verificación venció. Inicia sesión de nuevo.', 401);
  const [u] = await db.select().from(users).where(eq(users.id, t.userId));
  if (!u || !u.active || !u.totpSecret || !u.totpEnabledAt) return fail('Verificación no disponible', 401);
  const clean = code.replace(/\s/g, '');
  let ok = false;
  const step = matchTotp(decrypt(u.totpSecret), clean);
  if (step !== null && step > u.totpLastStep) { ok = true; await db.update(users).set({ totpLastStep: step }).where(eq(users.id, u.id)); } // un código no se reutiliza
  else {
    const hashes = JSON.parse(u.recoveryHashes) as string[], i = hashes.indexOf(hashRecovery(clean));
    if (i >= 0) { hashes.splice(i, 1); await db.update(users).set({ recoveryHashes: JSON.stringify(hashes) }).where(eq(users.id, u.id)); ok = true; }
  }
  if (!ok) return fail('Código incorrecto', 401);
  await burnToken(t.id);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  const token = await createSession(u.id, 'staff', req);
  const mobile = req.headers.get('x-client') === 'mobile';
  const res = NextResponse.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role }, ...(mobile ? { token } : {}) });
  if (!mobile) setSessionCookie(res, 'staff', token);
  return res;
});

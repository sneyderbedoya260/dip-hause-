import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { decrypt } from '@/lib/auth/crypto';
import { requireRole } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import { allow } from '@/lib/auth/ratelimit';
import { revokeUserSessions } from '@/lib/auth/session';
import { matchTotp } from '@/lib/auth/totp';
import { fail, handle, ok } from '@/lib/http';

/** Desactivar 2FA exige la contraseña Y un código vigente. */
export const POST = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee'], { allowNoMfa: true });
  if (!allow(`2fa-disable:${a.user.id}`, 5, 15 * 60e3)) return fail('Demasiados intentos.', 429);
  const { password, code } = z.object({ password: z.string().max(128), code: z.string().max(20) }).parse(await req.json());
  const [u] = await db.select().from(users).where(eq(users.id, a.user.id));
  if (!u.totpEnabledAt || !u.totpSecret) return fail('La verificación en dos pasos no está activa');
  if (!(await verifyPassword(password, u.passwordHash)) || matchTotp(decrypt(u.totpSecret), code.replace(/\s/g, '')) === null) return fail('Contraseña o código incorrectos', 400);
  await db.update(users).set({ totpEnabledAt: null, totpSecret: null, recoveryHashes: '[]', totpLastStep: 0 }).where(eq(users.id, u.id));
  await revokeUserSessions(u.id, a.token);
  return ok({ ok: true });
});

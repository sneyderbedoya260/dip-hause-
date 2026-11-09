import { eq } from 'drizzle-orm';
import { TotpCode } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { decrypt } from '@/lib/auth/crypto';
import { requireRole } from '@/lib/auth/guard';
import { allow } from '@/lib/auth/ratelimit';
import { matchTotp, newRecoveryCodes } from '@/lib/auth/totp';
import { fail, handle, ok } from '@/lib/http';

/** Paso 2: confirma con un código de la app. Devuelve los códigos de respaldo (se muestran una sola vez). */
export const POST = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee'], { allowNoMfa: true });
  if (!allow(`2fa-enable:${a.user.id}`, 10, 15 * 60e3)) return fail('Demasiados intentos.', 429);
  const { code } = TotpCode.parse(await req.json());
  const [u] = await db.select().from(users).where(eq(users.id, a.user.id));
  if (u.totpEnabledAt) return fail('La verificación en dos pasos ya está activa');
  if (!u.totpSecret) return fail('Primero genera el código QR');
  const step = matchTotp(decrypt(u.totpSecret), code.replace(/\s/g, ''));
  if (step === null) return fail('Código incorrecto. Revisa la hora de tu celular e inténtalo de nuevo.');
  const { codes, hashes } = newRecoveryCodes();
  await db.update(users).set({ totpEnabledAt: new Date(), totpLastStep: step, recoveryHashes: JSON.stringify(hashes) }).where(eq(users.id, u.id));
  return ok({ recoveryCodes: codes });
});

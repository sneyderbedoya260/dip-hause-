import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { encrypt } from '@/lib/auth/crypto';
import { newTotpSecret, otpauthUrl } from '@/lib/auth/totp';
import { fail, handle, ok } from '@/lib/http';

/** Paso 1 de activar 2FA: genera el secreto y el QR (aún no queda activo hasta confirmar un código). */
export const POST = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee'], { allowNoMfa: true });
  if (a.user.totpEnabled) return fail('La verificación en dos pasos ya está activa');
  const secret = newTotpSecret();
  await db.update(users).set({ totpSecret: encrypt(secret) }).where(eq(users.id, a.user.id));
  const uri = otpauthUrl(a.user.email, secret);
  return ok({ secret, otpauth: uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) });
});

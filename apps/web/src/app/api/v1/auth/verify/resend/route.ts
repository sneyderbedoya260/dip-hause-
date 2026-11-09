import { verifyEmail } from '@/lib/emails';
import { requireRole } from '@/lib/auth/guard';
import { allow } from '@/lib/auth/ratelimit';
import { createToken } from '@/lib/auth/tokens';
import { fail, handle, ok } from '@/lib/http';
import { sendMail } from '@/lib/mailer';

export const POST = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['customer']);
  if (a.user.emailVerified) return ok({ ok: true, already: true });
  if (!allow(`verify-resend:${a.user.id}`, 3, 3600e3)) return fail('Ya enviamos varios correos. Intenta en una hora.', 429);
  const t = await createToken(a.user.id, 'verify', 24 * 3600e3);
  void sendMail({ to: a.user.email, ...verifyEmail(a.user.name, `${process.env.APP_URL ?? 'http://localhost:3000'}/verificar?token=${t}`) }).catch(e => console.error('[correo] verificación', e));
  return ok({ ok: true });
});

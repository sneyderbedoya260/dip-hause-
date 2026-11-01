import { eq } from 'drizzle-orm';
import { ForgotInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { checkOrigin } from '@/lib/auth/guard';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { createResetToken } from '@/lib/auth/tokens';
import { resetEmail } from '@/lib/emails';
import { handle, ok } from '@/lib/http';
import { sendMail } from '@/lib/mailer';

const MINUTES = 30;
/** Siempre responde igual, exista o no el correo (no revela quién tiene cuenta). */
export const POST = (req: Request) => handle(async () => {
  checkOrigin(req);
  const { email, audience } = ForgotInput.parse(await req.json());
  const reply = ok({ ok: true, message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' });
  if (!allow(`forgot:ip:${clientIp(req)}`, 5, 3600e3) || !allow(`forgot:em:${email}`, 3, 3600e3)) return reply;
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (u && u.active && (audience === 'staff') === (u.role !== 'customer')) {
    const token = await createResetToken(u.id, MINUTES * 60e3);
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}${audience === 'staff' ? '/admin/restablecer' : '/restablecer'}?token=${token}`;
    void sendMail({ to: u.email, ...resetEmail(u.name, link, MINUTES) }).catch(e => console.error('[correo] reset', e)); // sin await: mismo tiempo de respuesta
  }
  return reply;
});

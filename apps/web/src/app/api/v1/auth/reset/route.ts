import { eq } from 'drizzle-orm';
import { ResetInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { checkOrigin } from '@/lib/auth/guard';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { revokeUserSessions } from '@/lib/auth/session';
import { consumeResetToken } from '@/lib/auth/tokens';
import { fail, handle, ok } from '@/lib/http';

export const POST = (req: Request) => handle(async () => {
  checkOrigin(req);
  if (!allow(`reset:${clientIp(req)}`, 10, 3600e3)) return fail('Demasiados intentos.', 429);
  const { token, password } = ResetInput.parse(await req.json());
  const userId = await consumeResetToken(token);
  if (!userId) return fail('El enlace no es válido o ya venció. Solicita uno nuevo.', 400);
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  const problem = u && passwordProblem(password, u.email, u.role === 'customer' ? 10 : 12);
  if (problem) return fail(problem);
  await db.update(users).set({ passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null, emailVerifiedAt: u.emailVerifiedAt ?? new Date() }).where(eq(users.id, userId));
  await revokeUserSessions(userId); // cierra todas las sesiones abiertas
  return ok({ ok: true });
});

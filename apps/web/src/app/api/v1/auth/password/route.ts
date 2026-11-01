import { eq } from 'drizzle-orm';
import { ChangePasswordInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { allow } from '@/lib/auth/ratelimit';
import { revokeUserSessions } from '@/lib/auth/session';
import { fail, handle, ok } from '@/lib/http';

/** Cambiar contraseña estando dentro. Cierra las demás sesiones. */
export const POST = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee', 'customer']);
  if (!allow(`pw:${a.user.id}`, 5, 15 * 60e3)) return fail('Demasiados intentos.', 429);
  const { current, password } = ChangePasswordInput.parse(await req.json());
  const [u] = await db.select().from(users).where(eq(users.id, a.user.id));
  if (!(await verifyPassword(current, u.passwordHash))) return fail('La contraseña actual no es correcta', 400);
  const problem = passwordProblem(password, u.email, u.role === 'customer' ? 10 : 12);
  if (problem) return fail(problem);
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, u.id));
  await revokeUserSessions(u.id, a.token);
  return ok({ ok: true });
});

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { consumeToken } from '@/lib/auth/tokens';
import { fail, handle, ok } from '@/lib/http';

/** Confirma el correo con el enlace que llegó por email. */
export const POST = (req: Request) => handle(async () => {
  if (!allow(`verify:${clientIp(req)}`, 20, 3600e3)) return fail('Demasiados intentos.', 429);
  const { token } = z.object({ token: z.string().min(20).max(200) }).parse(await req.json());
  const id = await consumeToken(token, 'verify');
  if (!id) return fail('El enlace no es válido o ya venció. Pide uno nuevo desde «Mi cuenta».', 400);
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, id));
  return ok({ ok: true });
});

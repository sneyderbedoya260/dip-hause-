import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { revokeUserSessions } from '@/lib/auth/session';
import { fail, handle, ok } from '@/lib/http';

/** Admin: activar / desactivar una cuenta del personal (al desactivar se cierran sus sesiones). */
export const PATCH = (req: Request, { params }: { params: { id: string } }) => handle(async () => {
  const a = await requireRole(req, ['admin']);
  const { active } = z.object({ active: z.boolean() }).parse(await req.json());
  if (a.user.id === params.id && !active) return fail('No puedes desactivar tu propia cuenta');
  const [u] = await db.update(users).set({ active }).where(eq(users.id, params.id)).returning({ id: users.id });
  if (!u) return fail('No encontrado', 404);
  if (!active) await revokeUserSessions(params.id);
  return ok({ id: u.id, active });
});

import { desc, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
// Por cuenta; y por correo SOLO si el correo está verificado (si no, alguien podría registrar un correo ajeno).
export const GET = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['customer']);
  const where = a.user.emailVerified ? or(eq(appointments.userId, a.user.id), eq(appointments.email, a.user.email)) : eq(appointments.userId, a.user.id);
  return ok(await db.select().from(appointments).where(where).orderBy(desc(appointments.date), desc(appointments.time)));
});

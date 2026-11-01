import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
// Solo por userId (no por correo): sin verificación de correo, coincidir por email permitiría ver citas ajenas.
export const GET = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['customer']);
  return ok(await db.select().from(appointments).where(eq(appointments.userId, a.user.id)).orderBy(desc(appointments.date), desc(appointments.time)));
});

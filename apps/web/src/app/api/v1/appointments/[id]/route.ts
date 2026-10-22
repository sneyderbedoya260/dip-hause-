import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { AppointmentStatus } from '@dip/shared';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { fail, handle, ok } from '@/lib/http';

/** Admin: confirmar / rechazar / completar una cita. */
export const PATCH = (req: Request, { params }: { params: { id: string } }) => handle(async () => {
  await requireAdmin(req);
  const { status } = z.object({ status: AppointmentStatus }).parse(await req.json());
  const [a] = await db.update(appointments).set({ status }).where(eq(appointments.id, params.id)).returning();
  return a ? ok(a) : fail('Cita no encontrada', 404);
});

import { and, eq } from 'drizzle-orm';
import { AppointmentPatch } from '@dip/shared';
import { db } from '@/db';
import { appointments, users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { fail, handle, ok } from '@/lib/http';

/** Admin: confirmar / rechazar / completar y asignar empleado. Empleado: solo marcar como completada una cita suya. */
export const PATCH = (req: Request, { params }: { params: { id: string } }) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee']);
  const patch = AppointmentPatch.parse(await req.json());
  const [cur] = await db.select().from(appointments).where(eq(appointments.id, params.id));
  if (!cur) return fail('Cita no encontrada', 404);
  if (a.user.role === 'employee') {
    if (cur.assignedTo !== a.user.id || patch.assignedTo !== undefined || patch.status !== 'completada' || cur.status !== 'confirmada') return fail('Sin permiso', 403);
  }
  if (patch.assignedTo) {
    const [e] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, patch.assignedTo), eq(users.active, true)));
    if (!e) return fail('Empleado no válido');
  }
  const [u] = await db.update(appointments).set(patch).where(eq(appointments.id, params.id)).returning();
  return ok(u);
});

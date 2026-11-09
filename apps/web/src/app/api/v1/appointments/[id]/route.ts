import { and, eq } from 'drizzle-orm';
import { AppointmentPatch } from '@dip/shared';
import { db } from '@/db';
import { appointments, users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { fail, handle, ok } from '@/lib/http';
import { markAppointmentPaid } from '@/lib/payments';

/** Admin: confirmar / rechazar / completar y asignar empleado. Empleado: solo marcar como completada una cita suya. */
export const PATCH = (req: Request, { params }: { params: { id: string } }) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee']);
  const patch = AppointmentPatch.parse(await req.json());
  const [cur] = await db.select().from(appointments).where(eq(appointments.id, params.id));
  if (!cur) return fail('Cita no encontrada', 404);
  if (a.user.role === 'employee') {
    if (cur.assignedTo !== a.user.id || patch.assignedTo !== undefined || patch.markPaid || patch.status !== 'completada' || cur.status !== 'confirmada') return fail('Sin permiso', 403);
  }
  if (patch.assignedTo) {
    const [e] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, patch.assignedTo), eq(users.active, true)));
    if (!e) return fail('Empleado no válido');
  }
  const set: Partial<typeof appointments.$inferInsert> = {};
  if (patch.status) set.status = patch.status;
  if (patch.assignedTo !== undefined) set.assignedTo = patch.assignedTo;
  if (Object.keys(set).length) await db.update(appointments).set(set).where(eq(appointments.id, params.id));
  if (patch.markPaid) await markAppointmentPaid(params.id); // cobro en efectivo/transferencia registrado por el admin
  const [u] = await db.select().from(appointments).where(eq(appointments.id, params.id));
  return ok(u);
});

import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { appointments, evidence } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { fail, handle } from '@/lib/http';
import { serveFile } from '@/lib/serve';
import { EVIDENCE_DIR } from '@/lib/storage';

export const dynamic = 'force-dynamic';
/** Privado: admin (todas), empleado (solo citas que tiene asignadas) o el cliente dueño de la cita. */
export const GET = (req: Request, { params }: { params: { id: string } }) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee', 'customer']);
  const [e] = await db.select().from(evidence).where(eq(evidence.id, params.id));
  if (!e) return fail('No encontrado', 404);
  if (a.user.role !== 'admin') {
    const [ap] = e.appointmentId ? await db.select().from(appointments).where(eq(appointments.id, e.appointmentId)) : [];
    const allowed = !!ap && ((a.user.role === 'employee' && ap.assignedTo === a.user.id) || (a.user.role === 'customer' && ap.userId === a.user.id));
    if (!allowed) return fail('Sin permiso', 403);
  }
  return serveFile(req, path.join(EVIDENCE_DIR, e.fileName), 'private, max-age=3600');
});

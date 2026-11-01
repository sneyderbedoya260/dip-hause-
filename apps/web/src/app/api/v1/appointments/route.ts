import { and, desc, eq, inArray } from 'drizzle-orm';
import { AppointmentInput } from '@dip/shared';
import { db } from '@/db';
import { appointments, washExtras, washes } from '@/db/schema';
import { getAuth, requireRole } from '@/lib/auth/guard';
import { availability } from '@/lib/availability';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
const code = () => 'DH-' + Math.random().toString(36).slice(2, 7).toUpperCase();

/** Público: crea una solicitud de cita (queda "pendiente" hasta que el admin la confirme). */
export const POST = (req: Request) => handle(async () => {
  const input = AppointmentInput.parse(await req.json());
  const [w] = await db.select().from(washes).where(eq(washes.id, input.washId));
  if (!w || !w.active) return fail('Lavada no disponible', 404);
  const chosen = input.extraIds.length ? await db.select().from(washExtras).where(and(eq(washExtras.washId, w.id), inArray(washExtras.id, input.extraIds))) : [];
  const durationMin = w.durationMin + chosen.reduce((a, x) => a + x.durationMin, 0);
  const priceCop = w.priceCop + chosen.reduce((a, x) => a + x.priceCop, 0);
  const free = (await availability(durationMin, input.date, 0))[input.date] ?? [];
  if (!free.includes(input.time)) return fail('Ese horario ya no está disponible', 409);
  const { washId, extraIds, ...rest } = input;
  const extras = JSON.stringify(chosen.map(x => ({ name: x.name, priceCop: x.priceCop, durationMin: x.durationMin })));
  const auth = await getAuth(req); // si es un cliente con sesión, la cita queda en su cuenta
  const userId = auth?.user.role === 'customer' ? auth.user.id : undefined;
  const [a] = await db.insert(appointments).values({ ...rest, userId, washId, washName: w.name, extras, priceCop, durationMin, code: code() }).returning();
  return ok(a, 201);
});
/** Personal: el admin ve todas; el empleado solo las que tiene asignadas. ?status=pendiente|confirmada|... */
export const GET = (req: Request) => handle(async () => {
  const a = await requireRole(req, ['admin', 'employee']);
  const status = new URL(req.url).searchParams.get('status');
  const rows = await db.select().from(appointments).where(a.user.role === 'employee' ? eq(appointments.assignedTo, a.user.id) : undefined).orderBy(desc(appointments.date), desc(appointments.time));
  return ok(status ? rows.filter(r => r.status === status) : rows);
});

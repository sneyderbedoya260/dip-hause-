import { desc, eq } from 'drizzle-orm';
import { AppointmentInput } from '@dip/shared';
import { db } from '@/db';
import { appointments, washes } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { availability } from '@/lib/availability';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
const code = () => 'DH-' + Math.random().toString(36).slice(2, 7).toUpperCase();

/** Público: crea una solicitud de cita (queda "pendiente" hasta que el admin la confirme). */
export const POST = (req: Request) => handle(async () => {
  const input = AppointmentInput.parse(await req.json());
  const [w] = await db.select().from(washes).where(eq(washes.id, input.washId));
  if (!w || !w.active) return fail('Lavada no disponible', 404);
  const free = (await availability(w.durationMin, input.date, 0))[input.date] ?? [];
  if (!free.includes(input.time)) return fail('Ese horario ya no está disponible', 409);
  const { washId, ...rest } = input;
  const [a] = await db.insert(appointments).values({ ...rest, washId, washName: w.name, priceCop: w.priceCop, durationMin: w.durationMin, code: code() }).returning();
  return ok(a, 201);
});
/** Admin: lista de citas, ?status=pendiente|confirmada|... */
export const GET = (req: Request) => handle(async () => {
  await requireAdmin(req);
  const status = new URL(req.url).searchParams.get('status');
  const rows = await db.select().from(appointments).orderBy(desc(appointments.date), desc(appointments.time));
  return ok(status ? rows.filter(r => r.status === status) : rows);
});

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { getSettings } from '@/lib/availability';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
const Input = z.object({ days: z.array(z.number().int().min(0).max(6)).min(1), openHour: z.number().int().min(5).max(22), closeHour: z.number().int().min(6).max(23), evidenceRetentionDays: z.number().int().min(0).max(3650) });
/** Horario de servicio: días de la semana (0=domingo) y horas de apertura/cierre. */
export const GET = () => handle(async () => { const s = await getSettings(); return ok({ days: s.days, openHour: s.open, closeHour: s.close, evidenceRetentionDays: s.retention }); });
export const PUT = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  const d = Input.parse(await req.json());
  if (d.closeHour <= d.openHour) return fail('El cierre debe ser después de la apertura');
  await db.update(settings).set({ days: [...new Set(d.days)].sort().join(','), openHour: d.openHour, closeHour: d.closeHour, evidenceRetentionDays: d.evidenceRetentionDays }).where(eq(settings.id, 1));
  return ok(d);
});

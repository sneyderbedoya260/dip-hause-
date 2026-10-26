import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { washExtras, washes } from '@/db/schema';
import { addDays, availability, nowInTz } from '@/lib/availability';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
/** GET /api/v1/availability?washId=...&days=60 → { days: { "2026-10-23": ["08:00", ...] } } */
export const GET = (req: Request) => handle(async () => {
  const q = new URL(req.url).searchParams;
  const [w] = await db.select().from(washes).where(eq(washes.id, q.get('washId') ?? ''));
  if (!w) return fail('Lavada no encontrada', 404);
  const ids = (q.get('extraIds') ?? '').split(',').filter(Boolean);
  const extra = ids.length ? (await db.select().from(washExtras).where(and(eq(washExtras.washId, w.id), inArray(washExtras.id, ids)))).reduce((a, x) => a + x.durationMin, 0) : 0;
  const days = Math.min(Math.max(+(q.get('days') ?? 60), 1), 90);
  return ok({ days: await availability(w.durationMin + extra, q.get('from') ?? nowInTz().date, days), until: addDays(nowInTz().date, days) });
});

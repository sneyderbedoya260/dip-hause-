import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { washes } from '@/db/schema';
import { addDays, availability, nowInTz } from '@/lib/availability';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
/** GET /api/v1/availability?washId=...&days=60 → { days: { "2026-10-23": ["08:00", ...] } } */
export const GET = (req: Request) => handle(async () => {
  const q = new URL(req.url).searchParams;
  const [w] = await db.select().from(washes).where(eq(washes.id, q.get('washId') ?? ''));
  if (!w) return fail('Lavada no encontrada', 404);
  const days = Math.min(Math.max(+(q.get('days') ?? 60), 1), 90);
  return ok({ days: await availability(w.durationMin, q.get('from') ?? nowInTz().date, days), until: addDays(nowInTz().date, days) });
});

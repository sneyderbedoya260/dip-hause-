import { and, gte, inArray, lte, eq } from 'drizzle-orm';
import { db } from '@/db';
import { appointments, settings } from '@/db/schema';

const TZ = process.env.BUSINESS_TZ ?? 'America/Bogota';
export function nowInTz() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
}
export const addDays = (date: string, n: number) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekday = (date: string) => new Date(date + 'T12:00:00Z').getUTCDay();
export const hoursNeeded = (min: number) => Math.max(1, Math.ceil(min / 60));

export async function getSettings() {
  const [s] = await db.select().from(settings).where(eq(settings.id, 1));
  const v = s ?? { id: 1, days: '1,2,3,4,5,6', openHour: 8, closeHour: 18 };
  return { days: v.days.split(',').map(Number), open: v.openHour, close: v.closeHour };
}

/** Horas libres por día. Las citas pendientes y confirmadas bloquean horario. */
export async function availability(durationMin: number, from: string, days: number) {
  const cfg = await getSettings();
  const to = addDays(from, days);
  const rows = await db.select().from(appointments).where(and(gte(appointments.date, from), lte(appointments.date, to), inArray(appointments.status, ['pendiente', 'confirmada'])));
  const busy: Record<string, Set<number>> = {};
  for (const a of rows) { const s = (busy[a.date] ??= new Set()); const h = +a.time.slice(0, 2); for (let i = 0; i < hoursNeeded(a.durationMin); i++) s.add(h + i); }
  const now = nowInTz(), n = hoursNeeded(durationMin), out: Record<string, string[]> = {};
  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    if (!cfg.days.includes(weekday(date)) || date < now.date) continue;
    const free: string[] = [];
    for (let h = cfg.open; h + n <= cfg.close; h++) {
      if (date === now.date && h <= now.hour) continue;
      if (Array.from({ length: n }, (_, k) => h + k).some(x => busy[date]?.has(x))) continue;
      free.push(`${String(h).padStart(2, '0')}:00`);
    }
    if (free.length) out[date] = free;
  }
  return out;
}

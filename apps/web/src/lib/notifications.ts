import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { appointments, notifications, users } from '@/db/schema';
import { addDays, nowInTz } from './availability';
import { customerReminder, staffDigest, type Appt } from './emails';
import { sendMail } from './mailer';

const EMP_HOUR = () => +(process.env.EMPLOYEE_DIGEST_HOUR ?? 6);
const CUS_HOUR = () => +(process.env.CUSTOMER_REMINDER_HOUR ?? 17);

/** Reserva el envío: solo una instancia/ejecución lo logra (clave única). Permite reintentar los fallidos (máx. 3). */
async function claim(key: string, v: { kind: string; toEmail: string; appointmentId?: string; userId?: string }) {
  const ins = await db.insert(notifications).values({ dedupeKey: key, ...v }).onConflictDoNothing().returning({ id: notifications.id });
  if (ins.length) return ins[0].id;
  const retry = await db.update(notifications).set({ status: 'pending', attempts: sql`${notifications.attempts} + 1`, updatedAt: new Date() })
    .where(and(eq(notifications.dedupeKey, key), eq(notifications.status, 'failed'), lt(notifications.attempts, 3), lt(notifications.updatedAt, new Date(Date.now() - 10 * 60e3)))).returning({ id: notifications.id });
  return retry[0]?.id ?? null;
}
async function deliver(id: string, mail: Parameters<typeof sendMail>[0]) {
  try { await sendMail(mail); await db.update(notifications).set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() }).where(eq(notifications.id, id)); return true; }
  catch (e) { await db.update(notifications).set({ status: 'failed', lastError: String((e as Error).message).slice(0, 300), updatedAt: new Date() }).where(eq(notifications.id, id)); return false; }
}
const toAppt = (a: typeof appointments.$inferSelect): Appt => ({ code: a.code, washName: a.washName, extras: a.extras, date: a.date, time: a.time, address: a.address, refs: a.refs, customerName: a.customerName, phone: a.phone, vehicle: a.vehicle, plate: a.plate, notes: a.notes });

/**
 * Se ejecuta cada minuto. Es idempotente: se puede llamar las veces que sea.
 *  - Empleados: resumen diario con sus servicios confirmados del día (a partir de EMPLOYEE_DIGEST_HOUR).
 *  - Administradores: resumen de los servicios del día que no tienen empleado asignado.
 *  - Clientes: recordatorio el día anterior (desde CUSTOMER_REMINDER_HOUR) y otro ~2 h antes.
 */
export async function runNotifications(now = nowInTz()) {
  const tomorrow = addDays(now.date, 1);
  const rows = await db.select().from(appointments).where(and(eq(appointments.status, 'confirmada'), inArray(appointments.date, [now.date, tomorrow])));
  const today = rows.filter(a => a.date === now.date);
  let sent = 0;

  if (now.hour >= EMP_HOUR() && now.hour < EMP_HOUR() + 6 && today.length) {
    const staff = await db.select().from(users).where(and(inArray(users.role, ['employee', 'admin']), eq(users.active, true)));
    for (const u of staff.filter(s => s.role === 'employee')) {
      const mine = today.filter(a => a.assignedTo === u.id);
      if (!mine.length) continue;
      const id = await claim(`emp:${u.id}:${now.date}`, { kind: 'employee_digest', toEmail: u.email, userId: u.id });
      if (id && await deliver(id, { to: u.email, ...staffDigest(u.name, now.date, mine.map(toAppt)) })) sent++;
    }
    const loose = today.filter(a => !a.assignedTo);
    if (loose.length) for (const u of staff.filter(s => s.role === 'admin')) {
      const id = await claim(`adm:${u.id}:${now.date}`, { kind: 'admin_unassigned', toEmail: u.email, userId: u.id });
      if (id && await deliver(id, { to: u.email, ...staffDigest(u.name, now.date, loose.map(toAppt), 'Servicios de hoy SIN empleado asignado') })) sent++;
    }
  }
  if (now.hour >= CUS_HOUR() && now.hour < CUS_HOUR() + 4)
    for (const a of rows.filter(r => r.date === tomorrow)) {
      const id = await claim(`c1d:${a.id}`, { kind: 'customer_1d', toEmail: a.email, appointmentId: a.id });
      if (id && await deliver(id, { to: a.email, ...customerReminder(toAppt(a), '1d') })) sent++;
    }
  for (const a of today) {
    const diff = (+a.time.slice(0, 2)) * 60 - (now.hour * 60 + now.minute);
    if (diff <= 0 || diff > 120) continue;
    const id = await claim(`c2h:${a.id}`, { kind: 'customer_2h', toEmail: a.email, appointmentId: a.id });
    if (id && await deliver(id, { to: a.email, ...customerReminder(toAppt(a), '2h') })) sent++;
  }
  return { sent };
}
export function startScheduler() {
  if (process.env.NOTIFY_ENABLED !== 'true') return console.log('[dip-house] notificaciones desactivadas (NOTIFY_ENABLED=true para activarlas)');
  const g = globalThis as { __dhSched?: NodeJS.Timeout };
  if (g.__dhSched) return;
  g.__dhSched = setInterval(() => { runNotifications().catch(e => console.error('[notificaciones]', e)); }, 60_000);
  console.log('[dip-house] recordatorios activos');
}

import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import { db } from '@/db';
import { appointments, evidence } from '@/db/schema';
import { getSettings } from './availability';
import { addDaysStr, dayKey } from './tz';
import { EVIDENCE_DIR } from './storage';

/** Borra las evidencias que se subieron pero nunca se usaron en una cita (más de 24 h). */
export async function cleanupEvidence() {
  const rows = await db.select().from(evidence).where(and(isNull(evidence.appointmentId), lt(evidence.createdAt, new Date(Date.now() - 24 * 3600e3))));
  for (const r of rows) await unlink(path.join(EVIDENCE_DIR, r.fileName)).catch(() => {});
  if (rows.length) await db.delete(evidence).where(inArray(evidence.id, rows.map(r => r.id)));
  return rows.length;
}
/** Política de retención: borra las evidencias de citas cerradas (completadas/canceladas) con más de N días. 0 = nunca. */
export async function purgeOldEvidence() {
  const { retention } = await getSettings();
  if (!retention) return 0;
  const cutoff = addDaysStr(dayKey(new Date()), -retention);
  const aps = await db.select({ id: appointments.id }).from(appointments).where(and(lt(appointments.date, cutoff), inArray(appointments.status, ['completada', 'cancelada']), eq(appointments.evidencePurged, false)));
  let n = 0;
  for (let i = 0; i < aps.length; i += 400) {
    const ids = aps.slice(i, i + 400).map(a => a.id);
    const rows = await db.select().from(evidence).where(inArray(evidence.appointmentId, ids));
    for (const r of rows) await unlink(path.join(EVIDENCE_DIR, r.fileName)).catch(() => {});
    if (rows.length) await db.delete(evidence).where(inArray(evidence.id, rows.map(r => r.id)));
    await db.update(appointments).set({ evidencePurged: true }).where(inArray(appointments.id, ids));
    n += rows.length;
  }
  return n;
}
export function startMaintenance() {
  const g = globalThis as { __dhMaint?: NodeJS.Timeout };
  if (g.__dhMaint) return;
  const run = () => cleanupEvidence().then(() => purgeOldEvidence()).catch(e => console.error('[mantenimiento]', e));
  g.__dhMaint = setInterval(run, 3600e3);
  run();
}

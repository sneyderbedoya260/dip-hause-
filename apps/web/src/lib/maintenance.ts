import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { and, inArray, isNull, lt } from 'drizzle-orm';
import { db } from '@/db';
import { evidence } from '@/db/schema';
import { EVIDENCE_DIR } from './storage';

/** Borra las evidencias que se subieron pero nunca se usaron en una cita (más de 24 h). */
export async function cleanupEvidence() {
  const rows = await db.select().from(evidence).where(and(isNull(evidence.appointmentId), lt(evidence.createdAt, new Date(Date.now() - 24 * 3600e3))));
  for (const r of rows) await unlink(path.join(EVIDENCE_DIR, r.fileName)).catch(() => {});
  if (rows.length) await db.delete(evidence).where(inArray(evidence.id, rows.map(r => r.id)));
  return rows.length;
}
export function startMaintenance() {
  const g = globalThis as { __dhMaint?: NodeJS.Timeout };
  if (g.__dhMaint) return;
  g.__dhMaint = setInterval(() => { cleanupEvidence().catch(e => console.error('[mantenimiento]', e)); }, 3600e3);
  cleanupEvidence().catch(e => console.error('[mantenimiento]', e));
}

import { db } from '@/db';
import { evidence } from '@/db/schema';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { fail, handle, ok } from '@/lib/http';
import { EVIDENCE_MAX_MB, saveEvidence } from '@/lib/storage';

/**
 * Público (también invitados): sube UNA foto o video del estado del vehículo (multipart, campo "file").
 * Devuelve { id, kind } para enviarlo en `evidenceIds` al crear la cita. Límite por red para evitar abuso.
 */
export const POST = (req: Request) => handle(async () => {
  const ip = clientIp(req);
  if (!allow(`ev:${ip}`, 60, 3600e3)) return fail('Demasiadas subidas desde esta red. Intenta más tarde.', 429);
  const f = (await req.formData()).get('file');
  if (!(f instanceof File)) return fail('Falta el archivo');
  if (f.size > EVIDENCE_MAX_MB * 1024 * 1024) return fail(`El archivo supera ${EVIDENCE_MAX_MB} MB`, 413);
  let saved;
  try { saved = await saveEvidence(f); } catch (e) { return fail((e as Error).message); }
  const [e] = await db.insert(evidence).values({ kind: saved.kind, fileName: saved.fileName, originalName: f.name.slice(0, 120), sizeBytes: f.size, ip }).returning({ id: evidence.id, kind: evidence.kind });
  return ok(e, 201);
});

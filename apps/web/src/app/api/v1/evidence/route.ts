import { db } from '@/db';
import { evidence } from '@/db/schema';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { fail, handle, ok } from '@/lib/http';
import { EVIDENCE_DIR, EVIDENCE_MAX_MB } from '@/lib/storage';
import { receiveFile, UploadError } from '@/lib/upload';

/**
 * Público (también invitados): sube UNA foto o video del estado del vehículo (multipart, campo "file").
 * Se escribe directo a disco (sin cargar el archivo en memoria). Devuelve { id, kind } para `evidenceIds` al crear la cita.
 */
export const POST = (req: Request) => handle(async () => {
  const ip = clientIp(req);
  if (!allow(`ev:${ip}`, 60, 3600e3)) return fail('Demasiadas subidas desde esta red. Intenta más tarde.', 429);
  try {
    const f = await receiveFile(req, EVIDENCE_DIR, EVIDENCE_MAX_MB * 1024 * 1024);
    const [e] = await db.insert(evidence).values({ kind: f.kind, fileName: f.fileName, originalName: f.originalName, sizeBytes: f.size, ip }).returning({ id: evidence.id, kind: evidence.kind });
    return ok(e, 201);
  } catch (e) { if (e instanceof UploadError) return fail(e.message, e.status); throw e; }
});

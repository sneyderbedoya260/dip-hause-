import { requireRole } from '@/lib/auth/guard';
import { fail, handle, ok } from '@/lib/http';
import { UPLOAD_DIR, UPLOAD_MAX_MB } from '@/lib/storage';
import { receiveFile, UploadError } from '@/lib/upload';

/** Admin: sube una foto o video del catálogo (cualquier formato). Escribe directo a disco. */
export const POST = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  try {
    const f = await receiveFile(req, UPLOAD_DIR, UPLOAD_MAX_MB * 1024 * 1024);
    return ok({ url: `/uploads/${f.fileName}`, kind: f.kind }, 201);
  } catch (e) { if (e instanceof UploadError) return fail(e.message, e.status); throw e; }
});

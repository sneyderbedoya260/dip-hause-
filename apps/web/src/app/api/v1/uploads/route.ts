import { requireAdmin } from '@/lib/auth';
import { fail, handle, ok } from '@/lib/http';
import { saveFile } from '@/lib/storage';

/** Admin: sube una foto o video (cualquier formato). multipart/form-data, campo "file". */
export const POST = (req: Request) => handle(async () => {
  await requireAdmin(req);
  const f = (await req.formData()).get('file');
  if (!(f instanceof File)) return fail('Falta el archivo');
  try { return ok(await saveFile(f), 201); } catch (e) { return fail((e as Error).message); }
});

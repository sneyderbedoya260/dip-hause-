import path from 'node:path';
import { serveFile } from '@/lib/serve';
import { UPLOAD_DIR } from '@/lib/storage';

export const dynamic = 'force-dynamic';
/** Archivos públicos del catálogo (fotos/videos de lavadas y productos). Las evidencias NO pasan por aquí. */
export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const root = path.resolve(UPLOAD_DIR);
  const file = path.resolve(root, ...params.path);
  if (!file.startsWith(root + path.sep)) return new Response('No encontrado', { status: 404 });
  return serveFile(req, file);
}

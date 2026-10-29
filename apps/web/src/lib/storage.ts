import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';

const IMG = /\.(jpe?g|jfif|png|gif|webp|avif|heic|heif|bmp|tiff?|svg)$/i;
const VID = /\.(mp4|m4v|mov|webm|mkv|avi|wmv|flv|3gp|3g2|mpe?g|ogv|mts|m2ts)$/i;
export const kindOf = (f: File): 'image' | 'video' | null =>
  f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : VID.test(f.name) ? 'video' : IMG.test(f.name) ? 'image' : null;

/**
 * Almacenamiento de archivos. Con BLOB_READ_WRITE_TOKEN usa Vercel Blob; sin él guarda en /public/uploads (solo desarrollo).
 * Límite: en Vercel el cuerpo de una función es ~4.5 MB. Para videos grandes hay que pasar a subida directa desde el navegador.
 */
export async function saveFile(file: File) {
  const kind = kindOf(file);
  if (!kind) throw new Error('Formato no reconocido');
  const ext = path.extname(file.name).toLowerCase() || (kind === 'video' ? '.mp4' : '.jpg');
  const name = `${crypto.randomUUID()}${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) { // producción: Vercel Blob (URL pública permanente)
    const b = await put(`uploads/${name}`, file, { access: 'public' });
    return { url: b.url, kind };
  }
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}`, kind };
}

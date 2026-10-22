import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const IMG = /\.(jpe?g|jfif|png|gif|webp|avif|heic|heif|bmp|tiff?|svg)$/i;
const VID = /\.(mp4|m4v|mov|webm|mkv|avi|wmv|flv|3gp|3g2|mpe?g|ogv|mts|m2ts)$/i;
export const kindOf = (f: File): 'image' | 'video' | null =>
  f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : VID.test(f.name) ? 'video' : IMG.test(f.name) ? 'image' : null;

/**
 * Almacenamiento de archivos. En desarrollo guarda en /public/uploads.
 * En producción reemplaza esta función por S3 / Cloudflare R2 / Cloudinary
 * (mantén la misma firma) y, para videos grandes, usa subida directa con URL firmada.
 */
export async function saveFile(file: File) {
  const kind = kindOf(file);
  if (!kind) throw new Error('Formato no reconocido');
  const ext = path.extname(file.name).toLowerCase() || (kind === 'video' ? '.mp4' : '.jpg');
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}`, kind };
}

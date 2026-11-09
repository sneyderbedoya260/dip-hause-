import path from 'node:path';

const IMG = /\.(jpe?g|jfif|png|gif|webp|avif|heic|heif|bmp|tiff?|svg)$/i;
const VID = /\.(mp4|m4v|mov|webm|mkv|avi|wmv|flv|3gp|3g2|mpe?g|ogv|mts|m2ts)$/i;
/** Cualquier formato de foto o video (por tipo MIME o, si el navegador no lo da, por extensión). */
export const kindOfName = (name: string, mime = ''): 'image' | 'video' | null =>
  mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : VID.test(name) ? 'video' : IMG.test(name) ? 'image' : null;

// Catálogo (público) y evidencias (privadas) viven en el volumen del servidor, en carpetas separadas.
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'data', 'uploads');
export const EVIDENCE_DIR = process.env.EVIDENCE_DIR ?? path.join(path.dirname(UPLOAD_DIR), 'evidence');
export const EVIDENCE_MAX_MB = +(process.env.EVIDENCE_MAX_MB ?? 150);
export const UPLOAD_MAX_MB = +(process.env.UPLOAD_MAX_MB ?? 200);

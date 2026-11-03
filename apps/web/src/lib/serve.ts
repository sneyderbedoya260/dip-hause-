import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.heic': 'image/heic', '.heif': 'image/heif', '.bmp': 'image/bmp', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv', '.3gp': 'video/3gpp', '.3g2': 'video/3gpp2', '.mpg': 'video/mpeg', '.mpeg': 'video/mpeg', '.ogv': 'video/ogg',
};

/** Envía un archivo con soporte de Range (necesario para reproducir video en iPhone). */
export async function serveFile(req: Request, file: string, cache = 'public, max-age=31536000, immutable') {
  const st = await stat(file).catch(() => null);
  if (!st?.isFile()) return new Response('No encontrado', { status: 404 });
  const ext = path.extname(file).toLowerCase();
  const headers: Record<string, string> = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' };
  if (ext === '.svg') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  let start = 0, end = st.size - 1, status = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '');
  if (m && (m[1] || m[2])) {
    if (m[1]) { start = +m[1]; if (m[2]) end = Math.min(+m[2], end); } else { start = Math.max(st.size - +m[2], 0); }
    if (start > end || start >= st.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${st.size}` } });
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
  }
  headers['Content-Length'] = String(end - start + 1);
  return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, { status, headers });
}

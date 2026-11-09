import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import Busboy from 'busboy';
import { kindOfName } from './storage';

export class UploadError extends Error { constructor(msg: string, public status = 400) { super(msg); } }

/**
 * Recibe UN archivo (campo "file", multipart) y lo escribe directo a disco SIN cargarlo en memoria:
 * un video de 150 MB usa los mismos pocos MB de RAM que una foto pequeña.
 */
export async function receiveFile(req: Request, dir: string, maxBytes: number) {
  const ct = req.headers.get('content-type') ?? '';
  if (!ct.startsWith('multipart/form-data') || !req.body) throw new UploadError('Se esperaba multipart/form-data');
  const tooBig = () => new UploadError(`El archivo supera ${Math.round(maxBytes / 1048576)} MB`, 413);
  const declared = +(req.headers.get('content-length') ?? 0);
  if (declared && declared > maxBytes + 1_000_000) throw tooBig();
  await mkdir(dir, { recursive: true });
  return new Promise<{ fileName: string; kind: 'image' | 'video'; size: number; originalName: string }>((resolve, reject) => {
    const bb = Busboy({ headers: { 'content-type': ct }, defParamCharset: 'utf8', limits: { files: 1, fileSize: maxBytes, fields: 5 } });
    let done = false, target = '';
    const fail = (e: Error) => { if (done) return; done = true; if (target) unlink(target).catch(() => {}); reject(e); };
    bb.on('file', (field, stream, info) => {
      if (field !== 'file') { stream.resume(); return; }
      const name = info.filename ?? '';
      const kind = kindOfName(name, info.mimeType);
      if (!kind) { stream.resume(); return fail(new UploadError('Formato no reconocido. Sube una foto o un video.')); }
      const fileName = `${crypto.randomUUID()}${path.extname(name).toLowerCase() || (kind === 'video' ? '.mp4' : '.jpg')}`;
      target = path.join(dir, fileName);
      let size = 0;
      const out = createWriteStream(target);
      stream.on('data', (c: Buffer) => { size += c.length; });
      stream.on('limit', () => fail(tooBig()));
      out.on('error', fail);
      out.on('finish', () => { if (done) return; done = true; resolve({ fileName, kind, size, originalName: name.slice(0, 120) }); });
      stream.pipe(out);
    });
    bb.on('error', fail);
    bb.on('close', () => { if (!done && !target) fail(new UploadError('Falta el archivo')); });
    Readable.fromWeb(req.body as never).on('error', fail).pipe(bb);
  });
}

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verifica la firma x-signature de los webhooks de Mercado Pago (si MP_WEBHOOK_SECRET está definido). */
export function verifyMpSignature(req: Request, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = req.headers.get('x-signature');
  if (!sig) return false;
  const parts = Object.fromEntries(sig.split(',').map(p => p.trim().split('=') as [string, string]));
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${req.headers.get('x-request-id') ?? ''};ts:${parts.ts};`;
  const mac = createHmac('sha256', secret).update(manifest).digest('hex');
  try { return timingSafeEqual(Buffer.from(mac), Buffer.from(parts.v1 ?? '')); } catch { return false; }
}

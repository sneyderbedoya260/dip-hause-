import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// Cifrado en reposo (AES-256-GCM) para secretos como el de 2FA. La clave sale de DATA_KEY.
let key: Buffer | undefined;
const k = () => (key ??= scryptSync(process.env.DATA_KEY ?? 'dev-only-data-key-change-me', 'dip-house/v1', 32));
export function encrypt(text: string) {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', k(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return `v1.${iv.toString('base64')}.${c.getAuthTag().toString('base64')}.${enc.toString('base64')}`;
}
export function decrypt(blob: string) {
  const [v, iv, tag, enc] = blob.split('.');
  if (v !== 'v1') throw new Error('Formato de secreto desconocido');
  const d = createDecipheriv('aes-256-gcm', k(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8');
}

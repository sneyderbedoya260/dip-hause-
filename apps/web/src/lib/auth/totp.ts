import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32(buf: Buffer) { let bits = '', out = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i < bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return out; }
function unb32(s: string) { let bits = ''; for (const c of s.replace(/=+$/, '')) bits += A.indexOf(c).toString(2).padStart(5, '0'); const out: number[] = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); }
function hotp(secret: Buffer, counter: number) {
  const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', secret).update(b).digest(), o = h[19] & 15;
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0');
}
export const newTotpSecret = () => b32(randomBytes(20));
export const otpauthUrl = (email: string, secret: string) => `otpauth://totp/${encodeURIComponent('Dip House:' + email)}?secret=${secret}&issuer=${encodeURIComponent('Dip House')}&algorithm=SHA1&digits=6&period=30`;
/** Devuelve el paso (ventana de 30 s) que coincide, o null. Tolera ±1 ventana por desfase de reloj. */
export function matchTotp(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const s = unb32(secret), c = Math.floor(now / 30000);
  for (const d of [-1, 0, 1]) { const e = hotp(s, c + d); if (timingSafeEqual(Buffer.from(e), Buffer.from(code))) return c + d; }
  return null;
}
export const totpNow = (secret: string, now = Date.now()) => hotp(unb32(secret), Math.floor(now / 30000));
/** 8 códigos de respaldo de un solo uso (se muestran una vez; se guarda solo su hash). */
export function newRecoveryCodes() {
  const codes = Array.from({ length: 8 }, () => { const s = b32(randomBytes(7)).slice(0, 10); return `${s.slice(0, 5)}-${s.slice(5)}`; });
  return { codes, hashes: codes.map(hashRecovery) };
}
export const hashRecovery = (c: string) => createHash('sha256').update(c.replace(/[^A-Z2-7]/gi, '').toUpperCase()).digest('hex');

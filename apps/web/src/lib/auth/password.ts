import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';

// scrypt (memoria dura, sin dependencias nativas). Formato versionado para poder subir parámetros después.
const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64, MAXMEM = 128 * 1024 * 1024;
const scrypt = (pw: string, salt: Buffer, n = N, r = R, p = P) =>
  new Promise<Buffer>((res, rej) => _scrypt(pw.normalize('NFKC'), salt, KEYLEN, { N: n, r, p, maxmem: MAXMEM }, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${(await scrypt(pw, salt)).toString('base64')}`;
}
export async function verifyPassword(pw: string, stored: string) {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const key = await scrypt(pw, Buffer.from(salt, 'base64'), +n, +r, +p);
  const exp = Buffer.from(hash, 'base64');
  return key.length === exp.length && timingSafeEqual(key, exp);
}
/** Gasta el mismo tiempo cuando el usuario no existe, para no revelar qué correos están registrados. */
let dummy: string | undefined;
export async function fakeVerify(pw: string) { dummy ??= await hashPassword('relleno-para-igualar-tiempos'); await verifyPassword(pw, dummy); }

const COMMON = new Set(['password12', '1234567890', 'qwertyuiop', 'contraseña', 'contrasena1', 'admin12345', 'password123', '12345678910', 'abc1234567', 'iloveyou12', 'diphouse123', 'lavadoauto']);
export function passwordProblem(pw: string, email = '', min = 10): string | null {
  if (pw.length < min) return `La contraseña debe tener al menos ${min} caracteres.`;
  if (pw.length > 128) return 'La contraseña es demasiado larga.';
  const l = pw.toLowerCase();
  if (COMMON.has(l) || /^(.)\1+$/.test(pw) || /^(0123456789|1234567890|abcdefghij)/.test(l)) return 'Esa contraseña es muy común. Elige otra.';
  if (email && (l.includes(email.split('@')[0].toLowerCase()) && email.split('@')[0].length >= 4)) return 'La contraseña no debe contener tu correo.';
  if (new Set(pw).size < 5) return 'Usa más variedad de caracteres.';
  return null;
}

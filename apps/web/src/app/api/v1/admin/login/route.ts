import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { COOKIE, signAdmin } from '@/lib/auth';
import { fail, handle } from '@/lib/http';

const hash = (s: string) => createHash('sha256').update(s).digest();
const hits = new Map<string, { n: number; t: number }>();
const WINDOW = 15 * 60_000, MAX = 8;
function limited(ip: string) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || now - h.t > WINDOW) { hits.set(ip, { n: 1, t: now }); return false; }
  return ++h.n > MAX;
}

export const POST = (req: Request) => handle(async () => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (limited(ip)) return fail('Demasiados intentos. Espera unos minutos.', 429);
  const { password } = z.object({ password: z.string().max(200) }).parse(await req.json());
  if (!timingSafeEqual(hash(password), hash(process.env.ADMIN_PASSWORD ?? 'admin1234'))) return fail('Contraseña incorrecta', 401);
  hits.delete(ip);
  const token = await signAdmin();
  const res = NextResponse.json({ token }); // la app móvil guarda el token y lo envía como Bearer
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 604800, path: '/' });
  return res;
});

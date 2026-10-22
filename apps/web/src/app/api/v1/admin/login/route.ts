import { z } from 'zod';
import { NextResponse } from 'next/server';
import { COOKIE, signAdmin } from '@/lib/auth';
import { fail, handle } from '@/lib/http';

export const POST = (req: Request) => handle(async () => {
  const { password } = z.object({ password: z.string() }).parse(await req.json());
  if (password !== (process.env.ADMIN_PASSWORD ?? 'admin1234')) return fail('Contraseña incorrecta', 401);
  const token = await signAdmin();
  const res = NextResponse.json({ token }); // la app móvil guarda el token y lo envía como Bearer
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 604800, path: '/' });
  return res;
});

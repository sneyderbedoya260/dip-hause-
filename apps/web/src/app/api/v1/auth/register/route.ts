import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { RegisterInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { checkOrigin } from '@/lib/auth/guard';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { fail, handle } from '@/lib/http';

/** Registro de CLIENTES. El personal solo se crea desde el panel del administrador. */
export const POST = (req: Request) => handle(async () => {
  checkOrigin(req);
  if (!allow(`reg:${clientIp(req)}`, 10, 3600e3)) return fail('Demasiados registros desde esta red. Intenta más tarde.', 429);
  const d = RegisterInput.parse(await req.json());
  const problem = passwordProblem(d.password, d.email);
  if (problem) return fail(problem);
  if ((await db.select({ id: users.id }).from(users).where(eq(users.email, d.email))).length) return fail('Ya existe una cuenta con ese correo. Prueba iniciar sesión.', 409);
  const [u] = await db.insert(users).values({ email: d.email, name: d.name, phone: d.phone, role: 'customer', passwordHash: await hashPassword(d.password) }).returning();
  const token = await createSession(u.id, 'customer', req);
  const mobile = req.headers.get('x-client') === 'mobile';
  const res = NextResponse.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role }, ...(mobile ? { token } : {}) }, { status: 201 });
  if (!mobile) setSessionCookie(res, 'customer', token);
  return res;
});

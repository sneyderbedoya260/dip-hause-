import { randomBytes } from 'node:crypto';
import { eq, ne } from 'drizzle-orm';
import { StaffCreateInput } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { hashPassword } from '@/lib/auth/password';
import { createResetToken } from '@/lib/auth/tokens';
import { resetEmail } from '@/lib/emails';
import { fail, handle, ok } from '@/lib/http';
import { sendMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
const pub = { id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, active: users.active, lastLoginAt: users.lastLoginAt };
/** Admin: lista del personal (empleados y administradores). */
export const GET = (req: Request) => handle(async () => { await requireRole(req, ['admin']); return ok(await db.select(pub).from(users).where(ne(users.role, 'customer'))); });
/** Admin: crea una cuenta del personal. No se define clave: la persona recibe un enlace (48 h) para crearla. */
export const POST = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  const d = StaffCreateInput.parse(await req.json());
  if ((await db.select({ id: users.id }).from(users).where(eq(users.email, d.email))).length) return fail('Ya existe una cuenta con ese correo', 409);
  const [u] = await db.insert(users).values({ ...d, passwordHash: await hashPassword(randomBytes(32).toString('hex')) }).returning(pub);
  const token = await createResetToken(u.id, 48 * 3600e3);
  const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/admin/restablecer?token=${token}`;
  void sendMail({ to: d.email, ...resetEmail(d.name, link, 48 * 60, true) }).catch(e => console.error('[correo] invitación', e));
  return ok(u, 201);
});

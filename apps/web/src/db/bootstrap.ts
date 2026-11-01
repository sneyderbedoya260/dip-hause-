import { eq } from 'drizzle-orm';
import { hashPassword, passwordProblem } from '@/lib/auth/password';
import { db } from './index';
import { users } from './schema';

/** Si no existe ningún administrador, crea el primero con ADMIN_EMAIL / ADMIN_PASSWORD. Después esas variables ya no se usan. */
export async function bootstrapAdmin() {
  const [a] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
  if (a) return;
  const prod = process.env.NODE_ENV === 'production';
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase(), pw = process.env.ADMIN_PASSWORD ?? '';
  if (prod && (!email || passwordProblem(pw, email, 12))) throw new Error('No hay administradores. Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) para crear el primero.');
  await db.insert(users).values({ email: email || 'admin@dip.local', name: process.env.ADMIN_NAME ?? 'Administrador', role: 'admin', passwordHash: await hashPassword(pw || 'admin-dev-12345'), emailVerifiedAt: new Date() });
  console.log(`[dip-house] administrador creado: ${email || 'admin@dip.local'}`);
}

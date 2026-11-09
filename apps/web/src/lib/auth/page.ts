import { redirect } from 'next/navigation';
import { REQUIRE_2FA, serverUser } from './guard';

/** Para páginas del panel: solo administradores (los empleados van a su vista). */
export async function staffPage() {
  const me = await serverUser('staff');
  if (!me) redirect('/admin/ingresar');
  if (REQUIRE_2FA() && !me.totpEnabled) redirect('/admin/seguridad'); // primero debe activar la verificación en dos pasos
  return me;
}
export async function adminPage() {
  const me = await staffPage();
  if (me.role !== 'admin') redirect('/admin');
  return me;
}

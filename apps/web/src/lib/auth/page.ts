import { redirect } from 'next/navigation';
import { serverUser } from './guard';

/** Para páginas del panel: solo administradores (los empleados van a su vista). */
export async function adminPage() {
  const me = await serverUser('staff');
  if (!me) redirect('/admin/ingresar');
  if (me.role !== 'admin') redirect('/admin');
  return me;
}

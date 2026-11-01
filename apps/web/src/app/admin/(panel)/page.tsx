import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { serverUser } from '@/lib/auth/guard';

export default async function Page() {
  const me = await serverUser('staff');
  if (!me) redirect('/admin/ingresar'); // el layout y la página se renderizan en paralelo: ambos deben proteger
  return <AdminDashboard role={me.role as 'admin' | 'employee'} />;
}

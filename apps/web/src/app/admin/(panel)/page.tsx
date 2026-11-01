import { redirect } from 'next/navigation';
import AppointmentsView from '@/components/admin/AppointmentsView';
import { serverUser } from '@/lib/auth/guard';

export default async function Page() {
  const me = await serverUser('staff');
  if (!me) redirect('/admin/ingresar');
  return <AppointmentsView role={me.role as 'admin' | 'employee'} />;
}

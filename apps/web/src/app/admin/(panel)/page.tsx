import { redirect } from 'next/navigation';
import AppointmentsView from '@/components/admin/AppointmentsView';
import { staffPage } from '@/lib/auth/page';

export default async function Page() {
  const me = await staffPage();
  if (me.role === 'admin') redirect('/admin/reportes'); // el admin aterriza en el dashboard
  return <AppointmentsView role="employee" />;
}

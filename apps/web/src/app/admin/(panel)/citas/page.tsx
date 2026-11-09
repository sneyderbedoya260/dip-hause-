import AppointmentsView from '@/components/admin/AppointmentsView';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <AppointmentsView role="admin" />;
}

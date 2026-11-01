import CalendarView from '@/components/admin/CalendarView';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <CalendarView />;
}

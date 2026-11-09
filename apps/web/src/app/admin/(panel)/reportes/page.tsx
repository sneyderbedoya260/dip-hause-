import ReportsView from '@/components/admin/ReportsView';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <ReportsView />;
}

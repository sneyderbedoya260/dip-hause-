import StaffAdmin from '@/components/admin/StaffAdmin';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <StaffAdmin />;
}

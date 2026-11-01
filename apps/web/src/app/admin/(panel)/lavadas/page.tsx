import WashesAdmin from '@/components/admin/WashesAdmin';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <WashesAdmin />;
}

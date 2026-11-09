import OrdersAdmin from '@/components/admin/OrdersAdmin';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <OrdersAdmin />;
}

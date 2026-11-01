import ProductsAdmin from '@/components/admin/ProductsAdmin';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <ProductsAdmin />;
}

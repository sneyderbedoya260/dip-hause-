import { redirect } from 'next/navigation';
import SecurityAdmin from '@/components/admin/SecurityAdmin';
import { REQUIRE_2FA, serverUser } from '@/lib/auth/guard';

export default async function Page() {
  const me = await serverUser('staff');
  if (!me) redirect('/admin/ingresar');
  return <SecurityAdmin required={REQUIRE_2FA()} />;
}

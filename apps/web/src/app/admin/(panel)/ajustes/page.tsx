import SettingsAdmin from '@/components/admin/SettingsAdmin';
import { adminPage } from '@/lib/auth/page';

export default async function Page() {
  await adminPage();
  return <SettingsAdmin />;
}

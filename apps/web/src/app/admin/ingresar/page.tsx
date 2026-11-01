import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { serverUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';
export default async function Page() {
  if (await serverUser('staff')) redirect('/admin');
  return <main className="center"><AuthForm mode="login" audience="staff" /></main>;
}

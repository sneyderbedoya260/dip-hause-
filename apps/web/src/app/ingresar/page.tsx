import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { serverUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: { next?: string } }) {
  if (await serverUser('customer')) redirect('/mi-cuenta');
  return <main className="center"><AuthForm mode="login" audience="customer" next={searchParams.next} /></main>;
}

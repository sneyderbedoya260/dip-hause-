import VerifyEmail from '@/components/VerifyEmail';
export default function Page({ searchParams }: { searchParams: { token?: string } }) { return <VerifyEmail token={searchParams.token} />; }

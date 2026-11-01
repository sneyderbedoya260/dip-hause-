import AuthForm from '@/components/AuthForm';
export default function Page({ searchParams }: { searchParams: { token?: string } }) {
  return <main className="center">{searchParams.token ? <AuthForm mode="reset" audience="customer" token={searchParams.token} /> : <p className="err">Enlace incompleto. Solicita uno nuevo.</p>}</main>;
}

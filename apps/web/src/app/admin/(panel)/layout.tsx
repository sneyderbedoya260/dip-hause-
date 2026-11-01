import { redirect } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import LogoutButton from '@/components/LogoutButton';
import { serverUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await serverUser('staff');
  if (!me) redirect('/admin/ingresar');
  return (
    <div className="wrap" style={{ paddingBottom: 48 }}>
      <div className="row" style={{ margin: '24px 0' }}>
        <div><h2 className="sec" style={{ margin: 0 }}>Panel</h2><p className="sub" style={{ margin: 0 }}>{me.name} · {me.role === 'admin' ? 'Administrador' : 'Empleado'}</p></div>
        <LogoutButton to="/admin/ingresar" />
      </div>
      <AdminNav role={me.role as 'admin' | 'employee'} />
      {children}
    </div>
  );
}

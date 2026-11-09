import { desc, eq, or } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { formatCop } from '@dip/shared';
import LogoutButton from '@/components/LogoutButton';
import VerifyBanner from '@/components/VerifyBanner';
import { db } from '@/db';
import { appointments, orders } from '@/db/schema';
import { serverUser } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';
export default async function MiCuenta() {
  const me = await serverUser('customer');
  if (!me) redirect('/ingresar?next=/mi-cuenta');
  const list = await db.select().from(appointments).where(me.emailVerified ? or(eq(appointments.userId, me.id), eq(appointments.email, me.email)) : eq(appointments.userId, me.id)).orderBy(desc(appointments.date), desc(appointments.time));
  const myOrders = await db.select().from(orders).where(me.emailVerified ? or(eq(orders.userId, me.id), eq(orders.email, me.email)) : eq(orders.userId, me.id)).orderBy(desc(orders.createdAt));
  return (
    <main className="wrap" style={{ paddingBottom: 40 }}>
      <div className="row" style={{ marginTop: 32 }}><div><h2 className="sec" style={{ margin: 0 }}>Hola, {me.name.split(' ')[0]}</h2><p className="sub" style={{ margin: 0 }}>{me.email}</p></div><LogoutButton /></div>
      {!me.emailVerified && <VerifyBanner />}
      <h3 style={{ margin: '28px 0 12px' }}>Mis citas</h3>
      {list.length === 0 && <div className="card"><div className="card-b"><p className="sub" style={{ margin: 0 }}>Aún no tienes citas. <a href="/#lavadas" style={{ color: 'var(--blue)' }}>Agenda tu primera lavada</a>.</p></div></div>}
      <div className="grid">{list.map(a => (
        <article className="card" key={a.id}><div className="card-b">
          <div className="row"><b>{a.washName}</b><span className={`tag ${a.status}`}>{a.status}</span></div>
          <span className="price">{a.date} · {a.time}</span>
          <p className="clamp">{a.address}</p><div className="row"><span className="chip">{a.code}</span><span>{formatCop(a.priceCop)}</span></div>
        </div></article>))}</div>
      <h3 style={{ margin: '28px 0 12px' }}>Mis pedidos</h3>
      {myOrders.length === 0 && <div className="card"><div className="card-b"><p className="sub" style={{ margin: 0 }}>Aún no tienes pedidos. <a href="/#productos" style={{ color: 'var(--blue)' }}>Ver productos</a>.</p></div></div>}
      <div className="grid">{myOrders.map(o => (
        <article className="card" key={o.id}><div className="card-b">
          <div className="row"><b>{o.code}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
          <span className="price">{formatCop(o.totalCop)}</span>
          <p className="clamp">{o.paymentStatus === 'pagado' ? 'Pagado' : 'Por pagar'} · {o.delivery === 'envio' ? 'Envío a domicilio' : 'Recoger en el local'}</p>
        </div></article>))}</div>
    </main>
  );
}

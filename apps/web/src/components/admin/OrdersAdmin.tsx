'use client';
import { useCallback, useEffect, useState } from 'react';
import { formatCop } from '@dip/shared';
import { api } from './api';

type Order = { id: string; code: string; createdAt: string; customerName: string; phone: string; email: string; delivery: 'pickup' | 'envio'; address: string; notes: string; totalCop: number; paymentMethod: string; paymentStatus: string; status: string; items: { id: string; name: string; qty: number; priceCop: number }[] };
const NEXT: Record<string, [string, string]> = { nuevo: ['listo', 'Marcar listo'], listo: ['entregado', 'Marcar entregado'] };

export default function OrdersAdmin() {
  const [list, setList] = useState<Order[] | null>(null); const [f, setF] = useState('nuevo'); const [err, setErr] = useState('');
  const load = useCallback(async () => { try { setList(await api('/api/v1/orders')); } catch (e) { setErr((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  const patch = async (id: string, b: object) => { try { setErr(''); await api(`/api/v1/orders/${id}`, 'PATCH', b); await load(); } catch (e) { setErr((e as Error).message); } };
  if (!list) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 160 }} aria-busy="true" />;
  const shown = list.filter(o => f === 'todos' || o.status === f);
  return <>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="chips">{['nuevo', 'listo', 'entregado', 'cancelado', 'todos'].map(s => <button key={s} className="pill" aria-pressed={f === s} onClick={() => setF(s)}>{s}{s === 'nuevo' ? ` (${list.filter(o => o.status === 'nuevo').length})` : ''}</button>)}</div>
    {shown.length === 0 && <div className="card"><div className="card-b"><p className="sub" style={{ margin: 0 }}>No hay pedidos en esta vista.</p></div></div>}
    <div className="grid">{shown.map(o => (
      <article className="card" key={o.id}><div className="card-b">
        <div className="row"><b>{o.code}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
        <span className="note">{new Date(o.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        <span>{o.customerName} · <a href={`tel:${o.phone}`} style={{ color: 'var(--blue)' }}>{o.phone}</a></span>
        <span className="note">{o.delivery === 'envio' ? `Envío a: ${o.address}` : 'Recoge en el local'}</span>
        <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{o.items.map(i => <li key={i.id}>{i.qty} × {i.name}</li>)}</ul>
        <div className="row"><span className="price">{formatCop(o.totalCop)}</span><span className={`tag ${o.paymentStatus === 'pagado' ? 'completada' : 'pendiente'}`}>{o.paymentStatus === 'pagado' ? 'pagado' : 'por pagar'}</span></div>
        <div className="row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {NEXT[o.status] && <button className="btn sm" onClick={() => patch(o.id, { status: NEXT[o.status][0] })}>{NEXT[o.status][1]}</button>}
          {o.paymentStatus !== 'pagado' && o.status !== 'cancelado' && <button className="btn sm ghost" onClick={() => patch(o.id, { markPaid: true })}>Registrar pago recibido</button>}
          {(o.status === 'nuevo' || o.status === 'listo') && <button className="btn sm ghost" onClick={() => patch(o.id, { status: 'cancelado' })}>Cancelar</button>}
        </div>
      </div></article>))}</div>
  </>;
}

'use client';
import { useEffect, useState } from 'react';
import { formatCop } from '@dip/shared';
import { useCart } from './CartProvider';

const post = async (url: string, body: unknown) => { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error ?? 'No se pudo completar'); return d; };

export default function CartPage() {
  const { items, total, setQty, clear } = useCart();
  const [f, setF] = useState({ customerName: '', phone: '', email: '', address: '', notes: '' });
  const [delivery, setDelivery] = useState<'pickup' | 'envio'>('pickup'); const [method, setMethod] = useState<'mercadopago' | 'cash'>('mercadopago');
  const [accept, setAccept] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState<string | null>(null);
  useEffect(() => { fetch('/api/v1/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.user?.role === 'customer') setF(p => ({ ...p, customerName: d.user.name, email: d.user.email, phone: d.user.phone ?? '' })); }).catch(() => {}); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setErr('');
    if (!accept) return setErr('Debes aceptar la política de privacidad.');
    setBusy(true);
    try {
      const o = await post('/api/v1/orders', { items: items.map(i => ({ productId: i.id, qty: i.qty })), delivery, paymentMethod: method, acceptPrivacy: true, ...f });
      clear();
      if (method === 'mercadopago') {
        try { const p = await post('/api/v1/payments/preference', { orderId: o.id }); if (p.init_point) { window.location.href = p.init_point; return; } } catch { /* sin Mercado Pago configurado: queda por pagar */ }
      }
      setDone(o.code);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  if (done) return <main className="center"><div><h2 className="sec" style={{ margin: 0 }}>¡Pedido recibido!</h2><p className="sub" style={{ margin: '10px 0' }}>Código <b>{done}</b>. Te contactaremos para coordinar la entrega.</p><a className="btn" href="/">Volver al inicio</a></div></main>;
  if (items.length === 0) return <main className="center"><div><h2 className="sec" style={{ margin: 0 }}>Tu carrito está vacío</h2><p className="sub" style={{ margin: '10px 0' }}>Agrega productos desde el catálogo.</p><a className="btn" href="/#productos">Ver productos</a></div></main>;
  return (
    <main className="wrap" style={{ maxWidth: 620, paddingBottom: 40 }}>
      <h2 className="sec">Tu carrito</h2>
      {items.map(i => <div className="row card" key={i.id} style={{ padding: 12, marginBottom: 8 }}>
        <div><b>{i.name}</b><br /><span className="price" style={{ fontSize: 16 }}>{formatCop(i.priceCop)}</span></div>
        <div className="row" style={{ gap: 4 }}><button className="x" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Quitar uno">−</button><b style={{ minWidth: 24, textAlign: 'center' }}>{i.qty}</b><button className="x" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Agregar uno">+</button></div></div>)}
      <div className="row" style={{ margin: '14px 0' }}><span>Total</span><span className="price">{formatCop(total)}</span></div>
      <label className="f">Nombre completo<input value={f.customerName} onChange={set('customerName')} autoComplete="name" /></label>
      <div className="row2"><label className="f">Teléfono<input value={f.phone} onChange={set('phone')} type="tel" autoComplete="tel" /></label><label className="f">Correo<input value={f.email} onChange={set('email')} type="email" autoComplete="email" /></label></div>
      <div className="chips" style={{ marginTop: 12 }}><button className="pill" aria-pressed={delivery === 'pickup'} onClick={() => setDelivery('pickup')}>Recoger en el local</button><button className="pill" aria-pressed={delivery === 'envio'} onClick={() => setDelivery('envio')}>Envío a domicilio</button></div>
      {delivery === 'envio' && <label className="f">Dirección de entrega<input value={f.address} onChange={set('address')} autoComplete="street-address" /></label>}
      <label className="f">Método de pago<select value={method} onChange={e => setMethod(e.target.value as 'mercadopago' | 'cash')}><option value="mercadopago">Pagar en línea con Mercado Pago</option><option value="cash">Pagar al recibir</option></select></label>
      <label className="f" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400 }}><input type="checkbox" checked={accept} onChange={e => setAccept(e.target.checked)} style={{ width: 20, minHeight: 20, marginTop: 3 }} /><span>He leído y acepto la <a href="/privacidad" target="_blank" rel="noopener" style={{ color: 'var(--blue)' }}>política de privacidad</a>.</span></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button className={`btn${busy ? ' loading' : ''}`} style={{ width: '100%', marginTop: 14 }} onClick={submit}>{method === 'mercadopago' ? `Pagar ${formatCop(total)}` : 'Confirmar pedido'}</button>
    </main>
  );
}

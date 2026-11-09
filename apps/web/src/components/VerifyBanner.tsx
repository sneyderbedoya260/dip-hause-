'use client';
import { useState } from 'react';

export default function VerifyBanner() {
  const [s, setS] = useState(''); const [busy, setBusy] = useState(false);
  return <div className="card" style={{ borderColor: 'var(--blue)', marginTop: 16 }}><div className="card-b">
    <b>Confirma tu correo</b><p className="note" style={{ margin: 0 }}>Te enviamos un enlace. Hasta confirmarlo, solo verás las citas y pedidos hechos con tu sesión iniciada.</p>
    {s && <p role="status" style={{ color: '#4ADE9A', margin: 0 }}>{s}</p>}
    <button className={`btn ghost${busy ? ' loading' : ''}`} onClick={async () => { setBusy(true); setS(''); const r = await fetch('/api/v1/auth/verify/resend', { method: 'POST' }); const d = await r.json().catch(() => ({})); setS(r.ok ? 'Correo enviado. Revisa tu bandeja.' : d.error ?? 'No se pudo enviar'); setBusy(false); }}>Reenviar correo</button></div></div>;
}

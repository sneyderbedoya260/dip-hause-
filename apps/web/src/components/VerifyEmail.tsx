'use client';
import { useEffect, useState } from 'react';

export default function VerifyEmail({ token }: { token?: string }) {
  const [s, setS] = useState<'loading' | 'ok' | 'err'>('loading'); const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!token) { setS('err'); setMsg('Enlace incompleto.'); return; }
    fetch('/api/v1/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(async r => { const d = await r.json().catch(() => ({})); if (r.ok) setS('ok'); else { setS('err'); setMsg(d.error ?? 'No se pudo verificar.'); } }).catch(() => { setS('err'); setMsg('No se pudo verificar.'); });
  }, [token]);
  return <main className="center"><div>{s === 'loading' ? <><div className="skel" style={{ width: 220, height: 24 }} /></> : s === 'ok' ? <><h2 className="sec" style={{ margin: 0 }}>¡Correo confirmado!</h2><p className="sub" style={{ margin: '10px 0' }}>Ya puedes ver tus citas y pedidos en tu cuenta.</p><a className="btn" href="/mi-cuenta">Ir a mi cuenta</a></> : <><h2 className="sec" style={{ margin: 0 }}>No se pudo confirmar</h2><p className="sub" style={{ margin: '10px 0' }}>{msg}</p><a className="btn" href="/mi-cuenta">Ir a mi cuenta</a></>}</div></main>;
}

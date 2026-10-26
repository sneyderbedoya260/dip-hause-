'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCop, formatDuration } from '@dip/shared';

type Extra = { id: string; name: string; description: string; priceCop: number; durationMin: number };
type Wash = { id: string; name: string; priceCop: number; durationMin: number; extras: Extra[] };
const label = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const empty = { customerName: '', phone: '', email: '', vehicle: '', plate: '', address: '', refs: '', notes: '' };

export default function Agendar() {
  const { washId } = useParams<{ washId: string }>();
  const [wash, setWash] = useState<Wash | null>(null);
  const [days, setDays] = useState<Record<string, string[]>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [date, setDate] = useState(''); const [time, setTime] = useState('');
  const [f, setF] = useState(empty); const [method, setMethod] = useState<'mercadopago' | 'cash'>('mercadopago');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/washes/${washId}`).then(r => r.json()).then(setWash);
  }, [washId]);
  useEffect(() => {
    fetch(`/api/v1/availability?washId=${washId}&days=60&extraIds=${picked.join(',')}`).then(r => r.json()).then(d => { setDays(d.days ?? {}); setDate(''); setTime(''); });
  }, [washId, picked]);
  const chosen = wash?.extras.filter(x => picked.includes(x.id)) ?? [];
  const total = (wash?.priceCop ?? 0) + chosen.reduce((a, x) => a + x.priceCop, 0);
  const minutes = (wash?.durationMin ?? 0) + chosen.reduce((a, x) => a + x.durationMin, 0);
  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setErr('');
    if (!date || !time) return setErr('Elige un día y una hora disponibles.');
    setBusy(true);
    try {
      const r = await fetch('/api/v1/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ washId, date, time, paymentMethod: method, extraIds: picked, ...f }) });
      const a = await r.json();
      if (!r.ok) throw new Error(a.error);
      if (method === 'mercadopago') {
        const p = await fetch('/api/v1/payments/preference', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appointmentId: a.id }) });
        const pj = await p.json();
        if (p.ok && pj.init_point) { window.location.href = pj.init_point; return; }
      }
      setDone(a.code);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  if (done) return <main className="center"><div><h2 className="sec" style={{ margin: 0 }}>¡Solicitud enviada!</h2><p className="sub" style={{ margin: '10px 0' }}>Código <b>{done}</b>. El administrador confirmará tu cita y te avisaremos.</p><a className="btn" href="/">Volver al inicio</a></div></main>;
  if (!wash) return <main className="wrap" style={{ paddingTop: 32 }} aria-busy="true"><div className="skel" style={{ height: 80 }} /><div className="skel" style={{ height: 320, marginTop: 16 }} /></main>;

  return (
    <main className="wrap" style={{ maxWidth: 560, paddingBottom: 40 }}>
      <h2 className="sec">{wash.name}</h2>
      <p className="sub">{formatCop(total)} · {formatDuration(minutes)} · a domicilio</p>
      {wash.extras.length > 0 && <><b>Servicios adicionales (opcional)</b><div style={{ margin: '8px 0 16px' }}>{wash.extras.map(x => (
        <button key={x.id} className="pill" role="checkbox" aria-checked={picked.includes(x.id)} aria-pressed={picked.includes(x.id)} onClick={() => toggle(x.id)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', textAlign: 'left', marginBottom: 8, gap: 12 }}>
          <span>{x.name}<br /><small style={{ fontWeight: 400, opacity: .8 }}>{x.description ? x.description + ' · ' : ''}+{formatDuration(x.durationMin)}</small></span><span>+{formatCop(x.priceCop)}</span></button>))}</div></>}
      <b>Elige el día</b>
      <div className="chips" role="group" aria-label="Días disponibles">
        {Object.keys(days).length === 0 && <span className="note">Sin días disponibles por ahora.</span>}
        {Object.keys(days).map(d => <button key={d} className="pill" aria-pressed={date === d} onClick={() => { setDate(d); setTime(''); }}>{label(d)}</button>)}
      </div>
      {date && <><b>Horarios disponibles</b><div className="slots" style={{ marginTop: 8 }}>{days[date].map(t => <button key={t} className="pill" aria-pressed={time === t} onClick={() => setTime(t)}>{t}</button>)}</div></>}
      {([['customerName', 'Nombre completo'], ['phone', 'Teléfono'], ['email', 'Correo electrónico'], ['vehicle', 'Vehículo (marca y modelo)'], ['plate', 'Placa'], ['address', 'Dirección del servicio'], ['refs', 'Barrio o referencias (opcional)']] as const).map(([k, l]) =>
        <label className="f" key={k}>{l}<input value={f[k]} onChange={set(k)} type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'} /></label>)}
      <label className="f">Notas (opcional)<textarea rows={2} value={f.notes} onChange={set('notes')} /></label>
      <label className="f">Método de pago
        <select value={method} onChange={e => setMethod(e.target.value as 'mercadopago' | 'cash')}>
          <option value="mercadopago">Pagar en línea con Mercado Pago</option><option value="cash">Pagar al finalizar el servicio</option>
        </select></label>
      {err && <p className="err" role="alert">{err}</p>}
      <p className="note">El administrador debe confirmar tu cita. Tu horario queda reservado mientras tanto.</p>
      <button className={`btn${busy ? ' loading' : ''}`} style={{ width: '100%', marginTop: 12 }} onClick={submit}>{method === 'mercadopago' ? `Pagar ${formatCop(total)}` : 'Enviar solicitud'}</button>
    </main>
  );
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { formatCop } from '@dip/shared';

type Appt = { id: string; code: string; washName: string; date: string; time: string; status: string; customerName: string; phone: string; address: string; refs: string; vehicle: string; plate: string; priceCop: number; paymentStatus: string; assignedTo: string | null; extras: string };
type Staff = { id: string; name: string; email: string; role: string; active: boolean };
const api = async (url: string, method = 'GET', body?: unknown) => {
  const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error ?? 'Error'); return d;
};

export default function AdminDashboard({ role }: { role: 'admin' | 'employee' }) {
  const admin = role === 'admin';
  const [appts, setAppts] = useState<Appt[] | null>(null); const [staff, setStaff] = useState<Staff[]>([]);
  const [filter, setFilter] = useState('pendiente'); const [err, setErr] = useState(''); const [inv, setInv] = useState({ name: '', email: '', role: 'employee' }); const [note, setNote] = useState('');
  const load = useCallback(async () => {
    try { setAppts(await api('/api/v1/appointments')); if (admin) setStaff(await api('/api/v1/staff')); } catch (e) { setErr((e as Error).message); }
  }, [admin]);
  useEffect(() => { load(); }, [load]);
  const patch = async (id: string, b: object) => { try { await api(`/api/v1/appointments/${id}`, 'PATCH', b); await load(); } catch (e) { setErr((e as Error).message); } };
  const list = (appts ?? []).filter(a => filter === 'todas' || a.status === filter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const team = staff.filter(s => s.role === 'employee' && s.active);

  if (!appts) return err ? <p className="err">{err}</p> : <div aria-busy="true"><div className="skel" style={{ height: 120 }} /><div className="skel" style={{ height: 120, marginTop: 12 }} /></div>;
  return <>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="chips">{(admin ? ['pendiente', 'confirmada', 'completada', 'todas'] : ['confirmada', 'completada', 'todas']).map(f => <button key={f} className="pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}{f === 'pendiente' ? ` (${appts.filter(a => a.status === 'pendiente').length})` : ''}</button>)}</div>
    {list.length === 0 && <div className="card"><div className="card-b"><p className="sub" style={{ margin: 0 }}>No hay citas en esta vista.</p></div></div>}
    <div className="grid">{list.map(a => <article className="card" key={a.id}><div className="card-b">
      <div className="row"><span className="price">{a.date} · {a.time}</span><span className={`tag ${a.status}`}>{a.status}</span></div>
      <b>{a.washName}</b>
      <span>{a.customerName} · <a href={`tel:${a.phone}`} style={{ color: 'var(--blue)' }}>{a.phone}</a></span>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`} target="_blank" rel="noopener" style={{ color: 'var(--blue)' }}>{a.address}</a>
      <span className="note">{a.vehicle} · {a.plate} · {formatCop(a.priceCop)} · {a.paymentStatus === 'pagado' ? 'pagado' : 'por pagar'} · {a.code}</span>
      {admin && <label className="f">Empleado asignado<select value={a.assignedTo ?? ''} onChange={e => patch(a.id, { assignedTo: e.target.value || null })}><option value="">Sin asignar</option>{team.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      <div className="row" style={{ marginTop: 8, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        {admin && a.status === 'pendiente' && <><button className="btn" onClick={() => patch(a.id, { status: 'confirmada' })}>Confirmar</button><button className="btn ghost" onClick={() => patch(a.id, { status: 'cancelada' })}>Rechazar</button></>}
        {a.status === 'confirmada' && <button className="btn" onClick={() => patch(a.id, { status: 'completada' })}>Marcar completada</button>}
        {admin && a.status === 'confirmada' && <button className="btn ghost" onClick={() => patch(a.id, { status: 'cancelada' })}>Cancelar</button>}
      </div>
    </div></article>)}</div>
    {admin && <section style={{ marginTop: 40 }}>
      <h3>Personal</h3>
      {staff.map(s => <div className="row card" key={s.id} style={{ padding: 12, marginTop: 8 }}><div><b>{s.name}</b><br /><span className="note">{s.email} · {s.role}</span></div>
        <button className="btn ghost" onClick={async () => { try { await api(`/api/v1/staff/${s.id}`, 'PATCH', { active: !s.active }); await load(); } catch (e) { setErr((e as Error).message); } }}>{s.active ? 'Desactivar' : 'Activar'}</button></div>)}
      <div className="card" style={{ marginTop: 12 }}><div className="card-b"><b>Invitar a una persona</b>
        <label className="f">Nombre<input value={inv.name} onChange={e => setInv({ ...inv, name: e.target.value })} /></label>
        <label className="f">Correo<input type="email" value={inv.email} onChange={e => setInv({ ...inv, email: e.target.value })} /></label>
        <label className="f">Rol<select value={inv.role} onChange={e => setInv({ ...inv, role: e.target.value })}><option value="employee">Empleado</option><option value="admin">Administrador</option></select></label>
        <p className="note">Recibirá un correo con un enlace para crear su contraseña (vale 48 horas).</p>
        {note && <p role="status" style={{ color: '#4ADE9A' }}>{note}</p>}
        <button className="btn" onClick={async () => { setNote(''); setErr(''); try { await api('/api/v1/staff', 'POST', inv); setNote('Invitación enviada.'); setInv({ name: '', email: '', role: 'employee' }); await load(); } catch (e) { setErr((e as Error).message); } }}>Enviar invitación</button>
      </div></div>
    </section>}
  </>;
}

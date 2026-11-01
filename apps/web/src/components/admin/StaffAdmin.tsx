'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, Staff } from './api';

export default function StaffAdmin() {
  const [list, setList] = useState<Staff[] | null>(null); const [err, setErr] = useState(''); const [note, setNote] = useState(''); const [inv, setInv] = useState({ name: '', email: '', role: 'employee' });
  const load = useCallback(async () => { try { setList(await api('/api/v1/staff')); } catch (e) { setErr((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  if (!list) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 120 }} aria-busy="true" />;
  return <>
    {err && <p className="err" role="alert">{err}</p>}
    {list.map(s => <div className="row card" key={s.id} style={{ padding: 12, marginBottom: 8 }}><div><b>{s.name}</b><br /><span className="note">{s.email} · {s.role === 'admin' ? 'administrador' : 'empleado'}{s.active ? '' : ' · desactivado'}</span></div>
      <button className="btn sm ghost" onClick={async () => { try { setErr(''); await api(`/api/v1/staff/${s.id}`, 'PATCH', { active: !s.active }); await load(); } catch (e) { setErr((e as Error).message); } }}>{s.active ? 'Desactivar' : 'Activar'}</button></div>)}
    <div className="card" style={{ marginTop: 16 }}><div className="card-b"><h3>Invitar a una persona</h3>
      <label className="f">Nombre<input value={inv.name} onChange={e => setInv({ ...inv, name: e.target.value })} /></label>
      <label className="f">Correo<input type="email" value={inv.email} onChange={e => setInv({ ...inv, email: e.target.value })} /></label>
      <label className="f">Rol<select value={inv.role} onChange={e => setInv({ ...inv, role: e.target.value })}><option value="employee">Empleado</option><option value="admin">Administrador</option></select></label>
      <p className="note">Recibirá un correo con un enlace para crear su contraseña (vale 48 horas).</p>
      {note && <p role="status" style={{ color: '#4ADE9A' }}>{note}</p>}
      <button className="btn" onClick={async () => { setNote(''); setErr(''); try { await api('/api/v1/staff', 'POST', inv); setNote('Invitación enviada.'); setInv({ name: '', email: '', role: 'employee' }); await load(); } catch (e) { setErr((e as Error).message); } }}>Enviar invitación</button>
    </div></div>
  </>;
}

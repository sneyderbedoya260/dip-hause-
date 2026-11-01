'use client';
import { useState } from 'react';
import ApptCard from './ApptCard';
import { dayLabel } from './api';
import { useAppointments } from './useAppointments';

export default function AppointmentsView({ role }: { role: 'admin' | 'employee' }) {
  const admin = role === 'admin';
  const { appts, team, err, patch } = useAppointments(admin);
  const [filter, setFilter] = useState(admin ? 'pendiente' : 'confirmada');
  if (!appts) return err ? <p className="err">{err}</p> : <div aria-busy="true"><div className="skel" style={{ height: 120 }} /><div className="skel" style={{ height: 120, marginTop: 12 }} /></div>;
  const filters = admin ? ['pendiente', 'confirmada', 'completada', 'cancelada', 'todas'] : ['confirmada', 'completada', 'todas'];
  const list = appts.filter(a => filter === 'todas' || a.status === filter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const groups = list.reduce<Record<string, typeof list>>((g, a) => ((g[a.date] ??= []).push(a), g), {});
  return <>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="chips">{filters.map(f => <button key={f} className="pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}{f === 'pendiente' ? ` (${appts.filter(a => a.status === 'pendiente').length})` : ''}</button>)}</div>
    {list.length === 0 && <div className="card"><div className="card-b"><p className="sub" style={{ margin: 0 }}>{admin ? 'No hay citas en esta vista.' : 'No tienes servicios asignados. El administrador te los asigna al confirmar las citas.'}</p></div></div>}
    {Object.keys(groups).map(d => <section key={d}><h3 className="dayh">{dayLabel(d)}</h3><div className="grid">{groups[d].map(a => <ApptCard key={a.id} a={a} admin={admin} team={team} onPatch={patch} />)}</div></section>)}
  </>;
}

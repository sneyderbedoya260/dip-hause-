'use client';
import { useState } from 'react';
import ApptCard from './ApptCard';
import { dayLabel } from './api';
import { useAppointments } from './useAppointments';

const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function CalendarView() {
  const { appts, team, err, patch } = useAppointments(true);
  const now = new Date(); const today = key(now.getFullYear(), now.getMonth(), now.getDate());
  const [cal, setCal] = useState({ y: now.getFullYear(), m: now.getMonth() }); const [sel, setSel] = useState(today);
  if (!appts) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 360 }} aria-busy="true" />;
  const live = appts.filter(a => a.status !== 'cancelada');
  const off = (new Date(cal.y, cal.m, 1).getDay() + 6) % 7, n = new Date(cal.y, cal.m + 1, 0).getDate();
  const title = new Date(cal.y, cal.m, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const go = (d: number) => setCal(c => { const t = new Date(c.y, c.m + d, 1); return { y: t.getFullYear(), m: t.getMonth() }; });
  const day = live.filter(a => a.date === sel).sort((a, b) => a.time.localeCompare(b.time));
  return <>
    {err && <p className="err" role="alert">{err}</p>}
    <div className="cal">
      <div className="cal-h"><button className="x" onClick={() => go(-1)} aria-label="Mes anterior">‹</button><b style={{ textTransform: 'capitalize' }}>{title}</b><button className="x" onClick={() => go(1)} aria-label="Mes siguiente">›</button></div>
      <div className="cal-w">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i}>{x}</span>)}</div>
      <div className="cal-g">
        {Array.from({ length: off }, (_, i) => <span key={'o' + i} />)}
        {Array.from({ length: n }, (_, i) => {
          const ds = key(cal.y, cal.m, i + 1), L = live.filter(a => a.date === ds), conf = L.filter(a => a.status === 'confirmada' || a.status === 'completada').length, pen = L.filter(a => a.status === 'pendiente').length;
          return <button key={ds} className={`day${ds === today ? ' today' : ''}`} aria-pressed={sel === ds} onClick={() => setSel(ds)} aria-label={`${dayLabel(ds)}: ${conf} confirmadas, ${pen} por confirmar`}>
            <span>{i + 1}</span><span className="pips">{conf > 0 && <i className="pip c">{conf}</i>}{pen > 0 && <i className="pip p">{pen}</i>}</span></button>;
        })}
      </div>
    </div>
    <p className="note" style={{ margin: '10px 0' }}><i className="pip c">1</i> confirmadas &nbsp; <i className="pip p">1</i> por confirmar</p>
    <h3 className="dayh">{dayLabel(sel)}</h3>
    {day.length === 0 ? <div className="card"><div className="card-b"><p className="sub" style={{ margin: 0 }}>No hay citas este día.</p></div></div>
      : <div className="grid">{day.map(a => <ApptCard key={a.id} a={a} admin team={team} onPatch={patch} />)}</div>}
  </>;
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { formatCop } from '@dip/shared';
import type { Report } from '@/lib/reports';
import { api, dayLabel } from './api';
import Modal from './Modal';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addD = (s: string, n: number) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const monday = (s: string) => addD(s, -((new Date(s + 'T12:00:00').getDay() + 6) % 7));
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const compact = (n: number) => new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const niceMax = (v: number) => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
type Kind = 'day' | 'week' | 'month' | 'year' | 'range';

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 640, H = 220, L = 52, B = 26, T = 10, max = niceMax(Math.max(0, ...data.map(d => d.value))), bw = (W - L) / Math.max(1, data.length), step = Math.max(1, Math.ceil(data.length / Math.floor((W - L) / 44)));
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Dinero que entró por periodo" style={{ width: '100%', height: 'auto' }}>
    {[0, 1, 2, 3, 4].map(i => { const y = T + (H - T - B) * (1 - i / 4); return <g key={i}><line x1={L} x2={W} y1={y} y2={y} stroke="var(--line)" /><text x={L - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--mut)">{compact((max * i) / 4)}</text></g>; })}
    {data.map((d, i) => { const h = ((H - T - B) * d.value) / max; return <rect key={i} x={L + i * bw + bw * 0.12} y={H - B - h} width={Math.max(1, bw * 0.76)} height={h} rx="2" fill="var(--blue)"><title>{d.label}: {formatCop(d.value)}</title></rect>; })}
    {data.map((d, i) => i % step === 0 && <text key={'l' + i} x={L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--mut)">{d.label}</text>)}
  </svg>;
}
function HBars({ items, color = 'var(--blue)' }: { items: { label: string; value: number; extra: string }[]; color?: string }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return <div>{items.map(i => <div key={i.label} style={{ margin: '8px 0' }}><div className="row" style={{ fontSize: 14 }}><span>{i.label}</span><b>{formatCop(i.value)} <span className="note">· {i.extra}</span></b></div><div style={{ height: 8, borderRadius: 4, background: 'var(--s2)', marginTop: 4 }}><div style={{ height: 8, borderRadius: 4, width: `${(100 * i.value) / max}%`, background: color }} /></div></div>)}</div>;
}
const Kpi = ({ t, v, s, hot }: { t: string; v: string; s?: string; hot?: boolean }) => <div className="kpi" style={hot ? { borderColor: 'var(--blue)' } : undefined}><span className="note">{t}</span><b>{v}</b>{s && <span className="note">{s}</span>}</div>;
const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => <div className="tw"><table className="tbl"><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;

export default function ReportsView() {
  const today = ymd(new Date()), now = new Date();
  const [kind, setKind] = useState<Kind>('month'); const [anchor, setAnchor] = useState(today);
  const [month, setMonth] = useState(now.getMonth() + 1); const [year, setYear] = useState(now.getFullYear());
  const [rf, setRf] = useState(addD(today, -29)); const [rt, setRt] = useState(today);
  const [r, setR] = useState<Report | null>(null); const [err, setErr] = useState(''); const [onlyActive, setOnlyActive] = useState(true);
  const [day, setDay] = useState<Report | null>(null); const [dayDate, setDayDate] = useState('');

  const { from, to } = useMemo(() => {
    if (kind === 'day') return { from: anchor, to: anchor };
    if (kind === 'week') return { from: monday(anchor), to: addD(monday(anchor), 6) };
    if (kind === 'month') return { from: `${year}-${pad(month)}-01`, to: ymd(new Date(year, month, 0)) };
    if (kind === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` };
    return { from: rf, to: rt };
  }, [kind, anchor, month, year, rf, rt]);

  useEffect(() => {
    if (from > to) { setErr('La fecha inicial debe ser anterior a la final.'); return; }
    setErr(''); let live = true;
    api(`/api/v1/reports?from=${from}&to=${to}`).then(d => live && setR(d)).catch(e => live && setErr(e.message));
    return () => { live = false; };
  }, [from, to]);
  const openDay = async (d: string) => { setDayDate(d); setDay(null); try { setDay(await api(`/api/v1/reports?from=${d}&to=${d}`)); } catch (e) { setErr((e as Error).message); } };
  const exp = (f: string, a = from, b = to) => `/api/v1/reports/export?from=${a}&to=${b}&format=${f}`;
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);
  const k = r?.kpis;
  const rows = (r?.daily ?? []).filter(x => !onlyActive || x.income || x.appts || x.ordersMade);

  return <>
    <div className="chips" role="tablist" aria-label="Tipo de periodo">{([['day', 'Día'], ['week', 'Semana'], ['month', 'Mes'], ['year', 'Año'], ['range', 'Rango']] as [Kind, string][]).map(([k2, l]) => <button key={k2} className="pill" role="tab" aria-pressed={kind === k2} onClick={() => setKind(k2)}>{l}</button>)}</div>
    <div className="row2" style={{ alignItems: 'end' }}>
      {(kind === 'day' || kind === 'week') && <label className="f">{kind === 'day' ? 'Día' : 'Semana que contiene el día'}<input type="date" value={anchor} max={today} onChange={e => e.target.value && setAnchor(e.target.value)} /></label>}
      {kind === 'month' && <><label className="f">Mes<select value={month} onChange={e => setMonth(+e.target.value)}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label><label className="f">Año<select value={year} onChange={e => setYear(+e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select></label></>}
      {kind === 'year' && <label className="f">Año<select value={year} onChange={e => setYear(+e.target.value)}>{years.map(y => <option key={y}>{y}</option>)}</select></label>}
      {kind === 'range' && <><label className="f">Desde<input type="date" value={rf} max={rt} onChange={e => e.target.value && setRf(e.target.value)} /></label><label className="f">Hasta<input type="date" value={rt} max={today} onChange={e => e.target.value && setRt(e.target.value)} /></label></>}
    </div>
    <div className="row" style={{ margin: '12px 0', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 }}>
      <span className="note" style={{ flex: 1 }}>{from === to ? dayLabel(from) : `${dayLabel(from)} → ${dayLabel(to)}`}</span>
      <a className="btn sm" href={exp('xlsx')} download>Descargar Excel</a><a className="btn sm ghost" href={exp('pdf')} download>Descargar PDF</a>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
    {!r && !err && <div className="skel" style={{ height: 260 }} aria-busy="true" />}
    {r && k && <>
      <div className="kpis">
        <Kpi hot t="Dinero que entró" v={formatCop(k.income)} s={`Citas ${formatCop(k.incomeAppts)} · Pedidos ${formatCop(k.incomeOrders)}`} />
        <Kpi t="Pagos recibidos" v={String(k.payments)} s={`Ticket promedio ${formatCop(k.avgTicket)}`} />
        <Kpi t="Pedidos hechos" v={String(k.ordersMade)} s={`Valor ${formatCop(k.ordersValue)} · entregados ${k.ordersDelivered}`} />
        <Kpi t="Citas" v={String(k.appts)} s={`Completadas ${k.apptsDone} · canceladas ${k.apptsCancelled}`} />
        <Kpi t="Por cobrar" v={formatCop(k.receivable)} s="Citas y pedidos sin pagar" />
        {k.refundable > 0 && <Kpi t="Por reembolsar" v={formatCop(k.refundable)} s="Pagos de citas/pedidos cancelados" />}
      </div>
      {r.days > 1 && <div className="card" style={{ marginTop: 16 }}><div className="card-b"><h3>Dinero que entró por {r.group === 'day' ? 'día' : r.group === 'week' ? 'semana' : 'mes'}</h3><BarChart data={r.series.map(s => ({ label: s.label, value: s.income }))} /></div></div>}
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card"><div className="card-b"><h3>Por método de pago</h3>{r.byMethod.length ? <HBars items={r.byMethod.map(m => ({ label: m.label, value: m.income, extra: `${m.count} pago(s)` }))} /> : <span className="note">Sin pagos en el periodo.</span>}</div></div>
        <div className="card"><div className="card-b"><h3>Por servicio</h3>{r.byService.length ? <HBars color="var(--red)" items={r.byService.slice(0, 8).map(s => ({ label: s.name, value: s.income, extra: `${s.count} cita(s)` }))} /> : <span className="note">Sin citas pagadas.</span>}</div></div>
        <div className="card"><div className="card-b"><h3>Productos vendidos</h3>{r.byProduct.length ? <HBars items={r.byProduct.slice(0, 8).map(p => ({ label: p.name, value: p.income, extra: `${p.qty} u.` }))} /> : <span className="note">Sin pedidos pagados.</span>}</div></div>
      </div>
      <div className="row" style={{ marginTop: 24 }}><h3>Detalle por fecha</h3><label className="note" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} style={{ width: 18, minHeight: 18, margin: 0 }} />Solo días con movimiento</label></div>
      <p className="note" style={{ margin: '4px 0 8px' }}>Toca una fecha para ver sus pagos, pedidos y citas.</p>
      <div className="tw"><table className="tbl"><thead><tr><th>Fecha</th><th>Dinero que entró</th><th>Citas</th><th>Pedidos</th></tr></thead><tbody>
        {rows.map(x => <tr key={x.date} className="click" tabIndex={0} onClick={() => openDay(x.date)} onKeyDown={e => e.key === 'Enter' && openDay(x.date)}><td>{dayLabel(x.date)}</td><td><b>{formatCop(x.income)}</b></td><td>{x.appts}</td><td>{x.ordersMade}{x.ordersValue ? ` · ${formatCop(x.ordersValue)}` : ''}</td></tr>)}
        {rows.length === 0 && <tr><td colSpan={4} className="note">No hubo movimiento en este periodo.</td></tr>}
      </tbody></table></div>
    </>}
    {dayDate && <Modal title={dayLabel(dayDate)} onClose={() => setDayDate('')}>
      {!day ? <div className="skel" style={{ height: 160 }} /> : <>
        <div className="kpis"><Kpi hot t="Dinero que entró" v={formatCop(day.kpis.income)} s={`${day.kpis.payments} pago(s)`} /><Kpi t="Pedidos hechos" v={String(day.kpis.ordersMade)} s={formatCop(day.kpis.ordersValue)} /><Kpi t="Citas" v={String(day.kpis.appts)} s={`Completadas ${day.kpis.apptsDone}`} /></div>
        <div className="row" style={{ margin: '12px 0', justifyContent: 'flex-start', gap: 8 }}><a className="btn sm" href={exp('xlsx', dayDate, dayDate)} download>Excel</a><a className="btn sm ghost" href={exp('pdf', dayDate, dayDate)} download>PDF</a></div>
        <h3 style={{ fontSize: 16, margin: '12px 0 4px' }}>Pagos recibidos</h3>
        {day.payments.length ? <Table head={['Hora', 'Tipo', 'Cliente', 'Concepto', 'Monto']} rows={day.payments.map(p => [p.when.slice(11), p.kind, p.customer, p.concept, formatCop(p.amount)])} /> : <p className="note">Sin pagos.</p>}
        <h3 style={{ fontSize: 16, margin: '16px 0 4px' }}>Pedidos hechos</h3>
        {day.orders.length ? <Table head={['Hora', 'Código', 'Cliente', 'Productos', 'Total', 'Estado']} rows={day.orders.map(o => [o.createdAt.slice(11), o.code, o.customer, o.items, formatCop(o.total), `${o.status}${o.paid ? ' · pagado' : ''}`])} /> : <p className="note">Sin pedidos.</p>}
        <h3 style={{ fontSize: 16, margin: '16px 0 4px' }}>Citas del día</h3>
        {day.appointments.length ? <Table head={['Hora', 'Cliente', 'Servicio', 'Precio', 'Estado']} rows={day.appointments.map(a => [a.time, a.customer, a.service, formatCop(a.price), `${a.status}${a.paid ? ' · pagada' : ''}`])} /> : <p className="note">Sin citas.</p>}
      </>}
    </Modal>}
  </>;
}

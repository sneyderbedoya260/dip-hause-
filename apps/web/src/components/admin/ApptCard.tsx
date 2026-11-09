'use client';
import { formatCop } from '@dip/shared';
import { Appt, dayLabel, endTime, Staff } from './api';

const names = (j: string) => { try { return (JSON.parse(j) as { name: string }[]).map(x => x.name); } catch { return []; } };

export default function ApptCard({ a, admin, team, onPatch, showDay }: { a: Appt; admin: boolean; team: Staff[]; onPatch: (id: string, b: object) => void; showDay?: boolean }) {
  const ex = names(a.extras);
  const B = (s: string, label: string, cls = '') => <button key={s} className={`btn sm ${cls}`} onClick={() => onPatch(a.id, { status: s })}>{label}</button>;
  const acts = admin
    ? a.status === 'pendiente' ? [B('confirmada', 'Confirmar cita'), B('cancelada', 'Rechazar', 'ghost')]
      : a.status === 'confirmada' ? [B('completada', 'Marcar completada'), B('cancelada', 'Cancelar', 'ghost')] : [B('pendiente', 'Reabrir', 'ghost')]
    : a.status === 'confirmada' ? [B('completada', 'Marcar completada')] : [];
  return (
    <article className="card"><div className="card-b">
      <div className="row"><span className="price">{showDay ? dayLabel(a.date) + ' · ' : ''}{a.time}–{endTime(a.time, a.durationMin)}</span><span className={`tag ${a.status}`}>{a.status}</span></div>
      <b>{a.washName}{ex.length ? ` + ${ex.join(', ')}` : ''}</b>
      <span>{a.customerName} · <a href={`tel:${a.phone}`} style={{ color: 'var(--blue)' }}>{a.phone}</a></span>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>{a.address}</a>
      {a.refs && <span className="note">{a.refs}</span>}
      <span className="note">{a.vehicle} · {a.plate} · {formatCop(a.priceCop)} · {a.paymentStatus === 'pagado' ? 'pagado' : 'por pagar'} · {a.code}</span>
      {a.notes && <span className="note">Notas: {a.notes}</span>}
      <div><span className="note">Evidencias del vehículo ({a.evidence?.length ?? 0})</span>
        {a.evidence && a.evidence.length > 0 ? <div className="mgrid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{a.evidence.map(e => (
          <a key={e.id} className="mi" href={`/api/v1/evidence/${e.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${e.kind === 'video' ? 'video' : 'foto'}`}>
            {e.kind === 'video' ? <video src={`/api/v1/evidence/${e.id}`} muted playsInline preload="metadata" /> : <img src={`/api/v1/evidence/${e.id}`} alt="Evidencia del vehículo" loading="lazy" />}
            {e.kind === 'video' && <span className="vb">video</span>}</a>))}</div> : <span className="note" style={{ display: 'block' }}>{a.evidencePurged ? 'Eliminadas por la política de retención' : 'Sin evidencias'}</span>}</div>
      {admin && a.paymentStatus !== 'pagado' && a.status !== 'cancelada' && <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => onPatch(a.id, { markPaid: true })}>Registrar pago recibido</button>}
      {admin && a.status !== 'cancelada' && <label className="f">Empleado asignado<select value={a.assignedTo ?? ''} onChange={e => onPatch(a.id, { assignedTo: e.target.value || null })}><option value="">Sin asignar</option>{team.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      {acts.length > 0 && <div className="row" style={{ marginTop: 8, justifyContent: 'flex-start', flexWrap: 'wrap' }}>{acts}</div>}
    </div></article>
  );
}

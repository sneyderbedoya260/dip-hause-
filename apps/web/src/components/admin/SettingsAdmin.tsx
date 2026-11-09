'use client';
import { useEffect, useState } from 'react';
import { api } from './api';

const DAYS: [number, string, string][] = [[1, 'L', 'Lunes'], [2, 'M', 'Martes'], [3, 'X', 'Miércoles'], [4, 'J', 'Jueves'], [5, 'V', 'Viernes'], [6, 'S', 'Sábado'], [0, 'D', 'Domingo']];
const hours = Array.from({ length: 18 }, (_, i) => i + 5);

export default function SettingsAdmin() {
  const [s, setS] = useState<{ days: number[]; openHour: number; closeHour: number; evidenceRetentionDays: number } | null>(null); const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { api('/api/v1/settings').then(setS).catch(e => setErr(e.message)); }, []);
  if (!s) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 160 }} aria-busy="true" />;
  const toggle = (d: number) => setS({ ...s, days: s.days.includes(d) ? s.days.filter(x => x !== d) : [...s.days, d] });
  return <div className="card"><div className="card-b">
    <h3>Horario de servicio</h3><p className="note">Los clientes solo pueden agendar en los días y horas activos. Cada servicio debe terminar antes del cierre.</p>
    <div className="seg7" role="group" aria-label="Días de servicio">{DAYS.map(([n, l, full]) => <button key={n} className="pill" aria-pressed={s.days.includes(n)} aria-label={full} onClick={() => toggle(n)}>{l}</button>)}</div>
    <div className="row2"><label className="f">Apertura<select value={s.openHour} onChange={e => setS({ ...s, openHour: +e.target.value })}>{hours.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select></label>
      <label className="f">Cierre<select value={s.closeHour} onChange={e => setS({ ...s, closeHour: +e.target.value })}>{hours.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select></label></div>
    <label className="f">Conservar evidencias de citas cerradas (días)<input type="number" min={0} max={3650} value={s.evidenceRetentionDays} onChange={e => setS({ ...s, evidenceRetentionDays: Math.max(0, +e.target.value || 0) })} /></label>
    <p className="note">Pasado ese tiempo se borran solas las fotos y videos de citas completadas o canceladas. 0 = no borrar nunca. Debe coincidir con tu política de privacidad.</p>
    {err && <p className="err" role="alert">{err}</p>}{ok && <p role="status" style={{ color: '#4ADE9A' }}>{ok}</p>}
    <button className={`btn${busy ? ' loading' : ''}`} style={{ marginTop: 14 }} onClick={async () => { setErr(''); setOk(''); setBusy(true); try { await api('/api/v1/settings', 'PUT', s); setOk('Horario guardado.'); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } }}>Guardar horario</button>
  </div></div>;
}

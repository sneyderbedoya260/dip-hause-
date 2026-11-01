'use client';
import { useCallback, useEffect, useState } from 'react';
import { formatCop, formatDuration } from '@dip/shared';
import { api, M } from './api';
import MediaPicker from './MediaPicker';
import Modal from './Modal';

type Extra = { name: string; description: string; priceCop: string; durationMin: string };
type Wash = { id: string; name: string; description: string; priceCop: number; durationMin: number; active: boolean; media: M[]; extras: { name: string; description: string; priceCop: number; durationMin: number }[] };
type Form = { id?: string; name: string; description: string; priceCop: string; durationMin: string; media: M[]; extras: Extra[] };
const blank: Form = { name: '', description: '', priceCop: '', durationMin: '60', media: [], extras: [] };

export default function WashesAdmin() {
  const [list, setList] = useState<Wash[] | null>(null); const [f, setF] = useState<Form | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setList(await api('/api/v1/washes?all=1')); } catch (e) { setErr((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  const edit = (w: Wash) => { setErr(''); setF({ id: w.id, name: w.name, description: w.description, priceCop: String(w.priceCop), durationMin: String(w.durationMin), media: w.media, extras: w.extras.map(x => ({ ...x, priceCop: String(x.priceCop), durationMin: String(x.durationMin) })) }); };
  const setX = (i: number, k: keyof Extra, v: string) => setF(p => p && { ...p, extras: p.extras.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  async function save() {
    if (!f) return; setErr(''); setBusy(true);
    try {
      const body = { name: f.name, description: f.description, priceCop: Math.round(+f.priceCop), durationMin: Math.round(+f.durationMin), media: f.media,
        extras: f.extras.filter(x => x.name.trim()).map(x => ({ name: x.name, description: x.description, priceCop: Math.round(+x.priceCop || 0), durationMin: Math.round(+x.durationMin || 0) })) };
      await api(f.id ? `/api/v1/washes/${f.id}` : '/api/v1/washes', f.id ? 'PUT' : 'POST', body);
      setF(null); await load();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const toggle = async (w: Wash) => { try { await api(`/api/v1/washes/${w.id}`, 'PATCH', { active: !w.active }); await load(); } catch (e) { setErr((e as Error).message); } };
  if (!list) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 160 }} aria-busy="true" />;
  return <>
    <button className="btn" onClick={() => { setErr(''); setF({ ...blank }); }}>+ Nueva lavada</button>
    {err && !f && <p className="err" role="alert">{err}</p>}
    <div className="grid" style={{ marginTop: 16 }}>{list.map(w => (
      <article className="card" key={w.id} style={{ opacity: w.active ? 1 : .6 }}>
        <div className="thumb" style={{ cursor: 'default' }}>{w.media[0] ? (w.media[0].kind === 'video' ? <video src={w.media[0].url} muted playsInline preload="metadata" /> : <img src={w.media[0].url} alt="" />) : <img src="/logo.png" alt="" style={{ width: 72, height: 72, borderRadius: '50%', opacity: .5 }} />}</div>
        <div className="card-b"><div className="row"><h3>{w.name}</h3>{!w.active && <span className="tag cancelada">desactivada</span>}</div>
          <div className="row"><span className="price">{formatCop(w.priceCop)}</span><span className="chip">{formatDuration(w.durationMin)}</span></div>
          <span className="note">{w.media.length} archivo(s) · {w.extras.length} adicional(es)</span>
          <div className="actions"><button className="btn sm" onClick={() => edit(w)}>Editar</button><button className="btn sm ghost" onClick={() => toggle(w)}>{w.active ? 'Desactivar' : 'Activar'}</button></div></div>
      </article>))}</div>
    {f && <Modal title={f.id ? 'Editar lavada' : 'Nueva lavada'} onClose={() => setF(null)}>
      <label className="f">Nombre<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <div className="row2"><label className="f">Precio (COP)<input type="number" inputMode="numeric" min={0} step={1000} value={f.priceCop} onChange={e => setF({ ...f, priceCop: e.target.value })} /></label>
        <label className="f">Duración (min)<input type="number" inputMode="numeric" min={10} step={10} value={f.durationMin} onChange={e => setF({ ...f, durationMin: e.target.value })} /></label></div>
      <label className="f">Descripción<textarea rows={4} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label>
      <div className="f"><span style={{ fontWeight: 600, fontSize: 14 }}>Servicios adicionales</span>
        <p className="note" style={{ margin: '0 0 8px' }}>Opcionales que el cliente puede sumar (polichada, restauración de partes negras…). Suman precio y tiempo.</p>
        {f.extras.map((x, i) => <div className="xrow" key={i}>
          <input aria-label="Nombre" placeholder="Nombre" value={x.name} onChange={e => setX(i, 'name', e.target.value)} />
          <div className="row2"><input aria-label="Precio" type="number" inputMode="numeric" min={0} step={1000} placeholder="Precio" value={x.priceCop} onChange={e => setX(i, 'priceCop', e.target.value)} /><input aria-label="Minutos extra" type="number" inputMode="numeric" min={0} step={10} placeholder="Min extra" value={x.durationMin} onChange={e => setX(i, 'durationMin', e.target.value)} /></div>
          <input aria-label="Descripción" placeholder="Descripción corta (opcional)" value={x.description} onChange={e => setX(i, 'description', e.target.value)} />
          <button className="btn sm ghost" onClick={() => setF({ ...f, extras: f.extras.filter((_, j) => j !== i) })}>Quitar</button></div>)}
        <button className="btn sm ghost" onClick={() => setF({ ...f, extras: [...f.extras, { name: '', description: '', priceCop: '', durationMin: '30' }] })}>+ Agregar servicio adicional</button></div>
      <MediaPicker label="Fotos y videos" accept="both" multiple items={f.media} onChange={media => setF(p => p && { ...p, media })} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className={`btn${busy ? ' loading' : ''}`} style={{ width: '100%', marginTop: 16 }} onClick={save}>Guardar</button>
    </Modal>}
  </>;
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import { formatCop } from '@dip/shared';
import { api, M } from './api';
import MediaPicker from './MediaPicker';
import Modal from './Modal';

type Prod = { id: string; name: string; description: string; priceCop: number; active: boolean; media: M[] };
type Form = { id?: string; name: string; description: string; priceCop: string; photo: M[]; video: M[] };
const blank: Form = { name: '', description: '', priceCop: '', photo: [], video: [] };

export default function ProductsAdmin() {
  const [list, setList] = useState<Prod[] | null>(null); const [f, setF] = useState<Form | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setList(await api('/api/v1/products?all=1')); } catch (e) { setErr((e as Error).message); } }, []);
  useEffect(() => { load(); }, [load]);
  const edit = (p: Prod) => { setErr(''); setF({ id: p.id, name: p.name, description: p.description, priceCop: String(p.priceCop), photo: p.media.filter(m => m.kind === 'image').slice(0, 1), video: p.media.filter(m => m.kind === 'video').slice(0, 1) }); };
  async function save() {
    if (!f) return; setErr(''); setBusy(true);
    try {
      await api(f.id ? `/api/v1/products/${f.id}` : '/api/v1/products', f.id ? 'PUT' : 'POST', { name: f.name, description: f.description, priceCop: Math.round(+f.priceCop), media: [...f.photo, ...f.video] });
      setF(null); await load();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const toggle = async (p: Prod) => { try { await api(`/api/v1/products/${p.id}`, 'PATCH', { active: !p.active }); await load(); } catch (e) { setErr((e as Error).message); } };
  if (!list) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 160 }} aria-busy="true" />;
  return <>
    <button className="btn" onClick={() => { setErr(''); setF({ ...blank }); }}>+ Nuevo producto</button>
    {err && !f && <p className="err" role="alert">{err}</p>}
    <div className="grid" style={{ marginTop: 16 }}>{list.map(p => {
      const img = p.media.find(m => m.kind === 'image'), vid = p.media.find(m => m.kind === 'video');
      return <article className="card" key={p.id} style={{ opacity: p.active ? 1 : .6 }}>
        <div className="thumb" style={{ cursor: 'default' }}>{img ? <img src={img.url} alt="" /> : vid ? <video src={vid.url} muted playsInline preload="metadata" /> : <img src="/logo.png" alt="" style={{ width: 72, height: 72, borderRadius: '50%', opacity: .5 }} />}</div>
        <div className="card-b"><div className="row"><h3>{p.name}</h3>{!p.active && <span className="tag cancelada">desactivado</span>}</div>
          <span className="price">{formatCop(p.priceCop)}</span><span className="note">{img ? 'con foto' : 'sin foto'}{vid ? ' · con video' : ''}</span>
          <div className="actions"><button className="btn sm" onClick={() => edit(p)}>Editar</button><button className="btn sm ghost" onClick={() => toggle(p)}>{p.active ? 'Desactivar' : 'Activar'}</button></div></div>
      </article>;
    })}</div>
    {f && <Modal title={f.id ? 'Editar producto' : 'Nuevo producto'} onClose={() => setF(null)}>
      <label className="f">Nombre<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
      <label className="f">Precio (COP)<input type="number" inputMode="numeric" min={0} step={1000} value={f.priceCop} onChange={e => setF({ ...f, priceCop: e.target.value })} /></label>
      <label className="f">Descripción<textarea rows={4} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label>
      <MediaPicker label="Foto del producto" accept="image" items={f.photo} onChange={photo => setF(p => p && { ...p, photo })} />
      <MediaPicker label="Video (opcional)" accept="video" items={f.video} onChange={video => setF(p => p && { ...p, video })} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className={`btn${busy ? ' loading' : ''}`} style={{ width: '100%', marginTop: 16 }} onClick={save}>Guardar</button>
    </Modal>}
  </>;
}

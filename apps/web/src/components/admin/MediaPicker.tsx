'use client';
import { useState } from 'react';
import { M } from './api';

// Acepta cualquier formato de foto y de video (el navegador solo previsualiza los que sabe reproducir; el archivo se guarda igual).
const IMG = 'image/*,.heic,.heif,.avif,.jfif,.tif,.tiff,.bmp,.dng';
const VID = 'video/*,.mov,.mkv,.avi,.wmv,.flv,.3gp,.3g2,.m4v,.mts,.m2ts,.mpg,.mpeg,.ogv';

export default function MediaPicker({ label, items, onChange, accept, multiple }: { label: string; items: M[]; onChange: (m: M[]) => void; accept: 'image' | 'video' | 'both'; multiple?: boolean }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setErr('');
    let out = [...items];
    for (const f of Array.from(files)) {
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(`${f.name}: ${d.error ?? 'no se pudo subir'}`); continue; }
      if (accept !== 'both' && d.kind !== accept) { setErr(`${f.name}: aquí va ${accept === 'image' ? 'una foto' : 'un video'}`); continue; }
      out = multiple ? [...out, d] : [d];
    }
    onChange(out); setBusy(false);
  }
  return (
    <div className="f"><span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
      <label className={`drop${busy ? ' loading' : ''}`}>{busy ? 'Subiendo…' : `Subir ${accept === 'image' ? 'foto' : accept === 'video' ? 'video' : 'fotos o videos'}`}
        <input className="vh" type="file" multiple={multiple} accept={accept === 'image' ? IMG : accept === 'video' ? VID : `${IMG},${VID}`} onChange={e => { pick(e.target.files); e.target.value = ''; }} /></label>
      {err && <p className="err" role="alert">{err}</p>}
      {items.length > 0 && <div className="mgrid">{items.map((m, i) => (
        <div className="mi" key={m.url + i}>{m.kind === 'video' ? <video src={m.url} muted playsInline preload="metadata" /> : <img src={m.url} alt="" />}
          {m.kind === 'video' && <span className="vb">video</span>}
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar archivo">✕</button></div>))}</div>}
    </div>
  );
}

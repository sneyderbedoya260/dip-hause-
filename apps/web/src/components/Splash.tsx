'use client';
import { useEffect, useState } from 'react';

/** Pantalla de carga de marca: se muestra una vez por sesión. */
export default function Splash() {
  const [state, setState] = useState<'in' | 'out' | 'gone'>('in');
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('dh_splash') === '1'; sessionStorage.setItem('dh_splash', '1'); } catch {}
    const t1 = setTimeout(() => { setState('out'); document.body.classList.add('ready'); }, seen ? 0 : 1600);
    const t2 = setTimeout(() => setState('gone'), seen ? 400 : 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (state === 'gone') return null;
  return (
    <div className={`splash${state === 'out' ? ' out' : ''}`} role="status" aria-label="Cargando">
      <div className="splash-in">
        <div className="splash-logo"><img src="/logo.png" alt="" /></div>
        <div className="splash-name">Dip House</div>
        <div className="drops"><i /><i /><i /></div>
      </div>
    </div>
  );
}

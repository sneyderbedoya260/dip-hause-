'use client';
import { useEffect } from 'react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return <>
    <div className="scrim" onClick={onClose} />
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="row" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 24 }}>{title}</h2><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
      {children}
    </div>
  </>;
}

'use client';
import { useState } from 'react';
import { useCart } from './CartProvider';

export default function AddToCart(p: { id: string; name: string; priceCop: number }) {
  const { add } = useCart(); const [ok, setOk] = useState(false);
  return <button className="btn" onClick={() => { add(p); setOk(true); setTimeout(() => setOk(false), 1300); }}>{ok ? 'Agregado' : 'Agregar al carrito'}</button>;
}

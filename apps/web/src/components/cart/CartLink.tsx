'use client';
import { useCart } from './CartProvider';

export default function CartLink() {
  const { count } = useCart();
  return <a className="btn ghost" style={{ minHeight: 38, padding: '8px 14px', position: 'relative' }} href="/carrito" aria-label={`Carrito, ${count} producto(s)`}>Carrito{count > 0 && <span className="cnt">{count}</span>}</a>;
}

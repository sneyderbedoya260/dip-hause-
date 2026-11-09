'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type CartItem = { id: string; name: string; priceCop: number; qty: number };
type Ctx = { items: CartItem[]; count: number; total: number; add: (p: Omit<CartItem, 'qty'>) => void; setQty: (id: string, q: number) => void; clear: () => void };
const C = createContext<Ctx>({ items: [], count: 0, total: 0, add: () => {}, setQty: () => {}, clear: () => {} });
export const useCart = () => useContext(C);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem('dh_cart') || '[]')); } catch {} }, []);
  const put = useCallback((n: CartItem[]) => { setItems(n); try { localStorage.setItem('dh_cart', JSON.stringify(n)); } catch {} }, []);
  const add: Ctx['add'] = p => put(items.some(i => i.id === p.id) ? items.map(i => i.id === p.id ? { ...i, qty: Math.min(50, i.qty + 1) } : i) : [...items, { ...p, qty: 1 }]);
  const setQty: Ctx['setQty'] = (id, q) => put(q <= 0 ? items.filter(i => i.id !== id) : items.map(i => i.id === id ? { ...i, qty: Math.min(50, q) } : i));
  return <C.Provider value={{ items, count: items.reduce((a, i) => a + i.qty, 0), total: items.reduce((a, i) => a + i.qty * i.priceCop, 0), add, setQty, clear: () => put([]) }}>{children}</C.Provider>;
}

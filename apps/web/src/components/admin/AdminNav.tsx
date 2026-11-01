'use client';
import { usePathname } from 'next/navigation';

const ADMIN = [['/admin', 'Citas'], ['/admin/calendario', 'Calendario'], ['/admin/lavadas', 'Lavadas'], ['/admin/productos', 'Productos'], ['/admin/personal', 'Personal'], ['/admin/ajustes', 'Ajustes']];
export default function AdminNav({ role }: { role: 'admin' | 'employee' }) {
  const path = usePathname();
  const items = role === 'admin' ? ADMIN : [['/admin', 'Mis servicios']];
  return <nav className="chips" aria-label="Secciones del panel">{items.map(([href, label]) => <a key={href} href={href} className="pill" aria-current={path === href ? 'page' : undefined} aria-pressed={path === href}>{label}</a>)}</nav>;
}

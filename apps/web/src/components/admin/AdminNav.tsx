'use client';
import { usePathname } from 'next/navigation';

const ADMIN = [['/admin/reportes', 'Reportes'], ['/admin/citas', 'Citas'], ['/admin/calendario', 'Calendario'], ['/admin/pedidos', 'Pedidos'], ['/admin/lavadas', 'Lavadas'], ['/admin/productos', 'Productos'], ['/admin/personal', 'Personal'], ['/admin/ajustes', 'Ajustes'], ['/admin/seguridad', 'Seguridad']];
export default function AdminNav({ role }: { role: 'admin' | 'employee' }) {
  const path = usePathname();
  const items = role === 'admin' ? ADMIN : [['/admin', 'Mis servicios'], ['/admin/seguridad', 'Seguridad']];
  return <nav className="chips" aria-label="Secciones del panel">{items.map(([href, label]) => <a key={href} href={href} className="pill" aria-current={path === href ? 'page' : undefined} aria-pressed={path === href}>{label}</a>)}</nav>;
}

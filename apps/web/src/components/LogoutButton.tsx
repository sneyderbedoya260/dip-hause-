'use client';
export default function LogoutButton({ to = '/' }: { to?: string }) {
  return <button className="btn ghost" onClick={async () => { await fetch('/api/v1/auth/logout', { method: 'POST' }); window.location.href = to; }}>Cerrar sesión</button>;
}

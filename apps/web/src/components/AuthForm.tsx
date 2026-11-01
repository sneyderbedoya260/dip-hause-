'use client';
import { FormEvent, useState } from 'react';

type Mode = 'login' | 'register' | 'forgot' | 'reset';
const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '');
const TITLES: Record<Mode, string> = { login: 'Iniciar sesión', register: 'Crear cuenta', forgot: 'Recuperar contraseña', reset: 'Nueva contraseña' };

export default function AuthForm({ mode, audience, token, next }: { mode: Mode; audience: 'customer' | 'staff'; token?: string; next?: string }) {
  const staff = audience === 'staff';
  const base = staff ? '/admin' : '';
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setMsg('');
    if ((mode === 'register' || mode === 'reset') && f.password !== f.confirm) return setErr('Las contraseñas no coinciden.');
    const url = { login: `/api/v1/auth/${staff ? 'staff' : 'customer'}/login`, register: '/api/v1/auth/register', forgot: '/api/v1/auth/forgot', reset: '/api/v1/auth/reset' }[mode];
    const body = { login: { email: f.email, password: f.password }, register: { name: f.name, phone: f.phone, email: f.email, password: f.password }, forgot: { email: f.email, audience }, reset: { token, password: f.password } }[mode];
    setBusy(true);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? 'No se pudo completar la solicitud.');
      if (mode === 'login' || mode === 'register') { window.location.href = staff ? '/admin' : safeNext(next) || '/mi-cuenta'; return; }
      setMsg(mode === 'forgot' ? d.message : 'Contraseña actualizada. Ya puedes iniciar sesión.');
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  const pw = (label: string, k: 'password' | 'confirm', auto: string) => <label className="f">{label}<input type="password" required autoComplete={auto} minLength={staff ? 12 : 10} value={f[k]} onChange={set(k)} /></label>;

  return (
    <form className="auth card" onSubmit={submit} noValidate={false}>
      <div className="card-b">
        {staff && <span className="chip" style={{ alignSelf: 'flex-start', color: 'var(--red)' }}>Acceso del personal</span>}
        <h1 style={{ fontSize: 28 }}>{TITLES[mode]}</h1>
        {mode === 'register' && <><label className="f">Nombre completo<input required autoComplete="name" value={f.name} onChange={set('name')} /></label>
          <label className="f">Teléfono<input required type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></label></>}
        {mode !== 'reset' && <label className="f">Correo electrónico<input required type="email" autoComplete="email" value={f.email} onChange={set('email')} /></label>}
        {mode === 'login' && pw('Contraseña', 'password', 'current-password')}
        {(mode === 'register' || mode === 'reset') && <>{pw('Contraseña nueva', 'password', 'new-password')}{pw('Repite la contraseña', 'confirm', 'new-password')}<p className="note">Mínimo {staff ? 12 : 10} caracteres. Evita claves comunes o tu correo.</p></>}
        {mode === 'forgot' && <p className="note">Te enviaremos un enlace para crear una contraseña nueva. Vence en 30 minutos.</p>}
        {err && <p className="err" role="alert">{err}</p>}
        {msg && <p role="status" style={{ color: 'var(--ok, #4ADE9A)', fontWeight: 600 }}>{msg}</p>}
        <button className={`btn${busy ? ' loading' : ''}`} type="submit" style={{ marginTop: 14 }}>{TITLES[mode]}</button>
        <div className="links">
          {mode === 'login' && <><a href={`${base}/${staff ? 'olvide' : 'olvide-contrasena'}`}>¿Olvidaste tu contraseña?</a>{!staff && <a href="/registro">Crear cuenta</a>}</>}
          {mode !== 'login' && <a href={`${base}/ingresar`}>Volver a iniciar sesión</a>}
        </div>
      </div>
    </form>
  );
}

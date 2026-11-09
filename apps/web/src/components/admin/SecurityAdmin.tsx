'use client';
import { useEffect, useState } from 'react';
import { api } from './api';

export default function SecurityAdmin({ required }: { required: boolean }) {
  const [on, setOn] = useState<boolean | null>(null); const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState(''); const [codes, setCodes] = useState<string[] | null>(null); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const [dis, setDis] = useState({ password: '', code: '' }); const [pw, setPw] = useState({ current: '', password: '' });
  useEffect(() => { api('/api/v1/auth/me').then(d => setOn(!!d.user.totpEnabled)).catch(e => setErr(e.message)); }, []);
  const run = async (fn: () => Promise<void>) => { setErr(''); setOk(''); try { await fn(); } catch (e) { setErr((e as Error).message); } };
  if (on === null) return err ? <p className="err">{err}</p> : <div className="skel" style={{ height: 160 }} aria-busy="true" />;
  return <>
    {err && <p className="err" role="alert">{err}</p>}{ok && <p role="status" style={{ color: '#4ADE9A' }}>{ok}</p>}
    <div className="card"><div className="card-b">
      <h3>Verificación en dos pasos</h3>
      {required && !on && <p className="err" style={{ margin: 0 }}>Es obligatoria para usar el panel. Actívala para continuar.</p>}
      {codes ? <>
        <p><b>Guarda estos códigos de respaldo.</b> Cada uno sirve una sola vez si pierdes tu celular. No se volverán a mostrar.</p>
        <pre style={{ background: 'var(--s2)', padding: 12, borderRadius: 12, fontSize: 16, lineHeight: 1.8 }}>{codes.join('\n')}</pre>
        <a className="btn" href="/admin">Ya los guardé, continuar</a>
      </> : on ? <>
        <p className="note" style={{ margin: 0 }}>Activa. Para desactivarla necesitas tu contraseña y un código vigente.</p>
        <label className="f">Contraseña<input type="password" autoComplete="current-password" value={dis.password} onChange={e => setDis({ ...dis, password: e.target.value })} /></label>
        <label className="f">Código de la app<input inputMode="numeric" value={dis.code} onChange={e => setDis({ ...dis, code: e.target.value })} /></label>
        <button className="btn ghost" onClick={() => run(async () => { await api('/api/v1/auth/2fa/disable', 'POST', dis); setOn(false); setOk('Verificación en dos pasos desactivada.'); setDis({ password: '', code: '' }); })}>Desactivar</button>
      </> : setup ? <>
        <p className="note" style={{ margin: 0 }}>1) Escanea el QR con Google Authenticator, Microsoft Authenticator, Authy o similar. 2) Escribe el código de 6 dígitos que muestre.</p>
        <img src={setup.qr} alt="Código QR para la app autenticadora" width={220} height={220} style={{ background: '#fff', borderRadius: 12, padding: 6, alignSelf: 'center' }} />
        <p className="note" style={{ margin: 0 }}>¿No puedes escanear? Escribe esta clave en la app: <b style={{ wordBreak: 'break-all' }}>{setup.secret}</b></p>
        <label className="f">Código de 6 dígitos<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} /></label>
        <button className="btn" onClick={() => run(async () => { const d = await api('/api/v1/auth/2fa/enable', 'POST', { code }); setCodes(d.recoveryCodes); setOn(true); })}>Activar</button>
      </> : <>
        <p className="note" style={{ margin: 0 }}>Protege tu cuenta con un código que cambia cada 30 segundos, además de tu contraseña.</p>
        <button className="btn" onClick={() => run(async () => setSetup(await api('/api/v1/auth/2fa/setup', 'POST')))}>Activar verificación en dos pasos</button>
      </>}
    </div></div>
    <div className="card" style={{ marginTop: 16 }}><div className="card-b"><h3>Cambiar contraseña</h3>
      <label className="f">Contraseña actual<input type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} /></label>
      <label className="f">Contraseña nueva (mínimo 12 caracteres)<input type="password" autoComplete="new-password" value={pw.password} onChange={e => setPw({ ...pw, password: e.target.value })} /></label>
      <button className="btn ghost" onClick={() => run(async () => { await api('/api/v1/auth/password', 'POST', pw); setPw({ current: '', password: '' }); setOk('Contraseña actualizada. Se cerraron tus otras sesiones.'); })}>Cambiar contraseña</button>
    </div></div>
  </>;
}

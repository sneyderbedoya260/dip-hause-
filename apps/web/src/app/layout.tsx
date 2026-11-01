import type { Metadata, Viewport } from 'next';
import './globals.css';
import Splash from '@/components/Splash';
import { serverUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: 'Dip House · Lavado premium a domicilio', description: 'Lavado premium y detailing a domicilio. Agenda tu cita y paga en línea.' };
export const viewport: Viewport = { themeColor: '#070707', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await serverUser('customer');
  return (
    <html lang="es"><body>
      <Splash />
      <header className="top"><div className="wrap"><a className="brand" href="/"><img src="/logo.png" width={40} height={40} alt="Dip House" />Dip House</a><a className="btn ghost" style={{ marginLeft: 'auto', minHeight: 38, padding: '8px 16px' }} href={me ? '/mi-cuenta' : '/ingresar'}>{me ? 'Mi cuenta' : 'Ingresar'}</a></div></header>
      {children}
      <footer className="foot"><div className="wrap row"><span>Dip House · Lavado premium a domicilio</span><a href="/admin/ingresar">Acceso del personal</a></div></footer>
    </body></html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import CartLink from '@/components/cart/CartLink';
import CartProvider from '@/components/cart/CartProvider';
import Splash from '@/components/Splash';
import { serverUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: 'Dip House · Lavado premium a domicilio', description: 'Lavado premium y detailing a domicilio. Agenda tu cita y paga en línea.' };
export const viewport: Viewport = { themeColor: '#070707', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await serverUser('customer');
  return (
    <html lang="es"><body>
      <CartProvider>
      <Splash />
      <header className="top"><div className="wrap"><a className="brand" href="/"><img src="/logo.png" width={40} height={40} alt="Dip House" />Dip House</a><span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}><CartLink /><a className="btn ghost" style={{ minHeight: 38, padding: '8px 16px' }} href={me ? '/mi-cuenta' : '/ingresar'}>{me ? 'Mi cuenta' : 'Ingresar'}</a></span></div></header>
      {children}
      <footer className="foot"><div className="wrap row"><span>Dip House · Lavado premium a domicilio</span><span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a><a href="/admin/ingresar">Acceso del personal</a></span></div></footer>
      </CartProvider>
    </body></html>
  );
}

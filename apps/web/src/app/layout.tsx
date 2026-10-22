import type { Metadata, Viewport } from 'next';
import './globals.css';
import Splash from '@/components/Splash';

export const metadata: Metadata = { title: 'Dip House · Lavado premium a domicilio', description: 'Lavado premium y detailing a domicilio. Agenda tu cita y paga en línea.' };
export const viewport: Viewport = { themeColor: '#05080F', viewportFit: 'cover', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es"><body>
      <Splash />
      <header className="top"><div className="wrap"><a className="brand" href="/"><img src="/logo.png" width={40} height={40} alt="Dip House" />Dip House</a></div></header>
      {children}
      <footer className="foot"><div className="wrap">Dip House · Lavado premium a domicilio</div></footer>
    </body></html>
  );
}

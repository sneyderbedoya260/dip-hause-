import { NextResponse, type NextRequest } from 'next/server';

// Primera barrera (rápida): sin cookie de sesión ni se renderiza la página. La validez real se comprueba en el servidor.
const P = process.env.NODE_ENV === 'production' ? '__Host-' : '';
const OPEN = ['/admin/ingresar', '/admin/olvide', '/admin/restablecer'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const to = (path: string) => { const u = req.nextUrl.clone(); u.pathname = path; u.search = ''; return u; };
  if (pathname.startsWith('/admin') && !OPEN.some(p => pathname === p || pathname.startsWith(p + '/')) && !req.cookies.has(`${P}dh_s`)) return NextResponse.redirect(to('/admin/ingresar'));
  if (pathname.startsWith('/mi-cuenta') && !req.cookies.has(`${P}dh_c`)) return NextResponse.redirect(to('/ingresar'));
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*', '/mi-cuenta/:path*'] };

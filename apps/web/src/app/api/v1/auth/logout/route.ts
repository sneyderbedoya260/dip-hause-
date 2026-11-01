import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth/guard';
import { clearSessionCookie, revokeSession } from '@/lib/auth/session';
import { handle } from '@/lib/http';

export const POST = (req: Request) => handle(async () => {
  const a = await getAuth(req);
  if (a) await revokeSession(a.token);
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res, 'staff'); clearSessionCookie(res, 'customer');
  return res;
});

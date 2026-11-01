import { getAuth } from '@/lib/auth/guard';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const GET = (req: Request) => handle(async () => {
  const a = await getAuth(req);
  return a ? ok({ user: a.user, audience: a.audience }) : fail('No autorizado', 401);
});

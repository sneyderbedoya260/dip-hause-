import { WashInput } from '@dip/shared';
import { db } from '@/db';
import { washes } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { listWashes, replaceExtras, replaceMedia } from '@/lib/catalog';
import { handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const GET = () => handle(async () => ok(await listWashes()));
export const POST = (req: Request) => handle(async () => {
  await requireAdmin(req);
  const { media, extras, ...data } = WashInput.parse(await req.json());
  const [w] = await db.insert(washes).values(data).returning();
  await replaceMedia('wash', w.id, media);
  await replaceExtras(w.id, extras);
  return ok({ ...w, media, extras }, 201);
});

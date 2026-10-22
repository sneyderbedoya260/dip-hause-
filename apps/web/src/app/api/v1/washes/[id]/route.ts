import { eq } from 'drizzle-orm';
import { WashInput } from '@dip/shared';
import { db } from '@/db';
import { washes } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { listWashes, replaceMedia } from '@/lib/catalog';
import { fail, handle, ok } from '@/lib/http';

type Ctx = { params: { id: string } };
export const dynamic = 'force-dynamic';
export const GET = (_: Request, { params }: Ctx) => handle(async () => {
  const w = (await listWashes()).find(x => x.id === params.id);
  return w ? ok(w) : fail('No encontrada', 404);
});
export const PUT = (req: Request, { params }: Ctx) => handle(async () => {
  await requireAdmin(req);
  const { media, ...data } = WashInput.parse(await req.json());
  const [w] = await db.update(washes).set(data).where(eq(washes.id, params.id)).returning();
  if (!w) return fail('No encontrada', 404);
  await replaceMedia('wash', w.id, media);
  return ok({ ...w, media });
});
export const DELETE = (req: Request, { params }: Ctx) => handle(async () => {
  await requireAdmin(req);
  await db.update(washes).set({ active: false }).where(eq(washes.id, params.id)); // baja lógica: conserva el historial de citas
  return ok({ deleted: true });
});

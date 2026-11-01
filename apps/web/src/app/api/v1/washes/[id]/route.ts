import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { WashInput } from '@dip/shared';
import { db } from '@/db';
import { washes } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { listWashes, replaceExtras, replaceMedia } from '@/lib/catalog';
import { fail, handle, ok } from '@/lib/http';

type Ctx = { params: { id: string } };
export const dynamic = 'force-dynamic';
export const GET = (_: Request, { params }: Ctx) => handle(async () => {
  const w = (await listWashes()).find(x => x.id === params.id);
  return w ? ok(w) : fail('No encontrada', 404);
});
export const PUT = (req: Request, { params }: Ctx) => handle(async () => {
  await requireRole(req, ['admin']);
  const { media, extras, ...data } = WashInput.parse(await req.json());
  const [w] = await db.update(washes).set(data).where(eq(washes.id, params.id)).returning();
  if (!w) return fail('No encontrada', 404);
  await replaceMedia('wash', w.id, media);
  await replaceExtras(w.id, extras);
  return ok({ ...w, media, extras });
});
/** Admin: activar / desactivar (baja lógica). */
export const PATCH = (req: Request, { params }: Ctx) => handle(async () => {
  await requireRole(req, ['admin']);
  const { active } = z.object({ active: z.boolean() }).parse(await req.json());
  await db.update(washes).set({ active }).where(eq(washes.id, params.id));
  return ok({ active });
});
export const DELETE = (req: Request, { params }: Ctx) => handle(async () => {
  await requireRole(req, ['admin']);
  await db.update(washes).set({ active: false }).where(eq(washes.id, params.id)); // baja lógica: conserva el historial de citas
  return ok({ deleted: true });
});

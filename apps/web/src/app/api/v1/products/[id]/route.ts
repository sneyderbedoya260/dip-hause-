import { eq } from 'drizzle-orm';
import { ProductInput } from '@dip/shared';
import { db } from '@/db';
import { products } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { listProducts, replaceMedia } from '@/lib/catalog';
import { fail, handle, ok } from '@/lib/http';

type Ctx = { params: { id: string } };
export const dynamic = 'force-dynamic';
export const GET = (_: Request, { params }: Ctx) => handle(async () => {
  const p = (await listProducts()).find(x => x.id === params.id);
  return p ? ok(p) : fail('No encontrado', 404);
});
export const PUT = (req: Request, { params }: Ctx) => handle(async () => {
  await requireAdmin(req);
  const { media, ...data } = ProductInput.parse(await req.json());
  const [p] = await db.update(products).set(data).where(eq(products.id, params.id)).returning();
  if (!p) return fail('No encontrado', 404);
  await replaceMedia('product', p.id, media);
  return ok({ ...p, media });
});
export const DELETE = (req: Request, { params }: Ctx) => handle(async () => {
  await requireAdmin(req);
  await db.update(products).set({ active: false }).where(eq(products.id, params.id));
  return ok({ deleted: true });
});

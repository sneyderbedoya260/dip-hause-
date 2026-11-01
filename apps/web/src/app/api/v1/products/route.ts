import { ProductInput } from '@dip/shared';
import { db } from '@/db';
import { products } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { listProducts, replaceMedia } from '@/lib/catalog';
import { handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const GET = () => handle(async () => ok(await listProducts()));
export const POST = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  const { media, ...data } = ProductInput.parse(await req.json());
  const [p] = await db.insert(products).values(data).returning();
  await replaceMedia('product', p.id, media);
  return ok({ ...p, media }, 201);
});

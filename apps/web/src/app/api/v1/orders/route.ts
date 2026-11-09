import { desc, eq, inArray } from 'drizzle-orm';
import { OrderInput } from '@dip/shared';
import { db } from '@/db';
import { orderItems, orders, products } from '@/db/schema';
import { getAuth, requireRole } from '@/lib/auth/guard';
import { allow, clientIp } from '@/lib/auth/ratelimit';
import { fail, handle, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';
const code = () => 'PD-' + Math.random().toString(36).slice(2, 7).toUpperCase();

/** Público: crea un pedido de productos. El total se calcula aquí con los precios vigentes (nunca se confía en el navegador). */
export const POST = (req: Request) => handle(async () => {
  if (!allow(`order:${clientIp(req)}`, 20, 3600e3)) return fail('Demasiados pedidos desde esta red. Intenta más tarde.', 429);
  const input = OrderInput.parse(await req.json());
  const qty = new Map<string, number>();
  for (const i of input.items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.qty);
  const prods = (await db.select().from(products).where(inArray(products.id, [...qty.keys()]))).filter(p => p.active);
  if (prods.length !== qty.size) return fail('Algún producto ya no está disponible. Actualiza tu carrito.', 409);
  const totalCop = prods.reduce((a, p) => a + p.priceCop * qty.get(p.id)!, 0);
  const auth = await getAuth(req);
  const { items: _i, acceptPrivacy: _a, ...rest } = input; void _i; void _a;
  const [o] = await db.insert(orders).values({ ...rest, userId: auth?.user.role === 'customer' ? auth.user.id : undefined, code: code(), totalCop, privacyAcceptedAt: new Date() }).returning();
  const items = await db.insert(orderItems).values(prods.map(p => ({ orderId: o.id, productId: p.id, name: p.name, priceCop: p.priceCop, qty: qty.get(p.id)! }))).returning();
  return ok({ ...o, items }, 201);
});

/** Admin: lista de pedidos con sus productos. */
export const GET = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const items: (typeof orderItems.$inferSelect)[] = [];
  for (let i = 0; i < rows.length; i += 400) items.push(...await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.slice(i, i + 400).map(r => r.id))));
  return ok(rows.map(r => ({ ...r, items: items.filter(x => x.orderId === r.id) })));
});

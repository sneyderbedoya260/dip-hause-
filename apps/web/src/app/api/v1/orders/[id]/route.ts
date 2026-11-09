import { eq } from 'drizzle-orm';
import { OrderPatch } from '@dip/shared';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { fail, handle, ok } from '@/lib/http';
import { markOrderPaid } from '@/lib/payments';

/** Admin: cambiar el estado del pedido o registrar que se recibió el pago (efectivo/transferencia). */
export const PATCH = (req: Request, { params }: { params: { id: string } }) => handle(async () => {
  await requireRole(req, ['admin']);
  const p = OrderPatch.parse(await req.json());
  if (p.status) await db.update(orders).set({ status: p.status }).where(eq(orders.id, params.id));
  if (p.markPaid) await markOrderPaid(params.id);
  const [o] = await db.select().from(orders).where(eq(orders.id, params.id));
  return o ? ok(o) : fail('Pedido no encontrado', 404);
});

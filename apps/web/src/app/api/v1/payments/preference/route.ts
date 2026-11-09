import { eq } from 'drizzle-orm';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { z } from 'zod';
import { db } from '@/db';
import { appointments, orderItems, orders } from '@/db/schema';
import { fail, handle, ok } from '@/lib/http';

const Body = z.object({ appointmentId: z.string().optional(), orderId: z.string().optional() }).refine(d => !!d.appointmentId !== !!d.orderId, { message: 'Indica appointmentId u orderId' });

/** Crea la preferencia de Checkout Pro para una cita o un pedido. Devuelve { init_point } para abrir en web o app. */
export const POST = (req: Request) => handle(async () => {
  const b = Body.parse(await req.json());
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return fail('Mercado Pago no está configurado (MP_ACCESS_TOKEN)', 503);
  const base = process.env.APP_URL ?? 'http://localhost:3000', https = base.startsWith('https://');
  let ref: string, items: { id: string; title: string; quantity: number; unit_price: number; currency_id: string }[], payer: { name: string; email: string };
  if (b.appointmentId) {
    const [a] = await db.select().from(appointments).where(eq(appointments.id, b.appointmentId));
    if (!a) return fail('Cita no encontrada', 404);
    if (a.paymentStatus === 'pagado') return fail('Esta cita ya está pagada');
    ref = `appt:${a.id}`; payer = { name: a.customerName, email: a.email };
    items = [{ id: a.washId, title: `${a.washName} · ${a.date} ${a.time}`, quantity: 1, unit_price: a.priceCop, currency_id: 'COP' }];
  } else {
    const [o] = await db.select().from(orders).where(eq(orders.id, b.orderId!));
    if (!o) return fail('Pedido no encontrado', 404);
    if (o.paymentStatus === 'pagado') return fail('Este pedido ya está pagado');
    const its = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    ref = `order:${o.id}`; payer = { name: o.customerName, email: o.email };
    items = its.map(i => ({ id: i.productId, title: i.name, quantity: i.qty, unit_price: i.priceCop, currency_id: 'COP' }));
  }
  const pref = await new Preference(new MercadoPagoConfig({ accessToken: token })).create({ body: {
    items, external_reference: ref, payer,
    back_urls: { success: `${base}/pago/exito`, pending: `${base}/pago/pendiente`, failure: `${base}/pago/error` },
    ...(https ? { auto_return: 'approved', notification_url: `${base}/api/v1/payments/webhook` } : {}),
  } });
  if (b.appointmentId) await db.update(appointments).set({ mpPreferenceId: pref.id }).where(eq(appointments.id, b.appointmentId));
  else await db.update(orders).set({ mpPreferenceId: pref.id }).where(eq(orders.id, b.orderId!));
  return ok({ init_point: pref.init_point, preferenceId: pref.id });
});

import { eq } from 'drizzle-orm';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { z } from 'zod';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { fail, handle, ok } from '@/lib/http';

/** Crea la preferencia de Checkout Pro para una cita. Devuelve { init_point } para abrir en web o app. */
export const POST = (req: Request) => handle(async () => {
  const { appointmentId } = z.object({ appointmentId: z.string() }).parse(await req.json());
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return fail('Mercado Pago no está configurado (MP_ACCESS_TOKEN)', 503);
  const [a] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
  if (!a) return fail('Cita no encontrada', 404);
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const https = base.startsWith('https://');
  const pref = await new Preference(new MercadoPagoConfig({ accessToken: token })).create({ body: {
    items: [{ id: a.washId, title: `${a.washName} · ${a.date} ${a.time}`, quantity: 1, unit_price: a.priceCop, currency_id: 'COP' }],
    external_reference: a.id,
    payer: { name: a.customerName, email: a.email },
    back_urls: { success: `${base}/pago/exito`, pending: `${base}/pago/pendiente`, failure: `${base}/pago/error` },
    ...(https ? { auto_return: 'approved', notification_url: `${base}/api/v1/payments/webhook` } : {}),
  } });
  await db.update(appointments).set({ mpPreferenceId: pref.id }).where(eq(appointments.id, a.id));
  return ok({ init_point: pref.init_point, preferenceId: pref.id });
});

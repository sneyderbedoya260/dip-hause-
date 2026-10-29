import { eq } from 'drizzle-orm';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { fail, handle, ok } from '@/lib/http';
import { verifyMpSignature } from '@/lib/mp';

/** Webhook de Mercado Pago. Nunca confiamos en el cuerpo: consultamos el pago directamente a MP. */
export const POST = (req: Request) => handle(async () => {
  const body = await req.json().catch(() => ({}));
  const id = new URL(req.url).searchParams.get('data.id') ?? body?.data?.id;
  if (body?.type !== 'payment' || !id || !process.env.MP_ACCESS_TOKEN) return ok({ ignored: true });
  if (!verifyMpSignature(req, String(id))) return fail('Firma inválida', 401);
  const pay = await new Payment(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })).get({ id });
  if (pay.status === 'approved' && pay.external_reference)
    await db.update(appointments).set({ paymentStatus: 'pagado', mpPaymentId: String(pay.id) }).where(eq(appointments.id, pay.external_reference));
  return ok({ received: true });
});

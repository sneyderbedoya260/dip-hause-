import { MercadoPagoConfig, Payment } from 'mercadopago';
import { fail, handle, ok } from '@/lib/http';
import { verifyMpSignature } from '@/lib/mp';
import { markAppointmentPaid, markOrderPaid } from '@/lib/payments';

/** Webhook de Mercado Pago. Nunca confiamos en el cuerpo: consultamos el pago directamente a MP. */
export const POST = (req: Request) => handle(async () => {
  const body = await req.json().catch(() => ({}));
  const id = new URL(req.url).searchParams.get('data.id') ?? body?.data?.id;
  if (body?.type !== 'payment' || !id || !process.env.MP_ACCESS_TOKEN) return ok({ ignored: true });
  if (!verifyMpSignature(req, String(id))) return fail('Firma inválida', 401);
  const pay = await new Payment(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })).get({ id });
  const ref = pay.external_reference ?? '';
  if (pay.status === 'approved' && ref) {
    if (ref.startsWith('order:')) await markOrderPaid(ref.slice(6), String(pay.id));
    else await markAppointmentPaid(ref.replace(/^appt:/, ''), String(pay.id)); // sin prefijo = citas antiguas
  }
  return ok({ received: true });
});

import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { appointments, orders } from '@/db/schema';

/** Marca una cita como pagada (webhook de Mercado Pago o cobro en efectivo registrado por el admin). Idempotente. */
export const markAppointmentPaid = (id: string, mpPaymentId?: string) =>
  db.update(appointments).set({ paymentStatus: 'pagado', paidAt: new Date(), ...(mpPaymentId ? { mpPaymentId } : {}) }).where(and(eq(appointments.id, id), ne(appointments.paymentStatus, 'pagado')));
export const markOrderPaid = (id: string, mpPaymentId?: string) =>
  db.update(orders).set({ paymentStatus: 'pagado', paidAt: new Date(), ...(mpPaymentId ? { mpPaymentId } : {}) }).where(and(eq(orders.id, id), ne(orders.paymentStatus, 'pagado')));

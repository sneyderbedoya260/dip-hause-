import { and, gte, inArray, lt, lte } from 'drizzle-orm';
import { db } from '@/db';
import { appointments, orderItems, orders } from '@/db/schema';
import { addDaysStr, dayKey, daysBetween, mondayOf, timeKey, zonedStart } from './tz';

export const METHOD_LABEL: Record<string, string> = { mercadopago: 'Mercado Pago (en línea)', cash: 'Efectivo / al finalizar' };
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MAX_DAYS = 800;

export type Group = 'day' | 'week' | 'month';
export type DailyRow = { date: string; income: number; incomeAppts: number; incomeOrders: number; payments: number; appts: number; apptsDone: number; ordersMade: number; ordersValue: number };
export type Bucket = { key: string; label: string; income: number; incomeAppts: number; incomeOrders: number; appts: number; ordersMade: number };
export type PaymentRow = { when: string; kind: 'Cita' | 'Pedido'; code: string; customer: string; concept: string; method: string; amount: number };
export type OrderRow = { createdAt: string; code: string; customer: string; phone: string; delivery: string; address: string; items: string; total: number; status: string; paid: boolean; method: string };
export type ApptRow = { date: string; time: string; code: string; customer: string; phone: string; service: string; address: string; price: number; status: string; paid: boolean; method: string; employee: string };
export type Report = {
  from: string; to: string; days: number; group: Group; generatedAt: string;
  kpis: { income: number; incomeAppts: number; incomeOrders: number; payments: number; avgTicket: number; ordersMade: number; ordersValue: number; ordersDelivered: number; appts: number; apptsDone: number; apptsCancelled: number; receivable: number; refundable: number };
  series: Bucket[]; daily: DailyRow[];
  byMethod: { label: string; income: number; count: number }[]; byService: { name: string; count: number; income: number }[]; byProduct: { name: string; qty: number; income: number }[];
  payments: PaymentRow[]; orders: OrderRow[]; appointments: ApptRow[];
};

export const groupFor = (days: number): Group => (days <= 62 ? 'day' : days <= 183 ? 'week' : 'month');
const bucketKey = (d: string, g: Group) => (g === 'day' ? d : g === 'week' ? mondayOf(d) : d.slice(0, 7));
const bucketLabel = (k: string, g: Group) => (g === 'month' ? `${MONTHS[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}` : `${g === 'week' ? 'sem ' : ''}${k.slice(8, 10)}/${k.slice(5, 7)}`);
const stamp = (d: Date) => `${dayKey(d)} ${timeKey(d)}`;

/**
 * Dinero que entró = pagos RECIBIDOS en el periodo (por fecha de pago, no por fecha del servicio).
 * Los pagos de citas/pedidos cancelados no suman: se muestran aparte como «por reembolsar».
 */
export async function buildReport(from: string, to: string): Promise<Report> {
  const days = daysBetween(from, to) + 1;
  const start = zonedStart(from), end = zonedStart(addDaysStr(to, 1));
  const [paidA, paidO, madeO, appts] = await Promise.all([
    db.select().from(appointments).where(and(eqPaid(appointments.paymentStatus), gte(appointments.paidAt, start), lt(appointments.paidAt, end))),
    db.select().from(orders).where(and(eqPaid(orders.paymentStatus), gte(orders.paidAt, start), lt(orders.paidAt, end))),
    db.select().from(orders).where(and(gte(orders.createdAt, start), lt(orders.createdAt, end))),
    db.select().from(appointments).where(and(gte(appointments.date, from), lte(appointments.date, to))),
  ]);
  const incA = paidA.filter(a => a.status !== 'cancelada'), incO = paidO.filter(o => o.status !== 'cancelado');
  const refundable = paidA.filter(a => a.status === 'cancelada').reduce((s, a) => s + a.priceCop, 0) + paidO.filter(o => o.status === 'cancelado').reduce((s, o) => s + o.totalCop, 0);
  const liveAppts = appts.filter(a => a.status !== 'cancelada'), liveOrders = madeO.filter(o => o.status !== 'cancelado');

  const ids = [...new Set([...incO, ...madeO].map(o => o.id))];
  const items: (typeof orderItems.$inferSelect)[] = [];
  for (let i = 0; i < ids.length; i += 400) items.push(...await db.select().from(orderItems).where(inArray(orderItems.orderId, ids.slice(i, i + 400))));
  const itemsOf = (id: string) => items.filter(x => x.orderId === id);
  const itemsText = (id: string) => itemsOf(id).map(i => `${i.qty} × ${i.name}`).join(', ');

  const daily = new Map<string, DailyRow>();
  for (let i = 0; i < days; i++) { const d = addDaysStr(from, i); daily.set(d, { date: d, income: 0, incomeAppts: 0, incomeOrders: 0, payments: 0, appts: 0, apptsDone: 0, ordersMade: 0, ordersValue: 0 }); }
  const row = (d: string) => daily.get(d);
  for (const a of incA) { const r = row(dayKey(a.paidAt!)); if (r) { r.income += a.priceCop; r.incomeAppts += a.priceCop; r.payments++; } }
  for (const o of incO) { const r = row(dayKey(o.paidAt!)); if (r) { r.income += o.totalCop; r.incomeOrders += o.totalCop; r.payments++; } }
  for (const a of liveAppts) { const r = row(a.date); if (r) { r.appts++; if (a.status === 'completada') r.apptsDone++; } }
  for (const o of liveOrders) { const r = row(dayKey(o.createdAt)); if (r) { r.ordersMade++; r.ordersValue += o.totalCop; } }
  const dailyRows = [...daily.values()];

  const group = groupFor(days), buckets = new Map<string, Bucket>();
  for (const r of dailyRows) {
    const k = bucketKey(r.date, group), b = buckets.get(k) ?? { key: k, label: bucketLabel(k, group), income: 0, incomeAppts: 0, incomeOrders: 0, appts: 0, ordersMade: 0 };
    b.income += r.income; b.incomeAppts += r.incomeAppts; b.incomeOrders += r.incomeOrders; b.appts += r.appts; b.ordersMade += r.ordersMade; buckets.set(k, b);
  }

  const sum = (m: Map<string, { count: number; income: number }>, k: string, v: number) => { const x = m.get(k) ?? { count: 0, income: 0 }; x.count++; x.income += v; m.set(k, x); };
  const methods = new Map<string, { count: number; income: number }>(), services = new Map<string, { count: number; income: number }>(), prods = new Map<string, { qty: number; income: number }>();
  for (const a of incA) { sum(methods, METHOD_LABEL[a.paymentMethod] ?? a.paymentMethod, a.priceCop); sum(services, a.washName, a.priceCop); }
  for (const o of incO) { sum(methods, METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod, o.totalCop); for (const i of itemsOf(o.id)) { const x = prods.get(i.name) ?? { qty: 0, income: 0 }; x.qty += i.qty; x.income += i.qty * i.priceCop; prods.set(i.name, x); } }

  const income = incA.reduce((s, a) => s + a.priceCop, 0) + incO.reduce((s, o) => s + o.totalCop, 0);
  const payments = incA.length + incO.length;
  const payRows: PaymentRow[] = [
    ...incA.map(a => ({ when: stamp(a.paidAt!), kind: 'Cita' as const, code: a.code, customer: a.customerName, concept: a.washName, method: METHOD_LABEL[a.paymentMethod] ?? a.paymentMethod, amount: a.priceCop })),
    ...incO.map(o => ({ when: stamp(o.paidAt!), kind: 'Pedido' as const, code: o.code, customer: o.customerName, concept: itemsText(o.id), method: METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod, amount: o.totalCop })),
  ].sort((a, b) => a.when.localeCompare(b.when));

  return {
    from, to, days, group, generatedAt: stamp(new Date()),
    kpis: {
      income, incomeAppts: dailyRows.reduce((s, r) => s + r.incomeAppts, 0), incomeOrders: dailyRows.reduce((s, r) => s + r.incomeOrders, 0), payments, avgTicket: payments ? Math.round(income / payments) : 0,
      ordersMade: liveOrders.length, ordersValue: liveOrders.reduce((s, o) => s + o.totalCop, 0), ordersDelivered: liveOrders.filter(o => o.status === 'entregado').length,
      appts: liveAppts.length, apptsDone: liveAppts.filter(a => a.status === 'completada').length, apptsCancelled: appts.length - liveAppts.length,
      receivable: liveAppts.filter(a => a.paymentStatus !== 'pagado').reduce((s, a) => s + a.priceCop, 0) + liveOrders.filter(o => o.paymentStatus !== 'pagado').reduce((s, o) => s + o.totalCop, 0), refundable,
    },
    series: [...buckets.values()], daily: dailyRows,
    byMethod: [...methods].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.income - a.income),
    byService: [...services].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.income - a.income),
    byProduct: [...prods].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.income - a.income),
    payments: payRows,
    orders: madeO.map(o => ({ createdAt: stamp(o.createdAt), code: o.code, customer: o.customerName, phone: o.phone, delivery: o.delivery === 'envio' ? 'Envío' : 'Recoger', address: o.address, items: itemsText(o.id), total: o.totalCop, status: o.status, paid: o.paymentStatus === 'pagado', method: METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod })).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    appointments: appts.map(a => ({ date: a.date, time: a.time, code: a.code, customer: a.customerName, phone: a.phone, service: a.washName, address: a.address, price: a.priceCop, status: a.status, paid: a.paymentStatus === 'pagado', method: METHOD_LABEL[a.paymentMethod] ?? a.paymentMethod, employee: a.assignedTo ?? '' })).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
  };
}
import { eq } from 'drizzle-orm';
const eqPaid = (col: Parameters<typeof eq>[0]) => eq(col, 'pagado');

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date());

export const washes = sqliteTable('washes', {
  id: id(), name: text('name').notNull(), description: text('description').notNull().default(''),
  priceCop: integer('price_cop').notNull(), durationMin: integer('duration_min').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true), createdAt: createdAt(),
});
export const products = sqliteTable('products', {
  id: id(), name: text('name').notNull(), description: text('description').notNull().default(''),
  priceCop: integer('price_cop').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true), createdAt: createdAt(),
});
export const washExtras = sqliteTable('wash_extras', {
  id: id(), washId: text('wash_id').notNull(), name: text('name').notNull(), description: text('description').notNull().default(''),
  priceCop: integer('price_cop').notNull(), durationMin: integer('duration_min').notNull().default(0), position: integer('position').notNull().default(0),
});
export const media = sqliteTable('media', {
  id: id(), ownerType: text('owner_type', { enum: ['wash', 'product'] }).notNull(), ownerId: text('owner_id').notNull(),
  kind: text('kind', { enum: ['image', 'video'] }).notNull(), url: text('url').notNull(), position: integer('position').notNull().default(0),
});
export const appointments = sqliteTable('appointments', {
  id: id(), code: text('code').notNull(), washId: text('wash_id').notNull(), washName: text('wash_name').notNull(),
  priceCop: integer('price_cop').notNull(), durationMin: integer('duration_min').notNull(),
  date: text('date').notNull(), time: text('time').notNull(),
  customerName: text('customer_name').notNull(), phone: text('phone').notNull(), email: text('email').notNull(),
  vehicle: text('vehicle').notNull(), plate: text('plate').notNull(),
  extras: text('extras').notNull().default('[]'), // JSON [{name, priceCop, durationMin}] con el precio al momento de reservar
  address: text('address').notNull(), refs: text('refs').notNull().default(''), notes: text('notes').notNull().default(''),
  status: text('status', { enum: ['pendiente', 'confirmada', 'completada', 'cancelada'] }).notNull().default('pendiente'),
  paymentMethod: text('payment_method', { enum: ['mercadopago', 'cash'] }).notNull(),
  paymentStatus: text('payment_status', { enum: ['por_pagar', 'pagado'] }).notNull().default('por_pagar'),
  mpPreferenceId: text('mp_preference_id'), mpPaymentId: text('mp_payment_id'), createdAt: createdAt(),
});
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(), days: text('days').notNull().default('1,2,3,4,5,6'),
  openHour: integer('open_hour').notNull().default(8), closeHour: integer('close_hour').notNull().default(18),
});

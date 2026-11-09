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
  paidAt: integer('paid_at', { mode: 'timestamp' }), privacyAcceptedAt: integer('privacy_accepted_at', { mode: 'timestamp' }),
  evidencePurged: integer('evidence_purged', { mode: 'boolean' }).notNull().default(false), // true = las evidencias se borraron por la política de retención
  extras: text('extras').notNull().default('[]'), // JSON [{name, priceCop, durationMin}] con el precio al momento de reservar
  userId: text('user_id'), assignedTo: text('assigned_to'), // cliente con cuenta y empleado asignado
  address: text('address').notNull(), refs: text('refs').notNull().default(''), notes: text('notes').notNull().default(''),
  status: text('status', { enum: ['pendiente', 'confirmada', 'completada', 'cancelada'] }).notNull().default('pendiente'),
  paymentMethod: text('payment_method', { enum: ['mercadopago', 'cash'] }).notNull(),
  paymentStatus: text('payment_status', { enum: ['por_pagar', 'pagado'] }).notNull().default('por_pagar'),
  mpPreferenceId: text('mp_preference_id'), mpPaymentId: text('mp_payment_id'), createdAt: createdAt(),
});
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(), days: text('days').notNull().default('1,2,3,4,5,6'),
  openHour: integer('open_hour').notNull().default(8), closeHour: integer('close_hour').notNull().default(18),
  evidenceRetentionDays: integer('evidence_retention_days').notNull().default(365), // 0 = no borrar nunca
});

export const users = sqliteTable('users', {
  id: id(), email: text('email').notNull().unique(), name: text('name').notNull(), phone: text('phone').notNull().default(''),
  role: text('role', { enum: ['admin', 'employee', 'customer'] }).notNull(), passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  failedLogins: integer('failed_logins').notNull().default(0), lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  totpSecret: text('totp_secret'), // cifrado (AES-256-GCM); 2FA TOTP del personal
  totpEnabledAt: integer('totp_enabled_at', { mode: 'timestamp' }), totpLastStep: integer('totp_last_step').notNull().default(0), // anti-reutilización de códigos
  recoveryHashes: text('recovery_hashes').notNull().default('[]'), privacyAcceptedAt: integer('privacy_accepted_at', { mode: 'timestamp' }),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }), createdAt: createdAt(),
});
/** Sesiones en el servidor: el cookie solo lleva un token aleatorio; aquí se guarda su hash. Se pueden revocar. */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), audience: text('audience', { enum: ['staff', 'customer'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(), lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(), absoluteExpiresAt: integer('absolute_expires_at', { mode: 'timestamp' }).notNull(),
  ip: text('ip').notNull().default(''), userAgent: text('user_agent').notNull().default(''),
});
export const authTokens = sqliteTable('auth_tokens', {
  id: id(), userId: text('user_id').notNull(), type: text('type', { enum: ['reset', 'verify', 'mfa'] }).notNull(), attempts: integer('attempts').notNull().default(0), tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(), usedAt: integer('used_at', { mode: 'timestamp' }),
});
/** Registro de correos: la clave dedupeKey evita enviar dos veces el mismo recordatorio. */
export const notifications = sqliteTable('notifications', {
  id: id(), dedupeKey: text('dedupe_key').notNull().unique(), kind: text('kind').notNull(), appointmentId: text('appointment_id'), userId: text('user_id'),
  toEmail: text('to_email').notNull(), status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(1), lastError: text('last_error'),
  createdAt: createdAt(), updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()), sentAt: integer('sent_at', { mode: 'timestamp' }),
});

/** Evidencias (fotos/videos) del estado del vehículo que el cliente sube al agendar. Privadas: solo las ve el personal autorizado y el dueño de la cita. */
export const evidence = sqliteTable('evidence', {
  id: id(), appointmentId: text('appointment_id'), // null = subida pero aún sin cita (se borra a las 24 h si no se usa)
  kind: text('kind', { enum: ['image', 'video'] }).notNull(), fileName: text('file_name').notNull(), originalName: text('original_name').notNull().default(''),
  sizeBytes: integer('size_bytes').notNull().default(0), ip: text('ip').notNull().default(''), createdAt: createdAt(),
});

/** Pedidos de productos (carrito). El total se calcula en el servidor con los precios vigentes. */
export const orders = sqliteTable('orders', {
  id: id(), code: text('code').notNull(), userId: text('user_id'),
  customerName: text('customer_name').notNull(), phone: text('phone').notNull(), email: text('email').notNull(),
  delivery: text('delivery', { enum: ['pickup', 'envio'] }).notNull(), address: text('address').notNull().default(''), notes: text('notes').notNull().default(''),
  totalCop: integer('total_cop').notNull(), paymentMethod: text('payment_method', { enum: ['mercadopago', 'cash'] }).notNull(),
  paymentStatus: text('payment_status', { enum: ['por_pagar', 'pagado'] }).notNull().default('por_pagar'), paidAt: integer('paid_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['nuevo', 'listo', 'entregado', 'cancelado'] }).notNull().default('nuevo'),
  mpPreferenceId: text('mp_preference_id'), mpPaymentId: text('mp_payment_id'), privacyAcceptedAt: integer('privacy_accepted_at', { mode: 'timestamp' }), createdAt: createdAt(),
});
export const orderItems = sqliteTable('order_items', {
  id: id(), orderId: text('order_id').notNull(), productId: text('product_id').notNull(), name: text('name').notNull(), priceCop: integer('price_cop').notNull(), qty: integer('qty').notNull(),
});

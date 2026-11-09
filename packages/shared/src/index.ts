import { z } from 'zod';

export const MediaKind = z.enum(['image', 'video']);
export const MediaInput = z.object({ url: z.string().min(1), kind: MediaKind });
export type MediaItem = z.infer<typeof MediaInput>;

export const ExtraInput = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().default(''),
  priceCop: z.number().int().min(0),
  durationMin: z.number().int().min(0).default(0),
});
export const WashInput = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().default(''),
  priceCop: z.number().int().positive(),
  durationMin: z.number().int().min(10),
  media: z.array(MediaInput).default([]),
  extras: z.array(ExtraInput).default([]), // servicios adicionales (polichada, partes negras...)
});
export const ProductInput = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().default(''),
  priceCop: z.number().int().positive(),
  media: z.array(MediaInput).default([]), // 1ª imagen = foto; un video opcional
});

export const AppointmentInput = z.object({
  washId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:00$/),
  customerName: z.string().trim().min(3),
  phone: z.string().trim().min(7),
  email: z.string().email(),
  vehicle: z.string().trim().min(2),
  plate: z.string().trim().min(3),
  address: z.string().trim().min(6),
  refs: z.string().trim().default(''),
  notes: z.string().trim().default(''),
  extraIds: z.array(z.string()).default([]),
  // Obligatorio: fotos y/o videos del estado del vehículo (ids devueltos por POST /api/v1/evidence)
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }) }),
  evidenceIds: z.array(z.string()).min(1, 'Debes adjuntar al menos una foto o video del estado del vehículo').max(10),
  paymentMethod: z.enum(['mercadopago', 'cash']).default('mercadopago'),
});
export const AppointmentStatus = z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']);
export type AppointmentStatusT = z.infer<typeof AppointmentStatus>;

export const formatCop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
export const formatDuration = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;

/* ---------- autenticación ---------- */
export const Role = z.enum(['admin', 'employee', 'customer']);
export type RoleT = z.infer<typeof Role>;
export const PasswordSchema = z.string().min(10, 'Mínimo 10 caracteres').max(128, 'Máximo 128 caracteres');
const Email = z.string().trim().toLowerCase().email('Correo inválido').max(254);
export const LoginInput = z.object({ email: Email, password: z.string().min(1).max(128) });
export const RegisterInput = z.object({ name: z.string().trim().min(2).max(80), email: Email, phone: z.string().trim().min(7).max(20), password: PasswordSchema, acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }) }) });
export const ForgotInput = z.object({ email: Email, audience: z.enum(['staff', 'customer']).default('customer') });
export const ResetInput = z.object({ token: z.string().min(20).max(200), password: PasswordSchema });
export const ChangePasswordInput = z.object({ current: z.string().min(1).max(128), password: PasswordSchema });
export const StaffCreateInput = z.object({ name: z.string().trim().min(2).max(80), email: Email, phone: z.string().trim().max(20).default(''), role: z.enum(['admin', 'employee']) });
export const AppointmentPatch = z.object({ status: AppointmentStatus.optional(), assignedTo: z.string().nullable().optional(), markPaid: z.literal(true).optional() });

/* ---------- pedidos, 2FA, reportes ---------- */
export const PRIVACY_VERSION = '2026-11';
export const OrderStatus = z.enum(['nuevo', 'listo', 'entregado', 'cancelado']);
export const OrderInput = z.object({
  items: z.array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(50) })).min(1).max(30),
  customerName: z.string().trim().min(3).max(80), phone: z.string().trim().min(7).max(20), email: Email,
  delivery: z.enum(['pickup', 'envio']), address: z.string().trim().max(200).default(''), notes: z.string().trim().max(300).default(''),
  paymentMethod: z.enum(['mercadopago', 'cash']).default('mercadopago'),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }) }),
}).refine(d => d.delivery === 'pickup' || d.address.length >= 6, { message: 'Escribe la dirección de entrega', path: ['address'] });
export const OrderPatch = z.object({ status: OrderStatus.optional(), markPaid: z.literal(true).optional() });
export const MfaInput = z.object({ mfaToken: z.string().min(20).max(200), code: z.string().trim().min(6).max(20) });
export const TotpCode = z.object({ code: z.string().trim().min(6).max(20) });
export const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const ReportQuery = z.object({ from: DateStr, to: DateStr, format: z.enum(['xlsx', 'pdf']).optional() }).refine(d => d.from <= d.to, { message: 'La fecha inicial debe ser anterior o igual a la final' });

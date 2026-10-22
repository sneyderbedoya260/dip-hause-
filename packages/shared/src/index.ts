import { z } from 'zod';

export const MediaKind = z.enum(['image', 'video']);
export const MediaInput = z.object({ url: z.string().min(1), kind: MediaKind });
export type MediaItem = z.infer<typeof MediaInput>;

export const WashInput = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().default(''),
  priceCop: z.number().int().positive(),
  durationMin: z.number().int().min(10),
  media: z.array(MediaInput).default([]),
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
  paymentMethod: z.enum(['mercadopago', 'cash']).default('mercadopago'),
});
export const AppointmentStatus = z.enum(['pendiente', 'confirmada', 'completada', 'cancelada']);
export type AppointmentStatusT = z.infer<typeof AppointmentStatus>;

export const formatCop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
export const formatDuration = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;

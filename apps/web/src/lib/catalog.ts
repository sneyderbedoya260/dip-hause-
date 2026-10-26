import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { media, products, washExtras, washes } from '@/db/schema';

async function mediaFor(type: 'wash' | 'product') {
  const rows = await db.select().from(media).where(eq(media.ownerType, type)).orderBy(asc(media.position));
  const map = new Map<string, { url: string; kind: 'image' | 'video' }[]>();
  rows.forEach(m => map.set(m.ownerId, [...(map.get(m.ownerId) ?? []), { url: m.url, kind: m.kind }]));
  return map;
}
export async function listWashes() {
  const [rows, m, ex] = await Promise.all([db.select().from(washes).where(eq(washes.active, true)).orderBy(asc(washes.priceCop)), mediaFor('wash'), db.select().from(washExtras).orderBy(asc(washExtras.position))]);
  return rows.map(w => ({ ...w, media: m.get(w.id) ?? [], extras: ex.filter(x => x.washId === w.id) }));
}
export async function replaceExtras(washId: string, items: { name: string; description: string; priceCop: number; durationMin: number }[]) {
  await db.delete(washExtras).where(eq(washExtras.washId, washId));
  if (items.length) await db.insert(washExtras).values(items.map((x, i) => ({ ...x, washId, position: i })));
}
export async function listProducts() {
  const [rows, m] = await Promise.all([db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.createdAt)), mediaFor('product')]);
  return rows.map(p => ({ ...p, media: m.get(p.id) ?? [] }));
}
export async function replaceMedia(type: 'wash' | 'product', ownerId: string, items: { url: string; kind: 'image' | 'video' }[]) {
  await db.delete(media).where(eq(media.ownerId, ownerId));
  if (items.length) await db.insert(media).values(items.map((m, i) => ({ ownerType: type, ownerId, kind: m.kind, url: m.url, position: i })));
}

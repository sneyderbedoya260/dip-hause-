export const api = async (url: string, method = 'GET', body?: unknown) => {
  const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? 'Ocurrió un error');
  return d;
};
export type Appt = { id: string; code: string; washName: string; date: string; time: string; durationMin: number; status: string; customerName: string; phone: string; email: string; address: string; refs: string; vehicle: string; plate: string; notes: string; priceCop: number; paymentStatus: string; assignedTo: string | null; extras: string };
export type Staff = { id: string; name: string; email: string; role: string; active: boolean };
export type M = { url: string; kind: 'image' | 'video' };
export const dayLabel = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
export const endTime = (t: string, min: number) => { const m = +t.slice(0, 2) * 60 + +t.slice(3, 5) + min; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

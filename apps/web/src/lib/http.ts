import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function handle(fn: () => Promise<NextResponse>) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof ZodError) return fail(e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
    if (e instanceof Response) return e as NextResponse;
    console.error(e); return fail('Error interno', 500);
  }
}

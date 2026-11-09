import { inArray } from 'drizzle-orm';
import { ReportQuery } from '@dip/shared';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole } from '@/lib/auth/guard';
import { fail, handle } from '@/lib/http';
import { buildReport, MAX_DAYS } from '@/lib/reports';
import { daysBetween } from '@/lib/tz';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Admin: descarga el reporte del periodo. ?from&to&format=xlsx|pdf  (Excel: datos; PDF: gráficos y tablas). */
export const GET = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  const q = ReportQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  if (daysBetween(q.from, q.to) + 1 > MAX_DAYS) return fail(`El periodo máximo es de ${MAX_DAYS} días`);
  const r = await buildReport(q.from, q.to);
  const fmt = q.format ?? 'xlsx';
  const name = `reporte-diphouse_${q.from === q.to ? q.from : `${q.from}_a_${q.to}`}.${fmt}`;
  let body: Buffer, type: string;
  if (fmt === 'pdf') { body = await (await import('@/lib/report-pdf')).reportPdf(r); type = 'application/pdf'; }
  else {
    const ids = [...new Set(r.appointments.map(a => a.employee).filter(Boolean))];
    const emp = new Map<string, string>(ids.length ? (await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids))).map(u => [u.id, u.name] as [string, string]) : []);
    body = await (await import('@/lib/report-xlsx')).reportXlsx(r, emp); type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' } });
});

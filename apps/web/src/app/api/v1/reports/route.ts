import { ReportQuery } from '@dip/shared';
import { requireRole } from '@/lib/auth/guard';
import { fail, handle, ok } from '@/lib/http';
import { buildReport, MAX_DAYS } from '@/lib/reports';
import { daysBetween } from '@/lib/tz';

export const dynamic = 'force-dynamic';
/** Admin: reporte de un periodo. ?from=YYYY-MM-DD&to=YYYY-MM-DD  (un solo día: from = to). */
export const GET = (req: Request) => handle(async () => {
  await requireRole(req, ['admin']);
  const q = ReportQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  if (daysBetween(q.from, q.to) + 1 > MAX_DAYS) return fail(`El periodo máximo es de ${MAX_DAYS} días`);
  return ok(await buildReport(q.from, q.to));
});

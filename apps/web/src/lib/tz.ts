const TZ = process.env.BUSINESS_TZ ?? 'America/Bogota';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const parts = (ts: number) => Object.fromEntries(fmt.formatToParts(new Date(ts)).map(x => [x.type, x.value]));
const offsetMs = (ts: number) => { const p = parts(ts); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts; };
/** 'YYYY-MM-DD' de un instante, en la zona horaria del negocio. */
export const dayKey = (d: Date) => { const p = parts(d.getTime()); return `${p.year}-${p.month}-${p.day}`; };
export const timeKey = (d: Date) => { const p = parts(d.getTime()); return `${p.hour}:${p.minute}`; };
/** Instante en que empieza ese día (00:00) en la zona del negocio. */
export const zonedStart = (date: string) => { const [y, m, d] = date.split('-').map(Number); const g = Date.UTC(y, m - 1, d); return new Date(g - offsetMs(g)); };
export const addDaysStr = (date: string, n: number) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
export const mondayOf = (date: string) => { const w = new Date(date + 'T12:00:00Z').getUTCDay(); return addDaysStr(date, -((w + 6) % 7)); };

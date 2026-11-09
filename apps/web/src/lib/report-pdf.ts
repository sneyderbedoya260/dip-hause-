import PDFDocument from 'pdfkit';
import { Report } from './reports';

const YELLOW = '#FFC31F', RED = '#E5262B', INK = '#111111', MUTED = '#666666';
const cop = (n: number) => '$ ' + Math.round(n).toLocaleString('es-CO');
const compact = (n: number) => new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const niceMax = (v: number) => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
const fdate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

type Doc = InstanceType<typeof PDFDocument>;
const room = (d: Doc, need: number) => { if (d.y + need > d.page.height - 60) d.addPage(); };
const title = (d: Doc, t: string) => { room(d, 40); d.moveDown(0.6).font('Helvetica-Bold').fontSize(12).fillColor(INK).text(t); d.moveDown(0.3); };

function barChart(d: Doc, x: number, y: number, w: number, h: number, data: { label: string; value: number }[], color = YELLOW) {
  const top = niceMax(Math.max(0, ...data.map(v => v.value))), left = 46, cw = w - left;
  d.save().lineWidth(0.5).strokeColor('#DDDDDD').fontSize(7).fillColor(MUTED).font('Helvetica');
  for (let i = 0; i <= 4; i++) { const yy = y + h - (h * i) / 4; d.moveTo(x + left, yy).lineTo(x + w, yy).stroke(); d.text('$ ' + compact((top * i) / 4), x, yy - 3, { width: left - 4, align: 'right', lineBreak: false }); }
  const bw = cw / Math.max(1, data.length), gap = Math.min(3, bw * 0.25);
  data.forEach((v, i) => { const bh = (h * v.value) / top; if (bh > 0) d.rect(x + left + i * bw + gap / 2, y + h - bh, Math.max(1, bw - gap), bh).fill(color); });
  const step = Math.max(1, Math.ceil(data.length / Math.floor(cw / 34)));
  d.fillColor(MUTED);
  data.forEach((v, i) => { if (i % step === 0) d.text(v.label, x + left + i * bw + bw / 2 - 20, y + h + 4, { width: 40, align: 'center', lineBreak: false }); });
  d.restore();
}
function hBars(d: Doc, items: { label: string; value: number; extra?: string }[], color: string) {
  const max = Math.max(1, ...items.map(i => i.value)), x = 40, lw = 170, bw = 230;
  for (const it of items) {
    room(d, 18); const y = d.y;
    d.font('Helvetica').fontSize(8).fillColor(INK).text(it.label, x, y + 2, { width: lw - 6, lineBreak: false, ellipsis: true });
    d.rect(x + lw, y + 2, Math.max(1, (bw * it.value) / max), 9).fill(color);
    d.fillColor(INK).text(cop(it.value) + (it.extra ? `  ·  ${it.extra}` : ''), x + lw + bw + 8, y + 2, { width: 120, lineBreak: false });
    d.y = y + 16;
  }
}
function table(d: Doc, cols: { h: string; w: number; right?: boolean }[], rows: string[][]) {
  const x0 = 40, rh = 15;
  const head = () => { room(d, rh * 2); const y = d.y; d.rect(x0, y, cols.reduce((s, c) => s + c.w, 0), rh).fill(INK); let x = x0; d.font('Helvetica-Bold').fontSize(8).fillColor(YELLOW); for (const c of cols) { d.text(c.h, x + 4, y + 4, { width: c.w - 8, align: c.right ? 'right' : 'left', lineBreak: false }); x += c.w; } d.y = y + rh; };
  head();
  rows.forEach((r, i) => {
    if (d.y + rh > d.page.height - 60) { d.addPage(); head(); }
    const y = d.y; if (i % 2) d.rect(x0, y, cols.reduce((s, c) => s + c.w, 0), rh).fill('#F4F4F4');
    let x = x0; d.font('Helvetica').fontSize(8).fillColor(INK);
    cols.forEach((c, j) => { d.text(r[j] ?? '', x + 4, y + 4, { width: c.w - 8, align: c.right ? 'right' : 'left', lineBreak: false, ellipsis: true }); x += c.w; });
    d.y = y + rh;
  });
}

/** PDF con gráficos (dibujados como vectores) y tablas, solo del periodo pedido. */
export function reportPdf(r: Report): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const d = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, info: { Title: `Reporte Dip House ${r.from} a ${r.to}`, Author: 'Dip House' } });
    const bufs: Buffer[] = [];
    d.on('data', b => bufs.push(b)); d.on('end', () => resolve(Buffer.concat(bufs))); d.on('error', reject);
    const W = d.page.width - 80, k = r.kpis;

    d.rect(0, 0, d.page.width, 78).fill(INK);
    d.font('Helvetica-Bold').fontSize(20).fillColor(YELLOW).text('Dip House', 40, 20);
    d.font('Helvetica').fontSize(11).fillColor('#FFFFFF').text('Reporte de ventas y pedidos', 40, 46);
    d.fontSize(10).text(r.from === r.to ? `Día: ${fdate(r.from)}` : `Periodo: ${fdate(r.from)} al ${fdate(r.to)}  (${r.days} días)`, 40, 20, { width: W, align: 'right' });
    d.fontSize(8).fillColor('#BBBBBB').text(`Generado: ${r.generatedAt}`, 40, 46, { width: W, align: 'right' });
    d.y = 94;

    const boxes: [string, string, string?][] = [
      ['Dinero que entró', cop(k.income), `Citas ${cop(k.incomeAppts)} · Pedidos ${cop(k.incomeOrders)}`], ['Pagos recibidos', String(k.payments), `Ticket promedio ${cop(k.avgTicket)}`],
      ['Pedidos hechos', String(k.ordersMade), `Valor ${cop(k.ordersValue)} · entregados ${k.ordersDelivered}`], ['Citas', String(k.appts), `Completadas ${k.apptsDone} · canceladas ${k.apptsCancelled}`],
      ['Por cobrar', cop(k.receivable), 'Citas y pedidos sin pagar'], ['Por reembolsar', cop(k.refundable), 'Pagos de cancelados'],
    ];
    const bw = (W - 16) / 3, y0 = d.y;
    boxes.forEach(([a, b, c], i) => {
      const x = 40 + (i % 3) * (bw + 8), y = y0 + Math.floor(i / 3) * 62;
      d.roundedRect(x, y, bw, 54, 6).fill('#F6F6F6'); d.rect(x, y, 4, 54).fill(i === 5 ? RED : YELLOW);
      d.font('Helvetica').fontSize(8).fillColor(MUTED).text(a, x + 12, y + 7, { width: bw - 16, lineBreak: false });
      d.font('Helvetica-Bold').fontSize(15).fillColor(INK).text(b, x + 12, y + 20, { width: bw - 16, lineBreak: false });
      d.font('Helvetica').fontSize(7).fillColor(MUTED).text(c ?? '', x + 12, y + 41, { width: bw - 16, lineBreak: false, ellipsis: true });
    });
    d.y = y0 + 132;

    title(d, `Dinero que entró por ${r.group === 'day' ? 'día' : r.group === 'week' ? 'semana' : 'mes'}`);
    room(d, 190); const cy = d.y + 4;
    barChart(d, 40, cy, W, 140, r.series.map(s => ({ label: s.label, value: s.income })));
    d.y = cy + 165;

    if (r.byMethod.length) { title(d, 'Por método de pago'); hBars(d, r.byMethod.map(m => ({ label: m.label, value: m.income, extra: `${m.count} pago(s)` })), YELLOW); }
    if (r.byService.length) { title(d, 'Por servicio (citas pagadas)'); hBars(d, r.byService.slice(0, 8).map(s => ({ label: s.name, value: s.income, extra: `${s.count} cita(s)` })), RED); }
    if (r.byProduct.length) { title(d, 'Productos vendidos'); hBars(d, r.byProduct.slice(0, 8).map(p => ({ label: p.name, value: p.income, extra: `${p.qty} u.` })), YELLOW); }

    const active = r.daily.filter(x => x.income || x.appts || x.ordersMade);
    title(d, `Detalle por fecha (${active.length} día(s) con movimiento)`);
    if (active.length) table(d, [{ h: 'Fecha', w: 70 }, { h: 'Dinero que entró', w: 110, right: true }, { h: 'De citas', w: 95, right: true }, { h: 'De pedidos', w: 95, right: true }, { h: 'Citas', w: 50, right: true }, { h: 'Pedidos', w: 55, right: true }],
      active.map(x => [fdate(x.date), cop(x.income), cop(x.incomeAppts), cop(x.incomeOrders), String(x.appts), String(x.ordersMade)]));
    else d.font('Helvetica').fontSize(9).fillColor(MUTED).text('No hubo movimiento en este periodo.');

    const range = d.bufferedPageRange();
    for (let i = 0; i < range.count; i++) { d.switchToPage(i); d.font('Helvetica').fontSize(8).fillColor(MUTED).text(`Dip House · Página ${i + 1} de ${range.count}`, 40, d.page.height - 30, { width: W, align: 'center', lineBreak: false }); }
    d.end();
  });
}

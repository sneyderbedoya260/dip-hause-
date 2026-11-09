import ExcelJS from 'exceljs';
import { METHOD_LABEL, Report } from './reports';

const MONEY = '"$"#,##0';
const BRAND = 'FFFFC31F', DARK = 'FF111111';

/** Excel con SOLO los datos del periodo pedido, en hojas separadas y con formato. */
export async function reportXlsx(r: Report, employees: Map<string, string>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dip House'; wb.created = new Date();
  const sheet = (name: string, cols: { header: string; key: string; width: number; money?: boolean }[], rows: object[], totals?: string[]) => {
    const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = cols.map(c => ({ header: c.header, key: c.key, width: c.width, style: c.money ? { numFmt: MONEY } : {} }));
    ws.addRows(rows);
    const h = ws.getRow(1); h.font = { bold: true, color: { argb: BRAND } }; h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } }; h.alignment = { vertical: 'middle' }; h.height = 22;
    if (totals && rows.length) {
      const t = ws.addRow({}); t.getCell(1).value = 'TOTAL'; t.font = { bold: true };
      cols.forEach((c, i) => { if (totals.includes(c.key)) { const L = ws.getColumn(i + 1).letter; t.getCell(i + 1).value = { formula: `SUM(${L}2:${L}${rows.length + 1})`, result: rows.reduce((s, x) => s + (Number((x as Record<string, unknown>)[c.key]) || 0), 0) }; t.getCell(i + 1).numFmt = c.money ? MONEY : '0'; } });
    }
    return ws;
  };

  const k = r.kpis;
  const res = wb.addWorksheet('Resumen');
  res.columns = [{ width: 38 }, { width: 22 }];
  res.addRow(['Dip House · Reporte']).font = { bold: true, size: 16 };
  res.addRow(['Periodo', r.from === r.to ? r.from : `${r.from} a ${r.to}`]); res.addRow(['Generado', r.generatedAt]); res.addRow([]);
  const kp: [string, number, boolean][] = [
    ['Dinero que entró', k.income, true], ['   · por citas', k.incomeAppts, true], ['   · por pedidos de productos', k.incomeOrders, true], ['Pagos recibidos (cantidad)', k.payments, false], ['Ticket promedio', k.avgTicket, true],
    ['Pedidos hechos (cantidad)', k.ordersMade, false], ['Valor de los pedidos hechos', k.ordersValue, true], ['Pedidos entregados', k.ordersDelivered, false],
    ['Citas (sin canceladas)', k.appts, false], ['Citas completadas', k.apptsDone, false], ['Citas canceladas', k.apptsCancelled, false],
    ['Por cobrar (citas y pedidos sin pagar)', k.receivable, true], ['Pagos de cancelados, por reembolsar', k.refundable, true],
  ];
  for (const [n, v, m] of kp) { const row = res.addRow([n, v]); if (m) row.getCell(2).numFmt = MONEY; }
  res.getRow(5).font = { bold: true };

  sheet('Por fecha', [
    { header: 'Fecha', key: 'date', width: 13 }, { header: 'Dinero que entró', key: 'income', width: 18, money: true }, { header: 'De citas', key: 'incomeAppts', width: 15, money: true }, { header: 'De pedidos', key: 'incomeOrders', width: 15, money: true },
    { header: 'Pagos recibidos', key: 'payments', width: 15 }, { header: 'Citas', key: 'appts', width: 9 }, { header: 'Citas completadas', key: 'apptsDone', width: 18 }, { header: 'Pedidos hechos', key: 'ordersMade', width: 16 }, { header: 'Valor pedidos hechos', key: 'ordersValue', width: 20, money: true },
  ], r.daily, ['income', 'incomeAppts', 'incomeOrders', 'payments', 'appts', 'apptsDone', 'ordersMade', 'ordersValue']);
  sheet('Pagos', [{ header: 'Fecha y hora', key: 'when', width: 18 }, { header: 'Tipo', key: 'kind', width: 10 }, { header: 'Código', key: 'code', width: 12 }, { header: 'Cliente', key: 'customer', width: 26 }, { header: 'Concepto', key: 'concept', width: 40 }, { header: 'Método', key: 'method', width: 24 }, { header: 'Monto', key: 'amount', width: 15, money: true }], r.payments, ['amount']);
  sheet('Pedidos', [{ header: 'Creado', key: 'createdAt', width: 18 }, { header: 'Código', key: 'code', width: 12 }, { header: 'Cliente', key: 'customer', width: 26 }, { header: 'Teléfono', key: 'phone', width: 14 }, { header: 'Entrega', key: 'delivery', width: 10 }, { header: 'Dirección', key: 'address', width: 30 }, { header: 'Productos', key: 'items', width: 44 }, { header: 'Total', key: 'total', width: 15, money: true }, { header: 'Estado', key: 'status', width: 12 }, { header: 'Pagado', key: 'paid', width: 9 }, { header: 'Método', key: 'method', width: 24 }],
    r.orders.map(o => ({ ...o, paid: o.paid ? 'Sí' : 'No' })), ['total']);
  sheet('Citas', [{ header: 'Fecha', key: 'date', width: 12 }, { header: 'Hora', key: 'time', width: 8 }, { header: 'Código', key: 'code', width: 12 }, { header: 'Cliente', key: 'customer', width: 26 }, { header: 'Teléfono', key: 'phone', width: 14 }, { header: 'Servicio', key: 'service', width: 26 }, { header: 'Dirección', key: 'address', width: 34 }, { header: 'Precio', key: 'price', width: 14, money: true }, { header: 'Estado', key: 'status', width: 12 }, { header: 'Pagada', key: 'paid', width: 9 }, { header: 'Método', key: 'method', width: 24 }, { header: 'Empleado', key: 'employee', width: 22 }],
    r.appointments.map(a => ({ ...a, paid: a.paid ? 'Sí' : 'No', employee: employees.get(a.employee) ?? '' })), ['price']);
  sheet('Servicios', [{ header: 'Servicio', key: 'name', width: 34 }, { header: 'Citas pagadas', key: 'count', width: 15 }, { header: 'Dinero', key: 'income', width: 16, money: true }], r.byService, ['count', 'income']);
  sheet('Productos', [{ header: 'Producto', key: 'name', width: 38 }, { header: 'Unidades', key: 'qty', width: 12 }, { header: 'Dinero', key: 'income', width: 16, money: true }], r.byProduct, ['qty', 'income']);
  sheet('Métodos de pago', [{ header: 'Método', key: 'label', width: 30 }, { header: 'Pagos', key: 'count', width: 10 }, { header: 'Dinero', key: 'income', width: 16, money: true }], r.byMethod.length ? r.byMethod : Object.values(METHOD_LABEL).map(label => ({ label, count: 0, income: 0 })), ['count', 'income']);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

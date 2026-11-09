const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const base = () => process.env.APP_URL ?? 'http://localhost:3000';
const phone = () => process.env.BUSINESS_PHONE;
const shell = (title: string, body: string) => `<div style="background:#070707;padding:24px;font-family:system-ui,Arial,sans-serif;color:#f5f5f5"><div style="max-width:520px;margin:auto;background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:24px"><h1 style="margin:0 0 12px;font-size:22px;color:#ffc31f">${esc(title)}</h1>${body}<p style="color:#a3a3a3;font-size:12px;margin-top:24px">Dip House · Lavado premium a domicilio</p></div></div>`;
const btn = (href: string, label: string) => `<p><a href="${esc(href)}" style="display:inline-block;background:#ffc31f;color:#140e00;font-weight:700;padding:12px 22px;border-radius:999px;text-decoration:none">${esc(label)}</a></p>`;

export function resetEmail(name: string, link: string, minutes: number, invite = false) {
  const t = invite ? 'Crea tu contraseña' : 'Restablecer contraseña';
  const intro = invite ? 'Se creó una cuenta para ti en Dip House. Crea tu contraseña para entrar.' : 'Recibimos una solicitud para restablecer tu contraseña.';
  return { subject: `Dip House · ${t}`,
    text: `Hola ${name},\n\n${intro}\nEnlace (válido ${minutes} minutos):\n${link}\n\nSi no fuiste tú, ignora este correo; tu contraseña no cambia.`,
    html: shell(t, `<p>Hola ${esc(name)},</p><p>${intro}</p>${btn(link, t)}<p style="color:#a3a3a3;font-size:13px">El enlace vence en ${minutes} minutos y solo sirve una vez. Si no fuiste tú, ignora este correo.</p>`) };
}
export type Appt = { code: string; washName: string; extras: string; date: string; time: string; address: string; refs: string; customerName: string; phone: string; vehicle: string; plate: string; notes: string };
const extrasOf = (a: Appt) => { try { return (JSON.parse(a.extras) as { name: string }[]).map(x => x.name).join(', '); } catch { return ''; } };
const maps = (a: string) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

export function customerReminder(a: Appt, when: '1d' | '2h') {
  const ex = extrasOf(a);
  const lead = when === '1d' ? `Te recordamos tu cita de mañana, ${fmtDate(a.date)}.` : 'Tu servicio es en aproximadamente 2 horas.';
  const rows: [string, string][] = [['Servicio', a.washName + (ex ? ` + ${ex}` : '')], ['Fecha', fmtDate(a.date)], ['Hora', a.time], ['Dirección', a.address + (a.refs ? ` (${a.refs})` : '')], ['Código', a.code]];
  const tel = phone() ? `\nSi necesitas cambiarla, llámanos al ${phone()}.` : '\nSi necesitas cambiarla, responde este correo.';
  return { subject: when === '1d' ? `Recordatorio: tu lavado es mañana a las ${a.time}` : `Tu lavado llega pronto (${a.time})`,
    text: `Hola ${a.customerName},\n\n${lead}\n\n${rows.map(r => `${r[0]}: ${r[1]}`).join('\n')}\n${tel}`,
    html: shell('Recordatorio de tu servicio', `<p>Hola ${esc(a.customerName)},</p><p>${esc(lead)}</p><table style="width:100%;border-collapse:collapse">${rows.map(r => `<tr><td style="padding:6px 0;color:#a3a3a3">${r[0]}</td><td style="padding:6px 0;text-align:right"><b>${esc(r[1])}</b></td></tr>`).join('')}</table><p style="color:#a3a3a3;font-size:13px">${esc(tel.trim())}</p>`) };
}
export function staffDigest(name: string, date: string, list: Appt[], title = 'Tus servicios de hoy') {
  const sorted = [...list].sort((a, b) => a.time.localeCompare(b.time));
  const text = `Hola ${name},\n\n${title} (${fmtDate(date)}):\n\n` + sorted.map(a => `${a.time}  ${a.washName}${extrasOf(a) ? ' + ' + extrasOf(a) : ''}\n   Cliente: ${a.customerName} · ${a.phone}\n   Vehículo: ${a.vehicle} · ${a.plate}\n   Dirección: ${a.address}${a.refs ? ' (' + a.refs + ')' : ''}${a.notes ? '\n   Notas: ' + a.notes : ''}`).join('\n\n');
  const html = shell(title, `<p>Hola ${esc(name)}, esto es lo de ${esc(fmtDate(date))}:</p>` + sorted.map(a => `<div style="border-top:1px solid #2a2a2a;padding:12px 0"><div style="font-size:20px;color:#ffc31f;font-weight:800">${a.time}</div><div><b>${esc(a.washName)}</b>${extrasOf(a) ? ' + ' + esc(extrasOf(a)) : ''}</div><div style="color:#a3a3a3;font-size:14px">${esc(a.customerName)} · <a href="tel:${esc(a.phone)}" style="color:#ffc31f">${esc(a.phone)}</a><br>${esc(a.vehicle)} · ${esc(a.plate)}<br><a href="${esc(maps(a.address))}" style="color:#ffc31f">${esc(a.address)}</a>${a.refs ? ' (' + esc(a.refs) + ')' : ''}${a.notes ? '<br>Notas: ' + esc(a.notes) : ''}</div></div>`).join(''));
  return { subject: `${title}: ${sorted.length} servicio${sorted.length > 1 ? 's' : ''} el ${fmtDate(date)}`, text, html };
}

export function verifyEmail(name: string, link: string) {
  return { subject: 'Dip House · Confirma tu correo',
    text: `Hola ${name},\n\nConfirma tu correo para proteger tu cuenta y ver tus citas y pedidos:\n${link}\n\nEl enlace vale 24 horas. Si no creaste la cuenta, ignora este correo.`,
    html: shell('Confirma tu correo', `<p>Hola ${esc(name)},</p><p>Confirma tu correo para proteger tu cuenta y ver tus citas y pedidos.</p>${btn(link, 'Confirmar correo')}<p style="color:#a3a3a3;font-size:13px">El enlace vale 24 horas. Si no creaste la cuenta, ignora este correo.</p>`) };
}

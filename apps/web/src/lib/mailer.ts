import nodemailer, { type Transporter } from 'nodemailer';

type Mail = { to: string; subject: string; text: string; html: string };
let tx: Transporter | undefined;

/** Envía por SMTP si SMTP_HOST está definido; si no, escribe el correo en la consola (desarrollo). */
export async function sendMail(m: Mail) {
  if (!process.env.SMTP_HOST) { console.log('[correo:consola]', JSON.stringify({ to: m.to, subject: m.subject, text: m.text })); return; }
  const port = +(process.env.SMTP_PORT ?? 587);
  tx ??= nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
  await tx.sendMail({ from: process.env.MAIL_FROM ?? 'Dip House <no-reply@localhost>', ...m });
}

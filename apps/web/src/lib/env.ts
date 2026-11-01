/** En producción la app se niega a arrancar con una configuración insegura. */
export function assertProdEnv() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!process.env.APP_URL?.startsWith('https://')) throw new Error('Configuración incompleta. Revisa: APP_URL (https://tu-dominio)');
  if (process.env.MP_ACCESS_TOKEN && !process.env.MP_WEBHOOK_SECRET) console.warn('[aviso] MP_WEBHOOK_SECRET no definido: el webhook de Mercado Pago no verificará la firma.');
  if (process.env.NOTIFY_ENABLED === 'true' && !process.env.SMTP_HOST) console.warn('[aviso] NOTIFY_ENABLED=true pero falta SMTP_HOST: los correos solo se escribirán en el log.');
  if (!process.env.SMTP_HOST) console.warn('[aviso] Sin SMTP_HOST: no saldrán correos (recuperar contraseña, recordatorios).');
}

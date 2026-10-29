/** En producción la app se niega a arrancar con una configuración insegura. */
export function assertProdEnv() {
  if (process.env.NODE_ENV !== 'production') return;
  const bad: string[] = [];
  const a = process.env.ADMIN_PASSWORD;
  if (!a || a === 'admin1234' || a.length < 10) bad.push('ADMIN_PASSWORD (mínimo 10 caracteres y distinta a la de ejemplo)');
  const j = process.env.JWT_SECRET;
  if (!j || j.length < 32 || j.startsWith('dev-')) bad.push('JWT_SECRET (mínimo 32 caracteres aleatorios)');
  if (!process.env.APP_URL?.startsWith('https://')) bad.push('APP_URL (https://tu-dominio)');
  if (bad.length) throw new Error('Configuración insegura o incompleta. Revisa: ' + bad.join('; '));
  if (process.env.MP_ACCESS_TOKEN && !process.env.MP_WEBHOOK_SECRET) console.warn('[aviso] MP_WEBHOOK_SECRET no está definido: el webhook de Mercado Pago no verificará la firma.');
}

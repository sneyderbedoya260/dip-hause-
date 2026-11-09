import { legal } from '@/lib/legal';

export const metadata = { title: 'Términos del servicio · Dip House' };
export default function Page() {
  const S = ({ t, children }: { t: string; children: React.ReactNode }) => <section style={{ marginTop: 22 }}><h3>{t}</h3><div style={{ color: 'var(--mut)', marginTop: 6 }}>{children}</div></section>;
  return (
    <main className="wrap" style={{ maxWidth: 760, paddingBottom: 40 }}>
      <h2 className="sec">Términos del servicio</h2>
      <S t="1. Servicio a domicilio"><p>{legal.name} presta lavado y detailing en la dirección que indiques. Debes garantizar acceso al vehículo y un espacio adecuado.</p></S>
      <S t="2. Agendamiento"><p>Tu solicitud queda <b>pendiente</b> hasta que el administrador la confirme. Reservamos el horario mientras tanto. Si no podemos atenderte, te avisamos y devolvemos el pago.</p></S>
      <S t="3. Evidencias del estado del vehículo"><p>Para agendar debes adjuntar fotos y/o videos del estado actual de tu vehículo. Sirven para dejar constancia de daños o rayones previos al servicio.</p></S>
      <S t="4. Pagos"><p>Puedes pagar en línea con Mercado Pago o al finalizar el servicio. Los precios incluyen los servicios adicionales que elijas.</p></S>
      <S t="5. Cambios y cancelaciones"><p>Para cambiar o cancelar tu cita, contáctanos con anticipación al {legal.phone} o {legal.email}.</p></S>
      <S t="6. Productos"><p>Los pedidos de productos se entregan en el local o a domicilio según elijas. Contáctanos ante cualquier inconveniente con tu pedido.</p></S>
    </main>
  );
}

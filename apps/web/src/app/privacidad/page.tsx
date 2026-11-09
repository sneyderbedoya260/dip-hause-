import { PRIVACY_VERSION } from '@dip/shared';
import { legal } from '@/lib/legal';

export const metadata = { title: 'Política de privacidad · Dip House' };
export default function Page() {
  const S = ({ t, children }: { t: string; children: React.ReactNode }) => <section style={{ marginTop: 22 }}><h3>{t}</h3><div style={{ color: 'var(--mut)', marginTop: 6 }}>{children}</div></section>;
  return (
    <main className="wrap" style={{ maxWidth: 760, paddingBottom: 40 }}>
      <h2 className="sec">Política de privacidad y tratamiento de datos personales</h2>
      <p className="note">Versión {PRIVACY_VERSION}. Conforme a la Ley 1581 de 2012 y sus decretos reglamentarios (Habeas Data) de Colombia.</p>
      <S t="1. Responsable del tratamiento"><p>{legal.name} · NIT {legal.nit} · {legal.address} · {legal.email} · {legal.phone}.</p></S>
      <S t="2. Datos que recolectamos"><p>Nombre, teléfono, correo, dirección donde se presta el servicio, datos del vehículo (marca, modelo, placa), datos de tus pedidos y pagos, y las <b>fotos y videos del estado de tu vehículo</b> que subes al agendar. No almacenamos datos de tu tarjeta: el pago lo procesa Mercado Pago.</p></S>
      <S t="3. Para qué los usamos"><p>Agendar y prestar el servicio a domicilio, confirmar tu cita, enviarte recordatorios y avisos del servicio, gestionar pedidos y pagos, dejar constancia del estado del vehículo antes del servicio, atender reclamos y cumplir obligaciones legales y contables.</p></S>
      <S t="4. Evidencias del estado del vehículo"><p>Son privadas: solo las ven el administrador, el empleado asignado a tu servicio y tú. Se conservan durante el tiempo definido por el responsable tras cerrar la cita (por defecto 12 meses) y luego se eliminan.</p></S>
      <S t="5. Tus derechos"><p>Puedes conocer, actualizar y rectificar tus datos, pedir prueba de la autorización, ser informado del uso que se les da, presentar quejas ante la Superintendencia de Industria y Comercio, revocar la autorización y solicitar la supresión de tus datos, escribiendo a {legal.email}. Responderemos en los plazos de ley.</p></S>
      <S t="6. Encargados y terceros"><p>Usamos proveedores que tratan datos por nuestra cuenta: Mercado Pago (pagos), un proveedor de correo electrónico (avisos) y un proveedor de alojamiento (servidores). Pueden estar ubicados fuera de Colombia; exigimos medidas de seguridad adecuadas.</p></S>
      <S t="7. Seguridad"><p>Las contraseñas se guardan cifradas, el sitio usa HTTPS, el acceso del personal exige verificación en dos pasos y las copias de seguridad se protegen. Ningún sistema es infalible; si ocurre un incidente que te afecte, te lo informaremos.</p></S>
      <S t="8. Cambios"><p>Si esta política cambia, publicaremos la nueva versión en esta página.</p></S>
    </main>
  );
}

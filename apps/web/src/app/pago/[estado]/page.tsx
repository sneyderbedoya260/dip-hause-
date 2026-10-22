const MSG: Record<string, [string, string]> = {
  exito: ['¡Pago recibido!', 'Tu cita queda pendiente hasta que el administrador la confirme. Te avisaremos por teléfono o correo.'],
  pendiente: ['Pago pendiente', 'Cuando se acredite el pago, tu solicitud seguirá su curso.'],
  error: ['No se pudo completar el pago', 'Tu horario sigue reservado. Puedes intentar de nuevo o pagar al finalizar el servicio.'],
};
export default function Pago({ params }: { params: { estado: string } }) {
  const [t, d] = MSG[params.estado] ?? MSG.error;
  return <main className="center"><div><h2 className="sec" style={{ margin: 0 }}>{t}</h2><p className="sub" style={{ marginTop: 10 }}>{d}</p><a className="btn" href="/">Volver al inicio</a></div></main>;
}

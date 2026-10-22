import { formatCop, formatDuration } from '@dip/shared';
import Media from '@/components/Media';
import { listProducts, listWashes } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [washes, products] = await Promise.all([listWashes(), listProducts()]);
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <h1>Tu auto merece acabado de vitrina.</h1>
          <p>Lavado premium y detailing a domicilio. Elige el día en el calendario, agenda y paga en línea.</p>
          <a className="btn" href="#lavadas">Agendar lavada</a>
        </div>
        <div className="badge"><img src="/logo.png" alt="Dip House" /></div>
      </section>

      <h2 className="sec" id="lavadas">Nuestras lavadas</h2>
      <p className="sub">Elige tu servicio y reserva el horario. El administrador confirma tu cita.</p>
      <div className="grid">
        {washes.map((w, i) => (
          <article className="card" key={w.id} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="thumb"><Media item={w.media[0]} /></div>
            <div className="card-b">
              <h3>{w.name}</h3>
              <div className="row"><span className="price">{formatCop(w.priceCop)}</span><span className="chip">{formatDuration(w.durationMin)}</span></div>
              <p className="clamp">{w.description}</p>
              <a className="btn" href={`/agendar/${w.id}`}>Agendar</a>
            </div>
          </article>
        ))}
      </div>

      <h2 className="sec" id="productos">Productos</h2>
      <p className="sub">Lo mismo que usamos en el taller, para tu casa.</p>
      <div className="grid">
        {products.map((p, i) => (
          <article className="card" key={p.id} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="thumb"><Media item={p.media.find(m => m.kind === 'image') ?? p.media[0]} /></div>
            <div className="card-b">
              <h3>{p.name}</h3>
              <span className="price">{formatCop(p.priceCop)}</span>
              <p className="clamp">{p.description}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

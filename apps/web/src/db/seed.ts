import { db } from './index';
import { washes, products, settings } from './schema';

async function main() {
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  if ((await db.select().from(washes)).length === 0) {
    await db.insert(washes).values([
      { name: 'Lavado Esencial', priceCop: 35000, durationMin: 40, description: 'Lavado exterior a mano con shampoo pH neutro, rines y llantas, secado con microfibra.' },
      { name: 'Lavado Premium', priceCop: 75000, durationMin: 90, description: 'Esencial + aspirado profundo, tapicería, tablero, vidrios y brillo de llantas.' },
      { name: 'Detailing Dip House', priceCop: 220000, durationMin: 240, description: 'Descontaminación de pintura, encerado con protección, motor, cuero y plásticos.' },
    ]);
    await db.insert(products).values([
      { name: 'Shampoo pH neutro 1 L', priceCop: 28000, description: 'Espuma abundante que respeta la cera. Rinde hasta 40 lavados.' },
      { name: 'Cera líquida de carnauba', priceCop: 65000, description: 'Brillo profundo y protección contra el agua por semanas.' },
      { name: 'Kit de 3 microfibras', priceCop: 32000, description: 'Paños de alta absorción para secado, pulido y cristales.' },
    ]);
  }
  console.log('Seed listo');
}
main();
